/**
 * GET /api/unsubscribe?token=<base64url-encoded email>
 * Marks a subscriber as unsubscribed. Returns a simple HTML page.
 *
 * Token is base64url-encoded email (not cryptographic — acceptable
 * because unsubscribing is a destructive-only action with no upside
 * for an attacker). If a signed token is desired later, swap to HMAC.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(htmlPage("Missing token", "Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  let email: string;
  try {
    email = Buffer.from(token, "base64url").toString("utf-8").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("bad email");
  } catch {
    return new NextResponse(htmlPage("Invalid link", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const sql = getDb();
    await sql`
      UPDATE subscribers
      SET unsubscribed_at = now()
      WHERE email = ${email} AND unsubscribed_at IS NULL
    `;

    return new NextResponse(
      htmlPage(
        "Unsubscribed",
        "You've been removed from the Hood'd mailing list. You won't receive any further emails from us."
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("[unsubscribe]", err);
    return new NextResponse(htmlPage("Error", "Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Hood'd</title>
<style>body{margin:0;padding:40px 20px;background:#0A0A0A;color:#999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center}
h1{color:#fff;font-size:24px;margin-bottom:12px}p{font-size:15px;line-height:1.6;max-width:400px;margin:0 auto}
a{color:#FF4D00;text-decoration:none}</style></head>
<body><h1>${title}</h1><p>${message}</p><p style="margin-top:24px"><a href="https://hooddshop.com">← Back to Hood'd</a></p></body></html>`;
}
