import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { CATALOG, formatSGD } from "@/lib/catalog";
import { parseBudgetToCents, type ShortlistItem } from "@/lib/shortlist-logic";
import { findShortlist, type ShortlistResult } from "@/lib/shortlist.functions";
import { createPaypalOrder, getPaymentConfig } from "@/lib/paypal.functions";
import { DemoBanner, SiteHeader } from "@/components/DemoBanner";
import { CardFieldsCheckout } from "@/components/CardFieldsCheckout";
import quietform from "@/assets/quietform.jpg";
import tideway from "@/assets/tideway.jpg";
import formfield from "@/assets/formfield.jpg";

const IMAGES: Record<string, string> = {
  "quietform-headphones": quietform,
  "tideway-bottle": tideway,
  "formfield-desk-lamp": formfield,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CartWise AI — Your shortlist, within budget" },
      { name: "description", content: "Describe what you need and your budget in S$. CartWise shortlists from a curated demo catalog." },
      { property: "og:title", content: "CartWise AI — Your shortlist, within budget" },
      { property: "og:description", content: "A Singapore-focused AI shopping assistant with PayPal Sandbox checkout." },
    ],
  }),
  component: Index,
});

type PayConfig = Awaited<ReturnType<typeof getPaymentConfig>>;

function Index() {
  const find = useServerFn(findShortlist);
  const fetchConfig = useServerFn(getPaymentConfig);
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("100");
  const [errors, setErrors] = useState<{ need?: string; budget?: string }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortlistResult | null>(null);
  const [budgetCents, setBudgetCents] = useState(0);
  const [config, setConfig] = useState<PayConfig | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => setConfig({ paypalConfigured: false, clientId: "", cardFieldsEnabled: false }));
  }, [fetchConfig]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (need.trim().length < 3) errs.need = "Tell us a little about what you need (at least 3 characters).";
    const cents = parseBudgetToCents(budget);
    if (cents === null) errs.budget = "Enter a budget in Singapore dollars, e.g. 80 or 64.50.";
    setErrors(errs);
    if (Object.keys(errs).length || cents === null) return;
    setLoading(true);
    setResult(null);
    setBudgetCents(cents);
    try {
      setResult(await find({ data: { need: need.trim(), budgetCents: cents } }));
    } catch {
      setResult({ ok: false, code: "provider", error: "Something went wrong reaching CartWise. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <section aria-labelledby="brief-title" className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Your shopping brief</p>
          <h1 id="brief-title" className="mt-3 text-4xl leading-[1.05] md:text-5xl">
            Tell us what you need. We'll find the shortlist.
          </h1>
          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="need" className="mb-1.5 block text-sm font-medium">What are you shopping for?</label>
              <textarea
                id="need"
                rows={4}
                className="field resize-none"
                placeholder="e.g. Something to help me focus while working from home in a noisy HDB flat"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                aria-invalid={!!errors.need}
                aria-describedby={errors.need ? "need-err" : undefined}
              />
              {errors.need && <p id="need-err" className="mt-1 text-sm text-destructive">{errors.need}</p>}
            </div>
            <div>
              <label htmlFor="budget" className="mb-1.5 block text-sm font-medium">Budget per item</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">S$</span>
                <input
                  id="budget"
                  inputMode="decimal"
                  className="field pl-10"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  aria-invalid={!!errors.budget}
                  aria-describedby={errors.budget ? "budget-err" : undefined}
                />
              </div>
              {errors.budget && <p id="budget-err" className="mt-1 text-sm text-destructive">{errors.budget}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Finding your shortlist…" : "Find my shortlist"}
            </button>
          </form>
          <aside className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
            <h2 className="mb-1 font-sans text-sm font-semibold text-foreground">How CartWise chooses</h2>
            <p>
              An AI model reads your brief and may only pick from our three-item demo catalog. It can rank and explain,
              but never invent products or prices. Prices come from our server, and anything over your budget is
              removed after the AI responds. No reviews or ratings are shown because none exist for this demo.
            </p>
          </aside>
        </section>

        <section aria-labelledby="shortlist-title" aria-live="polite" aria-busy={loading}>
          <h2 id="shortlist-title" className="text-3xl">{result?.ok ? "Your shortlist" : "The catalog"}</h2>
          <ResultsArea loading={loading} result={result} budgetCents={budgetCents} config={config} />
        </section>
      </main>
    </div>
  );
}

function ResultsArea({ loading, result, budgetCents, config }: { loading: boolean; result: ShortlistResult | null; budgetCents: number; config: PayConfig | null }) {
  if (loading) {
    return (
      <div className="mt-6 space-y-4" role="status">
        <span className="sr-only">Loading shortlist</span>
        {[0, 1].map((i) => <div key={i} className="card-paper h-48 animate-pulse" />)}
      </div>
    );
  }
  if (result && !result.ok) {
    return (
      <div role="alert" className="card-paper mt-6 p-6">
        <p className="font-medium">We couldn't build a shortlist.</p>
        <p className="mt-1 text-muted-foreground">{result.error}</p>
      </div>
    );
  }
  if (result?.ok) {
    return (
      <div className="mt-2">
        {result.interpretation && <p className="text-muted-foreground">“{result.interpretation}”</p>}
        {result.items.length === 0 ? (
          <div className="card-paper mt-6 p-6">
            <p className="font-medium">Nothing in our demo catalog fits that brief within {formatSGD(budgetCents)}.</p>
            <p className="mt-1 text-muted-foreground">Try a higher budget or a different need — the catalog has headphones, a bottle and a desk lamp.</p>
          </div>
        ) : (
          <>
            <ol className="mt-6 space-y-5">
              {result.items.map((item, i) => (
                <ProductCard key={item.id} item={item} rank={i + 1} budgetCents={budgetCents} config={config} />
              ))}
            </ol>
            {result.items.length > 1 && <Comparison items={result.items} budgetCents={budgetCents} />}
          </>
        )}
      </div>
    );
  }
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-3">
      {CATALOG.map((p) => (
        <li key={p.id} className="card-paper overflow-hidden">
          <img src={IMAGES[p.id]} alt={p.name} loading="lazy" width={1024} height={1024} className="aspect-square w-full object-cover" />
          <div className="p-4">
            <p className="text-xs text-muted-foreground">{p.category}</p>
            <p className="mt-1 font-serif text-lg leading-tight">{p.name}</p>
            <p className="mt-2 font-medium">{formatSGD(p.priceCents)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ item, rank, budgetCents, config }: { item: ShortlistItem; rank: number; budgetCents: number; config: PayConfig | null }) {
  const createOrder = useServerFn(createPaypalOrder);
  const [payState, setPayState] = useState<"idle" | "redirecting" | "error">("idle");
  const [payError, setPayError] = useState("");
  const [showCard, setShowCard] = useState(false);

  async function payWithPaypal() {
    setPayState("redirecting");
    setPayError("");
    try {
      const r = await createOrder({ data: { productId: item.id, mode: "redirect" } });
      if (!r.ok || !r.approveUrl) throw new Error(r.ok ? "PayPal didn't return an approval link." : r.error);
      window.location.href = r.approveUrl;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Couldn't start PayPal checkout.");
      setPayState("error");
    }
  }

  const headroom = budgetCents - item.priceCents;
  return (
    <li className="card-paper grid overflow-hidden sm:grid-cols-[200px_1fr]">
      <img src={IMAGES[item.id]} alt={item.name} loading="lazy" width={1024} height={1024} className="aspect-square h-full w-full object-cover" />
      <div className="flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">#{rank} · {item.category}</p>
            <h3 className="mt-1 text-2xl leading-tight">{item.name}</h3>
          </div>
          <p className="shrink-0 text-xl font-semibold">{formatSGD(item.priceCents)}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">{item.fit}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1">{formatSGD(headroom)} under budget</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{item.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={payWithPaypal} disabled={!config?.paypalConfigured || payState === "redirecting"}>
            {payState === "redirecting" ? "Opening PayPal…" : "Checkout with PayPal"}
          </button>
          <button type="button" className="btn-outline" onClick={() => setShowCard((s) => !s)} disabled={!config?.cardFieldsEnabled} aria-expanded={showCard}>
            Pay by card
          </button>
        </div>
        {config && !config.paypalConfigured && <p className="mt-2 text-xs text-muted-foreground">PayPal Sandbox isn't configured yet, so checkout is unavailable.</p>}
        {config?.paypalConfigured && !config.cardFieldsEnabled && <p className="mt-2 text-xs text-muted-foreground">Card fields are disabled until Advanced Card Processing is enabled for the Sandbox account.</p>}
        {payError && <p role="alert" className="mt-2 text-sm text-destructive">{payError}</p>}
        {showCard && config?.cardFieldsEnabled && (
          <div className="mt-4 border-t border-border pt-4">
            <CardFieldsCheckout productId={item.id} clientId={config.clientId} />
          </div>
        )}
      </div>
    </li>
  );
}

function Comparison({ items, budgetCents }: { items: ShortlistItem[]; budgetCents: number }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <h3 className="mb-3 text-xl">At a glance</h3>
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-4 font-medium">Item</th>
            <th scope="col" className="py-2 pr-4 font-medium">Price</th>
            <th scope="col" className="py-2 pr-4 font-medium">Left in budget</th>
            <th scope="col" className="py-2 font-medium">Key features</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b border-border align-top">
              <th scope="row" className="py-3 pr-4 font-medium">{i.name}</th>
              <td className="py-3 pr-4">{formatSGD(i.priceCents)}</td>
              <td className="py-3 pr-4">{formatSGD(budgetCents - i.priceCents)}</td>
              <td className="py-3 text-muted-foreground">{i.features.join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
