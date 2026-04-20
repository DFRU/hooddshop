#!/usr/bin/env node
/**
 * Push Printkk mockup renders to Shopify as product images.
 *
 * For each of the 48 nations, this script:
 *   1. Finds the matching Shopify product via Admin API
 *   2. Deletes all existing images (replace mode)
 *   3. Adds 6 Printkk CDN mockup views as new product images
 *
 * Usage:
 *   node scripts/push-mockups-to-shopify.mjs                    # all nations
 *   node scripts/push-mockups-to-shopify.mjs --dry-run           # preview only
 *   node scripts/push-mockups-to-shopify.mjs --nations us,br,ar  # specific nations
 *   node scripts/push-mockups-to-shopify.mjs --mode append       # keep existing images
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────
const ENV_PATH = resolve(__dirname, "../.env.local");
const MOCKUPS_PATH = resolve(
  __dirname,
  "../../HoodD_Project_Migration/hoodd-pipeline-v2/printkk_mockups.json"
);

// Try D:\ path first, fall back to relative
let mockupsPath = MOCKUPS_PATH;
try {
  readFileSync(mockupsPath, "utf-8");
} catch {
  // Try alternate path
  mockupsPath = "D:\\HoodD_Project_Migration\\hoodd-pipeline-v2\\printkk_mockups.json";
}

const MOCKUP_DATA = JSON.parse(readFileSync(mockupsPath, "utf-8"));
const CDN_BASE = MOCKUP_DATA._cdn_base;

// Load env vars
const envText = readFileSync(ENV_PATH, "utf-8");
const envVars = {};
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  envVars[key.trim()] = rest.join("=").trim();
}

const ADMIN_TOKEN = envVars.SHOPIFY_ADMIN_ACCESS_TOKEN || envVars.SHOPIFY_ADMIN_TOKEN;
const STORE = envVars.SHOPIFY_STORE_DOMAIN || "hoodd-shop-2.myshopify.com";
const API_VERSION = "2024-10";
const ADMIN_BASE = `https://${STORE}/admin/api/${API_VERSION}`;

if (!ADMIN_TOKEN) {
  console.error("[ERROR] No SHOPIFY_ADMIN_ACCESS_TOKEN found in .env.local");
  process.exit(1);
}

// ── Nation mappings (printkk_name → search keywords) ──────
const NATIONS = [
  { code: "us", name: "United States", printkk: "USA" },
  { code: "ca", name: "Canada", printkk: "Canada" },
  { code: "mx", name: "Mexico", printkk: "Mexico" },
  { code: "pa", name: "Panama", printkk: "Panama" },
  { code: "cw", name: "Curaçao", printkk: "Curacao" },
  { code: "ht", name: "Haiti", printkk: "Haiti" },
  { code: "ar", name: "Argentina", printkk: "Argentina" },
  { code: "br", name: "Brazil", printkk: "Brazil" },
  { code: "co", name: "Colombia", printkk: "Colombia" },
  { code: "ec", name: "Ecuador", printkk: "Ecuador" },
  { code: "py", name: "Paraguay", printkk: "Paraguay" },
  { code: "uy", name: "Uruguay", printkk: "Uruguay" },
  { code: "gb-eng", name: "England", printkk: "England" },
  { code: "fr", name: "France", printkk: "France" },
  { code: "de", name: "Germany", printkk: "Germany" },
  { code: "es", name: "Spain", printkk: "Spain" },
  { code: "pt", name: "Portugal", printkk: "Portugal" },
  { code: "nl", name: "Netherlands", printkk: "Netherlands" },
  { code: "be", name: "Belgium", printkk: "Belgium" },
  { code: "hr", name: "Croatia", printkk: "Croatia" },
  { code: "ch", name: "Switzerland", printkk: "Switzerland" },
  { code: "at", name: "Austria", printkk: "Austria" },
  { code: "no", name: "Norway", printkk: "Norway" },
  { code: "gb-sct", name: "Scotland", printkk: "Scotland" },
  { code: "se", name: "Sweden", printkk: "Sweden" },
  { code: "tr", name: "Turkey", printkk: "Turkey" },
  { code: "ba", name: "Bosnia and Herzegovina", printkk: "Bosnia" },
  { code: "cz", name: "Czechia", printkk: "CzechRepublic" },
  { code: "ma", name: "Morocco", printkk: "Morocco" },
  { code: "sn", name: "Senegal", printkk: "Senegal" },
  { code: "gh", name: "Ghana", printkk: "Ghana" },
  { code: "dz", name: "Algeria", printkk: "Algeria" },
  { code: "cv", name: "Cape Verde", printkk: "CapeVerde" },
  { code: "cd", name: "DR Congo", printkk: "DRCongo" },
  { code: "eg", name: "Egypt", printkk: "Egypt" },
  { code: "ci", name: "Ivory Coast", printkk: "IvoryCoast" },
  { code: "za", name: "South Africa", printkk: "SouthAfrica" },
  { code: "tn", name: "Tunisia", printkk: "Tunisia" },
  { code: "jp", name: "Japan", printkk: "Japan" },
  { code: "kr", name: "South Korea", printkk: "SouthKorea" },
  { code: "au", name: "Australia", printkk: "Australia" },
  { code: "sa", name: "Saudi Arabia", printkk: "SaudiArabia" },
  { code: "ir", name: "Iran", printkk: "Iran" },
  { code: "iq", name: "Iraq", printkk: "Iraq" },
  { code: "jo", name: "Jordan", printkk: "Jordan" },
  { code: "qa", name: "Qatar", printkk: "Qatar" },
  { code: "uz", name: "Uzbekistan", printkk: "Uzbekistan" },
  { code: "nz", name: "New Zealand", printkk: "NewZealand" },
];

const VIEW_NAMES = [
  "Front SUV",
  "Size Info",
  "Outdoor 3/4",
  "Close-up",
  "Side Angle",
  "White Car",
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
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  // DELETE returns 200 with empty body sometimes
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function fetchAllProducts() {
  const products = [];
  let url = "products.json?limit=250&fields=id,title,handle,images";

  while (url) {
    const result = await adminFetch(url);
    products.push(...(result.products || []));

    if ((result.products || []).length === 250) {
      const lastId = products[products.length - 1].id;
      url = `products.json?limit=250&since_id=${lastId}&fields=id,title,handle,images`;
    } else {
      url = null;
    }
  }

  return products;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const modeIdx = args.indexOf("--mode");
const mode = modeIdx >= 0 ? args[modeIdx + 1] : "replace";
const nationsIdx = args.indexOf("--nations");
const nationFilter = nationsIdx >= 0 ? new Set(args[nationsIdx + 1].split(",")) : null;

console.log("=".repeat(60));
console.log("SHOPIFY PRODUCT IMAGE UPDATER (Node.js)");
console.log(`  Store: ${STORE}`);
console.log(`  Mode: ${mode}`);
console.log(`  Dry run: ${dryRun}`);
console.log(`  Nations: ${nationFilter ? [...nationFilter].join(", ") : "all 48"}`);
console.log("=".repeat(60));

// Fetch all Shopify products
console.log("\nFetching products from Shopify Admin API...");
const allProducts = await fetchAllProducts();
console.log(`  Found ${allProducts.length} products\n`);

// Build lookup: lowercase title → product
const productMap = new Map();
for (const p of allProducts) {
  productMap.set(p.title.toLowerCase(), p);
}

let success = 0;
let skipped = 0;
let failed = 0;

for (const nation of NATIONS) {
  if (nationFilter && !nationFilter.has(nation.code)) continue;

  // Get mockup hashes
  const hashes = MOCKUP_DATA.designs[nation.printkk];
  if (!hashes || hashes.length === 0) {
    console.log(`  [${nation.code.padEnd(8)}] ${nation.name.padEnd(25)} — no mockup data, skipping`);
    skipped++;
    continue;
  }

  // Find matching Shopify product
  const searchTerms = [
    nation.name.toLowerCase(),
    nation.printkk.toLowerCase(),
  ];
  // Add common alternates
  if (nation.code === "us") searchTerms.push("united states", "usa");
  if (nation.code === "cz") searchTerms.push("czech", "czechia");
  if (nation.code === "ba") searchTerms.push("bosnia");
  if (nation.code === "cv") searchTerms.push("cape verde");

  let matchedProduct = null;
  for (const [title, product] of productMap) {
    // Normalize unicode
    const titleNorm = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (const term of searchTerms) {
      const termNorm = term.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (titleNorm.includes(termNorm)) {
        matchedProduct = product;
        break;
      }
    }
    if (matchedProduct) break;
  }

  if (!matchedProduct) {
    console.log(`  [${nation.code.padEnd(8)}] ${nation.name.padEnd(25)} — no Shopify product found`);
    skipped++;
    continue;
  }

  const productId = matchedProduct.id;
  const cdnUrls = hashes.map((h) => `${CDN_BASE}/${h}`);

  console.log(
    `  [${nation.code.padEnd(8)}] ${nation.name.padEnd(25)} → product #${productId} (${cdnUrls.length} views)`
  );

  if (dryRun) {
    console.log(`           Would ${mode} ${cdnUrls.length} mockup images`);
    success++;
    continue;
  }

  try {
    // Delete existing images if replacing
    if (mode === "replace") {
      const existing = matchedProduct.images || [];
      for (const img of existing) {
        try {
          await adminFetch(
            `products/${productId}/images/${img.id}.json`,
            "DELETE"
          );
          console.log(`    Deleted existing image #${img.id}`);
        } catch (e) {
          console.log(`    [WARN] Could not delete image #${img.id}: ${e.message}`);
        }
        await sleep(600); // Rate limit: ~2 req/sec
      }
    }

    // Add new mockup images
    let allOk = true;
    for (let i = 0; i < cdnUrls.length; i++) {
      const viewLabel = VIEW_NAMES[i] || `View ${i}`;
      const altText = `${nation.name} Car Hood Cover ${viewLabel} — Hood'd World Cup 2026`;

      try {
        const result = await adminFetch(
          `products/${productId}/images.json`,
          "POST",
          {
            image: {
              src: cdnUrls[i],
              alt: altText,
              position: i + 1,
            },
          }
        );
        const imgId = result.image?.id || "?";
        console.log(`    Added view ${i} (${viewLabel}) — image #${imgId}`);
      } catch (e) {
        console.log(`    [FAIL] View ${i} (${viewLabel}): ${e.message}`);
        allOk = false;
      }
      await sleep(600); // Rate limit
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
console.log(`  Success: ${success}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Failed:  ${failed}`);
console.log("=".repeat(60));
