import { ImagePlus, RefreshCw } from "lucide-react";
import type { BeadColor } from "../types/bead";

export type UploadPanelProps = {
  file: File | null;
  previewUrl: string;
  width: number;
  height: number;
  loading: boolean;
  imageSizeText: string;
  palette: BeadColor[];
  onFileChange: (file: File) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onGenerate: () => void;
};

export function UploadPanel({
  file,
  previewUrl,
  width,
  height,
  loading,
  imageSizeText,
  palette,
  onFileChange,
  onWidthChange,
  onHeightChange,
  onGenerate,
}: UploadPanelProps) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
      <h2 className="mb-4 text-lg font-bold dark:text-stone-100">生成设置</h2>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-5 text-center transition duration-150 hover:bg-stone-100 active:scale-[0.98] dark:border-stone-600 dark:bg-stone-800/50 dark:hover:bg-stone-700">
        <ImagePlus className="mb-2 dark:text-stone-300" />
        <span className="break-all text-sm text-stone-600 dark:text-stone-300">
          {file ? file.name : "点击上传图片"}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const nextFile = event.target.files?.[0];
            if (nextFile) onFileChange(nextFile);
          }}
        />
      </label>

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50">
          <img
            src={previewUrl}
            alt="原图预览"
            className="max-h-44 w-full object-contain"
          />
        </div>
      )}

      {imageSizeText && (
        <div className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-xs leading-5 text-stone-600 dark:bg-orange-900/20 dark:text-stone-300">
          {imageSizeText}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="text-sm font-medium dark:text-stone-200">
          宽度
          <input
            type="number"
            min={1}
            max={300}
            value={width}
            onChange={(event) => onWidthChange(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          />
        </label>
        <label className="text-sm font-medium dark:text-stone-200">
          高度
          <input
            type="number"
            min={1}
            max={300}
            value={height}
            onChange={(event) => onHeightChange(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          />
        </label>
      </div>

      <button
        onClick={onGenerate}
        disabled={!file || loading || palette.length === 0}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 font-bold text-white transition duration-150 hover:bg-orange-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-stone-300 dark:disabled:bg-stone-600"
      >
        <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
        {loading ? "生成中" : "生成拼豆图"}
      </button>
    </section>
  );
}
