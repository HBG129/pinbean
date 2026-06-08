import type { BeadColor, BeadGrid, ColorStat } from "../types/bead";
import { findNearestBeadColor } from "./colorMatch";

export async function imageToBeadGrid(params: {
  file: File;
  width: number;
  height: number;
  colors: BeadColor[];
  backgroundColor?: string;
}): Promise<BeadGrid> {
  const {
    file,
    width,
    height,
    colors,
    backgroundColor = "#ffffff",
  } = params;

  const image = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 初始化失败");
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

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
  const cells: string[] = [];

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    const nearest = findNearestBeadColor({ r, g, b }, colors);
    cells.push(nearest.id);
  }

  return {
    width,
    height,
    cells,
  };
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