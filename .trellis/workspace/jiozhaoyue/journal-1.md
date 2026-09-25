# Journal - jiozhaoyue (Part 1)

> AI development session journal
> Started: 2026-09-05

---
## 2026-09-05: Task 09-05-bg-loader Kickoff

- **Action**: Initialized task `09-05-bg-loader` (Rich Media Background Plugin).
- **Global Rules**: Updated `AGENTS.md` with strict interactive Q&A rules (ask_question tool, batching multiple questions, no questions in prose, no premature aborts).
- **Upstream Research**: Completed in-depth review of SillyTavern's official `Extension-VideoBackgroundLoader` (WASM ffmpeg transcoding, audio stripping, heavy CPU/RAM) and community implementations (`LenAnderson/SillyTavern-VideoBackgrounds`).
- **Phase**: Entered Phase 1.1 Brainstorming. Initialized `prd.md`.
- **Decisions Confirmed**:
  - DOM Mount: Inside `#bg1` (.st-bg-media-container) matching native fitting classes.
  - Sandbox: Sandboxed `<iframe>` for HTML/Canvas/SVG animations.
  - Audio: Independent AudioEngine with volume slider, mute, fade, and background pausing.
  - Cache: CacheStorage (binary streams) + IndexedDB (metadata/config) with LRU eviction.
  - UI: Extension drawer panel + native background drawer augmentation.
  - Visual Filters: Blur, Brightness, Opacity, Saturate sliders.
  - Media Sources: Local drag/drop file upload + remote HTTP/HTTPS streaming URL.
  - **Implementation Completed**:
  - `src/types/index.ts`: MediaItem, VisualFilters, BgLoaderSettings definitions.
  - `src/cache/CacheManager.ts`: CacheStorage streaming binary store + IndexedDB metadata & LRU eviction.
  - `src/audio/AudioEngine.ts`: Unified audio engine with volume, mute, fade transitions, and visibility hooks.
  - `src/renderers/`: VideoRenderer (hardware accelerated HTML5 Video), IframeRenderer (sandboxed HTML5/WebGL/SVG), ImageRenderer.
  - `src/core/MediaMount.ts`: Double-buffering crossfade mount inside `#bg1` with real-time CSS filter pipeline.
  - `src/ui/`: SettingsDrawer (media upload, URL import, filter sliders, audio controls, cache manager) and NativeBgAugmenter (badges & native hook).
  - `src/index.ts`: SillyTavern extension entry point with eventSource hooks and localStorage persistence.
  - `dist/`: Successfully compiled production bundle with Vite (index.js 34.7KB, style.css 3.0KB).
- **Automated Verification**:
  - Attached to live local test environment via junction links.
  - Implemented Puppeteer headless E2E suite (`tests/e2e.mjs`).
  - Executed 6 automated browser test cases against live SillyTavern runtime:
    1. Extension activation & `window.STBgLoader` availability: PASS
    2. `#bg1` DOM mount & double-buffer layer creation: PASS
    3. CSS visual filters runtime application: PASS
    4. CacheStorage streaming & sandboxed iframe rendering: PASS
    5. AudioEngine volume & mute controls: PASS
    6. Settings drawer DOM injection & UI components: PASS


## Session 1: Rich Media Background Plugin
<!-- trellis-session: v=2 fp=8a687cfb9bb87f1c -->

**Date**: 2026-09-05
**Task**: Rich Media Background Plugin
**Branch**: `master`

### Summary

Researched official plugin limitations, brainstormed requirements, implemented zero-transcoding video/audio/HTML/SVG background engine with CacheStorage and automated E2E tests passing 100%

### Git Commits

| Hash | Message |
|------|---------|
| `e0fc0bd` | feat: initial implementation of rich media background plugin (ST-BgLoader) |

### Status

[OK] **Completed**


## Session 2: Phase 2: Filter Presets, Audio Playlist & Interactive Sandbox
<!-- trellis-session: v=2 fp=01aa378ccbb5f24c -->

**Date**: 2026-09-05
**Task**: Phase 2: Filter Presets, Audio Playlist & Interactive Sandbox
**Branch**: `master`

### Summary

