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

interface ShowcaseImage {
  src: string;
  alt: string;
  label: string;
}

interface ProductDetailClientProps {
  product: ShopifyProduct | null;
  handle: string;
  /** Mockup/vehicle images for "See it on your ride" section */
  showcaseImages?: ShowcaseImage[];
  /** Shopify variant GID from ?variant= URL param, resolved server-side. */
  initialVariantId?: string;
}

// ── Component ─────────────────────────────────────────────────
export default function ProductDetailClient({
  product,
  handle,
  showcaseImages = [],
  initialVariantId,
}: ProductDetailClientProps) {
  const { addItem, isLoading } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
  const allShopifyImages = product?.images?.edges?.map((e) => e.node) ?? [];

  // Build gallery: product-level design images from Shopify + variant images
  // Mockup/vehicle images go in the separate showcase section below
  const galleryImages: GalleryImage[] = useMemo(() => {
    const images: GalleryImage[] = [];
    const seenUrls = new Set<string>();

    // Helper to extract the design label from our alt text convention:
    // "{Nation} {Design Label} — Hood'd"
    const extractLabel = (altText: string | null | undefined): string | undefined => {
      if (!altText) return undefined;
      const match = altText.match(/^.+?\s+(Original Design|Jersey Inspired Full Name|Jersey Inspired Abbreviated|Home Jersey Design|Away Jersey Design|Flag Inspired Design)\s+—/);
      return match ? match[1] : undefined;
    };

    // 1. Product-level Shopify images first (the uploaded jersey designs, in position order)
    for (const img of allShopifyImages) {
      if (seenUrls.has(img.url)) continue;
      seenUrls.add(img.url);
      images.push({
        src: img.url,
        alt: img.altText ?? product?.title ?? handle,
        label: extractLabel(img.altText),
      });
    }

    // 2. Add variant images if they aren't already in the list (dedup by URL)
    if (selectedVariant?.image && !seenUrls.has(selectedVariant.image.url)) {
      seenUrls.add(selectedVariant.image.url);
      images.unshift({
        src: selectedVariant.image.url,
        alt: selectedVariant.image.altText ?? `${selectedVariant.title} design`,
        label: selectedVariant.title,
      });
    }

    for (const variant of variants) {
      if (variant.id === selectedVariant?.id) continue;
      if (!variant.image) continue;
      if (seenUrls.has(variant.image.url)) continue;
      seenUrls.add(variant.image.url);
      images.push({
        src: variant.image.url,
        alt: variant.image.altText ?? `${variant.title} design`,
        label: variant.title,
      });
    }

    return images;
  }, [selectedVariant, variants, allShopifyImages, product?.title, handle]);

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
            {activeImage?.label && (
              <div
                className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] uppercase tracking-widest text-white/70"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              >
                {activeImage.label}
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

          {/* ── "See on Vehicles" preview button ── */}
          {showcaseImages.length > 0 && (
            <button
              onClick={() => {
                document.getElementById("showcase-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-3 flex items-center gap-3 w-full rounded-lg overflow-hidden transition-all hover:opacity-90"
              style={{
                border: "1px solid #1A1A1A",
                background: "var(--color-surface-2)",
                padding: "6px 12px 6px 6px",
              }}
            >
              <div
                className="relative flex-shrink-0 rounded overflow-hidden"
                style={{ width: "56px", height: "42px" }}
              >
                <Image
                  src={showcaseImages[0].src}
                  alt={showcaseImages[0].alt}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
                  See on Vehicles
                </span>
                <span className="block text-[10px] text-white/40 mt-0.5">
                  {showcaseImages.length} preview{showcaseImages.length > 1 ? "s" : ""}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 flex-shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

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

          {/* Share / copy link */}
          <button
            onClick={async () => {
              const url = window.location.href;
              // Try native share on mobile, fall back to clipboard
              if (navigator.share) {
                try {
                  await navigator.share({ title, url });
                  return;
                } catch {
                  // User cancelled or share failed — fall through to clipboard
                }
              }
              await navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] rounded transition-colors"
            style={{
              height: "48px",
              border: "1px solid var(--color-border)",
              color: copiedLink ? "var(--color-success)" : "var(--color-text-muted)",
              background: "transparent",
            }}
          >
            {copiedLink ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Link Copied
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share
              </>
            )}
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

      {/* ── "See it on your ride" showcase ── */}
      {showcaseImages.length > 0 && (
        <div id="showcase-section" className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-10 lg:pb-16">
          <div style={{ borderTop: "1px solid #1A1A1A" }} className="pt-8 lg:pt-12">
            <div className="flex items-end justify-between mb-5 lg:mb-8">
              <div>
                <span
                  className="text-label"
                  style={{ color: "var(--color-accent)" }}
                >
                  Preview
                </span>
                <h2 className="text-display-sm text-white mt-1">
                  See It on Your Ride
                </h2>
              </div>
              <p className="text-body-sm hidden sm:block" style={{ color: "#555" }}>
                AI-generated previews · Actual print may vary
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {showcaseImages.map((img, i) => (
                <div
                  key={img.src + i}
                  className="relative overflow-hidden rounded-lg"
                  style={{
                    aspectRatio: "4/3",
                    border: "1px solid #1A1A1A",
                    background: "var(--color-surface-2)",
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div
                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest text-white/60"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {img.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-body-sm mt-3 sm:hidden" style={{ color: "#555" }}>
              AI-generated previews · Actual print may vary
            </p>
          </div>
        </div>
      )}

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
