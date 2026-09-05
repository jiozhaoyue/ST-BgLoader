# Welcome to the ST-BgLoader Wiki 🌌

**ST-BgLoader** 是专为 [SillyTavern](https://github.com/SillyTavern/SillyTavern) 打造的高性能全功能富媒体背景与沉浸式视听氛围增强扩展插件。

它突破了传统纯静态图片背景的局限，提供零转码硬件直解视频、HTML5/WebGL 可交互沙箱、SVG 矢量动效、多音轨 BGM 播放列表、WebAudio 房间声学模拟、动态微粒天气系统、音频反应式律动与 2.5D 视差，为沉浸式角色对话提供无与伦比的视觉与声效体验。

---

## 🌟 核心功能矩阵 (Feature Matrix)

| 功能分类 | 特性亮点 | 技术实现 |
| :--- | :--- | :--- |
| **富媒体硬件直解** | MP4/WebM 4K 直解、原声音轨保留、0 延迟场景切换 | 原生 `<video>` 硬件解码 + 双缓冲双图层平滑淡入淡出 |
| **动态与沙箱背景** | HTML5 Canvas、Three.js、3D 网页小游戏、SVG 矢量动画 | 独立沙箱 `<iframe>` + 可选鼠标交互穿透 (`pointer-events`) |
| **独立 BGM 音频引擎** | 循环/单曲/随机模式、音量平滑渐变、切后台智能静音暂停 | 原生 `Audio` + 自动监听切后台与手势触发自动静音播放 |
| **隔壁房间声学模拟** | 逼真的“隔壁房间传来音乐”氛围感 (Lo-Fi Acoustic Muffle) | WebAudio API `BiquadFilterNode` (800Hz 动态平滑低通滤波) |
| **微粒天气与氛围引擎** | 细雨水波、冬日飘雪、落樱缤纷、赛博微粒、CRT扫描线 | 高性能 HTML5 Canvas 物理粒子模拟系统 (关闭时 0% CPU 占用) |
| **音频律动与动态频谱** | 低音呼吸律动 (Pulse) + 底部炫彩音频频谱柱 (Spectrum) | WebAudio API `AnalyserNode` + 实时傅里叶变换 (FFT 256) |
| **2.5D 景深动态视差** | 随着鼠标或陀螺仪轻微移动产生纵深空间感 | 弹簧平滑阻尼插值 (Spring Lerp) + 边缘无缝扩容防穿帮 |
| **多重场景转场特效** | 平滑淡入淡出、缩放推进、虚化柔焦、向左/向右滑动 | GPU 加速 CSS3 硬件变形与动态图层平滑切换 (可调时长) |
| **智能场景与卡片联动** | 随角色切换、聊天环境或文本关键词自动切换背景/BGM/天气 | `TriggerManager` 事件总线监听 + 正则表达式实时规则匹配 |
| **复合极速流式缓存** | 支持超百兆大文件秒级保存、断网离线畅玩、LRU 自动淘汰 | `CacheStorage` (大二进制块) + `IndexedDB` (精准元数据) |
| **环境白噪音发生器** | 淅沥小雨、壁炉木炭噼啪、空灵夜风 (程序化合成无音频依赖) | WebAudio API 实时粉红噪声与 LFO 正弦波滤波发生器 |
| **毛玻璃对话框穿透** | 对话气泡半透明磨砂玻璃质感，背景动效与微粒穿透可见 | 动态 CSS 自定义属性与 `-webkit-backdrop-filter` 硬件加速 |
| **全景视听预设快照** | 一键保存与恢复全套音画场景 (媒体+BGM+天气+滤镜+视差+白噪音) | `SceneManager` 复合场景快照管理器与内置预设库 |
| **视觉小说便捷快捷键** | Alt+B 背景开关、Alt+P 播放、Alt+M 隔音、Alt+W 天气、Alt+F 毛玻璃 | 全局安全键盘事件监听器 (避开打字输入框) |
| **公共开发者 SDK** | 供第三方插件、角色卡创作者调用全功能 API 与事件总线 | `window.stBgLoader` / `window.STBgLoader.api` |

---

## 🚀 快速上手 (Quick Start)

### 1. 安装与启用
1. 将本项目 clone 或下载至 SillyTavern 插件目录：
   ```bash
   cd SillyTavern/public/scripts/extensions/third-party
   git clone https://github.com/jiozhaoyue/ST-BgLoader.git
   ```
2. 启动或刷新 SillyTavern 页面。
3. 打开右侧 **Extensions (扩展面板)** -> 展开 **ST-BgLoader (Rich Media Backgrounds & FX)**。

### 2. 导入与切换背景
- **本地文件上传**：拖拽任意 `.mp4`, `.webm`, `.mp3`, `.wav`, `.html`, `.svg`, `.png`, `.jpg` 至面板区域。
- **直链 URL 导入**：输入媒体文件 HTTP/HTTPS 链接，点击 **Import URL**，系统将自动缓存并加入媒体库。
- **单击媒体卡片**：即刻应用背景，享受丝滑无黑屏的双缓冲平滑过渡！

---

## 📖 Wiki 详细目录

- [📐 系统架构与解耦设计 (Architecture & Design)](Architecture-and-Design.md)
- [🔌 开发者公共 API 参考 (Public API Reference)](Public-API-Reference.md)
- [🌧️ 微粒天气系统 (Atmospheric Weather Engine)](Atmospheric-Weather-Engine.md)
- [🎵 音频引擎与律动频谱 (Audio Engine & Visualizer)](Audio-Engine-and-Visualizer.md)
- [⚡ 智能场景触发器 (Smart Triggers & Scenes)](Smart-Triggers-and-Scene-Automation.md)
- [🎭 角色卡集成与创作者指南 (Character Card Integration)](Character-Card-Integration.md)
- [🚀 性能优化与缓存体系 (Performance & Caching)](Performance-and-Caching-Guide.md)
- [❓ 常见问题与排查 (FAQ & Troubleshooting)](FAQ-and-Troubleshooting.md)
