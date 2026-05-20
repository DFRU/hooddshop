import type { PriceBreakdown, Supplier } from "./types";
import {
  DEFAULT_SHIPPING_COST_USD,
  MARGIN_BY_TIER,
  PRICE_CEILING_USD,
  PRICE_FLOOR_USD,
  PRICING_PHASE,
} from "./constants";

// ---------------------------------------------------------------------------
// Phase modifiers — adjusts calculated prices per business lifecycle stage
// Applied AFTER the margin formula, BEFORE floor/ceiling clamping
// ---------------------------------------------------------------------------
const PHASE_MODIFIERS: Record<typeof PRICING_PHASE, number> = {
  launch: -5.0, // early-bird discount
  standard: 0, // base pricing as-is
  tournament: 5.0, // in-tournament surge
  clearance: -15.0, // post-event clearance
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
 * Look up the shipping cost for a supplier → customer country pair.
 * Priority: per-country rate > fixed_shipping_cost > DEFAULT_SHIPPING_COST_USD
 */
export function getShippingCost(
  supplier: Supplier,
  customerCountryCode: string
): number {
  const perCountry = supplier.pricing.shipping_cost_per_unit;
  if (perCountry && customerCountryCode in perCountry) {
    return perCountry[customerCountryCode];
  }
  if (supplier.pricing.fixed_shipping_cost != null) {
    return supplier.pricing.fixed_shipping_cost;
  }
  return DEFAULT_SHIPPING_COST_USD;
}

/**
 * Core dynamic pricing engine.
 *
 * Formula:  totalPrice = totalCost / (1 - tierMargin) + phaseModifier
 *           clamped to [PRICE_FLOOR_USD, PRICE_CEILING_USD]
 *
 * The customer sees: product_price + shipping_price = total_price
 * Where shipping_price = actual shipping cost passed through at-cost,
 * and product_price absorbs all margin.
 *
 * @param supplier        — the supplier fulfilling the order
 * @param customerCountry — ISO 3166-1 alpha-2 of the customer
 * @returns PriceBreakdown with product, shipping, total, and diagnostics
 */
export function calculateDynamicPrice(
  supplier: Supplier,
  customerCountryCode: string
): PriceBreakdown {
  const tier = getShippingTier(supplier);
  const margin = MARGIN_BY_TIER[tier];

  // --- Cost components ---
  const cogs = supplier.pricing.base_unit_cost_usd;
  const shippingCost = getShippingCost(supplier, customerCountryCode);
  const totalCost = cogs + shippingCost;

  // --- Margin-based total price ---
  // price = totalCost / (1 - margin) ensures that (price - totalCost) / price ≈ margin
  let totalPrice = totalCost / (1 - margin);

  // Apply phase modifier (tournament surge, launch discount, etc.)
  const modifier = PHASE_MODIFIERS[PRICING_PHASE];
  totalPrice += modifier;

  // --- Clamping ---
  let clamped: PriceBreakdown["clamped"] = null;
  if (totalPrice < PRICE_FLOOR_USD) {
    totalPrice = PRICE_FLOOR_USD;
    clamped = "floor";
  } else if (totalPrice > PRICE_CEILING_USD) {
    totalPrice = PRICE_CEILING_USD;
    clamped = "ceiling";
  }

  // Round to 2 decimal places
  totalPrice = round2(totalPrice);

  // --- Split into product + shipping for customer display ---
  // Shipping shown at-cost to the customer; product price absorbs margin
  const shippingDisplay = round2(shippingCost);
  const productPrice = round2(totalPrice - shippingDisplay);

  // --- Effective margin after clamping ---
  const effectiveMargin =
    totalPrice > 0 ? round2((totalPrice - totalCost) / totalPrice) : 0;

  return {
    product_price_usd: productPrice,
    shipping_price_usd: shippingDisplay,
    total_price_usd: totalPrice,
    total_cost_usd: round2(totalCost),
    effective_margin: effectiveMargin,
    tier,
    clamped,
    cost_confidence: supplier.pricing.cost_confidence,
  };
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

// ---------------------------------------------------------------------------
// Legacy API — kept during migration so existing call sites compile.
// The router is being updated to use calculateDynamicPrice instead.
// ---------------------------------------------------------------------------

/** @deprecated Use calculateDynamicPrice instead */
export function getCustomerPrice(
  supplier: Supplier,
  customerCountryCode = "US"
): number {
  return calculateDynamicPrice(supplier, customerCountryCode).total_price_usd;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
