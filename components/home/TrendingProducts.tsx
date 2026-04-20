import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/shopify";

// Top 8 nations by expected demand (host nations + global fan bases)
// Must match the EXACT keywords in Shopify product titles:
//   "HOOD'D | USA — Jersey Line", "HOOD'D | Brazil — Jersey Line", etc.
const POPULAR_NAMES = [
  "USA",
  "Mexico",
  "Brazil",
  "Argentina",
  "France",
  "England",
  "Spain",
  "Germany",
];

export default async function TrendingProducts() {
  // Query by the exact names used in Shopify product titles
  const popularQuery = POPULAR_NAMES.map((n) => `title:${n}`).join(" OR ");
  const { products } = await getProducts({ first: 8, sortKey: "TITLE", query: popularQuery });

  // If no Shopify products available, don't render the section
  if (products.length === 0) return null;

  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex items-end justify-between mb-6 lg:mb-10">
          <div>
            <span className="text-label" style={{ color: "var(--color-accent)" }}>
              Trending
            </span>
            <h2 className="text-display-lg text-white mt-1">Best Sellers</h2>
          </div>
          <Link
            href="/shop"
            className="text-body-sm font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
          {products.map((product) => {
            const priceData = product.priceRange?.minVariantPrice;
            const formattedPrice = priceData
              ? `$${parseFloat(priceData.amount).toFixed(2)} ${priceData.currencyCode}`
              : "";

            // Use variant images: Home as primary, Away on hover
            const variants = product.variants?.edges?.map((e) => e.node) ?? [];
            const homeVariant = variants.find(
              (v) => v.selectedOptions?.some((o) => o.name.toLowerCase() === "design" && o.value.toLowerCase() === "home")
            );
            const awayVariant = variants.find(
              (v) => v.selectedOptions?.some((o) => o.name.toLowerCase() === "design" && o.value.toLowerCase() === "away")
            );
            const shopifyImage = product.images?.edges?.[0]?.node;
            const imgSrc = homeVariant?.image?.url ?? shopifyImage?.url;
            const imgAlt = homeVariant?.image?.altText ?? shopifyImage?.altText ?? product.title;
            const hoverSrc = awayVariant?.image?.url && awayVariant.image.url !== imgSrc
              ? awayVariant.image.url
              : undefined;

            const designCount = variants.filter((v) => v.image).length;

            // Clean title: "HOOD'D | Brazil — Jersey Line" → "Brazil"
            const displayTitle = product.title
              .replace(/^HOOD'D\s*\|\s*/i, "")
              .replace(/\s*—\s*Jersey Line$/i, "")
              .trim() || product.title;

            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group block touch-active"
              >
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={{
                    aspectRatio: "4/3",
                    border: "1px solid #181818",
                    background: "var(--color-surface-2)",
                  }}
                >
                  {imgSrc ? (
                    <>
                      <Image
                        src={imgSrc}
                        alt={imgAlt}
                        fill
                        className={`object-cover transition-all duration-300 ${hoverSrc ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {hoverSrc && (
                        <Image
                          src={hoverSrc}
                          alt={`${displayTitle} Away design`}
                          fill
                          className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {displayTitle}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {designCount >= 2 && (
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-semibold"
                      style={{ background: "rgba(255,77,0,0.85)", color: "#fff" }}
                    >
                      {designCount} Designs
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-white text-[13px] font-medium truncate">
                      {displayTitle}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#555" }}>
                      Hood Cover
                    </div>
                  </div>
                  <div className="text-white text-[13px] font-semibold flex-shrink-0">
                    {formattedPrice}
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
