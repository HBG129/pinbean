import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Grid3X3, Heart, Bookmark, LogOut, Loader2, User, Bell, Trash2, Pencil, Eye, EyeOff, MoreHorizontal, X, Camera } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserProjects, getUserLikedProjects, getUserBookmarkedProjects, getNotifications, markAllRead, updateCloudProject, deleteCloudProject, toggleProjectPublic } from "../lib/cloudProjects";
import { beadColors221 } from "../data/beadColors221";
import { uploadAvatar, getAvatarUrl } from "../lib/avatarStorage";
import type { BeadGrid } from "../types/bead";
import type { CloudProject } from "../lib/supabase";

type Tab = "my" | "liked" | "bookmarked" | "notifications";

type NotifItem = {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  project_id: string;
  read: boolean;
  created_at: string;
};

export function ProfilePage({ onOpenInEditor }: { onOpenInEditor?: (grid: BeadGrid, title: string) => void }) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("my");
  const [myProjects, setMyProjects] = useState<CloudProject[]>([]);
  const [likedProjects, setLikedProjects] = useState<CloudProject[]>([]);
  const [bookmarkedProjects, setBookmarkedProjects] = useState<CloudProject[]>([]);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // edit state
  const [editProject, setEditProject] = useState<CloudProject | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const colorMap = new Map(beadColors221.map((c) => [c.id, c]));

  // load avatar
  useEffect(() => {
    if (!user) return;
    getAvatarUrl().then(setAvatarUrl).catch(() => {});
  }, [user]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch {
      alert("上传失败，请重试");
    }
    e.target.value = "";
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      getUserProjects().catch(() => [] as CloudProject[]),
      getUserLikedProjects().catch(() => [] as CloudProject[]),
      getUserBookmarkedProjects().catch(() => [] as CloudProject[]),
      getNotifications().catch(() => [] as NotifItem[]),
    ]).then(([my, liked, bm, nf]) => {
      if (cancelled) return;
      setMyProjects(my);
      setLikedProjects(liked);
      setBookmarkedProjects(bm);
      setNotifs(nf);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  async function handleClearNotifs() {
    await markAllRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleRename() {
    if (!editProject || !editTitle.trim()) return;
    await updateCloudProject(editProject.id, editTitle.trim());
    setMyProjects((prev) => prev.map((p) => (p.id === editProject.id ? { ...p, title: editTitle.trim() } : p)));
    setEditProject(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个作品？此操作不可撤销。")) return;
    await deleteCloudProject(id).catch(() => alert("删除失败"));
    setMyProjects((prev) => prev.filter((p) => p.id !== id));
    setMenuOpen(null);
  }

  async function handleTogglePublic(id: string) {
    const newState = await toggleProjectPublic(id).catch(() => null);
    if (newState === null) return;
    setMyProjects((prev) => prev.map((p) => (p.id === id ? { ...p, is_public: newState } : p)));
    setMenuOpen(null);
  }

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
    { key: "notifications", label: "消息", icon: <Bell size={16} />, count: unreadCount },
  ];

  const activeList = tab === "my" ? myProjects : tab === "liked" ? likedProjects : bookmarkedProjects;

  const notifTypeLabel: Record<string, string> = {
    like: "赞了你的作品",
    comment: "评论了你的作品",
    reply: "回复了你的评论",
  };

  return (
    <div className="space-y-8">
      {/* Rename Modal */}
      <AnimatePresence>
        {editProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black dark:text-stone-100">重命名作品</h3>
                <button onClick={() => setEditProject(null)} className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700">
                  <X size={18} />
                </button>
              </div>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                autoFocus
              />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setEditProject(null)} className="flex-1 rounded-2xl bg-stone-100 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300">
                  取消
                </button>
                <button onClick={handleRename} className="flex-1 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[0.97]">
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* profile header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="group relative cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-2xl font-black text-white shadow-lg bg-cover bg-center overflow-hidden"
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            >
              {!avatarUrl && (user.email?.[0]?.toUpperCase() || <User size={24} />)}
            </div>
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition group-hover:scale-110 dark:bg-stone-600">
              <Camera size={12} className="text-stone-500 dark:text-stone-300" />
            </span>
          </label>
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
      <div className="flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition whitespace-nowrap ${
              tab === t.key
                ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500"
            }`}
          >
            {t.icon} {t.label}
            <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs dark:bg-stone-600">{t.count}</span>
            {t.key === "notifications" && t.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* Notifications tab */}
      {tab === "notifications" && (
        <div className="space-y-4">
          {notifs.length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleClearNotifs} className="text-sm text-stone-500 transition hover:text-orange-500">
                全部标为已读
              </button>
            </div>
          )}
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 dark:text-stone-500">
              <Bell size={40} className="mb-3 opacity-30" />
              <p className="font-bold">暂无消息</p>
              <p className="text-sm">当有人给你的作品点赞或评论时，这里会显示</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifs.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 rounded-2xl p-4 transition ${
                    n.read
                      ? "bg-white dark:bg-stone-800"
                      : "bg-orange-50 ring-1 ring-orange-200 dark:bg-orange-900/10 dark:ring-orange-800/30"
                  }`}
                >
                  <span className="shrink-0 rounded-full bg-stone-100 p-2 dark:bg-stone-700">
                    {n.type === "like" ? <Heart size={16} className="text-red-400" /> : <Bell size={16} className="text-blue-400" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm dark:text-stone-200">
                      <span className="font-bold">{n.actor_id?.slice(0, 8) ?? "用户"}</span>
                      {" "}{notifTypeLabel[n.type] || n.type}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {new Date(n.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects grid (non-notif tabs) */}
      {tab !== "notifications" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-stone-500">
              <p className="text-lg font-bold">
                {tab === "my" ? "还没有作品" : tab === "liked" ? "还没有点赞过作品" : "还没有收藏作品"}
              </p>
              {tab === "my" && <p className="text-sm">去编辑器创建一个吧</p>}
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
                      onClick={tab === "my" && onOpenInEditor ? () => {
                        try {
                          const g: BeadGrid = JSON.parse(p.grid);
                          onOpenInEditor(g, p.title);
                        } catch { /* ignore */ }
                      } : undefined}
                      className={`group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-lg dark:bg-stone-800 dark:ring-1 dark:ring-stone-700 ${tab === "my" && onOpenInEditor ? "cursor-pointer" : ""}`}
                    >
                      <div className="flex h-40 items-center justify-center bg-stone-50 dark:bg-stone-800/50">
                        {grid ? <MiniGrid grid={grid} colorMap={colorMap} /> : <span className="text-stone-300">无预览</span>}

                        {/* action menu (my tab only) */}
                        {tab === "my" && (
                          <div className="absolute right-2 top-2 z-10">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpen(menuOpen === p.id ? null : p.id);
                                }}
                                className="rounded-xl bg-white/80 p-2 text-stone-400 opacity-0 transition hover:text-stone-600 group-hover:opacity-100 dark:bg-stone-700/80 dark:text-stone-300 dark:hover:text-stone-100"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              <AnimatePresence>
                                {menuOpen === p.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 w-36 rounded-2xl bg-white p-1.5 shadow-xl dark:bg-stone-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => { setEditProject(p); setEditTitle(p.title); setMenuOpen(null); }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-600"
                                    >
                                      <Pencil size={14} /> 重命名
                                    </button>
                                    <button
                                      onClick={() => handleTogglePublic(p.id)}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-600"
                                    >
                                      {p.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
                                      {p.is_public ? "设为私密" : "设为公开"}
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p.id)}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 size={14} /> 删除
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-bold dark:text-stone-100">{p.title}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {grid ? `${grid.width} × ${grid.height}` : ""}
                          {p.is_public ? (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-900/20 dark:text-green-400">
                              <Eye size={10} /> 公开
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-700 dark:text-stone-400">
                              <EyeOff size={10} /> 私密
                            </span>
                          )}
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
