import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { ShareArticleButton } from "@/components/ShareArticleButton";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Article Not Found", robots: { index: false, follow: true } };

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
    useColocatedOgImage: true,
    openGraphType: "article",
    article: {
      publishedTime: `${post.publishedAt}T00:00:00.000Z`,
      modifiedTime: `${post.updatedAt}T00:00:00.000Z`,
      authors: [post.author],
      section: post.category,
      tags: post.keywords,
    },
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const articleUrl = `${site.url}/blog/${post.slug}`;

  return (
    <>
      <PageHeader
        eyebrow={`${post.category} · ${post.readMinutes} min read`}
        title={post.title}
        intro={post.excerpt}
        crumbs={[
          { name: "Blog", href: "/blog" },
          { name: post.title },
        ]}
        currentPath={`/blog/${post.slug}`}
      />

      <article className="section">
        <div className="container-x max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5 text-xs font-semibold text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span>Written by <strong className="text-brand-900">{post.author}</strong></span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt}>Published {post.publishedAt}</time>
              {post.updatedAt !== post.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.updatedAt}>Updated {post.updatedAt}</time>
                </>
              )}
            </div>
            <ShareArticleButton title={post.title} url={articleUrl} />
          </div>

          <div className="space-y-8">
            {post.sections.map((sec) => (
              <section key={sec.heading}>
                <h2 className="text-2xl font-extrabold">{sec.heading}</h2>
                <div className="mt-3 space-y-3 text-base leading-relaxed text-slate-700">
                  {sec.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                {sec.bullets && (
                  <ul className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    {sec.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <span className="mt-0.5 font-bold text-accent-600" aria-hidden="true">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-brand-50/70 p-6">
            <div>
              <p className="text-sm font-extrabold text-brand-900">See these options live on your home</p>
              <p className="mt-1 text-xs text-slate-600">Customize styles, finishes, and square footage in our 3D tool.</p>
            </div>
            <Link href={post.ctaHref} className="btn btn-primary">
              {post.ctaLabel} →
            </Link>
          </div>

          {/* Related guides for strong topical internal linking */}
          <aside className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="related-guides-heading">
            <h2 id="related-guides-heading" className="text-xl font-extrabold text-brand-900">
              More homeowner guides
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((rel) => (
                <li key={rel.slug}>
                  <Link
                    href={`/blog/${rel.slug}`}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-accent-600/50 hover:bg-slate-50"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-accent-700">
                        {rel.category}
                      </span>
                      <p className="mt-1.5 text-sm font-bold leading-snug text-brand-900">{rel.title}</p>
                    </div>
                    <span className="mt-3 text-xs font-semibold text-slate-500">{rel.readMinutes} min read →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div className="mt-8">
            <Link href="/blog" className="text-sm font-bold text-brand-700 hover:text-accent-700 hover:underline">
              ← Back to all articles
            </Link>
          </div>
        </div>
      </article>

      <CtaBand
        title="Questions about your roof or fence?"
        text={`Call ${site.phone} or launch our 3D estimator for an itemized quote.`}
      />
      <JsonLd
        data={[
          blogPostingSchema(post),
          breadcrumbSchema([
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
    </>
  );
}
