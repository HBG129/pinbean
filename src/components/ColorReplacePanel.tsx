import { useState, useRef, useEffect } from "react";
import type { BeadColor, BeadGrid, ColorStat } from "../types/bead";
import { ChevronDown } from "lucide-react";

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

function Swatch({ hex, size }: { hex: string; size?: number }) {
  const s = size || 20;
  return (
    <span
      className="inline-block shrink-0 rounded-md border border-stone-300 dark:border-stone-500"
      style={{ width: s, height: s, backgroundColor: hex }}
    />
  );
}

function ColorSelect({
  value,
  options,
  onChange,
  placeholder,
  showCount,
}: {
  value: string;
  options: (BeadColor & { count?: number })[];
  onChange: (id: string) => void;
  placeholder?: string;
  showCount?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-left text-sm outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
      >
        {selected ? (
          <>
            <Swatch hex={selected.hex} size={18} />
            <span className="flex-1">
              {selected.code} {selected.hex}
              {showCount && selected.count !== undefined && (
                <span className="ml-1 text-stone-400">({selected.count}颗)</span>
              )}
            </span>
          </>
        ) : (
          <span className="flex-1 text-stone-400">{placeholder || "请选择"}</span>
        )}
        <ChevronDown size={14} className={`shrink-0 text-stone-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl dark:border-stone-600 dark:bg-stone-700">
          {options.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => { onChange(color.id); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-stone-100 dark:hover:bg-stone-600"
            >
              <Swatch hex={color.hex} size={18} />
              <span className="flex-1 dark:text-stone-200">
                {color.code} {color.hex}
                {showCount && color.count !== undefined && (
                  <span className="ml-1 text-xs text-stone-400">({color.count}颗)</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
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
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <h2 className="mb-4 text-lg font-bold dark:text-stone-100">编辑工具</h2>

      <label className="text-sm font-medium dark:text-stone-200">
        当前画笔颜色
        <div className="mt-1">
          <ColorSelect value={selectedColorId} options={palette} onChange={onSelectedColorChange} />
        </div>
      </label>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-bold dark:text-stone-200">一键替换颜色</h3>

        <label className="mb-1 block text-xs text-stone-400 dark:text-stone-500">
          将哪种颜色替换掉
        </label>
        <ColorSelect
          value={replaceFrom}
          options={stats.map((s) => ({ ...s.color, count: s.count }))}
          onChange={onReplaceFromChange}
          placeholder="选择要替换的颜色"
          showCount
        />

        <label className="mb-1 mt-3 block text-xs text-stone-400 dark:text-stone-500">
          替换成什么颜色
        </label>
        <ColorSelect value={replaceTo} options={palette} onChange={onReplaceToChange} />

        <button
          onClick={onReplaceColor}
          disabled={!grid || !replaceFrom}
          className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition duration-150 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600"
        >
          确认替换
        </button>
      </div>
    </section>
  );
}
