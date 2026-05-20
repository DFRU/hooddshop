# Hood'd Supplier Operations Playbook

**Date:** May 1, 2026
**Status:** ACTIONABLE — Ready for Dan to execute
**Deadline context:** World Cup kicks off June 11, 2026 (41 days away)

---

## 1. Current State Assessment

### What We Have
- **PrintKK (China)** is the only active supplier. Status: `active`. $7.31/unit. Shopify auto-fulfillment integrated. 230 designs uploaded. Sample was ordered ~April 9 but receipt status unknown.
- **16 other suppliers** cataloged in `suppliers.json`, all with status `verification_pending`. None have been contacted — all draft emails from March 2026 remain GATED/unsent.
- **Supplier geo-routing engine** is fully built and deployed. It routes customers to Standard ($49.99, 15-25 days via PrintKK) or Express ($59.99, 3-7 days via local supplier). But Express has no verified supplier behind it yet.

### Critical Gaps
1. **Single point of failure** — PrintKK is the only supplier. If they have production issues, quality problems, or shipping delays during World Cup peak, there is no backup.
2. **No Express fulfillment** — The geo-routing engine offers Express shipping, but no local/regional supplier is verified to fulfill it.
3. **No sample quality benchmarks** — PrintKK sample status is unclear. No comparative samples from other suppliers.
4. **No confirmed pricing from any backup supplier** — All cost data in `suppliers.json` is estimated, not quoted.
5. **No supplier agreements** — No terms, no SLAs, no confirmed lead times from anyone except PrintKK.

---

## 2. Supplier Priority Matrix

Ranked by strategic value for World Cup launch. "Action" = what to do right now.

### Tier A — Contact Immediately (this week)

| Rank | Supplier | Location | Why Priority | Est. Cost | Action |
|------|----------|----------|-------------|-----------|--------|
| **A1** | **Oracle Trading** | Toronto, CA | Already sells country flag hood covers wholesale. Same product. Canadian = fast shipping to you for QC. | ~$20/unit | Email for wholesale pricing sheet + sample order |
| **A2** | **AGAS Manufacturing** | Philadelphia, PA | US manufacturer, own facility, no MOQ, sublimation confirmed. Car hood covers on their website. | ~$20/unit | Email for custom design pricing + 3 samples |
| **A3** | **CBS Distributors** | Warminster, PA | Wholesale distributor, blind dropship, immediate shipping from stock. Hood covers in catalog. | ~$20/unit | Email to confirm custom design capability + dropship terms |
| **A4** | **Merchize** | Vietnam | POD with Shopify integration, 43k sqft facility, car accessories catalog. Best automated backup to PrintKK. **NOTE: As of May 2026, Merchize does NOT have car hood covers in their catalog.** They have car seat covers, spare tire covers, sun shades. Would require custom product request. | ~$21.50/unit | Sign up, submit custom product request with our specs. May not be viable for launch. |

### Tier B — Contact Next Week

| Rank | Supplier | Location | Why Priority | Est. Cost | Action |
|------|----------|----------|-------------|-----------|--------|
| **B1** | **Contrado** | London, UK | Premium POD, Shopify app, 4-way stretch polyester spandex, quality_score 7. | ~$30/unit | Test Shopify app, inquire about custom car accessory products |
| **B2** | **CarBannerFlags** | China | Already manufactures country flag hood covers. 2-day production. Potential bulk backup to PrintKK. | ~$20/unit | Alibaba message for custom design pricing + MOQ |
| **B3** | **Hesol Sports Covers** | UK | Sports covers specialist, 80% Dacron/20% Spandex. Premier League designs. UK/EU fulfillment. | ~$25/unit | Email for custom design partnership inquiry |

### Tier C — Defer (post-launch scaling)

| Rank | Supplier | Why Defer |
|------|----------|-----------|
| C1 | Haoerxin Textile | Bulk only, MOQ 100, no integration |
| C2 | Nuoxin Craft | Bulk only, MOQ 100, unverified |
| C3 | CusDisplay | Wholesale, unverified quality |
| C4 | ImprintItems | Promo company, no car-specific experience confirmed |
| C5 | PrintGlobe | $85/hr setup fee, 7-10 day production, expensive |
| C6 | Car Dealer Depot | $45 setup fee, dealership-focused |
| C7 | Art of Where | Montreal POD, no car products in catalog currently |