Completed filter presets, playlist audio queue, glassmorphic floating mini player capsule, and interactive sandbox pointer-events toggle. All 10 automated E2E tests passed.

### Main Changes

- Extended types with PlaybackMode, FilterPreset, and built-in preset collection
- Upgraded AudioEngine with playlist queue, track advancement, and playback modes (loop, single, shuffle)
- Created MiniPlayer floating capsule with track marquee, mode toggling, and transport buttons
- Added sandbox interactive mode toggle to MediaMount and SettingsDrawer

### Git Commits

| Hash | Message |
|------|---------|
| `ede2cf4` | feat: add filter presets, audio playlist, mini player, and interactive sandbox mode |

### Testing

- [OK] 10/10 automated E2E tests passed on live SillyTavern instance with Puppeteer

### Status

[OK] **Completed**

### Next Steps

- Explore character-specific background binding or additional visual effects if needed


## Session 3: Phase 3: Public Infrastructure API & Autoplay Unmute Engine
<!-- trellis-session: v=2 fp=653377aa20578b6c -->

**Date**: 2026-09-05
**Task**: Phase 3: Public Infrastructure API & Autoplay Unmute Engine
**Branch**: `master`

### Summary

Implemented public JavaScript SDK and event bus on window.stBgLoader, gesture-driven smooth unmute ramp for browser autoplay compliance, and smart mini player capsule auto-visibility. Passed all 13 automated E2E tests.

### Main Changes

- Created PublicAPI facade with setBackground, playBGM, stopBGM, setFilters, applyPreset, setInteractive, and event bus
- Exported window.stBgLoader global object for character cards and external scripts
- Added gesture-driven smooth audio unmute (fadeInVolume) avoiding browser autoplay blocks
- Added smart capsule auto-visibility on playback in MiniPlayer and SettingsDrawer

### Git Commits

| Hash | Message |
|------|---------|
| `7f44d24` | feat: implement public infrastructure API, interaction-driven smooth unmute, and smart capsule lifecycle |

### Testing

- [OK] All 13 automated E2E tests passed against live SillyTavern instance via Puppeteer

### Status

[OK] **Completed**

### Next Steps

- Provide developer guide and character card integration examples in README


## Session 4: Phase 4: Streaming Preload Engine for Zero-Latency Asset Caching
<!-- trellis-session: v=2 fp=c1d52f8836ddd0c4 -->

**Date**: 2026-09-05
**Task**: Phase 4: Streaming Preload Engine for Zero-Latency Asset Caching
**Branch**: `master`

### Summary

Implemented preloadMedia in PublicAPI and CacheManager for streaming background preloading of remote media assets into CacheStorage, ensuring instantaneous zero-lag scene transitions for character cards and scripts. Passed all 14 automated E2E tests.

### Main Changes

- Implemented preloadUrl in CacheManager with idempotent CacheStorage caching and IDB cataloging
- Added preloadMedia with concurrency control and progress callbacks to window.stBgLoader
- Updated README.md with comprehensive preloadMedia developer guide

### Git Commits

| Hash | Message |
|------|---------|
| `e07c0b9` | feat: implement streaming preloadMedia API and idempotent CacheStorage warming |

### Testing

- [OK] All 14 automated E2E tests passed against live SillyTavern instance via Puppeteer

### Status

[OK] **Completed**

### Next Steps

- Final review and project wrap-up


## Session 5: Phase 5: Large File (105MB) Streaming & Resilience Stress Testing
<!-- trellis-session: v=2 fp=2d7c136d7d9aac03 -->

**Date**: 2026-09-05
**Task**: Phase 5: Large File (105MB) Streaming & Resilience Stress Testing
**Branch**: `master`

### Summary

Conducted large file streaming and edge case resilience stress testing against live SillyTavern. 105MB binary media stream stored in 275ms and mounted in 25ms. Rapid 10x/sec cross-media switching cleanly cancelled with zero zombie elements. Corrupted blobs and 404 URLs gracefully handled. Verified zero Blob URL leaks.

### Main Changes

- Hardened MediaMount with crossfadeTimer reentrancy cancellation for rapid switching
- Implemented comprehensive tests/stress.mjs covering 105MB binary stream, rapid switching, corrupted media, and Blob URL revocation

### Git Commits

