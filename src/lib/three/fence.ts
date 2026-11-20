import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type MeshStandardMaterialParameters,
} from "three";
import {
  FENCE_HEIGHT_METERS,
  getFenceFinish,
  getFenceStyle,
  type FenceHeight,
  type FencePlacement,
} from "@/lib/estimate/fences";
import type { BuildingType } from "@/lib/estimate/questions";

export type FenceSceneConfig = {
  enabled: boolean;
  styleId: string;
  finishId: string;
  height: FenceHeight;
  placement: FencePlacement;
  gate: boolean;
};

export interface FenceAssetProvider {
  std(key: string, params: MeshStandardMaterialParameters): MeshStandardMaterial;
  fenceWood(colorHex: string): MeshStandardMaterial;
  fenceVinyl(colorHex: string): MeshStandardMaterial;
  fenceChainLink(colorHex: string): MeshStandardMaterial;
}

type Run = {
  a: [number, number]; // [x, z]
  b: [number, number]; // [x, z]
  gate?: "single" | "double";
};

const shadowed = <T extends Mesh>(m: T, cast = true, receive = true) => {
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};

function makePanelBox(w: number, h: number, d: number, tileU: number, tileV: number): BoxGeometry {
  const g = new BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv");
  const norm = g.getAttribute("normal");
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    if (nx > 0.5) uv.setXY(i, (pz + d / 2) / tileU, (py + h / 2) / tileV);
    else if (ny > 0.5) uv.setXY(i, (px + w / 2) / tileU, (pz + d / 2) / tileU);
    else uv.setXY(i, (px + w / 2) / tileU, (py + h / 2) / tileV);
  }
  uv.needsUpdate = true;
  return g;
}

function getRuns(buildingType: BuildingType, placement: FencePlacement, gate: boolean): Run[] {
  const runs: Run[] = [];
  if (buildingType === "residential") {
    const xMin = -10.35;
    const xMax = 10.35;
    const zMin = -7.2;
    const zMax = 10.2;
    const walkL = -3.25;
    const walkR = -1.45;
    const driveL = 3.45;
    const driveR = 8.95;

    const addFrontLine = () => {
      runs.push({ a: [xMin, zMax], b: [walkL, zMax] });
      if (gate) runs.push({ a: [walkL, zMax], b: [walkR, zMax], gate: "single" });
      runs.push({ a: [walkR, zMax], b: [driveL, zMax] });
      if (gate) runs.push({ a: [driveL, zMax], b: [driveR, zMax], gate: "double" });
      runs.push({ a: [driveR, zMax], b: [xMax, zMax] });
    };

    if (placement === "backyard") {
      // Left side return with optional walk gate, then full backyard wrap to right garage corner
      runs.push({ a: [-10.35, 1.8], b: [-8.12, 1.8], gate: gate ? "single" : undefined });
      runs.push({ a: [xMin, 1.8], b: [xMin, zMin] });
      runs.push({ a: [xMin, zMin], b: [xMax, zMin] });
      runs.push({ a: [xMax, zMin], b: [xMax, 1.4] });
      runs.push({ a: [9.18, 1.4], b: [xMax, 1.4] });
    } else if (placement === "full-perimeter") {
      runs.push({ a: [xMin, zMax], b: [xMin, zMin] });
      runs.push({ a: [xMin, zMin], b: [xMax, zMin] });
      runs.push({ a: [xMax, zMin], b: [xMax, zMax] });
      addFrontLine();
    } else {
      // front-yard
      runs.push({ a: [xMin, 1.8], b: [xMin, zMax] });
      addFrontLine();
      runs.push({ a: [xMax, 1.4], b: [xMax, zMax] });
    }
  } else {
    const xMin = -12.1;
    const xMax = 12.1;
    const zMin = -9.4;
    const zMax = 14.6;
    const entryL = -3.2;
    const entryR = 3.2;

    const addFrontLine = () => {
      runs.push({ a: [xMin, zMax], b: [entryL, zMax] });
      if (gate) runs.push({ a: [entryL, zMax], b: [entryR, zMax], gate: "double" });
      runs.push({ a: [entryR, zMax], b: [xMax, zMax] });
    };

    if (placement === "backyard") {
      runs.push({ a: [xMin, 2.0], b: [-9.58, 2.0], gate: gate ? "single" : undefined });
      runs.push({ a: [xMin, 2.0], b: [xMin, zMin] });
      runs.push({ a: [xMin, zMin], b: [xMax, zMin] });
      runs.push({ a: [xMax, zMin], b: [xMax, 2.0] });
      runs.push({ a: [9.58, 2.0], b: [xMax, 2.0] });
    } else if (placement === "full-perimeter") {
      runs.push({ a: [xMin, zMax], b: [xMin, zMin] });
      runs.push({ a: [xMin, zMin], b: [xMax, zMin] });
      runs.push({ a: [xMax, zMin], b: [xMax, zMax] });
      addFrontLine();
    } else {
      runs.push({ a: [xMin, 2.0], b: [xMin, zMax] });
      addFrontLine();
      runs.push({ a: [xMax, 2.0], b: [xMax, zMax] });
    }
  }
  return runs;
}

