import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { services } from "@/lib/services";
import { SITE_CONTENT_UPDATED_AT, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUpdated = new Date(SITE_CONTENT_UPDATED_AT);
  const latestBlogDate = BLOG_POSTS.reduce((latest, post) => {
    const d = new Date(post.updatedAt);
    return d > latest ? d : latest;
  }, siteUpdated);

  const abs = (path: string) => (path === "/" ? site.url : `${site.url}${path}`);

  return [
    {
      url: abs("/"),
      lastModified: siteUpdated,
      changeFrequency: "weekly",
      priority: 1,
      images: [
        abs("/images/hero.jpg"),
        abs("/images/residential.jpg"),
        abs("/images/metal-roof.jpg"),
        abs("/images/custom-fence.jpg"),
        abs("/images/commercial.jpg"),
      ],
    },
    {
      url: abs("/get-a-quote"),
      lastModified: siteUpdated,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: abs("/estimate"),
      lastModified: siteUpdated,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: abs("/products"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: abs("/products/roofing"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.9,
      images: [abs("/images/residential.jpg"), abs("/images/metal-roof.jpg"), abs("/images/commercial.jpg")],
    },
    {
      url: abs("/products/fencing"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.9,
      images: [abs("/images/custom-fence.jpg")],
    },
    {
      url: abs("/services"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.85,
      images: services.filter((s) => !s.image.endsWith(".svg")).map((s) => abs(s.image)),
    },
    {
      url: abs("/how-it-works"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: abs("/service-areas"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...SERVICE_AREAS.map((area) => ({
      url: abs(`/service-areas/${area.slug}`),
      lastModified: new Date(area.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: abs("/blog"),
      lastModified: latestBlogDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...BLOG_POSTS.map((post) => ({
      url: abs(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
      images: [abs(post.image)],
    })),
    {
      url: abs("/about"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: abs("/contact"),
      lastModified: siteUpdated,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: abs("/portal"),
      lastModified: siteUpdated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
