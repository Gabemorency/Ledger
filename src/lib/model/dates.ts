import type { ISODate, MonthKey } from "./types";

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const iso = (y: number, m: number, d: number): ISODate => `${y}-${pad2(m)}-${pad2(d)}`;
export const mkey = (d: Date): MonthKey => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
/** Local midnight on the first of the month. */
export const mDate = (m: MonthKey) => new Date(`${m}-01T00:00`);
/** Months since year 0, for month arithmetic. */
export const mIdx = (m: MonthKey) => +m.slice(0, 4) * 12 + (+m.slice(5, 7) - 1);
export const addMonths = (m: MonthKey, k: number): MonthKey => {
  const d = mDate(m);
  return mkey(new Date(d.getFullYear(), d.getMonth() + k, 1));
};
export const prevMonth = (m: MonthKey) => addMonths(m, -1);
export const lastDayOf = (m: MonthKey): ISODate => {
  const d = mDate(m);
  return iso(d.getFullYear(), d.getMonth() + 1, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
};
export const toISO = (d: Date): ISODate => iso(d.getFullYear(), d.getMonth() + 1, d.getDate());

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;
/** Months from `now` until `date`, never less than 1. */
export const monthsTo = (date: ISODate, now: Date) =>
  Math.max(1, (new Date(`${date}T00:00`).getTime() - now.getTime()) / MS_PER_MONTH);
