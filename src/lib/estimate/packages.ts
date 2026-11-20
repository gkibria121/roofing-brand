import type { Answers, Material } from "./questions";

export type Tier = {
  name: string;
  tagline: string;
  features: string[];
  recommended?: boolean;
};

/**
 * Placeholder package copy — edit freely. Pricing is intentionally not shown:
 * final pricing is set after the free on-site inspection.
 */
const catalog: Record<Material, Tier[]> = {
  asphalt: [
    { name: "Essential", tagline: "Reliable protection at a great value", features: ["Architectural asphalt shingles", "Synthetic underlayment", "Full tear-off & clean-up", "10-year workmanship warranty"] },
    { name: "Signature", tagline: "Our most popular upgrade", recommended: true, features: ["Impact-resistant premium shingles", "Ice & water shield at valleys and eaves", "Upgraded ridge ventilation", "25-year workmanship warranty"] },
    { name: "Premium", tagline: "Designer look, maximum protection", features: ["Designer luxury shingles", "Full-deck waterproof underlayment", "Complete ventilation & flashing upgrade", "Lifetime system warranty"] },
  ],
  metal: [
    { name: "Essential", tagline: "Exposed-fastener metal panels", features: ["Ribbed galvalume panels", "Synthetic underlayment", "Trim, flashing & closures", "10-year workmanship warranty"] },
    { name: "Signature", tagline: "Standing-seam performance", recommended: true, features: ["Concealed-fastener standing-seam panels", "High-temp underlayment", "Custom-bent trim & flashing", "25-year workmanship warranty"] },
    { name: "Premium", tagline: "Architectural metal roofing", features: ["Heavy-gauge standing seam, premium finish", "Full-deck underlayment system", "Snow guards & custom details", "Lifetime paint & system warranty"] },
  ],
  tpo: [
    { name: "Essential", tagline: "Single-ply TPO membrane", features: ["45-mil white TPO membrane", "Mechanically attached", "New flashing at penetrations", "10-year workmanship warranty"] },
    { name: "Signature", tagline: "Fully adhered, energy-efficient", recommended: true, features: ["60-mil reflective TPO, fully adhered", "Polyiso insulation board", "Heat-welded seams & details", "20-year system warranty"] },
    { name: "Premium", tagline: "Long-life commercial system", features: ["80-mil TPO with cover board", "Tapered insulation for drainage", "Walkway pads & new drains", "30-year NDL system warranty"] },
  ],
  modbit: [
    { name: "Essential", tagline: "Two-ply modified bitumen", features: ["Base sheet + cap sheet", "Torch or cold-applied", "New flashing at penetrations", "10-year workmanship warranty"] },
    { name: "Signature", tagline: "Reinforced, UV-protected", recommended: true, features: ["Granulated cap sheet", "Insulation board layer", "Reinforced flashing & drains", "20-year system warranty"] },
    { name: "Premium", tagline: "Maximum durability", features: ["Three-ply system with cover board", "Tapered insulation for drainage", "Reflective coating", "30-year system warranty"] },
  ],
  // Not offered as new-roof choices today, but kept so the type stays exhaustive.
  epdm: [],
  tile: [],
  cedar: [],
};

export function getPackages(a: Partial<Answers>): Tier[] {
  const type = a.desiredType ?? (a.slope === "flat" ? "tpo" : "asphalt");
  return catalog[type];
}

export function getCallouts(a: Partial<Answers>): { title: string; text: string }[] {
  const out: { title: string; text: string }[] = [];
  if (a.damage === "yes") out.push({ title: "Priority leak response", text: "Because you reported leaks or damage, we’ll prioritize your inspection and can tarp or patch problem areas right away." });
  if (a.insurance === "yes" || a.financing === "insurance") out.push({ title: "Insurance claim support", text: "We document damage with photos and reports and can meet your adjuster on site." });
  if (a.solar === "yes") out.push({ title: "Solar-ready roofing", text: "We’ll plan decking, flashing and layout so panels can be installed on your new roof without compromising the warranty." });
  if (a.financing === "financing") out.push({ title: "Financing options", text: "We’ll review monthly payment options with your estimate." });
  if (a.timeline === "asap") out.push({ title: "Fast scheduling", text: "You asked for the earliest availability — call us for the quickest inspection slot." });
  if (a.roofAge === "10+" && a.damage !== "yes") out.push({ title: "Age-related inspection", text: "Roofs over ten years old often have hidden wear. Our inspection checks decking, flashing and ventilation, not just the surface." });
  return out;
}
