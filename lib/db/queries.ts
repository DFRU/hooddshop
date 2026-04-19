/**
 * Database query helpers for the fulfillment pipeline.
 * All queries use parameterized SQL via the Neon serverless driver.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §5.1, §6.1, §6.2, §7.1b
 */
import { getDb } from "./client";

// ─── Types ───────────────────────────────────────────────────────

export type PrintJobStatus =
  | "holding"
  | "queued"
  | "submitting"
  | "submitted"
  | "in_production"
  | "shipped"
  | "failed"
  | "canceled";

export interface PrintJobRow {
  id: string;
  shopify_order_id: string;
  shopify_line_item_id: string;
  asset_id: string;
  supplier_id: string;
  status: PrintJobStatus;
  provider_order_id: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  attempts: number;
  last_error: string | null;
  idempotency_key: string;
  is_drop: boolean;
  ordered_at: string;
  eligible_for_submit_at: string;
  shipping_name: string | null;
  shipping_address1: string | null;
  shipping_address2: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_zip: string | null;
  shipping_country: string | null;
  shipping_phone: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  shipped_at: string | null;
}

export interface AssetRow {
  id: string;
  nation_key: string;
  nation_code: string;
  variant_name: string;
  generation_run: string;
  print_file_url: string;
  preview_url: string;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  created_at: string;
  retired_at: string | null;
}

// ─── Webhook Events ──────────────────────────────────────────────

