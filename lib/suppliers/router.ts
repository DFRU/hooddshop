import type { CustomerLocation, FulfillmentOption, Supplier } from "./types";
import { haversineDistance } from "./geo";
import { getCustomerPrice, getShippingTier, getTierLabel } from "./pricing";
import {
  BASE_SUPPLIER_ID,
  MAX_OPTIONS,
  MIN_QUALITY_SCORE,
  ROUTING_WEIGHTS,
} from "./constants";

interface ScoredSupplier {
  supplier: Supplier;
  distance: number;
  price: number;
  costScore: number;
  speedScore: number;
  reliabilityScore: number;
  distanceScore: number;
  composite: number;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return (value - min) / (max - min);
}

export function routeToSuppliers(
  location: CustomerLocation,
  suppliers: Supplier[]
): FulfillmentOption[] {
  // 1. Filter: active, quality >= threshold, ships to customer country
  const eligible = suppliers.filter(
    (s) =>
      s.status === "active" &&
      s.quality_score >= MIN_QUALITY_SCORE &&
      s.shipping.regions_served.includes(location.country_code)
  );

  if (eligible.length === 0) {
    // Return base supplier as fallback even if it doesn't match filters
    const base = suppliers.find((s) => s.id === BASE_SUPPLIER_ID);
    if (base) {
      return [buildOption(base, location, 0, "Best Price", true)];
    }
    return [];
  }

  // 2. Calculate raw scores for each supplier
  const scored: ScoredSupplier[] = eligible.map((s) => {
    const distance = haversineDistance(
      location.lat,
      location.lng,
      s.coordinates.lat,
      s.coordinates.lng
    );
    const price = getCustomerPrice(s);

    return {
      supplier: s,
      distance,
      price,
      costScore: 0,
      speedScore: 0,
      reliabilityScore: 0,
      distanceScore: 0,
      composite: 0,
    };
  });

  // 3. Find ranges for normalization
  const prices = scored.map((s) => s.price);
  const speeds = scored.map((s) => s.supplier.shipping.standard_days_max);
  const reliabilities = scored.map((s) => s.supplier.reliability_score);
  const distances = scored.map((s) => s.distance);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const minReliability = Math.min(...reliabilities);
  const maxReliability = Math.max(...reliabilities);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  // 4. Normalize and compute weighted composite
  for (const s of scored) {
    // Lower cost is better → invert
    s.costScore = 1 - normalize(s.price, minPrice, maxPrice);
    // Fewer days is better → invert
    s.speedScore =
      1 -
      normalize(s.supplier.shipping.standard_days_max, minSpeed, maxSpeed);
    // Higher reliability is better
    s.reliabilityScore = normalize(
      s.supplier.reliability_score,
      minReliability,
      maxReliability
    );
    // Shorter distance is better → invert
    s.distanceScore = 1 - normalize(s.distance, minDistance, maxDistance);

    s.composite =
      s.costScore * ROUTING_WEIGHTS.cost +
      s.speedScore * ROUTING_WEIGHTS.speed +
      s.reliabilityScore * ROUTING_WEIGHTS.reliability +
      s.distanceScore * ROUTING_WEIGHTS.distance;
  }

  // 5. Sort by composite score descending
  scored.sort((a, b) => b.composite - a.composite);

  // 6. Take top N
  let top = scored.slice(0, MAX_OPTIONS);

  // 7. Ensure base China option is always included
  const hasBase = top.some((s) => s.supplier.id === BASE_SUPPLIER_ID);
  if (!hasBase) {
    const base = scored.find((s) => s.supplier.id === BASE_SUPPLIER_ID);
    if (base) {
      top[top.length - 1] = base; // Replace lowest-ranked
    }
  }

  // 8. Find cheapest price and fastest days for badges
  const cheapestPrice = Math.min(...top.map((s) => s.price));
  const fastestDays = Math.min(
    ...top.map((s) => s.supplier.shipping.standard_days_max)
  );

  // 9. Build FulfillmentOption[]
  const options: FulfillmentOption[] = top.map((s, idx) => {
    let badge: FulfillmentOption["badge"] = null;

    if (
      s.supplier.country_code === location.country_code
    ) {
      badge = "Local";
    } else if (s.supplier.shipping.standard_days_max === fastestDays && fastestDays < 15) {
      badge = "Fastest";
    } else if (s.price === cheapestPrice) {
      badge = "Best Price";
    }

    // Default to the highest-composite option
    const isDefault = idx === 0;

    return buildOption(s.supplier, location, cheapestPrice, badge, isDefault);
  });

  return options;
}

function buildOption(
  supplier: Supplier,
  location: CustomerLocation,
  cheapestPrice: number,
  badge: FulfillmentOption["badge"],
  isDefault: boolean
): FulfillmentOption {
  const price = getCustomerPrice(supplier);
  const isLocal = supplier.country_code === location.country_code;
  const daysMin = supplier.shipping.standard_days_min;
  const daysMax = supplier.shipping.standard_days_max;

  const tier = getShippingTier(supplier);
  const label = getTierLabel(tier);

  let description: string;
  if (isLocal) {
    description = `Ships from ${supplier.region} in ${daysMin}-${daysMax} days`;
  } else {
    description = `Ships worldwide in ${daysMin}-${daysMax} days`;
  }

  return {
    id: supplier.id,
    supplier_id: supplier.id,
    supplier_region: supplier.region,
    label,
    description,
    estimated_days_min: daysMin,
    estimated_days_max: daysMax,
    estimated_days_display: `${daysMin}-${daysMax} days`,
    price_usd: price,
    price_adjustment_usd: parseFloat((price - cheapestPrice).toFixed(2)),
    badge,
    is_default: isDefault,
    is_local: isLocal,
  };
}
