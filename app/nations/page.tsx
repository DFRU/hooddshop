import { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/shopify";
import { getTitleKeyword, NATIONS } from "@/lib/nations";
import NationsClient from "./NationsClient";
import type { ShopifyProduct } from "@/types/shopify";

export const metadata: Metadata = {
  title: "All 48 World Cup 2026 Car Hood Covers — Find Your Nation | Hood'd",
  description:
    "Browse all 48 qualified nations. Premium stretch-fit car hood covers with full sublimation print. Universal fit for cars, SUVs, and trucks. $49.99 each.",
};

export default async function NationsPage() {
  // Fetch all Shopify products to match against nations
  const { products } = await getProducts({ first: 250, sortKey: "TITLE" });

  // Build a map: nation code → matching Shopify product (product images only, no vehicle renders)
  const nationProductMap: Record<
    string,
    { handle: string; imageUrl: string | null }
  > = {};
  for (const nation of NATIONS) {
    const keyword = getTitleKeyword(nation.code).toLowerCase();
    const match = products.find((p: ShopifyProduct) =>
      p.title.toLowerCase().includes(keyword)
    );
    if (match) {
      nationProductMap[nation.code] = {
        handle: match.handle,
        imageUrl: match.images?.edges?.[0]?.node?.url ?? null,
      };
    }
  }

  return (
    <Suspense>
      <NationsClient nationProductMap={nationProductMap} />
    </Suspense>
  );
}
