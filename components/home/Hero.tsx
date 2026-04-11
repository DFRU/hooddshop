import Link from "next/link";
import { HOME_FEATURED_NATIONS, NATIONS } from "@/lib/nations";
import { DESIGN_LINES, DESIGN_GRADIENTS, flagUrl } from "@/lib/design";

export default function Hero() {
  return (
    <section className="relative flex items-end overflow-hidden" style={{ minHeight: "85vh" }}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0A0A0A, #0D0B09, #0A0A0A)" }} />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute top-[10%] right-0 w-[350px] h-[350px] lg:w-[600px] lg:h-[600px] rounded-full"
          style={{ background: "rgba(255,77,0,0.07)", filter: "blur(120px)" }}
        />
      </div>

      <div className="relative w-full max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-10 pt-16 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-end">
          <div className="space-y-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.2)" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
              <span className="text-label" style={{ color: "var(--color-accent)" }}>World Cup 2026</span>
            </div>

            <h1 className="text-display-xl text-white">
              YOUR RIDE.<br />
              <span style={{ color: "var(--color-accent)" }}>YOUR FLAG.</span>
            </h1>

            <p className="text-body-sm lg:text-body-md max-w-md leading-relaxed" style={{ color: "#888" }}>
              Premium stretch-fit car hood covers for World Cup 2026. 48 nations.
            </p>

            {/* CTAs — full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                href="/shop"
                className="flex items-center justify-center w-full sm:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all touch-active"
                style={{ background: "var(--color-accent)", minHeight: "52px" }}
              >
                Shop Now — $44.99
              </Link>
              <Link
                href="/nations"
                className="flex items-center justify-center w-full sm:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors touch-active"
                style={{ border: "1px solid #333", minHeight: "52px" }}
              >
                Find Your Nation
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-2">
              {[
                { v: "48", l: "Nations" },
                { v: "$44.99", l: "From" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-display-sm text-white">{s.v}</div>
                  <div className="text-label mt-0.5" style={{ color: "#555" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop card stack */}
          <div className="relative h-[480px] hidden lg:block">
            {HOME_FEATURED_NATIONS.slice(0, 5).map((code, i) => {
              const n = NATIONS.find((x) => x.code === code);
              if (!n) return null;
              const rot = [-8, -3, 1, 5, 9][i];
              const x = [0, 30, 55, 80, 100][i];
              const y = [10, 0, 15, 5, 25][i];
              const grad = DESIGN_GRADIENTS[DESIGN_LINES[i]];
              return (
                <div
                  key={code}
                  className={`absolute w-[260px] rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br ${grad}`}
                  style={{
                    transform: `rotate(${rot}deg)`,
                    left: `${x}px`,
                    top: `${y}px`,
                    zIndex: i,
                    aspectRatio: "3/4",
                    border: "1px solid #222",
                    opacity: 0.75,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <img src={flagUrl(code, 40)} className="w-7 h-auto mb-1.5 rounded shadow-md" alt="" />
                    <div className="text-display-sm text-white">{n.name}</div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-white/40 mt-0.5">{DESIGN_LINES[i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: swipeable nation cards */}
        <div className="lg:hidden mt-8 -mx-[var(--container-px)]">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory px-[var(--container-px)] pb-3">
            {HOME_FEATURED_NATIONS.map((code, i) => {
              const n = NATIONS.find((x) => x.code === code);
              if (!n) return null;
              const grad = DESIGN_GRADIENTS[DESIGN_LINES[i % 6]];
              return (
                <div key={code} className="flex-shrink-0 w-[140px] snap-start">
                  <div
                    className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${grad}`}
                    style={{ aspectRatio: "3/4", border: "1px solid #1E1E1E", opacity: 0.65 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-xl">{n.emoji}</span>
                      <div className="text-base text-white tracking-wide mt-0.5" style={{ fontFamily: "var(--font-display)" }}>
                        {n.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
