import type { LedgerState, Tx } from "./types";

type NewTx = Tx extends infer T ? (T extends Tx ? Omit<T, "id"> : never) : never;

let n = 0;
/** Build an entry with a generated id. */
export const tx = (t: NewTx): Tx => ({ id: `t${++n}`, ...t }) as Tx;

/** A small, hand-checkable budget. */
export function sample(): LedgerState {
  return {
    plan: {
      income: 2000,
      deposit: "chk",
      payDefault: "chk",
      framework: "csp",
      inc: { grossAnnual: 30000, pretax: 0, net: 2000, extra: 0 },
      custom: [],
    },
    categories: [
      { id: "food", name: "Food", type: "monthly", budget: 300, role: "want" },
      { id: "gifts", name: "Gifts", type: "annual", budget: 600, role: "want" },
    ],
    fixed: [
      { id: "rent", name: "Rent", amount: 800, acct: "chk", role: "need" },
      { id: "tithe", name: "Tithe", pct: 10, acct: "chk", role: "need" },
    ],
    accounts: [
      { id: "chk", name: "Checking", type: "checking", balance: 1000 },
      { id: "sav", name: "Savings", type: "savings", balance: 500 },
      { id: "loan", name: "Car loan", type: "debt", balance: 1000, apr: 12, min: 100, accrue: true },
    ],
    assets: [{ name: "Car", value: 5000 }],
    tx: [],
    goals: [],
    snapshots: [],
    closed: [],
    adj: {},
  };
}
