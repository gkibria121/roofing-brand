import {
  PropertyAddressSchema,
  ZipCodeSchema,
  type BuildingType,
  type PropertyAddress,
  type Stories,
} from "./schemas";

/**
 * Extensible ZIP → Address Lookup module.
 *
 * Ships with a zero-key hybrid provider:
 *   1. Curated local directories for featured metros (instant, offline-safe).
 *   2. Live US ZIP city/state/coordinate enrichment via Zippopotam.us (keyless,
 *      cached, short timeout) for any valid 5-digit US ZIP code.
 *   3. Deterministic regional fallback when offline so the UX never dead-ends.
 *
 * To connect Google Places, Mapbox, or Radar in production, implement
 * `AddressLookupProvider` and pass it to `setAddressLookupProvider(...)`.
 */

export interface ZipLookupResult {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  nearbyStreets: [string, string, string, string];
  addresses: PropertyAddress[];
  source: "directory" | "live-zip" | "regional-fallback";
}

export interface AddressLookupProvider {
  lookupByZip(zip: string, options?: { signal?: AbortSignal; allowNetwork?: boolean }): Promise<ZipLookupResult>;
}

interface CuratedZipEntry {
  city: string;
  state: string;
  lat: number;
  lng: number;
  nearbyStreets: [string, string, string, string];
  streets: {
    street: string;
    buildingType: BuildingType;
    stories: Stories;
    lotLabel: string;
    dLat: number;
    dLng: number;
  }[];
}

