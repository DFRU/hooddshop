"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import FulfillmentSelector from "@/components/product/FulfillmentSelector";
import VariantSelector from "@/components/product/VariantSelector";
import TrustBar from "@/components/product/TrustBar";

import type { FulfillmentOption } from "@/lib/suppliers/types";
import type { ShopifyProduct, ShopifyVariant } from "@/types/shopify";

// ── Accordion data ────────────────────────────────────────────
const ACCORDION_SECTIONS = [
  {
    title: "What's Included",
    content:
      "1x custom sublimation-printed stretch car hood cover with elastic sewn-in edge. 2x elastic fastener straps with hooks for extra security at highway speeds.",
  },
  {
    title: "Fit Guide",
    content:
      'Standard size: 63" × 47" (160 × 120 cm). Fits most sedans, compact SUVs, and coupes. Elastic edge provides 15-25% stretch tolerance. Does not fit micro cars or hoods under 36" wide. Universal fit — no vehicle selection required.',
  },
  {
    title: "Care Instructions",
    content:
      "Machine wash cold on gentle cycle. Tumble dry low or hang dry. Do not iron directly on print area. Do not bleach. Store flat or loosely folded. Sublimation ink is permanent — will not crack, peel, or fade like vinyl.",
  },
  {
    title: "Shipping",
    content:
      "Made to order via dye sublimation printing. Production takes 3-7 business days depending on fulfillment location. Worldwide delivery available — shipping speed based on your selected fulfillment option above.",
  },
];

// ── Types ─────────────────────────────────────────────────────
interface GalleryImage {
  src: string;
  alt: string;
  label?: string;
}

interface ProductDetailClientProps {
  product: ShopifyProduct | null;
  handle: string;
  vehicleImages?: { src: string; alt: string; vehicleName: string }[];
  /** Shopify variant GID from ?variant= URL param, resolved server-side. */
  initialVariantId?: string;
}

