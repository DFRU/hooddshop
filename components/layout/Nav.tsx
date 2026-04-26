"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import GoogleTranslate from "./GoogleTranslate";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart, openCart } = useCart();
  const pathname = usePathname();
  const itemCount = cart?.totalQuantity || 0;

  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/nations", label: "Nations" },
    { href: "/about", label: "About" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
        <Link href="/" className="flex items-center gap-2 touch-active">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white text-lg leading-none"
            style={{ background: "var(--color-accent)", fontFamily: "var(--font-display)" }}
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
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 text-[13px] font-medium transition-colors rounded-md ${
                isActive(l.href)
                  ? "text-white bg-white/10"
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Language selector */}
          <div className="hidden md:block">
            <GoogleTranslate />
          </div>
          {/* Cart — large touch target */}
          <button
            onClick={openCart}
            className="relative p-3 text-neutral-400 hover:text-white transition-colors touch-active"
            aria-label="Cart"
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
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-3 text-neutral-400 hover:text-white touch-active"
            aria-label="Menu"
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

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="fixed top-14 left-0 right-0 z-40 md:hidden"
          style={{
            borderTop: "1px solid #1A1A1A",
            background: "rgba(10,10,10,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block w-full text-left px-6 py-5 text-base font-medium touch-active ${
                isActive(l.href) ? "text-white bg-white/5" : "text-neutral-400"
              }`}
              style={{ borderBottom: "1px solid #141414" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
