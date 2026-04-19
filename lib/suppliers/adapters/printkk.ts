/**
 * Printkk supplier adapter.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §6.3
 * Blocker B2: Printkk file delivery method still OPEN as of v0.3.
 * This adapter implements the most common POD API pattern (URL-based print file).
 * Will be revised once Printkk API docs are obtained.
 *
 * Product code: 5K14TS (car hood cover, universal)
 *
 * Auth: API Key + Secret Key (set in .env.local as PRINTKK_API_KEY, PRINTKK_SECRET_KEY)
 * Base URL: TBD (PRINTKK_API_BASE env var)
 */
import type {
  SupplierAdapter,
  PrintJobInput,
  PrintJobSubmission,
  PrintJobStatusResponse,
} from "./types";

const API_KEY = process.env.PRINTKK_API_KEY || "";
const SECRET_KEY = process.env.PRINTKK_SECRET_KEY || "";
const API_BASE = process.env.PRINTKK_API_BASE || "";

export class PrintkkAdapter implements SupplierAdapter {
  readonly id = "printkk";

  async submitJob(input: PrintJobInput): Promise<PrintJobSubmission> {
    if (!API_BASE) {
      throw new Error(
        "[printkk] PRINTKK_API_BASE not configured. Set the Printkk API endpoint URL."
      );
    }
    if (!API_KEY || !SECRET_KEY) {
      throw new Error(
        "[printkk] PRINTKK_API_KEY or PRINTKK_SECRET_KEY not configured."
      );
    }

    // NOTE: This request structure is a best-guess based on common POD API patterns.
    // It WILL need revision once Printkk developer docs are obtained (blocker B2).
    const payload = {
      external_id: input.customerReference,
      product_code: input.productCode,
      quantity: input.quantity,
      print_file_url: input.printFileUrl,
      shipping: {
        name: input.shippingAddress.name,
        address1: input.shippingAddress.address1,
        address2: input.shippingAddress.address2 || "",
        city: input.shippingAddress.city,
        state: input.shippingAddress.province,
        zip: input.shippingAddress.zip,
        country: input.shippingAddress.countryCode,
        phone: input.shippingAddress.phone || "",
      },
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "X-API-Secret": SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(
        `[printkk] submitJob failed: ${res.status} ${res.statusText} — ${errorBody.slice(0, 300)}`
      );
    }

    const data = await res.json();

    return {
      providerOrderId: String(data.order_id || data.id || data.external_id),
      estimatedShipDate: data.estimated_ship_date,
      estimatedCostCents: data.cost_cents || data.total_cents,
    };
  }

  async getStatus(providerOrderId: string): Promise<PrintJobStatusResponse> {
    if (!API_BASE) {
      throw new Error("[printkk] PRINTKK_API_BASE not configured.");
    }

    const res = await fetch(`${API_BASE}/orders/${providerOrderId}`, {
      headers: {
        "X-API-Key": API_KEY,
        "X-API-Secret": SECRET_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(
        `[printkk] getStatus failed for ${providerOrderId}: ${res.status}`
      );
    }

    const data = await res.json();

    // Map Printkk status to our normalized states.
    // This mapping is provisional — adjust once we see actual Printkk status values.
    const statusMap: Record<string, PrintJobStatusResponse["state"]> = {
      pending: "accepted",
      accepted: "accepted",
      processing: "in_production",
      in_production: "in_production",
      printing: "in_production",
      shipped: "shipped",
      delivered: "delivered",
      cancelled: "canceled",
      canceled: "canceled",
      failed: "failed",
      error: "failed",
    };

    const rawStatus = String(data.status || "").toLowerCase();

    return {
      state: statusMap[rawStatus] || "accepted",
      trackingCarrier: data.tracking_carrier || data.carrier,
      trackingNumber: data.tracking_number || data.tracking,
      lastUpdate: data.updated_at || new Date().toISOString(),
    };
  }

  async cancelJob(providerOrderId: string): Promise<boolean> {
    if (!API_BASE) return false;

    try {
      const res = await fetch(
        `${API_BASE}/orders/${providerOrderId}/cancel`,
        {
          method: "POST",
          headers: {
            "X-API-Key": API_KEY,
            "X-API-Secret": SECRET_KEY,
          },
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
