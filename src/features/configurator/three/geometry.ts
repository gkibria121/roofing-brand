import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import type { AssetLibrary } from "./assets";
import { mulberry32 } from "./textures";
import type { RoofFace } from "./types";

export const shadowed = <T extends Mesh>(m: T, cast = true, receive = true) => {
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};

/** Box geometry with world-space UVs so bricks, siding, stone & concrete never stretch. */
export function worldBox(w: number, h: number, d: number, tileU: number, tileV = tileU): BoxGeometry {
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
    else if (ny > 0.5) uv.setXY(i, (px + w / 2) / tileU, (pz + d / 2) / tileV);
    else uv.setXY(i, (px + w / 2) / tileU, (py + h / 2) / tileV);
  }
  uv.needsUpdate = true;
  return g;
}

/** Planar convex polygon with UVs in real-world metres / tile. */
export function polygon(verts: Vector3[], tile: number, facing: Vector3): BufferGeometry {
  const n = new Vector3().subVectors(verts[1], verts[0]).cross(new Vector3().subVectors(verts[2], verts[0])).normalize();
  const ordered = n.dot(facing) < 0 ? [...verts].reverse() : verts;
  if (ordered !== verts) n.negate();
  const e1 = new Vector3().subVectors(ordered[1], ordered[0]).normalize();
  const e2 = new Vector3().crossVectors(n, e1);
  const pos: number[] = [];
  const uv: number[] = [];
  for (const v of ordered) {
    pos.push(v.x, v.y, v.z);
    const d = new Vector3().subVectors(v, ordered[0]);
    uv.push(d.dot(e1) / tile, d.dot(e2) / tile);
  }
  const idx: number[] = [];
  for (let i = 1; i < ordered.length - 1; i++) idx.push(0, i, i + 1);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function place(face: RoofFace, u: number, s: number, lift: number) {
  return face.origin.clone().addScaledVector(face.u, u).addScaledVector(face.s, s).addScaledVector(face.n, lift);
}

export function faceQuat(face: RoofFace) {
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(face.u, face.s, face.n));
}

/** Adds physical 3D standing-seam ribs onto a pitched roof face when material === "metal". */
export function addStandingSeams(target: Group, face: RoofFace, seamMat: MeshStandardMaterial) {
  const spacing = 0.42;
  const maxHalf = face.halfWidthAt(0) - 0.18;
  const matrices: Matrix4[] = [];
  const q = new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(face.u, face.n, new Vector3().crossVectors(face.u, face.n)),
  );

  for (let u = -maxHalf; u <= maxHalf + 0.01; u += spacing) {
    let topS = face.length;
    if (Math.abs(u) > face.halfWidthAt(face.length)) {
      let lo = 0;
      let hi = face.length;
      for (let k = 0; k < 8; k++) {
        const mid = (lo + hi) / 2;
        if (Math.abs(u) <= face.halfWidthAt(mid) - 0.08) lo = mid;
        else hi = mid;
      }
      topS = lo;
    }
    if (topS < 0.35) continue;
    const midS = topS / 2;
    matrices.push(new Matrix4().compose(place(face, u, midS, 0.028), q, new Vector3(1, 1, topS)));
  }

  if (!matrices.length) return;
  const ribs = new InstancedMesh(new BoxGeometry(0.036, 0.048, 1), seamMat, matrices.length);
  matrices.forEach((m, i) => ribs.setMatrixAt(i, m));
  ribs.instanceMatrix.needsUpdate = true;
  target.add(shadowed(ribs, true, true));
}

