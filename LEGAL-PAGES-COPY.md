# Hood'd Shop — Legal Page Copy (Privacy, Terms, Returns)

**Status:** Draft v0.1 — requires legal counsel review before publishing
**Date:** 2026-04-15
**Routes:** `/privacy`, `/terms`, `/returns`
**Important:** This is drafted copy for CEO review. A Canadian attorney should review before these go live, particularly the privacy policy (PIPEDA compliance) and the terms re: IP disclaimers. This can be bundled with the collab agreement legal review.

---

## Page 1: Privacy Policy (`/privacy`)

**Last updated:** April 15, 2026

Hood'd ("we," "us," or "our") operates hooddshop.com. This Privacy Policy explains what information we collect, how we use it, and your choices.

### What We Collect

When you place an order, we collect the information needed to fulfill it: your name, email address, shipping address, and phone number (if provided). Payment information (credit card numbers, billing details) is processed directly by Shopify and our payment processors — we never see or store your full payment card data.

When you browse our site, we automatically collect standard web analytics data: pages visited, time on site, referring URL, browser type, device type, and IP address. We use this to understand traffic patterns and improve the shopping experience.

If you subscribe to email updates, we collect your email address.

### How We Use It

We use your information to fulfill and ship orders, send order confirmations and shipping notifications, respond to customer service requests, send marketing emails (only if you opted in — you can unsubscribe at any time), and improve our website and product offerings.

We do not sell, rent, or trade your personal information to third parties for their marketing purposes.

### Who We Share It With

We share information only as necessary to operate the business. Our print-on-demand fulfillment partner receives your shipping address and order details to manufacture and ship your product. Shopify processes your order and payment. Analytics providers (such as Google Analytics) receive anonymized browsing data. We may also disclose information if required by law or to protect our rights.

### Cookies

We use cookies for basic site functionality (cart contents, session management) and analytics. You can disable cookies in your browser settings, but some site features may not work properly.

### Data Retention

We retain order records for as long as needed for business operations, legal obligations, and dispute resolution (typically 7 years for financial records). You can request deletion of your account data by emailing contact@hooddshop.com.

### Your Rights

Depending on your jurisdiction, you may have the right to access, correct, or delete your personal information. Canadian residents have rights under the Personal Information Protection and Electronic Documents Act (PIPEDA). To exercise any rights, email contact@hooddshop.com with your request and we will respond within 30 days.

### Children

We do not knowingly collect personal information from anyone under 16. If you believe we have collected information from a child, contact us and we will delete it.

### Changes

We may update this policy from time to time. Changes will be posted on this page with an updated date. Continued use of the site after changes constitutes acceptance.

### Contact

For privacy questions: contact@hooddshop.com

---

## Page 2: Terms of Service (`/terms`)

**Last updated:** April 15, 2026

These Terms of Service ("Terms") govern your use of hooddshop.com and your purchases from Hood'd. By using our site or placing an order, you agree to these Terms.

### Products

Hood'd sells custom sublimation-printed stretch polyester-spandex car hood covers. All products are made to order through print-on-demand manufacturing. Product images on the site, including vehicle preview images, are for illustrative purposes and may not exactly represent the final product. Actual colors, fit, and appearance may vary due to monitor settings, printing processes, and vehicle differences.

Hood'd is not affiliated with, endorsed by, or sponsored by FIFA, any national football federation, or any kit manufacturer. All product designs are original compositions inspired by national team color palettes. National team names and color schemes are used for descriptive purposes only.

### Orders and Pricing

All prices are in USD unless otherwise stated. We reserve the right to change prices at any time without notice. Price changes do not affect orders already placed.

When you place an order, you are making an offer to purchase. We may accept or decline your order at our discretion. An order confirmation email does not constitute acceptance — acceptance occurs when your order enters production. If we cannot fulfill your order, we will notify you and issue a full refund.

### Payment

Payment is processed at the time of order through Shopify's secure checkout. We accept the payment methods displayed at checkout.

### Shipping and Delivery

