export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type BeadColor = {
  id: string;
  code: string;
  hex: string;
  rgb: RGB;
};

export type BeadGrid = {
  width: number;
  height: number;
  cells: string[];
};

export type ColorStat = {
  color: BeadColor;
  count: number;
};