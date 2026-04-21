#!/usr/bin/env node
/**
 * Fix USA and Bosnia Shopify product images.
 * These two products still have PrintKK mockups as product images
 * instead of jersey designs. This script:
 *   1. Deletes the old mockup images from each product
 *   2. Uploads available jersey design previews
 *
 * Source: C:\Dev\hooddshop\production\previews\
 *
 * Usage:
 *   node scripts/fix-usa-bosnia-images.mjs              # execute
 *   node scripts/fix-usa-bosnia-images.mjs --dry-run    # preview only
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");
const PREVIEW_DIR = resolve(ROOT, "production", "previews");

// Load env vars
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

const dryRun = process.argv.includes("--dry-run");

// ── Nations to fix ─────────────────────────────────────────
const NATIONS_TO_FIX = [
  {
    name: "United States",
    fileName: "USA",
    shopifyKeyword: "usa",
    // Available designs (no "original/jersey" file exists for USA)
    designs: [
      // Use "home" as the hero since no original exists
      { suffix: "home",   altLabel: "Home Jersey Design",           filename: "home" },
      { suffix: "away",   altLabel: "Away Jersey Design",           filename: "away" },
      { suffix: "abbrev", altLabel: "Jersey Inspired Abbreviated",  filename: "jersey_abbrev" },
      { suffix: "flag",   altLabel: "Flag Inspired Design",         filename: "flag" },
    ],
  },
  {
    name: "Bosnia and Herzegovina",
    fileName: "Bosnia",
    shopifyKeyword: "bosnia",
    // "full" = full name jersey inspired design
    designs: [
      { suffix: "full",   altLabel: "Jersey Inspired Full Name",    filename: "jersey_fullname" },
      { suffix: "home",   altLabel: "Home Jersey Design",           filename: "home" },
      { suffix: "away",   altLabel: "Away Jersey Design",           filename: "away" },
      { suffix: "abbrev", altLabel: "Jersey Inspired Abbreviated",  filename: "jersey_abbrev" },
      { suffix: "flag",   altLabel: "Flag Inspired Design",         filename: "flag" },
    ],
  },
];

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

// ── Main ────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("FIX USA & BOSNIA PRODUCT IMAGES");
console.log(`  Store: ${STORE}`);
console.log(`  Preview dir: ${PREVIEW_DIR}`);
console.log(`  Dry run: ${dryRun}`);
console.log("=".repeat(60));

// Fetch all products
console.log("\nFetching products...");
const { products: allProducts } = await adminFetch("products.json?limit=250");
console.log(`  Found ${allProducts.length} products\n`);

for (const nation of NATIONS_TO_FIX) {
  // Find Shopify product
  const product = allProducts.find((p) =>
    p.title.toLowerCase().includes(nation.shopifyKeyword)
  );

  if (!product) {
    console.log(`[SKIP] ${nation.name}: no Shopify product found`);
    continue;
  }

  console.log(`\n[${nation.name}] Product: ${product.title} (ID: ${product.id})`);

  // Step 1: Delete existing images (the old mockups)
  const existingImages = product.images || [];
  console.log(`  Existing images: ${existingImages.length}`);

  if (!dryRun) {
    for (const img of existingImages) {
      try {
        await adminFetch(
          `products/${product.id}/images/${img.id}.json`,
          "DELETE"
        );
        console.log(`  [DEL] Image ${img.id} deleted`);
        await sleep(500);
      } catch (e) {
        console.log(`  [FAIL] Could not delete image ${img.id}: ${e.message}`);
      }
    }
  } else {
    console.log(`  [DRY] Would delete ${existingImages.length} images`);
  }

  // Step 2: Upload jersey design previews
  let uploaded = 0;
  for (const design of nation.designs) {
    const filePath = resolve(
      PREVIEW_DIR,
      `${nation.fileName}_${design.suffix}.png`
    );

    if (!existsSync(filePath)) {
      console.log(`  [MISS] ${nation.fileName}_${design.suffix}.png not found`);
      continue;
    }

    const altText = `${nation.name} ${design.altLabel} — Hood'd`;
    const fileData = readFileSync(filePath);
    const base64 = fileData.toString("base64");
    const uploadFileName = `${nation.fileName}_${design.filename}.png`;

    console.log(`  [UP] ${uploadFileName} → "${altText}"`);

    if (!dryRun) {
      try {
        await adminFetch(`products/${product.id}/images.json`, "POST", {
          image: {
            attachment: base64,
            filename: uploadFileName,
            alt: altText,
            position: uploaded + 1,
          },
        });
        uploaded++;
        await sleep(1000); // Rate limit
      } catch (e) {
        console.log(`  [FAIL] ${e.message}`);
      }
    } else {
      uploaded++;
    }
  }

  console.log(`  Uploaded: ${uploaded} designs`);
}

console.log("\nDone.");
