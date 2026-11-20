import type { Answers, Material, PreviewMode, RoofMaterialDef, Slope } from "../domain/schemas";
import type { Callout, Option, ServicePackageGroup, ServicePlugin, StepDef } from "../domain/types";
import { PROPERTY_STEPS } from "./property";

/**
 * Single source of truth for roofing options, PBR 3D surface specs,
 * guided steps, packages, and callouts.
 *
 * To add or tune a roofing material, edit `ROOF_MATERIAL_CATALOG` below —
 * both the 3D engine and the estimator UI read directly from this catalog.
 */

export const SLOPE_OPTIONS: readonly Option[] = [
  { value: "flat", label: "Flat", description: "Little to no visible slope" },
  { value: "low", label: "Low", description: "Gentle slope, about 4:12" },
  { value: "moderate", label: "Moderate", description: "Typical home slope, about 7:12" },
  { value: "steep", label: "Steep", description: "Sharp pitch, 12:12 or more" },
];

export const SLOPE_BADGES: Record<Slope, string> = {
  flat: "Flat roof",
  low: "Low slope",
  moderate: "Moderate slope",
  steep: "Steep slope",
};

export const ROOF_MATERIAL_CATALOG: readonly RoofMaterialDef[] = [
  {
    id: "asphalt",
    label: "Asphalt",
    description: "Classic architectural asphalt shingles",
    supportsFlat: false,
    supportsPitched: true,
    offeredAsNew: true,
    baseColor: "#3b4047",
    pbr: { tile: 2.1, roughness: 0.92, metalness: 0.02, bump: 0.055 },
    packages: [
      { name: "Essential", tagline: "Reliable protection at a great value", features: ["Architectural asphalt shingles", "Synthetic underlayment", "Full tear-off & clean-up", "10-year workmanship warranty"] },
      { name: "Signature", tagline: "Our most popular upgrade", recommended: true, features: ["Impact-resistant premium shingles", "Ice & water shield at valleys and eaves", "Upgraded ridge ventilation", "25-year workmanship warranty"] },
      { name: "Premium", tagline: "Designer look, maximum protection", features: ["Designer luxury shingles", "Full-deck waterproof underlayment", "Complete ventilation & flashing upgrade", "Lifetime system warranty"] },
    ],
  },
  {
    id: "metal",
    label: "Metal",
    description: "Standing-seam & metal roof panels",
    supportsFlat: false,
    supportsPitched: true,
    offeredAsNew: true,
    baseColor: "#56636d",
    pbr: { tile: 1.5, roughness: 0.34, metalness: 0.68, bump: 0.03 },
    packages: [
      { name: "Essential", tagline: "Exposed-fastener metal panels", features: ["Ribbed galvalume panels", "Synthetic underlayment", "Trim, flashing & closures", "10-year workmanship warranty"] },
      { name: "Signature", tagline: "Standing-seam performance", recommended: true, features: ["Concealed-fastener standing-seam panels", "High-temp underlayment", "Custom-bent trim & flashing", "25-year workmanship warranty"] },
      { name: "Premium", tagline: "Architectural metal roofing", features: ["Heavy-gauge standing seam, premium finish", "Full-deck underlayment system", "Snow guards & custom details", "Lifetime paint & system warranty"] },
    ],
  },
  {
    id: "tile",
    label: "Tile",
    description: "Clay or concrete interlocking roof tiles",
    supportsFlat: false,
    supportsPitched: true,
    offeredAsNew: false,
    baseColor: "#ad4d34",
    pbr: { tile: 2.0, roughness: 0.72, metalness: 0.02, bump: 0.085 },
    packages: [],
  },
  {
    id: "cedar",
    label: "Cedar",
    description: "Natural wood shakes or shingles",
    supportsFlat: false,
    supportsPitched: true,
    offeredAsNew: false,
    baseColor: "#875a3a",
    pbr: { tile: 2.0, roughness: 0.88, metalness: 0.0, bump: 0.065 },
    packages: [],
  },
  {
    id: "tpo",
    label: "TPO",
    description: "Reflective white single-ply membrane",
    supportsFlat: true,
    supportsPitched: false,
    offeredAsNew: true,
    baseColor: "#eceff1",
    pbr: { tile: 4.0, roughness: 0.56, metalness: 0.02, bump: 0.02 },
    packages: [
      { name: "Essential", tagline: "Single-ply TPO membrane", features: ["45-mil white TPO membrane", "Mechanically attached", "New flashing at penetrations", "10-year workmanship warranty"] },
      { name: "Signature", tagline: "Fully adhered, energy-efficient", recommended: true, features: ["60-mil reflective TPO, fully adhered", "Polyiso insulation board", "Heat-welded seams & details", "20-year system warranty"] },
      { name: "Premium", tagline: "Long-life commercial system", features: ["80-mil TPO with cover board", "Tapered insulation for drainage", "Walkway pads & new drains", "30-year NDL system warranty"] },
    ],
  },
  {
    id: "epdm",
    label: "EPDM",
    description: "Durable black rubber roof membrane",
    supportsFlat: true,
    supportsPitched: false,
    offeredAsNew: false,
    baseColor: "#282b2f",
    pbr: { tile: 4.0, roughness: 0.88, metalness: 0.0, bump: 0.02 },
    packages: [],
  },
  {
    id: "modbit",
    label: "Modified Bitumen",
    description: "Multi-layer granulated asphalt roll roofing",
    supportsFlat: true,
    supportsPitched: false,
    offeredAsNew: true,
    baseColor: "#575a5f",
    pbr: { tile: 3.0, roughness: 0.94, metalness: 0.0, bump: 0.04 },
    packages: [
      { name: "Essential", tagline: "Two-ply modified bitumen", features: ["Base sheet + cap sheet", "Torch or cold-applied", "New flashing at penetrations", "10-year workmanship warranty"] },
      { name: "Signature", tagline: "Reinforced, UV-protected", recommended: true, features: ["Granulated cap sheet", "Insulation board layer", "Reinforced flashing & drains", "20-year system warranty"] },
      { name: "Premium", tagline: "Maximum durability", features: ["Three-ply system with cover board", "Tapered insulation for drainage", "Reflective coating", "30-year system warranty"] },
    ],
  },
];

