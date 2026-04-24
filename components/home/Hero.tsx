import Link from "next/link";
import Image from "next/image";
import { flagUrl } from "@/lib/design";
import { getVehicleImages } from "@/lib/vehicles";
import { getProducts } from "@/lib/shopify";
import WorldCupCountdown from "./WorldCupCountdown";

export default async function Hero() {
  // Hero: show the Argentina truck on-vehicle render — globally appealing
  const arVehicles = getVehicleImages("ar");
  const heroImage = arVehicles.find((v) => v.vehicleType === "truck") ?? arVehicles[0] ?? null;

  // Fetch actual min price from Shopify (localized by Shopify Markets)
  const { products } = await getProducts({ first: 1, sortKey: "PRICE" });
  const minPrice = products[0]?.priceRange?.minVariantPrice;
  const priceDisplay = minPrice
    ? `$${parseFloat(minPrice.amount).toFixed(2)} ${minPrice.currencyCode}`
    : "$49.99";

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0A0A0A, #0D0B09, #0A0A0A)" }} />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute top-[10%] right-0 w-[350px] h-[350px] lg:w-[600px] lg:h-[600px] rounded-full"
          style={{ background: "rgba(255,77,0,0.07)", filter: "blur(120px)" }}
        />
      </div>

      <div className="relative w-full max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-8 pt-4 lg:pt-6">
        {/* Countdown + heading row — compact, side by side on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5 lg:mb-6">
          <div className="flex items-center gap-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.2)" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
              <span className="text-label" style={{ color: "var(--color-accent)" }}>World Cup 2026</span>
            </div>
            <h1 className="text-display-lg lg:text-display-xl text-white leading-none">
              YOUR RIDE. <span style={{ color: "var(--color-accent)" }}>YOUR FLAG.</span>
            </h1>
          </div>
          <WorldCupCountdown />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          <div className="space-y-4">
            <p className="text-body-sm lg:text-body-md max-w-md leading-relaxed" style={{ color: "#888" }}>
              Premium stretch-fit car hood covers for World Cup 2026. 48 nations. Universal fit for cars, SUVs, and trucks.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/shop"
                className="flex items-center justify-center w-full sm:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all touch-active"
                style={{ background: "var(--color-accent)", minHeight: "52px" }}
              >
                Shop Now — From {priceDisplay}
              </Link>
              <Link
                href="/nations"
                className="flex items-center justify-center w-full sm:w-auto px-8 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors touch-active"
                style={{ border: "1px solid #333", minHeight: "52px" }}
              >
                Find Your Nation
              </Link>
            </div>

            <div className="flex gap-8">
              {[
                { v: "48", l: "Nations" },
                { v: priceDisplay, l: "From" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-display-sm text-white">{s.v}</div>
                  <div className="text-label mt-0.5" style={{ color: "#555" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Single vehicle example image */}
          {heroImage && (
            <div className="relative">
              <Link href="/shop">
                <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{ aspectRatio: "4/3", border: "1px solid #222" }}>
                  <Image
                    src={heroImage.src}
                    alt={heroImage.alt}
                    fill
                    className="object-cover object-[center_35%]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                    <img src={flagUrl("ar", 40)} className="w-8 h-auto mb-1.5 rounded shadow-md" alt="Argentina flag" />
                    <div className="text-display-sm text-white">Argentina</div>
                    <div className="text-[9px] lg:text-[10px] uppercase tracking-[0.12em] text-white/50 mt-0.5">
                      Jersey Line · Hood Cover
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
  