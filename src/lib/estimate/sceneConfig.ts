import type { SceneConfig } from "@/lib/three/house";
import { getFenceFinish, getFenceStyle } from "./fences";
import { isFlat, materialLabels, type Answers, type Material, type ServiceId } from "./questions";

export type PreviewMode = "current" | "new";

const slopeBadge = {
  flat: "Flat roof",
  low: "Low slope",
  moderate: "Moderate slope",
  steep: "Steep slope",
} as const;

export function deriveScene(
  answers: Partial<Answers>,
  mode: PreviewMode,
  services: ServiceId[] = ["roofing"],
): { config: SceneConfig; badges: string[] } {
  const hasRoof = services.includes("roofing");
  const hasFence = services.includes("fencing");

  const slope = answers.slope ?? "moderate";
  const stories = answers.stories ?? "single";
  const buildingType = answers.buildingType ?? "residential";
  const flat = isFlat(slope);

  const fallbackMat: Material = flat ? "tpo" : "asphalt";
  const currentMat: Material = answers.currentMaterial ?? fallbackMat;
  const newMat: Material = answers.desiredType ?? fallbackMat;

  const isNew = !hasRoof || mode === "new";
  const material = isNew ? newMat : currentMat;
  const weathering = isNew
    ? 0
    : answers.roofAge === "10+"
      ? 0.8
      : answers.roofAge === "unsure"
        ? 0.35
        : 0;
  const damaged = hasRoof && !isNew && answers.damage === "yes";
  const solar = hasRoof && isNew && answers.solar === "yes";

  const fenceStyle = getFenceStyle(answers.fenceStyle);
  const fenceFinish = getFenceFinish(fenceStyle.id, answers.fenceFinish);
  const fenceHeight = answers.fenceHeight ?? fenceStyle.defaultHeight;
  const fencePlacement = answers.fencePlacement ?? "backyard";
  const fenceGate = (answers.fenceGate ?? "yes") === "yes";

  const badges: string[] = [];
  if (hasRoof) {
    badges.push(isNew ? "New roof preview" : "Current roof");
  } else {
    badges.push("Fence preview");
  }
  badges.push(buildingType === "residential" ? "Residential" : "Commercial");
  badges.push(stories === "single" ? "1 story" : buildingType === "commercial" ? "Multi-story (3F)" : "Multi-story");
  if (hasRoof) {
    badges.push(slopeBadge[slope], materialLabels[material]);
    if (damaged) badges.push("Damage noted");
    if (solar) badges.push("+ Solar panels");
  }
  if (hasFence) {
    badges.push(`${fenceHeight} ${fenceStyle.label} (${fenceFinish.label})`);
  }

  return {
    config: {
      slope,
      stories,
      buildingType,
      material,
      weathering,
      damaged,
      solar,
      fence: hasFence
        ? {
            enabled: true,
            styleId: fenceStyle.id,
            finishId: fenceFinish.id,
            height: fenceHeight,
            placement: fencePlacement,
            gate: fenceGate,
          }
        : undefined,
    },
    badges,
  };
}