const ROOF_MATERIAL_BY_ID: Record<Material, RoofMaterialDef> = Object.fromEntries(
  ROOF_MATERIAL_CATALOG.map((m) => [m.id, m]),
) as Record<Material, RoofMaterialDef>;

export const isFlatSlope = (slope?: Slope) => slope === "flat";
export const isFlatMaterial = (id: Material) => ROOF_MATERIAL_BY_ID[id].supportsFlat;

export function getRoofMaterialDef(id: Material): RoofMaterialDef {
  return ROOF_MATERIAL_BY_ID[id];
}

export function currentMaterialOptions(a: Partial<Answers>): Option[] {
  const flat = isFlatSlope(a.slope);
  return ROOF_MATERIAL_CATALOG.filter((m) => (flat ? m.supportsFlat : m.supportsPitched)).map((m) => ({
    value: m.id,
    label: m.label,
    description: m.description,
  }));
}

export function desiredMaterialOptions(a: Partial<Answers>): Option[] {
  const flat = isFlatSlope(a.slope);
  return ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew && (flat ? m.supportsFlat : m.supportsPitched)).map(
    (m) => ({
      value: m.id,
      label: m.label,
      description: m.description,
    }),
  );
}

const ROOFING_STEPS: Partial<Record<keyof Answers, StepDef>> = {
  slope: {
    id: "slope",
    category: "roofing",
    summaryLabel: "Roof slope",
    title: "What is the slope of your roof?",
    options: () => [...SLOPE_OPTIONS],
  },
  stories: PROPERTY_STEPS.stories,
  buildingType: PROPERTY_STEPS.buildingType,
  currentMaterial: {
    id: "currentMaterial",
    category: "roofing",
    summaryLabel: "Current roof",
    title: "What is currently on your roof?",
    options: currentMaterialOptions,
  },
  roofAge: {
    id: "roofAge",
    category: "roofing",
    summaryLabel: "Roof age",
    title: "How old is your main roof?",
    hint: "If there are multiple buildings, what is the age of the largest roof?",
    options: () => [
      { value: "0-10", label: "0–10 years", description: "My roof is relatively new" },
      { value: "10+", label: "10+ years", description: "My roof is over a decade old" },
      { value: "unsure", label: "Not sure", description: "I am unsure about the age of my roof" },
    ],
  },
  damage: {
    id: "damage",
    category: "roofing",
    summaryLabel: "Leaks or damage",
    title: "Does your roof have leaks or damage?",
    options: () => [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  desiredType: {
    id: "desiredType",
    category: "roofing",
    summaryLabel: "New roof",
    title: "What type of roof would you like?",
    hint: "Your 3D preview will switch to the new roof once you choose.",
    options: desiredMaterialOptions,
  },
  solar: {
    id: "solar",
    category: "roofing",
    summaryLabel: "Solar",
    title: "Are you interested in installing solar panels on your roof?",
    options: () => [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
};

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export const roofingPlugin: ServicePlugin = {
  id: "roofing",
  label: "Roofing",
  subtitle: "Slope, materials & solar",
  stepIds: ["slope", "stories", "buildingType", "currentMaterial", "roofAge", "damage", "desiredType", "solar"],
  steps: ROOFING_STEPS,

  seedDefaults(answers) {
    return answers;
  },

  sanitize(answers) {
    const next = { ...answers };
    const valid = (opts: Option[], v?: string) => opts.some((o) => o.value === v);
    if (next.currentMaterial && !valid(currentMaterialOptions(next), next.currentMaterial)) {
      delete next.currentMaterial;
    }
    if (next.desiredType && !valid(desiredMaterialOptions(next), next.desiredType)) {
      delete next.desiredType;
    }
    return next;
  },

  getPackageGroup(answers): ServicePackageGroup {
    const desired: Material = answers.desiredType ?? (isFlatSlope(answers.slope) ? "tpo" : "asphalt");
    const def = getRoofMaterialDef(desired);
    return {
      serviceId: "roofing",
      radioGroupName: "roofPackageTier",
      legend: `Choose ${articleFor(def.label)} ${def.label} roofing package:`,
      itemLabel: `${def.label} Roof`,
      tiers: def.packages,
    };
  },

  getCallouts(answers): Callout[] {
    const out: Callout[] = [];
    if (answers.damage === "yes") {
      out.push({
        title: "Priority leak response",
        text: "Because you reported leaks or damage, we’ll prioritize your inspection and can tarp or patch problem areas right away.",
      });
    }
    if (answers.solar === "yes") {
      out.push({
        title: "Solar-ready roofing",
        text: "We’ll plan decking, flashing and layout so panels can be installed on your new roof without compromising the warranty.",
      });
    }
    if (answers.roofAge === "10+" && answers.damage !== "yes") {
      out.push({
        title: "Age-related inspection",
        text: "Roofs over ten years old often have hidden wear. Our inspection checks decking, flashing and ventilation, not just the surface.",
      });
    }
    return out;
  },

  getBadges(answers, previewMode: PreviewMode): string[] {
    const slope: Slope = answers.slope ?? "moderate";
    const fallback: Material = isFlatSlope(slope) ? "tpo" : "asphalt";
    const isNew = previewMode === "new";
    const mat: Material = isNew ? (answers.desiredType ?? fallback) : (answers.currentMaterial ?? fallback);
    const out = [SLOPE_BADGES[slope], getRoofMaterialDef(mat).label];
    if (!isNew && answers.damage === "yes") out.push("Damage noted");
    if (isNew && answers.solar === "yes") out.push("+ Solar panels");
    return out;
  },

  getSpecSummary(answers, previewMode: PreviewMode) {
    const slope: Slope = answers.slope ?? "moderate";
    const fallback: Material = isFlatSlope(slope) ? "tpo" : "asphalt";
    const mat: Material =
      previewMode === "new" ? (answers.desiredType ?? fallback) : (answers.currentMaterial ?? fallback);
    return {
      label: "Roof shown",
      value: `${slope} · ${getRoofMaterialDef(mat).label}`,
    };
  },
};
