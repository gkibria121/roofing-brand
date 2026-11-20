/**
 * Extensible Fence Catalog — single source of truth for fence styles,
 * finishes/colors, heights, placements, 3D geometry presets, and packages.
 *
 * To add a new fence product in the future, append a new entry to `FENCE_CATALOG`:
 * both the 3D yard preview and the estimator UI / packages will pick it up automatically.
 */

export type FenceGeometryKind =
  | "wood-privacy"
  | "vinyl-privacy"
  | "ornamental-iron"
  | "picket"
  | "horizontal-slat"
  | "chain-link";

export type FenceFinish = {
  id: string;
  label: string;
  /** Primary sRGB hex color for boards/pickets/mesh. */
  color: string;
  /** Optional contrasting post color (e.g. matte-black steel posts on horizontal wood slats). */
  postColor?: string;
};

export type FenceTier = {
  name: string;
  tagline: string;
  features: string[];
  recommended?: boolean;
};

export type FenceStyleDef = {
  id: string;
  label: string;
  shortDescription: string;
  geometry: FenceGeometryKind;
  defaultFinishId: string;
  finishes: FenceFinish[];
  /** Recommended heights in feet (used for display; user can still pick 4/6/8 ft). */
  defaultHeight: FenceHeight;
  packages: FenceTier[];
};

export type FenceHeight = "4ft" | "6ft" | "8ft";
export type FencePlacement = "backyard" | "full-perimeter" | "front-yard";

export const FENCE_HEIGHT_METERS: Record<FenceHeight, number> = {
  "4ft": 1.22,
  "6ft": 1.83,
  "8ft": 2.44,
};

export const fenceHeightOptions: { value: FenceHeight; label: string; description: string }[] = [
  { value: "4ft", label: "4 ft", description: "Open front-yard & decorative height" },
  { value: "6ft", label: "6 ft", description: "Standard residential privacy height" },
  { value: "8ft", label: "8 ft", description: "Tall maximum privacy & commercial security" },
];

export const fencePlacementOptions: { value: FencePlacement; label: string; description: string }[] = [
  { value: "backyard", label: "Backyard & sides", description: "Encloses rear yard from house corners" },
  { value: "full-perimeter", label: "Full perimeter", description: "Surrounds entire lot with driveway & walk openings" },
  { value: "front-yard", label: "Front yard accent", description: "Frames the front yard & street edge" },
];

