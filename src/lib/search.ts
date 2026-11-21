import { FENCE_CATALOG } from "@/features/configurator/catalogs/fencing";
import { ROOF_MATERIAL_CATALOG } from "@/features/configurator/catalogs/roofing";
import { BLOG_POSTS } from "./blog";
import { SERVICE_AREAS } from "./serviceAreas";
import { faqs, services } from "./services";
import { site } from "./site";

export type SearchCategory = "all" | "roofing" | "fencing" | "service" | "area" | "blog" | "faq" | "page";

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  href: string;
  category: Exclude<SearchCategory, "all">;
  categoryLabel: string;
  badge?: string;
  keywords: readonly string[];
  body: string;
}

export interface SearchResult extends SearchDocument {
  score: number;
}

export const SEARCH_CATEGORY_OPTIONS: readonly { value: SearchCategory; label: string }[] = [
  { value: "all", label: "All results" },
  { value: "roofing", label: "Roofing" },
  { value: "fencing", label: "Fencing" },
  { value: "service", label: "Services" },
  { value: "area", label: "Service Areas" },
  { value: "blog", label: "Guides & Blog" },
  { value: "faq", label: "FAQs" },
  { value: "page", label: "Tools & Pages" },
];

export const POPULAR_SEARCH_TERMS = [
  "standing-seam metal",
  "privacy fence",
  "75081",
  "commercial TPO",
  "solar panels",
  "storm damage",
  "warranty",
  "Miami",
] as const;

