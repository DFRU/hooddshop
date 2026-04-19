# Hood'd Shop — Two-Variant (Home / Away) Catalog Spec

**Status:** Draft v0.1
**Author:** CEO session
**Date:** 2026-04-15
**Audience:** Web cowork (engineering implementation)
**Depends on:** `UPLOAD-PIPELINE-SPEC.md` §10.2 (upload script), §5.2 (metafields)

---

## 1. Objective

Restructure the Shopify catalog from 48 single-design products (one per nation) to 48 products with 2 Shopify variants each (Home and Away), totaling **96 purchasable SKUs** at launch.

The `abbrev`, `full`, and `flag` design variants exist as generated assets but are **held back** from the evergreen catalog. They serve as exclusive asset inventory for limited-edition drops (see `hoodd-limited-drops-strategy.html`).

## 2. Current State (as of 2026-04-15)

| Attribute | Value |
|---|---|
| Products live | 48 (one per qualified WC 2026 nation) |
| Title format | `HOOD'D \| {Nation Name} {emoji} Jersey Line` |
| Handle format | `hoodd-{nation-name}-{emoji}-jersey-line` |
| Price | $49.99 USD flat |
| Variants per product | 1 (default variant, no option selector) |
| Images per product | 6 (mockups from Printkk) |
| Product code (Printkk) | `5K14TS` (universal — all nations, same blank) |
| Print file dims | 9448×7086 PNG |

## 3. Target State

### 3.1 Shopify Product Structure

Each nation remains **one Shopify product** with **two Shopify variants** (Home, Away). This is preferable to 96 separate products because:

1. **UX:** Single PDP with a variant selector. Customer sees both designs side-by-side without navigating away.
2. **SEO:** One canonical URL per nation accumulates authority. `/products/hoodd-argentina-jersey-line` ranks better than splitting across two pages.
3. **Collection management:** 48 products in the "All Nations" collection, not 96.
4. **Cart clarity:** Line items show "Argentina — Home" vs. separate product titles.
5. **Drop exclusives stay separate:** Drop products are created as independent products (per `UPLOAD-PIPELINE-SPEC.md` §8.1), so they do not pollute the evergreen parent.

### 3.2 Variant Option

| Shopify field | Value |
|---|---|
| Option name | `Design` |
| Option values | `Home`, `Away` |

Do **not** use "Size" or "Style" — `Design` is the accurate label and avoids customer confusion if a physical sizing option is ever added later.

### 3.3 Naming

| Field | Format | Example (Argentina) |
|---|---|---|
| Product title | `HOOD'D \| {Nation Name} {emoji} Jersey Line` | `HOOD'D \| Argentina 🇦🇷 Jersey Line` |
| Product handle | `hoodd-{nation-slug}-jersey-line` | `hoodd-argentina-jersey-line` |
| Variant 1 title | `Home` | `Home` |
| Variant 2 title | `Away` | `Away` |
| Variant 1 SKU | `{NATION_CODE}-HOME` | `AR-HOME` |
| Variant 2 SKU | `{NATION_CODE}-AWAY` | `AR-AWAY` |

**SKU format notes:**
- `NATION_CODE` uses the uppercase ISO 3166-1 alpha-2 code from `lib/nations.ts` (e.g. `AR`, `BR`, `US`).
- Exception: England = `GB-ENG-HOME` / `GB-ENG-AWAY`, Scotland = `GB-SCT-HOME` / `GB-SCT-AWAY` (matching `lib/nations.ts` codes `gb-eng`, `gb-sct`).
- SKU is the lookup key for print-file routing. It must be unique across the catalog.

### 3.4 Pricing

| Variant | Price |
|---|---|
| Home | $49.99 USD |
| Away | $49.99 USD |

Both variants are the same price. No differentiation. If pricing changes, it changes at the product level (applies to both).

### 3.5 Inventory

| Variant | `inventory_quantity` | `inventory_policy` |
|---|---|---|
| Home | 9999 | `continue` (oversell allowed — POD has no stock constraint) |
| Away | 9999 | `continue` |

