/**
 * Register Shopify webhooks for the fulfillment pipeline.
 * Run: npx tsx scripts/register-webhooks.ts
 *
 * Requires: SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_STORE_DOMAIN
 * Arg: --base-url <your-vercel-url> (e.g. https://hooddshop.vercel.app)
 */
import "./load-env";
import { registerWebhook } from "../../lib/shopify-admin";

const BASE_URL = process.argv.find((a) => a.startsWith("https://"))
  || process.argv[process.argv.indexOf("--base-url") + 1]
  || "";

if (!BASE_URL) {
  console.error("Usage: npx tsx scripts/register-webhooks.ts --base-url https://your-app.vercel.app");
  process.exit(1);
}

const WEBHOOK_ENDPOINT = `${BASE_URL}/api/webhooks/shopify/orders`;

const TOPICS = ["orders/paid", "orders/cancelled"];

async function main() {
  for (const topic of TOPICS) {
    try {
      await registerWebhook(topic, WEBHOOK_ENDPOINT);
      console.log(`Registered: ${topic} → ${WEBHOOK_ENDPOINT}`);
    } catch (err) {
      console.error(`Failed to register ${topic}:`, err);
    }
  }
  console.log("Done.");
}

main();
