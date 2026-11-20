import { describe, expect, it } from "vitest";
import { FENCE_CATALOG, getFenceFinish, getFenceStyle } from "../catalogs/fencing";
import { ROOF_MATERIAL_CATALOG, getRoofMaterialDef, isFlatMaterial } from "../catalogs/roofing";
import { SERVICE_REGISTRY, getServicePlugin } from "../domain/registry";
import {
  FenceStyleDefSchema,
  RoofMaterialDefSchema,
  ServiceIdSchema,
  validateCatalogIntegrity,
} from "../domain/schemas";

describe("catalog & service registry integrity", () => {
  it("validates ROOF_MATERIAL_CATALOG against RoofMaterialDefSchema with no duplicates", () => {
    const result = validateCatalogIntegrity(ROOF_MATERIAL_CATALOG, RoofMaterialDefSchema, "ROOF_MATERIAL_CATALOG");
    expect(result).toEqual({ valid: true });
  });

  it("ensures every new-installation roof material defines at least 3 packages with one recommended tier", () => {
    const offered = ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew);
    expect(offered.length).toBeGreaterThanOrEqual(4);
    for (const mat of offered) {
      expect(mat.packages.length, `${mat.id} should have >= 3 packages`).toBeGreaterThanOrEqual(3);
      expect(
        mat.packages.filter((p) => p.recommended).length,
        `${mat.id} should have exactly 1 recommended tier`,
      ).toBe(1);
    }
  });

  it("classifies flat vs pitched roof materials consistently", () => {
    expect(isFlatMaterial("tpo")).toBe(true);
    expect(isFlatMaterial("epdm")).toBe(true);
    expect(isFlatMaterial("modbit")).toBe(true);
    expect(isFlatMaterial("asphalt")).toBe(false);
    expect(isFlatMaterial("metal")).toBe(false);
    expect(getRoofMaterialDef("metal").pbr.metalness).toBeGreaterThan(0.5);
  });

  it("validates FENCE_CATALOG against FenceStyleDefSchema with no duplicates", () => {
    const result = validateCatalogIntegrity(FENCE_CATALOG, FenceStyleDefSchema, "FENCE_CATALOG");
    expect(result).toEqual({ valid: true });
    expect(FENCE_CATALOG.length).toBeGreaterThanOrEqual(6);
  });

  it("ensures every fence style has unique finish IDs and a recommended package tier", () => {
    for (const style of FENCE_CATALOG) {
      const finishIds = style.finishes.map((f) => f.id);
      expect(new Set(finishIds).size, `${style.id} finish IDs must be unique`).toBe(finishIds.length);
      expect(style.packages.length, `${style.id} should have >= 3 packages`).toBeGreaterThanOrEqual(3);
      expect(style.packages.some((p) => p.recommended), `${style.id} should have a recommended package`).toBe(true);
    }
  });

  it("resolves fallback fence style and finish safely for unknown IDs", () => {
    expect(getFenceStyle("unknown-style-id").id).toBe(FENCE_CATALOG[0].id);
    const woodFinish = getFenceFinish("wood-privacy", "unknown-finish-id");
    expect(woodFinish.id).toBe("natural-cedar");
  });

  it("registers a valid ServicePlugin for every ServiceId enum value", () => {
    const expectedIds = ServiceIdSchema.options;
    expect(SERVICE_REGISTRY.length).toBe(expectedIds.length);

    const seen = new Set<string>();
    for (const plugin of SERVICE_REGISTRY) {
      expect(seen.has(plugin.id)).toBe(false);
      seen.add(plugin.id);
      expect(getServicePlugin(plugin.id)).toBe(plugin);
      expect(plugin.label.length).toBeGreaterThan(0);
      expect(plugin.stepIds.length).toBeGreaterThan(0);

      for (const stepId of plugin.stepIds) {
        const step = plugin.steps[stepId];
        expect(step, `${plugin.id} missing step definition for "${stepId}"`).toBeDefined();
        expect(step?.id).toBe(stepId);
        expect(step?.options({}).length).toBeGreaterThan(0);
      }
    }
  });
});
