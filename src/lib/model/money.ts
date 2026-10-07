/** Round to cents. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** "$1,234" or, with cents, "$1,234.56". Negative values get a leading "-". */
export function money(n: number, cents = false): string {
  n = +n || 0;
  const r = cents ? Math.round(n * 100) / 100 : Math.round(n);
  const digits = cents ? 2 : 0;
  return (
    (r < 0 ? "-" : "") +
    "$" +
    Math.abs(r).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  );
}
