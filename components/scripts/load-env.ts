/**
 * Load .env.local into process.env for CLI scripts.
 * Next.js does this automatically for route handlers, but tsx does not.
 *
 * Import this at the top of every script:
 *   import "./load-env";
 */
import * as fs from "fs";
import * as path from "path";

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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log(`[env] Loaded ${envPath}`);
} else {
  console.warn(`[env] No .env.local found at ${envPath}`);
}
