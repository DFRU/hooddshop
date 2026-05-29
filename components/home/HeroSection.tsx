import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/shopify";
import { getVehicleImages } from "@/lib/vehicles";
import WorldCupCountdown from "./WorldCupCountdown";

export default async function HeroSection() {
  // Source hero image from Shopify CDN at build time (spec §5.1)
  // Argentina is the hero nation — best on-vehicle renders available
  let heroImageUrl: string | null = null;
  let heroImageAlt = "Hood'd car hood cover";

  try {
    const { products } = await getProducts({
      first: 1,
      query: "title:Argentina",
      sortKey: "BEST_SELLING",
    });
    const shopifyImgUrl = products[0]?.images?.edges?.[0]?.node?.url ?? null;
    if (shopifyImgUrl) {
      heroImageUrl = shopifyImgUrl.includes("?")
        ? `${shopifyImgUrl}&width=1440&format=webp`
        : `${shopifyImgUrl}?width=1440&format=webp`;
      heroImageAlt = products[0]?.title
        ? `${products[0].title} car hood cover`
        : heroImageAlt;
    }
  } catch {
    // fall through to vehicle render fallback
  }

  // Fallback: local on-car vehicle render (highest-quality available)
  if (!heroImageUrl) {
    const vehicleImages = getVehicleImages("ar");
    const heroVehicle =
      vehicleImages.find((v) => v.vehicleType === "truck") ??
      vehicleImages[0] ??
      null;
    if (heroVehicle) {
      heroImageUrl = heroVehicle.src;
      heroImageAlt = heroVehicle.alt;
    }
  }

  return (
    <section
      className="relative overflow-hidden flex items-end"
      style={{ minHeight: "100svh", background: "#0A0A0A" }}
    >
      {/* Full-bleed product image */}
      {heroImageUrl && (
        <>
          <Image
            src={heroImageUrl}
            alt={heroImageAlt}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          {/* Gradient overlay — dark at bottom where text lives, lighter toward top */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.2) 100%)",
            }}
          />
        </>
      )}

      {/* Fallback wordmark (no image) */}
      {!heroImageUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(5rem, 22vw, 14rem)",
              color: "#FF4D00",
              letterSpacing: "0.04em",
              opacity: 0.12,
            }}
          >
            HOOD&apos;D
          </span>
        </div>
      )}

      {/* Bottom-anchored text block — occupies bottom ~30% on mobile */}
      <div className="relative w-full max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-12 lg:pb-16">

        {/* Countdown — urgency signal above headline */}
        <div className="mb-4 flex items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: "#FF4D00" }}
          >
            WC 2026
          </span>
          <WorldCupCountdown />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 11vw, 6rem)",
            color: "#FFFFFF",
            lineHeight: 0.9,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          GET HOOD&apos;D
        </h1>

        <p
          className="mt-3 mb-6"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(1rem, 2vw, 1.125rem)",
            color: "#999999",
          }}
        >
          Your Ride. Your Nation. World Cup 2026.
        </p>

        {/* CTA — full-width mobile, auto-width desktop */}
        {/* py-4 = 16px, px-6 = 24px mobile, md:px-10 = 40px desktop */}
        <Link
          href="/nations"
          className="block md:inline-block text-center py-4 px-6 md:px-10 touch-active"
          style={{
            background: "#FF4D00",
            color: "#000000",
            fontFamily: "var(--font-display)",
            fontSize: "1.125rem",
            letterSpacing: "0.08em",
            borderRadius: "2px",
          }}
        >
          SHOP BY NATION
        </Link>
      </div>
    </section>
  );
}