// ── Component ─────────────────────────────────────────────────
export default function ProductDetailClient({
  product,
  handle,
  vehicleImages = [],
  initialVariantId,
}: ProductDetailClientProps) {
  const { addItem, isLoading } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] =
    useState<FulfillmentOption | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ── Variants ──────────────────────────────────────────────
  const variants: ShopifyVariant[] = useMemo(
    () => product?.variants?.edges?.map((e) => e.node) ?? [],
    [product]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId ?? variants[0]?.id ?? ""
  );

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null,
    [variants, selectedVariantId]
  );

  // Build Design option for the variant selector
  const designOptions = useMemo(() => {
    // Find the "Design" option axis from the product options
    const designOption = product?.options?.find(
      (o) => o.name.toLowerCase() === "design"
    );
    if (!designOption || designOption.values.length < 2) return [];

    // Map each option value to its variant
    return designOption.values
      .map((value) => {
        const variant = variants.find((v) =>
          v.selectedOptions?.some(
            (so) => so.name.toLowerCase() === "design" && so.value === value
          )
        );
        return variant ? { value, variantId: variant.id } : null;
      })
      .filter((o): o is { value: string; variantId: string } => o !== null);
  }, [product?.options, variants]);

  const selectedDesignValue = useMemo(() => {
    if (!selectedVariant?.selectedOptions) return "";
    return (
      selectedVariant.selectedOptions.find(
        (so) => so.name.toLowerCase() === "design"
      )?.value ?? ""
    );
  }, [selectedVariant]);

  // ── URL sync — update ?variant= on selection change ───────
  useEffect(() => {
    if (!selectedVariantId) return;
    const url = new URL(window.location.href);
    // Only set param if product has multiple variants (avoid polluting
    // single-variant product URLs)
    if (variants.length > 1) {
      url.searchParams.set("variant", selectedVariantId);
    } else {
      url.searchParams.delete("variant");
    }
    window.history.replaceState({}, "", url.toString());
  }, [selectedVariantId, variants.length]);

  const handleFulfillmentSelect = useCallback((option: FulfillmentOption) => {
    setSelectedFulfillment(option);
  }, []);

  const handleVariantChange = useCallback(
    (_value: string, variantId: string) => {
      setSelectedVariantId(variantId);
      // Reset gallery to first image when switching variants
      setActiveImageIndex(0);
      // Clear fulfillment selection — pricing may differ per variant in the future
      setSelectedFulfillment(null);
    },
    []
  );

  // ── Derived data ──────────────────────────────────────────
  const shopifyImages = product?.images?.edges?.map((e) => e.node) ?? [];

  // Build gallery: variant image first (if present), then mockups, then Shopify images
  const galleryImages: GalleryImage[] = useMemo(() => {
    const images: GalleryImage[] = [];

    // Variant-specific image from Shopify (the mockup assigned to this variant)
    if (selectedVariant?.image) {
      images.push({
        src: selectedVariant.image.url,
        alt: selectedVariant.image.altText ?? `${selectedVariant.title} design`,
        label: selectedVariant.title,
      });
    }

    // Mockup/vehicle images from server (pre-ordered: mockups first, then AI renders)
    for (const v of vehicleImages) {
      // Skip if this URL is the same as the variant image we already added
      if (selectedVariant?.image && v.src === selectedVariant.image.url) continue;
      images.push({
        src: v.src,
        alt: v.alt,
        label: v.vehicleName,
      });
    }

    // Shopify product-level images (deduplicated)
    for (const img of shopifyImages) {
      if (!images.some((g) => g.src === img.url)) {
        images.push({
          src: img.url,
          alt: img.altText ?? product?.title ?? handle,
          label: "Product Photo",
        });
      }
    }

    return images;
  }, [selectedVariant, vehicleImages, shopifyImages, product?.title, handle]);

  const shopifyPrice = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : null;

  const displayPrice = shopifyPrice ?? 49.99;
  const title = product?.title ?? `Hood Cover — ${handle}`;
  const descriptionHtml = product?.descriptionHtml ?? null;
  const description =
    product?.description ??
    "Premium stretch-fit car hood cover with full-bleed sublimation print. 85-90% polyester / 10-15% spandex. Universal fit with elastic sewn-in edge.";

  // Effective price shown: fulfillment-adjusted if selected, else variant price
  const effectivePrice = selectedFulfillment
    ? selectedFulfillment.price_usd
    : displayPrice;

  // ── Add to cart handler ───────────────────────────────────
  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    const attributes: { key: string; value: string }[] = [];
    if (selectedFulfillment) {
      attributes.push({
        key: "_fulfillment_option",
        value: JSON.stringify({
          supplier_id: selectedFulfillment.supplier_id,
          supplier_region: selectedFulfillment.supplier_region,
          label: selectedFulfillment.label,
          estimated_days: selectedFulfillment.estimated_days_display,
          price: selectedFulfillment.price_usd,
        }),
      });
    }

    await addItem(selectedVariant.id, 1, attributes);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1000);
  };

  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];

  return (
    <>
      <div className="max-w-[var(--max-width)] mx-auto lg:flex lg:gap-8 px-[var(--container-px)] lg:px-[var(--container-px-lg)] pt-20 lg:pt-24 pb-6 lg:pb-10">
        {/* ── Image gallery ── */}
        <div className="lg:w-[58%] lg:flex-shrink-0">
          {/* Main image */}
          <div
            className="relative w-full overflow-hidden rounded-lg"
            style={{ aspectRatio: "4/3", border: "1px solid #1A1A1A", background: "var(--color-surface-2)" }}
          >
            {activeImage ? (
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-label" style={{ color: "var(--color-text-muted)" }}>
                  Product image available when store is live
                </span>
              </div>
            )}
            {activeImage?.label && activeImage.label !== "Product Mockup" && activeImage.label !== "Product Photo" && (
              <div
                className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] uppercase tracking-widest text-white/70"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              >
                AI Preview · {activeImage.label}
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {galleryImages.map((img, i) => (
                <button
                  key={img.src + i}
                  onClick={() => setActiveImageIndex(i)}
                  className="relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded overflow-hidden transition-all"
                  style={{
                    border: i === activeImageIndex ? "2px solid var(--color-accent)" : "2px solid #222",
                    opacity: i === activeImageIndex ? 1 : 0.6,
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div className="lg:w-[42%] mt-6 lg:mt-0">
          <h1 className="text-display-lg text-white">{title}</h1>
          <p
            className="text-body-lg font-semibold mt-2"
            style={{ color: "var(--color-accent)" }}
          >
            ${effectivePrice.toFixed(2)} USD
          </p>
          {descriptionHtml ? (
            <div
              className="text-body-md mt-4 product-description"
              style={{ color: "var(--color-text-muted)" }}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            <p
              className="text-body-md mt-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              {description}
            </p>
          )}

          {/* ── Design variant selector (Home / Away) ── */}
          <VariantSelector
            label="Design"
            options={designOptions}
            selectedValue={selectedDesignValue}
            onChange={handleVariantChange}
          />

          <FulfillmentSelector onSelect={handleFulfillmentSelect} />

          {/* Desktop add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !selectedVariant}
            className="mt-6 w-full text-white font-semibold uppercase tracking-[0.06em] rounded transition-colors disabled:opacity-50"
            style={{
              background: addedFeedback
                ? "var(--color-success)"
                : "var(--color-accent)",
              height: "56px",
            }}
          >
            {addedFeedback
              ? "\u2713 Added"
              : selectedVariant
              ? "Add to Cart"
              : "Coming Soon"}
          </button>

          <TrustBar />

          {/* ── Accordion sections ── */}
          <div className="mt-4 pb-24 lg:pb-8">
            {ACCORDION_SECTIONS.map((section) => (
              <details
                key={section.title}
                className="group"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <summary className="flex items-center justify-between py-4 cursor-pointer text-body-md text-white min-h-[44px] list-none">
                  {section.title}
                  <svg
                    className="w-5 h-5 transition-transform group-open:rotate-180"
                    style={{ color: "var(--color-text-muted)" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p
                  className="pb-4 text-body-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {section.content}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:hidden"
        style={{
          height: "80px",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div>
          <p
            className="text-body-lg font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            ${effectivePrice.toFixed(2)}
          </p>
          <p
            className="text-body-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            USD
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isLoading || !selectedVariant}
          className="text-white font-semibold uppercase tracking-[0.06em] rounded px-8 transition-colors disabled:opacity-50"
          style={{
            background: addedFeedback
              ? "var(--color-success)"
              : "var(--color-accent)",
            height: "52px",
            width: "60%",
          }}
        >
          {addedFeedback
            ? "\u2713 Added"
            : selectedVariant
            ? "Add to Cart"
            : "Coming Soon"}
        </button>
      </div>
    </>
  );
}
