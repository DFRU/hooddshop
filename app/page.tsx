import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import TrustStrip from "@/components/home/TrustStrip";
import FeaturedNations from "@/components/home/CollectionRow";
import TrendingProducts from "@/components/home/TrendingProducts";
import HowItWorks from "@/components/home/HowItWorks";
import CtaBanner from "@/components/home/CtaBanner";

/* ── Skeleton loaders ─────────────────────────────────────── */
function HeroSkeleton() {
  return (
    <section className="relative flex items-end overflow-hidden" style={{ minHeight: "min(90vh, 780px)" }}>
      <div className="absolute inset-0" style={{ background: "#0A0A0A" }} />
      <div className="relative w-full max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-10 pt-16 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-end">
          <div className="space-y-6">
            <div className="w-32 h-8 rounded-full animate-pulse" style={{ background: "#1a1a1a" }} />
            <div className="space-y-3">
              <div className="w-64 h-12 rounded animate-pulse" style={{ background: "#1a1a1a" }} />
              <div className="w-48 h-12 rounded animate-pulse" style={{ background: "#1a1a1a" }} />
            </div>
            <div className="w-80 h-5 rounded animate-pulse" style={{ background: "#1a1a1a" }} />
          </div>
          <div className="hidden lg:block rounded-lg animate-pulse" style={{ aspectRatio: "4/3", background: "#1a1a1a" }} />
        </div>
      </div>
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-48 h-8 rounded animate-pulse" style={{ background: "#1a1a1a" }} />
          <div className="w-64 h-4 rounded animate-pulse" style={{ background: "#141414" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg animate-pulse" style={{ aspectRatio: "4/3", background: "#1a1a1a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Ticker />
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <TrustStrip />
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedNations />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TrendingProducts />
      </Suspense>
      <HowItWorks />
      <CtaBanner />
    </>
  );
}
