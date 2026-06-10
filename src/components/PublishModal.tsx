import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ImagePlus, Plus, Package, Loader2 } from "lucide-react";
import type { BeadGrid } from "../types/bead";
import type { LocalProject } from "../lib/localProjects";
import { saveCloudProject } from "../lib/cloudProjects";
import { imageToBeadGrid } from "../lib/imageToBeads";
import { getActivePalette } from "../lib/paletteStorage";

type SourceType = "current" | "project" | "image";

type Props = {
  open: boolean;
  onClose: () => void;
  currentGrid: BeadGrid | null;
  localProjects: LocalProject[];
  onPublished: () => void;
};

export function PublishModal({ open, onClose, currentGrid, localProjects, onPublished }: Props) {
  const [source, setSource] = useState<SourceType>("current");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("我的拼豆作品");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function handleImage(f: File) {
    setImageFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handlePublish() {
    setMsg("");
    setBusy(true);
    try {
      let grid: BeadGrid | null = null;

      if (source === "current") {
        grid = currentGrid;
      } else if (source === "project") {
        const p = localProjects.find((x) => x.id === selectedProjectId);
        if (p) grid = p.grid;
      } else if (source === "image" && imageFile) {
        const palette = getActivePalette();
        grid = await imageToBeadGrid({ file: imageFile, width: 100, height: 100, colors: palette });
      }

      if (!grid) throw new Error("没有可发布的作品");

      await saveCloudProject(title || "未命名", grid, true, description.trim() || undefined);
      onPublished();
      onClose();

      // reset
      setTitle("我的拼豆作品");
      setDescription("");
      setImageFile(null);
      setPreviewUrl("");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "发布失败");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    onClose();
    setMsg("");
  }

  return (
    <AnimatePresence>
      {open && (
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
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-stone-800"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 dark:hover:bg-stone-700"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-black dark:text-stone-100">发布到社区</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              分享你的拼豆作品，让更多人看到
            </p>

            {/* Source selector */}
            <div className="mt-5">
              <p className="text-sm font-bold dark:text-stone-200">选择内容</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <SourceBtn
                  icon={<Plus size={18} />}
                  label="当前格子"
                  active={source === "current"}
                  disabled={!currentGrid}
                  onClick={() => setSource("current")}
                />
                <SourceBtn
                  icon={<Package size={18} />}
                  label="本地作品"
                  active={source === "project"}
                  disabled={localProjects.length === 0}
                  onClick={() => setSource("project")}
                />
                <SourceBtn
                  icon={<ImagePlus size={18} />}
                  label="上传图片"
                  active={source === "image"}
                  onClick={() => setSource("image")}
                />
              </div>
            </div>

            {/* Source detail */}
            {source === "project" && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="mt-3 w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
              >
                <option value="">选择作品...</option>
                {localProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.grid.width}×{p.grid.height})</option>
                ))}
              </select>
            )}

            {source === "image" && (
              <div className="mt-3">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center transition hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800/50 dark:hover:bg-stone-700">
                  <ImagePlus size={24} className="text-stone-400" />
                  <span className="ml-2 text-sm text-stone-500 dark:text-stone-400">
                    {imageFile ? imageFile.name : "点击上传图片"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
                  />
                </label>
                {previewUrl && (
                  <img src={previewUrl} className="mt-3 max-h-32 rounded-2xl" alt="预览" />
                )}
              </div>
            )}

            {/* Title */}
            <div className="mt-5">
              <label className="text-sm font-bold dark:text-stone-200">标题</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none transition focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                placeholder="给你的作品起个名字"
              />
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="text-sm font-bold dark:text-stone-200">描述（可选）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none transition focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 resize-none"
                placeholder="说说你的创作灵感..."
              />
            </div>

            {msg && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              >
                {msg}
              </motion.p>
            )}

            <button
              onClick={handlePublish}
              disabled={busy || !title.trim()}
              className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 active:scale-[0.97] disabled:opacity-60"
            >
              {busy ? <Loader2 size={18} className="animate-spin inline" /> : "发布到社区"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SourceBtn({
  icon, label, active, disabled, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm font-bold transition ${
        active
          ? "border-orange-400 bg-orange-50 text-orange-600 dark:border-orange-500 dark:bg-orange-900/20 dark:text-orange-400"
          : "border-stone-200 text-stone-400 hover:border-stone-300 dark:border-stone-600 dark:text-stone-500"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {icon}
      {label}
    </button>
  );
}
