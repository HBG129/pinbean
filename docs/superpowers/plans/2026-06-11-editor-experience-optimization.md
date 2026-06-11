# Editor Experience Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first editor-experience optimization pass for PinBean: better upload guidance, size presets, color complexity control, editor toolbar polish, export settings, color-stat interactions, and toast feedback.

**Architecture:** Keep core editor state in `AppShell`, then extract new UI and pure calculations into focused files. Avoid Supabase schema changes and avoid broad community/profile rewrites. Each task is independently verifiable and commit-sized.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, lucide-react, existing localStorage and Supabase helpers.

---

## File Structure

- Create `src/lib/editorSizing.ts`: pure helpers for presets, aspect ratio locking, bead counts, and image summaries.
- Create `src/lib/colorReduction.ts`: pure helper that reduces a generated grid to a maximum number of colors.
- Create `src/components/GenerationSummary.tsx`: compact upload/image/project summary.
- Create `src/components/SizePresetControl.tsx`: preset buttons, aspect lock, and dimension inputs.
- Create `src/components/EditorToolbar.tsx`: stable canvas toolbar for undo, redo, zoom, fit, color-code visibility, and current color.
- Create `src/components/ExportPanel.tsx`: PNG and Excel export settings.
- Create `src/components/Toast.tsx`: lightweight toast region and hook.
- Modify `src/App.tsx`: wire state, helpers, toast, color complexity, and new components.
- Modify `src/components/UploadPanel.tsx`: accept summary/preset controls and remove duplicated dimension UI where needed.
- Modify `src/components/SidebarContent.tsx`: pass new upload and color complexity props.
- Modify `src/components/BeadCanvas.tsx`: allow export settings to move to `ExportPanel`, keep canvas rendering focused.
- Modify `src/components/ColorStats.tsx`: make color rows actionable and support export panel placement.
- Modify `src/lib/exportPng.ts`: accept grid-line/background/quality options.
- Modify `src/lib/exportExcel.ts`: include project metadata and sort rows by count.

## Task 1: Safety Check And Baseline Verification

**Files:**
- Read: `docs/superpowers/specs/2026-06-11-editor-experience-optimization-design.md`
- Read: `src/App.tsx`
- Read: `src/components/UploadPanel.tsx`
- Read: `src/components/BeadCanvas.tsx`
- Read: `src/components/ColorStats.tsx`

- [ ] **Step 1: Confirm baseline branch exists**

Run:

```bash
git -c safe.directory='D:/Ai_Project/bead-pixel-maker/bead-pixel-maker' -C 'D:\Ai_Project\bead-pixel-maker\bead-pixel-maker' branch --list 'backup/before-editor-optimization' -vv
```

Expected: output includes `backup/before-editor-optimization ac39343`.

- [ ] **Step 2: Confirm worktree only contains approved planning commits**

Run:

```bash
git -c safe.directory='D:/Ai_Project/bead-pixel-maker/bead-pixel-maker' -C 'D:\Ai_Project\bead-pixel-maker\bead-pixel-maker' status --short --branch
```

Expected before implementation: `main...origin/main [ahead 2]` or equivalent, with no modified source files.

- [ ] **Step 3: Run current validation**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0. The Vite chunk-size warning is acceptable because it already existed.

## Task 2: Add Editor Sizing Utilities

**Files:**
- Create: `src/lib/editorSizing.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/lib/editorSizing.ts`**

Add this module:

