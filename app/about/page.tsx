import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Hood'd — World Cup 2026 Car Hood Covers",
  description: "The story behind Hood'd — premium car hood covers for World Cup 2026.",
  alternates: {
    canonical: "https://hooddshop.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100svh-56px)] flex items-center px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
      <div className="max-w-[var(--max-width)] mx-auto w-full flex flex-col lg:flex-row gap-12 py-16">
        {/* Brand statement */}
        <div className="lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-display-xl text-white">HOOD&apos;D</h1>
          <p className="text-body-lg mt-6 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            World Cup 2026 is coming to North America — and we believe every fan
            deserves to rep their nation on the road.
          </p>
          <p className="text-body-md mt-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Hood&apos;d makes premium stretch-fit car hood covers with full-bleed
            sublimation prints. Each cover is made to order using durable
            polyester spandex with elastic sewn-in edges for a universal fit
            on cars, SUVs, and trucks. Elastic bands with built-in clips
            stretch and secure the cover over the hood for a snug, clean fit.
          </p>
          <p className="text-body-md mt-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            48 nations. One mission — let the world see who you ride for.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/shop"
              className="flex items-center justify-center w-full sm:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all touch-active"
              style={{ background: "var(--color-accent)", minHeight: "52px" }}
            >
              Shop Now
            </Link>
            <Link
              href="/nations"
              className="flex items-center justify-center w-full sm:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors touch-active"
              style={{ border: "1px solid #333", minHeight: "52px" }}
            >
              Find Your Nation
            </Link>
          </div>
        </div>

        {/* Product highlights */}
        <div className="lg:w-1/2 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            {[
              { stat: "48", label: "Nations", desc: "Every World Cup 2026 qualifier" },
              { stat: "$49.99", label: "Per Cover", desc: "Made-to-order pricing" },
              { stat: "100%", label: "Sublimation", desc: "Edge-to-edge print that won\u2019t crack or peel" },
              { stat: "Universal", label: "Fit", desc: "Elastic edge stretches to fit any hood" },
            ].map((item) => (
              <div
                key={item.label}
                className="p-5 rounded-lg"
                style={{ background: "#111", border: "1px solid #1A1A1A" }}
              >
                <div className="text-display-sm text-white">{item.stat}</div>
                <div className="text-label mt-1" style={{ color: "var(--color-accent)" }}>{item.label}</div>
                <div className="text-body-sm mt-2" style={{ color: "#666" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
