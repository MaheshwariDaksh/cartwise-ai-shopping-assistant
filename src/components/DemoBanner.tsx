import { Link } from "@tanstack/react-router";

export function DemoBanner() {
  return (
    <div role="note" className="bg-warning text-warning-foreground text-center text-sm px-4 py-2">
      Demo only: products and prices are sample catalog data. Checkout runs in PayPal Sandbox — no real money moves.
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
      <Link to="/" className="font-serif text-2xl font-medium">
        CartWise <span className="text-primary">AI</span>
      </Link>
      <span className="text-sm text-muted-foreground">Shopping in Singapore · S$</span>
    </header>
  );
}
