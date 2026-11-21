import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { BLOG_POSTS, getBlogWordCount } from "@/lib/blog";
import {
  blogIndexSchema,
  blogPostingSchema,
  breadcrumbSchema,
  faqSchema,
  fencingProductsSchema,
  howToSchema,
  localBusinessSchema,
  roofingProductsSchema,
  serviceAreaSchema,
  serviceAreasListSchema,
  serviceCatalogSchema,
  webApplicationSchema,
  webPageSchema,
  websiteSchema,
} from "@/lib/schema";
import { searchSite } from "@/lib/search";
import { buildPageMetadata } from "@/lib/seo";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { site } from "@/lib/site";

describe("SEO metadata helper (buildPageMetadata)", () => {
  it("generates complete canonical, OpenGraph, and Twitter metadata for standard pages", () => {
    const meta = buildPageMetadata({
      title: "Roofing Systems",
      description: "Compare asphalt, standing-seam metal, and TPO flat roofs.",
      path: "/products/roofing",
      keywords: ["metal roofing", "TPO"],
    });

    expect(meta.alternates?.canonical).toBe("/products/roofing");
    expect(meta.openGraph).toMatchObject({
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: "/products/roofing",
      title: `Roofing Systems | ${site.name}`,
      description: "Compare asphalt, standing-seam metal, and TPO flat roofs.",
      images: [expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })],
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: `Roofing Systems | ${site.name}`,
      images: ["/opengraph-image"],
    });
    expect(meta.robots).toBeUndefined();
  });

  it("emits OpenGraph article timestamps, authors, section, and tags for blog posts", () => {
    const meta = buildPageMetadata({
      title: "Metal vs Asphalt Guide",
      description: "Cost and lifespan guide.",
      path: "/blog/metal-vs-asphalt-roof-cost-guide",
      openGraphType: "article",
      article: {
        publishedTime: "2026-10-18T00:00:00.000Z",
        modifiedTime: "2026-11-10T00:00:00.000Z",
        authors: ["T&S Engineering Team"],
        section: "Roofing",
        tags: ["metal roof", "shingles"],
      },
    });

    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-10-18T00:00:00.000Z",
      modifiedTime: "2026-11-10T00:00:00.000Z",
      section: "Roofing",
    });
  });

  it("sets noindex, follow when noIndex is enabled", () => {
    const meta = buildPageMetadata({
      title: "Search Results",
      description: "Search results page",
      path: "/search",
      noIndex: true,
    });

    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });
});

describe("Structured data (JSON-LD schemas)", () => {
  it("emits valid RoofingContractor LocalBusiness without placeholder sameAs URLs", () => {
    const schema = localBusinessSchema();
    expect(schema["@type"]).toBe("RoofingContractor");
    expect(schema["@id"]).toBe(`${site.url}/#business`);
    expect(schema.areaServed).toHaveLength(SERVICE_AREAS.length);
    expect(schema.contactPoint).toHaveLength(2);
    expect("sameAs" in schema).toBe(false);
    expect("aggregateRating" in schema).toBe(false);
  });

  it("emits WebSite schema with SearchAction targeting /search?q=", () => {
    const schema = websiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.potentialAction["@type"]).toBe("SearchAction");
    expect(schema.potentialAction.target.urlTemplate).toBe(`${site.url}/search?q={search_term_string}`);
  });

  it("always starts BreadcrumbList at Home (position 1) with valid absolute URLs", () => {
    const schema = breadcrumbSchema([{ name: "Blog", path: "/blog" }]);
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0]).toMatchObject({
      position: 1,
      name: "Home",
      item: site.url,
    });
    expect(schema.itemListElement[1]).toMatchObject({
      position: 2,
      name: "Blog",
      item: `${site.url}/blog`,
    });
  });

  it("does not duplicate Home when already provided in breadcrumbSchema", () => {
    const schema = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]);
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].name).toBe("Home");
  });

  it("emits rich BlogPosting, ServiceArea, Product, HowTo, WebApplication, and FAQ schemas", () => {
    const post = BLOG_POSTS[0];
    const postSchema = blogPostingSchema(post);
    expect(postSchema["@type"]).toBe("BlogPosting");
    expect(postSchema.wordCount).toBe(getBlogWordCount(post));
    expect(postSchema.timeRequired).toBe(`PT${post.readMinutes}M`);
    expect(postSchema.dateModified).toBe(post.updatedAt);

    const area = SERVICE_AREAS[0];
    const areaSchema = serviceAreaSchema(area);
    expect(areaSchema["@type"]).toBe("Service");
    expect(areaSchema.areaServed.length).toBeGreaterThan(area.sampleZips.length);

    expect(roofingProductsSchema().itemListElement.length).toBeGreaterThanOrEqual(4);
    expect(fencingProductsSchema().itemListElement).toHaveLength(6);
    expect(serviceCatalogSchema().itemListElement).toHaveLength(5);
    expect(serviceAreasListSchema().itemListElement).toHaveLength(SERVICE_AREAS.length);
    expect(blogIndexSchema(BLOG_POSTS).blogPost).toHaveLength(BLOG_POSTS.length);
    expect(webApplicationSchema()["@type"]).toBe("WebApplication");
    expect(faqSchema().mainEntity.length).toBeGreaterThan(0);
    expect(
      howToSchema({
        name: "Process",
        description: "Desc",
        path: "/how-it-works",
        steps: [{ name: "Step 1", text: "Details" }],
      }).step,
    ).toHaveLength(1);
    expect(
      webPageSchema({ name: "About", description: "About us", path: "/about", type: "AboutPage" })[
        "@type"
      ],
    ).toBe("AboutPage");
  });
});

describe("sitemap.xml and robots.txt", () => {
  it("generates all static and dynamic canonical URLs with real lastModified dates", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(site.url);
    expect(urls).toContain(`${site.url}/products/roofing`);
    expect(urls).toContain(`${site.url}/products/fencing`);
    expect(urls).toContain(`${site.url}/estimate`);
    expect(urls).toContain(`${site.url}/get-a-quote`);

    for (const area of SERVICE_AREAS) {
      expect(urls).toContain(`${site.url}/service-areas/${area.slug}`);
    }
    for (const post of BLOG_POSTS) {
      const entry = entries.find((e) => e.url === `${site.url}/blog/${post.slug}`);
      expect(entry).toBeDefined();
      expect(entry?.lastModified).toEqual(new Date(post.updatedAt));
    }

    // No accidental double slashes in paths
    for (const url of urls) {
      expect(url.replace(/^https?:\/\//, "")).not.toContain("//");
    }
  });

  it("allows crawling and links sitemap.xml in robots.txt", () => {
    const r = robots();
    expect(r.sitemap).toBe(`${site.url}/sitemap.xml`);
    expect(r.host).toBe(site.url);
  });
});

describe("Site-wide search engine (searchSite)", () => {
  it("matches roofing products, fence styles, ZIP codes, and blog posts accurately", () => {
    const metalHits = searchSite("standing-seam metal");
    expect(metalHits.length).toBeGreaterThan(0);
    expect(metalHits.some((r) => r.href.includes("/products/roofing#metal"))).toBe(true);

    const zipHits = searchSite("75081");
    expect(zipHits.some((r) => r.href === "/service-areas/richardson-tx")).toBe(true);

    const fenceHits = searchSite("cedar", "fencing");
    expect(fenceHits.length).toBeGreaterThan(0);
    expect(fenceHits.every((r) => r.category === "fencing")).toBe(true);

    const noHits = searchSite("xyznonexistentterm999");
    expect(noHits).toHaveLength(0);
  });
});
