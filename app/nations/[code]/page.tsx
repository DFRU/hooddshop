import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getNation, getTitleKeyword } from "@/lib/nations";
import { getProducts } from "@/lib/shopify";
import { flagUrl } from "@/lib/design";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const nation = getNation(code);
  return {
    title: nation ? `${nation.name} Hood Cover` : "Nation Not Found",
    description: nation
      ? `Premium stretch-fit car hood cover featuring ${nation.name} for World Cup 2026.`
      : "Nation not found.",
  };
}

export default async function NationDetailPage({ params }: PageProps) {
  const { code } = await params;
  const nation = getNation(code);

  if (!nation) {
    return (
      <div className="min-h-screen pt-14 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-display-lg text-white">Nation not found</p>
        <p className="text-body-md mt-3" style={{ color: "#888" }}>
          The nation code &ldquo;{code}&rdquo; doesn&apos;t match any World Cup 2026 team.
        </p>
        <Link
          href="/nations"
          className="mt-6 inline-flex items-center justify-center px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all"
          style={{ background: "var(--color-accent)", minHeight: "52px" }}
        >
          Browse All Nations
        </Link>
      </div>
    );
  }

  // Search Shopify for this nation's product
  const keyword = getTitleKeyword(code);
  const { products } = await getProducts({
    first: 5,
    sortKey: "TITLE",
    query: `title:${keyword}`,
  });

  // Find the best match — product title must contain the keyword
  const match = products.find((p) =>
    p.title.toLowerCase().includes(keyword.toLowerCase())
  );

  // If we found the Shopify product, redirect to the real product page
  if (match) {
    redirect(`/products/${match.handle}`);
  }

  // No Shopify product yet — show a "coming soon" holding page
  return (
    <div className="min-h-screen pt-14 pb-24 lg:pb-8">
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] py-5 lg:py-8">
        {/* Back */}
        <Link
          href="/nations"
          className="flex items-center gap-2 text-sm mb-5 transition-colors"
          style={{ color: "#888", minHeight: "44px" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All Nations
        </Link>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Flag / preview */}
          <div
            className="relative overflow-hidden rounded-lg"
            style={{ aspectRatio: "4/3", border: "1px solid #1A1A1A", background: "#111" }}
          >
            <img
              src={flagUrl(code, 640)}
              alt={nation.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="text-6xl">{nation.emoji}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 lg:space-y-7 flex flex-col justify-center">
            <div>
              <span className="text-label" style={{ color: "var(--color-accent)" }}>
                {nation.confederation} · {nation.region}
              </span>
              <h1 className="text-display-lg text-white mt-1">{nation.name}</h1>
              <p className="text-body-sm mt-1" style={{ color: "#888" }}>Car Hood Cover</p>
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg"
              style={{ background: "rgba(255,77,0,0.08)", border: "1px solid rgba(255,77,0,0.15)" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
              <span className="text-body-sm" style={{ color: "var(--color-accent)" }}>
                Coming Soon — This product is being prepared for launch
              </span>
            </div>

            <p className="text-body-sm leading-relaxed" style={{ color: "#888" }}>
              The {nation.name} premium stretch-fit car hood cover is currently in production.
              Sign up to be notified when it drops.
            </p>

            <Link
              href="/shop"
              className="flex items-center justify-center w-full lg:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all"
              style={{ background: "var(--color-accent)", minHeight: "52px" }}
            >
              Browse Available Covers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
