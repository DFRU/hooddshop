import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after") || null;
  const sortKey = searchParams.get("sortKey") || "BEST_SELLING";
  const reverse = searchParams.get("reverse") === "true";
  const query = searchParams.get("query") || undefined;
  const first = parseInt(searchParams.get("first") || "24", 10);

  // Shopify expects sortKey and reverse as separate params
  // but our getProducts helper takes sortKey as a string.
  // For PRICE sort with reverse, pass PRICE as sortKey.
  const shopifySortKey = reverse ? sortKey : sortKey;

  const result = await getProducts({
    first,
    after,
    sortKey: shopifySortKey,
    query,
  });

  return NextResponse.json(result);
}
