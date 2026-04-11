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

// Customer-facing price tiers (CAD)
// Aligned with competitive analysis: market sweet spot $44.99,
// express premium for faster local/regional fulfillment
export const PRICE_TIERS = {
  standard: 44.99,   // Base price — China POD (15-25 days), matches market analysis
  express: 54.99,    // Regional suppliers (5-10 days), speed premium
  rush: 64.99,       // Local/same-country (2-5 days), max speed premium
} as const;

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
