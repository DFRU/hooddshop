export default function Ticker() {

  const messages = [
    "WORLD CUP 2026",
    "YOUR RIDE. YOUR FLAG.",
    "48 NATIONS",
    "FREE SHIPPING $99+",
    "STRETCH-FIT",
    "MADE TO ORDER",
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
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
