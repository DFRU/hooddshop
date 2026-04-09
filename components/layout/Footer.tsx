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
              {["All Covers", "Heritage", "Culture", "Street", "Stealth", "Chrome"].map((l) => (
                <Link key={l} href="/shop" className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                  {l}
                </Link>
              ))}
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
                { label: "Shipping", href: "#" },
                { label: "Returns", href: "#" },
                { label: "FAQ", href: "#" },
                { label: "Contact", href: "mailto:contact@hooddshop.com" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-sm py-1 touch-active transition-colors" style={{ color: "#666" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid #111" }}>
          <span className="text-xs" style={{ color: "#444" }}>&copy; 2026 Hood&apos;d. All rights reserved.</span>
          <div className="flex gap-5">
            {["Instagram", "TikTok", "X"].map((s) => (
              <a key={s} href="#" className="text-xs touch-active py-1 transition-colors" style={{ color: "#555" }}>
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
