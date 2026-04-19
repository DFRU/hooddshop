-- Hood'd Shop — Phase 1A Database Schema
-- Target: Neon Postgres (Vercel-integrated)
-- Spec: UPLOAD-PIPELINE-SPEC.md §5.1
-- Run: psql $DATABASE_URL -f lib/db/schema.sql

-- ─── Assets ──────────────────────────────────────────────────────
-- Every design variant available for sale
CREATE TABLE IF NOT EXISTS assets (
  id              TEXT PRIMARY KEY,              -- e.g. "ar_home_v1"
  nation_key      TEXT NOT NULL,                 -- "Argentina"
  nation_code     TEXT NOT NULL,                 -- "AR" (ISO 3166-1 alpha-2)
  variant_name    TEXT NOT NULL,                 -- "home" | "away" | "flag" | "abbrev" | "full"
  generation_run  TEXT NOT NULL,                 -- "production" | "production_v2"
  print_file_url  TEXT NOT NULL,                 -- Vercel Blob URL (9448×7086 PNG)
  preview_url     TEXT NOT NULL,                 -- Vercel Blob URL (1536×1024 PNG)
  shopify_product_id   TEXT,                     -- populated after upload
  shopify_variant_id   TEXT,                     -- populated after upload
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at      TIMESTAMPTZ                    -- soft-retire without deleting
);

CREATE INDEX IF NOT EXISTS idx_assets_nation ON assets(nation_code);
CREATE INDEX IF NOT EXISTS idx_assets_shopify ON assets(shopify_product_id) WHERE shopify_product_id IS NOT NULL;

-- ─── Print Jobs ──────────────────────────────────────────────────
-- State machine for each order line item → supplier print job
CREATE TABLE IF NOT EXISTS print_jobs (
  id              TEXT PRIMARY KEY,              -- ULID
  shopify_order_id       TEXT NOT NULL,
  shopify_line_item_id   TEXT NOT NULL,
  asset_id        TEXT NOT NULL REFERENCES assets(id),
  supplier_id     TEXT NOT NULL,                 -- matches lib/suppliers
  status          TEXT NOT NULL DEFAULT 'holding',
    -- 'holding' | 'queued' | 'submitting' | 'submitted' | 'in_production' | 'shipped' | 'failed' | 'canceled'
  provider_order_id  TEXT,                       -- supplier's order reference
  tracking_carrier   TEXT,
  tracking_number    TEXT,
  attempts        INT NOT NULL DEFAULT 0,
  last_error      TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,          -- shopify_order_id:shopify_line_item_id
  is_drop         BOOLEAN NOT NULL DEFAULT false,
  ordered_at      TIMESTAMPTZ NOT NULL,          -- Shopify order.created_at
  eligible_for_submit_at TIMESTAMPTZ NOT NULL,   -- ordered_at + 2h (non-drop) or ordered_at (drop)
  shipping_name   TEXT,
  shipping_address1 TEXT,
  shipping_address2 TEXT,
  shipping_city   TEXT,
  shipping_province TEXT,
  shipping_zip    TEXT,
  shipping_country TEXT,
  shipping_phone  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status) WHERE status IN ('queued','holding','submitting','failed');
CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON print_jobs(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_ready ON print_jobs(eligible_for_submit_at) WHERE status IN ('queued','holding');
CREATE INDEX IF NOT EXISTS idx_print_jobs_idempotency ON print_jobs(idempotency_key);

-- ─── Webhook Events ──────────────────────────────────────────────
-- Audit log for every Shopify webhook received
CREATE TABLE IF NOT EXISTS webhook_events (
  id              TEXT PRIMARY KEY,              -- X-Shopify-Webhook-Id header
  topic           TEXT NOT NULL,                 -- e.g. "orders/paid", "orders/cancelled"
  shop_domain     TEXT NOT NULL,
  body_hash       TEXT NOT NULL,                 -- SHA-256 of raw body for audit
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'received'  -- 'received' | 'processed' | 'rejected'
);
