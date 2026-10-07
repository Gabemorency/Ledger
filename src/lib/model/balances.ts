import { r2 } from "./money";
import type { Account, AccountType, Balances, ISODate, LedgerState, MonthKey, Snapshot, Tx } from "./types";

export const findAccount = (s: LedgerState, id: string | undefined) => s.accounts.find((a) => a.id === id);
export const liveAccounts = (s: LedgerState) => s.accounts.filter((a) => !a.archived);

/**
 * How much entry `t` raises (+) or lowers (-) the money in account `aid`.
 * For a debt account a negative effect means the amount owed went up.
 */
export function effectOn(t: Tx, aid: string): number {
  let d = 0;
  if ((t.kind === "expense" || t.kind === "fixed" || t.kind === "goalbuy") && t.acct === aid) d -= t.amount;
  if (t.kind === "fixed" && t.to === aid) d += t.amount;
  if (t.kind === "income" && t.acct === aid) d += t.amount;
  if (t.kind === "transfer") {
    if (t.from === aid) d -= t.amount;
    if (t.to === aid) d += t.amount;
  }
  if (t.kind === "adjust" && t.acct === aid) d += t.dir * t.amount;
  if (t.kind === "interest" && t.acct === aid) d -= t.amount;
  if (t.kind === "gmove" && t.acctFrom !== t.acctTo) {
    if (t.acctFrom === aid) d -= t.amount;
    if (t.acctTo === aid) d += t.amount;
  }
  return d;
}

/** Add money to an account; on a debt account that pays the debt down. */
function move(s: LedgerState, aid: string | undefined, delta: number) {
  const a = findAccount(s, aid);
  if (!a) return;
  a.balance = r2(a.type === "debt" ? a.balance - delta : a.balance + delta);
}

/**
 * Apply (sign = 1) or reverse (sign = -1) an entry's effect on account
 * balances and goal savings. Mutates `s`.
 */
export function applyTx(s: LedgerState, t: Tx, sign: 1 | -1) {
  if (t.kind === "expense" || t.kind === "fixed" || t.kind === "goalbuy") move(s, t.acct, -t.amount * sign);
  if (t.kind === "fixed" && t.to) move(s, t.to, t.amount * sign);
  else if (t.kind === "income") move(s, t.acct, t.amount * sign);
  else if (t.kind === "transfer") {
    move(s, t.from, -t.amount * sign);
    move(s, t.to, t.amount * sign);
  } else if (t.kind === "adjust") move(s, t.acct, t.dir * t.amount * sign);
  else if (t.kind === "interest") move(s, t.acct, -t.amount * sign);
  else if (t.kind === "gmove" && t.acctFrom !== t.acctTo) {
    move(s, t.acctFrom, -t.amount * sign);
    move(s, t.acctTo, t.amount * sign);
  }
  const goal = (id: string | undefined) => s.goals.find((g) => g.id === id);
  if (t.goal && (t.kind === "transfer" || t.kind === "assign")) {
    const g = goal(t.goal);
    if (g) g.saved = r2(g.saved + t.amount * sign);
  }
  if (t.kind === "unassign") {
    const g = goal(t.goal);
    if (g) g.saved = r2(g.saved - t.amount * sign);
  }
  if (t.kind === "gmove") {
    const a = goal(t.gFrom);
    const b = goal(t.gTo);
    if (a) a.saved = r2(a.saved - t.amount * sign);
    if (b) b.saved = r2(b.saved + t.amount * sign);
  }
}

const undo = (a: Account, after: number) => r2(a.type === "debt" ? a.balance + after : a.balance - after);

/** Balance at the end of month `m`, worked back from today's balance. */
export function balanceAtMonthEnd(s: LedgerState, a: Account, m: MonthKey): number {
  if (a.opened && m < a.opened.slice(0, 7)) m = a.opened.slice(0, 7);
  const after = s.tx.filter((t) => t.date.slice(0, 7) > m).reduce((sum, t) => sum + effectOn(t, a.id), 0);
  return undo(a, after);
}

/** Balance at the end of `date`. */
export function balanceAtDay(s: LedgerState, a: Account, date: ISODate): number {
  const after = s.tx.filter((t) => t.date > date).reduce((sum, t) => sum + effectOn(t, a.id), 0);
  return undo(a, after);
}

/** Total of accounts of the given types, from live balances or a snapshot. */
export const sumType = (s: LedgerState, types: AccountType[], bal?: Balances) =>
  s.accounts.filter((a) => types.includes(a.type)).reduce((sum, a) => sum + (bal ? bal[a.id] || 0 : a.balance), 0);

export const otherAssetsNow = (s: LedgerState) =>
  (s.assets || []).filter((x) => !x.archived).reduce((sum, x) => sum + (x.value || 0), 0);

/** Net worth from live balances, or from a month's balances (with its snapshot). */
export function netWorth(s: LedgerState, bal?: Balances, snap?: Snapshot): number {
  const held = sumType(s, ["checking", "cash", "savings", "retirement"], bal);
  const owed = sumType(s, ["debt"], bal);
  const other = bal ? (snap ? snap.oth || 0 : bal.__oth || 0) : otherAssetsNow(s);
  return held - owed + other;
}
