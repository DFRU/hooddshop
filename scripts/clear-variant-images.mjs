#!/usr/bin/env node
/**
 * Clear stale variant image assignments across all products.
 *
 * Some variants still point to old Shopify Files mockup images
 * that were assigned before the jersey design upload. This script
 * removes those variant→image associations so the PDP gallery
 * falls through to the product-level jersey design images.
 *
 * Usage:
 *   node scripts/clear-variant-images.mjs              # all products
 *   node scripts/clear-variant-images.mjs --dry-run    # preview only
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────
const ENV_PATH = resolve(__dirname, "../.env.local");

const envText = readFileSync(ENV_PATH, "utf-8");
const envVars = {};
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  envVars[key.trim()] = rest.join("=").trim();
}

const ADMIN_TOKEN =
  envVars.SHOPIFY_ADMIN_ACCESS_TOKEN || envVars.SHOPIFY_ADMIN_TOKEN;
const STORE = envVars.SHOPIFY_STORE_DOMAIN || "hoodd-shop-2.myshopify.com";
const API_VERSION = "2024-10";
const ADMIN_BASE = `https://${STORE}/admin/api/${API_VERSION}`;

if (!ADMIN_TOKEN) {
  console.error("[ERROR] No SHOPIFY_ADMIN_ACCESS_TOKEN found in .env.local");
  process.exit(1);
}

// ── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

// ── Shopify Admin API helpers ───────────────────────────────
async function adminFetch(endpoint, method = "GET", body = null) {
  const url = `${ADMIN_BASE}/${endpoint}`;
  const headers = {
    "X-Shopify-Access-Token": ADMIN_TOKEN,
    "Content-Type": "application/json",
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllProducts() {
  const products = [];
  let url = "products.json?limit=250";
  while (url) {
    const result = await adminFetch(url);
    products.push(...(result.products || []));
    if ((result.products || []).length === 250) {
      const lastId = products[products.length - 1].id;
      url = `products.json?limit=250&since_id=${lastId}`;
    } else {
      url = null;
    }
  }
  return products;
}

// ── Main ────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("CLEAR VARIANT IMAGE ASSIGNMENTS");
console.log(`  Store: ${STORE}`);
console.log(`  Dry run: ${dryRun}`);
console.log("=".repeat(60));

console.log("\nFetching all products...");
const products = await fetchAllProducts();
console.log(`  Found ${products.length} products\n`);

let cleared = 0;
let skipped = 0;
let failed = 0;

for (const product of products) {
  // Fetch full product with variants to get variant details
  let fullProduct;
  try {
    const result = await adminFetch(`products/${product.id}.json`);
    fullProduct = result.product;
  } catch (e) {
    console.log(`  [ERROR] Could not fetch product ${product.id}: ${e.message}`);
    failed++;
    continue;
  }

  const variants = fullProduct.variants || [];
  const productImages = fullProduct.images || [];

  // Build set of current product image IDs (the jersey designs we uploaded)
  const productImageIds = new Set(productImages.map((img) => img.id));

  for (const variant of variants) {
    if (!variant.image_id) {
      // No image assigned — nothing to clear
      continue;
    }

    // If the variant image points to a product image (one of our jersey designs),
    // that's fine — leave it. We only clear images that are NOT in the product images
    // (i.e., stale references to Shopify Files or deleted images).
    if (productImageIds.has(variant.image_id)) {
      // Variant points to a current product image — skip
      continue;
    }

    // Stale variant image — clear it
    console.log(
      `  [${fullProduct.title}] Variant "${variant.title}" (${variant.sku}) → clearing stale image_id ${variant.image_id}`
    );

    if (!dryRun) {
      try {
        await adminFetch(`variants/${variant.id}.json`, "PUT", {
          variant: { id: variant.id, image_id: null },
        });
        cleared++;
      } catch (e) {
        console.log(`    [FAIL] ${e.message}`);
        failed++;
      }
      await sleep(500);
    } else {
      cleared++;
    }
  }

  skipped++;
  await sleep(300);
}

console.log();
console.log("=".repeat(60));
console.log("RESULTS");
console.log(`  Products scanned: ${products.length}`);
console.log(`  Variant images cleared: ${cleared}`);
console.log(`  Failures: ${failed}`);
console.log("=".repeat(60));
