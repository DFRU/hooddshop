import type { Metadata } from "next";
import { getProduct } from "@/lib/shopify";
import { getNationCodeFromTitle, getNation } from "@/lib/nations";
import { getVehicleImages } from "@/lib/vehicles";
import ProductDetailClient from "./ProductDetailClient";
import ProductJsonLd from "@/components/product/ProductJsonLd";

// ── Dynamic metadata from Shopify product data ──────────────
interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return {
      title: `${handle} | Hood'd`,
      description:
        "Premium stretch-fit car hood cover with sublimation print for World Cup 2026.",
    };
  }

  // Extract nation for SEO-optimized title
  const nationCode = getNationCodeFromTitle(product.title);
  const nation = nationCode ? getNation(nationCode) : null;
  const vehicleImages = nationCode ? getVehicleImages(nationCode) : [];

  const seoTitle = nation
    ? `${nation.name} Car Hood Cover — World Cup 2026 | Hood'd`
    : product.title;

  const seoDescription = nation
    ? `Rep ${nation.name} on the road with Hood'd premium stretch-fit car hood covers. Full sublimation print, universal fit for cars, SUVs, and trucks. $49.99. Made to order for World Cup 2026.`
    : product.description || "Premium stretch-fit car hood cover with sublimation print for World Cup 2026.";

  // Use vehicle image for OG if available, fall back to product image
  const ogImage = vehicleImages.length > 0
    ? { url: `https://hooddshop.com${vehicleImages[0].src}`, width: vehicleImages[0].width, height: vehicleImages[0].height }
    : product.images?.edges?.[0]?.node
      ? { url: product.images.edges[0].node.url, width: product.images.edges[0].node.width, height: product.images.edges[0].node.height }
      : undefined;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: ogImage ? [ogImage] : [],
    },
  };
}

// ── Server component — fetches product, passes to client ────
export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  // Resolve vehicle images for this product's nation
  const nationCode = product ? getNationCodeFromTitle(product.title) : null;
  const vehicleImages = nationCode ? getVehicleImages(nationCode) : [];

  return (
    <>
      {product && <ProductJsonLd product={product} />}
      <ProductDetailClient
        product={product}
        handle={handle}
        vehicleImages={vehicleImages.map((v) => ({
          src: v.src,
          alt: v.alt,
          vehicleName: v.vehicleName,
        }))}
      />
    </>
  );
}
