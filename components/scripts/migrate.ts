/**
 * Database migration script.
 * Run: npx tsx scripts/migrate.ts
 *
 * Requires DATABASE_URL in .env.local or environment.
 */
import "./load-env";
import { runMigrations } from "../lib/db/client";

async function main() {
  console.log("[migrate] Running database migrations...");
  try {
    await runMigrations();
    console.log("[migrate] Done.");
    process.exit(0);
  } catch (err) {
    console.error("[migrate] Failed:", err);
    process.exit(1);
  }
}

main();
