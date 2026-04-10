import type { Supplier } from "./types";
import { PRICE_TIERS } from "./constants";

export function getCustomerPrice(supplier: Supplier): number {
  // Standard tier: suppliers with shipping > 10 days max
  // Express tier: suppliers with shipping <= 10 days max
  if (supplier.shipping.standard_days_max <= 10) {
    return PRICE_TIERS.express;
  }
  return PRICE_TIERS.standard;
}
