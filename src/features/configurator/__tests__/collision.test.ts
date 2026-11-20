import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { MIN_CAM_Y, isInsideKeepOut, keepCameraOutside } from "../three/collision";
import type { KeepOutBlock } from "../three/types";

const MARGIN = 0.72;

/** Sample residential house + pitched gable roof + porch + garage keep-out blocks. */
function makeResidentialBlocks(): KeepOutBlock[] {
  const wallH = 3.2;
  const ridgeH = 2.6;
  const halfD = 4.6;

  return [
    // Main house with gable roof along X
    {
      minX: -5.5 - MARGIN,
      maxX: 5.5 + MARGIN,
      minZ: -halfD - MARGIN,
      maxZ: halfD + MARGIN,
      topY: (_x, z) => {
        const t = Math.max(0, 1 - Math.abs(z) / (halfD + MARGIN));
        return wallH + t * ridgeH + MARGIN;
      },
    },
    // Attached garage on right
    {
      minX: 5.2 - MARGIN,
      maxX: 11.4 + MARGIN,
      minZ: -3.2 - MARGIN,
      maxZ: 4.8 + MARGIN,
      topY: () => 4.2 + MARGIN,
    },
    // Front porch
    {
      minX: -2.4 - MARGIN,
      maxX: 2.4 + MARGIN,
      minZ: 4.2 - MARGIN,
      maxZ: 6.8 + MARGIN,
      topY: () => 3.5 + MARGIN,
    },
  ];
}

describe("3D exterior camera keep-out collision", () => {
  const blocks = makeResidentialBlocks();
  const target = new Vector3(0, 2.5, 0);

  it("leaves positions well outside the house untouched", () => {
    const pos = new Vector3(14, 7, 16);
    const prev = new Vector3(15, 7.2, 17);
    const adjusted = keepCameraOutside(pos, prev, target, blocks);
    expect(adjusted).toBe(false);
    expect(pos.x).toBe(14);
    expect(pos.y).toBe(7);
    expect(pos.z).toBe(16);
  });

  it("stops pure radial zoom cleanly on the exterior wall without entering the house or jumping onto the roof", () => {
    // Camera zooms straight from outside front porch toward target (0, 2.5, 0)
    const prev = new Vector3(0, 2.5, 11);
    const next = new Vector3(0, 2.5, 3); // tries to punch deep inside porch & house
    expect(isInsideKeepOut(prev, blocks)).toBe(false);
    expect(isInsideKeepOut(next, blocks)).toBe(true);

    const adjusted = keepCameraOutside(next, prev, target, blocks);
    expect(adjusted).toBe(true);
    expect(isInsideKeepOut(next, blocks)).toBe(false);
    // Must stay at the same eye height (no jump to roof) and stop just outside porch maxZ (6.8 + 0.72 = 7.52)
    expect(next.y).toBeCloseTo(2.5, 2);
    expect(next.z).toBeGreaterThanOrEqual(6.8 + MARGIN - 0.02);
    expect(next.z).toBeLessThan(8.0);
  });

  it("glides smoothly over the pitched roof when orbiting from above", () => {
    const prev = new Vector3(0, 7.2, 0.5);
    const next = new Vector3(0, 4.5, 0.5); // descending straight into ridge
    expect(isInsideKeepOut(prev, blocks)).toBe(false);

    const adjusted = keepCameraOutside(next, prev, target, blocks);
    expect(adjusted).toBe(true);
    expect(isInsideKeepOut(next, blocks)).toBe(false);
    expect(next.y).toBeGreaterThanOrEqual(blocks[0]!.topY(0, 0.5) - 0.001);
  });

  it("glides laterally around exterior walls when orbiting horizontally", () => {
    const prev = new Vector3(-8.5, 2.2, 0);
    const next = new Vector3(-5.0, 2.2, 0.4); // orbiting into left wall
    expect(isInsideKeepOut(prev, blocks)).toBe(false);

    const adjusted = keepCameraOutside(next, prev, target, blocks);
    expect(adjusted).toBe(true);
    expect(isInsideKeepOut(next, blocks)).toBe(false);
    expect(next.x).toBeLessThanOrEqual(-5.5 - MARGIN + 0.001);
  });

  it("never allows the camera below MIN_CAM_Y", () => {
    const pos = new Vector3(14, 0.2, 14);
    const adjusted = keepCameraOutside(pos, null, target, blocks);
    expect(adjusted).toBe(true);
    expect(pos.y).toBeGreaterThanOrEqual(MIN_CAM_Y);
    expect(isInsideKeepOut(pos, blocks)).toBe(false);
  });

  it("ejects a camera safely outside if a building resize traps it inside", () => {
    // No valid previous exterior position (prev = null simulates model swap growing around camera)
    const trapped = new Vector3(0.5, 2.0, 1.0);
    expect(isInsideKeepOut(trapped, blocks)).toBe(true);

    const adjusted = keepCameraOutside(trapped, null, target, blocks);
    expect(adjusted).toBe(true);
    expect(isInsideKeepOut(trapped, blocks)).toBe(false);
  });
});
