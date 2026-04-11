"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { NATIONS, type Region } from "@/lib/nations";
import { DESIGN_LINES, type DesignLine } from "@/lib/design";
import ProductCard from "@/components/shop/ProductCard";
import ShopifyProductCard from "@/components/shop/ShopifyProductCard";
import type { ShopifyProduct, PageInfo } from "@/types/shopify";

const REGIONS: (Region | "All")[] = [
  "All",
  "Americas",
  "Europe",
  "Africa",
  "Asia-Pacific",
  "Middle East",
];

const SORT_OPTIONS = [
  { label: "Best Selling", value: "BEST_SELLING" },
  { label: "Newest", value: "CREATED_AT" },
  { label: "Price: Low → High", value: "PRICE_ASC" },
  { label: "Price: High → Low", value: "PRICE_DESC" },
] as const;

interface ShopClientProps {
  initialShopifyProducts: ShopifyProduct[];
  initialPageInfo: PageInfo;
}

export default function ShopClient({
  initialShopifyProducts,
  initialPageInfo,
}: ShopClientProps) {
  const searchParams = useSearchParams();
  const initialDesign = searchParams.get("design") || "All";

  const hasShopifyProducts = initialShopifyProducts.length > 0;

  // ── Shopify product state ──────────────────────────────
  const [shopifyProducts, setShopifyProducts] = useState(
    initialShopifyProducts
  );
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState("BEST_SELLING");

  // ── Fallback filter state (NATIONS × DESIGN_LINES) ────
  const [region, setRegion] = useState<Region | "All">("All");
  const [search, setSearch] = useState("");
  const [designFilter, setDesignFilter] = useState<DesignLine | "All">(
    DESIGN_LINES.includes(initialDesign as DesignLine)
      ? (initialDesign as DesignLine)
      : "All"
  );
  const [showCount, setShowCount] = useState(24);

  // Fallback products from NATIONS grid
  const filtered = NATIONS.filter((n) => {
    if (region !== "All" && n.region !== region) return false;
    if (search && !n.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const fallbackProducts = filtered.flatMap((nation) => {
    const designs =
      designFilter === "All" ? [...DESIGN_LINES] : [designFilter];
    return designs.map((design) => ({
      nation,
      design: design as DesignLine,
    }));
  });

  // ── Shopify "Load More" handler ────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const url = `/api/products?after=${pageInfo.endCursor}&sortKey=${sortKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setShopifyProducts((prev) => [...prev, ...data.products]);
        setPageInfo(data.pageInfo);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [pageInfo, sortKey, loadingMore]);

  // ── Sort handler ───────────────────────────────────────
  const handleSortChange = async (newSortKey: string) => {
    setSortKey(newSortKey);
    // For Shopify products, refetch with new sort
    if (hasShopifyProducts) {
      try {
        const reverse = newSortKey === "PRICE_DESC" ? "true" : "false";
        const key =
          newSortKey === "PRICE_ASC" || newSortKey === "PRICE_DESC"
            ? "PRICE"
            : newSortKey;
        const res = await fetch(
          `/api/products?sortKey=${key}&reverse=${reverse}`
        );
        if (res.ok) {
          const data = await res.json();
          setShopifyProducts(data.products);
          setPageInfo(data.pageInfo);
        }
      } catch {
        // Keep current products on error
      }
    }
  };

  const displayProducts = hasShopifyProducts ? shopifyProducts : [];
  const totalCount = hasShopifyProducts
    ? shopifyProducts.length
    : fallbackProducts.length;

  return (
    <div className="min-h-screen pt-14">
      {/* Header */}
      <div
        className="py-8 lg:py-12 px-[var(--container-px)] lg:px-[var(--container-px-lg)] max-w-[var(--max-width)] mx-auto"
        style={{ borderBottom: "1px solid #151515" }}
      >
        <span className="text-label" style={{ color: "var(--color-accent)" }}>
          Collection
        </span>
        <h1 className="text-display-lg text-white mt-1">Shop All</h1>
        <p className="text-body-sm mt-2" style={{ color: "#888" }}>
          {totalCount} {hasShopifyProducts ? "products" : "designs"}{" "}
          {!hasShopifyProducts && `· ${filtered.length} nations`}
        </p>
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
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search nations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-white text-sm placeholder:text-neutral-600 focus:outline-none"
                style={{
                  background: "#141414",
                  border: "1px solid #222",
                  minHeight: "44px",
                }}
              />
            </div>
            {/* Sort dropdown */}
            <select
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value)}
              className="hidden lg:block px-3 py-2.5 rounded-lg text-white text-sm focus:outline-none"
              style={{
                background: "#141414",
                border: "1px solid #222",
                minHeight: "44px",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3.5 py-2 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors touch-active ${
                  region === r ? "text-white" : "text-neutral-500"
                }`}
                style={
                  region === r
                    ? { background: "var(--color-accent)" }
                    : { background: "#161616" }
                }
              >
                {r}
              </button>
            ))}
            <div
              className="w-px flex-shrink-0"
              style={{ background: "#333" }}
            />
            {(["All", ...DESIGN_LINES] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDesignFilter(d as DesignLine | "All")}
                className={`px-3.5 py-2 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors touch-active ${
                  designFilter === d ? "bg-white text-black" : "text-neutral-500"
                }`}
                style={designFilter !== d ? { background: "#161616" } : {}}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] py-6 lg:py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
          {hasShopifyProducts
            ? displayProducts.map((product) => (
                <ShopifyProductCard key={product.id} product={product} />
              ))
            : fallbackProducts
                .slice(0, showCount)
                .map(({ nation, design }) => (
                  <ProductCard
                    key={`${nation.code}-${design}`}
                    nation={nation}
                    design={design}
                  />
                ))}
        </div>

        {/* Load More */}
        {hasShopifyProducts
          ? pageInfo.hasNextPage && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full sm:w-auto px-8 py-3.5 text-white text-[13px] font-semibold uppercase tracking-[0.08em] rounded transition-colors touch-active disabled:opacity-50"
                  style={{ border: "1px solid #333", minHeight: "48px" }}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )
          : fallbackProducts.length > showCount && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowCount((c) => c + 24)}
                  className="w-full sm:w-auto px-8 py-3.5 text-white text-[13px] font-semibold uppercase tracking-[0.08em] rounded transition-colors touch-active"
                  style={{ border: "1px solid #333", minHeight: "48px" }}
                >
                  Load More ({fallbackProducts.length - showCount})
                </button>
              </div>
            )}
      </div>
    </div>
  );
}
