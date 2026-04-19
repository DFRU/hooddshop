# Hood'd — Brand Voice Guide & Product Copy Templates

**Status:** Draft v0.1
**Date:** 2026-04-15
**Purpose:** Reference for AI-generated and human-written product copy across Shopify catalog, drop pages, email, social, and ads.

---

## 1. Voice Principles

### Who Hood'd Sounds Like
A friend who's into cars and football, knows their stuff, and doesn't try too hard. Confident without being loud. The tone sits between streetwear brand and automotive accessory — not a sports merch megastore, not a luxury fashion house.

### Five Rules

1. **Direct over clever.** Say what the product is and what it does. Wordplay is fine in headlines; never in product specs.
2. **Short sentences.** Paragraph copy should feel punchy. If a sentence runs past two commas, split it.
3. **"You" over "we."** The customer is the subject. "Your ride. Your flag." not "Our premium product delivers..."
4. **No hype words.** Ban list: revolutionary, game-changing, stunning, incredible, must-have, insane, fire (as adjective), slay, iconic (unless referring to an actual iconic match/moment). These words signal that the copy has nothing real to say.
5. **Specifics over adjectives.** "Polyester-spandex stretch fit with elastic edges" beats "premium high-quality material." Numbers, materials, and process details build credibility; adjectives don't.

### Tone Spectrum

| Context | Tone |
|---|---|
| Product description (Shopify) | Factual, concise, confident |
| Drop page headline | Bold, urgent (time-limited), emotional (national pride) |
| Email subject lines | Direct, curiosity-driving, no clickbait |
| Social captions | Casual, community-oriented, conversation-starting |
| Customer service | Warm, helpful, no corporate-speak |

### Words We Use

