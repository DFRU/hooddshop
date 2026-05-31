import { getProducts } from "@/lib/shopify";
import ShopClient from "./ShopClient";

// useSearchParams() in ShopClient requires dynamic rendering
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop Car Hood Covers — World Cup 2026",
  description:
    "Shop all Hood'd car hood covers. 48 nations, polyester-spandex stretch fabric, elastic edges for universal fit. Filter by region. From $34.99 USD. Free standard shipping storewide.",
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
