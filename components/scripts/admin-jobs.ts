/**
 * CLI admin tool for print job management.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §11.3, §7.1b (release/hold overrides)
 *
 * Usage:
 *   npm run admin:jobs -- --status failed
 *   npm run admin:jobs -- --status holding
 *   npm run admin:jobs -- --retry <print_job_id>
 *   npm run admin:jobs -- --release <print_job_id>
 *   npm run admin:jobs -- --hold <print_job_id> --until <iso>
 *   npm run admin:jobs -- --order <shopify_order_id>
 */
import "./load-env";
import { getDb } from "../lib/db/client";

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const sql = getDb();

  // --status <status>: list jobs by status
  const statusFilter = get("--status");
  if (statusFilter) {
    const rows = await sql`
      SELECT id, shopify_order_id, asset_id, supplier_id, status, attempts, last_error,
             is_drop, ordered_at, eligible_for_submit_at, provider_order_id,
             tracking_carrier, tracking_number, created_at, updated_at
      FROM print_jobs
      WHERE status = ${statusFilter}
      ORDER BY updated_at DESC
      LIMIT 50
    `;
    console.log(`\nPrint jobs with status '${statusFilter}': ${rows.length} found\n`);
    for (const row of rows) {
      console.log(`  ${row.id}  order=${row.shopify_order_id}  asset=${row.asset_id}  supplier=${row.supplier_id}`);
      console.log(`    status=${row.status}  attempts=${row.attempts}  drop=${row.is_drop}`);
      if (row.last_error) console.log(`    error: ${String(row.last_error).slice(0, 100)}`);
      if (row.provider_order_id) console.log(`    provider=${row.provider_order_id}`);
      if (row.tracking_number) console.log(`    tracking=${row.tracking_carrier} ${row.tracking_number}`);
      console.log("");
    }
    return;
  }

  // --order <shopify_order_id>: list all jobs for an order
  const orderFilter = get("--order");
  if (orderFilter) {
    const rows = await sql`
      SELECT * FROM print_jobs WHERE shopify_order_id = ${orderFilter} ORDER BY created_at
    `;
    console.log(`\nJobs for order ${orderFilter}: ${rows.length}\n`);
    for (const row of rows) {
      console.log(`  ${row.id}  asset=${row.asset_id}  status=${row.status}  attempts=${row.attempts}`);
    }
    return;
  }

  // --retry <job_id>: reset a failed job back to queued
  const retryId = get("--retry");
  if (retryId) {
    const result = await sql`
      UPDATE print_jobs
      SET status = 'queued', last_error = NULL, attempts = 0, updated_at = now()
      WHERE id = ${retryId} AND status = 'failed'
      RETURNING id
    `;
    if (result.length > 0) {
      console.log(`Job ${retryId} reset to 'queued' for retry.`);
    } else {
      console.log(`Job ${retryId} not found or not in 'failed' status.`);
    }
    return;
  }

  // --release <job_id>: force eligible_for_submit_at to now()
  const releaseId = get("--release");
  if (releaseId) {
    const result = await sql`
      UPDATE print_jobs
      SET eligible_for_submit_at = now(), updated_at = now()
      WHERE id = ${releaseId} AND status IN ('holding', 'queued')
      RETURNING id
    `;
    if (result.length > 0) {
      console.log(`Job ${releaseId} released — eligible for immediate submission.`);
    } else {
      console.log(`Job ${releaseId} not found or not in holdable status.`);
    }
    return;
  }

  // --hold <job_id> --until <iso>: extend hold
  const holdId = get("--hold");
  const holdUntil = get("--until");
  if (holdId && holdUntil) {
    const result = await sql`
      UPDATE print_jobs
      SET eligible_for_submit_at = ${holdUntil}::timestamptz,
          status = 'holding',
          updated_at = now()
      WHERE id = ${holdId} AND status IN ('holding', 'queued')
      RETURNING id
    `;
    if (result.length > 0) {
      console.log(`Job ${holdId} held until ${holdUntil}.`);
    } else {
      console.log(`Job ${holdId} not found or not in holdable status.`);
    }
    return;
  }

  // Default: show summary
  const summary = await sql`
    SELECT status, count(*)::int as count
    FROM print_jobs
    GROUP BY status
    ORDER BY count DESC
  `;
  console.log("\nPrint Jobs Summary:");
  for (const row of summary) {
    console.log(`  ${row.status}: ${row.count}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
