#!/usr/bin/env node
/**
 * Upload ALL jersey design images to Shopify as product images.
 *
 * Per nation, uploads up to 6 designs in this order:
 *   1. Original jersey (plain, no text) — the hero/truck design
 *   2. Jersey-inspired with full nation name (different design from original)
 *   3. Jersey-inspired with abbreviated FIFA code (different design from original)
 *   4. Home jersey colorway (with nation name)
 *   5. Away jersey colorway (with nation name)
 *   6. Flag-inspired colorway (with nation name)
 *
 * Source: D:\HOODD\01_PRODUCTION\ (organized production folder)
 *
 * Alt text convention (used by frontend for filtering):
 *   "{Nation} {Design Label} — Hood'd"
 *
 * Usage:
 *   node scripts/upload-jersey-designs.mjs                    # all nations
 *   node scripts/upload-jersey-designs.mjs --dry-run          # preview only
 *   node scripts/upload-jersey-designs.mjs --nations us,br    # specific nations
 *   node scripts/upload-jersey-designs.mjs --delete-existing  # replace all existing images
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────
const ENV_PATH = resolve(__dirname, "../.env.local");

// All source dirs now point to the organized D:\HOODD\01_PRODUCTION structure
const PRODUCTION_ROOT = "D:\\HOODD\\01_PRODUCTION";
const ORIGINAL_DIR    = `${PRODUCTION_ROOT}\\original_jersey\\plain`;
const FULL_NAME_DIR   = `${PRODUCTION_ROOT}\\jersey_inspired\\full_name`;
const ABBREV_DIR      = `${PRODUCTION_ROOT}\\jersey_inspired\\abbreviated`;
const HOME_DIR        = `${PRODUCTION_ROOT}\\home_jersey`;
const AWAY_DIR        = `${PRODUCTION_ROOT}\\away_jersey`;
const FLAG_DIR        = `${PRODUCTION_ROOT}\\flag_inspired`;

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

// ── Nation mappings ─────────────────────────────────────────
const NATIONS = [
  { code: "us", name: "United States", fileName: "USA", shopifyKeyword: "USA" },
  { code: "ca", name: "Canada", fileName: "Canada", shopifyKeyword: "Canada" },
  { code: "mx", name: "Mexico", fileName: "Mexico", shopifyKeyword: "Mexico" },
  { code: "pa", name: "Panama", fileName: "Panama", shopifyKeyword: "Panama" },
  { code: "cw", name: "Curaçao", fileName: "Curacao", shopifyKeyword: "Curaçao" },
  { code: "ht", name: "Haiti", fileName: "Haiti", shopifyKeyword: "Haiti" },
  { code: "ar", name: "Argentina", fileName: "Argentina", shopifyKeyword: "Argentina" },
  { code: "br", name: "Brazil", fileName: "Brazil", shopifyKeyword: "Brazil" },
  { code: "co", name: "Colombia", fileName: "Colombia", shopifyKeyword: "Colombia" },
  { code: "ec", name: "Ecuador", fileName: "Ecuador", shopifyKeyword: "Ecuador" },
  { code: "py", name: "Paraguay", fileName: "Paraguay", shopifyKeyword: "Paraguay" },
  { code: "uy", name: "Uruguay", fileName: "Uruguay", shopifyKeyword: "Uruguay" },
  { code: "gb-eng", name: "England", fileName: "England", shopifyKeyword: "England" },
  { code: "fr", name: "France", fileName: "France", shopifyKeyword: "France" },
  { code: "de", name: "Germany", fileName: "Germany", shopifyKeyword: "Germany" },
  { code: "es", name: "Spain", fileName: "Spain", shopifyKeyword: "Spain" },
  { code: "pt", name: "Portugal", fileName: "Portugal", shopifyKeyword: "Portugal" },
  { code: "nl", name: "Netherlands", fileName: "Netherlands", shopifyKeyword: "Netherlands" },
  { code: "be", name: "Belgium", fileName: "Belgium", shopifyKeyword: "Belgium" },
  { code: "hr", name: "Croatia", fileName: "Croatia", shopifyKeyword: "Croatia" },
  { code: "ch", name: "Switzerland", fileName: "Switzerland", shopifyKeyword: "Switzerland" },
  { code: "at", name: "Austria", fileName: "Austria", shopifyKeyword: "Austria" },
  { code: "no", name: "Norway", fileName: "Norway", shopifyKeyword: "Norway" },
  { code: "gb-sct", name: "Scotland", fileName: "Scotland", shopifyKeyword: "Scotland" },
  { code: "se", name: "Sweden", fileName: "Sweden", shopifyKeyword: "Sweden" },
  { code: "tr", name: "Turkey", fileName: "Turkey", shopifyKeyword: "Turkey" },
  { code: "ba", name: "Bosnia and Herzegovina", fileName: "Bosnia", shopifyKeyword: "Bosnia" },
  { code: "cz", name: "Czechia", fileName: "Czech_Republic", shopifyKeyword: "Czech" },
  { code: "ma", name: "Morocco", fileName: "Morocco", shopifyKeyword: "Morocco" },
  { code: "sn", name: "Senegal", fileName: "Senegal", shopifyKeyword: "Senegal" },
  { code: "gh", name: "Ghana", fileName: "Ghana", shopifyKeyword: "Ghana" },
  { code: "dz", name: "Algeria", fileName: "Algeria", shopifyKeyword: "Algeria" },
  { code: "cv", name: "Cape Verde", fileName: "Cape_Verde", shopifyKeyword: "Cape Verde" },
  { code: "cd", name: "DR Congo", fileName: "DR_Congo", shopifyKeyword: "DR Congo" },
  { code: "eg", name: "Egypt", fileName: "Egypt", shopifyKeyword: "Egypt" },
  { code: "ci", name: "Ivory Coast", fileName: "Ivory_Coast", shopifyKeyword: "Ivory Coast" },
  { code: "za", name: "South Africa", fileName: "South_Africa", shopifyKeyword: "South Africa" },
  { code: "tn", name: "Tunisia", fileName: "Tunisia", shopifyKeyword: "Tunisia" },
  { code: "jp", name: "Japan", fileName: "Japan", shopifyKeyword: "Japan" },
  { code: "kr", name: "South Korea", fileName: "South_Korea", shopifyKeyword: "South Korea" },
  { code: "au", name: "Australia", fileName: "Australia", shopifyKeyword: "Australia" },
  { code: "sa", name: "Saudi Arabia", fileName: "Saudi_Arabia", shopifyKeyword: "Saudi Arabia" },
  { code: "ir", name: "Iran", fileName: "Iran", shopifyKeyword: "Iran" },
  { code: "iq", name: "Iraq", fileName: "Iraq", shopifyKeyword: "Iraq" },
  { code: "jo", name: "Jordan", fileName: "Jordan", shopifyKeyword: "Jordan" },
  { code: "qa", name: "Qatar", fileName: "Qatar", shopifyKeyword: "Qatar" },
  { code: "uz", name: "Uzbekistan", fileName: "Uzbekistan", shopifyKeyword: "Uzbekistan" },
  { code: "nz", name: "New Zealand", fileName: "New_Zealand", shopifyKeyword: "New Zealand" },
];

// ── Design types to upload, in display order ────────────────
// suffix = filename part after nation name (e.g., Argentina_{suffix}.png)
// dir = source directory
// altLabel = Shopify alt text label (frontend uses this for filtering)
// filename = uploaded filename stem (e.g., Argentina_{filename}.png)
const DESIGN_TYPES = [
  { suffix: "jersey", dir: ORIGINAL_DIR,  altLabel: "Original Design",              filename: "original" },
  { suffix: "full",   dir: FULL_NAME_DIR, altLabel: "Jersey Inspired Full Name",    filename: "jersey_fullname" },
  { suffix: "abbrev", dir: ABBREV_DIR,    altLabel: "Jersey Inspired Abbreviated",  filename: "jersey_abbrev" },
  { suffix: "home",   dir: HOME_DIR,      altLabel: "Home Jersey Design",           filename: "home" },
  { suffix: "away",   dir: AWAY_DIR,      altLabel: "Away Jersey Design",           filename: "away" },
  { suffix: "flag",   dir: FLAG_DIR,      altLabel: "Flag Inspired Design",         filename: "flag" },
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const deleteExisting = args.includes("--delete-existing");
const nationsIdx = args.indexOf("--nations");
const nationFilter =
  nationsIdx >= 0 ? new Set(args[nationsIdx + 1].split(",")) : null;

console.log("=".repeat(60));
console.log("JERSEY DESIGN → SHOPIFY UPLOADER");
console.log(`  Store: ${STORE}`);
console.log(`  Production root: ${PRODUCTION_ROOT}`);
console.log(`  Dry run: ${dryRun}`);
console.log(`  Delete existing: ${deleteExisting}`);
console.log(
  `  Nations: ${nationFilter ? [...nationFilter].join(", ") : "all 48"}`
);
console.log("=".repeat(60));

// ── Scan available files ────────────────────────────────────
let totalFiles = 0;
let totalMissing = 0;
for (const nation of NATIONS) {
  if (nationFilter && !nationFilter.has(nation.code)) continue;
  for (const dt of DESIGN_TYPES) {
    const filePath = resolve(dt.dir, `${nation.fileName}_${dt.suffix}.png`);
    if (existsSync(filePath)) {
      totalFiles++;
    } else {
      totalMissing++;
    }
  }
}
console.log(`\n  Files found: ${totalFiles}`);
console.log(`  Files missing: ${totalMissing} (will be skipped per-nation)\n`);

// ── Fetch all Shopify products ──────────────────────────────
console.log("Fetching products from Shopify Admin API...");
const allProducts = await fetchAllProducts();
console.log(`  Found ${allProducts.length} products\n`);

// Build lookup: lowercase title → product
const productMap = new Map();
for (const p of allProducts) {
  productMap.set(p.title.toLowerCase(), p);
}

// Helper to match a nation to its Shopify product
function findProduct(nation) {
  const searchTerms = [
    nation.shopifyKeyword.toLowerCase(),
    nation.name.toLowerCase(),
    nation.fileName.toLowerCase().replace(/_/g, " "),
  ];

  for (const [title, product] of productMap) {
    const titleNorm = title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    for (const term of searchTerms) {
      const termNorm = term
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      if (titleNorm.includes(termNorm)) {
        return product;
      }
    }
  }
  return null;
}

let success = 0;
let skipped = 0;
let failed = 0;

for (const nation of NATIONS) {
  if (nationFilter && !nationFilter.has(nation.code)) continue;

  const product = findProduct(nation);
  if (!product) {
    console.log(
      `  [${nation.code.padEnd(8)}] ${nation.name.padEnd(25)} — no Shopify product found`
    );
    skipped++;
    continue;
  }

  const productId = product.id;

  // Collect all available design files for this nation
  const designs = [];
  for (const dt of DESIGN_TYPES) {
    const filePath = resolve(dt.dir, `${nation.fileName}_${dt.suffix}.png`);
    if (existsSync(filePath)) {
      designs.push({ ...dt, filePath });
    }
  }

  if (designs.length === 0) {
    console.log(
      `  [${nation.code.padEnd(8)}] ${nation.name.padEnd(25)} — no design files found`
    );
    skipped++;
    continue;
  }

  console.log(
    `  [${nation.code.padEnd(8)}] ${nation.name.padEnd(25)} → product #${productId} (${designs.length} designs)`
  );

  if (dryRun) {
    for (const d of designs) {
      console.log(`    Would upload: ${d.altLabel} (${d.suffix})`);
    }
    success++;
    continue;
  }

  try {
    // ── Step 1: Delete all existing images ─────────────────
    if (deleteExisting) {
      const existingImages = product.images || [];
      for (const img of existingImages) {
        try {
          await adminFetch(
            `products/${productId}/images/${img.id}.json`,
            "DELETE"
          );
          console.log(`    Deleted image #${img.id}`);
        } catch (e) {
          console.log(
            `    [WARN] Could not delete image #${img.id}: ${e.message}`
          );
        }
        await sleep(500);
      }
    }

    // ── Step 2: Upload all designs in order ────────────────
    let allOk = true;
    let position = 1;

    for (const design of designs) {
      const altText = `${nation.name} ${design.altLabel} — Hood'd`;

      // Read file as base64
      const fileBuffer = readFileSync(design.filePath);
      const base64Data = fileBuffer.toString("base64");

      try {
        const imagePayload = {
          image: {
            attachment: base64Data,
            filename: `${nation.fileName}_${design.filename}.png`,
            alt: altText,
            position: position,
          },
        };

        const result = await adminFetch(
          `products/${productId}/images.json`,
          "POST",
          imagePayload
        );
        const imgId = result.image?.id || "?";
        console.log(
          `    [${position}] ${design.altLabel} → image #${imgId}`
        );
        position++;
      } catch (e) {
        console.log(`    [FAIL] ${design.altLabel}: ${e.message}`);
        allOk = false;
      }
      await sleep(600); // Rate limit: ~2 req/sec
    }

    if (allOk) success++;
    else failed++;
  } catch (e) {
    console.log(`    [ERROR] ${e.message}`);
    failed++;
  }
}

console.log();
console.log("=".repeat(60));
console.log("RESULTS");
console.log(`  Success: ${success}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Failed:  ${failed}`);
console.log("=".repeat(60));
console.log();
console.log("Image order per product:");
console.log("  1. Original (plain, no text — the hero design)");
console.log("  2. Jersey-inspired + full nation name");
console.log("  3. Jersey-inspired + abbreviated FIFA code");
console.log("  4. Home jersey colorway");
console.log("  5. Away jersey colorway");
console.log("  6. Flag-inspired colorway");
