/**
 * Single source of truth for business details.
 * Replace the placeholder values below with the real ones — they feed the
 * header, footer, contact page, metadata, sitemap and structured data (JSON-LD).
 */

const normalizedSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tsroofingsystems.com"
).replace(/\/+$/, "");

/** Stable ISO date representing the latest substantive marketing-content update (used by sitemap.xml). */
export const SITE_CONTENT_UPDATED_AT = "2026-11-21";

export const site = {
  name: "T&S Roofing Systems",
  shortName: "T&S Roofing",
  tagline: "Roofing you can trust, built to last.",
  description:
    "T&S Roofing Systems installs residential and commercial roofing (asphalt, standing-seam metal, TPO flat roofs) and custom fencing. Preview your property in 3D and request a free written estimate.",
  // Production URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL in your host.
  url: normalizedSiteUrl,
  phone: "1-888-374-3661",
  phoneHref: "+18883743661",
  email: "info@tsroofingsystems.com",
  address: {
    street: "123 Main Street",
    city: "Richardson",
    region: "TX",
    postalCode: "75081",
    country: "US",
  },
  hours: "Mon–Sat 7:00 AM – 6:00 PM · 24/7 emergency service",
  // Opening hours in schema.org format
  openingHours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "07:00",
      closes: "18:00",
    },
  ],
  serviceAreas: [
    "Richardson & North Dallas",
    "Dallas–Fort Worth",
    "Austin & Central Texas",
    "Miami & South Florida",
    "Greater Chicago",
  ],
  foundingYear: 2005,
  licenseNumber: "License # 000000",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    // Add your Google Business Profile links here:
    googleProfile: "https://www.google.com/maps",
    googleReviewLink: "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID",
  },
  stats: [
    { value: "20+", label: "Years of experience" },
    { value: "3,500+", label: "Roofs completed" },
    { value: "25-yr", label: "Workmanship warranty" },
    { value: "24/7", label: "Emergency response" },
  ],
} as const;

const PLACEHOLDER_SOCIAL_URLS = new Set([
  "https://www.facebook.com/",
  "https://www.facebook.com",
  "https://www.instagram.com/",
  "https://www.instagram.com",
  "https://www.google.com/maps",
  "https://www.google.com/maps/",
]);

/**
 * Returns only verified, non-placeholder profile URLs for Schema.org `sameAs`.
 * Prevents emitting generic root domains (like facebook.com/) that harm entity reconciliation.
 */
export function getVerifiedSocialUrls(): string[] {
  return [site.social.facebook, site.social.instagram, site.social.googleProfile].filter(
    (url) => url.startsWith("https://") && !PLACEHOLDER_SOCIAL_URLS.has(url),
  );
}

export const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/blog", label: "Blog" },
  { href: "/portal", label: "Customer Portal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/search", label: "Search" },
] as const;

export const productNavItems = [
  {
    href: "/products/roofing",
    label: "Roofing Systems",
    description: "Asphalt, standing-seam metal, TPO & flat roofs",
  },
  {
    href: "/products/fencing",
    label: "Custom Fencing",
    description: "Wood privacy, vinyl, iron, picket, slat & chain link",
  },
  {
    href: "/products",
    label: "All Products",
    description: "Compare every roof and fence system side by side",
  },
] as const;

export const productsMegaMenu = {
  promo: {
    title: "3D Exterior Calculator",
    description: "Build your dream roof & fence and get an estimate instantly",
    ctaLabel: "Go to 3D calculator",
    href: "/estimate",
    image: "/images/hero.jpg",
  },
  quickLinks: [
    { label: "Asphalt", href: "/products/roofing#asphalt" },
    { label: "Metal Roof", href: "/products/roofing#metal" },
    { label: "Wood Fence", href: "/products/fencing#wood-privacy" },
    { label: "Modern Slat", href: "/products/fencing#horizontal-slat" },
  ],
  allLink: {
    label: "All Products",
    href: "/products",
  },
  visualCards: [
    {
      label: "Residential Roofing",
      href: "/products/roofing",
      image: "/images/residential.jpg",
      alt: "Residential architectural shingle roof installation",
    },
    {
      label: "Metal & Solar",
      href: "/products/roofing#metal",
      image: "/images/metal-roof.jpg",
      alt: "Standing-seam metal roof with integrated solar panels",
    },
    {
      label: "Custom Fencing",
      href: "/products/fencing",
      image: "/images/custom-fence.jpg",
      alt: "Custom Western Red Cedar horizontal slat backyard fence",
    },
    {
      label: "Commercial",
      href: "/products/roofing#tpo",
      image: "/images/commercial.jpg",
      alt: "Commercial reflective flat TPO roofing system",
    },
  ],
} as const;
