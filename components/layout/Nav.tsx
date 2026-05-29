"use client";

/**
 * CRO Redesign — Nav simplified per spec §6
 *
 * Target items (max 4 + cart):
 *   SHOP BY NATION | COMBINER | ABOUT | [Cart icon + count]
 *
 * Removed: Home, Shop (redundant with "SHOP BY NATION"), FAQ
 * Mobile: hamburger → full-screen overlay, Bebas Neue large type
 * Cart icon always visible in mobile header (not inside hamburger)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
// GoogleTranslate kept — not in the 4 nav items but not explicitly removed by spec
import GoogleTranslate from "./GoogleTranslate";

const NAV_LINKS = [
  { href: "/nations", label: "SHOP BY NATION" },
  { href: "/about", label: "ABOUT" },
] as const;

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart, openCart } = useCart();
  const pathname = usePathname();
  const itemCount = cart?.totalQuantity ?? 0;

  // Close overlay on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed top-0 left-0 right-0 z-50 h-14 lg:h-16 flex items-center justify-between px-4 lg:px-8"
        style={{
          background: "rgba(10,10,10,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #1F1F1F",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 touch-active" onClick={() => setMenuOpen(false)}>
          <div
            className="w-8 h-8 flex items-center justify-center text-white text-lg leading-none"
            style={{ background: "var(--color-accent)", borderRadius: "2px", fontFamily: "var(--font-display)" }}
          >
            H
          </div>
          <span
            className="text-2xl tracking-[0.06em] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HOOD&apos;D
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 text-[13px] font-medium tracking-[0.05em] transition-colors ${
                isActive(l.href)
                  ? "text-white"
                  : "text-neutral-500 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Language selector — desktop only */}
          <div className="hidden md:block">
            <GoogleTranslate />
          </div>

          {/* Cart — always visible, shows count badge when non-empty */}
          <button
            onClick={openCart}
            className="relative p-3 text-neutral-400 hover:text-white transition-colors touch-active"
            aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {itemCount > 0 && (
              <span
                className="absolute top-1 right-1 w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-3 text-neutral-400 hover:text-white touch-active"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay (spec §6: dark bg, large Bebas Neue type) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden flex flex-col"
          style={{ background: "rgba(10,10,10,0.98)", paddingTop: "56px" /* nav height */ }}
          aria-modal="true"
          role="dialog"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col justify-center flex-1 px-8 gap-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-5 touch-active"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 10vw, 3.5rem)",
                  letterSpacing: "0.04em",
                  color: isActive(l.href) ? "#FF4D00" : "#FFFFFF",
                  borderBottom: "1px solid #1A1A1A",
                  lineHeight: 1,
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
