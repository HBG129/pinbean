import { Link2, Unlink2 } from "lucide-react";
import { SIZE_PRESETS, type SizePreset } from "../lib/editorSizing";

type Props = {
  preset: SizePreset;
  width: number;
  height: number;
  locked: boolean;
  onPresetChange: (preset: SizePreset) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onLockedChange: (locked: boolean) => void;
};

export function SizePresetControl({
  preset,
  width,
  height,
  locked,
  onPresetChange,
  onWidthChange,
  onHeightChange,
  onLockedChange,
}: Props) {
  const presets: SizePreset[] = ["small", "medium", "large", "custom"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700">
        {presets.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPresetChange(item)}
            className={`rounded-xl px-2 py-2 text-xs font-black transition ${
              preset === item
                ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500"
            }`}
          >
            {item === "custom" ? "自定义" : SIZE_PRESETS[item].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="text-xs font-bold text-stone-500">
          宽
          <input
            type="number"
            min={1}
            max={300}
            value={width}
            onChange={(event) => onWidthChange(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          />
        </label>

        <button
          type="button"
          onClick={() => onLockedChange(!locked)}
          title={locked ? "锁定比例" : "自由比例"}
          className="mb-0.5 rounded-xl bg-stone-100 p-2.5 text-stone-500 transition hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"
        >
          {locked ? <Link2 size={16} /> : <Unlink2 size={16} />}
        </button>

        <label className="text-xs font-bold text-stone-500">
          高
          <input
            type="number"
            min={1}
            max={300}
            value={height}
            onChange={(event) => onHeightChange(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          />
        </label>
      </div>
    </div>
  );
}