/** Organic multi-cluster broadleaf trees & foundation shrubs (smooth shaded, instanced). */
export function addLandscaping(
  target: Group,
  lib: AssetLibrary,
  treeSpots: [number, number, number][],
  shrubSpots: [number, number, number][],
) {
  const barkMat = lib.std("bark", { color: "#5e4938", roughness: 0.96 });
  const leafDark = lib.std("leafDark", { color: "#3e5c34", roughness: 0.88 });
  const leafMid = lib.std("leafMid", { color: "#4f723e", roughness: 0.86 });
  const leafLight = lib.std("leafLight", { color: "#65894b", roughness: 0.85 });
  const rnd = mulberry32(901);

  const leafA: Matrix4[] = [];
  const leafB: Matrix4[] = [];
  const leafC: Matrix4[] = [];
  const qZero = new Quaternion();

  for (const [x, z, s] of treeSpots) {
    const trunkH = 2.3 * s;
    const trunk = new Mesh(new CylinderGeometry(0.11 * s, 0.21 * s, trunkH, 10), barkMat);
    trunk.position.set(x, trunkH / 2, z);
    target.add(shadowed(trunk));

    for (let b = 0; b < 3; b++) {
      const ang = (b * Math.PI * 2) / 3 + rnd() * 0.5;
      const br = new Mesh(new CylinderGeometry(0.045 * s, 0.08 * s, 1.3 * s, 7), barkMat);
      br.position.set(x + Math.cos(ang) * 0.35 * s, trunkH * 0.85 + 0.35 * s, z + Math.sin(ang) * 0.35 * s);
      br.rotation.z = -Math.cos(ang) * 0.45;
      br.rotation.x = Math.sin(ang) * 0.45;
      target.add(shadowed(br));
    }

    const crownY = trunkH + 1.1 * s;
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = (0.35 + rnd() * 1.15) * s;
      const dy = (rnd() - 0.38) * 1.55 * s;
      const rx = (0.72 + rnd() * 0.55) * s;
      const ry = rx * (0.72 + rnd() * 0.25);
      const rz = rx * (0.85 + rnd() * 0.28);
      const m = new Matrix4().compose(
        new Vector3(x + Math.cos(a) * rad, crownY + dy, z + Math.sin(a) * rad),
        qZero,
        new Vector3(rx, ry, rz),
      );
      if (dy < -0.15 * s) leafA.push(m);
      else if (dy > 0.35 * s) leafC.push(m);
      else leafB.push(m);
    }
  }

  for (const [x, z, s] of shrubSpots) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rnd() * 0.6;
      const d = (0.12 + rnd() * 0.28) * s;
      const r = (0.36 + rnd() * 0.22) * s;
      const m = new Matrix4().compose(
        new Vector3(x + Math.cos(a) * d, r * 0.72, z + Math.sin(a) * d),
        qZero,
        new Vector3(r * 1.15, r * 0.85, r * 1.05),
      );
      (i % 2 === 0 ? leafB : leafA).push(m);
    }
  }

  const addCanopy = (mats: Matrix4[], material: MeshStandardMaterial) => {
    if (!mats.length) return;
    const mesh = new InstancedMesh(new SphereGeometry(1, 14, 10), material, mats.length);
    mats.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    target.add(shadowed(mesh, true, true));
  };

  addCanopy(leafA, leafDark);
  addCanopy(leafB, leafMid);
  addCanopy(leafC, leafLight);
}

