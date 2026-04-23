/**
 * Database client for Neon Postgres.
 * Uses @neondatabase/serverless for Vercel edge/serverless compatibility.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §5.1
 */
import { neon } from "@neondatabase/serverless";

// fetchConnectionCache is now always true in @neondatabase/serverless v0.10+

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[db] DATABASE_URL is not set. Provision a Neon Postgres database and add the connection string to .env.local"
    );
  }
  return url;
}

/**
 * Returns a SQL tagged template function bound to the current DATABASE_URL.
 * Each call creates a fresh HTTP connection (Neon serverless driver — no persistent pool).
 * Safe for Vercel edge and serverless runtimes.
 */
export function getDb() {
  return neon(getDatabaseUrl());
}

/**
 * Run the schema migration. Idempotent (CREATE IF NOT EXISTS).
 * Call from a setup script, not at runtime.
 */
export async function runMigrations() {
  const sql = getDb();

  // Read and execute schema.sql inline — the schema uses IF NOT EXISTS so it's safe to re-run
  await sql`
    CREATE TABLE IF NOT EXISTS assets (
      id              TEXT PRIMARY KEY,
      nation_key      TEXT NOT NULL,
      nation_code     TEXT NOT NULL,
      variant_name    TEXT NOT NULL,
      generation_run  TEXT NOT NULL,
      print_file_url  TEXT NOT NULL,
      preview_url     TEXT NOT NULL,
      shopify_product_id   TEXT,
      shopify_variant_id   TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      retired_at      TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_assets_nation ON assets(nation_code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assets_shopify ON assets(shopify_product_id) WHERE shopify_product_id IS NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id              TEXT PRIMARY KEY,
      shopify_order_id       TEXT NOT NULL,
      shopify_line_item_id   TEXT NOT NULL,
      asset_id        TEXT NOT NULL REFERENCES assets(id),
      supplier_id     TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'holding',
      provider_order_id  TEXT,
      tracking_carrier   TEXT,
      tracking_number    TEXT,
      attempts        INT NOT NULL DEFAULT 0,
      last_error      TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      is_drop         BOOLEAN NOT NULL DEFAULT false,
      ordered_at      TIMESTAMPTZ NOT NULL,
      eligible_for_submit_at TIMESTAMPTZ NOT NULL,
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
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status) WHERE status IN ('queued','holding','submitting','failed')`;
  await sql`CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON print_jobs(shopify_order_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_print_jobs_ready ON print_jobs(eligible_for_submit_at) WHERE status IN ('queued','holding')`;

  await sql`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id              TEXT PRIMARY KEY,
      topic           TEXT NOT NULL,
      shop_domain     TEXT NOT NULL,
      body_hash       TEXT NOT NULL,
      received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      processed_at    TIMESTAMPTZ,
      status          TEXT NOT NULL DEFAULT 'received'
    )
  `;

  // -- Subscribers (email capture) --
  await sql`
    CREATE TABLE IF NOT EXISTS subscribers (
      id              SERIAL PRIMARY KEY,
      email           TEXT NOT NULL UNIQUE,
      source          TEXT NOT NULL DEFAULT 'unknown',
      subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      unsubscribed_at TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(id) WHERE unsubscribed_at IS NULL`;

  // -- Weekly draws --
  await sql`
    CREATE TABLE IF NOT EXISTS draws (
      id              SERIAL PRIMARY KEY,
      period_start    TIMESTAMPTZ NOT NULL,
      period_end      TIMESTAMPTZ NOT NULL,
      status          TEXT NOT NULL DEFAULT 'open',
      winner_id       INT REFERENCES subscribers(id),
      prize           TEXT NOT NULL DEFAULT 'Free hood cover (any nation)',
      drawn_at        TIMESTAMPTZ,
      notified_at     TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status) WHERE status = 'open'`;

  await sql`
    CREATE TABLE IF NOT EXISTS draw_entries (
      id              SERIAL PRIMARY KEY,
      draw_id         INT NOT NULL REFERENCES draws(id),
      subscriber_id   INT NOT NULL REFERENCES subscribers(id),
      entry_source    TEXT NOT NULL DEFAULT 'subscribe',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(draw_id, subscriber_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries(draw_id)`;

  // -- Email broadcasts --
  await sql`
    CREATE TABLE IF NOT EXISTS broadcasts (
      id              SERIAL PRIMARY KEY,
      subject         TEXT NOT NULL,
      body_html       TEXT NOT NULL,
      body_text       TEXT,
      type            TEXT NOT NULL DEFAULT 'general',
      sent_count      INT NOT NULL DEFAULT 0,
      status          TEXT NOT NULL DEFAULT 'draft',
      sent_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  console.log("[db] Migrations complete");
}
