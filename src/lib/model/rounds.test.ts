import { describe, expect, it } from "vitest";
import { roundDue, roundOwed } from ".";
import { sample, tx } from "./fixtures";

describe("rounds of fixed costs (nothing resets on the 1st)", () => {
  it("a cost paid in the round stays paid after the month changes, until a new round starts", () => {
    const s = sample();
    const rent = s.fixed.find((f) => !f.pct)!;
    s.tx = [tx({ kind: "fixed", acct: rent.acct!, fixedId: rent.id, amount: rent.amount!, date: "2026-11-03" })];
    expect(roundOwed(s, rent, "2026-11-01")).toBe(0); // still paid on Dec 2: the round began Nov 1
    expect(roundOwed(s, rent, "2026-12-05")).toBe(rent.amount); // a new round started Dec 5
  });
  it("a payment made after the 1st still counts toward the round it belongs to", () => {
    const s = sample();
    const rent = s.fixed.find((f) => !f.pct)!;
    s.tx = [tx({ kind: "fixed", acct: rent.acct!, fixedId: rent.id, amount: rent.amount!, date: "2026-12-02" })];
    expect(roundOwed(s, rent, "2026-11-01")).toBe(0);
  });
  it("percent-of-income costs follow the income logged since the round began", () => {
    const s = sample();
    const tithe = s.fixed.find((f) => f.pct)!;
    s.tx = [
      tx({ kind: "income", acct: "chk", amount: 1000, date: "2026-11-01" }),
      tx({ kind: "income", acct: "chk", amount: 1000, date: "2026-12-01" }),
    ];
    expect(roundDue(s, tithe, "2026-11-01")).toBe(2000 * (tithe.pct! / 100));
  });
});
