import Link from "next/link";
import { DESIGN_LINES, DESIGN_CSS_CLASS } from "@/lib/design";

export default function DesignLines() {
  // Only Jersey Line is live — others show "Coming Soon"
  const LIVE_LINE = "Jersey";

  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="text-center mb-8 lg:mb-14">
          <span className="text-label" style={{ color: "var(--color-accent)" }}>Collections</span>
          <h2 className="text-display-lg text-white mt-1">Design Lines</h2>
          <p className="text-body-sm mt-3 max-w-xl mx-auto" style={{ color: "#888" }}>
            Jersey Line is live now. More designs dropping before kickoff.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {DESIGN_LINES.map((d) => {
            const isLive = d === LIVE_LINE;
            return isLive ? (
              <Link
                key={d}
                href="/shop"
                className="group relative overflow-hidden rounded-lg text-left touch-active"
                style={{ aspectRatio: "4/3", border: "1px solid #181818" }}
              >
                <div className={`absolute inset-0 ${DESIGN_CSS_CLASS[d]} opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-5">
                  <div className="text-xl lg:text-4xl text-white tracking-wide" style={{ fontFamily: "var(--font-display)" }}>{d}</div>
                  <div className="text-[9px] lg:text-[11px] uppercase tracking-[0.12em] mt-0.5 text-white/60 transition-colors">
                    Shop Now →
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={d}
                className="relative overflow-hidden rounded-lg text-left"
                style={{ aspectRatio: "4/3", border: "1px solid #181818", opacity: 0.45 }}
              >
                <div className={`absolute inset-0 ${DESIGN_CSS_CLASS[d]} opacity-30`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-5">
                  <div className="text-xl lg:text-4xl text-white tracking-wide" style={{ fontFamily: "var(--font-display)" }}>{d}</div>
                  <div className="text-[9px] lg:text-[11px] uppercase tracking-[0.12em] mt-0.5 text-white/30">
                    Coming Soon
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
