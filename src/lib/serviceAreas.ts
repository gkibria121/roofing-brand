export interface ServiceAreaInfo {
  slug: string;
  name: string;
  regionLabel: string;
  state: string;
  sampleZips: readonly string[];
  featuredZip: string;
  headline: string;
  description: string;
  climateNotes: string;
  avgInstallDays: string;
  popularRoof: string;
  popularFence: string;
  neighborhoods: readonly string[];
}

export const SERVICE_AREAS: readonly ServiceAreaInfo[] = [
  {
    slug: "richardson-tx",
    name: "Richardson & North Dallas",
    regionLabel: "North Texas HQ",
    state: "TX",
    sampleZips: ["75080", "75081", "75082", "75074", "75075"],
    featuredZip: "75081",
    headline: "Roofing & Custom Fencing in Richardson, TX",
    description:
      "Fast on-site inspections, hail-rated roof replacements, and HOA-compliant cedar and horizontal slat fences throughout Richardson, Plano, and North Dallas.",
    climateNotes:
      "Engineered for North Texas hail, high-UV summers, and 60+ mph spring wind gusts with Class 4 impact shingles and steel-post privacy fences.",
    avgInstallDays: "1–2 days",
    popularRoof: "Class 4 Architectural Shingle & Standing-Seam Metal",
    popularFence: "6 ft Western Red Cedar Privacy & Horizontal Modern Slat",
    neighborhoods: ["Canyon Creek", "Richardson Heights", "Arapaho", "Cottonwood Heights", "Reservation", "Springpark"],
  },
  {
    slug: "dallas-tx",
    name: "Dallas–Fort Worth",
    regionLabel: "DFW Metroplex",
    state: "TX",
    sampleZips: ["75201", "75204", "75214", "75230", "76107"],
    featuredZip: "75201",
    headline: "Residential & Commercial Exteriors Across Dallas–Fort Worth",
    description:
      "Full-service roof replacements, commercial TPO flat roofs, ornamental iron perimeters, and modern privacy fencing for homes and businesses across DFW.",
    climateNotes:
      "Reflective cool-roof membranes and standing-seam panels lower attic heat gain during 100°F+ summers while resisting storm uplift.",
    avgInstallDays: "1–3 days",
    popularRoof: "Standing-Seam Metal & 60-Mil Reflective TPO",
    popularFence: "Horizontal Modern Slat & Ornamental Aluminum/Iron",
    neighborhoods: ["Lakewood", "Preston Hollow", "Oak Lawn", "Bishop Arts", "Irving", "Frisco"],
  },
  {
    slug: "austin-tx",
    name: "Austin & Central Texas",
    regionLabel: "Central Texas",
    state: "TX",
    sampleZips: ["78701", "78704", "78745", "78746", "78613"],
    featuredZip: "78701",
    headline: "Solar-Ready Roofing & Architectural Fencing in Austin, TX",
    description:
      "Contemporary standing-seam metal roofs built for seamless solar clamp attachment alongside warm redwood and cedar horizontal slat fencing.",
    climateNotes:
      "High-reflectance Kynar finishes and concealed-fastener seams stand up to Central Texas hailstorms and intense solar exposure.",
    avgInstallDays: "1–2 days",
    popularRoof: "Solar-Ready Standing-Seam Metal",
    popularFence: "Horizontal Modern Slat (Warm Redwood) & Cedar Privacy",
    neighborhoods: ["South Congress", "Zilker", "Westlake", "Mueller", "Round Rock", "Cedar Park"],
  },
  {
    slug: "miami-fl",
    name: "Miami & South Florida",
    regionLabel: "South Florida",
    state: "FL",
    sampleZips: ["33101", "33131", "33133", "33139", "33156"],
    featuredZip: "33101",
    headline: "Hurricane-Rated Roofing & Corrosion-Resistant Fencing in Miami",
    description:
      "High-Velocity Hurricane Zone (HVHZ) roofing assemblies, reflective flat membranes, and coastal powder-coated aluminum and vinyl privacy fences.",
    climateNotes:
      "Marine-grade stainless fasteners, salt-spray-resistant powder coatings, and wind-rated interlocking roof and fence assemblies.",
    avgInstallDays: "2–3 days",
    popularRoof: "Coastal Standing-Seam Metal & 80-Mil TPO",
    popularFence: "Wind-Rated Vinyl Privacy & Satin Black Aluminum",
    neighborhoods: ["Coral Gables", "Coconut Grove", "Brickell", "Pinecrest", "Kendall", "Doral"],
  },
  {
    slug: "chicago-il",
    name: "Greater Chicago",
    regionLabel: "Chicagoland",
    state: "IL",
    sampleZips: ["60601", "60614", "60618", "60201", "60540"],
    featuredZip: "60601",
    headline: "Four-Season Roofing & Deep-Set Fencing in Chicagoland",
    description:
      "Full ice-and-water shield roof systems designed for freeze-thaw cycles and frost-line concrete-set fencing engineered to stay plumb through winter.",
    climateNotes:
      "42-inch frost-line post footings prevent winter heave, paired with upgraded ridge ventilation and heavy-duty ice dam protection.",
    avgInstallDays: "1–3 days",
    popularRoof: "Impact-Resistant Architectural Shingle & Modified Bitumen",
    popularFence: "Classic White Vinyl Privacy & Steel-Post Cedar",
    neighborhoods: ["Lincoln Park", "Lakeview", "Evanston", "Naperville", "Oak Park", "Hinsdale"],
  },
];

export function getServiceAreaBySlug(slug: string): ServiceAreaInfo | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}
