import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after") || null;
  const sortKey = searchParams.get("sortKey") || "BEST_SELLING";
  const reverse = searchParams.get("reverse") === "true";
  const query = searchParams.get("query") || undefined;
  const first = parseInt(searchParams.get("first") || "250", 10);

  const result = await getProducts({
    first,
    after,
    sortKey,
    reverse,
    query,
  });

  return NextResponse.json(result);
}
