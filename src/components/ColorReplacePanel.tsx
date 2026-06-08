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
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <h2 className="mb-4 text-lg font-bold dark:text-stone-100">编辑工具</h2>

      <label className="text-sm font-medium dark:text-stone-200">
        当前画笔颜色
        <select
          value={selectedColorId}
          onChange={(event) => onSelectedColorChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
        >
          {palette.map((color) => (
            <option key={color.id} value={color.id}>
              {color.code} | {color.hex}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-bold dark:text-stone-200">一键替换颜色</h3>

        <select
          value={replaceFrom}
          onChange={(event) => onReplaceFromChange(event.target.value)}
          className="mb-2 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
        >
          <option value="">选择要替换的颜色</option>
          {stats.map((item) => (
            <option key={item.color.id} value={item.color.id}>
              {item.color.code} | {item.color.hex}
            </option>
          ))}
        </select>

        <select
          value={replaceTo}
          onChange={(event) => onReplaceToChange(event.target.value)}
          className="mb-2 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
        >
          {palette.map((color) => (
            <option key={color.id} value={color.id}>
              {color.code} | {color.hex}
            </option>
          ))}
        </select>

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
