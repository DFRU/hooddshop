# Web Spec — Limited Edition Drop Pages

**For:** Web Build Cowork
**From:** CEO Session
**Date:** 2026-04-15
**Priority:** P1 — blocks first drop on April 28
**Depends on:** Two-size variant implementation must ship first

---

## Goal

Build a dedicated drop product page template distinct from the standard PDP. Drop pages must credibly signal scarcity (countdown, sold count, auto-close), differentiate limited-edition visual treatment, and support both house-originated and creator-collab drops from the same template.

The drop system is the anchor of Hood'd's marketing engine from April 28 through July 19, 2026. It must be reliable. A drop that fails to close on time, breaks checkout, or looks identical to the standard line defeats the entire program.

## Acceptance Criteria

1. **Route** `app/drops/[slug]/page.tsx` renders a drop product page fetched from Shopify by handle.
2. **Countdown timer** visible above the fold, shows time remaining to drop close. Updates every second. When it hits zero the page state changes to "Closed" without requiring a reload.
3. **Auto-unpublish** — at T+48hr (or configured window), the underlying Shopify variant becomes unavailable. Add-to-cart is disabled. Page converts to a "Past Drop" / archive state displaying final sold count and final imagery.
4. **Live sold counter** (optional first version) — a number showing units sold. May be real (Shopify order count) or manually curated. Must not decrement. Must not reveal inventory if inventory is effectively unlimited (POD).
5. **Drop badge** visible in the hero, styled distinctly from the standard line.
6. **Creator attribution** — for collab drops, surface creator name, avatar, and a link to their profile. Template must gracefully hide these elements for house drops.
7. **48-hour window** is configurable per drop (between 24 and 96 hours). Start time and end time stored on the product as metafields.
8. **No returns banner** visible before add-to-cart — "Limited editions are final sale."
9. **Email capture** on drop page for non-purchasers — single-field form, posts to email platform via API route.
10. **Past Drops archive** page at `/drops` listing all closed drops in chronological order with final sold count and date. Acts as the scarcity proof.
11. **Works on mobile first** — drop traffic will be >80% mobile. Touch targets ≥44×44px. Countdown does not cause layout shift.
12. **Size selector** — drop pages use the same two-size variant system as the standard line (Car/Small SUV, Truck/Large SUV). Not optional.
13. **Shareable link** — drop page OG image is the drop hero, OG title matches drop name, OG description includes creator if applicable.
14. **Brand consistency** — dark theme, Bebas Neue display, DM Sans body, accent `#FF4D00`. Same nav, cart, footer as standard PDP.

## Out of Scope for v1

- SMS notifications (email only)
- Waitlist for sold-out drops
- Pre-announcement teaser pages (handled by standard homepage for now)
- Multi-variant drops (size only; no color/material variants on drops)
- Internationalization (English only; Spanish added post-launch)
- Gamification (no loyalty points, tiers, or badges)
- Native countdown in email (static timestamp in email body is fine)

## Data Model

### Shopify product metafields (namespace: `drop`)

| Key | Type | Purpose |
|---|---|---|
| `start_at` | datetime | Drop window opens |
| `end_at` | datetime | Drop window closes (auto-unpublish trigger) |
| `drop_type` | single_line_text | `house` or `collab` |
| `creator_name` | single_line_text | Creator display name (collab only) |
| `creator_handle` | single_line_text | Creator IG/TikTok handle (collab only) |
| `creator_avatar_url` | url | Creator photo URL (collab only) |
| `creator_link` | url | Creator external profile link |
| `concept_tagline` | single_line_text | One-line design story |
| `final_sold_count` | integer | Populated after close for archive display |

### Shopify Flow automation

- Trigger: `Product metafield "drop.end_at" has passed`
- Action: Set product status to `draft` (unpublish from online store)
- Action: Populate `drop.final_sold_count` with total ordered quantity

If Shopify Flow can't natively handle the datetime comparison, fall back to a scheduled Next.js API route (`/api/drops/close`) hit by Vercel Cron every 10 minutes that queries products with past `end_at` and updates them via Admin API.

## Component Breakdown

```
app/drops/[slug]/page.tsx           — Server component, fetches product + metafields
app/drops/[slug]/DropClient.tsx     — Client component for countdown + interactive state
app/drops/page.tsx                   — Archive index

components/drops/
  DropCountdown.tsx                  — Self-updating timer, emits "expired" event
  DropStateBadge.tsx                 — "LIVE" / "CLOSING SOON" / "CLOSED" chip
  DropCreatorBanner.tsx              — Creator attribution block (conditional render)
  DropScarcityBar.tsx                — "X sold in Y hours" social proof
  DropEmailCapture.tsx               — Single-field form + API submit
  DropArchiveCard.tsx                — Card in archive list

app/api/drops/
  close/route.ts                     — Cron-triggered cleanup (fallback if no Shopify Flow)
  email-capture/route.ts             — POST handler for email signups
```

