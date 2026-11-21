import type { z } from "zod";
import { SERVICE_REGISTRY } from "./registry";
import {
  AnswersSchema,
  ContactInquirySchema,
  CustomQuoteInquirySchema,
  PreviewModeSchema,
  QuickEstimateInquirySchema,
  ServiceIdSchema,
  type Answers,
  type ConfiguratorState,
  type ContactInquiry,
  type CustomQuoteInquiry,
  type QuickEstimateInquiry,
  type ServiceId,
  type StepId,
} from "./schemas";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; fieldErrors: Record<string, string> };

function formatZodResult<T>(parsed: z.ZodSafeParseResult<T>): ValidationResult<T> {
  if (parsed.success) return { success: true, data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}

export function validateQuickEstimateInquiry(input: unknown): ValidationResult<QuickEstimateInquiry> {
  return formatZodResult(QuickEstimateInquirySchema.safeParse(input));
}

export function validateContactInquiry(input: unknown): ValidationResult<ContactInquiry> {
  return formatZodResult(ContactInquirySchema.safeParse(input));
}

export function validateCustomQuoteInquiry(input: unknown): ValidationResult<CustomQuoteInquiry> {
  return formatZodResult(CustomQuoteInquirySchema.safeParse(input));
}

export type CustomQuoteField = keyof CustomQuoteInquiry;

export function validateCustomQuoteField<K extends CustomQuoteField>(
  field: K,
  value: unknown,
): string | null {
  const fieldSchema = CustomQuoteInquirySchema.shape[field];
  const parsed = fieldSchema.safeParse(value);
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Please check this field.");
}

const ANSWER_KEYS = Object.keys(AnswersSchema.shape) as StepId[];

/**
 * Serializes a 3D configurator state into a clean, shareable URL query string.
 */
export function serializeConfiguratorState(state: ConfiguratorState): string {
  const params = new URLSearchParams();
  params.set("services", state.services.join(","));
  if (state.mode !== "guided") params.set("mode", state.mode);
  if (state.previewMode !== "current") params.set("view", state.previewMode);

  for (const key of ANSWER_KEYS) {
    const val = state.answers[key];
    if (val !== undefined) params.set(key, String(val));
  }
  return params.toString();
}

/**
 * Safely parses & sanitizes a configurator state from URLSearchParams or query string.
 * Any malformed, unknown, or incompatible parameters are silently discarded so
 * external/shared links can never put the 3D scene into an invalid state.
 */
export function parseConfiguratorState(input: string | URLSearchParams): ConfiguratorState | null {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  if ([...params.keys()].length === 0) return null;

  // Services
  const rawServices = (params.get("services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const validServices: ServiceId[] = [];
  for (const s of rawServices) {
    const parsed = ServiceIdSchema.safeParse(s);
    if (parsed.success && !validServices.includes(parsed.data)) {
      validServices.push(parsed.data);
    }
  }
  const services: ServiceId[] = validServices.length > 0 ? validServices : ["roofing"];

  // Mode & previewMode
  const rawMode = params.get("mode");
  const mode: ConfiguratorState["mode"] = rawMode === "decorate" ? "decorate" : "guided";
  const parsedView = PreviewModeSchema.safeParse(params.get("view"));
  const previewMode = parsedView.success ? parsedView.data : "current";

  // Answers — validate each field individually so one bad param never drops valid ones.
  let answers: Partial<Answers> = {};
  for (const key of ANSWER_KEYS) {
    const raw = params.get(key);
    if (raw === null) continue;
    const fieldSchema = AnswersSchema.shape[key];
    const parsed = fieldSchema.safeParse(raw);
    if (parsed.success) {
      answers = { ...answers, [key]: parsed.data };
    }
  }

  // Run every plugin's sanitizer (drops incompatible slope/material or invalid fenceFinish)
  for (const plugin of SERVICE_REGISTRY) {
    answers = plugin.sanitize(answers);
  }
  // Seed defaults for enabled services so shared links render completely
  for (const sid of services) {
    const plugin = SERVICE_REGISTRY.find((p) => p.id === sid);
    if (plugin) answers = plugin.seedDefaults(answers);
  }

  return { services, mode, previewMode, answers };
}
