import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import { getRoofMaterialDef } from "../catalogs/roofing";
import type { Material } from "../domain/schemas";

/** Deterministic PRNG so textures and decals stay consistent across renders. */
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

function makeCanvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function speckle(ctx: CanvasRenderingContext2D, rnd: () => number, w: number, h: number, alpha: number, count: number, maxSize = 2.2) {
  for (let i = 0; i < count; i++) {
    const v = rnd() > 0.48 ? 245 : 14;
    ctx.fillStyle = `rgba(${v},${v},${v},${rnd() * alpha})`;
    const s = 0.8 + rnd() * maxSize;
    ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
}

export type PBRTextures = { map: Texture; bumpMap: Texture };

function wrapPBR(colorCanvas: HTMLCanvasElement, bumpCanvas: HTMLCanvasElement, anisotropy: number): PBRTextures {
  const map = new CanvasTexture(colorCanvas);
  map.colorSpace = SRGBColorSpace;
  const bumpMap = new CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = NoColorSpace;
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = anisotropy;
    t.needsUpdate = true;
  }
  return { map, bumpMap };
}

/** High-resolution (1024px) architectural roof textures so close-up zoom stays razor sharp. */
export function createRoofTextures(kind: Material, anisotropy: number): PBRTextures {
  const S = 1024;
  const color = makeCanvas(S);
  const bump = makeCanvas(S);
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;
  const rnd = mulberry32(kind.length * 7919 + kind.charCodeAt(0) * 31);
  const base = getRoofMaterialDef(kind).baseColor;
  b.fillStyle = "#7f7f7f";
  b.fillRect(0, 0, S, S);

  if (kind === "asphalt") {
    // Dimensional architectural laminated shingles (irregular tab widths + shadow band + mineral granules)
    const rows = 16;
    const rowH = S / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      let x = -rnd() * 64;
      while (x < S + 64) {
        const tabW = 58 + Math.floor(rnd() * 44);
        const layered = rnd() > 0.35;
        const tone = (layered ? 0.94 : 0.78) + rnd() * 0.24;
        c.fillStyle = shade(base, tone);
        c.fillRect(x, y, tabW, rowH);

        // Architectural shadow-band gradient at top of each exposed course
        const g = c.createLinearGradient(0, y, 0, y + rowH);
        g.addColorStop(0, "rgba(0,0,0,0.44)");
        g.addColorStop(0.24, "rgba(0,0,0,0.06)");
        g.addColorStop(0.82, "rgba(255,255,255,0.06)");
        g.addColorStop(1, "rgba(0,0,0,0.48)");
        c.fillStyle = g;
        c.fillRect(x, y, tabW, rowH);

        // Crisp vertical cutout seam between shingle teeth
        c.fillStyle = "rgba(8,10,14,0.52)";
        c.fillRect(x, y, 2, rowH);

        // Bump height for dimensional tabs
        const bh = layered ? 195 + Math.floor(rnd() * 35) : 115 + Math.floor(rnd() * 25);
        b.fillStyle = `rgb(${bh},${bh},${bh})`;
        b.fillRect(x + 2, y + 3, tabW - 3, rowH - 5);
        b.fillStyle = "#222222";
        b.fillRect(x, y, S, 3);
        x += tabW;
      }
    }
    // Fine ceramic roofing granules
    speckle(c, rnd, S, S, 0.2, 34000, 2.0);
    speckle(b, rnd, S, S, 0.14, 22000, 1.8);
  } else if (kind === "metal") {
    // Crisp architectural standing-seam steel panels with subtle oil-canning & painted sheen
    const panels = 8;
    const pw = S / panels;
    for (let i = 0; i < panels; i++) {
      const x = i * pw;
      const f = 0.95 + rnd() * 0.1;
      const g = c.createLinearGradient(x, 0, x + pw, 0);
      g.addColorStop(0, shade(base, f * 0.72));
      g.addColorStop(0.05, shade(base, f * 1.12));
      g.addColorStop(0.14, shade(base, f));
      g.addColorStop(0.5, shade(base, f * 1.03));
      g.addColorStop(0.92, shade(base, f * 0.96));
      g.addColorStop(1, shade(base, f * 0.78));
      c.fillStyle = g;
      c.fillRect(x, 0, pw, S);

      // Raised standing seam highlight & shadow
      c.fillStyle = "rgba(255,255,255,0.42)";
      c.fillRect(x + 1, 0, 4, S);
      c.fillStyle = "rgba(0,0,0,0.42)";
      c.fillRect(x + 5, 0, 4, S);

      // Subtle micro-striations along panel flat
      c.fillStyle = "rgba(0,0,0,0.06)";
      c.fillRect(x + pw * 0.34, 0, 2, S);
      c.fillRect(x + pw * 0.66, 0, 2, S);

      b.fillStyle = "#8a8a8a";
      b.fillRect(x, 0, pw, S);
      b.fillStyle = "#fafafa";
      b.fillRect(x, 0, 9, S);
    }
    speckle(c, rnd, S, S, 0.035, 8000, 1.5);
  } else if (kind === "tile") {
    // Spanish / Mediterranean S-curve terracotta barrel tiles
    const cols = 12;
    const rows = 8;
    const colW = S / cols;
    const rowH = S / rows;
    for (let col = 0; col < cols; col++) {
      for (let r = 0; r < rows; r++) {
        const x = col * colW;
        const y = r * rowH;
        const f = 0.84 + rnd() * 0.3;
        const g = c.createLinearGradient(x, 0, x + colW, 0);
        g.addColorStop(0, shade(base, f * 0.48));
        g.addColorStop(0.28, shade(base, f * 1.18));
        g.addColorStop(0.55, shade(base, f * 1.04));
        g.addColorStop(0.84, shade(base, f * 0.68));
        g.addColorStop(1, shade(base, f * 0.44));
        c.fillStyle = g;
        c.fillRect(x, y, colW, rowH);

        // Deep overlap shadow under the nose of each barrel tile
        const s = c.createLinearGradient(0, y, 0, y + rowH);
        s.addColorStop(0, "rgba(0,0,0,0.34)");
        s.addColorStop(0.14, "rgba(255,255,255,0.08)");
        s.addColorStop(0.84, "rgba(0,0,0,0)");
        s.addColorStop(1, "rgba(0,0,0,0.6)");
        c.fillStyle = s;
        c.fillRect(x, y, colW, rowH);

        const bg = b.createLinearGradient(x, 0, x + colW, 0);
        bg.addColorStop(0, "#181818");
        bg.addColorStop(0.45, "#f5f5f5");
        bg.addColorStop(1, "#181818");
        b.fillStyle = bg;
        b.fillRect(x, y, colW, rowH - 4);
        b.fillStyle = "#101010";
        b.fillRect(x, y + rowH - 4, colW, 4);
      }
    }
    speckle(c, rnd, S, S, 0.14, 18000, 2.0);
  } else if (kind === "cedar") {
    // Hand-split natural red cedar shakes with warm tone shifts and wood grain
    const rows = 14;
    const rowH = S / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      let x = -rnd() * 48;
      while (x < S + 48) {
        const w = 38 + rnd() * 56;
        const f = 0.72 + rnd() * 0.54;
        c.fillStyle = shade(base, f);
        c.fillRect(x, y, w, rowH + 1);
        for (let k = 0; k < 8; k++) {
          c.fillStyle = `rgba(${rnd() > 0.5 ? 20 : 210},${rnd() > 0.5 ? 12 : 170},${rnd() > 0.5 ? 6 : 120},${0.06 + rnd() * 0.12})`;
          c.fillRect(x + rnd() * w, y, 1 + rnd() * 1.5, rowH);
        }
        const g = c.createLinearGradient(0, y, 0, y + rowH);
        g.addColorStop(0, "rgba(0,0,0,0.28)");
        g.addColorStop(0.2, "rgba(0,0,0,0)");
        g.addColorStop(0.84, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.52)");
        c.fillStyle = g;
        c.fillRect(x, y, w, rowH + 1);

        c.fillStyle = "rgba(18,10,4,0.62)";
        c.fillRect(x, y, 2.2, rowH);

        const bh = 135 + Math.floor(rnd() * 85);
        b.fillStyle = `rgb(${bh},${bh},${bh})`;
        b.fillRect(x + 2, y + 2, w - 3, rowH - 5);
        x += w;
      }
    }
    speckle(c, rnd, S, S, 0.1, 16000, 1.8);
  } else {
    // Flat-roof commercial / modern membranes (TPO, EPDM, Modified Bitumen)
    c.fillStyle = base;
    c.fillRect(0, 0, S, S);
    const grit = kind === "modbit" ? 0.45 : kind === "epdm" ? 0.18 : 0.06;
    speckle(c, rnd, S, S, grit, kind === "modbit" ? 45000 : 18000, kind === "modbit" ? 2.4 : 1.6);

    const step = kind === "modbit" ? S / 4 : S / 3;
    for (let p = 0; p < S; p += step) {
      // Heat-welded / lap seam ridge
      c.fillStyle = kind === "tpo" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.12)";
      c.fillRect(p, 0, 4, S);
      c.fillStyle = kind === "tpo" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.24)";
      c.fillRect(p + 4, 0, 3, S);
      b.fillStyle = "#bcbcbc";
      b.fillRect(p, 0, 6, S);
    }
    if (kind === "modbit") {
      c.fillStyle = "rgba(0,0,0,0.22)";
      for (let p = 0; p < S; p += S / 2) c.fillRect(0, p, S, 3);
    }
  }
  return wrapPBR(color, bump, anisotropy);
}

