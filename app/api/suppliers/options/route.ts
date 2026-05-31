import { NextRequest, NextResponse } from "next/server";
import { detectLocation } from "@/lib/suppliers/geo";
import { getActiveSuppliers } from "@/lib/suppliers/repository";
import { routeToSuppliers } from "@/lib/suppliers/router";
import type { SupplierRoutingResponse } from "@/lib/suppliers/types";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const location = await detectLocation(request);
    const suppliers = getActiveSuppliers();
    const options = routeToSuppliers(location, suppliers);

    const response: SupplierRoutingResponse = {
      success: true,
      customer_location: {
        country_code: location.country_code,
        country_name: location.country_name || location.country_code,
        city: location.city,
        source: location.source,
      },
      fulfillment_options: options,
      default_option_id:
        options.find((o) => o.is_default)?.id || options[0]?.id,
    };

    return NextResponse.json(response);
  } catch {
    const fallback: SupplierRoutingResponse = {
      success: false,
      error: "Unable to determine fulfillment options",
      customer_location: {
        country_code: "US",
        country_name: "United States",
        source: "fallback",
      },
      fulfillment_options: [
        {
          id: "printkk",
          supplier_id: "printkk",
          supplier_region: "China",
          label: "Standard Shipping",
          description: "Ships worldwide in 7-15 days",
          estimated_days_min: 7,
          estimated_days_max: 15,
          estimated_days_display: "7-15 days",
          price_usd: 0.00,
          price_adjustment_usd: 0,
          price_breakdown: {
            product_price_usd: 44.99,
            shipping_price_usd: 0.00,
            total_price_usd: 44.99,
            total_cost_usd: 10.81,
            effective_margin: 0.76,
            tier: "standard",
            clamped: null,
            cost_confidence: "confirmed",
          },
          badge: "Best Price",
          is_default: true,
          is_local: false,
        },
      ],
      default_option_id: "printkk",
    };

    return NextResponse.json(fallback);
  }
}
