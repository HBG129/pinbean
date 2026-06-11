import { Image, Ruler, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import {
  getAspectRatioText,
  getEstimatedBeadCount,
  type ImageInfo,
} from "../lib/editorSizing";

type Props = {
  imageInfo: ImageInfo | null;
  width: number;
  height: number;
};

export function GenerationSummary({ imageInfo, width, height }: Props) {
  const beads = getEstimatedBeadCount(width, height);

  return (
    <div className="grid grid-cols-2 gap-2">
      <SummaryItem
        icon={<Image size={15} />}
        label="原图"
        value={imageInfo ? `${imageInfo.width} x ${imageInfo.height}` : "等待上传"}
      />
      <SummaryItem
        icon={<Ruler size={15} />}
        label="拼豆尺寸"
        value={`${width} x ${height}`}
      />
      <SummaryItem
        icon={<Sparkles size={15} />}
        label="预计颗数"
        value={`${beads.toLocaleString()} 颗`}
      />
      <SummaryItem
        icon={<Ruler size={15} />}
        label="比例"
        value={imageInfo ? getAspectRatioText(imageInfo.width, imageInfo.height) : "-"}
      />
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-800/80">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-stone-400">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-black text-stone-800 dark:text-stone-100">
        {value}
      </p>
    </div>
  );
}