Shopify's `continue` policy means the product never shows "sold out." This is correct for POD evergreen products. Drop products (separate) use `deny` with hard caps.

### 3.6 Images

Each variant should have its own image set. Shopify allows variant-specific images via the `image_id` association on the variant.

| Image slot | Content | Source |
|---|---|---|
| Variant image (primary) | Main mockup showing the design on a hood | Printkk mockup or AI-generated mockup |
| Gallery images (product-level) | Up to 6 images showing both designs, detail shots, lifestyle | Existing 6 images per product can be retained and supplemented |

**Migration approach:** The current 6 images per product were generated for the single (Home) design. When Away designs are generated, add their mockup images and assign the correct `image_id` to each variant.

### 3.7 Metafields (per variant)

Per `UPLOAD-PIPELINE-SPEC.md` §5.2, each **variant** (not just the product) carries:

```
namespace: "hoodd"
key: "asset_id"          type: single_line_text   value: "{nation_code}_{variant_name}_{generation}"
key: "print_file_url"    type: single_line_text   value: "<blob URL to 9448×7086 PNG>"
key: "product_code"      type: single_line_text   value: "5K14TS"
key: "generation_run"    type: single_line_text   value: "production_v2"
```

Example for Argentina:

| Variant | `asset_id` | `print_file_url` |
|---|---|---|
| Home | `ar_home_v1` | `https://blob.vercel-storage.com/.../ar_home_v1.png` |
| Away | `ar_away_v1` | `https://blob.vercel-storage.com/.../ar_away_v1.png` |

The fulfillment worker resolves `line_item.variant_id → variant.metafield["hoodd.asset_id"] → assets.print_file_url`. This is why metafields must be on the **variant**, not the product.

### 3.8 Tags

Product-level tags (unchanged from current):

```
nation:{nation_code}
confederation:{confederation}
region:{region}
wc2026
```

No variant-level tags (Shopify does not support variant tags natively). Variant filtering in the storefront uses the `Design` option value, not tags.

## 4. Migration Plan

### 4.1 Prerequisite: Away Design Assets

Away designs must be generated before migration. The pipeline-v6 generation scripts need to produce `{nation_code}_away_print.png` files at 9448×7086.

**Open question for CEO:** Are Away designs already generated for all 48 nations, or does generation need to happen first? If not yet generated, this blocks the migration.

### 4.2 Migration Steps (Shopify Admin API)

For each of the 48 existing products:

1. **Read** existing product via `GET /admin/api/2025-01/products/{id}.json`
2. **Add variant option:** `PUT /admin/api/2025-01/products/{id}.json` with:
   ```json
   {
     "product": {
       "options": [{ "name": "Design", "values": ["Home", "Away"] }],
       "variants": [
         {
           "option1": "Home",
           "sku": "{CODE}-HOME",
           "price": "49.99",
           "inventory_management": "shopify",
           "inventory_policy": "continue",
           "metafields": [
             { "namespace": "hoodd", "key": "asset_id", "value": "{code}_home_v1", "type": "single_line_text" },
             { "namespace": "hoodd", "key": "print_file_url", "value": "<url>", "type": "single_line_text" },
             { "namespace": "hoodd", "key": "product_code", "value": "5K14TS", "type": "single_line_text" },
             { "namespace": "hoodd", "key": "generation_run", "value": "production_v1", "type": "single_line_text" }
           ]
         },
         {
           "option1": "Away",
           "sku": "{CODE}-AWAY",
           "price": "49.99",
           "inventory_management": "shopify",
           "inventory_policy": "continue",
           "metafields": [
             { "namespace": "hoodd", "key": "asset_id", "value": "{code}_away_v1", "type": "single_line_text" },
             { "namespace": "hoodd", "key": "print_file_url", "value": "<url>", "type": "single_line_text" },
             { "namespace": "hoodd", "key": "product_code", "value": "5K14TS", "type": "single_line_text" },
             { "namespace": "hoodd", "key": "generation_run", "value": "production_v1", "type": "single_line_text" }
           ]
         }
       ]
     }
   }
   ```
