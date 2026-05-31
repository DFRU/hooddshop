import Link from "next/link";
import Image from "next/image";
import { getVehicleImages } from "@/lib/vehicles";
import { getProducts } from "@/lib/shopify";
import WorldCupCountdown from "./WorldCupCountdown";

export default async function HeroSection() {
  // PRIMARY: local on-car vehicle render — shows the product in context on a real car.
  // This converts better than a flat design image because visitors instantly
  // understand what the product IS and HOW it looks on a vehicle.
  // FALLBACK: Shopify product image → wordmark
  let heroImageUrl: string | null = null;
  let heroImageAlt = "Hood'd Argentina car hood cover on a truck";

  // 1. Vehicle render first (shows product on actual car)
  const vehicleImages = getVehicleImages("ar");
  const heroVehicle =
    vehicleImages.find((v) => v.vehicleType === "truck") ??
    vehicleImages.find((v) => v.vehicleType === "suv") ??
    vehicleImages[0] ??
    null;

  if (heroVehicle) {
    heroImageUrl = heroVehicle.src;
    heroImageAlt = heroVehicle.alt ?? heroImageAlt;
  }

  // 2. Fallback: Shopify product image if no vehicle render available
  if (!heroImageUrl) {
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
      // fall through to wordmark
    }
  }

  return (
    <section
      className="relative overflow-hidden flex items-end"
      style={{ minHeight: "100svh", background: "#0A0A0A" }}
    >
      {/* Full-bleed on-car image */}
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
          {/* Gradient overlay — dark at bottom where text lives */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.6) 40%, rgba(10,10,10,0.15) 100%)",
            }}
          />
        </>
      )}

      {/* Fallback wordmark */}
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

      {/* Bottom-anchored text block */}
      <div className="relative w-full max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-12 lg:pb-16">

        {/* Countdown — urgency signal */}
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

        {/* CTA + price anchor */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link
            href="/nations"
            className="block sm:inline-block text-center py-4 px-6 md:px-10 touch-active"
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
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "#666666",
            }}
          >
            From $34.99 USD · Free standard shipping
          </span>
        </div>
      </div>
    </section>
  );
}
