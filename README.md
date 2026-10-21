# CartWise AI

A Singapore-focused AI shopping assistant, built as a hackathon prototype. Describe what you need in plain language, set a budget in SGD, and CartWise returns a short, reasoned shortlist from a small demo catalog — with server-verified prices and a PayPal Sandbox checkout.

> **Demo disclosure:** every product in the catalog is fictional and illustrative. Prices are sample data, not real inventory, retailer offers, reviews, or ratings. Checkout runs against **PayPal Sandbox only** — no real payments are processed, and this project is **not production payment ready**.

## Features

- **Natural-language shopping brief** — describe your need ("something to help me focus in a noisy HDB flat") and a per-item budget in S$.
- **AI shortlist, server-side** — the brief is sent to Lovable AI from a server function; the model may only pick and rank IDs from the provided catalog. It cannot invent products or prices.
- **Strict post-AI validation** — every model pick passes through a trusted filter that drops unknown or altered product IDs, dedupes, and enforces the budget using server-owned prices. The final budget gate always runs in server code after the model responds.
- **Server-authoritative pricing** — the catalog (`src/lib/catalog.ts`) is the single source of truth for prices. The browser never supplies a price; PayPal orders are created and captured server-side from catalog lookups.
- **PayPal Sandbox redirect checkout** — real Sandbox order creation, buyer approval on paypal.com, and capture that only reports success when PayPal returns a `COMPLETED` capture. Cancel and return flows are handled.
- **Advanced Card Fields** — present but disabled by default and **unverified**; they stay off unless deliberately enabled after Sandbox eligibility and testing (see Configuration).
- **Prompt examples** — clickable example chips fill the brief and budget without auto-submitting.
- **Transparent "How CartWise chooses"** — the UI explains that recommendations are restricted to the demo catalog.

## Screenshots / demo

_Add screenshots or a demo link here before submission._

## Architecture

- **Stack:** TanStack Start v1 (React 19, TypeScript), Vite, Tailwind CSS v4, Bun.
- **Server functions** (`createServerFn`) hold all privileged logic; nothing secret ships to the browser.
- `src/lib/catalog.ts` — the 9-product demo catalog; the only source of prices (in cents).
- `src/lib/shortlist-logic.ts` — `finalizeShortlist`: the trusted post-AI filter (known IDs only, dedupe, budget enforcement).
- `src/lib/shortlist.functions.ts` — the Lovable AI shortlist call (structured output, error mapping for missing key / provider / malformed responses).
- `src/lib/paypal.functions.ts` — PayPal Sandbox order creation and capture; product and price are always derived server-side from the catalog.
- `src/routes/index.tsx` — the split-screen shopping experience (brief left, shortlist right).

## Getting started

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev      # start the dev server
bun run test     # run the unit tests
bun run build    # production build
```

## Configuration

All credentials are **server-side environment variables / secure project secrets** — never commit them and never place them in client code.

| Variable | Purpose |
| --- | --- |
| `LOVABLE_API_KEY` | Lovable AI gateway key. Managed automatically when running inside Lovable; a clone running elsewhere needs a valid Lovable AI gateway key for the shortlist to work. |
| `PAYPAL_CLIENT_ID` | PayPal Developer **Sandbox** REST app client ID. |
| `PAYPAL_CLIENT_SECRET` | Sandbox REST app secret. |
| `PAYPAL_CARD_FIELDS_ENABLED` | Optional. Set to `true` only after Advanced Card Processing is enabled for the Sandbox account and the flow has been tested. Leave unset/false otherwise. |

See `CONFIGURATION.md` for the same list. Without the PayPal variables, checkout shows a clear "not configured" state instead of failing.

## Troubleshooting

- **"The AI assistant isn't configured yet"** — no Lovable AI gateway key is available in this environment. Inside Lovable this is managed for you; elsewhere, provide a valid key.
- **"AI credits have run out"** — the workspace's Lovable AI credits are exhausted; top up and retry.
- **"PayPal Sandbox isn't configured yet"** — `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` are missing.
- **PayPal login loop during checkout** — use a **Sandbox buyer** account (PayPal Developer dashboard → Testing Tools → Sandbox Accounts), not a real PayPal login.

## Security notes

- Prices, product IDs, and the budget gate are enforced only in server code; client input is treated as untrusted.
- AI output is never trusted directly — unknown IDs are dropped and prices always come from the catalog.
- No real payments: all PayPal calls target the Sandbox API. Going live would require deliberately switching credentials and endpoints, plus a full security review.
- No credentials belong in this repository. Environment files and key material are git-ignored; add secrets only through your hosting platform's secure secret storage.

## License

[MIT](LICENSE) — see the LICENSE file.
