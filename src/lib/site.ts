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
  phone: "(555) 123-4567",
  phoneHref: "+15551234567",
  email: "info@tsroofingsystems.com",
  address: {
    street: "123 Main Street",
    city: "Your City",
    region: "ST",
    postalCode: "00000",
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
  serviceAreas: ["Your City", "Nearby Town", "Another Town", "Surrounding County"],
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
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/estimate", label: "3D Estimate" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
