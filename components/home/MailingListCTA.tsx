"use client";

import EmailCapture from "./EmailCapture";

export default function MailingListCTA() {
  return (
    <section className="py-6 lg:py-8" style={{ background: "#0A0A0A" }}>
      <div className="max-w-2xl mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] text-center">
        <h2 className="text-display-sm text-white">
          FREE COVERS · FLASH SALES · <span style={{ color: "var(--color-accent)" }}>LIMITED DROPS</span>
        </h2>
        <p className="text-body-sm mt-2" style={{ color: "#666" }}>
          Weekly prizes, exclusive discounts, and first access to new designs.
        </p>
        <div className="mt-4">
          <EmailCapture
            headline=""
            description=""
            source="mailing-list"
            buttonText="I'm In"
            compact
          />
        </div>
      </div>
    </section>
  );
}
