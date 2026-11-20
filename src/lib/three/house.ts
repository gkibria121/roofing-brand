import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Texture,
  Vector3,
  type MeshStandardMaterialParameters,
} from "three";
import type { BuildingType, Material, Slope, Stories } from "@/lib/estimate/questions";
import {
  createDecalTexture,
  createRoofTextures,
  materialSpecs,
  mulberry32,
  type DecalKind,
  type RoofTextures,
} from "./textures";

export type SceneConfig = {
  slope: Slope;
  stories: Stories;
  buildingType: BuildingType;
  material: Material;
  /** 0 (like new) … 1 (heavily weathered). */
  weathering: number;
  damaged: boolean;
  solar: boolean;
};

const PITCH_DEG: Record<Exclude<Slope, "flat">, number> = { low: 18, moderate: 30, steep: 45 };

/** Caches textures and materials so rebuilding the model never re-allocates GPU resources. */
export class AssetLibrary {
  private roofTex = new Map<Material, RoofTextures>();
  private decalTex = new Map<DecalKind, Texture>();
  private mats = new Map<string, MeshStandardMaterial>();
  private extra: Texture[] = [];

  constructor(private anisotropy: number) {}

  std(key: string, params: MeshStandardMaterialParameters): MeshStandardMaterial {
    let m = this.mats.get(key);
    if (!m) {
      m = new MeshStandardMaterial(params);
      this.mats.set(key, m);
    }
    return m;
  }

  roof(kind: Material, weathering: number): MeshStandardMaterial {
    let tex = this.roofTex.get(kind);
    if (!tex) {
      tex = createRoofTextures(kind, this.anisotropy);
      this.roofTex.set(kind, tex);
    }
    const spec = materialSpecs[kind];
    const m = this.std(`roof:${kind}`, {
      map: tex.map,
      bumpMap: tex.bumpMap,
      bumpScale: spec.bump,
      roughness: spec.roughness,
      metalness: spec.metalness,
      side: DoubleSide,
    });
    // Weathering darkens and dulls the colour (texture colour is multiplied by this tint).
    m.color.set("#ffffff").lerp(new Color(kind === "tpo" ? "#a9a49a" : "#8f8a80"), weathering * 0.85);
    return m;
  }

  decal(kind: DecalKind): MeshStandardMaterial {
    let tex = this.decalTex.get(kind);
    if (!tex) {
      tex = createDecalTexture(kind, this.anisotropy);
      this.decalTex.set(kind, tex);
    }
    return this.std(`decal:${kind}`, {
      map: tex,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
  }

  solar(): MeshStandardMaterial {
    return this.std("solar", {
      map: this.solarTexture(),
      color: "#ffffff",
      roughness: 0.22,
      metalness: 0.55,
    });
  }

  private solarMap?: Texture;
  private solarTexture() {
    if (this.solarMap) return this.solarMap;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 432;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 256, 432);
    g.addColorStop(0, "#1f3b6b");
    g.addColorStop(1, "#142848");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 432);
    x.strokeStyle = "rgba(190,210,235,0.55)";
    x.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      x.beginPath();
      x.moveTo((256 / 6) * i, 0);
      x.lineTo((256 / 6) * i, 432);
      x.stroke();
    }
    for (let j = 1; j < 10; j++) {
      x.beginPath();
      x.moveTo(0, (432 / 10) * j);
      x.lineTo(256, (432 / 10) * j);
      x.stroke();
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = this.anisotropy;
    this.solarMap = t;
    this.extra.push(t);
    return t;
  }

  dispose() {
    for (const t of this.roofTex.values()) {
      t.map.dispose();
      t.bumpMap.dispose();
    }
    for (const t of this.decalTex.values()) t.dispose();
    for (const t of this.extra) t.dispose();
    for (const m of this.mats.values()) m.dispose();
    this.roofTex.clear();
    this.decalTex.clear();
    this.mats.clear();
    this.extra = [];
    this.solarMap = undefined;
  }
}

/** Free geometries (and instanced buffers) of a built group. Shared materials are kept. */
export function disposeGroup(root: Object3D) {
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) (m.geometry as BufferGeometry).dispose();
    if ((o as InstancedMesh).isInstancedMesh) (o as InstancedMesh).dispose();
  });
}

