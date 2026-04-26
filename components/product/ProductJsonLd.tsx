import type { ShopifyProduct } from "@/types/shopify";
import { getNationCodeFromTitle, getNation } from "@/lib/nations";

interface ProductJsonLdProps {
  product: ShopifyProduct;
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const image = product.images?.edges?.[0]?.node;
  const variant = product.variants?.edges?.[0]?.node;
  const price = variant?.price?.amount ?? "49.99";
  const currency = variant?.price?.currencyCode ?? "USD";
  const nationCode = getNationCodeFromTitle(product.title);
  const nation = nationCode ? getNation(nationCode) : null;

  // All variant images for the Product schema
  const allImages = product.images?.edges?.map((e) => e.node.url) ?? [];

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description ||
      `Premium stretch-fit car hood cover for World Cup 2026. Sublimation-printed on polyester spandex. Universal fit.`,
    image: allImages.length > 0 ? allImages : image?.url ? [image.url] : [],
    brand: {
      "@type": "Brand",
      name: "Hood'd",
    },
    sku: variant?.sku || product.handle,
    mpn: product.handle,
    color: nation ? `${nation.name} national colors` : undefined,
    material: "Polyester spandex",
    category: "Automotive Accessories > Car Covers",
    offers: {
      "@type": "Offer",
      url: `https://hooddshop.com/products/${product.handle}`,
      priceCurrency: currency,
      price: price,
      priceValidUntil: "2026-12-31",
      availability: variant?.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 10,
            unitCode: "DAY",
          },
        },
      },
      seller: {
        "@type": "Organization",
        name: "Hood'd",
      },
    },
  };

  // Breadcrumb: Home > Shop > {Nation Name} Hood Cover
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://hooddshop.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://hooddshop.com/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `https://hooddshop.com/products/${product.handle}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
