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

## What Is Done
- **Shopify API connected** — all env vars set in `.env.local` and on Vercel (12+ total). Store domain: `hoodd-shop-2.myshopify.com`.
- **Products uploaded** — 48 nations, assets via catalog upload pipeline. See `TWO-SIZE-VARIANT-SPEC.md`.
- **Database provisioned** — Neon Postgres with tables: `assets`, `print_jobs`, `webhook_events`, `subscribers`, `draws`, `draw_entries`, `broadcasts`.
- **Shopify webhooks registered** — `orders/paid` and `orders/cancelled` via Shopify Admin UI.
- **Vercel deployed** — redeployed with all env vars.
- **PDP wired** — `getProduct(handle)` fetches real Shopify data. `_fulfillment_option` cart attribute fully implemented.
- **MadeInUSA cleanup** — `MadeInUSA.tsx` and `lib/geo.ts` deleted. `middleware.ts` JSDoc corrected. Zero "Made in USA" strings in source (excluding audit/prompt docs).
- **Two-variant PDP** — `ShopifyVariant` type, GraphQL queries fetch `selectedOptions` + `image`, `VariantSelector.tsx`, `?variant=` deep-linking. Gallery shows all designs as thumbnails.
- **Email capture** — `EmailCapture.tsx` component, `POST /api/subscribe`, Neon `subscribers` table, welcome email via Resend (gated on API key).
- **Weekly draw** — `WeeklyDraw.tsx` countdown, admin draw API (create/enter-all/run), winner + runner-up emails, official rules page.
- **Broadcast system** — `POST /api/admin/broadcast`, dry-run mode, rate-limited sending.
- **Legal pages** — `/privacy`, `/terms`, `/returns`, `/official-rules`.
- **Security headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy all configured in `next.config.ts`. CSP covers GA, GTM, Meta Pixel, Shopify Storefront API, flagcdn. Uses `'unsafe-inline'` for script-src (Next.js hydration); nonce-based CSP is a P2 follow-up.
- **SEO foundations** — Structured data (JSON-LD), meta tags, Open Graph, sitemap.ts, robots.ts all implemented.
- **Social media content** — 8 nation post images (1080x1080), captions, influencer DM outreach kit (15 targets), TikTok content kit (10 video scripts), YouTube Shorts kit, Facebook kit. All in `social-media-posts/`.
- **Instagram @hooddshopnow** — Business account, email confirmed, bio + display name set.
- **YouTube @hooddshopnow** — Brand channel created, description set, "Shop Now" link to hooddshop.com. Channel ID: UCxAcIXTM7F3HIpXRRbaa0Ag.
- **Facebook Hood'd Shop** — Business Page created, category "Shopping & retail", bio + website set, hours "Always open". Page ID: 61563693766586.

## What Is NOT Done (Remaining Gaps)
1. **Upload pipeline B2 (Printkk file delivery)** — remains open. See `UPLOAD-PIPELINE-SPEC.md` (v0.3).
2. **Shopify two-variant migration** — Admin API script to add Home/Away variants to 48 products. Blocked on Away asset generation.
3. **Resend setup** — `RESEND_API_KEY` not yet configured. Emails log to console until set.
4. **P1 sweep** — CartDrawer a11y, dead `reverse` param, a11y labels. Spec pending.
5. **Nonce-based CSP** — Replace `'unsafe-inline'` in script-src with per-request nonces via middleware. P2.
6. **Meta Pixel setup** — `NEXT_PUBLIC_META_PIXEL_ID` env var not yet set on Vercel. Code is in place (Analytics.tsx).
7. **Google Analytics setup** — `NEXT_PUBLIC_GA_ID` env var not yet set on Vercel. Code is in place (Analytics.tsx).
8. **Social media manual actions** — Dan needs to: post 8 IG images from phone, send 15 influencer DMs, create TikTok account, upload profile pics/banners to YouTube + Facebook. YouTube and Facebook accounts already created. See `social-media-posts/PROGRESS.md`.

## Key Files
- `SUPPLIER-ENGINE-BUILD-SPEC.md` — Full supplier engine specification (already implemented)
- `TWO-SIZE-V