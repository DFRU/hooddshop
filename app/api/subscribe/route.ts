/**
 * POST /api/subscribe
 * Captures email signups for notifications, drops, and weekly draws.
 * Stores in Neon Postgres. Ready for Klaviyo sync later.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

const VALID_SOURCES = ["hero", "giveaway", "footer", "concept", "popup"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Validate source
    const src = VALID_SOURCES.includes(source) ? source : "unknown";

    const sql = getDb();

    // Upsert — don't error on duplicate, just update source if new
    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id              SERIAL PRIMARY KEY,
        email           TEXT NOT NULL UNIQUE,
        source          TEXT NOT NULL DEFAULT 'unknown',
        subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        unsubscribed_at TIMESTAMPTZ
      )
    `;

    await sql`
      INSERT INTO subscribers (email, source)
      VALUES (${trimmed}, ${src})
      ON CONFLICT (email) DO NOTHING
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
