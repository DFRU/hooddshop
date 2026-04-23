/**
 * POST /api/admin/broadcast
 * Send a broadcast email to all active subscribers.
 *
 * Protected by SUPPLIER_ADMIN_TOKEN.
 *
 * Body:
 *   {
 *     "subject": "New designs just dropped!",
 *     "body_html": "<h1>Check out...</h1><p>...</p>",
 *     "body_text": "Check out...",          // optional plain-text fallback
 *     "type": "new-design" | "discount" | "draw-result" | "general",
 *     "dry_run": false                       // optional, default false
 *   }
 *
 * The body_html is wrapped in the Hood'd email template (header + unsubscribe footer)
 * automatically. Do NOT include full HTML document structure — just the inner content.
 *
 * GET /api/admin/broadcast — list recent broadcasts
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { sendEmail, buildBroadcastHtml } from "@/lib/email/send";

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
  const broadcasts = await sql`
    SELECT id, subject, type, sent_count, status, sent_at, created_at
    FROM broadcasts
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, body_html, body_text, type, dry_run } = body;

    if (!subject || !body_html) {
      return NextResponse.json(
        { error: "subject and body_html are required" },
        { status: 400 }
      );
    }

    const broadcastType = ["new-design", "discount", "draw-result", "general"].includes(type)
      ? type
      : "general";

    const sql = getDb();

    // Get active subscribers
    const subscribers = await sql`
      SELECT id, email FROM subscribers
      WHERE unsubscribed_at IS NULL
      ORDER BY id
    `;

    if (dry_run) {
      return NextResponse.json({
        dry_run: true,
        would_send_to: subscribers.length,
        subject,
        type: broadcastType,
        preview_html: buildBroadcastHtml(body_html, "preview@example.com"),
      });
    }

    // Create broadcast record
    const result = await sql`
      INSERT INTO broadcasts (subject, body_html, body_text, type, status)
      VALUES (${subject}, ${body_html}, ${body_text || null}, ${broadcastType}, 'sending')
      RETURNING id
    `;

    const broadcastId = result[0].id;

    // Send in background — return immediately with the count
    // The actual sending happens asynchronously
    const subscriberList = [...subscribers];

    (async () => {
      let sent = 0;
      let failed = 0;

      for (const sub of subscriberList) {
        const html = buildBroadcastHtml(body_html, sub.email);
        const ok = await sendEmail({
          to: sub.email,
          subject,
          html,
          text: body_text,
        });

        if (ok) sent++;
        else failed++;

        // Rate limit: ~1 email/sec for Resend free tier
        if (subscriberList.indexOf(sub) < subscriberList.length - 1) {
          await new Promise((r) => setTimeout(r, 1100));
        }
      }

      // Update broadcast record with final counts
      try {
        const updateSql = getDb();
        await updateSql`
          UPDATE broadcasts
          SET sent_count = ${sent},
              status = 'sent',
              sent_at = now()
          WHERE id = ${broadcastId}
        `;
      } catch (err) {
        console.error("[broadcast] Failed to update broadcast record:", err);
      }

      console.log(`[broadcast] #${broadcastId} complete: ${sent} sent, ${failed} failed`);
    })();

    return NextResponse.json({
      broadcast_id: broadcastId,
      queued_for: subscribers.length,
      subject,
      type: broadcastType,
      note: "Sending in background. Check GET /api/admin/broadcast for status.",
    });
  } catch (err) {
    console.error("[broadcast]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
