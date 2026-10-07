/**
 * Maps the app's in-memory state to database rows and back, and works out
 * which rows changed since the last save. Pure functions, no network.
 */

type Obj = Record<string, unknown>;
type Kind = "text" | "number" | "bool" | "date";

/** A typed column: the database column name and the app field it holds. */
interface Column {
  col: string;
  field: string;
  kind: Kind;
}

interface TableSpec {
  table: string;
  /** Key of the list in app state. */
  list: string;
  /** App field used as the row id. */
  idField: string;
  columns: Column[];
}

const c = (col: string, kind: Kind, field = col): Column => ({ col, field, kind });

export const TABLES: TableSpec[] = [
  { table: "accounts", list: "accounts", idField: "id", columns: [c("name", "text"), c("type", "text"), c("balance", "number")] },
  { table: "categories", list: "categories", idField: "id", columns: [c("name", "text"), c("type", "text"), c("budget", "number")] },
  { table: "fixed_costs", list: "fixed", idField: "id", columns: [c("name", "text"), c("amount", "number"), c("pct", "number")] },
  {
    table: "goals",
    list: "goals",
    idField: "id",
    columns: [
      c("name", "text"),
      c("target", "number"),
      c("saved", "number"),
      c("due_date", "date", "date"),
      c("done", "bool"),
      c("parent_id", "text", "parent"),
    ],
  },
  { table: "entries", list: "tx", idField: "id", columns: [c("kind", "text"), c("date", "date"), c("amount", "number")] },
  { table: "snapshots", list: "snapshots", idField: "key", columns: [] },
];

/** State that stays on this device: the PIN lock and which screen is open. */
export const LOCAL_ONLY = ["sec", "view"];

export interface Row extends Obj {
  id: string;
}
export type RowSet = Record<string, Map<string, Row>>;

/** Deep copy, so the last-saved copy never shares objects with live state. */
const copy = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/** Copy without temporary fields (leading underscore) such as undo bookkeeping. */
const clean = (o: Obj): Obj => {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) if (!k.startsWith("_") && v !== undefined) out[k] = copy(v);
  return out;
};

function toRow(spec: TableSpec, item: Obj, position: number): Row {
  const rest = clean(item);
  const id = String(rest[spec.idField]);
  delete rest[spec.idField];
  const row: Row = { id, position };
  for (const { col, field } of spec.columns) {
    row[col] = rest[field] ?? null;
    delete rest[field];
  }
  row.data = rest;
  return row;
}

function fromRow(spec: TableSpec, row: Obj): Obj {
  const item: Obj = { ...((row.data as Obj) || {}) };
  item[spec.idField] = row.id;
  for (const { col, field, kind } of spec.columns) {
    const v = row[col];
    if (v == null) continue; // optional field left unset, as the app expects
    item[field] = kind === "number" ? Number(v) : v;
  }
  return item;
}

/** Split app state into table rows plus one settings document. */
export function stateToRows(state: Obj): { rows: RowSet; settings: Obj } {
  const rows: RowSet = {};
  const lists = new Set(TABLES.map((t) => t.list));
  for (const spec of TABLES) {
    const m = new Map<string, Row>();
    ((state[spec.list] as Obj[]) || []).forEach((item, i) => {
      const r = toRow(spec, item, i);
      m.set(r.id, r); // a duplicate id keeps the later item
    });
    rows[spec.table] = m;
  }
  const settings: Obj = {};
  for (const [k, v] of Object.entries(state)) if (!lists.has(k) && !LOCAL_ONLY.includes(k) && v !== undefined) settings[k] = copy(v);
  return { rows, settings };
}

/** Rebuild app state from table rows and the settings document. */
export function rowsToState(rows: Record<string, Obj[]>, settings: Obj): Obj {
  const state: Obj = { ...settings };
  for (const spec of TABLES) {
    state[spec.list] = (rows[spec.table] || [])
      .slice()
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((r) => fromRow(spec, r));
  }
  return state;
}

/** Stable JSON: object keys sorted, so equal values compare equal. */
export function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v as Obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Obj)[k])}`)
      .join(",")}}`;
  return JSON.stringify(v) ?? "null";
}

export interface Changes {
  upserts: Record<string, Row[]>;
  deletes: Record<string, string[]>;
  settings: boolean;
  count: number;
}

/** What to write so the database matches `next`, given it matched `prev`. */
export function diff(prev: { rows: RowSet; settings: Obj } | null, next: { rows: RowSet; settings: Obj }): Changes {
  const out: Changes = { upserts: {}, deletes: {}, settings: false, count: 0 };
  for (const spec of TABLES) {
    const p = prev?.rows[spec.table] || new Map<string, Row>();
    const n = next.rows[spec.table];
    const ups = [...n.values()].filter((r) => !p.has(r.id) || stable(p.get(r.id)) !== stable(r));
    const dels = [...p.keys()].filter((id) => !n.has(id));
    if (ups.length) out.upserts[spec.table] = ups;
    if (dels.length) out.deletes[spec.table] = dels;
    out.count += ups.length + dels.length;
  }
  out.settings = !prev || stable(prev.settings) !== stable(next.settings);
  if (out.settings) out.count++;
  return out;
}
