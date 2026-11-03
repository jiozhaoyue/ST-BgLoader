# PRD: Infrastructure Public API & Autoplay Unmute Engine (Phase 3)

## 1. Goal

将 ST-BgLoader 定位升级为 SillyTavern 生态的“富媒体基建引擎 (Media Infrastructure Engine)”。
对外暴露强大、完备、符合人体工程学的 JavaScript SDK / Public API 与事件总线，使得角色卡 (Character Cards)、快速回复 (Quick Replies)、世界书条目 (World Info)、脚本与第三方扩展能够轻松通过代码动态调控背景、BGM、滤镜与沙箱交互。
同时完善浏览器静音就绪策略（交互自动渐入音量）以及悬浮音乐胶囊的智能生命周期（仅播放时自动唤起）。

---

## 2. Technical Decisions

1. **公开 API 接口规范与全局暴露**：
   - 在全局挂载 `window.STBgLoader` 及简写门面 `window.stBgLoader`。
   - 提供丰富的高阶控制函数：
     - `setBackground(url, options)`: 切换背景（支持视频、HTML/Canvas、SVG、图像）。
     - `playBGM(url, options)`: 播放背景音乐或音效，支持音量控制与渐入。
     - `stopBGM(fadeMs)`: 平滑渐出停止背景音乐。
     - `setFilters(filters)`: 动态微调或渐变模糊度、亮度、不透明度与饱和度。
     - `applyPreset(presetName)`: 快速切换内置（Cyberpunk、Cinema Dark 等）或自定义滤镜风格。
     - `setInteractive(enabled)`: 动态开启或关闭 3D/HTML5 背景的鼠标交互穿透。
     - `on(event, handler)` / `off(event, handler)`: 事件订阅总线，方便角色卡或外部扩展监听媒体生命周期。
2. **静音就绪与平滑渐入 (Autoplay Unmute Strategy)**：
   - 首屏或无交互状态加载时，严格执行静音策略（`muted = true`），确保绕过 Chromium/WebKit 的 Autoplay 限制正常起播。
   - 注册全局单次手势监听（`pointerdown`, `keydown`, `touchstart`）。一旦捕获到用户在页面上的任何有效交互，即刻启动 400ms 音量渐入动画，将声音平滑恢复至设定值。
3. **音乐微胶囊智能唤起 (Smart Capsule Lifecycle)**：
   - 监听音频播放状态：当音频起播时，微胶囊自动平滑浮现；音频停止/清空时，自动淡出隐藏。

---

## 3. Requirements

### 3.1 Public API & Event Bus
- 封装 `src/api/PublicAPI.ts` 门面类，挂载到 `STBgLoader.api` 及 `window.stBgLoader`。
- API 方法涵盖：
  - `setBackground(url: string, options?: BackgroundOptions): Promise<void>`
  - `playBGM(url: string, options?: AudioOptions): Promise<void>`
  - `stopBGM(fadeMs?: number): void`
  - `setFilters(filters: Partial<VisualFilters>): void`
  - `applyPreset(name: string): void`
  - `setInteractive(enabled: boolean): void`
  - `getMediaList(): Promise<MediaItem[]>`
  - `getPlaybackState(): PlaybackState`
  - `on(event: string, fn: Function): void`
  - `off(event: string, fn: Function): void`

### 3.2 Interaction-Driven Smooth Unmute
- 在 `AudioEngine` 中实现 `setupInteractionUnmute()`：
  - 自动检测是否处于被浏览器拦截或初始静音就绪状态。
  - 在首次交互发生后无爆音、无杂音平滑淡入（Linear Gain Ramp）。

### 3.3 Dynamic Mini Player Auto-Visibility
- 在 `MiniPlayer` 中增加 `autoShowOnPlay: boolean` 配置。
- 当 `onPlayStateChange(true)` 且处于自动模式时，若隐藏则自动展示；在 `onPlayStateChange(false)` 时，延迟平滑收起。

---

## 4. Acceptance Criteria
- [x] 外部代码通过调用 `stBgLoader.setBackground(...)` 能成功切换背景。
- [x] 外部代码通过调用 `stBgLoader.playBGM(...)` 能成功播放音频，且浮动微胶囊自动唤起。
- [x] 外部代码通过调用 `stBgLoader.applyPreset('cyberpunk')` 能即时变换背景滤镜。
- [x] 首屏自动播放时静音，发生用户交互（按键或点击）后音频平滑渐入。
- [x] 音频停止播放后，微胶囊按策略优雅隐藏。
- [x] 编写并执行全量自动化 E2E 测试，验证公共 API 与事件监听工作正常。
