import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import type { BeadColor, BeadGrid, ColorStat } from "../types/bead";
import { exportMaterialExcel } from "../lib/exportExcel";
import { exportBeadGridPng } from "../lib/exportPng";

type ExportQuality = "standard" | "high" | "print";

type Props = {
  grid: BeadGrid | null;
  palette: BeadColor[];
  stats: ColorStat[];
  projectTitle: string;
};

const QUALITY_CELL_SIZE: Record<ExportQuality, number> = {
  standard: 18,
  high: 28,
  print: 34,
};

export function ExportPanel({ grid, palette, stats, projectTitle }: Props) {
  const [showCode, setShowCode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [quality, setQuality] = useState<ExportQuality>("high");

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <div className="mb-4">
        <h2 className="text-lg font-bold dark:text-stone-100">制作输出</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          导出适合制作、打印和备料的文件。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-200">
              <input
                type="checkbox"
                checked={showCode}
                onChange={(event) => setShowCode(event.target.checked)}
              />
              显示色号
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-200">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(event) => setShowGrid(event.target.checked)}
              />
              显示格线
            </label>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700">
            {[
              { key: "standard", label: "普通" },
              { key: "high", label: "高清" },
              { key: "print", label: "打印" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setQuality(item.key as ExportQuality)}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  quality === item.key
                    ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100"
                    : "text-stone-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72">
          <button
            onClick={() =>
              grid &&
              exportBeadGridPng(grid, palette, {
                showCode,
                showGrid,
                cellSize: QUALITY_CELL_SIZE[quality],
                fileName: showCode ? "PinBean-带色号.png" : "PinBean-拼豆图.png",
                background: "#ffffff",
              })
            }
            disabled={!grid}
            className="flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-black text-white transition active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
          >
            <Download size={17} />
            PNG
          </button>
          <button
            onClick={() =>
              grid && exportMaterialExcel(grid, stats, { title: projectTitle })
            }
            disabled={!grid}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>
        </div>
      </div>
    </section>
  );
}
