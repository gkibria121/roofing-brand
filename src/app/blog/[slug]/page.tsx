import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog";
import { breadcrumbSchema } from "@/lib/schema";
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
  if (!post) return { title: "Article Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

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
      />

      <article className="section">
        <div className="container-x max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-5 text-xs font-semibold text-slate-500">
            <span>Written by <strong className="text-brand-900">{post.author}</strong></span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>Published {post.publishedAt}</time>
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
        data={breadcrumbSchema([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
    </>
  );
}
