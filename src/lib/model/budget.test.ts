import { describe, expect, it } from "vitest";
import { budgetOf, buildIndex, categoryLeft, dueIn, fixedDue, fixedOwed, fixedPlanned, nextDue, perYear, spent } from ".";
import type { FixedCost } from ".";
import { sample, tx } from "./fixtures";

describe("spending", () => {
  const s = sample();
  s.tx = [
    tx({ kind: "expense", acct: "chk", cat: "food", amount: 100, date: "2026-09-30" }),
    tx({ kind: "expense", acct: "chk", cat: "food", amount: 25.5, date: "2026-10-01" }),
    tx({ kind: "expense", acct: "chk", cat: "gifts", amount: 80, date: "2026-03-01" }),
    tx({ kind: "expense", acct: "chk", cat: "gifts", amount: 20, date: "2026-12-24" }),
    tx({ kind: "expense", acct: "chk", cat: "gifts", amount: 999, date: "2025-12-24" }),
  ];
  const ix = buildIndex(s.tx);

  it("counts monthly budgets by month and annual budgets by year", () => {
    expect(spent(s, ix, "food", "2026-10")).toBe(25.5);
    expect(spent(s, ix, "gifts", "2026-10")).toBe(100);
  });
  it("adds budget moves for that month only", () => {
    s.adj = { "2026-10": { food: 50 } };
    const food = s.categories[0];
    expect(budgetOf(s, buildIndex(s.tx), food, "2026-10")).toBe(350);
    expect(budgetOf(s, buildIndex(s.tx), food, "2026-11")).toBe(300);
    expect(categoryLeft(s, buildIndex(s.tx), food, "2026-10")).toBe(324.5);
    s.adj = {};
  });
});

describe("rollover", () => {
  it("carries unspent budget forward month after month, never negative", () => {
    const s = sample();
    const food = { ...s.categories[0], roll: true, rollFrom: "2026-08" };
    s.categories[0] = food;
    s.tx = [
      tx({ kind: "expense", acct: "chk", cat: "food", amount: 250, date: "2026-09-10" }), // 50 left
      tx({ kind: "expense", acct: "chk", cat: "food", amount: 500, date: "2026-10-10" }), // overspent
    ];
    const ix = buildIndex(s.tx);
    expect(budgetOf(s, ix, food, "2026-08")).toBe(300); // rollover starts after rollFrom
    expect(budgetOf(s, ix, food, "2026-09")).toBe(300 + 300); // all of August unspent
    expect(budgetOf(s, ix, food, "2026-10")).toBe(300 + 350);
    expect(budgetOf(s, ix, food, "2026-11")).toBe(300 + 150);
  });
});

describe("fixed-cost schedules", () => {
  const f = (o: Partial<FixedCost>): FixedCost => ({ id: "f", name: "F", amount: 120, ...o });

  it("handles monthly, quarterly, yearly and chosen months", () => {
    expect(dueIn(f({}), "2026-10")).toBe(true);
    const q = f({ freq: "quarterly", begins: "2026-01" });
    expect(["2026-01", "2026-02", "2026-04", "2027-01"].map((m) => dueIn(q, m))).toEqual([true, false, true, true]);
    const y = f({ freq: "yearly", begins: "2026-03" });
    expect([dueIn(y, "2027-03"), dueIn(y, "2027-04")]).toEqual([true, false]);
    const mo = f({ freq: "months", months: [1, 7] });
    expect([dueIn(mo, "2026-07"), dueIn(mo, "2026-08")]).toEqual([true, false]);
    expect(perYear(mo)).toBe(2);
  });
  it("respects start and end months", () => {
    const g = f({ begins: "2026-11", end: "2027-01" });
    expect(["2026-10", "2026-11", "2027-01", "2027-02"].map((m) => dueIn(g, m))).toEqual([false, true, true, false]);
    expect(nextDue(g, "2026-10")).toBe("2026-11");
    expect(nextDue(g, "2027-01")).toBeNull();
  });
  it("spreads non-monthly costs over the year when planning", () => {
    const s = sample();
    expect(fixedPlanned(s, f({ freq: "quarterly" }), "2026-10")).toBe(40);
    expect(fixedPlanned(s, s.fixed[1], "2026-10")).toBe(200); // 10% of planned income
    expect(fixedPlanned(s, f({ end: "2026-09" }), "2026-10")).toBe(0);
  });
  it("bases percentage costs on that month's actual income", () => {
    const s = sample();
    const tithe = s.fixed[1];
    s.tx = [
      tx({ kind: "income", acct: "chk", amount: 1250, date: "2026-10-01" }),
      tx({ kind: "income", acct: "chk", amount: 1250, date: "2026-10-15" }),
      tx({ kind: "fixed", acct: "chk", fixedId: "tithe", amount: 125, date: "2026-10-01" }),
    ];
    const ix = buildIndex(s.tx);
    expect(fixedDue(ix, tithe, "2026-10")).toBe(250);
    expect(fixedOwed(ix, tithe, "2026-10")).toBe(125);
  });
  it("treats a fixed amount as settled once anything is paid", () => {
    const s = sample();
    const rent = s.fixed[0];
    expect(fixedOwed(buildIndex([]), rent, "2026-10")).toBe(800);
    const ix = buildIndex([tx({ kind: "fixed", acct: "chk", fixedId: "rent", amount: 750, date: "2026-10-01" })]);
    expect(fixedOwed(ix, rent, "2026-10")).toBe(0);
  });
});
