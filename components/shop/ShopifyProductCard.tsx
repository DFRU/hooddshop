import Link from "next/link";
import Image from "next/image";
import type { ShopifyProduct } from "@/types/shopify";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

export default function ShopifyProductCard({ product }: ShopifyProductCardProps) {
  const priceData = product.priceRange?.minVariantPrice;
  const formattedPrice = priceData
    ? `$${parseFloat(priceData.amount).toFixed(2)} ${priceData.currencyCode}`
    : "";

  // Extract variant images for Home/Away display
  const variants = product.variants?.edges?.map((e) => e.node) ?? [];
  const homeVariant = variants.find(
    (v) => v.selectedOptions?.some((o) => o.name.toLowerCase() === "design" && o.value.toLowerCase() === "home")
  );
  const awayVariant = variants.find(
    (v) => v.selectedOptions?.some((o) => o.name.toLowerCase() === "design" && o.value.toLowerCase() === "away")
  );

  // Primary: Home variant image, fallback to first product image
  const shopifyImage = product.images?.edges?.[0]?.node;
  const primarySrc = homeVariant?.image?.url ?? shopifyImage?.url;
  const primaryAlt = homeVariant?.image?.altText ?? shopifyImage?.altText ?? product.title;

  // Hover: Away variant image (if it exists and is different)
  const hoverSrc = awayVariant?.image?.url && awayVariant.image.url !== primarySrc
    ? awayVariant.image.url
    : undefined;

  const designCount = variants.filter((v) => v.image).length;

  // Clean up title for display: "HOOD'D | Brazil — Jersey Line" → "Brazil"
  const displayTitle = product.title
    .replace(/^HOOD'D\s*\|\s*/i, "")
    .replace(/\s*—\s*Jersey Line$/i, "")
    .trim() || product.title;

  return (
    <div className="group">
      <Link
        href={`/products/${product.handle}`}
        className="block w-full text-left touch-active"
      >
        <div
          className="relative overflow-hidden rounded-lg"
          style={{ aspectRatio: "4/3", border: "1px solid #181818", background: "var(--color-surface-2)" }}
        >
          {primarySrc ? (
            <>
              <Image
                src={primarySrc}
                alt={primaryAlt}
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
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                No image
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Design count badge */}
          {designCount >= 2 && (
            <div
              className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-semibold"
              style={{ background: "rgba(255,77,0,0.85)", color: "#fff" }}
            >
              More Designs!
            </div>
          )}

          {/* Hover label */}
          {hoverSrc && (
            <div
              className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)" }}
            >
              Away
            </div>
          )}
        </div>
      </Link>
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
    </div>
  );
}
