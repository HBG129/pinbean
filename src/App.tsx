import { useMemo, useState, useEffect } from "react";
import { Sun, Moon, Menu, X, User, Home, Globe } from "lucide-react";
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
import { CursorSpotlight } from "./components/CursorSpotlight";
import { AuthProvider } from "./components/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { AuthModal } from "./components/AuthModal";
import { CommunityFeed } from "./components/CommunityFeed";
import { PublishModal } from "./components/PublishModal";
import { ProfilePage } from "./components/ProfilePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LandingPage } from "./components/LandingPage";
import { hasSupabase } from "./lib/supabase";
import { saveCloudProject, getUnreadCount } from "./lib/cloudProjects";

type Page = "editor" | "community" | "profile";

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
  const [imageSizeText, setImageSizeText] = useState("");
  const [selectedColorId, setSelectedColorId] = useState(() => getActivePalette()[0]?.id || beadColors221[0].id);
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState(() => getActivePalette()[0]?.id || beadColors221[0].id);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [fitView, setFitView] = useState(true);
  const [showColorCode, setShowColorCode] = useState(false);
  const [projectTitle, setProjectTitle] = useState("我的拼豆作品");
  const [projects, setProjects] = useState<LocalProject[]>(() => getLocalProjects());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { dark, toggle: toggleDark } = useDarkMode();
  const grid = gridState.value;

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
  const stats = useMemo(() => (grid ? getColorStats(grid, palette) : []), [grid, palette]);
  const displayCellSize = useMemo(() => {
    if (!grid) return zoom;
    if (!fitView) return zoom;
    const maxWidth = 900, maxHeight = 620;
    return Math.max(3, Math.min(14, Math.floor(maxWidth / grid.width), Math.floor(maxHeight / grid.height)));
  }, [fitView, grid, zoom]);

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    try {
      const sw = Math.max(1, Math.min(width, 300));
      const sh = Math.max(1, Math.min(height, 300));
      const result = await imageToBeadGrid({ file, width: sw, height: sh, colors: palette });
      setWidth(sw); setHeight(sh);
      gridState.reset(result);
      setFitView(true);
    } finally { setLoading(false); }
  }

  function handleFileChange(nextFile: File) {
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(nextFile);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      const maxSide = 120, minSide = 20;
      let w2 = maxSide, h2 = maxSide;
      if (img.width >= img.height) h2 = Math.round((img.height / img.width) * maxSide);
      else w2 = Math.round((img.width / img.height) * maxSide);
      w2 = Math.max(minSide, Math.min(300, w2));
      h2 = Math.max(minSide, Math.min(300, h2));
      setWidth(w2); setHeight(h2);
      setImageSizeText(`原图尺寸：${img.naturalWidth} × ${img.naturalHeight}，已按比例推荐：${w2} × ${h2}`);
    };
    img.onerror = () => setImageSizeText("无法读取原图尺寸");
    img.src = url;
  }

  async function handlePaletteCsvChange(f: File) {
    try {
      const colors = await parsePaletteCsv(f);
      saveCustomPalette(colors);
      setPalette(colors);
      setUsingCustomPalette(true);
      const first = colors[0]?.id;
      if (first) { setSelectedColorId(first); setReplaceTo(first); }
      alert(`色卡导入成功：共 ${colors.length} 色`);
    } catch (e) { alert(e instanceof Error ? e.message : "CSV 导入失败"); }
  }

  function handleResetPalette() {
    clearCustomPalette();
    setPalette(beadColors221);
    setUsingCustomPalette(false);
    const first = beadColors221[0]?.id;
    if (first) { setSelectedColorId(first); setReplaceTo(first); }
    alert('已恢复默认内置色卡。请重新点击"生成拼豆图"应用默认色卡。');
  }

  function handleSaveProject() {
    if (!grid) return;
    // always save locally
    saveLocalProject(projectTitle || "未命名作品", grid);
    setProjects(getLocalProjects());
    // also save to cloud if logged in
    if (user && hasSupabase()) {
      saveCloudProject(projectTitle || "未命名作品", grid, false)
        .catch(() => alert("云端保存失败，但已存到本地"));
    }
  }

  const sidebarProps: SidebarContentProps = {
    file, previewUrl, width, height, loading, imageSizeText, palette,
    usingCustomPalette, selectedColorId, replaceFrom, replaceTo,
    stats, grid, projectTitle, projects,
    gridState: { undo: gridState.undo, redo: gridState.redo, canUndo: gridState.canUndo, canRedo: gridState.canRedo },
    onFileChange: handleFileChange, onWidthChange: setWidth, onHeightChange: setHeight,
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

      {/* Publish Modal */}
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        currentGrid={grid}
        localProjects={projects}
        onPublished={() => setPage("community")}
      />

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
          <ProfilePage />
        </main>
      )}

      {/* === COMMUNITY PAGE === */}
      {page === "community" && (
        <main className="relative z-10 mx-auto max-w-[1200px] px-4 py-8 md:px-6">
          <CommunityFeed onCreatePublish={() => setPublishOpen(true)} />
        </main>
      )}

      {/* === EDITOR PAGE === */}
      {page === "editor" && (
        <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-6 md:px-6">
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
              {hasSupabase() && grid && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setPublishOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-400 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:from-orange-600 hover:to-rose-500 active:scale-[0.97]"
                  >
                    <Globe size={16} /> 发布到社区
                  </button>
                </div>
              )}
              <BeadCanvas
                grid={grid} palette={palette} colorMap={colorMap}
                displayCellSize={displayCellSize} showColorCode={showColorCode} fitView={fitView}
                onCellClick={(i) => { if (grid) gridState.set(updateSingleCell(grid, i, selectedColorId)); }}
                onToggleColorCode={() => setShowColorCode((v) => !v)}
                onFitView={() => setFitView(true)}
                onZoomIn={() => { setFitView(false); setZoom((v) => Math.min(32, v + 1)); }}
                onZoomOut={() => { setFitView(false); setZoom((v) => Math.max(3, v - 1)); }}
              />
              <ColorStatsPanel grid={grid} stats={stats} />
            </section>
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
    return <LandingPage />;
  }
  return <>{children}</>;
}
