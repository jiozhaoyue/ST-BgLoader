# 独立 UI 预览台（免起酒馆）+ 主开关视觉音频同停

## Goal

1) 新建 dev/ 预览台：宿主桩 + mock /api/backgrounds 端点 + npm run dev:ui，免启 :8001/:8003 即可查看与操作设置面板、顶栏背景抽屉、媒体库；2) P2-5 修：主开关关闭时同时停 BGM（淡出）与环境音。验收：预览台零未捕获错误、媒体库上传/删除/持久化往返可用；主开关关闭后无残留音频；type-check/build/check:css/e2e 全绿。

## Requirements

### R1 免宿主预览台（核心）

- 新增 `dev/` 预览台，`npm run dev:ui` 启动；**不依赖任何酒馆实例**（不连 `:8001`/`:8002`/`:8003`/`:8004`），浏览器直接打开即可看到并操作插件 UI。
- 覆盖范围：`#extensions_settings` 内的扩展设置面板（主开关 / 状态 / 打开设置按钮）；顶栏背景抽屉（标签页切换、媒体库网格、搜索、类型过滤、排序、上传、URL 导入、删除、背景可见性）；可视化与天气控件的入口。
- 与产品构建隔离：预览台代码不进入 `dist/`，`vite build` 产物与 `manifest.json` 不受影响。

### R2 宿主桩

- 提供最小宿主上下文桩：`SillyTavern.getContext()`（含 `eventSource` / `event_types` / `getRequestHeaders`）、`toastr`、可选 jQuery 桩，以及宿主 DOM 锚点（`#extensions_settings`、`#Backgrounds`、`#bg_menu_content`、顶栏按钮）。
- 任一宿主能力缺失时插件不得抛未捕获异常（延续 L1-MR-1 纯前端可降级）。

### R3 mock 服务端

- 在 dev 服务器内实现 `POST /api/backgrounds/all`、`POST /api/backgrounds/upload`、`POST /api/backgrounds/delete`、`GET /backgrounds/<file>`。
- 数据落 `dev/.data/`（gitignore）；支持上传 → 列出 → 删除 → 刷新 的完整往返，以及 `st-bg-loader-settings.json` 的读写往返。

### R4 主开关语义收口（P2-5）

- `applyMasterEnabled(false)` 在现有视觉动作之外，追加：BGM 淡出停止（`AudioEngine.stopTrack`）、环境音切 `type: 'off'`。
- 重新开启**不自动续播**关闭前的曲目与环境音（避免开启瞬间突然出声），由用户手动恢复。
- 本地切换路径与远端收敛路径（`applySettingsToSubsystems`）行为一致。

### R5 不回归

- `type-check` / `build` / `check:css` 全绿；`dist/` 与 `manifest.json` 不被 dev 工具污染；真实例 e2e 仍 24/24。
- 开源基线 L1-MR-14：`dev/` 不得出现本机绝对路径或个人数据。

## Constraints

- L0-4 块级编辑；修改现有文件一律 Edit。
- L0-9 宿主差异只进 bridge：预览桩属于开发工具，放 `dev/`，不得混入产品桥接层。
- L1-MR-3 CSS 双前缀：预览页自身样式须独立命名空间，不得使用裸选择器。
- L1-MR-10 多入口同源同改：若改动顶栏抽屉模板，需同步重建 dist。
- L0-7 提交纪律：显式 pathspec、暂存区校验、推送 origin master。

## Acceptance Criteria

- [x] AC1 `npm run dev:ui` 仅凭本机 Node 即可启动；打开页面后控制台无未捕获异常，扩展设置面板正常渲染。
  - 证据：`tests/dev-harness.mjs` 前 3 项断言通过（启动 / 面板渲染于 `#extensions_settings` / 零未捕获异常与零非预期 4xx）。
- [x] AC2 顶栏抽屉可打开：媒体库来自 mock 端点；上传文件后出现在网格且刷新仍在；删除后消失；搜索 / 类型过滤 / 排序生效且刷新后保持。
  - 证据：抽屉挂载断言通过；媒体库初始 2 张（seed 的 SVG + WAV）；上传 `harness-probe.png` → 3 → 刷新后 3 → 删除回到 2；过滤/排序沿用插件原逻辑并随设置文档持久化（未单独断言，见 implement D3）。
- [x] AC3 设置面板主开关切换后写入 mock 服务端文档，刷新后状态保持。
  - 证据：断言读取 `/backgrounds/st-bg-loader-settings.json` 得到 `enabled=false`。
- [x] AC4 主开关关闭 → BGM 淡出停止、环境音停止、背景层卸下；再次开启 → 背景恢复且无音频自动响起。
  - 证据：关闭后 `isPlaying=false`、`ambientSound.type='off'`；重新开启后 `isPlaying` 仍为 `false`。
- [x] AC5 `type-check` / `build` / `check:css` 全绿；`dist/` 无意外变更；`:8003` 真实例 e2e 24/24 复验通过。
  - 证据：三者均通过；`dist/index.js` 因 P2-5 变更重建并同批提交；Dev Luker `:8003` 上 e2e **24/24 全绿**。
- [x] AC6 `dev/.data/` 与生成产物进 `.gitignore`；`dev/` 源码不含本机绝对路径。
  - 证据：`.gitignore:25 dev/.data/`（`git check-ignore` 复核）；`dev/` 内无本机路径（Chrome 路径只在 `tests/` 中按既有约定读取环境变量）。
- [x] AC7 文档：README 与 wiki 增补预览台用法；主开关语义变更写进可见说明。
  - 证据：README 新增「独立 UI 预览台」节 + `dev:ui` 命令；wiki 新增 `Development-Harness.md` 并挂侧栏；`Settings-Reference.md` 的 `enabled` 行补上音频同停与新开不续播语义。

## Notes

- 预览台**不替代**真宿主验收：宿主桩可能滞后于真宿主行为，最终验收仍需在 Dev 实例上跑一遍。
- 已知前提：仓库当前无 HTML 入口，Vite 为 lib 构建模式，预览台需独立配置文件，不改 `vite.config.ts` 的 lib 行为。
