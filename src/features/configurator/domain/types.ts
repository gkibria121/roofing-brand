import type {
  Answers,
  PackageTier,
  PreviewMode,
  ServiceId,
  StepId,
} from "./schemas";

export type Option = {
  value: string;
  label: string;
  description?: string;
  /** Optional swatch hex color for visual finish chips. */
  swatch?: string;
  swatchSecondary?: string;
};

export type StepCategory = "property" | ServiceId;

export type StepDef = {
  id: StepId;
  category: StepCategory;
  summaryLabel: string;
  title: string;
  hint?: string;
  options: (answers: Partial<Answers>) => Option[];
};

export type Callout = {
  title: string;
  text: string;
};

export type ServicePackageGroup = {
  serviceId: ServiceId;
  radioGroupName: string;
  legend: string;
  itemLabel: string;
  tiers: readonly PackageTier[];
};

/**
 * Plugin contract for every 3D-configurable exterior service.
 *
 * Adding a new service (e.g. Siding, Gutters, Decks) means implementing this
 * interface in `catalogs/<service>.ts` and registering it in `domain/registry.ts`.
 */
export interface ServicePlugin {
  readonly id: ServiceId;
  readonly label: string;
  readonly subtitle: string;
  /** Step IDs owned by this service, in guided-flow order. */
  readonly stepIds: readonly StepId[];
  /** Step definitions provided by this service. */
  readonly steps: Readonly<Partial<Record<StepId, StepDef>>>;
  /** Seed sensible defaults when the user toggles this service ON. */
  seedDefaults(answers: Partial<Answers>): Partial<Answers>;
  /** Keep dependent answers consistent after any answer update (e.g. slope -> material). */
  sanitize(answers: Partial<Answers>): Partial<Answers>;
  /** Matching packages for the final summary screen. */
  getPackageGroup(answers: Partial<Answers>): ServicePackageGroup;
  /** Tailored project callouts derived from the user's selections. */
  getCallouts(answers: Partial<Answers>): Callout[];
  /** Overlay badges displayed on the 3D canvas when this service is active. */
  getBadges(answers: Partial<Answers>, previewMode: PreviewMode): string[];
  /** Compact 1-line summary for the spec strip below the 3D canvas. */
  getSpecSummary(answers: Partial<Answers>, previewMode: PreviewMode): { label: string; value: string };
}
