# PRD: Full-Power Modular Expansion (Phase 6)

## 1. Goal

将 ST-BgLoader 打造为 SillyTavern 生态功能最强、体验最极致、完全模块化解耦的终极富媒体与音画基建。
在现有零转码硬件直解、流式缓存、独立音频引擎、智能微胶囊与公共 SDK 的稳固基础之上，增加：
1. **WebAudio 音频响应与频谱律动层 (Audio Reactive Visualizer)**
2. **前景大气微粒与天气覆盖引擎 (Atmospheric Weather & Particle Engine: 雨/雪/落樱/霓虹微粒/CRT扫描线)**
3. **2.5D 视差与鼠标动态陀螺仪效果 (2.5D Parallax Controller)**
4. **角色/群组与消息关键词智能场景切换引擎 (Smart Matching & Trigger Engine)**
5. **多模态电影级转场过渡引擎 (Cinematic Transition Engine: Fade / Zoom-Fade / Blur-Fade / Slide)**
6. **沉浸式 Lo-Fi 隔门弱化声学滤镜 (Acoustic Low-Pass Muffle Filter)**
7. **配置全量导入/导出与跨端备份 (Config Export / Import Backup)**
8. **专业级工程 Wiki 与全量多模块文档 (Comprehensive Project Wiki)**

所有新增功能均遵循**完全解耦、即插即用、开箱即用、零开销挂起 (Zero-overhead when disabled)** 原则，绝不侵入影响基础音视频播放功能。

---

## 2. Requirements & Feature Specifications

### 2.1 WebAudio 音频响应与可视化 (`src/visualizer/AudioVisualizer.ts`)
- 挂接至 `AudioEngine` 的 `AudioContext` 与 `AnalyserNode`。
- 模式：
  - `pulse`：背景画面伴随音频重低音呼吸微动。
  - `spectrum`：屏幕底部或胶囊内优雅呈现霓虹频段波形。
  - `off`：完全释放 RAF 与音频分析，零 CPU 占用。

### 2.2 前景大气粒子与天气系统 (`src/fx/AtmosphereFX.ts`)
- 独立 `<canvas class="st-bg-fx-canvas">` 置于 `#bg1` 顶层（`z-index: 1`, `pointer-events: none`）。
- 6 种高表现力天气粒子模拟：
  - `rain`：倾斜雨丝 + 地面水花涟漪。
  - `snow`：随风飘落旋转的六角雪花。
  - `sakura`：3D 投影翻滚旋转的粉色落樱花瓣。
  - `cyber_motes`：赛博朋克发光浮游微粒与光斑。
  - `scanlines`：复古 CRT 扫描线与微弱色散。
  - `off`：停止渲染循环并清空画布。
- 支持调节风速、密度与透明度。

### 2.3 2.5D 鼠标视差控制器 (`src/core/ParallaxController.ts`)
- 监听鼠标在窗口内的移动，以阻尼弹簧算法平滑推移 `.st-bg-media-container`。
- 移出窗口或禁用时平滑回正。

### 2.4 角色/群组与正则智能触发引擎 (`src/triggers/TriggerManager.ts`)
- 监听 SillyTavern 消息更新与角色切换。
- 支持配置触发规则：根据角色名、聊天会话或消息文本包含的关键词（如“雨夜”、“酒馆”、“战斗”），全自动联动背景、BGM、天气与预设。

### 2.5 电影级转场动画 (`src/core/MediaMount.ts`)
- 支持 `fade`、`zoom_fade`、`blur_fade`、`slide_left`、`slide_right`。
- 可在设置抽屉与 Public API 中灵活定制转场时长与类型。

### 2.6 Lo-Fi 隔门声学滤镜 (`src/audio/AudioEngine.ts`)
- 基于 WebAudio `BiquadFilterNode` 实现 800Hz 低通滤波。
- 提供“打开抽屉/弹窗时自动弱化沉浸感 (Muffle BGM)”开关。

### 2.7 配置全量备份导入与导出
- 支持一键导出所有设置、滤镜预设、触发规则为 JSON。
- 支持导入并实时校验应用。

### 2.8 项目工程 Wiki (`wiki/`)
- 按照顶级开源项目标准构建全套 Markdown Wiki 文档，包含架构、SDK、粒子特效、触发器、调优、FAQ 等全景指南。

---

## 3. Acceptance Criteria
- [ ] 所有新增模块严格解耦，禁用时 CPU 占用保持为 0%。
- [ ] 天气粒子系统无撕裂平滑渲染，支持快速无刷新切换。
- [ ] 智能触发引擎可在角色切换或匹配消息时自动调度音画与天气。
- [ ] Lo-Fi 滤镜在启用时产生真实的房间隔音沉浸音效。
- [ ] 配置导入导出功能正常工作，可无损迁移。
- [ ] 编写全功能自动化验证，在本地 SillyTavern 环境中执行全绿通过。
- [ ] 将完整 Wiki 文档录入仓库，提交并推送至私有云端仓库。
