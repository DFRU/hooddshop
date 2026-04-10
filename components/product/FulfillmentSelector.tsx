"use client";

import { useCallback, useEffect, useState } from "react";
import type { FulfillmentOption, SupplierRoutingResponse } from "@/lib/suppliers/types";

const COUNTRY_FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}",
  CA: "\u{1F1E8}\u{1F1E6}",
  GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}",
  FR: "\u{1F1EB}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}",
  BR: "\u{1F1E7}\u{1F1F7}",
  MX: "\u{1F1F2}\u{1F1FD}",
  IT: "\u{1F1EE}\u{1F1F9}",
  ES: "\u{1F1EA}\u{1F1F8}",
  NL: "\u{1F1F3}\u{1F1F1}",
  NZ: "\u{1F1F3}\u{1F1FF}",
  VN: "\u{1F1FB}\u{1F1F3}",
  CN: "\u{1F1E8}\u{1F1F3}",
};

const COUNTRY_NAME: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  BR: "Brazil",
  MX: "Mexico",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  NZ: "New Zealand",
  VN: "Vietnam",
  CN: "China",
};

interface FulfillmentSelectorProps {
  onSelect: (option: FulfillmentOption) => void;
}

export default function FulfillmentSelector({ onSelect }: FulfillmentSelectorProps) {
  const [options, setOptions] = useState<FulfillmentOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const fetchOptions = useCallback(async (country?: string) => {
    setLoading(true);
    try {
      const url = country
        ? `/api/suppliers/options?country=${country}`
        : "/api/suppliers/options";
      const resp = await fetch(url);
      const data: SupplierRoutingResponse = await resp.json();

      setOptions(data.fulfillment_options);
      setCountryCode(data.customer_location.country_code);

      const defaultId = data.default_option_id;
      setSelectedId(defaultId);

      const defaultOption = data.fulfillment_options.find(
        (o) => o.id === defaultId
      );
      if (defaultOption) {
        onSelect(defaultOption);
      }
    } catch {
      // Fallback handled by API
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSelect = (option: FulfillmentOption) => {
    setSelectedId(option.id);
    onSelect(option);
  };

  const handleCountryChange = (code: string) => {
    setShowCountryPicker(false);
    fetchOptions(code);
  };

  if (loading) {
    return (
      <div className="mt-4 mb-2 space-y-3">
        <div
          className="h-4 w-48 rounded animate-pulse"
          style={{ background: "var(--color-surface-2)" }}
        />
        <div
          className="h-20 rounded animate-pulse"
          style={{ background: "var(--color-surface-2)" }}
        />
        <div
          className="h-20 rounded animate-pulse"
          style={{ background: "var(--color-surface-2)" }}
        />
      </div>
    );
  }

  const flag = COUNTRY_FLAG[countryCode] || "\u{1F30D}";
  const countryName = COUNTRY_NAME[countryCode] || countryCode;

  return (
    <div className="mt-4 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          Shipping to: {flag} {countryName}
        </p>
        <button
          onClick={() => setShowCountryPicker(!showCountryPicker)}
          className="text-body-sm underline"
          style={{ color: "var(--color-accent)" }}
        >
          Change
        </button>
      </div>

      {/* Country picker */}
      {showCountryPicker && (
        <div className="mb-3">
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 text-body-sm rounded-none"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              height: "44px",
            }}
          >
            {Object.entries(COUNTRY_NAME)
              .sort(([, a], [, b]) => a.localeCompare(b))
              .map(([code, name]) => (
                <option key={code} value={code}>
                  {COUNTRY_FLAG[code] || ""} {name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Option cards */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-3 rounded transition-colors"
              style={{
                background: "var(--color-surface-2)",
                border: `2px solid ${
                  isSelected ? "var(--color-accent)" : "var(--color-border)"
                }`,
                minHeight: "44px",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Radio indicator */}
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: isSelected
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                    }}
                  >
                    {isSelected && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-body-sm font-semibold text-white">
                      {option.label}
                    </span>
                    {option.badge && (
                      <span
                        className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            option.badge === "Best Price"
                              ? "var(--color-success)"
                              : option.badge === "Fastest"
                              ? "var(--color-accent)"
                              : "#2563eb",
                          color: "white",
                        }}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-body-sm font-semibold"
                  style={{ color: "var(--color-accent)" }}
                >
                  ${option.price_usd}
                </span>
              </div>
              <p
                className="text-body-sm mt-1 ml-6"
                style={{ color: "var(--color-text-muted)" }}
              >
                {option.description} &middot; {option.estimated_days_display}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
