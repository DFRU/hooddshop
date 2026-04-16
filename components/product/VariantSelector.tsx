"use client";

/**
 * Segmented control for selecting a product variant (e.g. Home / Away).
 * Only renders when there are 2+ options. Single-variant products
 * (pre-migration or single-design) render nothing.
 */
interface VariantOption {
  value: string;      // e.g. "Home", "Away"
  variantId: string;  // Shopify variant GID
}

interface VariantSelectorProps {
  label: string;                          // Option axis label, e.g. "Design"
  options: VariantOption[];
  selectedValue: string;
  onChange: (value: string, variantId: string) => void;
}

export default function VariantSelector({
  label,
  options,
  selectedValue,
  onChange,
}: VariantSelectorProps) {
  if (options.length < 2) return null;

  return (
    <div className="mt-6">
      <p
        className="text-body-sm font-semibold uppercase tracking-[0.08em] mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <div
        className="inline-flex rounded-lg overflow-hidden"
        role="radiogroup"
        aria-label={`Select ${label}`}
        style={{ border: "1px solid var(--color-border)" }}
      >
        {options.map((opt) => {
          const isActive = opt.value === selectedValue;
          return (
            <button
              key={opt.variantId}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value, opt.variantId)}
              className="px-6 font-semibold uppercase tracking-[0.04em] transition-colors"
              style={{
                height: "44px",
                minWidth: "100px",
                background: isActive ? "var(--color-accent)" : "transparent",
                color: isActive ? "#fff" : "var(--color-text-muted)",
                fontSize: "0.875rem",
              }}
            >
              {opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