export const FENCE_CATALOG: FenceStyleDef[] = [
  {
    id: "wood-privacy",
    label: "Wood Privacy",
    shortDescription: "Classic cedar privacy boards with capped 4×4 posts",
    geometry: "wood-privacy",
    defaultFinishId: "natural-cedar",
    defaultHeight: "6ft",
    finishes: [
      { id: "natural-cedar", label: "Natural Cedar", color: "#9c6b43" },
      { id: "espresso", label: "Espresso Stain", color: "#4e3628" },
      { id: "weathered-gray", label: "Weathered Gray", color: "#7d807e" },
    ],
    packages: [
      {
        name: "Essential",
        tagline: "Pressure-treated pine privacy fence",
        features: ["Standard dog-ear pickets", "Concrete-set 4×4 posts", "Galvanized ring-shank fasteners", "5-year workmanship warranty"],
      },
      {
        name: "Signature",
        tagline: "Western Red Cedar board-on-board",
        recommended: true,
        features: ["Premium Western Red Cedar boards", "Top cap & trim rail detail", "Stainless steel fasteners", "10-year workmanship warranty"],
      },
      {
        name: "Premium",
        tagline: "Steel-post cedar privacy system",
        features: ["Hidden steel posts (zero rot)", "Pre-stained architectural cedar", "Heavy-duty welded gate frame", "15-year structural warranty"],
      },
    ],
  },
  {
    id: "vinyl-privacy",
    label: "Vinyl Privacy",
    shortDescription: "Low-maintenance solid tongue-and-groove vinyl panels",
    geometry: "vinyl-privacy",
    defaultFinishId: "classic-white",
    defaultHeight: "6ft",
    finishes: [
      { id: "classic-white", label: "Classic White", color: "#f3f4f6" },
      { id: "warm-almond", label: "Warm Almond", color: "#dfd5c3" },
      { id: "slate-gray", label: "Slate Gray", color: "#8c939b" },
    ],
    packages: [
      {
        name: "Essential",
        tagline: "Clean solid vinyl privacy panels",
        features: ["UV-stabilized virgin vinyl", "5×5 concrete-set vinyl posts", "Pyramid post caps", "Limited lifetime material warranty"],
      },
      {
        name: "Signature",
        tagline: "Reinforced wind-rated vinyl privacy",
        recommended: true,
        features: ["Aluminum-reinforced bottom rails", "Heavy-wall 5×5 structural posts", "Self-closing stainless gate hardware", "15-year workmanship warranty"],
      },
      {
        name: "Premium",
        tagline: "Architectural texture & accent top",
        features: ["Lattice or decorative accent top", "Full aluminum-stiffened gate posts", "Upgraded lockable latch system", "Lifetime transferrable warranty"],
      },
    ],
  },
  {
    id: "ornamental-iron",
    label: "Ornamental Aluminum / Iron",
    shortDescription: "Open architectural pickets with spear-top finials",
    geometry: "ornamental-iron",
    defaultFinishId: "satin-black",
    defaultHeight: "4ft",
    finishes: [
      { id: "satin-black", label: "Satin Black", color: "#1f242b" },
      { id: "arch-bronze", label: "Architectural Bronze", color: "#4a3b31" },
    ],
    packages: [
      {
        name: "Essential",
        tagline: "Powder-coated residential aluminum",
        features: ["Rust-free powder-coated aluminum", "2-rail open picket profile", "Concrete-set structural posts", "10-year workmanship warranty"],
      },
      {
        name: "Signature",
        tagline: "Heavy-gauge 3-rail ornamental",
        recommended: true,
        features: ["3-rail flush-top or spear finial", "AAMA-2604 architectural powder coat", "Heavy welded swing gate", "20-year finish & workmanship warranty"],
      },
      {
        name: "Premium",
        tagline: "Commercial-grade welded steel",
        features: ["Galvanized & powder-coated steel", "Anti-tamper fasteners & heavy posts", "Automated driveway gate ready", "25-year structural warranty"],
      },
    ],
  },
  {
    id: "picket",
    label: "Classic Picket",
    shortDescription: "Timeless spaced pickets for bright front-yard curb appeal",
    geometry: "picket",
    defaultFinishId: "crisp-white",
    defaultHeight: "4ft",
    finishes: [
      { id: "crisp-white", label: "Crisp White", color: "#f4f5f7" },
      { id: "natural-cedar", label: "Natural Cedar", color: "#a4724a" },
      { id: "charcoal", label: "Charcoal", color: "#3b424c" },
    ],
    packages: [
      {
        name: "Essential",
        tagline: "Traditional spaced wood picket",
        features: ["Pointed or dog-ear wood pickets", "Concrete-set 4×4 posts", "Standard walk gate included", "5-year workmanship warranty"],
      },
      {
        name: "Signature",
        tagline: "No-paint vinyl or cedar picket",
        recommended: true,
        features: ["Scalloped or straight picket line", "Decorative New England post caps", "Rust-proof self-closing gate latch", "15-year workmanship warranty"],
      },
      {
        name: "Premium",
        tagline: "Custom craftsman estate picket",
        features: ["Heavy-profile milled pickets", "Fluted post sleeves & gothic caps", "Custom double entry gate", "Lifetime material warranty"],
      },
    ],
  },
  {
    id: "horizontal-slat",
    label: "Horizontal Modern Slat",
    shortDescription: "Contemporary horizontal wood slats with black steel posts",
    geometry: "horizontal-slat",
    defaultFinishId: "warm-redwood",
    defaultHeight: "6ft",
    finishes: [
      { id: "warm-redwood", label: "Warm Redwood", color: "#8f5136", postColor: "#20242a" },
      { id: "natural-cedar", label: "Natural Cedar", color: "#aa7b4e", postColor: "#20242a" },
      { id: "dark-walnut", label: "Dark Walnut", color: "#4a372c", postColor: "#1d2026" },
    ],
    packages: [
      {
        name: "Essential",
        tagline: "Clean horizontal cedar boards",
        features: ["Uniform horizontal cedar slats", "Matte-black powder-coated posts", "Even architectural shadow gaps", "10-year workmanship warranty"],
      },
      {
        name: "Signature",
        tagline: "Clear-grade cedar + steel frame",
        recommended: true,
        features: ["Knot-free clear Western Red Cedar", "Concealed steel post channel", "UV-protective satin oil stain", "15-year structural warranty"],
      },
      {
        name: "Premium",
        tagline: "Composite architectural slat system",
        features: ["Zero-fade composite wood slats", "Heavy structural aluminum framing", "Matching steel-framed modern gate", "25-year system warranty"],
      },
    ],
  },
  {
    id: "chain-link",
    label: "Chain Link",
    shortDescription: "Durable tubular steel & woven mesh for yards or commercial lots",
    geometry: "chain-link",
    defaultFinishId: "black-vinyl",
    defaultHeight: "6ft",
    finishes: [
      { id: "black-vinyl", label: "Black Vinyl-Coated", color: "#262b31" },
      { id: "galvanized", label: "Galvanized Steel", color: "#9da5ae" },
    ],
    packages: [
      {
        name: "Essential",
        tagline: "Standard galvanized chain link",
        features: ["11.5-gauge galvanized steel mesh", "Concrete-set terminal & line posts", "Top rail & tension wire", "5-year workmanship warranty"],
      },
      {
        name: "Signature",
        tagline: "Black vinyl-coated residential",
        recommended: true,
        features: ["9-gauge black vinyl-coated mesh", "Color-matched posts & fittings", "Heavy welded swing gate", "15-year workmanship warranty"],
      },
      {
        name: "Premium",
        tagline: "Commercial security grade",
        features: ["Heavy commercial 9-gauge fabric", "Schedule-40 structural steel posts", "Optional privacy slats & double gates", "20-year structural warranty"],
      },
    ],
  },
];

export function getFenceStyle(id?: string): FenceStyleDef {
  return FENCE_CATALOG.find((f) => f.id === id) ?? FENCE_CATALOG[0];
}

export function getFenceFinish(styleId?: string, finishId?: string): FenceFinish {
  const style = getFenceStyle(styleId);
  return style.finishes.find((f) => f.id === finishId) ?? style.finishes[0];
}
