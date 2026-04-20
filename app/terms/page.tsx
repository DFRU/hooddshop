import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Hood'd",
  description:
    "Hood'd terms of service for hooddshop.com purchases and site usage.",
};

const LAST_UPDATED = "April 15, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-display-lg text-white">Terms of Service</h1>
        <p className="text-body-sm mt-2 mb-10" style={{ color: "#555" }}>
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-8 text-body-md leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of
            hooddshop.com and your purchases from Hood&apos;d. By using our site
            or placing an order, you agree to these Terms.
          </p>

          <section>
            <h2 className="text-display-sm text-white mb-3">Products</h2>
            <p>
              Hood&apos;d sells custom sublimation-printed stretch
              polyester-spandex car hood covers. All products are made to order
              through print-on-demand manufacturing. Product images on the site,
              including vehicle preview images, are for illustrative purposes and
              may not exactly represent the final product. Actual colors, fit,
              and appearance may vary due to monitor settings, printing
              processes, and vehicle differences.
            </p>
            <p className="mt-3">
              Hood&apos;d is not affiliated with, endorsed by, or sponsored by
              FIFA, any national football federation, or any kit manufacturer.
              All product designs are original compositions inspired by national
              team color palettes. National team names and color schemes are used
              for descriptive purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Orders and Pricing
            </h2>
            <p>
              Prices are displayed in your local currency where supported. We
              reserve the right to change prices at any time without notice.
              Price changes do not affect orders already placed.
            </p>
            <p className="mt-3">
              When you place an order, you are making an offer to purchase. We
              may accept or decline your order at our discretion. An order
              confirmation email does not constitute acceptance — acceptance
              occurs when your order enters production. If we cannot fulfill your
              order, we will notify you and issue a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Payment</h2>
            <p>
              Payment is processed at the time of order through Shopify&apos;s
              secure checkout. We accept the payment methods displayed at
              checkout.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Shipping and Delivery
            </h2>
            <p>
              Orders are manufactured on demand and typically ship within 5–10
              business days of entering production. Delivery times vary by
              destination. Shipping estimates on the site are approximate and not
              guaranteed.
            </p>
            <p className="mt-3">
              Risk of loss passes to you upon delivery to the carrier. We are not
              responsible for delays, damage, or loss caused by the carrier after
              handoff. If your package is lost or damaged in transit, contact us
              and we will work with the carrier to resolve the issue.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Limited-Edition Drops
            </h2>
            <p>
              Certain products are sold as limited-edition drops with hard
              inventory caps. Drop items are marked as final sale at the time of
              purchase. Drop inventory is enforced at checkout — once sold out,
              the item is no longer available. We do not accept backorders or
              waitlists for drop items.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Intellectual Property
            </h2>
            <p>
              All designs, graphics, text, and other content on hooddshop.com are
              owned by Hood&apos;d or our licensed creators and are protected by
              applicable intellectual property laws. You may not reproduce,
              distribute, or create derivative works from our content without
              written permission.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Hood&apos;d&apos;s total
              liability for any claim arising from your use of the site or
              purchase of products is limited to the amount you paid for the
              specific product at issue. We are not liable for indirect,
              incidental, consequential, or punitive damages.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Province of Ontario,
              Canada. Any disputes will be resolved in the courts of Toronto,
              Ontario, or through binding arbitration administered by the ADR
              Institute of Canada (ADRIC), at our election.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Changes</h2>
            <p>
              We may update these Terms at any time. Changes take effect when
              posted. Continued use of the site constitutes acceptance of updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <a
                href="mailto:contact@hooddshop.com"
                style={{ color: "var(--color-accent)" }}
              >
                contact@hooddshop.com
              </a>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
