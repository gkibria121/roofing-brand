import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { getRoofMaterialDef } from "../catalogs/roofing";
import type { Slope } from "../domain/schemas";
import type { AssetLibrary } from "./assets";
import { buildFence } from "./fence";
import {
  addArchitecturalWindow,
  addLandscaping,
  addStandingSeams,
  buildGableRoofBlock,
  faceQuat,
  place,
  polygon,
  shadowed,
  worldBox,
} from "./geometry";
import { mulberry32, type DecalKind } from "./textures";
import type { House, KeepOutBlock, RoofFace, SceneConfig } from "./types";

const PITCH_DEG: Record<Exclude<Slope, "flat">, number> = { low: 18, moderate: 30, steep: 45 };

export function buildHouse(cfg: SceneConfig, lib: AssetLibrary): House {
  const root = new Group();
  const res = cfg.buildingType === "residential";
  const flat = cfg.slope === "flat";
  const spec = getRoofMaterialDef(cfg.material).pbr;

  const roofMat = lib.roof(cfg.material, cfg.weathering);
  const seamMat = cfg.material === "metal" && !flat ? lib.metalSeam(cfg.weathering) : undefined;
  const trimMat = lib.std("trim", { color: "#f7f6f2", roughness: 0.55 });
  const gutterMat = lib.std("gutter", { color: "#e8eaec", roughness: 0.42, metalness: 0.35 });
  const shutterMat = lib.std("shutter", { color: "#273545", roughness: 0.65 });
  const doorMat = lib.std("door", { color: "#1c3654", roughness: 0.48 });
  const bronzeMat = lib.std("bronze", { color: "#2c3138", roughness: 0.38, metalness: 0.62 });
  const copingMat = lib.std("coping", { color: "#c8cfd6", roughness: 0.4, metalness: 0.55 });
  const metalGrey = lib.std("greymetal", { color: "#9da6af", roughness: 0.38, metalness: 0.68 });
  const mulchMat = lib.std("mulch", { color: "#4a3728", roughness: 0.98 });
  const warmLightMat = lib.std("sconceLight", { color: "#fff1cf", emissive: "#f5c470", emissiveIntensity: 0.65, roughness: 0.3 });

  const sidingMat = lib.surface("siding");
  const stoneMat = lib.surface("stone");
  const brickMat = lib.surface("brick");
  const concreteMat = lib.surface("concrete");
  const grassMat = lib.surface("grass");
  const comWallMat = lib.surface("commercialWall");
  const glassRes = lib.glass(false);
  const glassCom = lib.glass(true);

  const add = (parent: Group, m: Mesh, cast = true, receive = true) => {
    parent.add(shadowed(m, cast, receive));
    return m;
  };

  // Expansive circular yard ground that fades smoothly into atmospheric horizon fog (no square corners)
  const yardGeo = new CircleGeometry(140, 64);
  yardGeo.rotateX(-Math.PI / 2);
  const yuv = yardGeo.getAttribute("uv");
  for (let i = 0; i < yuv.count; i++) yuv.setXY(i, yuv.getX(i) * 44, yuv.getY(i) * 44);
  const yard = new Mesh(yardGeo, grassMat);
  yard.position.y = -0.01;
  add(root, yard, false, true);

  const faces: RoofFace[] = [];
  const keepOut: KeepOutBlock[] = [];
  const camPad = 1.0;
  let roofTopY = 5;
  let radius = 12;
  let roofFocus = new Vector3(0, 4.5, 1.5);
  const floors = cfg.stories === "single" ? 1 : res ? 2 : 3;

  if (res) {
    // Center the house + attached garage assembly around X = 0
    const ox = -2.35;
    const bldg = new Group();
    bldg.position.x = ox;
    root.add(bldg);

    const W = 11.4;
    const D = 8.4;
    const floorH = floors === 1 ? 3.25 : 2.95;
    const wallH = floors * floorH;
    const foundH = 0.52;
    const mainOverhang = 0.58;
    const mainEaveY = flat ? wallH : wallH - mainOverhang * Math.tan((PITCH_DEG[cfg.slope as Exclude<Slope, "flat">] * Math.PI) / 180);

    // --- Main House Body ---
    const mainWalls = new Mesh(worldBox(W, wallH - foundH, D, 2.6, 2.2), sidingMat);
    mainWalls.position.set(0, foundH + (wallH - foundH) / 2, 0);
    add(bldg, mainWalls);

    // Cultured stone foundation skirt + limestone sill cap
    const foundation = new Mesh(worldBox(W + 0.14, foundH, D + 0.14, 2.0, 1.0), stoneMat);
    foundation.position.set(0, foundH / 2, 0);
    add(bldg, foundation);
    const sillCap = new Mesh(new BoxGeometry(W + 0.2, 0.08, D + 0.2), copingMat);
    sillCap.position.set(0, foundH + 0.02, 0);
    add(bldg, sillCap, true, false);

    // Crisp white corner trim boards & story belly-band
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const cb = new Mesh(new BoxGeometry(0.18, wallH - foundH, 0.18), trimMat);
        cb.position.set(sx * (W / 2 - 0.02), foundH + (wallH - foundH) / 2, sz * (D / 2 - 0.02));
        add(bldg, cb, false, false);
      }
    }
    if (floors > 1) {
      const band = new Mesh(new BoxGeometry(W + 0.1, 0.15, D + 0.1), trimMat);
      band.position.set(0, floorH, 0);
      add(bldg, band, true, false);
    }

    // --- Attached Garage Wing (right side, stepped slightly back) ---
    const gW = 5.8;
    const gD = 6.8;
    const gCx = W / 2 + gW / 2 - 0.05;
    const gCz = 0.45; // front face at z = 3.85 (0.35m stepped back from main facade)
    const gWallH = floors === 1 ? 3.02 : 3.05;

    const gWalls = new Mesh(worldBox(gW, gWallH - 0.3, gD, 2.6, 2.2), sidingMat);
    gWalls.position.set(gCx, 0.3 + (gWallH - 0.3) / 2, gCz);
    add(bldg, gWalls);
    const gFound = new Mesh(worldBox(gW + 0.08, 0.34, gD + 0.04, 2.0, 1.0), stoneMat);
    gFound.position.set(gCx, 0.17, gCz);
    add(bldg, gFound);
    for (const sz of [-1, 1]) {
      const cb = new Mesh(new BoxGeometry(0.18, gWallH - 0.3, 0.18), trimMat);
      cb.position.set(gCx + gW / 2 - 0.02, 0.3 + (gWallH - 0.3) / 2, gCz + sz * (gD / 2 - 0.02));
      add(bldg, cb, false, false);
    }

    // Double carriage garage door with non-overlapping 3-piece casing, section grooves & transom lites
    const gdW = 4.55;
    const gdH = 2.22;
    const gdZ = gCz + gD / 2;
    const gdHeader = new Mesh(new BoxGeometry(gdW + 0.36, 0.16, 0.13), trimMat);
    gdHeader.position.set(gCx, gdH + 0.085, gdZ + 0.07);
    const gdLeftJamb = new Mesh(new BoxGeometry(0.16, gdH, 0.12), trimMat);
    gdLeftJamb.position.set(gCx - gdW / 2 - 0.085, gdH / 2, gdZ + 0.065);
    const gdRightJamb = new Mesh(new BoxGeometry(0.16, gdH, 0.12), trimMat);
    gdRightJamb.position.set(gCx + gdW / 2 + 0.085, gdH / 2, gdZ + 0.065);
    const gdPanel = new Mesh(new BoxGeometry(gdW, gdH, 0.06), lib.std("garageDoor", { color: "#ebe9e2", roughness: 0.62 }));
    gdPanel.position.set(gCx, gdH / 2, gdZ + 0.06);
    add(bldg, gdHeader, true, false);
    add(bldg, gdLeftJamb, true, false);
    add(bldg, gdRightJamb, true, false);
    add(bldg, gdPanel, true, true);
    // Horizontal garage door section seams
    const seamLineMat = lib.std("groove", { color: "#9fa3a8", roughness: 0.85 });
    for (let r = 1; r <= 3; r++) {
      const groove = new Mesh(new BoxGeometry(gdW - 0.06, 0.032, 0.02), seamLineMat);
      groove.position.set(gCx, (gdH / 4) * r, gdZ + 0.105);
      add(bldg, groove, false, false);
    }
    // 4 carriage top transom glass lites with separated trim frames
    for (let i = 0; i < 4; i++) {
      const lx = gCx - gdW * 0.36 + i * (gdW * 0.24);
      const paneFrame = new Mesh(new BoxGeometry(0.84, 0.38, 0.024), trimMat);
      paneFrame.position.set(lx, gdH - 0.28, gdZ + 0.105);
      const pane = new Mesh(new PlaneGeometry(0.74, 0.29), glassRes);
      pane.position.set(lx, gdH - 0.28, gdZ + 0.132);
      bldg.add(paneFrame, pane);
    }
    // Garage coach lights
    for (const sx of [-1, 1]) {
      const lx = gCx + sx * (gdW / 2 + 0.36);
      const sconce = new Mesh(new BoxGeometry(0.14, 0.28, 0.14), bronzeMat);
      sconce.position.set(lx, 1.95, gdZ + 0.08);
      const bulb = new Mesh(new BoxGeometry(0.09, 0.16, 0.06), warmLightMat);
      bulb.position.set(lx, 1.92, gdZ + 0.175);
      add(bldg, sconce, false, false);
      add(bldg, bulb, false, false);
    }

    // --- Concrete Driveway & Front Walkway ---
    const driveLen = 14;
    const drive = new Mesh(worldBox(5.3, 0.08, driveLen, 3.2, 3.2), concreteMat);
    drive.position.set(gCx, 0.03, gdZ + 0.14 + driveLen / 2);
    add(bldg, drive, false, true);

    const walkLen = 9.5;
    const walk = new Mesh(worldBox(1.55, 0.07, walkLen, 2.5, 2.5), concreteMat);
    walk.position.set(0, 0.025, D / 2 + 2.2 + walkLen / 2);
    add(bldg, walk, false, true);
    // Connector path strictly between walkway edge and driveway edge (no overlapping slabs)
    const connectLeft = 0.78;
    const connectRight = gCx - 2.65;
    const connectW = Math.max(0.5, connectRight - connectLeft);
    const connect = new Mesh(worldBox(connectW, 0.07, 1.35, 2.5, 2.5), concreteMat);
    connect.position.set((connectLeft + connectRight) / 2, 0.025, D / 2 + 4.2);
    add(bldg, connect, false, true);

    // Mulch foundation beds along front of main house
    for (const sx of [-1, 1]) {
      const bed = new Mesh(new BoxGeometry(3.35, 0.12, 1.45), mulchMat);
      bed.position.set(sx * 3.8, 0.05, D / 2 + 0.72);
      add(bldg, bed, false, true);
    }

    // --- Covered Front Porch ---
    const pW = 4.6;
    const pD = 2.05;
    const pZ = D / 2 + pD / 2;
    const porchDeck = new Mesh(worldBox(pW, foundH, pD, 2.0, 1.0), stoneMat);
    porchDeck.position.set(0, foundH / 2, pZ);
    const porchCap = new Mesh(worldBox(pW + 0.12, 0.08, pD + 0.12, 2.6, 2.6), concreteMat);
    porchCap.position.set(0, foundH + 0.03, pZ);
    add(bldg, porchDeck);
    add(bldg, porchCap, true, true);

    // 3 concrete front porch steps
    for (let st = 0; st < 3; st++) {
      const h = (foundH / 3) * (3 - st);
      const step = new Mesh(worldBox(2.2, h, 0.36, 2.4, 2.4), concreteMat);
      step.position.set(0, h / 2, D / 2 + pD + 0.18 + st * 0.34);
      add(bldg, step, true, true);
    }

    // Porch columns (stone pier bases + craftsman white posts)
    const colXs = [-pW / 2 + 0.25, -1.12, 1.12, pW / 2 - 0.25];
    const porchBeamY = floors === 1 && !flat ? Math.min(2.62, mainEaveY - 0.22) : floorH - 0.16;
    for (const cx of colXs) {
      const pier = new Mesh(worldBox(0.46, 0.85, 0.46, 1.6, 1.0), stoneMat);
      pier.position.set(cx, foundH + 0.425, D / 2 + pD - 0.24);
      const pCap = new Mesh(new BoxGeometry(0.54, 0.07, 0.54), copingMat);
      pCap.position.set(cx, foundH + 0.88, D / 2 + pD - 0.24);
      const postH = porchBeamY - (foundH + 0.91);
      const post = new Mesh(new BoxGeometry(0.22, postH, 0.22), trimMat);
      post.position.set(cx, foundH + 0.91 + postH / 2, D / 2 + pD - 0.24);
      add(bldg, pier);
      add(bldg, pCap, true, false);
      add(bldg, post);
    }
    // Porch railings on left & right wings
    for (const [x1, x2] of [[-pW / 2 + 0.25, -1.12], [1.12, pW / 2 - 0.25]]) {
      const rw = x2 - x1;
      const topRail = new Mesh(new BoxGeometry(rw, 0.07, 0.09), trimMat);
      topRail.position.set((x1 + x2) / 2, foundH + 0.84, D / 2 + pD - 0.24);
      const botRail = new Mesh(new BoxGeometry(rw, 0.06, 0.08), trimMat);
      botRail.position.set((x1 + x2) / 2, foundH + 0.16, D / 2 + pD - 0.24);
      add(bldg, topRail, false, false);
      add(bldg, botRail, false, false);
      for (let bx = x1 + 0.22; bx < x2 - 0.14; bx += 0.18) {
        const bal = new Mesh(new BoxGeometry(0.035, 0.66, 0.035), trimMat);
        bal.position.set(bx, foundH + 0.5, D / 2 + pD - 0.24);
        add(bldg, bal, false, false);
      }
    }
    // Porch beam header
    const porchBeam = new Mesh(new BoxGeometry(pW + 0.1, 0.24, 0.26), trimMat);
    porchBeam.position.set(0, porchBeamY + 0.06, D / 2 + pD - 0.24);
    add(bldg, porchBeam);

    // Porch roof (sloped shed roof on pitched homes, clean flat canopy on flat homes)
    if (flat) {
      const pCanopy = new Mesh(new BoxGeometry(pW + 0.35, 0.22, pD + 0.28), trimMat);
      pCanopy.position.set(0, porchBeamY + 0.24, pZ + 0.06);
      const pTop = new Mesh(new BoxGeometry(pW + 0.22, 0.06, pD + 0.18), roofMat);
      pTop.position.set(0, porchBeamY + 0.36, pZ + 0.06);
      add(bldg, pCanopy);
      add(bldg, pTop);
    } else {
      const pEaveZ = D / 2 + pD + 0.24;
      const pWallZ = D / 2 - 0.02;
      const pLowY = porchBeamY + 0.14;
      // On 1-story homes tuck the porch roof seamlessly beneath the main roof plane;
      // on 2-story homes pitch cleanly into the upper facade wall.
      const pHighY = floors === 1 ? Math.min(wallH - 0.04, pLowY + 0.44) : pLowY + 0.58;
      const pHalfW = pW / 2 + 0.24;
      const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
      const pRoofTop = [V(-pHalfW, pLowY, pEaveZ), V(pHalfW, pLowY, pEaveZ), V(pHalfW, pHighY, pWallZ), V(-pHalfW, pHighY, pWallZ)];
      const pRoofBot = [V(-pHalfW, pLowY - 0.14, pEaveZ), V(pHalfW, pLowY - 0.14, pEaveZ), V(pHalfW, pHighY - 0.14, pWallZ), V(-pHalfW, pHighY - 0.14, pWallZ)];
      add(bldg, new Mesh(polygon(pRoofTop, spec.tile, new Vector3(0, 1, 0)), roofMat));
      add(bldg, new Mesh(polygon(pRoofBot, 1, new Vector3(0, -1, 0)), trimMat), false, true);
      const pFascia = new Mesh(new BoxGeometry(2 * pHalfW + 0.04, 0.16, 0.07), trimMat);
      pFascia.position.set(0, pLowY - 0.06, pEaveZ + 0.01);
      const pGutter = new Mesh(new BoxGeometry(2 * pHalfW + 0.08, 0.11, 0.11), gutterMat);
      pGutter.position.set(0, pLowY - 0.05, pEaveZ + 0.08);
      add(bldg, pFascia, true, false);
      add(bldg, pGutter, true, false);
      for (const sx of [-1, 1]) {
        const sideTri = [V(sx * pHalfW, pLowY, pEaveZ), V(sx * pHalfW, pHighY, pWallZ), V(sx * pHalfW, pLowY - 0.14, pWallZ), V(sx * pHalfW, pLowY - 0.14, pEaveZ)];
        add(bldg, new Mesh(polygon(sideTri, 1, new Vector3(sx, 0, 0)), trimMat));
      }
    }

    // --- Windows & Entry Door on all 4 facades ---
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
      bldg.add(g);
      return g;
    };

    const front = facade("front");
    const back = facade("back");
    const left = facade("left");
    const right = facade("right");

    // Craftsman Entry Door + glass sidelights + brass handle + sconces (strictly layered, zero coplanar faces)
    const doorBaseY = foundH + 0.08;
    const doorFrame = new Mesh(new BoxGeometry(1.96, 2.26, 0.04), trimMat);
    doorFrame.position.set(0, doorBaseY + 1.13, 0.03);
    const doorLeaf = new Mesh(new BoxGeometry(0.96, 2.12, 0.05), doorMat);
    doorLeaf.position.set(0, doorBaseY + 1.06, 0.085);
    const doorGlass = new Mesh(new PlaneGeometry(0.66, 0.6), glassRes);
    doorGlass.position.set(0, doorBaseY + 1.54, 0.13);
    const handle = new Mesh(new BoxGeometry(0.04, 0.18, 0.04), lib.std("brass", { color: "#c9a66b", metalness: 0.85, roughness: 0.25 }));
    handle.position.set(0.35, doorBaseY + 0.96, 0.135);
    front.add(shadowed(doorFrame), shadowed(doorLeaf), doorGlass, handle);
    for (const sx of [-1, 1]) {
      const sideLite = new Mesh(new PlaneGeometry(0.32, 1.9), glassRes);
      sideLite.position.set(sx * 0.72, doorBaseY + 1.06, 0.075);
      const sconce = new Mesh(new BoxGeometry(0.14, 0.26, 0.14), bronzeMat);
      sconce.position.set(sx * 1.24, doorBaseY + 1.62, 0.08);
      const bulb = new Mesh(new BoxGeometry(0.08, 0.14, 0.08), warmLightMat);
      bulb.position.set(sx * 1.24, doorBaseY + 1.59, 0.165);
      front.add(sideLite, sconce, bulb);
    }

    const winMats = { trim: trimMat, glass: glassRes, shutter: shutterMat };
    for (let f = 0; f < floors; f++) {
      const y = (f === 0 ? foundH + 1.28 : f * floorH + floorH * 0.54);
      const frontXs = f === 0 ? [-3.85, 3.85] : [-3.85, 0, 3.85];
      frontXs.forEach((x) => addArchitecturalWindow(front, x, y, 1.38, 1.48, winMats, true));
      [-3.85, -1.25, 1.25, 3.85].forEach((x) => addArchitecturalWindow(back, x, y, 1.32, 1.44, winMats, false));
      [-2.0, 2.0].forEach((z) => addArchitecturalWindow(left, z, y, 1.25, 1.44, winMats, false));
      // Right facade only gets windows on upper floor (ground floor connects to garage)
      if (f > 0) {
        [-2.0, 2.0].forEach((z) => addArchitecturalWindow(right, z, y, 1.25, 1.44, winMats, false));
      }
    }
    // Side window on outer garage wall
    const gRight = new Group();
    gRight.position.set(gCx + gW / 2, 0, gCz);
    gRight.rotation.y = Math.PI / 2;
    bldg.add(gRight);
    addArchitecturalWindow(gRight, 0, 1.68, 1.25, 1.1, winMats, false);

    // --- Main Roof + Garage Roof ---
    if (flat) {
      const buildFlatCap = (cx: number, cz: number, w: number, d: number, wh: number, paraH: number) => {
        const th = 0.28;
        const walls: [number, number, number, number][] = [
          [cx, cz + d / 2 - th / 2, w, th],
          [cx, cz - d / 2 + th / 2, w, th],
          [cx + w / 2 - th / 2, cz, th, d - 2 * th],
          [cx - w / 2 + th / 2, cz, th, d - 2 * th],
        ];
        for (const [px, pz, pw, pd] of walls) {
          const p = new Mesh(worldBox(pw, paraH, pd, 2.6, 2.2), sidingMat);
          p.position.set(px, wh + paraH / 2, pz);
          const cap = new Mesh(new BoxGeometry(pw + 0.08, 0.08, pd + 0.08), copingMat);
          cap.position.set(px, wh + paraH + 0.04, pz);
          add(bldg, p);
          add(bldg, cap);
        }
        const iw = w - 2 * th;
        const id = d - 2 * th;
        const ry = wh + 0.08;
        const geo = new PlaneGeometry(iw, id);
        geo.rotateX(-Math.PI / 2);
        const uv = geo.getAttribute("uv");
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * iw) / spec.tile, (uv.getY(i) * id) / spec.tile);
        const membrane = new Mesh(geo, roofMat);
        membrane.position.set(cx, ry, cz);
        add(bldg, membrane, false, true);
        return {
          ry,
          topY: wh + paraH,
          frontFace: {
            origin: new Vector3(cx, ry, cz + id / 2),
            u: new Vector3(1, 0, 0),
            s: new Vector3(0, 0, -1),
            n: new Vector3(0, 1, 0),
            length: id,
            halfWidthAt: () => iw / 2,
          },
          backFace: {
            origin: new Vector3(cx, ry, cz - id / 2),
            u: new Vector3(-1, 0, 0),
            s: new Vector3(0, 0, 1),
            n: new Vector3(0, 1, 0),
            length: id,
            halfWidthAt: () => iw / 2,
          },
        };
      };

      const mainFlat = buildFlatCap(0, 0, W, D, wallH, 0.48);
      const garFlat = buildFlatCap(gCx, gCz, gW, gD, gWallH, 0.42);
      roofTopY = mainFlat.topY;
      faces.push(mainFlat.frontFace, mainFlat.backFace);
      roofFocus = new Vector3(ox, mainFlat.ry + 0.4, 0.8);

      const flatClear = mainFlat.topY + (cfg.solar ? 1.4 : 1.0);
      keepOut.push(
        { minX: ox - W / 2 - camPad, maxX: ox + W / 2 + camPad, minZ: -D / 2 - camPad, maxZ: D / 2 + camPad, topY: () => flatClear },
        { minX: ox + gCx - gW / 2 - camPad, maxX: ox + gCx + gW / 2 + camPad, minZ: gCz - gD / 2 - camPad, maxZ: gCz + gD / 2 + camPad, topY: () => garFlat.topY + 1.0 },
        { minX: ox - pW / 2 - 0.25 - camPad, maxX: ox + pW / 2 + 0.25 + camPad, minZ: D / 2 - 0.2, maxZ: D / 2 + pD + 0.3 + camPad, topY: () => porchBeamY + 0.45 + camPad },
      );

      // Subtle plumbing vents & skylight curb on flat residential roof
      [-2.8, 2.9].forEach((x) => {
        const pipe = new Mesh(new CylinderGeometry(0.06, 0.06, 0.55, 12), bronzeMat);
        pipe.position.set(x, mainFlat.ry + 0.275, -2.0);
        add(bldg, pipe);
      });
    } else {
      const deg = PITCH_DEG[cfg.slope as Exclude<Slope, "flat">];
      const mainRoof = buildGableRoofBlock(bldg, {
        cx: 0,
        cz: 0,
        w: W,
        d: D,
        wallH,
        pitchDeg: deg,
        overhang: 0.58,
        gableOverhang: 0.42,
        roofMat,
        wallMat: sidingMat,
        trimMat,
        gutterMat,
        seamMat,
        tileSize: spec.tile,
        sidingTile: 2.4,
        downspouts: true,
      });
      // Attached garage gable roof at matching pitch
      const garRoof = buildGableRoofBlock(bldg, {
        cx: gCx,
        cz: gCz,
        w: gW,
        d: gD,
        wallH: gWallH,
        pitchDeg: deg,
        overhang: 0.48,
        gableOverhang: 0.36,
        roofMat,
        wallMat: sidingMat,
        trimMat,
        gutterMat,
        seamMat,
        tileSize: spec.tile,
        sidingTile: 2.4,
        downspouts: true,
        skipLeftGableWall: true,
      });

      roofTopY = mainRoof.ridgeY;
      faces.push(mainRoof.frontFace, mainRoof.backFace);
      roofFocus = new Vector3(ox, (mainRoof.eaveY + mainRoof.ridgeY) * 0.52, D * 0.24);

      const tanDeg = Math.tan((deg * Math.PI) / 180);
      const roofExtra = cfg.solar ? 1.15 : 0.95;
      const porchRoofPeak = floors === 1 ? Math.min(wallH - 0.04, porchBeamY + 0.58) : porchBeamY + 0.72;
      keepOut.push(
        {
          minX: ox - (W / 2 + 0.48) - camPad,
          maxX: ox + (W / 2 + 0.48) + camPad,
          minZ: -(D / 2 + 0.72) - camPad,
          maxZ: D / 2 + 0.72 + camPad,
          topY: (_x, z) => Math.max(mainRoof.eaveY, mainRoof.ridgeY - Math.abs(z) * tanDeg) + roofExtra,
        },
        {
          minX: ox + gCx - (gW / 2 + 0.42) - camPad,
          maxX: ox + gCx + (gW / 2 + 0.42) + camPad,
          minZ: gCz - (gD / 2 + 0.62) - camPad,
          maxZ: gCz + (gD / 2 + 0.62) + camPad,
          topY: (_x, z) => Math.max(garRoof.eaveY, garRoof.ridgeY - Math.abs(z - gCz) * tanDeg) + 0.95,
        },
        {
          minX: ox - (pW / 2 + 0.3) - camPad,
          maxX: ox + (pW / 2 + 0.3) + camPad,
          minZ: D / 2 - 0.2,
          maxZ: D / 2 + pD + 0.35 + camPad,
          topY: () => porchRoofPeak + 0.95,
        },
      );

      // Detailed running-bond brick chimney on back slope with stone crown, flue & metal flashing
      const chimX = W * 0.24;
      const chimZ = -D * 0.14;
      const chimTop = mainRoof.ridgeY + 0.85;
      keepOut.push({
        minX: ox + chimX - 0.68 - camPad,
        maxX: ox + chimX + 0.68 + camPad,
        minZ: chimZ - 0.68 - camPad,
        maxZ: chimZ + 0.68 + camPad,
        topY: () => chimTop + 0.45 + camPad,
      });
      const chimBot = wallH - 0.5;
      const chimH = chimTop - chimBot;
      const chim = new Mesh(worldBox(1.05, chimH, 1.05, 1.4, 1.2), brickMat);
      chim.position.set(chimX, chimBot + chimH / 2, chimZ);
      const corbel = new Mesh(worldBox(1.16, 0.16, 1.16, 1.4, 1.2), brickMat);
      corbel.position.set(chimX, chimTop - 0.12, chimZ);
      const crown = new Mesh(new BoxGeometry(1.26, 0.12, 1.26), copingMat);
      crown.position.set(chimX, chimTop + 0.05, chimZ);
      const flue = new Mesh(new CylinderGeometry(0.18, 0.18, 0.34, 14), lib.std("flue", { color: "#b6684b", roughness: 0.85 }));
      flue.position.set(chimX, chimTop + 0.25, chimZ);
      const flashing = new Mesh(new BoxGeometry(1.16, 0.22, 1.16), bronzeMat);
      const roofYAtChim = mainRoof.ridgeY - Math.abs(chimZ) * Math.tan((deg * Math.PI) / 180);
      flashing.position.set(chimX, roofYAtChim + 0.04, chimZ);
      add(bldg, chim);
      add(bldg, corbel);
      add(bldg, crown);
      add(bldg, flue);
      add(bldg, flashing);

      // Low-profile box vents on back roof slope
      const bf = mainRoof.backFace;
      for (const uPos of [-3.4, 0.1]) {
        const vent = new Mesh(new BoxGeometry(0.42, 0.14, 0.42), bronzeMat);
        vent.position.copy(place(bf, uPos, bf.length * 0.72, 0.07));
        vent.quaternion.copy(faceQuat(bf));
        add(bldg, vent);
      }
    }

    // --- Damage / weathering decals on main roof ---
    const rnd = mulberry32(2024);
    const addDecal = (kind: DecalKind, face: RoofFace, uFrac: number, sFrac: number, size: number) => {
      const hw = face.halfWidthAt(face.length * sFrac);
      const m = new Mesh(new PlaneGeometry(size, size), lib.decal(kind));
      m.position.copy(place(face, uFrac * hw, face.length * sFrac, 0.032));
      m.quaternion.copy(faceQuat(face));
      m.rotateZ(rnd() * Math.PI * 2);
      bldg.add(m);
    };
    const [ff, bf] = faces;
    if (cfg.damaged) {
      addDecal("damage", ff, -0.42, 0.38, 1.85);
      addDecal("damage", ff, 0.34, 0.62, 1.55);
      addDecal("damage", ff, 0.06, 0.24, 1.15);
      addDecal("damage", bf, -0.25, 0.48, 1.7);
      addDecal("stain", ff, -0.18, 0.54, 3.2);
    }
    const mossCount = Math.round(cfg.weathering * 6);
    for (let i = 0; i < mossCount; i++) {
      const face = i % 3 === 2 ? bf : ff;
      addDecal("moss", face, (rnd() - 0.5) * 1.45, 0.18 + rnd() * 0.66, 1.4 + rnd() * 1.5);
    }
    if (cfg.weathering > 0.3) addDecal("stain", ff, 0.5, 0.42, 2.7);

    // --- Solar panels on main front face ---
    if (cfg.solar) {
      const pw = 1.05;
      const ph = 1.72;
      const gap = 0.08;
      const matrices: Matrix4[] = [];
      const strutMatrices: Matrix4[] = [];
      const q = new Quaternion();
      const one = new Vector3(1, 1, 1);

      if (flat) {
        const tilt = (14 * Math.PI) / 180;
        const cols = Math.floor((2 * (ff.halfWidthAt(0) - 0.9) + gap) / (pw + gap));
        const rows = Math.max(1, Math.floor((ff.length - 2.2) / 2.4) + 1);
        q.setFromAxisAngle(new Vector3(1, 0, 0), tilt);
        const panelY = ff.origin.y + 0.18 + (ph / 2) * Math.sin(tilt);
        const strutH = (panelY - ff.origin.y) * 0.95;
        for (let r = 0; r < rows; r++) {
          const z = ff.origin.z - 1.4 - r * 2.4;
          for (let c = 0; c < cols; c++) {
            const x = (c - (cols - 1) / 2) * (pw + gap);
            matrices.push(new Matrix4().compose(new Vector3(x, panelY, z), q, one));
            strutMatrices.push(new Matrix4().compose(new Vector3(x, ff.origin.y + strutH / 2, z - 0.35), new Quaternion(), new Vector3(1, strutH, 1)));
          }
        }
      } else {
        q.copy(new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(ff.u, ff.n, new Vector3().crossVectors(ff.u, ff.n))));
        for (let s0 = 0.55; s0 + ph <= ff.length - 0.45; s0 += ph + gap) {
          const half = ff.halfWidthAt(s0 + ph) - 0.65;
          const cols = Math.floor((2 * half + gap) / (pw + gap));
          for (let c = 0; c < cols; c++) {
            const u = (c - (cols - 1) / 2) * (pw + gap);
            matrices.push(new Matrix4().compose(place(ff, u, s0 + ph / 2, 0.1), q, one));
          }
        }
      }

      if (matrices.length) {
        const panels = new InstancedMesh(new BoxGeometry(pw, 0.045, ph), lib.solar(), matrices.length);
        const frames = new InstancedMesh(new BoxGeometry(pw + 0.06, 0.036, ph + 0.06), bronzeMat, matrices.length);
        matrices.forEach((m, i) => {
          panels.setMatrixAt(i, m);
          frames.setMatrixAt(i, m.clone().multiply(new Matrix4().makeTranslation(0, -0.025, 0)));
        });
        panels.instanceMatrix.needsUpdate = frames.instanceMatrix.needsUpdate = true;
        add(bldg, panels);
        add(bldg, frames);
        if (strutMatrices.length) {
          const struts = new InstancedMesh(new BoxGeometry(0.09, 1, 0.09), metalGrey, strutMatrices.length);
          strutMatrices.forEach((m, i) => struts.setMatrixAt(i, m));
          struts.instanceMatrix.needsUpdate = true;
          add(bldg, struts);
        }
      }
    }

    // Keep both side yards 100% clear of trees so all fence lines stay unobstructed;
    // place subtle accent trees far behind the rear fence for natural horizon depth.
    addLandscaping(
      bldg,
      lib,
      [
        [-4.2, -13.8, 1.25],
        [7.6, -14.2, 1.3],
      ],
      [
        [-4.8, D / 2 + 0.72, 1.0],
        [-3.4, D / 2 + 0.72, 0.85],
        [3.3, D / 2 + 0.72, 0.88],
        [4.7, D / 2 + 0.72, 1.02],
        [-6.3, 1.8, 0.95],
        [-6.3, -1.6, 0.9],
      ],
    );

    radius = Math.hypot(W + gW * 0.75, D + 2, roofTopY) * 0.56;
  } else {
    // --- Commercial Building Architecture ---
    const W = 19.0;
    const D = 12.4;
    const floorH = 3.7;
    const wallH = floors * floorH;
    const baseH = 0.6;

    const walls = new Mesh(worldBox(W, wallH - baseH, D, 4.0, 3.6), comWallMat);
    walls.position.y = baseH + (wallH - baseH) / 2;
    add(root, walls);

    const base = new Mesh(worldBox(W + 0.18, baseH, D + 0.18, 2.2, 1.0), stoneMat);
    base.position.y = baseH / 2;
    add(root, base);

    // Architectural pilasters framing facade bays
    for (const px of [-W / 2 + 0.25, -4.6, 4.6, W / 2 - 0.25]) {
      for (const sz of [-1, 1]) {
        const pil = new Mesh(new BoxGeometry(0.46, wallH - baseH, 0.22), lib.std("pilaster", { color: "#cfd5dc", roughness: 0.78 }));
        pil.position.set(px, baseH + (wallH - baseH) / 2, sz * (D / 2 + 0.04));
        add(root, pil);
      }
    }

    // Paved concrete commercial parking apron + walkway
    const apron = new Mesh(worldBox(W + 8, 0.08, 15, 3.5, 3.5), concreteMat);
    apron.position.set(0, 0.03, D / 2 + 7.5);
    add(root, apron, false, true);
    // Parking stall divider lines
    const stripeMat = lib.std("stripe", { color: "#f8fafc", roughness: 0.9 });
    for (let sx = -9; sx <= 9; sx += 3.0) {
      if (Math.abs(sx) < 2.2) continue;
      const stripe = new Mesh(new BoxGeometry(0.11, 0.012, 4.6), stripeMat);
      stripe.position.set(sx, 0.075, D / 2 + 8.5);
      add(root, stripe, false, false);
    }

    // Storefront glass curtainwall + bronze canopy
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
      root.add(g);
      return g;
    };

    const front = facade("front");
    const back = facade("back");
    const left = facade("left");
    const right = facade("right");

    const comWinMats = { trim: bronzeMat, glass: glassCom, darkFrame: bronzeMat };
    // Ground-floor retail/office storefront bays
    addArchitecturalWindow(front, -6.9, 1.85, 3.6, 2.45, comWinMats);
    addArchitecturalWindow(front, 6.9, 1.85, 3.6, 2.45, comWinMats);
    addArchitecturalWindow(front, -2.85, 1.85, 2.35, 2.45, comWinMats);
    addArchitecturalWindow(front, 2.85, 1.85, 2.35, 2.45, comWinMats);

    // Double glass commercial entry doors + architectural cantilevered canopy (non-overlapping layers)
    const entryFrame = new Mesh(new BoxGeometry(2.5, 2.65, 0.08), bronzeMat);
    entryFrame.position.set(0, 1.48, 0.05);
    const entryGlass = new Mesh(new PlaneGeometry(2.2, 2.35), glassCom);
    entryGlass.position.set(0, 1.48, 0.12);
    const doorSplit = new Mesh(new BoxGeometry(0.08, 2.38, 0.04), bronzeMat);
    doorSplit.position.set(0, 1.48, 0.155);
    const canopy = new Mesh(new BoxGeometry(5.6, 0.26, 2.2), bronzeMat);
    canopy.position.set(0, floorH - 0.32, 1.1);
    const signBand = new Mesh(new BoxGeometry(7.2, 0.65, 0.14), lib.std("comSign", { color: "#0f2a4a", roughness: 0.45 }));
    signBand.position.set(0, floorH - 0.34, 2.28);
    front.add(shadowed(entryFrame), entryGlass, doorSplit, shadowed(canopy), shadowed(signBand));

    // Upper floor ribbon windows + side/back bays
    for (let f = 1; f < floors; f++) {
      const y = f * floorH + floorH * 0.54;
      [-7.0, -2.8, 0, 2.8, 7.0].forEach((x) => addArchitecturalWindow(front, x, y, 2.25, 1.82, comWinMats));
      [-7.0, -2.8, 0, 2.8, 7.0].forEach((x) => addArchitecturalWindow(back, x, y, 2.25, 1.82, comWinMats));
      [-3.8, 0, 3.8].forEach((z) => {
        addArchitecturalWindow(left, z, y, 2.5, 1.82, comWinMats);
        addArchitecturalWindow(right, z, y, 2.5, 1.82, comWinMats);
      });
    }
    [-5.2, 5.2].forEach((x) => addArchitecturalWindow(back, x, 1.9, 3.0, 1.8, comWinMats));
    [-3.4, 3.4].forEach((z) => {
      addArchitecturalWindow(left, z, 1.9, 2.6, 1.8, comWinMats);
      addArchitecturalWindow(right, z, 1.9, 2.6, 1.8, comWinMats);
    });

    // --- Commercial Roof ---
    if (flat) {
      const paraH = 0.72;
      const th = 0.34;
      const parapets: [number, number, number, number][] = [
        [0, D / 2 - th / 2, W, th],
        [0, -D / 2 + th / 2, W, th],
        [W / 2 - th / 2, 0, th, D - 2 * th],
        [-W / 2 + th / 2, 0, th, D - 2 * th],
      ];
      for (const [x, z, w, d] of parapets) {
        const p = new Mesh(worldBox(w, paraH, d, 4.0, 3.6), comWallMat);
        p.position.set(x, wallH + paraH / 2, z);
        const cap = new Mesh(new BoxGeometry(w + 0.1, 0.1, d + 0.1), copingMat);
        cap.position.set(x, wallH + paraH + 0.05, z);
        add(root, p);
        add(root, cap);
      }
      const iw = W - 2 * th;
      const id = D - 2 * th;
      const ry = wallH + 0.1;
      roofTopY = wallH + paraH;
      const geo = new PlaneGeometry(iw, id);
      geo.rotateX(-Math.PI / 2);
      const uv = geo.getAttribute("uv");
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * iw) / spec.tile, (uv.getY(i) * id) / spec.tile);
      const top = new Mesh(geo, roofMat);
      top.position.y = ry;
      add(root, top, false, true);
      roofFocus = new Vector3(0, ry + 0.6, 0.5);

      faces.push(
        { origin: new Vector3(0, ry, id / 2), u: new Vector3(1, 0, 0), s: new Vector3(0, 0, -1), n: new Vector3(0, 1, 0), length: id, halfWidthAt: () => iw / 2 },
        { origin: new Vector3(0, ry, -id / 2), u: new Vector3(-1, 0, 0), s: new Vector3(0, 0, 1), n: new Vector3(0, 1, 0), length: id, halfWidthAt: () => iw / 2 },
      );

      // Detailed commercial rooftop HVAC units (RTUs) + roof access hatch + walkway pads
      const unitMat = lib.std("rtu", { color: "#cfd5db", roughness: 0.45, metalness: 0.45 });
      const units: [number, number][] = [[-5.4, -2.7], [-1.6, -2.9], [5.4, -2.4]];
      for (const [x, z] of units) {
        const curb = new Mesh(new BoxGeometry(2.3, 0.32, 1.65), bronzeMat);
        curb.position.set(x, ry + 0.16, z);
        const body = new Mesh(new BoxGeometry(2.5, 1.15, 1.8), unitMat);
        body.position.set(x, ry + 0.32 + 0.575, z);
        const louver = new Mesh(new BoxGeometry(0.95, 0.62, 0.08), bronzeMat);
        louver.position.set(x - 0.55, ry + 0.9, z + 0.91);
        const fanRing = new Mesh(new CylinderGeometry(0.56, 0.56, 0.16, 20), bronzeMat);
        fanRing.position.set(x + 0.5, ry + 1.54, z);
        add(root, curb);
        add(root, body);
        add(root, louver, false, false);
        add(root, fanRing);
      }
      // Roof access hatch
      const hatch = new Mesh(new BoxGeometry(1.3, 0.48, 1.3), metalGrey);
      hatch.position.set(2.2, ry + 0.24, -3.5);
      add(root, hatch);
      // Safety walkway pad strip
      const walkPad = new Mesh(new BoxGeometry(12.5, 0.03, 0.85), lib.std("walkPad", { color: "#505760", roughness: 0.95 }));
      walkPad.position.set(0, ry + 0.02, -4.5);
      add(root, walkPad, false, true);

      keepOut.push(
        {
          minX: -W / 2 - camPad,
          maxX: W / 2 + camPad,
          minZ: -D / 2 - camPad,
          maxZ: D / 2 + camPad,
          topY: () => Math.max(roofTopY + 1.0, ry + 1.85) + (cfg.solar ? 0.35 : 0),
        },
        {
          minX: -3.7 - camPad,
          maxX: 3.7 + camPad,
          minZ: D / 2 - 0.2,
          maxZ: D / 2 + 2.35 + camPad,
          topY: () => floorH + 0.95,
        },
      );
    } else {
      // Commercial hip roof with thick fascia, soffit, perimeter gutters & standing-seam ribs
      const deg = PITCH_DEG[cfg.slope as Exclude<Slope, "flat">];
      const A = (deg * Math.PI) / 180;
      const tanA = Math.tan(A);
      const sinA = Math.sin(A);
      const cosA = Math.cos(A);
      const oh = 0.65;
      const Do = D / 2 + oh;
      const Wo = W / 2 + oh;
      const rx = (W - D) / 2;
      const eaveY = wallH - oh * tanA;
      const ridgeY = wallH + (D / 2) * tanA;
      const L = Do / cosA;
      const up = new Vector3(0, 1, 0);
      const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
      roofTopY = ridgeY;
      roofFocus = new Vector3(0, (eaveY + ridgeY) * 0.52, D * 0.22);

      add(root, new Mesh(polygon([V(-Wo, eaveY, Do), V(Wo, eaveY, Do), V(rx, ridgeY, 0), V(-rx, ridgeY, 0)], spec.tile, up), roofMat));
      add(root, new Mesh(polygon([V(Wo, eaveY, -Do), V(-Wo, eaveY, -Do), V(-rx, ridgeY, 0), V(rx, ridgeY, 0)], spec.tile, up), roofMat));
      add(root, new Mesh(polygon([V(Wo, eaveY, Do), V(Wo, eaveY, -Do), V(rx, ridgeY, 0)], spec.tile, up), roofMat));
      add(root, new Mesh(polygon([V(-Wo, eaveY, -Do), V(-Wo, eaveY, Do), V(-rx, ridgeY, 0)], spec.tile, up), roofMat));

      // Fascia + box gutters around all 4 eaves
      for (const sz of [-1, 1]) {
        const f = new Mesh(new BoxGeometry(2 * Wo + 0.08, 0.24, 0.14), bronzeMat);
        f.position.set(0, eaveY - 0.1, sz * (Do + 0.02));
        add(root, f);
      }
      for (const sx of [-1, 1]) {
        const f = new Mesh(new BoxGeometry(0.14, 0.24, 2 * Do + 0.08), bronzeMat);
        f.position.set(sx * (Wo + 0.02), eaveY - 0.1, 0);
        add(root, f);
      }
      // Ridge cap
      const ridge = new Mesh(new BoxGeometry(2 * rx + 0.25, 0.12, 0.34), roofMat);
      ridge.position.set(0, ridgeY + 0.03, 0);
      add(root, ridge);

      const frontFace: RoofFace = {
        origin: V(0, eaveY, Do),
        u: V(1, 0, 0),
        s: V(0, sinA, -cosA),
        n: V(0, cosA, sinA),
        length: L,
        halfWidthAt: (s) => Wo + (rx - Wo) * Math.min(1, s / L),
      };
      const backFace: RoofFace = {
        origin: V(0, eaveY, -Do),
        u: V(-1, 0, 0),
        s: V(0, sinA, cosA),
        n: V(0, cosA, -sinA),
        length: L,
        halfWidthAt: (s) => Wo + (rx - Wo) * Math.min(1, s / L),
      };
      faces.push(frontFace, backFace);
      if (seamMat) {
        addStandingSeams(root, frontFace, seamMat);
        addStandingSeams(root, backFace, seamMat);
      }

      const roofExtra = cfg.solar ? 1.15 : 0.95;
      keepOut.push(
        {
          minX: -Wo - camPad,
          maxX: Wo + camPad,
          minZ: -Do - camPad,
          maxZ: Do + camPad,
          topY: (x, z) => {
            const dx = Math.max(0, Math.abs(x) - rx);
            const dz = Math.abs(z);
            return Math.max(eaveY, ridgeY - Math.max(dx, dz) * tanA) + roofExtra;
          },
        },
        {
          minX: -3.7 - camPad,
          maxX: 3.7 + camPad,
          minZ: D / 2 - 0.2,
          maxZ: D / 2 + 2.35 + camPad,
          topY: () => floorH + 0.95,
        },
      );
    }

    // --- Damage / weathering decals ---
    const rnd = mulberry32(2025);
    const addDecal = (kind: DecalKind, face: RoofFace, uFrac: number, sFrac: number, size: number) => {
      const hw = face.halfWidthAt(face.length * sFrac);
      const m = new Mesh(new PlaneGeometry(size, size), lib.decal(kind));
      m.position.copy(place(face, uFrac * hw, face.length * sFrac, 0.032));
      m.quaternion.copy(faceQuat(face));
      m.rotateZ(rnd() * Math.PI * 2);
      root.add(m);
    };
    const [ff, bf] = faces;
    if (cfg.damaged) {
      addDecal("damage", ff, -0.4, 0.36, 2.2);
      addDecal("damage", ff, 0.32, 0.6, 1.9);
      addDecal("damage", bf, 0.2, 0.45, 2.0);
      addDecal("stain", ff, -0.15, 0.5, 4.0);
    }
    const mossCount = Math.round(cfg.weathering * 6);
    for (let i = 0; i < mossCount; i++) {
      const face = i % 3 === 2 ? bf : ff;
      addDecal("moss", face, (rnd() - 0.5) * 1.4, 0.2 + rnd() * 0.6, 1.8 + rnd() * 1.8);
    }
    if (cfg.weathering > 0.3) addDecal("stain", ff, 0.5, 0.4, 3.2);

    // --- Commercial Solar Array ---
    if (cfg.solar) {
      const pw = 1.05;
      const ph = 1.75;
      const gap = 0.09;
      const matrices: Matrix4[] = [];
      const strutMatrices: Matrix4[] = [];
      const q = new Quaternion();
      const one = new Vector3(1, 1, 1);
      const hvacZones: [number, number][] = [[-5.4, -2.7], [-1.6, -2.9], [5.4, -2.4], [2.2, -3.5]];
      const hitsHvac = (x: number, z: number) =>
        hvacZones.some(([hx, hz]) => Math.abs(x - hx) < 2.3 && Math.abs(z - hz) < 2.2);

      if (flat) {
        const tilt = (14 * Math.PI) / 180;
        const cols = Math.floor((2 * (ff.halfWidthAt(0) - 1.1) + gap) / (pw + gap));
        const rows = Math.max(1, Math.floor((ff.length - 2.4) / 2.5) + 1);
        q.setFromAxisAngle(new Vector3(1, 0, 0), tilt);
        const panelY = ff.origin.y + 0.18 + (ph / 2) * Math.sin(tilt);
        const strutH = (panelY - ff.origin.y) * 0.95;
        for (let r = 0; r < rows; r++) {
          const z = ff.origin.z - 1.5 - r * 2.5;
          for (let c = 0; c < cols; c++) {
            const x = (c - (cols - 1) / 2) * (pw + gap);
            if (hitsHvac(x, z)) continue;
            matrices.push(new Matrix4().compose(new Vector3(x, panelY, z), q, one));
            strutMatrices.push(new Matrix4().compose(new Vector3(x, ff.origin.y + strutH / 2, z - 0.35), new Quaternion(), new Vector3(1, strutH, 1)));
          }
        }
      } else {
        q.copy(new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(ff.u, ff.n, new Vector3().crossVectors(ff.u, ff.n))));
        for (let s0 = 0.6; s0 + ph <= ff.length - 0.5; s0 += ph + gap) {
          const half = ff.halfWidthAt(s0 + ph) - 0.85;
          const cols = Math.floor((2 * half + gap) / (pw + gap));
          for (let c = 0; c < cols; c++) {
            const u = (c - (cols - 1) / 2) * (pw + gap);
            matrices.push(new Matrix4().compose(place(ff, u, s0 + ph / 2, 0.1), q, one));
          }
        }
      }

      if (matrices.length) {
        const panels = new InstancedMesh(new BoxGeometry(pw, 0.05, ph), lib.solar(), matrices.length);
        const frames = new InstancedMesh(new BoxGeometry(pw + 0.06, 0.04, ph + 0.06), bronzeMat, matrices.length);
        matrices.forEach((m, i) => {
          panels.setMatrixAt(i, m);
          frames.setMatrixAt(i, m.clone().multiply(new Matrix4().makeTranslation(0, -0.028, 0)));
        });
        panels.instanceMatrix.needsUpdate = frames.instanceMatrix.needsUpdate = true;
        add(root, panels);
        add(root, frames);
        if (strutMatrices.length) {
          const struts = new InstancedMesh(new BoxGeometry(0.1, 1, 0.1), metalGrey, strutMatrices.length);
          strutMatrices.forEach((m, i) => struts.setMatrixAt(i, m));
          struts.instanceMatrix.needsUpdate = true;
          add(root, struts);
        }
      }
    }

    // Keep commercial side yards clear of trees so perimeter fencing stays completely unobstructed.
    addLandscaping(
      root,
      lib,
      [
        [-6.5, -16.5, 1.4],
        [7.0, -16.8, 1.45],
      ],
      [
        [-10.4, 4.5, 1.1],
        [-10.4, 1.5, 1.0],
        [10.4, 4.5, 1.1],
        [10.4, 1.5, 1.0],
      ],
    );

    radius = Math.hypot(W, D, roofTopY) * 0.6;
  }

  let fenceSummary = "";
  if (cfg.fence?.enabled) {
    const builtFence = buildFence(cfg.fence, cfg.buildingType, lib);
    root.add(builtFence.group);
    radius += builtFence.extraRadius * 0.55;
    fenceSummary = builtFence.summary;
  }

  const storyText = floors === 1 ? "single-story" : `${floors}-story`;
  const description =
    `3D architectural model of a ${storyText} ${res ? "residential house with attached garage and covered porch" : "commercial building"} ` +
    `with a ${cfg.slope} slope ${cfg.material === "tpo" ? "TPO" : cfg.material === "epdm" ? "EPDM" : cfg.material === "modbit" ? "modified bitumen" : cfg.material} roof` +
    `${cfg.damaged ? ", showing damaged areas" : ""}${cfg.solar ? ", with solar panels" : ""}${fenceSummary}. Drag to rotate, scroll or pinch to zoom close.`;

  return {
    group: root,
    target: new Vector3(0, roofTopY * 0.44, 0),
    roofFocus,
    keepOut,
    radius,
    description,
  };
}
