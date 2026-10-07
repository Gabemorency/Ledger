import { describe, expect, it } from "vitest";
import { applyTx, debtPayment, debtProgress, findAccount, interestFor, payoff } from ".";
import { sample, tx } from "./fixtures";

const now = new Date("2026-10-07T12:00");

describe("payoff", () => {
  it("uses standard amortization", () => {
    const s = sample(); // $1000 at 12% APR, $100/month
    const p = payoff(s, findAccount(s, "loan")!, now);
    // n = ceil(-ln(1 - 0.01*1000/100) / ln(1.01)) = ceil(10.59) = 11
    expect(p).toMatchObject({ kind: "date", months: 11, interest: 100 });
    if (p.kind === "date") expect(p.date).toEqual(new Date(2027, 8, 1));
  });
  it("handles zero interest, no payment, too-small payments and paid-off debts", () => {
    const s = sample();
    const loan = findAccount(s, "loan")!;
    expect(payoff(s, { ...loan, apr: 0 }, now)).toMatchObject({ months: 10, interest: 0 });
    expect(payoff(s, { ...loan, min: 0 }, now).kind).toBe("no-payment");
    expect(payoff(s, { ...loan, min: 10 }, now).kind).toBe("interest-only");
    expect(payoff(s, { ...loan, balance: 0 }, now).kind).toBe("paid");
  });
  it("falls back to the fixed cost that pays the debt", () => {
    const s = sample();
    s.fixed.push({ id: "car", name: "Car payment", amount: 250, acct: "chk", to: "loan" });
    expect(debtPayment(s, { ...findAccount(s, "loan")!, min: 0 })).toBe(250);
  });
});

describe("interestFor", () => {
  it("charges one month of interest, once a month, capped at the payment", () => {
    const s = sample();
    expect(interestFor(s, "loan", "2026-10-20", 100)).toBe(10);
    expect(interestFor(s, "loan", "2026-10-20", 4)).toBe(4);
    const i = tx({ kind: "interest", acct: "loan", amount: 10, date: "2026-10-20" });
    s.tx.push(i);
    applyTx(s, i, 1);
    expect(interestFor(s, "loan", "2026-10-28", 100)).toBe(0);
    expect(interestFor(s, "chk", "2026-10-20", 100)).toBe(0);
  });
});

describe("debtProgress", () => {
  it("shows how much of the original loan is paid", () => {
    const s = sample();
    const loan = { ...findAccount(s, "loan")!, start: 4000 };
    expect(debtProgress(s, loan)).toMatchObject({ has: true, paid: 3000, pct: 75 });
    expect(debtProgress(s, findAccount(s, "loan")!).has).toBe(false);
  });
});
