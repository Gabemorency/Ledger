import { describe, expect, it } from "vitest";
import { familyProgress, goalInfo, monthPlan, parentInfo, planCheck, unassigned } from ".";
import type { Goal } from ".";
import { sample, tx } from "./fixtures";

const now = new Date("2026-10-01T12:00");
const goal = (o: Partial<Goal>): Goal => ({
  id: "g",
  name: "Goal",
  target: 1200,
  saved: 0,
  created: "2026-01-01",
  date: "2027-01-01",
  acct: "sav",
  done: false,
  ...o,
});

describe("goalInfo", () => {
  // Three-quarters of the way from Jan 1 to Jan 1 the straight-line target is about $905.
  it("compares savings with where a straight line says you should be", () => {
    const s = sample();
    expect(goalInfo(s, goal({ saved: 900 }), now).status).toBe("on track");
    expect(goalInfo(s, goal({ saved: 1000 }), now).status).toBe("ahead");
    expect(goalInfo(s, goal({ saved: 500 }), now).status).toBe("behind");
    expect(goalInfo(s, goal({ saved: 1200 }), now).status).toBe("funded");
  });
  it("spreads what's left over the months remaining, rounded up", () => {
    const info = goalInfo(sample(), goal({ saved: 600 }), now);
    expect(info.remaining).toBe(600);
    expect(info.perMonth).toBe(Math.ceil(600 / ((new Date("2027-01-01T00:00").getTime() - now.getTime()) / (864e5 * 30.44))));
  });
});

describe("goals with sub-goals", () => {
  const s = sample();
  s.goals = [
    goal({ id: "school", target: 3000, saved: 500, date: "2027-12-01" }),
    goal({ id: "fall", parent: "school", target: 900, saved: 900, date: "2026-09-10", done: true }),
    goal({ id: "spring", parent: "school", target: 1000, saved: 0, date: "2027-01-10" }),
    goal({ id: "summer", parent: "school", target: 1100, saved: 0, date: "2027-05-10" }),
  ];
  s.tx = [tx({ kind: "goalbuy", acct: "sav", goal: "fall", amount: 900, date: "2026-09-10" })];

  it("counts payments made, money set aside and what's left", () => {
    expect(familyProgress(s, s.goals[0])).toMatchObject({ paid: 900, aside: 500, covered: 1400, remaining: 1600, payments: 1 });
  });
  it("finds the next payment the fund can't cover yet", () => {
    const info = parentInfo(s, s.goals[0], now);
    expect(info.cover).toEqual({ spring: 500, summer: 1100 });
    expect(info.nextShort).toMatchObject({ gap: 500 });
    expect(info.nextShort!.k.id).toBe("spring");
    // $500 short with about 3.3 months to January is stricter than the overall pace
    expect(info.perMonth).toBeGreaterThanOrEqual(150);
  });
  it("is routed through goalInfo automatically", () => {
    expect(goalInfo(s, s.goals[0], now)).toHaveProperty("fp");
  });
});

describe("unassigned", () => {
  it("is the balance minus money set aside for active goals", () => {
    const s = sample();
    s.goals = [goal({ saved: 200 }), goal({ id: "old", saved: 100, done: true })];
    expect(unassigned(s, "sav")).toBe(300);
  });
});

describe("monthPlan", () => {
  it("funds fixed costs, then goals in priority order, then guilt-free", () => {
    const s = sample(); // $2000 income, $800 rent + 10% tithe = $1000 fixed
    s.goals = [goal({ id: "a", target: 100000, date: "2027-10-01" }), goal({ id: "b", target: 600, date: "2027-10-01" })];
    const p = monthPlan(s, now);
    expect(p.fixedTotal).toBe(1000);
    expect(p.goals[0].funded).toBe(1000); // first goal takes everything left
    expect(p.goals[1].funded).toBe(0);
    expect(p.guilt).toBe(0);
    expect(p.unplanned).toBe(-350); // $300 food + $600/12 gifts not covered
  });
});

describe("planCheck", () => {
  it("rates each group's share of income against its range", () => {
    const s = sample();
    const rows = planCheck(s, now).rows;
    const fixed = rows.find((r) => r.b.name === "Fixed costs")!;
    expect(fixed.pct).toBe(50);
    expect(fixed.st).toBe("ok");
    expect(rows.find((r) => r.b.name === "Investments")!.st).toBe("below");
  });
  it("calls extra savings 'ahead' but extra spending 'above'", () => {
    const s = sample();
    s.plan.framework = "r503020";
    s.categories[0].budget = 900; // wants: 900 + 50 = 47.5% of income
    s.plan.inc.pretax = 600; // savings & investing: 30%
    const rows = planCheck(s, now).rows;
    expect(rows.find((r) => r.b.name === "Wants")!.st).toBe("above");
    expect(rows.find((r) => r.b.name === "Savings & investing")!.st).toBe("ahead");
  });
});
