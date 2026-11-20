# T&S Roofing Systems — Website & Interactive 3D Configurator

Professional, white-themed, SEO-optimized marketing site and interactive Three.js 3D exterior configurator built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Three.js + Zod + Vitest**.

## Commands

```bash
npm install
npm run dev          # Local dev server (http://localhost:3000)
npm run check        # Full quality gate: TypeScript strict check + ESLint + Vitest
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm test             # Run Vitest unit, schema & 3D collision tests
npm run test:watch   # Watch mode for Vitest
npm run build        # Production Next.js build
npm start            # Serve production build
```

## Architecture

```text
src/
├── app/                          # Next.js App Router pages & SEO routes (sitemap, robots, manifest, OG)
├── components/                   # Shared marketing & layout components (Header, Footer, ContactForm, ...)
├── lib/                          # Business metadata, services copy, reviews, JSON-LD schema helpers
└── features/
    └── configurator/             # Self-contained 3D Exterior Configurator feature module
        ├── index.ts              # Public barrel exports
        ├── catalogs/             # Declarative single-source-of-truth catalogs & ServicePlugins
        │   ├── property.ts       # Shared buildingType & stories step definitions
        │   ├── roofing.ts        # ROOF_MATERIAL_CATALOG (UI + PBR 3D specs + packages) & roofingPlugin
        │   └── fencing.ts        # FENCE_CATALOG (styles, finishes, heights, packages) & fencingPlugin
        ├── domain/               # Pure business logic, plugin registry & runtime validation
        │   ├── schemas.ts        # Zod v4 schemas + inferred TS types + validateCatalogIntegrity()
        │   ├── types.ts          # ServicePlugin, StepDef, Option, Callout, ServicePackageGroup contracts
        │   ├── registry.ts       # Central SERVICE_REGISTRY & cross-service bundle callouts
        │   ├── engine.ts         # Step composer, answer sanitizer, scene config derivation & packages
        │   └── validation.ts     # Form validation + shareable URL state serialize/parse/sanitize
        ├── three/                # Modular Three.js 3D architectural engine
        │   ├── types.ts          # SceneConfig, FenceSceneConfig, KeepOutBlock, RoofFace
        │   ├── collision.ts      # Pure exterior keep-out camera collision solver (unit-tested in Node)
        │   ├── assets.ts         # GPU texture/material cache (AssetLibrary) & resource disposal
        │   ├── textures.ts       # Procedural 1024px PBR roof, siding, masonry, fence, solar & sky maps
        │   ├── geometry.ts       # Reusable architectural mesh helpers (gable blocks, windows, seams)
        │   ├── fence.ts          # Instanced 3D fence & gate perimeter builder
        │   ├── house.ts          # Residential & commercial building assembler
        │   └── RoofScene.ts      # WebGL renderer, OrbitControls, lighting & animation controller
        ├── components/           # Focused configurator UI components
        │   ├── EstimateWizard.tsx
        │   ├── ServiceSelector.tsx
        │   ├── GuidedSteps.tsx
        │   ├── LiveDecorator.tsx
        │   ├── OptionVisual.tsx
        │   ├── PackagesResult.tsx
        │   ├── HouseViewer.tsx
        │   └── HouseViewerLazy.tsx
        └── __tests__/            # Automated Vitest suite
            ├── schemas.test.ts   # Catalog schema integrity, form validation & URL state sanitization
            ├── registry.test.ts  # Roofing/fencing catalog invariants & ServicePlugin registry checks
            ├── engine.test.ts    # Multi-service step composition, sanitizers, packages & scene derivation
            └── collision.test.ts # 3D camera keep-out bounds (zoom stop, roof glide, wall glide, ejection)
```

## Extending the Configurator

### 1. Add a new Fence style or finish
Edit `FENCE_CATALOG` in `src/features/configurator/catalogs/fencing.ts`:
- Add a new finish `{ id, label, color, postColor? }` to an existing style, or append a new `FenceStyleDef` object (picking one of the built-in 3D `geometry` presets, or adding a new preset to `FenceGeometryKindSchema` and `src/features/configurator/three/fence.ts`).
- Run `npm test` — `registry.test.ts` automatically validates hex colors, unique IDs, `defaultFinishId`, and package tiers.
- The new fence appears automatically in **Guided Steps**, **Decorate in 3D**, **Matching Packages**, **Share 3D URLs**, and the **3D yard scene**.

### 2. Add or tune a Roofing material
Edit `ROOF_MATERIAL_CATALOG` in `src/features/configurator/catalogs/roofing.ts` (and add the ID to `RoofMaterialSchema` / `FlatMaterialSchema` or `PitchedMaterialSchema` in `domain/schemas.ts`, plus its procedural texture recipe in `three/textures.ts`). Both the UI swatches/packages and the Three.js PBR surface parameters read from this single catalog.

### 3. Add a brand-new 3D Exterior Service (e.g., Siding, Gutters, Decks)
1. Add the service ID to `ServiceIdSchema` and its answer fields to `AnswersSchema` in `src/features/configurator/domain/schemas.ts`.
2. Create `src/features/configurator/catalogs/<service>.ts` implementing `ServicePlugin` (`steps`, `sanitize`, `seedDefaults`, `getPackageGroup`, `getCallouts`, `getBadges`, `getSpecSummary`).
3. Register the plugin in `SERVICE_REGISTRY` (`src/features/configurator/domain/registry.ts`).
4. Add its 3D builder under `src/features/configurator/three/` and wire its section into `deriveScene` (`domain/engine.ts`) and `LiveDecorator.tsx`.
5. Run `npm run check` to verify types, lint, catalog integrity, and tests.

## Before launch — checklist

1. **Business details** → edit `src/lib/site.ts` (name, phone, email, address, hours, service areas, license, social links, **production URL**). Everything (header, footer, metadata, sitemap, JSON-LD) reads from here. Or set `NEXT_PUBLIC_SITE_URL` in your host.
2. **Google reviews** → `src/lib/reviews.ts`. Sample placeholders are shown now. Replace with real reviews (or fetch from the Google Places API), put in your Google review link/profile URL in `site.ts` (`googleReviewLink`, `googleProfile`), then set `reviewSummary.verified = true` so `AggregateRating` structured data is emitted.
3. **Images** → `public/images/`. Swap in real project photos (keep file names, or update `src/lib/services.ts`).
4. **Contact form & 3D Estimate** → `src/components/ContactForm.tsx` and `src/features/configurator/components/PackagesResult.tsx` validate with Zod and currently open `mailto:`. Replace the submit handler with a Server Action or CRM/email endpoint for production.
5. **Google Search Console** → add the site, set `NEXT_PUBLIC_GSC_VERIFICATION` to your verification token, submit `/sitemap.xml`.
6. **Google Business Profile** → create/claim it with the same name, address and phone (NAP) as in `site.ts`.

## SEO features included

- Per-page `title` / `description` / canonical / Open Graph / Twitter metadata
- `RoofingContractor` (LocalBusiness) + `WebSite` + `FAQPage` + `BreadcrumbList` JSON-LD
- Auto-generated `sitemap.xml`, `robots.txt`, web manifest, OG image and icon
- Semantic HTML, single `h1` per page, skip link, keyboard-accessible nav, tabs, and FAQ
- `next/image` with `priority` on the LCP hero, lazy-loading elsewhere, `next/font` (no layout shift)
- Fully static pages (fast TTFB / Core Web Vitals)
