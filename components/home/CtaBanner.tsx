import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="py-16 lg:py-24" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] text-center">
        <h2 className="text-display-xl text-white">
          REPRESENT YOUR<br />NATION ON THE ROAD
        </h2>
        <p className="text-body-sm lg:text-body-md mt-4 max-w-md mx-auto" style={{ color: "#888" }}>
          World Cup 2026 is coming. Make sure your ride is ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center w-full sm:w-auto px-10 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all touch-active"
            style={{ background: "var(--color-accent)", minHeight: "52px" }}
          >
            Shop All Covers
          </Link>
          <Link
            href="/nations"
            className="inline-flex items-center justify-center w-full sm:w-auto px-10 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors touch-active"
            style={{ border: "1px solid #333", minHeight: "52px" }}
          >
            Find Your Nation
          </Link>
        </div>
      </div>
    </section>
  );
}
