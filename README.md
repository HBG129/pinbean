# PinBean 拼豆图生成器

PinBean 是一个面向拼豆爱好者的在线拼豆图制作工具。它可以把任意图片转换成拼豆像素格子图，并提供颜色统计、手动编辑、材料清单导出、作品保存和社区分享等功能。

项目支持 Perler / Hama / Artkal 等拼豆创作流程，适合用来规划手工拼豆、整理用量清单，以及分享自己的作品。

## 在线体验

[https://pinbean.pages.dev](https://pinbean.pages.dev)

## 功能亮点

- **图片转拼豆图**：上传 PNG / JPEG / WebP 图片，自动按比例推荐网格尺寸。
- **智能颜色匹配**：使用 CIELAB 感知色差算法，将图片像素匹配到最近的拼豆颜色。
- **内置 221 色调色板**：内置 A-H 和 M 系列拼豆标准色卡。
- **自定义色卡**：支持导入 CSV 色卡，适配自己的品牌或库存颜色。
- **手动编辑**：支持单格画笔、批量颜色替换、撤销和重做。
- **缩放与适应视图**：可自由调整格子大小，也可以自动适配画布区域。
- **颜色统计**：实时统计每种颜色的使用数量，方便准备材料。
- **导出 PNG**：可导出普通拼豆图或带色号标注的高清图片。
- **导出 Excel**：生成材料清单，包含颜色、数量和项目信息。
- **本地保存**：未登录也可以使用 localStorage 保存、加载和删除作品。
- **账号与云端保存**：配置 Supabase 后支持登录注册、云端保存作品。
- **社区分享**：发布公开作品，浏览社区作品，支持热门、最新、点赞、评论、收藏排序。
- **互动功能**：支持点赞、收藏、评论、评论回复和通知红点。
- **个人主页**：管理自己的作品、点赞、收藏、通知和头像。

## 技术栈

| 层面 | 技术 |
| --- | --- |
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 样式 | Tailwind CSS v4 |
| 动画 | Motion |
| 图标 | Lucide React |
| 后端服务 | Supabase |
| 颜色匹配 | CIELAB 感知色差算法 |
| Excel 导出 | SheetJS (xlsx) |
| 本地持久化 | localStorage |

## 快速开始

```bash
npm install
npm run dev
```

启动后在浏览器打开 Vite 输出的本地地址，一般是：

```text
http://localhost:5173
```

## 可用脚本

```bash
npm run dev       # 启动开发服务器
npm run build     # TypeScript 检查并构建生产包
npm run lint      # 运行 ESLint
npm run preview   # 预览生产构建
```

## Cloudflare Pages 部署

项目已部署在 Cloudflare Pages：

```text
https://pinbean.pages.dev
```

Cloudflare Pages 推荐配置：

| 配置项 | 值 |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

如果需要启用 Supabase 云端能力，请在 Cloudflare Pages 的环境变量中配置：

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Supabase 配置

项目在没有 Supabase 配置时仍可作为本地拼豆图编辑器使用。配置 Supabase 后，会启用登录、社区、云端作品、评论、通知和头像上传等功能。

在项目根目录创建 `.env`：

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

然后在 Supabase SQL Editor 中按需执行以下脚本：

```text
supabase_schema.sql        # 作品、点赞、评论、收藏与 RLS 策略
fix_comments.sql           # 评论回复 parent_id 字段
notifications_schema.sql   # 通知表与触发器
avatar_bucket.sql          # 头像存储 bucket 权限策略
```

建议先执行 `supabase_schema.sql`，再执行评论修复、通知和头像相关脚本。

## 自定义色卡格式

CSV 至少需要包含 `色号` 和 `HEX` 两列，也兼容 `code` / `id`、`hex` / `色值` / `颜色值` 等表头。

```csv
色号,HEX
A01,#FFFFFF
A02,#000000
A03,#FF3366
```

导入后，新生成的拼豆图会使用当前自定义色卡进行颜色匹配。

## 项目结构

```text
src/
├── components/
│   ├── AuthModal.tsx        # 登录 / 注册弹窗
│   ├── AuthProvider.tsx     # Supabase 用户状态
│   ├── BeadCanvas.tsx       # 拼豆网格画布与 PNG 导出
│   ├── CanvasGrid.tsx       # 可编辑网格
│   ├── ColorReplacePanel.tsx # 画笔与批量颜色替换
│   ├── ColorStats.tsx       # 颜色统计与 Excel 导出
│   ├── CommunityFeed.tsx    # 社区作品流、详情、点赞、收藏、评论
│   ├── LandingPage.tsx      # 登录前落地页
│   ├── ProfilePage.tsx      # 个人主页与作品管理
│   ├── PublishModal.tsx     # 发布作品弹窗
│   └── SidebarContent.tsx   # 编辑器侧边栏
├── data/
│   └── beadColors221.ts     # 内置 221 色调色板
├── hooks/
│   ├── useAuth.ts           # 登录状态 hook
│   ├── useDarkMode.ts       # 深色模式
│   └── useHistoryState.ts   # 撤销 / 重做状态
├── lib/
│   ├── avatarStorage.ts     # Supabase 头像上传与读取
│   ├── cloudProjects.ts     # 云端作品、互动、通知接口
│   ├── colorMatch.ts        # CIELAB 色差匹配算法
│   ├── exportExcel.ts       # Excel 材料清单导出
│   ├── exportPng.ts         # PNG 拼豆图导出
│   ├── imageToBeads.ts      # 图片转拼豆网格
│   ├── localProjects.ts     # localStorage 作品管理
│   ├── paletteStorage.ts    # 自定义色卡存储与解析
│   └── supabase.ts          # Supabase 客户端
├── types/
│   └── bead.ts              # 核心类型定义
├── App.tsx                  # 主应用
├── index.css                # Tailwind 与全局样式
└── main.tsx                 # 入口
```

## 当前状态

- 构建方式：Vite SPA
- 主要分支：`main`
- 云端能力：依赖 Supabase 环境变量和 SQL 初始化脚本
- 测试状态：当前未配置自动化测试脚本，发布前建议补充核心转换逻辑和社区交互的测试

## License

当前仓库暂未声明开源许可证。
