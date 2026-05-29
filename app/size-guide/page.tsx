import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "Hood'd size guide — Standard and XL. Universal fit for sedans, SUVs, and trucks. Elastic edge stretches 15–25% to adapt to your hood.",
  alternates: { canonical: "https://hooddshop.com/size-guide" },
};

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-display-lg text-white">Size Guide</h1>
        <p className="text-body-sm mt-2 mb-10" style={{ color: "#555" }}>
          Two sizes. Universal fit. Elastic edge adapts.
        </p>

        <div className="space-y-8 text-body-md leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          <section
            className="rounded-lg p-5"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-widest"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                Standard
              </span>
              <span className="text-white font-semibold">63&quot; &times; 47&quot; (160 &times; 120 cm)</span>
              <span className="ml-auto text-body-sm" style={{ color: "var(--color-accent)" }}>From $44.99 USD</span>
            </div>
            <p>
              Fits most sedans, compact SUVs, and coupes.
            </p>
            <p className="mt-2 text-body-sm">
              Examples: Honda Civic, Toyota Camry, Hyundai Elantra, Mazda CX-5, Ford Escape, Honda CR-V, Subaru Forester, smaller crossovers.
            </p>
          </section>

          <section
            className="rounded-lg p-5"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-widest"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                XL
              </span>
              <span className="text-white font-semibold">68&quot; &times; 55&quot; (172 &times; 140 cm)</span>
              <span className="ml-auto text-body-sm" style={{ color: "var(--color-accent)" }}>From $54.99 USD</span>
            </div>
            <p>
              Fits trucks, full-size SUVs, and larger sedans.
            </p>
            <p className="mt-2 text-body-sm">
              Examples: Ford F-150, Chevy Silverado, Toyota Tundra, Suburban, Tahoe, Expedition, Dodge Charger.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Between sizes?</h2>
            <p>
              Choose the larger size. The elastic edge can cinch a looser cover; an undersized cover cannot be stretched to fit.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Unsure?</h2>
            <p>
              DM us a side photo of your hood at{" "}
              <a href="https://www.instagram.com/hooddshopnow" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-accent)" }}>
                @hooddshopnow
              </a>{" "}
              or email{" "}
              <a href="mailto:contact@hooddshop.com" className="underline" style={{ color: "var(--color-accent)" }}>
                contact@hooddshop.com
              </a>
              . We'll confirm fit before you order.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">How the elastic works</h2>
            <p>
              The 15–25% stretch tolerance lets the same cover adapt to a wide range of hood shapes. The elastic edge wraps over the front lip and sides of the hood; built-in clips hold the front corners. Two additional fastener straps with hooks provide extra hold for outdoor display.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
