import { describe, expect, it } from "vitest";
import {
  FenceStyleDefSchema,
  RoofMaterialDefSchema,
  validateCatalogIntegrity,
  type FenceStyleDef,
} from "../domain/schemas";
import {
  parseConfiguratorState,
  serializeConfiguratorState,
  validateContactInquiry,
  validateQuickEstimateInquiry,
} from "../domain/validation";

describe("validateCatalogIntegrity", () => {
  const validFence: FenceStyleDef = {
    id: "test-fence",
    label: "Test Fence",
    shortDescription: "Solid cedar test fence",
    geometry: "wood-privacy",
    defaultFinishId: "cedar",
    defaultHeight: "6ft",
    finishes: [{ id: "cedar", label: "Cedar", color: "#9c6b43" }],
    packages: [
      {
        name: "Essential",
        tagline: "Solid starter option",
        features: ["Concrete-set posts"],
      },
    ],
  };

  it("passes for valid, uniquely identified catalog entries", () => {
    const result = validateCatalogIntegrity([validFence], FenceStyleDefSchema, "TEST_FENCES");
    expect(result).toEqual({ valid: true });
  });

  it("catches duplicate IDs", () => {
    const result = validateCatalogIntegrity([validFence, { ...validFence }], FenceStyleDefSchema, "TEST_FENCES");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('duplicate id "test-fence"'))).toBe(true);
    }
  });

  it("catches invalid hex colors", () => {
    const badColor: FenceStyleDef = {
      ...validFence,
      finishes: [{ id: "cedar", label: "Cedar", color: "brown" }],
    };
    const result = validateCatalogIntegrity([badColor], FenceStyleDefSchema, "TEST_FENCES");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("6-digit hex"))).toBe(true);
    }
  });

  it("catches defaultFinishId not matching any finish", () => {
    const badDefault: FenceStyleDef = {
      ...validFence,
      defaultFinishId: "missing-finish",
    };
    const result = validateCatalogIntegrity([badDefault], FenceStyleDefSchema, "TEST_FENCES");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("defaultFinishId"))).toBe(true);
    }
  });

  it("catches out-of-range PBR values on roof materials", () => {
    const badRoof = {
      id: "asphalt" as const,
      label: "Asphalt",
      description: "Test",
      supportsFlat: false,
      supportsPitched: true,
      offeredAsNew: true,
      baseColor: "#3b4047",
      pbr: { tile: 2, roughness: 1.5, metalness: 0.1, bump: 0.05 },
      packages: [],
    };
    const result = validateCatalogIntegrity([badRoof], RoofMaterialDefSchema, "TEST_ROOF");
    expect(result.valid).toBe(false);
  });
});

describe("inquiry form validation", () => {
  it("accepts a valid quick estimate inquiry and trims whitespace", () => {
    const res = validateQuickEstimateInquiry({
      name: "  Alex Rivera  ",
      phone: " (555) 234-5678 ",
      email: "  alex@example.com ",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({
        name: "Alex Rivera",
        phone: "(555) 234-5678",
        email: "alex@example.com",
      });
    }
  });

  it("returns field-level errors for invalid quick estimate fields", () => {
    const res = validateQuickEstimateInquiry({
      name: "A",
      phone: "123",
      email: "not-an-email",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.fieldErrors.name).toBeDefined();
      expect(res.fieldErrors.phone).toBeDefined();
      expect(res.fieldErrors.email).toBeDefined();
    }
  });

  it("rejects phone strings with too few numeric digits", () => {
    const res = validateQuickEstimateInquiry({
      name: "Jordan Lee",
      phone: "-------",
      email: "jordan@example.com",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.fieldErrors.phone).toContain("7 digits");
    }
  });

  it("validates full contact inquiries including service and message", () => {
    const valid = validateContactInquiry({
      name: "Samira Patel",
      phone: "555-867-5309",
      email: "samira@example.com",
      service: "Custom Fencing",
      message: "Looking for 180 linear feet of horizontal cedar fencing.",
    });
    expect(valid.success).toBe(true);

    const invalid = validateContactInquiry({
      name: "Samira Patel",
      phone: "555-867-5309",
      email: "samira@example.com",
      service: "",
      message: "Too short",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.fieldErrors.service).toBeDefined();
      expect(invalid.fieldErrors.message).toBeDefined();
    }
  });
});

describe("URL configurator state serialization & parsing", () => {
  it("returns null for an empty query string", () => {
    expect(parseConfiguratorState("")).toBeNull();
    expect(parseConfiguratorState(new URLSearchParams())).toBeNull();
  });

  it("roundtrips a full multi-service configurator state cleanly", () => {
    const original = {
      services: ["roofing", "fencing"] as const,
      mode: "decorate" as const,
      previewMode: "new" as const,
      answers: {
        buildingType: "residential" as const,
        stories: "multiple" as const,
        slope: "steep" as const,
        desiredType: "metal" as const,
        solar: "yes" as const,
        fenceStyle: "horizontal-slat",
        fenceFinish: "dark-walnut",
        fenceHeight: "6ft" as const,
        fencePlacement: "full-perimeter" as const,
        fenceGate: "yes" as const,
      },
    };
    const qs = serializeConfiguratorState({
      ...original,
      services: [...original.services],
    });
    const parsed = parseConfiguratorState(qs);
    expect(parsed).not.toBeNull();
    expect(parsed?.services).toEqual(["roofing", "fencing"]);
    expect(parsed?.mode).toBe("decorate");
    expect(parsed?.previewMode).toBe("new");
    expect(parsed?.answers.slope).toBe("steep");
    expect(parsed?.answers.desiredType).toBe("metal");
    expect(parsed?.answers.solar).toBe("yes");
    expect(parsed?.answers.fenceStyle).toBe("horizontal-slat");
    expect(parsed?.answers.fenceFinish).toBe("dark-walnut");
    expect(parsed?.answers.fencePlacement).toBe("full-perimeter");
  });

  it("ignores unknown/corrupt parameters and sanitizes incompatible roof materials", () => {
    const parsed = parseConfiguratorState(
      "services=roofing,hacked&mode=evil&view=invalid&slope=flat&desiredType=metal&currentMaterial=asphalt&stories=single&junk=123",
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.services).toEqual(["roofing"]);
    expect(parsed?.mode).toBe("guided");
    expect(parsed?.previewMode).toBe("current");
    expect(parsed?.answers.slope).toBe("flat");
    expect(parsed?.answers.stories).toBe("single");
    // Pitched materials (`metal`, `asphalt`) must be stripped when slope is `flat`
    expect(parsed?.answers.desiredType).toBeUndefined();
    expect(parsed?.answers.currentMaterial).toBeUndefined();
  });

  it("falls back to default fence finish when an invalid finish is supplied in the URL", () => {
    const parsed = parseConfiguratorState("services=fencing&fenceStyle=picket&fenceFinish=nonexistent-color");
    expect(parsed).not.toBeNull();
    expect(parsed?.services).toEqual(["fencing"]);
    expect(parsed?.answers.fenceStyle).toBe("picket");
    expect(parsed?.answers.fenceFinish).toBe("crisp-white");
    // Defaults seeded for unspecified fencing parameters
    expect(parsed?.answers.fencePlacement).toBe("backyard");
    expect(parsed?.answers.fenceGate).toBe("yes");
  });
});
