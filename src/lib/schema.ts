import { site } from "./site";
import { reviewSummary } from "./reviews";
import { faqs, services } from "./services";

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RoofingContractor",
    "@id": `${site.url}/#business`,
    name: site.name,
    url: site.url,
    description: site.description,
    image: `${site.url}/opengraph-image`,
    logo: `${site.url}/icon.svg`,
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
    openingHoursSpecification: site.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: site.serviceAreas.map((name) => ({ "@type": "City", name })),
    sameAs: [site.social.facebook, site.social.instagram, site.social.googleProfile],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Roofing services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.short },
      })),
    },
    // Only emitted once real, verified numbers are set in lib/reviews.ts
    ...(reviewSummary.verified
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.rating,
            reviewCount: reviewSummary.count,
          },
        }
      : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    publisher: { "@id": `${site.url}/#business` },
  };
}

export function faqSchema(
  customFaqs?: readonly { question: string; answer: string }[],
) {
  const entries = customFaqs
    ? customFaqs.map((f) => ({ q: f.question, a: f.answer }))
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

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}
