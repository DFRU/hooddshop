"use client";

import { useState, useEffect } from "react";
import { isUSVisitor } from "@/lib/geo";

/**
 * "Made in the USA" badge — only renders for US visitors.
 * Uses the geo_country cookie set by middleware.
 *
 * Variants:
 *  - "badge": compact pill with flag icon (for product pages, specs)
 *  - "inline": text-only for use inside ticker or banners
 */
export default function MadeInUSA({
  variant = "badge",
  className = "",
}: {
  variant?: "badge" | "inline";
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isUSVisitor());
  }, []);

  if (!show) return null;

  if (variant === "inline") {
    return <span className={className}>MADE IN THE USA</span>;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
      }}
    >
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
        {/* Simplified US flag icon */}
        <rect width="16" height="12" rx="1" fill="#B22234" />
        <rect y="1.71" width="16" height="0.86" fill="#fff" />
        <rect y="3.43" width="16" height="0.86" fill="#fff" />
        <rect y="5.14" width="16" height="0.86" fill="#fff" />
        <rect y="6.86" width="16" height="0.86" fill="#fff" />
        <rect y="8.57" width="16" height="0.86" fill="#fff" />
        <rect y="10.29" width="16" height="0.86" fill="#fff" />
        <rect width="6.4" height="5.14" fill="#3C3B6E" />
      </svg>
      MADE IN THE USA
    </div>
  );
}