```ts
export type SizePreset = "small" | "medium" | "large" | "custom";

export type ImageInfo = {
  width: number;
  height: number;
};

export type GridSize = {
  width: number;
  height: number;
};

export const SIZE_PRESETS: Record<Exclude<SizePreset, "custom">, { label: string; maxSide: number }> = {
  small: { label: "小挂件", maxSide: 48 },
  medium: { label: "中型图", maxSide: 88 },
  large: { label: "大幅图", maxSide: 132 },
};

export function clampGridSize(value: number) {
  return Math.max(1, Math.min(300, Math.round(value)));
}

export function getAspectRatioText(width: number, height: number) {
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

export function getEstimatedBeadCount(width: number, height: number) {
  return clampGridSize(width) * clampGridSize(height);
}

export function getRecommendedGridSize(image: ImageInfo, preset: SizePreset): GridSize {
  const maxSide = preset === "custom" ? 120 : SIZE_PRESETS[preset].maxSide;
  const imageRatio = image.width / image.height;
  if (image.width >= image.height) {
    return {
      width: clampGridSize(maxSide),
      height: clampGridSize(maxSide / imageRatio),
    };
  }
  return {
    width: clampGridSize(maxSide * imageRatio),
    height: clampGridSize(maxSide),
  };
}

export function getAspectLockedSize(params: {
  image: ImageInfo;
  nextWidth?: number;
  nextHeight?: number;
}): GridSize {
  const ratio = params.image.width / params.image.height;
  if (typeof params.nextWidth === "number") {
    const width = clampGridSize(params.nextWidth);
    return { width, height: clampGridSize(width / ratio) };
  }
  const height = clampGridSize(params.nextHeight ?? 1);
  return { width: clampGridSize(height * ratio), height };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}
```

- [ ] **Step 2: Import utilities in `src/App.tsx`**

Add imports:

```ts
import {
  getAspectLockedSize,
  getEstimatedBeadCount,
  getRecommendedGridSize,
  type ImageInfo,
  type SizePreset,
} from "./lib/editorSizing";
```

- [ ] **Step 3: Add editor sizing state in `AppShell`**

Add near existing upload/grid size state:

```ts
const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
const [sizePreset, setSizePreset] = useState<SizePreset>("medium");
const [lockAspectRatio, setLockAspectRatio] = useState(true);
```

- [ ] **Step 4: Update `handleFileChange` to store `imageInfo` and use the medium preset**

Replace the image `onload` body with:

```ts
img.onload = () => {
  const nextInfo = { width: img.naturalWidth, height: img.naturalHeight };
  const recommended = getRecommendedGridSize(nextInfo, "medium");
  setImageInfo(nextInfo);
  setSizePreset("medium");
  setWidth(recommended.width);
  setHeight(recommended.height);
  setImageSizeText(
    `原图尺寸：${nextInfo.width} x ${nextInfo.height}，推荐：${recommended.width} x ${recommended.height}`
  );
};
```

- [ ] **Step 5: Run validation**

Run:

```bash
npm run lint
npm run build
```

Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/editorSizing.ts src/App.tsx
git commit -m "feat: add editor sizing utilities"
```

## Task 3: Add Upload Summary And Size Preset Controls

**Files:**
- Create: `src/components/GenerationSummary.tsx`
- Create: `src/components/SizePresetControl.tsx`
- Modify: `src/components/UploadPanel.tsx`
- Modify: `src/components/SidebarContent.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `GenerationSummary.tsx`**

```tsx
import { Image, Ruler, Sparkles } from "lucide-react";
import { getAspectRatioText, getEstimatedBeadCount, type ImageInfo } from "../lib/editorSizing";

type Props = {
  imageInfo: ImageInfo | null;
  width: number;
  height: number;
};

export function GenerationSummary({ imageInfo, width, height }: Props) {
  const beads = getEstimatedBeadCount(width, height);
  return (
    <div className="grid grid-cols-2 gap-2">
      <SummaryItem icon={<Image size={15} />} label="原图" value={imageInfo ? `${imageInfo.width} x ${imageInfo.height}` : "等待上传"} />
      <SummaryItem icon={<Ruler size={15} />} label="拼豆尺寸" value={`${width} x ${height}`} />
      <SummaryItem icon={<Sparkles size={15} />} label="预计颗数" value={`${beads.toLocaleString()} 颗`} />
      <SummaryItem icon={<Ruler size={15} />} label="比例" value={imageInfo ? getAspectRatioText(imageInfo.width, imageInfo.height) : "-"} />
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-800/80">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-stone-400">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-black text-stone-800 dark:text-stone-100">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `SizePresetControl.tsx`**

```tsx
import { Link2, Unlink2 } from "lucide-react";
import { SIZE_PRESETS, type SizePreset } from "../lib/editorSizing";

