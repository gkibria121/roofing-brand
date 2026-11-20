/**
 * Single source of truth for business details.
 * Replace the placeholder values below with the real ones — they feed the
 * header, footer, contact page, metadata, sitemap and structured data (JSON-LD).
 */
export const site = {
  name: "T&S Roofing Systems",
  shortName: "T&S Roofing",
  tagline: "Roofing you can trust, built to last.",
  description:
    "T&S Roofing Systems provides professional residential and commercial roofing: roof replacement, repair, metal roofing, flat roofing, inspections and 24/7 emergency service. Free written estimates.",
  // Production URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL in your host.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tsroofingsystems.com",
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

export const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/blog", label: "Blog" },
  { href: "/portal", label: "Customer Portal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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
