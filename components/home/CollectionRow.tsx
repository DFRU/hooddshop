import Link from "next/link";
import Image from "next/image";
import { HOME_FEATURED_NATIONS, NATIONS, getTitleKeyword } from "@/lib/nations";
import { flagUrl } from "@/lib/design";
import { getMockupImage } from "@/lib/vehicles";
import { getProducts } from "@/lib/shopify";
import type { ShopifyProduct } from "@/types/shopify";

export default async function FeaturedNations() {
  // Fetch real Shopify products for featured nations
  const titleQuery = HOME_FEATURED_NATIONS.map(
    (c) => `title:${getTitleKeyword(c)}`
  ).join(" OR ");
  const { products } = await getProducts({ first: 8, sortKey: "TITLE", query: titleQuery });

  // Build a map from nation code → product
  const productMap = new Map<string, ShopifyProduct>();
  for (const code of HOME_FEATURED_NATIONS) {
    const keyword = getTitleKeyword(code).toLowerCase();
    const match = products.find((p) => p.title.toLowerCase().includes(keyword));
    if (match) productMap.set(code, match);
  }

  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex items-end justify-between mb-6 lg:mb-10">
          <div>
            <span className="text-label" style={{ color: "var(--color-accent)" }}>Featured</span>
            <h2 className="text-display-lg text-white mt-1">Popular Nations</h2>
          </div>
          <Link
            href="/shop"
            className="text-body-sm font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            View All →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory -mx-[var(--container-px)] px-[var(--container-px)] pb-4">
          {HOME_FEATURED_NATIONS.map((code) => {
            const n = NATIONS.find((x) => x.code === code);
            if (!n) return null;
            const product = productMap.get(code);
            // Prefer Printkk mockup over Shopify image (which may be vehicle render)
            const mockup = getMockupImage(code, 0);
            const imageUrl = mockup?.src ?? product?.images?.edges?.[0]?.node?.url;
            const href = product ? `/products/${product.handle}` : `/shop`;

            return (
              <Link
                key={code}
                href={href}
                className="group flex-shrink-0 w-[160px] lg:w-48 snap-start text-left touch-active"
              >
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{ aspectRatio: "3/4", border: "1px solid #1A1A1A", background: "#111" }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${n.name} hood cover`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 160px, 192px"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)" }} />
                      <img
                        src={flagUrl(code, 160)}
                        alt={n.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-45 transition-all duration-500"
                      />
                    </>
                  )}
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
