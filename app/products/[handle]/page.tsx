import type { Metadata } from "next";
import { getProduct } from "@/lib/shopify";
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

  const image = product.images?.edges?.[0]?.node;

  return {
    title: product.title,
    description:
      product.description ||
      "Premium stretch-fit car hood cover with sublimation print for World Cup 2026.",
    openGraph: {
      title: product.title,
      description: product.description,
      images: image ? [{ url: image.url, width: image.width, height: image.height }] : [],
    },
  };
}

// ── Server component — fetches product, passes to client ────
export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  return (
    <>
      {product && <ProductJsonLd product={product} />}
      <ProductDetailClient product={product} handle={handle} />
    </>
  );
}
