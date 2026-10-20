import { createServerFn } from "@tanstack/react-start";
import { APICallError, NoOutputGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { catalogForPrompt, finalizeShortlist, type ShortlistItem } from "./shortlist-logic";
import { createLovableGatewayProvider } from "./ai-gateway.server";

export type ShortlistResult =
  | { ok: true; interpretation: string; items: ShortlistItem[]; excludedOverBudget: number }
  | { ok: false; error: string; code: "missing_key" | "provider" | "malformed" };

const MODEL = "openai/gpt-6-astra";

const Input = z.object({
  need: z.string().trim().min(3).max(600),
  budgetCents: z.number().int().positive().max(10_000_000),
});

// Strict-compatible: object root, every property required, no optional fields.
const ShortlistSchema = z.object({
  interpretation: z.string(),
  picks: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      fit: z.enum(["Strong fit", "Good fit", "Partial fit"]),
    }),
  ),
});

function providerErrorMessage(e: unknown): string {
  if (e instanceof APICallError) {
    const status = e.statusCode ?? 0;
    if (status === 401) return "The AI assistant's key isn't valid. Check the project's Lovable AI configuration.";
    if (status === 402) return "CartWise's AI credits have run out. Top up credits in the workspace to re-enable recommendations.";
    if (status === 403) return "The AI service denied this request. Check the workspace's AI settings and model access.";
    if (status === 429) return "The AI service is busy right now. Please wait a moment and try again.";
    if (status >= 500) return "The AI service had a problem. Please try again.";
  }
  return "Couldn't reach the AI service. Please try again.";
}

export const findShortlist = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<ShortlistResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        ok: false,
        code: "missing_key",
        error: "The AI assistant isn't configured yet. Lovable AI needs to be enabled for this project.",
      };
    }

    const catalog = catalogForPrompt();
    const provider = createLovableGatewayProvider(apiKey);

    try {
      const result = streamText({
        model: provider.responses(MODEL),
        system: `You are CartWise, a shopping assistant for Singapore shoppers.
Pick ONLY from the catalog the shopper gives you (JSON). Never invent products, prices, reviews, ratings or claims not stated in the catalog.
Order picks best-first. Exclude products that are irrelevant. Exclude products above the shopper's budget.
For each pick give a reason of 1-2 sentences specific to this shopper and product, and a fit of "Strong fit", "Good fit" or "Partial fit".
The interpretation is one sentence restating the shopper's need.`,
        messages: [
          {
            role: "user",
            content: `Catalog: ${JSON.stringify(catalog)}
Shopper need: ${JSON.stringify(data.need)}
Budget: S$${(data.budgetCents / 100).toFixed(2)} per item.`,
          },
        ],
        output: Output.object({ schema: ShortlistSchema }),
        maxRetries: 0,
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            include: ["reasoning.encrypted_content"],
          },
        },
      });

      const parsed = await result.output;
      if (!parsed) {
        return { ok: false, code: "malformed", error: "The AI returned an unreadable answer. Please try again." };
      }
      const overBudget = catalog.filter((p) => Math.round(Number(p.price_sgd) * 100) > data.budgetCents).length;
      return {
        ok: true,
        interpretation: parsed.interpretation.slice(0, 300),
        items: finalizeShortlist(parsed.picks, data.budgetCents),
        excludedOverBudget: overBudget,
      };
    } catch (e) {
      if (e instanceof NoOutputGeneratedError) {
        console.error("Lovable AI malformed output", e);
        return { ok: false, code: "malformed", error: "The AI returned an unreadable answer. Please try again." };
      }
      console.error("Lovable AI error", e);
      return { ok: false, code: "provider", error: providerErrorMessage(e) };
    }
  });
