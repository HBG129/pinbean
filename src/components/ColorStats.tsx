import { Download } from "lucide-react";
import type { BeadGrid, ColorStat } from "../types/bead";
import { exportMaterialExcel } from "../lib/exportExcel";

export type ColorStatsPanelProps = {
  grid: BeadGrid | null;
  stats: ColorStat[];
};

export function ColorStatsPanel({ grid, stats }: ColorStatsPanelProps) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold dark:text-stone-100">颜色统计</h2>
          {grid ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              所需拼豆总数：{grid.width * grid.height} 颗，使用颜色数量：{stats.length} 色
            </p>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500">暂无统计数据</p>
          )}
        </div>
        <button
          onClick={() => grid && exportMaterialExcel(grid, stats)}
          disabled={!grid}
          className="flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 font-bold text-white transition duration-150 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
        >
          <Download size={18} />
          导出 Excel
        </button>
      </div>

      {grid && (
        <div className="grid max-h-56 grid-cols-2 gap-2 overflow-auto pr-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map((item) => (
            <div
              key={item.color.id}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-800/50"
            >
              <div
                className="h-7 w-7 rounded-lg border border-stone-200 dark:border-stone-600"
                style={{ backgroundColor: item.color.hex }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold dark:text-stone-200">
                  {item.color.code}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{item.color.hex}</p>
              </div>
              <p className="font-black dark:text-stone-200">{item.count}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
