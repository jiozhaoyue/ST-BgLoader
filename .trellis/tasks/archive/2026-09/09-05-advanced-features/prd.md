# Filter Presets and Audio Playlist (ST-BgLoader Phase 2)

## Goal

在 ST-BgLoader 基础架构之上，拓展高级实用功能：内置与自定义视觉滤镜预设库（下拉框快捷选用 + 个人保存）、多模式轮播 BGM 播放列表（抽屉内嵌管理 + 屏幕边缘迷你悬浮控制条），以及 HTML/WebGL 沙箱背景的交互穿透模式切换。

---

## Confirmed Technical Decisions (User Approved)

1. **视觉滤镜预设交互形态**：
   - 采用**紧凑下拉选择框 (Select)** 展示内置主流风格预设（Cyberpunk、Vintage、Cinema Dark、Dreamy Bloom、Monochrome、Default）。
   - 随选随生效，自动联动下方具体滑块数值。
   - 提供“保存当前为自定义预设”与“删除”按钮，持久化于 localStorage。
2. **BGM 播放列表与控制器布局**：
   - **双模态控制器**：在扩展设置抽屉中提供完整的曲目列表勾选、模式切换（顺序循环 / 单曲循环 / 随机播放）；在聊天界面右下角或顶部提供可选的**迷你常驻悬浮微胶囊 (Mini Player Capsule)**，显示当前曲目名、切歌与播放/暂停，支持一键隐藏。
3. **HTML/SVG 沙箱交互穿透策略**：
   - **默认状态为完全点击穿透 (`pointer-events: none`)**，确保聊天界面打字、点选消息菜单、切换气泡不受任何阻碍。
   - 提供“允许背景鼠标交互”开关：开启时切换为 `pointer-events: auto`，适用于 3D 鼠标跟踪或交互式小游戏类背景。

---

## Requirements

### 1. 滤镜预设库 (Filter Preset Manager)
- 内置预设集：
  - `Default (原色)`: blur: 0, brightness: 100%, opacity: 100%, saturate: 100%
  - `Cinema Dark (影院暗黑)`: blur: 3px, brightness: 75%, opacity: 90%, saturate: 95%
  - `Cyberpunk (赛博朋克)`: blur: 0px, brightness: 110%, opacity: 100%, saturate: 150%
  - `Vintage Sepia (复古暖调)`: blur: 1px, brightness: 90%, opacity: 90%, saturate: 70%
  - `Dreamy Bloom (梦幻柔光)`: blur: 6px, brightness: 125%, opacity: 95%, saturate: 115%
  - `Monochrome (黑白极简)`: blur: 0px, brightness: 100%, opacity: 100%, saturate: 0%
- 自定义预设管理：输入名称保存、覆盖已有、删除。

### 2. 增强型音频引擎与播放列表 (Playlist & Mini Floating Bar)
- `AudioEngine` 升级支持播放列表模型：
  - `playlist: MediaItem[]`
  - `playbackMode: 'loop' | 'single' | 'shuffle'`
  - `currentIndex: number`
  - 监听 `ended` 事件自动流转下一曲。
- 迷你悬浮控制条 (Mini Player Capsule)：
  - 支持拖拽/固定位置。
  - 包含：上一曲、播放/暂停、下一曲、当前曲名跑马灯、折叠/展开。

### 3. 沙箱交互模式与事件穿透 (Sandbox Interaction Mode)
- 在设置面板提供 `允许背景鼠标交互 (Interactive Background)` 开关。
- 动态切换 `.st-bg-media-container` 与 `iframe.st-bg-iframe-element` 的 `pointer-events`。

---

## Acceptance Criteria
- [x] 切换预设下拉框时，四项滤镜参数立即无缝应用至当前背景，并同步更新滑块位置。
- [x] 用户可将个性化滤镜保存为新预设，页面刷新后依然保存在下拉列表中。
- [x] 播放列表模式下，当前音频播放完毕后能根据播放模式自动播放下一首。
- [x] 迷你浮动条能正确控制切歌、暂停、并展示当前曲目。
- [x] 交互穿透开关能无刷新切换 iframe 的鼠标响应行为。