| Hash | Message |
|------|---------|
| `4ed4712` | test: implement 105MB large stream and resilience stress suite, passing all tests |

### Testing

- [OK] All 4 extreme stress tests and all 14 baseline E2E tests passed 100% against live instance

### Status

[OK] **Completed**

### Next Steps

- Keep git repository clean and report completion to user


## Session 6: Full-Power Modular Expansion and Project Wiki
<!-- trellis-session: v=2 fp=74b8d8f7a75a20bc -->

**Date**: 2026-09-06
**Task**: Full-Power Modular Expansion and Project Wiki
**Branch**: `master`

### Summary

Completed atmospheric weather FX, audio visualizer, 2.5D parallax, scene transitions, Lo-Fi room acoustic filter, smart scene triggers, and complete 9-part project wiki with 20/20 passing E2E tests

### Git Commits

(No commits - planning session)

### Status

[OK] **Completed**


## Session 7: Add Ambient Sound, Frosted Glass, Scenes and Shortcuts
<!-- trellis-session: v=2 fp=2dad727ea5ea3bd3 -->

**Date**: 2026-09-06
**Task**: Add Ambient Sound, Frosted Glass, Scenes and Shortcuts
**Branch**: `master`

### Summary

Added procedural WebAudio ambient soundscape synthesizer, frosted glass transparent chat UI, scene snapshot bookmarks, visual novel shortcuts, and 24 passing E2E tests

### Git Commits

(No commits - planning session)

### Status

[OK] **Completed**


## Session 8: Authority 后端能力集成研究（可行性 + PRD）
<!-- trellis-session: v=2 fp=authority-research-20260913 -->

**Date**: 2026-09-13
**Task**: 09-13-authority-integration
**Branch**: `master`

### Summary

深度研究 Youzini-afk/ST-Delegation-of-authority（服务端能力与权限治理插件）：通过 GitHub API + 官方 example-extension 源码与 docs/server 文档，确认第三方前端扩展接入面（AuthoritySDK.init + declaredPermissions + storage.kv/blob + http.fetch + jobs + events.subscribe + agent.browser）。结论：可以结合，且互补性强——ST-BgLoader 纯前端的存储墙（浏览器配额/单浏览器/无 CORS/无 Agent 通道）恰好被 Authority 的 blob/kv/sse/http.fetch/agent.browser 补齐。已产出 PRD，列出 8 项纯前端做不到的能力与 P0-P2 分期路线（云媒体库 L1/L2 分层缓存 → 设置与场景云同步 → 定时氛围任务 + Agent 氛围工具），全程无 Authority 时优雅降级。

### Research Artifacts

- .trellis/tasks/09-13-authority-integration/prd.md（需求 + 验收标准 + 非目标）
- .trellis/tasks/09-13-authority-integration/research/（authority-capabilities.md、authority-agent-platform.md、authority-example-index.ts、authority-ai-integration.md）

### Status

[OK] PRD 完成，待用户确认实施范围后进入 design.md / 实现阶段

## Session 9: 存储倒置重构实现（Authority 为媒体库源端）
<!-- trellis-session: v=2 fp=authority-refactor-impl-20260913 -->

**Date**: 2026-09-13
**Task**: 09-13-authority-integration
**Branch**: `master`

### Summary

用户确认：媒体本就应以后端存储为源端，浏览器优先架构是错的 → 执行存储倒置重构。新增 `src/backend/`：MediaOrigin 源端抽象、LocalOrigin（原 CacheStorage+IndexedDB 逻辑下沉）、AuthorityBridge（SDK 检测/init/能力位/一次性降级提示）、AuthorityOrigin（storage.blob 二进制源端 + sql.private 目录源端，migrate 建表、大文件走 SDK 分块传输）、SettingsSync（KV 镜像 revision+fingerprint 防回环 + 轮询收敛）、RemoteImporter（CORS 失败回退 http.fetch + hostname 增量声明）、LocalToCloudMigrator（一次性幂等迁移，保留 id 使场景/聊天绑定不断）。CacheManager 重构为库门面：公共 API 零改动，云模式写穿源端→回填 L1 热缓存、L1 未命中自动拉取、LRU 仅逐 L1 源端永不驱逐；顺带修复 URL 占位条目命中空缓存的隐患。index.ts 接线迁移与设置同步；SettingsDrawer.applyRemoteSettings / SceneManager.setUserScenes 支持远端应用。tsc + vite build 全绿（146.5KB）。

