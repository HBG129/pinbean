import { lazy, Suspense, useMemo, useState, useEffect, useRef } from "react";
import { Sun, Moon, Menu, X, User, Home, Globe, Save } from "lucide-react";
import { beadColors221 } from "./data/beadColors221";
import { sampleImages, sampleToFile } from "./data/sampleImages";
import type { BeadGrid } from "./types/bead";
import {
  EMPTY_CELL_ID,
  getColorStats,
  imageToBeadGrid,
  replaceColorInGrid,
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
import { CursorSpotlight } from "./components/CursorSpotlight";
import { AuthProvider } from "./components/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { AuthModal } from "./components/AuthModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EditorToolbar, type EditorToolMode } from "./components/EditorToolbar";
import { ExportPanel } from "./components/ExportPanel";
import { ToastRegion } from "./components/Toast";
import { useToasts } from "./hooks/useToasts";
import { hasSupabase } from "./lib/supabase";
import { saveCloudProject, getUnreadCount } from "./lib/cloudProjects";
import {
  getAspectLockedSize,
  getRecommendedGridSize,
  type ImageInfo,
  type SizePreset,
} from "./lib/editorSizing";
import {
  COLOR_COMPLEXITY_LIMITS,
  reduceGridColors,
  type ColorComplexity,
} from "./lib/colorReduction";

type Page = "editor" | "community" | "profile";

