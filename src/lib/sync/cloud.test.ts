import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudSync, loadCloud, readCache, startState } from "./cloud";
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

  it("still notices when this device has a save queued (going to the background saves the lock time)", async () => {
    const fake = fakeSupabase(USER);
    const a = new CloudSync(fake.client, USER, null, "");
    a.schedule(state());
    await vi.runAllTimersAsync();
    const b = new CloudSync(fake.client, USER, state(), a.rev);
    const s = state();
    s.plan.income = 3000;
    a.schedule(s);
    await vi.runAllTimersAsync();
    b.schedule({ ...state(), sec: { awayAt: 1 } }); // device-only change, still waiting to go out
    expect(await b.changedElsewhere()).toBe(true);
    expect(b.pending).toBe(false);
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

  it("keeps another device's setting changes when this device saves a different setting", async () => {
    const { fake, a, b, loaded } = await twoDevices();
    const sa = state() as Record<string, unknown>;
    (sa.plan as { income: number }).income = 3000; // desktop changes the plan
    sa.env = { food: { start: 120 } }; // ...and a line's amount
    a.schedule(sa);
    await vi.runAllTimersAsync();
    const sb = { ...(loaded.state as Record<string, unknown>), notes: [{ id: "n1", title: "hi" }] }; // phone, still on the old copy, adds a note
    b.schedule(sb);
    await vi.runAllTimersAsync();
    const saved = fake.tables.settings.get(USER)!.data as Record<string, unknown>;
    expect((saved.plan as { income: number }).income).toBe(3000);
    expect(saved.env).toEqual({ food: { start: 120 } });
    expect(saved.notes).toEqual([{ id: "n1", title: "hi" }]);
    expect(await b.changedElsewhere()).toBe(true); // and the phone knows to reload
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

describe("a phone opening with an old copy (the desktop edited since)", () => {
  async function setup() {
    const fake = fakeSupabase(USER);
    const desktop = new CloudSync(fake.client, USER, null, "");
    desktop.schedule(state());
    await vi.runAllTimersAsync();
    const first = await loadCloud(fake.client);
    const phone = new CloudSync(fake.client, USER, first.state, first.rev);
    return { fake, desktop, phone, first };
  }

  it("a redraw that changed nothing doesn't leave the phone marked as having unsent work", async () => {
    const { phone, first } = await setup();
    phone.schedule({ ...first.state! }); // the app saves on every redraw
    expect(readCache(USER)!.pending).toBe(false); // even if the phone is frozen before the upload timer runs
  });

  it("opens with the desktop's changes, keeping only the phone's own unsent edits", async () => {
    const { fake, desktop, phone, first } = await setup();
    // the phone makes a real edit but is frozen before it uploads
    const mine = { ...(first.state as Record<string, unknown>), notes: [{ id: "n1", title: "from phone" }] };
    phone.schedule(mine);
    const cached = readCache(USER);
    expect(cached!.pending).toBe(true);
    // meanwhile the desktop changes the plan and logs a purchase
    const d = state() as ReturnType<typeof state>;
    d.plan.income = 3000;
    d.tx.push({ id: "t2", date: "2026-10-05", kind: "expense", acct: "a1", cat: "food", amount: 9 });
    desktop.schedule(d);
    await vi.runAllTimersAsync();
    // the phone opens again
    const remote = await loadCloud(fake.client);
    const start = startState(cached, remote);
    const s = start.state as ReturnType<typeof state> & { notes: unknown };
    expect(s.plan.income).toBe(3000); // desktop's change shows
    expect(s.tx.map((t) => t.id)).toEqual(["t1", "t2"]); // desktop's purchase shows
    expect(s.notes).toEqual([{ id: "n1", title: "from phone" }]); // phone's own edit kept
    expect(start.pending).toBe(true);
    // and uploading it doesn't undo the desktop's work
    const phone2 = new CloudSync(fake.client, USER, remote.state, remote.rev);
    phone2.markPending();
    phone2.schedule(start.state!);
    await vi.runAllTimersAsync();
    const after = await loadCloud(fake.client);
    expect((after.state as ReturnType<typeof state>).plan.income).toBe(3000);
    expect((after.state as ReturnType<typeof state>).tx).toHaveLength(2);
    expect((after.state as Record<string, unknown>).notes).toEqual([{ id: "n1", title: "from phone" }]);
  });

  it("an old copy with no record of its edits gives way to the cloud, keeping only entries added on this device", () => {
    const cloud = state() as ReturnType<typeof state>;
    cloud.plan.income = 2;
    const old = state() as ReturnType<typeof state>;
    old.plan.income = 1;
    old.tx.push({ id: "t7", date: "2026-10-09", kind: "expense", acct: "a1", cat: "food", amount: 4 }); // logged offline
    const start = startState({ state: old, pending: true, rev: "old" }, { state: cloud, rev: "new" });
    const s = start.state as ReturnType<typeof state>;
    expect(s.plan.income).toBe(2);
    expect(s.tx.map((t) => t.id)).toEqual(["t1", "t7"]);
    expect(start.pending).toBe(true);
    expect(startState({ state: state(), pending: true, rev: "old" }, { state: state(), rev: "new" }).pending).toBe(false);
  });
  it("an account with nothing in the cloud yet takes this device's copy", () => {
    const start = startState({ state: state(), pending: true, rev: "" }, { state: { plan: {} }, rev: "r1" });
    expect((start.state as ReturnType<typeof state>).tx).toHaveLength(1);
    expect(start.pending).toBe(true);
  });
});
