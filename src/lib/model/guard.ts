import { money, r2 } from "./money";
import { effectOn } from "./balances";
import { assigned } from "./goals";
import type { LedgerState, Tx } from "./types";

/**
 * Check entries before adding (`add`) or removing (`rem`) them. A regular
 * account may not drop below $0, or below what its goals have set aside.
 * Returns a message explaining the problem, or null when it's fine.
 */
export function guardTx(s: LedgerState, add: Tx[] = [], rem: Tx[] = []): string | null {
  const d: Record<string, number> = {};
  const acc = (t: Tx, sign: number) =>
    s.accounts.forEach((a) => {
      const e = effectOn(t, a.id);
      if (e) d[a.id] = (d[a.id] || 0) + sign * e;
    });
  add.forEach((t) => acc(t, 1));
  rem.forEach((t) => acc(t, -1));
  for (const a of s.accounts) {
    const dd = r2(d[a.id] || 0);
    if (a.type === "debt" || dd >= -0.004) continue;
    const nb = r2(a.balance + dd);
    const floor = Math.max(0, r2(assigned(s, a.id)));
    if (nb < floor - 0.004) {
      return nb < -0.004
        ? `${a.name} only has ${money(Math.max(0, a.balance), true)}. This would take it below $0.`
        : `That would dip into ${money(floor - nb, true)} set aside for goals in ${a.name}. Move goal money back first (Goals → More → Move money).`;
    }
  }
  return null;
}
