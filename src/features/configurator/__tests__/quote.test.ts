import { describe, expect, it } from "vitest";
import { createCustomPropertyAddress, lookupAddressesByZip } from "../domain/addressLookup";
import {
  buildConfigurationsFromSession,
  calculateLineTotal,
  calculateQuoteTotal,
  inferDefaultServiceLabel,
  removeConfiguration,
  updateConfigurationQuantity,
  updateConfigurationTier,
} from "../domain/quote";
import { MAX_ATTACHMENT_BYTES } from "../domain/schemas";
import { validateCustomQuoteInquiry } from "../domain/validation";

describe("ZIP code to address lookup", () => {
  it("returns curated Richardson TX addresses for ZIP 75081", async () => {
    const res = await lookupAddressesByZip("75081", { allowNetwork: false });
    expect(res.city).toBe("Richardson");
    expect(res.state).toBe("TX");
    expect(res.source).toBe("directory");
    expect(res.addresses.length).toBeGreaterThanOrEqual(4);
    expect(res.addresses[0]?.fullAddress).toContain("75081");
    expect(res.addresses[0]?.street).toContain("Towne House Ln");
  });

  it("synthesizes valid regional addresses offline for any valid 5-digit ZIP", async () => {
    const res = await lookupAddressesByZip("94107", { allowNetwork: false });
    expect(res.zip).toBe("94107");
    expect(res.source).toBe("regional-fallback");
    expect(res.addresses.length).toBeGreaterThanOrEqual(4);
    for (const addr of res.addresses) {
      expect(addr.zip).toBe("94107");
      expect(addr.fullAddress).toContain("94107");
    }
  });

  it("rejects malformed ZIP codes", async () => {
    await expect(lookupAddressesByZip("7508", { allowNetwork: false })).rejects.toThrow();
    await expect(lookupAddressesByZip("abcde", { allowNetwork: false })).rejects.toThrow();
  });

  it("creates a validated custom street address inside a resolved ZIP", async () => {
    const res = await lookupAddressesByZip("75081", { allowNetwork: false });
    const custom = createCustomPropertyAddress("900010 Towne House Ln", res);
    expect(custom.street).toBe("900010 Towne House Ln");
    expect(custom.fullAddress).toBe("900010 Towne House Ln, Richardson, TX 75081, USA");
  });
});

describe("saved configurations & live pricing engine", () => {
  it("builds separate line items for roofing and fencing with live total calculation", () => {
    const configs = buildConfigurationsFromSession(
      ["roofing", "fencing"],
      {
        buildingType: "residential",
        stories: "multiple",
        slope: "steep",
        desiredType: "metal",
        solar: "yes",
        fenceStyle: "wood-privacy",
        fenceFinish: "natural-cedar",
        fenceHeight: "6ft",
        fencePlacement: "backyard",
        fenceGate: "yes",
      },
      "data:image/jpeg;base64,abc",
      "test",
    );

    expect(configs).toHaveLength(2);
    expect(configs[0]?.serviceId).toBe("roofing");
    expect(configs[0]?.unit).toBe("sq ft");
    expect(configs[0]?.snapshotUrl).toBe("data:image/jpeg;base64,abc");
    expect(configs[1]?.serviceId).toBe("fencing");
    expect(configs[1]?.unit).toBe("ft");
    expect(inferDefaultServiceLabel(configs)).toBe("Roofing + Custom Fencing");

    const total = calculateQuoteTotal(configs);
    expect(total).toBe(calculateLineTotal(configs[0]!) + calculateLineTotal(configs[1]!));
    expect(total).toBeGreaterThan(10000);
  });

  it("updates quantity (clamped), switches tier pricing, and removes configurations cleanly", () => {
    const initial = buildConfigurationsFromSession(["fencing"], {
      fenceStyle: "picket",
      fenceFinish: "crisp-white",
      fenceHeight: "4ft",
      fencePlacement: "front-yard",
      fenceGate: "no",
    });
    const id = initial[0]!.id;

    // Update quantity to 10 ft (just like the user's screenshot!)
    const resized = updateConfigurationQuantity(initial, id, 10);
    expect(resized[0]?.quantity).toBe(10);

    // Clamp below minimum
    const tooSmall = updateConfigurationQuantity(initial, id, 1);
    expect(tooSmall[0]?.quantity).toBe(initial[0]!.minQuantity);

    // Upgrade tier from Signature -> Premium increases unitRate
    const baseRate = resized[0]!.unitRate;
    const upgraded = updateConfigurationTier(resized, id, "Premium");
    expect(upgraded[0]?.tierName).toBe("Premium");
    expect(upgraded[0]?.unitRate).toBeGreaterThan(baseRate);

    // Remove item
    const emptied = removeConfiguration(upgraded, id);
    expect(emptied).toHaveLength(0);
    expect(calculateQuoteTotal(emptied)).toBe(0);
  });
});

describe("custom quote form Zod validation", () => {
  const validPayload = {
    service: "Wood Privacy Fence",
    name: "Taylor Brooks",
    address: "1010 Towne House Ln, Richardson, TX 75081, USA",
    phone: "(555) 234-5678",
    email: "taylor@example.com",
    notes: "Backyard side gate opens to alley.",
    acceptedTerms: true as const,
    marketingOptIn: true,
    attachments: [{ name: "yard-photo.jpg", size: 240_000, type: "image/jpeg" }],
  };

  it("accepts a complete valid custom quote submission", () => {
    const res = validateCustomQuoteInquiry(validPayload);
    expect(res.success).toBe(true);
  });

  it("requires accepting Terms of Use and reports friendly errors for empty/null fields", () => {
    const res = validateCustomQuoteInquiry({
      service: null,
      name: "",
      address: "",
      phone: "123",
      email: "bad",
      notes: "",
      acceptedTerms: false,
      marketingOptIn: false,
      attachments: [],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.fieldErrors.service).toBe("Please select a service.");
      expect(res.fieldErrors.name).toBe("Please enter your full name.");
      expect(res.fieldErrors.address).toContain("address");
      expect(res.fieldErrors.phone).toBeDefined();
      expect(res.fieldErrors.email).toBeDefined();
      expect(res.fieldErrors.acceptedTerms).toContain("Terms of Use");
    }
  });

  it("rejects oversized file attachments", () => {
    const res = validateCustomQuoteInquiry({
      ...validPayload,
      attachments: [{ name: "huge.pdf", size: MAX_ATTACHMENT_BYTES + 1, type: "application/pdf" }],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.fieldErrors.attachments).toContain("10 MB");
    }
  });
});
