# T&S Roofing Systems — Website

Professional, white-themed, SEO-optimized marketing site built with **Next.js (App Router) + TypeScript + Tailwind CSS**.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Before launch — checklist

1. **Business details** → edit `src/lib/site.ts` (name, phone, email, address, hours, service areas, license, social links, **production URL**). Everything (header, footer, metadata, sitemap, JSON-LD) reads from here. Or set `NEXT_PUBLIC_SITE_URL` in your host.
2. **Google reviews** → `src/lib/reviews.ts`. Sample placeholders are shown now. Replace with real reviews (or fetch from the Google Places API), put in your Google review link/profile URL in `site.ts` (`googleReviewLink`, `googleProfile`), then set `reviewSummary.verified = true` so `AggregateRating` structured data is emitted.
3. **Images** → `public/images/`. `hero.jpg`, `residential.jpg`, `commercial.jpg` are AI-generated placeholders; `repair.svg`, `metal.svg`, `about.svg` are illustrations. Swap in real project photos (keep file names, or update `src/lib/services.ts`).
4. **Contact form & 3D Estimate** → `src/components/ContactForm.tsx` and `/estimate` (`src/components/estimate/PackagesResult.tsx`) open the visitor's email app (`mailto:`). Replace with a server action / form service for production.
5. **Address autocomplete** → `src/app/api/address-suggest/route.ts` uses OpenStreetMap Nominatim (with local fallback). Set `GOOGLE_MAPS_API_KEY` in your host to upgrade to Google Places Autocomplete (New).
6. **Google Search Console** → add the site, set `NEXT_PUBLIC_GSC_VERIFICATION` to your verification token, submit `/sitemap.xml`.
7. **Google Business Profile** → create/claim it with the same name, address and phone (NAP) as in `site.ts` — this is the biggest factor for local search ranking.

## SEO features included

- Per-page `title` / `description` / canonical / Open Graph / Twitter metadata
- `RoofingContractor` (LocalBusiness) + `WebSite` + `FAQPage` + `BreadcrumbList` JSON-LD
- Auto-generated `sitemap.xml`, `robots.txt`, web manifest, OG image and icon
- Semantic HTML, single `h1` per page, skip link, keyboard-accessible nav and FAQ
- `next/image` with `priority` on the LCP hero, lazy-loading elsewhere, `next/font` (no layout shift)
- Fully static pages (fast TTFB / Core Web Vitals)
