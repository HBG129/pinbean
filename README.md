# Bead Pixel Maker（拼豆图生成器）

将任意图片转换为拼豆（Perler / Hama / Artkal）像素格子图，供手工爱好者规划拼豆项目使用。

## 功能

- **图片上传** — 支持 PNG / JPEG / WebP，自动按原图比例推荐网格尺寸
- **智能颜色匹配** — 基于 CIELAB 感知色差算法，将每个像素匹配到最接近的拼豆颜色
- **内置 221 色调色板** — 覆盖 A-H 和 M 系列拼豆标准色卡
- **自定义色卡** — 支持 CSV 格式导入自定义色卡
- **手动编辑** — 单格画笔绘制 + 批量颜色替换，支持撤销/重做
- **缩放与视图** — 自由缩放（3px~32px/格）+ 适应窗口模式
- **色号标注** — 在网格上叠加显示色号编码
- **导出 PNG** — 导出高清拼豆图（可选带色号标注）
- **导出 Excel** — 自动生成材料清单（含颜色统计 + 项目信息）
- **本地保存** — 作品保存/加载/删除（localStorage）

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS v4 |
| 图标 | Lucide React |
| 颜色匹配 | 自研 CIELAB 感知色差算法 |
| Excel 导出 | SheetJS (xlsx) |
| 持久化 | localStorage |

## 快速开始

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 项目结构

```
src/
├── components/
│   ├── BeadCanvas.tsx        # 拼豆网格画布 + 缩放/导出
│   ├── ColorReplacePanel.tsx # 画笔选择 + 批量颜色替换
│   ├── ColorStats.tsx        # 颜色统计面板 + Excel 导出
│   └── UploadPanel.tsx       # 图片上传 + 网格尺寸设置
├── data/
│   └── beadColors221.ts      # 内置 221 色调色板
├── hooks/
│   └── useHistoryState.ts    # 撤销/重做 hook
├── lib/
│   ├── colorMatch.ts         # CIELAB 色差匹配算法
│   ├── exportExcel.ts        # Excel 材料清单导出
│   ├── exportPng.ts          # PNG 拼豆图导出
│   ├── imageToBeads.ts       # 图片 → 拼豆网格转换
│   ├── localProjects.ts      # localStorage 作品管理
│   └── paletteStorage.ts     # 自定义色卡存储/解析
├── types/
│   └── bead.ts               # 核心类型定义
├── App.tsx                   # 主应用组件
├── index.css                 # Tailwind + 全局样式
└── main.tsx                  # 入口
```
