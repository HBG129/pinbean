import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useCallback, useRef, type PointerEvent } from "react";
import type { BeadColor, BeadGrid } from "../types/bead";
import { exportBeadGridPng } from "../lib/exportPng";
import { EMPTY_CELL_ID } from "../lib/imageToBeads";
import { CanvasGrid } from "./CanvasGrid";

export type BeadCanvasProps = {
  grid: BeadGrid | null;
  palette: BeadColor[];
  colorMap: Map<string, BeadColor>;
  displayCellSize: number;
  showColorCode: boolean;
  fitView: boolean;
  onCellPointerDown: (index: number) => void;
  onCellPointerMove: (index: number) => void;
  onCellPointerUp: () => void;
  onToggleColorCode: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

function getReadableTextColor(hex: string) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 586 + b * 114) / 1000;
  return brightness > 150 ? "#111111" : "#ffffff";
}

export function BeadCanvas({
  grid,
  palette,
  colorMap,
  displayCellSize,
  showColorCode,
  fitView,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
  onToggleColorCode,
  onFitView,
  onZoomIn,
  onZoomOut,
}: BeadCanvasProps) {
  const domGridRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerIndexRef = useRef<number | null>(null);

  const getDomCellIndex = useCallback(
    (clientX: number, clientY: number) => {
      if (!grid) return null;
      const gridEl = domGridRef.current;
      if (!gridEl) return null;

      const rect = gridEl.getBoundingClientRect();
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

      const col = Math.floor(((clientX - rect.left) / rect.width) * grid.width);
      const row = Math.floor(((clientY - rect.top) / rect.height) * grid.height);
      if (col < 0 || col >= grid.width || row < 0 || row >= grid.height) return null;
      return row * grid.width + col;
    },
    [grid]
  );

  const handleDomPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const index = getDomCellIndex(event.clientX, event.clientY);
      if (index === null) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointerIdRef.current = event.pointerId;
      lastPointerIndexRef.current = index;
      onCellPointerDown(index);
    },
    [getDomCellIndex, onCellPointerDown]
  );

  const handleDomPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      const index = getDomCellIndex(event.clientX, event.clientY);
      if (index === null || index === lastPointerIndexRef.current) return;

      event.preventDefault();
      lastPointerIndexRef.current = index;
      onCellPointerMove(index);
    },
    [getDomCellIndex, onCellPointerMove]
  );

  const handleDomPointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
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
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold dark:text-stone-100">拼豆格子图</h2>
          {grid && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {grid.width} × {grid.height}，当前显示尺寸：{displayCellSize}px / 格
            </p>
          )}
        </div>

        <div className="hidden">
          <button
            onClick={() => grid && exportBeadGridPng(grid, palette, { showCode: false, cellSize: 18, fileName: "拼豆图.png" })}
            disabled={!grid}
            className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition duration-150 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
          >
            导出 PNG
          </button>

          <button
            onClick={() => grid && exportBeadGridPng(grid, palette, { showCode: true, cellSize: 34, fileName: "拼豆图-带色号.png" })}
            disabled={!grid}
            className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition duration-150 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
          >
            导出带色号 PNG
          </button>

          <button
            onClick={onToggleColorCode}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition duration-150 ${
              showColorCode
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300"
            }`}
          >
            {showColorCode ? "隐藏色号" : "显示色号"}
          </button>

          <button
            onClick={onFitView}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition duration-150 ${
              fitView
                ? "bg-orange-500 text-white"
                : "bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300"
            }`}
          >
            <Maximize2 size={16} />
            适应窗口
          </button>

          <button
            onClick={onZoomOut}
            className="rounded-xl bg-stone-100 p-2 transition duration-150 active:scale-[0.92] dark:bg-stone-700 dark:text-stone-200"
          >
            <ZoomOut size={18} />
          </button>

          <button
            onClick={onZoomIn}
            className="rounded-xl bg-stone-100 p-2 transition duration-150 active:scale-[0.92] dark:bg-stone-700 dark:text-stone-200"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {!grid ? (
        <div className="flex h-[680px] items-center justify-center rounded-2xl bg-stone-50 text-stone-400 dark:bg-stone-800/50 dark:text-stone-500">
          上传图片并生成后，这里会显示拼豆图
        </div>
      ) : grid.width * grid.height > 10000 ? (
        /* ---- large grid: Canvas ---- */
        <div className="flex items-center justify-center overflow-auto rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/50" style={{ maxHeight: 680 }}>
          <CanvasGrid
            grid={grid}
            colorMap={colorMap}
            cellSize={displayCellSize}
            showColorCode={showColorCode}
            onCellPointerDown={onCellPointerDown}
            onCellPointerMove={onCellPointerMove}
            onCellPointerUp={onCellPointerUp}
          />
        </div>
      ) : (
        /* ---- small grid: DOM ---- */
        <div className="flex h-[680px] items-center justify-center overflow-auto rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/50">
          <div
            ref={domGridRef}
            onPointerDown={handleDomPointerDown}
            onPointerMove={handleDomPointerMove}
            onPointerUp={handleDomPointerEnd}
            onPointerCancel={handleDomPointerEnd}
            className="grid w-fit overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm dark:border-stone-600 dark:bg-stone-800"
            style={{
              gridTemplateColumns: `repeat(${grid.width}, ${displayCellSize}px)`,
              touchAction: "none",
            }}
          >
            {grid.cells.map((colorId, index) => {
              const color = colorMap.get(colorId);
              const empty = colorId === EMPTY_CELL_ID;
              return (
                <button
                  key={index}
                  title={empty ? "空白格" : color ? `${color.code} ${color.hex}` : colorId}
                  className="flex items-center justify-center overflow-hidden border border-black/5 font-black leading-none transition duration-150 hover:brightness-90 dark:border-white/10"
                  style={{
                    width: displayCellSize,
                    height: displayCellSize,
                    backgroundColor: empty ? "transparent" : color?.hex || "#ffffff",
                    color: color ? getReadableTextColor(color.hex) : "#111111",
                    fontSize: Math.max(7, Math.min(11, displayCellSize * 0.36)),
                  }}
                >
                  {showColorCode && displayCellSize >= 10 && color ? color.code : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
