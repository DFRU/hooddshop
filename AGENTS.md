<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Current Project State (as of 2026-04-16)

- **Shopify connected:** Store domain `hoodd-shop-2.myshopify.com`. All 12 env vars set in `.env.local` and Vercel.
- **Catalog uploaded:** 48 nations x 2 variants (Home/Away) = 96 assets. Dry-run passed (0 errors), live upload complete.
- **Database:** Neon Postgres — tables: `assets`, `print_jobs`, `webhook_events`. Migrations run.
- **Webhooks:** `orders/paid` and `orders/cancelled` registered via Shopify Admin UI (shpat_ token lacks order scopes). Signing secret set.
- **Printkk auth:** Standard API key/secret (NOT JWT interception).
- **Vercel:** Deployed with all env vars.
- **Open item:** Upload pipeline B2 (Printkk file delivery) remains open. See `UPLOAD-PIPELINE-SPEC.md` v0.3.
- **Key specs:** `TWO-SIZE-VARIANT-SPEC.md`, `BRAND-VOICE-GUIDE.md`, `LEGAL-PAGES-COPY.md`
