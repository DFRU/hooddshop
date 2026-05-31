/**
 * Update all Hood'd product variant prices storewide.
 * Standard size: $34.99
 * XL size: $44.99
 *
 * Usage:
 *   npx tsx components/scripts/update_prices_storewide.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local
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

interface FullProductVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
}

interface FullProduct {
  id: number;
  title: string;
  handle: string;
  variants: FullProductVariant[];
}

async function listAllHoodCovers(): Promise<FullProduct[]> {
  const data = await shopifyAdminFetch<{ products: FullProduct[] }>(
    "/products.json?limit=250&product_type=Car Hood Cover&status=active,draft"
  );
  return data.products;
}

async function main() {
  console.log("=== Hood'd Price Update Storewide ===");
  console.log("Target Prices:");
  console.log("  - Standard: $34.99");
  console.log("  - XL size:  $44.99\n");

  const products = await listAllHoodCovers();
  console.log(`Found ${products.length} products to update.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of products) {
    // Determine target price per variant
    const variantUpdates = p.variants.map((v) => {
      const isXl = v.title.toLowerCase().includes("xl") || v.sku.toUpperCase().endsWith("-XL");
      return {
        id: v.id,
        price: isXl ? "44.99" : "34.99",
      };
    });

    // Check if update is needed
    const needsUpdate = p.variants.some((v, idx) => {
      return v.price !== variantUpdates[idx].price;
    });

    if (!needsUpdate) {
      console.log(`— ${p.handle}: prices already correct, skipping`);
      skipped++;
      continue;
    }

    try {
      await shopifyAdminFetch(`/products/${p.id}.json`, {
        method: "PUT",
        body: {
          product: {
            id: p.id,
            variants: variantUpdates,
          },
        },
      });

      console.log(`✓ ${p.handle}: prices updated successfully`);
      updated++;
    } catch (err) {
      console.error(`✗ ${p.handle}: ERROR updating prices — ${err}`);
      errors++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped} (already correct)`);
  console.log(`Errors:  ${errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
