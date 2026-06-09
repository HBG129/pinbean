import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Grid3X3, Heart, Bookmark, LogOut, Loader2, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserProjects, getUserLikedProjects, getUserBookmarkedProjects } from "../lib/cloudProjects";
import { beadColors221 } from "../data/beadColors221";
import type { CloudProject } from "../lib/supabase";

type Tab = "my" | "liked" | "bookmarked";

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("my");
  const [myProjects, setMyProjects] = useState<CloudProject[]>([]);
  const [likedProjects, setLikedProjects] = useState<CloudProject[]>([]);
  const [bookmarkedProjects, setBookmarkedProjects] = useState<CloudProject[]>([]);
  const [loading, setLoading] = useState(true);

  const colorMap = new Map(beadColors221.map((c) => [c.id, c]));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      getUserProjects().catch(() => [] as CloudProject[]),
      getUserLikedProjects().catch(() => [] as CloudProject[]),
      getUserBookmarkedProjects().catch(() => [] as CloudProject[]),
    ]).then(([my, liked, bm]) => {
      if (cancelled) return;
      setMyProjects(my);
      setLikedProjects(liked);
      setBookmarkedProjects(bm);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-stone-400 dark:text-stone-500">
        请先登录
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "my", label: "我的作品", icon: <Grid3X3 size={16} />, count: myProjects.length },
    { key: "liked", label: "我的点赞", icon: <Heart size={16} />, count: likedProjects.length },
    { key: "bookmarked", label: "我的收藏", icon: <Bookmark size={16} />, count: bookmarkedProjects.length },
  ];

  const activeList = tab === "my" ? myProjects : tab === "liked" ? likedProjects : bookmarkedProjects;

  return (
    <div className="space-y-8">
      {/* profile header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-2xl font-black text-white shadow-lg">
            {user.email?.[0]?.toUpperCase() || <User size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-black dark:text-stone-100">
              {user.email?.split("@")[0] ?? "用户"}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-red-50 hover:text-red-500 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-red-900/20"
        >
          <LogOut size={16} /> 退出登录
        </button>
      </div>

      {/* tab bar */}
      <div className="flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.key
                ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500"
            }`}
          >
            {t.icon}
            {t.label}
            <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs dark:bg-stone-600">{t.count}</span>
          </button>
        ))}
      </div>

      {/* project grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : activeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-stone-500">
          <p className="text-lg font-bold">
            {tab === "my" ? "还没有作品" : tab === "liked" ? "还没有点赞过作品" : "还没有收藏作品"}
          </p>
          <p className="text-sm">
            {tab === "my" ? "去编辑器创建一个吧" : "去社区逛逛吧"}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {activeList.map((p, i) => {
              let grid: { width: number; height: number; cells: string[] } | null = null;
              try { grid = JSON.parse(p.grid); } catch { /* ignore */ }
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 260, damping: 26 }}
                  whileHover={{ scale: 1.02 }}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-lg dark:bg-stone-800 dark:ring-1 dark:ring-stone-700"
                >
                  <div className="flex h-40 items-center justify-center bg-stone-50 dark:bg-stone-800/50">
                    {grid ? <MiniGrid grid={grid} colorMap={colorMap} /> : <span className="text-stone-300">无预览</span>}
                  </div>
                  <div className="p-4">
                    <p className="font-bold dark:text-stone-100">{p.title}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {grid ? `${grid.width} × ${grid.height}` : ""}
                      {p.is_public && <span className="ml-2 text-green-500">公开</span>}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1"><Heart size={12} />{p.likes_count}</span>
                      <span className="flex items-center gap-1"><Bookmark size={12} />{p.bookmarks_count}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ---- helpers ----

function MiniGrid({ grid, colorMap }: {
  grid: { width: number; height: number; cells: string[] };
  colorMap: Map<string, { hex: string }>;
}) {
  const maxW = 24, maxH = 14;
  const scale = Math.min(maxW / grid.width, maxH / grid.height, 6);
  const w = Math.max(4, Math.floor(grid.width * scale));
  const h = Math.max(3, Math.floor(grid.height * scale));
  const stepX = grid.width / w;
  const stepY = grid.height / h;
  const cellSize = Math.max(4, Math.floor(150 / Math.max(w, h)));
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${w}, ${cellSize}px)` }}>
      {Array.from({ length: h }, (_, dy) =>
        Array.from({ length: w }, (_, dx) => {
          const sx = Math.floor(dx * stepX);
          const sy = Math.floor(dy * stepY);
          const idx = sy * grid.width + sx;
          const hex = colorMap.get(grid.cells[idx])?.hex || "#e7e5e4";
          return <div key={idx} style={{ width: cellSize, height: cellSize, backgroundColor: hex }} />;
        })
      )}
    </div>
  );
}
