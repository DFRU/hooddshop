import { GET_PRODUCT, GET_PRODUCTS } from "./queries/products";
import type { ShopifyProduct, ProductConnection } from "@/types/shopify";

// ── Env vars: check NEXT_PUBLIC_ (client) then server-only fallback ──
const DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  process.env.SHOPIFY_STORE_DOMAIN ||
  "hoodd-shop-2.myshopify.com";

const TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  "";

const SHOPIFY_STOREFRONT_API_URL = `https://${DOMAIN}/api/2024-10/graphql.json`;

/**
 * Generic Shopify Storefront API fetch.
 * Works both server-side (with ISR cache) and client-side (no cache header).
 */
export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  if (!TOKEN) {
    console.warn(
      "[shopify] No Storefront access token set — returning empty data"
    );
    return { data: {} } as T;
  }

  const isServer = typeof window === "undefined";

  try {
    const fetchOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    };

    // Only use Next.js ISR cache on the server; client fetches are always fresh
    if (isServer) {
      (fetchOptions as Record<string, unknown>).next = { revalidate: 60 };
    } else {
      fetchOptions.cache = "no-store";
    }

    const res = await fetch(SHOPIFY_STOREFRONT_API_URL, fetchOptions);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        `[shopify] API returned ${res.status} — ${body.slice(0, 200)}`
      );
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
  handle: string,
  country?: string,
  language?: string
): Promise<ShopifyProduct | null> {
  const { data } = await shopifyFetch<{
    data: { product: ShopifyProduct | null };
  }>({
    query: GET_PRODUCT,
    variables: { handle, country, language },
  });
  return data?.product ?? null;
}

export async function getProducts(
  opts: {
    first?: number;
    after?: string | null;
    sortKey?: string;
    query?: string;
    country?: string;
    language?: string;
  } = {}
): Promise<{
  products: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}> {
  const { data } = await shopifyFetch<{
    data: { products: ProductConnection };
  }>({
    query: GET_PRODUCTS,
    variables: {
      first: opts.first ?? 24,
      after: opts.after ?? null,
      sortKey: opts.sortKey ?? "BEST_SELLING",
      query: opts.query ?? null,
      country: opts.country,
      language: opts.language,
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
