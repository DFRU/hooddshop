import type { Metadata } from "next";
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
      {/* 1. Ticker — top banner */}
      <Ticker />

      {/* 2. Hero — World Cup countdown + Argentina truck + Shop Now CTA */}
      <Hero />

      {/* 3. "New Designs Coming Soon" — concept car showcase */}
      <ConceptShowcase />

      {/* 4. Mailing list CTA — prizes, discounts, drops, freebies */}
      <MailingListCTA />

      {/* 5. Trust signals */}
      <TrustStrip />

      {/* 6. Most popular products */}
      <TrendingProducts />

      {/* 7. Featured nations row */}
      <FeaturedNations />

      {/* 8. How it works */}
      <HowItWorks />

      {/* 9. Weekly draw */}
      <WeeklyDraw />

      {/* 10. Final CTA */}
      <CtaBanner />
    </>
  );
}
