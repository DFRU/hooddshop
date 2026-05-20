export interface SupplierCoordinates {
  lat: number;
  lng: number;
}

export interface SupplierPricing {
  base_unit_cost_usd: number;
  shipping_cost_per_unit?: Record<string, number>; // keyed by ISO country code
  fixed_shipping_cost?: number;                     // fallback flat rate
  cost_confidence: "confirmed" | "estimated" | "placeholder";
  // confirmed   = real quote received from supplier
  // estimated   = educated guess from research (prefix ~$ in brief)
  // placeholder = no data, using category default
}

/** Breakdown returned by the dynamic pricing engine */
export interface PriceBreakdown {
  /** Product price excluding shipping (what the customer sees as item cost) */
  product_price_usd: number;
  /** Shipping portion shown separately */
  shipping_price_usd: number;
  /** product + shipping, clamped to floor/ceiling */
  total_price_usd: number;
  /** Raw cost before margin (cogs + shipping) — internal only */
  total_cost_usd: number;
  /** Effective margin achieved after floor/ceiling clamping */
  effective_margin: number;
  /** Which tier drove the margin selection */
  tier: "standard" | "express" | "rush";
  /** Whether the price was clamped by floor or ceiling */
  clamped: "floor" | "ceiling" | null;
  /** Confidence in the underlying cost data */
  cost_confidence: "confirmed" | "estimated" | "placeholder";
}

export interface SupplierShipping {
  standard_days_min: number;
  standard_days_max: number;
  express_days_min?: number;
  express_days_max?: number;
  regions_served: string[];  // ISO country codes
}

export interface Supplier {
  id: string;
  name: string;
  region: string;           // "China" | "USA" | "Canada" | "UK" | "Vietnam"
  country_code: string;     // ISO 3166-1 alpha-2
  coordinates: SupplierCoordinates;
  status: "active" | "inactive" | "verification_pending";
  quality_score: number;    // 1-10
  reliability_score: number; // 1-10
  capabilities: string[];   // ["sublimation", "custom_design", "elastic_edge"]
  pricing: SupplierPricing;
  shipping: SupplierShipping;
  fulfillment_model: "pod" | "bulk" | "dropship" | "self_fulfill";
  integrations: string[];   // ["shopify", "etsy"]
  moq: number;
  notes?: string;
}

export interface CustomerLocation {
  country_code: string;
  country_name?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  lat: number;
  lng: number;
  source: "vercel_headers" | "ip_api" | "user_input" | "fallback";
}

export interface FulfillmentOption {
  id: string;
  supplier_id: string;
  supplier_region: string;
  label: string;
  description: string;
  estimated_days_min: number;
  estimated_days_max: number;
  estimated_days_display: string;
  /** @deprecated Use price_breakdown.total_price_usd — kept for backward compat */
  price_usd: number;
  price_adjustment_usd: number;  // diff from cheapest
  /** Product + shipping breakdown (Phase 1 dynamic pricing) */
  price_breakdown: PriceBreakdown;
  badge: "Best Price" | "Fastest" | "Local" | null;
  is_default: boolean;
  is_local: boolean;
}

export interface SupplierRoutingResponse {
  success: boolean;
  customer_location: {
    country_code: string;
    country_name: string;
    city?: string;
    source: string;
  };
  fulfillment_options: FulfillmentOption[];
  default_option_id: string;
  error?: string;
}
