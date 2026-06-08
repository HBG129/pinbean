import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { BeadColor, BeadGrid } from "../types/bead";
import { exportBeadGridPng } from "../lib/exportPng";
import { CanvasGrid } from "./CanvasGrid";

export type BeadCanvasProps = {
  grid: BeadGrid | null;
  palette: BeadColor[];
  colorMap: Map<string, BeadColor>;
  displayCellSize: number;
  showColorCode: boolean;
  fitView: boolean;
  onCellClick: (index: number) => void;
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
  onCellClick,
  onToggleColorCode,
  onFitView,
  onZoomIn,
  onZoomOut,
}: BeadCanvasProps) {
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

        <div className="flex flex-wrap items-center gap-2">
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
            onCellClick={onCellClick}
          />
        </div>
      ) : (
        /* ---- small grid: DOM ---- */
        <div className="flex h-[680px] items-center justify-center overflow-auto rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/50">
          <div
            className="grid w-fit overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm dark:border-stone-600 dark:bg-stone-800"
            style={{ gridTemplateColumns: `repeat(${grid.width}, ${displayCellSize}px)` }}
          >
            {grid.cells.map((colorId, index) => {
              const color = colorMap.get(colorId);
              return (
                <button
                  key={index}
                  onClick={() => onCellClick(index)}
                  title={color ? `${color.code} ${color.hex}` : colorId}
                  className="flex items-center justify-center overflow-hidden border border-black/5 font-black leading-none transition duration-150 hover:brightness-90 dark:border-white/10"
                  style={{
                    width: displayCellSize,
                    height: displayCellSize,
                    backgroundColor: color?.hex || "#ffffff",
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
