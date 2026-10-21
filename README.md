# CartWise AI Shopping Assistant

Build a polished, full-stack web application called CartWise AI, a Singapore-focused AI shopping assistant. This is a new parallel project; do not claim existing Replit credentials or integrations are connected.

Design direction: refined editorial ecommerce, warm cream/off-white background, forest-green primary actions, large elegant serif headings, calm charcoal text, generous whitespace, subtle borders, premium product shortlist layout, excellent responsive behavior on laptop and mobile. The current inspiration is a split screen with shopping brief/budget on the left and shortlist on the right. Make it feel like a thoughtfully designed hackathon product, not a generic dashboard. Add coherent visual product imagery or high-quality imagery placeholders for each catalog item.

Main flow:
- Landing/search screen with a natural-language need input, budget input displayed in Singapore dollars (S$), and an obvious “Find my shortlist” CTA.
- Seed demo catalog with exactly three authoritative products: QuietForm Wireless Headphones S$89.90 (Audio & everyday), Tideway Insulated Bottle S$32.50 (Home & everyday), and Form & Field Desk Lamp S$64.00 (Home & desk essentials). Keep IDs stable and catalog prices authoritative on the server.
- Use a server-side Gemini API call for natural-language interpretation and useful, product-specific recommendation explanations. Use only products from the server-owned catalog; the model may select/re-rank allowed product IDs but must never invent items or prices. Enforce budget again in trusted server code after the model response. Handle missing API key, provider errors, malformed responses, empty matches, and loading states with clear user messages. Never place GEMINI_API_KEY in client code. Use an environment variable named GEMINI_API_KEY and document how to configure it.
- For purchase, preserve a standard PayPal Sandbox checkout with server-side order creation and capture. Product ID/price validation must happen on the server, never trust price supplied by browser. Use PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET as server-side environment variables. Implement a clearly separated PayPal login/redirect checkout.
- Also build a separate PayPal Advanced Card Fields area only using the current officially supported PayPal JS SDK/API pattern, with a server-side client-token endpoint if needed and the same server-authoritative order/capture endpoints. Do not fake card payments or show success unless PayPal returns a completed capture. If this integration cannot be fully verified without Sandbox credentials/merchant eligibility, keep it isolated behind a disabled/unavailable state and clearly document remaining configuration; do not break redirect checkout.
- Add obvious demo disclosure that prices/products are sample catalog data and checkout is PayPal Sandbox only until explicitly configured for production. No real payments, no fabricated reviews or claims.
- Add accessible input labels, keyboard focus states, useful validation, mobile-responsive layout, product comparison context, payment loading/failed/cancelled/success states, and a small transparent “How CartWise chooses” note explaining that recommendations are restricted to the demo catalog.
- Prioritize functional, typed code and verify the build/typechecks if available. Do not deploy/publish automatically. Do not ask for secrets in chat; use secure environment/secrets configuration. Summarize what is actually implemented versus what still needs credentials or Sandbox testing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7c5e97bb-cbcd-41e4-a8c2-1c3b3b0512bc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
