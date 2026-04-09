import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import FeaturedNations from "@/components/home/CollectionRow";
import DesignLines from "@/components/home/DesignLines";
import HowItWorks from "@/components/home/HowItWorks";
import CtaBanner from "@/components/home/CtaBanner";

export default function Home() {
  return (
    <>
      <Ticker />
      <Hero />
      <FeaturedNations />
      <DesignLines />
      <HowItWorks />
      <CtaBanner />
    </>
  );
}
