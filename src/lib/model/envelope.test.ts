import { describe, expect, it } from "vitest";
import { inLine, openEnvelope, refillNeed } from ".";
import { sample, tx } from "./fixtures";

describe("lines of funding", () => {
  const food = () => sample().categories.find((c) => c.type === "monthly")!;
  it("starts with what the category has now, and spending takes it down", () => {
    const s = sample();
    const c = food();
    s.tx = [tx({ kind: "expense", acct: "chk", cat: c.id, amount: 40, date: "2026-10-02" })];
    const e = openEnvelope(s, c.id, 120, "2026-10"); // 120 left today, already after the 40
    expect(inLine(s, c, e)).toBe(120);
    s.tx.push(tx({ kind: "expense", acct: "chk", cat: c.id, amount: 30, date: "2026-10-20" }));
    expect(inLine(s, c, e)).toBe(90);
  });
  it("goes up only when money is put in, and carries into the next month", () => {
    const s = sample();
    const c = food();
    const e = openEnvelope(s, c.id, 50, "2026-10");
    e.adds.push({ id: "a", date: "2026-11-01", amount: 200, src: "sav" });
    s.tx.push(tx({ kind: "expense", acct: "chk", cat: c.id, amount: 25, date: "2026-11-03" }));
    expect(inLine(s, c, e)).toBe(225); // 50 carried + 200 refill - 25 spent; no automatic reset
  });
  it("counts money moved between lines after it started", () => {
    const s = sample();
    const c = food();
    s.adj = { "2026-10": { [c.id]: 10 } };
    const e = openEnvelope(s, c.id, 80, "2026-10");
    s.adj["2026-10"][c.id] = 35; // 25 more moved in
    expect(inLine(s, c, e)).toBe(105);
  });
  it("tells how much fills it back to the limit", () => {
    const c = { ...food(), budget: 480 };
    expect(refillNeed(c, 120)).toBe(360);
    expect(refillNeed(c, 500)).toBe(0);
  });
});
