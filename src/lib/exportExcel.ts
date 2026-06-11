import * as XLSX from "xlsx";
import type { BeadGrid, ColorStat } from "../types/bead";

type ExportExcelMetadata = {
  title?: string;
};

export function exportMaterialExcel(
  grid: BeadGrid,
  stats: ColorStat[],
  metadata: ExportExcelMetadata = {}
) {
  const sortedStats = [...stats].sort((a, b) => b.count - a.count);
  const materialSheet = sortedStats.map((item) => ({
    色号: item.color.code,
    HEX: item.color.hex,
    使用数量: item.count,
  }));

  const infoSheet = [
    { 项目: "作品标题", 内容: metadata.title || "未命名作品" },
    { 项目: "图案宽度", 内容: grid.width },
    { 项目: "图案高度", 内容: grid.height },
    { 项目: "所需拼豆总数", 内容: grid.width * grid.height },
    { 项目: "使用颜色数量", 内容: stats.length },
    { 项目: "导出时间", 内容: new Date().toLocaleString() },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(materialSheet),
    "材料清单"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(infoSheet),
    "项目信息"
  );

  XLSX.writeFile(workbook, "PinBean-材料清单.xlsx");
}
