"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import FulfillmentSelector from "@/components/product/FulfillmentSelector";
import TrustBar from "@/components/product/TrustBar";
import StickyAddToCart from "@/components/product/StickyAddToCart";

import type { FulfillmentOption } from "@/lib/suppliers/types";
import type { ShopifyProduct, ShopifyVariant } from "@/types/shopify";

// ── Accordion data ────────────────────────────────────────────
const ACCORDION_SECTIONS = [
  {
    title: "What's Included",
    content:
      "1x stretch polyester-spandex hood cover with elastic sewn-in edge. 2x elastic fastener straps with hooks for extra hold.",
  },
  {
    title: "Fit Guide",
    content:
      'Standard size: 63" × 47" (160 × 120 cm). Fits most sedans, compact SUVs, and coupes. Elastic edge provides 15–25% stretch tolerance. Does not fit micro cars or hoods under 36" wide. Universal fit — no vehicle selection required. If your hood has unusual geometry, DM us a side photo at @hooddshopnow before ordering.',
  },
  {
    title: "Care Instructions",
    content:
      "Machine wash cold on gentle cycle. Hang dry. Do not iron the print. Do not bleach. Store flat or loosely folded. Sublimation ink is permanent — will not crack, peel, or fade.",
  },
  {
    title: "Shipping",
    content:
      "Made to order. Production: 5–10 business days. Ships worldwide. Free shipping with code HOODDSHIP at checkout.",
  },
  {
    title: "About this product",
    content:
      "We're independent — not licensed by FIFA, federations, or kit makers. All designs are original, inspired by national flag color palettes. National team names are used for descriptive purposes only. Hood covers are decorative accessories for stationary display (tailgates, watch parties, parking lots). Take the cover off before driving — wind abrasion at speed is the only thing that can damage your paint.",
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
  const { addItem, isLoading, cart } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Pre-checked: button active on load. User can uncheck to decline (informed consent preserved).
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(true);
  // Description expand/collapse — 4-line clamp on mobile (spec §7.2)
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] =
    useState<FulfillmentOption | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
    "Stretch hood cover with full-bleed sublimation print. 85–90% polyester / 10–15% spandex. Universal fit with elastic sewn-in edge.";

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

  // Buy Now — add to cart then redirect directly to Shopify checkout
  const handleBuyNow = async () => {
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
    // Redirect to Shopify checkout — cart.checkoutUrl is always current after addItem
    // Use a small delay to allow cart state to propagate
    setTimeout(() => {
      const checkoutUrl = cart?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    }, 200);
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
          <button
            onClick={() => activeImage && setLightboxSrc(activeImage.src)}
            className="relative w-full overflow-hidden rounded-lg cursor-zoom-in"
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
          </button>

          {/* Thumbnail row */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {galleryImages.map((img, i) => (
                <button
                  key={img.src + i}
                  onClick={() => {
                    setActiveImageIndex(i);
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
              {/* Share button at end of gallery bar */}
              <button
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try { await navigator.share({ title, url }); return; } catch { /* cancelled */ }
                  }
                  await navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex-shrink-0 w-32 lg:w-40 h-16 lg:h-20 rounded flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-80 active:scale-95"
                style={{
                  border: copiedLink ? "2px solid var(--color-success)" : "2px solid var(--color-accent)",
                  background: copiedLink ? "rgba(34,197,94,0.1)" : "rgba(255,77,0,0.08)",
                }}
                aria-label="Share this design"
              >
                {copiedLink ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-success)" }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-accent)" }}>Share</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Vehicle mockup showcase (below gallery/thumbnail row) ── */}
          {activeShowcaseImages.length > 0 && (
            <div id="showcase-section" className="mt-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  See It on Your Ride
                </span>
                <span className="text-[10px] text-white/30">
                  {activeShowcaseImages.length} preview{activeShowcaseImages.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {activeShowcaseImages.map((img, i) => (
                  <button
                    key={img.src + i}
                    onClick={() => setLightboxSrc(img.src)}
                    className="relative overflow-hidden rounded-lg cursor-zoom-in group"
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
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 1024px) 45vw, 14vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div
                      className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest text-white/60"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      {img.label}
                    </div>
                    {/* Zoom hint */}
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: "#444" }}>
                AI-generated previews · Actual print may vary
              </p>
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

          {/* Order cutoff urgency — shows while June 4 cutoff is active */}
          {new Date() < new Date("2026-06-04T23:59:59-04:00") && (
            <div
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded"
              style={{ background: "rgba(255,77,0,0.08)", border: "1px solid rgba(255,77,0,0.2)" }}
            >
              <span style={{ fontSize: "14px" }}>⚡</span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "#FF4D00",
                  fontWeight: 500,
                }}
              >
                Order by June 4 — arrives before the June 11 opener
              </span>
            </div>
          )}

          {/* ── Design + Size variant selectors ── */}
          {variants.length > 1 && (() => {
            // Display label map: Shopify backend uses "Abbrev" and "Jersey";
            // brand pack uses "Full" and "Jersey-inspired" (per voice guide).
            // URL slugs and Shopify variant IDs are preserved — only the display changes.
            const displayDesignLabel = (raw: string): string => {
              if (raw === "Abbrev") return "Full";
              if (raw === "Jersey") return "Jersey-inspired";
              return raw;
            };

            // Pull the option axes the product actually has. Most products have at
            // minimum "Design"; XL rollout adds "Size" as a second axis.
            const getOpt = (v: typeof variants[number], name: string) =>
              v.selectedOptions?.find((o) => o.name === name)?.value;

            const designValues = Array.from(
              new Set(variants.map((v) => getOpt(v, "Design")).filter((x): x is string => !!x))
            );
            const sizeValues = Array.from(
              new Set(variants.map((v) => getOpt(v, "Size")).filter((x): x is string => !!x))
            );

            const selectedDesign = getOpt(selectedVariant!, "Design") ?? selectedVariant?.title ?? "";
            const selectedSize = getOpt(selectedVariant!, "Size") ?? (sizeValues[0] ?? "Standard");

            // Find the variant matching a (design, size) combo.
            const findVariant = (design: string, size: string) =>
              variants.find(
                (v) =>
                  (getOpt(v, "Design") ?? v.title) === design &&
                  (getOpt(v, "Size") ?? "Standard") === size
              ) ?? null;

            const selectDesign = (design: string) => {
              const match = findVariant(design, selectedSize) ?? findVariant(design, sizeValues[0] ?? "Standard");
              if (match) setSelectedVariantId(match.id);
            };
            const selectSize = (size: string) => {
              const match = findVariant(selectedDesign, size);
              if (match) setSelectedVariantId(match.id);
            };

            return (
              <>
                {/* Design axis */}
                {designValues.length > 1 && (
                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-widest font-semibold text-white/60 mb-2 block">
                      Design: {displayDesignLabel(selectedDesign)}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {designValues.map((design) => {
                        const isActive = design === selectedDesign;
                        return (
                          <button
                            key={design}
                            onClick={() => selectDesign(design)}
                            className="px-3 py-2 rounded text-[12px] font-medium transition-all"
                            style={{
                              background: isActive ? "var(--color-accent)" : "var(--color-surface-2)",
                              color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                              border: isActive ? "1px solid var(--color-accent)" : "1px solid #333",
                            }}
                          >
                            {displayDesignLabel(design)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size axis — only renders if the product has 2+ sizes */}
                {sizeValues.length > 1 && (
                  <div className="mt-4">
                    <label className="text-[11px] uppercase tracking-widest font-semibold text-white/60 mb-2 block">
                      Size: {selectedSize}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sizeValues.map((size) => {
                        const isActive = size === selectedSize;
                        const sizeDims =
                          size === "XL"
                            ? '68" × 55"'
                            : size === "Standard"
                              ? '63" × 47"'
                              : "";
                        return (
                          <button
                            key={size}
                            onClick={() => selectSize(size)}
                            className="px-3 py-2 rounded text-[12px] font-medium transition-all flex flex-col items-start"
                            style={{
                              background: isActive ? "var(--color-accent)" : "var(--color-surface-2)",
                              color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                              border: isActive ? "1px solid var(--color-accent)" : "1px solid #333",
                            }}
                          >
                            <span>{size}</span>
                            {sizeDims && (
                              <span className="text-[10px] opacity-70 mt-0.5">{sizeDims}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Product description — 4-line clamp on mobile, full on desktop (spec §7.2) */}
          {/* .desc-clamp applies -webkit-line-clamp:4 on mobile; disabled on md+ via globals.css */}
          <div className="mt-4">
            <div
              className={`product-description text-body-md${!descExpanded ? " desc-clamp" : ""}`}
              style={{ color: "var(--color-text-muted)" }}
            >
              {descriptionHtml ? (
                <span dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              ) : (
                description
              )}
            </div>
            {/* "Read more" — mobile only (md:hidden), disappears once expanded */}
            {!descExpanded && (
              <button
                className="mt-1 text-[13px] font-medium md:hidden touch-active"
                style={{ color: "var(--color-accent)", fontFamily: "var(--font-body)" }}
                onClick={() => setDescExpanded(true)}
                aria-label="Expand product description"
              >
                Read more
              </button>
            )}
          </div>

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
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  XL
                </span>
                <span>
                  68&quot; &times; 55&quot; (172 &times; 140 cm) &mdash; fits trucks, full-size SUVs, and larger sedans.
                </span>
              </div>
            </div>
          </div>

          <FulfillmentSelector onSelect={handleFulfillmentSelect} />

          {/* Safety disclosure — pre-checked, compact. User can uncheck to decline. */}
          <label
            id="safety-checkbox-label"
            className="mt-4 flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={safetyAcknowledged}
              onChange={(e) => setSafetyAcknowledged(e.target.checked)}
              className="flex-shrink-0 w-3.5 h-3.5 rounded accent-[var(--color-accent)]"
            />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#555" }}>
              Decorative use only — remove before driving.{" "}
              <a href="/terms" target="_blank" className="underline hover:text-white transition-colors" style={{ color: "#555" }}>
                Terms apply.
              </a>
            </span>
          </label>

          {/* Buy Now — skips cart, straight to Shopify checkout */}
          <button
            onClick={handleBuyNow}
            disabled={isLoading || !selectedVariant}
            className="mt-3 w-full font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "#FFFFFF",
              color: "#000000",
              height: "52px",
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              letterSpacing: "0.08em",
              borderRadius: "2px",
            }}
          >
            BUY NOW
          </button>

          {/* Inline add to cart \u2014 id required for StickyAddToCart IntersectionObserver */}
          <button
            id="atc-button-inline"
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

          {/* Sticky mobile ATC bar \u2014 appears when inline button scrolls out of view (spec \u00a77.1) */}
          <StickyAddToCart
            price={effectivePrice}
            onAddToCart={handleAddToCart}
            isLoading={isLoading}
            disabled={!selectedVariant || !safetyAcknowledged}
            addedFeedback={addedFeedback}
          />

          {/* ── Trust + urgency block ── */}
          {(() => {
            // Compute estimated delivery window from today
            const today = new Date();
            const minDate = new Date(today); minDate.setDate(today.getDate() + 7);
            const maxDate = new Date(today); maxDate.setDate(today.getDate() + 15);
            const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const deliveryRange = `${fmt(minDate)} – ${fmt(maxDate)}`;
            return (
              <div className="mt-4 space-y-3">
                {/* Delivery window */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ background: "rgba(255,77,0,0.07)", border: "1px solid rgba(255,77,0,0.15)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1" y="3" width="15" height="13" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#FF4D00" }}>
                    Order today — estimated delivery <strong>{deliveryRange}</strong>
                  </span>
                </div>

                {/* Money-back guarantee + secure */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#999" }}>
                      30-day returns
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#999" }}>
                      Secure checkout
                    </span>
                  </div>
                </div>

                {/* Payment icons */}
                <div className="flex items-center gap-2">
                  {["VISA", "MC", "AMEX", "PP"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-center px-2 rounded"
                      style={{
                        height: "22px",
                        minWidth: "36px",
                        background: "#1A1A1A",
                        border: "1px solid #2A2A2A",
                        fontFamily: "var(--font-body)",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "#888",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#555" }}>
                    + more
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Share — prominent inline button */}
          <button
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                try {
                  await navigator.share({ title, url });
                  return;
                } catch { /* cancelled */ }
              }
              await navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.06em] rounded transition-all"
            style={{
              height: "52px",
              fontSize: "14px",
              border: copiedLink ? "2px solid var(--color-success)" : "2px solid var(--color-accent)",
              color: copiedLink ? "var(--color-success)" : "var(--color-accent)",
              background: copiedLink ? "rgba(34,197,94,0.08)" : "rgba(255,77,0,0.06)",
            }}
          >
            {copiedLink ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Link Copied!
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share This Design
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

      {/* ── Image lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightboxSrc(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setLightboxSrc(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged image"
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors hover:bg-white/10"
            aria-label="Close enlarged image"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Tap anywhere text (mobile hint) */}
          <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-white/40 lg:hidden">
            Tap anywhere to close
          </p>

          {/* Image */}
          <div className="relative w-[90vw] h-[70vh] lg:w-[70vw] lg:h-[80vh]">
            <Image
              src={lightboxSrc}
              alt="Enlarged product view"
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        </div>
      )}

      {/* ── Floating share button (always visible) ── */}
      <button
        onClick={async () => {
          const url = window.location.href;
          if (navigator.share) {
            try {
              await navigator.share({ title, url });
              return;
            } catch { /* cancelled */ }
          }
          await navigator.clipboard.writeText(url);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }}
        className="fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          right: "16px",
          bottom: "100px",
          width: "52px",
          height: "52px",
          background: copiedLink ? "var(--color-success)" : "var(--color-accent)",
          color: "#fff",
        }}
        aria-label="Share this design"
      >
        {copiedLink ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>

    </>
  );
}
