"use client";

import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateQuantity, removeItem, isLoading } = useCart();

  if (!isOpen) return null;

  const lines = cart?.lines?.edges || [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[150] bg-black/60" onClick={closeCart} />

      {/* Bottom sheet (mobile) / Side drawer (desktop) */}
      <div
        className="fixed z-[160] flex flex-col safe-bottom
          bottom-0 left-0 right-0 rounded-t-2xl
          lg:top-0 lg:bottom-0 lg:left-auto lg:right-0 lg:w-[400px] lg:h-full lg:rounded-none"
        style={{
          background: "#0D0D0D",
          borderTop: "1px solid #1F1F1F",
          maxHeight: "85vh",
          animation: "slide-up 0.3s ease-out",
        }}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#444" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 lg:px-6 py-4 lg:py-5"
          style={{ borderBottom: "1px solid #1A1A1A" }}
        >
          <h2 className="text-display-sm text-white">
            Cart ({cart?.totalQuantity || 0})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-neutral-500 hover:text-white transition-colors touch-active"
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
          {lines.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
              </svg>
              <p className="text-sm" style={{ color: "#555" }}>Your cart is empty</p>
            </div>
          ) : (
            lines.map(({ node: line }) => {
              const product = line.merchandise.product;
              const image = product.images.edges[0]?.node;
              const price = parseFloat(line.merchandise.price.amount);
              return (
                <div
                  key={line.id}
                  className="flex gap-3 p-3 rounded-lg"
                  style={{ background: "#111", border: "1px solid #1A1A1A" }}
                >
                  {image && (
                    <div className="w-16 h-14 lg:w-20 lg:h-16 rounded overflow-hidden flex-shrink-0" style={{ background: "var(--color-surface-2)" }}>
                      <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{product.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center rounded" style={{ border: "1px solid #222" }}>
                        <button
                          onClick={() => updateQuantity(line.id, Math.max(0, line.quantity - 1))}
                          disabled={isLoading}
                          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-white text-base touch-active"
                        >
                          −
                        </button>
                        <span className="px-1.5 text-white text-sm min-w-[20px] text-center">{line.quantity}</span>
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity + 1)}
                          disabled={isLoading}
                          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-white text-base touch-active"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-white text-sm font-medium">${(price * line.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(line.id)}
                    disabled={isLoading}
                    className="p-2 text-neutral-700 hover:text-red-500 transition-colors self-start touch-active"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="px-5 lg:px-6 py-4 lg:py-5 space-y-3" style={{ borderTop: "1px solid #1A1A1A" }}>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Subtotal</span>
              <span className="text-white font-semibold">
                ${parseFloat(cart?.cost?.subtotalAmount?.amount || "0").toFixed(2)}
              </span>
            </div>
            <a
              href={cart?.checkoutUrl || "#"}
              className="flex items-center justify-center w-full text-white font-semibold text-[13px] uppercase tracking-[0.08em] rounded transition-all touch-active"
              style={{ background: "var(--color-accent)", minHeight: "52px" }}
            >
              Checkout
            </a>
            <p className="text-[11px] text-center" style={{ color: "#444" }}>
              Shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
