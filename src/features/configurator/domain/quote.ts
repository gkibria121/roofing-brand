import { FENCE_PLACEMENT_OPTIONS, getFenceFinish, getFenceStyle } from "../catalogs/fencing";
import { getRoofMaterialDef, isFlatSlope, SLOPE_BADGES } from "../catalogs/roofing";
import type { Answers, FenceHeight, FencePlacement, Material, ServiceId, Slope } from "./schemas";

/**
 * Pure pricing & saved-configuration cart engine for the final Custom Quote step.
 * All unit rates are derived directly from `ROOF_MATERIAL_CATALOG` and `FENCE_CATALOG`.
 */

export interface SavedConfiguration {
  id: string;
  serviceId: ServiceId;
  serviceLabel: string;
  itemName: string;
  specsSummary: string;
  tierName: string;
  availableTiers: readonly string[];
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unit: "ft" | "sq ft";
  unitRate: number;
  accentColor: string;
  snapshotUrl?: string;
  sourceAnswers: Partial<Answers>;
}

export const TIER_MULTIPLIERS: Record<string, number> = {
  Essential: 1.0,
  Signature: 1.25,
  Premium: 1.55,
};

const FENCE_HEIGHT_MULTIPLIER: Record<FenceHeight, number> = {
  "4ft": 0.85,
  "6ft": 1.0,
  "8ft": 1.32,
};

const FENCE_DEFAULT_LENGTH_FT: Record<FencePlacement, number> = {
  backyard: 140,
  "full-perimeter": 260,
  "front-yard": 80,
};

