# Hood'd Shop — Upload & Fulfillment Pipeline Spec

**Status:** Draft v0.2 — CEO-reviewed, open blockers flagged
**Author:** Engineering Cowork (Dan's session)
**Date:** 2026-04-15 (updated 2026-04-15 after CEO review)
**Scope:** End-to-end pipeline from generated design asset → Shopify catalog → customer order → supplier print job → shipped product.

**Related specs:**
- `C:\Dev\hooddshop\DROPS-WEB-SPEC.md` — Drop page frontend (uses `drop:` metafield namespace). This upload pipeline populates those metafields at upload time.
- `C:\Dev\hooddshop\hoodd-limited-drops-strategy.html` — 30-drop calendar (Apr 28 → Jul 19, 2026) driving unit caps, cadence, pricing ($59.99 house, $69.99 creator collab).

---

## 1. Overview

This document specifies the technical architecture for publishing generated hood-cover designs to hooddshop.com (Shopify) and routing resulting orders to print suppliers (Printkk and 17 additional identified vendors) for fulfillment.

The pipeline must support:
- One-time "launch catalog" uploads (48 nations × multiple design variants)
- Limited-edition drops with hard inventory caps
- Order-triggered print job submission to the correct supplier based on the existing geo-routing engine (`lib/suppliers/`)
- Auditability: every print job traceable back to a specific Shopify order line item and a specific print asset version

## 2. Non-Goals (explicit scope exclusions)

- **Payment processing.** Shopify handles checkout and payment capture. This pipeline does not touch payment state.
- **Customer-facing UI changes.** The Next.js storefront already has product pages, cart, and supplier selector. This spec covers backend/admin flows only.
- **Design generation.** The `generate_concept_typo.py` pipeline is upstream and already produces print-ready PNG files.
- **Tax/compliance calculations.** Shopify + supplier handle.
- **Supplier evaluation methodology.** A separate sample-product comparison study covers quality/shipping/pricing across the 17 suppliers. This spec assumes the suppliers exist and have some means of accepting print jobs.

## 3. Requirements

### 3.1 Functional

| # | Requirement |
|---|---|
| F1 | Bulk-upload N design variants per nation to Shopify as products (or variants of a parent product) with preview image, metadata, price, and inventory cap. |
| F2 | Store the full-resolution print file (9448×7086 PNG) in a durable, addressable location. The Shopify product must reference this file via a stable URL or SKU-linked key. |
| F3 | On Shopify `orders/paid` webhook, look up the correct print file for each line item, determine the fulfillment supplier via the existing router, and submit a print job to that supplier's API. |
| F4 | Idempotency: receiving the same webhook N times must submit exactly one print job. |
| F5 | Handle print-job submission failures with retry (exponential backoff) and a dead-letter queue for human review. |
| F6 | When the supplier reports shipment tracking, update the Shopify order fulfillment record with carrier + tracking number. |
| F7 | Support limited-edition drops: inventory caps enforced at Shopify, not at the supplier. When inventory = 0, Shopify stops selling; no action needed on our side. |
| F8 | Admin dashboard (or CLI, phase 1) showing: pending print jobs, failed jobs (with error + retry button), asset inventory, supplier status. |
| F9 | Asset versioning: if a design is regenerated (e.g. `production` → `production_v2`), new orders use the new version; in-flight orders retain the version active when ordered. |
| F10 | **T+2h supplier-submission hold.** Worker must NOT submit a print job to a supplier until 2 hours have elapsed since the Shopify order's `created_at`. This gives customers a cancellation window without supplier cost exposure. Drop-tagged orders skip this hold (drops are final-sale). |
| F11 | **Variant filtering on upload.** Upload script must accept `--variants <list>` to control which asset variants get published. Launch catalog uses `home,away` only; `abbrev/full/flag` are held back as asset inventory for future drop exclusives. |
| F12 | **Cancel on pre-production cancel.** On Shopify `orders/cancelled` webhook, any `print_jobs` row for that order in status `queued` or `submitting` transitions to `canceled`. Rows in `submitted`/`in_production`/`shipped` are not canceled automatically; they require manual reconciliation with supplier. |
| F13 | **Analytics emission.** Worker emits `print_job_submitted` (and sibling) events to the same analytics layer that `DROPS-WEB-SPEC.md §Analytics Events` uses. No new provider. |

### 3.2 Non-Functional

| # | Requirement | Target |
|---|---|---|
| NF1 | Webhook-to-print-job latency (p95) | < 60 seconds |
| NF2 | Print job submission reliability | ≥ 99.5% success within 3 retries |
| NF3 | Order-print mapping durability | 100% — no lost orders even during outages |
| NF4 | Bulk catalog upload throughput | ≥ 10 products/minute (sustainable against Shopify rate limits) |
| NF5 | Observability | Every order has a traceable log chain from webhook receipt → supplier response |
| NF6 | Cost | Runs on Vercel free/hobby tier plus one external DB and one file store; target <$50/mo infra until volume warrants more |

### 3.3 Constraints

- **Stack:** Next.js 16 on Vercel. Existing `lib/suppliers/` router, `lib/shopify.ts`, `lib/cart.ts` must be respected (not rewritten).
- **No existing payment data:** Shopify is authoritative.
- **Single-person team:** Implementation complexity must match solo operational capacity.
- **Print file size:** ~30–50 MB per asset, 144+ assets in v2 alone = ~6 GB. Will grow.

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PUBLISH PATH (one-time + drops)              │
└─────────────────────────────────────────────────────────────────────┘

  generated PNGs          ┌───────────────┐       ┌────────────────┐
  (production_v2/)  ───►  │ upload_catalog │ ───► │ Asset Store     │
                          │  (CLI script)  │      │ (Vercel Blob /  │
                          └───────┬───────┘       │  S3 / R2)       │
                                  │               └────────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │  Shopify Admin │
                          │  API (products,│
                          │  variants, img)│
                          └───────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         FULFILLMENT PATH (per order)                 │
└─────────────────────────────────────────────────────────────────────┘

  Customer order       ┌──────────────┐    ┌────────────────────┐
     on Shopify ──────►│   Shopify    │───►│  webhook receiver  │
                       │   checkout   │    │  /api/webhooks/    │
                       └──────────────┘    │  shopify/orders    │
                                           └──────────┬─────────┘
                                                      │
                                              verify HMAC
                                              check idempotency
                                                      │
                                                      ▼
                                           ┌────────────────────┐
                                           │   Job Queue        │
                                           │  (DB-backed; or    │
                                           │   Upstash QStash)  │
                                           └──────────┬─────────┘
                                                      │
                                                      ▼
                                           ┌────────────────────┐
                                           │  worker (cron or   │
                                           │  queue consumer)   │
                                           └──────────┬─────────┘
                                                      │
                                      ┌───────────────┼────────────────┐
                                      ▼               ▼                ▼
                                 ┌─────────┐   ┌────────────┐   ┌────────────┐
                                 │ router  │   │  asset     │   │  supplier  │
                                 │  (geo)  │   │  lookup    │   │  dispatch  │
                                 └─────────┘   └────────────┘   └─────┬──────┘
                                                                      │
                                                                      ▼
                                                         ┌──────────────────────┐
                                                         │  Printkk API  OR     │
                                                         │  Supplier N API/email│
                                                         └──────────┬───────────┘
                                                                    │
                                                                    ▼
                                                         ┌──────────────────────┐
                                                         │  tracking update     │
                                                         │  → Shopify fulfillment│
                                                         └──────────────────────┘
```

### 4.1 Components

| Component | Responsibility | Implementation |
|---|---|---|
| `scripts/upload_catalog.ts` | Bulk-create Shopify products from `production_v2/` directory. Uploads preview image, stores print file in asset store, links via metafield. | Node script, Shopify Admin API |
| Asset Store | Durable, addressable storage for 9448×7086 print PNGs | Vercel Blob (recommended — co-located with app) OR Cloudflare R2 (cheaper at volume) |
| `/api/webhooks/shopify/orders` | HMAC-verified webhook receiver. Fast ack (<1s), enqueues job. | Next.js Route Handler, Vercel Edge or Node runtime |
| Job Queue + DB | Persistent record of every order → print job. Enables idempotency, retries, audit. | PostgreSQL via Neon/Supabase (Vercel-friendly); or Upstash QStash for queue + Neon for state |
| Worker | Consumes queue, runs router, looks up asset, calls supplier API, records result. | Vercel Cron (pulls from DB) OR QStash HTTP callback to `/api/jobs/process` |
| Supplier adapters | One adapter per supplier API (Printkk first, N others later). Normalizes to common interface: `submitJob(printFileUrl, shippingAddress, productSpec) → {providerOrderId, estimatedShipDate}`. | TS module per supplier; common interface in `lib/suppliers/adapters/` |
| Tracking updater | Polls supplier (or receives supplier webhook if supported) for tracking; pushes to Shopify `fulfillments` API. | Vercel Cron every 15–30 min; webhook endpoint if supplier supports |

## 5. Data Model

### 5.1 Database tables (PostgreSQL)

```sql
-- every design variant available for sale
CREATE TABLE assets (
  id              TEXT PRIMARY KEY,              -- e.g. "france_home_v2"
  nation_key      TEXT NOT NULL,                 -- "France"
  variant_name    TEXT NOT NULL,                 -- "home" | "away" | "flag" | "abbrev" | "full"
  generation_run  TEXT NOT NULL,                 -- "production" | "production_v2"
  print_file_url  TEXT NOT NULL,                 -- asset-store URL (9448×7086 PNG)
  preview_url     TEXT NOT NULL,                 -- asset-store URL (1536×1024 PNG)
  shopify_product_id   TEXT,                     -- populated after upload
  shopify_variant_id   TEXT,                     -- if using variants
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at      TIMESTAMPTZ                    -- soft-retire an asset without deleting
);

-- every print-job state machine instance
CREATE TABLE print_jobs (
  id              TEXT PRIMARY KEY,              -- ULID
  shopify_order_id       TEXT NOT NULL,
  shopify_line_item_id   TEXT NOT NULL,
  asset_id        TEXT NOT NULL REFERENCES assets(id),
  supplier_id     TEXT NOT NULL,                 -- matches lib/suppliers
  status          TEXT NOT NULL,                 -- 'queued' | 'holding' | 'submitting' | 'submitted' | 'in_production' | 'shipped' | 'failed' | 'canceled'
  provider_order_id  TEXT,                       -- supplier's order reference
  tracking_carrier   TEXT,
  tracking_number    TEXT,
  attempts        INT NOT NULL DEFAULT 0,
  last_error      TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,          -- shopify_order_id + ':' + line_item_id
  is_drop         BOOLEAN NOT NULL DEFAULT false, -- true if any 'drop:*' tag on the order/product; skips T+2h hold
  ordered_at      TIMESTAMPTZ NOT NULL,          -- Shopify order.created_at — source for T+2h gate
  eligible_for_submit_at TIMESTAMPTZ NOT NULL,   -- = ordered_at + 2h (non-drop) OR ordered_at (drop). Worker only picks up rows past this timestamp.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ
);

CREATE INDEX idx_print_jobs_status ON print_jobs(status) WHERE status IN ('queued','holding','submitting','failed');
CREATE INDEX idx_print_jobs_order  ON print_jobs(shopify_order_id);
CREATE INDEX idx_print_jobs_ready  ON print_jobs(eligible_for_submit_at) WHERE status IN ('queued','holding');

-- webhook audit log
CREATE TABLE webhook_events (
  id              TEXT PRIMARY KEY,              -- Shopify X-Shopify-Webhook-Id header
  topic           TEXT NOT NULL,
  body_hash       TEXT NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL                  -- 'received' | 'processed' | 'rejected'
);
```

**Rationale for DB over queue-only:** We need queryable state (which orders failed? which are in production?). A DB with cron-polled workers is simpler than a separate queue+state system for our volume (<10k orders/yr early). Can add QStash later if latency becomes the constraint.

### 5.2 Shopify product metafield schema

Every Shopify product (or variant) carries these metafields:

```
namespace: "hoodd"
key: "asset_id"          type: single_line_text   value: "france_home_v2"
key: "print_file_url"    type: single_line_text   value: https://...
key: "product_code"      type: single_line_text   value: "5K14TS"   # printkk default
key: "generation_run"    type: single_line_text   value: "production_v2"
key: "returns_policy"    type: single_line_text   value: "final_sale"   # drop products only
```

The worker resolves `line_item.variant_id → variant.metafield.asset_id → assets.print_file_url`.

**`returns_policy` semantics:**
- `final_sale` → product is a limited-edition drop item. No returns/exchanges. Checkout copy and PDP banner must surface this (see `DROPS-WEB-SPEC.md` §Design Direction). Refund handling defaults to denied in ops runbook; any exception requires manual CEO approval.
- Absent or `standard` → normal return window applies (evergreen catalog).

### 5.3 Inventory

Use Shopify's native inventory tracking. For limited drops: set `inventory_quantity` at product creation. When it hits 0, Shopify stops the sale. No custom logic.

## 6. API Contracts

### 6.1 Shopify webhook: `orders/paid`

**Endpoint:** `POST /api/webhooks/shopify/orders`

**Headers:**
- `X-Shopify-Topic: orders/paid`
- `X-Shopify-Hmac-Sha256: <base64>`
- `X-Shopify-Webhook-Id: <uuid>` — used for idempotency

**Flow:**
1. Verify HMAC with `SHOPIFY_WEBHOOK_SECRET`. Reject 401 if invalid.
2. Check `webhook_events` for this `webhook-id`. If present, 200 OK (already processed).
3. Insert `webhook_events` row with `status=received`.
4. For each `line_item` in payload:
   - Resolve `asset_id` from variant metafield.
   - Determine `supplier_id` via existing router (uses customer shipping address).
   - Insert `print_jobs` row with `status=queued`, `idempotency_key=order_id:line_item_id`.
   - If INSERT conflicts on `idempotency_key`, skip (already queued).
5. Update `webhook_events.status=processed`.
6. Return 200 OK.

**Target latency:** <1s acknowledged back to Shopify. All heavy work deferred to worker.

### 6.2 Shopify webhook: `orders/cancelled`

**Endpoint:** `POST /api/webhooks/shopify/orders` (same receiver, switches on `X-Shopify-Topic`)

**Flow:**
1. Verify HMAC and idempotency as in §6.1.
2. Load all `print_jobs` rows for this `shopify_order_id`.
3. Apply the behavior matrix below by current `status`:

| Current status | Action | Reason |
|---|---|---|
| `queued` | `UPDATE status='canceled'` | Not yet picked up by worker; safe to drop. |
| `holding` | `UPDATE status='canceled'` | Still within T+2h hold window; no supplier exposure. |
| `submitting` | `UPDATE status='canceled'` iff `provider_order_id IS NULL`; else treat as `submitted` below | Race with worker; idempotency key protects us. |
| `submitted` | Attempt `adapter.cancelOrder(provider_order_id)`. On success → `canceled`. On failure → leave as `submitted`, insert ops alert row. | Supplier may not have started production; worth trying. |
| `in_production` | **No action.** Log alert; mark order requiring manual reconciliation. Customer refund handled by ops. | Print cost already incurred. |
| `shipped` | **No action.** Ops handles via return-to-sender or write-off. | Physical good in transit. |
| `canceled` / `failed` | No-op (idempotent). | Already terminal. |

4. Emit `print_job_canceled` analytics event for every transitioned row (see §11.5).
5. Return 200 OK.

**Drop orders (is_drop = true):** final-sale policy (per `hoodd.returns_policy=final_sale`) means the customer is not entitled to a refund. However, the webhook still fires on merchant-initiated cancels, fraud holds, or Shopify's own risk engine. Handle the same — cancel what is cancelable, alert on what is not.

### 6.3 Printkk supplier adapter (interface)

**Target interface (all adapters conform):**

```typescript
interface SupplierAdapter {
  readonly id: string;  // matches lib/suppliers
  submitJob(input: PrintJobInput): Promise<PrintJobSubmission>;
  getStatus(providerOrderId: string): Promise<PrintJobStatus>;
  // Optional — for suppliers with webhooks:
  handleWebhook?(headers: Headers, body: unknown): Promise<StatusUpdate>;
}

interface PrintJobInput {
  printFileUrl: string;          // pre-signed asset URL, publicly fetchable for >24h
  productCode: string;           // supplier SKU, e.g. "5K14TS"
  quantity: number;
  shippingAddress: ShippingAddress;
  customerReference: string;     // our print_jobs.id
}

interface PrintJobSubmission {
  providerOrderId: string;
  estimatedShipDate?: string;    // ISO date
  estimatedCostCents?: number;
}

interface PrintJobStatus {
  state: 'accepted' | 'in_production' | 'shipped' | 'delivered' | 'canceled' | 'failed';
  trackingCarrier?: string;
  trackingNumber?: string;
  lastUpdate: string;            // ISO timestamp
}
```

**Printkk-specific implementation notes:**
- **UNKNOWN:** Printkk API endpoint, auth scheme, request format, response format.
- **Needed:** Printkk developer docs URL, API key provisioning, sandbox environment.
- **Print-file delivery:** Does Printkk fetch the URL, or do we upload the file bytes? Affects whether we need pre-signed URLs vs. multipart upload.

### 6.4 Shopify fulfillment API (outbound)

When a job transitions to `shipped`:

```
POST /admin/api/2025-01/fulfillments.json
{
  "fulfillment": {
    "line_items_by_fulfillment_order": [...],
    "tracking_info": {
      "company": "<carrier>",
      "number": "<tracking>",
      "url": "<if available>"
    },
    "notify_customer": true
  }
}
```

## 7. Error Handling & Idempotency

### 7.1 Idempotency layers

| Layer | Mechanism |
|---|---|
| Shopify webhook retries | `webhook_events.id` UNIQUE on `X-Shopify-Webhook-Id` |
| Duplicate line-item insertion | `print_jobs.idempotency_key` UNIQUE on `order_id:line_item_id` |
| Supplier submission retry | Worker checks `print_jobs.provider_order_id IS NULL` before submitting. Supplier should also support idempotency key (if API allows) — set to `print_jobs.id` |

### 7.1b T+2h supplier-submission hold (F10)

**Intent:** absorb the customer cancellation/edit window before we incur a supplier print cost. Measured from `ordered_at` (Shopify `order.created_at`), not webhook receipt time, to avoid penalizing the customer for our latency.

**Rules:**
1. On webhook ingest, the worker sets:
   - `ordered_at = order.created_at` (from Shopify payload)
   - `eligible_for_submit_at = ordered_at + 2h` for evergreen orders
   - `eligible_for_submit_at = ordered_at` for drop orders (`is_drop = true`)
   - Initial `status = 'holding'` for evergreen, `status = 'queued'` for drop orders.
2. Worker poll query: `SELECT ... FROM print_jobs WHERE status IN ('queued','holding') AND eligible_for_submit_at <= now() ORDER BY eligible_for_submit_at LIMIT N`.
3. When a `holding` row passes the gate, worker transitions it to `queued` in the same transaction that claims it for `submitting`.
4. `orders/cancelled` arriving during hold → row goes straight to `canceled`; no supplier call made. This is the primary payoff of the pattern.
5. Drop detection: `is_drop = true` if the Shopify product carries any tag matching `drop:*` OR `hoodd.returns_policy = final_sale`. Both are checked; either triggers the skip.

**Operational overrides:**
- CLI: `npm run admin:jobs --release <print_job_id>` forces `eligible_for_submit_at = now()` for manual acceleration (e.g. customer writes in asking for rush).
- CLI: `npm run admin:jobs --hold <print_job_id> --until <iso>` extends the hold (e.g. fraud review).

**Edge cases:**
- Order created before the hold feature shipped: `ordered_at` missing → worker treats `eligible_for_submit_at = created_at` (row creation time). Backfill script re-computes for any straggler rows.
- Clock skew between Shopify and our DB: treat Shopify `created_at` as authoritative. Trust but don't sanity-clamp; a future-dated `ordered_at` just delays submission, which fails safe.

### 7.2 Retry policy

- **Transient errors** (network timeout, 5xx, rate limit): exponential backoff, max 5 attempts over ~2 hours. `attempts++`, `last_error` recorded.
- **Permanent errors** (4xx, invalid address, print file rejected): no retry. `status=failed`. Alert operator.
- **Poison messages:** after max attempts, transition to `status=failed` with alert.

### 7.3 Failure modes

| Failure | Detection | Response |
|---|---|---|
| Shopify webhook never arrives | Reconciliation cron: query Shopify for recent orders, compare to `print_jobs` | Backfill missing rows |
| Print file URL expired before supplier fetch | Supplier returns 4xx; `last_error` captures | Regenerate pre-signed URL, retry |
| Supplier API down | Transient 5xx detected | Exponential backoff; alert after 30 min |
| Customer cancels after print job submitted | Shopify `orders/cancelled` webhook | Call supplier `cancelOrder` if state permits; else mark `status=canceled` but note production already started; handle refund reconciliation manually |
| Wrong print file sent | Audit log + spot checks | Every submission logs `asset_id` + `print_file_url` → traceable |
| Address invalid | Supplier rejects | `status=failed`, operator contacts customer |

## 8. Limited-Edition Drops

**Source of truth:** the 30-drop calendar in `hoodd-limited-drops-strategy.html` (Apr 28 → Jul 19, 2026). Pricing anchors: $59.99 house drops, $69.99 creator collabs. Frontend contract is defined in `DROPS-WEB-SPEC.md`.

### 8.1 Upload pattern

Run:
```
scripts/upload_catalog.ts \
  --drop <slug> \
  --drop-type house|collab \
  --start-at <iso> --end-at <iso> \
  --assets <csv of asset_ids> \
  --inventory <n> \
  --price <cents> \
  --final-sale
```

Script actions per asset:
1. Create Shopify product, handle prefixed `drop-<slug>-<nation>-<variant>` (matches `DROPS-WEB-SPEC.md` §Edge Cases #5).
2. Set `inventory_quantity = --inventory`, inventory tracking enabled.
3. Tag `drop:<slug>`, `drop-type:<house|collab>`, `nation:<nation>`.
4. Populate `drop:*` metafields per `DROPS-WEB-SPEC.md §Data Model` (`start_at`, `end_at`, `drop_type`, `creator_name`, etc. — flags passed through).
5. Populate `hoodd:*` metafields per §5.2, **including `hoodd.returns_policy=final_sale`** when `--final-sale` is set (default for drops).
6. Insert `assets` row if not already present.

### 8.2 Fulfillment differences vs evergreen

| Behavior | Evergreen | Drop |
|---|---|---|
| T+2h hold (F10) | Applied | **Skipped** — submitted immediately once worker picks up the row |
| Returns | Standard policy | **Final sale** — `hoodd.returns_policy=final_sale` metafield |
| Auto-unpublish | Never | At `drop.end_at` (handled by Shopify Flow or `/api/drops/close` cron per `DROPS-WEB-SPEC.md §Data Model`) |
| Cancel on `orders/cancelled` | Per §6.2 matrix | Same matrix, but customer-initiated refund requests default to denied per final-sale policy |

### 8.3 Edge cases

- **Overselling window:** Shopify's inventory is eventually consistent across storefronts. With a high-concurrency drop, a handful of units may oversell. **Decision (v1):** accept it — manual refund path. Revisit if a single drop oversells by >5 units.
- **Simultaneous drops across nations:** no issue; each product is independent.
- **Waitlist on sold-out items:** out of scope (see `DROPS-WEB-SPEC.md §Out of Scope for v1`).
- **Drop closes while orders are in `holding`:** should not occur — drops skip the hold. If it does (e.g. feature regression), orders already paid for are honored; the close event only affects new purchases.
- **Close-time race:** an order placed in the final seconds before `end_at` that pays after `end_at` is honored (payment is authoritative). The web layer blocks new add-to-cart; checkout grace period is Shopify's.

## 9. Supplier Routing Integration

The existing `lib/suppliers/` geo-routing engine is reused verbatim:

```typescript
import { selectSupplier } from '@/lib/suppliers/router';

const supplier = selectSupplier({
  destination: order.shipping_address,
  productSpec: { type: 'hood-cover', size: 'standard' },
  preferences: {} // from customer's FulfillmentSelector choice, if provided
});
// → supplier.id → supplier adapter
```

**For the 17 additional suppliers:**

Each supplier needs:
1. Entry in `lib/data/suppliers.json` (already done for 17)
2. An adapter module `lib/suppliers/adapters/<id>.ts` implementing `SupplierAdapter`
3. Supplier-specific env vars (`SUPPLIER_<ID>_API_KEY` etc.)

**Adapter phasing:**
- **Phase 1:** Printkk only. Ship v1 with one supplier.
- **Phase 2:** Evaluate 17 suppliers via sample-print study (out of scope for this spec).
- **Phase 3:** Implement adapters for the 2–3 suppliers that pass evaluation. Geo-routing then becomes meaningful.
- **Fallback adapter:** for suppliers without APIs, an "email" adapter that drafts a print-job email with the print-file URL and address, routes to a human queue.

## 10. Asset Lifecycle

### 10.1 Storage

Print files (~50 MB each) go to an asset store. **Recommendation: Vercel Blob** for phase 1 because:
- Native Vercel integration, no additional vendor
- Pre-signed URLs built-in
- Pricing (at time of writing): $0.15/GB stored, $0.30/GB egress. 6 GB × $0.15 = $0.90/mo storage; egress only at print time ≈ negligible at launch.

**When to migrate to R2/S3:** if monthly egress exceeds ~100 GB or storage > 100 GB.

### 10.2 Upload script (`scripts/upload_catalog.ts`)

**Flags:**
- `--source <dir>` — source directory (e.g. `C:\Dev\hooddshop\production_v2\print`)
- `--generation-run <name>` — e.g. `production_v2`
- `--drop <tag>` — optional tag for limited-edition drops
- `--inventory <n>` — inventory cap per variant (default: 9999 for evergreen)
- `--price <cents>` — price in cents (required)
- `--dry-run` — no writes, just print plan
- `--nations <list>` — subset of nations (e.g. `France,Japan,Brazil`). Default: all 48.
- `--variants <list>` — subset of asset variants to publish (e.g. `home,away`). Default for launch catalog: `home,away`. The `abbrev`, `full`, and `flag` variants are **held back from the evergreen catalog** and reserved as asset inventory for future drop-exclusive products. Drop uploads override this default via `--variants flag` etc.
- `--drop <slug>` / `--drop-type` / `--start-at` / `--end-at` / `--final-sale` — see §8.1.

**Steps per asset:**
1. Skip if `assets.id` already exists and not explicitly re-uploading.
2. Upload print file to Vercel Blob → get URL.
3. Upload preview (from `previews/`) to Blob → get URL.
4. Create/update Shopify product with:
   - Title: "{Nation} {Variant} — FIFA World Cup 2026 Hood Cover"
   - Image: preview URL
   - Metafields: as per §5.2
   - Inventory: `--inventory` or default
   - Tags: `nation:{nation}`, `variant:{variant}`, `drop:{drop}` if set
5. Insert `assets` row.
6. Print summary line.

**Rate limits:** Shopify Admin API is ~2 requests/sec on standard plans. Script respects with token-bucket limiter.

### 10.3 Versioning

When `production_v2` supersedes `production`:
- Upload new assets with new `id` (`france_home_v2`)
- Create new Shopify products OR update existing metafields
- Retire v1 assets via `assets.retired_at` (soft-retire — preserves audit trail)
- In-flight orders continue using the `asset_id` captured in `print_jobs.asset_id`, so they get the version they were ordered with.

## 11. Monitoring & Operations

### 11.1 Logs

Every job transition emits a structured log:
```
{ "ts": "...", "print_job_id": "...", "shopify_order": "...", "asset_id": "...",
  "supplier": "...", "event": "submitted" | "failed" | "shipped", "detail": {...} }
```

Vercel's log drain → any log aggregator (Logtail, Axiom).

### 11.2 Alerts

- Any `print_jobs` row in `status=failed` for >1h → email/SMS
- Any `webhook_events` with `status=received` for >5min (not transitioned to `processed`) → alert
- Supplier API error rate >5% over 15 min → alert
- Asset store egress spike >10× baseline → alert

### 11.3 Admin dashboard (Phase 1 = CLI)

```bash
npm run admin:jobs --status=failed
npm run admin:jobs --retry <print_job_id>
npm run admin:orders --date=2026-04-15
```

Phase 2 = small `/admin` page protected by `SUPPLIER_ADMIN_TOKEN` (already exists).

### 11.4 Analytics events (F13)

Emitted to the same analytics layer as `DROPS-WEB-SPEC.md §Analytics Events` (existing `components/layout/Analytics.tsx`). Backend events are published server-side via the same provider; no new vendor.

| Event | Emitted when | Properties |
|---|---|---|
| `print_job_created` | Webhook receiver inserts a new `print_jobs` row | `print_job_id`, `shopify_order_id`, `asset_id`, `supplier_id`, `is_drop`, `drop_slug?` |
| `print_job_submitted` | Adapter returns success, row transitions `submitting → submitted` | `print_job_id`, `supplier_id`, `provider_order_id`, `attempts`, `is_drop` |
| `print_job_failed` | Row transitions to `failed` (terminal) | `print_job_id`, `supplier_id`, `last_error`, `attempts`, `is_drop` |
| `print_job_canceled` | Row transitions to `canceled` via `orders/cancelled` path | `print_job_id`, `supplier_id`, `prior_status`, `is_drop` |
| `print_job_shipped` | Tracking update posts successfully to Shopify | `print_job_id`, `supplier_id`, `tracking_carrier`, `is_drop` |

**Non-goals for analytics:** no PII (no customer email, no address, no IP). `shopify_order_id` is an internal ID and considered acceptable. Financial amounts are out of scope for this pipeline's events — Shopify reporting covers that.

### 11.5 Reconciliation

Daily cron: query Shopify for all paid orders in the last 48h. Compare to `print_jobs`. Any gap → insert missing rows. Catches webhook-delivery failures.

## 12. Open Questions & Decisions

### 12.1 Resolved by CEO review (2026-04-15)

| # | Question | Decision |
|---|---|---|
| Q3 | Asset store | **Vercel Blob** for phase 1. Revisit at 100GB egress/month. |
| Q4 | Database | **Neon Postgres** (Vercel-integrated, branching for staging). |
| Q5 | Drop overselling | **Accept minor overselling**; manual refund for exceptions. No Shopify Functions in v1. |
| Q6 | Product copy | Deferred — CEO to deliver brand voice guide + JSON copy templates. Upload script consumes templates; does not author copy. |
| Q7 | Pricing | Flat anchors: **$59.99 house drops, $69.99 creator collab drops**. Evergreen pricing TBD but same order of magnitude. |
| Q8 | Refund policy mid-production | Drop products = final-sale (metafield enforced). Evergreen = standard Shopify policy. Exceptions require CEO approval. |
| Q9 | Supplier evaluation | Deferred to **late May / early June 2026**. Budget $500–1000 for sample prints across 17 suppliers. |

### 12.2 Blockers (status as of 2026-04-15 evening)

| # | Question | Owner | Status | Resolution |
|---|---|---|---|---|
| B1 | Printkk API credentials | Dan | **RESOLVED** | API Key: set in `.env.local` as `PRINTKK_API_KEY`. Secret Key: set as `PRINTKK_SECRET_KEY`. Standard API key/secret pair — NOT the JWT interception method documented in HANDOFF.md. Auth scheme TBD (likely `Authorization: Bearer <key>` or HMAC signature with secret — need Printkk API docs to confirm). |
| B2 | Does Printkk pull print files from URL, or require byte upload? | Dan | **OPEN** | Still unknown. Now unblocked to test once we have API docs. The API key/secret should give us access to their developer portal or we can probe endpoints. |
| B3 | Shopify plan tier | Dan | **RESOLVED** | **Shopify Basic** ($39 USD/mo). Implications: GraphQL Admin API rate limit = 50 points/sec. REST Admin API = 2 req/sec. Shopify Functions discounts available (added Jan 2026). No advanced reports. Webhooks fully supported. Custom apps fully supported. |
| B4 | Alerting destination | CEO | **RESOLVED** | Email to Dan's inbox for v1. `ALERT_WEBHOOK_URL` will use a simple email relay (Vercel-native or Resend). No Slack/PagerDuty needed at current volume. |
| B5 | Brand voice guide + product-copy JSON templates | CEO | **RESOLVED** | `BRAND-VOICE-GUIDE.md` drafted (v0.1, 2026-04-15). Contains AI system prompt, HTML templates for evergreen and drop descriptions, nation copy context JSON schema. `nation-copy-context.json` (48-nation color/identity data) deferred — can be batch-generated. |
| B6 | Shopify Admin API access token | Dan | **RESOLVED** | Found in `C:\Users\Aurelian\Desktop\Start_Aurelian.bat`. Set in `.env.local` as `SHOPIFY_ADMIN_ACCESS_TOKEN`. Store: `hoodd-shop-2.myshopify.com`. |
| B7 | Two-variant catalog structure (Home/Away) | CEO | **RESOLVED** | `TWO-SIZE-VARIANT-SPEC.md` drafted (v0.1, 2026-04-15). 48 products × 2 Shopify variants = 96 SKUs. Option name: `Design`. SKU format: `{CODE}-HOME` / `{CODE}-AWAY`. Metafields on variants, not products. |

**Remaining critical path:** B2 (Printkk file delivery method) is the only open blocker. Can be probed now that B1 credentials are available — test against Printkk API endpoints to determine upload vs. URL-fetch. All Shopify credentials are in place.

## 13. Phased Implementation Plan (CEO-revised)

Launch target: **2026-04-27** (one day before the April 28 first drop per `hoodd-limited-drops-strategy.html`). Drop readiness is co-critical with MVP — they ship together in 1A.

### Phase 1A — MVP + Drops (target 2026-04-27)

Everything needed to run the first drop and the evergreen catalog safely.

- Neon Postgres provisioned; migrations for `assets`, `print_jobs`, `webhook_events`
- Vercel Blob bucket configured; `BLOB_READ_WRITE_TOKEN` set
- `upload_catalog.ts` supporting `--variants`, `--drop*`, `--final-sale`, `--dry-run`, `--nations`
- Evergreen launch catalog: 48 nations × `home,away` = 96 products uploaded
- First drop (April 28) products uploaded via drop flags, metafields populated per `DROPS-WEB-SPEC.md`
- `/api/webhooks/shopify/orders` — HMAC verify + idempotent insert for `orders/paid` and `orders/cancelled`
- Worker cron: T+2h hold gate (skipped for drops), supplier dispatch, retry policy
- Printkk adapter **if B1 resolved by 2026-04-18**; else email adapter as fallback
- Tracking update path: supplier → Shopify fulfillments API
- Single end-to-end test order in staging, then a real low-volume test in production
- Structured logs; minimal alert to the channel chosen in B4 (or console fallback)

### Phase 1B — Ops Hardening (target 2026-05-04)

Everything that makes the system operable by a solo team but wasn't strictly required to open the doors.

- CLI admin commands: `admin:jobs --status`, `--retry`, `--release`, `--hold`, `admin:orders`
- Daily reconciliation cron (§11.5)
- Pre-signed URL rotation for asset store
- Full failure-alert suite per §11.2 to the B4 destination
- Analytics event emission wired to existing provider (§11.4)
- Runbook: on-call response for each failure mode in §7.3

### Phase 2 — Admin UI (target 2026-05-11)

- `/admin` dashboard behind `SUPPLIER_ADMIN_TOKEN`
- Job list, status filters, retry/cancel/release controls
- Order timeline view
- Drop-specific view: live unit count, time-to-close, associated print jobs

### Phase 3 — Multi-Supplier Routing (late May → June 2026, gated on supplier evaluation)

- Sample-print study for the 17 identified suppliers ($500–1000 budget)
- Adapter per qualified supplier (target 2–3 additional)
- Geo-router wired to adapter dispatch (already designed in §9)
- Fallback email adapter stays in place for suppliers without APIs

**Critical path:** 1A. If B1 slips past 2026-04-18, pipeline still ships 2026-04-27 via the email-adapter fallback; Printkk adapter moves to 1B.

## 14. What I'd Revisit as the System Grows

- **DB-backed queue → real queue:** at ~100 orders/day, cron polling becomes a bottleneck and jitter increases. Move to QStash or SQS.
- **Single-region deploy → multi-region:** Vercel edge is fine for webhooks, but worker cron is single-region. Acceptable until volume justifies multi-region.
- **Monolith adapter code → microservice:** when there are 10+ adapters, isolate them behind their own deploys to avoid blast radius.
- **Asset store migration:** if egress costs dominate, move hot assets to R2 (zero egress) behind a CDN.
- **Observability maturity:** add OpenTelemetry tracing once there are >3 moving parts in a single request.

---

## Appendix A — Assumptions Made in This Draft

1. Shopify is the sole source of truth for orders and payment.
2. Every product is fulfilled by exactly one supplier per order (no split shipments yet).
3. Customers pay standard shipping rates configured in Shopify; supplier cost is absorbed or margin-adjusted. Supplier-specific shipping surcharges not yet modeled.
4. Refunds are manual ops for phase 1.
5. **Confirmed by CEO (2026-04-15):** Print files are final and do not need per-order customization (no names, no numbers, no personalization). If that changes later, the asset model needs a `variant_rendering_config` column and a render-on-demand step — not planned.
6. All generated PNGs already meet supplier print specs. No runtime validation layer.

## Appendix B — Environment Variables Required

```env
# Shopify
SHOPIFY_STORE_DOMAIN=hooddshop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<existing>
SHOPIFY_ADMIN_ACCESS_TOKEN=<SET — in .env.local>
SHOPIFY_WEBHOOK_SECRET=<SET — in .env.local>

# Asset store
BLOB_READ_WRITE_TOKEN=<Vercel Blob>  # or S3/R2 equivalents

# Database
DATABASE_URL=postgres://...

# Suppliers
SUPPLIER_ADMIN_TOKEN=<existing — hoodd-admin-2026>
PRINTKK_API_KEY=<SET — in .env.local>
PRINTKK_SECRET_KEY=<SET — in .env.local>
PRINTKK_API_BASE=<NEW — need from Printkk docs, likely https://api.printkk.com or similar>
# ... one set per implemented supplier

# Operations
ALERT_WEBHOOK_URL=<Slack/email/PagerDuty>
```

---

**Change log:**

- **v0.1 (2026-04-15):** Initial draft for CEO review.
- **v0.2 (2026-04-15):** CEO-reviewed. Added F10–F13 (T+2h hold, `--variants`, cancel handling, analytics). Added §6.2 `orders/cancelled` contract. Added §7.1b hold policy. Restructured §8 around the 30-drop calendar and final-sale metafield. Added §11.4 analytics. Resolved Q3–Q9 in §12.1; outstanding blockers tracked as B1–B5 in §12.2. Rewrote §13 phasing to 1A (Apr 27) / 1B (May 4) / 2 (May 11) / 3 (late May–June).
- **v0.3 (2026-04-15):** Resolved B1 (Printkk API key/secret obtained), B3 (Shopify Basic plan confirmed — 50 pts/sec GraphQL, 2 req/sec REST), B4 (alerting via email to CEO), B5 (brand voice guide drafted). Added B6 (Admin token generation needed) and B7 (two-variant spec drafted). Updated env var appendix. Printkk auth is standard API key/secret pair, not JWT interception.

**Next steps:**

1. Dan to generate Shopify Admin API token (B6) — see instructions in §12.2.
2. CEO to deliver B5 (brand voice guide + copy templates) by 2026-04-22.
3. CEO + Dan to pick B4 alerting destination by 2026-04-22.
4. Engineering starts Phase 1A on 2026-04-16 on items that are not blocked by B1–B5 (DB schema, Blob provisioning, webhook scaffold, upload script skeleton).
