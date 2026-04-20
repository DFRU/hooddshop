/**
 * Fix variant images: associates preview images with variants
 * on Shopify products that are missing them.
 *
 * The upload_catalog.ts restructure path created Away variants but didn't
 * upload/associate images for them. This script reads each variant's asset
 * preview_url from the DB and creates the Shopify product image.
 *
 * Checks BOTH Home and Away variants for completeness.
 *
 * Usage:
 *   npx tsx components/scripts/fix_away_images.ts
 *   npx tsx components/scripts/fix_away_images.ts --dry-run
 */

import "./load-env";
import { NATIONS } from "../../lib/nations";
import {
  getProductByHandle,
  createProductImage,
  shopifyAdminFetch,
} from "../../lib/shopify-admin";
import { getAssetByNationAndVariant } from "../../lib/db/queries";

const DRY_RUN = process.argv.includes("--dry-run");

function makeHandle(nationName: string): string {
  return `hoodd-${nationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-jersey-line`;
}

interface FullProduct {
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

async function main() {
  const targetNations = NATIONS.filter((n) => n.wc2026);

  console.log("=== Hood'd Away Image Fix ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Checking ${targetNations.length} nations...\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let noAsset = 0;
  let notFound = 0;
  let errors = 0;

  const variantsToCheck = ["home", "away"];

  for (const nation of targetNations) {
    const handle = makeHandle(nation.name);
    const product = await getProductByHandle(handle) as FullProduct | null;

    if (!product) {
      console.log(`✗ ${nation.name}: product not found`);
      notFound++;
      continue;
    }

    for (const variantName of variantsToCheck) {
      const variant = product.variants.find(
        (v) => v.title.toLowerCase() === variantName
      );

      if (!variant) {
        console.log(`✗ ${nation.name} ${variantName}: variant not found`);
        errors++;
        continue;
      }

      // Check if variant already has an associated image
      const hasImage = product.images.some(
        (img) => img.variant_ids.includes(variant.id)
      );

      if (hasImage) {
        console.log(`— ${nation.name} ${variantName}: already has image`);
        alreadyOk++;
        continue;
      }

      // Look up the asset in the DB to get the preview URL
      const asset = await getAssetByNationAndVariant(
        nation.code.toUpperCase(),
        variantName
      );

      if (!asset || !asset.preview_url) {
        console.log(`✗ ${nation.name} ${variantName}: no asset/preview_url in DB`);
        noAsset++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`✓ ${nation.name} ${variantName}: WOULD upload image`);
        fixed++;
        continue;
      }

      // Upload the image and associate with the variant
      try {
        const image = await createProductImage(
          product.id,
          asset.preview_url,
          [variant.id]
        );
        console.log(`✓ ${nation.name} ${variantName}: image uploaded (image_id=${image.id})`);
        fixed++;
      } catch (err) {
        console.error(`✗ ${nation.name} ${variantName}: image upload failed — ${err}`);
        errors++;
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Fixed:        ${fixed}`);
  console.log(`Already OK:   ${alreadyOk}`);
  console.log(`No asset/URL: ${noAsset}`);
  console.log(`Not found:    ${notFound}`);
  console.log(`Errors:       ${errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
