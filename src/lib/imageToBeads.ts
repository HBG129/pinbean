import type { BeadColor, BeadGrid, ColorStat } from "../types/bead";
import { findNearestBeadColor } from "./colorMatch";

export const EMPTY_CELL_ID = "__empty__";

export async function imageToBeadGrid(params: {
  file: File;
  width: number;
  height: number;
  colors: BeadColor[];
  backgroundColor?: string;
  preserveTransparency?: boolean;
  dither?: boolean;
}): Promise<BeadGrid> {
  const {
    file,
    width,
    height,
    colors,
    backgroundColor = "#ffffff",
    preserveTransparency = true,
    dither = false,
  } = params;

  const image = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 初始化失败");
  }

  if (!preserveTransparency) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > targetRatio) {
    drawWidth = width;
    drawHeight = width / imageRatio;
    offsetY = (height - drawHeight) / 2;
  } else {
    drawHeight = height;
    drawWidth = height * imageRatio;
    offsetX = (width - drawWidth) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const imageData = ctx.getImageData(0, 0, width, height);
  const cells: string[] = new Array(width * height);

  if (dither) {
    applyDitheredMatch(imageData.data, width, height, colors, cells);
  } else {
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3];

      if (preserveTransparency && alpha < 24) {
        cells[i / 4] = EMPTY_CELL_ID;
        continue;
      }

      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      const nearest = findNearestBeadColor({ r, g, b }, colors);
      cells[i / 4] = nearest.id;
    }
  }

  return {
    width,
    height,
    cells,
  };
}

function applyDitheredMatch(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colors: BeadColor[],
  cells: string[]
) {
  const work = new Float32Array(width * height * 4);

  for (let i = 0; i < data.length; i++) {
    work[i] = data[i];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      const index = pixel * 4;

      if (work[index + 3] < 24) {
        cells[pixel] = EMPTY_CELL_ID;
        continue;
      }

      const oldRgb = {
        r: clampColor(work[index]),
        g: clampColor(work[index + 1]),
        b: clampColor(work[index + 2]),
      };
      const nearest = findNearestBeadColor(oldRgb, colors);
      cells[pixel] = nearest.id;

      const error = {
        r: oldRgb.r - nearest.rgb.r,
        g: oldRgb.g - nearest.rgb.g,
        b: oldRgb.b - nearest.rgb.b,
      };

      distributeError(work, width, height, x + 1, y, error, 7 / 16);
      distributeError(work, width, height, x - 1, y + 1, error, 3 / 16);
      distributeError(work, width, height, x, y + 1, error, 5 / 16);
      distributeError(work, width, height, x + 1, y + 1, error, 1 / 16);
    }
  }
}

function distributeError(
  work: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  error: { r: number; g: number; b: number },
  factor: number
) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = (y * width + x) * 4;
  if (work[index + 3] < 24) return;
  work[index] += error.r * factor;
  work[index + 1] += error.g * factor;
  work[index + 2] += error.b * factor;
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };

    image.src = url;
  });
}

export function getColorStats(
  grid: BeadGrid,
  colors: BeadColor[]
): ColorStat[] {
  const map = new Map<string, number>();

  for (const colorId of grid.cells) {
    if (colorId === EMPTY_CELL_ID) continue;
    map.set(colorId, (map.get(colorId) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([colorId, count]) => {
      const color = colors.find((item) => item.id === colorId);

      if (!color) return null;

      return {
        color,
        count,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.count - a!.count) as ColorStat[];
}

export function replaceColorInGrid(
  grid: BeadGrid,
  fromColorId: string,
  toColorId: string
): BeadGrid {
  return {
    ...grid,
    cells: grid.cells.map((id) => (id === fromColorId ? toColorId : id)),
  };
}

export function updateSingleCell(
  grid: BeadGrid,
  index: number,
  colorId: string
): BeadGrid {
  const cells = [...grid.cells];
  cells[index] = colorId;

  return {
    ...grid,
    cells,
  };
}
