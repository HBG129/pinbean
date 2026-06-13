import type { BeadColor, BeadGrid, ColorStat } from "../types/bead";

export type ColorReplacePanelProps = {
  selectedColorId: string;
  replaceFrom: string;
  replaceTo: string;
  palette: BeadColor[];
  stats: ColorStat[];
  grid: BeadGrid | null;
  onSelectedColorChange: (colorId: string) => void;
  onReplaceFromChange: (colorId: string) => void;
  onReplaceToChange: (colorId: string) => void;
  onReplaceColor: () => void;
};

function Swatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block h-5 w-5 shrink-0 rounded-md border border-stone-300 dark:border-stone-500"
      style={{ backgroundColor: hex }}
    />
  );
}

export function ColorReplacePanel({
  selectedColorId,
  replaceFrom,
  replaceTo,
  palette,
  stats,
  grid,
  onSelectedColorChange,
  onReplaceFromChange,
  onReplaceToChange,
  onReplaceColor,
}: ColorReplacePanelProps) {
  const selectedColor = palette.find((c) => c.id === selectedColorId);
  const fromColor = stats.find((s) => s.color.id === replaceFrom)?.color;
  const toColor = palette.find((c) => c.id === replaceTo);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <h2 className="mb-4 text-lg font-bold dark:text-stone-100">编辑工具</h2>

      <label className="text-sm font-medium dark:text-stone-200">
        当前画笔颜色
        <div className="relative mt-1">
          {selectedColor && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Swatch hex={selectedColor.hex} />
            </div>
          )}
          <select
            value={selectedColorId}
            onChange={(event) => onSelectedColorChange(event.target.value)}
            className="w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          >
            {palette.map((color) => (
              <option key={color.id} value={color.id}>
                {color.code} | {color.hex}
              </option>
            ))}
          </select>
        </div>
      </label>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-bold dark:text-stone-200">一键替换颜色</h3>

        {/* replace FROM */}
        <label className="mb-1 block text-xs text-stone-400 dark:text-stone-500">
          将哪种颜色替换掉
        </label>
        <div className="relative mb-2">
          {fromColor && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Swatch hex={fromColor.hex} />
            </div>
          )}
          <select
            value={replaceFrom}
            onChange={(event) => onReplaceFromChange(event.target.value)}
            className="w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          >
            <option value="">选择要替换的颜色</option>
            {stats.map((item) => (
              <option key={item.color.id} value={item.color.id}>
                {item.color.code} | {item.color.hex} ({item.count}颗)
              </option>
            ))}
          </select>
        </div>

        {/* replace TO */}
        <label className="mb-1 block text-xs text-stone-400 dark:text-stone-500">
          替换成什么颜色
        </label>
        <div className="relative mb-2">
          {toColor && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Swatch hex={toColor.hex} />
            </div>
          )}
          <select
            value={replaceTo}
            onChange={(event) => onReplaceToChange(event.target.value)}
            className="w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          >
            {palette.map((color) => (
              <option key={color.id} value={color.id}>
                {color.code} | {color.hex}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onReplaceColor}
          disabled={!grid || !replaceFrom}
          className="w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition duration-150 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
        >
          确认替换
        </button>
      </div>
    </section>
  );
}
