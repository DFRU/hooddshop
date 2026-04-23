/**
 * Email sending via Resend.
 *
 * Gated on RESEND_API_KEY env var — if not set, emails are logged
 * to console instead of sent. This avoids blocking development.
 *
 * Env vars:
 *   RESEND_API_KEY      — Resend API key (starts with re_)
 *   EMAIL_FROM          — Sender address (default: Hood'd <noreply@hooddshop.com>)
 *   NEXT_PUBLIC_SITE_URL — Used for unsubscribe links (default: https://hooddshop.com)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Hood'd <noreply@hooddshop.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hooddshop.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a single email via Resend. If RESEND_API_KEY is not set,
 * logs to console and returns true (no-op success).
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[email] (dry run) To: ${params.to} | Subject: ${params.subject}`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend returned ${res.status}: ${body.slice(0, 200)}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

/**
 * Send emails in batches to avoid rate limits.
 * Resend free tier: 100 emails/day, 1 email/second.
 */
export async function sendBatch(
  emails: SendEmailParams[],
  delayMs: number = 1100
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const ok = await sendEmail(email);
    if (ok) sent++;
    else failed++;

    // Rate limit delay between sends
    if (delayMs > 0 && emails.indexOf(email) < emails.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { sent, failed };
}

function unsubscribeUrl(email: string): string {
  const token = Buffer.from(email).toString("base64url");
  return `${SITE_URL}/api/unsubscribe?token=${token}`;
}

// ── Email templates ──────────────────────────────────────────────

export async function sendWelcomeEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "You're in — Hood'd World Cup 2026",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #e0e0e0; background: #0A0A0A;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 0.04em;">HOOD'D</span>
        </div>
        <h1 style="font-size: 22px; color: #fff; margin: 0 0 12px;">Welcome to Hood'd</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          You're now on the list for weekly draws, flash sales, and first access to new designs
          for FIFA World Cup 2026.
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          Every week, one subscriber wins a free hood cover — any nation, on us.
          Runners-up get exclusive discount codes.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${SITE_URL}/shop" style="display: inline-block; padding: 14px 32px; background: #FF4D00; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.06em; border-radius: 6px; text-transform: uppercase;">
            Browse Designs
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 28px 0;" />
        <p style="font-size: 11px; color: #555; text-align: center; margin: 0;">
          <a href="${unsubscribeUrl(email)}" style="color: #555; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Hood'd &nbsp;·&nbsp; hooddshop.com
        </p>
      </div>
    `,
    text: `Welcome to Hood'd!\n\nYou're on the list for weekly draws, flash sales, and first access to new designs for FIFA World Cup 2026.\n\nEvery week, one subscriber wins a free hood cover. Browse designs: ${SITE_URL}/shop\n\nUnsubscribe: ${unsubscribeUrl(email)}`,
  });
}

export async function sendDrawWinnerEmail(
  email: string,
  drawId: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "You won this week's Hood'd draw!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #e0e0e0; background: #0A0A0A;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 0.04em;">HOOD'D</span>
        </div>
        <h1 style="font-size: 22px; color: #FF4D00; margin: 0 0 12px; text-align: center;">YOU WON!</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          Congratulations — you've been selected as the winner of this week's Hood'd draw (#${drawId}).
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          Your prize: <strong style="color: #fff;">one free Hood'd car hood cover, any nation of your choice</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          Reply to this email with your nation choice and shipping address. We'll get it printed and shipped to you.
        </p>
        <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 28px 0;" />
        <p style="font-size: 11px; color: #555; text-align: center; margin: 0;">
          <a href="${unsubscribeUrl(email)}" style="color: #555; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Hood'd &nbsp;·&nbsp; hooddshop.com
        </p>
      </div>
    `,
    text: `Congratulations — you've won this week's Hood'd draw (#${drawId})!\n\nYour prize: one free Hood'd car hood cover, any nation of your choice.\n\nReply to this email with your nation choice and shipping address.\n\nUnsubscribe: ${unsubscribeUrl(email)}`,
  });
}

export async function sendDrawRunnerUpEmail(
  email: string,
  discountCode: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "This week's draw results + your exclusive discount",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #e0e0e0; background: #0A0A0A;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 0.04em;">HOOD'D</span>
        </div>
        <h1 style="font-size: 22px; color: #fff; margin: 0 0 12px;">This Week's Draw</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          Thanks for entering this week's draw. You weren't selected as the winner this time, but you're
          automatically entered for next week.
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 16px;">
          As a thank you, here's an exclusive discount code:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; padding: 12px 28px; background: rgba(255,77,0,0.1); border: 1px solid rgba(255,77,0,0.3); border-radius: 8px; font-size: 20px; font-weight: 700; color: #FF4D00; letter-spacing: 0.1em;">
            ${discountCode}
          </span>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${SITE_URL}/shop" style="display: inline-block; padding: 14px 32px; background: #FF4D00; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.06em; border-radius: 6px; text-transform: uppercase;">
            Shop Now
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 28px 0;" />
        <p style="font-size: 11px; color: #555; text-align: center; margin: 0;">
          <a href="${unsubscribeUrl(email)}" style="color: #555; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Hood'd &nbsp;·&nbsp; hooddshop.com
        </p>
      </div>
    `,
    text: `Thanks for entering this week's Hood'd draw. You weren't selected this time, but you're automatically entered for next week.\n\nAs a thank you, here's your exclusive discount code: ${discountCode}\n\nShop now: ${SITE_URL}/shop\n\nUnsubscribe: ${unsubscribeUrl(email)}`,
  });
}

export function buildBroadcastHtml(
  bodyHtml: string,
  recipientEmail: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #e0e0e0; background: #0A0A0A;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 0.04em;">HOOD'D</span>
      </div>
      ${bodyHtml}
      <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 28px 0;" />
      <p style="font-size: 11px; color: #555; text-align: center; margin: 0;">
        <a href="${unsubscribeUrl(recipientEmail)}" style="color: #555; text-decoration: underline;">Unsubscribe</a>
        &nbsp;·&nbsp; Hood'd &nbsp;·&nbsp; hooddshop.com
      </p>
    </div>
  `;
}
