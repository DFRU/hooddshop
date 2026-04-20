import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import TrustStrip from "@/components/home/TrustStrip";
import FeaturedNations from "@/components/home/CollectionRow";
import TrendingProducts from "@/components/home/TrendingProducts";
import HowItWorks from "@/components/home/HowItWorks";
import ConceptShowcase from "@/components/home/ConceptShowcase";
import WeeklyDraw from "@/components/home/WeeklyDraw";
import CtaBanner from "@/components/home/CtaBanner";
import MailingListCTA from "@/components/home/MailingListCTA";

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
      {/* 1. Ticker — top banner */}
      <Ticker />

      {/* 2. Hero — World Cup countdown + Argentina truck + Shop Now CTA */}
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>

      {/* 3. "New Designs Coming Soon" — concept car showcase */}
      <ConceptShowcase />

      {/* 4. Mailing list CTA — prizes, discounts, drops, freebies */}
      <MailingListCTA />

      {/* 5. Trust signals */}
      <TrustStrip />

      {/* 6. Most popular products */}
      <Suspense fallback={<SectionSkeleton />}>
        <TrendingProducts />
      </Suspense>

      {/* 7. Featured nations row */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedNations />
      </Suspense>

      {/* 8. How it works */}
      <HowItWorks />

      {/* 9. Weekly draw */}
      <WeeklyDraw />

      {/* 10. Final CTA */}
      <CtaBanner />
    </>
  );
}
