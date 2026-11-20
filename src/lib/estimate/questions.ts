/**
 * Multi-service 3D configurator questions (Roofing + Fencing).
 * Every question directly updates the 3D building, roof, or yard fence model.
 */

import {
  FENCE_CATALOG,
  fenceHeightOptions,
  fencePlacementOptions,
  getFenceStyle,
  type FenceHeight,
  type FencePlacement,
} from "./fences";

export type ServiceId = "roofing" | "fencing";

export type Slope = "flat" | "low" | "moderate" | "steep";
export type Stories = "single" | "multiple";
export type BuildingType = "residential" | "commercial";
export type FlatMaterial = "tpo" | "epdm" | "modbit";
export type PitchedMaterial = "asphalt" | "metal" | "tile" | "cedar";
export type Material = FlatMaterial | PitchedMaterial;
export type RoofAge = "0-10" | "10+" | "unsure";
export type YesNo = "yes" | "no";

export type Answers = {
  // Roofing & building
  slope: Slope;
  stories: Stories;
  buildingType: BuildingType;
  currentMaterial: Material;
  roofAge: RoofAge;
  damage: YesNo;
  desiredType: Material;
  solar: YesNo;
  // Fencing
  fenceStyle: string;
  fenceFinish: string;
  fenceHeight: FenceHeight;
  fencePlacement: FencePlacement;
  fenceGate: YesNo;
};

export type StepId = keyof Answers;

export type Option = {
  value: string;
  label: string;
  description?: string;
  /** Optional swatch hex color for visual finish chips. */
  swatch?: string;
  swatchSecondary?: string;
};

export type StepDef = {
  id: StepId;
  category: "roofing" | "fencing" | "property";
  summaryLabel: string;
  title: string;
  hint?: string;
  options: (answers: Partial<Answers>) => Option[];
};

export const slopeOptions: Option[] = [
  { value: "flat", label: "Flat", description: "Little to no visible slope" },
  { value: "low", label: "Low", description: "Gentle slope, about 4:12" },
  { value: "moderate", label: "Moderate", description: "Typical home slope, about 7:12" },
  { value: "steep", label: "Steep", description: "Sharp pitch, 12:12 or more" },
];

export const materialLabels: Record<Material, string> = {
  tpo: "TPO",
  epdm: "EPDM",
  modbit: "Modified Bitumen",
  asphalt: "Asphalt",
  metal: "Metal",
  tile: "Tile",
  cedar: "Cedar",
};

export const materialDescriptions: Record<Material, string> = {
  tpo: "Reflective white single-ply membrane",
  epdm: "Durable black rubber roof membrane",
  modbit: "Multi-layer granulated asphalt roll roofing",
  asphalt: "Classic architectural asphalt shingles",
  metal: "Standing-seam & metal roof panels",
  tile: "Clay or concrete interlocking roof tiles",
  cedar: "Natural wood shakes or shingles",
};

const mat = (...values: Material[]): Option[] =>
  values.map((v) => ({ value: v, label: materialLabels[v], description: materialDescriptions[v] }));

export const isFlat = (slope?: Slope) => slope === "flat";

export function currentMaterialOptions(a: Partial<Answers>): Option[] {
  return isFlat(a.slope) ? mat("tpo", "epdm", "modbit") : mat("asphalt", "metal", "tile", "cedar");
}

export function desiredMaterialOptions(a: Partial<Answers>): Option[] {
  return isFlat(a.slope) ? mat("tpo", "modbit") : mat("asphalt", "metal");
}

