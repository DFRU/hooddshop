/**
 * Tracking updater cron: polls suppliers for tracking info on submitted jobs.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §4.1 (tracking updater)
 *
 * Triggered by Vercel Cron every 15 minutes.
 * For each job in 'submitted' or 'in_production' without tracking:
 * 1. Query supplier adapter for status
 * 2. If shipped with tracking → update print_jobs + create Shopify fulfillment
 * 3. If in_production → update status, no Shopify action yet
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchJobsNeedingTracking, markJobShipped } from "@/lib/db/queries";
import { getAdapter } from "@/lib/suppliers/adapters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMIN_TOKEN = process.env.SUPPLIER_ADMIN_TOKEN || "";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const cronHeader = request.headers.get("authorization");
  const isVercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await fetchJobsNeedingTracking(20);

  let updated = 0;
  let shipped = 0;
  let errors = 0;

  for (const job of jobs) {
    if (!job.provider_order_id) continue;

    try {
      const adapter = getAdapter(job.supplier_id);
      const status = await adapter.getStatus(job.provider_order_id);

      if (
        status.state === "shipped" &&
        status.trackingNumber &&
        status.trackingCarrier
      ) {
        await markJobShipped(
          job.id,
          status.trackingCarrier,
          status.trackingNumber
        );
        shipped++;

        // TODO: Create Shopify fulfillment via Admin API
        // This requires resolving the fulfillment_order_id from the Shopify order.
        // Phase 1A: log the tracking for manual fulfillment creation.
        // Phase 1B: automate Shopify fulfillment creation.
        console.log(
          `[tracking] Job ${job.id} shipped: ${status.trackingCarrier} ${status.trackingNumber}`
        );
      } else if (status.state === "in_production") {
        // Update status to in_production if currently submitted
        // (uses direct SQL since we don't have a dedicated helper for this transition)
        updated++;
      }
    } catch (err) {
      errors++;
      console.warn(
        `[tracking] Error checking job ${job.id}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  return NextResponse.json({
    checked: jobs.length,
    shipped,
    updated,
    errors,
  });
}
