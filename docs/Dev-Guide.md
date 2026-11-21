# 开发者指南（Dev Guide）

> 面向维护者与二次开发者，说明本仓的代码分层、构建产物、双形态运行、测试体系与前端框架引入策略。
> 事实真源＝实际代码（`src/`、`tests/`、`dev/`、`scripts/guards/`、`.github/workflows/`、`vite.config*.ts`、`package.json`）与 `.trellis/research/pack-transfer-rescan-2026-11-21.md`（12 路调查＋裁判汇总）。
> 状态按 2026-11-21 实测复核；早期文档所述「无 guards / 无 CI / type-check exit 2 / 无 Preact / 无 framework」为实施前旧状态，已失效。守卫族另见 `Guards.md`。

---

## 1. 架构总览

### 1.1 入口与生命周期

- 唯一构建入口 `src/index.ts:8`（经 `vite.config.ts` 的 lib 配置声明），唯一样式入口 `src/index.ts:1` 引入 `./ui/style.css`。
- 主类 `STBgLoaderExtension` 定义于 `src/index.ts:30`；构造函数装配全部子系统（`src/index.ts:59-70`）；`init()`（`src/index.ts:149-459`）按「读设置对账 → 初始化缓存 → 挂载 FX → 配置音频 → 装配抽屉/原生夺舍 → 注册钩子 → 恢复背景」顺序引导。
- 模块级自举 `src/index.ts:837-847`：脚本加载即 `new STBgLoaderExtension()`，DOM 就绪或立即调用 `init()`，并把实例挂到 `window.STBgLoader`、公开 API 挂到 `window.stBgLoader`。
- 设置真源优先级：服务端文档 > 本地 localStorage 缓存（高 revision 胜，服务端胜平局），见 `src/index.ts:775-789` 的 `reconcileSettings()`；保存走 `saveSettings()`（`src/index.ts:827-832`）做「本地去抖写 + 服务端文档调度 + Authority KV 镜像推送」三路。

### 1.2 `src/` 分层清单

> 文件数来自本轮 `find src -maxdepth 1 -type d` 与各层 `-type f` 统计；职责来自 `Architecture-and-Design.md:152-185` 模块表与 `src/index.ts` 的 import/装配关系交叉核对。

| 层 | 文件数 | 主要文件（`src/` 相对路径） | 职责 |
| :--- | :--- | :--- | :--- |
| `api/` | 3 | `api/PublicAPI.ts`、`api/PostMessageBridge.ts` 等 | `window.stBgLoader` 公开接口与事件总线；跨 iframe JSON-RPC 端点桥（`src/index.ts:11-12,55-56,425-433`） |
| `audio/` | 2 | `audio/AudioEngine.ts`、`audio/AmbientSoundGenerator.ts` | WebAudio BGM 播放、低通隔音滤波、自动轮播；程序化环境音合成 |
| `backend/` | 6 | `backend/ServerOrigin.ts`、`backend/ServerSettings.ts`、`SettingsSync.ts`、`AuthorityBridge.ts`、`AgentBridge.ts`、`RemoteImporter.ts` | 服务端媒体/设置真源通道、Authority 云镜像与能力感知、AI 导演工具注册、外链服务端代拉取 |
| `bridge/` | 1 | `bridge/HostBridge.ts` | 唯一宿主桥：宿主探测、DOM 锚点查找、CSRF 头提取（D-01「宿主差异只进单一桥」落点） |
| `cache/` | 1 | `cache/CacheManager.ts` | CacheStorage 二进制热缓存 + IndexedDB 元数据与 LRU 配额清理（`src/index.ts:161,197`） |
| `core/` | 5 | `core/MediaMount.ts`、`ParallaxController.ts`、`SceneManager.ts`、`mediaType.ts`、`sanitize.ts` | 双缓冲图层挂载与转场、2.5D 视差、场景快照、媒体类型判定、字符串转义 |
| `fx/` | 1 | `fx/AtmosphereFX.ts` | Canvas 粒子天气（雨/雪/樱花/微粒/扫描线） |
| `renderers/` | 3 | `renderers/VideoRenderer.ts`、`ImageRenderer.ts`、`IframeRenderer.ts` | 视频直解、静态图片、HTML5/SVG 沙箱渲染，由 `MediaMount` 调度 |
| `triggers/` | 1 | `triggers/TriggerManager.ts` | 智能场景规则引擎，绑定宿主聊天事件（`src/index.ts:731-754`） |
| `types/` | 1 | `types/index.ts` | 全局类型、`BgLoaderSettings` 与 `DEFAULT_SETTINGS` 契约真源 |
| `ui/` | 7（顶层） | `ui/TopbarBackgroundDrawer.ts`、`SettingsDrawer.ts`、`MiniPlayer.ts`、`FrostedGlassController.ts`、`NativeBackgroundController.ts`、`UIComponents.ts`、`ui/style.css` | 增强式内嵌 UI：顶栏抽屉夺舍、设置主开关、音频胶囊、毛玻璃、原生背景感知与共享组件 |
| `ui/styles/` | 8 | `styles/00-tokens.css` ～ `07-responsive.css` | 拆分样式；`00-tokens.css` 是 `--SmartTheme*` 唯一允许出现处，其余组件只引 `--st-bg-*` 语义令牌。触摸下限 `--st-touch-min: 36px` 在 `00-tokens.css:44`（实测） |
| `visualizer/` | 1 | `visualizer/AudioVisualizer.ts` | 音频频谱与低音律动可视化，读取 `AudioEngine` 的 Analyser |

