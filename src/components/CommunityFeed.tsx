import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Bookmark, ExternalLink, Loader2, Plus, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCommunityFeed, toggleLike, toggleBookmark, hasUserLiked } from "../lib/cloudProjects";
import { beadColors221 } from "../data/beadColors221";
import type { CloudProject } from "../lib/supabase";

export function CommunityFeed({ onCreatePublish }: { onCreatePublish?: () => void }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [sort, setSort] = useState<"latest" | "likes" | "comments" | "bookmarks">("latest");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<CloudProject | null>(null);

  /* color map from built-in palette */
  const colorMap = new Map(beadColors221.map((c) => [c.id, c]));

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
    try { await toggleLike(id); } catch { /* revert */ }
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
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight dark:text-stone-100">作品广场</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">发现社区里最棒的拼豆作品</p>
        </div>
        <div className="flex items-center gap-3">
          {onCreatePublish && (
            <button
              onClick={onCreatePublish}
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

      {/* bento grid */}
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
                onClick={() => setExpanded(p)}
                className="group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-lg dark:bg-stone-800 dark:shadow-none dark:ring-1 dark:ring-stone-700"
              >
                <div className="relative flex h-48 items-center justify-center bg-stone-50 dark:bg-stone-800/50">
                  {grid ? (
                    <MiniGrid grid={grid} colorMap={colorMap} />
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

      {/* expanded detail modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setExpanded(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-800"
            >
              <button
                onClick={() => setExpanded(null)}
                className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <X size={18} />
              </button>
              <p className="text-xl font-black dark:text-stone-100">{expanded.title}</p>
              {expanded.grid && (() => {
                let g: { width: number; height: number; cells: string[] } | null = null;
                try { g = JSON.parse(expanded.grid) as typeof g; } catch { g = null; }
                return g ? (
                  <div className="mt-4 flex justify-center rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/50">
                    <LargeGrid grid={g} colorMap={colorMap} />
                  </div>
                ) : null;
              })()}
              <div className="mt-4 flex items-center gap-4 text-stone-400 dark:text-stone-500">
                <button
                  onClick={() => handleLike(expanded.id).catch(() => {})}
                  className={`flex items-center gap-1 text-sm transition ${liked.has(expanded.id) ? "text-red-500" : "hover:text-red-400"}`}
                >
                  <Heart size={18} fill={liked.has(expanded.id) ? "currentColor" : "none"} />
                  {expanded.likes_count} 赞
                </button>
                <span className="flex items-center gap-1 text-sm">
                  <MessageCircle size={18} />
                  {expanded.comments_count} 评论
                </span>
                <button
                  onClick={() => handleBookmark(expanded.id).catch(() => {})}
                  className={`flex items-center gap-1 text-sm transition ml-auto ${bookmarked.has(expanded.id) ? "text-amber-500" : "hover:text-amber-400"}`}
                >
                  <Bookmark size={18} fill={bookmarked.has(expanded.id) ? "currentColor" : "none"} />
                  {bookmarked.has(expanded.id) ? "已收藏" : "收藏"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- helpers ----

function MiniGrid({
  grid, colorMap,
}: {
  grid: { width: number; height: number; cells: string[] };
  colorMap: Map<string, { hex: string }>;
}) {
  const maxW = 24, maxH = 16;
  const scale = Math.min(maxW / grid.width, maxH / grid.height, 6);
  const w = Math.max(4, Math.floor(grid.width * scale));
  const h = Math.max(3, Math.floor(grid.height * scale));
  const stepX = grid.width / w;
  const stepY = grid.height / h;
  const cellSize = Math.max(4, Math.floor(180 / Math.max(w, h)));
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${w}, ${cellSize}px)` }}>
      {Array.from({ length: h }, (_, dy) =>
        Array.from({ length: w }, (_, dx) => {
          const sx = Math.floor(dx * stepX);
          const sy = Math.floor(dy * stepY);
          const idx = sy * grid.width + sx;
          const colorId = grid.cells[idx];
          const hex = colorMap.get(colorId)?.hex || "#e7e5e4";
          return <div key={idx} style={{ width: cellSize, height: cellSize, backgroundColor: hex }} />;
        })
      )}
    </div>
  );
}

function LargeGrid({
  grid, colorMap,
}: {
  grid: { width: number; height: number; cells: string[] };
  colorMap: Map<string, { hex: string }>;
}) {
  const maxDim = 300;
  const cellSize = Math.max(3, Math.floor(maxDim / Math.max(grid.width, grid.height)));
  const totalW = grid.width * cellSize;
  const totalH = grid.height * cellSize;
  return (
    <div className="overflow-auto" style={{ maxWidth: totalW + 4, maxHeight: totalH + 4 }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${grid.width}, ${cellSize}px)` }}
      >
        {grid.cells.map((colorId, i) => {
          const hex = colorMap.get(colorId)?.hex || "#fff";
          return (
            <div
              key={i}
              style={{ width: cellSize, height: cellSize, backgroundColor: hex, border: "0.5px solid rgba(0,0,0,0.08)" }}
            />
          );
        })}
      </div>
    </div>
  );
}