export const allSteps: Record<StepId, StepDef> = {
  slope: {
    id: "slope",
    category: "roofing",
    summaryLabel: "Roof slope",
    title: "What is the slope of your roof?",
    options: () => slopeOptions,
  },
  stories: {
    id: "stories",
    category: "property",
    summaryLabel: "Stories",
    title: "Does your building have multiple stories?",
    options: () => [
      { value: "single", label: "Single story" },
      { value: "multiple", label: "Multiple stories" },
    ],
  },
  buildingType: {
    id: "buildingType",
    category: "property",
    summaryLabel: "Building type",
    title: "What type of building do you have?",
    options: () => [
      { value: "residential", label: "Residential", description: "House, townhome or duplex" },
      { value: "commercial", label: "Commercial", description: "Office, retail, warehouse or multi-family" },
    ],
  },
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
  fenceStyle: {
    id: "fenceStyle",
    category: "fencing",
    summaryLabel: "Fence style",
    title: "Which fence style fits your property?",
    hint: "Watch the 3D fence wrap around your yard as you preview each style.",
    options: () =>
      FENCE_CATALOG.map((f) => ({
        value: f.id,
        label: f.label,
        description: f.shortDescription,
      })),
  },
  fenceFinish: {
    id: "fenceFinish",
    category: "fencing",
    summaryLabel: "Fence finish",
    title: "Choose your fence color & finish",
    options: (a) => {
      const style = getFenceStyle(a.fenceStyle);
      return style.finishes.map((fin) => ({
        value: fin.id,
        label: fin.label,
        swatch: fin.color,
        swatchSecondary: fin.postColor,
      }));
    },
  },
  fenceHeight: {
    id: "fenceHeight",
    category: "fencing",
    summaryLabel: "Fence height",
    title: "How tall should your fence be?",
    options: () => fenceHeightOptions,
  },
  fencePlacement: {
    id: "fencePlacement",
    category: "fencing",
    summaryLabel: "Fence coverage",
    title: "Where around the house should the fence go?",
    options: () => fencePlacementOptions,
  },
  fenceGate: {
    id: "fenceGate",
    category: "fencing",
    summaryLabel: "Entry gate",
    title: "Add matching entry & driveway gates?",
    hint: "Includes a walk gate for paths and a double-swing gate across the driveway when enclosed.",
    options: () => [
      { value: "yes", label: "Yes, include matching gates", description: "Framed gates with matte-black latches" },
      { value: "no", label: "No gates (open entry)", description: "Leave walkway and driveway openings clear" },
    ],
  },
};

export function getStepsForServices(services: ServiceId[]): StepDef[] {
  const hasRoof = services.includes("roofing");
  const hasFence = services.includes("fencing");
  const ids: StepId[] = [];

  if (hasRoof) {
    ids.push("slope", "stories", "buildingType", "currentMaterial", "roofAge", "damage", "desiredType", "solar");
  } else if (hasFence) {
    ids.push("buildingType", "stories");
  }

  if (hasFence) {
    ids.push("fenceStyle", "fenceFinish", "fenceHeight", "fencePlacement", "fenceGate");
  }
  return ids.map((id) => allSteps[id]);
}

export function labelFor(step: StepDef, answers: Partial<Answers>): string {
  const v = answers[step.id];
  if (v === undefined) return "—";
  return step.options(answers).find((o) => o.value === v)?.label ?? String(v);
}

/**
 * Apply an answer and keep dependent answers synchronized
 * (slope -> roof materials; fenceStyle -> valid fenceFinish).
 */
export function applyAnswer<K extends StepId>(prev: Partial<Answers>, id: K, value: Answers[K]): Partial<Answers> {
  const next: Partial<Answers> = { ...prev, [id]: value };
  if (id === "slope") {
    const valid = (opts: Option[], v?: string) => opts.some((o) => o.value === v);
    if (!valid(currentMaterialOptions(next), next.currentMaterial)) delete next.currentMaterial;
    if (!valid(desiredMaterialOptions(next), next.desiredType)) delete next.desiredType;
  }
  if (id === "fenceStyle") {
    const style = getFenceStyle(String(value));
    const finishValid = style.finishes.some((f) => f.id === next.fenceFinish);
    if (!finishValid) next.fenceFinish = style.defaultFinishId;
    if (!next.fenceHeight) next.fenceHeight = style.defaultHeight;
  }
  return next;
}

export function isAnswered(step: StepDef, answers: Partial<Answers>): boolean {
  return answers[step.id] !== undefined;
}
