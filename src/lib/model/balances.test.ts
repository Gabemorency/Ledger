import { describe, expect, it } from "vitest";
import { applyTx, balanceAtDay, balanceAtMonthEnd, effectOn, findAccount, guardTx, netWorth } from ".";
import { sample, tx } from "./fixtures";

const bal = (s: ReturnType<typeof sample>, id: string) => findAccount(s, id)!.balance;

describe("effectOn", () => {
  it("covers every kind of entry", () => {
    expect(effectOn(tx({ kind: "expense", acct: "chk", cat: "food", amount: 20, date: "2026-10-01" }), "chk")).toBe(-20);
    expect(effectOn(tx({ kind: "income", acct: "chk", amount: 50, date: "2026-10-01" }), "chk")).toBe(50);
    const tr = tx({ kind: "transfer", from: "chk", to: "sav", amount: 30, date: "2026-10-01" });
    expect([effectOn(tr, "chk"), effectOn(tr, "sav"), effectOn(tr, "loan")]).toEqual([-30, 30, 0]);
    const pay = tx({ kind: "fixed", acct: "chk", to: "loan", fixedId: "x", amount: 100, date: "2026-10-01" });
    expect([effectOn(pay, "chk"), effectOn(pay, "loan")]).toEqual([-100, 100]);
    expect(effectOn(tx({ kind: "adjust", acct: "sav", dir: -1, amount: 5, date: "2026-10-01" }), "sav")).toBe(-5);
    const same = tx({ kind: "gmove", gFrom: "a", gTo: "b", acctFrom: "sav", acctTo: "sav", amount: 9, date: "2026-10-01" });
    expect(effectOn(same, "sav")).toBe(0);
  });
});

describe("applyTx", () => {
  it("moves money and undoes cleanly", () => {
    const s = sample();
    const entries = [
      tx({ kind: "expense", acct: "chk", cat: "food", amount: 12.34, date: "2026-10-02" }),
      tx({ kind: "transfer", from: "chk", to: "sav", amount: 100, date: "2026-10-03" }),
      tx({ kind: "fixed", acct: "chk", to: "loan", fixedId: "car", amount: 100, date: "2026-10-04" }),
    ];
    entries.forEach((t) => applyTx(s, t, 1));
    expect(bal(s, "chk")).toBe(787.66);
    expect(bal(s, "sav")).toBe(600);
    expect(bal(s, "loan")).toBe(900); // a payment lowers what's owed
    entries.reverse().forEach((t) => applyTx(s, t, -1));
    expect([bal(s, "chk"), bal(s, "sav"), bal(s, "loan")]).toEqual([1000, 500, 1000]);
  });

  it("tracks goal savings on transfers and goal moves", () => {
    const s = sample();
    s.goals = [
      { id: "trip", name: "Trip", target: 1000, saved: 0, date: "2027-06-01", created: "2026-06-01", acct: "sav", done: false },
      { id: "tv", name: "TV", target: 500, saved: 0, date: "2027-06-01", created: "2026-06-01", acct: "sav", done: false },
    ];
    applyTx(s, tx({ kind: "transfer", from: "chk", to: "sav", goal: "trip", amount: 200, date: "2026-10-01" }), 1);
    applyTx(s, tx({ kind: "gmove", gFrom: "trip", gTo: "tv", acctFrom: "sav", acctTo: "sav", amount: 50, date: "2026-10-02" }), 1);
    expect(s.goals.map((g) => g.saved)).toEqual([150, 50]);
    expect(bal(s, "sav")).toBe(700);
  });
});

describe("history", () => {
  it("works balances back from today", () => {
    const s = sample();
    s.tx = [
      tx({ kind: "income", acct: "chk", amount: 300, date: "2026-09-15" }),
      tx({ kind: "expense", acct: "chk", cat: "food", amount: 40, date: "2026-10-05" }),
    ];
    s.tx.forEach((t) => applyTx(s, t, 1)); // today: 1260
    const chk = findAccount(s, "chk")!;
    expect(chk.balance).toBe(1260);
    expect(balanceAtMonthEnd(s, chk, "2026-09")).toBe(1300);
    expect(balanceAtMonthEnd(s, chk, "2026-08")).toBe(1000);
    expect(balanceAtDay(s, chk, "2026-10-04")).toBe(1300);
  });

  it("does not go back before an account was opened", () => {
    const s = sample();
    const chk = findAccount(s, "chk")!;
    chk.opened = "2026-09-10";
    s.tx = [tx({ kind: "income", acct: "chk", amount: 300, date: "2026-09-15" })];
    expect(balanceAtMonthEnd(s, chk, "2026-01")).toBe(balanceAtMonthEnd(s, chk, "2026-09"));
  });
});

describe("netWorth", () => {
  it("adds what you have and other assets, minus debts", () => {
    const s = sample();
    expect(netWorth(s)).toBe(1000 + 500 - 1000 + 5000);
    expect(netWorth(s, { chk: 10, sav: 20, loan: 5, __oth: 100 })).toBe(125);
  });
});

describe("guardTx", () => {
  const spend = (amount: number) => tx({ kind: "expense", acct: "chk", cat: "food", amount, date: "2026-10-05" });

  it("allows spending down to $0", () => {
    expect(guardTx(sample(), [spend(1000)])).toBeNull();
  });
  it("blocks going below $0", () => {
    expect(guardTx(sample(), [spend(1000.01)])).toBe("Checking only has $1,000.00. This would take it below $0.");
  });
  it("protects money set aside for goals", () => {
    const s = sample();
    s.goals = [{ id: "g", name: "Trip", target: 900, saved: 400, date: "2027-01-01", created: "2026-01-01", acct: "chk", done: false }];
    expect(guardTx(s, [spend(700)])).toMatch(/dip into \$100\.00 set aside for goals in Checking/);
  });
  it("never blocks debts, or entries that add money", () => {
    const s = sample();
    expect(guardTx(s, [tx({ kind: "interest", acct: "loan", amount: 5000, date: "2026-10-01" })])).toBeNull();
    expect(guardTx(s, [], [spend(5000)])).toBeNull();
  });
});
