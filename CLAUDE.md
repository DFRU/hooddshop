@AGENTS.md

# Hood'd Shop — Claude Code Context

## Project Overview
hooddshop.com — Custom sublimation-printed stretch polyester-spandex car hood covers for FIFA World Cup 2026. Next.js 16 + React 19 + Tailwind v4 + Shopify Storefront API. Deployed on Vercel.

## Tech Stack (ACTUAL — do not assume older versions)
- **Next.js 16.2.2** (App Router) — NOT 14. Read `node_modules/next/dist/docs/` for API differences.
- **React 19.2.4** — uses new React 19 patterns
- **Tailwind CSS v4** — @tailwindcss/postcss, NOT v3 config-based
- **Shopify Storefront API** (GraphQL) — lib/shopify.ts
- **Vercel** deployment

## What Already Exists
- Full storefront scaffold: home, shop, nations, products/[handle], about pages
- Cart system: CartContext + CartDrawer + Shopify cart mutations (lib/cart.ts, lib/queries/cart.ts)
- **Supplier geo-routing engine (COMPLETE):**
  - `lib/suppliers/` — types, constants, repository, geo (Haversine), pricing, router (weighted scoring)
  - `lib/data/suppliers.json` — 17 suppliers with coordinates, pricing, capabilities
  - `app/api/suppliers/options/route.ts` — Edge runtime API endpoint
  - `app/api/suppliers/admin/route.ts` — Protected admin endpoint
  - `components/product/FulfillmentSelector.tsx` — Customer-facing UI (already wired into PDP)
- Nation catalog: lib/nations.ts + NationCard + NationFilterSheet

## What Is Done (Previously Gaps — Now Resolved)
- **Shopify API connected** — all env vars set in `.env.local` and on Vercel (12 total). Store domain: `hoodd-shop-2.myshopify.com`.
- **Products uploaded** — 48 nations × 2 variants (Home/Away) = 96 assets via catalog upload pipeline. See `TWO-SIZE-VARIANT-SPEC.md`.
- **Database provisioned** — Neon Postgres with tables: `assets`, `print_jobs`, `webhook_events`. Migrations run.
- **Shopify webhooks registered** — `orders/paid` and `orders/cancelled` via Shopify Admin UI (shpat_ token lacks order scopes, so registration is manual). Signing secret set in `SHOPIFY_WEBHOOK_SECRET`.
- **Vercel deployed** — redeployed with all env vars.

## What Is NOT Done (Remaining Gaps)
1. **Cart add-to-cart** may still be stubbed — the `_fulfillment_option` cart attribute was commented out in `app/products/[handle]/page.tsx`
2. **Upload pipeline B2 (Printkk file delivery)** — remains open. See `UPLOAD-PIPELINE-SPEC.md` (v0.3).

## Key Files
- `SUPPLIER-ENGINE-BUILD-SPEC.md` — Full supplier engine specification (already implemented)
- `TWO-SIZE-VARIANT-SPEC.md` — Two-variant (Home/Away) product spec
- `UPLOAD-PIPELINE-SPEC.md` (v0.3) — Catalog upload pipeline spec (B2 still open)
- `BRAND-VOICE-GUIDE.md` — Brand voice guide
- `LEGAL-PAGES-COPY.md` — Legal pages copy
- `../world-cup-hoods/suppliers-repository.json` — Extended supplier data (17 suppliers)
- `../world-cup-hoods/product-specs.md` — Product specifications
- `../world-cup-hoods/print-specs.md` — Print file specifications per supplier

## Env Vars (All Set — 12 total in .env.local and Vercel)
```env
SHOPIFY_STORE_DOMAIN=hoodd-shop-2.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<set>
SUPPLIER_ADMIN_TOKEN=<set>
SHOPIFY_WEBHOOK_SECRET=<set — admin UI signing key>
# Plus 8 more (database, Printkk, etc.) — see .env.local
```

## Brand Design System
- Dark theme: bg `#0A0A0A`, surface `#141414`, accent `#FF4D00`
- Fonts: Bebas Neue (display), DM Sans (body)
- Mobile-first. All touch targets >= 44px. Use `100svh` not `100vh`.
- See `hooddshop-build-spec.md` in Downloads folder for full design spec.
