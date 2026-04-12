import type { ShopifyProduct } from "@/types/shopify";

interface ProductJsonLdProps {
  product: ShopifyProduct;
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const image = product.images?.edges?.[0]?.node;
  const variant = product.variants?.edges?.[0]?.node;
  const price = variant?.price?.amount ?? "49.99";
  const currency = variant?.price?.currencyCode ?? "USD";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: image?.url ?? "",
    brand: {
      "@type": "Brand",
      name: "Hood'd",
    },
    sku: product.handle,
    offers: {
      "@type": "Offer",
      url: `https://hooddshop.com/products/${product.handle}`,
      priceCurrency: currency,
      price: price,
      availability: variant?.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Hood'd",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
