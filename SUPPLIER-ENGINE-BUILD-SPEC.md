# Hood'd Supplier Engine — Claude Code Build Specification

**Version:** 1.0  
**Date:** April 9, 2026  
**Status:** AUTHORITATIVE. Do not infer intent beyond what is written. Flag blockers explicitly.  
**Target:** Phase 1 MVP — ship by April 30, 2026  
**Context:** This spec adds a geo-routing supplier engine to the existing hooddshop Next.js 14 app.

---

## 1. What This Does

Customers visiting hooddshop.com see fulfillment options based on their location:
- **Standard (Base China):** Cheapest price ($49.99), longest shipping (15-25 days). Always shown.
- **Express (Local/Regional):** Higher price ($59.99), faster shipping (3-7 days). Shown only if a verified supplier exists near the customer.

The system auto-detects customer location via IP, routes them to the optimal supplier, and passes the selection to Shopify as a cart attribute.

---

## 2. Files to Create

All files go inside the existing `hooddshop/` project structure:

```
hooddshop/
├── lib/
│   ├── suppliers/
│   │   ├── types.ts            — TypeScript interfaces
│   │   ├── repository.ts       — Load + cache supplier JSON
│   │   ├── geo.ts              — Haversine distance + IP geolocation
│   │   ├── router.ts           — Routing algorithm (weighted scoring)
│   │   ├── pricing.ts          — Price calculation with margins
│   │   └── constants.ts        — Configuration constants
│   └── data/
│       └── suppliers.json      — Supplier repository (copy from world-cup-hoods/suppliers-repository.json, restructured)
├── app/
│   └── api/
│       └── suppliers/
│           ├── options/
│           │   └── route.ts    — GET /api/suppliers/options
│           └── admin/
│               └── route.ts    — GET /api/suppliers/admin (protected)
└── components/
    └── product/
        └── FulfillmentSelector.tsx  — UI component for product detail page
```

**Do not modify existing files** unless adding the `<FulfillmentSelector />` component to the product detail page.

---

## 3. TypeScript Interfaces (`lib/suppliers/types.ts`)

```typescript
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
```

---

## 4. Supplier Repository (`lib/suppliers/repository.ts`)

- Load `lib/data/suppliers.json` at startup
- Cache in-memory (module-level variable)
- Export `getSuppliers()` → returns all suppliers
- Export `getActiveSuppliers()` → filters to status === "active"
- Export `getSupplierById(id: string)` → single lookup

The JSON structure for `lib/data/suppliers.json` must match the `Supplier` interface. For Phase 1 MVP, include **only** suppliers with confirmed data. Start with these two as active (update status as suppliers are verified):

**PrintKK (China - Base option):**
```json
{
  "id": "printkk",
  "name": "PrintKK",
  "region": "China",
  "country_code": "CN",
  "coordinates": { "lat": 22.5431, "lng": 114.0579 },
  "status": "active",
  "quality_score": 7,
  "reliability_score": 5,
  "capabilities": ["sublimation", "custom_design", "elastic_edge", "shopify_auto_fulfill"],
  "pricing": {
    "base_unit_cost_usd": 7.31,
    "shipping_cost_per_unit": { "US": 3.50, "CA": 4.00, "GB": 5.00, "AU": 5.50 },
    "fixed_shipping_cost": 5.00
  },
  "shipping": {
    "standard_days_min": 15,
    "standard_days_max": 25,
    "regions_served": ["US", "CA", "GB", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "BR", "MX"]
  },
  "fulfillment_model": "pod",
  "integrations": ["shopify"],
  "moq": 0,
  "notes": "Primary POD supplier. Sample ordered, not yet received as of April 9."
}
```

All other suppliers start with `"status": "verification_pending"`. Include the full 17-supplier repository from `world-cup-hoods/suppliers-repository.json` but transform each entry to match the `Supplier` interface. Only `"active"` status suppliers are used by the routing algorithm.

---

## 5. Geolocation (`lib/suppliers/geo.ts`)

