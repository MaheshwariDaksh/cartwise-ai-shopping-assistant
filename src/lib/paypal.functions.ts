import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getProduct } from "./catalog";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function accessToken(): Promise<string> {
  const id = process.env["PAYPAL_CLIENT_ID"];
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!id || !secret) throw new Error("PAYPAL_NOT_CONFIGURED");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error("PayPal auth failed", res.status);
    throw new Error("PAYPAL_AUTH");
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : "";
  if (m === "PAYPAL_NOT_CONFIGURED") return "PayPal Sandbox isn't configured yet (missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET).";
  if (m === "PAYPAL_AUTH") return "PayPal rejected the Sandbox credentials. Check the client ID and secret.";
  return "PayPal had a problem processing this request. Please try again.";
}

export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  const clientId = process.env["PAYPAL_CLIENT_ID"] ?? "";
  const configured = Boolean(clientId && process.env["PAYPAL_CLIENT_SECRET"]);
  return {
    paypalConfigured: configured,
    // Client ID is public by design (used by the PayPal JS SDK).
    clientId: configured ? clientId : "",
    cardFieldsEnabled: configured && process.env["PAYPAL_CARD_FIELDS_ENABLED"] === "true",
  };
});

export type CreateOrderResult =
  | { ok: true; orderId: string; approveUrl: string | null }
  | { ok: false; error: string };

export const createPaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ productId: z.string().max(80), mode: z.enum(["redirect", "card"]) }).parse(d),
  )
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    const product = getProduct(data.productId);
    if (!product) return { ok: false, error: "That product isn't in the catalog." };
    try {
      const token = await accessToken();
      const origin = new URL(getRequest().url).origin;
      const value = (product.priceCents / 100).toFixed(2);
      const body: Record<string, unknown> = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: product.id,
            description: `${product.name} (CartWise demo)`,
            amount: {
              currency_code: "SGD",
              value,
              breakdown: { item_total: { currency_code: "SGD", value } },
            },
            items: [
              { name: product.name, sku: product.id, quantity: "1", category: "PHYSICAL_GOODS", unit_amount: { currency_code: "SGD", value } },
            ],
          },
        ],
      };
      if (data.mode === "redirect") {
        body.payment_source = {
          paypal: {
            experience_context: {
              brand_name: "CartWise AI (Sandbox)",
              user_action: "PAY_NOW",
              shipping_preference: "NO_SHIPPING",
              return_url: `${origin}/checkout/return`,
              cancel_url: `${origin}/checkout/cancel`,
            },
          },
        };
      }
      const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { id?: string; links?: { rel: string; href: string }[] };
      if (!res.ok || !json.id) {
        console.error("PayPal create order failed", res.status, json);
        return { ok: false, error: "PayPal couldn't create the order. Please try again." };
      }
      const approve = json.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href ?? null;
      return { ok: true, orderId: json.id, approveUrl: approve };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  });

export type CaptureResult =
  | { ok: true; orderId: string; captureId: string; productName: string; amount: string }
  | { ok: false; error: string; status?: string };

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().regex(/^[A-Z0-9]{5,40}$/) }).parse(d))
  .handler(async ({ data }): Promise<CaptureResult> => {
    try {
      const token = await accessToken();
      const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${data.orderId}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = (await res.json()) as {
        status?: string;
        details?: { issue?: string }[];
        purchase_units?: {
          reference_id?: string;
          payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] };
        }[];
      };
      if (!res.ok) {
        console.error("PayPal capture failed", res.status, json);
        const issue = json.details?.[0]?.issue;
        return {
          ok: false,
          status: issue,
          error: issue === "INSTRUMENT_DECLINED" ? "The payment method was declined. Try another." : issue === "ORDER_ALREADY_CAPTURED" ? "This order was already paid." : "PayPal couldn't complete the payment.",
        };
      }
      const unit = json.purchase_units?.[0];
      const capture = unit?.payments?.captures?.[0];
      const product = unit?.reference_id ? getProduct(unit.reference_id) : undefined;
      if (json.status !== "COMPLETED" || !capture || capture.status !== "COMPLETED") {
        return { ok: false, status: capture?.status ?? json.status, error: `Payment not completed (status: ${capture?.status ?? json.status ?? "unknown"}).` };
      }
      if (product && capture.amount.value !== (product.priceCents / 100).toFixed(2)) {
        console.error("Capture amount mismatch", capture.amount, product.id);
      }
      return {
        ok: true,
        orderId: data.orderId,
        captureId: capture.id,
        productName: product?.name ?? "Your item",
        amount: `S$${capture.amount.value}`,
      };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  });
