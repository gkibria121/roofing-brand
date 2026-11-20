export { EstimateWizard } from "./components/EstimateWizard";
export { FENCE_CATALOG, getFenceFinish, getFenceStyle } from "./catalogs/fencing";
export { ROOF_MATERIAL_CATALOG, SLOPE_OPTIONS, getRoofMaterialDef } from "./catalogs/roofing";
export { SERVICE_REGISTRY, getServicePlugin } from "./domain/registry";
export {
  applyAnswer,
  deriveScene,
  getAllCallouts,
  getServicePackageGroups,
  getStepsForServices,
  isAnswered,
  labelFor,
  toggleServiceSelection,
} from "./domain/engine";
export {
  parseConfiguratorState,
  serializeConfiguratorState,
  validateContactInquiry,
  validateQuickEstimateInquiry,
} from "./domain/validation";
export type {
  Answers,
  BuildingType,
  ConfiguratorState,
  ContactInquiry,
  FenceFinish,
  FenceHeight,
  FencePlacement,
  FenceStyleDef,
  Material,
  PackageTier,
  PreviewMode,
  QuickEstimateInquiry,
  RoofAge,
  RoofMaterialDef,
  ServiceId,
  Slope,
  StepId,
  Stories,
  YesNo,
} from "./domain/schemas";
export type { Callout, Option, ServicePackageGroup, ServicePlugin, StepDef } from "./domain/types";
