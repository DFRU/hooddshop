/**
 * Supplier adapter interface.
 * All print suppliers conform to this contract.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §6.3
 */

export interface PrintJobInput {
  printFileUrl: string;        // Pre-signed asset URL, publicly fetchable for >24h
  productCode: string;         // Supplier SKU, e.g. "5K14TS"
  quantity: number;
  shippingAddress: ShippingAddress;
  customerReference: string;   // Our print_jobs.id — used as idempotency key on supplier side
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  countryCode: string;
  phone?: string;
}

export interface PrintJobSubmission {
  providerOrderId: string;
  estimatedShipDate?: string;  // ISO date
  estimatedCostCents?: number;
}

export interface PrintJobStatusResponse {
  state:
    | "accepted"
    | "in_production"
    | "shipped"
    | "delivered"
    | "canceled"
    | "failed";
  trackingCarrier?: string;
  trackingNumber?: string;
  lastUpdate: string; // ISO timestamp
}

export interface StatusUpdate {
  providerOrderId: string;
  state: PrintJobStatusResponse["state"];
  trackingCarrier?: string;
  trackingNumber?: string;
}

export interface SupplierAdapter {
  readonly id: string;

  /**
   * Submit a print job to the supplier.
   * Must be idempotent on customerReference if the supplier supports it.
   */
  submitJob(input: PrintJobInput): Promise<PrintJobSubmission>;

  /**
   * Query the supplier for the current status of a previously submitted job.
   */
  getStatus(providerOrderId: string): Promise<PrintJobStatusResponse>;

  /**
   * Attempt to cancel a job at the supplier.
   * Returns true if cancellation was accepted, false if it cannot be canceled.
   */
  cancelJob?(providerOrderId: string): Promise<boolean>;

  /**
   * Optional webhook handler for suppliers that push status updates.
   */
  handleWebhook?(headers: Headers, body: unknown): Promise<StatusUpdate>;
}
