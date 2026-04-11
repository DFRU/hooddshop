import { GET_PRODUCT, GET_PRODUCTS } from "./queries/products";
import type { ShopifyProduct, ProductConnection } from "@/types/shopify";

const SHOPIFY_STOREFRONT_API_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN || "hooddshop.myshopify.com"}/api/2024-10/graphql.json`;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    console.warn(
      "[shopify] No SHOPIFY_STOREFRONT_ACCESS_TOKEN set — returning empty data"
    );
    return { data: {} } as T;
  }

  try {
    const res = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[shopify] API returned ${res.status} — returning empty data`);
      return { data: {} } as T;
    }

    return res.json();
  } catch (err) {
    console.warn("[shopify] Fetch failed:", err);
    return { data: {} } as T;
  }
}

// ── Product helpers ──────────────────────────────────────────────

export async function getProduct(
  handle: string
): Promise<ShopifyProduct | null> {
  const { data } = await shopifyFetch<{
    data: { product: ShopifyProduct | null };
  }>({
    query: GET_PRODUCT,
    variables: { handle },
  });
  return data?.product ?? null;
}

export async function getProducts(opts: {
  first?: number;
  after?: string | null;
  sortKey?: string;
  query?: string;
} = {}): Promise<{ products: ShopifyProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }> {
  const { data } = await shopifyFetch<{
    data: { products: ProductConnection };
  }>({
    query: GET_PRODUCTS,
    variables: {
      first: opts.first ?? 24,
      after: opts.after ?? null,
      sortKey: opts.sortKey ?? "BEST_SELLING",
      query: opts.query ?? null,
    },
  });

  const edges = data?.products?.edges ?? [];
  const pageInfo = data?.products?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  };

  return {
    products: edges.map((e) => e.node),
    pageInfo,
  };
}
