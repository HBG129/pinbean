import { useRef, useEffect, useCallback, type PointerEvent } from "react";
import type { BeadColor, BeadGrid } from "../types/bead";
import { EMPTY_CELL_ID } from "../lib/imageToBeads";

type CanvasGridProps = {
  grid: BeadGrid;
  colorMap: Map<string, BeadColor>;
  cellSize: number;
  showColorCode: boolean;
  onCellPointerDown: (index: number) => void;
  onCellPointerMove: (index: number) => void;
  onCellPointerUp: () => void;
};

function getReadableTextColor(hex: string) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 586 + b * 114) / 1000;
  return brightness > 150 ? "#111" : "#fff";
}

export function CanvasGrid({
  grid,
  colorMap,
  cellSize,
  showColorCode,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
}: CanvasGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerIndexRef = useRef<number | null>(null);

  const canvasWidth = grid.width * cellSize;
  const canvasHeight = grid.height * cellSize;

  /* ---- paint ---- */
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // background — match dark/light
    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? "#292524" : "#fff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const index = y * grid.width + x;
        const colorId = grid.cells[index];
        const color = colorMap.get(colorId);

        const left = x * cellSize;
        const top = y * cellSize;

        // cell fill
        ctx.fillStyle = colorId === EMPTY_CELL_ID ? "rgba(255,255,255,0)" : color?.hex || "#ffffff";
        ctx.fillRect(left, top, cellSize, cellSize);

        // cell border
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(left + 0.25, top + 0.25, cellSize - 0.5, cellSize - 0.5);

        // color code label
        if (showColorCode && cellSize >= 10 && color) {
          ctx.fillStyle = getReadableTextColor(color.hex);
          const fontSize = Math.max(7, Math.min(11, cellSize * 0.36));
          ctx.font = `900 ${fontSize}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(color.code, left + cellSize / 2, top + cellSize / 2);
        }
      }
    }
  }, [grid, colorMap, cellSize, showColorCode, canvasWidth, canvasHeight]);

  useEffect(() => {
    paint();
  }, [paint]);

  /* ---- click → cell index ---- */
  const getCellIndex = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      if (
        rect.width === 0 ||
        rect.height === 0 ||
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;

      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      const col = Math.floor(mx / cellSize);
      const row = Math.floor(my / cellSize);

      if (col < 0 || col >= grid.width || row < 0 || row >= grid.height) return null;

      return row * grid.width + col;
    },
    [grid.width, grid.height, cellSize, canvasWidth, canvasHeight]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const index = getCellIndex(event.clientX, event.clientY);
      if (index === null) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointerIdRef.current = event.pointerId;
      lastPointerIndexRef.current = index;
      onCellPointerDown(index);
    },
    [getCellIndex, onCellPointerDown]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      const index = getCellIndex(event.clientX, event.clientY);
      if (index === null || index === lastPointerIndexRef.current) return;

      event.preventDefault();
      lastPointerIndexRef.current = index;
      onCellPointerMove(index);
    },
    [getCellIndex, onCellPointerMove]
  );

  const handlePointerEnd = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      event.preventDefault();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      activePointerIdRef.current = null;
      lastPointerIndexRef.current = null;
      onCellPointerUp();
    },
    [onCellPointerUp]
  );

  return (
    <div ref={containerRef} className="inline-block overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="block cursor-crosshair"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
