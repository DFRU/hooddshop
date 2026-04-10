export interface SupplierCoordinates {
  lat: number;
  lng: number;
}

export interface SupplierPricing {
  base_unit_cost_usd: number;
  shipping_cost_per_unit?: Record<string, number>; // keyed by ISO country code
  fixed_shipping_cost?: number;                     // fallback flat rate
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
  price_usd: number;
  price_adjustment_usd: number;  // diff from cheapest
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