- 装配中枢：`src/index.ts:30-70` 持有各子系统实例，`init()` 与各 `onXxxChanged` 回调把 UI 变更扇出到子系统与 PublicAPI（`src/index.ts:270-365,534-563`）。
- 分层约束（来自仓根 `AGENTS.md` 项目覆盖）：D-02 注入样式双前缀、禁全局选择器；样式单一书写点；组件只引 `--st-bg-*`；D-01 宿主差异只进 `bridge/HostBridge.ts`；面板弹窗统一走 HostBridge 适配器，业务层禁用原生 `alert/confirm/prompt`。

### 1.3 已知偏差（如实记录）

- `src/ui/FrostedGlassController.ts:50,53` 在运行时 CSS 中直接引用 `--SmartThemeBlurTintColor` / `--SmartThemeBorderColor`，与 `src/ui/styles/00-tokens.css` 的令牌单一真源声明冲突，属待修违例（真源报告第五章、第七章裁决 15）；本指南不推广该写法。
- 工作台因缺 `#bg1`、原生瓦片、`FORCE_SET_BACKGROUND` 事件类型与主题变量注入，原生接管装饰与拦截在预览台不生效，属 host-stub 预期 drift，预览不能替代真机验收（真源报告第五章）。

---

## 2. 构建与产物

### 2.1 构建配置

- 构建脚本 `package.json:7`：`"build": "vite build"`；监听模式 `package.json:8`：`"dev": "vite build --watch"`。
- `vite.config.ts:4-26` 为 **Vite library 模式**：
  - 入口 `resolve(__dirname, 'src/index.ts')`（`vite.config.ts:8`），库名 `STBgLoader`（`:9`），产物文件名固定 `index.js`（`:10`），格式仅 `['es']`（`:11`）。
  - 输出目录 `dist`、`emptyOutDir: true`（`vite.config.ts:13-14`）。
  - CSS 产物固定命名 `style.css`（`vite.config.ts:15-24` 的 `assetFileNames`）。
  - 目标 `es2022`（`vite.config.ts:5`）。
- TypeScript 配置 `tsconfig.json:2-13`：`target ES2022`、`module ESNext`、`moduleResolution Bundler`、`strict: true`、`noImplicitAny: true`、`include: ["src/**/*"]`。类型检查脚本 `package.json:10`：`"type-check": "tsc --noEmit"`（本轮实测退出码 0）。
- 清单 `manifest.json:6-7` 声明产物落点：`js: dist/index.js`、`css: dist/style.css`；`manifest.json:9` 与 `package.json:3` 版本同为 `1.0.0`。

### 2.2 实际产物（2026-11-21 实测）

- `dist/index.js`：273839 字节；`dist/style.css`：17363 字节（本轮 `wc -c dist/index.js dist/style.css` 实测）。早期文档「257710 / 17194 字节」为实施前旧读数，已失效。
- `dist/` 由 `emptyOutDir` 管理，仅含上述两文件；两者均为构建生成，不入源码手写。

### 2.3 产物自包含校验与静态守卫接入状态

- 设计依据：G-13「运行时零 CDN/外链」；真源报告 G7 裁决把参照仓的 `no-bundler-only` 改写为「构建产物自包含/零外部引用校验」——检查 `dist/index.js` 无裸模块 `import`、无 `https?://` CDN 引用，`dist/style.css` 无 `@import` / 外链。
- 已落地接入（2026-11-21 实测）：`scripts/guards/` 六守卫 + `qa-static.mjs` 串跑入口存在（见 `Guards.md` 第 2.3 节）；`.github/workflows/checks.yml` 已串 `npm run type-check`、`npm run check:css`，`release.yml` 已存在。
- 接入缺口：`qa:static` 未挂 npm script（`package.json:6-14` 仍 7 条）；CI 未直接串 `qa-static`。产物自包含 grep 校验本轮未运行，不计为通过。
- 人工校验配方（供接入时复用；本轮未运行）：
  - `grep -nE "^import |https?://" dist/index.js` —— 期望无匹配（裸 import / CDN）。
  - `grep -nE "https?://|@import" dist/style.css` —— 期望无匹配（外链样式）。

