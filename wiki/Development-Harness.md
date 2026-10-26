# 独立 UI 预览台（Development Harness）

> 目标：**不启动酒馆**也能看到并操作 ST-BgLoader 的完整 UI，用于快速迭代与截图验证。

```bash
npm run dev:ui        # 打开 http://localhost:5173/
node tests/dev-harness.mjs   # 自检（需先启动上面这条）
```

## 为什么不是「把酒馆拆开」

宿主（SillyTavern / Luker）是一个 jQuery 单体，逐块拆分独立运行意味着逆向宿主并长期对抗上游改版。
而插件对宿主的实际依赖很窄：**4 个 DOM 锚点 + 一个事件源 + 一个上下文对象 + toastr + 3 个 HTTP 端点**。
预览台只补这些接缝，成本远低于拆分宿主，且完全不影响产品构建。

## 结构

| 路径 | 职责 |
| --- | --- |
| `dev/index.html` | 宿主外壳：`#extensions_settings`、`#Backgrounds`、`#bg_menu_content`、顶栏按钮 |
| `dev/host-stub.ts` | 宿主桩：`SillyTavern.getContext()`、`eventSource`、`event_types`、`toastr`（含 `warn`） |
| `dev/mock-server.ts` | Vite 中间件：模拟 `/api/backgrounds/{all,upload,delete}` 与 `/backgrounds/<file>` |
| `dev/.data/` | 运行数据（已 gitignore）：媒体文件、清单文档、设置文档 |
| `vite.config.dev.ts` | 预览台专用配置；产品仍走 `vite.config.ts`（lib 构建） |
| `tests/dev-harness.mjs` | 自检套件（14 项断言，覆盖启动/抽屉/媒体库往返/设置持久化/主开关音频） |

宿主端点的响应契约必须与 `src/backend/ServerOrigin.ts` 保持一致，尤其是：

- `POST /api/backgrounds/all` → `{ images: [{ filename }] }`
- `POST /api/backgrounds/upload` → 返回**纯文本**的落盘文件名（插件直接把它当作文件名）
- `POST /api/backgrounds/delete` → 请求体 `{ bg: "<filename>" }`

## 覆盖范围

可以完整操作：扩展设置面板（主开关 / 状态 / 直达入口）、顶栏背景抽屉（标签页、媒体库网格、搜索、
类型过滤、排序、上传、删除、背景显隐）、BGM 播放与环境音、天气与视觉器入口。

## 已知限制

- **不替代真机验收**：宿主桩可能滞后于真实宿主行为，发布前仍需在 Dev 实例跑 `e2e` / `smoke`。
- 预览页不加载 Font Awesome，图标位置会显示为空白方块（功能不受影响）。
- 首次运行 `/backgrounds/st-bg-loader-settings.json` 与 `st-bg-loader-manifest.json` 返回 404 属正常：
  插件把"文档缺失"当作首次运行。
- 上传的文件重名时会自动加序号；两份 JSON 状态文档则原地覆盖。
- 桌面版 Chrome 之外的环境需要先点一次「点击解锁音频」，否则浏览器会拦截 BGM。
