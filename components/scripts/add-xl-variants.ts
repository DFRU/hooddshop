/**
 * Add XL size variant to all 48 nation products.
 *
 * What it does:
 *   1. Fetches every product matching `vendor:Hood'd` with product_type 'Hood Cover'.
 *   2. For each product:
 *      - Reads its current variants (5 designs × Standard).
 *      - Adds a second option axis: Size (Standard / XL).
 *      - Creates 5 new XL variants, each cloning the Standard variant of the same
 *        design but with:
 *          • SKU = `${standardSku}-XL`
 *          • price = +$10 USD on top of the existing standard price
 *          • inventory tracking inherited from Standard
 *      - Preserves existing variant IDs so historical orders/analytics stay intact.
 *   3. PUT-updates the product via Shopify Admin REST API.
 *
 * Idempotent: if the product already has a Size option, it skips it.
 *
 * Run with:
 *   npx tsx components/scripts/add-xl-variants.ts            # dry run, prints what would change
 *   npx tsx components/scripts/add-xl-variants.ts --apply    # actually writes to Shopify
 *
 * Requires SHOPIFY_ADMIN_ACCESS_TOKEN and SHOPIFY_STORE_DOMAIN env vars (in .env.local).
 *
 * Rate limit: lib/shopify-admin.ts already throttles to ~1.8 req/sec. Expect ~5 min
 * for 48 products (each = 2 requests: GET + PUT).
 *
 * IMPORTANT — XL pricing surcharge controlled here. Adjust SIZE_PRICE_SURCHARGE_USD
 * in lib/suppliers/constants.ts to keep the website price-axis in sync.
 */
import * as fs from "fs";
import * as path from "path";

// Load .env.local first (tsx doesn't auto-load like Next.js does)
const envPath = path.resolve(__dirname, "..", "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
  console.log(`[env] Loaded ${envPath}`);
}

import { shopifyAdminFetch } from "../../lib/shopify-admin";
import { SIZE_PRICE_SURCHARGE_USD, SIZE_SKU_SUFFIX } from "../../lib/suppliers/constants";

// ─── Config ──────────────────────────────────────────────────────

const APPLY = process.argv.includes("--apply");
const STANDARD_SIZE_LABEL = "Standard";
const XL_SIZE_LABEL = "XL";
const XL_SURCHARGE = SIZE_PRICE_SURCHARGE_USD.xl;
const XL_SKU_SUFFIX = SIZE_SKU_SUFFIX.xl;

// ─── Shopify response types (more permissive than the public types) ─────────

interface FullProductVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  position: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  inventory_management: string | null;
  inventory_policy: string;
  inventory_item_id: number;
  image_id: number | null;
  taxable: boolean;
  weight: number;
  weight_unit: string;
  requires_shipping: boolean;
}

interface ProductOption {
  id?: number;
  product_id?: number;
  name: string;
  position: number;
  values: string[];
}

interface FullProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  status: string;
  options: ProductOption[];
  variants: FullProductVariant[];
}

// ─── Helpers ─────────────────────────────────────────────────────

function bumpPriceByUsd(currentPriceStr: string, surcharge: number): string {
  const current = parseFloat(currentPriceStr);
  if (Number.isNaN(current)) {
    throw new Error(`Cannot parse price: "${currentPriceStr}"`);
  }
  return (current + surcharge).toFixed(2);
}

function buildXlVariant(standard: FullProductVariant): Record<string, unknown> {
  return {
    // No `id` field → Shopify creates a new variant
    option1: standard.option1,                        // same design (Home / Away / etc.)
    option2: XL_SIZE_LABEL,                           // Size axis = XL
    sku: `${standard.sku}${XL_SKU_SUFFIX}`,
    price: bumpPriceByUsd(standard.price, XL_SURCHARGE),
    inventory_management: standard.inventory_management,
    inventory_policy: standard.inventory_policy,
    image_id: standard.image_id ?? undefined,
    taxable: standard.taxable,
    weight: standard.weight,
    weight_unit: standard.weight_unit,
    requires_shipping: standard.requires_shipping,
  };
}

