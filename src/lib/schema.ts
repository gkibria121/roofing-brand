import { FENCE_CATALOG } from "@/features/configurator/catalogs/fencing";
import { ROOF_MATERIAL_CATALOG } from "@/features/configurator/catalogs/roofing";
import { getBlogWordCount, type BlogPost } from "./blog";
import { reviewSummary } from "./reviews";
import { SERVICE_AREAS, type ServiceAreaInfo } from "./serviceAreas";
import { faqs, services } from "./services";
import { getVerifiedSocialUrls, site } from "./site";

const BUSINESS_ID = `${site.url}/#business`;
const WEBSITE_ID = `${site.url}/#website`;

function absUrl(path: string): string {
  if (path === "/" || path === "") return site.url;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${clean}`;
}

export function localBusinessSchema() {
  const sameAs = getVerifiedSocialUrls();
  const offeredRoofs = ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew);

  return {
    "@context": "https://schema.org",
    "@type": "RoofingContractor",
    "@id": BUSINESS_ID,
    name: site.name,
    alternateName: site.shortName,
    url: site.url,
    description: site.description,
    slogan: site.tagline,
    image: [absUrl("/images/hero.jpg"), absUrl("/opengraph-image")],
    logo: {
      "@type": "ImageObject",
      url: absUrl("/apple-icon"),
      width: 180,
      height: 180,
    },
    telephone: site.phone,
    email: site.email,
    priceRange: "$$",
    foundingDate: String(site.foundingYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: site.phone,
        email: site.email,
        contactType: "customer service",
        availableLanguage: "English",
        areaServed: "US",
      },
      {
        "@type": "ContactPoint",
        telephone: site.phone,
        contactType: "emergency",
        availableLanguage: "English",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
      },
    ],
    openingHoursSpecification: site.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: SERVICE_AREAS.map((area) => ({
      "@type": "AdministrativeArea",
      name: `${area.name}, ${area.state}`,
      url: absUrl(`/service-areas/${area.slug}`),
    })),
    knowsAbout: [
      "Residential Roofing",
      "Commercial Flat Roofing",
      "Standing-Seam Metal Roofing",
      "Architectural Asphalt Shingles",
      "TPO & Modified Bitumen Roofing",
      "Solar-Ready Roof Installation",
      "Emergency Roof Leak Repair",
      "Custom Privacy & Architectural Fencing",
      "3D Exterior Property Visualization",
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Roofing & Custom Fencing Services",
      itemListElement: [
        ...services.map((s) => ({
          "@type": "Offer",
          url: absUrl(`/services#${s.slug}`),
          itemOffered: {
            "@type": "Service",
            name: s.title,
            description: s.short,
            url: absUrl(`/services#${s.slug}`),
          },
        })),
        ...offeredRoofs.map((m) => ({
          "@type": "Offer",
          url: absUrl(`/products/roofing#${m.id}`),
          priceCurrency: "USD",
          price: m.pricePerSqFt.toFixed(2),
          itemOffered: {
            "@type": "Service",
            name: `${m.label} Roofing Installation`,
            description: m.description,
          },
        })),
        ...FENCE_CATALOG.map((f) => ({
          "@type": "Offer",
          url: absUrl(`/products/fencing#${f.id}`),
          priceCurrency: "USD",
          price: f.pricePerLinearFt.toFixed(2),
          itemOffered: {
            "@type": "Service",
            name: `${f.label} Fence Installation`,
            description: f.shortDescription,
          },
        })),
      ],
    },
    // Only emitted once real, verified numbers are set in lib/reviews.ts
    ...(reviewSummary.verified
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.rating,
            reviewCount: reviewSummary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: "en-US",
    publisher: { "@id": BUSINESS_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageSchema({
  name,
  description,
  path,
  type = "WebPage",
}: {
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "SearchResultsPage";
}) {
  const url = absUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": BUSINESS_ID },
    ...(type === "AboutPage" || type === "ContactPage"
      ? { mainEntity: { "@id": BUSINESS_ID } }
      : {}),
  };
}

export function faqSchema(
  customFaqs?: readonly ({ question: string; answer: string } | { q: string; a: string })[],
) {
  const entries = customFaqs
    ? customFaqs.map((f) => ("question" in f ? { q: f.question, a: f.answer } : f))
    : faqs;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * Generates a Google-compliant BreadcrumbList JSON-LD.
 * Automatically prepends `Home` (`/`) when not already the first item so every subpage
 * emits a valid 2+ level breadcrumb hierarchy matching the visible breadcrumb nav.
 */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const normalized =
    items.length > 0 && items[0].path === "/"
      ? items
      : [{ name: "Home", path: "/" }, ...items];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: normalized.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function howToSchema({
  name,
  description,
  path,
  steps,
}: {
  name: string;
  description: string;
  path: string;
  steps: readonly { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    url: absUrl(path),
    step: steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function serviceCatalogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} Services`,
    itemListElement: services.map((s, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.description,
        url: absUrl(`/services#${s.slug}`),
        image: absUrl(s.image),
        provider: { "@id": BUSINESS_ID },
        areaServed: SERVICE_AREAS.map((a) => `${a.name}, ${a.state}`),
      },
    })),
  };
}