Orders are manufactured on demand and typically ship within 5–10 business days of entering production. Delivery times vary by destination. Shipping estimates on the site are approximate and not guaranteed.

Risk of loss passes to you upon delivery to the carrier. We are not responsible for delays, damage, or loss caused by the carrier after handoff. If your package is lost or damaged in transit, contact us and we will work with the carrier to resolve the issue.

### Limited-Edition Drops

Certain products are sold as limited-edition drops with hard inventory caps. Drop items are marked as final sale at the time of purchase. Drop inventory is enforced at checkout — once sold out, the item is no longer available. We do not accept backorders or waitlists for drop items.

### Intellectual Property

All designs, graphics, text, and other content on hooddshop.com are owned by Hood'd or our licensed creators and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without written permission.

### Limitation of Liability

To the maximum extent permitted by law, Hood'd's total liability for any claim arising from your use of the site or purchase of products is limited to the amount you paid for the specific product at issue. We are not liable for indirect, incidental, consequential, or punitive damages.

### Governing Law

These Terms are governed by the laws of the Province of Ontario, Canada. Any disputes will be resolved in the courts of Toronto, Ontario, or through binding arbitration administered by the ADR Institute of Canada (ADRIC), at our election.

### Changes

We may update these Terms at any time. Changes take effect when posted. Continued use of the site constitutes acceptance of updated Terms.

### Contact

Questions about these Terms: contact@hooddshop.com

---

## Page 3: Return & Refund Policy (`/returns`)

**Last updated:** April 15, 2026

### Made-to-Order Products

All Hood'd products are custom manufactured on demand. Because each cover is printed specifically for your order, we cannot accept returns for buyer's remorse, incorrect nation selection, or change of mind.

### When We Do Issue Refunds

We will issue a full refund or replacement if your product arrives with a manufacturing defect (misprinted, wrong design, significant color deviation from the product listing), your product arrives physically damaged (torn, holes, defective elastic), or you receive the wrong item.

To request a refund for any of the above, email contact@hooddshop.com within 14 days of delivery with your order number and photos of the issue. We will respond within 2 business days.

### Cancellation Window

You may cancel your order for a full refund if the order has not yet entered production. Orders typically enter production within 2 hours of payment for standard catalog items. Once in production, cancellation is not possible.

For limited-edition drop items, orders enter production immediately upon payment. Drop orders cannot be canceled.

### Refund Method

Refunds are issued to the original payment method. Processing time depends on your payment provider but is typically 5–10 business days after we approve the refund.

### Exchanges

We do not offer direct exchanges. If you received a defective product, we will ship a replacement at no cost. For all other cases, you would need to place a new order.

### Shipping Costs

If a refund is issued due to our error (defect, wrong item, damage), we cover return shipping. We do not reimburse original shipping costs unless the entire order is defective.

### Contact

Return and refund questions: contact@hooddshop.com

---

## Implementation Notes for Web Cowork

1. **Routes:** Create `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/returns/page.tsx`
2. **Layout:** Use the same layout as the About page (centered content, max-width, dark theme). Prose styling: `text-body-md`, `color: var(--color-text-muted)`, generous `leading-relaxed`.
3. **Footer links:** Add Privacy Policy, Terms of Service, and Return Policy links to the Footer "Info" column.
4. **Metadata:** Each page needs proper `<title>` and `<meta description>` for SEO.
5. **Last updated date:** Render from a constant so it's easy to update.
6. **No interactivity required.** These are static content pages.

### Footer Update

Add to the Info column in `components/layout/Footer.tsx`:

```tsx
{ label: "Privacy Policy", href: "/privacy" },
{ label: "Terms of Service", href: "/terms" },
{ label: "Return Policy", href: "/returns" },
```

### SEO Metadata Examples

```tsx
// app/privacy/page.tsx
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Hood'd privacy policy — how we collect, use, and protect your information.",
};

// app/terms/page.tsx
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Hood'd terms of service for hooddshop.com purchases and site usage.",
};

// app/returns/page.tsx
export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description: "Hood'd return and refund policy for made-to-order car hood covers.",
};
```
