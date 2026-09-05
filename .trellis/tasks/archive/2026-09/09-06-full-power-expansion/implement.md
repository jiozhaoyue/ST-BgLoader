# Implementation Plan: Full-Power Modular Expansion

## Phase 1: Types & Configuration Extension
- [ ] 扩展 `src/types/index.ts`，定义 `WeatherType`, `WeatherOptions`, `VisualizerMode`, `TransitionType`, `TriggerRule` 以及对应 Settings 字段。

## Phase 2: Atmospheric Weather & Particle Canvas Engine
- [ ] 实现 `src/fx/AtmosphereFX.ts`：
  - 雨丝与水花效果 (`rain`)
  - 缓落旋转雪花 (`snow`)
  - 3D 投影飘落樱花瓣 (`sakura`)
  - 赛博发光浮游微粒 (`cyber_motes`)
  - CRT 复古扫描线与色差 (`scanlines`)
  - 零开销休眠释放逻辑

## Phase 3: WebAudio Visualizer & Audio Reactive Glow
- [ ] 实现 `src/visualizer/AudioVisualizer.ts`：
  - WebAudio `AudioContext` & `AnalyserNode`
  - 低频低音脉冲律动 (`pulse`)
  - 底部/胶囊声谱律动 (`spectrum`)

## Phase 4: 2.5D Mouse Parallax & Cinematic Transitions
- [ ] 实现 `src/core/ParallaxController.ts`：鼠标移动阻尼弹簧推移。
- [ ] 在 `src/core/MediaMount.ts` 实现转场动画引擎 (`fade`, `zoom_fade`, `blur_fade`, `slide_left`, `slide_right`)。

## Phase 5: Smart Trigger & Scene Matching Engine
- [ ] 实现 `src/triggers/TriggerManager.ts`：
  - 角色切换与文本正则匹配
  - 自动联动换景、切曲、天气、滤镜与预设

## Phase 6: Lo-Fi Acoustic Filter & Config Backup
- [ ] 在 `src/audio/AudioEngine.ts` 接入 WebAudio `BiquadFilterNode` 实现低通隔门滤镜。
- [ ] 在 `SettingsDrawer.ts` 实现全量配置导出 (JSON) 与导入恢复功能。
- [ ] 在 `SettingsDrawer.ts` 渲染天气、可视化、视差、转场与智能规则配置面板。

## Phase 7: Public API & Event Bus Expansion
- [ ] 在 `src/api/PublicAPI.ts` 暴露全部新特性的编程式控制方法：
  - `setWeather`, `setVisualizer`, `setParallax`, `setTransitionEffect`, `setMuffled`, `addTriggerRule`

## Phase 8: Project Wiki
- [ ] 编写全套 Markdown Wiki 文档 (`wiki/` 与 `docs/`)。

## Phase 9: Build, Automated Verification & Cloud Push
- [ ] 编译生产包 `npm run build`。
- [ ] 编写并执行全功能端到端自动化测试。
- [ ] 提交并推送到 GitHub 私有仓库 (`origin master`)。