## Design Direction

**Differentiation from standard PDP:**

- **Hero treatment:** full-bleed mockup image, limited drop name in Bebas Neue at 80px+, accent underline in `#FF4D00`
- **Countdown placement:** directly below hero name, before any other copy. Accent color. Prominent.
- **"LIMITED EDITION" eyebrow** above the drop name, 11px tracking, muted color
- **Creator banner (collab only):** horizontal strip below hero with avatar, name, handle, and link, divided by subtle rule from the rest of the page
- **Scarcity bar** above add-to-cart: "58 sold · 22 hours remaining" (live)
- **Add-to-cart button:** larger than standard PDP (min 56px tall), accent background, confident copy: "CLAIM YOURS — $59.99"
- **Final-sale notice:** below add-to-cart, muted text, unambiguous: "Limited drop. No returns or exchanges. Ships within 14 days."
- **Gallery:** same grid as standard PDP, but with a "LIMITED" watermark on the primary image
- **Past-drop archive state:** grayscale hero, large "SOLD OUT" overlay, final sold count shown prominently, no add-to-cart

## Accessibility

- Countdown announces state changes to screen readers on threshold crossings (24hr, 1hr, 10min, closed)
- All timer text has a sighted fallback and an `aria-live="polite"` region
- Keyboard: countdown is not interactive; focus flows hero → creator link (if present) → size selector → add-to-cart → email capture
- Color contrast: accent `#FF4D00` on `#0A0A0A` background passes AA for large text only (18pt+ bold or 24pt+ regular). Do not use for body text.

## Analytics Events (Required)

- `drop_page_view` — { drop_slug, drop_type, creator_handle }
- `drop_countdown_threshold` — { drop_slug, threshold_hit: "24h" | "1h" | "10min" }
- `drop_add_to_cart` — { drop_slug, variant_size }
- `drop_email_capture` — { drop_slug }
- `drop_closed_view` — { drop_slug, final_count }

Ship to the existing analytics layer (`components/layout/Analytics.tsx`). Do not add a new analytics provider.

## Edge Cases

1. **User is viewing the drop page when countdown hits zero.** Page state must update in place, not require reload. Add-to-cart disables, copy changes.
2. **User added to cart before close, checking out after close.** Cart add-to-cart should be blocked server-side if `drop.end_at` has passed. If they somehow complete checkout after close, honor the order (they bought in time, fulfillment is fine).
3. **Timezone handling.** All drop times stored as UTC in metafields, rendered in user's local time. Email copy uses a fixed ET reference: "Closes 10am ET Thursday."
4. **Countdown drift.** Client computes time remaining from server-sent `end_at` timestamp, not from a hardcoded duration. Prevents drift if user leaves tab open.
5. **Shopify product handle collision.** Drop handles namespaced with `drop-` prefix to avoid collision with standard products (e.g., `drop-argentina-86-retro`).
6. **Archive page load with 30+ drops.** Use ISR with 5-min revalidation; lazy-load images below fold.

## Verification Requirements Before Ship

- `npx tsc --noEmit` — zero errors
- Countdown continues to count down correctly across tab sleep/resume
- Auto-unpublish fires in staging with a 5-minute test window
- Email capture writes to the target platform (or logs to console in dev)
- Page loads under 2s on throttled 4G mobile simulation
- Archive page renders correctly with 0 past drops (empty state) and with ≥10 past drops
- Lighthouse scores: Performance ≥85 mobile, Accessibility ≥95, SEO ≥90

## Non-Requirements

- Do not build an admin UI for drop creation. Drops are managed via Shopify Admin directly — populate metafields on the product. Web Cowork can ship a minimal admin later if volume demands it.
- Do not build a drop-creation workflow in the app. That's a Shopify-Admin-side task.

## Open Questions for CEO Session

1. What email platform is in use (Klaviyo, Mailchimp, none yet)? Email capture endpoint depends on this.
2. Is Vercel Cron available on the current Vercel plan? If not, fallback to Shopify Flow only.
3. Should the "sold count" be real (from Shopify orders API) or curated (manually set to prevent showing low numbers)?

Respond in-line in this document or in chat. Block on items 1 and 3 before starting on email capture + scarcity bar respectively.