function backfillStandardOption2(v: FullProductVariant): Record<string, unknown> {
  // When a new option axis is introduced, existing variants need an explicit
  // option2 value or Shopify will reject the update.
  return {
    id: v.id,
    option1: v.option1,
    option2: STANDARD_SIZE_LABEL,
    sku: v.sku,
    price: v.price,
  };
}

async function listAllHoodCovers(): Promise<FullProduct[]> {
  // Fetch up to 250 (current catalog = 48). Add pagination later if needed.
  const data = await shopifyAdminFetch<{ products: FullProduct[] }>(
    "/products.json?limit=250&product_type=Car Hood Cover&status=active,draft"
  );
  return data.products;
}

async function getFullProduct(productId: number): Promise<FullProduct> {
  const data = await shopifyAdminFetch<{ product: FullProduct }>(
    `/products/${productId}.json`
  );
  return data.product;
}

async function applyXlUpdate(product: FullProduct): Promise<void> {
  // Compose new options and variants.
  const designOption = product.options.find((o) => o.name === "Design");
  if (!designOption) {
    throw new Error(`Product ${product.handle} has no Design option`);
  }

  const newOptions = [
    { name: "Design", position: 1, values: designOption.values },
    { name: "Size", position: 2, values: [STANDARD_SIZE_LABEL, XL_SIZE_LABEL] },
  ];

  // Backfill existing variants with option2='Standard', then append XL clones.
  const updatedStandard = product.variants.map(backfillStandardOption2);
  const newXl = product.variants.map(buildXlVariant);

  const body = {
    id: product.id,
    options: newOptions,
    variants: [...updatedStandard, ...newXl],
  };

  await shopifyAdminFetch(`/products/${product.id}.json`, {
    method: "PUT",
    body: { product: body },
  });
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("[xl-rollout] Starting...");
  console.log(
    `[xl-rollout] Mode: ${APPLY ? "APPLY (will write to Shopify)" : "DRY RUN (no writes)"}`
  );
  console.log(`[xl-rollout] XL surcharge: +$${XL_SURCHARGE.toFixed(2)} USD`);
  console.log(`[xl-rollout] XL SKU suffix: "${XL_SKU_SUFFIX}"`);
  console.log();

  const products = await listAllHoodCovers();
  console.log(`[xl-rollout] Found ${products.length} Hood Cover products`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of products) {
    const sizeOption = p.options.find((o) => o.name === "Size");
    if (sizeOption) {
      console.log(`  SKIP ${p.handle} — Size option already exists`);
      skipped++;
      continue;
    }

    // Get the full variant detail (list endpoint may omit some fields)
    const full = await getFullProduct(p.id);

    const summary = full.variants
      .map((v) => `${v.option1}@$${v.price}`)
      .join(", ");
    const xlPrices = full.variants
      .map((v) => `${v.option1}-XL@$${bumpPriceByUsd(v.price, XL_SURCHARGE)}`)
      .join(", ");
    console.log(`  ${p.handle}`);
    console.log(`     existing: ${summary}`);
    console.log(`     adding:   ${xlPrices}`);

    if (APPLY) {
      try {
        await applyXlUpdate(full);
        updated++;
      } catch (err: unknown) {
        failed++;
        console.error(
          `     ERROR: ${(err as Error).message ?? "unknown error"}`
        );
      }
    } else {
      updated++; // count it as "would update" in dry-run
    }
  }

  console.log();
  console.log("[xl-rollout] DONE");
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped} (Size option already present)`);
  console.log(`  Failed:  ${failed}`);

  if (!APPLY) {
    console.log();
    console.log("This was a DRY RUN. Re-run with --apply to actually update.");
  }
}

main().catch((err) => {
  console.error("[xl-rollout] FATAL:", err);
  process.exit(1);
});
