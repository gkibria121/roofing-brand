import type { Metadata } from "next";
import Link from "next/link";
import { BlogFilterBar } from "@/components/BlogFilterBar";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { BLOG_CATEGORIES, BLOG_POSTS, type BlogCategory } from "@/lib/blog";
import { blogIndexSchema, breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

type SearchParamsInput = Promise<{ category?: string | string[]; q?: string | string[] }>;

const blogDescription = `Practical homeowner guides on standing-seam metal vs. asphalt shingles, custom privacy fencing, storm damage inspections, and exterior project planning from ${site.name}.`;

function pickFirst(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

function parseCategory(raw: string): BlogCategory | "All" {
  return (BLOG_CATEGORIES as readonly string[]).includes(raw) ? (raw as BlogCategory) : "All";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const sp = await searchParams;
  const rawQuery = pickFirst(sp.q).trim();
  const activeCategory = parseCategory(pickFirst(sp.category));

  const title = rawQuery
    ? `Guides matching “${rawQuery}” — Blog`
    : activeCategory !== "All"
      ? `${activeCategory} Guides & Cost Tips — Blog`
      : "Roofing & Fencing Guides, Cost Tips & Blog";

  return buildPageMetadata({
    title,
    description: blogDescription,
    path: "/blog",
    noIndex: Boolean(rawQuery),
    keywords: [
      "roofing cost guide",
      "metal vs asphalt roof",
      "privacy fence buying guide",
      "storm damage roof checklist",
      "exterior renovation planning",
    ],
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const sp = await searchParams;
  const activeCategory = parseCategory(pickFirst(sp.category));
  const query = pickFirst(sp.q).trim();
  const qLower = query.toLowerCase();

  const filteredPosts = BLOG_POSTS.filter((post) => {
    if (activeCategory !== "All" && post.category !== activeCategory) return false;
    if (!qLower) return true;
    const haystack = [
      post.title,
      post.excerpt,
      post.category,
      post.author,
      ...post.keywords,
      ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(qLower);
  });

  return (
    <>
      <PageHeader
        eyebrow="Homeowner Guides & Insights"
        title="The T&S Exterior Blog"
        intro="Clear, practical advice on roofing materials, custom fence design, storm maintenance, and exterior budgeting."
        crumbs={[{ name: "Blog" }]}
        currentPath="/blog"
      />

      <section className="section" aria-label="Blog articles">
        <div className="container-x">
          <BlogFilterBar
            activeCategory={activeCategory}
            initialQuery={query}
            totalCount={filteredPosts.length}
          />

          {filteredPosts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
              <h2 className="text-xl font-extrabold text-brand-900">No articles match your filter</h2>
              <p className="mt-2 text-sm text-slate-600">
                Try clearing your search term or browsing all roofing, fencing, and planning guides.
              </p>
              <Link href="/blog" className="btn btn-primary mt-5">
                View all articles
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {filteredPosts.map((post) => (
                <article
                  key={post.slug}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-900">{post.category}</span>
                      <time dateTime={post.publishedAt} className="text-slate-500">
                        {post.publishedAt}
                      </time>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-500">{post.readMinutes} min read</span>
                    </div>

                    <h2 className="mt-4 text-2xl font-extrabold leading-snug">
                      <Link href={`/blog/${post.slug}`} className="hover:text-accent-700">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{post.excerpt}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-semibold text-slate-500">By {post.author}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm font-bold text-brand-900 underline decoration-accent-600 decoration-2 underline-offset-4 hover:text-accent-700"
                    >
                      Read article<span className="sr-only">: {post.title}</span> →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Turn ideas into a live 3D property preview"
        text="Test roof colors, solar arrays, and custom fences right on your house before making a decision."
      />
      <JsonLd
        data={[
          webPageSchema({
            type: "CollectionPage",
            name: `The T&S Exterior Blog | ${site.name}`,
            description: blogDescription,
            path: "/blog",
          }),
          blogIndexSchema(BLOG_POSTS),
          breadcrumbSchema([{ name: "Blog", path: "/blog" }]),
        ]}
      />
    </>
  );
}
