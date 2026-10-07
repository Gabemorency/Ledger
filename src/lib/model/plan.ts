import { mkey } from "./dates";
import { liveCategories } from "./budget";
import { goalInfo, topGoals } from "./goals";
import { fixedPlanned, liveFixed } from "./schedule";
import type { Bucket, FrameworkId, Goal, LedgerState, Role } from "./types";

export const FRAMEWORKS: Record<FrameworkId, { name: string; desc: string; zero?: boolean; buckets: Bucket[] | null }> = {
  csp: {
    name: "Conscious Spending Plan",
    desc: "Ramit Sethi’s method: fixed costs, investments, savings, then guilt-free spending.",
    buckets: [
      { name: "Fixed costs", roles: ["need"], min: 50, max: 60 },
      { name: "Investments", roles: ["invest"], min: 10, max: 10 },
      { name: "Savings", roles: ["save"], min: 5, max: 10 },
      { name: "Guilt-free spending", roles: ["want"], min: 20, max: 35 },
    ],
  },
  r503020: {
    name: "50/30/20",
    desc: "Half to needs, 30% to wants, 20% to savings and investing.",
    buckets: [
      { name: "Needs", roles: ["need"], min: 50, max: 50 },
      { name: "Wants", roles: ["want"], min: 30, max: 30 },
      { name: "Savings & investing", roles: ["save", "invest"], min: 20, max: 20 },
    ],
  },
  zero: {
    name: "Zero-based",
    desc: "No percentage targets. Every dollar of income gets a job until nothing is unplanned.",
    zero: true,
    buckets: [
      { name: "Needs", roles: ["need"] },
      { name: "Investing", roles: ["invest"] },
      { name: "Savings", roles: ["save"] },
      { name: "Spending", roles: ["want"] },
    ],
  },
  custom: { name: "Custom", desc: "Your own group names and target ranges.", buckets: null },
};

export const ROLES: Role[] = ["need", "invest", "save", "want"];

export function buckets(s: LedgerState, fw?: FrameworkId, custom?: Bucket[]): Bucket[] {
  fw = fw || s.plan.framework;
  return fw === "custom" ? custom || s.plan.custom : FRAMEWORKS[fw].buckets!;
}

export function roleName(s: LedgerState, role: Role, fw?: FrameworkId, custom?: Bucket[]) {
  const b = buckets(s, fw, custom).find((b) => b.roles.includes(role));
  return b ? b.name : role;
}

/** Going over target is fine (even good) for savings and investing groups. */
const aheadOk = (b: Bucket) => b.roles.length > 0 && b.roles.every((r) => r === "save" || r === "invest");

/** Pay yourself first: income -> fixed costs -> goals in priority order -> guilt-free. */
export function monthPlan(s: LedgerState, now: Date) {
  const thisMonth = mkey(now);
  const income = s.plan.income;
  const fixedTotal = liveFixed(s).reduce((sum, f) => sum + fixedPlanned(s, f, thisMonth), 0);
  let avail = income - fixedTotal;
  const goals: { g: Goal; need: number; funded: number }[] = topGoals(s).map((g) => {
    const need = goalInfo(s, g, now).perMonth;
    const funded = Math.max(0, Math.min(need, avail));
    avail -= funded;
    return { g, need, funded };
  });
  const goalTotal = goals.reduce((sum, x) => sum + x.funded, 0);
  const guilt = avail;
  const budgets = liveCategories(s).reduce((sum, c) => sum + (c.type === "monthly" ? c.budget : c.budget / 12), 0);
  return { income, fixedTotal, goals, goalTotal, guilt, budgets, unplanned: guilt - budgets };
}

export type PlanStatus = "" | "below" | "ok" | "above" | "ahead";

/** Each plan group's share of income compared with its target range. */
export function planCheck(s: LedgerState, now: Date) {
  const thisMonth = mkey(now);
  const inc = s.plan.income || 1;
  const P = monthPlan(s, now);
  const amt: Record<Role, number> = { need: 0, invest: 0, save: 0, want: 0 };
  type Item = { n: string; v: number; note: string };
  const items: Record<Role, Item[]> = { need: [], invest: [], save: [], want: [] };
  const add = (r: Role, n: string, v: number, note: string) => {
    amt[r] += v;
    if (v > 0.004) items[r].push({ n, v, note });
  };
  liveFixed(s).forEach((f) =>
    add(f.role || "need", f.name, fixedPlanned(s, f, thisMonth), f.freq && f.freq !== "monthly" ? "spread monthly" : ""),
  );
  liveCategories(s).forEach((c) =>
    add(c.role || "want", c.name, c.type === "monthly" ? c.budget : c.budget / 12, c.type === "annual" ? "1/12 of yearly" : ""),
  );
  P.goals.forEach((x) => add("save", x.g.name, x.funded, "goal"));
  add("invest", "Pre-tax retirement", (s.plan.inc && s.plan.inc.pretax) || 0, "from paycheck");
  return {
    P,
    rows: buckets(s).map((b, i) => {
      const v = b.roles.reduce((sum, r) => sum + amt[r], 0);
      const pct = (v / inc) * 100;
      const its = b.roles.reduce<Item[]>((a, r) => a.concat(items[r]), []).sort((x, y) => y.v - x.v);
      let st: PlanStatus = "";
      let lo: number | null = null;
      let hi: number | null = null;
      if (b.min != null) {
        lo = b.min === b.max ? b.min - 3 : b.min;
        hi = b.min === b.max ? b.max + 3 : b.max!;
        st = pct < lo ? "below" : pct > hi ? (aheadOk(b) ? "ahead" : "above") : "ok";
      }
      return { b, i, v, pct, st, lo, hi, its };
    }),
  };
}
