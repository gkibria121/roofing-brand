export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  image: string;
  features: string[];
};

export const services: Service[] = [
  {
    slug: "residential-roofing",
    title: "Residential Roofing",
    short: "Complete roof replacement and new installations for your home.",
    description:
      "From architectural shingles to premium synthetic materials, we replace and install roofs that protect your family and boost curb appeal. Every project includes a written estimate, tear-off, new underlayment, and full clean-up.",
    image: "/images/residential.jpg",
    features: [
      "Asphalt, architectural & designer shingles",
      "Full tear-off and deck inspection",
      "Ventilation & insulation upgrades",
      "Gutters, flashing and skylights",
    ],
  },
  {
    slug: "commercial-roofing",
    title: "Commercial Roofing",
    short: "Durable flat and low-slope systems for businesses and property managers.",
    description:
      "We install and maintain TPO, EPDM and modified bitumen systems for warehouses, offices, retail and multi-family properties, with minimal disruption to your operations.",
    image: "/images/commercial.jpg",
    features: [
      "TPO, EPDM & modified bitumen",
      "Preventive maintenance plans",
      "Roof coatings that extend roof life",
      "Detailed inspection reports",
    ],
  },
  {
    slug: "roof-repair",
    title: "Roof Repair & Emergency",
    short: "Fast leak repair, storm damage response and emergency tarping.",
    description:
      "A small leak can become a big problem fast. Our crews find the source, make lasting repairs and help you document storm damage for insurance claims.",
    image: "/images/repair.svg",
    features: [
      "Leak detection and repair",
      "Storm & hail damage assessment",
      "24/7 emergency tarping",
      "Insurance claim documentation",
    ],
  },
  {
    slug: "metal-roofing",
    title: "Metal Roofing",
    short: "Standing-seam and metal panel roofs that last 50+ years.",
    description:
      "Energy-efficient, fire-resistant and virtually maintenance-free. Metal roofing is a premium long-term investment that looks great on both modern and traditional homes.",
    image: "/images/metal.svg",
    features: [
      "Standing-seam & metal panels",
      "Wide range of colors and finishes",
      "Energy-efficient reflective coatings",
      "50+ year lifespan",
    ],
  },
  {
    slug: "fence-installation",
    title: "Custom Fencing",
    short: "Privacy, vinyl, ornamental iron, horizontal slat & commercial fencing.",
    description:
      "Boost privacy, security, and curb appeal with custom-built fencing installed with concrete-set posts and matching walk or driveway gates. Preview styles, colors, heights, and layouts around your property in our 3D estimator.",
    image: "/images/fencing.svg",
    features: [
      "Wood privacy, vinyl & horizontal modern slats",
      "Ornamental aluminum/iron, picket & chain link",
      "Custom walk gates & double driveway gates",
      "Concrete-set posts built for lasting alignment",
    ],
  },
];

export const faqs = [
  {
    q: "How much does a new roof cost?",
    a: "Cost depends on roof size, pitch, materials and the condition of the deck. We provide free, itemized written estimates after an on-site inspection, so you know exactly what you are paying for.",
  },
  {
    q: "How long does a roof replacement take?",
    a: "Most residential roofs are completed in one to three days, weather permitting. Larger or more complex projects and commercial roofs are scheduled with a clear timeline up front.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. T&S Roofing Systems is fully licensed, bonded and insured, including workers' compensation and general liability coverage.",
  },
  {
    q: "Do you offer warranties?",
    a: "We back our installation with a workmanship warranty and install materials that carry manufacturer warranties. We explain every warranty in writing before work begins.",
  },
  {
    q: "Can you help with insurance claims?",
    a: "Absolutely. We document storm damage with photos and detailed reports and can meet your adjuster on site to make the claims process easier.",
  },
  {
    q: "Do you offer emergency roof repair?",
    a: "Yes — call us any time, day or night, for emergency tarping and leak repair after storms or unexpected damage.",
  },
];

export const processSteps = [
  { title: "Free inspection", text: "We inspect your roof, take photos and explain what we find in plain language." },
  { title: "Clear written quote", text: "You get an itemized estimate with materials, timeline and warranty. No surprises." },
  { title: "Expert installation", text: "Our certified crew protects your property and completes the work safely and on schedule." },
  { title: "Final walkthrough", text: "We clean up thoroughly, inspect the finished roof with you and register your warranty." },
];
