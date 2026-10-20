import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { capturePaypalOrder, type CaptureResult } from "@/lib/paypal.functions";
import { DemoBanner, SiteHeader } from "@/components/DemoBanner";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Completing your order — CartWise AI" },
      { name: "description", content: "Confirming your PayPal Sandbox payment." },
      { property: "og:title", content: "Completing your order — CartWise AI" },
      { property: "og:description", content: "Confirming your PayPal Sandbox payment." },
    ],
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { token } = Route.useSearch();
  const capture = useServerFn(capturePaypalOrder);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setResult({ ok: false, error: "No PayPal order was found in the return link." });
      return;
    }
    capture({ data: { orderId: token } })
      .then(setResult)
      .catch(() => setResult({ ok: false, error: "We couldn't confirm the payment. Please try again." }));
  }, [token, capture]);

  return (
    <div className="min-h-screen">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        {!result && (
          <div role="status">
            <h1 className="text-4xl">Confirming payment…</h1>
            <p className="mt-3 text-muted-foreground">Capturing your Sandbox order with PayPal.</p>
          </div>
        )}
        {result?.ok && (
          <div role="status">
            <h1 className="text-4xl">Payment complete</h1>
            <p className="mt-3 text-muted-foreground">
              {result.productName} · {result.amount} (Sandbox). Capture ID {result.captureId}.
            </p>
          </div>
        )}
        {result && !result.ok && (
          <div role="alert">
            <h1 className="text-4xl">Payment not completed</h1>
            <p className="mt-3 text-muted-foreground">{result.error}</p>
          </div>
        )}
        <Link to="/" className="btn-outline mt-8">Back to CartWise</Link>
      </main>
    </div>
  );
}
