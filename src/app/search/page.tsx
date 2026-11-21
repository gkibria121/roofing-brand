import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { SiteSearchClient } from "@/components/SiteSearchClient";
import { breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { isValidSearchCategory, type SearchCategory } from "@/lib/search";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

type SearchParamsInput = Promise<{ q?: string | string[]; category?: string | string[] }>;

function pickFirst(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const sp = await searchParams;
  const query = pickFirst(sp.q).trim();

  const title = query ? `Search results for “${query}”` : "Search Roofing Systems, Custom Fencing & Guides";
  const description = query
    ? `Search results for “${query}” across ${site.name} roofing systems, custom fencing styles, service areas, ZIP codes, FAQs, and homeowner guides.`
    : `Search ${site.name} for architectural shingles, standing-seam metal roofs, commercial TPO, custom privacy fences, local ZIP codes, and cost guides.`;

  return buildPageMetadata({
    title,
    description,
    path: "/search",
    // Keep parameterized search result pages out of search indexes while letting bots follow links.
    noIndex: Boolean(query),
    keywords: [
      "search T&S Roofing Systems",
      "roofing materials search",
      "fence styles search",
      "service area ZIP search",
    ],
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const sp = await searchParams;
  const query = pickFirst(sp.q).trim();
  const rawCategory = pickFirst(sp.category).trim();
  const category: SearchCategory = isValidSearchCategory(rawCategory) ? rawCategory : "all";

  return (
    <>
      <PageHeader
        eyebrow="Site Search"
        title={query ? `Search results for “${query}”` : "Search products, service areas & guides"}
        intro="Find roofing systems, custom fence finishes, starting rates, local ZIP code coverage, FAQs, and homeowner planning guides."
        crumbs={[{ name: "Search" }]}
        currentPath="/search"
      />

      <section className="section" aria-label="Search results">
        <div className="container-x">
          <SiteSearchClient initialQuery={query} initialCategory={category} />
        </div>
      </section>

      <CtaBand
        title="Ready to visualize options on your property?"
        text="Launch our interactive 3D Roof & Fence Estimator for instant square-footage and linear-foot pricing."
      />
      <JsonLd
        data={[
          webPageSchema({
            type: "SearchResultsPage",
            name: query ? `Search results for “${query}” | ${site.name}` : `Site Search | ${site.name}`,
            description: `Search ${site.name} roofing systems, custom fencing, service areas, and homeowner guides.`,
            path: "/search",
          }),
          breadcrumbSchema([{ name: "Search", path: "/search" }]),
        ]}
      />
    </>
  );
}