### Verification

- [OK] `npm run type-check` 通过
- [OK] `npm run build` 通过
- [PENDING] 24 项 E2E 回归：需测试实例运行后 `npm run test:e2e`（实例环境由用户启动，遵守实例隔离规范）

### Status

[OK] 实现完成已推送，E2E 回归待测试实例可用后执行

## Session 10: E2E 零回归验证 + 云路径场景 + Phase F/G 收尾
<!-- trellis-session: v=2 fp=authority-e2e-phasefg-20260913 -->

**Date**: 2026-09-13
**Task**: 09-13-authority-integration
**Branch**: `master`

### Summary

启动 Dev/Luker 测试实例（HTTPS:8003，junction 指向本仓库）完成验证。首轮 E2E 第 7 项失败，通过三发 Puppeteer 探针定位根因：AudioVisualizer.setOptions('off') 无条件清空容器 style.filter —— 既有潜伏 bug（visualizer 从未写过 filter，pulse 只写 transform），被新增的 applySettingsToSubsystems（远端同步需要调 setOptions）暴露为回归。修复：删除越权清空。随后 24/24 E2E 全绿。新增 tests/authority.mjs：注入 mock AuthoritySDK（页面级 Map + 迷你 SQL 引擎）验证存储倒置全语义，11/11 通过 —— 降级本地模式、桥接激活云源端、本地→云迁移保留 id、写穿源端、L1 回填、清缓存后回拉、LRU 仅逐 L1、设置推送镜像、远端变更收敛、activeMediaId 存活、云端面板渲染；第二轮隐式验证迁移幂等。Phase F：AgentBridge 经 agent.browser 注册 6 个低风险氛围工具（背景/场景/天气/BGM/预设/滤镜），claim 循环 + 幂等 submitResult，设置项 agentToolsEnabled 默认关闭。Phase G：SettingsDrawer 新增「云端存储」状态面板与 Agent 开关。tsc + build 全绿（155.2KB）。

### Verification

- [OK] `npm run type-check` + `npm run build` 通过
- [OK] `npm run test:e2e` 24/24（HTTPS 测试实例 https://127.0.0.1:8003）
- [OK] `node tests/authority.mjs` 11/11 云路径场景
- 备注：实例未安装 Authority 服务端（写入实例目录违反隔离规范），云路径经 mock SDK 验证；真 Authority 就位后同一套断言自动切换真后端

### Status

[OK] 全部完成，提交推送并归档任务

## Session 11: 架构纠偏 —— 服务端原生存储为源，浏览器纯缓存，Authority 仅增强
<!-- trellis-session: v=2 fp=server-native-storage-20260913 -->

**Date**: 2026-09-13
**Task**: 09-13-server-native-storage
**Branch**: `master`

### Summary

用户纠正架构方向：媒体从设计上就该存酒馆服务端原生目录（与原生背景同一逻辑同一位置），不连 Authority 也必须如此；浏览器存储只配当缓存且可管理；Authority 只是增强层（做前端做不到的事）。实测 Dev/Luker 原生端点验证可行性：POST /api/backgrounds/upload（字段 avatar）无 MIME 限制、静态路由 /backgrounds/<file> 带 Range 流式、delete 端点任意文件可删、/all 仅列图片 → 非图片用同目录清单 st-bg-loader-manifest.json 编目（原生列表忽略它）。实现：ServerOrigin（唯一源端：原生上传/删除 + 清单编目 + 目录合并，id 客户端生成保引用）、CacheManager v2（CacheStorage+IDB 索引纯缓存：回填/命中加速/LRU 仅逐缓存/clearAll 仅清缓存/用量即缓存统计；未命中直接走服务端相对 URL 流式）、LegacyBrowserStore（旧库只读）+ LegacyMigration（一次性上载，id 保留，localStorage 旗标）、删除 AuthorityOrigin 与旧云迁移、AuthorityBridge 能力位改为 sync/serverFetch/agentTools、RemoteImporter 保留为 CORS 回退、面板改「存储与 Authority 增强」、URL 导入条目 url 保持远程地址（兼容 setBackground 匹配与旧语义）。测试：tests/authority.mjs 重写为服务端源端场景 16/16（落盘+Range、清单跨页可见、稳定 id、缓存清理不伤源端、显式删除 404、URL 导入去重、迁移保 id、Authority 同步+Agent 注册、无 Authority 媒体全功能）；24 项 E2E 零回归。

