import type { Metadata } from "next";
import { site } from "./site";

export interface ArticleMetaOptions {
  publishedTime: string;
  modifiedTime?: string;
  authors?: readonly string[];
  section?: string;
  tags?: readonly string[];
}

export interface PageMetadataOptions {
  /** Page title segment (combined with root `template: "%s | T&S Roofing Systems"`) or `{ absolute }`. */
  title: string | { absolute: string };
  /** Unique, compelling meta description (ideally 120–160 characters). */
  description: string;
  /** Canonical path starting with `/` (e.g. `"/"`, `"/products/roofing"`). */
  path: string;
  /** Optional page-specific topic keywords. */
  keywords?: readonly string[];
  /** OpenGraph object type (defaults to `"website"`). */
  openGraphType?: "website" | "article";
  /** Extra OpenGraph article fields when `openGraphType === "article"`. */
  article?: ArticleMetaOptions;
  /** Set true on utility/search-query/404 pages that should not be indexed. */
  noIndex?: boolean;
  /**
   * Set true on route segments that colocate their own `opengraph-image.tsx`
   * (`/`, `/blog/[slug]`, `/service-areas/[slug]`) so Next.js file-based OG metadata
   * emits the hashed segment-specific image without duplication.
   */
  useColocatedOgImage?: boolean;
}

const DEFAULT_SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
} as const;

/**
 * Builds complete, consistent Next.js `Metadata` for every route so nested `openGraph`
 * and `twitter` objects never lose `siteName`, `locale`, `type`, `url`, `images`, or `card`
 * to shallow metadata merging.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  openGraphType = "website",
  article,
  noIndex = false,
  useColocatedOgImage = false,
}: PageMetadataOptions): Metadata {
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  const fullTitle = typeof title === "string" ? `${title} | ${site.name}` : title.absolute;

  const baseOpenGraph = {
    siteName: site.name,
    locale: "en_US",
    url: normalizedPath,
    title: fullTitle,
    description,
    ...(useColocatedOgImage ? {} : { images: [DEFAULT_SOCIAL_IMAGE] }),
  };

  const openGraph: Metadata["openGraph"] =
    openGraphType === "article" && article
      ? {
          ...baseOpenGraph,
          type: "article",
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime ?? article.publishedTime,
          authors: article.authors ? [...article.authors] : undefined,
          section: article.section,
          tags: article.tags ? [...article.tags] : undefined,
        }
      : {
          ...baseOpenGraph,
          type: "website",
        };

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords: [...keywords] } : {}),
    alternates: {
      canonical: normalizedPath,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(useColocatedOgImage ? {} : { images: [DEFAULT_SOCIAL_IMAGE.url] }),
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: true,
            googleBot: {
              index: false,
              follow: true,
            },
          },
        }
      : {}),
  };
}
