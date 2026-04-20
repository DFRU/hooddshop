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