### Haversine Distance
```typescript
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  // Returns distance in kilometers
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

### IP Geolocation
Detection priority:
1. **Vercel headers (free, instant):** `x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-latitude`, `x-vercel-ip-longitude`
2. **ip-api.com (free tier, 45 req/min):** `http://ip-api.com/json/{ip}` — use ONLY if Vercel headers are missing (local dev)
3. **Fallback:** Default to `{ country_code: "US", lat: 39.8283, lng: -98.5795 }` (geographic center of US)

```typescript
export async function detectLocation(request: Request): Promise<CustomerLocation> {
  // 1. Check for explicit query params (user override)
  // 2. Check Vercel geo headers
  // 3. Fallback to ip-api.com (dev only)
  // 4. Hard fallback to US center
}
```

**Important:** On Vercel production, headers are always available. The ip-api.com fallback is only for local development. Do NOT call ip-api.com in production.

---

## 6. Routing Algorithm (`lib/suppliers/router.ts`)

```typescript
export function routeToSuppliers(
  location: CustomerLocation,
  suppliers: Supplier[]
): FulfillmentOption[] {
  // 1. Filter: active status, quality_score >= 7, ships to customer country
  // 2. For each: calculate distance, shipping days, total cost
  // 3. Normalize scores to [0,1] range
  // 4. Weighted composite: cost(0.35) + speed(0.30) + reliability(0.20) + distance(0.15)
  // 5. Sort by composite score descending
  // 6. Take top 3
  // 7. Ensure base China option is always included
  // 8. Assign badges: "Best Price" to cheapest, "Fastest" to shortest delivery, "Local" if same country
  // 9. Return FulfillmentOption[]
}
```

---

## 7. Pricing (`lib/suppliers/pricing.ts`)

```typescript
// Price tiers — these are the CUSTOMER-FACING retail prices
// NOT calculated from supplier cost (margin protection)
export const PRICE_TIERS = {
  standard: 49.99,   // China/base suppliers
  express: 59.99,    // Regional/local suppliers  
  premium: 69.99     // Rush/expedited (Phase 2)
};

export function getCustomerPrice(supplier: Supplier, customerCountryCode: string): number {
  // Standard tier: suppliers with shipping > 10 days
  // Express tier: suppliers with shipping <= 10 days
  // Price is NOT dynamically calculated from COGS — it's a fixed tier
  // This protects margin and keeps pricing simple for customers
  if (supplier.shipping.standard_days_max <= 10) {
    return PRICE_TIERS.express;
  }
  return PRICE_TIERS.standard;
}
```

**Rationale:** Fixed tier pricing is simpler for customers, protects margin data, and avoids exposing supplier costs through reverse-engineering price differences.

---

## 8. API Route (`app/api/suppliers/options/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { detectLocation } from '@/lib/suppliers/geo';
import { getActiveSuppliers } from '@/lib/suppliers/repository';
import { routeToSuppliers } from '@/lib/suppliers/router';

export const runtime = 'edge'; // Fast cold starts on Vercel

