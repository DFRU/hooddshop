import type { Supplier } from "./types";
import { PRICE_TIERS, PRICING_PHASE } from "./constants";

// Phase modifiers — adjusts base tier prices per business lifecycle stage
const PHASE_MODIFIERS: Record<typeof PRICING_PHASE, number> = {
  launch: -5.0,      // early-bird discount
  standard: 0,       // base pricing as-is
  tournament: 5.0,   // in-tournament surge
  clearance: -15.0,  // post-event clearance
};

export type PriceTier = "standard" | "express" | "rush";

/**
 * Determine the pricing tier based on supplier shipping speed.
 *   rush:     ≤ 5 days  (local / same-country)
 *   express:  6–10 days (regional)
 *   standard: > 10 days (China POD / global)
 */
export function getShippingTier(supplier: Supplier): PriceTier {
  const maxDays = supplier.shipping.standard_days_max;
  if (maxDays <= 5) return "rush";
  if (maxDays <= 10) return "express";
  return "standard";
}

/**
 * Customer-facing price for a given supplier.
 * Combines the tier base price with the active pricing phase modifier.
 * Price is always floored to $0.01 minimum (defensive).
 */
export function getCustomerPrice(supplier: Supplier): number {
  const tier = getShippingTier(supplier);
  const base = PRICE_TIERS[tier];
  const modifier = PHASE_MODIFIERS[PRICING_PHASE];
  return Math.max(0.01, +(base + modifier).toFixed(2));
}

/**
 * Return the display label for a tier.
 */
export function getTierLabel(tier: PriceTier): string {
  switch (tier) {
    case "rush":
      return "Rush (2–5 days)";
    case "express":
      return "Express (5–10 days)";
    case "standard":
      return "Standard (15–25 days)";
  }
}