export type ArchitecturalSurface = "siding" | "brick" | "stone" | "concrete" | "grass" | "commercialWall";

/** Realistic architectural exterior wall, masonry, concrete & yard textures. */
export function createSurfaceTextures(kind: ArchitecturalSurface, anisotropy: number): PBRTextures {
  const S = 512;
  const color = makeCanvas(S);
  const bump = makeCanvas(S);
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;
  const rnd = mulberry32(kind.length * 104729 + kind.charCodeAt(0) * 97);

  if (kind === "siding") {
    // Horizontal fiber-cement / painted clapboard lap siding
    const planks = 12;
    const ph = S / planks;
    for (let i = 0; i < planks; i++) {
      const y = i * ph;
      const tone = 0.985 + (rnd() - 0.5) * 0.03;
      const g = c.createLinearGradient(0, y, 0, y + ph);
      g.addColorStop(0, shade("#f1ede4", tone * 0.87));
      g.addColorStop(0.14, shade("#f1ede4", tone * 1.01));
      g.addColorStop(0.88, shade("#f1ede4", tone * 0.99));
      g.addColorStop(1, shade("#f1ede4", tone * 0.78));
      c.fillStyle = g;
      c.fillRect(0, y, S, ph);

      // Subtle painted woodgrain streaks
      for (let k = 0; k < 10; k++) {
        c.fillStyle = `rgba(120,112,98,${0.025 + rnd() * 0.03})`;
        c.fillRect(0, y + rnd() * ph, S, 1);
      }

      // Crisp bevel shadow under each lap edge
      c.fillStyle = "rgba(42,46,54,0.28)";
      c.fillRect(0, y + ph - 2.5, S, 2.5);

      const bg = b.createLinearGradient(0, y, 0, y + ph);
      bg.addColorStop(0, "#707070");
      bg.addColorStop(0.92, "#e8e8e8");
      bg.addColorStop(1, "#202020");
      b.fillStyle = bg;
      b.fillRect(0, y, S, ph);
    }
    speckle(c, rnd, S, S, 0.025, 4000, 1.5);
  } else if (kind === "brick") {
    // Running-bond red/terracotta architectural brick with recessed light mortar
    c.fillStyle = "#c9c2b6";
    c.fillRect(0, 0, S, S);
    b.fillStyle = "#303030";
    b.fillRect(0, 0, S, S);
    const rows = 16;
    const cols = 6;
    const rh = S / rows;
    const cw = S / cols;
    const mortar = 3.5;
    const palette = ["#9b4736", "#a8523d", "#893e30", "#b25e48", "#7d3a2f"];
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw / 2);
      for (let col = -1; col <= cols; col++) {
        const x = col * cw + off;
        const y = r * rh;
        const base = palette[Math.floor(rnd() * palette.length)];
        c.fillStyle = shade(base, 0.9 + rnd() * 0.2);
        c.fillRect(x + mortar / 2, y + mortar / 2, cw - mortar, rh - mortar);
        // Subtle kiln variation
        c.fillStyle = `rgba(0,0,0,${rnd() * 0.14})`;
        c.fillRect(x + mortar / 2, y + mortar / 2, cw - mortar, rh - mortar);
        b.fillStyle = `rgb(${180 + Math.floor(rnd() * 45)},${180 + Math.floor(rnd() * 45)},${180 + Math.floor(rnd() * 45)})`;
        b.fillRect(x + mortar / 2, y + mortar / 2, cw - mortar, rh - mortar);
      }
    }
    speckle(c, rnd, S, S, 0.12, 12000, 1.8);
  } else if (kind === "stone") {
    // Ledgestone / cultured stone foundation skirt
    c.fillStyle = "#6c6962";
    c.fillRect(0, 0, S, S);
    b.fillStyle = "#262626";
    b.fillRect(0, 0, S, S);
    const rows = 12;
    const rh = S / rows;
    const tones = ["#8e8b84", "#7e7c76", "#9f9b91", "#6f6e69", "#aba598"];
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 40;
      const y = r * rh;
      while (x < S + 40) {
        const w = 54 + rnd() * 78;
        const col = tones[Math.floor(rnd() * tones.length)];
        c.fillStyle = shade(col, 0.9 + rnd() * 0.2);
        c.fillRect(x + 2, y + 2, w - 4, rh - 4);
        const g = c.createLinearGradient(0, y, 0, y + rh);
        g.addColorStop(0, "rgba(255,255,255,0.12)");
        g.addColorStop(1, "rgba(0,0,0,0.22)");
        c.fillStyle = g;
        c.fillRect(x + 2, y + 2, w - 4, rh - 4);
        const bv = 140 + Math.floor(rnd() * 90);
        b.fillStyle = `rgb(${bv},${bv},${bv})`;
        b.fillRect(x + 2, y + 2, w - 4, rh - 4);
        x += w;
      }
    }
    speckle(c, rnd, S, S, 0.14, 10000, 2.0);
  } else if (kind === "concrete") {
    // Broom-finished concrete driveway / walkway with control joints
    c.fillStyle = "#d4d2cc";
    c.fillRect(0, 0, S, S);
    b.fillStyle = "#909090";
    b.fillRect(0, 0, S, S);
    speckle(c, rnd, S, S, 0.09, 16000, 2.2);
    speckle(b, rnd, S, S, 0.12, 10000, 1.8);
    // Control joints
    c.fillStyle = "rgba(70,68,64,0.34)";
    c.fillRect(0, S / 2 - 1.5, S, 3);
    c.fillRect(S / 2 - 1.5, 0, 3, S);
    b.fillStyle = "#303030";
    b.fillRect(0, S / 2 - 2, S, 4);
    b.fillRect(S / 2 - 2, 0, 4, S);
  } else if (kind === "commercialWall") {
    // Modern architectural tilt-up precast concrete / textured stucco panels
    c.fillStyle = "#dde1e6";
    c.fillRect(0, 0, S, S);
    b.fillStyle = "#a0a0a0";
    b.fillRect(0, 0, S, S);
    const cols = 4;
    const rows = 4;
    const cw = S / cols;
    const rh = S / rows;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        c.fillStyle = shade("#dde1e6", 0.97 + rnd() * 0.05);
        c.fillRect(col * cw + 2, r * rh + 2, cw - 4, rh - 4);
        c.strokeStyle = "rgba(80,90,104,0.28)";
        c.lineWidth = 2.5;
        c.strokeRect(col * cw + 1, r * rh + 1, cw - 2, rh - 2);
        b.strokeStyle = "#383838";
        b.lineWidth = 3;
        b.strokeRect(col * cw + 1, r * rh + 1, cw - 2, rh - 2);
      }
    }
    speckle(c, rnd, S, S, 0.05, 10000, 1.5);
  } else {
    // Natural mowed residential lawn with organic blade texture (not flat cartoon green)
    c.fillStyle = "#6f8d54";
    c.fillRect(0, 0, S, S);
    b.fillStyle = "#808080";
    b.fillRect(0, 0, S, S);
    // Subtle mowing stripes
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)";
      c.fillRect(i * (S / 4), 0, S / 4, S);
    }
    for (let i = 0; i < 18000; i++) {
      const gx = rnd() * S;
      const gy = rnd() * S;
      const pick = rnd();
      c.fillStyle =
        pick > 0.68
          ? `rgba(145,168,104,${0.2 + rnd() * 0.25})`
          : pick > 0.34
            ? `rgba(74,104,52,${0.2 + rnd() * 0.25})`
            : `rgba(110,126,76,${0.18 + rnd() * 0.22})`;
      c.fillRect(gx, gy, 1.5 + rnd() * 1.5, 3 + rnd() * 4);
    }
    speckle(b, rnd, S, S, 0.16, 12000, 1.6);
  }
  return wrapPBR(color, bump, anisotropy);
}

