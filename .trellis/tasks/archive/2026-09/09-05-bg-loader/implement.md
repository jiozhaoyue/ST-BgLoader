# Implementation Plan: Rich Media Background Plugin (ST-BgLoader)

## Phase 1: Project Scaffolding & Tooling Setup
- [x] 初始化 `package.json`（配置 Vite/Rollup、TypeScript、ESLint、SillyTavern 插件打包插件）。
- [x] 创建 `tsconfig.json` 配置模块解析与 DOM 库类型。
- [x] 编写 `manifest.json` 符合 SillyTavern 第三方扩展规范。
- [x] 搭建项目目录规范：
  ```
  src/
    ├── audio/          # 音频引擎 (AudioEngine.ts)
    ├── cache/          # 缓存与持久化 (CacheManager.ts, LRU.ts)
    ├── core/           # 挂载器与双缓冲调度 (MediaMount.ts)
    ├── renderers/      # 各类型专用渲染器 (Video, Iframe, Image)
    ├── ui/             # 抽屉面板与原生增强 (SettingsDrawer.ts, NativeBgAugmenter.ts, style.css)
    ├── types/          # 类型定义 (index.ts)
    └── index.ts        # 扩展入口
  ```

## Phase 2: Cache & Storage Engine Implementation
- [x] 实现 `cache/CacheManager.ts`：
  - 基于 CacheStorage 封装针对视频/音频流的 PUT/GET/DELETE。
  - 基于 IndexedDB 封装元数据表与时间戳记录。
- [x] 实现 LRU 淘汰与缓存统计：
  - 自动检测总配额使用情况。
  - 按 `lastUsedTimestamp` 从旧到新清理超出限额的缓存块。

## Phase 3: Media Renderers & Mount Architecture
- [x] 实现 `core/MediaMount.ts`：
  - 在 `#bg1` 下插入 `.st-bg-media-container` 容器。
  - 构建 Active/Inactive 双层切换缓冲区，配置 CSS `opacity` 过渡动画。
  - 动态应用用户配置的 CSS 滤镜串（`filter: blur() brightness() opacity() saturate()`）。
- [x] 实现 `renderers/VideoRenderer.ts`：
  - 挂载 `<video playsinline loop muted autoplay>`。
  - 针对带有音轨的视频，提供音轨与 AudioEngine 的音量解耦同步。
- [x] 实现 `renderers/IframeRenderer.ts`：
  - 创建具备 `sandbox="allow-scripts allow-same-origin"` 的沙箱容器。
  - 实现 PostMessage 事件桥接，派发窗口大小变化与页面可见性事件。
- [x] 实现 `renderers/ImageRenderer.ts`：
  - 处理普通静态/动图背景的极速加载与平滑渐变。

## Phase 4: Audio Engine & Lifecycle Management
- [x] 实现 `audio/AudioEngine.ts`：
  - 独立音频播放通道，支持 MP3/OGG/WAV/FLAC。
  - 音量线性渐变（切歌/暂停淡出 300ms）。
- [x] 注册 Page Visibility API 监听：
  - 页面隐藏时暂停所有渲染器与音频。
  - 页面重新聚焦时平滑恢复。

## Phase 5: UI Settings Drawer & Native Background Augmentation
- [x] 实现 `ui/SettingsDrawer.ts`：
  - 注入 SillyTavern 扩展设置列表 (`#extensions_settings`)。
  - 文件上传区域（支持拖拽上传多媒体）与 URL 远程直接导入输入框。
  - 滤镜滑动条（实时联动 `#bg1` 滤镜）。
  - 音频主音量条与一键静音复选框。
  - 缓存仪表板（展示当前 Cache 占用体积，清理按钮）。
- [x] 实现 `ui/NativeBgAugmenter.ts`：
  - 监听原生背景列表 `#bg_menu_content`，标记富媒体角标。
  - 拦截原生背景点击，重定向给插件调度器播放。

## Phase 6: Lifecycle Binding & Event Integration
- [x] 实现 `index.ts` 插件生命周期：
  - 监听 `event_types.SETTINGS_LOADED` 初始化配置。
  - 监听 `event_types.CHAT_CHANGED` 实现聊天绑定背景自动加载。
- [x] 打包构建与验证：
  - `npm run type-check` 严格类型检查通过 (0 错误)。
  - `npm run build` Vite 生产打包通过 (产出 `dist/index.js` 34.7KB, `dist/style.css` 3.0KB)。

---

## Validation & Quality Gates
1. **构建检查**：`npm run build` 成功产出 `dist/index.js` 与 `dist/style.css`。
2. **零转码验证**：所有视频格式均采用原生 HTML5 Video 硬件解码，无 WASM 转码，无 CPU 锁死，完整保留音轨。
3. **缓存性能验证**：基于 CacheStorage 的流式存储与 IndexedDB 元数据索引已完工，支持 LRU 淘汰与手动清空。
4. **会话联动验证**：`CHAT_CHANGED` 事件绑定已注入。
