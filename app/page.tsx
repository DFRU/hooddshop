import type { Metadata } from "next";
// ── CRO Redesign — new section stack (spec §4) ──────────────────────────────
import HeroSection from "@/components/home/HeroSection";
import TrustBar from "@/components/home/TrustBar";
import FeaturedNationsGrid from "@/components/home/FeaturedNationsGrid";
// import NationCombinerCallout from "@/components/home/NationCombinerCallout"; // removed: no Nation Combiner product exists yet
import SocialProofSection from "@/components/home/SocialProofSection";
// ── Commented-out (not in CRO spec §4 — preserved for future reference) ─────
// import Hero from "@/components/home/Hero";            // replaced by HeroSection
// import Ticker from "@/components/home/Ticker";        // removed: not in target stack
// import TrustStrip from "@/components/home/TrustStrip"; // replaced by TrustBar
// import FeaturedNations from "@/components/home/CollectionRow"; // replaced by FeaturedNationsGrid
// import TrendingProducts from "@/components/home/TrendingProducts"; // removed: not in target stack
// import HowItWorks from "@/components/home/HowItWorks"; // removed: not in target stack
// import ConceptShowcase from "@/components/home/ConceptShowcase"; // removed: not in target stack
// import WeeklyDraw from "@/components/home/WeeklyDraw"; // removed: not in target stack
// import CtaBanner from "@/components/home/CtaBanner";   // removed: not in target stack
// import MailingListCTA from "@/components/home/MailingListCTA"; // removed: not in target stack

export const metadata: Metadata = {
  title: {
    absolute: "Hood'd — Stretch Hood Covers for Your Car · 48 Nations · World Cup 2026",
  },
  description:
    "Stretch-fit car hood covers. 48 nations. Made to order. Full-bleed sublimation print on polyester-spandex. From $44.99 USD. Independent brand — not licensed by FIFA, federations, or kit makers.",
  alternates: {
    canonical: "https://hooddshop.com",
  },
  openGraph: {
    title: "Hood'd — Your Ride. Your Flag.",
    description:
      "Stretch hood covers for cars. 48 World Cup 2026 nations. Slips on in 30 seconds. Slips off in 10. From $44.99.",
    url: "https://hooddshop.com",
  },
  keywords: [
    "car hood cover", "World Cup 2026", "car hood flag",
    "engine cover flag", "car bonnet cover", "soccer car accessories",
    "football car accessories", "World Cup merchandise",
    "national team car cover", "sublimation car hood cover",
    "stretch fit hood cover", "World Cup car decor",
    "country flag car cover",
  ],
};

export default async function Home() {
  return (
    <>
      {/* 1. Hero — full-viewport, single CTA, product image */}
      <HeroSection />

      {/* 2. Trust bar — Universal Fit | Vibrant AOP Print | Delivered in 7–15 Days */}
      <TrustBar />

      {/* 3. Featured nations grid — 8 nations, 4-col desktop / 2-col mobile */}
      <FeaturedNationsGrid />

      {/* 4. Social proof — UGC placeholder until reviews exist */}
      <SocialProofSection />

      {/* Footer is rendered by the layout — no import needed here */}
    </>
  );
}
