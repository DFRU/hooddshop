/**
 * Worker cron: processes print jobs ready for supplier submission.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §7.1b (T+2h hold), §7.2 (retry), §4.1 (worker)
 *
 * Triggered by:
 * - Vercel Cron (vercel.json: schedule every 5 minutes)
 * - Manual GET /api/jobs/process?token=<SUPPLIER_ADMIN_TOKEN>
 *
 * Flow per job:
 * 1. Fetch jobs where eligible_for_submit_at <= now() AND status IN (queued, holding)
 * 2. Claim job (optimistic lock via status transition)
 * 3. Look up asset → print_file_url
 * 4. Get adapter for supplier
 * 5. Submit to supplier
 * 6. On success: mark submitted
 * 7. On failure: increment attempts, back to queued (or failed if max)
 */
import { NextRequest, NextResponse } from "next/server";
import {
  fetchReadyJobs,
  claimJobForSubmission,
  markJobSubmitted,
  markJobFailed,
  getAssetById,
} from "@/lib/db/queries";
import { getAdapter } from "@/lib/suppliers/adapters";
import type { ShippingAddress } from "@/lib/suppliers/adapters/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro allows up to 60s for cron

const ADMIN_TOKEN = process.env.SUPPLIER_ADMIN_TOKEN || "";
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 10;

export async function GET(request: NextRequest) {
  // Auth: Vercel Cron sends no token (uses vercel.json config).
  // Manual calls require the admin token.
  const token = request.nextUrl.searchParams.get("token");
  const cronHeader = request.headers.get("authorization");
  const isVercelCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processReadyJobs();

  return NextResponse.json({
    processed: results.submitted,
    failed: results.failed,
    skipped: results.skipped,
    total: results.total,
  });
}

async function processReadyJobs(): Promise<{
  submitted: number;
  failed: number;
  skipped: number;
  total: number;
}> {
  const jobs = await fetchReadyJobs(BATCH_SIZE);

  let submitted = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    // Claim the job (optimistic lock)
    const claimed = await claimJobForSubmission(job.id);
    if (!claimed) {
      skipped++;
      continue;
    }

    try {
      // Look up the asset to get the print file URL
      const asset = await getAssetById(job.asset_id);
      if (!asset) {
        // Asset not found — this is a data integrity issue.
        // The webhook may have stored a SKU placeholder instead of a real asset_id.
        // For Phase 1A, we log and fail the job for manual review.
        await markJobFailed(
          job.id,
          `Asset not found: ${job.asset_id}. May need manual asset_id resolution from SKU.`,
          job.attempts + 1
        );
        failed++;
        console.error(
          `[worker] Job ${job.id}: asset '${job.asset_id}' not found`
        );
        continue;
      }

      // Build shipping address
      const shippingAddress: ShippingAddress = {
        name: job.shipping_name || "",
        address1: job.shipping_address1 || "",
        address2: job.shipping_address2 || undefined,
        city: job.shipping_city || "",
        province: job.shipping_province || "",
        zip: job.shipping_zip || "",
        countryCode: job.shipping_country || "US",
        phone: job.shipping_phone || undefined,
      };

      // Get the adapter for this supplier
      const adapter = getAdapter(job.supplier_id);

      // Submit to supplier
      const result = await adapter.submitJob({
        printFileUrl: asset.print_file_url,
        productCode: "5K14TS", // Universal product code for Phase 1A
        quantity: 1,
        shippingAddress,
        customerReference: job.id,
      });

      await markJobSubmitted(job.id, result.providerOrderId);
      submitted++;

      console.log(
        `[worker] Job ${job.id} submitted to ${job.supplier_id}: provider_order=${result.providerOrderId}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);
      const newAttempts = job.attempts + 1;

      await markJobFailed(job.id, errorMessage, newAttempts);
      failed++;

      if (newAttempts >= MAX_ATTEMPTS) {
        console.error(
          `[worker] Job ${job.id} PERMANENTLY FAILED after ${MAX_ATTEMPTS} attempts: ${errorMessage}`
        );
        // TODO: emit alert to B4 destination
      } else {
        console.warn(
          `[worker] Job ${job.id} attempt ${newAttempts}/${MAX_ATTEMPTS} failed: ${errorMessage}`
        );
      }
    }
  }

  if (jobs.length > 0) {
    console.log(
      `[worker] Batch complete: ${submitted} submitted, ${failed} failed, ${skipped} skipped out of ${jobs.length} ready`
    );
  }

  return {
    submitted,
    failed,
    skipped,
    total: jobs.length,
  };
}
