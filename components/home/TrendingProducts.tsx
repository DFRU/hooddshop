import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/shopify";
import { getNationCodeFromTitle } from "@/lib/nations";
import { getMockupImage, getProductImage } from "@/lib/vehicles";

export default async function TrendingProducts() {
  // Fetch popular nations by title — no sales data yet so BEST_SELLING returns arbitrary order
  const popularQuery = "title:Brazil OR title:Argentina OR title:France OR title:England OR title:Spain OR title:Germany OR title:Mexico OR title:USA";
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
            const shopifyImage = product.images?.edges?.[0]?.node;
            const price = product.priceRange?.minVariantPrice?.amount;
            const formattedPrice = price
              ? `$${parseFloat(price).toFixed(2)}`
              : "$49.99";

            // Image priority: product photo > mockup > Shopify image
            const nationCode = getNationCodeFromTitle(product.title);
            const productPhoto = nationCode ? getProductImage(nationCode) : null;
            const mockup = nationCode ? getMockupImage(nationCode, 0) : null;
            const imgSrc = productPhoto?.src ?? mockup?.src ?? shopifyImage?.url;
            const imgAlt = productPhoto?.alt ?? mockup?.alt ?? shopifyImage?.altText ?? product.title;

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
                    <Image
                      src={imgSrc}
                      alt={imgAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {product.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-white text-[13px] font-medium truncate">
                      {product.title}
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
