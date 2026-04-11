import { Suspense } from "react";
import { getProducts } from "@/lib/shopify";
import ShopClient from "./ShopClient";

// Force fresh build after product activation
export const metadata = {
  title: "Shop All Covers",
  description:
    "Browse all Hood'd car hood covers. 48 nations, multiple design lines. Filter by region, design, or search by nation.",
};

export default async function ShopPage() {
  // Attempt to fetch Shopify products; returns empty array if API unavailable
  const { products: shopifyProducts, pageInfo } = await getProducts({
    first: 250,
    sortKey: "BEST_SELLING",
  });

  return (
    <Suspense>
      <ShopClient
        initialShopifyProducts={shopifyProducts}
        initialPageInfo={pageInfo}
      />
    </Suspense>
  );
}
