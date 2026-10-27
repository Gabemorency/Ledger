/** Round to cents. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** "$1,234" or, with cents, "$1,234.56". Negative values get a leading "-". */
/** Dollars and cents, always to two decimal places. (`cents` is kept for older callers.) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function money(n: number, cents = true): string {
  n = +n || 0;
  const r = Math.round(n * 100) / 100;
  const digits = 2;
  return (
    (r < 0 ? "-" : "") +
    "$" +
    Math.abs(r).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  );
}
