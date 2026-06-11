import type { BeadGrid, ColorStat } from "../types/bead";

export type ColorStatsPanelProps = {
  grid: BeadGrid | null;
  stats: ColorStat[];
  selectedColorId: string;
  onSelectedColorChange: (id: string) => void;
};

export function ColorStatsPanel({
  grid,
  stats,
  selectedColorId,
  onSelectedColorChange,
}: ColorStatsPanelProps) {
  const total = stats.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold dark:text-stone-100">颜色统计</h2>
          {grid ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              共 {total.toLocaleString()} 颗，使用 {stats.length} 色。点击颜色可设为画笔。
            </p>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500">
              暂无统计数据
            </p>
          )}
        </div>
      </div>

      {grid && (
        <div className="grid max-h-56 grid-cols-2 gap-2 overflow-auto pr-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map((item) => {
            const percent = total
              ? Math.round((item.count / total) * 1000) / 10
              : 0;
            const active = selectedColorId === item.color.id;

            return (
              <button
                key={item.color.id}
                type="button"
                onClick={() => onSelectedColorChange(item.color.id)}
                className={`grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-xl border p-2 text-left transition active:scale-[0.98] ${
                  active
                    ? "border-orange-300 bg-orange-50 ring-2 ring-orange-200 dark:border-orange-500/60 dark:bg-orange-900/20 dark:ring-orange-500/20"
                    : "border-stone-100 bg-stone-50 hover:border-stone-200 dark:border-stone-700 dark:bg-stone-800/50"
                }`}
              >
                <span
                  className="h-7 w-7 rounded-lg border border-stone-200 dark:border-stone-600"
                  style={{ backgroundColor: item.color.hex }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold dark:text-stone-200">
                    {item.color.code}
                  </span>
                  <span className="block text-xs text-stone-400 dark:text-stone-500">
                    {item.color.hex} · {percent}%
                  </span>
                </span>
                <span className="font-black dark:text-stone-200">{item.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