type Props = {
  preset: SizePreset;
  width: number;
  height: number;
  locked: boolean;
  onPresetChange: (preset: SizePreset) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onLockedChange: (locked: boolean) => void;
};

export function SizePresetControl({
  preset,
  width,
  height,
  locked,
  onPresetChange,
  onWidthChange,
  onHeightChange,
  onLockedChange,
}: Props) {
  const presets: SizePreset[] = ["small", "medium", "large", "custom"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700">
        {presets.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPresetChange(item)}
            className={`rounded-xl px-2 py-2 text-xs font-black transition ${
              preset === item ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100" : "text-stone-500"
            }`}
          >
            {item === "custom" ? "自定义" : SIZE_PRESETS[item].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="text-xs font-bold text-stone-500">
          宽
          <input
            type="number"
            min={1}
            max={300}
            value={width}
            onChange={(event) => onWidthChange(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          />
        </label>
        <button
          type="button"
          onClick={() => onLockedChange(!locked)}
          title={locked ? "锁定比例" : "自由比例"}
          className="mb-0.5 rounded-xl bg-stone-100 p-2.5 text-stone-500 transition hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"
        >
          {locked ? <Link2 size={16} /> : <Unlink2 size={16} />}
        </button>
        <label className="text-xs font-bold text-stone-500">
          高
          <input
            type="number"
            min={1}
            max={300}
            value={height}
            onChange={(event) => onHeightChange(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
          />
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Extend `UploadPanel` props**

Add props for `imageInfo`, `sizePreset`, `lockAspectRatio`, and their handlers. Render `GenerationSummary` and `SizePresetControl` below the preview.

- [ ] **Step 4: Wire `SidebarContent` props**

Add matching props to `SidebarContentProps` and pass them through to `UploadPanel`.

- [ ] **Step 5: Wire preset handlers in `App.tsx`**

Add handlers:

```ts
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
```

Use these handlers instead of passing `setWidth` and `setHeight` directly.

- [ ] **Step 6: Run validation and commit**

```bash
npm run lint
npm run build
git add src/App.tsx src/components/UploadPanel.tsx src/components/SidebarContent.tsx src/components/GenerationSummary.tsx src/components/SizePresetControl.tsx
git commit -m "feat: improve upload sizing controls"
```

## Task 4: Add Color Complexity

**Files:**
- Create: `src/lib/colorReduction.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/UploadPanel.tsx`
- Modify: `src/components/SidebarContent.tsx`

- [ ] **Step 1: Create `colorReduction.ts`**

```ts
import type { BeadColor, BeadGrid } from "../types/bead";
import { findNearestBeadColor } from "./colorMatch";

export type ColorComplexity = "simple" | "balanced" | "detailed";

export const COLOR_COMPLEXITY_LIMITS: Record<ColorComplexity, number> = {
  simple: 24,
  balanced: 48,
  detailed: 96,
};

export function reduceGridColors(grid: BeadGrid, palette: BeadColor[], maxColors: number): BeadGrid {
  const counts = new Map<string, number>();
  for (const id of grid.cells) counts.set(id, (counts.get(id) ?? 0) + 1);
  if (counts.size <= maxColors) return grid;

  const keptIds = new Set(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxColors)
      .map(([id]) => id)
  );
  const colorById = new Map(palette.map((color) => [color.id, color]));
  const keptColors = palette.filter((color) => keptIds.has(color.id));
  const remap = new Map<string, string>();

  const cells = grid.cells.map((id) => {
    if (keptIds.has(id)) return id;
    const source = colorById.get(id);
    if (!source) return id;
    const cached = remap.get(id);
    if (cached) return cached;
    const nearest = findNearestBeadColor(source.rgb, keptColors);
    remap.set(id, nearest.id);
    return nearest.id;
  });

  return { ...grid, cells };
}
```

- [ ] **Step 2: Add state and use reduction in `App.tsx`**

Add imports and state:

```ts
import {
  COLOR_COMPLEXITY_LIMITS,
  reduceGridColors,
  type ColorComplexity,
} from "./lib/colorReduction";

const [colorComplexity, setColorComplexity] = useState<ColorComplexity>("balanced");
```

Inside `handleGenerate`, after `imageToBeadGrid`:

```ts
const reduced = reduceGridColors(result, palette, COLOR_COMPLEXITY_LIMITS[colorComplexity]);
gridState.reset(reduced);
```

- [ ] **Step 3: Add UI control in upload area**

Render a segmented control with labels `简化`, `平衡`, `精细`. Pass `colorComplexity` and `onColorComplexityChange` through `SidebarContent` and `UploadPanel`.

- [ ] **Step 4: Run validation and commit**

```bash
npm run lint
npm run build
git add src/lib/colorReduction.ts src/App.tsx src/components/UploadPanel.tsx src/components/SidebarContent.tsx
git commit -m "feat: add color complexity control"
```

## Task 5: Add Editor Toolbar

**Files:**
- Create: `src/components/EditorToolbar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/BeadCanvas.tsx`

- [ ] **Step 1: Create `EditorToolbar.tsx`**

```tsx
import { Eye, EyeOff, Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import type { BeadColor } from "../types/bead";

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  fitView: boolean;
  showColorCode: boolean;
  selectedColor: BeadColor | undefined;
  onUndo: () => void;
  onRedo: () => void;
  onZoomChange: (zoom: number) => void;
  onFitViewChange: (fit: boolean) => void;
  onShowColorCodeChange: (show: boolean) => void;
};

export function EditorToolbar(props: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-stone-700 dark:bg-stone-800/90">
      <ToolButton title="撤销" disabled={!props.canUndo} onClick={props.onUndo}><Undo2 size={17} /></ToolButton>
      <ToolButton title="重做" disabled={!props.canRedo} onClick={props.onRedo}><Redo2 size={17} /></ToolButton>
      <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
      <ToolButton title="缩小" onClick={() => props.onZoomChange(Math.max(3, props.zoom - 1))}><Minus size={17} /></ToolButton>
      <span className="w-12 text-center text-xs font-black text-stone-500">{props.zoom}px</span>
      <ToolButton title="放大" onClick={() => props.onZoomChange(Math.min(32, props.zoom + 1))}><Plus size={17} /></ToolButton>
      <ToolButton title="适应窗口" active={props.fitView} onClick={() => props.onFitViewChange(!props.fitView)}><Maximize2 size={17} /></ToolButton>
      <ToolButton title="显示色号" active={props.showColorCode} onClick={() => props.onShowColorCodeChange(!props.showColorCode)}>
        {props.showColorCode ? <Eye size={17} /> : <EyeOff size={17} />}
      </ToolButton>
      <div className="ml-auto flex min-w-0 items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 dark:bg-stone-700">
        <span className="h-5 w-5 rounded-md border border-stone-300" style={{ backgroundColor: props.selectedColor?.hex ?? "#ddd" }} />
        <span className="truncate text-xs font-black text-stone-700 dark:text-stone-100">{props.selectedColor?.code ?? "未选色"}</span>
        <span className="hidden text-xs text-stone-400 sm:inline">{props.selectedColor?.hex}</span>
      </div>
    </div>
  );
}

function ToolButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl p-2 transition active:scale-95 disabled:opacity-35 ${
        active ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200"
      }`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Render toolbar above canvas in `App.tsx`**

Compute selected color:

```ts
const selectedColor = colorMap.get(selectedColorId);
```

Render `EditorToolbar` above `BeadCanvas`, passing undo/redo, zoom, fit, color-code, and current color props.

- [ ] **Step 3: Remove duplicate undo/redo section from sidebar**

Remove the existing sidebar undo/redo section once toolbar controls exist.

- [ ] **Step 4: Run validation and commit**

```bash
npm run lint
npm run build
git add src/App.tsx src/components/BeadCanvas.tsx src/components/EditorToolbar.tsx src/components/SidebarContent.tsx
git commit -m "feat: add editor toolbar"
```

## Task 6: Improve Color Stats And Export Settings

**Files:**
- Create: `src/components/ExportPanel.tsx`
- Modify: `src/components/ColorStats.tsx`
- Modify: `src/App.tsx`
- Modify: `src/lib/exportPng.ts`
- Modify: `src/lib/exportExcel.ts`

- [ ] **Step 1: Extend `exportPng.ts` options**

Add option fields:

```ts
type ExportPngOptions = {
  showCode: boolean;
  showGrid?: boolean;
  cellSize: number;
  fileName: string;
  background?: string;
};
```

Use `background ?? "#ffffff"` before drawing cells. Draw grid lines only when `showGrid !== false`.

- [ ] **Step 2: Extend `exportExcel.ts` signature**

Change the function to:

```ts
export function exportMaterialExcel(
  grid: BeadGrid,
  stats: ColorStat[],
  metadata?: { title?: string }
) {
```

Sort material rows by count descending and add metadata rows for title, grid size, total beads, color count, and export time.

- [ ] **Step 3: Create `ExportPanel.tsx`**

Create a component with `showCode`, `showGrid`, `quality`, and buttons for PNG and Excel. Map quality to cell sizes: standard `18`, high `28`, print `34`.

- [ ] **Step 4: Update `ColorStats.tsx`**

Add props:

```ts
selectedColorId: string;
onSelectedColorChange: (id: string) => void;
```

Make each row a button that calls `onSelectedColorChange(item.color.id)`. Show percentage:

```tsx
const percent = grid ? Math.round((item.count / (grid.width * grid.height)) * 1000) / 10 : 0;
```

- [ ] **Step 5: Wire `ExportPanel` in `App.tsx`**

Render `ExportPanel` near `ColorStatsPanel`, passing `grid`, `palette`, `stats`, and `projectTitle`.

- [ ] **Step 6: Run validation and commit**

```bash
npm run lint
npm run build
git add src/App.tsx src/components/ColorStats.tsx src/components/ExportPanel.tsx src/lib/exportPng.ts src/lib/exportExcel.ts
git commit -m "feat: improve stats and exports"
```

## Task 7: Add Toast Feedback

**Files:**
- Create: `src/components/Toast.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `Toast.tsx`**

```tsx
import { CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

type ToastKind = "success" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);
  return { toasts, showToast };
}

export function ToastRegion({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold text-stone-700 shadow-xl dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        >
          {toast.kind === "success" ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire toast in `AppShell`**

Add:

```ts
const { toasts, showToast } = useToasts();
```

Render:

```tsx
<ToastRegion toasts={toasts} />
```

- [ ] **Step 3: Replace high-frequency alerts in `App.tsx`**

Replace palette import/reset and save alerts with `showToast("success", "...")` or `showToast("error", "...")`.

- [ ] **Step 4: Run validation and commit**

```bash
npm run lint
npm run build
git add src/App.tsx src/components/Toast.tsx
git commit -m "feat: add editor toast feedback"
```

## Task 8: Final Responsive Polish And Verification

**Files:**
- Modify files touched by earlier tasks only when verification reveals layout issues.

- [ ] **Step 1: Run full validation**

```bash
npm run lint
npm run build
```

Expected: both exit 0.

- [ ] **Step 2: Run local dev server**

```bash
npm run dev
```

Expected: Vite starts and prints a localhost URL.

- [ ] **Step 3: Manual desktop check**

Open the app and verify:

- Upload preview appears.
- Generation summary shows image size and bead count.
- Presets update width and height.
- Lock ratio changes paired dimension.
- Color complexity can be changed.
- Generate creates a grid.
- Toolbar buttons do not resize the layout.
- Color stat row changes active brush.
- PNG and Excel export buttons are visible.
- Toasts appear for save and palette actions.

- [ ] **Step 4: Manual mobile check**

Use a narrow viewport and verify:

- Sidebar drawer remains usable.
- Toolbar wraps without overlapping.
- Current color pill does not cover canvas controls.
- Export and stats panels remain readable.

- [ ] **Step 5: Commit final polish if needed**

Only commit if Step 3 or Step 4 required changes:

```bash
git add src
git commit -m "polish: refine editor responsive layout"
```

## Rollback Procedure

If the user rejects all optimization work:

```bash
git revert <newest-optimization-commit> <older-optimization-commit>
git push origin main
```

If the user rejects one specific slice, revert only that slice commit.

Do not delete the backup branch. It remains the reference for the pre-optimization website state.