### Verification

- [OK] `npm run type-check` + `npm run build`（155.3KB）
- [OK] `npm run test:e2e` 24/24
- [OK] `node tests/authority.mjs` 16/16（真实原生端点 + Authority mock）

### Status

[OK] 完成，提交推送并归档

## Session 12: 自动化迭代测试改进 —— 修复挂载链无界等待（stress T3 挂死）
<!-- trellis-session: v=2 fp=bounded-wait-hardening-20260919 -->

**Date**: 2026-09-19
**Task**: 无活跃任务（/goal 驱动的迭代测试改进循环）
**Branch**: `master`

### Summary

启动 Dev/Luker 测试实例（HTTPS:8003，junction 指向本仓库）建立全量基线：E2E 24/24 绿、authority 场景 15/15 绿、stress 套件测试 3（Malformed & 0-byte Media Resilience）页面求值 180s 协议超时挂死（09-05 旧架构曾全绿，存储倒置重构后未复跑暴露）。四发 Puppeteer 探针逐级收敛（隔离步骤→上下文复刻→精确复现→逐类型定位）：确认 IframeRenderer.render 只等 iframe.onload、无任何错误/超时兜底——快速连续切换中 iframe 在 load 前被 destroy 则 promise 永久悬置（Image/Video 均有 onerror 兜底，唯 iframe 缺失）；且全部渲染器事件等待与 AudioEngine.play()、外部 URL 下载均为无界等待，慢/黑洞主机可挂起数分钟。修复（有界等待加固）：Iframe/Video/Image 三个渲染器统一 settle 模式（事件 + destroy 即时结算 + 超时兜底 8s/15s/15s，destroy 触发 pendingSettle 消除快速切换僵尸 promise）；AudioEngine 两处 play() 10s 竞速兜底（带 catch 防迟到拒绝）；ServerOrigin.download 对跨源 URL 加 AbortSignal.timeout(60s)，同源 backgrounds/ 路由不受影响。挂死运行泄漏的 corrupted_zero_byte.mp4 经插件 API 清除，探针脚本用后即删。

### Verification

- [OK] `npm run type-check` + `npm run build`（152.96KB）
- [OK] `node tests/stress.mjs` 4/4 ×3 连续轮次（修复前测试 3 挂死）
- [OK] `npm run test:e2e` 24/24 零回归
- [OK] `node tests/authority.mjs` 15/15 零回归

### Status

[OK] 修复完成已推送；后续方向（规范引导任务/测试自动化基建）待用户选择

## Session 13: bootstrap-guidelines 规范填充（backend + frontend 全部 11 篇）
<!-- trellis-session: v=2 fp=spec-bootstrap-fill-20260919 -->

**Date**: 2026-09-19
**Task**: 00-bootstrap-guidelines
**Branch**: `master`

### Summary

基于真实代码填充 `.trellis/spec/` 全部待填文件（backend 5 + frontend 6，索引状态更新，PRD 勾选完成）。关键定调：本项目无框架无 ORM，"backend" 层 = `src/backend/` 服务端集成 + 三层持久化（服务器 backgrounds/ 目录与清单 JSON 为唯一源端、浏览器 CacheStorage+IDB 纯缓存、localStorage 设置）；"frontend" 层 = 子系统类约定（构造注入、destroy 契约、A/B 双缓冲）、设置扇出 + 事件总线（代替 hooks）、严格 TS + 中央类型模块 + 受限 as any 边界。本日 Session 12 的有界等待教训已写入 error-handling/component 规范（渲染 promise 必须无条件 settle）。

### Verification

- [OK] 11 篇规范全部基于真实路径与实测数据（日志级别分布、cast 计数、测试门禁）
- [OK] spec 为文档变更，无代码影响；索引状态列与 PRD 勾选同步更新

