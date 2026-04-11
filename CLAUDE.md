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

## What Is NOT Done (Key Gaps)
1. **Shopify API not connected** — `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` env vars not set. All product data is placeholder.
2. **Product detail page** uses hardcoded placeholder — needs real Shopify product data via `getProduct(handle)` query
3. **Cart add-to-cart** is stubbed — the `_fulfillment_option` cart attribute is commented out in `app/products/[handle]/page.tsx` (lines 22-34)
4. **Shop page** needs real Shopify collection/product data
5. **No build tested** — run `npm run build` to verify no type errors

## Key Files
- `SUPPLIER-ENGINE-BUILD-SPEC.md` — Full supplier engine specification (already implemented)
- `../world-cup-hoods/suppliers-repository.json` — Extended supplier data (17 suppliers)
- `../world-cup-hoods/product-specs.md` — Product specifications
- `../world-cup-hoods/print-specs.md` — Print file specifications per supplier

## Env Vars Required
```env
SHOPIFY_STORE_DOMAIN=hooddshop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<needs to be generated in Shopify Admin>
SUPPLIER_ADMIN_TOKEN=<any secure random string>
```

## Brand Design System
- Dark theme: bg `#0A0A0A`, surface `#141414`, accent `#FF4D00`
- Fonts: Bebas Neue (display), DM Sans (body)
- Mobile-first. All touch targets >= 44px. Use `100svh` not `100vh`.
- See `hooddshop-build-spec.md` in Downloads folder for full design spec.