---

## 3. 双形态运行

### 3.1 形态 A：插件装入宿主（junction / 符号链接分发）

- 安装单元是 `manifest.json` + `dist/`：宿主按 `manifest.json:6-7` 加载 `dist/index.js` 与 `dist/style.css`。这是构建后产物，不是源码直载。
- 真源报告第六章（路 12 只读探测）记录：Dev 实例的 Luker `third-party` 扩展目录下 `ST-BgLoader` 为**符号链接（lrwxrwxrwx）**指向本仓，链接可达、产物同源，无陈旧拷贝。Windows 下等价的分发手法为目录 junction；本仓真源只确证了 symlink 这一种，junction 未单独验证。
- 同目录存在旧上游插件 `Extension-VideoBackgroundLoader`，功能域重叠，双加载/事件冲突风险待运行方确认（真源报告 N16）——本指南如实转述，未做验证。
- 增强式内嵌：原生抽屉内容保留可见可用，插件面板挂载其后（仓根 `AGENTS.md` 项目覆盖，2026-11-19 问答定案）；D-03 要求纯前端主路径闭环，Authority 后端仅作可选增强、静默降级。

### 3.2 形态 B：`dev:ui` 独立预览台

- 启动脚本 `package.json:9`：`"dev:ui": "vite --config vite.config.dev.ts"`，服务 `http://localhost:5173/`。
- `vite.config.dev.ts:9-23`：`root: 'dev'`（预览页落在 `/`，使媒体相对路径 `backgrounds/<file>` 与真宿主一致，`:10-12`）、`server.port = 5173` 且 `strictPort: true`（`:15-16`）、`fs.allow: ['..']` 放行上一级 `src/`（`:17-20`）、`plugins: [devMockServer()]`（`:22`）。注释明确产品构建仍走 `vite.config.ts`，此配置只服务预览台、不触及 `dist/`（`vite.config.dev.ts:4-8`）。
- `dev/` 五文件职责：
  - `dev/index.html`：宿主外壳，提供 `#extensions_settings`、`#Backgrounds`、`#bg_menu_content`、`#backgrounds-drawer-toggle` 等锚点（`dev/index.html:14-49`）。
  - `dev/host-stub.ts`：宿主桩，补 `SillyTavern.getContext()`、`eventSource`、`event_types`、`toastr`（详见 `Development-Harness.md:20-22`）。
  - `dev/boot.ts`：先 `import './host-stub'` 再 `import '../src/index'`（`dev/boot.ts:6-7`），确保桩的全局量先于扩展自举；另处理音频解锁、抽屉开关与事件按钮（`:18-49`）。
  - `dev/mock-server.ts`：Vite 中间件模拟宿主端点（`dev/mock-server.ts:123-242`）。
  - `dev/.data/backgrounds/`：运行数据（已 gitignore），媒体文件与两份 JSON 状态文档（真源见 `dev/mock-server.ts:12-14`）。
- 预览台用途与限制见 `Development-Harness.md`：可完整操作设置面板、顶栏抽屉、媒体库往返、BGM/天气/可视化入口；**不替代真机验收**，发布前仍需在 Dev 实例跑 `e2e`/`smoke`（`Development-Harness.md:38-45`）。

### 3.3 mock-server 端点契约

`dev/mock-server.ts:1-15,141-231` 与 `src/backend/ServerOrigin.ts` 同构：

| 方法 / 路径 | 期望 | 实现要点 |
| :--- | :--- | :--- |
| `POST /api/backgrounds/all` | `{ images: [{ filename }] }` | 过滤媒体扩展名、隐藏点文件（`:150-154,116-121`） |
| `POST /api/backgrounds/upload` | 纯文本返回落盘文件名 | multipart 解析、`safeName()` 路径段净化、JSON 原地覆盖 / 媒体重名加序号（`:156-188`） |
| `POST /api/backgrounds/delete` | `{ ok: true }` | 请求体 `{ bg: "<filename>" }`，删除幂等（`:190-207`） |
| `GET /backgrounds/<file>` | 原始字节 + MIME | `safeName()` 防穿越，缺失返回 404（`:209-223`） |

