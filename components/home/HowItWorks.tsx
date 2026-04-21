import Link from "next/link";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Pick Your Nation",
      desc: "Browse all 48 World Cup 2026 qualified nations.",
      href: "/shop",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "See It on Your Ride",
      desc: "Preview your nation's cover on a real vehicle. Universal stretch fit for cars, SUVs, and trucks.",
      href: "/products/hoodd-usa-jersey-line#showcase-section",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="7" width="22" height="10" rx="2" />
          <circle cx="6" cy="17" r="2" />
          <circle cx="18" cy="17" r="2" />
          <path d="M5 7l2-4h10l2 4" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Rep Your Ride",
      desc: "Made to order. Ships worldwide in 15–25 business days.",
      href: "/shop",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="text-center mb-8 lg:mb-14">
          <span className="text-label" style={{ color: "var(--color-accent)" }}>How It Works</span>
          <h2 className="text-display-lg text-white mt-1">Three Steps</h2>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto scrollbar-hide snap-x-mandatory -mx-[var(--container-px)] px-[var(--container-px)] lg:mx-0 lg:px-0 pb-4 lg:pb-0">
          {steps.map((s) => (
            <Link
              key={s.num}
              href={s.href}
              className="group relative p-6 lg:p-8 rounded-lg flex-shrink-0 w-[280px] lg:w-auto snap-start cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: "#0E0E0E", border: "1px solid #1A1A1A" }}
            >
              <div
                className="absolute top-4 right-5 text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-display)", color: "#131313" }}
              >
                {s.num}
              </div>
              <div
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:border-[rgba(255,77,0,0.4)]"
                style={{ background: "rgba(255,77,0,0.08)", border: "1px solid rgba(255,77,0,0.15)", color: "var(--color-accent)" }}
              >
                {s.icon}
         