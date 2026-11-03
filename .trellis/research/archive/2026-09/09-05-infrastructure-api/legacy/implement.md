# Implementation Plan: Infrastructure Public API & Autoplay Unmute Engine

## Phase 1: Public API & Event Bus
- [x] 创建 `src/api/PublicAPI.ts` 门面类，实现事件发布订阅、背景控制、音频调度、滤镜调节与预设切换。
- [x] 在 `src/index.ts` 中初始化 `PublicAPI`，并挂载至 `window.STBgLoader.api` 与 `window.stBgLoader`。

## Phase 2: Autoplay Mute & Interaction Smooth Unmute
- [x] 在 `src/audio/AudioEngine.ts` 增加 `setupInteractionUnmute()` 与 `fadeInVolume(target, durationMs)`。
- [x] 首屏自动播放时保持静音，在用户首次点击或按键时无杂音平滑淡入音量。

## Phase 3: Smart Mini Player Lifecycle
- [x] 修改 `src/ui/MiniPlayer.ts`，增加智能唤起模式（仅在音频播放中自动弹出，音频停止时淡出）。
- [x] 在 `SettingsDrawer.ts` 提供“播放时自动唤起微胶囊”配置项。

## Phase 4: Build & Automated E2E Verification
- [x] 执行 `npm run build` 生成最新 Bundle。
- [x] 在 `tests/e2e.mjs` 添加针对 `window.stBgLoader` API、事件监听、交互淡入和微胶囊自动唤起的自动化端到端测试。
