import { r2 } from "./money";
import { balanceAtMonthEnd, findAccount } from "./balances";
import { liveFixed } from "./schedule";
import type { Account, ISODate, LedgerState } from "./types";

/** Monthly payment: the set minimum, else the fixed cost that pays this debt. */
export const debtPayment = (s: LedgerState, a: Account) =>
  a.min || (liveFixed(s).find((f) => f.to === a.id && f.pct == null) || { amount: 0 }).amount || 0;

/** How much of the original loan is paid off, plus interest charged so far. */
export function debtProgress(s: LedgerState, a: Account) {
  const interest = r2(s.tx.filter((t) => t.kind === "interest" && t.acct === a.id).reduce((sum, t) => sum + t.amount, 0));
  if (!(a.start! > 0)) return { has: false as const, interest };
  const paid = r2(Math.max(0, a.start! - a.balance));
  return { has: true as const, paid, left: a.balance, pct: Math.min(100, (paid / a.start!) * 100), interest };
}

/**
 * Interest due when a payment lands on an interest-charging loan: one month
 * of interest on the month-end balance, once per month, capped at the payment.
 */
export function interestFor(s: LedgerState, debtId: string, date: ISODate, payAmt: number): number {
  const a = findAccount(s, debtId);
  if (!a || a.type !== "debt" || !a.accrue || !(a.apr! > 0)) return 0;
  if (s.tx.some((t) => t.kind === "interest" && t.acct === debtId && t.date.slice(0, 7) === date.slice(0, 7))) return 0;
  return r2(Math.min((balanceAtMonthEnd(s, a, date.slice(0, 7)) * a.apr!) / 1200, payAmt));
}

export type Payoff =
  | { kind: "paid" }
  | { kind: "no-payment" }
  | { kind: "interest-only" }
  | { kind: "date"; months: number; interest: number; date: Date };

/** When the debt is paid off at its current monthly payment (standard amortization). */
export function payoff(s: LedgerState, a: Account, now: Date): Payoff {
  const r = (a.apr || 0) / 1200;
  const B = a.balance;
  const P = debtPayment(s, a);
  if (B <= 0) return { kind: "paid" };
  if (!P) return { kind: "no-payment" };
  if (r > 0 && P <= r * B) return { kind: "interest-only" };
  const months = r > 0 ? Math.ceil(-Math.log(1 - (r * B) / P) / Math.log(1 + r)) : Math.ceil(B / P);
  return {
    kind: "date",
    months,
    interest: Math.max(0, months * P - B),
    date: new Date(now.getFullYear(), now.getMonth() + months, 1),
  };
}
