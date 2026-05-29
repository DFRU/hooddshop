"use client";

/**
 * StickyAddToCart (spec §7.1)
 * - Mobile only: hidden on md+ (hidden md:hidden per spec note — Tailwind v4 correct form is `md:hidden`)
 * - Renders fixed to bottom of viewport
 * - Appears after user scrolls past the inline ATC button (IntersectionObserver)
 * - Contains: price (DM Sans, white) + "ADD TO CART" button (#FF4D00 bg, full-width)
 *
 * Usage: place in ProductDetailClient, pass the same selectedVariant + handlers.
 * The inline ATC button must have id="atc-button-inline" for the observer.
 */

import { useState, useEffect } from "react";

interface Props {
  price: number;
  onAddToCart: () => void;
  isLoading: boolean;
  disabled: boolean;
  addedFeedback: boolean;
}

export default function StickyAddToCart({
  price,
  onAddToCart,
  isLoading,
  disabled,
  addedFeedback,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const inlineBtn = document.getElementById("atc-button-inline");
    if (!inlineBtn) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the inline button is NOT visible
        setVisible(!entry.isIntersecting);
      },
      {
        // Trigger when the inline ATC button fully leaves viewport
        threshold: 0,
        rootMargin: "0px",
      }
    );

    observer.observe(inlineBtn);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    // md:hidden: display none on desktop; block on mobile only
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(10,10,10,0.97)",
        borderTop: "1px solid #1F1F1F",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Price */}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "16px",
            fontWeight: 600,
            color: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          ${price.toFixed(2)} USD
        </span>

        {/* Add to Cart */}
        <button
          onClick={onAddToCart}
          disabled={disabled || isLoading}
          className="flex-1 font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: addedFeedback
              ? "var(--color-success)"
              : disabled
              ? "#333"
              : "#FF4D00",
            color: "#FFFFFF",
            height: "48px",
            borderRadius: "2px",
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            letterSpacing: "0.08em",
          }}
          aria-label="Add to cart"
        >
          {addedFeedback
            ? "✓ Added"
            : isLoading
            ? "..."
            : disabled
            ? "Accept Terms to Continue"
            : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}
