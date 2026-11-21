import { ImageResponse } from "next/og";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog";
import { site } from "@/lib/site";

export const alt = `${site.name} Homeowner Guide`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function BlogOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  const title = post?.title ?? `${site.name} Exterior Blog`;
  const category = post ? `${post.category} Guide · ${post.readMinutes} min read` : "Homeowner Guides";
  const author = post?.author ?? site.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #ffffff 0%, #eff5fb 100%)",
          borderLeft: "24px solid #d9480f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#b93a0a",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0f2a4a" }}>{site.name}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#0f2a4a",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #dbe7f5",
            paddingTop: 24,
            fontSize: 26,
            color: "#475569",
          }}
        >
          <div>{`By ${author}`}</div>
          <div style={{ fontWeight: 700, color: "#0f2a4a" }}>{site.phone}</div>
        </div>
      </div>
    ),
    size,
  );
}