function buildSearchCorpus(): SearchDocument[] {
  const docs: SearchDocument[] = [];

  for (const mat of ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew)) {
    const features = mat.packages.flatMap((p) => [p.name, p.tagline, ...p.features]);
    docs.push({
      id: `roof-${mat.id}`,
      title: `${mat.label} Roofing System`,
      description: `${mat.description}. Starting around $${mat.pricePerSqFt.toFixed(2)}/sq ft with Essential, Signature, and Premium warranty tiers.`,
      href: `/products/roofing#${mat.id}`,
      category: "roofing",
      categoryLabel: "Roofing Product",
      badge: `From ~$${mat.pricePerSqFt.toFixed(2)}/sq ft`,
      keywords: [
        mat.id,
        mat.label,
        mat.supportsFlat ? "flat roof commercial low-slope" : "pitched roof residential",
        "roofing",
        "roof replacement",
        "solar",
      ],
      body: features.join(" "),
    });
  }

  for (const fence of FENCE_CATALOG) {
    const finishNames = fence.finishes.map((f) => f.label);
    const pkgText = fence.packages.flatMap((p) => [p.name, p.tagline, ...p.features]);
    docs.push({
      id: `fence-${fence.id}`,
      title: `${fence.label} Fence`,
      description: `${fence.shortDescription}. Starting around $${fence.pricePerLinearFt.toFixed(2)}/ft in 4 ft, 6 ft, and 8 ft heights.`,
      href: `/products/fencing#${fence.id}`,
      category: "fencing",
      categoryLabel: "Custom Fencing",
      badge: `From ~$${fence.pricePerLinearFt.toFixed(2)}/ft`,
      keywords: [fence.id, fence.label, "fence", "fencing", "gates", "privacy", ...finishNames],
      body: [...finishNames, ...pkgText].join(" "),
    });
  }

  for (const svc of services) {
    docs.push({
      id: `svc-${svc.slug}`,
      title: svc.title,
      description: svc.description,
      href: `/services#${svc.slug}`,
      category: "service",
      categoryLabel: "Service",
      keywords: [svc.slug, svc.title, ...svc.features],
      body: `${svc.short} ${svc.features.join(" ")}`,
    });
  }

  for (const area of SERVICE_AREAS) {
    docs.push({
      id: `area-${area.slug}`,
      title: area.headline,
      description: area.description,
      href: `/service-areas/${area.slug}`,
      category: "area",
      categoryLabel: `Service Area · ${area.state}`,
      badge: `ZIP ${area.featuredZip}`,
      keywords: [
        area.name,
        area.state,
        area.regionLabel,
        ...area.sampleZips,
        ...area.neighborhoods,
        area.popularRoof,
        area.popularFence,
      ],
      body: `${area.climateNotes} ${area.neighborhoods.join(" ")} ${area.faqs.map((f) => `${f.question} ${f.answer}`).join(" ")}`,
    });
  }

  for (const post of BLOG_POSTS) {
    docs.push({
      id: `blog-${post.slug}`,
      title: post.title,
      description: post.excerpt,
      href: `/blog/${post.slug}`,
      category: "blog",
      categoryLabel: `Guide · ${post.category}`,
      badge: `${post.readMinutes} min read`,
      keywords: [post.category, post.author, ...post.keywords],
      body: post.sections
        .map((s) => `${s.heading} ${s.paragraphs.join(" ")} ${(s.bullets ?? []).join(" ")}`)
        .join(" "),
    });
  }

  for (const item of faqs) {
    docs.push({
      id: `faq-${item.q.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: item.q,
      description: item.a,
      href: "/#faq-heading",
      category: "faq",
      categoryLabel: "FAQ",
      keywords: ["faq", "question", "roofing", "warranty", "cost", "insurance", "emergency"],
      body: item.a,
    });
  }

  docs.push(
    {
      id: "page-estimate",
      title: "Interactive 3D Roof & Fence Estimator",
      description:
        "Enter your ZIP code, pick your property address, customize roofing materials, solar panels, and custom fences live in 3D, and calculate an instant estimate.",
      href: "/estimate",
      category: "page",
      categoryLabel: "Interactive Tool",
      badge: "3D Calculator",
      keywords: ["3d", "calculator", "estimator", "configurator", "decorator", "zip", "instant estimate", "solar"],
      body: "3D exterior property configurator live decorator guided steps roofing fencing solar panels gates",
    },
    {
      id: "page-get-a-quote",
      title: "Get a Free Written Quote",
      description:
        "Submit your roofing or custom fencing details with optional property photos or HOA specs for an itemized written estimate within one business day.",
      href: "/get-a-quote",
      category: "page",
      categoryLabel: "Quote Form",
      keywords: ["free quote", "written estimate", "upload photos", "roofing quote", "fence quote"],
      body: "free no-obligation written quote itemized pricing photo upload",
    },
    {
      id: "page-how-it-works",
      title: "How It Works — 4-Step Roofing & Fencing Process",
      description:
        "From ZIP-based 3D design to free on-site laser measurement, HOA permitting, spotless 1–3 day installation, and 25-year workmanship warranty.",
      href: "/how-it-works",
      category: "page",
      categoryLabel: "Process",
      keywords: ["process", "steps", "hoa", "permits", "utility locate", "timeline", "inspection"],
      body: "4-step process inspection written proposal installation cleanup warranty",
    },
    {
      id: "page-portal",
      title: "Customer Portal — Track Your Project",
      description:
        "View live installation milestones, approved 3D specs, HOA submittal packets, warranty PDFs, and message your dedicated project manager.",
      href: "/portal",
      category: "page",
      categoryLabel: "Customer Portal",
      keywords: ["portal", "login", "project code", "milestones", "warranty pdf", "project manager"],
      body: "customer portal homeowner dashboard track progress documents",
    },
    {
      id: "page-about",
      title: `About ${site.name}`,
      description: `Locally owned, licensed, bonded, and insured roofing and fencing contractor serving homeowners and commercial properties since ${site.foundingYear}.`,
      href: "/about",
      category: "page",
      categoryLabel: "Company",
      keywords: ["about", "licensed", "bonded", "insured", "experience", "warranty", "company"],
      body: "20+ years experience 3500+ roofs completed 25-year workmanship warranty",
    },
    {
      id: "page-contact",
      title: `Contact ${site.name} (${site.phone})`,
      description: `Call ${site.phone} for 24/7 emergency roof repair or request a free on-site inspection. Office at ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}.`,
      href: "/contact",
      category: "page",
      categoryLabel: "Contact",
      keywords: ["contact", "phone", "email", "address", "emergency", "hours", site.phone, site.address.postalCode],
      body: `${site.hours} ${site.email} ${site.address.street} ${site.address.city}`,
    },
  );

  return docs;
}

const SEARCH_CORPUS: readonly SearchDocument[] = buildSearchCorpus();

export function getAllSearchDocuments(): readonly SearchDocument[] {
  return SEARCH_CORPUS;
}

export function isValidSearchCategory(value: string | undefined): value is SearchCategory {
  return SEARCH_CATEGORY_OPTIONS.some((o) => o.value === value);
}

/**
 * Deterministic, fast, server-and-client-safe site search across all roofing materials,
 * custom fence lines, services, service areas/ZIPs, homeowner guides, FAQs, and tools.
 */
export function searchSite(
  rawQuery: string,
  category: SearchCategory = "all",
): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  const scoped =
    category === "all"
      ? SEARCH_CORPUS
      : SEARCH_CORPUS.filter((doc) => doc.category === category);

  if (!query) {
    return scoped.map((doc) => ({ ...doc, score: 1 }));
  }

  const tokens = query
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const scored: SearchResult[] = [];

  for (const doc of scoped) {
    const titleLower = doc.title.toLowerCase();
    const descLower = doc.description.toLowerCase();
    const keywordsLower = doc.keywords.map((k) => k.toLowerCase());
    const bodyLower = doc.body.toLowerCase();
    const combined = `${titleLower} ${descLower} ${keywordsLower.join(" ")} ${bodyLower}`;

    let score = 0;

    if (titleLower === query) score += 100;
    else if (titleLower.includes(query)) score += 45;

    if (keywordsLower.some((k) => k === query)) score += 60;
    else if (keywordsLower.some((k) => k.includes(query))) score += 25;

    if (descLower.includes(query)) score += 20;
    if (bodyLower.includes(query)) score += 10;

    let matchedTokens = 0;
    for (const token of tokens) {
      if (combined.includes(token)) {
        matchedTokens++;
        if (titleLower.includes(token)) score += 14;
        if (keywordsLower.some((k) => k.includes(token))) score += 10;
        if (descLower.includes(token)) score += 6;
        if (bodyLower.includes(token)) score += 3;
      }
    }

    // Require either a full-phrase hit or at least half of multi-word tokens matching
    const minTokens = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.6);
    if (score > 0 && matchedTokens >= minTokens) {
      scored.push({ ...doc, score });
    }
  }

  return scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
