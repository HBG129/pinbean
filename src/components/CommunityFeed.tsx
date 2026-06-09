import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Bookmark, ExternalLink, Loader2, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCommunityFeed, toggleLike, toggleBookmark, hasUserLiked } from "../lib/cloudProjects";
import type { CloudProject } from "../lib/supabase";

export function CommunityFeed({ onGoCreate }: { onGoCreate?: () => void }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [sort, setSort] = useState<"latest" | "likes" | "comments" | "bookmarks">("latest");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  /* load projects whenever sort or user changes */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getCommunityFeed(sort);
        if (cancelled) return;
        setProjects(data);
        setLoading(false);
        if (user && data.length > 0) {
          const l = await Promise.all(data.map((p) => hasUserLiked(p.id)));
          if (cancelled) return;
          setLiked(new Set(data.filter((_, i) => l[i]).map((p) => p.id)));
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sort, user]);

  async function handleLike(id: string) {
    if (!user) return;
    const wasLiked = liked.has(id);
    setLiked((prev) => { const next = new Set(prev); if (wasLiked) next.delete(id); else next.add(id); return next; });
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes_count: p.likes_count + (wasLiked ? -1 : 1) } : p))
    );
    try { await toggleLike(id); } catch { /* revert on failure */ }
  }

  async function handleBookmark(id: string) {
    if (!user) return;
    const was = bookmarked.has(id);
    setBookmarked((prev) => { const next = new Set(prev); if (was) next.delete(id); else next.add(id); return next; });
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, bookmarks_count: p.bookmarks_count + (was ? -1 : 1) } : p))
    );
    try { await toggleBookmark(id); } catch { /* revert */ }
  }

  const sorts: { key: typeof sort; label: string }[] = [
    { key: "latest", label: "最新" },
    { key: "likes", label: "最多赞" },
    { key: "comments", label: "最多评论" },
    { key: "bookmarks", label: "最多收藏" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight dark:text-stone-100">作品广场</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">发现社区里最棒的拼豆作品</p>
        </div>
        <div className="flex items-center gap-3">
          {onGoCreate && (
            <button
              onClick={onGoCreate}
              className="flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[0.97]"
            >
              <Plus size={16} /> 发布作品
            </button>
          )}
          <div className="flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700">
          {sorts.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${
                sort === s.key ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100" : "text-stone-500"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-stone-500">
          <p className="text-lg font-bold">还没有人分享作品</p>
          <p className="text-sm">来成为第一个吧！</p>
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {projects.map((p, i) => {
            let grid: { width: number; height: number; cells: string[] } | null = null;
            try { grid = JSON.parse(p.grid); } catch { /* bad json */ }

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 26 }}
                whileHover={{ scale: 1.02 }}
                className="group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-lg dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700"
              >
                <div className="relative flex h-48 items-center justify-center bg-stone-50 dark:bg-stone-800/50">
                  {grid ? (
                    <MiniGrid grid={grid} />
                  ) : (
                    <span className="text-stone-300 dark:text-stone-600">无预览</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
                    <ExternalLink size={24} className="opacity-0 transition group-hover:opacity-100 text-white drop-shadow" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold dark:text-stone-100">{p.title}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {grid ? `${grid.width} × ${grid.height}` : ""}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-stone-400 dark:text-stone-500">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(p.id).catch(() => {}); }}
                      className={`flex items-center gap-1 text-sm transition ${liked.has(p.id) ? "text-red-500" : "hover:text-red-400"}`}
                    >
                      <Heart size={16} fill={liked.has(p.id) ? "currentColor" : "none"} />
                      {p.likes_count}
                    </button>
                    <span className="flex items-center gap-1 text-sm">
                      <MessageCircle size={16} />
                      {p.comments_count}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBookmark(p.id).catch(() => {}); }}
                      className={`flex items-center gap-1 text-sm transition ml-auto ${bookmarked.has(p.id) ? "text-amber-500" : "hover:text-amber-400"}`}
                    >
                      <Bookmark size={16} fill={bookmarked.has(p.id) ? "currentColor" : "none"} />
                      {p.bookmarks_count}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ---- tiny preview grid ----

/* static color palette for mini preview */
const MINI_COLORS = [
  "#f97316","#ef4444","#3b82f6","#22c55e","#eab308","#a855f7","#ec4899",
  "#14b8a6","#f43f5e","#8b5cf6","#06b6d4","#84cc16","#f59e0b","#6366f1",
];

function MiniGrid({ grid }: { grid: { width: number; height: number; cells: string[] } }) {
  const maxW = 20, maxH = 14;
  const scale = Math.min(maxW / grid.width, maxH / grid.height, 8);
  const w = Math.floor(grid.width * scale);
  const h = Math.floor(grid.height * scale);
  const stepX = grid.width / w;
  const stepY = grid.height / h;
  const cells: { color: string; idx: number }[] = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const sx = Math.floor(dx * stepX);
      const sy = Math.floor(dy * stepY);
      const idx = sy * grid.width + sx;
      cells.push({ color: idx < grid.cells.length ? MINI_COLORS[idx % MINI_COLORS.length] : "#e7e5e4", idx });
    }
  }
  const cellSize = Math.max(4, Math.min(12, Math.floor(180 / Math.max(w, h))));
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${w}, ${cellSize}px)`, opacity: 0.7 }}>
      {cells.map((c) => (
        <div key={c.idx} style={{ width: cellSize, height: cellSize, backgroundColor: c.color }} />
      ))}
    </div>
  );
}
