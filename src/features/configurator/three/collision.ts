import { Vector3 } from "three";
import type { KeepOutBlock } from "./types";

export const MIN_CAM_Y = 0.95;

export function isInsideKeepOut(pos: Vector3, blocks: readonly KeepOutBlock[]): boolean {
  if (pos.y < MIN_CAM_Y) return true;
  for (const b of blocks) {
    if (pos.x > b.minX && pos.x < b.maxX && pos.z > b.minZ && pos.z < b.maxZ && pos.y < b.topY(pos.x, pos.z)) {
      return true;
    }
  }
  return false;
}

/**
 * Keeps the camera strictly outside every wall, porch, garage, roof slope, and chimney.
 * - Pure radial zoom toward `target` stops cleanly on the exterior shell along the view ray.
 * - Orbit / pan smoothly glides around exterior walls and over pitched roofs.
 */
export function keepCameraOutside(
  pos: Vector3,
  prev: Vector3 | null,
  target: Vector3,
  blocks: readonly KeepOutBlock[],
): boolean {
  if (!isInsideKeepOut(pos, blocks)) return false;

  // If moving almost purely radially inward (zooming), stop on the exterior shell along prev → pos.
  if (prev && !isInsideKeepOut(prev, blocks)) {
    const vPrev = new Vector3().subVectors(prev, target);
    const vNext = new Vector3().subVectors(pos, target);
    const lenP = vPrev.length();
    const lenN = vNext.length();
    if (lenP > 0.01 && lenN > 0.01 && lenN < lenP) {
      const cosAng = vPrev.dot(vNext) / (lenP * lenN);
      if (cosAng > 0.9995) {
        let lo = 0;
        let hi = 1;
        const probe = new Vector3();
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) * 0.5;
          probe.lerpVectors(prev, pos, mid);
          if (isInsideKeepOut(probe, blocks)) hi = mid;
          else lo = mid;
        }
        pos.lerpVectors(prev, pos, lo);
        return true;
      }
    }
  }

  if (pos.y < MIN_CAM_Y) pos.y = MIN_CAM_Y;

  for (let pass = 0; pass < 4; pass++) {
    let hit = false;
    for (const b of blocks) {
      if (pos.x <= b.minX || pos.x >= b.maxX || pos.z <= b.minZ || pos.z >= b.maxZ) continue;
      const ceiling = b.topY(pos.x, pos.z);
      if (pos.y >= ceiling) continue;

      hit = true;
      if (prev) {
        const eps = 0.03;
        if (prev.y >= b.topY(prev.x, prev.z) - eps) {
          pos.y = ceiling;
          continue;
        }
        if (prev.z >= b.maxZ - eps) {
          pos.z = b.maxZ;
          continue;
        }
        if (prev.z <= b.minZ + eps) {
          pos.z = b.minZ;
          continue;
        }
        if (prev.x >= b.maxX - eps) {
          pos.x = b.maxX;
          continue;
        }
        if (prev.x <= b.minX + eps) {
          pos.x = b.minX;
          continue;
        }
      }

      // Fallback when building grew around camera: shortest exterior exit.
      const dTop = ceiling - pos.y;
      const dL = pos.x - b.minX;
      const dR = b.maxX - pos.x;
      const dB = pos.z - b.minZ;
      const dF = b.maxZ - pos.z;
      const min = Math.min(dTop, dL, dR, dB, dF);
      if (min === dTop) pos.y = ceiling;
      else if (min === dF) pos.z = b.maxZ;
      else if (min === dB) pos.z = b.minZ;
      else if (min === dR) pos.x = b.maxX;
      else pos.x = b.minX;
    }
    if (!hit) break;
  }
  return true;
}