/** Realistic dark-tinted architectural window glass with subtle interior depth & sky sheen. */
export function createWindowTexture(anisotropy: number, commercial = false): Texture {
  const c = makeCanvas(256, 256);
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 256, 256);
  if (commercial) {
    g.addColorStop(0, "#243b52");
    g.addColorStop(0.45, "#375a78");
    g.addColorStop(0.55, "#1b2e42");
    g.addColorStop(1, "#122130");
  } else {
    g.addColorStop(0, "#273b4f");
    g.addColorStop(0.35, "#3b5670");
    g.addColorStop(0.65, "#1f3042");
    g.addColorStop(1, "#172330");
  }
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);

  // Subtle horizontal venetian blinds / interior ceiling depth behind glass
  x.fillStyle = commercial ? "rgba(220,235,248,0.08)" : "rgba(240,234,220,0.12)";
  for (let y = 14; y < 120; y += 10) {
    x.fillRect(10, y, 236, 4);
  }

  // Diagonal soft sky reflection streak
  x.save();
  x.beginPath();
  x.moveTo(0, 170);
  x.lineTo(180, 0);
  x.lineTo(240, 0);
  x.lineTo(40, 256);
  x.closePath();
  const rg = x.createLinearGradient(0, 0, 256, 256);
  rg.addColorStop(0, "rgba(215,236,255,0.22)");
  rg.addColorStop(1, "rgba(215,236,255,0.02)");
  x.fillStyle = rg;
  x.fill();
  x.restore();

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

