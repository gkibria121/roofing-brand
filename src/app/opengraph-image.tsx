import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg,#ffffff 0%,#eff5fb 100%)",
          borderLeft: "24px solid #d9480f",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#b93a0a", letterSpacing: 6, textTransform: "uppercase" }}>
          Licensed · Bonded · Insured
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, color: "#0f2a4a", marginTop: 20, lineHeight: 1.05 }}>{site.name}</div>
        <div style={{ fontSize: 40, color: "#475569", marginTop: 28 }}>{site.tagline}</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#0f2a4a", marginTop: 56 }}>{site.phone}</div>
      </div>
    ),
    size,
  );
}
