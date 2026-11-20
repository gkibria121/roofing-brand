import {
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Texture,
  type MeshStandardMaterialParameters,
} from "three";
import { getRoofMaterialDef } from "../catalogs/roofing";
import type { Material } from "../domain/schemas";
import {
  createChainLinkTexture,
  createDecalTexture,
  createFenceVinylTexture,
  createFenceWoodTexture,
  createRoofTextures,
  createSolarTexture,
  createSurfaceTextures,
  createWindowTexture,
  type ArchitecturalSurface,
  type DecalKind,
  type PBRTextures,
} from "./textures";
import type { FenceAssetProvider } from "./types";

/** Caches textures and materials so rebuilding the 3D scene never leaks GPU resources. */
export class AssetLibrary implements FenceAssetProvider {
  private roofTex = new Map<Material, PBRTextures>();
  private surfaceTex = new Map<ArchitecturalSurface, PBRTextures>();
  private decalTex = new Map<DecalKind, Texture>();
  private mats = new Map<string, MeshStandardMaterial>();
  private extra: Texture[] = [];
  private fenceWoodTex?: PBRTextures;
  private fenceVinylTex?: PBRTextures;
  private chainLinkTex?: Texture;

  constructor(private anisotropy: number) {}

  std(key: string, params: MeshStandardMaterialParameters): MeshStandardMaterial {
    let m = this.mats.get(key);
    if (!m) {
      m = new MeshStandardMaterial(params);
      this.mats.set(key, m);
    }
    return m;
  }

  surface(kind: ArchitecturalSurface, params: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
    let tex = this.surfaceTex.get(kind);
    if (!tex) {
      tex = createSurfaceTextures(kind, this.anisotropy);
      this.surfaceTex.set(kind, tex);
    }
    return this.std(`surf:${kind}`, {
      map: tex.map,
      bumpMap: tex.bumpMap,
      bumpScale: kind === "stone" ? 0.045 : kind === "brick" ? 0.035 : kind === "siding" ? 0.028 : 0.018,
      roughness: kind === "concrete" || kind === "grass" ? 0.94 : 0.85,
      ...params,
    });
  }

  glass(commercial = false): MeshPhysicalMaterial {
    const key = commercial ? "glass:com" : "glass:res";
    let m = this.mats.get(key) as MeshPhysicalMaterial | undefined;
    if (!m) {
      const tex = createWindowTexture(this.anisotropy, commercial);
      this.extra.push(tex);
      m = new MeshPhysicalMaterial({
        map: tex,
        color: "#ffffff",
        roughness: 0.07,
        metalness: 0.12,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.45,
      });
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
    const { pbr } = getRoofMaterialDef(kind);
    const m = this.std(`roof:${kind}`, {
      map: tex.map,
      bumpMap: tex.bumpMap,
      bumpScale: pbr.bump,
      roughness: pbr.roughness,
      metalness: pbr.metalness,
      envMapIntensity: kind === "metal" ? 1.25 : 0.7,
      side: DoubleSide,
    });
    m.color.set("#ffffff").lerp(new Color(kind === "tpo" ? "#a9a396" : "#8c867a"), weathering * 0.78);
    return m;
  }

  metalSeam(weathering: number): MeshStandardMaterial {
    const m = this.std("metalSeam", {
      color: "#606e79",
      roughness: 0.3,
      metalness: 0.72,
      envMapIntensity: 1.35,
    });
    m.color.set("#606e79").lerp(new Color("#4c5358"), weathering * 0.6);
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
      roughness: 0.98,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
  }

  solar(): MeshPhysicalMaterial {
    const key = "solar";
    let m = this.mats.get(key) as MeshPhysicalMaterial | undefined;
    if (!m) {
      const tex = createSolarTexture(this.anisotropy);
      this.extra.push(tex);
      m = new MeshPhysicalMaterial({
        map: tex,
        color: "#ffffff",
        roughness: 0.14,
        metalness: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.4,
      });
      this.mats.set(key, m);
    }
    return m;
  }

  fenceWood(colorHex: string): MeshStandardMaterial {
    if (!this.fenceWoodTex) {
      this.fenceWoodTex = createFenceWoodTexture(this.anisotropy);
      this.extra.push(this.fenceWoodTex.map, this.fenceWoodTex.bumpMap);
    }
    return this.std(`fence:wood:${colorHex}`, {
      map: this.fenceWoodTex.map,
      bumpMap: this.fenceWoodTex.bumpMap,
      bumpScale: 0.025,
      color: colorHex,
      roughness: 0.86,
      metalness: 0.0,
    });
  }

  fenceVinyl(colorHex: string): MeshStandardMaterial {
    if (!this.fenceVinylTex) {
      this.fenceVinylTex = createFenceVinylTexture(this.anisotropy);
      this.extra.push(this.fenceVinylTex.map, this.fenceVinylTex.bumpMap);
    }
    return this.std(`fence:vinyl:${colorHex}`, {
      map: this.fenceVinylTex.map,
      bumpMap: this.fenceVinylTex.bumpMap,
      bumpScale: 0.015,
      color: colorHex,
      roughness: 0.44,
      metalness: 0.02,
      envMapIntensity: 0.85,
    });
  }

  fenceChainLink(colorHex: string): MeshStandardMaterial {
    if (!this.chainLinkTex) {
      this.chainLinkTex = createChainLinkTexture(this.anisotropy);
      this.extra.push(this.chainLinkTex);
    }
    return this.std(`fence:chain:${colorHex}`, {
      map: this.chainLinkTex,
      color: colorHex,
      transparent: true,
      alphaTest: 0.35,
      side: DoubleSide,
      roughness: 0.36,
      metalness: 0.72,
    });
  }

  dispose() {
    for (const t of this.roofTex.values()) {
      t.map.dispose();
      t.bumpMap.dispose();
    }
    for (const t of this.surfaceTex.values()) {
      t.map.dispose();
      t.bumpMap.dispose();
    }
    for (const t of this.decalTex.values()) t.dispose();
    for (const t of this.extra) t.dispose();
    for (const m of this.mats.values()) m.dispose();
    this.roofTex.clear();
    this.surfaceTex.clear();
    this.decalTex.clear();
    this.mats.clear();
    this.extra = [];
    this.fenceWoodTex = undefined;
    this.fenceVinylTex = undefined;
    this.chainLinkTex = undefined;
  }
}

/** Free geometries and instanced buffers of a built group. Shared materials remain cached. */
export function disposeGroup(root: Object3D) {
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) (m.geometry as BufferGeometry).dispose();
    if ((o as InstancedMesh).isInstancedMesh) (o as InstancedMesh).dispose();
  });
}
