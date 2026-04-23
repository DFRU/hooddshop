# Hood'd Project Handoff — Session State as of 2026-04-23

This document captures the complete project state so a new Cowork session on a different machine can resume without loss of context. Written by the Cowork session on the "Maximus Node 1" machine.

---

## 1. Project Overview

**hooddshop.com** — World Cup 2026 car hood cover e-commerce site. Customers pick their nation, see the product on various vehicles, and buy a stretch-fit car hood cover ($49.99) fulfilled via Printkk print-on-demand.

48 nations. Two variants per nation (Home/Away) = 96 total SKUs. All products live on Shopify. The storefront is a custom Next.js app (not Shopify's theme engine). See `TWO-SIZE-VARIANT-SPEC.md`.

---

## 2. Repository Layout

### hooddshop (Next.js storefront)

- **GitHub:** `https://github.com/DFRU/hooddshop.git`
- **Branch:** `main` (latest merged: `582fe79`; pending PRs: `chore/f-01-remove-made-in-usa` @ `6f8e7e4`, `feat/two-variant-selector` @ `df7cc9b`, `feat/email-draw-system` @ `156d272`)
- **Stack:** Next.js 16 (App Router), React 19, Tailwind 4, TypeScript 5
- **Hosting:** Vercel (deployed with all env vars)

Key directories:

```
hooddshop/
  app/
    products/[handle]/page.tsx      — Product detail (server component, reads ?variant= param)
    products/[handle]/ProductDetailClient.tsx — Client gallery + add-to-cart (multi-variant aware)
    shop/page.tsx                   — All-products grid
    nations/page.tsx                — Nation picker by region
    official-rules/page.tsx         — Weekly draw sweepstakes legal rules
    privacy/page.tsx, terms/page.tsx, returns/page.tsx — Legal pages
    page.tsx                        — Homepage (Ticker, Hero, ConceptShowcase, MailingListCTA, TrustStrip, TrendingProducts, FeaturedNations, HowItWorks, WeeklyDraw, CtaBanner)
    api/subscribe/route.ts          — Email capture POST endpoint (Neon DB)
    api/unsubscribe/route.ts        — One-click unsubscribe GET endpoint
    api/admin/draw/route.ts         — Weekly draw admin (create/enter-all/run)
    api/admin/broadcast/route.ts    — Email broadcast admin (send to all subscribers)
  components/
    home/Hero.tsx                   — Homepage hero with countdown
    home/EmailCapture.tsx           — Reusable email capture form
    home/WeeklyDraw.tsx             — Draw section with countdown + email entry
    home/MailingListCTA.tsx         — Mid-page mailing list CTA
    product/ProductJsonLd.tsx       — Structured data
    product/VariantSelector.tsx     — Design variant segmented control (a11y radiogroup)
  lib/
    nations.ts                      — 48 nation definitions, code/name mapping
    vehicles.ts                     — Vehicle & mockup image data layer + DESIGN_TYPE_SLUGS
    shopify.ts                      — Storefront GraphQL API client
    design.ts                       — Flag URLs, design tokens
    queries/products.ts             — GraphQL query strings (variants fetch selectedOptions + image)
    db/client.ts                    — Neon Postgres client + migrations (assets, print_jobs, webhook_events, subscribers, draws, draw_entries, broadcasts)
    email/send.ts                   — Resend email integration (gated on RESEND_API_KEY)
  types/
    shopify.ts                      — Shopify type definitions (includes ShopifyVariant with selectedOptions, image, sku)
  public/
    vehicles/                       — 336 WebP images (48 old single + 288 numbered mockups)
```

### hoodd-pipeline-v2 (Build & sync pipeline)

```
hoodd-pipeline-v2/
  config.json                       — All paths, API endpoints, credentials references
  printkk_mockups.json              — CDN hashes for all 48 nations × 6 views
  nations.py                        — Nation code/name mapping (Python side)
  download_mockups.py               — Downloads mockup images from Printkk CDN
  update_hooddshop.py               — Copies images to Next.js public/ + regenerates vehicles.ts
  update_shopify.py                 — Pushes images to Shopify products via Admin API
  run_pipeline.py                   — Orchestrator (runs the above in sequence)
  mockups/                          — Raw downloaded mockup images (JPEG from Printkk)
  webp/                             — Converted WebP files
```

---

## 3. Credentials & API Access

### Shopify

| Key | Where to find |
|-----|---------------|
| Store domain | `hoodd-shop-2.myshopify.com` |
| Storefront token | `hooddshop/.env.local` → `SHOPIFY_STOREFRONT_ACCESS_TOKEN` |
| Admin token | `aurelian-bot/.env` → `SHOPIFY_ADMIN_TOKEN` (also in pipeline `config.json` reference) |
| Client ID | `aurelian-bot/.env` → `SHOPIFY_CLIENT_ID` |
| Client secret | `aurelian-bot/.env` → `SHOPIFY_CLIENT_SECRET` |
| Storefront API version | `2024-10` |

The Next.js app uses the **Storefront** token (read-only, public). The pipeline scripts use the **Admin** token (write access to products/images).

**Do not commit tokens to this repo.** Copy them from the `.env` files on your local machine.

### Printkk (print-on-demand supplier)

| Key | Value |
|-----|-------|
| Dashboard | `https://dashboard.printkk.com` |
| Account email | `dan@hooddshop.com` |
| Account name | Daniel Fruman |
| Tenant ID | `CNYE1T74` |
| CDN base | `https://cdn.printkk.com/imgs/CNYE1T74/design/20260413` |
| Product code | `5K14TS` |

**Auth note:** Printkk uses standard API key/secret authentication (NOT the JWT interception method previously documented). The API key and secret are stored in `.env.local` as Printkk env vars.

### Printkk API endpoints

- **Design list:** `GET /api/pkk-design/design/list?current={page}&designCategoryId=0&keyword=&isArchived=0&designType=&size=20`
  - Returns `{ data: { records: [...], total: N } }`
  - 6 pages × 20 items = 111 designs total (48 unique nations + duplicates + test designs)
  - Each record: `imageList[0].children` = array of 6 CDN URLs (one per mockup view)

### Environment files

- `hooddshop/.env.local` — Storefront tokens for Next.js (SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN, plus NEXT_PUBLIC_ variants)
- `aurelian-bot/.env` — Master env with Admin token, GitHub PAT, OpenAI key, etc.

**On GEEKOM:** You will need to recreate `.env.local` in the hooddshop clone and update `config.json` paths in hoodd-pipeline-v2 to match the new machine's directory structure.

---

## 4. Image Architecture

Two image sources per nation:

### A. AI-generated vehicle renders

Path: `/public/vehicles/{code}_{vehicleType}.webp` (e.g., `us_suv.webp`)
- Created earlier in the project via AI image generation
- 1200×900 WebP
- Vehicle types: sedan, suv, truck, hatchback, crossover
- Not all nations have all types (see `VEHICLE_MAP` in `vehicles.ts`)

### B. Printkk product mockups

Path: `/public/vehicles/{code}_mockup_{0-5}.webp` (e.g., `us_mockup_0.webp`)
- Downloaded from Printkk CDN, converted to WebP
- 1200×1200 WebP
- 6 views per nation:
  - `0` = Front SUV
  - `1` = Size Info (excluded from product gallery)
  - `2` = Outdoor 3/4 view
  - `3` = Close-up detail
  - `4` = Side angle
  - `5` = White car

There are also legacy single-mockup files (`{code}_mockup.webp`) from before the 6-view expansion. These are not referenced by current code but still exist in the repo. Safe to delete in a cleanup pass.

### How images are used

- **Product page:** Shows mockup views 0, 2, 3, 4, 5 (skips view 1 = size info), then AI renders
- **Hero:** Uses `getHeroVehicleImage("us")` which returns mockup view 0 (front SUV)
- **Showcase grid:** Uses `getShowcaseImages()` which picks different view indices per nation for variety
- **Shopify product listings:** All 6 mockup views uploaded via Admin API (288 images total, 6 per product)

### Type discrimination pattern

Components distinguish between `MockupImage` and `VehicleImage` using:
```typescript
"vehicleName" in img  // true for VehicleImage, false for MockupImage
```
This is used in Hero.tsx and VehicleShowcase.tsx for the subtitle text.

---

## 5. Shopify Product State

- 48 products, one per nation
- Title format: `HOOD'D | {Nation Name} {emoji} Jersey Line`
- Handle format: `hoodd-{nation-name}-{emoji}-jersey-line`
- Price: $49.99 (all products)
- Each product has exactly 6 images (the Printkk mockup views)
- Products are connected to Printkk for fulfillment

### Nation code ↔ Shopify title mapping

Most nations match by name. Exceptions are in `CODE_TO_TITLE` in `nations.ts`:
- `us` → "USA"
- `gb-eng` → "England"
- `gb-sct` → "Scotland"
- `kr` → "South Korea"
- `cz` → "Czechia"
- `ba` → "Bosnia"
- `cd` → "DR Congo"
- `ci` → "Ivory Coast"
- `za` → "South Africa"
- `sa` → "Saudi Arabia"
- `cv` → "Cape Verde"
- `cw` → "Curaçao"
- `nz` → "New Zealand"

---

## 6. Pipeline Scripts — What Each Does

### download_mockups.py

Downloads mockup images from Printkk CDN using hashes in `printkk_mockups.json`.

```bash
python download_mockups.py                    # all nations, all views
python download_mockups.py --nations us,br    # specific nations
python download_mockups.py --views 0,2,4      # specific views only
```

Output: JPEG files in `mockups/` directory, named `{code}_mockup_{0-5}.jpg`

### update_hooddshop.py

1. Converts mockup JPEGs to WebP
2. Copies to `hooddshop/public/vehicles/`
3. Regenerates `lib/vehicles.ts` with current nation/view data

```bash
python update_hooddshop.py                    # all nations
python update_hooddshop.py --nations us,br    # specific nations
```

### update_shopify.py

Pushes mockup images to Shopify product listings via Admin REST API.

```bash
python update_shopify.py --mode replace                    # all nations, replace existing
python update_shopify.py --mode replace --nations us,br    # specific nations
python update_shopify.py --mode append                     # add without deleting existing
```

**Rate limiting:** 0.6s between each image upload. With 6 images per product, budget ~4s per nation. Batch in groups of 2-3 nations to stay under process timeouts.

### run_pipeline.py

Orchestrates all three steps in sequence. Not always used — individual scripts are often run separately.

---

## 7. config.json Path Mapping

The pipeline's `config.json` has absolute Windows paths. On GEEKOM, update these:

```json
{
  "paths": {
    "source_images": "<GEEKOM path to hoodd-images>",
    "upscaled_images": "<GEEKOM path to hoodd-images/upscaled>",
    "mockups_dir": "<GEEKOM path to hoodd-pipeline-v2/mockups>",
    "webp_output": "<GEEKOM path to hoodd-pipeline-v2/webp>",
    "hooddshop_root": "<GEEKOM path to hooddshop>",
    "hooddshop_vehicles": "<GEEKOM path to hooddshop/public/vehicles>",
    "env_file": "<GEEKOM path to .env with SHOPIFY_ADMIN_TOKEN>"
  }
}
```

---

## 8. Known Issues & Gotchas

1. **Printkk auth:** Uses standard API key/secret (stored in `.env.local`). The downloaded `printkk_mockups.json` has all CDN hashes — CDN URLs are public and don't require auth.

2. **Shopify Admin rate limits:** ~2 requests/second for image operations. The 0.6s sleep in `update_shopify.py` handles this, but bulk operations on all 48 products take ~4 minutes.

3. **Legacy single mockup files:** `{code}_mockup.webp` (no view number) still exist in `public/vehicles/`. Not referenced by current code. Safe to delete but haven't been cleaned up yet.

4. **Vercel deployment:** Now configured and deployed with all 12 env vars. Auto-deploys on `git push` to `main`.

5. **TypeScript union discrimination:** Hero.tsx and VehicleShowcase.tsx use `"vehicleName" in img` to tell MockupImage from VehicleImage. If either type changes, this pattern must be preserved.

6. **Next.js ISR cache:** Shopify data revalidates every 60 seconds (server-side). Client-side fetches use no-store.

---

## 9. What's Been Completed

### Phase 4 (Pipeline & Images)
1. Captured all 48 nation designs from Printkk API (6 mockup views each = 288 total)
2. Downloaded all 288 mockup images from Printkk CDN
3. Converted to WebP, copied to `public/vehicles/`
4. Updated `vehicles.ts` with `MockupView` type, `getMockupImages()`, diverse showcase
5. Updated product page to show 5 mockup views + AI renders in gallery
6. Pushed all 288 images to Shopify (6 per product, all 48 products verified)

### Phase 5 (Web Cowork Session — 2026-04-15 to 2026-04-23)
1. Full site audit (`AUDIT-2026-04-15.md`) — 28 findings ranked P0-P3
2. F-01 (P0): Deleted `MadeInUSA.tsx` + `lib/geo.ts` (hard-rule violation). Rewrote `middleware.ts` JSDoc to document its actual role (feed