### Competitors (do NOT contact as suppliers)

| Supplier | Why Not |
|----------|---------|
| HOOD's Flags | Direct competitor — sells $35-75 on Amazon. Contacting reveals our plans. |
| KC Hood Covers | Small competitor in Independence, MO. Custom orders only. |

---

## 3. Information We Need From Each Tier A Supplier

For every supplier contact, we need these 7 data points confirmed:

1. **Custom design capability** — Can they print our designs (not just stock flags)? What file specs?
2. **Per-unit pricing** — At quantities of 1, 10, 50, 100, 500
3. **Sample availability** — Can we order 2-3 custom samples? Cost?
4. **Production lead time** — Days from approved artwork to ship-ready
5. **Shipping time and cost** — To Toronto, CA and to US customers
6. **Integration** — Shopify app, API, or manual order process?
7. **MOQ for custom designs** — Minimum order per design for ongoing production

---

## 4. Outreach Emails (Ready to Send)

### Email A1: Oracle Trading (Toronto, Canada)

**To:** Via contact form at oracletrading.ca (or find email on wholesale page)
**Subject:** Wholesale Partnership — Custom Car Hood Cover Designs for World Cup 2026

---

Hi,

I run Hood'd (HooddShop.com), a custom car hood cover brand launching for FIFA World Cup 2026. I've seen your wholesale hood cover catalog — you already carry country flag designs for Iran, Mexico, Brazil, Serbia, Uruguay, Portugal, and others.

I'm looking for a wholesale supplier for custom-designed hood covers (our own artwork, not stock flag designs) and have a few questions:

1. **Custom printing:** Can you produce hood covers with our custom designs (full-color sublimation, edge-to-edge)? We'd provide print-ready PNG files at 300 DPI.
2. **Wholesale pricing:** What is your per-unit cost at 10, 50, 100, and 500 units? Do volume discounts apply across SKUs or per-design?
3. **Samples:** Can I order 3 samples with our custom designs? What's the sample cost and turnaround?
4. **Material specs:** What is the fabric composition (polyester/spandex ratio), weight (GSM), and size of your current hood covers?
5. **Production lead time:** From approved artwork to shipment — how many days?
6. **Shipping:** You're in Toronto — I'm local. Can I pick up? What's your shipping to US customers?
7. **Dropship capability:** Can you ship directly to our customers with our branding (blind dropship)?

We have 48 nation designs ready and plan to expand to 150+. Looking for a long-term wholesale partner, not a one-off order.

Timeline is tight — World Cup starts June 11.

Thanks,
Dan
HOODD
HooddShop.com
Toronto, Canada

---

### Email A2: AGAS Manufacturing (Philadelphia, PA)

**To:** sales@agasmfg.com
**Subject:** Custom Sublimation Car Hood Covers — Wholesale Inquiry + Sample Request

---

Hi AGAS team,

I run Hood'd (HooddShop.com), a custom car hood cover brand for FIFA World Cup 2026. I see you manufacture car engine hood covers with full-color printing at your Philadelphia facility, and you have no minimum order requirement.

I'd like to explore a wholesale partnership and start with samples:

1. **Custom design printing:** Can you produce hood covers with our custom artwork (not stock designs)? We'd supply print-ready PNG files. What are your file specs (DPI, dimensions, bleed)?
2. **Pricing:** What is your per-unit cost for custom sublimation hood covers at 1, 10, 50, 100, and 500 units?
3. **Samples:** I'd like to order 3 samples with our designs (Canada, Brazil, USA flags — artistic interpretations, not stock). Cost and turnaround for samples?
4. **Material:** What is the fabric composition, weight, and stretch percentage of your hood covers?
5. **Production time:** Days from approved artwork to ship-ready at various quantities?
6. **Shipping:** Cost and time to Toronto, Canada? And to US domestic addresses?
7. **Capacity:** Can you handle 500+ unit runs with 48 different SKUs?

We're an e-commerce brand selling direct-to-consumer. Looking for a reliable US manufacturer for ongoing production.

Thanks,
Dan
HOODD
HooddShop.com

---

### Email A3: CBS Distributors (Warminster, PA)

**To:** Via cbsdistributors.com contact form or call 800-443-4333
**Subject:** Custom Hood Cover Wholesale Inquiry — World Cup 2026

---

Hi CBS team,

