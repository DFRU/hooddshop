"use client";

import { useState, useEffect } from "react";
import { isUSVisitor } from "@/lib/geo";

export default function Ticker() {
  const [usVisitor, setUsVisitor] = useState(false);

  useEffect(() => {
    setUsVisitor(isUSVisitor());
  }, []);

  const messages = [
    "WORLD CUP 2026",
    "YOUR RIDE. YOUR FLAG.",
    "112+ DESIGNS",
    "FREE SHIPPING $99+",
    "STRETCH-FIT",
    ...(usVisitor ? ["MADE IN THE USA"] : ["MADE TO ORDER"]),
  ];
  const doubled = [...messages, ...messages];

  return (
    <div className="overflow-hidden py-2" style={{ background: "var(--color-accent)" }}>
      <div className="flex whitespace-nowrap" style={{ animation: "marquee 30s linear infinite" }}>
        {doubled.map((m, i) => (
          <span
            key={i}
            className="text-[12px] tracking-[0.18em] text-white mx-6 flex items-center gap-2.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="w-1 h-1 bg-white/50 rounded-full" />
            {m === "MADE IN THE USA" && (
              <svg width="14" height="10" viewBox="0 0 16 12" fill="none" aria-hidden="true" className="mr-0.5">
                <rect width="16" height="12" rx="1" fill="#fff" />
                <rect width="16" height="12" rx="1" fill="#B22234" fillOpacity="0.9" />
                <rect y="1.71" width="16" height="0.86" fill="#fff" />
                <rect y="3.43" width="16" height="0.86" fill="#fff" />
                <rect y="5.14" width="16" height="0.86" fill="#fff" />
                <rect y="6.86" width="16" height="0.86" fill="#fff" />
                <rect y="8.57" width="16" height="0.86" fill="#fff" />
                <rect y="10.29" width="16" height="0.86" fill="#fff" />
                <rect width="6.4" height="5.14" fill="#3C3B6E" />
              </svg>
            )}
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
