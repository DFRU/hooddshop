/**
 * Shopify Admin API client.
 * Used by the upload script and fulfillment worker.
 *
 * Separate from lib/shopify.ts (Storefront API) because:
 * - Different token (Admin vs Storefront)
 * - Different base URL (/admin/api/ vs /api/)
 * - Different auth header (X-Shopify-Access-Token vs X-Shopify-Storefront-Access-Token)
 *
 * Shopify Basic plan: 2 req/sec REST, 50 pts/sec GraphQL (§12.2 B3).
 */

const DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN || "hoodd-shop-2.myshopify.com";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const API_VERSION = "2025-01";

const BASE_URL = `https://${DOMAIN}/admin/api/${API_VERSION}`;

// Simple token-bucket rate limiter: 2 req/sec for Shopify Basic
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 550; // ~1.8 req/sec, leaves headroom

async function rateLimitDelay() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Generic Shopify Admin REST API fetch.
 */
export async function shopifyAdminFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  if (!ADMIN_TOKEN) {
    throw new Error(
      "[shopify-admin] SHOPIFY_ADMIN_ACCESS_TOKEN is not set"
    );
  }

  await rateLimitDelay();

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(
      `[shopify-admin] ${res.status} ${res.statusText} on ${options.method || "GET"} ${path}: ${errorBody.slice(0, 500)}`
    );
  }

  return res.json() as Promise<T>;
}

// ─── Product Operations ──────────────────────────────────────────

export interface ShopifyAdminVariant {
  id?: number;
  option1: string;
  sku: string;
  price: string;
  inventory_management: string;
  inventory_policy: string;
  image_id?: number;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
}

export interface CreateProductInput {
  title: string;
  handle?: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: "active" | "draft";
  options: Array<{ name: string; values: string[] }>;
  variants: ShopifyAdminVariant[];
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
}

export interface ShopifyAdminProduct {
  id: number;
  title: string;
  handle: string;
  variants: Array<{
    id: number;
    title: string;
    sku: string;
    inventory_item_id: number;
  }>;
  images: Array<{
    id: number;
    src: string;
    variant_ids: number[];
  }>;
}

export async function createProduct(
  input: CreateProductInput
): Promise<ShopifyAdminProduct> {
  const data = await shopifyAdminFetch<{ product: ShopifyAdminProduct }>(
    "/products.json",
    { method: "POST", body: { product: input } }
  );
  return data.product;
}

export async function getProductByHandle(
  handle: string
): Promise<ShopifyAdminProduct | null> {
  try {
    const data = await shopifyAdminFetch<{
      products: ShopifyAdminProduct[];
    }>(`/products.json?handle=${encodeURIComponent(handle)}&limit=1`);
    return data.products[0] ?? null;
  } catch {
    return null;
  }
}

export async function updateProduct(
  productId: number,
  input: Partial<CreateProductInput> & { id: number }
): Promise<ShopifyAdminProduct> {
  const data = await shopifyAdminFetch<{ product: ShopifyAdminProduct }>(
    `/products/${productId}.json`,
    { method: "PUT", body: { product: input } }
  );
  return data.product;
}

// ─── Image Operations ────────────────────────────────────────────

export async function createProductImage(
  productId: number,
  src: string,
  variantIds?: number[]
): Promise<{ id: number; src: string }> {
  const data = await shopifyAdminFetch<{
    image: { id: number; src: string };
  }>(`/products/${productId}/images.json`, {
    method: "POST",
    body: {
      image: {
        src,
        variant_ids: variantIds ?? [],
      },
    },
  });
  return data.image;
}

// ─── Inventory Operations ────────────────────────────────────────

export async function setInventoryLevel(
  inventoryItemId: number,
  locationId: number,
  quantity: number
): Promise<void> {
  await shopifyAdminFetch("/inventory_levels/set.json", {
    method: "POST",
    body: {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity,
    },
  });
}

// ─── Fulfillment Operations ──────────────────────────────────────

export interface CreateFulfillmentInput {
  line_items_by_fulfillment_order: Array<{
    fulfillment_order_id: number;
    fulfillment_order_line_items: Array<{
      id: number;
      quantity: number;
    }>;
  }>;
  tracking_info: {
    company: string;
    number: string;
    url?: string;
  };
  notify_customer: boolean;
}

export async function createFulfillment(
  input: CreateFulfillmentInput
): Promise<{ id: number }> {
  const data = await shopifyAdminFetch<{ fulfillment: { id: number } }>(
    "/fulfillments.json",
    { method: "POST", body: { fulfillment: input } }
  );
  return data.fulfillment;
}

// ─── Metafield Operations ────────────────────────────────────────

export async function setVariantMetafields(
  variantId: number,
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>
): Promise<void> {
  for (const mf of metafields) {
    await shopifyAdminFetch(
      `/variants/${variantId}/metafields.json`,
      {
        method: "POST",
        body: { metafield: mf },
      }
    );
  }
}

// ─── Webhook Registration ────────────────────────────────────────

export async function registerWebhook(
  topic: string,
  address: string
): Promise<void> {
  await shopifyAdminFetch("/webhooks.json", {
    method: "POST",
    body: {
      webhook: {
        topic,
        address,
        format: "json",
      },
    },
  });
}

// ─── Location ────────────────────────────────────────────────────

export async function getLocations(): Promise<
  Array<{ id: number; name: string; active: boolean }>
> {
  const data = await shopifyAdminFetch<{
    locations: Array<{ id: number; name: string; active: boolean }>;
  }>("/locations.json");
  return data.locations;
}
