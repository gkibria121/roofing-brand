import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { BLOG_POSTS } from "@/lib/blog";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Roofing & Fencing Guides, Cost Tips & Blog",
  description: `Practical homeowner guides on standing-seam metal vs. asphalt shingles, custom privacy fencing, storm inspections, and exterior project planning from ${site.name}.`,
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Homeowner Guides & Insights"
        title="The T&S Exterior Blog"
        intro="Clear, practical advice on roofing materials, custom fence design, storm maintenance, and exterior budgeting."
        crumbs={[{ name: "Blog" }]}
      />

      <section className="section" aria-label="Blog articles">
        <div className="container-x grid gap-8 md:grid-cols-2">
          {BLOG_POSTS.map((post) => (
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
                  <span className="text-slate-400">·</span>
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
                  Read article →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBand
        title="Turn ideas into a live 3D property preview"
        text="Test roof colors, solar arrays, and custom fences right on your house before making a decision."
      />
      <JsonLd data={breadcrumbSchema([{ name: "Blog", path: "/blog" }])} />
    </>
  );
}
