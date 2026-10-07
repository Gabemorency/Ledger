/** Year-month key, e.g. "2026-10". */
export type MonthKey = string;
/** Calendar date, e.g. "2026-10-07". */
export type ISODate = string;

export type AccountType = "checking" | "cash" | "savings" | "retirement" | "debt";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Kind of account: "share" (credit-union base share) or "hysa" (high-yield savings), both savings accounts. Only the label differs. */
  sub?: "hysa" | "share";
  /** For debt accounts this is the amount owed (positive). */
  balance: number;
  bank?: string;
  pay?: boolean;
  opened?: ISODate;
  archived?: boolean;
  apr?: number;
  min?: number;
  /** Original loan amount, for payoff progress. */
  start?: number;
  startDate?: ISODate;
  /** Loan charges monthly interest when a payment is logged. */
  accrue?: boolean;
  card?: boolean;
  /** Statement closing day of month (cards). */
  stmt?: number;
  payFull?: boolean;
  payFrom?: string;
}

export type Role = "need" | "invest" | "save" | "want";

export interface Category {
  id: string;
  name: string;
  type: "monthly" | "annual";
  budget: number;
  role?: Role;
  archived?: boolean;
  /** Unspent budget rolls into the next month, starting after this month. */
  roll?: boolean;
  rollFrom?: MonthKey;
}

export type Frequency = "monthly" | "quarterly" | "yearly" | "months";

export interface FixedCost {
  id: string;
  name: string;
  /** Fixed amount per due month. Ignored when `pct` is set. */
  amount?: number;
  /** Percent of the month's income (e.g. a tithe). */
  pct?: number | null;
  acct?: string;
  /** Destination account (debt payment or investment contribution). */
  to?: string;
  role?: Role;
  day?: number;
  freq?: Frequency;
  /** Months of the year (1-12) when freq is "months". */
  months?: number[];
  begins?: MonthKey;
  end?: MonthKey;
  archived?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  date: ISODate;
  created: ISODate;
  acct?: string;
  done: boolean;
  /** Set on a sub-goal (e.g. one tuition payment of a larger goal). */
  parent?: string;
  boughtOn?: ISODate;
  paid?: number;
}

interface TxBase {
  id: string;
  date: ISODate;
  amount: number;
  vendor?: string;
  /** Id of the entry this one was created with (e.g. interest on a payment). */
  link?: string;
  goal?: string;
}

export type Tx = TxBase &
  (
    | { kind: "expense"; acct: string; cat: string }
    | { kind: "fixed"; acct: string; fixedId: string; to?: string }
    | { kind: "income"; acct: string }
    | { kind: "transfer"; from: string; to: string }
    | { kind: "adjust"; acct: string; dir: 1 | -1 }
    | { kind: "interest"; acct: string }
    | { kind: "goalbuy"; acct: string }
    | { kind: "assign" }
    | { kind: "unassign" }
    | { kind: "gmove"; gFrom: string; gTo: string; acctFrom: string; acctTo: string }
  );

export type TxKind = Tx["kind"];

export interface Asset {
  id?: string;
  name: string;
  value: number;
  archived?: boolean;
}

/** Account balances keyed by account id; `__oth` holds other assets. */
export type Balances = Record<string, number>;

export interface Snapshot {
  m: string;
  key: MonthKey;
  full: string;
  bal: Balances;
  oth?: number;
  corr: unknown[];
}

export interface Bucket {
  name: string;
  roles: Role[];
  min?: number;
  max?: number;
}

export type FrameworkId = "csp" | "r503020" | "zero" | "custom";

export interface Plan {
  /** Monthly take-home income used for planning. */
  income: number;
  deposit: string | null;
  payDefault: string | null;
  framework: FrameworkId;
  inc: { grossAnnual: number; pretax: number; net: number; extra: number };
  custom: Bucket[];
}

/** The parts of the saved app state the model reads and writes. */
export interface LedgerState {
  plan: Plan;
  categories: Category[];
  fixed: FixedCost[];
  accounts: Account[];
  assets?: Asset[];
  tx: Tx[];
  goals: Goal[];
  snapshots: Snapshot[];
  closed: MonthKey[];
  /** Per-month budget moves: adj[month][categoryId] = +/- amount. */
  adj?: Record<MonthKey, Record<string, number>>;
}
