import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { capturePaypalOrder, createPaypalOrder, type CaptureResult } from "@/lib/paypal.functions";

type CardFieldsInstance = {
  isEligible: () => boolean;
  NumberField: () => { render: (el: HTMLElement) => Promise<void> };
  ExpiryField: () => { render: (el: HTMLElement) => Promise<void> };
  CVVField: () => { render: (el: HTMLElement) => Promise<void> };
  NameField: () => { render: (el: HTMLElement) => Promise<void> };
  submit: () => Promise<void>;
};
declare global {
  interface Window {
    paypal?: { CardFields?: (opts: Record<string, unknown>) => CardFieldsInstance };
  }
}

let sdkPromise: Promise<void> | null = null;
function loadSdk(clientId: string) {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=card-fields&currency=SGD&intent=capture`;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("sdk"));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

type Phase = "loading" | "ready" | "ineligible" | "error" | "paying" | "done";

export function CardFieldsCheckout({ productId, clientId }: { productId: string; clientId: string }) {
  const createOrder = useServerFn(createPaypalOrder);
  const capture = useServerFn(capturePaypalOrder);
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);
  const fieldsRef = useRef<CardFieldsInstance | null>(null);
  const refs = { name: useRef<HTMLDivElement>(null), number: useRef<HTMLDivElement>(null), expiry: useRef<HTMLDivElement>(null), cvv: useRef<HTMLDivElement>(null) };

  useEffect(() => {
    let cancelled = false;
    loadSdk(clientId)
      .then(async () => {
        if (cancelled) return;
        const factory = window.paypal?.CardFields;
        if (!factory) return setPhase("ineligible");
        const cf = factory({
          createOrder: async () => {
            const r = await createOrder({ data: { productId, mode: "card" } });
            if (!r.ok) throw new Error(r.error);
            return r.orderId;
          },
          onApprove: async (d: { orderID: string }) => {
            const r = await capture({ data: { orderId: d.orderID } });
            setResult(r);
            setPhase(r.ok ? "done" : "error");
            if (!r.ok) setMessage(r.error);
          },
          onError: (err: unknown) => {
            console.error(err);
            setMessage("The card payment couldn't be completed. Check the details and try again.");
            setPhase("error");
          },
        });
        if (!cf.isEligible()) return setPhase("ineligible");
        fieldsRef.current = cf;
        await Promise.all([
          cf.NameField().render(refs.name.current!),
          cf.NumberField().render(refs.number.current!),
          cf.ExpiryField().render(refs.expiry.current!),
          cf.CVVField().render(refs.cvv.current!),
        ]);
        if (!cancelled) setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("PayPal card fields couldn't load.");
          setPhase("error");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, productId]);

  if (phase === "done" && result?.ok) {
    return (
      <div role="status" className="rounded-lg bg-accent p-4 text-accent-foreground">
        Sandbox payment captured: {result.productName}, {result.amount}. Capture ID {result.captureId}.
      </div>
    );
  }
  if (phase === "ineligible") {
    return <p className="text-sm text-muted-foreground">Card fields aren't available for this Sandbox merchant account. Use PayPal checkout instead.</p>;
  }

  return (
    <div className="space-y-3">
      {phase === "loading" && <p className="text-sm text-muted-foreground">Loading secure card fields…</p>}
      <div ref={refs.name} />
      <div ref={refs.number} />
      <div className="grid grid-cols-2 gap-2">
        <div ref={refs.expiry} />
        <div ref={refs.cvv} />
      </div>
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={phase !== "ready" && phase !== "error"}
        onClick={async () => {
          if (!fieldsRef.current) return;
          setMessage("");
          setPhase("paying");
          try {
            await fieldsRef.current.submit();
          } catch {
            setMessage("Please check your card details.");
            setPhase("error");
          }
        }}
      >
        {phase === "paying" ? "Processing…" : "Pay by card (Sandbox)"}
      </button>
    </div>
  );
}
