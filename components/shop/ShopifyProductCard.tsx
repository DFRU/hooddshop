import Link from "next/link";
import Image from "next/image";
import type { ShopifyProduct } from "@/types/shopify";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

export default function ShopifyProductCard({ product }: ShopifyProductCardProps) {
  const image = product.images?.edges?.[0]?.node;
  const price = product.priceRange?.minVariantPrice?.amount;
  const formattedPrice = price
    ? `$${parseFloat(price).toFixed(2)}`
    : "$49.99";

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
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                No image
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </Link>
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
    </div>
  );
}
