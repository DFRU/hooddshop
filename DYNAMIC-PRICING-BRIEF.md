# HOODD Dynamic Pricing System — Cowork Brief

**Created:** May 1, 2026
**Status:** WAITING — Supplier cost data needed before implementation
**Context:** Hand off from supplier outreach Cowork session

---

## What This Cowork Needs to Build

A dynamic pricing engine that calculates customer-facing prices per fulfillment option based on real supplier costs, shipping, and target margins — replacing the current hardcoded $49.99 / $59.99 two-tier model.

---

## Current State (what exists in the codebase)

### Pricing module
- `C:\Dev\hooddshop\lib\suppliers\pricing.ts` — static tier-based pricing
- Two tiers: Standard ($49.99, 15-25 days via PrintKK) and Express ($59.99, 3-7 days via local supplier)
- Hardcoded, not supplier-aware

### Geo-routing engine (fully built)
- `C:\Dev\hooddshop\lib\suppliers/` — types, constants, repository, geo (Haversine), pricing, router
- `C:\Dev\hooddshop\app\api\suppliers\options\route.ts` — Edge API, detects customer location, returns ranked options
- `C:\Dev\hooddshop\components\product\FulfillmentSelector.tsx` — customer-facing UI on PDP
- `C:\Dev\hooddshop\lib\data\suppliers.json` — 17 suppliers with coordinates, capabilities

### What the router returns today
Each `FulfillmentOption` has: supplierId, tier (standard/express), price, estimatedDays, supplierName. Price is static per tier.

---

## What the Dynamic System Needs to Do

1. **Per-supplier cost modeling**
   - Each supplier has different COGS (PrintKK: $7.31, US suppliers: ~$20, EU suppliers: ~$25-30, etc.)
   - Shipping cost varies by supplier location → customer location
   - Some suppliers charge setup fees, MOQ premiums, etc.

2. **Margin-based pricing**
   - Define target margin per tier or per region (e.g., 60% margin on Standard, 50% on Express)
   - Floor price (never sell below $X regardless of COGS)
   - Ceiling price (don't exceed $X or customers bounce)

3. **Currency handling**
   - Customers in EU see EUR, Brazil sees BRL, Japan sees JPY, etc.
   - Exchange rate source + update frequency
   - Shopify multi-currency support integration

4. **Market-specific pricing**
   - Purchasing power parity adjustments? (optional but worth discussing)
   - Same product, different price in Brazil vs Germany vs USA?
   - Or uniform USD pricing everywhere?

5. **Customer-facing display**
   - FulfillmentSelector shows real calculated prices per option
   - Price breakdown: product + shipping (or all-in?)
   - Compare multiple options side by side

---

## Data We're Waiting On

Supplier outreach emails were sent May 1, 2026 to 13+ suppliers. Need back from each:
- Per-unit cost at 1, 10, 50, 100 units
- Shipping cost to local customers
- Production lead time
- Whether they can do the finished product (cut-and-sew hood cover, not just fabric)

**Known costs so far:**
| Supplier | Location | COGS/unit | Shipping to customer | Status |
|----------|----------|-----------|---------------------|--------|
| PrintKK | China | $7.31 | Included (15-25 days) | Active |
| Oracle Trading | Toronto, CA | ~$20 (est) | Local pickup or ~$10 | Outreach sent |
| AGAS Mfg | Philadelphia, PA | ~$20 (est) | ~$8-15 to US | Outreach sent |
| CBS Distributors | Warminster, PA | ~$20 (est) | Ships from stock 1-5 days | Outreach sent |
| Contrado | London, UK | ~$30 (est) | 3-7 days UK/EU | Outreach sent |
| CTNBee | Poland → EU | ? | 1-3 days EU via FedEx | Outreach sent |
| Muzefab | Latvia → EU/US | ? | 1-3 days EU via FedEx | Outreach sent |
| Creative Textile | Portugal | ? | ? | Outreach sent |
| RealFabric | South Korea | ? | ? | Outreach sent |
| DTF Ghana | Accra, Ghana | ? | Free local delivery | Outreach sent |
| Kalmaz | Morocco | ? | ? | Outreach sent |

All "est" values are unconfirmed. Real quotes will replace them.

---

## Key Files to Read

| File | What's in it |
|------|-------------|
| `C:\Dev\hooddshop\lib\suppliers\pricing.ts` | Current static pricing logic |
| `C:\Dev\hooddshop\lib\suppliers\types.ts` | Supplier and FulfillmentOption types |
| `C:\Dev\hooddshop\lib\suppliers\router.ts` | Weighted scoring router |
| `C:\Dev\hooddshop\lib\suppliers\constants.ts` | Tier definitions, weights |
| `C:\Dev\hooddshop\lib\data\suppliers.json` | All 17 suppliers with data |
| `C:\Dev\hooddshop\SUPPLIER-ENGINE-BUILD-SPEC.md` | Original engine spec |
| `C:\Dev\hooddshop\GLOBAL-SUPPLIER-MATRIX.md` | In-country supplier research |
| `C:\Dev\hooddshop\SUPPLIER-OPS-PLAYBOOK.md` | Ops playbook (US/CA focused) |
| `C:\Dev\hooddshop\components\product\FulfillmentSelector.tsx` | Customer-facing UI |
| `C:\Dev\hooddshop\app\api\suppliers\options\route.ts` | Edge API endpoint |

---

## Decisions Dan Needs to Make (ask these when starting)

1. **Uniform vs. market-adjusted pricing?** Same price globally or adjusted per market?
2. **All-in pricing or product + shipping?** Does $49.99 include shipping, or is it $39.99 + $10 shipping?
3. **Target margins per tier?** What % margin is acceptable for Standard vs Express?
4. **Floor/ceiling prices?** What's the minimum and maximum you'd sell a hood cover for?
5. **Multi-currency?** Show local currency or USD only?
6. **Volume discounts?** Buy 2+ hood covers, get a discount? (World Cup fans may buy multiple nations)

---

## Recommended Approach

### Phase 1: Cost-based pricing (build now, populate when data arrives)
- Add `cogs`, `shippingCostDomestic`, `shippingCostInternational` fields to supplier type
- Pricing function: `price = (cogs + shipping) / (1 - targetMargin)`
- Update FulfillmentSelector to show calculated prices
- Hardcode current known costs, update as quotes come in

### Phase 2: Market adjustments (post-launch)
- Currency conversion layer
- Regional pricing tiers
- Purchasing power adjustments

### Phase 3: Optimization (with sales data)
- A/B test price points
- Demand-based pricing
- Seasonal adjustments (World Cup group stage vs. knockout)

---

*Start with Phase 1 once supplier cost data starts coming back. The code structure can be built now with placeholder values.*
