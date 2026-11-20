import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  NoColorSpace,
  type Texture,
} from "three";
import type { Material } from "@/lib/estimate/questions";

/** Deterministic PRNG so textures and decals look the same every render. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type MaterialSpec = {
  /** Real-world size (metres) that one 512px texture tile covers. */
  tile: number;
  roughness: number;
  metalness: number;
  bump: number;
};

export const materialSpecs: Record<Material, MaterialSpec> = {
  asphalt: { tile: 2, roughness: 0.95, metalness: 0, bump: 1.2 },
  metal: { tile: 1.6, roughness: 0.38, metalness: 0.65, bump: 0.8 },
  tile: { tile: 2.2, roughness: 0.8, metalness: 0, bump: 1.6 },
  cedar: { tile: 2, roughness: 0.92, metalness: 0, bump: 1.4 },
  tpo: { tile: 4, roughness: 0.6, metalness: 0, bump: 0.5 },
  epdm: { tile: 4, roughness: 0.9, metalness: 0, bump: 0.5 },
  modbit: { tile: 3, roughness: 0.95, metalness: 0, bump: 0.9 },
};

const SIZE = 512;

function canvas() {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  return c;
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function noise(ctx: CanvasRenderingContext2D, rnd: () => number, amount: number, count: number) {
  for (let i = 0; i < count; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${rnd() * amount})`;
    ctx.fillRect(rnd() * SIZE, rnd() * SIZE, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

/** Base colours (sRGB) per material. */
export const baseColors: Record<Material, string> = {
  asphalt: "#444a52",
  metal: "#6b7882",
  tile: "#b8573a",
  cedar: "#8b5e3c",
  tpo: "#f1f3f4",
  epdm: "#2b2d30",
  modbit: "#5d6064",
};

type Drawn = { color: HTMLCanvasElement; bump: HTMLCanvasElement };

function draw(kind: Material): Drawn {
  const color = canvas();
  const bump = canvas();
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;
  const rnd = mulberry32(kind.length * 7919 + kind.charCodeAt(0));
  const base = baseColors[kind];
  b.fillStyle = "#808080";
  b.fillRect(0, 0, SIZE, SIZE);

  if (kind === "asphalt") {
    const rowH = 32;
    const tabW = 64;
    for (let r = 0; r < SIZE / rowH; r++) {
      const off = r % 2 ? tabW / 2 : 0;
      for (let x = -tabW; x < SIZE + tabW; x += tabW) {
        const f = 0.88 + rnd() * 0.24;
        const px = x + off;
        c.fillStyle = shade(base, f);
        c.fillRect(px, r * rowH, tabW, rowH);
        // lit top edge / shadowed bottom edge of each tab
        const g = c.createLinearGradient(0, r * rowH, 0, (r + 1) * rowH);
        g.addColorStop(0, "rgba(255,255,255,0.10)");
        g.addColorStop(0.7, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.35)");
        c.fillStyle = g;
        c.fillRect(px, r * rowH, tabW, rowH);
        c.fillStyle = "rgba(0,0,0,0.45)";
        c.fillRect(px, r * rowH, 1.5, rowH * 0.55); // vertical slot between tabs
        b.fillStyle = "#b0b0b0";
        b.fillRect(px + 1, r * rowH + 2, tabW - 2, rowH * 0.6);
        b.fillStyle = "#303030";
        b.fillRect(px, r * rowH, 2, rowH * 0.6);
      }
    }
    noise(c, rnd, 0.18, 9000);
  } else if (kind === "metal") {
    const w = 64;
    for (let i = 0; i < SIZE / w; i++) {
      const f = 0.94 + rnd() * 0.12;
      const g = c.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      g.addColorStop(0, shade(base, f * 1.12));
      g.addColorStop(0.1, shade(base, f * 0.8));
      g.addColorStop(0.2, shade(base, f));
      g.addColorStop(1, shade(base, f * 0.96));
      c.fillStyle = g;
      c.fillRect(i * w, 0, w, SIZE);
      // raised seam
      c.fillStyle = "rgba(255,255,255,0.38)";
      c.fillRect(i * w, 0, 2.5, SIZE);
      c.fillStyle = "rgba(0,0,0,0.38)";
      c.fillRect(i * w + 3, 0, 2, SIZE);
      b.fillStyle = "#f0f0f0";
      b.fillRect(i * w, 0, 5, SIZE);
    }
    noise(c, rnd, 0.05, 2500);
  } else if (kind === "tile") {
    const colW = 64;
    const rowH = 128;
    for (let col = 0; col < SIZE / colW; col++) {
      for (let r = 0; r < SIZE / rowH; r++) {
        const f = 0.85 + rnd() * 0.3;
        const g = c.createLinearGradient(col * colW, 0, (col + 1) * colW, 0);
        g.addColorStop(0, shade(base, f * 0.6));
        g.addColorStop(0.35, shade(base, f * 1.15));
        g.addColorStop(0.65, shade(base, f * 1.0));
        g.addColorStop(1, shade(base, f * 0.55));
        c.fillStyle = g;
        c.fillRect(col * colW, r * rowH, colW, rowH);
        // overlap shadow at the lower end of each tile
        const s = c.createLinearGradient(0, r * rowH, 0, (r + 1) * rowH);
        s.addColorStop(0, "rgba(255,255,255,0.08)");
        s.addColorStop(0.82, "rgba(0,0,0,0)");
        s.addColorStop(1, "rgba(0,0,0,0.5)");
        c.fillStyle = s;
        c.fillRect(col * colW, r * rowH, colW, rowH);
        const bg = b.createLinearGradient(col * colW, 0, (col + 1) * colW, 0);
        bg.addColorStop(0, "#202020");
        bg.addColorStop(0.5, "#f0f0f0");
        bg.addColorStop(1, "#202020");
        b.fillStyle = bg;
        b.fillRect(col * colW, r * rowH, colW, rowH);
      }
    }
    noise(c, rnd, 0.14, 7000);
  } else if (kind === "cedar") {
    const rowH = 48;
    for (let r = 0; r < Math.ceil(SIZE / rowH); r++) {
      let x = -rnd() * 30;
      while (x < SIZE) {
        const w = 22 + rnd() * 30;
        const f = 0.75 + rnd() * 0.5;
        c.fillStyle = shade(base, f);
        c.fillRect(x, r * rowH, w, rowH + 2);
        for (let k = 0; k < 4; k++) {
          c.fillStyle = `rgba(0,0,0,${0.06 + rnd() * 0.1})`;
          c.fillRect(x + rnd() * w, r * rowH, 1, rowH);
        }
        const g = c.createLinearGradient(0, r * rowH, 0, (r + 1) * rowH);
        g.addColorStop(0.6, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.45)");
        c.fillStyle = g;
        c.fillRect(x, r * rowH, w, rowH + 2);
        c.fillStyle = "rgba(0,0,0,0.5)";
        c.fillRect(x, r * rowH, 1.2, rowH);
        b.fillStyle = `rgb(${150 + rnd() * 60},${150 + rnd() * 60},${150 + rnd() * 60})`;
        b.fillRect(x + 1, r * rowH, w - 1, rowH - 4);
        x += w;
      }
    }
    noise(c, rnd, 0.12, 6000);
  } else {
    // Flat-roof membranes: sheet seams every 1/4 and 1/2 of the tile.
    c.fillStyle = base;
    c.fillRect(0, 0, SIZE, SIZE);
    const grit = kind === "modbit" ? 0.5 : kind === "epdm" ? 0.2 : 0.08;
    noise(c, rnd, grit, kind === "modbit" ? 22000 : 8000);
    c.strokeStyle = kind === "tpo" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.14)";
    c.lineWidth = 2;
    const step = kind === "modbit" ? SIZE / 3 : SIZE / 2;
    for (let p = 0; p < SIZE; p += step) {
      c.beginPath();
      c.moveTo(p + 1, 0);
      c.lineTo(p + 1, SIZE);
      c.stroke();
      b.fillStyle = "#a0a0a0";
      b.fillRect(p, 0, 3, SIZE);
    }
    if (kind === "modbit") {
      c.strokeStyle = "rgba(0,0,0,0.25)";
      for (let p = 0; p < SIZE; p += SIZE / 2) {
        c.beginPath();
        c.moveTo(0, p + 1);
        c.lineTo(SIZE, p + 1);
        c.stroke();
      }
    }
  }
  return { color, bump };
}

export type RoofTextures = { map: Texture; bumpMap: Texture };

export function createRoofTextures(kind: Material, anisotropy: number): RoofTextures {
  const { color, bump } = draw(kind);
  const map = new CanvasTexture(color);
  map.colorSpace = SRGBColorSpace;
  const bumpMap = new CanvasTexture(bump);
  bumpMap.colorSpace = NoColorSpace;
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = anisotropy;
    t.needsUpdate = true;
  }
  return { map, bumpMap };
}

export type DecalKind = "damage" | "moss" | "stain";

/** Transparent blob textures laid over the roof to show damage, moss, water stains. */
export function createDecalTexture(kind: DecalKind, anisotropy: number): Texture {
  const cv = canvas();
  const c = cv.getContext("2d")!;
  const rnd = mulberry32(kind === "damage" ? 11 : kind === "moss" ? 23 : 37);
  const blob = (cx: number, cy: number, r: number, rgb: string, a: number) => {
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.65, `rgba(${rgb},${a * 0.7})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  };
  const n = kind === "moss" ? 40 : 14;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * SIZE * 0.28;
    const cx = SIZE / 2 + Math.cos(a) * d;
    const cy = SIZE / 2 + Math.sin(a) * d;
    if (kind === "damage") blob(cx, cy, 40 + rnd() * 50, "28,20,14", 0.9);
    else if (kind === "moss") blob(cx, cy, 12 + rnd() * 26, "74,102,52", 0.55);
    else blob(cx, cy, 40 + rnd() * 60, "58,44,30", 0.35);
  }
  if (kind === "damage") {
    // exposed decking planks inside the missing-shingle area
    c.save();
    c.beginPath();
    c.arc(SIZE / 2, SIZE / 2, SIZE * 0.2, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "rgba(122,88,56,0.95)";
    c.fillRect(0, 0, SIZE, SIZE);
    c.strokeStyle = "rgba(40,28,18,0.9)";
    c.lineWidth = 3;
    for (let y = SIZE * 0.25; y < SIZE * 0.8; y += 26) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(SIZE, y);
      c.stroke();
    }
    c.restore();
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}
