import { Undo2, Redo2, Save, Trash2, FolderOpen } from "lucide-react";
import type { BeadColor, BeadGrid, ColorStat } from "../types/bead";
import type { LocalProject } from "../lib/localProjects";
import type { ColorComplexity } from "../lib/colorReduction";
import type { ImageInfo, SizePreset } from "../lib/editorSizing";
import { UploadPanel } from "./UploadPanel";
import { ColorReplacePanel } from "./ColorReplacePanel";

export type SidebarContentProps = {
  file: File | null;
  previewUrl: string;
  width: number;
  height: number;
  imageInfo: ImageInfo | null;
  sizePreset: SizePreset;
  lockAspectRatio: boolean;
  colorComplexity: ColorComplexity;
  loading: boolean;
  imageSizeText: string;
  palette: BeadColor[];
  usingCustomPalette: boolean;
  selectedColorId: string;
  replaceFrom: string;
  replaceTo: string;
  stats: ColorStat[];
  grid: BeadGrid | null;
  projectTitle: string;
  projects: LocalProject[];
  gridState: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
  onFileChange: (file: File) => void;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onSizePresetChange: (preset: SizePreset) => void;
  onLockAspectRatioChange: (locked: boolean) => void;
  onColorComplexityChange: (complexity: ColorComplexity) => void;
  onGenerate: () => void;
  onSelectedColorChange: (id: string) => void;
  onReplaceFromChange: (id: string) => void;
  onReplaceToChange: (id: string) => void;
  onReplaceColor: () => void;
  onPaletteCsvChange: (file: File) => void;
  onResetPalette: () => void;
  onSaveProject: () => void;
  onOpenProject: (project: LocalProject) => void;
  onDeleteProject: (id: string) => void;
  onProjectTitleChange: (title: string) => void;
  onCloseSidebar?: () => void;
};

export function SidebarContent({
  file, previewUrl, width, height, imageInfo, sizePreset, lockAspectRatio,
  colorComplexity,
  loading, imageSizeText, palette,
  usingCustomPalette, selectedColorId, replaceFrom, replaceTo,
  stats, grid, projectTitle, projects, gridState,
  onFileChange, onWidthChange, onHeightChange, onSizePresetChange,
  onLockAspectRatioChange, onColorComplexityChange, onGenerate,
  onSelectedColorChange, onReplaceFromChange, onReplaceToChange,
  onReplaceColor, onPaletteCsvChange, onResetPalette,
  onSaveProject, onOpenProject, onDeleteProject, onProjectTitleChange,
  onCloseSidebar,
}: SidebarContentProps) {
  return (
    <>
      <UploadPanel
        file={file}
        previewUrl={previewUrl}
        width={width}
        height={height}
        imageInfo={imageInfo}
        sizePreset={sizePreset}
        lockAspectRatio={lockAspectRatio}
        colorComplexity={colorComplexity}
        loading={loading}
        imageSizeText={imageSizeText}
        palette={palette}
        onFileChange={onFileChange}
        onWidthChange={onWidthChange}
        onHeightChange={onHeightChange}
        onSizePresetChange={onSizePresetChange}
        onLockAspectRatioChange={onLockAspectRatioChange}
        onColorComplexityChange={onColorComplexityChange}
        onGenerate={onGenerate}
      />

      {/* Undo / Redo */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={gridState.undo}
            disabled={!gridState.canUndo}
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium transition duration-150 active:scale-[0.97] disabled:opacity-40 dark:bg-stone-700 dark:text-stone-200"
          >
            <Undo2 size={16} />撤销
          </button>
          <button
            onClick={gridState.redo}
            disabled={!gridState.canRedo}
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium transition duration-150 active:scale-[0.97] disabled:opacity-40 dark:bg-stone-700 dark:text-stone-200"
          >
            <Redo2 size={16} />重做
          </button>
        </div>
      </section>

      {/* Palette Settings */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
        <h2 className="mb-4 text-lg font-bold dark:text-stone-100">色卡设置</h2>
        <div className="mb-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600 dark:bg-stone-800/50 dark:text-stone-300">
          <p>当前色卡：{usingCustomPalette ? "自定义 CSV 色卡" : "默认内置色卡"}</p>
          <p>颜色数量：{palette.length} 色</p>
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm font-medium transition duration-150 hover:bg-stone-100 active:scale-[0.98] dark:border-stone-600 dark:bg-stone-800/50 dark:text-stone-200 dark:hover:bg-stone-700">
          导入 CSV 色卡
          <input type="file" accept=".csv,text/csv" className="hidden"
            onChange={(event) => { const f = event.target.files?.[0]; if (f) onPaletteCsvChange(f); event.target.value = ""; }} />
        </label>
        <button onClick={onResetPalette} disabled={!usingCustomPalette}
          className="mt-3 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition duration-150 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600">
          恢复默认色卡
        </button>
        <div className="mt-4 rounded-2xl bg-orange-50 p-3 text-xs leading-5 text-stone-600 dark:bg-orange-900/20 dark:text-stone-300">
          CSV 表头需要包含：色号、HEX。<br />例如：A1,#faf5cd
        </div>
      </section>

      <ColorReplacePanel
        selectedColorId={selectedColorId}
        replaceFrom={replaceFrom}
        replaceTo={replaceTo}
        palette={palette}
        stats={stats}
        grid={grid}
        onSelectedColorChange={onSelectedColorChange}
        onReplaceFromChange={onReplaceFromChange}
        onReplaceToChange={onReplaceToChange}
        onReplaceColor={onReplaceColor}
      />

      {/* Project Library */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700">
        <h2 className="mb-4 text-lg font-bold dark:text-stone-100">本地作品库</h2>
        <input value={projectTitle} onChange={(e) => onProjectTitleChange(e.target.value)}
          placeholder="作品名称"
          className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none transition duration-150 focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400" />
        <button onClick={onSaveProject} disabled={!grid}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 font-bold text-white transition duration-150 hover:bg-orange-600 active:scale-[0.97] disabled:bg-stone-300 dark:disabled:bg-stone-600">
          <Save size={18} />保存当前作品
        </button>
        {projects.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500">还没有保存的作品</p>
        ) : (
          <div className="max-h-48 overflow-auto">
            {projects.map((project) => (
              <div key={project.id} className="mb-2 rounded-2xl border border-stone-100 p-3 dark:border-stone-700">
                <p className="font-bold dark:text-stone-100">{project.title}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{project.grid.width} × {project.grid.height}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button onClick={() => { onOpenProject(project); onCloseSidebar?.(); }}
                    className="flex items-center justify-center gap-1 rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium transition duration-150 active:scale-[0.97] dark:bg-stone-700 dark:text-stone-200">
                    <FolderOpen size={15} />打开
                  </button>
                  <button onClick={() => onDeleteProject(project.id)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition duration-150 active:scale-[0.97] dark:bg-red-900/20 dark:text-red-400">
                    <Trash2 size={15} />删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