### Status

[OK] 完成并推送；bootstrap 任务三项验收全部达成

## Session 14: 设置全存后端（server-native settings persistence）
<!-- trellis-session: v=2 fp=server-settings-persistence-20260919 -->

**Date**: 2026-09-19
**Task**: 09-19-server-settings-persistence
**Branch**: `master`

### Summary

持久化审计发现最后一块浏览器本地状态：设置对象（场景/聊天绑定/触发规则/预设/全部偏好）此前只存 localStorage，Authority 缺失时清浏览器缓存即全部丢失。补齐"全存后端"：新增 `src/backend/ServerSettings.ts`，完整设置文档（version/revision/updatedTimestamp/settings）落盘服务器 `backgrounds/st-bg-loader-settings.json`，复用原生 upload 端点（ServerOrigin 抽出通用 `readServerJson`/`writeServerJson` + 独立 `serverCsrfHeaders`）；localStorage 降级为快缓存。写入路径：saveSettings 即时本地 + 800ms 尾沿去抖、单飞串行、最新载荷胜出（activeMediaId 每次切背景都变，不刷服务器）；init 时 `reconcileSettings` 按 revision 收敛（高者胜、平局服务器胜），本地有而服务器无时自动上传（存量用户首跑迁移）。Authority SettingsSync 镜像不受影响。测试：authority 套件新增 S7.1 本地→服务器迁移（删服务器文档+预置 localStorage rev50）、S7.2 实时写往返、S7.3 清空 localStorage 后全新页面从服务器恢复，18/18×2（重跑验证幂等）；E2E 24/24、stress 4/4×2（异步时序有改动）、tsc+build 绿（156.30KB）。套件清理恢复原设置，服务器文档保留为正式持久副本。

### Verification

- [OK] `npm run type-check` + `npm run build`（156.30KB）
- [OK] `node tests/authority.mjs` 18/18 ×2（新增 S7.1-S7.3）
- [OK] `npm run test:e2e` 24/24 零回归
- [OK] `node tests/stress.mjs` 4/4 ×2 零回归

### Status

[OK] 完成，提交推送并归档




## Session 15: 全仓全面体检：27 文件审查 + 14 项 P1/P2 修复 + UI 优化
<!-- trellis-session: v=2 fp=30cfe5940b480a5d -->

**Date**: 2026-09-25
**Task**: 全仓全面体检：27 文件审查 + 14 项 P1/P2 修复 + UI 优化
**Branch**: `master`

### Summary

全仓体检任务收口：27 个源文件（约 6800 行）逐文件精读 + 机械扫描三通道，产出分级清单 5 P1 / 9 P2 / 14 P3（findings.md 带行号证据与修复回填）。P1/P2 全部当场修复：mountMedia promise 链串行化、ShortcutManager 懒创建消孤儿 window 监听、loop 模式单曲续播、环境音 AudioContext 交互唤醒、innerHTML 注入全量转义（新增 core/sanitize.ts）、滑块设置写去抖、sanitizeFilename Unicode 保留中文名、硬编码色主题化（var + color-mix 双声明回退）、setWeather 运行时白名单、媒体类型检测五合一（新增 core/mediaType.ts）、触发规则三连 prompt 改内联表单、导入 busy 态 + toastr 错误反馈、MediaMount onHostReady 回调（#bg1 延迟出现也可挂载 FX）、视差 enable 防重入。教训沉淀三篇 spec（error-handling / component / quality-guidelines）。回归零失败：tsc ✓、build 165.39KB、e2e 24/24、stress 4/4×2、authority 18/18 真后端、CSS 裸选择器门禁 0；Dev 冒烟六项过（挂载幂等/表单/转义/校验/busy/零插件报错——页面 3 条错误定性为宿主其他扩展噪音）。子代理交叉复核因供应商不可用降级为主脑二次核验（F1/F5 两处修正）。P3 清单含方案与成本待用户决策。

### Git Commits

| Hash | Message |
|------|---------|
| `a0f99d3` | fix: 全仓体检 P1/P2 修复（竞态/泄漏/注入/音频续播）+ UI 体验优化 |

### Status

[OK] **Completed**
