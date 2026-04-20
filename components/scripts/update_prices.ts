/**
 * Update all Hood'd product variant prices to a new CAD amount.
 *
 * Usage:
 *   npx tsx components/scripts/update_prices.ts
 *
 * Defaults to $62.49 CAD (≈ $44.99 USD at ~0.72 rate).
 * Override with: npx tsx components/scripts/update_prices.ts --price 5999
 *   (price in cents, so 5999 = $59.99)
 */

import "./load-env";
import { NATIONS } from "../../lib/nations";
import { shopifyAdminFetch, getProductByHandle } from "../../lib/shopify-admin";

const DEFAULT_PRICE_CENTS = 6249; // $62.49 CAD

function makeHandle(nationName: string): string {
  return `hoodd-${nationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-jersey-line`;
}

function parsePriceArg(): number {
  const idx = process.argv.indexOf("--price");
  if (idx !== -1 && process.argv[idx + 1]) {
    const cents = parseInt(process.argv[idx + 1], 10);
    if (isNaN(cents) || cents <= 0) {
      console.error("Invalid --price value. Provide price in cents (e.g. 6249 = $62.49)");
      process.exit(1);
    }
    return cents;
  }
  return DEFAULT_PRICE_CENTS;
}

async function main() {
  const priceCents = parsePriceArg();
  const priceStr = (priceCents / 100).toFixed(2);
  const targetNations = NATIONS.filter((n) => n.wc2026);

  console.log("=== Hood'd Price Update ===");
  console.log(`Target price: $${priceStr} CAD`);
  console.log(`Products to update: ${targetNations.length}\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;

  for (const nation of targetNations) {
    const handle = makeHandle(nation.name);
    const product = await getProductByHandle(handle);

    if (!product) {
      console.log(`✗ ${nation.name}: NOT FOUND (${handle})`);
      notFound++;
      continue;
    }

    // Check if all variants already have the target price
    const allCorrect = product.variants.every(
      (v) => (v as any).price === priceStr
    );

    if (allCorrect) {
      console.log(`— ${nation.name}: already $${priceStr}, skipping`);
      skipped++;
      continue;
    }

    // Update each variant's price
    try {
      const variantUpdates = product.variants.map((v) => ({
        id: v.id,
        price: priceStr,
      }));

      await shopifyAdminFetch(`/products/${product.id}.json`, {
        method: "PUT",
        body: {
          product: {
            id: product.id,
            variants: variantUpdates,
          },
        },
      });

      const oldPrices = product.variants
        .map((v) => `${v.title}=$${(v as any).price || "?"}`)
        .join(", ");
      console.log(`✓ ${nation.name}: ${oldPrices} → $${priceStr}`);
      updated++;
    } catch (err) {
      console.error(`✗ ${nation.name}: ERROR — ${err}`);
      errors++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Updated:   ${updated}`);
  console.log(`Skipped:   ${skipped} (already correct)`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors:    ${errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