I run an e-commerce brand (HooddShop.com) selling custom car hood covers and I see you carry hood covers in your wholesale catalog. A few questions:

1. **Custom designs:** Your current hood covers appear to be promotional/dealership-focused. Can you produce covers with our custom full-color designs (country flag artwork for World Cup)?
2. **Wholesale pricing:** What's the per-unit cost for hood covers at 10, 50, and 100+ units?
3. **Blind dropship:** I saw you offer blind dropshipping. What are the terms? Can you ship our custom-designed covers directly to our customers under our branding?
4. **Material specs:** What is the fabric composition and size of your hood covers?
5. **Turnaround:** How quickly can you ship from stock? If custom printing is needed, what's the production time?

Thanks,
Dan
HOODD

---

### Email A4: Merchize (Vietnam) — Custom Product Request

**Status:** Merchize does NOT currently have car hood covers in their catalog. They offer car seat covers, spare tire covers, and sun shades — but not hood covers. A custom product request is required.

**Action:** Self-serve via merchize.com dashboard + support ticket

1. Create account at merchize.com
2. Confirm car hood covers are NOT in the Car Exterior Accessory category (verified May 1, 2026)
3. Submit custom product request via their support with specs:
   - Product: Stretch car hood cover, 63"x47" (160x120cm)
   - Material: 85-90% polyester / 10-15% spandex, 180-220 GSM
   - Print method: Full-color dye sublimation, edge-to-edge
   - Attachment: Elastic sewn-in edge + clip straps
   - Initial catalog: 48 designs, expanding to 150+
4. Ask for timeline — can they develop this product before June 11?
5. If timeline is too long, deprioritize Merchize to Tier C

**Realistic assessment:** Custom product development at a POD provider typically takes weeks to months. Merchize is unlikely to be ready for World Cup launch. Keep as a post-launch scaling option.

---

## 5. Sample Order Plan

### Budget
**$300 maximum** across all suppliers (samples + shipping to Toronto). Dan confirmed May 1.

**IMPORTANT:** Do NOT order samples yet. A custom sample design needs to be created first. Emails should focus on pricing, specs, lead times, and custom design capability — not sample orders.

### What to Order

| Supplier | Designs | Qty | Est. Cost | Purpose |
|----------|---------|-----|-----------|---------|
| Oracle Trading | Canada, Brazil, USA | 1 each (3 total) | ~$60 + local pickup | Closest supplier, fastest turnaround. Quality benchmark for Canadian fulfillment. |
| AGAS Manufacturing | Canada, Brazil, USA | 2 each (6 total) | ~$120 + ~$30 shipping | US manufacturing quality. One for photo, one for fit/wash testing. |
| PrintKK | (already ordered) | Unknown qty | Already paid | Check if received. If not, follow up. |

### Evaluation Criteria (score each sample 1-10)

1. **Print quality** — Color vibrancy, edge-to-edge coverage, no banding or artifacts
2. **Material feel** — Fabric weight, stretch quality, softness vs. stiffness
3. **Fit** — Elastic tension on sedan hood, SUV hood. Does it stay put?
4. **Durability** — Machine wash 3x, check for fading. Leave in sun 48hrs, check UV resistance.
5. **Construction** — Elastic hem quality, stitching, edge finishing
6. **Color accuracy** — Compare to digital artwork. How close?
7. **Packaging** — How does it arrive? Polybag? Branded?

