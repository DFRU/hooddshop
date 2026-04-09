import Link from "next/link";
import { HOME_FEATURED_NATIONS, NATIONS } from "@/lib/nations";
import { flagUrl } from "@/lib/design";

export default function FeaturedNations() {
  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex items-end justify-between mb-6 lg:mb-10">
          <div>
            <span className="text-label" style={{ color: "var(--color-accent)" }}>Featured</span>
            <h2 className="text-display-lg text-white mt-1">Popular Nations</h2>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory -mx-[var(--container-px)] px-[var(--container-px)] pb-4">
          {HOME_FEATURED_NATIONS.map((code) => {
            const n = NATIONS.find((x) => x.code === code);
            if (!n) return null;
            return (
              <Link
                key={code}
                href={`/nations/${code}`}
                className="group flex-shrink-0 w-[160px] lg:w-48 snap-start text-left touch-active"
              >
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{ aspectRatio: "3/4", border: "1px solid #1A1A1A" }}
                >
                  <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)" }} />
                  <img
                    src={flagUrl(code, 160)}
                    alt={n.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-45 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-3xl block mb-1">{n.emoji}</span>
                    <span className="text-lg lg:text-xl text-white tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                      {n.name}
                    </span>
                    <span className="block text-[9px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "#555" }}>
                      {n.confederation}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
