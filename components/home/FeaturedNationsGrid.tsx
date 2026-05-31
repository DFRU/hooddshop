import Link from "next/link";
import Image from "next/image";
import { NATIONS, getTitleKeyword } from "@/lib/nations";
import { getProducts } from "@/lib/shopify";

/**
 * Featured nations spec (§5.3):
 * - Hosts + largest NA diaspora + defending/top-tier nations
 * - Override only if Shopify analytics show different top-sellers
 */
const FEATURED_CODES = ["br", "mx", "us", "ca", "pt", "fr", "ar", "ma"] as const;

export default async function FeaturedNationsGrid() {
  // Fetch Shopify products for featured nations to get product handles
  const titleQuery = FEATURED_CODES.map(
    (c) => `title:${getTitleKeyword(c)}`
  ).join(" OR ");
  const { products } = await getProducts({
    first: 8,
    sortKey: "TITLE",
    query: titleQuery,
  });

  // Map code → product handle
  const handleMap = new Map<string, string>();
  for (const code of FEATURED_CODES) {
    const keyword = getTitleKeyword(code).toLowerCase();
    const match = products.find((p) =>
      p.title.toLowerCase().includes(keyword)
    );
    if (match) handleMap.set(code, match.handle);
  }

  return (
    <section
      className="py-12 lg:py-20"
      style={{ borderTop: "1px solid #151515" }}
    >
      <div className="max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        {/* Section header */}
        <div className="mb-8 lg:mb-10">
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            PICK YOUR NATION
          </h2>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "#999999",
            }}
          >
            48 nations. World Cup 2026.
          </p>
        </div>

        {/* 4-col desktop / 2-col mobile grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {FEATURED_CODES.map((code) => {
            const nation = NATIONS.find((n) => n.code === code);
            if (!nation) return null;
            const handle = handleMap.get(code);
            const href = handle ? `/products/${handle}` : `/shop`;
            // flagcdn delivers optimized flags, no API key needed
            const flagSrc = `https://flagcdn.com/w320/${code}.png`;

            return (
              <Link
                key={code}
                href={href}
                className="group block touch-active"
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: "3/2",
                    background: "#141414",
                    borderRadius: "2px",
                    // Hover border applied via sibling element below
                  }}
                >
                  <Image
                    src={flagSrc}
                    alt={`${nation.name} flag`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    loading="lazy"
                  />
                  {/* Subtle darkening overlay */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{ background: "linear-gradient(to top, #000 0%, transparent 60%)" }}
                  />
                  {/* FF4D00 bottom border on hover — 3px, smooth transition */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px] transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                    style={{ background: "#FF4D00" }}
                  />
                </div>
                {/* Nation name + shop link */}
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="text-white"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {nation.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "#666",
                      }}
                    >
                      $34.99 USD
                    </span>
                    <span
                      className="text-[12px] font-medium transition-colors group-hover:opacity-100 opacity-60"
                      style={{ color: "#FF4D00", fontFamily: "var(--font-body)" }}
                    >
                      Shop →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all CTA */}
        <div className="mt-8 lg:mt-10">
          <Link
            href="/nations"
            className="touch-active"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              color: "#FF4D00",
              letterSpacing: "0.04em",
            }}
          >
            VIEW ALL 48 NATIONS →
          </Link>
        </div>
      </div>
    </section>
  );
}
