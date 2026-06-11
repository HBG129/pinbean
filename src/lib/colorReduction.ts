import type { BeadColor, BeadGrid } from "../types/bead";
import { findNearestBeadColor } from "./colorMatch";

export type ColorComplexity = "simple" | "balanced" | "detailed";

export const COLOR_COMPLEXITY_LIMITS: Record<ColorComplexity, number> = {
  simple: 24,
  balanced: 48,
  detailed: 96,
};

export function reduceGridColors(
  grid: BeadGrid,
  palette: BeadColor[],
  maxColors: number
): BeadGrid {
  const counts = new Map<string, number>();
  for (const id of grid.cells) counts.set(id, (counts.get(id) ?? 0) + 1);

  if (counts.size <= maxColors) return grid;

  const keptIds = new Set(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxColors)
      .map(([id]) => id)
  );
  const colorById = new Map(palette.map((color) => [color.id, color]));
  const keptColors = palette.filter((color) => keptIds.has(color.id));
  const remap = new Map<string, string>();

  const cells = grid.cells.map((id) => {
    if (keptIds.has(id)) return id;
    const source = colorById.get(id);
    if (!source) return id;
    const cached = remap.get(id);
    if (cached) return cached;
    const nearest = findNearestBeadColor(source.rgb, keptColors);
    remap.set(id, nearest.id);
    return nearest.id;
  });

  return { ...grid, cells };
}
