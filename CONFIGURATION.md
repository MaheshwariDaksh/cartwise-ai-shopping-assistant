# CartWise AI configuration

AI shortlists run on Lovable AI — no key setup needed; it's managed by the platform.

Add these in Project Settings → Secrets (server-side only):

| Name | Purpose |
| --- | --- |
| PAYPAL_CLIENT_ID | PayPal Developer Sandbox REST app client ID. |
| PAYPAL_CLIENT_SECRET | Sandbox REST app secret. |
| PAYPAL_CARD_FIELDS_ENABLED | Set to `true` only after Advanced Card Processing is enabled for the Sandbox account. |

All PayPal calls target https://api-m.sandbox.paypal.com. Switching to live requires changing the base URL and SDK credentials deliberately.
