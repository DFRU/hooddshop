"use client";

import EmailCapture from "./EmailCapture";

export default function MailingListCTA() {
  return (
    <section className="py-6 lg:py-8" style={{ background: "#0A0A0A" }}>
      <div className="max-w-2xl mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] text-center">
        <h2 className="text-display-sm text-white">
          WEEKLY DRAW · NATION DROPS · <span style={{ color: "var(--color-accent)" }}>FREE SHIPPING CODES</span>
        </h2>
        <p className="text-body-sm mt-2" style={{ color: "#666" }}>
          Free hood cover every Sunday. First access to new designs. 1–2 emails a week.
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
