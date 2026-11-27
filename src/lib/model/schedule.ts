import { addMonths, mIdx } from "./dates";
import { r2 } from "./money";
import { incomeIn, type TxIndex } from "./budget";
import type { FixedCost, ISODate, LedgerState, MonthKey } from "./types";

export const liveFixed = (s: LedgerState) => s.fixed.filter((f) => !f.archived);

/** How many times a year a fixed cost is due. */
export const perYear = (f: FixedCost) =>
  ({ monthly: 12, quarterly: 4, yearly: 1, months: (f.months || []).length })[f.freq || "monthly"];

/** Is the fixed cost due in month `m`? */
export function dueIn(f: FixedCost, m: MonthKey): boolean {
  if (f.begins && m < f.begins) return false;
  if (f.end && m > f.end) return false;
  const fr = f.freq || "monthly";
  if (fr === "monthly") return true;
  if (fr === "months") return (f.months || []).includes(+m.slice(5, 7));
  const anchor = f.begins || m;
  const step = fr === "quarterly" ? 3 : 12;
  return (((mIdx(m) - mIdx(anchor)) % step) + step) % step === 0;
}

/** The next month after `m` (within two years) when it's due, or null. */
export function nextDue(f: FixedCost, m: MonthKey): MonthKey | null {
  for (let k = 1; k <= 24; k++) {
    const x = addMonths(m, k);
    if (dueIn(f, x)) return x;
  }
  return null;
}

export const hasEnded = (f: FixedCost, thisMonth: MonthKey) => !!(f.end && f.end < thisMonth);

/** Amount due in month `m`. Percentage costs follow that month's income. */
export const fixedDue = (ix: TxIndex, f: FixedCost, m: MonthKey) =>
  !dueIn(f, m) ? 0 : f.pct ? r2((incomeIn(ix, m) * f.pct) / 100) : f.amount || 0;

/** Average monthly cost for planning (yearly costs spread over 12 months). */
export const fixedPlanned = (s: LedgerState, f: FixedCost, thisMonth: MonthKey) =>
  hasEnded(f, thisMonth) ? 0 : f.pct ? (s.plan.income * f.pct) / 100 : r2(((f.amount || 0) * perYear(f)) / 12);

export const fixedPaid = (ix: TxIndex, f: FixedCost, m: MonthKey) => ix.fix[`${m}|${f.id}`] || 0;

/** What's still owed on a fixed cost in month `m`. */
export function fixedOwed(ix: TxIndex, f: FixedCost, m: MonthKey): number {
  if (!dueIn(f, m)) return 0;
  const paid = fixedPaid(ix, f, m);
  return f.pct != null ? r2(fixedDue(ix, f, m) - paid) : paid > 0 ? 0 : f.amount || 0;
}

/*
 * Rounds: fixed costs stay paid until the person starts a new round themselves
 * (nothing resets on the 1st). A round starts on a date; payments and income
 * from that date on count toward it, and what's due is what was due in the
 * month it started.
 */
export const roundPaid = (s: LedgerState, f: FixedCost, start: ISODate) =>
  r2(s.tx.reduce((t, x) => (x.kind === "fixed" && x.fixedId === f.id && x.date >= start ? t + x.amount : t), 0));

export const roundIncome = (s: LedgerState, start: ISODate) =>
  r2(s.tx.reduce((t, x) => (x.kind === "income" && x.date >= start ? t + x.amount : t), 0));

export function roundDue(s: LedgerState, f: FixedCost, start: ISODate): number {
  if (!dueIn(f, start.slice(0, 7))) return 0;
  return f.pct ? r2((roundIncome(s, start) * f.pct) / 100) : f.amount || 0;
}

export function roundOwed(s: LedgerState, f: FixedCost, start: ISODate): number {
  if (!dueIn(f, start.slice(0, 7))) return 0;
  const paid = roundPaid(s, f, start);
  return f.pct != null ? r2(roundDue(s, f, start) - paid) : paid > 0 ? 0 : f.amount || 0;
}
