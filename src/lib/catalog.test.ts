import { describe, it, expect } from "vitest";
import { CATALOG, getProduct } from "./catalog";
import { finalizeShortlist } from "./shortlist-logic";

describe("catalog integrity", () => {
  it("has exactly 9 products with unique IDs", () => {
    expect(CATALOG).toHaveLength(9);
    expect(new Set(CATALOG.map((p) => p.id)).size).toBe(9);
  });
  it("keeps the original three products and prices unchanged", () => {
    expect(getProduct("quietform-headphones")?.priceCents).toBe(8990);
    expect(getProduct("tideway-bottle")?.priceCents).toBe(3250);
    expect(getProduct("formfield-desk-lamp")?.priceCents).toBe(6400);
  });
  it("every price is a positive whole number of cents", () => {
    for (const p of CATALOG) expect(Number.isInteger(p.priceCents) && p.priceCents > 0).toBe(true);
  });
});

describe("budget gate across the full catalog", () => {
  it("never returns an item priced above the budget (S$40)", () => {
    const all = CATALOG.map((p) => ({ id: p.id }));
    const r = finalizeShortlist(all, 4000);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.priceCents <= 4000)).toBe(true);
    expect(r.map((i) => i.id)).not.toContain("quietform-headphones");
  });
  it("includes an item priced exactly at the budget (S$64.00 lamp)", () => {
    expect(finalizeShortlist([{ id: "formfield-desk-lamp" }], 6400)).toHaveLength(1);
  });
  it("drops IDs with altered casing or whitespace", () => {
    expect(finalizeShortlist([{ id: "Tideway-Bottle" }, { id: " tideway-bottle" }], 100000)).toEqual([]);
  });
});
