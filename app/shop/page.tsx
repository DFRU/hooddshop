import { getProducts } from "@/lib/shopify";
import ShopClient from "./ShopClient";

// useSearchParams() in ShopClient requires dynamic rendering
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop Car Hood Covers — World Cup 2026",
  description:
    "Shop all Hood'd car hood covers. 48 nations, premium polyester spandex, elastic edges for universal fit. Filter by region. $49.99 each. Free shipping on $99+.",
  alternates: {
    canonical: "https://hooddshop.com/shop",
  },
};

export default async function ShopPage() {
  const { products: shopifyProducts, pageInfo } = await getProducts({
    first: 250,
    sortKey: "BEST_SELLING",
  });

  return (
    <ShopClient
      initialShopifyProducts={shopifyProducts}
      initialPageInfo={pageInfo}
    />
  );
}