- 首次运行 `/backgrounds/st-bg-loader-settings.json` 与 manifest 返回 404 属正常：插件把「文档缺失」当首次运行（`Development-Harness.md:42-43`）。
- 预览台不加载 CDN，图标用本地 `dev/vendor/fontawesome` 副本（`dev/index.html:9-11`），符合 G-13。

### 3.4 教程模式（dry-run，不写真实数据）

预览台提供教程模式：以内存演示数据替代磁盘与浏览器持久化，用于安全演示与录制。启动与覆盖范围见专文 `Tutorial-Mode.md`。要点：服务端开关 `DEV_TUTORIAL=1`（`dev/mock-server.ts:84`）+ 浏览器标识 `?tutorial=1`（`dev/host-stub.ts:191`）；拦截 localStorage（`dev/host-stub.ts:192-198`）与 `/api/backgrounds/*`、`/backgrounds/*`（`dev/mock-server.ts:153,209,245,263`）。CacheStorage / IndexedDB 不在当前教程拦截范围（源码拦截由对应开发者负责）。

---

## 4. 测试体系

### 4.1 npm 脚本入口

`package.json:6-14` 共 7 条脚本：`build`、`dev`、`dev:ui`、`type-check`、`check:css`、`test:e2e`、`test:stress`。**无 `npm test`、无 lint**（真源报告 A5、路 8 现状）。`qa:static` 未挂 npm script，CI 工作流已存在（见 2.3 节）。

### 4.2 静态守卫

- `tests/css-gate.mjs`：CSS 作用域门禁，`npm run check:css` 运行。三条规则与扫描范围详见 `Guards.md`。退出码非 0 即违规。
- `scripts/guards/` 六守卫 + `qa-static.mjs` 串跑入口已落地；直接 `node scripts/guards/qa-static.mjs` 运行，详见 `Guards.md` 第 2.3 节。

### 4.3 浏览器套件清单（`tests/*.mjs`）

> 前置实例分两类：**① 预览台**（`npm run dev:ui` 已在 `:5173`）；**② 真机**（酒馆 Dev 实例，默认 `https://localhost:8003` 或 `https://[IP]:8003`，需扩展已装载）。所有套件**都不自启服务器**（真源报告路 8 结论）。

| 套件（`tests/` 相对） | 用途 | 前置实例 | 关键事实来源 |
| :--- | :--- | :--- | :--- |
| `dev-harness.mjs` | 预览台自检，14 项断言：启动/抽屉/媒体库往返/设置持久化/主开关音频 | ① `:5173` | 文件头注释；`Development-Harness.md:25` |
| `api-harness.mjs` | 对外端点面：PublicAPI 扩充 + PostMessageBridge + 事件三通道（PRD A1/A3/A4） | ① `:5173` | 文件头注释 |
| `screenshot-night.mjs` | 夜间批 UI 截图，驱动截图优化 | ① `:5173` | 文件头注释 |
| `verify-autoadvance-once.mjs` | F1 自动轮播一次性真机验证（30s 间隔观察一次完整轮转），非 CI，全程约 40s | ① `:5173` | 文件头注释 |
| `e2e.mjs` | API 级 E2E，含 Test 26 令牌单一真源运行期断言 | ② 真机 | 文件头 + 真源报告 C2（`:948-949`） |
| `stress.mjs` | 大文件流式传输与韧性压力测试 | ② 真机 | 文件头注释 |
| `authority.mjs` | 服务端存储 + Authority 增强；真后端/页内 mock SDK 双模；实例不可达时 skip（退出 0） | ② 真机 | 文件头注释 |
| `smoke-ui.mjs` | 真实 UI 冒烟：搜索/过滤/点卡片/开关/场景，每步断言+截图，末尾全量复原 | ② 真机 | 文件头注释 |
| `extreme-media.mjs` | 10 类极端媒体语料走真实管线（超大图/真实视频/零字节/损坏/截断/伪装名/长名/长音频/脚本 SVG/快速切换），带卫生清理 | ② 真机 | 文件头注释 |
| `verify-extensions-drawer.mjs` | 扩展抽屉验证 | ② 真机 | 文件头注释 |
| `verify-ui-compact.mjs` | 超紧凑 UI 与屏幕审计（内含文案审计断言，可复用为 check:copy） | ② 真机 | 文件头 + 真源报告 C4（`:111-138`） |
| `probe-drawer-tabs.mjs` | 抽屉双标签截图：媒体库 / 设置 | ② 真机 | 文件头注释 |
| `probe-session.mjs` | 会话探针：登录态 / 宿主 API / 扩展装载状态截图 | ② 真机 | 文件头注释 |
| `lib/ensure-extension.mjs` | 共享引导：确保被测页已装载 ST-BgLoader（宿主 API 优先，否则动态 import 兜底，探针零残留） | 被上述真机套件 `import` | 文件头注释 |

