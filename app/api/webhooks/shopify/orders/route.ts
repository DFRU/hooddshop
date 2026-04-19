/**
 * Shopify webhook receiver for orders/paid and orders/cancelled.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §6.1 (orders/paid), §6.2 (orders/cancelled)
 *
 * This handler:
 * 1. Verifies HMAC signature
 * 2. Deduplicates via webhook_events table
 * 3. For orders/paid: creates print_jobs rows (with T+2h hold for non-drop)
 * 4. For orders/cancelled: cancels cancelable jobs per §6.2 behavior matrix
 * 5. Returns 200 quickly (all heavy work is deferred to worker cron)
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook, sha256 } from "@/lib/webhooks/verify";
import {
  webhookEventExists,
  insertWebhookEvent,
  markWebhookProcessed,
  insertPrintJob,
  cancelJobsForOrder,
  getAssetByNationAndVariant,
} from "@/lib/db/queries";
import { ulid } from "@/lib/ulid";

// Use Node runtime for crypto.subtle compatibility and longer execution time
export const runtime = "nodejs";

// Disable Next.js body parsing — we need the raw body for HMAC verification
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";
const T2H_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// ─── Shopify order payload types (subset we use) ─────────────────

interface ShopifyLineItem {
  id: number;
  variant_id: number;
  product_id: number;
  sku: string;
  quantity: number;
  properties: Array<{ name: string; value: string }>;
}

interface ShopifyAddress {
  name: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  zip: string;
  country_code: string;
  phone: string | null;
}

interface ShopifyOrder {
  id: number;
  name: string; // e.g. "#1001"
  created_at: string;
  tags: string;
  line_items: ShopifyLineItem[];
  shipping_address?: ShopifyAddress;
}

// ─── Route handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // 1. Verify HMAC
  const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
  if (!WEBHOOK_SECRET) {
    console.error("[webhook] SHOPIFY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const valid = await verifyShopifyWebhook(rawBody, hmac, WEBHOOK_SECRET);
  if (!valid) {
    console.warn("[webhook] HMAC verification failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract headers
  const webhookId = request.headers.get("x-shopify-webhook-id") || "";
  const topic = request.headers.get("x-shopify-topic") || "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") || "";

  if (!webhookId || !topic) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  // 3. Idempotency check
  const alreadyProcessed = await webhookEventExists(webhookId);
  if (alreadyProcessed) {
    return NextResponse.json({ status: "already_processed" }, { status: 200 });
  }

  // 4. Record webhook receipt
  const bodyHash = await sha256(rawBody);
  await insertWebhookEvent({ id: webhookId, topic, shopDomain, bodyHash });

  // 5. Route by topic
  try {
    const order: ShopifyOrder = JSON.parse(rawBody);

    if (topic === "orders/paid") {
      await handleOrderPaid(order);
    } else if (topic === "orders/cancelled") {
      await handleOrderCancelled(order);
    } else {
      console.warn(`[webhook] Unhandled topic: ${topic}`);
    }

    await markWebhookProcessed(webhookId);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[webhook] Processing error:", err);
    // Still return 200 to prevent Shopify retries on our bug.
    // The webhook_events row stays as 'received' — reconciliation cron will catch it.
    return NextResponse.json({ status: "error_logged" }, { status: 200 });
  }
}

// ─── orders/paid handler ─────────────────────────────────────────

async function handleOrderPaid(order: ShopifyOrder) {
  const shopifyOrderId = String(order.id);
  const orderedAt = order.created_at;
  const orderTags = order.tags
    ? order.tags.split(",").map((t) => t.trim().toLowerCase())
    : [];

  // Detect drop orders: any tag starting with "drop:" or containing "final-sale"
  const isDrop =
    orderTags.some((t) => t.startsWith("drop:")) ||
    orderTags.includes("final-sale");

  const eligibleAt = isDrop
    ? orderedAt
    : new Date(new Date(orderedAt).getTime() + T2H_MS).toISOString();

  const shipping = order.shipping_address;

  // Default supplier — Printkk for Phase 1A (geo-routing deferred to Phase 3)
  const supplierId = "printkk";

  let created = 0;
  let skipped = 0;

  for (const item of order.line_items) {
    // Resolve asset_id from SKU. SKU format: "{CODE}-{VARIANT}" e.g. "CA-HOME"
    // Parse the SKU into nation_code and variant_name, then look up the asset
    // in the assets table.
    let assetId: string | null = null;

    if (item.sku) {
      const skuParts = item.sku.split("-");
      // SKU may have multi-part codes like "GB-ENG-HOME", so variant is last part
      const variantName = skuParts.pop()?.toLowerCase(); // "home" or "away"
      const nationCode = skuParts.join("-").toUpperCase(); // "CA" or "GB-ENG"

      if (variantName && nationCode) {
        const asset = await getAssetByNationAndVariant(nationCode, variantName);
        if (asset) {
          assetId = asset.id;
        } else {
          console.warn(
            `[webhook] No asset found for nation=${nationCode} variant=${variantName} (SKU=${item.sku})`
          );
        }
      }
    }

    if (!assetId) {
      console.error(
        `[webhook] Cannot resolve asset_id for SKU=${item.sku}, variant_id=${item.variant_id}. Skipping line item.`
      );
      skipped++;
      continue;
    }

    const inserted = await insertPrintJob({
      id: ulid(),
      shopifyOrderId,
      shopifyLineItemId: String(item.id),
      assetId,
      supplierId,
      isDrop,
      orderedAt,
      eligibleForSubmitAt: eligibleAt,
      shippingName: shipping?.name,
      shippingAddress1: shipping?.address1,
      shippingAddress2: shipping?.address2 ?? undefined,
      shippingCity: shipping?.city,
      shippingProvince: shipping?.province,
      shippingZip: shipping?.zip,
      shippingCountry: shipping?.country_code,
      shippingPhone: shipping?.phone ?? undefined,
    });

    if (inserted) {
      created++;
    } else {
      skipped++;
    }
  }

  console.log(
    `[webhook] orders/paid ${order.name}: ${created} jobs created, ${skipped} skipped (idempotent), isDrop=${isDrop}`
  );
}

// ─── orders/cancelled handler ────────────────────────────────────

async function handleOrderCancelled(order: ShopifyOrder) {
  const shopifyOrderId = String(order.id);
  const result = await cancelJobsForOrder(shopifyOrderId);

  console.log(
    `[webhook] orders/cancelled ${order.name}: ${result.canceled.length} canceled, ${result.needsReview.length} need manual review`
  );

  if (result.needsReview.length > 0) {
    // TODO: emit alert to B4 destination (email for v1)
    console.warn(
      `[webhook] ALERT: Order ${order.name} canceled but ${result.needsReview.length} jobs already submitted to supplier. Manual reconciliation required. Job IDs: ${result.needsReview.join(", ")}`
    );
  }
}
