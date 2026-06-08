import type { BeadColor, RGB } from "../types/bead";
import { beadColors221 } from "../data/beadColors221";

const STORAGE_KEY = "bead-pixel-maker-custom-palette";

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "").trim();

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`HEX 格式错误：${hex}`);
  }

  const num = parseInt(clean, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getActivePalette(): BeadColor[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return beadColors221;
  }

  try {
    const parsed = JSON.parse(raw) as BeadColor[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return beadColors221;
    }

    return parsed;
  } catch {
    return beadColors221;
  }
}

export function saveCustomPalette(colors: BeadColor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

export function clearCustomPalette() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasCustomPalette() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export async function parsePaletteCsv(file: File): Promise<BeadColor[]> {
  const text = await file.text();
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV 至少需要包含表头和一行颜色数据");
  }

  const header = splitCsvLine(lines[0]).map((item) => item.trim());

  const codeIndex = findColumnIndex(header, ["色号", "code", "编号", "id"]);
  const hexIndex = findColumnIndex(header, ["HEX", "hex", "色值", "颜色值"]);

  if (codeIndex === -1 || hexIndex === -1) {
    throw new Error("CSV 表头必须包含：色号、HEX");
  }

  const colors: BeadColor[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = splitCsvLine(lines[i]);

    const code = columns[codeIndex]?.trim();
    const hexRaw = columns[hexIndex]?.trim();

    if (!code || !hexRaw) {
      continue;
    }

    const hex = hexRaw.startsWith("#") ? hexRaw : `#${hexRaw}`;
    const rgb = hexToRgb(hex);

    colors.push({
      id: code,
      code,
      hex,
      rgb,
    });
  }

  if (colors.length === 0) {
    throw new Error("没有读取到有效颜色");
  }

  return colors;
}

function findColumnIndex(header: string[], names: string[]) {
  return header.findIndex((item) =>
    names.some((name) => item.toLowerCase() === name.toLowerCase())
  );
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);

  return result;
}