# Implementation Plan: Filter Presets, Audio Playlist & Interactive Sandbox

## Phase 1: Data Types & Built-in Presets
- [x] 在 `src/types/index.ts` 扩展 `PlaybackMode`, `FilterPreset`, `BUILTIN_PRESETS`, 及 `BgLoaderSettings`。

## Phase 2: Preset Manager & Persistence
- [x] 实现预设管理逻辑，支持内置预设读取与用户自定义预设保存/删除。
- [x] 在 `ui/SettingsDrawer.ts` 中添加预设下拉框 (Select) 与“保存当前预设”交互。

## Phase 3: Enhanced Playlist & Audio Queue
- [x] 在 `src/audio/AudioEngine.ts` 扩充播放列表支持：
  - 模式切换 (`loop`, `single`, `shuffle`)。
  - `onTrackEnded` 自动流转。
  - 上一首 / 下一首调度。

## Phase 4: Floating Mini Player Capsule
- [x] 创建 `src/ui/MiniPlayer.ts` 浮动微胶囊组件：
  - 上一曲/播放/暂停/下一曲图标按钮。
  - 当前曲目名称跑马灯显示。
  - 折叠与展开。
- [x] 补充 `.st-bg-mini-player` 样式规则。

## Phase 5: Sandbox Interactive Mode
- [x] 在 `src/core/MediaMount.ts` 与 `src/renderers/IframeRenderer.ts` 增加 `setInteractive(enabled: boolean)` 方法。
- [x] 在 `SettingsDrawer.ts` 增加“允许背景鼠标交互”开关。

## Phase 6: Build & Automated E2E Verification
- [x] 执行 `npm run build` 生成新版生产 Bundle。
- [x] 在 `tests/e2e.mjs` 中添加针对滤镜预设、播放列表与交互穿透的测试用例并执行全绿验证。
