/**
 * POST /api/subscribe
 * Captures email signups for notifications, drops, and weekly draws.
 * Stores in Neon Postgres subscribers table (created by migrations).
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { sendWelcomeEmail } from "@/lib/email/send";

const VALID_SOURCES: readonly string[] = [
  "hero", "giveaway", "footer", "concept", "popup", "mailing-list",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const src = VALID_SOURCES.includes(source) ? source : "unknown";
    const sql = getDb();

    const existing = await sql`
      SELECT id, unsubscribed_at FROM subscribers WHERE email = ${trimmed} LIMIT 1
    `;

    let subscriberId: number;
    let isNew = false;

    if (existing.length === 0) {
      const inserted = await sql`
        INSERT INTO subscribers (email, source) VALUES (${trimmed}, ${src}) RETURNING id
      `;
      subscriberId = inserted[0].id;
      isNew = true;
    } else {
      subscriberId = existing[0].id;
      if (existing[0].unsubscribed_at) {
        await sql`UPDATE subscribers SET unsubscribed_at = ${null}, source = ${src} WHERE id = ${subscriberId}`;
        isNew = true;
      }
    }

    if (subscriberId && (src === "giveaway" || src === "mailing-list")) {
      await sql`
        INSERT INTO draw_entries (draw_id, subscriber_id, entry_source)
        SELECT d.id, ${subscriberId}, 'subscribe'
        FROM draws d
        WHERE d.status = 'open' AND now() BETWEEN d.period_start AND d.period_end
        LIMIT 1
        ON CONFLICT (draw_id, subscriber_id) DO NOTHING
      `;
    }

    if (isNew) {
      sendWelcomeEmail(trimmed).catch((err: unknown) =>
        console.error("[subscribe] welcome email failed:", err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
