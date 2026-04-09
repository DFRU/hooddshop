import { Suspense } from "react";
import ShopClient from "./ShopClient";

export const metadata = {
  title: "Shop All Covers",
};

export default function ShopPage() {
  return (
    <Suspense>
      <ShopClient />
    </Suspense>
  );
}
