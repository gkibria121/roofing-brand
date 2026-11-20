import { getFenceFinish, getFenceStyle } from "../catalogs/fencing";
import { PROPERTY_STEPS } from "../catalogs/property";
import { isFlatSlope } from "../catalogs/roofing";
import type { SceneConfig } from "../three/types";
import { getCrossServiceCallouts, getServicePlugin, SERVICE_REGISTRY } from "./registry";
import type { Answers, Material, PreviewMode, ServiceId, StepId } from "./schemas";
import type { Callout, ServicePackageGroup, StepDef } from "./types";

/**
 * Build the deduplicated, ordered list of guided steps for the selected services.
 * If no selected service includes the shared property shape steps (`buildingType`, `stories`),
 * they are prepended automatically so the 3D building matches the user's lot.
 */
export function getStepsForServices(services: readonly ServiceId[]): StepDef[] {
  const seen = new Set<StepId>();
  const ordered: StepDef[] = [];

  const pushStep = (step: StepDef | undefined) => {
    if (!step || seen.has(step.id)) return;
    seen.add(step.id);
    ordered.push(step);
  };

  const hasSharedPropertySteps = services.some((sid) => {
    const p = getServicePlugin(sid);
    return p.stepIds.includes("buildingType") && p.stepIds.includes("stories");
  });

  if (!hasSharedPropertySteps && services.length > 0) {
    pushStep(PROPERTY_STEPS.buildingType);
    pushStep(PROPERTY_STEPS.stories);
  }

  for (const sid of services) {
    const plugin = getServicePlugin(sid);
    for (const stepId of plugin.stepIds) {
      pushStep(plugin.steps[stepId]);
    }
  }
  return ordered;
}

/** Apply an answer and run every registered service plugin's sanitizer to keep dependent answers valid. */
export function applyAnswer<K extends StepId>(
  prev: Partial<Answers>,
  id: K,
  value: Answers[K],
): Partial<Answers> {
  let next: Partial<Answers> = { ...prev, [id]: value };
  for (const plugin of SERVICE_REGISTRY) {
    next = plugin.sanitize(next);
  }
  return next;
}

/** Toggle a service on/off while guaranteeing at least one service remains selected and seeding defaults. */
export function toggleServiceSelection(
  currentServices: readonly ServiceId[],
  currentAnswers: Partial<Answers>,
  id: ServiceId,
): { services: ServiceId[]; answers: Partial<Answers>; blocked: boolean } {
  const exists = currentServices.includes(id);
  if (exists && currentServices.length === 1) {
    return { services: [...currentServices], answers: currentAnswers, blocked: true };
  }
  const nextServices: ServiceId[] = exists
    ? currentServices.filter((s) => s !== id)
    : [...currentServices, id];
  const nextAnswers = exists ? currentAnswers : getServicePlugin(id).seedDefaults(currentAnswers);
  return { services: nextServices, answers: nextAnswers, blocked: false };
}

export function isAnswered(step: StepDef, answers: Partial<Answers>): boolean {
  return answers[step.id] !== undefined;
}

export function labelFor(step: StepDef, answers: Partial<Answers>): string {
  const v = answers[step.id];
  if (v === undefined) return "—";
  return step.options(answers).find((o) => o.value === v)?.label ?? String(v);
}

export function getServicePackageGroups(
  services: readonly ServiceId[],
  answers: Partial<Answers>,
): ServicePackageGroup[] {
  return services.map((sid) => getServicePlugin(sid).getPackageGroup(answers));
}

export function getAllCallouts(services: readonly ServiceId[], answers: Partial<Answers>): Callout[] {
  const out: Callout[] = [];
  for (const sid of services) {
    out.push(...getServicePlugin(sid).getCallouts(answers));
  }
  out.push(...getCrossServiceCallouts(services));
  return out;
}

export function deriveScene(
  answers: Partial<Answers>,
  mode: PreviewMode,
  services: readonly ServiceId[] = ["roofing"],
): {
  config: SceneConfig;
  badges: string[];
  specSummary: { label: string; value: string }[];
} {
  const hasRoof = services.includes("roofing");
  const hasFence = services.includes("fencing");

  const slope = answers.slope ?? "moderate";
  const stories = answers.stories ?? "single";
  const buildingType = answers.buildingType ?? "residential";
  const flat = isFlatSlope(slope);

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

  const badges: string[] = [
    hasRoof ? (isNew ? "New roof preview" : "Current roof") : "Fence preview",
    buildingType === "residential" ? "Residential" : "Commercial",
    stories === "single" ? "1 story" : buildingType === "commercial" ? "Multi-story (3F)" : "Multi-story",
  ];
  for (const sid of services) {
    badges.push(...getServicePlugin(sid).getBadges(answers, isNew ? "new" : "current"));
  }

  const buildingSpec = {
    label: "Building",
    value: `${stories === "single" ? "1-story" : "Multi-story"} ${buildingType}`,
  };
  const roofSpec = hasRoof
    ? getServicePlugin("roofing").getSpecSummary(answers, isNew ? "new" : "current")
    : { label: "Roof", value: `${slope} · ${material.toUpperCase()}` };
  const fenceSpec = hasFence
    ? getServicePlugin("fencing").getSpecSummary(answers, mode)
    : { label: "Fence", value: "Not added" };

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
    specSummary: [buildingSpec, roofSpec, fenceSpec],
  };
}
