# Design — 独立 UI 预览台 + 主开关视觉音频同停

## 1. 目标与非目标

**目标**：不启动任何酒馆实例，就能在浏览器里打开并操作 ST-BgLoader 的全部 UI；顺带收口 P2-5（主开关关闭时 BGM/环境音仍在响）。

**非目标**：
- 不替代真宿主验收（桩可能滞后于真宿主行为）。
- 不重构 HostBridge，不把宿主差异再往上抽。
- 不改变产品构建模式（Vite 仍是 lib 构建）。

## 2. 现场取证（设计依据）

| 事实 | 证据 |
|---|---|
| 宿主耦合仅 9 文件 / 约 60 处 | `grep -rc` 统计，集中在 `src/index.ts`(16)、`src/triggers/TriggerManager.ts`(13) |
| 已有集中层 | [HostBridge.ts](../../../src/bridge/HostBridge.ts)：宿主检测 + 4 个 DOM 锚点 + `getContext` |
| 宿主能力均写可选守卫 | `index.ts:569` `toastr?.warn`、`index.ts:676` `if (globalAny.eventSource)` |
| 设置层有降级 | `ServerSettings` 注释与实现：localStorage 为降级副本 |
| 服务端面极小 | 仅 `/api/backgrounds/all`、`/upload`、`/delete` + `backgrounds/<file>` 静态读 |
| 仓库无 HTML 入口 | `find . -name "*.html"` 无结果；`vite.config.ts` 只配 lib 构建 |

服务端契约（实现 mock 时必须逐字对齐）：

| 端点 | 方法 | 请求 | 响应 |
|---|---|---|---|
| `/api/backgrounds/all` | POST | `{}` (JSON) | `{ images: [{ filename }] }` |
| `/api/backgrounds/upload` | POST | multipart，字段名 **`avatar`** | 任意 2xx |
| `/api/backgrounds/delete` | POST | `{ bg: "<filename>" }` | 任意 2xx |
| `/backgrounds/<file>` | GET | — | 文件字节 |

两份 JSON 文档也走 upload/静态读：`st-bg-loader-manifest.json`（媒体清单）、`st-bg-loader-settings.json`（设置真源）。

## 3. 结构设计

```
dev/
  index.html            宿主外壳：4 个 DOM 锚点 + 引导脚本
  host-stub.ts          宿主上下文桩
  mock-server.ts        Vite 中间件插件（4 条路由 + 落盘）
  styles/harness.css    预览台自身样式（st-bgloader-dev 前缀）
  .data/                运行数据（gitignore，含 backgrounds/）
vite.config.dev.ts      预览台专用配置（root=dev，端口 5173）
tests/dev-harness.mjs   puppeteer 断言 AC1–AC4
```

`package.json` 增 `"dev:ui": "vite --config vite.config.dev.ts"`。产品 `vite.config.ts` 一字不改。

### 3.1 宿主桩契约

必须提供（缺什么补桩，**不改产品代码**）：

- `window.SillyTavern = { getContext: () => ctx }`
- `ctx = { eventSource, event_types, getRequestHeaders: () => ({}), extensionSettings: {} }`
  - `eventSource`：`on/off/emit/once` 最小实现；`event_types` 覆盖插件订阅的键（MESSAGE_SENT、CHAT_CHANGED 等，实现时以 `TriggerManager.bindSillyTavernEvents` 引用的键为准）
- `window.toastr = { info, success, warning, error, warn }`（插件用 `warn` 与 `error` 两个）
- DOM 锚点：`#extensions_settings`、`#Backgrounds`（可切换 `.openDrawer`）、`#bg_menu_content`、顶栏按钮（`#backgrounds-drawer-toggle`）
- 不提供 jQuery：走 `SettingsDrawer` 内建的 dual-channel 降级路径

判定原则：**桩补的是宿主缺口，不是替产品兜底**。若某个宿主调用在桩下报错，优先判断是「桩缺」还是「产品对宿主假设过强」，后者记为发现项，不在本轮顺手改。

### 3.2 mock 服务端

Vite 插件 `configureServer` 挂中间件，数据根 `dev/.data/backgrounds/`：

- 启动时若无目录则创建，并写入一份初始 `st-bg-loader-manifest.json`（空 items）与可选示例媒体
- `upload`：解析 multipart（字段 `avatar`），重名自动加后缀（与宿主行为对齐），写盘
- `all`：`readdirSync` 过滤隐藏项 → `{ images: [{ filename }] }`
- `delete`：按 `bg` 删文件；已不存在也算成功（幂等）
- `GET /backgrounds/<file>`：`decodeURIComponent` 后防目录穿越（`..` 一律 400），返回字节

数据只落 `dev/.data/`，与产品 `dist/` 无交集。

### 3.3 P2-5 改动点

只改 `src/index.ts` 的 `applyMasterEnabled`（[:99](../../../src/index.ts)）：

```
false 分支追加：
  this.audioEngine.stopTrack(300);            // 淡出 300ms
  this.ambientSoundGenerator.setSound({ ...this.settings.ambientSound, type: 'off' });
true  分支：不恢复音频（不改 audioEngine / ambient）
```

- 不写回 `settings.ambientSound.type`：用户配置保持原样，重新开启时只是「不自动响」，配置不丢。
- 远端收敛调用同一函数 → 两条路径天然一致。
- 待确认（实现时验证）：`AudioEngine.stopTrack` 在未播放时是否幂等；`AmbientSoundGenerator.setSound({type:'off'})` 走 `stop()`，确认不抛。

### 3.4 隔离与安全

- `dev/` 不进产物：lib 构建入口只有 `src/index.ts`。
- `.gitignore` 增 `dev/.data/`。
- 预览页样式独立命名空间 `st-bgloader-dev-*`，遵守 L1-MR-3。
- 端口取 Vite 生态默认 **5173**（不属 L0-16 的酒馆实例段与周边工具登记段），`strictPort: true` 便于发现冲突。
- 无本机绝对路径（L1-MR-14）。

### 3.5 验收方式

1. 手工：`npm run dev:ui` → 浏览器打开，看设置面板与抽屉。
2. 自动：`tests/dev-harness.mjs`（puppeteer-core，已在 devDependencies）断言 AC1–AC4：无未捕获异常、媒体库往返、设置持久化、主开关音频断言。
3. 真宿主回归：`:8003` 上跑 e2e 24/24（需临时重启 Dev Luker）。

## 4. 备选方案与否决理由

| 方案 | 工程量 | 否决/采纳理由 |
|---|---|---|
| 模拟宿主预览台 | 0.5–1 天 | **采纳**：只补 4 个锚点 + 3 个端点，产品零改动 |
| 只起酒馆 node 服务 | ~0 | 省不了启动与内存开销，仍依赖宿主 |
| 完整拆分 Luker 各模块独立运行 | 数周–数月 | 逆向 jQuery 单体，随上游每次改版失效，收益不匹配 |

## 5. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 桩与真宿主漂移 | 预览过了真机失败 | 明示不替代真宿主；关键改动仍跑 `:8003` 套件 |
| mock 响应格式偏差 | 媒体库恒为空 | 已逐字对齐上表契约；dev-harness 断言媒体库非空 |
| 浏览器自动播放策略 | 预览页无手势时 BGM 不播 | 预览页提供「点击解锁音频」按钮，测试先点击再断言 |
| 预览台污染产品构建 | dist 混入 dev 代码 | 独立 config + 独立 root；AC5 校验 `dist/` 无变更 |

## 6. 回滚

新增文件为主 + 一处函数内追加两行；`git revert` 单个提交即可完全回退。
