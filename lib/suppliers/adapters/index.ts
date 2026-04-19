/**
 * Supplier adapter registry.
 * Returns the correct adapter for a given supplier ID.
 *
 * Phase 1A: Printkk (if API available) + email fallback.
 * Phase 3: Additional adapters per qualified supplier.
 */
import type { SupplierAdapter } from "./types";
import { PrintkkAdapter } from "./printkk";
import { EmailFallbackAdapter } from "./email-fallback";

// Lazy-initialized singleton adapters
let printkk: PrintkkAdapter | null = null;
const emailFallbacks = new Map<string, EmailFallbackAdapter>();

/**
 * Get the adapter for a supplier ID.
 * Falls back to email adapter if the supplier has no dedicated adapter
 * or if the Printkk API is not configured.
 */
export function getAdapter(supplierId: string): SupplierAdapter {
  if (supplierId === "printkk") {
    // Use Printkk adapter if API base is configured, else email fallback
    if (process.env.PRINTKK_API_BASE) {
      if (!printkk) {
        printkk = new PrintkkAdapter();
      }
      return printkk;
    }
    // No API base → fall back to email
    console.warn(
      "[adapters] PRINTKK_API_BASE not set — using email fallback adapter"
    );
  }

  // Email fallback for all other suppliers (or Printkk without API)
  let fallback = emailFallbacks.get(supplierId);
  if (!fallback) {
    fallback = new EmailFallbackAdapter(supplierId);
    emailFallbacks.set(supplierId, fallback);
  }
  return fallback;
}

// Re-export types for convenience
export type { SupplierAdapter, PrintJobInput, PrintJobSubmission } from "./types";
