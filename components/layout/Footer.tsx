import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #111", background: "#070707" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-white text-sm"
                style={{ background: "var(--color-accent)", fontFamily: "var(--font-display)" }}
              >
                H
              </div>
              <span className="text-xl text-white tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                HOOD&apos;D
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Premium car hood covers for World Cup 2026. Your ride. Your flag.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-label-md text-white mb-3">Shop</h4>
            <div className="space-y-2">
              <Link href="/shop" className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                All Covers
              </Link>
              <Link href="/nations" className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                Find Your Nation
              </Link>
              <Link href="/about" className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                About Hood&apos;d
              </Link>
            </div>
          </div>

          {/* Nations */}
          <div>
            <h4 className="text-label-md text-white mb-3">Nations</h4>
            <div className="space-y-2">
              {["Americas", "Europe", "Africa", "Asia-Pacific", "Middle East"].map((l) => (
                <Link key={l} href="/nations" className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-label-md text-white mb-3">Info</h4>
            <div className="space-y-2">
              {[
                { label: "Contact", href: "mailto:contact@hooddshop.com" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid #111" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#3a3a3a" }}>
            HOOD&apos;D is not affiliated with, endorsed by, or sponsored by FIFA, any national football federation, or any kit manufacturer. All product designs are original compositions inspired by national team color palettes. National team names and color schemes are used for descriptive purposes only.
          </p>
          <p className="text-xs leading-relaxed mt-2" style={{ color: "#3a3a3a" }}>
            Vehicle preview images are AI-generated for illustrative purposes only and may not exactly represent the final product. Actual colors, fit, and appearance may vary.
          </p>
        </div>

        <div className="mt-5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid #111" }}>
          <span className="text-xs" style={{ color: "#444" }}>&copy; 2026 Hood&apos;d. All rights reserved.</span>
          <div className="flex gap-5">
            <span className="text-xs" style={{ color: "#333" }}>@hooddshop</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
