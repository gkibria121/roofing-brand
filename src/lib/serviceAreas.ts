export interface ServiceAreaFaq {
  question: string;
  answer: string;
}

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
  updatedAt: string;
  faqs: readonly ServiceAreaFaq[];
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
    updatedAt: "2026-11-15",
    faqs: [
      {
        question: "Do you install Class 4 hail-resistant roofs in Richardson, TX?",
        answer:
          "Yes. We install UL 2218 Class 4 impact-resistant architectural shingles and heavy-gauge standing-seam metal roofs built for North Texas hailstorms, and we supply documentation many Texas insurers accept for policy discounts.",
      },
      {
        question: "Can you prepare HOA approval packets for Richardson & Plano neighborhoods?",
        answer:
          "Yes. Our project managers prepare color swatches, shingle/metal spec sheets, and fence height/stain drawings formatted for Canyon Creek, Reservation, and Plano HOA architectural review boards.",
      },
    ],
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
    updatedAt: "2026-11-15",
    faqs: [
      {
        question: "Do you install commercial TPO flat roofs across Dallas–Fort Worth?",
        answer:
          "Yes. Our commercial crews install 45-mil, 60-mil, and 80-mil reflective white TPO and multi-ply modified bitumen roofs for warehouses, offices, and retail centers across DFW with minimal business interruption.",
      },
      {
        question: "How quickly can you inspect storm damage in DFW?",
        answer:
          "We schedule free photo-documented roof inspections within 24–48 hours across Dallas and Fort Worth, and provide 24/7 emergency tarping when an active leak occurs.",
      },
    ],
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
    updatedAt: "2026-11-15",
    faqs: [
      {
        question: "Why is standing-seam metal popular for Austin solar installations?",
        answer:
          "Standing-seam metal lets solar installers clamp racking directly to raised vertical seams with zero roof penetrations, preserving waterproofing while matching the 25–30 year life of modern solar arrays.",
      },
      {
        question: "Do you build horizontal modern slat fences on sloped Austin lots?",
        answer:
          "Yes. We custom-frame matte-black steel posts set in deep concrete to step or rack cleanly across Hill Country grades in Westlake, Zilker, and South Austin.",
      },
    ],
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
    updatedAt: "2026-11-15",
    faqs: [
      {
        question: "Do your Miami roofing systems meet HVHZ wind-uplift requirements?",
        answer:
          "Yes. We specify Florida Building Code / High-Velocity Hurricane Zone compliant underlayments, concealed-fastener coastal metal panels, and reinforced flat TPO assemblies engineered for high wind uplift.",
      },
      {
        question: "Which fence materials resist South Florida salt air and humidity best?",
        answer:
          "Powder-coated architectural aluminum with stainless hardware and UV-stabilized aluminum-reinforced vinyl privacy panels resist rust, rot, and coastal corrosion far longer than untreated steel or softwood.",
      },
    ],
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
    updatedAt: "2026-11-15",
    faqs: [
      {
        question: "How do you prevent winter ice dams on Chicago roofs?",
        answer:
          "We install continuous ice-and-water membrane along eaves, valleys, and penetrations paired with balanced intake and ridge exhaust ventilation so snowmelt does not refreeze under shingles.",
      },
      {
        question: "How deep are fence posts set in Chicagoland to prevent frost heave?",
        answer:
          "Our crews set structural steel, vinyl, and cedar posts below the 42-inch Illinois frost line in belled concrete footings so gates and fence runs remain plumb after harsh freeze-thaw cycles.",
      },
    ],
  },
];

export function getServiceAreaBySlug(slug: string): ServiceAreaInfo | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}

export function findServiceAreaByZip(zip: string): ServiceAreaInfo | undefined {
  const clean = zip.replace(/\D/g, "").slice(0, 5);
  if (clean.length !== 5) return undefined;
  return SERVICE_AREAS.find((area) => area.sampleZips.includes(clean));
}
