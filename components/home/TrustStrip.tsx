/**
 * Homepage trust signal strip — shows key buying reassurances
 * between hero and product grid.
 */
export default function TrustStrip() {
  const signals = [
    { icon: "🚚", text: "Free Shipping $99+" },
    { icon: "🛡️", text: "Satisfaction Guaranteed" },
    { icon: "☀️", text: "UV & Weather Resistant" },
    { icon: "🧼", text: "Machine Washable" },
    { icon: "🌍", text: "Ships Worldwide" },
  ];

  return (
    <section
      className="py-4 lg:py-5 overflow-x-auto scrollbar-hide"
      style={{ borderTop: "1px solid #151515", borderBottom: "1px solid #151515", background: "#0C0C0C" }}
    >
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex items-center justify-between gap-6 lg:gap-0 min-w-max lg:min-w-0">
          {signals.map((s) => (
            <div key={s.text} className="flex items-center gap-2">
              <span className="text-base">{s.icon}</span>
              <span className="text-[11px] lg:text-xs uppercase tracking-[0.08em] font-medium whitespace-nowrap" style={{ color: "#777" }}>
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