3. **Upload Away preview image** via `POST /admin/api/2025-01/products/{id}/images.json`
4. **Associate variant images** via `PUT` on each variant with the correct `image_id`
5. **Verify** metafields created correctly via `GET /admin/api/2025-01/variants/{id}/metafields.json`

### 4.3 Rollback

If migration fails partway:
- Products with a single (default) variant are unchanged.
- Products that received the update can be reverted by removing the second variant via Admin API.
- No data loss risk — we are adding, not deleting.

### 4.4 Script Flag

The upload script (`scripts/upload_catalog.ts`) should support:

```
--migrate-existing    # Adds Away variant to existing 48 products (one-time migration)
--variants home,away  # Standard flag from UPLOAD-PIPELINE-SPEC.md §10.2
```

## 5. Storefront Impact

### 5.1 PDP Changes

The product detail page (`app/products/[handle]/page.tsx`) needs a **variant selector** when the product has more than one variant. Implementation:

- Render a segmented control or button group labeled "Design" with options "Home" / "Away"
- On selection change, update:
  - Displayed image (swap to variant image)
  - Selected variant ID (for add-to-cart mutation)
  - URL search param `?variant={variantId}` (deep-linkable, shareable)
- Default selection: `Home` (first variant)

### 5.2 Collection / Shop Page

The shop grid (`NationCard` component) currently shows one card per product. With variants, each card still represents one product (one nation). The card image should default to the Home variant mockup. No change to card count.

Optional enhancement (not required for launch): show a small "Home | Away" toggle on hover, or display both mockup thumbnails.

### 5.3 Cart Line Items

Cart line items already display variant titles in Shopify's Storefront API response. A line item for Argentina Away will render as:

```
HOOD'D | Argentina 🇦🇷 Jersey Line — Away
```

No cart code changes required if the existing cart uses `merchandiseId` (variant GID) for add-to-cart, which it should per `lib/cart.ts`.

### 5.4 Search & Filtering

The existing `NationFilterSheet` filters by nation. No variant-level filtering needed for launch. If desired later, a "Design: Home / Away" filter can key off the `Design` option value in the Storefront API products query.

## 6. Fulfillment Worker Impact

The worker already resolves `variant_id → metafield → asset_id → print_file_url` per `UPLOAD-PIPELINE-SPEC.md` §6.1. As long as each variant has the correct `hoodd.asset_id` and `hoodd.print_file_url` metafields, no worker code changes are needed. The same `5K14TS` product code is used for all variants (same blank hood cover).

## 7. Asset Naming Convention

| Design variant | `asset_id` pattern | Example |
|---|---|---|
| Home (evergreen) | `{nation_code}_home_v{N}` | `ar_home_v1` |
| Away (evergreen) | `{nation_code}_away_v{N}` | `ar_away_v1` |
| Flag (drop-only) | `{nation_code}_flag_v{N}` | `ar_flag_v1` |
| Abbrev (drop-only) | `{nation_code}_abbrev_v{N}` | `ar_abbrev_v1` |
| Full (drop-only) | `{nation_code}_full_v{N}` | `ar_full_v1` |

`v{N}` increments when a design is regenerated. The `assets` table tracks all versions; `retired_at` soft-retires superseded versions.

## 8. Blockers

| # | Blocker | Owner | Status |
|---|---|---|---|
| B1 | Away designs for all 48 nations must be generated | CEO / pipeline-v6 | Unknown — need confirmation |
| B2 | Shopify Admin API access token required | CEO | Pending (not found on dev machine) |
| B3 | F-01 git push must land before engineering branches off | CEO / web cowork | In progress |

## 9. Out of Scope

- **Physical sizing variants** (S/M/L/XL hood cover sizes). The `5K14TS` product is one-size. If a second size is added later, it becomes a second option axis (`Design` × `Size`), requiring a separate spec.
- **Color variants.** The print is full-sublimation; there is no base-color option.
- **Drop product structure.** Drops are separate products per `UPLOAD-PIPELINE-SPEC.md` §8.1, not variants of the evergreen parent.

---

**Changelog:**
- v0.1 (2026-04-15): Initial draft.
