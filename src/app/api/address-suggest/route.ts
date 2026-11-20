import { NextRequest, NextResponse } from "next/server";
import { site } from "@/lib/site";

type Suggestion = { label: string; source: "google" | "osm" | "local" };

function localFallback(q: string): Suggestion[] {
  const cleaned = q.trim().replace(/,+$/, "");
  if (cleaned.length < 3 || cleaned.includes(",")) return [];
  const streetSuffixes = /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|way|pl|circle|cir)\b/i;
  const base = streetSuffixes.test(cleaned) ? cleaned : `${cleaned} St`;
  return site.serviceAreas.slice(0, 4).map((city) => ({
    label: `${base}, ${city}, ${site.address.region}`,
    source: "local",
  }));
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 3 || q.length > 160) {
    return NextResponse.json({ suggestions: [] });
  }

  // Optional production hook: Google Places API (New) when GOOGLE_MAPS_API_KEY is configured.
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleKey,
        },
        body: JSON.stringify({ input: q }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          suggestions?: Array<{ placePrediction?: { text?: { text?: string } } }>;
        };
        const items: Suggestion[] = (data.suggestions ?? [])
          .map((s) => s.placePrediction?.text?.text)
          .filter((v): v is string => Boolean(v))
          .slice(0, 5)
          .map((label) => ({ label, source: "google" }));
        if (items.length) return NextResponse.json({ suggestions: items });
      }
    } catch {
      // Fall through to Nominatim / local fallback.
    }
  }

  // Free OpenStreetMap Nominatim lookup with short timeout so typing stays snappy.
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `${site.name} Website (${site.url})`,
      },
      signal: AbortSignal.timeout(1800),
    });
    if (res.ok) {
      const rows = (await res.json()) as Array<{ display_name?: string }>;
      const seen = new Set<string>();
      const items: Suggestion[] = [];
      for (const row of rows) {
        const label = row.display_name?.trim();
        if (label && !seen.has(label)) {
          seen.add(label);
          items.push({ label, source: "osm" });
        }
      }
      if (items.length) return NextResponse.json({ suggestions: items });
    }
  } catch {
    // Offline or timed out — fall through to local completions.
  }

  return NextResponse.json({ suggestions: localFallback(q) });
}
