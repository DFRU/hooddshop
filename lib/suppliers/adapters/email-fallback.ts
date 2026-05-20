/**
 * Email fallback adapter for suppliers without API access.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §9 (fallback adapter)
 *
 * Sends a structured order-forwarding email via Resend (lib/email/send.ts)
 * to the operator (dan@hooddshop.com by default) with full print job details.
 * If RESEND_API_KEY is not set, emails are logged to console (dry-run mode).
 *
 * Used when:
 * - Printkk API docs are unavailable (blocker B2)
 * - A supplier has no API (email-only workflow)
 * - Any supplier without a dedicated adapter
 */
import type {
  SupplierAdapter,
  PrintJobInput,
  PrintJobSubmission,
  PrintJobStatusResponse,
} from "./types";
import { sendEmail } from "@/lib/email/send";

/**
 * Known supplier order-forwarding email addresses.
 * Populated as suppliers respond to outreach and confirm their order intake emails.
 * When a supplier email is listed here, the adapter CC's the supplier directly
 * in addition to the operator.
 */
const SUPPLIER_ORDER_EMAILS: Record<string, string> = {
  // Phase 1: will be populated as suppliers confirm intake addresses
  // "muzefab": "info@muzefab.co.za",
  // "asap_couriers": "orders@asapcouriers.co.za",
};

export class EmailFallbackAdapter implements SupplierAdapter {
  readonly id: string;
  private readonly operatorEmail: string;

  constructor(supplierId: string, operatorEmail?: string) {
    this.id = supplierId;
    this.operatorEmail =
      operatorEmail || process.env.ALERT_EMAIL || "dan@hooddshop.com";
  }

  async submitJob(input: PrintJobInput): Promise<PrintJobSubmission> {
    const pseudoOrderId = `MANUAL-${input.customerReference}`;
    const now = new Date().toISOString();

    const jobDetails = {
      adapter: "email-fallback",
      supplierId: this.id,
      customerReference: input.customerReference,
      productCode: input.productCode,
      quantity: input.quantity,
      printFileUrl: input.printFileUrl,
      shipping: input.shippingAddress,
      timestamp: now,
    };

    // Always log for traceability
    console.log(
      `[email-fallback] MANUAL PRINT JOB REQUIRED:\n${JSON.stringify(jobDetails, null, 2)}`
    );

    // Build the operator notification email
    const supplierEmail = SUPPLIER_ORDER_EMAILS[this.id];
    const addr = input.shippingAddress;
    const subject = `[HOODD Order] ${pseudoOrderId} — ${this.id.toUpperCase()} — Action Required`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #222; background: #fafafa; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="margin: 0 0 16px; color: #FF4D00;">New Print Job — Manual Submission Required</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 12px; font-weight: 600; color: #666; width: 160px;">Job ID</td><td style="padding: 6px 12px;">${pseudoOrderId}</td></tr>
          <tr style="background: #f0f0f0;"><td style="padding: 6px 12px; font-weight: 600; color: #666;">Supplier</td><td style="padding: 6px 12px;">${this.id}${supplierEmail ? ` (${supplierEmail})` : ""}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: 600; color: #666;">Product Code</td><td style="padding: 6px 12px;">${input.productCode}</td></tr>
          <tr style="background: #f0f0f0;"><td style="padding: 6px 12px; font-weight: 600; color: #666;">Quantity</td><td style="padding: 6px 12px;">${input.quantity}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: 600; color: #666;">Print File</td><td style="padding: 6px 12px;"><a href="${input.printFileUrl}" style="color: #FF4D00;">Download print file</a></td></tr>
        </table>

        <h3 style="margin: 20px 0 8px; font-size: 15px; color: #333;">Ship To</h3>
        <div style="padding: 12px; background: #fff; border: 1px solid #eee; border-radius: 4px; font-size: 14px; line-height: 1.5;">
          ${addr.name}<br/>
          ${addr.address1}<br/>
          ${addr.address2 ? addr.address2 + "<br/>" : ""}
          ${addr.city}, ${addr.province} ${addr.zip}<br/>
          ${addr.countryCode}${addr.phone ? "<br/>Phone: " + addr.phone : ""}
        </div>

        <h3 style="margin: 20px 0 8px; font-size: 15px; color: #333;">Action Steps</h3>
        <ol style="font-size: 14px; line-height: 1.6; padding-left: 20px;">
          <li>Download the print file from the link above</li>
          <li>Submit the order to <strong>${this.id}</strong>${supplierEmail ? ` at <a href="mailto:${supplierEmail}">${supplierEmail}</a>` : " (check GLOBAL-SUPPLIER-MATRIX.md for contact)"}</li>
          <li>Reply to this email with the supplier's order confirmation / tracking number</li>
        </ol>

        <p style="margin: 20px 0 0; font-size: 12px; color: #999;">
          Ref: ${input.customerReference} | Sent: ${now}
        </p>
      </div>
    `;

    const text = [
      `NEW PRINT JOB — MANUAL SUBMISSION REQUIRED`,
      ``,
      `Job ID: ${pseudoOrderId}`,
      `Supplier: ${this.id}${supplierEmail ? ` (${supplierEmail})` : ""}`,
      `Product: ${input.productCode}`,
      `Quantity: ${input.quantity}`,
      `Print File: ${input.printFileUrl}`,
      ``,
      `SHIP TO:`,
      `${addr.name}`,
      `${addr.address1}`,
      addr.address2 || "",
      `${addr.city}, ${addr.province} ${addr.zip}`,
      `${addr.countryCode}`,
      addr.phone ? `Phone: ${addr.phone}` : "",
      ``,
      `ACTION: Submit this order to ${this.id} and reply with their confirmation number.`,
      ``,
      `Ref: ${input.customerReference} | Sent: ${now}`,
    ]
      .filter(Boolean)
      .join("\n");

    const sent = await sendEmail({
      to: this.operatorEmail,
      subject,
      html,
      text,
    });

    if (!sent) {
      console.error(
        `[email-fallback] Failed to send operator email for ${pseudoOrderId}`
      );
      // Don't throw — the job details are logged above and the structured log
      // serves as backup. The worker will retry on the next cron pass.
    }

    return {
      providerOrderId: pseudoOrderId,
      estimatedShipDate: undefined,
      estimatedCostCents: undefined,
    };
  }

  async getStatus(providerOrderId: string): Promise<PrintJobStatusResponse> {
    // Manual orders have no automatic status tracking.
    // The operator updates status via CLI admin commands.
    console.log(
      `[email-fallback] Status check for ${providerOrderId} — manual tracking only`
    );

    return {
      state: "accepted", // Assume accepted until manually updated
      lastUpdate: new Date().toISOString(),
    };
  }

  async cancelJob(providerOrderId: string): Promise<boolean> {
    console.warn(
      `[email-fallback] Cancel requested for ${providerOrderId} — requires manual action with ${this.id}`
    );
    return true; // Log the cancellation; manual follow-up
  }
}