export function roofingProductsSchema() {
  const offered = ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Roofing Systems Catalog",
    itemListElement: offered.map((mat, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: `${mat.label} Roofing System`,
        description: mat.description,
        category: mat.supportsFlat ? "Commercial Flat Roofing" : "Residential Pitched Roofing",
        url: absUrl(`/products/roofing#${mat.id}`),
        brand: { "@type": "Brand", name: site.name },
        offers: {
          "@type": "Offer",
          url: absUrl(`/products/roofing#${mat.id}`),
          priceCurrency: "USD",
          price: mat.pricePerSqFt.toFixed(2),
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: mat.pricePerSqFt.toFixed(2),
            priceCurrency: "USD",
            unitCode: "FTK",
            unitText: "sq ft",
          },
          availability: "https://schema.org/InStock",
          seller: { "@id": BUSINESS_ID },
        },
      },
    })),
  };
}

export function fencingProductsSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Custom Fencing Catalog",
    itemListElement: FENCE_CATALOG.map((fence, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: `${fence.label} Fence`,
        description: fence.shortDescription,
        category: "Custom Exterior Fencing",
        url: absUrl(`/products/fencing#${fence.id}`),
        brand: { "@type": "Brand", name: site.name },
        color: fence.finishes.map((f) => f.label).join(", "),
        offers: {
          "@type": "Offer",
          url: absUrl(`/products/fencing#${fence.id}`),
          priceCurrency: "USD",
          price: fence.pricePerLinearFt.toFixed(2),
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: fence.pricePerLinearFt.toFixed(2),
            priceCurrency: "USD",
            unitCode: "FOT",
            unitText: "linear ft",
          },
          availability: "https://schema.org/InStock",
          seller: { "@id": BUSINESS_ID },
        },
      },
    })),
  };
}

export function serviceAreasListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} Service Areas`,
    itemListElement: SERVICE_AREAS.map((area, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: `${area.name}, ${area.state}`,
      url: absUrl(`/service-areas/${area.slug}`),
    })),
  };
}

export function serviceAreaSchema(area: ServiceAreaInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: area.headline,
    description: `${area.description} ${area.climateNotes}`,
    serviceType: "Roofing & Custom Fencing Installation",
    url: absUrl(`/service-areas/${area.slug}`),
    provider: { "@id": BUSINESS_ID },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: `${area.name}, ${area.state}`,
      },
      ...area.neighborhoods.map((n) => ({
        "@type": "Place",
        name: `${n}, ${area.state}`,
      })),
      ...area.sampleZips.map((z) => ({
        "@type": "PostalAddress",
        postalCode: z,
        addressRegion: area.state,
        addressCountry: "US",
      })),
    ],
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "0",
      description: `Free on-site roofing & custom fencing inspection and written estimate in ${area.name}, ${area.state}.`,
      url: absUrl(`/estimate?zip=${area.featuredZip}`),
    },
  };
}

export function blogIndexSchema(posts: readonly BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": absUrl("/blog#blog"),
    name: `${site.name} Exterior Blog`,
    description:
      "Homeowner guides on standing-seam metal vs. asphalt shingles, custom privacy fencing, storm damage inspections, and project planning.",
    url: absUrl("/blog"),
    inLanguage: "en-US",
    publisher: { "@id": BUSINESS_ID },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: absUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { "@type": "Organization", name: post.author },
    })),
  };
}

export function blogPostingSchema(post: BlogPost) {
  const url = absUrl(`/blog/${post.slug}`);
  const isNamedPerson = post.author.includes(",");
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: post.title,
    description: post.excerpt,
    image: [absUrl(`/blog/${post.slug}/opengraph-image`), absUrl(post.image)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "en-US",
    articleSection: post.category,
    keywords: post.keywords.join(", "),
    wordCount: getBlogWordCount(post),
    timeRequired: `PT${post.readMinutes}M`,
    author: isNamedPerson
      ? {
          "@type": "Person",
          name: post.author.split(",")[0].trim(),
          jobTitle: post.author.split(",").slice(1).join(",").trim(),
        }
      : {
          "@type": "Organization",
          name: post.author,
          url: site.url,
        },
    publisher: { "@id": BUSINESS_ID },
  };
}

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${site.name} 3D Roof & Fence Estimator`,
    url: absUrl("/estimate"),
    applicationCategory: "DesignApplication",
    operatingSystem: "Any (Web Browser)",
    browserRequirements: "Requires JavaScript and WebGL for interactive 3D preview",
    description:
      "Interactive 3D exterior property configurator to compare asphalt, standing-seam metal, TPO flat roofs, solar arrays, and 6 custom fence styles with instant estimates.",
    provider: { "@id": BUSINESS_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
