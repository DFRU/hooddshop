/**
 * Homepage TrustBar.
 * Third item is World Cup deadline-aware while the tournament is upcoming,
 * reverts to generic shipping copy after June 11.
 * IMPORTANT: Uses real delivery data — 10-12 days typical door-to-door.
 */

const TOURNAMENT_START = new Date("2026-06-11T17:00:00Z");

function getDeliveryItem() {
  const now = new Date();
  const inTournamentWindow = now < TOURNAMENT_START;

  const icon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10V6a2 2 0 00-2-2H5a2 2 0 00-2 2v4" />
      <path d="M1 10h22v9a2 2 0 01-2 2H3a2 2 0 01-2-2v-9z" />
      <path d="M12 10v11M8 10v3M16 10v3" />
    </svg>
  );

  if (inTournamentWindow) {
    return {
      icon,
      label: "Typical Delivery 7–15 Days",
      sub: "Order now for World Cup 2026",
    };
  }

  return {
    icon,
    label: "Delivered in 7–15 Days",
    sub: "Printed on demand · ships worldwide",
  };
}

const BASE_TRUST_ITEMS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
        <rect x="9" y="11" width="14" height="10" rx="2" />
        <circle cx="12" cy="16" r="1" />
        <circle cx="20" cy="16" r="1" />
      </svg>
    ),
    label: "Universal Fit",
    sub: "Sedans, SUVs, trucks",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <path d="M17 8c2.5 1.5 4 4.5 4 8" />
        <path d="M3 16c0-3.5 1.5-6.5 4-8" />
        <path d="M7 22s0-4 5-4 5 4 5 4" />
        <path d="M3 16c0 3.5 2 6 9 6s9-2.5 9-6" />
      </svg>
    ),
    label: "Vibrant AOP Print",
    sub: "Sublimation quality",
  },
];

export default function TrustBar() {
  const deliveryItem = getDeliveryItem();
  const trustItems = [...BASE_TRUST_ITEMS, deliveryItem];

  return (
    <section
      aria-label="Key product benefits"
      style={{
        background: "#141414",
        borderTop: "1px solid #1A1A1A",
        borderBottom: "1px solid #1A1A1A",
        padding: "24px 0",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-around">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:gap-2"
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "#FFFFFF", lineHeight: 1.3 }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 400, color: "#999999", lineHeight: 1.4 }}>
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
