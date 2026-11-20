/**
 * Roofing estimate questionnaire — single source of truth for the flow.
 *
 * Flow (see the product spec): address → slope → stories → building type →
 * current material (depends on slope) → roof age → leaks/damage → insurance →
 * desired roof type (depends on slope) → solar → timeline → financing → notes →
 * matching packages.
 */

export type Slope = "flat" | "low" | "moderate" | "steep";
export type Stories = "single" | "multiple";
export type BuildingType = "residential" | "commercial";
export type FlatMaterial = "tpo" | "epdm" | "modbit";
export type PitchedMaterial = "asphalt" | "metal" | "tile" | "cedar";
export type Material = FlatMaterial | PitchedMaterial;
export type RoofAge = "0-10" | "10+" | "unsure";
export type YesNo = "yes" | "no";
export type Timeline = "asap" | "1-month" | "1-3-months" | "researching";
export type Financing = "cash" | "financing" | "insurance" | "unsure";

export type Answers = {
  address: string;
  slope: Slope;
  stories: Stories;
  buildingType: BuildingType;
  currentMaterial: Material;
  roofAge: RoofAge;
  damage: YesNo;
  insurance: YesNo;
  desiredType: Material;
  solar: YesNo;
  timeline: Timeline;
  financing: Financing;
  notes: string;
};

export type StepId = keyof Answers;

export type Option = {
  value: string;
  label: string;
  description?: string;
};

export type StepDef = {
  id: StepId;
  /** Short name used in the summary list. */
  summaryLabel: string;
  title: string;
  hint?: string;
  kind: "address" | "single" | "text";
  required: boolean;
  options?: (answers: Partial<Answers>) => Option[];
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

/** Step 5 — depends on slope (step 2). */
export function currentMaterialOptions(a: Partial<Answers>): Option[] {
  return isFlat(a.slope) ? mat("tpo", "epdm", "modbit") : mat("asphalt", "metal", "tile", "cedar");
}

/** Step 9 — depends on slope (step 2). */
export function desiredMaterialOptions(a: Partial<Answers>): Option[] {
  return isFlat(a.slope) ? mat("tpo", "modbit") : mat("asphalt", "metal");
}

export const steps: StepDef[] = [
  {
    id: "address",
    summaryLabel: "Address",
    title: "What’s your address?",
    hint: "We use this to locate the property and schedule your free inspection.",
    kind: "address",
    required: true,
  },
  {
    id: "slope",
    summaryLabel: "Roof slope",
    title: "What is the slope of your roof?",
    kind: "single",
    required: true,
    options: () => slopeOptions,
  },
  {
    id: "stories",
    summaryLabel: "Stories",
    title: "Does your building have multiple stories?",
    kind: "single",
    required: true,
    options: () => [
      { value: "single", label: "Single story" },
      { value: "multiple", label: "Multiple stories" },
    ],
  },
  {
    id: "buildingType",
    summaryLabel: "Building type",
    title: "What type of building do you have?",
    kind: "single",
    required: true,
    options: () => [
      { value: "residential", label: "Residential", description: "House, townhome or duplex" },
      { value: "commercial", label: "Commercial", description: "Office, retail, warehouse or multi-family" },
    ],
  },
  {
    id: "currentMaterial",
    summaryLabel: "Current roof",
    title: "What is currently on your roof?",
    kind: "single",
    required: true,
    options: currentMaterialOptions,
  },
  {
    id: "roofAge",
    summaryLabel: "Roof age",
    title: "How old is your main roof?",
    hint: "If there are multiple buildings, what is the age of the largest roof?",
    kind: "single",
    required: true,
    options: () => [
      { value: "0-10", label: "0–10 years", description: "My roof is relatively new" },
      { value: "10+", label: "10+ years", description: "My roof is over a decade old" },
      { value: "unsure", label: "Not sure", description: "I am unsure about the age of my roof" },
    ],
  },
  {
    id: "damage",
    summaryLabel: "Leaks or damage",
    title: "Does your roof have leaks or damage?",
    kind: "single",
    required: true,
    options: () => [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "insurance",
    summaryLabel: "Insurance claim",
    title: "Is this work part of an insurance claim?",
    kind: "single",
    required: true,
    options: () => [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "desiredType",
    summaryLabel: "New roof",
    title: "What type of roof would you like?",
    hint: "Your 3D preview will switch to the new roof once you choose.",
    kind: "single",
    required: true,
    options: desiredMaterialOptions,
  },
  {
    id: "solar",
    summaryLabel: "Solar",
    title: "Are you interested in installing solar panels on your roof?",
    kind: "single",
    required: true,
    options: () => [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "timeline",
    summaryLabel: "Timeline",
    title: "When would you like the work done?",
    kind: "single",
    required: true,
    options: () => [
      { value: "asap", label: "As soon as possible" },
      { value: "1-month", label: "Within 1 month" },
      { value: "1-3-months", label: "In 1–3 months" },
      { value: "researching", label: "Just researching" },
    ],
  },
  {
    id: "financing",
    summaryLabel: "Payment",
    title: "How do you plan to pay for the project?",
    kind: "single",
    required: true,
    options: () => [
      { value: "cash", label: "Pay directly" },
      { value: "financing", label: "I’d like financing options" },
      { value: "insurance", label: "Insurance will cover it" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
  {
    id: "notes",
    summaryLabel: "Notes",
    title: "Anything else we should know about your project?",
    hint: "Optional — access issues, multiple buildings, skylights, deadlines…",
    kind: "text",
    required: false,
  },
];

/** Human label for a stored answer value. */
export function labelFor(step: StepDef, answers: Partial<Answers>): string {
  const v = answers[step.id];
  if (v === undefined || v === "") return step.required ? "—" : "None";
  if (step.kind === "single") {
    return step.options?.(answers).find((o) => o.value === v)?.label ?? String(v);
  }
  return String(v);
}

/**
 * Apply an answer and drop any dependent answers that are no longer valid
 * (e.g. changing slope from Moderate to Flat invalidates "Asphalt").
 */
export function applyAnswer<K extends StepId>(prev: Partial<Answers>, id: K, value: Answers[K]): Partial<Answers> {
  const next: Partial<Answers> = { ...prev, [id]: value };
  if (id === "slope") {
    const valid = (opts: Option[], v?: string) => opts.some((o) => o.value === v);
    if (!valid(currentMaterialOptions(next), next.currentMaterial)) delete next.currentMaterial;
    if (!valid(desiredMaterialOptions(next), next.desiredType)) delete next.desiredType;
  }
  return next;
}

export function isAnswered(step: StepDef, answers: Partial<Answers>): boolean {
  const v = answers[step.id];
  if (!step.required) return true;
  if (step.kind === "address") return typeof v === "string" && v.trim().length >= 5;
  return v !== undefined && v !== "";
}
