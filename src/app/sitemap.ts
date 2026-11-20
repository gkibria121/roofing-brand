import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/estimate`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${site.url}/products`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/products/roofing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/products/fencing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${site.url}/service-areas`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    ...SERVICE_AREAS.map((area) => ({
      url: `${site.url}/service-areas/${area.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${site.url}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...BLOG_POSTS.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    { url: `${site.url}/portal`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];
}
