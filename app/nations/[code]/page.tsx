"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getNation } from "@/lib/nations";
import { DESIGN_LINES, DESIGN_CSS_CLASS, flagUrl, type DesignLine } from "@/lib/design";
import MadeInUSA from "@/components/ui/MadeInUSA";

export default function NationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const nation = getNation(code);
  const initialDesign = searchParams.get("design") as DesignLine | null;

  const [selectedDesign, setSelectedDesign] = useState<DesignLine>(
    initialDesign && DESIGN_LINES.includes(initialDesign) ? initialDesign : "Heritage"
  );
  const [added, setAdded] = useState(false);

  if (!nation) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center">
        <p className="text-body-md" style={{ color: "#888" }}>Nation not found</p>
      </div>
    );
  }

  const handleAdd = () => {
    // TODO: Wire to Shopify addItem when products are live
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="min-h-screen pt-14 pb-24 lg:pb-8">
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] py-5 lg:py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-5 touch-active transition-colors"
          style={{ color: "#888", minHeight: "44px" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Image */}
          <div className="space-y-3">
            <div
              className={`relative overflow-hidden rounded-lg -mx-[var(--container-px)] lg:mx-0 ${DESIGN_CSS_CLASS[selectedDesign]}`}
              style={{ aspectRatio: "4/3", border: "1px solid #1A1A1A" }}
            >
              <img
                src={flagUrl(code, 320)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="text-5xl">{nation.emoji}</span>
              </div>
              <div
                className="absolute top-3 right-3 px-3 py-1.5 bg-black/50 rounded-full text-[10px] text-white/70 uppercase tracking-[0.1em]"
                style={{ backdropFilter: "blur(8px)" }}
              >
                {selectedDesign}
              </div>
            </div>

            {/* Design selector */}
            <div className="grid grid-cols-6 gap-2">
              {DESIGN_LINES.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDesign(d)}
                  className={`relative overflow-hidden rounded touch-active ${DESIGN_CSS_CLASS[d]}`}
                  style={{
                    aspectRatio: "1",
                    border: selectedDesign === d ? "2px solid var(--color-accent)" : "2px solid #1A1A1A",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold uppercase tracking-wider">
                      {d.slice(0, 4)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 lg:space-y-7">
            <div>
              <span className="text-label" style={{ color: "var(--color-accent)" }}>{selectedDesign} Collection</span>
              <h1 className="text-display-lg text-white mt-1">{nation.name}</h1>
              <p className="text-body-sm mt-0.5" style={{ color: "#888" }}>Car Hood Cover</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-display-md text-white">$49.99</span>
              <MadeInUSA />
            </div>

            <p className="text-body-sm leading-relaxed" style={{ color: "#888" }}>
              Premium stretch-fit cover featuring the {nation.name} {selectedDesign.toLowerCase()} design.
              Custom sublimation-printed on durable polyester spandex. Universal fit for all vehicles.
              Made to order — ships in 5–7 business days.
            </p>

            {/* Desktop add to cart */}
            <button
              onClick={handleAdd}
              className={`hidden lg:flex items-center justify-center w-full font-semibold text-[13px] uppercase tracking-[0.08em] rounded transition-all ${
                added ? "bg-green-600 text-white" : "text-white"
              }`}
              style={!added ? { background: "var(--color-accent)", minHeight: "52px" } : { minHeight: "52px" }}
            >
              {added ? "✓ Added to Cart" : "Add to Cart — $49.99"}
            </button>

            {/* Specs */}
            <div style={{ borderTop: "1px solid #1A1A1A" }}>
              {[
                { t: "Material", c: "Polyester spandex, elastic edges" },
                { t: "Fit", c: "Universal — cars, SUVs, trucks, vans" },
                { t: "Print", c: "Full sublimation, edge-to-edge" },
                { t: "Care", c: "Machine washable, air dry" },
                { t: "Shipping", c: "5–7 business days" },
              ].map((s) => (
                <div
                  key={s.t}
                  className="flex items-start justify-between py-3 lg:py-4"
                  style={{ borderBottom: "1px solid #141414" }}
                >
                  <span className="text-white text-sm font-medium">{s.t}</span>
                  <span className="text-sm text-right" style={{ color: "#888", maxWidth: "55%" }}>{s.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY ADD-TO-CART BAR */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid #1F1F1F",
        }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{nation.name} — {selectedDesign}</div>
            <div className="text-lg text-white" style={{ fontFamily: "var(--font-display)" }}>$49.99</div>
          </div>
          <button
            onClick={handleAdd}
            className={`px-6 py-3.5 font-semibold text-[12px] uppercase tracking-[0.08em] rounded transition-all touch-active flex-shrink-0 ${
              added ? "bg-green-600 text-white" : "text-white"
            }`}
            style={!added ? { background: "var(--color-accent)", minHeight: "48px" } : { minHeight: "48px" }}
          >
            {added ? "✓ Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
