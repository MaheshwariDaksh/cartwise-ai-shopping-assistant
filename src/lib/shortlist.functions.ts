import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { catalogForPrompt, finalizeShortlist, type ShortlistItem } from "./shortlist-logic";

export type ShortlistResult =
  | { ok: true; interpretation: string; items: ShortlistItem[]; excludedOverBudget: number }
  | { ok: false; error: string; code: "missing_key" | "provider" | "malformed" };

const Input = z.object({
  need: z.string().trim().min(3).max(600),
  budgetCents: z.number().int().positive().max(10_000_000),
});

export const findShortlist = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<ShortlistResult> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return {
        ok: false,
        code: "missing_key",
        error: "The AI assistant isn't configured yet. Add GEMINI_API_KEY in project secrets to enable recommendations.",
      };
    }
    const catalog = catalogForPrompt();
    const prompt = `You are CartWise, a shopping assistant for Singapore shoppers.
Pick ONLY from this catalog (JSON). Never invent products, prices, reviews, ratings or claims not stated in the catalog.
Catalog: ${JSON.stringify(catalog)}
Shopper need: ${JSON.stringify(data.need)}
Budget: S$${(data.budgetCents / 100).toFixed(2)} per item.
Return JSON: {"interpretation": one sentence restating the need, "picks": [{"id": catalog id, "reason": 1-2 sentences specific to this shopper and product, "fit": "Strong fit" | "Good fit" | "Partial fit"}]}.
Order picks best-first. Exclude products that are irrelevant. Exclude products above budget.`;

    let res: Response;
    try {
      res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
          }),
        },
      );
    } catch (e) {
      console.error("Gemini network error", e);
      return { ok: false, code: "provider", error: "Couldn't reach the AI service. Please try again." };
    }
    if (!res.ok) {
      console.error("Gemini error", res.status, await res.text().catch(() => ""));
      const msg =
        res.status === 429
          ? "The AI service is busy right now. Please wait a moment and try again."
          : res.status === 400 || res.status === 403
            ? "The AI service rejected the request. Check that GEMINI_API_KEY is valid."
            : "The AI service had a problem. Please try again.";
      return { ok: false, code: "provider", error: msg };
    }
    try {
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      const parsed = JSON.parse(text) as { interpretation?: unknown; picks?: unknown };
      const overBudget = catalog.filter((p) => Math.round(Number(p.price_sgd) * 100) > data.budgetCents).length;
      return {
        ok: true,
        interpretation: typeof parsed.interpretation === "string" ? parsed.interpretation.slice(0, 300) : "",
        items: finalizeShortlist(parsed.picks, data.budgetCents),
        excludedOverBudget: overBudget,
      };
    } catch (e) {
      console.error("Gemini malformed", e);
      return { ok: false, code: "malformed", error: "The AI returned an unreadable answer. Please try again." };
    }
  });
