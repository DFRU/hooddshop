"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NATIONS, type Region } from "@/lib/nations";
import { flagUrl } from "@/lib/design";

/** Nations with real product photography available at /vehicles/{code}_product.webp */
const PRODUCT_PHOTO_CODES = new Set([
  "ar", "at", "au", "ba", "be", "br", "ca", "cd", "ch", "ci", "co", "cv",
  "cw", "cz", "de", "dz", "ec", "eg", "es", "fr", "gb-eng", "gb-sct", "gh",
  "hr", "ht", "iq", "ir", "jo", "jp", "kr", "ma", "mx", "nl", "no", "nz",
  "pa", "pt", "py", "qa", "sa", "se", "sn", "tn", "tr", "us", "uy", "uz", "za",
]);

const REGIONS: (Region | "All")[] = ["All", "Americas", "Europe", "Africa", "Asia-Pacific", "Middle East"];

interface NationsClientProps {
  nationProductMap: Record<string, { handle: string; imageUrl: string | null }>;
}

export default function NationsClient({ nationProductMap }: NationsClientProps) {
  const [region, setRegion] = useState<Region | "All">("All");
  const [search, setSearch] = useState("");

  const filtered = NATIONS.filter((n) => {
    if (region !== "All" && n.region !== region) return false;
    if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-14">
      <div
        className="py-8 lg:py-12 px-[var(--container-px)] lg:px-[var(--container-px-lg)] max-w-[var(--max-width)] mx-auto"
        style={{ borderBottom: "1px solid #151515" }}
      >
        <span className="text-label" style={{ color: "var(--color-accent)" }}>World Cup 2026</span>
        <h1 className="text-display-lg text-white mt-1">All Nations</h1>
        <p className="text-body-sm mt-2" style={{ color: "#888" }}>48 nations · Premium stretch-fit hood covers</p>
      </div>

      {/* Sticky filters */}
      <div
        className="sticky top-14 z-40"
        style={{
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #181818",
        }}
      >
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] py-2.5 space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search nations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-white text-sm placeholder:text-neutral-600 focus:outline-none"
              style={{ background: "#141414", border: "1px solid #222", minHeight: "44px" }}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-4 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors touch-active ${
                  region === r ? "text-white" : "text-neutral-500 hover:text-white"
                }`}
                style={region === r ? { background: "var(--color-accent)" } : { background: "#141414" }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] py-6 lg:py-10">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((n) => {
            const product = nationProductMap[n.code];
            const href = product
              ? `/products/${product.handle}`
              : `/nations/${n.code}`;

            return (
              <Link
                key={n.code}
                href={href}
                className="group relative overflow-hidden rounded-lg text-left touch-active"
                style={{ aspectRatio: "1", border: "1px solid #181818", background: "#111" }}
              >
                {/* Product photo if available, otherwise flag */}
                {PRODUCT_PHOTO_CODES.has(n.code) ? (
                  <Image
                    src={`/vehicles/${n.code}_product.webp`}
                    alt={`${n.name} hood cover`}
                    fill
                    className="object-cover group-hover:scale-110 transition-all duration-500"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  />
                ) : (
                  <img
                    src={flagUrl(n.code, 160)}
                    alt={n.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-55 group-hover:scale-110 transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3">
                  <span className="text-lg lg:text-2xl">{n.emoji}</span>
                  <div
                    className="text-sm lg:text-lg text-white tracking-wide mt-0.5 truncate"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {n.name}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
