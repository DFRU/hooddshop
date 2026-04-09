"use client";

import { useState, useMemo } from "react";
import { NATIONS, getNationsByRegion, type Nation, type Region } from "@/lib/nations";

interface NationFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (nation: Nation) => void;
  onClear: () => void;
}

const REGIONS: Region[] = ["Americas", "Europe", "Africa", "Asia-Pacific", "Middle East"];

export default function NationFilterSheet({
  isOpen,
  onClose,
  onSelect,
  onClear,
}: NationFilterSheetProps) {
  const [search, setSearch] = useState("");

  const byRegion = useMemo(() => getNationsByRegion(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return byRegion;
    const q = search.toLowerCase();
    const result: Record<Region, Nation[]> = {} as Record<Region, Nation[]>;
    for (const region of REGIONS) {
      const matches = (byRegion[region] || []).filter((n) =>
        n.name.toLowerCase().includes(q)
      );
      if (matches.length > 0) result[region] = matches;
    }
    return result;
  }, [search, byRegion]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[150] bg-black/60" onClick={onClose} />

      {/* Sheet — bottom sheet on mobile, dropdown panel on desktop */}
      <div
        className="fixed z-[160] flex flex-col overflow-hidden
          bottom-0 left-0 right-0 h-[85vh] rounded-t-[20px]
          lg:top-[130px] lg:bottom-auto lg:left-4 lg:right-auto lg:w-[400px] lg:max-h-[400px] lg:rounded-lg"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Handle (mobile only) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3">
          <h3 className="text-label text-white mb-3">FILTER BY NATION</h3>
          <input
            type="text"
            placeholder="Search a country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full rounded-lg px-4 min-h-[48px] text-body-md text-white outline-none"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
            }}
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {REGIONS.map((region) => {
            const nations = filtered[region];
            if (!nations || nations.length === 0) return null;
            return (
              <div key={region} className="mb-4">
                <p className="text-label mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {region.toUpperCase()}
                </p>
                {nations.map((nation) => (
                  <button
                    key={nation.code}
                    onClick={() => onSelect(nation)}
                    className="w-full text-left flex items-center gap-3 min-h-[44px] px-2 rounded hover:bg-[var(--color-surface-2)] transition-colors text-body-md text-white"
                  >
                    <span>{nation.emoji}</span>
                    <span>{nation.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Clear filter */}
        <div className="px-6 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={onClear}
            className="w-full text-center text-label min-h-[44px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            CLEAR FILTER
          </button>
        </div>
      </div>
    </>
  );
}
