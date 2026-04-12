"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import FulfillmentSelector from "@/components/product/FulfillmentSelector";
import TrustBar from "@/components/product/TrustBar";
import HoodPreview from "@/components/product/HoodPreview";
import type { FulfillmentOption } from "@/lib/suppliers/types";
import type { ShopifyProduct } from "@/types/shopify";

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
      "Standard size: 63\" × 47\" (160 × 120 cm). Fits most sedans, compact SUVs, and coupes. Elastic edge provides 15-25% stretch tolerance. Does not fit micro cars or hoods under 36\" wide. Universal fit — no vehicle selection required.",
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
interface ProductDetailClientProps {
  product: ShopifyProduct | null;
  handle: string;
}

// ── Component ─────────────────────────────────────────────────
export default function ProductDetailClient({
  product,
  handle,
}: ProductDetailClientProps) {
  const { addItem, isLoading } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] =
    useState<FulfillmentOption | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleFulfillmentSelect = useCallback((option: FulfillmentOption) => {
    setSelectedFulfillment(option);
  }, []);

  // ── Derived data ──────────────────────────────────────────
  const images = product?.images?.edges?.map((e) => e.node) ?? [];
  const variants = product?.variants?.edges?.map((e) => e.node) ?? [];
  const firstVariant = variants[0] ?? null;
  const shopifyPrice = firstVariant
    ? parseFloat(firstVariant.price.amount)
    : null;

  const displayPrice = shopifyPrice ?? 49.99;
  const currencyCode = firstVariant?.price?.currencyCode ?? "USD";
  const title = product?.title ?? `Hood Cover — ${handle}`;
  const descriptionHtml = product?.descriptionHtml ?? null;
  const description =
    product?.description ??
    "Premium stretch-fit car hood cover with full-bleed sublimation print. 85-90% polyester / 10-15% spandex. Universal fit with elastic sewn-in edge.";

  // ── Gallery scroll observer ───────────────────────────────
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || images.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index ?? 0
            );
            setActiveImageIndex(idx);
          }
        }
      },
      { root: gallery, threshold: 0.6 }
    );

    const slides = gallery.querySelectorAll("[data-index]");
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [images.length]);

  // ── Add to cart handler ───────────────────────────────────
  const handleAddToCart = async () => {
    if (!firstVariant) return;

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

    await addItem(firstVariant.id, 1, attributes);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1000);
  };

  // ── Placeholder if no product + no Shopify ────────────────
  const hasImages = images.length > 0;

  return (
    <>
      {/* Hood Preview — Desktop */}
      <div className="hidden lg:block border-t border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-[var(--max-width)] mx-auto px-8 py-4">
          <HoodPreview imageUrl={images[0]?.url ?? "/placeholder-hood.jpg"} productTitle={title} />
        </div>
      </div>

      <div className="lg:flex lg:gap-0 max-w-[var(--max-width)] mx-auto">
        {/* ── Image gallery with CSS scroll-snap ── */}
        <div className="lg:w-[60%]">
          {hasImages ? (
            <div
              ref={galleryRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {images.map((img, i) => (
                <div
                  key={img.url}
                  data-index={i}
                  className="flex-shrink-0 w-full snap-center relative"
                  style={{ aspectRatio: "4/3" }}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="relative w-full"
              style={{
                aspectRatio: "4/3",
                background: "var(--color-surface-2)",
              }}
            >
              <div className="flex items-center justify-center h-full">
                <span
                  className="text-label"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Product image available when store is live
                </span>
              </div>
            </div>
          )}

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 py-3">
            {(hasImages ? images : [0, 1, 2]).map((_, i) => (
              <button
                key={i}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => {
                  galleryRef.current
                    ?.querySelectorAll("[data-index]")
                    [i]?.scrollIntoView({
                      behavior: "smooth",
                      inline: "center",
                    });
                }}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  background:
                    i === activeImageIndex
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                }}
              />
            ))}
          </div>

          {/* Hood Preview Visualization */}
          <div className="lg:hidden">
            <HoodPreview imageUrl={images[0]?.url ?? "/placeholder-hood.jpg"} productTitle={title} />
          </div>
        </div>

        {/* ── Product info — desktop sticky ── */}
        <div className="px-[var(--container-px)] lg:px-8 lg:w-[40%] lg:sticky lg:top-[68px] lg:self-start">
          <div className="py-6">
            <h1 className="text-display-lg text-white">{title}</h1>
            <p
              className="text-body-lg font-semibold mt-2"
              style={{ color: "var(--color-accent)" }}
            >
              ${displayPrice.toFixed(2)} USD
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

            <FulfillmentSelector onSelect={handleFulfillmentSelect} />

            {/* Desktop add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={isLoading || !firstVariant}
              className="hidden lg:block mt-6 w-full text-white font-semibold uppercase tracking-[0.06em] rounded-none transition-colors disabled:opacity-50"
              style={{
                background: addedFeedback
                  ? "var(--color-success)"
                  : "var(--color-accent)",
                height: "56px",
              }}
            >
              {addedFeedback
                ? "\u2713 Added"
                : firstVariant
                ? "Add to Cart"
                : "Coming Soon"}
            </button>

            <TrustBar />
          </div>

          {/* ── Accordion sections ── */}
          <div className="pb-24 lg:pb-8">
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
            ${displayPrice.toFixed(2)}
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
          disabled={isLoading || !firstVariant}
          className="text-white font-semibold uppercase tracking-[0.06em] rounded-none px-8 transition-colors disabled:opacity-50"
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
            : firstVariant
            ? "Add to Cart"
            : "Coming Soon"}
        </button>
      </div>

    </>
  );
}
