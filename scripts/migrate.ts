/**
 * Run database migrations.
 * Usage: npx tsx scripts/migrate.ts
 */
import * as fs from "fs";
import * as path from "path";

// Load .env.local (tsx doesn't do this automatically like Next.js does)
const envPath = path.resolve(__dirname, "..", ".env.local");
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
} else {
  console.warn(`[env] No .env.local found at ${envPath}`);
}

import { runMigrations } from "../lib/db/client";

async function main() {
  console.log("[migrate] Starting migrations...");
  await runMigrations();
  console.log("[migrate] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