- 截图产物统一落 `tests/e2e-artifacts/`（部分套件落 `test-artifacts/` 子目录，见各文件的 `ARTIFACT_DIR`）。
- Chrome 路径统一由环境变量 `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH` 提供，代码内含平台默认值；目标 URL 由 `TEST_TARGET_URL` / `TARGET_URL` / `HARNESS_URL` 提供。
- E2E 纪律（真源报告 F 组）：端口集中冻结 + guard 白名单、有界等待、回读、非空前置门、finally 关服务器、strictPort 端口占用即失败、错误归因隔离过滤第三方噪声——均为建议项，部分已散落在现有套件，尚未形成统一入口。

---

## 5. 前端框架引入说明

### 5.1 现状（2026-11-21 实测）

- UI 主体仍为手写 `innerHTML` 字符串模板 + 局部 `createElement`；但已引入 Preact 作为渐进式组件化通道，非「零框架」。
- `package.json:37-39` 声明 `"dependencies": { "preact": "^11.2.0" }`，Preact 已入运行时依赖（早期文档「仅三个 devDependency、无 Preact」为实施前旧状态，已失效）。
- 已落地 `src/ui/framework/`（实测 `ls src/ui/framework/` 命中 `bridge.ts` 130 行、`components.ts` 38 行），提供框架桥接与共享组件基建；早期文档「framework 目录不存在」已失效。
- 样式纪律不变：双前缀 `.st-bg-*` / `#st_bg*`，零 `box-shadow`，组件只引 `--st-bg-*` 语义令牌，`--SmartTheme*` 仅限 `src/ui/styles/00-tokens.css`（仓根 `AGENTS.md` 项目覆盖 + `tests/css-gate.mjs`）。

### 5.2 框架共存约束

- 渐进式挂载：动态 `import()` + 特性检测 + `try/catch` 静默降级 + in-flight 并发守卫 + `unmount` 清理，与 D-03 同构；服务端/框架不可用时纯前端主路径仍闭环。
- 宿主共存红线：渲染真实 DOM 的框架（Preact）须保留自有根前缀、只操作自有根节点，不重建宿主原生抽屉；D-02 双前缀与 `--st-bg-*` 令牌纪律不变，`--SmartTheme*` 仍只在 `00-tokens.css`。
- 构建影响：框架入运行时需评估 `vite.config.ts` lib 打包体积、D-07「安装即用/不得要求用户构建」与 D-12 前端性能预算，并在 Dev 实例复测数字留证。是否进一步扩大框架使用范围属需主人裁定的重大方向决策（真源报告 N4）。

---

## 6. 验证状态（2026-11-21 本轮）

### 6.1 已实际运行的检查

- `npm run type-check`：**已运行，退出码 0（通过）**。命令 `npm run type-check`，输出头两行为脚本回显，无 TS 报错；日志末行 `TYPECHECK_EXIT=0`。证据：`detectCapabilities()` 定义于 `src/bridge/HostBridge.ts:108`，构造函数 `:55` 调用有效。早期文档「exit 2 / TS2551」为实施前旧状态。
- 目录/文件实测：`wc -c dist/index.js dist/style.css` 得 273839 / 17363 字节；`ls scripts/guards/` 命中六守卫；`ls src/ui/framework/` 命中 `bridge.ts`、`components.ts`；`ls .github/workflows/` 命中 `checks.yml`、`release.yml`；`grep -n detectCapabilities src/bridge/HostBridge.ts` 命中 `:55`、`:108`；`package.json:37-39` 命中 preact 依赖；`src/ui/styles/00-tokens.css:44` 命中 `--st-touch-min`。

### 6.2 未实际运行的检查

- `npm run check:css`（真源报告与早期文档记载退出码 0，但本轮未重跑）、`qa-static` 六守卫逐项串跑、`dist` 产物 grep 校验、第 2.3 节人工配方。均不计为通过。

### 6.3 其他

- 目录树 / 文件搜索（`find`/`ls`/`grep`）与本轮全部源码 `Read`：已执行且成功，证据已在上文逐条给出 `path:line`。
- 本文件为 Markdown 文档，无编译型语法，`tsc --noEmit` / `node --check` 不适用于文档本身；文档内容准确性以引用的源码行为准。
