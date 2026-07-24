import type { MetadataRoute } from "next";
import { cachedProductIds } from "@/lib/cache";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://extremedb.mendozac.cr";
  const products = await cachedProductIds();
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    ...products.map((p) => ({
      url: `${base}/p/${p.id}`,
      lastModified: p.lastSeen ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
