import { ImageResponse } from "next/og";
import { getServiceAreaBySlug, SERVICE_AREAS } from "@/lib/serviceAreas";
import { site } from "@/lib/site";

export const alt = `${site.name} Local Service Area`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return SERVICE_AREAS.map((area) => ({ slug: area.slug }));
}

export default async function ServiceAreaOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  const headline = area?.headline ?? `${site.name} Service Areas`;
  const eyebrow = area ? `${area.regionLabel} · ${area.state} · Avg. ${area.avgInstallDays} install` : "Regional Coverage";
  const zips = area ? `ZIPs: ${area.sampleZips.join(" · ")}` : site.tagline;

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
          background: "linear-gradient(135deg, #0f2a4a 0%, #1d4373 100%)",
          borderLeft: "24px solid #fb923c",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#fb923c",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff" }}>{site.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 800, color: "#ffffff", lineHeight: 1.12 }}>
            {headline}
          </div>
          <div style={{ fontSize: 28, color: "#dbe7f5", marginTop: 24 }}>{zips}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(255,255,255,0.2)",
            paddingTop: 24,
            fontSize: 26,
            color: "#e2e8f0",
          }}
        >
          <div>Licensed · Bonded · Insured · Free 3D Estimates</div>
          <div style={{ fontWeight: 700, color: "#ffffff" }}>{site.phone}</div>
        </div>
      </div>
    ),
    size,
  );
}
