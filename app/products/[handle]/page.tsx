"use client";

import { useCallback, useState } from "react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "@/components/layout/CartDrawer";
import FulfillmentSelector from "@/components/product/FulfillmentSelector";
import type { FulfillmentOption } from "@/lib/suppliers/types";

export default function ProductDetailPage() {
  const { addItem, isLoading } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentOption | null>(null);

  const handleFulfillmentSelect = useCallback((option: FulfillmentOption) => {
    setSelectedFulfillment(option);
  }, []);

  const displayPrice = selectedFulfillment?.price_usd ?? 49.99;

  const handleAddToCart = async () => {
    // TODO: Use actual variant ID from Shopify
    // Cart attributes for fulfillment routing:
    // if (selectedFulfillment) {
    //   const attrs = [{
    //     key: "_fulfillment_option",
    //     value: JSON.stringify({
    //       supplier_id: selectedFulfillment.supplier_id,
    //       supplier_region: selectedFulfillment.supplier_region,
    //       label: selectedFulfillment.label,
    //       estimated_days: selectedFulfillment.estimated_days_display,
    //       price: selectedFulfillment.price_usd,
    //     }),
    //   }];
    //   await addItem(variantId, 1, attrs);
    // }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1000);
  };

  return (
    <>
      <div className="lg:flex lg:gap-0 max-w-[var(--max-width)] mx-auto">
        {/* Image gallery */}
        <div className="lg:w-[60%]">
          <div className="relative w-full" style={{ aspectRatio: "4/3", background: "var(--color-surface-2)" }}>
            <div className="flex items-center justify-center h-full">
              <span className="text-label" style={{ color: "var(--color-text-muted)" }}>
                [PRODUCT IMAGE — CONNECTS VIA SHOPIFY]
              </span>
            </div>
          </div>
          {/* Thumbnail dots */}
          <div className="flex justify-center gap-2 py-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: i === 0 ? "var(--color-accent)" : "var(--color-border)" }}
              />
            ))}
          </div>
        </div>

        {/* Product info — desktop sticky */}
        <div className="px-[var(--container-px)] lg:px-8 lg:w-[40%] lg:sticky lg:top-[68px] lg:self-start">
          <div className="py-6">
            <h1 className="text-display-lg text-white">Product Name</h1>
            <p className="text-body-lg font-semibold mt-2" style={{ color: "var(--color-accent)" }}>
              ${displayPrice} USD
            </p>
            <p className="text-body-md mt-4" style={{ color: "var(--color-text-muted)" }}>
              Premium stretch-fit car hood cover with sublimation print.
            </p>

            <FulfillmentSelector onSelect={handleFulfillmentSelect} />

            {/* Desktop add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="hidden lg:block mt-6 w-full text-white font-semibold uppercase tracking-[0.06em] rounded-none transition-colors"
              style={{
                background: addedFeedback ? "var(--color-success)" : "var(--color-accent)",
                height: "56px",
              }}
            >
              {addedFeedback ? "\u2713 Added" : "Add to Cart"}
            </button>
          </div>

          {/* Accordion sections */}
          <div className="pb-24 lg:pb-8">
            {[
              { title: "What's Included", content: "1x custom printed car hood cover with elastic edge for universal fit." },
              { title: "Fit Guide", content: "Fits standard car, SUV, truck and van hoods. Does not fit micro cars or hoods under 36\" wide. Universal fit \u2014 no vehicle selection required." },
              { title: "Care Instructions", content: "Machine wash cold, tumble dry low. Do not iron print area. Store flat or loosely folded." },
              { title: "Shipping", content: "Made to order. Ships within 5-7 business days. Worldwide delivery available." },
            ].map((section) => (
              <details key={section.title} className="group" style={{ borderTop: "1px solid var(--color-border)" }}>
                <summary className="flex items-center justify-between py-4 cursor-pointer text-body-md text-white min-h-[44px] list-none">
                  {section.title}
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{ color: "var(--color-text-muted)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </summary>
                <p className="pb-4 text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                  {section.content}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
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
          <p className="text-body-lg font-semibold" style={{ color: "var(--color-accent)" }}>${displayPrice}</p>
          <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>USD</p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="text-white font-semibold uppercase tracking-[0.06em] rounded-none px-8 transition-colors"
          style={{
            background: addedFeedback ? "var(--color-success)" : "var(--color-accent)",
            height: "52px",
            width: "60%",
          }}
        >
          {addedFeedback ? "\u2713 Added" : "Add to Cart"}
        </button>
      </div>

      <CartDrawer />
    </>
  );
}
