/**
 * Bulk catalog upload script.
 * Uploads design assets to Vercel Blob and creates/updates Shopify products.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §10.2, TWO-SIZE-VARIANT-SPEC.md §4
 *
 * Usage:
 *   npx tsx scripts/upload_catalog.ts \
 *     --source ./production_v2 \
 *     --generation-run production_v2 \
 *     --variants home,away \
 *     --price 4999 \
 *     [--nations France,Argentina] \
 *     [--drop group-stage-1] \
 *     [--drop-type house] \
 *     [--inventory 100] \
 *     [--final-sale] \
 *     [--dry-run]
 *
 * Requires: DATABASE_URL, BLOB_READ_WRITE_TOKEN, SHOPIFY_ADMIN_ACCESS_TOKEN
 */

import "./load-env";
import * as fs from "fs";
import * as path from "path";
import { put } from "@vercel/blob";
import { NATIONS, type Nation } from "../../lib/nations";
import { upsertAsset, updateAssetShopifyIds } from "../../lib/db/queries";
import {
  createProduct,
  getProductByHandle,
  updateProduct,
  createProductImage,
  setVariantMetafields,
  getLocations,
  setInventoryLevel,
  shopifyAdminFetch,
  type CreateProductInput,
  type ShopifyAdminVariant,
} from "../../lib/shopify-admin";

// ─── CLI Argument Parsing ────────────────────────────────────────

interface CliArgs {
  source: string;
  generationRun: string;
  variants: string[];
  nations: string[] | null; // null = all 48
  price: number; // in cents
  drop: string | null;
  dropType: string | null;
  inventory: number;
  finalSale: boolean;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };
  const has = (flag: string): boolean => args.includes(flag);

  const source = get("--source");
  if (!source) {
    console.error("Error: --source <dir> is required");
    process.exit(1);
  }

  const generationRun = get("--generation-run") || "production_v2";
  const variants = (get("--variants") || "home,away").split(",");
  const nationsArg = get("--nations");
  const nations = nationsArg ? nationsArg.split(",") : null;
  const price = parseInt(get("--price") || "4999", 10);
  const drop = get("--drop") || null;
  const dropType = get("--drop-type") || null;
  const inventory = parseInt(get("--inventory") || "9999", 10);
  const finalSale = has("--final-sale") || !!drop; // drops default to final-sale
  const dryRun = has("--dry-run");

  return {
    source,
    generationRun,
    variants,
    nations,
    price,
    drop,
    dropType,
    inventory,
    finalSale,
    dryRun,
  };
}

// ─── Asset File Discovery ────────────────────────────────────────

/**
 * Pipeline name overrides.
 * The generation pipeline (generate_concept_typo.py) uses different names
 * than lib/nations.ts. Files are in Title_Case (e.g. "Bosnia_home.png").
 */
const PIPELINE_NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "Curaçao": "Curacao",
  "Bosnia and Herzegovina": "Bosnia",
  "Czechia": "Czech_Republic",
  "DR Congo": "DR_Congo",
  "South Korea": "South_Korea",
  "Saudi Arabia": "Saudi_Arabia",
  "South Africa": "South_Africa",
  "Ivory Coast": "Ivory_Coast",
  "Cape Verde": "Cape_Verde",
  "New Zealand": "New_Zealand",
};

/**
 * Find the print file for a nation+variant in the source directory.
 * The generation pipeline outputs files as {PipelineName}_{variant}.png
 * in print/ and previews/ subdirectories.
 */
function findAssetFile(
  sourceDir: string,
  nationName: string,
  variant: string
): string | null {
  // Primary: use pipeline name map (Title_Case)
  const pipelineName = PIPELINE_NAME_MAP[nationName] || nationName.replace(/\s+/g, "_");
  // Fallback: lowercase with underscores
  const lowerName = nationName.toLowerCase().replace(/\s+/g, "_");

  const candidates = [pipelineName, lowerName, nationName.replace(/\s+/g, "_")];
  const subdirs = ["print", "previews", ""];

  for (const sub of subdirs) {
    for (const name of candidates) {
      const filePath = path.join(sourceDir, sub, `${name}_${variant}.png`);
      if (fs.existsSync(filePath)) return filePath;
    }
  }

  return null;
}