### Design Files to Send
Use the same 3 designs (Canada, Brazil, USA) for all suppliers. This makes direct comparison possible. Files should be:
- Format: PNG
- Resolution: 300 DPI at 64" x 48" (includes 0.5" bleed)
- Color mode: RGB (sRGB)
- No text smaller than 2" height

---

## 6. Supplier Comparison Scorecard (fill in after samples arrive)

| Criteria | Weight | PrintKK | Oracle Trading | AGAS Mfg | CBS Dist | Merchize |
|----------|--------|---------|----------------|----------|----------|----------|
| Unit cost | 25% | $7.31 | ? | ? | ? | ? |
| Print quality | 20% | ? | ? | ? | ? | ? |
| Shipping speed (to customer) | 15% | 15-25 days | 3-7 days | 3-7 days | 1-5 days | 7-15 days |
| Shopify integration | 15% | Yes (auto) | ? | No | ? | Yes (API) |
| Material quality | 10% | ? | ? | ? | ? | ? |
| Reliability/track record | 10% | Low (5/10) | ? | ? | Established | ? |
| Custom design MOQ | 5% | 0 | ? | 0 | ? | 0 |
| **Total** | 100% | — | — | — | — | — |

---

## 7. Timeline

### Week of May 1-4 (NOW)
- [ ] Confirm PrintKK sample status — has it arrived? If not, when expected?
- [ ] Send Email A1 (Oracle Trading)
- [ ] Send Email A2 (AGAS Manufacturing)
- [ ] Send Email A3 (CBS Distributors)
- [ ] Sign up on Merchize, check car hood cover availability

### Week of May 5-11
- [ ] Follow up on any non-responses (48hr rule)
- [ ] Send Tier B emails (Contrado, CarBannerFlags, Hesol)
- [ ] Place sample orders from Oracle Trading and AGAS (if pricing received)
- [ ] Test Merchize Shopify integration if product available

### Week of May 12-18
- [ ] Receive and evaluate samples
- [ ] Fill in comparison scorecard
- [ ] Decide: which supplier(s) to activate for Express fulfillment
- [ ] Begin design file preparation for selected backup supplier

### Week of May 19-25
- [ ] Upload designs to backup supplier (if Shopify-integrated: use API)
- [ ] Test end-to-end order flow with backup supplier
- [ ] Update `suppliers.json` — change backup supplier status to `active`
- [ ] Update supplier engine quality/reliability scores based on sample results

### Week of May 26 - June 10
- [ ] Final pre-launch validation — place test order through each active supplier
- [ ] Confirm shipping times are as quoted
- [ ] Brief contingency plan: if PrintKK goes down, which supplier takes over?

---

## 8. Decisions — CONFIRMED (May 1, 2026)

1. **PrintKK sample** — Arrived. Quality is "decent." Baseline confirmed.
2. **Budget** — $300 maximum. Do NOT order samples yet — sample design needs to be created first.
3. **Design files** — Ready (Canada, Brazil, USA in print-ready PNG).
4. **Brand name** — HOODD / HooddShop.com.
5. **Shipping address** — Toronto. Exact address TBD when placing sample orders.
6. **HOOD's Flags** — Excluded (competitor). Confirmed.
7. **Competitor benchmarking** — No.
8. **Express pricing** — $59.99 confirmed. Margin acceptable.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PrintKK quality issues discovered in sample | Medium | High | This playbook — activate backup supplier before launch |
| No Tier A supplier can do custom designs | Low | High | Fall back to Tier B (Contrado has confirmed custom capability) or Tier C bulk suppliers |
| Supplier lead times too long for World Cup | Medium | High | Oracle Trading is local (Toronto). CBS ships from stock in 1-5 days. These are fastest options. |
| Express fulfillment costs erode margin | Medium | Medium | Current $59.99 Express price gives ~50-60% margin at $20-25 COGS. Acceptable. Adjust pricing if needed. |
| PrintKK capacity issues during World Cup peak | Medium | Critical | Having 1+ verified backup supplier is the entire purpose of this effort |

---

## 10. File Locations Reference

| Document | Path |
|----------|------|
| Supplier JSON (live codebase) | `C:\Dev\hooddshop\lib\data\suppliers.json` |
| Original supplier research | `D:\HOODD\05_BUSINESS\suppliers\supplier-research.md` |
| Original inquiry drafts (March) | `D:\HOODD\05_BUSINESS\suppliers\supplier-inquiry-drafts.md` |
| Original sample order drafts (March) | `D:\HOODD\05_BUSINESS\suppliers\sample-order-drafts.md` |
| Product specs | `D:\HOODD\05_BUSINESS\suppliers\product-specs.md` |
| Print specs per supplier | `D:\HOODD\05_BUSINESS\suppliers\print-specs.md` |
| POD supplier comparison | `D:\HOODD\01_PRODUCTION\v2_jersey_line\print\AurelianBrain\_sources\extractions\gdrive\1GXGuvMv_hoodd_pod_supplier_comparison.md` |
| Supplier engine build spec | `C:\Dev\hooddshop\SUPPLIER-ENGINE-BUILD-SPEC.md` |
| 17-supplier repository (HOODD) | `D:\HOODD\05_BUSINESS\suppliers\suppliers-repository.json` |

---

*End of playbook. Execute Section 7 timeline starting today.*
