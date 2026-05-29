/**
 * Add an XL size variant to every Hood'd product in Shopify.
 *
 * Before: each product has 1 option ("Design") with 5 values (Home/Away/Flag/Full/Jersey),
 *         producing 5 variants.
 *
 * After:  each product has 2 options ("Design", "Size") with values:
 *           Design: Home/Away/Flag/Full/Jersey
 *           Size:   Standard / XL
 *         producing 10 variants per product (5 designs × 2 sizes).
 *
 * Pricing:
 *   Standard variants keep their existing price.
 *   XL variants are priced at `existing + $10` (Standard + $10 surcharge — see constants.ts).
 *
 * SKUs:
 *   Standard variants keep existing SKU (e.g. "CA-HOME").
 *   XL variants append "-XL" (e.g. "CA-HOME-XL"). The webhook parses this suffix.
 *
 * Usage:
 *   1. Set SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local
 *   2. (optional) Dry-run first: DRY_RUN=true npx tsx components/scripts/add-xl-variant.ts
 *   3. Real run:                  npx tsx components/scripts/add-xl-variant.ts
 *
 * The script is IDEMPOTENT — if a product already has the Size option, it's skipped.
 *
 * Spec: XL rollout (2026-05-16). Pairs with the schema migration that adds
 * print_jobs.product_size and the PrintKK adapter's per-size product code routing.
 */

import * as fs from "fs";
import * as path from "path";

// --- env loader (same as scripts/migrate.ts) ---
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
import { NATIONS } from "../../lib/nations";
import { SIZE_PRICE_SURCHARGE_USD, SIZE_SKU_SUFFIX } from "../../lib/suppliers/constants";

const DRY_RUN = (process.env.DRY_RUN || "").toLowerCase() === "true";
const XL_SURCHARGE = SIZE_PRICE_SURCHARGE_USD.xl;

// Existing handle convention from upload_catalog.ts:
// `hoodd-{nation-name-lowercased-and-slugified}-jersey-line`
function nationToHandle(nation: { name: string }) {
  const slug = nation.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `hoodd-${slug}-jersey-line`;
}

interface AdminVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  inventory_management: string | null;
  inventory_policy: string;
  inventory_item_id: number;
  image_id: number | null;
}

interface AdminProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

interface AdminProductFull {
  id: number;
  title: string;
  handle: string;
  options: AdminProductOption[];
  variants: AdminVariant[];
}

async function fetchProduct(handle: string): Promise<AdminProductFull | null> {
  try {
    const data = await shopifyAdminFetch<{ products: AdminProductFull[] }>(
      `/products.json?handle=${encodeURIComponent(handle)}&limit=1`
    );
    return data.products[0] ?? null;
  } catch (e) {
    console.warn(`[fetch] ${handle}: ${(e as Error).message}`);
    return null;
  }
}

function alreadyHasSize(product: AdminProductFull): boolean {
  return product.options.some((o) => o.name.toLowerCase() === "size");
}

interface UpdateVariantPayload {
  id?: number;
  option1: string;
  option2: string;
  sku: string;
  price: string;
  inventory_management?: string;
  inventory_policy?: string;
  image_id?: number | null;
}

function buildUpdatedVariants(product: AdminProductFull): UpdateVariantPayload[] {
  // Existing variants become "Standard" — keep their IDs so Shopify updates in place.
  const standard: UpdateVariantPayload[] = product.variants.map((v) => ({
    id: v.id,
    option1: v.option1 ?? v.title, // Design value
    option2: "Standard",
    sku: v.sku,
    price: v.price,
    inventory_management: v.inventory_management ?? "shopify",
    inventory_policy: v.inventory_policy ?? "continue",
    image_id: v.image_id,
  }));

  // XL variants — new variants (no id) with surcharged price + suffixed SKU.
  // Image is inherited from the matching standard variant for the same design.
  const xl: UpdateVariantPayload[] = product.variants.map((v) => {
    const newPrice = (parseFloat(v.price) + XL_SURCHARGE).toFixed(2);
    return {
      option1: v.option1 ?? v.title,
      option2: "XL",
      sku: `${v.sku}${SIZE_SKU_SUFFIX.xl}`,
      price: newPrice,
      inventory_management: v.inventory_management ?? "shopify",
      inventory_policy: v.inventory_policy ?? "continue",
      image_id: v.image_id,
    };
  });

  return [...standard, ...xl];
}

async function updateProduct(
  product: AdminProductFull
): Promise<{ status: "updated" | "skipped" | "failed"; message?: string }> {
  if (alreadyHasSize(product)) {
    return { status: "skipped", message: "already has Size option" };
  }

  const designOption = product.options.find(
    (o) => o.name.toLowerCase() === "design"
  );
  if (!designOption) {
    return { status: "failed", message: "no Design option found" };
  }

  const updatedVariants = buildUpdatedVariants(product);

  const payload = {
    product: {
      id: product.id,
      options: [
        { id: designOption.id, name: "Design", position: 1, values: designOption.values },
        { name: "Size", position: 2, values: ["Standard", "XL"] },
      ],
      variants: updatedVariants,
    },
  };

  if (DRY_RUN) {
    console.log(
      `[dry-run] ${product.handle}: would add Size axis with ${updatedVariants.length} variants ` +
      `(${updatedVariants.filter((v) => v.option2 === "Standard").length} Standard + ` +
      `${updatedVariants.filter((v) => v.option2 === "XL").length} XL)`
    );
    return { status: "updated", message: "dry-run only" };
  }

  try {
    await shopifyAdminFetch(`/products/${product.id}.json`, {
      method: "PUT",
      body: payload,
    });
    return { status: "updated" };
  } catch (e) {
    return { status: "failed", message: (e as Error).message };
  }
}

async function main() {
  console.log(`[xl-variant] Starting. DRY_RUN=${DRY_RUN}`);
  console.log(`[xl-variant] Will process ${NATIONS.length} nations.`);

  const counters = { updated: 0, skipped: 0, failed: 0, notFound: 0 };

  for (const nation of NATIONS) {
    const handle = nationToHandle(nation);
    process.stdout.write(`  ${nation.name.padEnd(20)} (${handle}) ... `);

    const product = await fetchProduct(handle);
    if (!product) {
      console.log("NOT FOUND in Shopify");
      counters.notFound++;
      continue;
    }

    const result = await updateProduct(product);
    if (result.status === "updated") {
      console.log(`OK${result.message ? ` (${result.message})` : ""}`);
      counters.updated++;
    } else if (result.status === "skipped") {
      console.log(`SKIPPED — ${result.message}`);
      counters.skipped++;
    } else {
      console.log(`FAILED — ${result.message}`);
      counters.failed++;
    }
  }

  console.log("\n[xl-variant] Done.");
  console.log(
    `  Updated:    ${counters.updated}\n` +
    `  Skipped:    ${counters.skipped} (already has Size)\n` +
    `  Failed:     ${counters.failed}\n` +
    `  Not found:  ${counters.notFound}`
  );

  if (counters.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[xl-variant] Fatal:", err);
  process.exit(1);
});
