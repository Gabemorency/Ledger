/**
 * Lines of funding: each monthly category holds a running amount of money.
 * It starts at whatever the category had left on the day this began, goes up
 * when money is put in (a refill, or moving money in from another line) and
 * down when it's spent. Unspent money stays; nothing refills on its own.
 * The category's budget in Settings is its limit: how much should be in it.
 */
import { r2 } from "./money";
import type { Category, ISODate, LedgerState, MonthKey } from "./types";

export interface EnvelopeAdd {
  id: string;
  date: ISODate;
  amount: number;
  /** Where it came from: an account id, or "g:<bucket id>". */
  src: string;
  /** Entries recorded with it (a transfer, or money out of a bucket). */
  tx?: string[];
}
export interface Envelope {
  /** What the line had when it started. */
  start: number;
  /** Month it started; spending and moves from this month on count. */
  from: MonthKey;
  /** Spending and moves in the start month already reflected in `start`. */
  startSpent: number;
  startMoved: number;
  adds: EnvelopeAdd[];
}

/** Spent in a category from month `from` on. */
export function spentSince(s: LedgerState, cid: string, from: MonthKey): number {
  let v = 0;
  for (const t of s.tx) if (t.kind === "expense" && t.cat === cid && t.date.slice(0, 7) >= from) v += t.amount;
  return r2(v);
}

/** Money moved into (+) or out of (-) a category from month `from` on. */
export function movedSince(s: LedgerState, cid: string, from: MonthKey): number {
  let v = 0;
  for (const [m, row] of Object.entries(s.adj || {})) if (m >= from) v += row[cid] || 0;
  return r2(v);
}

/** Start a line with the amount it has now. */
export function openEnvelope(s: LedgerState, cid: string, left: number, month: MonthKey): Envelope {
  return { start: r2(left), from: month, startSpent: spentSince(s, cid, month), startMoved: movedSince(s, cid, month), adds: [] };
}

/** How much is in the line now (negative when overspent). */
export function inLine(s: LedgerState, c: Category, e: Envelope): number {
  const added = e.adds.reduce((t, a) => t + a.amount, 0);
  const moved = movedSince(s, c.id, e.from) - e.startMoved;
  const spentNow = spentSince(s, c.id, e.from) - e.startSpent;
  return r2(e.start + added + moved - spentNow);
}

/** How much it takes to fill the line back up to its limit. */
export const refillNeed = (c: Category, have: number) => r2(Math.max(0, (c.budget || 0) - have));
