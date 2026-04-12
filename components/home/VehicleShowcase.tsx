import Image from "next/image";
import Link from "next/link";
import { getShowcaseImages } from "@/lib/vehicles";
import { getNation, getTitleKeyword } from "@/lib/nations";
import { flagUrl } from "@/lib/design";
import { getProducts } from "@/lib/shopify";
import type { ShopifyProduct } from "@/types/shopify";

export default async function VehicleShowcase() {
  const showcase = getShowcaseImages(6);

  // Fetch products for these nations to link correctly
  const codes = [...new Set(showcase.map((s) => s.nationCode))];
  const titleQuery = codes.map((c) => `title:${getTitleKeyword(c)}`).join(" OR ");
  const { products } = await getProducts({ first: 12, sortKey: "TITLE", query: titleQuery });

  const productMap = new Map<string, ShopifyProduct>();
  for (const code of codes) {
    const keyword = getTitleKeyword(code).toLowerCase();
    const match = products.find((p) => p.title.toLowerCase().includes(keyword));
    if (match) productMap.set(code, match);
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-display-md text-white">See It On Your Ride</h2>
          <p className="text-body-sm mt-2 max-w-lg mx-auto" style={{ color: "#888" }}>
            Universal stretch fit for cars, SUVs, and trucks. AI-generated previews — actual product may vary slightly.
          </p>
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {showcase.map((img) => {
            const nation = getNation(img.nationCode);
            const product = productMap.get(img.nationCode);
            if (!nation) return null;

            return (
              <Link
                key={`${img.nationCode}_${img.vehicleType}`}
                href={product ? `/products/${product.handle}` : "/shop"}
                className="group relative rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
                style={{ aspectRatio: "4/3", border: "1px solid #1E1E1E", background: "#111" }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 1280px) 33vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2">
                    <img src={flagUrl(img.nationCode, 32)} className="w-6 h-auto rounded shadow" alt={`${nation?.name} flag`} />
                    <div>
                      <div className="text-display-sm text-white">{nation.name}</div>
                      <div className="text-[9px] uppercase tracking-[0.12em] text-white/50">
                        on {img.vehicleName}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="md:hidden -mx-[var(--container-px)]">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory px-[var(--container-px)] pb-3">
            {showcase.map((img) => {
              const nation = getNation(img.nationCode);
              const product = productMap.get(img.nationCode);
              if (!nation) return null;

              return (
                <Link
                  key={`${img.nationCode}_${img.vehicleType}`}
                  href={product ? `/products/${product.handle}` : "/shop"}
                  className="flex-shrink-0 w-[280px] snap-start"
                >
                  <div
                    className="relative rounded-lg overflow-hidden shadow-lg"
                    style={{ aspectRatio: "4/3", border: "1px solid #1E1E1E", background: "#111" }}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-2">
                        <img src={flagUrl(img.nationCode, 32)} className="w-6 h-auto rounded shadow" alt={`${nation?.name} flag`} />
                        <div>
                          <div className="text-display-sm text-white">{nation.name}</div>
                          <div className="text-[9px] uppercase tracking-[0.12em] text-white/50">
                            on {img.vehicleName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/nations"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors touch-active"
            style={{ border: "1px solid #333" }}
          >
            Browse All 48 Nations
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
