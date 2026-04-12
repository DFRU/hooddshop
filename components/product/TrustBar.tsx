export default function TrustBar() {
  const items = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ),
      label: "Secure Checkout",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 18H3a2 2 0 01-2-2V8a2 2 0 012-2h3.19M15 6h2a2 2 0 012 2v1M21 14v2a2 2 0 01-2 2h-5" />
          <path d="M12 12L8 6h8l-4 6z" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="17.5" cy="18" r="1.5" />
        </svg>
      ),
      label: "Free Ship $99+",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      label: "Made to Order",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      label: "Satisfaction Guaranteed",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-2 mt-5 pt-5"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 py-1.5"
        >
          <span style={{ color: "var(--color-accent)" }}>{item.icon}</span>
          <span className="text-[11px] text-neutral-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