export async function webhookEventExists(webhookId: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    SELECT 1 FROM webhook_events WHERE id = ${webhookId} LIMIT 1
  `;
  return rows.length > 0;
}

export async function insertWebhookEvent(params: {
  id: string;
  topic: string;
  shopDomain: string;
  bodyHash: string;
}) {
  const sql = getDb();
  await sql`
    INSERT INTO webhook_events (id, topic, shop_domain, body_hash, status)
    VALUES (${params.id}, ${params.topic}, ${params.shopDomain}, ${params.bodyHash}, 'received')
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function markWebhookProcessed(webhookId: string) {
  const sql = getDb();
  await sql`
    UPDATE webhook_events
    SET status = 'processed', processed_at = now()
    WHERE id = ${webhookId}
  `;
}

// ─── Print Jobs ──────────────────────────────────────────────────

/**
 * Insert a print job row. Idempotent via UNIQUE on idempotency_key.
 * Returns true if inserted, false if already existed.
 */
export async function insertPrintJob(params: {
  id: string;
  shopifyOrderId: string;
  shopifyLineItemId: string;
  assetId: string;
  supplierId: string;
  isDrop: boolean;
  orderedAt: string;
  eligibleForSubmitAt: string;
  shippingName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingZip?: string;
  shippingCountry?: string;
  shippingPhone?: string;
}): Promise<boolean> {
  const sql = getDb();
  const idempotencyKey = `${params.shopifyOrderId}:${params.shopifyLineItemId}`;
  const initialStatus = params.isDrop ? "queued" : "holding";

  try {
    await sql`
      INSERT INTO print_jobs (
        id, shopify_order_id, shopify_line_item_id, asset_id, supplier_id,
        status, idempotency_key, is_drop, ordered_at, eligible_for_submit_at,
        shipping_name, shipping_address1, shipping_address2, shipping_city,
        shipping_province, shipping_zip, shipping_country, shipping_phone
      ) VALUES (
        ${params.id}, ${params.shopifyOrderId}, ${params.shopifyLineItemId},
        ${params.assetId}, ${params.supplierId}, ${initialStatus}, ${idempotencyKey},
        ${params.isDrop}, ${params.orderedAt}, ${params.eligibleForSubmitAt},
        ${params.shippingName ?? null}, ${params.shippingAddress1 ?? null},
        ${params.shippingAddress2 ?? null}, ${params.shippingCity ?? null},
        ${params.shippingProvince ?? null}, ${params.shippingZip ?? null},
        ${params.shippingCountry ?? null}, ${params.shippingPhone ?? null}
      )
    `;
    return true;
  } catch (err: unknown) {
    // Unique constraint violation = already exists (idempotent)
    if (
      err instanceof Error &&
      err.message.includes("unique") &&
      err.message.includes("idempotency_key")
    ) {
      return false;
    }
    throw err;
  }
}

/**
 * Fetch print jobs ready for submission.
 * Per §7.1b: eligible_for_submit_at <= now() AND status IN ('queued','holding')
 */
export async function fetchReadyJobs(limit: number = 10): Promise<PrintJobRow[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT *
    FROM print_jobs
    WHERE status IN ('queued', 'holding')
      AND eligible_for_submit_at <= now()
    ORDER BY eligible_for_submit_at ASC
    LIMIT ${limit}
  `;
  return rows as unknown as PrintJobRow[];
}

/**
 * Claim a job for submission. Uses optimistic locking via status check.
 * Returns true if successfully claimed.
 */
export async function claimJobForSubmission(jobId: string): Promise<boolean> {
  const sql = getDb();
  const result = await sql`
    UPDATE print_jobs
    SET status = 'submitting', updated_at = now()
    WHERE id = ${jobId}
      AND status IN ('queued', 'holding')
    RETURNING id
  `;
  return result.length > 0;
}

/**
 * Mark a job as successfully submitted to the supplier.
 */
export async function markJobSubmitted(
  jobId: string,
  providerOrderId: string
) {
  const sql = getDb();
  await sql`
    UPDATE print_jobs
    SET status = 'submitted',
        provider_order_id = ${providerOrderId},
        submitted_at = now(),
        updated_at = now()
    WHERE id = ${jobId}
  `;
}

/**
 * Mark a job as failed with error details.
 */
export async function markJobFailed(
  jobId: string,
  error: string,
  attempts: number
) {
  const sql = getDb();
  const status = attempts >= 5 ? "failed" : "queued"; // back to queued for retry unless max
  await sql`
    UPDATE print_jobs
    SET status = ${status},
        last_error = ${error},
        attempts = ${attempts},
        updated_at = now()
    WHERE id = ${jobId}
  `;
}

/**
 * Cancel all cancelable jobs for a Shopify order.
 * Per §6.2 behavior matrix: only 'queued', 'holding', and 'submitting' (if no provider_order_id).
 * Returns the IDs of canceled jobs and those requiring manual review.
 */
export async function cancelJobsForOrder(shopifyOrderId: string): Promise<{
  canceled: string[];
  needsReview: string[];
}> {
  const sql = getDb();

  // Cancel holding + queued
  const autoCancel = await sql`
    UPDATE print_jobs
    SET status = 'canceled', updated_at = now()
    WHERE shopify_order_id = ${shopifyOrderId}
      AND status IN ('holding', 'queued')
    RETURNING id
  `;

  // Cancel submitting only if not yet sent to supplier
  const submitCancel = await sql`
    UPDATE print_jobs
    SET status = 'canceled', updated_at = now()
    WHERE shopify_order_id = ${shopifyOrderId}
      AND status = 'submitting'
      AND provider_order_id IS NULL
    RETURNING id
  `;

  // Flag anything already submitted/in_production for manual review
  const needsReview = await sql`
    SELECT id FROM print_jobs
    WHERE shopify_order_id = ${shopifyOrderId}
      AND status IN ('submitted', 'in_production')
  `;

  return {
    canceled: [
      ...autoCancel.map((r) => r.id as string),
      ...submitCancel.map((r) => r.id as string),
    ],
    needsReview: needsReview.map((r) => r.id as string),
  };
}

/**
 * Fetch jobs needing tracking updates (submitted or in_production).
 */
export async function fetchJobsNeedingTracking(limit: number = 20): Promise<PrintJobRow[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT *
    FROM print_jobs
    WHERE status IN ('submitted', 'in_production')
      AND tracking_number IS NULL
    ORDER BY submitted_at ASC
    LIMIT ${limit}
  `;
  return rows as unknown as PrintJobRow[];
}

/**
 * Update tracking information and mark as shipped.
 */
export async function markJobShipped(
  jobId: string,
  carrier: string,
  trackingNumber: string
) {
  const sql = getDb();
  await sql`
    UPDATE print_jobs
    SET status = 'shipped',
        tracking_carrier = ${carrier},
        tracking_number = ${trackingNumber},
        shipped_at = now(),
        updated_at = now()
    WHERE id = ${jobId}
  `;
}

// ─── Assets ──────────────────────────────────────────────────────

export async function upsertAsset(params: {
  id: string;
  nationKey: string;
  nationCode: string;
  variantName: string;
  generationRun: string;
  printFileUrl: string;
  previewUrl: string;
}): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO assets (id, nation_key, nation_code, variant_name, generation_run, print_file_url, preview_url)
    VALUES (${params.id}, ${params.nationKey}, ${params.nationCode}, ${params.variantName},
            ${params.generationRun}, ${params.printFileUrl}, ${params.previewUrl})
    ON CONFLICT (id) DO UPDATE SET
      print_file_url = EXCLUDED.print_file_url,
      preview_url = EXCLUDED.preview_url,
      generation_run = EXCLUDED.generation_run,
      retired_at = NULL
  `;
}

export async function getAssetById(assetId: string): Promise<AssetRow | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM assets WHERE id = ${assetId} LIMIT 1`;
  return (rows[0] as unknown as AssetRow) ?? null;
}

export async function updateAssetShopifyIds(
  assetId: string,
  shopifyProductId: string,
  shopifyVariantId: string
) {
  const sql = getDb();
  await sql`
    UPDATE assets
    SET shopify_product_id = ${shopifyProductId},
        shopify_variant_id = ${shopifyVariantId}
    WHERE id = ${assetId}
  `;
}
