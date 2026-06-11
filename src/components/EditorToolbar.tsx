import { Eye, EyeOff, Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-stone-700 dark:bg-stone-800/90">
      <ToolButton title="撤销" disabled={!props.canUndo} onClick={props.onUndo}>
        <Undo2 size={17} />
      </ToolButton>
      <ToolButton title="重做" disabled={!props.canRedo} onClick={props.onRedo}>
        <Redo2 size={17} />
      </ToolButton>

      <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />

      <ToolButton
        title="缩小"
        onClick={() => props.onZoomChange(Math.max(3, props.zoom - 1))}
      >
        <Minus size={17} />
      </ToolButton>
      <span className="w-12 text-center text-xs font-black text-stone-500">
        {props.zoom}px
      </span>
      <ToolButton
        title="放大"
        onClick={() => props.onZoomChange(Math.min(32, props.zoom + 1))}
      >
        <Plus size={17} />
      </ToolButton>
      <ToolButton
        title="适应窗口"
        active={props.fitView}
        onClick={() => props.onFitViewChange(!props.fitView)}
      >
        <Maximize2 size={17} />
      </ToolButton>
      <ToolButton
        title="显示色号"
        active={props.showColorCode}
        onClick={() => props.onShowColorCodeChange(!props.showColorCode)}
      >
        {props.showColorCode ? <Eye size={17} /> : <EyeOff size={17} />}
      </ToolButton>

      <div className="ml-auto flex min-w-0 items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 dark:bg-stone-700">
        <span
          className="h-5 w-5 shrink-0 rounded-md border border-stone-300"
          style={{ backgroundColor: props.selectedColor?.hex ?? "#ddd" }}
        />
        <span className="truncate text-xs font-black text-stone-700 dark:text-stone-100">
          {props.selectedColor?.code ?? "未选色"}
        </span>
        <span className="hidden text-xs text-stone-400 sm:inline">
          {props.selectedColor?.hex}
        </span>
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl p-2 transition active:scale-95 disabled:opacity-35 ${
        active
          ? "bg-orange-500 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200"
      }`}
    >
      {children}
    </button>
  );
}
