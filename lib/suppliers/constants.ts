// Routing weights (must sum to 1.0)
export const ROUTING_WEIGHTS = {
  cost: 0.35,
  speed: 0.30,
  reliability: 0.20,
  distance: 0.15,
} as const;

// Minimum quality score to be eligible for routing
export const MIN_QUALITY_SCORE = 7;

// Maximum number of fulfillment options returned
export const MAX_OPTIONS = 3;

// ---------------------------------------------------------------------------
// Dynamic pricing config (Phase 1)
// Price formula: totalCost / (1 - margin), clamped to [FLOOR, CEILING]
// ---------------------------------------------------------------------------

/** Target gross-profit margin per shipping tier */
export const MARGIN_BY_TIER = {
  standard: 0.60,   // China POD (7-15 days) — low COGS, take more margin
  express:  0.50,   // Regional (5-10 days)   — moderate COGS
  rush:     0.40,   // Local (≤5 days)        — high COGS, stay competitive
} as const;

/** Absolute floor — never sell below this regardless of cost/margin calc */
export const PRICE_FLOOR_USD = 29.99;

/** Absolute ceiling — never exceed this regardless of cost/margin calc */
export const PRICE_CEILING_USD = 89.99;

/** Default shipping cost when no per-country or fixed cost is available */
export const DEFAULT_SHIPPING_COST_USD = 7.00;

// Legacy static tiers (kept for reference during migration, will remove)
// standard: 44.99, express: 54.99, rush: 64.99

// Pricing phase — controls which pricing strategy is active
// "launch" = early-bird $39.99 | "standard" = $44.99 | "tournament" = $49.99
export const PRICING_PHASE: "launch" | "standard" | "tournament" | "clearance" = "standard" as const;

// Base supplier ID — always included in results
export const BASE_SUPPLIER_ID = "printkk";

// ---------------------------------------------------------------------------
// Product size config (added 2026-05-16)
// PrintKK now offers an XL format in addition to the original "standard" universal size.
// ---------------------------------------------------------------------------

export type ProductSize = "standard" | "xl";

/** Default size when none is specified (legacy orders, missing variant) */
export const DEFAULT_SIZE: ProductSize = "standard";

/** Display dimensions per size — keep in sync with PDP/FAQ/size-guide copy */
export const SIZE_DIMENSIONS: Record<ProductSize, { inches: string; cm: string; label: string }> = {
  standard: { inches: '63" × 47"', cm: "160 × 120 cm", label: "Standard" },
  xl:       { inches: '68" × 55"', cm: "172 × 140 cm", label: "XL" },
};

/** PrintKK product codes per size. Standard is confirmed (5K14TS). XL is a placeholder until confirmed. */
export const PRINTKK_PRODUCT_CODE: Record<ProductSize, string> = {
  standard: "5K14TS",
  xl:       "5K14TS_XL", // TODO: replace with actual PrintKK XL product code once provided
};

/** USD surcharge added to a size on top of the dynamic-pricing engine output */
export const SIZE_PRICE_SURCHARGE_USD: Record<ProductSize, number> = {
  standard: 0,
  xl:       10,
};

/** SKU suffix appended to the base SKU for non-standard sizes. Standard = no suffix. */
export const SIZE_SKU_SUFFIX: Record<ProductSize, string> = {
  standard: "",
  xl:       "-XL",
};

/**
 * Parse a Shopify SKU and extract the product size.
 * SKU convention: {NATION}-{VARIANT}[-XL]  →  e.g. "CA-HOME" (standard) or "CA-HOME-XL"
 * Returns { size, baseSku } where baseSku has the size suffix stripped.
 */
export function parseSizeFromSku(sku: string): { size: ProductSize; baseSku: string } {
  const upper = sku.toUpperCase();
  if (upper.endsWith("-XL")) {
    return { size: "xl", baseSku: sku.slice(0, -3) };
  }
  return { size: "standard", baseSku: sku };
}

// Fallback customer location (geographic center of US)
export const FALLBACK_LOCATION = {
  country_code: "US",
  country_name: "United States",
  lat: 39.8283,
  lng: -98.5795,
} as const;

// ip-api.com rate limit — only used in development
export const IP_API_BASE = "http://ip-api.com/json";
