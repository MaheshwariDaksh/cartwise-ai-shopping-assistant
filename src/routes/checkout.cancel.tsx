import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoBanner, SiteHeader } from "@/components/DemoBanner";

export const Route = createFileRoute("/checkout/cancel")({
  head: () => ({
    meta: [
      { title: "Checkout cancelled — CartWise AI" },
      { name: "description", content: "Your PayPal Sandbox checkout was cancelled." },
      { property: "og:title", content: "Checkout cancelled — CartWise AI" },
      { property: "og:description", content: "Your PayPal Sandbox checkout was cancelled." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="text-4xl">Checkout cancelled</h1>
        <p className="mt-3 text-muted-foreground">No payment was taken. Your shortlist is still waiting.</p>
        <Link to="/" className="btn-outline mt-8">Back to CartWise</Link>
      </main>
    </div>
  ),
});