const CommunityFeed = lazy(() =>
  import("./components/CommunityFeed").then((module) => ({ default: module.CommunityFeed }))
);
const PublishModal = lazy(() =>
  import("./components/PublishModal").then((module) => ({ default: module.PublishModal }))
);
const ProfilePage = lazy(() =>
  import("./components/ProfilePage").then((module) => ({ default: module.ProfilePage }))
);
const LandingPage = lazy(() =>
  import("./components/LandingPage").then((module) => ({ default: module.LandingPage }))
);

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-orange-500" />
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("editor");
  const [authOpen, setAuthOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const gridState = useHistoryState<BeadGrid | null>(null);
  const [palette, setPalette] = useState(() => getActivePalette());
  const [usingCustomPalette, setUsingCustomPalette] = useState(() => hasCustomPalette());
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [sizePreset, setSizePreset] = useState<SizePreset>("medium");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [colorComplexity, setColorComplexity] = useState<ColorComplexity>("balanced");
  const [imageSizeText, setImageSizeText] = useState("");
  const [selectedColorId, setSelectedColorId] = useState(() => getActivePalette()[0]?.id || beadColors221[0].id);
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState(() => getActivePalette()[0]?.id || beadColors221[0].id);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [fitView, setFitView] = useState(true);
  const [showColorCode, setShowColorCode] = useState(false);
  const [toolMode, setToolMode] = useState<EditorToolMode>("brush");
  const [draftGrid, setDraftGrid] = useState<BeadGrid | null>(null);
  const [projectTitle, setProjectTitle] = useState("我的拼豆作品");
  const [projects, setProjects] = useState<LocalProject[]>(() => getLocalProjects());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { dark, toggle: toggleDark } = useDarkMode();
  const { toasts, showToast } = useToasts();
  const grid = gridState.value;
  const activeGrid = draftGrid ?? grid;
  const drawingGridRef = useRef<BeadGrid | null>(null);
  const drawingChangedRef = useRef(false);
  const drawingColorIdRef = useRef(selectedColorId);
  const paintedCellIndicesRef = useRef<Set<number>>(new Set());

  // poll unread count
  useEffect(() => {
    if (!user || !hasSupabase()) return;
    getUnreadCount().then(setUnreadCount).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const colorMap = useMemo(() => new Map(palette.map((c) => [c.id, c])), [palette]);
  const selectedColor = colorMap.get(selectedColorId);
  const stats = useMemo(() => (activeGrid ? getColorStats(activeGrid, palette) : []), [activeGrid, palette]);
  const displayCellSize = useMemo(() => {
    if (!activeGrid) return zoom;
    if (!fitView) return zoom;
    const maxWidth = 900, maxHeight = 620;
    return Math.max(3, Math.min(14, Math.floor(maxWidth / activeGrid.width), Math.floor(maxHeight / activeGrid.height)));
  }, [fitView, activeGrid, zoom]);

  async function handleGenerate() {
    if (!file || !imageInfo) return;
    setLoading(true);
    try {
      const sw = Math.max(1, Math.min(width, 300));
      const sh = Math.max(1, Math.min(height, 300));
      const result = await imageToBeadGrid({
        file,
        width: sw,
        height: sh,
        colors: palette,
        dither: colorComplexity === "detailed",
      });
      const reduced = reduceGridColors(
        result,
        palette,
        COLOR_COMPLEXITY_LIMITS[colorComplexity]
      );
      setWidth(sw); setHeight(sh);
      gridState.reset(reduced);
      setFitView(true);
    } finally { setLoading(false); }
  }

  function handleFileChange(nextFile: File, autoGenerate = false) {
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(nextFile);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = async () => {
      const nextInfo = { width: img.naturalWidth, height: img.naturalHeight };
      const recommended = getRecommendedGridSize(nextInfo, "medium");
      setImageInfo(nextInfo);
      setSizePreset("medium");
      setWidth(recommended.width);
      setHeight(recommended.height);
      setImageSizeText(
        `原图尺寸：${nextInfo.width} x ${nextInfo.height}，推荐：${recommended.width} x ${recommended.height}`
      );
      if (autoGenerate) {
        setLoading(true);
        try {
          const result = await imageToBeadGrid({
            file: nextFile,
            width: recommended.width,
            height: recommended.height,
            colors: palette,
            dither: colorComplexity === "detailed",
          });
          const reduced = reduceGridColors(
            result,
            palette,
            COLOR_COMPLEXITY_LIMITS[colorComplexity]
          );
          gridState.reset(reduced);
          setFitView(true);
        } finally {
          setLoading(false);
        }
      }
    };
    img.onerror = () => setImageSizeText("无法读取原图尺寸");
    img.addEventListener("error", () => setImageInfo(null));
    img.src = url;
  }

  function handleSampleSelect(sampleId: string) {
    const sample = sampleImages.find((item) => item.id === sampleId);
    if (!sample) return;
    handleFileChange(sampleToFile(sample), true);
    setProjectTitle(sample.title);
    showToast("success", `已载入示例：${sample.title}`);
  }

  function handleSizePresetChange(nextPreset: SizePreset) {
    setSizePreset(nextPreset);
    if (!imageInfo || nextPreset === "custom") return;
    const next = getRecommendedGridSize(imageInfo, nextPreset);
    setWidth(next.width);
    setHeight(next.height);
  }

  function handleWidthChange(nextWidth: number) {
    setSizePreset("custom");
    if (lockAspectRatio && imageInfo) {
      const next = getAspectLockedSize({ image: imageInfo, nextWidth });
      setWidth(next.width);
      setHeight(next.height);
      return;
    }
    setWidth(nextWidth);
  }

  function handleHeightChange(nextHeight: number) {
    setSizePreset("custom");
    if (lockAspectRatio && imageInfo) {
      const next = getAspectLockedSize({ image: imageInfo, nextHeight });
      setWidth(next.width);
      setHeight(next.height);
      return;
    }
    setHeight(nextHeight);
  }

  async function handlePaletteCsvChange(f: File) {
    try {
      const colors = await parsePaletteCsv(f);
      saveCustomPalette(colors);
      setPalette(colors);
      setUsingCustomPalette(true);
      const first = colors[0]?.id;
      if (first) { setSelectedColorId(first); setReplaceTo(first); }
      showToast("success", `色卡导入成功：共 ${colors.length} 色`);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "CSV 导入失败");
    }
  }

  function handleResetPalette() {
    clearCustomPalette();
    setPalette(beadColors221);
    setUsingCustomPalette(false);
    const first = beadColors221[0]?.id;
    if (first) { setSelectedColorId(first); setReplaceTo(first); }
    showToast("success", '已恢复默认色卡，请重新点击"生成拼豆图"应用默认色卡。');
  }

  function handleSaveProject() {
    if (!grid) return;
    // always save locally
    saveLocalProject(projectTitle || "未命名作品", grid);
    setProjects(getLocalProjects());
    showToast("success", "作品已保存到本地");
    // also save to cloud if logged in
    if (user && hasSupabase()) {
      saveCloudProject(projectTitle || "未命名作品", grid, false)
        .catch(() => showToast("error", "云端保存失败，但已存到本地"));
    }
  }

  function pickCellColor(index: number) {
    if (!grid) return;

    const colorId = grid.cells[index];
    if (!colorId || colorId === EMPTY_CELL_ID) {
      showToast("error", "空白格没有可吸取的颜色");
      return;
    }

    const color = colorMap.get(colorId);
    setSelectedColorId(colorId);
    setToolMode("brush");
    showToast("success", `已吸取颜色：${color?.code ?? colorId}`);
  }

  function paintDraftCell(index: number, colorId: string) {
    const currentGrid = drawingGridRef.current;
    if (!currentGrid || index < 0 || index >= currentGrid.cells.length) return;
    if (paintedCellIndicesRef.current.has(index)) return;

    paintedCellIndicesRef.current.add(index);
    if (currentGrid.cells[index] === colorId) return;

    const cells = [...currentGrid.cells];
    cells[index] = colorId;
    const nextGrid = { ...currentGrid, cells };
    drawingGridRef.current = nextGrid;
    drawingChangedRef.current = true;
    setDraftGrid(nextGrid);
  }

  function handleCellPointerDown(index: number) {
    if (!grid) return;

    if (toolMode === "eyedropper") {
      pickCellColor(index);
      return;
    }

    drawingGridRef.current = grid;
    drawingChangedRef.current = false;
    drawingColorIdRef.current = selectedColorId;
    paintedCellIndicesRef.current = new Set();
    paintDraftCell(index, selectedColorId);
  }

  function handleCellPointerMove(index: number) {
    if (!drawingGridRef.current) return;
    paintDraftCell(index, drawingColorIdRef.current);
  }

  function handleCellPointerUp() {
    const finalGrid = drawingGridRef.current;
    if (finalGrid && drawingChangedRef.current) {
      gridState.set(finalGrid);
    }

    drawingGridRef.current = null;
    drawingChangedRef.current = false;
    paintedCellIndicesRef.current = new Set();
    setDraftGrid(null);
  }

  const sidebarProps: SidebarContentProps = {
    file, previewUrl, width, height, imageInfo, sizePreset, lockAspectRatio,
    colorComplexity,
    loading, imageSizeText, palette,
    usingCustomPalette, selectedColorId, replaceFrom, replaceTo,
    stats, grid, projectTitle, projects,
    gridState: { undo: gridState.undo, redo: gridState.redo, canUndo: gridState.canUndo, canRedo: gridState.canRedo },
    onFileChange: handleFileChange, onWidthChange: handleWidthChange, onHeightChange: handleHeightChange,
    onSampleSelect: handleSampleSelect,
    onSizePresetChange: handleSizePresetChange, onLockAspectRatioChange: setLockAspectRatio,
    onColorComplexityChange: setColorComplexity,
    onGenerate: handleGenerate, onSelectedColorChange: setSelectedColorId,
    onReplaceFromChange: setReplaceFrom, onReplaceToChange: setReplaceTo,
    onReplaceColor: () => { if (grid && replaceFrom && replaceTo) gridState.set(replaceColorInGrid(grid, replaceFrom, replaceTo)); },
    onPaletteCsvChange: handlePaletteCsvChange, onResetPalette: handleResetPalette,
    onSaveProject: handleSaveProject, onOpenProject: (p) => { gridState.reset(p.grid); setWidth(p.grid.width); setHeight(p.grid.height); setProjectTitle(p.title); setFitView(true); },
    onDeleteProject: (id) => { deleteLocalProject(id); setProjects(getLocalProjects()); },
    onProjectTitleChange: setProjectTitle,
  };

  return (
    <ErrorBoundary>
    <div className="relative min-h-screen bg-[#f6f3ee] dark:bg-[#1c1a17] transition-colors duration-300">
      <CursorSpotlight />

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ToastRegion toasts={toasts} />

      {/* Publish Modal */}
      <Suspense fallback={null}>
        <PublishModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          currentGrid={grid}
          localProjects={projects}
          onPublished={() => setPage("community")}
        />
      </Suspense>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur dark:border-stone-700 dark:bg-stone-800/85">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
          {/* left: logo + nav tabs */}
          <div className="flex items-center gap-4">
            <h1
              className="cursor-pointer text-xl font-black tracking-tight dark:text-stone-100"
              onClick={() => setPage("editor")}
            >
              PinBean
            </h1>
            <nav className="hidden items-center gap-1 rounded-2xl bg-stone-100 p-1 sm:flex dark:bg-stone-700">
              <button
                onClick={() => setPage("editor")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition ${
                  page === "editor" ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100" : "text-stone-500"
                }`}
              >
                <Home size={15} /> 编辑器
              </button>
              {hasSupabase() && (
              <button
                onClick={() => setPage("community")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition ${
                  page === "community" ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100" : "text-stone-500"
                }`}
              >
                <Globe size={15} /> 社区
              </button>
              )}
            </nav>
          </div>

          {/* right: user + dark + mobile menu */}
          <div className="flex items-center gap-2">
            {/* mobile nav */}
            {hasSupabase() ? (
            <div className="flex gap-1 rounded-2xl bg-stone-100 p-1 sm:hidden dark:bg-stone-700">
              <button onClick={() => setPage("editor")} className={`rounded-xl px-2.5 py-1 text-xs font-bold ${page === "editor" ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100" : "text-stone-500"}`}>编辑</button>
              <button onClick={() => setPage("community")} className={`rounded-xl px-2.5 py-1 text-xs font-bold ${page === "community" ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100" : "text-stone-500"}`}>社区</button>
            </div>
            ) : null}

            {hasSupabase() && user ? (
              <button
                onClick={() => setPage("profile")}
                className="relative flex items-center gap-2 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 p-0.5 transition hover:from-orange-500 hover:to-rose-500 active:scale-95"
                title="个人主页"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-orange-500 dark:bg-stone-800">
                  {user.email?.[0]?.toUpperCase()}
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            ) : hasSupabase() ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[0.97]"
              >
                <User size={15} /> 登录
              </button>
            ) : null}

            {/* mobile sidebar toggle (editor only) */}
            {page === "editor" && (
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="设置"
                className="rounded-xl bg-stone-100 p-2.5 text-stone-600 transition hover:bg-stone-200 xl:hidden dark:bg-stone-700 dark:text-stone-300"
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}

            <button onClick={toggleDark} aria-label="切换主题" className="rounded-full bg-stone-100 p-2.5 text-stone-600 transition hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* === PROFILE PAGE === */}
      {page === "profile" && (
        <main className="relative z-10 mx-auto max-w-[1200px] px-4 py-8 md:px-6">
          <Suspense fallback={<PageFallback />}>
            <ProfilePage onOpenInEditor={(g, title) => {
              gridState.reset(g);
              setWidth(g.width);
              setHeight(g.height);
              setProjectTitle(title);
              setFitView(true);
              setPage("editor");
            }} />
          </Suspense>
        </main>
      )}

      {/* === COMMUNITY PAGE === */}
      {page === "community" && (
        <main className="relative z-10 mx-auto max-w-[1200px] px-4 py-8 md:px-6">
          <Suspense fallback={<PageFallback />}>
            <CommunityFeed onCreatePublish={() => setPublishOpen(true)} />
          </Suspense>
        </main>
      )}

      {/* === EDITOR PAGE === */}
      {page === "editor" && (
        <main className="relative z-10 mx-auto max-w-[1600px] px-4 pb-24 pt-6 md:px-6 xl:pb-6">
          {/* mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 xl:hidden" onClick={() => setSidebarOpen(false)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <aside className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] overflow-y-auto bg-[#f6f3ee] p-4 space-y-5 shadow-2xl dark:bg-[#1c1a17]" onClick={(e) => e.stopPropagation()}>
                <SidebarContent {...sidebarProps} onCloseSidebar={() => setSidebarOpen(false)} />
              </aside>
            </div>
          )}

          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[340px_1fr]">
            <aside className="hidden xl:block space-y-5">
              <SidebarContent {...sidebarProps} />
            </aside>

            <section className="space-y-5 order-first xl:order-none">
              {/* Publish to community button */}
              {hasSupabase() && activeGrid && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setPublishOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-400 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:from-orange-600 hover:to-rose-500 active:scale-[0.97]"
                  >
                    <Globe size={16} /> 发布到社区
                  </button>
                </div>
              )}
              <EditorToolbar
                canUndo={gridState.canUndo}
                canRedo={gridState.canRedo}
                zoom={zoom}
                fitView={fitView}
                showColorCode={showColorCode}
                selectedColor={selectedColor}
                toolMode={toolMode}
                onUndo={gridState.undo}
                onRedo={gridState.redo}
                onZoomChange={(nextZoom) => {
                  setFitView(false);
                  setZoom(nextZoom);
                }}
                onFitViewChange={setFitView}
                onShowColorCodeChange={setShowColorCode}
                onToolModeChange={setToolMode}
              />
              <BeadCanvas
                grid={activeGrid} palette={palette} colorMap={colorMap}
                displayCellSize={displayCellSize} showColorCode={showColorCode} fitView={fitView}
                onCellPointerDown={handleCellPointerDown}
                onCellPointerMove={handleCellPointerMove}
                onCellPointerUp={handleCellPointerUp}
                onToggleColorCode={() => setShowColorCode((v) => !v)}
                onFitView={() => setFitView(true)}
                onZoomIn={() => { setFitView(false); setZoom((v) => Math.min(32, v + 1)); }}
                onZoomOut={() => { setFitView(false); setZoom((v) => Math.max(3, v - 1)); }}
              />
              <ColorStatsPanel
                grid={activeGrid}
                stats={stats}
                selectedColorId={selectedColorId}
                onSelectedColorChange={setSelectedColorId}
              />
              <ExportPanel
                grid={activeGrid}
                palette={palette}
                stats={stats}
                projectTitle={projectTitle}
              />
            </section>
          </div>
          <div className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 gap-2 rounded-2xl border border-stone-200 bg-white/92 p-2 shadow-2xl backdrop-blur xl:hidden dark:border-stone-700 dark:bg-stone-800/92">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-2 py-2 text-xs font-black text-stone-700 dark:bg-stone-700 dark:text-stone-100"
            >
              <Menu size={15} />
              设置
            </button>
            <button
              type="button"
              onClick={handleSaveProject}
              disabled={!grid}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-2 py-2 text-xs font-black text-white disabled:bg-stone-300 dark:disabled:bg-stone-600"
            >
              <Save size={15} />
              保存
            </button>
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              disabled={!grid || !hasSupabase()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-2 py-2 text-xs font-black text-white disabled:bg-stone-300 dark:disabled:bg-stone-600"
            >
              <Globe size={15} />
              发布
            </button>
          </div>
        </main>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </AuthProvider>
    </ErrorBoundary>
  );
}

/** wraps AppShell to show LandingPage when not logged in */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f3ee] dark:bg-[#1c1a17]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-orange-500" />
      </div>
    );
  }
  if (!user && hasSupabase()) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LandingPage />
      </Suspense>
    );
  }
  return <>{children}</>;
}