export async function GET(request: NextRequest) {
  try {
    // 1. Detect or parse customer location
    const location = await detectLocation(request);
    
    // 2. Get active suppliers
    const suppliers = getActiveSuppliers();
    
    // 3. Route
    const options = routeToSuppliers(location, suppliers);
    
    // 4. Return
    return NextResponse.json({
      success: true,
      customer_location: {
        country_code: location.country_code,
        country_name: location.country_name || location.country_code,
        city: location.city,
        source: location.source
      },
      fulfillment_options: options,
      default_option_id: options.find(o => o.is_default)?.id || options[0]?.id
    });
  } catch (error) {
    // Fallback: return base option
    return NextResponse.json({
      success: false,
      error: "Unable to determine fulfillment options",
      customer_location: { country_code: "US", country_name: "United States", source: "fallback" },
      fulfillment_options: [{
        id: "printkk",
        supplier_id: "printkk",
        supplier_region: "China",
        label: "Standard Shipping",
        description: "Ships worldwide in 15-25 days",
        estimated_days_min: 15,
        estimated_days_max: 25,
        estimated_days_display: "15-25 days",
        price_usd: 49.99,
        price_adjustment_usd: 0,
        badge: "Best Price",
        is_default: true,
        is_local: false
      }],
      default_option_id: "printkk"
    });
  }
}
```

### Admin Route (`app/api/suppliers/admin/route.ts`)

- Protected by `SUPPLIER_ADMIN_TOKEN` env var
- Check `Authorization: Bearer <token>` header
- Return full supplier repository with all pricing data
- Add env var to `.env.example`: `SUPPLIER_ADMIN_TOKEN=`

---

## 9. UI Component (`components/product/FulfillmentSelector.tsx`)

A React component that:
1. On mount, calls `GET /api/suppliers/options` (no params — auto-detect)
2. Shows a loading skeleton while fetching
3. Renders fulfillment options as selectable radio cards
4. Shows: "Shipping to: [Flag emoji] [Country]" header with "Change" link
5. Each card shows: label, estimated days, price, badge (if any)
6. Default option is pre-selected
7. Selection fires a callback prop `onSelect(option: FulfillmentOption)` — parent component uses this to set Shopify cart attributes
8. "Change location" opens a simple country dropdown (ISO countries) — on change, re-fetches with `?country=XX`

**Styling:** Use existing Tailwind classes + CSS variables from the design system (`--color-surface`, `--color-accent`, etc.). Match the dark theme. Selected card has `--color-accent` border.

**Mobile-first:** Cards stack vertically. Full width. Min touch target 44px.

**Integration point:** Add `<FulfillmentSelector />` to the product detail page (`app/products/[handle]/page.tsx`) below the price and above the Add to Cart button. When customer selects an option, store it as:
```typescript
// Cart attribute passed to Shopify
{
  key: "_fulfillment_option",
  value: JSON.stringify({
    supplier_id: option.supplier_id,
    supplier_region: option.supplier_region,
    label: option.label,
    estimated_days: option.estimated_days_display,
    price: option.price_usd
  })
}
```

---

## 10. Environment Variables

Add to `.env.example`:
```env
# Supplier Engine
SUPPLIER_ADMIN_TOKEN=           # Token for /api/suppliers/admin access
# Note: IP geolocation uses Vercel headers (free) — no API key needed in production
```

---

## 11. What NOT to Build (Phase 1)

- No database — JSON file only
- No webhook-based order routing — Dan routes manually
- No real-time inventory checking
- No supplier performance tracking
- No multi-currency — USD only
- No automated supplier notifications
- No customer accounts or order history

---

## 12. Testing Checklist

Before shipping, verify:

1. `/api/suppliers/options` returns valid JSON with at least 1 option
2. `/api/suppliers/options?country=CA` returns Canada-relevant options
3. `/api/suppliers/options?country=GB` returns UK-relevant options  
4. `/api/suppliers/options` with no params auto-detects (test on Vercel preview deploy)
5. `/api/suppliers/admin` returns 401 without token, full data with token
6. `FulfillmentSelector` renders on mobile (390px width) with correct touch targets
7. Selected option persists to Shopify cart attributes
8. Fallback works: if API errors, base option still shows
9. Edge Runtime: API route runs on Vercel Edge (check deployment logs)
10. Latency: API response < 200ms on Vercel (check with `curl -w "%{time_total}"`)

---

## 13. Build Sequence

Execute in this order:

1. `lib/suppliers/types.ts` — interfaces
2. `lib/suppliers/constants.ts` — config values
3. `lib/data/suppliers.json` — supplier data (transform from existing repository)
4. `lib/suppliers/repository.ts` — data loading
5. `lib/suppliers/geo.ts` — geolocation + distance
6. `lib/suppliers/pricing.ts` — price tier logic
7. `lib/suppliers/router.ts` — routing algorithm
8. `app/api/suppliers/options/route.ts` — API endpoint
9. `app/api/suppliers/admin/route.ts` — admin endpoint
10. `components/product/FulfillmentSelector.tsx` — UI component
11. Wire `FulfillmentSelector` into product detail page
12. Test all 10 checklist items
13. Deploy to Vercel preview, test with real geo headers

---

*End of specification. Reference documents: HOODD-SUPPLIER-ENGINE-SYSTEM-DESIGN.md (full architecture), suppliers-repository.json (raw supplier data).*
