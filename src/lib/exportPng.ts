import type { BeadGrid } from "../types/bead";

type PaletteColor = {
  id: string;
  code: string;
  hex: string;
};

type ExportPngOptions = {
  showCode?: boolean;
  showGrid?: boolean;
  cellSize?: number;
  fileName?: string;
  background?: string;
};

function getReadableTextColor(hex: string) {
  const cleanHex = hex.replace("#", "");

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  const brightness = (r * 299 + g * 586 + b * 114) / 1000;

  return brightness > 150 ? "#111111" : "#ffffff";
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const url = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
}

export function exportBeadGridPng(
  grid: BeadGrid,
  palette: PaletteColor[],
  options: ExportPngOptions = {}
) {
  const showCode = options.showCode ?? false;
  const showGrid = options.showGrid ?? true;
  const cellSize = options.cellSize ?? (showCode ? 34 : 18);
  const background = options.background ?? "#ffffff";
  const fileName =
    options.fileName ?? (showCode ? "bead-grid-with-code.png" : "bead-grid.png");

  const colorMap = new Map(palette.map((color) => [color.id, color]));

  const canvas = document.createElement("canvas");
  canvas.width = grid.width * cellSize;
  canvas.height = grid.height * cellSize;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("浏览器不支持 Canvas 导出");
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const index = y * grid.width + x;
      const colorId = grid.cells[index];
      const color = colorMap.get(colorId);

      const left = x * cellSize;
      const top = y * cellSize;

      ctx.fillStyle = color?.hex || "#ffffff";
      ctx.fillRect(left, top, cellSize, cellSize);

      if (showGrid) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.16)";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, cellSize, cellSize);
      }

      if (showCode && color && cellSize >= 24) {
        ctx.fillStyle = getReadableTextColor(color.hex);
        ctx.font = `700 ${Math.max(8, Math.floor(cellSize * 0.34))}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(color.code, left + cellSize / 2, top + cellSize / 2);
      }
    }
  }

  downloadCanvas(canvas, fileName);
}
