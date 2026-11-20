import type { SceneConfig } from "@/lib/three/house";
import { isFlat, materialLabels, type Answers, type Material } from "./questions";

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
): { config: SceneConfig; badges: string[] } {
  const slope = answers.slope ?? "moderate";
  const stories = answers.stories ?? "single";
  const buildingType = answers.buildingType ?? "residential";
  const flat = isFlat(slope);

  const fallbackMat: Material = flat ? "tpo" : "asphalt";
  const currentMat: Material = answers.currentMaterial ?? fallbackMat;
  const newMat: Material = answers.desiredType ?? fallbackMat;

  const isNew = mode === "new";
  const material = isNew ? newMat : currentMat;
  const weathering = isNew
    ? 0
    : answers.roofAge === "10+"
      ? 0.8
      : answers.roofAge === "unsure"
        ? 0.35
        : 0;
  const damaged = !isNew && answers.damage === "yes";
  const solar = isNew && answers.solar === "yes";

  const badges = [
    isNew ? "New roof preview" : "Current roof",
    buildingType === "residential" ? "Residential" : "Commercial",
    stories === "single" ? "1 story" : buildingType === "commercial" ? "Multi-story (3F)" : "Multi-story",
    slopeBadge[slope],
    materialLabels[material],
  ];
  if (damaged) badges.push("Damage noted");
  if (solar) badges.push("+ Solar panels");

  return {
    config: { slope, stories, buildingType, material, weathering, damaged, solar },
    badges,
  };
}
