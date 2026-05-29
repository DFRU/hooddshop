import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/shopify";

/**
 * Nation Combiner callout (spec §5.4)
 * Desktop: 2-col image left / text right
 * Mobile: stacked image top / text below
 *
 * HANDOFF NOTE — VERIFIED 2026-05-29 via Storefront API (38 collections checked):
 * /collections/nation-combiner does NOT exist in Shopify.
 * No /app/collections/[handle] Next.js route exists either.
 * CTA currently links to /shop as a safe fallback.
 * To fix: (1) create Nation Combiner collection in Shopify Admin,
 *          (2) add /app/collections/[handle]/page.tsx Next.js route,
 *          (3) update href below to /collections/nation-combiner.
 */
export default async function NationCombinerCallout() {
  // Fetch best Nation Combiner product image from Shopify
  let combinerImageUrl: string | null = null;
  let combinerImageAlt = "Nation Combiner hood cover — two flags in one design";

  try {
    const { products } = await getProducts({
      first: 1,
      query: "title:Combiner",
      sortKey: "BEST_SELLING",
    });
    const imgUrl = products[0]?.images?.edges?.[0]?.node?.url ?? null;
    if (imgUrl) {
      combinerImageUrl = imgUrl.includes("?")
        ? `${imgUrl}&width=800&format=webp`
        : `${imgUrl}?width=800&format=webp`;
      combinerImageAlt = products[0]?.title
        ? `${products[0].title} — Hood'd`
        : combinerImageAlt;
    }
  } catch {
    // fall through to image-less layout
  }

  return (
    <section
      className="py-12 lg:py-20"
      style={{ background: "#141414", borderTop: "1px solid #1A1A1A" }}
    >
      <div className="max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
          {/* Image — top on mobile, left on desktop */}
          {combinerImageUrl && (
            <div className="w-full lg:w-1/2 flex-shrink-0 mb-8 lg:mb-0">
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "16/9", borderRadius: "2px", background: "#1E1E1E" }}
              >
                <Image
                  src={combinerImageUrl}
                  alt={combinerImageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Text — below on mobile, right on desktop */}
          <div className={combinerImageUrl ? "lg:w-1/2" : "w-full"}>
            {/* "EXCLUSIVE" tag */}
            <p
              className="mb-2"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
                color: "#FF4D00",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              EXCLUSIVE
            </p>

            <h2
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 6vw, 2.5rem)",
                letterSpacing: "0.02em",
                lineHeight: 0.95,
              }}
            >
              CAN&apos;T CHOOSE<br />ONE NATION?
            </h2>

            <p
              className="mt-4"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                color: "#999999",
                lineHeight: 1.6,
                maxWidth: "38ch",
              }}
            >
              Represent two nations on one hood. 40 diaspora combinations available.
            </p>

            {/* TODO: change to /collections/nation-combiner once collection + Next.js route exist */}
            <Link
              href="/shop"
              className="inline-block mt-6 touch-active"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.05rem",
                color: "#FF4D00",
                letterSpacing: "0.06em",
              }}
            >
              BUILD YOUR COMBINER →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