const SLOPE_PRICE_MULTIPLIER: Record<Slope, number> = {
  flat: 1.0,
  low: 1.0,
  moderate: 1.08,
  steep: 1.24,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeRoofUnitRate(material: Material, slope: Slope, tierName: string, solar: boolean): number {
  const def = getRoofMaterialDef(material);
  const tierMult = TIER_MULTIPLIERS[tierName] ?? 1.25;
  const slopeMult = SLOPE_PRICE_MULTIPLIER[slope] ?? 1.0;
  const solarAddon = solar ? 1.85 : 0;
  return round2(def.pricePerSqFt * tierMult * slopeMult + solarAddon);
}

export function computeFenceUnitRate(
  styleId: string,
  height: FenceHeight,
  tierName: string,
  hasGate: boolean,
): number {
  const style = getFenceStyle(styleId);
  const tierMult = TIER_MULTIPLIERS[tierName] ?? 1.25;
  const heightMult = FENCE_HEIGHT_MULTIPLIER[height] ?? 1.0;
  const gateSpread = hasGate ? 2.15 : 0;
  return round2(style.pricePerLinearFt * tierMult * heightMult + gateSpread);
}

export function calculateLineTotal(config: Pick<SavedConfiguration, "quantity" | "unitRate">): number {
  return Math.round(Math.max(1, config.quantity) * config.unitRate);
}

export function calculateQuoteTotal(configs: readonly SavedConfiguration[]): number {
  return configs.reduce((sum, cfg) => sum + calculateLineTotal(cfg), 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUnitRate(rate: number, unit: "ft" | "sq ft"): string {
  return `~$${rate.toFixed(2)}/${unit}`;
}

function defaultRoofAreaSqFt(answers: Partial<Answers>): number {
  if (answers.buildingType === "commercial") {
    return answers.stories === "multiple" ? 5200 : 4200;
  }
  return answers.stories === "multiple" ? 2600 : 2000;
}

/**
 * Turns the user's active 3D studio configuration into 1 or more SavedConfiguration
 * line items (one per enabled service) ready for the Custom Quote summary.
 */
export function buildConfigurationsFromSession(
  services: readonly ServiceId[],
  answers: Partial<Answers>,
  snapshotUrl?: string,
  idPrefix = "cfg",
): SavedConfiguration[] {
  const out: SavedConfiguration[] = [];

  if (services.includes("roofing")) {
    const slope: Slope = answers.slope ?? "moderate";
    const material: Material = answers.desiredType ?? (isFlatSlope(slope) ? "tpo" : "asphalt");
    const def = getRoofMaterialDef(material);
    const tiers = def.packages.length > 0 ? def.packages.map((p) => p.name) : ["Essential", "Signature", "Premium"];
    const tierName = def.packages.find((p) => p.recommended)?.name ?? tiers[0] ?? "Signature";
    const solar = answers.solar === "yes";
    const storiesLabel = answers.stories === "multiple" ? "Multi-story" : "1-story";
    const bldgLabel = answers.buildingType === "commercial" ? "Commercial" : "Residential";

    out.push({
      id: `${idPrefix}-roofing`,
      serviceId: "roofing",
      serviceLabel: `${def.label} Roof`,
      itemName: `${def.label} Roof · ${tierName}`,
      specsSummary: `${SLOPE_BADGES[slope]}, ${storiesLabel} ${bldgLabel}${solar ? ", Solar-ready panel array" : ""}${answers.damage === "yes" ? ", Priority leak repair" : ""}`,
      tierName,
      availableTiers: tiers,
      quantity: defaultRoofAreaSqFt(answers),
      minQuantity: 400,
      maxQuantity: 25000,
      unit: "sq ft",
      unitRate: computeRoofUnitRate(material, slope, tierName, solar),
      accentColor: def.baseColor,
      snapshotUrl,
      sourceAnswers: { ...answers },
    });
  }

  if (services.includes("fencing")) {
    const style = getFenceStyle(answers.fenceStyle);
    const finish = getFenceFinish(style.id, answers.fenceFinish);
    const height: FenceHeight = answers.fenceHeight ?? style.defaultHeight;
    const placement: FencePlacement = answers.fencePlacement ?? "backyard";
    const placementLabel = FENCE_PLACEMENT_OPTIONS.find((p) => p.value === placement)?.label ?? "Backyard & sides";
    const hasGate = (answers.fenceGate ?? "yes") === "yes";
    const tiers = style.packages.map((p) => p.name);
    const tierName = style.packages.find((p) => p.recommended)?.name ?? tiers[0] ?? "Signature";

    out.push({
      id: `${idPrefix}-fencing`,
      serviceId: "fencing",
      serviceLabel: `${style.label} Fence`,
      itemName: `${style.label} · ${tierName}`,
      specsSummary: `Finish height of ${height}; ${finish.label}, ${placementLabel}${hasGate ? ", Matching walk & driveway gates" : ", Continuous perimeter"}`,
      tierName,
      availableTiers: tiers,
      quantity: FENCE_DEFAULT_LENGTH_FT[placement],
      minQuantity: 10,
      maxQuantity: 2000,
      unit: "ft",
      unitRate: computeFenceUnitRate(style.id, height, tierName, hasGate),
      accentColor: finish.color,
      snapshotUrl,
      sourceAnswers: { ...answers },
    });
  }

  return out;
}

export function updateConfigurationQuantity(
  configs: readonly SavedConfiguration[],
  id: string,
  nextQty: number,
): SavedConfiguration[] {
  return configs.map((cfg) => {
    if (cfg.id !== id) return cfg;
    const clamped = Number.isFinite(nextQty)
      ? Math.max(cfg.minQuantity, Math.min(cfg.maxQuantity, Math.round(nextQty)))
      : cfg.quantity;
    return { ...cfg, quantity: clamped };
  });
}

export function updateConfigurationTier(
  configs: readonly SavedConfiguration[],
  id: string,
  nextTier: string,
): SavedConfiguration[] {
  return configs.map((cfg) => {
    if (cfg.id !== id) return cfg;
    if (cfg.serviceId === "roofing") {
      const slope: Slope = cfg.sourceAnswers.slope ?? "moderate";
      const material: Material = cfg.sourceAnswers.desiredType ?? (isFlatSlope(slope) ? "tpo" : "asphalt");
      const def = getRoofMaterialDef(material);
      const solar = cfg.sourceAnswers.solar === "yes";
      return {
        ...cfg,
        tierName: nextTier,
        itemName: `${def.label} Roof · ${nextTier}`,
        unitRate: computeRoofUnitRate(material, slope, nextTier, solar),
      };
    }
    const style = getFenceStyle(cfg.sourceAnswers.fenceStyle);
    const height: FenceHeight = cfg.sourceAnswers.fenceHeight ?? style.defaultHeight;
    const hasGate = (cfg.sourceAnswers.fenceGate ?? "yes") === "yes";
    return {
      ...cfg,
      tierName: nextTier,
      itemName: `${style.label} · ${nextTier}`,
      unitRate: computeFenceUnitRate(style.id, height, nextTier, hasGate),
    };
  });
}

export function removeConfiguration(configs: readonly SavedConfiguration[], id: string): SavedConfiguration[] {
  return configs.filter((c) => c.id !== id);
}

export function inferDefaultServiceLabel(configs: readonly SavedConfiguration[]): string {
  const hasRoof = configs.some((c) => c.serviceId === "roofing");
  const hasFence = configs.some((c) => c.serviceId === "fencing");
  if (hasRoof && hasFence) return "Roofing + Custom Fencing";
  if (hasFence) return configs.find((c) => c.serviceId === "fencing")?.serviceLabel ?? "Custom Fencing";
  if (hasRoof) return configs.find((c) => c.serviceId === "roofing")?.serviceLabel ?? "Roofing Replacement";
  return "Roofing Replacement";
}
