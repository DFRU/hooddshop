import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Hood'd return and refund policy for made-to-order car hood covers.",
};

const LAST_UPDATED = "April 15, 2026";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-display-lg text-white">Return &amp; Refund Policy</h1>
        <p className="text-body-sm mt-2 mb-10" style={{ color: "#555" }}>
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-8 text-body-md leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          <section>
            <h2 className="text-display-sm text-white mb-3">
              Made-to-Order Products
            </h2>
            <p>
              All Hood&apos;d products are custom manufactured on demand. Because
              each cover is printed specifically for your order, we cannot accept
              returns for buyer&apos;s remorse, incorrect nation selection, or
              change of mind.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              When We Do Issue Refunds
            </h2>
            <p>
              We will issue a full refund or replacement if your product arrives
              with a manufacturing defect (misprinted, wrong design, significant
              color deviation from the product listing), your product arrives
              physically damaged (torn, holes, defective elastic), or you receive
              the wrong item.
            </p>
            <p className="mt-3">
              To request a refund for any of the above, email
              contact@hooddshop.com within 14 days of delivery with your order
              number and photos of the issue. We will respond within 2 business
              days.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">
              Cancellation Window
            </h2>
            <p>
              You may cancel your order for a full refund if the order has not
              yet entered production. Orders typically enter production within 2
              hours of payment for standard catalog items. Once in production,
              cancellation is not possible.
            </p>
            <p className="mt-3">
              For limited-edition drop items, orders enter production immediately
              upon payment. Drop orders cannot be canceled.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Refund Method</h2>
            <p>
              Refunds are issued to the original payment method. Processing time
              depends on your payment provider but is typically 5–10 business
              days after we approve the refund.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Exchanges</h2>
            <p>
              We do not offer direct exchanges. If you received a defective
              product, we will ship a replacement at no cost. For all other
              cases, you would need to place a new order.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Shipping Costs</h2>
            <p>
              If a refund is issued due to our error (defect, wrong item,
              damage), we cover return shipping. We do not reimburse original
              shipping costs unless the entire order is defective.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Contact</h2>
            <p>
              Return and refund questions:{" "}
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
