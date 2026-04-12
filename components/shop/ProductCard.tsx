import Link from "next/link";
import { flagUrl, DESIGN_CSS_CLASS, type DesignLine } from "@/lib/design";
import type { Nation } from "@/lib/nations";

interface ProductCardProps {
  nation: Nation;
  design: DesignLine;
}

export default function ProductCard({ nation, design }: ProductCardProps) {
  // Link to the nation redirect page, which will forward to the Shopify product if available
  return (
    <div className="group">
      <Link
        href={`/nations/${nation.code}`}
        className="block w-full text-left touch-active"
      >
        <div
          className="relative overflow-hidden rounded-lg"
          style={{ aspectRatio: "4/3", border: "1px solid #181818" }}
        >
          <div className={`absolute inset-0 ${DESIGN_CSS_CLASS[design]} opacity-55 group-hover:opacity-80 transition-opacity duration-300`} />
          <img
            src={flagUrl(nation.code, 160)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-2.5 left-2.5">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/50 rounded-full text-[9px] text-white/70 uppercase tracking-[0.08em]"
              style={{ backdropFilter: "blur(8px)" }}
            >
              <span className="text-sm">{nation.emoji}</span>
              {design}
            </span>
          </div>
        </div>
      </Link>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-white text-[13px] font-medium truncate">{nation.name} — {design}</div>
          <div className="text-[11px] mt-0.5" style={{ color: "#555" }}>Hood Cover</div>
        </div>
        <div className="text-white text-[13px] font-semibold flex-shrink-0">$49.99</div>
      </div>
    </div>
  );
}
