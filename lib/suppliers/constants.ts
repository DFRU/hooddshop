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

// Customer-facing price tiers (USD)
export const PRICE_TIERS = {
  standard: 49.99,   // China/base suppliers (shipping > 10 days)
  express: 59.99,    // Regional/local suppliers (shipping <= 10 days)
  premium: 69.99,    // Rush/expedited (Phase 2)
} as const;

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