/** Planar convex polygon with UVs measured in metres / tile, so textures keep real-world scale. */
function polygon(verts: Vector3[], tile: number, facing: Vector3): BufferGeometry {
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

type RoofFace = {
  origin: Vector3; // middle of the eave edge
  u: Vector3; // along the eave
  s: Vector3; // up the slope
  n: Vector3; // outward normal
  length: number; // eave → ridge distance
  halfWidthAt: (s: number) => number;
};

function place(face: RoofFace, u: number, s: number, lift: number) {
  return face.origin.clone().addScaledVector(face.u, u).addScaledVector(face.s, s).addScaledVector(face.n, lift);
}

function faceQuat(face: RoofFace) {
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(face.u, face.s, face.n));
}

export type House = {
  group: Group;
  /** Point the camera looks at. */
  target: Vector3;
  /** Approximate bounding radius, used for framing and shadow bounds. */
  radius: number;
  /** Plain-language description for assistive tech. */
  description: string;
};

const shadowed = <T extends Mesh>(m: T, cast = true, receive = true) => {
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};

export function buildHouse(cfg: SceneConfig, lib: AssetLibrary): House {
  const group = new Group();
  const res = cfg.buildingType === "residential";
  const W = res ? 11 : 18;
  const D = res ? 8 : 12;
  const floors = cfg.stories === "single" ? 1 : res ? 2 : 3;
  const floorH = res ? 2.8 : 3.6;
  const wallH = floors * floorH;
  const flat = cfg.slope === "flat";
  const spec = materialSpecs[cfg.material];
  const R = Math.max(W, D) * 1.9;

  const wallMat = lib.std(res ? "wall:res" : "wall:com", { color: res ? "#ece6da" : "#d5dbe1", roughness: 0.9 });
  const trimMat = lib.std("trim", { color: "#ffffff", roughness: 0.6 });
  const glassMat = lib.std("glass", { color: "#7fa6c4", roughness: 0.08, metalness: 0.7 });
  const doorMat = lib.std("door", { color: res ? "#244a74" : "#1f2937", roughness: 0.5 });
  const groundMat = lib.std("ground", { color: "#dfe8d6", roughness: 1 });
  const pathMat = lib.std("path", { color: "#c4cad1", roughness: 0.95 });
  const brickMat = lib.std("brick", { color: "#a85f48", roughness: 0.95 });
  const metalGrey = lib.std("greymetal", { color: "#aeb6bd", roughness: 0.45, metalness: 0.6 });

  const add = (m: Mesh, cast = true, receive = true) => {
    group.add(shadowed(m, cast, receive));
    return m;
  };

  // --- Ground "diorama" disc, plinth and path ---------------------------------
  const ground = new Mesh(new CylinderGeometry(R, R, 0.5, 72), groundMat);
  ground.position.y = -0.25;
  add(ground, false, true);
  const path = new Mesh(new PlaneGeometry(1.6, R - D / 2), pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.012, D / 2 + (R - D / 2) / 2);
  add(path, false, true);

  const plinth = new Mesh(new BoxGeometry(W + 0.3, 0.35, D + 0.3), lib.std("plinth", { color: "#9aa3ab", roughness: 0.95 }));
  plinth.position.y = 0.175;
  add(plinth);

  // --- Walls ------------------------------------------------------------------
  const walls = new Mesh(new BoxGeometry(W, wallH, D), wallMat);
  walls.position.y = wallH / 2;
  add(walls);

  // Floor separation line
  for (let f = 1; f < floors; f++) {
    const band = new Mesh(new BoxGeometry(W + 0.12, 0.14, D + 0.12), trimMat);
    band.position.y = f * floorH;
    add(band);
  }

  // --- Windows & doors --------------------------------------------------------
  const facade = (side: "front" | "back" | "left" | "right") => {
    const g = new Group();
    if (side === "front") g.position.z = D / 2;
    if (side === "back") {
      g.position.z = -D / 2;
      g.rotation.y = Math.PI;
    }
    if (side === "right") {
      g.position.x = W / 2;
      g.rotation.y = Math.PI / 2;
    }
    if (side === "left") {
      g.position.x = -W / 2;
      g.rotation.y = -Math.PI / 2;
    }
    group.add(g);
    return g;
  };
  const windowAt = (g: Group, x: number, y: number, w: number, h: number) => {
    const frame = new Mesh(new BoxGeometry(w + 0.2, h + 0.2, 0.1), trimMat);
    frame.position.set(x, y, 0.04);
    const glass = new Mesh(new BoxGeometry(w, h, 0.08), glassMat);
    glass.position.set(x, y, 0.09);
    const mullion = new Mesh(new BoxGeometry(0.06, h, 0.1), trimMat);
    mullion.position.set(x, y, 0.1);
    g.add(shadowed(frame, true, false), shadowed(glass, false, false), shadowed(mullion, false, false));
  };

  const front = facade("front");
  const back = facade("back");
  const left = facade("left");
  const right = facade("right");

  if (res) {
    for (let f = 0; f < floors; f++) {
      const y = f * floorH + floorH * 0.58;
      const xs = f === 0 ? [-3.2, 3.2] : [-3.4, 0, 3.4];
      xs.forEach((x) => windowAt(front, x, y, 1.4, 1.3));
      [-3.4, 0, 3.4].forEach((x) => windowAt(back, x, y, 1.4, 1.3));
      [-1.6, 1.6].forEach((z) => {
        windowAt(left, z, y, 1.2, 1.3);
        windowAt(right, z, y, 1.2, 1.3);
      });
    }
    const door = new Mesh(new BoxGeometry(1.15, 2.2, 0.12), doorMat);
    door.position.set(0, 1.1 + 0.2, 0.06);
    const doorFrame = new Mesh(new BoxGeometry(1.45, 2.4, 0.1), trimMat);
    doorFrame.position.set(0, 1.2 + 0.2, 0.03);
    const step = new Mesh(new BoxGeometry(2, 0.2, 0.9), lib.std("step", { color: "#b8bfc6", roughness: 0.95 }));
    step.position.set(0, 0.1, 0.45);
    front.add(shadowed(doorFrame), shadowed(door), shadowed(step));
  } else {
    // Storefront on the ground floor, ribbon windows above.
    windowAt(front, -4.2, 1.5, 5.6, 2.3);
    windowAt(front, 4.2, 1.5, 5.6, 2.3);
    const door = new Mesh(new BoxGeometry(2.2, 2.5, 0.12), doorMat);
    door.position.set(0, 1.45, 0.07);
    front.add(shadowed(door));
    const sign = new Mesh(new BoxGeometry(7, 0.7, 0.14), lib.std("sign", { color: "#0f2a4a", roughness: 0.6 }));
    sign.position.set(0, floorH - 0.55, 0.08);
    front.add(shadowed(sign));
    for (let f = 1; f < floors; f++) {
      const y = f * floorH + floorH * 0.55;
      [-6.4, -3.8, -1.3, 1.3, 3.8, 6.4].forEach((x) => windowAt(front, x, y, 2, 1.7));
      [-6.4, -3.8, -1.3, 1.3, 3.8, 6.4].forEach((x) => windowAt(back, x, y, 2, 1.7));
      [-3.5, 0, 3.5].forEach((z) => {
        windowAt(left, z, y, 2, 1.7);
        windowAt(right, z, y, 2, 1.7);
      });
    }
    [-4.5, 4.5].forEach((x) => windowAt(back, x, 1.7, 2.4, 1.6));
    [-3, 3].forEach((z) => {
      windowAt(left, z, 1.7, 2, 1.6);
      windowAt(right, z, 1.7, 2, 1.6);
    });
  }

  // --- Roof -------------------------------------------------------------------
  const roofMat = lib.roof(cfg.material, cfg.weathering);
  const faces: RoofFace[] = [];
  let roofTopY: number;

  if (flat) {
    const t = res ? 0.4 : 0.55; // parapet height
    const th = 0.3;
    const coping = lib.std("coping", { color: "#cfd4d9", roughness: 0.7 });
    const parapets: [number, number, number, number, number][] = [
      [0, D / 2 - th / 2, W, th, t],
      [0, -D / 2 + th / 2, W, th, t],
      [W / 2 - th / 2, 0, th, D - 2 * th, t],
      [-W / 2 + th / 2, 0, th, D - 2 * th, t],
    ];
    for (const [x, z, w, d, h] of parapets) {
      const p = new Mesh(new BoxGeometry(w, h, d), wallMat);
      p.position.set(x, wallH + h / 2, z);
      add(p);
      const c = new Mesh(new BoxGeometry(w + 0.08, 0.08, d + 0.08), coping);
      c.position.set(x, wallH + h + 0.04, z);
      add(c);
    }
    const iw = W - 2 * th;
    const id = D - 2 * th;
    roofTopY = wallH + 0.1;
    const geo = new PlaneGeometry(iw, id);
    geo.rotateX(-Math.PI / 2);
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * iw) / spec.tile, (uv.getY(i) * id) / spec.tile);
    const top = new Mesh(geo, roofMat);
    top.position.y = roofTopY;
    add(top, false, true);
    faces.push({
      origin: new Vector3(0, roofTopY, id / 2),
      u: new Vector3(1, 0, 0),
      s: new Vector3(0, 0, -1),
      n: new Vector3(0, 1, 0),
      length: id,
      halfWidthAt: () => iw / 2,
    });
    faces.push({
      origin: new Vector3(0, roofTopY, -id / 2),
      u: new Vector3(-1, 0, 0),
      s: new Vector3(0, 0, 1),
      n: new Vector3(0, 1, 0),
      length: id,
      halfWidthAt: () => iw / 2,
    });
    // Rooftop equipment
    const unitMat = lib.std("hvac", { color: "#c9d0d6", roughness: 0.5, metalness: 0.4 });
    const fanMat = lib.std("fan", { color: "#2b3138", roughness: 0.6 });
    const units: [number, number][] = res ? [] : [[-5.2, -2.6], [-1.6, -2.8], [5.2, -2.2]];
    for (const [x, z] of units) {
      const b = new Mesh(new BoxGeometry(2.2, 1.1, 1.6), unitMat);
      b.position.set(x, roofTopY + 0.55 + 0.15, z);
      const feet = new Mesh(new BoxGeometry(2.0, 0.3, 1.4), lib.std("curb", { color: "#8a9199" }));
      feet.position.set(x, roofTopY + 0.15, z);
      const fan = new Mesh(new CylinderGeometry(0.5, 0.5, 0.08, 20), fanMat);
      fan.position.set(x + 0.4, roofTopY + 1.3, z);
      add(b);
      add(feet);
      add(fan);
    }
    if (res) {
      [-2.2, 2.5].forEach((x) => {
        const pipe = new Mesh(new CylinderGeometry(0.08, 0.08, 0.7, 12), metalGrey);
        pipe.position.set(x, roofTopY + 0.35, -1.2);
        add(pipe);
      });
    }
  } else {
    const A = (PITCH_DEG[cfg.slope as Exclude<Slope, "flat">] * Math.PI) / 180;
    const tanA = Math.tan(A);
    const sinA = Math.sin(A);
    const cosA = Math.cos(A);
    const oh = 0.6;
    const Do = D / 2 + oh;
    const eaveY = wallH - oh * tanA;
    const ridgeY = wallH + (D / 2) * tanA;
    const L = Do / cosA;
    const up = new Vector3(0, 1, 0);
    const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
    roofTopY = ridgeY;

    const frontFace: RoofFace = {
      origin: V(0, eaveY, Do),
      u: V(1, 0, 0),
      s: V(0, sinA, -cosA),
      n: V(0, cosA, sinA),
      length: L,
      halfWidthAt: () => 0,
    };
    const backFace: RoofFace = {
      origin: V(0, eaveY, -Do),
      u: V(-1, 0, 0),
      s: V(0, sinA, cosA),
      n: V(0, cosA, -sinA),
      length: L,
      halfWidthAt: () => 0,
    };

    if (res) {
      // Gable roof
      const Wo = W / 2 + 0.4;
      frontFace.halfWidthAt = backFace.halfWidthAt = () => Wo;
      add(new Mesh(polygon([V(-Wo, eaveY, Do), V(Wo, eaveY, Do), V(Wo, ridgeY, 0), V(-Wo, ridgeY, 0)], spec.tile, up), roofMat));
      add(new Mesh(polygon([V(Wo, eaveY, -Do), V(-Wo, eaveY, -Do), V(-Wo, ridgeY, 0), V(Wo, ridgeY, 0)], spec.tile, up), roofMat));
      // Gable-end triangles
      for (const sx of [-1, 1]) {
        const tri = new Mesh(
          polygon([V(sx * W / 2, wallH - 0.02, D / 2), V(sx * W / 2, wallH - 0.02, -D / 2), V(sx * W / 2, ridgeY, 0)], 1, V(sx, 0, 0)),
          wallMat,
        );
        add(tri);
      }
      // Ridge cap
      const ridge = new Mesh(new BoxGeometry(2 * Wo, 0.14, 0.3), roofMat);
      ridge.position.set(0, ridgeY + 0.04, 0);
      add(ridge);
      // Chimney
      const top = ridgeY + 0.9;
      const bottom = wallH - 0.4;
      const chim = new Mesh(new BoxGeometry(0.95, top - bottom, 0.95), brickMat);
      chim.position.set(W * 0.22, (top + bottom) / 2, -D * 0.1);
      add(chim);
      const cap = new Mesh(new BoxGeometry(1.15, 0.12, 1.15), lib.std("chimcap", { color: "#8d9298", roughness: 0.8 }));
      cap.position.set(W * 0.22, top + 0.06, -D * 0.1);
      add(cap);
    } else {
      // Hip roof
      const Wo = W / 2 + oh;
      const rx = (W - D) / 2;
      frontFace.halfWidthAt = backFace.halfWidthAt = (s) => Wo + (rx - Wo) * Math.min(1, s / L);
      add(new Mesh(polygon([V(-Wo, eaveY, Do), V(Wo, eaveY, Do), V(rx, ridgeY, 0), V(-rx, ridgeY, 0)], spec.tile, up), roofMat));
      add(new Mesh(polygon([V(Wo, eaveY, -Do), V(-Wo, eaveY, -Do), V(-rx, ridgeY, 0), V(rx, ridgeY, 0)], spec.tile, up), roofMat));
      add(new Mesh(polygon([V(Wo, eaveY, Do), V(Wo, eaveY, -Do), V(rx, ridgeY, 0)], spec.tile, up), roofMat));
      add(new Mesh(polygon([V(-Wo, eaveY, -Do), V(-Wo, eaveY, Do), V(-rx, ridgeY, 0)], spec.tile, up), roofMat));
    }
    faces.push(frontFace, backFace);

    // Fascia along the eaves
    const fasciaLen = (res ? W + 0.8 : W + 2 * oh);
    for (const sz of [-1, 1]) {
      const f = new Mesh(new BoxGeometry(fasciaLen, 0.16, 0.08), trimMat);
      f.position.set(0, eaveY - 0.04, sz * (Do + 0.02));
      add(f, true, false);
    }
  }

  // --- Damage / weathering decals ---------------------------------------------
  const rnd = mulberry32(2024);
  const addDecal = (kind: DecalKind, face: RoofFace, uFrac: number, sFrac: number, size: number) => {
    const hw = face.halfWidthAt(face.length * sFrac);
    const m = new Mesh(new PlaneGeometry(size, size), lib.decal(kind));
    m.position.copy(place(face, uFrac * hw, face.length * sFrac, 0.03));
    m.quaternion.copy(faceQuat(face));
    m.rotateZ(rnd() * Math.PI * 2);
    group.add(m);
  };
  const [ff, bf] = faces;
  if (cfg.damaged) {
    addDecal("damage", ff, -0.45, 0.35, 1.9);
    addDecal("damage", ff, 0.35, 0.62, 1.5);
    addDecal("damage", ff, 0.05, 0.22, 1.1);
    addDecal("damage", bf, 0.2, 0.5, 1.7);
    addDecal("stain", ff, -0.2, 0.55, 3.4);
  }
  const mossCount = Math.round(cfg.weathering * 6);
  for (let i = 0; i < mossCount; i++) {
    const face = i % 3 === 2 ? bf : ff;
    addDecal("moss", face, (rnd() - 0.5) * 1.5, 0.15 + rnd() * 0.7, 1.4 + rnd() * 1.6);
  }
  if (cfg.weathering > 0.3) addDecal("stain", ff, 0.55, 0.4, 2.8);

  // --- Solar panels -----------------------------------------------------------
  if (cfg.solar) {
    const pw = 1.05;
    const ph = 1.75;
    const gap = 0.08;
    const matrices: Matrix4[] = [];
    const strutMatrices: Matrix4[] = [];
    const q = new Quaternion();
    const one = new Vector3(1, 1, 1);
    const hvacZones: [number, number][] = flat && !res ? [[-5.2, -2.6], [-1.6, -2.8], [5.2, -2.2]] : [];
    const hitsHvac = (x: number, z: number) =>
      hvacZones.some(([hx, hz]) => Math.abs(x - hx) < 2.2 && Math.abs(z - hz) < 2.1);

    if (flat) {
      const tilt = (14 * Math.PI) / 180;
      const face = ff;
      const cols = Math.floor((2 * (face.halfWidthAt(0) - 1.1) + gap) / (pw + gap));
      const rows = Math.max(1, Math.floor((face.length - 2.4) / 2.5) + 1);
      q.setFromAxisAngle(new Vector3(1, 0, 0), tilt);
      const panelY = roofTopY + 0.18 + (ph / 2) * Math.sin(tilt);
      const strutH = (panelY - roofTopY) * 0.95;
      for (let r = 0; r < rows; r++) {
        const z = face.origin.z - 1.5 - r * 2.5;
        for (let c = 0; c < cols; c++) {
          const x = (c - (cols - 1) / 2) * (pw + gap);
          if (hitsHvac(x, z)) continue;
          matrices.push(new Matrix4().compose(new Vector3(x, panelY, z), q, one));
          strutMatrices.push(new Matrix4().compose(new Vector3(x, roofTopY + strutH / 2, z - 0.35), new Quaternion(), new Vector3(1, strutH, 1)));
        }
      }
    } else {
      const face = ff;
      q.copy(new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(face.u, face.n, new Vector3().crossVectors(face.u, face.n))));
      for (let s0 = 0.55; s0 + ph <= face.length - 0.45; s0 += ph + gap) {
        const half = face.halfWidthAt(s0 + ph) - 0.65;
        const cols = Math.floor((2 * half + gap) / (pw + gap));
        for (let c = 0; c < cols; c++) {
          const u = (c - (cols - 1) / 2) * (pw + gap);
          matrices.push(new Matrix4().compose(place(face, u, s0 + ph / 2, 0.09), q, one));
        }
      }
    }
    if (matrices.length) {
      const panels = new InstancedMesh(new BoxGeometry(pw, 0.05, ph), lib.solar(), matrices.length);
      const frames = new InstancedMesh(new BoxGeometry(pw + 0.07, 0.04, ph + 0.07), metalGrey, matrices.length);
      matrices.forEach((m, i) => {
        panels.setMatrixAt(i, m);
        const lowered = m.clone().multiply(new Matrix4().makeTranslation(0, -0.03, 0));
        frames.setMatrixAt(i, lowered);
      });
      panels.instanceMatrix.needsUpdate = frames.instanceMatrix.needsUpdate = true;
      add(panels);
      add(frames);
      if (strutMatrices.length) {
        const struts = new InstancedMesh(new BoxGeometry(0.12, 1, 0.12), metalGrey, strutMatrices.length);
        strutMatrices.forEach((m, i) => struts.setMatrixAt(i, m));
        struts.instanceMatrix.needsUpdate = true;
        add(struts);
      }
    }
  }

  // --- Landscaping ------------------------------------------------------------
  const trunk = lib.std("trunk", { color: "#7a5c3f", roughness: 1 });
  const leafA = lib.std("leafA", { color: "#86b374", roughness: 1, flatShading: true });
  const leafB = lib.std("leafB", { color: "#6f9e5f", roughness: 1, flatShading: true });
  const treeSpots: [number, number, number][] = [
    [-W / 2 - 4.5, -D / 2 - 1.5, 1.15],
    [W / 2 + 4.8, -D / 2 + 1, 1.35],
    [-W / 2 - 3.5, D / 2 + 3.5, 0.85],
    [W / 2 + 3.6, D / 2 + 4.2, 1.0],
    [0.5 * W, -D / 2 - 4.5, 1.2],
  ];
  for (const [x, z, s] of treeSpots) {
    const t = new Group();
    const tr = new Mesh(new CylinderGeometry(0.16, 0.22, 1.5, 8), trunk);
    tr.position.y = 0.75;
    const l1 = new Mesh(new IcosahedronGeometry(1.35, 0), leafA);
    l1.position.y = 2.4;
    const l2 = new Mesh(new IcosahedronGeometry(0.95, 0), leafB);
    l2.position.set(0.4, 3.3, 0.2);
    t.add(shadowed(tr), shadowed(l1), shadowed(l2));
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    group.add(t);
  }

  const radius = Math.hypot(W, D, roofTopY * 0.9) * 0.62;
  const storyText = floors === 1 ? "single-story" : `${floors}-story`;
  const description =
    `3D model of a ${storyText} ${res ? "residential house" : "commercial building"} with a ${cfg.slope} slope ` +
    `${cfg.material === "tpo" ? "TPO" : cfg.material === "epdm" ? "EPDM" : cfg.material === "modbit" ? "modified bitumen" : cfg.material} roof` +
    `${cfg.damaged ? ", showing damaged areas" : ""}${cfg.solar ? ", with solar panels" : ""}. Drag to rotate.`;

  return { group, target: new Vector3(0, roofTopY * 0.45, 0), radius, description };
}
