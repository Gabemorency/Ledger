import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudSync, loadCloud, readCache } from "./cloud";
import { fakeSupabase } from "./fake-supabase";

const USER = "u1";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});

const state = () => ({
  view: "home",
  setupDone: true,
  plan: { income: 2500 },
  accounts: [{ id: "a1", name: "Checking", type: "checking", balance: 1000 }],
  categories: [{ id: "food", name: "Food", type: "monthly", budget: 300 }],
  fixed: [],
  goals: [],
  tx: [{ id: "t1", date: "2026-10-01", kind: "expense", acct: "a1", cat: "food", amount: 12.5 }],
  snapshots: [],
});

beforeEach(() => {
  store.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("CloudSync", () => {
  it("uploads a new user's data, then only what changes", async () => {
    const fake = fakeSupabase(USER);
    const sync = new CloudSync(fake.client, USER, null, "");
    const s = state();
    sync.schedule(s);
    expect(readCache(USER)?.pending).toBe(true); // on the device before any upload
    await vi.runAllTimersAsync();
    expect(fake.tables.entries.size).toBe(1);
    expect(fake.tables.settings.get(USER)?.data).toEqual({ setupDone: true, plan: { income: 2500 } });
    expect(readCache(USER)?.pending).toBe(false);

    fake.calls.length = 0;
    s.tx.push({ id: "t2", date: "2026-10-02", kind: "expense", acct: "a1", cat: "food", amount: 5 });
    sync.schedule(s);
    await vi.runAllTimersAsync();
    expect(fake.calls).toEqual(["upsert entries", "update settings"]); // settings unchanged: only the change marker

    s.tx.shift();
    sync.schedule(s);
    await vi.runAllTimersAsync();
    expect([...fake.tables.entries.values()].map((r) => r.id)).toEqual(["t2"]);
  });

  it("waits for a pause in edits before uploading", async () => {
    const fake = fakeSupabase(USER);
    const sync = new CloudSync(fake.client, USER, null, "");
    const s = state();
    for (let i = 0; i < 5; i++) {
      s.accounts[0].balance += 1;
      sync.schedule(s);
      await vi.advanceTimersByTimeAsync(200);
    }
    expect(fake.calls).toEqual([]);
    await vi.runAllTimersAsync();
    expect(fake.tables.accounts.get(`${USER}|a1`)?.balance).toBe(1005);
  });

  it("keeps changes pending through failures and retries", async () => {
    const fake = fakeSupabase(USER);
    const statuses: string[] = [];
    const sync = new CloudSync(fake.client, USER, null, "", (st) => statuses.push(st));
    fake.failTimes(2);
    sync.schedule(state());
    await vi.advanceTimersByTimeAsync(700);
    expect(sync.pending).toBe(true);
    expect(readCache(USER)?.pending).toBe(true);
    await vi.runAllTimersAsync();
    expect(sync.pending).toBe(false);
    expect(fake.tables.entries.size).toBe(1);
    expect(statuses.some((st) => st === "error" || st === "offline")).toBe(true);
    expect(statuses.at(-1)).toBe("saved");
  });

  it("does nothing when only device-only state changed", async () => {
    const fake = fakeSupabase(USER);
    const s = state();
    const sync = new CloudSync(fake.client, USER, s, "r0");
    sync.schedule({ ...s, view: "goals" });
    await vi.runAllTimersAsync();
    expect(fake.calls).toEqual([]);
  });
});

describe("loadCloud", () => {
  it("reads back exactly what was saved", async () => {
    const fake = fakeSupabase(USER);
    const sync = new CloudSync(fake.client, USER, null, "");
    sync.schedule(state());
    await vi.runAllTimersAsync();
    const expected: Partial<ReturnType<typeof state>> = state();
    delete expected.view;
    const loaded = await loadCloud(fake.client);
    expect(loaded.state).toEqual(expected);
    expect(loaded.rev).toBe(sync.rev);
  });

  it("returns null for a brand-new user", async () => {
    expect((await loadCloud(fakeSupabase(USER).client)).state).toBeNull();
  });

  it("pages through more than 1000 entries", async () => {
    const fake = fakeSupabase(USER);
    const s = state();
    s.tx = Array.from({ length: 2345 }, (_, i) => ({
      id: `t${String(i).padStart(5, "0")}`,
      date: "2026-10-01",
      kind: "expense",
      acct: "a1",
      cat: "food",
      amount: 1,
    }));
    const sync = new CloudSync(fake.client, USER, null, "");
    sync.schedule(s);
    await vi.runAllTimersAsync();
    expect(((await loadCloud(fake.client)).state!.tx as unknown[]).length).toBe(2345);
  });
});

describe("changedElsewhere", () => {
  it("notices another device's save", async () => {
    const fake = fakeSupabase(USER);
    const a = new CloudSync(fake.client, USER, null, "");
    a.schedule(state());
    await vi.runAllTimersAsync();
    const b = new CloudSync(fake.client, USER, state(), a.rev);
    expect(await b.changedElsewhere()).toBe(false);
    const s = state();
    s.plan.income = 3000;
    a.schedule(s);
    await vi.runAllTimersAsync();
    expect(await b.changedElsewhere()).toBe(true);
  });
});

describe("devices sharing one account", () => {
  async function twoDevices() {
    const fake = fakeSupabase(USER);
    const a = new CloudSync(fake.client, USER, null, "");
    a.schedule(state());
    await vi.runAllTimersAsync();
    const loaded = await loadCloud(fake.client);
    const b = new CloudSync(fake.client, USER, loaded.state, loaded.rev);
    return { fake, a, b, loaded };
  }

  it("doesn't upload defaults the app fills in on load", async () => {
    const { fake, b, loaded } = await twoDevices();
    const filled = { ...loaded.state!, dash: { order: ["networth"] }, adj: {} };
    b.adopt(filled);
    fake.calls.length = 0;
    b.schedule(filled);
    await vi.runAllTimersAsync();
    expect(fake.calls).toEqual([]);
  });

  it("never overwrites settings another device saved when only entries changed here", async () => {
    const { fake, a, b, loaded } = await twoDevices();
    const sa = state();
    sa.plan.income = 3000; // device A changes a setting
    a.schedule(sa);
    await vi.runAllTimersAsync();
    const sb = loaded.state as ReturnType<typeof state>;
    sb.tx.push({ id: "t9", date: "2026-10-03", kind: "expense", acct: "a1", cat: "food", amount: 1 });
    b.schedule(sb); // device B, with the old income, logs an expense
    await vi.runAllTimersAsync();
    expect((fake.tables.settings.get(USER)!.data as { plan: { income: number } }).plan.income).toBe(3000);
    expect(fake.tables.entries.has(`${USER}|t9`)).toBe(true);
    expect(await b.changedElsewhere()).toBe(true); // B knows to reload
  });

  it("writes nothing after sign-out starts", async () => {
    const { fake, b, loaded } = await twoDevices();
    b.stop();
    fake.calls.length = 0;
    b.schedule({ ...loaded.state!, plan: { income: 1 } });
    await b.flush();
    await vi.runAllTimersAsync();
    expect(fake.calls).toEqual([]);
    expect(readCache(USER)?.state).not.toMatchObject({ plan: { income: 1 } });
  });
});

describe("starting from unsent changes", () => {
  it("uploads them even though the app reports its starting state", async () => {
    const fake = fakeSupabase(USER);
    const sync = new CloudSync(fake.client, USER, { ...state(), tx: [] }, "r0");
    sync.markPending();
    const local = state(); // has t1, which the cloud doesn't
    sync.adopt(local);
    sync.schedule(local);
    await vi.runAllTimersAsync();
    expect(fake.tables.entries?.has(`${USER}|t1`)).toBe(true);
  });
});

describe("coming back to the app", () => {
  it("waits for this device's own upload before checking for others' changes", async () => {
    const fake = fakeSupabase(USER);
    const a = new CloudSync(fake.client, USER, null, "");
    a.schedule(state());
    await vi.runAllTimersAsync();
    const loaded = await loadCloud(fake.client);
    const b = new CloudSync(fake.client, USER, loaded.state, loaded.rev);
    const sa = state();
    sa.tx.push({ id: "t2", date: "2026-10-02", kind: "expense", acct: "a1", cat: "food", amount: 2 });
    a.schedule(sa);
    await vi.runAllTimersAsync();
    const sb = loaded.state as ReturnType<typeof state>;
    sb.plan.income = 999;
    b.schedule(sb);
    void b.flush(); // going to the background starts an upload
    expect(await b.changedElsewhere()).toBe(true); // coming back right away
  });
});
