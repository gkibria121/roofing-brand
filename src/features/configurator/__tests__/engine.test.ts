import { describe, expect, it } from "vitest";
import {
  applyAnswer,
  deriveScene,
  getAllCallouts,
  getServicePackageGroups,
  getStepsForServices,
  isAnswered,
  labelFor,
  toggleServiceSelection,
} from "../domain/engine";
import type { Answers } from "../domain/schemas";

describe("getStepsForServices", () => {
  it("returns 8 steps for roofing only", () => {
    const steps = getStepsForServices(["roofing"]);
    expect(steps.map((s) => s.id)).toEqual([
      "slope",
      "stories",
      "buildingType",
      "currentMaterial",
      "roofAge",
      "damage",
      "desiredType",
      "solar",
    ]);
  });

  it("prepends shared property steps for fencing only (7 steps total)", () => {
    const steps = getStepsForServices(["fencing"]);
    expect(steps.map((s) => s.id)).toEqual([
      "buildingType",
      "stories",
      "fenceStyle",
      "fenceFinish",
      "fenceHeight",
      "fencePlacement",
      "fenceGate",
    ]);
  });

  it("deduplicates shared steps when both roofing and fencing are selected (13 steps)", () => {
    const steps = getStepsForServices(["roofing", "fencing"]);
    expect(steps.length).toBe(13);
    expect(new Set(steps.map((s) => s.id)).size).toBe(13);
    expect(steps.filter((s) => s.id === "buildingType").length).toBe(1);
    expect(steps.filter((s) => s.id === "stories").length).toBe(1);
  });
});

describe("applyAnswer & toggleServiceSelection", () => {
  it("clears incompatible pitched roof materials when slope changes to flat", () => {
    const pitched: Partial<Answers> = {
      slope: "moderate",
      currentMaterial: "asphalt",
      desiredType: "metal",
    };
    const next = applyAnswer(pitched, "slope", "flat");
    expect(next.slope).toBe("flat");
    expect(next.currentMaterial).toBeUndefined();
    expect(next.desiredType).toBeUndefined();
  });

  it("clears incompatible flat roof materials when slope changes to steep", () => {
    const flat: Partial<Answers> = {
      slope: "flat",
      currentMaterial: "tpo",
      desiredType: "epdm",
    };
    const next = applyAnswer(flat, "slope", "steep");
    expect(next.slope).toBe("steep");
    expect(next.currentMaterial).toBeUndefined();
    expect(next.desiredType).toBeUndefined();
  });

  it("keeps compatible materials when switching between pitched slopes", () => {
    const low: Partial<Answers> = { slope: "low", currentMaterial: "asphalt", desiredType: "metal" };
    const next = applyAnswer(low, "slope", "steep");
    expect(next.currentMaterial).toBe("asphalt");
    expect(next.desiredType).toBe("metal");
  });

  it("resets fenceFinish to the new style's default when fenceStyle changes", () => {
    const initial: Partial<Answers> = {
      fenceStyle: "wood-privacy",
      fenceFinish: "natural-cedar",
    };
    const next = applyAnswer(initial, "fenceStyle", "ornamental-iron");
    expect(next.fenceStyle).toBe("ornamental-iron");
    expect(next.fenceFinish).toBe("satin-black");
  });

  it("prevents deselecting the last remaining active service", () => {
    const res = toggleServiceSelection(["roofing"], {}, "roofing");
    expect(res.blocked).toBe(true);
    expect(res.services).toEqual(["roofing"]);
  });

  it("seeds fence defaults when enabling fencing alongside roofing", () => {
    const res = toggleServiceSelection(["roofing"], { slope: "moderate" }, "fencing");
    expect(res.blocked).toBe(false);
    expect(res.services).toEqual(["roofing", "fencing"]);
    expect(res.answers.fenceStyle).toBe("wood-privacy");
    expect(res.answers.fenceFinish).toBe("natural-cedar");
    expect(res.answers.fenceHeight).toBe("6ft");
    expect(res.answers.fencePlacement).toBe("backyard");
    expect(res.answers.fenceGate).toBe("yes");
  });
});

describe("deriveScene, packages & callouts", () => {
  it("derives weathering and damage only in current roof mode, and solar only in new roof mode", () => {
    const answers: Partial<Answers> = {
      buildingType: "residential",
      stories: "multiple",
      slope: "steep",
      currentMaterial: "asphalt",
      roofAge: "10+",
      damage: "yes",
      desiredType: "metal",
      solar: "yes",
    };

    const current = deriveScene(answers, "current", ["roofing"]);
    expect(current.config.material).toBe("asphalt");
    expect(current.config.weathering).toBe(0.8);
    expect(current.config.damaged).toBe(true);
    expect(current.config.solar).toBe(false);
    expect(current.config.fence).toBeUndefined();

    const upgraded = deriveScene(answers, "new", ["roofing"]);
    expect(upgraded.config.material).toBe("metal");
    expect(upgraded.config.weathering).toBe(0);
    expect(upgraded.config.damaged).toBe(false);
    expect(upgraded.config.solar).toBe(true);
    expect(upgraded.badges).toContain("+ Solar panels");
  });

  it("includes fence config, 3-column specSummary, packages, and cross-service callout when both active", () => {
    const answers: Partial<Answers> = {
      buildingType: "residential",
      stories: "single",
      slope: "moderate",
      desiredType: "metal",
      damage: "yes",
      solar: "yes",
      fenceStyle: "horizontal-slat",
      fenceFinish: "dark-walnut",
      fenceHeight: "6ft",
      fencePlacement: "full-perimeter",
      fenceGate: "yes",
    };

    const scene = deriveScene(answers, "new", ["roofing", "fencing"]);
    expect(scene.config.fence).toEqual({
      enabled: true,
      styleId: "horizontal-slat",
      finishId: "dark-walnut",
      height: "6ft",
      placement: "full-perimeter",
      gate: true,
    });
    expect(scene.specSummary).toHaveLength(3);
    expect(scene.specSummary[2]?.value).toContain("Horizontal Modern Slat");

    const groups = getServicePackageGroups(["roofing", "fencing"], answers);
    expect(groups.map((g) => g.serviceId)).toEqual(["roofing", "fencing"]);
    expect(groups[0]?.tiers.length).toBeGreaterThanOrEqual(3);
    expect(groups[1]?.tiers.length).toBeGreaterThanOrEqual(3);

    const callouts = getAllCallouts(["roofing", "fencing"], answers);
    expect(callouts.some((c) => c.title.includes("Multi-service bundle"))).toBe(true);
    expect(callouts.some((c) => c.title.includes("Priority leak"))).toBe(true);
    expect(callouts.some((c) => c.title.includes("Solar-ready"))).toBe(true);
    expect(callouts.some((c) => c.title.includes("Custom-fitted gates"))).toBe(true);
  });

  it("formats answered step labels and unanswered fallbacks cleanly", () => {
    const steps = getStepsForServices(["roofing"]);
    const slopeStep = steps[0]!;
    expect(isAnswered(slopeStep, {})).toBe(false);
    expect(labelFor(slopeStep, {})).toBe("—");
    expect(isAnswered(slopeStep, { slope: "steep" })).toBe(true);
    expect(labelFor(slopeStep, { slope: "steep" })).toBe("Steep");
  });
});
