import { z } from "zod";

/**
 * Single source of truth for configurator & inquiry runtime validation schemas
 * and inferred TypeScript types.
 */

export const ServiceIdSchema = z.enum(["roofing", "fencing"]);
export type ServiceId = z.infer<typeof ServiceIdSchema>;

export const SlopeSchema = z.enum(["flat", "low", "moderate", "steep"]);
export type Slope = z.infer<typeof SlopeSchema>;

export const StoriesSchema = z.enum(["single", "multiple"]);
export type Stories = z.infer<typeof StoriesSchema>;

export const BuildingTypeSchema = z.enum(["residential", "commercial"]);
export type BuildingType = z.infer<typeof BuildingTypeSchema>;

export const FlatMaterialSchema = z.enum(["tpo", "epdm", "modbit"]);
export type FlatMaterial = z.infer<typeof FlatMaterialSchema>;

export const PitchedMaterialSchema = z.enum(["asphalt", "metal", "tile", "cedar"]);
export type PitchedMaterial = z.infer<typeof PitchedMaterialSchema>;

export const RoofMaterialSchema = z.enum(["tpo", "epdm", "modbit", "asphalt", "metal", "tile", "cedar"]);
export type Material = z.infer<typeof RoofMaterialSchema>;

export const RoofAgeSchema = z.enum(["0-10", "10+", "unsure"]);
export type RoofAge = z.infer<typeof RoofAgeSchema>;

export const YesNoSchema = z.enum(["yes", "no"]);
export type YesNo = z.infer<typeof YesNoSchema>;

export const PreviewModeSchema = z.enum(["current", "new"]);
export type PreviewMode = z.infer<typeof PreviewModeSchema>;

export const FenceGeometryKindSchema = z.enum([
  "wood-privacy",
  "vinyl-privacy",
  "ornamental-iron",
  "picket",
  "horizontal-slat",
  "chain-link",
]);
export type FenceGeometryKind = z.infer<typeof FenceGeometryKindSchema>;

export const FenceHeightSchema = z.enum(["4ft", "6ft", "8ft"]);
export type FenceHeight = z.infer<typeof FenceHeightSchema>;

export const FencePlacementSchema = z.enum(["backyard", "full-perimeter", "front-yard"]);
export type FencePlacement = z.infer<typeof FencePlacementSchema>;

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex value like #0f2a4a");

export const PackageTierSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  recommended: z.boolean().optional(),
});
export type PackageTier = z.infer<typeof PackageTierSchema>;

export const RoofMaterialDefSchema = z.object({
  id: RoofMaterialSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  supportsFlat: z.boolean(),
  supportsPitched: z.boolean(),
  offeredAsNew: z.boolean(),
  baseColor: HexColorSchema,
  pricePerSqFt: z.number().positive(),
  pbr: z.object({
    tile: z.number().positive(),
    roughness: z.number().min(0).max(1),
    metalness: z.number().min(0).max(1),
    bump: z.number().min(0).max(1),
  }),
  packages: z.array(PackageTierSchema),
});
export type RoofMaterialDef = z.infer<typeof RoofMaterialDefSchema>;

export const FenceFinishSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: HexColorSchema,
  postColor: HexColorSchema.optional(),
});
export type FenceFinish = z.infer<typeof FenceFinishSchema>;

export const FenceStyleDefSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    shortDescription: z.string().min(1),
    geometry: FenceGeometryKindSchema,
    defaultFinishId: z.string().min(1),
    finishes: z.array(FenceFinishSchema).min(1),
    defaultHeight: FenceHeightSchema,
    pricePerLinearFt: z.number().positive(),
    packages: z.array(PackageTierSchema).min(1),
  })
  .refine((style) => style.finishes.some((f) => f.id === style.defaultFinishId), {
    message: "defaultFinishId must match one of the style's finishes",
    path: ["defaultFinishId"],
  });
export type FenceStyleDef = z.infer<typeof FenceStyleDefSchema>;

export const ZipCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Please enter a valid 5-digit US ZIP code.");

export const PropertyAddressSchema = z.object({
  id: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: ZipCodeSchema,
  country: z.string().min(1),
  fullAddress: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  suggestedBuildingType: BuildingTypeSchema,
  suggestedStories: StoriesSchema,
  lotLabel: z.string().min(1),
  nearbyStreets: z.tuple([z.string(), z.string(), z.string(), z.string()]),
});
export type PropertyAddress = z.infer<typeof PropertyAddressSchema>;

