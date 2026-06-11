export type SampleImage = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  svg: string;
};

export const sampleImages: SampleImage[] = [
  {
    id: "heart-charm",
    title: "爱心挂件",
    subtitle: "小尺寸练手",
    accent: "#ef4444",
    svg: makeSvg(`
      <rect width="128" height="128" fill="none"/>
      <path d="M64 104 C32 78 20 58 22 40 C24 24 45 20 64 40 C83 20 104 24 106 40 C108 58 96 78 64 104 Z" fill="#ef4444"/>
      <path d="M44 38 C38 38 34 42 33 48" stroke="#fecaca" stroke-width="8" stroke-linecap="round" fill="none"/>
    `),
  },
  {
    id: "sun-flower",
    title: "太阳花",
    subtitle: "颜色分明",
    accent: "#f59e0b",
    svg: makeSvg(`
      <rect width="128" height="128" fill="none"/>
      <g transform="translate(64 64)">
        ${Array.from({ length: 12 }, (_, index) => {
          const rotate = index * 30;
          return `<ellipse cx="0" cy="-38" rx="13" ry="24" fill="#fbbf24" transform="rotate(${rotate})"/>`;
        }).join("")}
        <circle r="28" fill="#92400e"/>
        <circle r="18" fill="#f59e0b"/>
      </g>
    `),
  },
  {
    id: "pixel-cat",
    title: "像素猫",
    subtitle: "头像风格",
    accent: "#6366f1",
    svg: makeSvg(`
      <rect width="128" height="128" fill="none"/>
      <rect x="30" y="42" width="68" height="56" rx="12" fill="#6366f1"/>
      <path d="M36 48 L46 24 L58 46 Z" fill="#6366f1"/>
      <path d="M92 48 L82 24 L70 46 Z" fill="#6366f1"/>
      <rect x="48" y="62" width="10" height="14" rx="5" fill="#111827"/>
      <rect x="70" y="62" width="10" height="14" rx="5" fill="#111827"/>
      <rect x="59" y="78" width="10" height="7" rx="3" fill="#f9a8d4"/>
      <path d="M56 90 Q64 96 72 90" stroke="#111827" stroke-width="4" fill="none" stroke-linecap="round"/>
    `),
  },
  {
    id: "mini-rocket",
    title: "迷你火箭",
    subtitle: "透明背景",
    accent: "#06b6d4",
    svg: makeSvg(`
      <rect width="128" height="128" fill="none"/>
      <path d="M70 18 C92 30 94 64 74 86 L42 54 C48 34 58 22 70 18 Z" fill="#e5e7eb"/>
      <path d="M70 18 C82 24 89 36 91 50 L75 34 Z" fill="#ef4444"/>
      <circle cx="68" cy="50" r="10" fill="#06b6d4"/>
      <path d="M46 72 L28 86 L42 54 Z" fill="#2563eb"/>
      <path d="M74 86 L60 104 L56 74 Z" fill="#2563eb"/>
      <path d="M42 84 C34 90 30 100 28 112 C40 108 50 104 56 96 Z" fill="#f97316"/>
    `),
  },
];

export function sampleToFile(sample: SampleImage): File {
  const blob = new Blob([sample.svg], { type: "image/svg+xml" });
  return new File([blob], `${sample.id}.svg`, { type: "image/svg+xml" });
}

function makeSvg(content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${content}</svg>`;
}
