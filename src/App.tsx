import { useMemo, useState } from "react";
import {
  Sun, Moon, Menu, X,
} from "lucide-react";
import { beadColors221 } from "./data/beadColors221";
import type { BeadGrid } from "./types/bead";
import {
  getColorStats,
  imageToBeadGrid,
  replaceColorInGrid,
  updateSingleCell,
} from "./lib/imageToBeads";
import { useHistoryState } from "./hooks/useHistoryState";
import {
  deleteLocalProject,
  getLocalProjects,
  saveLocalProject,
  type LocalProject,
} from "./lib/localProjects";
import {
  clearCustomPalette,
  getActivePalette,
  hasCustomPalette,
  parsePaletteCsv,
  saveCustomPalette,
} from "./lib/paletteStorage";
import { useDarkMode } from "./hooks/useDarkMode";
import { SidebarContent, type SidebarContentProps } from "./components/SidebarContent";
import { BeadCanvas } from "./components/BeadCanvas";
import { ColorStatsPanel } from "./components/ColorStats";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const gridState = useHistoryState<BeadGrid | null>(null);

  const [palette, setPalette] = useState(() => getActivePalette());
  const [usingCustomPalette, setUsingCustomPalette] = useState(() =>
    hasCustomPalette()
  );

  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [imageSizeText, setImageSizeText] = useState("");

  const [selectedColorId, setSelectedColorId] = useState(
    () => getActivePalette()[0]?.id || beadColors221[0].id
  );
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState(
    () => getActivePalette()[0]?.id || beadColors221[0].id
  );

  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [fitView, setFitView] = useState(true);
  const [showColorCode, setShowColorCode] = useState(false);
  const [projectTitle, setProjectTitle] = useState("我的拼豆作品");
  const [projects, setProjects] = useState<LocalProject[]>(() =>
    getLocalProjects()
  );

  const { dark, toggle: toggleDark } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const grid = gridState.value;

  const colorMap = useMemo(() => {
    return new Map(palette.map((color) => [color.id, color]));
  }, [palette]);

  const stats = useMemo(() => {
    if (!grid) return [];
    return getColorStats(grid, palette);
  }, [grid, palette]);

  const displayCellSize = useMemo(() => {
    if (!grid) return zoom;
    if (!fitView) return zoom;
    const maxWidth = 900;
    const maxHeight = 620;
    const sizeByWidth = Math.floor(maxWidth / grid.width);
    const sizeByHeight = Math.floor(maxHeight / grid.height);
    return Math.max(3, Math.min(14, sizeByWidth, sizeByHeight));
  }, [fitView, grid, zoom]);

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    try {
      const safeWidth = Math.max(1, Math.min(width, 300));
      const safeHeight = Math.max(1, Math.min(height, 300));
      const result = await imageToBeadGrid({
        file,
        width: safeWidth,
        height: safeHeight,
        colors: palette,
      });
      setWidth(safeWidth);
      setHeight(safeHeight);
      gridState.reset(result);
      setFitView(true);
    } finally {
      setLoading(false);
    }
  }

  function getRecommendedGridSize(imageWidth: number, imageHeight: number) {
    const maxSide = 120;
    const minSide = 20;
    if (imageWidth <= 0 || imageHeight <= 0) return { width: 100, height: 100 };
    if (imageWidth >= imageHeight) {
      const nextWidth = maxSide;
      const nextHeight = Math.round((imageHeight / imageWidth) * maxSide);
      return {
        width: Math.max(minSide, Math.min(300, nextWidth)),
        height: Math.max(minSide, Math.min(300, nextHeight)),
      };
    }
    const nextHeight = maxSide;
    const nextWidth = Math.round((imageWidth / imageHeight) * maxSide);
    return {
      width: Math.max(minSide, Math.min(300, nextWidth)),
      height: Math.max(minSide, Math.min(300, nextHeight)),
    };
  }

  function handleFileChange(nextFile: File) {
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreviewUrl = URL.createObjectURL(nextFile);
    setPreviewUrl(nextPreviewUrl);
    const image = new Image();
    image.onload = () => {
      const recommendedSize = getRecommendedGridSize(image.naturalWidth, image.naturalHeight);
      setWidth(recommendedSize.width);
      setHeight(recommendedSize.height);
      setImageSizeText(
        `原图尺寸：${image.naturalWidth} × ${image.naturalHeight}，已按比例推荐：${recommendedSize.width} × ${recommendedSize.height}`
      );
    };
    image.onerror = () => {
      setImageSizeText("无法读取原图尺寸，已保留当前宽高设置。");
    };
    image.src = nextPreviewUrl;
  }

  async function handlePaletteCsvChange(file: File) {
    try {
      const colors = await parsePaletteCsv(file);
      saveCustomPalette(colors);
      setPalette(colors);
      setUsingCustomPalette(true);
      const firstColorId = colors[0]?.id;
      if (firstColorId) {
        setSelectedColorId(firstColorId);
        setReplaceTo(firstColorId);
      }
      alert(`色卡导入成功：共 ${colors.length} 色。请重新点击"生成拼豆图"应用新色卡。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV 导入失败";
      alert(message);
    }
  }

  function handleResetPalette() {
    clearCustomPalette();
    setPalette(beadColors221);
    setUsingCustomPalette(false);
    const firstColorId = beadColors221[0]?.id;
    if (firstColorId) {
      setSelectedColorId(firstColorId);
      setReplaceTo(firstColorId);
    }
    alert('已恢复默认内置色卡。请重新点击"生成拼豆图"应用默认色卡。');
  }

  function handleReplaceColor() {
    if (!grid || !replaceFrom || !replaceTo) return;
    gridState.set(replaceColorInGrid(grid, replaceFrom, replaceTo));
  }

  function handleCellClick(index: number) {
    if (!grid) return;
    gridState.set(updateSingleCell(grid, index, selectedColorId));
  }

  function handleSaveProject() {
    if (!grid) return;
    saveLocalProject(projectTitle || "未命名作品", grid);
    setProjects(getLocalProjects());
  }

  function handleOpenProject(project: LocalProject) {
    gridState.reset(project.grid);
    setWidth(project.grid.width);
    setHeight(project.grid.height);
    setProjectTitle(project.title);
    setFitView(true);
  }

  function handleDeleteProject(id: string) {
    deleteLocalProject(id);
    setProjects(getLocalProjects());
  }

  function handleZoomIn() {
    setFitView(false);
    setZoom((value) => Math.min(32, value + 1));
  }

  function handleZoomOut() {
    setFitView(false);
    setZoom((value) => Math.max(3, value - 1));
  }

  /* ---- shared sidebar content ---- */
  const sidebarProps: SidebarContentProps = {
    file, previewUrl, width, height, loading, imageSizeText, palette,
    usingCustomPalette, selectedColorId, replaceFrom, replaceTo,
    stats, grid, projectTitle, projects,
    gridState: {
      undo: gridState.undo,
      redo: gridState.redo,
      canUndo: gridState.canUndo,
      canRedo: gridState.canRedo,
    },
    onFileChange: handleFileChange,
    onWidthChange: setWidth,
    onHeightChange: setHeight,
    onGenerate: handleGenerate,
    onSelectedColorChange: setSelectedColorId,
    onReplaceFromChange: setReplaceFrom,
    onReplaceToChange: setReplaceTo,
    onReplaceColor: handleReplaceColor,
    onPaletteCsvChange: handlePaletteCsvChange,
    onResetPalette: handleResetPalette,
    onSaveProject: handleSaveProject,
    onOpenProject: handleOpenProject,
    onDeleteProject: handleDeleteProject,
    onProjectTitleChange: setProjectTitle,
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] dark:bg-[#1c1a17] transition-colors duration-300">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur dark:border-stone-700 dark:bg-stone-800/85">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight dark:text-stone-100">
              Bead Pixel Maker
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              图片转拼豆图，自动统计颜色和数量
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "关闭设置面板" : "打开设置面板"}
              className="rounded-xl bg-stone-100 p-2.5 text-stone-600 transition duration-150 hover:bg-stone-200 xl:hidden dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <button
              onClick={toggleDark}
              aria-label={dark ? "切换到亮色模式" : "切换到暗色模式"}
              className="rounded-full bg-stone-100 p-2.5 text-stone-600 transition duration-150 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        {/* === mobile sidebar overlay === */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 xl:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <aside
              className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] overflow-y-auto bg-[#f6f3ee] p-4 space-y-5 shadow-2xl dark:bg-[#1c1a17]"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent
                {...sidebarProps}
                onCloseSidebar={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* === desktop: sidebar + main grid === */}
        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[340px_1fr]">
          {/* desktop sidebar */}
          <aside className="hidden xl:block space-y-5">
            <SidebarContent {...sidebarProps} />
          </aside>

          {/* main grid area */}
          <section className="space-y-5 order-first xl:order-none">
            <BeadCanvas
              grid={grid}
              palette={palette}
              colorMap={colorMap}
              displayCellSize={displayCellSize}
              showColorCode={showColorCode}
              fitView={fitView}
              onCellClick={handleCellClick}
              onToggleColorCode={() => setShowColorCode((v) => !v)}
              onFitView={() => setFitView(true)}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />

            <ColorStatsPanel grid={grid} stats={stats} />
          </section>
        </div>
      </main>
    </div>
  );
}
