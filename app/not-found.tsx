import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="text-[120px] lg:text-[180px] font-bold leading-none"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)", opacity: 0.2 }}
      >
        404
      </div>
      <h1 className="text-display-lg text-white -mt-6 lg:-mt-10">Page Not Found</h1>
      <p className="text-body-md mt-3 max-w-md" style={{ color: "#888" }}>
        This page doesn&apos;t exist or has been moved. Check out our full collection instead.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/shop"
          className="flex items-center justify-center px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all"
          style={{ background: "var(--color-accent)", minHeight: "52px" }}
        >
          Shop All Covers
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors"
          style={{ border: "1px solid #333", minHeight: "52px" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
