import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Hood'd — email, Instagram, TikTok. Order issues, wholesale, press. We respond within 2 business days.",
  alternates: { canonical: "https://hooddshop.com/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
      <article className="max-w-2xl mx-auto">
        <h1 className="text-display-lg text-white">Contact</h1>
        <p className="text-body-sm mt-2 mb-10" style={{ color: "#555" }}>
          We respond within 2 business days.
        </p>

        <div className="space-y-8 text-body-md leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          <section>
            <h2 className="text-display-sm text-white mb-3">Email</h2>
            <p>
              <a href="mailto:contact@hooddshop.com" className="underline" style={{ color: "var(--color-accent)" }}>
                contact@hooddshop.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Social</h2>
            <p>
              Instagram:{" "}
              <a href="https://www.instagram.com/hooddshopnow" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-accent)" }}>
                @hooddshopnow
              </a>
            </p>
            <p className="mt-2">
              TikTok:{" "}
              <a href="https://www.tiktok.com/@hooddshopnow" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-accent)" }}>
                @hooddshopnow
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Order issues</h2>
            <p>
              Include your order number and one photo if relevant. Reply to your order confirmation email or write to{" "}
              <a href="mailto:contact@hooddshop.com" className="underline" style={{ color: "var(--color-accent)" }}>
                contact@hooddshop.com
              </a>{" "}
              directly. See{" "}
              <a href="/returns" className="underline" style={{ color: "var(--color-accent)" }}>
                Return Policy
              </a>{" "}
              for defects, damage, or wrong items.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Wholesale & collab</h2>
            <p>
              Email{" "}
              <a href="mailto:contact@hooddshop.com" className="underline" style={{ color: "var(--color-accent)" }}>
                contact@hooddshop.com
              </a>{" "}
              with subject "Wholesale" or "Collab". We respond within 5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-display-sm text-white mb-3">Press</h2>
            <p>
              Email{" "}
              <a href="mailto:contact@hooddshop.com" className="underline" style={{ color: "var(--color-accent)" }}>
                contact@hooddshop.com
              </a>{" "}
              with subject "Press".
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
