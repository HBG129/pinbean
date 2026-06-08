import type { BeadColor, RGB } from "../types/bead";

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

type Lab = {
  l: number;
  a: number;
  b: number;
};

function srgbToLinear(value: number) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToLab(rgb: RGB): Lab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  x = x / 0.95047;
  y = y / 1.0;
  z = z / 1.08883;

  const fx = xyzToLabComponent(x);
  const fy = xyzToLabComponent(y);
  const fz = xyzToLabComponent(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function xyzToLabComponent(value: number) {
  return value > 0.008856
    ? Math.cbrt(value)
    : 7.787 * value + 16 / 116;
}

function labDistance(a: Lab, b: Lab): number {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;

  return dl * dl + da * da + db * db;
}

const labCache = new Map<string, Lab>();

function getColorLab(color: BeadColor): Lab {
  const cached = labCache.get(color.id);

  if (cached) {
    return cached;
  }

  const lab = rgbToLab(color.rgb);
  labCache.set(color.id, lab);
  return lab;
}

export function findNearestBeadColor(
  rgb: RGB,
  colors: BeadColor[]
): BeadColor {
  const targetLab = rgbToLab(rgb);

  let nearest = colors[0];
  let minDistance = Number.POSITIVE_INFINITY;

  for (const color of colors) {
    const colorLab = getColorLab(color);
    const distance = labDistance(targetLab, colorLab);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = color;
    }
  }

  return nearest;
}