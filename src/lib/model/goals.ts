import { monthsTo } from "./dates";
import { r2 } from "./money";
import { findAccount } from "./balances";
import type { Goal, LedgerState } from "./types";

export type GoalStatus = "funded" | "ahead" | "on track" | "behind";

export const activeGoals = (s: LedgerState) => s.goals.filter((g) => !g.done);
export const subGoals = (s: LedgerState, g: Goal) => s.goals.filter((x) => x.parent === g.id);
export const liveSubGoals = (s: LedgerState, g: Goal) => subGoals(s, g).filter((x) => !x.done);
export const isParent = (s: LedgerState, g: Goal) => !g.parent && subGoals(s, g).length > 0;
/** Goals in priority order, without sub-goals. */
export const topGoals = (s: LedgerState) => activeGoals(s).filter((g) => !g.parent);
export const goalFamily = (s: LedgerState, g: Goal) => [g].concat(subGoals(s, g));

/** Money set aside for active goals in an account. */
export const assigned = (s: LedgerState, aid: string) =>
  activeGoals(s)
    .filter((g) => g.acct === aid)
    .reduce((sum, g) => sum + g.saved, 0);

/** Account balance not set aside for any goal. */
export const unassigned = (s: LedgerState, aid: string) =>
  r2((findAccount(s, aid) || { balance: 0 }).balance - assigned(s, aid));

/** Progress of a goal and its sub-goals: already paid out, set aside, still needed. */
export function familyProgress(s: LedgerState, g: Goal) {
  const ids = goalFamily(s, g).map((x) => x.id);
  const paidTx = s.tx.filter((t) => t.kind === "goalbuy" && t.goal != null && ids.includes(t.goal));
  const paid = r2(paidTx.reduce((sum, t) => sum + t.amount, 0));
  const aside = r2((g.done ? 0 : g.saved) + liveSubGoals(s, g).reduce((sum, x) => sum + x.saved, 0));
  const covered = r2(paid + aside);
  const remaining = r2(Math.max(0, g.target - covered));
  return {
    paid,
    aside,
    covered,
    remaining,
    payments: paidTx.length,
    pctPaid: g.target ? Math.min(100, (paid / g.target) * 100) : 0,
    pctCov: g.target ? Math.min(100, (covered / g.target) * 100) : 0,
  };
}

/** Where a straight line from creation to target date says the goal should be today. */
function pace(g: Goal, now: Date) {
  const t0 = new Date(`${g.created}T00:00`).getTime();
  const t1 = new Date(`${g.date}T00:00`).getTime();
  const total = Math.max(1, t1 - t0);
  const elapsed = Math.min(total, Math.max(0, now.getTime() - t0));
  return (g.target * elapsed) / total;
}

function statusOf(g: Goal, have: number, expected: number, fundedAt: number): GoalStatus {
  if (have >= fundedAt) return "funded";
  if (have >= expected + g.target * 0.05) return "ahead";
  if (have < expected - g.target * 0.05) return "behind";
  return "on track";
}

export function goalInfo(s: LedgerState, g: Goal, now: Date) {
  if (isParent(s, g)) return parentInfo(s, g, now);
  const expected = pace(g, now);
  const remaining = Math.max(0, g.target - g.saved);
  const perMonth = Math.ceil(remaining / monthsTo(g.date, now));
  return {
    perMonth,
    status: statusOf(g, g.saved, expected, g.target),
    remaining,
    expected: r2(Math.min(g.target, expected)),
    diff: r2(g.saved - expected),
    cur: g.saved,
  };
}

/**
 * A goal with sub-goals needs money ready before each sub-goal's due date,
 * and the whole total by its own date. Monthly need is the strictest of those.
 */
export function parentInfo(s: LedgerState, g: Goal, now: Date) {
  const fp = familyProgress(s, g);
  let need = Math.ceil(fp.remaining / monthsTo(g.date, now));
  let cum = 0;
  let nextShort: { k: Goal; gap: number } | null = null;
  const cover: Record<string, number> = {};
  const byDate = liveSubGoals(s, g)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const k of byDate) {
    cum += Math.max(0, k.target - k.saved);
    const gap = cum - g.saved;
    cover[k.id] = gap <= 0.004 ? 0 : r2(Math.min(gap, k.target - k.saved));
    if (gap > 0) {
      need = Math.max(need, Math.ceil(gap / monthsTo(k.date, now)));
      if (!nextShort) nextShort = { k, gap: r2(gap) };
    }
  }
  const expected = pace(g, now);
  return {
    perMonth: need,
    status: statusOf(g, fp.covered, expected, g.target - 0.004),
    remaining: fp.remaining,
    fp,
    nextShort,
    cover,
    expected: r2(Math.min(g.target, expected)),
    diff: r2(fp.covered - expected),
    cur: fp.covered,
  };
}