- "Rep" (as in represent your nation)
- "Ride" (the customer's vehicle)
- "Hood cover" (never "bonnet cover" unless targeting UK)
- "Made to order" (factual — it's POD)
- "Full-bleed sublimation print" (technical but customers understand it signals quality)
- "Stretch fit" / "universal fit"
- "Drop" (for limited editions)
- "Nation" (not "country" in brand context — "nation" carries more identity weight)

### Words We Don't Use

- "Jersey" in product descriptions (we don't sell jerseys — the designs are jersey-inspired)
- "Cheap" or "affordable" (position on value, not price)
- "Official" (we are explicitly not officially licensed)
- "Replica" (we are not replicating anything — designs are original compositions)
- "Limited edition" in evergreen catalog (reserve for actual drops)

---

## 2. Product Copy Templates (Shopify Catalog)

### 2.1 Product Title

**Format:** `HOOD'D | {Nation Name} {emoji} Jersey Line`

This format is already live on 48 products. Do not change it for variant migration — consistency with existing indexed titles matters more than theoretical optimization.

### 2.2 SEO Meta Description (auto-generated per PDP)

**Template (already in `page.tsx`):**
```
Rep {Nation Name} on the road with Hood'd premium stretch-fit car hood covers. Full sublimation print, universal fit for cars, SUVs, and trucks. $49.99. Made to order for World Cup 2026.
```

### 2.3 Product Description (Shopify `body_html`)

**Template — Evergreen Catalog:**

```html
<p>Rep {Nation Name} {emoji} every time you park. The Hood'd {Nation Name} {Variant} cover wraps your hood in a full-bleed sublimation print inspired by the {home/away} kit color palette.</p>

<p><strong>What you get:</strong></p>
<ul>
  <li>Stretch polyester-spandex with sewn-in elastic edges — pulls on in seconds, no clips or magnets</li>
  <li>Universal fit for sedans, SUVs, and trucks</li>
  <li>Full-sublimation print — edge to edge, no white borders</li>
  <li>Made to order, ships within 5–10 business days</li>
  <li>Machine washable</li>
</ul>

<p>48 nations. One mission. Let the world see who you ride for.</p>
```

**Variable substitutions:**
- `{Nation Name}` — from `lib/nations.ts` `.name`
- `{emoji}` — from `lib/nations.ts` `.emoji`
- `{Variant}` — "Home" or "Away"
- `{home/away}` — lowercase, matches variant

**Notes:**
- Keep the product description identical across Home/Away variants of the same nation. The variant selector handles differentiation.
- Do NOT include pricing in the description (it's displayed separately and changes would require description updates).
- The bullet list is acceptable here because Shopify product descriptions are a structured format where customers expect scannable specs.

### 2.4 Product Description — Drop Items

```html
<p><strong>Limited drop — {drop_name}.</strong> {unit_cap} units. When they're gone, they're gone.</p>

<p>{1-2 sentences about the design concept — what inspired it, what makes it different from the evergreen version. Be specific: reference the era, the match, the visual motif.}</p>

<p>Same Hood'd quality: stretch polyester-spandex, full-sublimation print, universal fit. Made to order, ships within 5–10 business days.</p>

<p><strong>Final sale.</strong> Drop items cannot be returned or exchanged.</p>
```

**Example — Argentina '86 Drop:**

```html
<p><strong>Limited drop — Maradona '86.</strong> 200 units. When they're gone, they're gone.</p>

<p>A tribute to the 1986 World Cup final in Mexico City. The design pulls from the sky blue and white vertical stripes with detailing inspired by the Le Coq Sportif era — the kit Maradona wore for the Hand of God and the Goal of the Century in the same match.</p>

<p>Same Hood'd quality: stretch polyester-spandex, full-sublimation print, universal fit. Made to order, ships within 5–10 business days.</p>

<p><strong>Final sale.</strong> Drop items cannot be returned or exchanged.</p>
```

---

## 3. AI Copy Generation Instructions

When using AI (GPT-4, Claude, etc.) to generate product descriptions at scale, use the following system prompt:

```
You are writing product descriptions for Hood'd Shop (hooddshop.com), a brand selling custom sublimation-printed car hood covers for FIFA World Cup 2026.

Voice rules:
- Direct, confident, concise. No hype.
- "You" over "we." The customer is the subject.
- Short sentences. Split anything past two commas.
- Use specifics: "polyester-spandex stretch fit with elastic edges" not "premium material."
- Never use: revolutionary, game-changing, stunning, incredible, must-have, insane, fire, slay, iconic, official, replica, cheap, affordable.
- Never claim official licensing or affiliation with FIFA or any federation.
- "Jersey-inspired" is acceptable. "Jersey" alone is not (we sell hood covers, not jerseys).

Product facts (include in every description):
- Stretch polyester-spandex, sewn-in elastic edges
- Universal fit: sedans, SUVs, trucks
- Full-sublimation print, edge to edge
- Made to order, ships 5–10 business days
- Machine washable
- No clips, no magnets — pull on and go

Format: HTML. One opening paragraph (2-3 sentences, nation-specific), one bullet list (product specs), one closing line.

Closing line for evergreen: "48 nations. One mission. Let the world see who you ride for."
Closing line for drops: "Final sale. Drop items cannot be returned or exchanged."
```

### 3.1 Per-Nation Color/Design Notes

For AI-generated copy to reference the correct color palette per nation, the generation script should pass nation-specific context. Minimum required per nation:

```json
{
  "nation": "Argentina",
  "code": "ar",
  "home_palette": "sky blue and white vertical stripes",
  "away_palette": "dark navy with gold accents",
  "football_identity": "Two-time world champions. Messi's final chapter. La Albiceleste."
}
```

This context file should be maintained at `lib/data/nation-copy-context.json` and used by the upload script when generating descriptions.

**Deferred:** Building the full 48-nation copy context file. This can be generated in a single batch using the AI system prompt above with web search for each nation's kit details.

---

## 4. Email & Social Templates

### 4.1 Drop Announcement Email — Subject Lines

**Formula:** `{Nation/Theme} + {urgency signal} + {quantity}`

Examples:
- `Argentina '86 — 200 units, live now`
- `The Maradona drop just went live. 200 covers.`
- `Hood'd × {Creator}: {Nation} drop. {N} units. Final sale.`

**Do not use:** ALL CAPS subjects, multiple exclamation marks, "You won't believe," "Don't miss out," or any phrasing that reads as spam.

### 4.2 Social Caption Formula

**Structure:** Hook (1 line) + Context (1-2 lines) + CTA (1 line)

**Example:**
```
Argentina '86. 200 units. Link in bio.

A tribute to the World Cup final in Mexico City — sky blue stripes, Le Coq Sportif era. Full-bleed sublimation on stretch-fit car hood covers.

hooddshop.com/drops/maradona-86
```

### 4.3 Abandoned Cart Email

**Subject:** `Your {Nation Name} cover is still in your cart`

**Body:**
```
Hey {first_name},

You left a {Nation Name} {Variant} hood cover in your cart. It's made to order, so there's no stock risk — but we wanted to make sure you didn't forget.

[Complete your order →]

Questions? Reply to this email.

— Hood'd
```

**Do not add:** Discount codes in abandoned cart emails at launch. Discounting erodes margin on a $49.99 product with $16.75 COGS. Revisit after 90 days of sales data.

---

## 5. Disclaimers (required on all customer-facing copy)

### 5.1 Non-Affiliation (already in Footer)
> HOOD'D is not affiliated with, endorsed by, or sponsored by FIFA, any national football federation, or any kit manufacturer. All product designs are original compositions inspired by national team color palettes. National team names and color schemes are used for descriptive purposes only.

### 5.2 AI-Generated Images (already in Footer)
> Vehicle preview images are AI-generated for illustrative purposes only and may not exactly represent the final product. Actual colors, fit, and appearance may vary.

### 5.3 Final Sale (drop PDPs and checkout)
> This is a limited-edition drop item. All sales are final. No returns or exchanges.

---

**Changelog:**
- v0.1 (2026-04-15): Initial draft.
