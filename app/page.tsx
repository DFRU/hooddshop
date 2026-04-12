import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import FeaturedNations from "@/components/home/CollectionRow";
import VehicleShowcase from "@/components/home/VehicleShowcase";
import HowItWorks from "@/components/home/HowItWorks";
import CtaBanner from "@/components/home/CtaBanner";
import TrendingProducts from "@/components/home/TrendingProducts";

export default function Home() {
  return (
    <>
      <Ticker />
      <Suspense>
        <Hero />
      </Suspense>
      <Suspense>
        <VehicleShowcase />
      </Suspense>
      <Suspense>
        <FeaturedNations />
      </Suspense>
      <Suspense>
        <TrendingProducts />
      </Suspense>

      <HowItWorks />
      <CtaBanner />
    </>
  );
}
