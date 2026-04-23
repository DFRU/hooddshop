import type { Metadata } from "next";
import { getProduct } from "@/lib/shopify";
import { getNationCodeFromTitle, getNation } from "@/lib/nations";
import {
  getVehicleImages,
  getMockupImage,
  getMockupImages,
  getMockupImagesForDesign,
  getProductImage,
  hasDesignMockup,
  DESIGN_TYPE_SLUGS,
} from "@/lib/vehicles";
import ProductDetailClient from "./ProductDetailClient";
import ProductJsonLd from "@/components/product/ProductJsonLd";

// ── Dynamic metadata from Shopify product data ──────────────
interface PageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
  const mockupImage = nationCode ? getMockupImage(nationCode) : null;

  const seoTitle = nation
    ? `${nation.name} Car Hood Cover — World Cup 2026 | Hood'd`
    : product.title;

  const seoDescription = nation
    ? `Rep ${nation.name} on the road with Hood'd premium stretch-fit car hood covers. Full sublimation print, universal fit for cars, SUVs, and trucks. $49.99. Made to order for World Cup 2026.`
    : product.description || "Premium stretch-fit car hood cover with sublimation print for World Cup 2026.";

  // OG image priority: product photo > mockup > AI render > Shopify image
  const productPhotoOG = nationCode ? getProductImage(nationCode) : null;
  const ogImage = productPhotoOG
    ? { url: `https://hooddshop.com${productPhotoOG.src}`, width: productPhotoOG.width, height: productPhotoOG.height }
    : mockupImage
      ? { url: `https://hooddshop.com${mockupImage.src}`, width: mockupImage.width, height: mockupImage.height }
      : vehicleImages.length > 0
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
export default async function ProductPage({ params, searchParams }: PageProps) {
  const { handle } = await params;
  const resolvedSearchParams = await searchParams;
  const product = await getProduct(handle);

  // Resolve initial variant from URL ?variant= param (deep-link support)
  const variants = product?.variants?.edges?.map((e) => e.node) ?? [];
  const variantParam = typeof resolvedSearchParams.variant === "string"
    ? resolvedSearchParams.variant
    : undefined;
  const initialVariantId = variants.find((v) => v.id === variantParam)?.id
    ?? variants[0]?.id
    ?? undefined;

  // Resolve all image sources for this product's nation
  const nationCode = product ? getNationCodeFromTitle(product.title) : null;
  const vehicleImages = nationCode ? getVehicleImages(nationCode) : [];
  const mockups = nationCode ? getMockupImages(nationCode) : [];

  // "See it on your ride" showcase: build per-design map + default fallback
  // Key "_default" = original mockups (always available)
  // Keys like "home", "away", "flag" etc = per-design mockups (when generated)
  const buildShowcaseSet = (mockupList: typeof mockups) => [
    ...mockupList
      .filter((m) => m.view !== 4 && m.view !== 5) // skip views 4 and 5 (render incorrectly)
      .map((m) => ({ src: m.src, alt: m.alt, label: "Product Mockup" })),
    ...vehicleImages.slice(0, 2).map((v) => ({ src: v.src, alt: v.alt, label: v.vehicleName })),
  ];

  const showcaseMap: Record<string, { src: string; alt: string; label: string }[]> = {
    _default: buildShowcaseSet(mockups),
  };

  if (nationCode) {
    for (const [label, slug] of Object.entries(DESIGN_TYPE_SLUGS)) {
      if (hasDesignMockup(nationCode, slug)) {
        const designMockups = getMockupImagesForDesign(nationCode, slug);
        showcaseMap[label] = buildShowcaseSet(designMockups);
      }
    }
  }

  const showcaseImages = showcaseMap._default;

  return (
    <>
      {product && <ProductJsonLd product={product} />}
      <ProductDetailClient
        product={product}
        handle={handle}
        showcaseImages={showcaseImages}
        showcaseMap={showcaseMap}
        initialVariantId={initialVariantId}
      />
    </>
  );
}
