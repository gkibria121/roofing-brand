export interface BlogPost {
  slug: string;
  title: string;
  category: "Roofing" | "Fencing" | "Planning";
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  author: string;
  image: string;
  imageAlt: string;
  keywords: readonly string[];
  sections: readonly {
    heading: string;
    paragraphs: readonly string[];
    bullets?: readonly string[];
  }[];
  ctaLabel: string;
  ctaHref: string;
}

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: "metal-vs-asphalt-roof-cost-guide",
    title: "Standing-Seam Metal vs. Architectural Shingles: Complete 2026 Cost & Lifespan Guide",
    category: "Roofing",
    excerpt:
      "Compare upfront installation pricing, 30-year total ownership cost, hail durability, energy savings, and solar-panel readiness for your home.",
    publishedAt: "2026-10-18",
    updatedAt: "2026-11-10",
    readMinutes: 6,
    author: "T&S Engineering Team",
    image: "/images/metal-roof.jpg",
    imageAlt: "Standing-seam metal roof with solar panels compared alongside residential shingle roofing",
    keywords: [
      "standing-seam metal roof cost",
      "metal vs asphalt shingles",
      "architectural shingle lifespan",
      "solar ready metal roofing",
      "Class 4 hail rated shingles",
    ],
    sections: [
      {
        heading: "Upfront cost vs. lifetime value",
        paragraphs: [
          "Architectural asphalt shingles remain the most popular choice for homeowners prioritizing a balanced upfront investment, typically running between $5.25 and $8.20 per square foot depending on underlayment and warranty tier.",
          "Concealed-fastener standing-seam metal costs more on day one ($9.85–$15.25/sq ft), yet routinely lasts 45–60 years—often outlasting two full asphalt replacement cycles while cutting summer cooling loads.",
        ],
      },
      {
        heading: "How each material performs with solar panels",
        paragraphs: [
          "If you plan to add solar panels within the next decade, roof choice matters immediately. Standing-seam metal allows zero-penetration S-5! seam clamps that mount solar racking without drilling a single hole through the roof deck.",
        ],
        bullets: [
          "Architectural shingles: 25–30 yr lifespan, Class 4 hail-rated upgrades available, classic neighborhood aesthetic.",
          "Standing-seam metal: 50+ yr lifespan, zero exposed fasteners, clamp-on solar ready, high wind uplift resistance.",
          "Both options can be previewed side-by-side on your house in our interactive 3D estimator.",
        ],
      },
    ],
    ctaLabel: "Compare Asphalt & Metal in 3D",
    ctaHref: "/estimate?services=roofing&mode=decorate&view=new&slope=moderate&desiredType=metal&solar=yes",
  },
  {
    slug: "choosing-the-right-privacy-fence",
    title: "How to Choose the Best Privacy Fence Style & Height for Your Property",
    category: "Fencing",
    excerpt:
      "Western Red Cedar, solid vinyl, horizontal modern slats, or ornamental iron? Learn how material, post type, and height impact curb appeal and longevity.",
    publishedAt: "2026-10-04",
    updatedAt: "2026-11-05",
    readMinutes: 5,
    author: "T&S Exterior Specialists",
    image: "/images/custom-fence.jpg",
    imageAlt: "Custom Western Red Cedar horizontal slat privacy fence enclosing a backyard",
    keywords: [
      "privacy fence styles",
      "Western Red Cedar fence",
      "horizontal modern slat fence",
      "steel post fence longevity",
      "6 ft vs 8 ft privacy fence",
    ],
    sections: [
      {
        heading: "Matching fence style to home architecture",
        paragraphs: [
          "A great fence frames your home rather than fighting it. Traditional gable homes pair naturally with 6 ft board-on-board cedar or crisp white vinyl privacy, while modern and transitional facades shine with warm redwood horizontal slats on matte-black steel posts.",
        ],
      },
      {
        heading: "Why post selection is the #1 longevity factor",
        paragraphs: [
          "Most wood fences fail at the ground line long before the cedar pickets wear out. Upgrading to hidden galvanized steel posts set in deep concrete prevents ground-contact rot and keeps gates swinging smoothly for 15–20+ years.",
        ],
        bullets: [
          "4 ft height: Ideal for decorative front yards, classic picket lines, and HOA-restricted street edges.",
          "6 ft height: Standard residential backyard privacy with strong wind performance.",
          "8 ft height: Maximum acoustic privacy, sloped-lot coverage, and commercial perimeter security.",
        ],
      },
    ],
    ctaLabel: "Decorate Your Yard with 3D Fencing",
    ctaHref: "/estimate?services=fencing&mode=decorate&fenceStyle=horizontal-slat&fencePlacement=full-perimeter",
  },
  {
    slug: "coordinating-roof-and-fence-projects",
    title: "Replacing Your Roof and Fence Together: Sequencing Tips That Save Thousands",
    category: "Planning",
    excerpt:
      "Bundling exterior upgrades streamlines permitting and crew mobilization—here is why order of operations protects your new landscaping and fence.",
    publishedAt: "2026-09-21",
    updatedAt: "2026-10-28",
    readMinutes: 4,
    author: "Marcus Torres, Lead Project Manager",
    image: "/images/hero.jpg",
    imageAlt: "Modern residential home exterior showcasing coordinated charcoal roof and perimeter fencing",
    keywords: [
      "replace roof and fence together",
      "exterior renovation sequencing",
      "roof tear-off before fence",
      "HOA exterior approval packet",
      "bundled roofing and fencing quote",
    ],
    sections: [
      {
        heading: "Always complete roof tear-off before fence installation",
        paragraphs: [
          "Roof tear-off involves dumpster placement, shingle bundles, and overhead debris chutes. Scheduling your roofing crew first ensures heavy equipment never scratches or dents newly stained cedar boards or powder-coated iron panels.",
        ],
      },
      {
        heading: "Single inspection, unified material palette",
        paragraphs: [
          "Choosing both your roof finish and fence stain together lets you harmonize charcoal metal panels with dark walnut slats or slate shingles with satin-black iron—something you can preview live in one 3D scene before ordering materials.",
        ],
        bullets: [
          "One dedicated project manager coordinating deliveries, utility locates, and HOA packets.",
          "Shared magnetic nail sweep across the entire driveway and perimeter yard.",
          "Multi-service scheduling priority with unified workmanship warranty documentation.",
        ],
      },
    ],
    ctaLabel: "Combine Roof & Fence in 3D",
    ctaHref: "/estimate?services=roofing,fencing&mode=decorate&view=new&desiredType=metal&fenceStyle=wood-privacy",
  },
  {
    slug: "storm-damage-roof-inspection-checklist",
    title: "Post-Storm Roof & Perimeter Checklist: 7 Signs to Catch Early",
    category: "Roofing",
    excerpt:
      "After high winds or hail, subtle damage around flashing, ridge vents, and fence posts can turn into costly leaks if missed. Here is what our inspectors check.",
    publishedAt: "2026-09-06",
    updatedAt: "2026-10-15",
    readMinutes: 5,
    author: "T&S Inspection Crew",
    image: "/images/residential.jpg",
    imageAlt: "Residential roof inspection after wind and hail storm",
    keywords: [
      "storm damage roof inspection",
      "hail damage shingle signs",
      "roof leak checklist",
      "insurance claim roof documentation",
      "emergency roof tarping",
    ],
    sections: [
      {
        heading: "What you can safely spot from the ground",
        paragraphs: [
          "Never climb onto a wet or steep roof after a storm. Start from the driveway with binoculars: check for dark granule piles at downspout exits, dented metal vents, lifted shingle tabs, or leaning fence corner posts.",
        ],
        bullets: [
          "Granule buildup in gutters or splash blocks indicating hail bruising.",
          "Lifted chimney, skylight, or plumbing-boot flashing seams.",
          "Ceiling spots or damp attic insulation around roof valleys.",
          "Loose gate latches or shifted terminal fence posts after heavy soil saturation.",
        ],
      },
    ],
    ctaLabel: "Request a Free Inspection Quote",
    ctaHref: "/estimate",
  },
];

export const BLOG_CATEGORIES = ["Roofing", "Fencing", "Planning"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getBlogWordCount(post: BlogPost): number {
  const parts: string[] = [post.title, post.excerpt];
  for (const section of post.sections) {
    parts.push(section.heading, ...section.paragraphs, ...(section.bullets ?? []));
  }
  return parts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
