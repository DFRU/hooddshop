import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shopify";
import { NATIONS, getTitleKeyword } from "@/lib/nations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://hooddshop.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/nations`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/size-guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/official-rules`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Product pages + smart nation pages.
  // Nations that have a Shopify product redirect to /products/[handle] at runtime.
  // DO NOT include those /nations/[code] URLs in the sitemap — Google classifies
  // them as "Page with redirect" and refuses to index them.
  // Only include /nations/[code] for nations with no product yet (shows "coming soon").
  let productPages: MetadataRoute.Sitemap = [];
  const nationPages: MetadataRoute.Sitemap = [];

  try {
    const { products } = await getProducts({ first: 250 });

    // Build a set of nation codes that have a matching Shopify product
    const nationCodesWithProduct = new Set();
    for (const nation of NATIONS) {
      const keyword = getTitleKeyword(nation.code).toLowerCase();
      const hasProduct = products.some((p) =>
        p.title.toLowerCase().includes(keyword)
      );
      if (hasProduct) nationCodesWithProduct.add(nation.code);
    }

    // Product pages — canonical destination for nations with products
    productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    // Nation "coming soon" pages — only nations WITHOUT a product
    for (const nation of NATIONS) {
      if (!nationCodesWithProduct.has(nation.code)) {
        nationPages.push({
          url: `${baseUrl}/nations/${nation.code}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        });
      }
    }
  } catch {
    // Shopify unavailable — fall back to all nation pages (best effort)
    for (const nation of NATIONS) {
      nationPages.push({
        url: `${baseUrl}/nations/${nation.code}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  }

  return [...staticPages, ...productPages, ...nationPages];
}