export const AnswersSchema = z.object({
  // Shared property
  buildingType: BuildingTypeSchema,
  stories: StoriesSchema,
  // Roofing
  slope: SlopeSchema,
  currentMaterial: RoofMaterialSchema,
  roofAge: RoofAgeSchema,
  damage: YesNoSchema,
  desiredType: RoofMaterialSchema,
  solar: YesNoSchema,
  // Fencing
  fenceStyle: z.string().min(1),
  fenceFinish: z.string().min(1),
  fenceHeight: FenceHeightSchema,
  fencePlacement: FencePlacementSchema,
  fenceGate: YesNoSchema,
});
export type Answers = z.infer<typeof AnswersSchema>;
export type StepId = keyof Answers;

export const PartialAnswersSchema = AnswersSchema.partial();

export const ConfiguratorStateSchema = z.object({
  services: z.array(ServiceIdSchema).min(1),
  mode: z.enum(["guided", "decorate"]),
  previewMode: PreviewModeSchema,
  answers: PartialAnswersSchema,
});
export type ConfiguratorState = z.infer<typeof ConfiguratorStateSchema>;

const coerceNullishToEmpty = (v: unknown) => (v == null ? "" : v);

const phoneSchema = z.preprocess(
  coerceNullishToEmpty,
  z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(30, "Phone number is too long.")
    .refine((v) => (v.match(/\d/g)?.length ?? 0) >= 7, "Phone number must contain at least 7 digits."),
);

export const QuickEstimateInquirySchema = z.object({
  name: z.preprocess(
    coerceNullishToEmpty,
    z.string().trim().min(2, "Please enter your full name.").max(120, "Name is too long."),
  ),
  phone: phoneSchema,
  email: z.preprocess(
    coerceNullishToEmpty,
    z.string().trim().pipe(z.email("Please enter a valid email address.")),
  ),
});
export type QuickEstimateInquiry = z.infer<typeof QuickEstimateInquirySchema>;

export const ContactInquirySchema = QuickEstimateInquirySchema.extend({
  service: z.preprocess(coerceNullishToEmpty, z.string().trim().min(1, "Please select a service.")),
  message: z.preprocess(
    coerceNullishToEmpty,
    z
      .string()
      .trim()
      .min(10, "Please share a few details about your project (at least 10 characters).")
      .max(2000, "Message is too long."),
  ),
});
export type ContactInquiry = z.infer<typeof ContactInquirySchema>;

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export const AttachmentMetaSchema = z.object({
  name: z.string().min(1),
  size: z.number().nonnegative().max(MAX_ATTACHMENT_BYTES, "Each file must be 10 MB or smaller."),
  type: z.string(),
});
export type AttachmentMeta = z.infer<typeof AttachmentMetaSchema>;

export const CustomQuoteInquirySchema = QuickEstimateInquirySchema.extend({
  service: z.preprocess(coerceNullishToEmpty, z.string().trim().min(1, "Please select a service.")),
  address: z.preprocess(
    coerceNullishToEmpty,
    z.string().trim().min(5, "Please enter your property address.").max(240, "Address is too long."),
  ),
  notes: z.preprocess(
    coerceNullishToEmpty,
    z.string().trim().max(2000, "Notes must be 2,000 characters or fewer."),
  ),
  acceptedTerms: z.literal(true, {
    error: "Please agree to the Terms of Use to request a quote.",
  }),
  marketingOptIn: z.boolean(),
  attachments: z
    .array(AttachmentMetaSchema)
    .max(MAX_ATTACHMENTS, `You can attach up to ${MAX_ATTACHMENTS} files.`)
    .default([]),
});
export type CustomQuoteInquiry = z.infer<typeof CustomQuoteInquirySchema>;

/** Validates a catalog array at runtime (used in automated tests & dev assertions). */
export function validateCatalogIntegrity<T extends { id: string }>(
  items: readonly T[],
  schema: z.ZodType<T>,
  catalogName: string,
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  items.forEach((item, idx) => {
    const parsed = schema.safeParse(item);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${catalogName}[${idx}] (${item.id}): ${issue.path.join(".") || "root"} — ${issue.message}`);
      }
    }
    if (seenIds.has(item.id)) {
      errors.push(`${catalogName}: duplicate id "${item.id}"`);
    }
    seenIds.add(item.id);
  });
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
