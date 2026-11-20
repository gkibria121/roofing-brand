import { fencingPlugin } from "../catalogs/fencing";
import { roofingPlugin } from "../catalogs/roofing";
import type { ServiceId } from "./schemas";
import type { Callout, ServicePlugin } from "./types";

/**
 * Central Service Registry.
 *
 * Adding a new 3D exterior service (e.g., Siding, Gutters, Decks):
 *   1. Add its ID to `ServiceIdSchema` in `domain/schemas.ts`.
 *   2. Create `catalogs/<service>.ts` implementing `ServicePlugin`.
 *   3. Register it in `SERVICE_REGISTRY` below.
 */
export const SERVICE_REGISTRY: readonly ServicePlugin[] = [roofingPlugin, fencingPlugin];

const PLUGIN_BY_ID: Record<ServiceId, ServicePlugin> = Object.fromEntries(
  SERVICE_REGISTRY.map((p) => [p.id, p]),
) as Record<ServiceId, ServicePlugin>;

export function getServicePlugin(id: ServiceId): ServicePlugin {
  return PLUGIN_BY_ID[id];
}

export function getCrossServiceCallouts(services: readonly ServiceId[]): Callout[] {
  const out: Callout[] = [];
  if (services.includes("roofing") && services.includes("fencing")) {
    out.push({
      title: "Multi-service bundle scheduling",
      text: "We coordinate roof tear-off first so heavy equipment never risks damaging your brand-new fence.",
    });
  }
  return out;
}