const CURATED_ZIPS: Record<string, CuratedZipEntry> = {
  "75081": {
    city: "Richardson",
    state: "TX",
    lat: 32.9483,
    lng: -96.7299,
    nearbyStreets: ["E Spring Valley Rd", "Woodhaven Pl", "Bowser Rd", "Morningstar Trail"],
    streets: [
      { street: "1010 Towne House Ln", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~2,150 sq ft", dLat: 0.0012, dLng: -0.0008 },
      { street: "1420 E Spring Valley Rd", buildingType: "residential", stories: "multiple", lotLabel: "2-story home · ~2,780 sq ft", dLat: 0.0024, dLng: 0.0015 },
      { street: "814 Woodhaven Pl", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~1,940 sq ft", dLat: -0.0011, dLng: -0.0019 },
      { street: "2205 Bowser Rd", buildingType: "commercial", stories: "single", lotLabel: "Commercial building · ~4,600 sq ft", dLat: 0.0031, dLng: 0.0028 },
      { street: "608 Morningstar Trail", buildingType: "residential", stories: "multiple", lotLabel: "2-story home · ~2,540 sq ft", dLat: -0.0022, dLng: 0.0011 },
    ],
  },
  "75201": {
    city: "Dallas",
    state: "TX",
    lat: 32.7876,
    lng: -96.7985,
    nearbyStreets: ["Ross Ave", "N Harwood St", "Flora St", "N Pearl St"],
    streets: [
      { street: "2114 Flora St", buildingType: "residential", stories: "multiple", lotLabel: "2-story townhome · ~2,420 sq ft", dLat: 0.001, dLng: 0.001 },
      { street: "1840 Ross Ave", buildingType: "commercial", stories: "multiple", lotLabel: "Commercial complex · ~5,400 sq ft", dLat: -0.001, dLng: 0.002 },
      { street: "920 N Harwood St", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~2,080 sq ft", dLat: 0.002, dLng: -0.001 },
      { street: "1505 N Pearl St", buildingType: "residential", stories: "multiple", lotLabel: "2-story home · ~2,890 sq ft", dLat: -0.002, dLng: -0.0015 },
    ],
  },
  "78701": {
    city: "Austin",
    state: "TX",
    lat: 30.2711,
    lng: -97.7437,
    nearbyStreets: ["W 6th St", "Lavaca St", "Guadalupe St", "Nueces St"],
    streets: [
      { street: "812 Nueces St", buildingType: "residential", stories: "multiple", lotLabel: "2-story craftsman · ~2,650 sq ft", dLat: 0.0014, dLng: -0.0012 },
      { street: "1104 Rio Grande St", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~2,100 sq ft", dLat: 0.0021, dLng: -0.0018 },
      { street: "510 Lavaca St", buildingType: "commercial", stories: "multiple", lotLabel: "Commercial building · ~5,100 sq ft", dLat: -0.0011, dLng: 0.0009 },
      { street: "1408 Guadalupe St", buildingType: "residential", stories: "multiple", lotLabel: "2-story home · ~2,480 sq ft", dLat: 0.0025, dLng: 0.0005 },
    ],
  },
  "33101": {
    city: "Miami",
    state: "FL",
    lat: 25.7743,
    lng: -80.1937,
    nearbyStreets: ["Biscayne Blvd", "NE 2nd Ave", "Brickell Bay Dr", "SW 8th St"],
    streets: [
      { street: "1245 Brickell Bay Dr", buildingType: "residential", stories: "multiple", lotLabel: "2-story coastal home · ~2,920 sq ft", dLat: -0.002, dLng: 0.001 },
      { street: "418 NE 2nd Ave", buildingType: "commercial", stories: "single", lotLabel: "Commercial retail · ~4,200 sq ft", dLat: 0.0015, dLng: 0.0008 },
      { street: "2210 SW 8th St", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~2,050 sq ft", dLat: -0.0018, dLng: -0.0024 },
      { street: "780 Biscayne Blvd", buildingType: "residential", stories: "multiple", lotLabel: "2-story villa · ~2,740 sq ft", dLat: 0.0022, dLng: 0.0015 },
    ],
  },
  "90210": {
    city: "Beverly Hills",
    state: "CA",
    lat: 34.0901,
    lng: -118.4065,
    nearbyStreets: ["N Rodeo Dr", "Sunset Blvd", "Lomitas Ave", "Carmelita Ave"],
    streets: [
      { street: "618 N Rodeo Dr", buildingType: "residential", stories: "multiple", lotLabel: "2-story estate · ~3,450 sq ft", dLat: 0.0012, dLng: 0.0006 },
      { street: "812 Lomitas Ave", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~2,400 sq ft", dLat: 0.0019, dLng: -0.0012 },
      { street: "524 Carmelita Ave", buildingType: "residential", stories: "multiple", lotLabel: "2-story residence · ~3,100 sq ft", dLat: -0.0014, dLng: 0.0011 },
      { street: "9420 Sunset Blvd", buildingType: "commercial", stories: "single", lotLabel: "Commercial office · ~4,800 sq ft", dLat: 0.0024, dLng: -0.002 },
    ],
  },
  "10001": {
    city: "New York",
    state: "NY",
    lat: 40.7506,
    lng: -73.9971,
    nearbyStreets: ["W 28th St", "8th Ave", "W 31st St", "9th Ave"],
    streets: [
      { street: "342 W 28th St", buildingType: "residential", stories: "multiple", lotLabel: "Multi-story brownstone · ~2,800 sq ft", dLat: -0.001, dLng: -0.0012 },
      { street: "415 8th Ave", buildingType: "commercial", stories: "multiple", lotLabel: "Commercial building · ~5,600 sq ft", dLat: 0.0008, dLng: 0.001 },
      { street: "218 W 31st St", buildingType: "residential", stories: "multiple", lotLabel: "Townhouse · ~2,550 sq ft", dLat: 0.0014, dLng: 0.0005 },
      { street: "388 9th Ave", buildingType: "commercial", stories: "single", lotLabel: "Commercial storefront · ~3,900 sq ft", dLat: -0.0006, dLng: -0.0021 },
    ],
  },
  "60601": {
    city: "Chicago",
    state: "IL",
    lat: 41.8853,
    lng: -87.6215,
    nearbyStreets: ["E Randolph St", "N Michigan Ave", "E Lake St", "N Wabash Ave"],
    streets: [
      { street: "240 E Lake St", buildingType: "residential", stories: "multiple", lotLabel: "2-story residence · ~2,580 sq ft", dLat: 0.0011, dLng: 0.0008 },
      { street: "155 N Wabash Ave", buildingType: "commercial", stories: "multiple", lotLabel: "Commercial facility · ~5,200 sq ft", dLat: -0.0009, dLng: -0.0014 },
      { street: "312 E Randolph St", buildingType: "residential", stories: "single", lotLabel: "Single-family · ~2,120 sq ft", dLat: 0.0016, dLng: 0.0018 },
      { street: "410 N Michigan Ave", buildingType: "commercial", stories: "single", lotLabel: "Commercial building · ~4,400 sq ft", dLat: 0.002, dLng: -0.0005 },
    ],
  },
};

const REGIONAL_DEFAULTS: Record<string, { city: string; state: string; lat: number; lng: number }> = {
  "0": { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
  "1": { city: "New York", state: "NY", lat: 40.7128, lng: -74.006 },
  "2": { city: "Arlington", state: "VA", lat: 38.8816, lng: -77.091 },
  "3": { city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388 },
  "4": { city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988 },
  "5": { city: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265 },
  "6": { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  "7": { city: "Richardson", state: "TX", lat: 32.9483, lng: -96.7299 },
  "8": { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  "9": { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
};

const STREET_TEMPLATES = [
  { suffix: "Oakridge Ln", buildingType: "residential" as const, stories: "single" as const, lotLabel: "Single-family · ~2,100 sq ft", dLat: 0.0012, dLng: -0.0009 },
  { suffix: "Maple Creek Dr", buildingType: "residential" as const, stories: "multiple" as const, lotLabel: "2-story home · ~2,680 sq ft", dLat: 0.0021, dLng: 0.0014 },
  { suffix: "Cedar Hollow Ct", buildingType: "residential" as const, stories: "single" as const, lotLabel: "Single-family · ~1,980 sq ft", dLat: -0.0014, dLng: -0.0016 },
  { suffix: "Parkview Blvd", buildingType: "commercial" as const, stories: "single" as const, lotLabel: "Commercial building · ~4,500 sq ft", dLat: 0.0027, dLng: 0.0021 },
  { suffix: "Woodhaven Pl", buildingType: "residential" as const, stories: "multiple" as const, lotLabel: "2-story home · ~2,520 sq ft", dLat: -0.0018, dLng: 0.0012 },
];

function deterministicHouseNumber(zip: string, index: number): number {
  const seed = Number(zip.slice(2)) || 420;
  return 104 + ((seed * (index + 3) * 17) % 8800);
}

function buildSynthesizedAddresses(
  zip: string,
  city: string,
  state: string,
  lat: number,
  lng: number,
): { nearbyStreets: [string, string, string, string]; addresses: PropertyAddress[] } {
  const nearbyStreets: [string, string, string, string] = [
    "Oakridge Ln",
    "Maple Creek Dr",
    "Parkview Blvd",
    "Woodhaven Pl",
  ];
  const addresses: PropertyAddress[] = STREET_TEMPLATES.map((tpl, idx) => {
    const street = `${deterministicHouseNumber(zip, idx)} ${tpl.suffix}`;
    const fullAddress = `${street}, ${city}, ${state} ${zip}, USA`;
    return PropertyAddressSchema.parse({
      id: `${zip}-${idx}`,
      street,
      city,
      state,
      zip,
      country: "USA",
      fullAddress,
      lat: Number((lat + tpl.dLat).toFixed(5)),
      lng: Number((lng + tpl.dLng).toFixed(5)),
      suggestedBuildingType: tpl.buildingType,
      suggestedStories: tpl.stories,
      lotLabel: tpl.lotLabel,
      nearbyStreets,
    });
  });
  return { nearbyStreets, addresses };
}

const zipCache = new Map<string, ZipLookupResult>();

interface ZippopotamResponse {
  places?: {
    "place name"?: string;
    "state abbreviation"?: string;
    latitude?: string;
    longitude?: string;
  }[];
}

async function fetchLiveZipMeta(
  zip: string,
  signal?: AbortSignal,
): Promise<{ city: string; state: string; lat: number; lng: number } | null> {
  if (typeof fetch !== "function") return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1600);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ZippopotamResponse;
    const first = data.places?.[0];
    if (!first?.["place name"] || !first["state abbreviation"]) return null;
    const lat = Number(first.latitude);
    const lng = Number(first.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      city: first["place name"],
      state: first["state abbreviation"].toUpperCase().slice(0, 2),
      lat,
      lng,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

const defaultHybridProvider: AddressLookupProvider = {
  async lookupByZip(rawZip, options) {
    const zip = ZipCodeSchema.parse(rawZip);
    const cached = zipCache.get(zip);
    if (cached) return cached;

    const curated = CURATED_ZIPS[zip];
    if (curated) {
      const addresses = curated.streets.map((s, idx) =>
        PropertyAddressSchema.parse({
          id: `${zip}-${idx}`,
          street: s.street,
          city: curated.city,
          state: curated.state,
          zip,
          country: "USA",
          fullAddress: `${s.street}, ${curated.city}, ${curated.state} ${zip}, USA`,
          lat: Number((curated.lat + s.dLat).toFixed(5)),
          lng: Number((curated.lng + s.dLng).toFixed(5)),
          suggestedBuildingType: s.buildingType,
          suggestedStories: s.stories,
          lotLabel: s.lotLabel,
          nearbyStreets: curated.nearbyStreets,
        }),
      );
      const result: ZipLookupResult = {
        zip,
        city: curated.city,
        state: curated.state,
        lat: curated.lat,
        lng: curated.lng,
        nearbyStreets: curated.nearbyStreets,
        addresses,
        source: "directory",
      };
      zipCache.set(zip, result);
      return result;
    }

    const allowNetwork = options?.allowNetwork ?? true;
    const live = allowNetwork ? await fetchLiveZipMeta(zip, options?.signal) : null;
    if (live) {
      const synth = buildSynthesizedAddresses(zip, live.city, live.state, live.lat, live.lng);
      const result: ZipLookupResult = {
        zip,
        city: live.city,
        state: live.state,
        lat: live.lat,
        lng: live.lng,
        nearbyStreets: synth.nearbyStreets,
        addresses: synth.addresses,
        source: "live-zip",
      };
      zipCache.set(zip, result);
      return result;
    }

    const region = REGIONAL_DEFAULTS[zip[0] ?? "7"] ?? REGIONAL_DEFAULTS["7"];
    const synth = buildSynthesizedAddresses(zip, region.city, region.state, region.lat, region.lng);
    const result: ZipLookupResult = {
      zip,
      city: region.city,
      state: region.state,
      lat: region.lat,
      lng: region.lng,
      nearbyStreets: synth.nearbyStreets,
      addresses: synth.addresses,
      source: "regional-fallback",
    };
    return result;
  },
};

let activeProvider: AddressLookupProvider = defaultHybridProvider;

export function setAddressLookupProvider(provider: AddressLookupProvider) {
  activeProvider = provider;
}

export function lookupAddressesByZip(
  zip: string,
  options?: { signal?: AbortSignal; allowNetwork?: boolean },
): Promise<ZipLookupResult> {
  return activeProvider.lookupByZip(zip, options);
}

/** Creates a validated PropertyAddress when a user types a custom street inside a matched ZIP. */
export function createCustomPropertyAddress(
  streetInput: string,
  meta: Pick<ZipLookupResult, "zip" | "city" | "state" | "lat" | "lng" | "nearbyStreets">,
): PropertyAddress {
  const street = streetInput.trim();
  return PropertyAddressSchema.parse({
    id: `${meta.zip}-custom-${street.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    street,
    city: meta.city,
    state: meta.state,
    zip: meta.zip,
    country: "USA",
    fullAddress: `${street}, ${meta.city}, ${meta.state} ${meta.zip}, USA`,
    lat: meta.lat,
    lng: meta.lng,
    suggestedBuildingType: "residential",
    suggestedStories: "single",
    lotLabel: "Custom property address",
    nearbyStreets: meta.nearbyStreets,
  });
}

export const SAMPLE_ZIPS = ["75081", "78701", "33101", "90210"] as const;
