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
import backpack from "@/assets/lumen-backpack.jpg";
import powerbank from "@/assets/brightside-powerbank.jpg";
import planner from "@/assets/ledgerleaf-planner.jpg";
import fan from "@/assets/stillwater-fan.jpg";
import pourover from "@/assets/kopi-pourover.jpg";
import umbrella from "@/assets/driftline-umbrella.jpg";

const IMAGES: Record<string, string> = {
  "quietform-headphones": quietform,
  "tideway-bottle": tideway,
  "formfield-desk-lamp": formfield,
  "lumen-commute-backpack": backpack,
  "brightside-power-bank": powerbank,
  "ledgerleaf-study-planner": planner,
  "stillwater-desk-fan": fan,
  "kopi-pourover-set": pourover,
  "driftline-compact-umbrella": umbrella,
};

const EXAMPLES = [
  { label: "Noisy HDB work-from-home", need: "Something to help me focus while working from home in a noisy HDB flat", budget: "100" },
  { label: "Poly student essentials", need: "I'm starting poly and need something to stay organised and keep my phone charged between classes", budget: "50" },
  { label: "Rainy MRT commute", need: "My daily MRT and bus commute keeps getting caught in afternoon rain — what should I carry?", budget: "80" },
];

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
          <p className="mt-4 text-muted-foreground">
            Too many tabs, too many options. Describe the job in plain words and CartWise narrows it to the few items that fit your budget.
          </p>
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
              <div className="mt-3" role="group" aria-label="Example briefs">
                <p className="mb-2 text-xs text-muted-foreground">Try an example (fills the form):</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      type="button"
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => {
                        setNeed(ex.need);
                        setBudget(ex.budget);
                        setErrors({});
                      }}
                    >
                      {ex.label} · S${ex.budget}
                    </button>
                  ))}
                </div>
              </div>
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
            <button type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} aria-busy={loading}>
              {loading ? "Finding your shortlist…" : "Find my shortlist"}
            </button>
          </form>
          <section aria-labelledby="how-title" className="mt-8 border-t border-border pt-5">
            <h2 id="how-title" className="mb-3 font-sans text-sm font-semibold">How CartWise chooses</h2>
            <ol className="space-y-2.5 text-sm text-muted-foreground">
              {[
                ["Understand", "AI reads your brief and picks only from the demo catalog — it can rank and explain, never invent products or prices."],
                ["Verify", "Our server re-checks every pick against catalog prices and removes anything over your budget."],
                ["Checkout", "Pay through PayPal Sandbox; the order total is set by the server, not your browser."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">{i + 1}</span>
                  <p><span className="font-medium text-foreground">{t}. </span>{d}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">Products are illustrative prototypes. No reviews or ratings are shown because none exist.</p>
          </section>
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
        <p className="text-muted-foreground">Reading your brief and checking each option against your budget…</p>
        {[0, 1].map((i) => <div key={i} className="card-paper h-48 animate-pulse" aria-hidden="true" />)}
      </div>
    );
  }
  if (result && !result.ok) {
    return (
      <div role="alert" className="card-paper mt-6 p-6">
        <p className="font-serif text-xl">We couldn't build a shortlist just now.</p>
        <p className="mt-1 text-muted-foreground">{result.error}</p>
        <p className="mt-3 text-sm text-muted-foreground">Your brief is still in the form — you can try again in a moment.</p>
      </div>
    );
  }
  if (result?.ok) {
    return (
      <div className="mt-2">
        {result.interpretation && (
          <p className="text-muted-foreground"><span className="font-medium text-foreground">What we understood: </span>{result.interpretation}</p>
        )}
        {result.items.length === 0 ? (
          <div className="card-paper mt-6 p-6">
            <p className="font-serif text-xl">No good match within {formatSGD(budgetCents)}.</p>
            <p className="mt-1 text-muted-foreground">
              Rather than suggest something that doesn't fit, we're showing nothing. Try a different need or a higher budget —
              the demo catalog has {CATALOG.length} items from {formatSGD(Math.min(...CATALOG.map((p) => p.priceCents)))} to {formatSGD(Math.max(...CATALOG.map((p) => p.priceCents)))}.
            </p>
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
    <>
      <p className="mt-2 text-sm text-muted-foreground">
        {CATALOG.length} illustrative prototype products — fictional brands and sample prices, not real inventory or retailer offers.
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATALOG.map((p) => (
          <li key={p.id} className="card-paper overflow-hidden">
            <img src={IMAGES[p.id]} alt={p.name} loading="lazy" width={1024} height={1024} className="aspect-square w-full object-cover" />
            <div className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">{p.category}</p>
              <p className="mt-1 font-serif text-base leading-tight sm:text-lg">{p.name}</p>
              <p className="mt-2 font-medium">{formatSGD(p.priceCents)} <span className="text-xs font-normal text-muted-foreground">sample</span></p>
            </div>
          </li>
        ))}
      </ul>
    </>
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
      <img src={IMAGES[item.id]} alt={item.name} loading="lazy" width={1024} height={1024} className="aspect-[4/3] h-full w-full object-cover sm:aspect-square" />
      <div className="flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">#{rank} · {item.category}</p>
            <h3 className="mt-1 text-2xl leading-tight">{item.name}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-semibold">{formatSGD(item.priceCents)}</p>
            <p className="text-xs text-muted-foreground">Sample price</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">{item.fit}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1">
            {headroom === 0 ? "Exactly on budget" : `${formatSGD(headroom)} under budget`} · verified on server
          </span>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Why it fits your brief</p>
        <p className="mt-1 text-sm leading-relaxed">{item.reason}</p>
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
