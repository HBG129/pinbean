export type SizePreset = "small" | "medium" | "large" | "custom";

export type ImageInfo = {
  width: number;
  height: number;
};

export type GridSize = {
  width: number;
  height: number;
};

export const SIZE_PRESETS: Record<
  Exclude<SizePreset, "custom">,
  { label: string; maxSide: number }
> = {
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

export function getRecommendedGridSize(
  image: ImageInfo,
  preset: SizePreset
): GridSize {
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
