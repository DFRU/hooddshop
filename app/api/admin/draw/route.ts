/**
 * Admin endpoints for the weekly draw system.
 *
 * Protected by SUPPLIER_ADMIN_TOKEN (same token used for supplier admin).
 *
 * POST /api/admin/draw?action=create    — Create the next draw period
 * POST /api/admin/draw?action=run       — Run the draw (pick winner) for the current open period
 * POST /api/admin/draw?action=enter-all — Bulk-enter all active subscribers into the current draw
 * GET  /api/admin/draw                  — List draws with stats
 *
 * Draw mechanic:
 *   - Every subscriber is eligible (no purchase necessary — FTC compliance)
 *   - One random winner per week
 *   - Winner gets a free hood cover (any nation)
 *   - Runners-up get a discount code (set via ?discount_code= param)
 *   - Draw period: Sunday 00:00 UTC → Saturday 23:59 UTC
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { sendDrawWinnerEmail, sendDrawRunnerUpEmail } from "@/lib/email/send";

function isAuthorized(req: NextRequest): boolean {
  const token = process.env.SUPPLIER_ADMIN_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("Authorization");
  return auth === `Bearer ${token}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const draws = await sql`
    SELECT
      d.id,
      d.period_start,
      d.period_end,
      d.status,
      d.prize,
      d.drawn_at,
      d.notified_at,
      s.email AS winner_email,
      (SELECT count(*) FROM draw_entries WHERE draw_id = d.id) AS entry_count
    FROM draws d
    LEFT JOIN subscribers s ON s.id = d.winner_id
    ORDER BY d.period_start DESC
    LIMIT 20
  `;

  return NextResponse.json({ draws });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get("action");
  const sql = getDb();

  // ── Create next draw period ─────────────────────────────────
  if (action === "create") {
    // Find the next Sunday 00:00 UTC
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() + daysUntilSunday);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    // Check for overlap
    const existing = await sql`
      SELECT id FROM draws
      WHERE period_start <= ${end.toISOString()} AND period_end >= ${start.toISOString()}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Draw period overlaps with existing draw", existing_id: existing[0].id },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO draws (period_start, period_end, status)
      VALUES (${start.toISOString()}, ${end.toISOString()}, 'open')
      RETURNING id, period_start, period_end
    `;

    return NextResponse.json({ created: result[0] });
  }

  // ── Bulk-enter all active subscribers into current draw ─────
  if (action === "enter-all") {
    const result = await sql`
      INSERT INTO draw_entries (draw_id, subscriber_id, entry_source)
      SELECT d.id, s.id, 'bulk-enter'
      FROM draws d
      CROSS JOIN subscribers s
      WHERE d.status = 'open'
        AND now() BETWEEN d.period_start AND d.period_end
        AND s.unsubscribed_at IS NULL
      ON CONFLICT (draw_id, subscriber_id) DO NOTHING
    `;

    // Neon serverless returns rowCount as a property on the result
    return NextResponse.json({
      ok: true,
      message: "All active subscribers entered into current draw",
    });
  }

  // ── Run the draw ────────────────────────────────────────────
  if (action === "run") {
    const discountCode = req.nextUrl.searchParams.get("discount_code") || "HOODD10";

    // Find the current open draw
    const openDraws = await sql`
      SELECT id, period_start, period_end FROM draws
      WHERE status = 'open'
      ORDER BY period_end ASC
      LIMIT 1
    `;

    if (openDraws.length === 0) {
      return NextResponse.json({ error: "No open draw found" }, { status: 404 });
    }

    const draw = openDraws[0];

    // Pick a random winner from entries
    const winners = await sql`
      SELECT de.subscriber_id, s.email
      FROM draw_entries de
      JOIN subscribers s ON s.id = de.subscriber_id
      WHERE de.draw_id = ${draw.id}
        AND s.unsubscribed_at IS NULL
      ORDER BY random()
      LIMIT 1
    `;

    if (winners.length === 0) {
      return NextResponse.json({ error: "No eligible entries in this draw" }, { status: 404 });
    }

    const winner = winners[0];

    // Update draw record
    await sql`
      UPDATE draws
      SET status = 'drawn',
          winner_id = ${winner.subscriber_id},
          drawn_at = now()
      WHERE id = ${draw.id}
    `;

    // Send winner email (fire-and-forget for the response, but log errors)
    sendDrawWinnerEmail(winner.email, draw.id).then((ok) => {
      if (ok) {
        // Mark notified
        const notifySql = getDb();
        notifySql`UPDATE draws SET notified_at = now() WHERE id = ${draw.id}`.catch(console.error);
      }
    }).catch(console.error);

    // Get runner-up count for the response
    const entryCount = await sql`
      SELECT count(*) AS cnt FROM draw_entries WHERE draw_id = ${draw.id}
    `;

    // Send runner-up emails in the background (don't block response)
    // Only send if Resend is configured and there are < 100 entries
    // (free tier limit). For larger lists, use the broadcast endpoint.
    const runnerUpCount = parseInt(entryCount[0]?.cnt || "0") - 1;
    if (runnerUpCount > 0 && runnerUpCount <= 99) {
      (async () => {
        try {
          const runnerUps = await sql`
            SELECT s.email FROM draw_entries de
            JOIN subscribers s ON s.id = de.subscriber_id
            WHERE de.draw_id = ${draw.id}
              AND de.subscriber_id != ${winner.subscriber_id}
              AND s.unsubscribed_at IS NULL
          `;
          for (const ru of runnerUps) {
            await sendDrawRunnerUpEmail(ru.email, discountCode);
            // Rate limit: 1 email per 1.1 seconds
            await new Promise((r) => setTimeout(r, 1100));
          }
        } catch (err) {
          console.error("[draw] Runner-up email batch failed:", err);
        }
      })();
    }

    return NextResponse.json({
      draw_id: draw.id,
      winner_email: winner.email,
      winner_subscriber_id: winner.subscriber_id,
      total_entries: parseInt(entryCount[0]?.cnt || "0"),
      discount_code: discountCode,
      runner_up_emails_queued: runnerUpCount > 0 && runnerUpCount <= 99,
      note: runnerUpCount > 99
        ? `${runnerUpCount} runner-ups — use /api/admin/broadcast to send discount codes (exceeds per-draw email limit)`
        : undefined,
    });
  }

  return NextResponse.json({ error: "Unknown action. Use: create, run, enter-all" }, { status: 400 });
}
