import { describe, it, expect } from "vitest";
import { finalizeShortlist, parseBudgetToCents } from "./shortlist-logic";

describe("finalizeShortlist", () => {
  it("drops products the model invented", () => {
    const r = finalizeShortlist([{ id: "fake-tv", reason: "x" }, { id: "tideway-bottle" }], 100000);
    expect(r.map((i) => i.id)).toEqual(["tideway-bottle"]);
  });
  it("enforces budget with catalog prices (S$64.00 lamp excluded at S$60)", () => {
    const r = finalizeShortlist([{ id: "formfield-desk-lamp" }, { id: "tideway-bottle" }], 6000);
    expect(r.map((i) => i.id)).toEqual(["tideway-bottle"]);
  });
  it("uses server price S$89.90 for headphones", () => {
    const r = finalizeShortlist([{ id: "quietform-headphones", priceCents: 1 }], 9000);
    expect(r[0].priceCents).toBe(8990);
  });
  it("handles malformed picks", () => {
    expect(finalizeShortlist("nope", 10000)).toEqual([]);
  });
});

describe("parseBudgetToCents", () => {
  it("parses S$ amounts", () => {
    expect(parseBudgetToCents("S$64.00")).toBe(6400);
    expect(parseBudgetToCents("abc")).toBeNull();
    expect(parseBudgetToCents("0")).toBeNull();
  });
});
