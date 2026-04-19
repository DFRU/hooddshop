/**
 * Diagnostic script: audit all Shopify products to check variant structure.
 * Reports variant titles and SKUs so we know what needs fixing.
 *
 * Usage:
 *   npx tsx components/scripts/audit_variants.ts
 */

import "./load-env";
import { NATIONS } from "../../lib/nations";
import { getProductByHandle } from "../../lib/shopify-admin";

function makeHandle(nationName: string): string {
  return `hoodd-${nationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-jersey-line`;
}

async function main() {
  const targetNations = NATIONS.filter((n) => n.wc2026);

  console.log("=== Hood'd Variant Audit ===");
  console.log(`Checking ${targetNations.length} nations...\n`);

  let singleVariant = 0;
  let twoVariant = 0;
  let correctSku = 0;
  let wrongSku = 0;
  let notFound = 0;
  const issues: string[] = [];

  for (const nation of targetNations) {
    const handle = makeHandle(nation.name);
    const product = await getProductByHandle(handle);

    if (!product) {
      console.log(`✗ ${nation.name} (${nation.code}): NOT FOUND (handle: ${handle})`);
      notFound++;
      issues.push(`${nation.code}: product not found`);
      continue;
    }

    const variants = product.variants;
    const variantInfo = variants.map(
      (v) => `${v.title} [SKU=${v.sku || "EMPTY"}]`
    );

    const expectedHomesku = `${nation.code.toUpperCase()}-HOME`;
    const expectedAwaySku = `${nation.code.toUpperCase()}-AWAY`;

    const hasCorrectSkus =
      variants.some((v) => v.sku === expectedHomesku) &&
      variants.some((v) => v.sku === expectedAwaySku);

    const symbol = hasCorrectSkus ? "✓" : "✗";
    console.log(
      `${symbol} ${nation.name} (${nation.code}): ${variants.length} variant(s) — ${variantInfo.join(", ")}`
    );

    if (variants.length === 1) singleVariant++;
    else if (variants.length === 2) twoVariant++;

    if (hasCorrectSkus) {
      correctSku++;
    } else {
      wrongSku++;
      issues.push(
        `${nation.code}: expected SKUs [${expectedHomesku}, ${expectedAwaySku}], got [${variants.map((v) => v.sku).join(", ")}]`
      );
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total:          ${targetNations.length}`);
  console.log(`Not found:      ${notFound}`);
  console.log(`1 variant:      ${singleVariant}`);
  console.log(`2 variants:     ${twoVariant}`);
  console.log(`Correct SKUs:   ${correctSku}`);
  console.log(`Wrong/Missing:  ${wrongSku}`);

  if (issues.length > 0) {
    console.log(`\n=== Issues (${issues.length}) ===`);
    issues.forEach((i) => console.log(`  - ${i}`));
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