/** Realistic monocrystalline solar panel texture with cell grid, busbars & diamond gaps. */
export function createSolarTexture(anisotropy: number): Texture {
  const c = makeCanvas(512, 864);
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 512, 864);
  g.addColorStop(0, "#13294d");
  g.addColorStop(0.5, "#193664");
  g.addColorStop(1, "#0f203d");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 864);

  const cols = 6;
  const rows = 10;
  const cw = 512 / cols;
  const rh = 864 / rows;

  // Fine silver collector busbars across every cell
  x.strokeStyle = "rgba(180,205,235,0.24)";
  x.lineWidth = 1;
  for (let col = 0; col < cols; col++) {
    for (let k = 1; k <= 3; k++) {
      const bx = col * cw + (cw * k) / 4;
      x.beginPath();
      x.moveTo(bx, 0);
      x.lineTo(bx, 864);
      x.stroke();
    }
  }

  // Cell borders + classic monocrystalline corner backsheet diamonds
  x.strokeStyle = "rgba(215,228,242,0.58)";
  x.lineWidth = 2.5;
  for (let i = 1; i < cols; i++) {
    x.beginPath();
    x.moveTo(i * cw, 0);
    x.lineTo(i * cw, 864);
    x.stroke();
  }
  for (let j = 1; j < rows; j++) {
    x.beginPath();
    x.moveTo(0, j * rh);
    x.lineTo(512, j * rh);
    x.stroke();
  }
  x.fillStyle = "rgba(225,235,245,0.68)";
  for (let i = 1; i < cols; i++) {
    for (let j = 1; j < rows; j++) {
      const cx = i * cw;
      const cy = j * rh;
      x.beginPath();
      x.moveTo(cx, cy - 5);
      x.lineTo(cx + 5, cy);
      x.lineTo(cx, cy + 5);
      x.lineTo(cx - 5, cy);
      x.closePath();
      x.fill();
    }
  }

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