/**
 * Find the preview file (from previews/ subdirectory).
 */
function findPreviewFile(
  sourceDir: string,
  nationName: string,
  variant: string
): string | null {
  const pipelineName = PIPELINE_NAME_MAP[nationName] || nationName.replace(/\s+/g, "_");
  const candidates = [pipelineName, nationName.toLowerCase().replace(/\s+/g, "_")];

  for (const name of candidates) {
    const filePath = path.join(sourceDir, "previews", `${name}_${variant}.png`);
    if (fs.existsSync(filePath)) return filePath;
  }

  return null;
}

// ─── Vercel Blob Upload ──────────────────────────────────────────

async function uploadToBlob(
  filePath: string,
  blobPath: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN not set");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const blob = await put(blobPath, fileBuffer, {
    access: "public",
    contentType: "image/png",
    token,
  });

  return blob.url;
}

// ─── SKU Helpers ─────────────────────────────────────────────────

function nationCodeToSku(code: string): string {
  // Per TWO-SIZE-VARIANT-SPEC.md §3.3
  return code.toUpperCase().replace("-", "-");
  // gb-eng → GB-ENG, gb-sct → GB-SCT, ar → AR
}

function makeAssetId(
  nationCode: string,
  variant: string,
  generationRun: string
): string {
  const version = generationRun.replace("production_", "v").replace("production", "v1");
  return `${nationCode.replace("-", "_")}_${variant}_${version}`;
}