/** Builds a thick pitched gable roof with soffit, fascia, rake trim, ridge cap, gutters & downspouts. */
export function buildGableRoofBlock(
  target: Group,
  opts: {
    cx: number;
    cz: number;
    w: number;
    d: number;
    wallH: number;
    pitchDeg: number;
    overhang: number;
    gableOverhang: number;
    roofMat: MeshStandardMaterial;
    wallMat: MeshStandardMaterial;
    trimMat: MeshStandardMaterial;
    gutterMat: MeshStandardMaterial;
    seamMat?: MeshStandardMaterial;
    tileSize: number;
    sidingTile: number;
    downspouts: boolean;
    skipLeftGableWall?: boolean;
  },
): { frontFace: RoofFace; backFace: RoofFace; ridgeY: number; eaveY: number } {
  const {
    cx,
    cz,
    w,
    d,
    wallH,
    pitchDeg,
    overhang,
    gableOverhang,
    roofMat,
    wallMat,
    trimMat,
    gutterMat,
    seamMat,
    tileSize,
    sidingTile,
  } = opts;
  const A = (pitchDeg * Math.PI) / 180;
  const tanA = Math.tan(A);
  const sinA = Math.sin(A);
  const cosA = Math.cos(A);

  const Do = d / 2 + overhang;
  const Wo = w / 2 + gableOverhang;
  const eaveY = wallH - overhang * tanA;
  const ridgeY = wallH + (d / 2) * tanA;
  const L = Do / cosA;
  const thick = 0.2;
  const up = new Vector3(0, 1, 0);
  const down = new Vector3(0, -1, 0);
  const V = (x: number, y: number, z: number) => new Vector3(cx + x, y, cz + z);

  const fTop = [V(-Wo, eaveY, Do), V(Wo, eaveY, Do), V(Wo, ridgeY, 0), V(-Wo, ridgeY, 0)];
  const bTop = [V(Wo, eaveY, -Do), V(-Wo, eaveY, -Do), V(-Wo, ridgeY, 0), V(Wo, ridgeY, 0)];
  target.add(shadowed(new Mesh(polygon(fTop, tileSize, up), roofMat)));
  target.add(shadowed(new Mesh(polygon(bTop, tileSize, up), roofMat)));

  const fBot = [V(-Wo, eaveY - thick, Do), V(Wo, eaveY - thick, Do), V(Wo, ridgeY - thick, 0), V(-Wo, ridgeY - thick, 0)];
  const bBot = [V(Wo, eaveY - thick, -Do), V(-Wo, eaveY - thick, -Do), V(-Wo, ridgeY - thick, 0), V(Wo, ridgeY - thick, 0)];
  target.add(shadowed(new Mesh(polygon(fBot, 1, down), trimMat), false, true));
  target.add(shadowed(new Mesh(polygon(bBot, 1, down), trimMat), false, true));

  for (const sx of [-1, 1]) {
    const gx = sx * Wo;
    const fRake = [V(gx, eaveY, Do), V(gx, ridgeY, 0), V(gx, ridgeY - thick, 0), V(gx, eaveY - thick, Do)];
    const bRake = [V(gx, ridgeY, 0), V(gx, eaveY, -Do), V(gx, eaveY - thick, -Do), V(gx, ridgeY - thick, 0)];
    target.add(shadowed(new Mesh(polygon(fRake, 1, new Vector3(sx, 0, 0)), trimMat)));
    target.add(shadowed(new Mesh(polygon(bRake, 1, new Vector3(sx, 0, 0)), trimMat)));
  }

  for (const sx of [-1, 1]) {
    if (sx === -1 && opts.skipLeftGableWall) continue;
    const tri = new Mesh(
      polygon(
        [V((sx * w) / 2, wallH - 0.04, d / 2), V((sx * w) / 2, wallH - 0.04, -d / 2), V((sx * w) / 2, ridgeY - 0.04, 0)],
        sidingTile,
        new Vector3(sx, 0, 0),
      ),
      wallMat,
    );
    target.add(shadowed(tri));
  }

  for (const sz of [-1, 1]) {
    const fascia = new Mesh(new BoxGeometry(2 * Wo + 0.04, thick + 0.02, 0.06), trimMat);
    fascia.position.set(cx, eaveY - thick / 2, cz + sz * (Do + 0.01));
    target.add(shadowed(fascia, true, false));

    const gutter = new Mesh(new BoxGeometry(2 * Wo + 0.08, 0.13, 0.13), gutterMat);
    gutter.position.set(cx, eaveY - 0.06, cz + sz * (Do + 0.08));
    target.add(shadowed(gutter, true, true));

    if (opts.downspouts) {
      const dsX = cx + (sz > 0 ? -w / 2 + 0.12 : w / 2 - 0.12);
      const dsZ = cz + sz * (d / 2 + 0.09);
      const topH = eaveY - 0.12;
      const pipe = new Mesh(new BoxGeometry(0.085, topH - 0.18, 0.085), gutterMat);
      pipe.position.set(dsX, 0.18 + (topH - 0.18) / 2, dsZ);
      target.add(shadowed(pipe, true, false));
      const elbow = new Mesh(new BoxGeometry(0.085, 0.085, overhang + 0.12), gutterMat);
      elbow.position.set(dsX, topH - 0.05, cz + sz * (d / 2 + overhang / 2 + 0.05));
      target.add(shadowed(elbow, false, false));
    }
  }

  const ridgeCap = new Mesh(new BoxGeometry(2 * Wo + 0.06, 0.11, 0.34), roofMat);
  ridgeCap.position.set(cx, ridgeY + 0.02, cz);
  target.add(shadowed(ridgeCap));

  const frontFace: RoofFace = {
    origin: V(0, eaveY, Do),
    u: new Vector3(1, 0, 0),
    s: new Vector3(0, sinA, -cosA),
    n: new Vector3(0, cosA, sinA),
    length: L,
    halfWidthAt: () => Wo,
  };
  const backFace: RoofFace = {
    origin: V(0, eaveY, -Do),
    u: new Vector3(-1, 0, 0),
    s: new Vector3(0, sinA, cosA),
    n: new Vector3(0, cosA, -sinA),
    length: L,
    halfWidthAt: () => Wo,
  };

  if (seamMat) {
    addStandingSeams(target, frontFace, seamMat);
    addStandingSeams(target, backFace, seamMat);
  }

  return { frontFace, backFace, ridgeY, eaveY };
}