/** Builds a realistic, GPU-instanced 3D fence perimeter & matching gates around the property. */
export function buildFence(
  cfg: FenceSceneConfig,
  buildingType: BuildingType,
  lib: FenceAssetProvider,
): { group: Group; extraRadius: number; summary: string } {
  const group = new Group();
  const style = getFenceStyle(cfg.styleId);
  const finish = getFenceFinish(cfg.styleId, cfg.finishId);
  const H = FENCE_HEIGHT_METERS[cfg.height];
  const kind = style.geometry;

  const isMetal = kind === "ornamental-iron" || kind === "chain-link";
  const postHex = finish.postColor ?? finish.color;

  const boardMat =
    kind === "wood-privacy" || kind === "horizontal-slat"
      ? lib.fenceWood(finish.color)
      : kind === "vinyl-privacy"
        ? lib.fenceVinyl(finish.color)
        : kind === "chain-link"
          ? lib.fenceChainLink(finish.color)
          : lib.std(`fence:solid:${kind}:${finish.color}`, {
              color: finish.color,
              roughness: isMetal ? 0.36 : 0.62,
              metalness: isMetal ? 0.68 : 0.02,
            });

  const postMat = lib.std(`fence:post:${kind}:${postHex}`, {
    color: postHex,
    roughness: isMetal || Boolean(finish.postColor) ? 0.35 : kind === "vinyl-privacy" ? 0.48 : 0.82,
    metalness: isMetal || Boolean(finish.postColor) ? 0.68 : 0.02,
  });

  const hardwareMat = lib.std("fence:hardware", { color: "#1d2229", roughness: 0.35, metalness: 0.78 });

  const runs = getRuns(buildingType, cfg.placement, cfg.gate);

  // Deduplicated post positions so corner posts aren't doubled
  const postKeySet = new Set<string>();
  const postMatrices: Matrix4[] = [];
  const capMatrices: Matrix4[] = [];
  const picketMatrices: Matrix4[] = [];
  const finialMatrices: Matrix4[] = [];
  const railMatrices: Matrix4[] = [];
  const slatMatrices: Matrix4[] = [];
  const hardwareMatrices: Matrix4[] = [];

  const postSize =
    kind === "vinyl-privacy"
      ? 0.13
      : kind === "wood-privacy" || kind === "picket"
        ? 0.11
        : kind === "horizontal-slat"
          ? 0.085
          : 0.068;
  const postH = H + (kind === "chain-link" ? 0.04 : 0.09);
  const maxSpan = kind === "chain-link" ? 3.0 : 2.45;
  const qId = new Quaternion();

  const addPost = (x: number, z: number, tallBoost = 0) => {
    const key = `${Math.round(x * 20)},${Math.round(z * 20)}`;
    if (postKeySet.has(key)) return;
    postKeySet.add(key);
    const h = postH + tallBoost;
    postMatrices.push(new Matrix4().compose(new Vector3(x, h / 2, z), qId, new Vector3(1, h, 1)));
    capMatrices.push(new Matrix4().compose(new Vector3(x, h + 0.032, z), qId, new Vector3(1, 1, 1)));
  };

  const pushBoxRun = (
    target: Matrix4[],
    cx: number,
    y: number,
    cz: number,
    yaw: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    target.push(new Matrix4().compose(new Vector3(cx, y, cz), q, new Vector3(sx, sy, sz)));
  };

  for (const run of runs) {
    const [ax, az] = run.a;
    const [bx, bz] = run.b;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 0.25) continue;

    const dirX = dx / len;
    const dirZ = dz / len;
    const yaw = Math.atan2(-dz, dx); // +X axis aligned along (dx, dz)

    // Always place terminal posts (gate posts slightly taller for architectural presence)
    const boost = run.gate ? 0.08 : 0;
    addPost(ax, az, boost);
    addPost(bx, bz, boost);

    // Subdivide non-gate runs into regular post bays
    const segments: [number, number][] = [];
    if (run.gate === "double") {
      // Two symmetrical gate leaves meeting cleanly at the center with a 5cm reveal
      segments.push([0.09, len / 2 - 0.025], [len / 2 + 0.025, len - 0.09]);
      // Center matte-black double-gate latch hardware
      pushBoxRun(hardwareMatrices, ax + dirX * (len / 2), Math.min(H * 0.62, 1.15), az + dirZ * (len / 2), yaw, 0.14, 0.12, 0.09);
    } else if (run.gate === "single") {
      segments.push([0.08, len - 0.08]);
      pushBoxRun(hardwareMatrices, ax + dirX * (len - 0.18), Math.min(H * 0.6, 1.08), az + dirZ * (len - 0.18), yaw, 0.1, 0.12, 0.09);
    } else {
      const bays = Math.max(1, Math.ceil(len / maxSpan));
      for (let i = 1; i < bays; i++) {
        const t = i / bays;
        addPost(ax + dx * t, az + dz * t);
      }
      for (let i = 0; i < bays; i++) {
        const s0 = (i / bays) * len + postSize * 0.45;
        const s1 = ((i + 1) / bays) * len - postSize * 0.45;
        if (s1 > s0 + 0.08) segments.push([s0, s1]);
      }
    }

    for (const [s0, s1] of segments) {
      const segLen = s1 - s0;
      const mid = (s0 + s1) / 2;
      const mx = ax + dirX * mid;
      const mz = az + dirZ * mid;
      const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);

      if (kind === "wood-privacy" || kind === "vinyl-privacy") {
        // Textured solid panel bay + top/bottom architectural rails
        const panelH = H - 0.08;
        const mesh = new Mesh(makePanelBox(segLen, panelH, 0.042, 1.2, 1.8), boardMat);
        mesh.position.set(mx, 0.06 + panelH / 2, mz);
        mesh.quaternion.copy(q);
        group.add(shadowed(mesh));

        // Top & bottom cap rails (and gate header/stiles if this bay is a gate)
        pushBoxRun(railMatrices, mx, H - 0.02, mz, yaw, segLen + 0.02, 0.065, 0.075);
        pushBoxRun(railMatrices, mx, 0.08, mz, yaw, segLen + 0.02, 0.06, 0.07);
        if (run.gate) {
          // Vertical gate side stiles so gates visually stand apart from regular fence panels
          pushBoxRun(railMatrices, ax + dirX * (s0 + 0.03), H / 2, az + dirZ * (s0 + 0.03), yaw, 0.06, H - 0.08, 0.075);
          pushBoxRun(railMatrices, ax + dirX * (s1 - 0.03), H / 2, az + dirZ * (s1 - 0.03), yaw, 0.06, H - 0.08, 0.075);
        }
      } else if (kind === "horizontal-slat") {
        // Stacked horizontal architectural wood slats with clean shadow gaps
        const slatH = 0.135;
        const gap = 0.028;
        const step = slatH + gap;
        for (let y = 0.12; y + slatH / 2 <= H; y += step) {
          pushBoxRun(slatMatrices, mx, y, mz, yaw, segLen, slatH, 0.03);
        }
        if (run.gate) {
          pushBoxRun(railMatrices, ax + dirX * (s0 + 0.025), H / 2, az + dirZ * (s0 + 0.025), yaw, 0.055, H - 0.06, 0.065);
          pushBoxRun(railMatrices, ax + dirX * (s1 - 0.025), H / 2, az + dirZ * (s1 - 0.025), yaw, 0.055, H - 0.06, 0.065);
          pushBoxRun(railMatrices, mx, H - 0.02, mz, yaw, segLen, 0.055, 0.065);
        }
      } else if (kind === "ornamental-iron") {
        // 3 horizontal square rails + slender vertical pickets + spear finials
        pushBoxRun(railMatrices, mx, H - 0.16, mz, yaw, segLen, 0.035, 0.035);
        pushBoxRun(railMatrices, mx, H - 0.3, mz, yaw, segLen, 0.035, 0.035);
        pushBoxRun(railMatrices, mx, 0.14, mz, yaw, segLen, 0.035, 0.035);

        const spacing = 0.125;
        const count = Math.max(2, Math.floor(segLen / spacing));
        const pH = H - 0.1;
        for (let k = 0; k < count; k++) {
          const s = s0 + ((k + 0.5) / count) * segLen;
          const px = ax + dirX * s;
          const pz = az + dirZ * s;
          pushBoxRun(picketMatrices, px, 0.08 + pH / 2, pz, yaw, 0.022, pH, 0.022);
          finialMatrices.push(new Matrix4().compose(new Vector3(px, 0.08 + pH + 0.045, pz), qId, new Vector3(1, 1, 1)));
        }
      } else if (kind === "picket") {
        // Traditional spaced flat pickets with pointed tips & 2 horizontal rails
        pushBoxRun(railMatrices, mx, H * 0.78, mz, yaw, segLen, 0.06, 0.045);
        pushBoxRun(railMatrices, mx, H * 0.22, mz, yaw, segLen, 0.06, 0.045);

        const spacing = 0.15;
        const count = Math.max(2, Math.floor(segLen / spacing));
        const pH = H - 0.08;
        for (let k = 0; k < count; k++) {
          const s = s0 + ((k + 0.5) / count) * segLen;
          const px = ax + dirX * s;
          const pz = az + dirZ * s;
          pushBoxRun(picketMatrices, px, 0.06 + pH / 2, pz, yaw, 0.092, pH, 0.024);
        }
      } else {
        // Chain link: tubular top rail + translucent diamond wire-mesh plane
        pushBoxRun(railMatrices, mx, H - 0.02, mz, yaw, segLen, 0.042, 0.042);
        pushBoxRun(railMatrices, mx, 0.06, mz, yaw, segLen, 0.028, 0.028);
        const meshGeo = new PlaneGeometry(segLen, H - 0.08);
        const uv = meshGeo.getAttribute("uv");
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (segLen / 0.45), uv.getY(i) * ((H - 0.08) / 0.45));
        const mesh = new Mesh(meshGeo, boardMat);
        mesh.position.set(mx, 0.04 + (H - 0.08) / 2, mz);
        mesh.quaternion.copy(q);
        group.add(shadowed(mesh, false, false));
      }
    }
  }

  // Emit batched InstancedMeshes for crisp 60fps performance
  if (postMatrices.length) {
    const postGeo =
      kind === "chain-link"
        ? new CylinderGeometry(0.032, 0.032, 1, 10)
        : new BoxGeometry(postSize, 1, postSize);
    const posts = new InstancedMesh(postGeo, postMat, postMatrices.length);
    postMatrices.forEach((m, i) => posts.setMatrixAt(i, m));
    posts.instanceMatrix.needsUpdate = true;
    group.add(shadowed(posts));

    const capGeo =
      kind === "chain-link"
        ? new CylinderGeometry(0.038, 0.038, 0.05, 10)
        : new ConeGeometry(postSize * 0.85, 0.075, 4);
    if (kind !== "chain-link") capGeo.rotateY(Math.PI / 4);
    const caps = new InstancedMesh(capGeo, postMat, capMatrices.length);
    capMatrices.forEach((m, i) => caps.setMatrixAt(i, m));
    caps.instanceMatrix.needsUpdate = true;
    group.add(shadowed(caps));
  }

  if (railMatrices.length) {
    const rails = new InstancedMesh(new BoxGeometry(1, 1, 1), postMat, railMatrices.length);
    railMatrices.forEach((m, i) => rails.setMatrixAt(i, m));
    rails.instanceMatrix.needsUpdate = true;
    group.add(shadowed(rails));
  }

  if (slatMatrices.length) {
    const slats = new InstancedMesh(new BoxGeometry(1, 1, 1), boardMat, slatMatrices.length);
    slatMatrices.forEach((m, i) => slats.setMatrixAt(i, m));
    slats.instanceMatrix.needsUpdate = true;
    group.add(shadowed(slats));
  }

  if (picketMatrices.length) {
    const pickets = new InstancedMesh(new BoxGeometry(1, 1, 1), boardMat, picketMatrices.length);
    picketMatrices.forEach((m, i) => pickets.setMatrixAt(i, m));
    pickets.instanceMatrix.needsUpdate = true;
    group.add(shadowed(pickets));
  }

  if (finialMatrices.length) {
    const finials = new InstancedMesh(new ConeGeometry(0.022, 0.095, 4), boardMat, finialMatrices.length);
    finialMatrices.forEach((m, i) => finials.setMatrixAt(i, m));
    finials.instanceMatrix.needsUpdate = true;
    group.add(shadowed(finials));
  }

  if (hardwareMatrices.length) {
    const hw = new InstancedMesh(new BoxGeometry(1, 1, 1), hardwareMat, hardwareMatrices.length);
    hardwareMatrices.forEach((m, i) => hw.setMatrixAt(i, m));
    hw.instanceMatrix.needsUpdate = true;
    group.add(shadowed(hw));
  }

  const extraRadius = cfg.placement === "backyard" ? 1.5 : 3.2;
  const summary = `, enclosed with a ${cfg.height} ${finish.label.toLowerCase()} ${style.label.toLowerCase()} fence (${cfg.placement.replace("-", " ")})${cfg.gate ? " with matching gates" : ""}`;

  return { group, extraRadius, summary };
}
