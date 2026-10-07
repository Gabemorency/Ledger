import { describe, expect, it } from "vitest";
import { diff, rowsToState, stable, stateToRows } from "./rows";

const state = () => ({
  view: "home",
  sec: { hash: "x" },
  setupDone: true,
  plan: { income: 2500, inc: { net: 2500 } },
  dash: { order: ["networth"], hidden: [] },
  accounts: [
    { id: "a1", name: "Checking", type: "checking", balance: 1100, pay: true, opened: "2026-04-01" },
    { id: "a6", name: "Car loan", type: "debt", balance: 7200, apr: 6.9, accrue: true },
  ],
  categories: [{ id: "food", name: "Food", type: "monthly", budget: 300, role: "want" }],
  fixed: [
    { id: "f1", name: "Tithe", pct: 10, acct: "a1" },
    { id: "f2", name: "Phone", amount: 65, acct: "a1", day: 2 },
  ],
  goals: [
    { id: "g3", name: "Grad school", target: 12000, saved: 900, date: "2028-05-01", created: "2026-04-01", done: false },
    { id: "g4", name: "Fall payment", parent: "g3", target: 900, saved: 0, date: "2026-09-10", created: "2026-08-15", done: true },
  ],
  tx: [
    { id: "t1", date: "2026-10-01", vendor: "Publix", amount: 96.4, cat: "food", kind: "expense", acct: "a1" },
    { id: "t2", date: "2026-10-02", kind: "transfer", from: "a1", to: "a6", amount: 250, goal: undefined },
  ],
  snapshots: [{ m: "Sep", key: "2026-09", full: "September 2026", bal: { a1: 1000 }, corr: [] }],
  closed: ["2026-09"],
});

describe("stateToRows / rowsToState", () => {
  it("round-trips the app state, minus device-only fields", () => {
    const s = state();
    const { rows, settings } = stateToRows(s);
    const back = rowsToState(
      Object.fromEntries(Object.entries(rows).map(([t, m]) => [t, [...m.values()]])),
      settings,
    );
    const expected: Partial<typeof s> = { ...s };
    delete expected.view;
    delete expected.sec;
    // undefined fields are dropped, as JSON would
    delete (expected.tx![1] as { goal?: string }).goal;
    expect(stable(back)).toBe(stable(expected));
  });

  it("puts core fields in typed columns and the rest in data", () => {
    const { rows } = stateToRows(state());
    expect(rows.goals.get("g4")).toEqual({
      id: "g4",
      position: 1,
      name: "Fall payment",
      target: 900,
      saved: 0,
      due_date: "2026-09-10",
      done: true,
      parent_id: "g3",
      data: { created: "2026-08-15" },
    });
    expect(rows.fixed_costs.get("f1")).toMatchObject({ amount: null, pct: 10 });
    expect(rows.snapshots.get("2026-09")).toMatchObject({ id: "2026-09", data: { m: "Sep", bal: { a1: 1000 } } });
  });

  it("keeps list order through the position column", () => {
    const { rows, settings } = stateToRows(state());
    const shuffled = [...rows.goals.values()].reverse();
    expect((rowsToState({ goals: shuffled }, settings).goals as { id: string }[]).map((g) => g.id)).toEqual(["g3", "g4"]);
  });

  it("drops temporary undo fields that point back at other entries", () => {
    const s = state();
    const t = s.tx[0] as Record<string, unknown>;
    t._grp = [t]; // circular
    const { rows } = stateToRows(s);
    expect(rows.entries.get("t1")!.data).not.toHaveProperty("_grp");
  });

  it("restores numbers that arrive as strings and leaves unset optionals out", () => {
    const back = rowsToState(
      { fixed_costs: [{ id: "f1", position: 0, name: "Tithe", amount: null, pct: "10.000", data: {} }] },
      {},
    );
    expect(back.fixed).toEqual([{ id: "f1", name: "Tithe", pct: 10 }]);
  });
});

describe("diff", () => {
  it("writes everything the first time", () => {
    const d = diff(null, stateToRows(state()));
    expect(d.upserts.entries).toHaveLength(2);
    expect(d.settings).toBe(true);
  });

  it("writes only what changed", () => {
    const s = state();
    const before = stateToRows(s);
    s.tx[0].amount = 100;
    s.tx.push({ id: "t3", date: "2026-10-03", kind: "income", acct: "a1", amount: 1250 } as never);
    s.accounts.pop();
    const d = diff(before, stateToRows(s));
    expect(d.upserts.entries!.map((r) => r.id)).toEqual(["t1", "t3"]);
    expect(d.deletes.accounts).toEqual(["a6"]);
    expect(d.upserts.goals).toBeUndefined();
    expect(d.settings).toBe(false);
    expect(d.count).toBe(3);
  });

  it("ignores key order and device-only changes", () => {
    const s = state();
    const before = stateToRows(s);
    s.view = "goals";
    s.accounts[0] = { opened: "2026-04-01", pay: true, balance: 1100, type: "checking", name: "Checking", id: "a1" };
    expect(diff(before, stateToRows(s)).count).toBe(0);
  });

  it("notices settings changes and reordering", () => {
    const s = state();
    const before = stateToRows(s);
    s.plan.income = 2600;
    s.goals.reverse();
    const d = diff(before, stateToRows(s));
    expect(d.settings).toBe(true);
    expect(d.upserts.goals).toHaveLength(2);
  });
});

describe("saved copy", () => {
  it("does not change when live state is edited afterwards", () => {
    const s = state();
    const before = stateToRows(s);
    s.snapshots[0].bal.a1 = 5;
    s.dash.order.push("plan");
    const d = diff(before, stateToRows(s));
    expect(d.upserts.snapshots).toHaveLength(1);
    expect(d.settings).toBe(true);
  });
});
