import { prevMonth } from "./dates";
import { r2 } from "./money";
import type { Category, LedgerState, MonthKey, Tx } from "./types";

/** Totals by month, rebuilt whenever entries change. */
export interface TxIndex {
  /** "YYYY-MM|categoryId" -> spent */
  catM: Record<string, number>;
  /** "YYYY|categoryId" -> spent */
  catY: Record<string, number>;
  /** "YYYY-MM" -> income */
  inc: Record<string, number>;
  /** "YYYY-MM|fixedId" -> paid */
  fix: Record<string, number>;
  /** cache for rollover amounts */
  carry: Record<string, number>;
}

export function buildIndex(tx: Tx[]): TxIndex {
  const ix: TxIndex = { catM: {}, catY: {}, inc: {}, fix: {}, carry: {} };
  for (const t of tx) {
    const mo = t.date.slice(0, 7);
    const y = t.date.slice(0, 4);
    if (t.kind === "expense") {
      ix.catM[`${mo}|${t.cat}`] = (ix.catM[`${mo}|${t.cat}`] || 0) + t.amount;
      ix.catY[`${y}|${t.cat}`] = (ix.catY[`${y}|${t.cat}`] || 0) + t.amount;
    } else if (t.kind === "income") ix.inc[mo] = (ix.inc[mo] || 0) + t.amount;
    else if (t.kind === "fixed") ix.fix[`${mo}|${t.fixedId}`] = (ix.fix[`${mo}|${t.fixedId}`] || 0) + t.amount;
  }
  return ix;
}

export const findCategory = (s: LedgerState, id: string) => s.categories.find((c) => c.id === id);
export const liveCategories = (s: LedgerState) => s.categories.filter((c) => !c.archived);
export const incomeIn = (ix: TxIndex, m: MonthKey) => ix.inc[m] || 0;
export const adjustmentOf = (s: LedgerState, cid: string, m: MonthKey) => ((s.adj || {})[m] || {})[cid] || 0;

/** Spent in a category: that month for monthly budgets, that year for annual ones. */
export function spent(s: LedgerState, ix: TxIndex, cid: string, m: MonthKey): number {
  const c = findCategory(s, cid);
  return c && c.type === "annual" ? ix.catY[`${m.slice(0, 4)}|${cid}`] || 0 : ix.catM[`${m}|${cid}`] || 0;
}

/** Unspent budget carried in from last month, for rollover categories. */
export function carryOf(s: LedgerState, ix: TxIndex, c: Category, m: MonthKey): number {
  if (!c.roll || !c.rollFrom || c.type !== "monthly" || m <= c.rollFrom) return 0;
  const k = `${c.id}|${m}`;
  if (k in ix.carry) return ix.carry[k];
  const pm = prevMonth(m);
  return (ix.carry[k] = r2(Math.max(0, budgetOf(s, ix, c, pm) - spent(s, ix, c.id, pm))));
}

/** The budget set for a month: today's, unless it was changed after that month. */
export function baseBudget(c: Category, m: MonthKey): number {
  const h = (c.hist || []).filter((x) => m <= x.to).sort((a, b) => a.to.localeCompare(b.to))[0];
  return h ? h.budget : c.budget;
}

/**
 * Change a category's budget from `from` onward, keeping earlier months at the
 * budget they had. Returns the category for chaining.
 */
export function setBudget(c: Category, budget: number, from: MonthKey): Category {
  const last = prevMonth(from);
  if (budget === c.budget) return c;
  const covered = (c.hist || []).some((x) => x.to >= last);
  if (!covered) c.hist = (c.hist || []).concat({ to: last, budget: c.budget });
  c.budget = budget;
  return c;
}

/** This month's budget: base + moves between categories + rollover. Annual budgets are yearly. */
export const budgetOf = (s: LedgerState, ix: TxIndex, c: Category, m: MonthKey) =>
  c.type === "monthly" ? r2(baseBudget(c, m) + adjustmentOf(s, c.id, m) + carryOf(s, ix, c, m)) : c.budget;

export const categoryLeft = (s: LedgerState, ix: TxIndex, c: Category, m: MonthKey) =>
  r2(budgetOf(s, ix, c, m) - spent(s, ix, c.id, m));