/** Procedural daylight sky + warm sun + ground horizon map for realistic outdoor IBL reflections. */
export function createOutdoorEnvironmentTexture(): Texture {
  const c = makeCanvas(512, 256);
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#4b82c4"); // zenith blue
  g.addColorStop(0.36, "#93bee6"); // mid sky
  g.addColorStop(0.49, "#e6eef6"); // pale horizon haze
  g.addColorStop(0.51, "#b4b9ad"); // distant ground edge
  g.addColorStop(0.75, "#748363"); // warm lawn bounce
  g.addColorStop(1, "#4e5745");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 256);

  // Soft afternoon sun glow in upper sky for specular highlights on metal & glass
  const sg = x.createRadialGradient(340, 72, 2, 340, 72, 56);
  sg.addColorStop(0, "rgba(255,252,238,1)");
  sg.addColorStop(0.25, "rgba(255,244,214,0.75)");
  sg.addColorStop(1, "rgba(255,244,214,0)");
  x.fillStyle = sg;
  x.fillRect(280, 12, 120, 120);

  // Wispy white clouds
  const rnd = mulberry32(404);
  for (let i = 0; i < 18; i++) {
    const cx = rnd() * 512;
    const cy = 50 + rnd() * 62;
    const rx = 28 + rnd() * 48;
    const ry = 8 + rnd() * 12;
    const cg = x.createRadialGradient(cx, cy, 2, cx, cy, rx);
    cg.addColorStop(0, "rgba(255,255,255,0.45)");
    cg.addColorStop(1, "rgba(255,255,255,0)");
    x.save();
    x.translate(cx, cy);
    x.scale(1, ry / rx);
    x.fillStyle = cg;
    x.beginPath();
    x.arc(0, 0, rx, 0, Math.PI * 2);
    x.fill();
    x.restore();
  }

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.mapping = EquirectangularReflectionMapping;
  return t;
}

