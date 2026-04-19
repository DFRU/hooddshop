/**
 * Email fallback adapter for suppliers without API access.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §9 (fallback adapter)
 *
 * Instead of calling an API, this adapter logs the print job details
 * and (in production) sends an email to the operator for manual submission.
 *
 * Used when:
 * - Printkk API docs are unavailable (blocker B2)
 * - A supplier has no API (email-only workflow)
 */
import type {
  SupplierAdapter,
  PrintJobInput,
  PrintJobSubmission,
  PrintJobStatusResponse,
} from "./types";

export class EmailFallbackAdapter implements SupplierAdapter {
  readonly id: string;
  private readonly recipientEmail: string;

  constructor(supplierId: string, recipientEmail?: string) {
    this.id = supplierId;
    this.recipientEmail =
      recipientEmail || process.env.ALERT_EMAIL || "tlk2m3now@gmail.com";
  }

  async submitJob(input: PrintJobInput): Promise<PrintJobSubmission> {
    // Generate a pseudo-order ID for tracking
    const pseudoOrderId = `MANUAL-${input.customerReference}`;

    // Log full details for manual processing
    const jobDetails = {
      adapter: "email-fallback",
      supplierId: this.id,
      customerReference: input.customerReference,
      productCode: input.productCode,
      quantity: input.quantity,
      printFileUrl: input.printFileUrl,
      shipping: input.shippingAddress,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[email-fallback] MANUAL PRINT JOB REQUIRED:\n${JSON.stringify(jobDetails, null, 2)}`
    );

    // TODO: Phase 1B — wire to actual email send (Resend or Vercel-native)
    // For now, the structured log is the alert mechanism.
    // The operator checks logs or receives the Vercel log drain alert.
    console.warn(
      `[email-fallback] Email to ${this.recipientEmail}: New print job ${pseudoOrderId} awaiting manual submission to ${this.id}`
    );

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
