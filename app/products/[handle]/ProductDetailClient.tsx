"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import FulfillmentSelector from "@/components/product/FulfillmentSelector";
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
  /** Mockup/vehicle images for "See it on your ride" section (default set) */
  showcaseImages?: ShowcaseImage[];
  /** Per-design showcase sets keyed by design label. "_default" = fallback. */
  showcaseMap?: Record<string, ShowcaseImage[]>;
  /** Shopify variant GID from ?variant= URL param, resolved server-side. */
  initialVariantId?: string;
}

// ── Component ─────────────────────────────────────────────────
export default function ProductDetailClient({
  product,
  handle,
  showcaseImages = [],
  showcaseMap = {},
  initialVariantId,
}: ProductDetailClientProps) {
  const { addItem, isLoading } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] =
    useState<FulfillmentOption | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ── Variants ──────────────────────────────────────────────
  const variants: ShopifyVariant[] = useMemo(
    () => product?.variants?.edges?.map((e) => e.node) ?? [],
    [product]
  );

  // Selected variant — user can choose which design to purchase
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialVariantId ?? variants[0]?.id ?? ""
  );

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null,
    [variants, selectedVariantId]
  );

  // Map between gallery image labels and variant option values
  // Alt text labels on Shopify images → Shopify variant option value
  const labelToVariantOption: Record<string, string> = {
    "Original Design": "Jersey",           // The original jersey-inspired design
    "Home Jersey Design": "Home",
    "Away Jersey Design": "Away",
    "Flag Inspired Design": "Flag",
    "Jersey Inspired Full Name": "Full",
    "Jersey Inspired Abbreviated": "Abbrev",
    // Direct matches (variant title used as label)
    "Jersey": "Jersey",
    "Home": "Home",
    "Away": "Away",
    "Flag": "Flag",
    "Full": "Full",
    "Abbrev": "Abbrev",
  };

  // Reverse: variant option value → which gallery labels to look for
  const variantOptionToLabel: Record<string, string[]> = {
    "Home": ["Home Jersey Design", "Home"],
    "Away": ["Away Jersey Design", "Away"],
    "Flag": ["Flag Inspired Design", "Flag"],
    "Full": ["Jersey Inspired Full Name", "Full"],
    "Abbrev": ["Jersey Inspired Abbreviated", "Abbrev"],
    "Jersey": ["Original Design", "Jersey"],
  };

  // When variant changes, sync gallery to show matching design image
  useEffect(() => {
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;
    const optionValue = variant.selectedOptions?.find((o) => o.name === "Design")?.value ?? variant.title;
    const matchLabels = variantOptionToLabel[optionValue] ?? [optionValue];
    const idx = galleryImages.findIndex((img) =>
      img.label && matchLabels.includes(img.label)
    );
    if (idx >= 0 && idx !== activeImageIndex) {
      setActiveImageIndex(idx);
    }
  }, [selectedVariantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFulfillmentSelect = useCallback((option: FulfillmentOption) => {
    setSelectedFulfillment(option);
  }, []);

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

  // Resolve showcase images for the currently active design
  // If per-design mockups exist for this label, use them; otherwise fall back to _default
  const activeShowcaseImages = useMemo(() => {
    const label = activeImage?.label;
    if (label && showcaseMap[label]) {
      return showcaseMap[label];
    }
    return showcaseMap._default ?? showcaseImages;
  }, [activeImage?.label, showcaseMap, showcaseImages]);

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
                  onClick={() => {
                    setActiveImageIndex(i);
                    // Also select the matching variant when thumbnail is clicked
                    const label = galleryImages[i]?.label;
                    if (label) {
                      const optionValue = labelToVariantOption[label];
                      if (optionValue) {
                        const matchVariant = variants.find((v) =>
                          v.selectedOptions?.some((o) => o.name === "Design" && o.value === optionValue)
                        );
                        if (matchVariant) setSelectedVariantId(matchVariant.id);
                      }
                    }
                  }}
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

          {/* ── Design variant selector ── */}
          {variants.length > 1 && (
            <div className="mt-4">
              <label className="text-[11px] uppercase tracking-widest font-semibold text-white/60 mb-2 block">
                Design: {selectedVariant?.selectedOptions?.find((o) => o.name === "Design")?.value ?? selectedVariant?.title ?? ""}
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const designName = v.selectedOptions?.find((o) => o.name === "Design")?.value ?? v.title;
                  const isActive = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className="px-3 py-2 rounded text-[12px] font-medium transition-all"
                      style={{
                        background: isActive ? "var(--color-accent)" : "var(--color-surface-2)",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                        border: isActive ? "1px solid var(--color-accent)" : "1px solid #333",
                      }}
                    >
                      {designName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Vehicle mockup showcase (inline, below variant selector) ── */}
          {activeShowcaseImages.length > 0 && (
            <div id="showcase-section" className="mt-5">
              <div className="flex items-end justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  See It on Your Ride
                </span>
                <span className="text-[10px] text-white/30">
                  {activeShowcaseImages.length} preview{activeShowcaseImages.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeShowcaseImages.map((img, i) => (
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
                      sizes="(max-width: 1024px) 45vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div
                      className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest text-white/60"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      {img.label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: "#444" }}>
                AI-generated previews · Actual print may vary
              </p>
            </div>
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

          {/* Size info */}
          <div
            className="mt-5 rounded-lg p-4"
            style={{ background: "var(--color-surface-2)", border: "1px solid #1A1A1A" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 3v18" />
              </svg>
              <span className="text-[12px] font-semibold uppercase tracking-widest text-white">
                Size &amp; Fit
              </span>
            </div>
            <div className="space-y-2 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              <div className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  Standard
                </span>
                <span>
                  63&quot; &times; 47&quot; (160 &times; 120 cm) &mdash; fits most sedans, compact SUVs, and coupes
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                  style={{ background: "#333", color: "#888" }}
                >
                  XL
                </span>
                <span>
                  68&quot; &times; 55&quot; (172 &times; 140 cm) &mdash; for trucks, full-size SUVs, and larger sedans.{" "}
                  <span style={{ color: "var(--color-accent)" }}>Coming late April 2026.</span>
                </span>
              </div>
            </div>
          </div>

          <FulfillmentSelector onSelect={handleFulfillmentSelect} />

          {/* Safety acknowledgment checkbox */}
          <label className="mt-6 flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safetyAcknowledged}
              onChange={(e) => setSafetyAcknowledged(e.target.checked)}
              className="mt-1 flex-shrink-0 w-4 h-4 rounded accent-[var(--color-accent)]"
            />
            <span className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              I acknowledge that car hood covers are decorative accessories.
              I accept responsibility for proper installation and safe use,
              including risks associated with driving at high speeds or in
              adverse weather. I have read the{" "}
              <a href="/terms" target="_blank" className="underline" style={{ color: "var(--color-accent)" }}>
                Terms of Service
              </a>{" "}
              including the Product Safety &amp; Assumption of Risk section.
            </span>
          </label>

          {/* Desktop add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !selectedVariant || !safetyAcknowledged}
            className="mt-3 w-full text-white font-semibold uppercase tracking-[0.06em] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: addedFeedback
                ? "var(--color-success)"
                : safetyAcknowledged
                ? "var(--color-accent)"
                : "#333",
              height: "56px",
            }}
          >
            {addedFeedback
              ? "\u2713 Added"
              : !safetyAcknowledged
              ? "Accept Terms to Continue"
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
          disabled={isLoading || !selectedVariant || !safetyAcknowledged}
          className="text-white font-semibold uppercase tracking-[0.06em] rounded px-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: addedFeedback
              ? "var(--color-success)"
              : safetyAcknowledged
              ? "var(--color-accent)"
              : "#333",
            height: "52px",
            width: "60%",
          }}
        >
          {addedFeedback
            ? "\u2713 Added"
            : !safetyAcknowledged
            ? "Accept Terms"
            : selectedVariant
            ? "Add to Cart"
            : "Coming Soon"}
        </button>
      </div>
    </>
  );
}
