import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Hood'd",
  description:
    "Hood'd privacy policy — how we collect, use, and protect your information.",
};

const LAST_UPDATED = "April 15, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-display-lg text-white">Privacy Policy</h1>
        <p className="text-body-sm mt-2 mb-10" style={{ color: "#555" }}>
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-8 text-body-md leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          <p>
            Hood'd ("we," "us," or "our") operates hooddshop.com. This Privacy
            Policy explains what information we collect, how we use it, and your
            choices.
          </p>

          <section>
            <h2 className="text-display-sm text-white mb-3">What We Collect</h2>
            <p>
              When you place an order, we collect the information needed to
              fulfill it: your name, email address, shipping address, and phone
              number (if provided). Payment information (credit card numbers,
              billing details) is processed directly by Shopify and our payment
              processors — we never see or store your full payment card data.
            </p>
            <p className="mt-3">
              When you browse our site, we automatically collect standard web
              analytics data: pages visited, time on site, referring URL, browser
              type, device type, and IP address. We use this to understand
              traffic patterns and improve the shopping experience.
            </p>
            <p className="mt-3">
              If you subscribe to email updates, we collect your email address.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">How We Use It</h2>
            <p>
              We use your information to fulfill and ship orders, send order
              confirmations and shipping notifications, respond to customer
              service requests, send marketing emails (only if you opted in — you
              can unsubscribe at any time), and improve our website and product
              offerings.
            </p>
            <p className="mt-3">
              We do not sell, rent, or trade your personal information to third
              parties for their marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Who We Share It With
            </h2>
            <p>
              We share information only as necessary to operate the business. Our
              print-on-demand fulfillment partner receives your shipping address
              and order details to manufacture and ship your product. Shopify
              processes your order and payment. Analytics providers (such as
              Google Analytics) receive anonymized browsing data. We may also
              disclose information if required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Cookies</h2>
            <p>
              We use cookies for basic site functionality (cart contents, session
              management) and analytics. You can disable cookies in your browser
              settings, but some site features may not work properly.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Data Retention</h2>
            <p>
              We retain order records for as long as needed for business
              operations, legal obligations, and dispute resolution (typically 7
              years for financial records). You can request deletion of your
              account data by emailing contact@hooddshop.com.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access,
              correct, or delete your personal information. Canadian residents
              have rights under the Personal Information Protection and
              Electronic Documents Act (PIPEDA). To exercise any rights, email
              contact@hooddshop.com with your request and we will respond within
              30 days.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Children</h2>
            <p>
              We do not knowingly collect personal information from anyone under
              16. If you believe we have collected information from a child,
              contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Changes</h2>
            <p>
              We may update this policy from time to time. Changes will be posted
              on this page with an updated date. Continued use of the site after
              changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Contact</h2>
            <p>
              For privacy questions:{" "}
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
