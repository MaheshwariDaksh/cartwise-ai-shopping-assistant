import { CATALOG, getProduct, type Product } from "./catalog";

export type ShortlistItem = Product & { reason: string; fit: string };

export type RawModelPick = { id?: unknown; reason?: unknown; fit?: unknown };

/**
 * Trusted post-processing of model output: drop unknown IDs, duplicates and
 * anything over budget. Prices always come from the server catalog.
 */
export function finalizeShortlist(picks: unknown, budgetCents: number): ShortlistItem[] {
  if (!Array.isArray(picks)) return [];
  const seen = new Set<string>();
  const out: ShortlistItem[] = [];
  for (const raw of picks as RawModelPick[]) {
    if (!raw || typeof raw.id !== "string") continue;
    const product = getProduct(raw.id);
    if (!product || seen.has(product.id)) continue;
    if (product.priceCents > budgetCents) continue;
    seen.add(product.id);
    const reason = typeof raw.reason === "string" ? raw.reason.trim().slice(0, 400) : "";
    const fit = typeof raw.fit === "string" ? raw.fit.trim().slice(0, 40) : "";
    out.push({ ...product, reason: reason || product.summary, fit: fit || "Possible fit" });
  }
  return out;
}

export function parseBudgetToCents(input: string): number | null {
  const cleaned = input.replace(/[sS$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  return cents > 0 && cents <= 100_000_00 ? cents : null;
}

export function catalogForPrompt() {
  return CATALOG.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price_sgd: (p.priceCents / 100).toFixed(2),
    summary: p.summary,
    features: p.features,
  }));
}