/** Builds a recessed architectural window with sill, header, sash muntins, sky-reflecting glass & optional shutters. */
export function addArchitecturalWindow(
  facade: Group,
  x: number,
  y: number,
  w: number,
  h: number,
  mats: {
    trim: MeshStandardMaterial;
    glass: MeshPhysicalMaterial;
    shutter?: MeshStandardMaterial;
    darkFrame?: MeshStandardMaterial;
  },
  withShutters = false,
) {
  const frameMat = mats.darkFrame ?? mats.trim;
  const topTrim = new Mesh(new BoxGeometry(w + 0.28, 0.13, 0.14), mats.trim);
  topTrim.position.set(x, y + h / 2 + 0.075, 0.07);
  const sill = new Mesh(new BoxGeometry(w + 0.3, 0.1, 0.18), mats.trim);
  sill.position.set(x, y - h / 2 - 0.05, 0.09);
  const leftCasing = new Mesh(new BoxGeometry(0.11, h + 0.04, 0.11), mats.trim);
  leftCasing.position.set(x - w / 2 - 0.055, y, 0.055);
  const rightCasing = new Mesh(new BoxGeometry(0.11, h + 0.04, 0.11), mats.trim);
  rightCasing.position.set(x + w / 2 + 0.055, y, 0.055);

  const glass = new Mesh(new PlaneGeometry(w, h), mats.glass);
  glass.position.set(x, y, 0.025);

  const railH = new Mesh(new BoxGeometry(w, 0.055, 0.06), frameMat);
  railH.position.set(x, y, 0.045);
  const railV = new Mesh(new BoxGeometry(0.042, h, 0.055), frameMat);
  railV.position.set(x, y, 0.042);

  facade.add(
    shadowed(topTrim, true, false),
    shadowed(sill, true, false),
    shadowed(leftCasing, false, false),
    shadowed(rightCasing, false, false),
    glass,
    shadowed(railH, false, false),
    shadowed(railV, false, false),
  );

  if (withShutters && mats.shutter) {
    const sw = Math.min(0.42, w * 0.34);
    for (const sx of [-1, 1]) {
      const sh = new Mesh(new BoxGeometry(sw, h + 0.04, 0.05), mats.shutter);
      sh.position.set(x + sx * (w / 2 + 0.11 + sw / 2), y, 0.045);
      facade.add(shadowed(sh, true, true));
    }
  }
}
