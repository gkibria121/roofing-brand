import type { Group, MeshStandardMaterial, MeshStandardMaterialParameters, Vector3 } from "three";
import type { BuildingType, FenceHeight, FencePlacement, Material, Slope, Stories } from "../domain/schemas";

export type FenceSceneConfig = {
  enabled: boolean;
  styleId: string;
  finishId: string;
  height: FenceHeight;
  placement: FencePlacement;
  gate: boolean;
};

export type SceneConfig = {
  slope: Slope;
  stories: Stories;
  buildingType: BuildingType;
  material: Material;
  /** 0 (like new) … 1 (heavily weathered). */
  weathering: number;
  damaged: boolean;
  solar: boolean;
  fence?: FenceSceneConfig;
};

export type KeepOutBlock = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Exterior vertical clearance ceiling at world (x, z), already including camera margin. */
  topY: (x: number, z: number) => number;
};

export type RoofFace = {
  origin: Vector3; // center of eave edge
  u: Vector3; // along eave
  s: Vector3; // up the slope
  n: Vector3; // outward normal
  length: number; // eave → ridge distance
  halfWidthAt: (s: number) => number;
};

export type House = {
  group: Group;
  /** Default camera orbit target. */
  target: Vector3;
  /** Close-up roof inspection target. */
  roofFocus: Vector3;
  /** Exterior keep-out volumes so the camera can never enter the building or roof. */
  keepOut: KeepOutBlock[];
  /** Approximate bounding radius, used for framing and shadow bounds. */
  radius: number;
  /** Plain-language description for assistive tech. */
  description: string;
};

export interface FenceAssetProvider {
  std(key: string, params: MeshStandardMaterialParameters): MeshStandardMaterial;
  fenceWood(colorHex: string): MeshStandardMaterial;
  fenceVinyl(colorHex: string): MeshStandardMaterial;
  fenceChainLink(colorHex: string): MeshStandardMaterial;
}
