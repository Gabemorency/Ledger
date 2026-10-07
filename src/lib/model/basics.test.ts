import { describe, expect, it } from "vitest";
import { addMonths, lastDayOf, mIdx, monthsTo, money, r2 } from ".";

describe("money", () => {
  it("formats whole dollars and cents", () => {
    expect(money(1234.4)).toBe("$1,234");
    expect(money(1234.4, true)).toBe("$1,234.40");
    expect(money(-5.5, true)).toBe("-$5.50");
    expect(money(Number.NaN)).toBe("$0");
  });
  it("rounds to cents", () => {
    expect(r2(0.1 + 0.2)).toBe(0.3);
    expect(r2(10.126)).toBe(10.13);
    expect(r2(-1.234)).toBe(-1.23);
  });
});

describe("dates", () => {
  it("does month math across years", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(mIdx("2027-01") - mIdx("2026-10")).toBe(3);
  });
  it("knows month lengths, including leap years", () => {
    expect(lastDayOf("2028-02")).toBe("2028-02-29");
    expect(lastDayOf("2026-02")).toBe("2026-02-28");
    expect(lastDayOf("2026-12")).toBe("2026-12-31");
  });
  it("never reports fewer than one month left", () => {
    const now = new Date("2026-10-07T12:00");
    expect(monthsTo("2026-10-01", now)).toBe(1);
    expect(monthsTo("2027-10-07", now)).toBeCloseTo(12, 0);
  });
});
