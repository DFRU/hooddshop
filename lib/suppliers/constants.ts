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
  standard: 0.60,   // China POD (15-25 days) — low COGS, take more margin
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

// Fallback customer location (geographic center of US)
export const FALLBACK_LOCATION = {
  country_code: "US",
  country_name: "United States",
  lat: 39.8283,
  lng: -98.5795,
} as const;

// ip-api.com rate limit — only used in development
export const IP_API_BASE = "http://ip-api.com/json";