function makeHandle(nationName: string): string {
  // Per TWO-SIZE-VARIANT-SPEC.md §3.3
  return `hoodd-${nationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-jersey-line`;
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  console.log("=== Hood'd Upload Catalog ===");
  console.log(`Source:     ${args.source}`);
  console.log(`Generation: ${args.generationRun}`);
  console.log(`Variants:   ${args.variants.join(", ")}`);
  console.log(`Nations:    ${args.nations ? args.nations.join(", ") : "all 48"}`);
  console.log(`Price:      $${(args.price / 100).toFixed(2)}`);
  console.log(`Inventory:  ${args.inventory}`);
  console.log(`Drop:       ${args.drop || "none (evergreen)"}`);
  console.log(`Final sale: ${args.finalSale}`);
  console.log(`Dry run:    ${args.dryRun}`);
  console.log("");

  // Filter nations
  const targetNations = args.nations
    ? NATIONS.filter((n) =>
        args.nations!.some(
          (t) =>
            t.toLowerCase() === n.name.toLowerCase() ||
            t.toLowerCase() === n.code
        )
      )
    : NATIONS.filter((n) => n.wc2026);

  if (targetNations.length === 0) {
    console.error("Error: no matching nations found");
    process.exit(1);
  }

  console.log(`Processing ${targetNations.length} nations × ${args.variants.length} variants = ${targetNations.length * args.variants.length} assets\n`);

  // Get Shopify location ID (needed for inventory)
  let locationId: number | null = null;
  if (!args.dryRun) {
    try {
      const locations = await getLocations();
      const active = locations.find((l) => l.active);
      locationId = active?.id || null;
      if (locationId) {
        console.log(`Shopify location: ${active!.name} (${locationId})`);
      }
    } catch (err) {
      console.warn(`Warning: could not fetch Shopify locations: ${err}`);
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const nation of targetNations) {
    console.log(`\n── ${nation.name} (${nation.code}) ──`);

    // Check that at least one variant file exists
    const variantFiles: Array<{
      variant: string;
      printFilePath: string;
      previewFilePath: string | null;
    }> = [];

    for (const variant of args.variants) {
      const printFilePath = findAssetFile(args.source, nation.name, variant);
      const previewFilePath = findPreviewFile(args.source, nation.name, variant);
      if (printFilePath) {
        variantFiles.push({ variant, printFilePath, previewFilePath });
        console.log(`  ${variant}: ${path.basename(printFilePath)}${previewFilePath ? " + preview" : ""}`);
      } else {
        console.warn(`  ${variant}: FILE NOT FOUND — skipping`);
      }
    }

    if (variantFiles.length === 0) {
      console.warn(`  No variant files found — skipping nation entirely`);
      skipped++;
      continue;
    }

    if (args.dryRun) {
      console.log(`  [DRY RUN] Would create product with ${variantFiles.length} variants`);
      continue;
    }

    try {
      // Upload assets to Blob and DB
      const variantData: Array<{
        variant: string;
        assetId: string;
        printFileUrl: string;
        previewUrl: string;
      }> = [];

      for (const { variant, printFilePath, previewFilePath } of variantFiles) {
        const assetId = makeAssetId(nation.code, variant, args.generationRun);
        const printBlobPath = `assets/${args.generationRun}/print/${nation.code}_${variant}.png`;
        const previewBlobPath = `assets/${args.generationRun}/previews/${nation.code}_${variant}.png`;

        console.log(`  Uploading ${variant} print file to Blob...`);
        const printFileUrl = await uploadToBlob(printFilePath, printBlobPath);

        let previewUrl: string;
        if (previewFilePath) {
          console.log(`  Uploading ${variant} preview to Blob...`);
          previewUrl = await uploadToBlob(previewFilePath, previewBlobPath);
        } else {
          previewUrl = printFileUrl; // fallback: use print file as preview
        }

        // Upsert asset in DB
        await upsertAsset({
          id: assetId,
          nationKey: nation.name,
          nationCode: nation.code.toUpperCase(),
          variantName: variant,
          generationRun: args.generationRun,
          printFileUrl,
          previewUrl,
        });

        variantData.push({ variant, assetId, printFileUrl, previewUrl });
        console.log(`  ${variant}: asset=${assetId}`);
      }

      // Check if Shopify product already exists
      const handle = makeHandle(nation.name);
      const existing = await getProductByHandle(handle);

      if (existing) {
        console.log(`  Product exists (${existing.id}), updating...`);
        console.log(`    Existing variants: ${existing.variants.map(sv => `${sv.id}/${JSON.stringify(sv.title)}/SKU=${sv.sku}`).join(', ')}`);
        const skuPrefix = nationCodeToSku(nation.code);

        // Determine if this product needs restructuring (single-variant → two-variant)
        const needsRestructure = existing.variants.length === 1 && variantData.length > 1;

        if (needsRestructure) {
          // Single-variant product → needs option + second variant added.
          // Delete the old single variant and recreate with proper option structure.
          console.log(`    ⚠ Product has 1 variant but need ${variantData.length}. Restructuring...`);

          // Update the product to have the "Design" option
          await shopifyAdminFetch(`/products/${existing.id}.json`, {
            method: "PUT",
            body: {
              product: {
                id: existing.id,
                options: [{ name: "Design", values: variantData.map(v => v.variant.charAt(0).toUpperCase() + v.variant.slice(1)) }],
              },
            },
          });

          // Update existing variant to be the first variant (Home)
          const firstVariant = existing.variants[0];
          const firstExpectedSku = `${skuPrefix}-${variantData[0].variant.toUpperCase()}`;
          const firstTitle = variantData[0].variant.charAt(0).toUpperCase() + variantData[0].variant.slice(1);
          console.log(`    Updating variant ${firstVariant.id}: title="${firstTitle}", SKU="${firstExpectedSku}"`);
          await shopifyAdminFetch(`/variants/${firstVariant.id}.json`, {
            method: "PUT",
            body: {
              variant: {
                id: firstVariant.id,
                option1: firstTitle,
                sku: firstExpectedSku,
                price: (args.price / 100).toFixed(2),
              },
            },
          });
          await updateAssetShopifyIds(variantData[0].assetId, String(existing.id), String(firstVariant.id));

          // Create additional variants
          for (let i = 1; i < variantData.length; i++) {
            const v = variantData[i];
            const expectedSku = `${skuPrefix}-${v.variant.toUpperCase()}`;
            const title = v.variant.charAt(0).toUpperCase() + v.variant.slice(1);
            console.log(`    Creating new variant: title="${title}", SKU="${expectedSku}"`);

            const resp = await shopifyAdminFetch<{ variant: { id: number } }>(
              `/products/${existing.id}/variants.json`,
              {
                method: "POST",
                body: {
                  variant: {
                    option1: title,
                    sku: expectedSku,
                    price: (args.price / 100).toFixed(2),
                    inventory_management: "shopify",
                    inventory_policy: args.drop ? "deny" : "continue",
                  },
                },
              }
            );
            await updateAssetShopifyIds(v.assetId, String(existing.id), String(resp.variant.id));
            console.log(`    Created variant ${resp.variant.id}`);
          }
        } else {
          // Multi-variant product → match by title, then by index as fallback
          for (let vi = 0; vi < variantData.length; vi++) {
            const v = variantData[vi];
            const expectedSku = `${skuPrefix}-${v.variant.toUpperCase()}`;
            const titleTarget = v.variant.toLowerCase(); // "home" or "away"

            // Strategy 1: match by title (exact, case-insensitive)
            let matchingVariant = existing.variants.find(
              (sv) => sv.title.toLowerCase() === titleTarget
            );

            // Strategy 2: match by index if same count
            if (!matchingVariant && existing.variants.length === variantData.length) {
              matchingVariant = existing.variants[vi];
              console.log(`    (title match failed for "${titleTarget}", falling back to index ${vi}: variant ${matchingVariant.id}/${JSON.stringify(matchingVariant.title)})`);
            }

            if (matchingVariant) {
              // Update SKU and title if needed
              const updates: Record<string, unknown> = { id: matchingVariant.id };
              let needsUpdate = false;

              if (matchingVariant.sku !== expectedSku) {
                updates.sku = expectedSku;
                needsUpdate = true;
              }

              const expectedTitle = v.variant.charAt(0).toUpperCase() + v.variant.slice(1);
              if (matchingVariant.title !== expectedTitle) {
                updates.option1 = expectedTitle;
                needsUpdate = true;
              }

              if (needsUpdate) {
                console.log(
                  `    Updating variant ${matchingVariant.id}: title=${JSON.stringify(matchingVariant.title)}→${JSON.stringify(updates.option1 || matchingVariant.title)}, SKU=${JSON.stringify(matchingVariant.sku)}→${JSON.stringify(updates.sku || matchingVariant.sku)}`
                );
                await shopifyAdminFetch(
                  `/variants/${matchingVariant.id}.json`,
                  { method: "PUT", body: { variant: updates } }
                );
              }

              // Store Shopify IDs in assets table
              await updateAssetShopifyIds(
                v.assetId,
                String(existing.id),
                String(matchingVariant.id)
              );
            } else {
              console.warn(`    ⚠ No matching variant for "${titleTarget}" (product has ${existing.variants.length} variants). Creating new variant.`);
              const title = v.variant.charAt(0).toUpperCase() + v.variant.slice(1);
              const resp = await shopifyAdminFetch<{ variant: { id: number } }>(
                `/products/${existing.id}/variants.json`,
                {
                  method: "POST",
                  body: {
                    variant: {
                      option1: title,
                      sku: expectedSku,
                      price: (args.price / 100).toFixed(2),
                      inventory_management: "shopify",
                      inventory_policy: args.drop ? "deny" : "continue",
                    },
                  },
                }
              );
              await updateAssetShopifyIds(v.assetId, String(existing.id), String(resp.variant.id));
              console.log(`    Created variant ${resp.variant.id}`);
            }
          }
        }

        updated++;
        continue;
      }

      // Build Shopify product
      const skuPrefix = nationCodeToSku(nation.code);
      const priceStr = (args.price / 100).toFixed(2);
      const inventoryPolicy = args.drop ? "deny" : "continue";

      const tags: string[] = [
        `nation:${nation.code}`,
        `confederation:${nation.confederation}`,
        `region:${nation.region}`,
        "wc2026",
      ];
      if (args.drop) {
        tags.push(`drop:${args.drop}`);
      }
      if (args.dropType) {
        tags.push(`drop-type:${args.dropType}`);
      }

      const shopifyVariants: ShopifyAdminVariant[] = variantData.map((v) => ({
        option1: v.variant.charAt(0).toUpperCase() + v.variant.slice(1), // "home" → "Home"
        sku: `${skuPrefix}-${v.variant.toUpperCase()}`, // "AR-HOME"
        price: priceStr,
        inventory_management: "shopify",
        inventory_policy: inventoryPolicy,
        metafields: [
          {
            namespace: "hoodd",
            key: "asset_id",
            value: v.assetId,
            type: "single_line_text_field",
          },
          {
            namespace: "hoodd",
            key: "print_file_url",
            value: v.printFileUrl,
            type: "single_line_text_field",
          },
          {
            namespace: "hoodd",
            key: "product_code",
            value: "5K14TS",
            type: "single_line_text_field",
          },
          {
            namespace: "hoodd",
            key: "generation_run",
            value: args.generationRun,
            type: "single_line_text_field",
          },
        ],
      }));

      const productInput: CreateProductInput = {
        title: `HOOD'D | ${nation.name} ${nation.emoji} Jersey Line`,
        handle,
        body_html: `<p>Premium sublimation-printed stretch polyester-spandex car hood cover. FIFA World Cup 2026 edition. ${nation.name} design.</p>`,
        vendor: "Hood'd",
        product_type: "Hood Cover",
        tags: tags.join(", "),
        status: "active",
        options: [
          {
            name: "Design",
            values: variantData.map(
              (v) => v.variant.charAt(0).toUpperCase() + v.variant.slice(1)
            ),
          },
        ],
        variants: shopifyVariants,
      };

      // Add returns_policy metafield for drops
      if (args.finalSale) {
        productInput.metafields = [
          {
            namespace: "hoodd",
            key: "returns_policy",
            value: "final_sale",
            type: "single_line_text_field",
          },
        ];
      }

      console.log(`  Creating Shopify product: ${productInput.title}`);
      const product = await createProduct(productInput);
      console.log(`  Created: product_id=${product.id}, handle=${product.handle}`);

      // Upload variant images and associate
      for (let i = 0; i < variantData.length; i++) {
        const v = variantData[i];
        const shopifyVariant = product.variants[i];

        if (shopifyVariant && v.previewUrl) {
          try {
            const image = await createProductImage(
              product.id,
              v.previewUrl,
              [shopifyVariant.id]
            );
            console.log(`  Image uploaded for ${v.variant}: image_id=${image.id}`);
          } catch (imgErr) {
            console.warn(`  Warning: image upload failed for ${v.variant}: ${imgErr}`);
          }
        }

        // Update asset DB with Shopify IDs
        if (shopifyVariant) {
          await updateAssetShopifyIds(
            v.assetId,
            String(product.id),
            String(shopifyVariant.id)
          );
        }

        // Set inventory if using caps (drops)
        if (args.drop && shopifyVariant && locationId) {
          try {
            await setInventoryLevel(
              shopifyVariant.inventory_item_id,
              locationId,
              args.inventory
            );
            console.log(`  Inventory set: ${v.variant}=${args.inventory}`);
          } catch (invErr) {
            console.warn(`  Warning: inventory set failed: ${invErr}`);
          }
        }
      }

      created++;
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      errors++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors:  ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
