import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shopify";
import { NATIONS } from "@/lib/nations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://hooddshop.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/nations`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/official-rules`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Nation detail pages (redirect to product page when available, or show holding page)
  const nationPages: MetadataRoute.Sitemap = NATIONS.map((nation) => ({
    url: `${baseUrl}/nations/${nation.code}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Product pages from Shopify
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { products } = await getProducts({ first: 250 });
    productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Shopify unavailable -- skip product pages
  }

  return [...staticPages, ...nationPages, ...productPages];
}
