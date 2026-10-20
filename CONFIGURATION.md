# CartWise AI configuration

Add these in Project Settings → Secrets (server-side only):

| Name | Purpose |
| --- | --- |
| GEMINI_API_KEY | Google AI Studio key for shortlist interpretation (gemini-2.5-flash). |
| PAYPAL_CLIENT_ID | PayPal Developer Sandbox REST app client ID. |
| PAYPAL_CLIENT_SECRET | Sandbox REST app secret. |
| PAYPAL_CARD_FIELDS_ENABLED | Set to `true` only after Advanced Card Processing is enabled for the Sandbox account. |

All PayPal calls target https://api-m.sandbox.paypal.com. Switching to live requires changing the base URL and SDK credentials deliberately.