export type DecalKind = "damage" | "moss" | "stain";

/** Transparent weathering/damage overlay textures laid over the roof. */
export function createDecalTexture(kind: DecalKind, anisotropy: number): Texture {
  const S = 512;
  const cv = makeCanvas(S);
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
  const n = kind === "moss" ? 44 : 16;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * S * 0.28;
    const cx = S / 2 + Math.cos(a) * d;
    const cy = S / 2 + Math.sin(a) * d;
    if (kind === "damage") blob(cx, cy, 42 + rnd() * 48, "28,20,14", 0.92);
    else if (kind === "moss") blob(cx, cy, 12 + rnd() * 24, "64,92,48", 0.5);
    else blob(cx, cy, 40 + rnd() * 60, "52,40,28", 0.34);
  }
  if (kind === "damage") {
    // Exposed roof plywood/sheathing planks inside the damaged/missing area
    c.save();
    c.beginPath();
    c.arc(S / 2, S / 2, S * 0.2, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "rgba(130,94,60,0.96)";
    c.fillRect(0, 0, S, S);
    c.strokeStyle = "rgba(38,26,16,0.9)";
    c.lineWidth = 3;
    for (let y = S * 0.25; y < S * 0.8; y += 24) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(S, y);
      c.stroke();
    }
    c.restore();
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

/** Neutral-toned vertical wood plank texture meant to be tinted by any FenceFinish color. */
export function createFenceWoodTexture(anisotropy: number): PBRTextures {
  const S = 512;
  const color = makeCanvas(S);
  const bump = makeCanvas(S);
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;
  const rnd = mulberry32(613);

  const boards = 8;
  const bw = S / boards;
  b.fillStyle = "#b0b0b0";
  b.fillRect(0, 0, S, S);

  for (let i = 0; i < boards; i++) {
    const x = i * bw;
    const tone = 218 + Math.floor(rnd() * 34);
    c.fillStyle = `rgb(${tone},${tone - 4},${tone - 9})`;
    c.fillRect(x, 0, bw, S);

    // Subtle woodgrain lines running vertically along each picket/slat
    for (let k = 0; k < 22; k++) {
      const gx = x + 3 + rnd() * (bw - 6);
      c.fillStyle = rnd() > 0.4 ? `rgba(55,35,20,${0.05 + rnd() * 0.08})` : `rgba(255,250,240,${0.04 + rnd() * 0.06})`;
      c.fillRect(gx, 0, 1 + rnd() * 1.4, S);
      b.fillStyle = `rgba(90,90,90,${0.08 + rnd() * 0.1})`;
      b.fillRect(gx, 0, 1.2, S);
    }

    // Crisp dark shadow gap between individual privacy boards
    c.fillStyle = "rgba(18,12,8,0.52)";
    c.fillRect(x, 0, 3, S);
    b.fillStyle = "#222222";
    b.fillRect(x, 0, 3.5, S);
  }
  speckle(c, rnd, S, S, 0.04, 5000, 1.4);
  return wrapPBR(color, bump, anisotropy);
}

/** Clean tongue-and-groove vinyl panel texture meant to be tinted by any vinyl FenceFinish color. */
export function createFenceVinylTexture(anisotropy: number): PBRTextures {
  const S = 512;
  const color = makeCanvas(S);
  const bump = makeCanvas(S);
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;

  c.fillStyle = "#f4f5f6";
  c.fillRect(0, 0, S, S);
  b.fillStyle = "#c8c8c8";
  b.fillRect(0, 0, S, S);

  const panels = 6;
  const pw = S / panels;
  for (let i = 0; i < panels; i++) {
    const x = i * pw;
    c.fillStyle = "rgba(30,38,48,0.16)";
    c.fillRect(x, 0, 2.5, S);
    c.fillStyle = "rgba(255,255,255,0.65)";
    c.fillRect(x + 2.5, 0, 2.5, S);
    b.fillStyle = "#404040";
    b.fillRect(x, 0, 3, S);
  }
  return wrapPBR(color, bump, anisotropy);
}

/** Translucent diamond-woven steel chain-link mesh texture (tinted by finish color). */
export function createChainLinkTexture(anisotropy: number): Texture {
  const S = 256;
  const cv = makeCanvas(S);
  const c = cv.getContext("2d")!;
  c.clearRect(0, 0, S, S);

  const step = 32;
  c.lineWidth = 4.2;
  c.strokeStyle = "#ffffff";
  for (let x = -S; x <= S * 2; x += step) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x + S, S);
    c.stroke();

    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x - S, S);
    c.stroke();
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}
