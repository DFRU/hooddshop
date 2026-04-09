// TODO: Replace with actual Shopify credentials
const SHOPIFY_STOREFRONT_API_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN || "hooddshop.myshopify.com"}/api/2024-01/graphql.json`;
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
    // Return mock data when no credentials configured
    console.warn(
      "[shopify] No SHOPIFY_STOREFRONT_ACCESS_TOKEN set — returning empty data"
    );
    return { data: {} } as T;
  }

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
    throw new Error(`Shopify API error: ${res.status}`);
  }

  return res.json();
}
