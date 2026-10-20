<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## CartWise rules
- Product catalog lives in src/lib/catalog.ts and is the only source of prices; server functions look up prices by ID and never accept prices from the client.
- AI output passes through finalizeShortlist (src/lib/shortlist-logic.ts) which drops unknown IDs and enforces budget; keep this trusted post-filter.
- PayPal calls go to Sandbox in src/lib/paypal.functions.ts; card fields stay disabled unless PAYPAL_CARD_FIELDS_ENABLED=true.
