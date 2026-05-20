import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Hood'd FAQ — sizing, install, materials, shipping, returns, and brand independence. Stretch-fit car hood covers for 48 nations.",
  alternates: { canonical: "https://hooddshop.com/faq" },
};

interface QA { q: string; a: string }
interface Section { heading: string; items: QA[] }

const SECTIONS: Section[] = [
  {
    heading: "The product",
    items: [
      { q: "What is a Hood'd cover?", a: "A stretch-fit sleeve that goes over your car's hood. Soft fabric — not a magnet, not a decal, not paint. You pull it on, the elastic edge holds it in place." },
      { q: "What's it made of?", a: "85–90% polyester, 10–15% spandex. Full-bleed sublimation print. Elastic bands and clips are sewn into the edges." },
      { q: "What sizes are available?", a: "Standard: 63\" × 47\" (160 × 120 cm) — fits most sedans, compact SUVs, and coupes. XL: 68\" × 55\" (172 × 140 cm) — fits trucks, full-size SUVs, and larger sedans." },
      { q: "Will it fit my car?", a: "Universal fit — sedans, SUVs, trucks. The elastic edge stretches 15–25% to adapt to your hood. If your hood is narrower than 36\" or has unusual geometry (older muscle cars, hood scoops, hood-mounted accessories), DM us a side photo at @hooddshopnow before ordering and we'll confirm fit." },
      { q: "How long does it take to put on?", a: "30 seconds. No tools. No tape. No paint contact." },
      { q: "Can I drive with it on?", a: "No. It's a stationary-display product. Take it off before you drive. Wind abrasion at speed is the only thing that can damage your paint — used as intended, the cover is paint-safe." },
      { q: "Is it waterproof?", a: "Water-resistant. Light rain is fine. Don't submerge it. Don't leave it on through a thunderstorm." },
      { q: "Will it damage my paint?", a: "Used as intended — stationary, on a clean hood — no. Driven at speed — yes (wind abrasion). The cover itself is soft. Grit between the cover and the paint is what causes micro-scratches, so install on a clean, cool hood." },
      { q: "How do I wash it?", a: "Machine wash cold, gentle cycle. Hang dry. Do not iron the print. Do not bleach. Store flat or loosely folded. Sublimation ink is permanent — will not crack, peel, or fade." },
    ],
  },
  {
    heading: "Designs",
    items: [
      { q: "What designs are available?", a: "48 nations. Each nation has 5 designs: Home, Away, Flag, Full, and Jersey-inspired." },
      { q: "Are these official jerseys?", a: "No. We're independent — not licensed by FIFA, any national federation, or any kit manufacturer. All designs are original, inspired by national flag color palettes. National team names are used for descriptive purposes only." },
      { q: "Can I customize a design?", a: "Not at launch. Custom designs and personalization are on the roadmap." },
      { q: "Are the designs made by AI?", a: "Designs are created through a human-directed process that uses generative imagery tools as one step in the workflow. Every design is reviewed, edited, and approved before it is printed. The vehicle preview images on the site are AI-generated for illustration only and may not exactly represent the final product." },
      { q: "My nation isn't here. Will you add it?", a: "The 48 nations on the site are the 2026 World Cup qualifiers. Drop your nation in our DMs — every request we get is logged for future drops." },
    ],
  },
  {
    heading: "Orders & shipping",
    items: [
      { q: "How long does it take?", a: "Made to order. Production: 5–10 business days. Shipping time depends on your country." },
      { q: "How much is shipping?", a: "Free with code HOODDSHIP at checkout. Worldwide." },
      { q: "Where do you ship?", a: "Worldwide." },
      { q: "Can I cancel?", a: "Yes, if production hasn't started. Orders typically enter production within 2 hours of payment. After that, cancellation isn't possible." },
      { q: "Can I return it?", a: "Made-to-order means no returns for buyer's remorse or wrong-nation selection. We do issue refunds or replacements for defects, damage, or wrong items — email contact@hooddshop.com within 14 days of delivery with your order number and photos." },
      { q: "How do I track my order?", a: "You'll receive an email with a tracking link when your order ships. If you don't see it, check spam, then email us." },
    ],
  },
  {
    heading: "About us",
    items: [
      { q: "Are you guys official?", a: "No. We're independent. We make original designs inspired by national colors. Not licensed by FIFA, federations, or kit makers. That's the whole point — we can ship 48 nations in one season because we're not waiting on a license." },
      { q: "Where are you based?", a: "Independent brand. Print fulfillment is global — your cover ships from the facility nearest your delivery address." },
      { q: "How do I reach you?", a: "Email: contact@hooddshop.com. Instagram: @hooddshopnow. TikTok: @hooddshopnow." },
    ],
  },
];

export default function FaqPage() {
  // JSON-LD FAQPage schema for rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((s) =>
      s.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen pt-20 pb-16 px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-display-lg text-white">FAQ</h1>
          <p className="text-body-sm mt-2 mb-10" style={{ color: "#555" }}>
            Stretch hood covers for 48 nations. Free shipping with code HOODDSHIP.
          </p>

          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.heading}>
                <h2 className="text-display-sm text-white mb-4">{section.heading}</h2>
                <div className="space-y-5">
                  {section.items.map((it) => (
                    <details key={it.q} className="group" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <summary className="flex items-center justify-between py-3 cursor-pointer text-body-md text-white min-h-[44px] list-none">
                        {it.q}
                        <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{ color: "var(--color-text-muted)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </summary>
                      <p className="pb-4 text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                        {it.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12 pt-8" style={{ borderTop: "1px solid var(--color-border)" }}>
            <h2 className="text-display-sm text-white mb-3">Still have a question?</h2>
            <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
              Email <a href="mailto:contact@hooddshop.com" className="underline" style={{ color: "var(--color-accent)" }}>contact@hooddshop.com</a> — we respond within 2 business days.
              {" "}Or DM us on Instagram or TikTok at{" "}
              <a href="https://www.instagram.com/hooddshopnow" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-accent)" }}>@hooddshopnow</a>.
            </p>
            <p className="text-body-sm mt-4">
              <Link href="/shop" className="underline" style={{ color: "var(--color-accent)" }}>
                Browse the catalog →
              </Link>
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
