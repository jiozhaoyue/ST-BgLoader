# ST-BgLoader (Rich Media Backgrounds & Atmospheric FX for SillyTavern)

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![SillyTavern](https://img.shields.io/badge/SillyTavern-Compatible-success.svg)](https://github.com/SillyTavern/SillyTavern)

次世代 [SillyTavern](https://github.com/SillyTavern/SillyTavern) 富媒体背景与沉浸式声画氛围增强插件。

针对官方视频插件需依赖 CPU 软解转码（导致风扇狂转、发热、文件膨胀及永久丢失音轨）等历史痛点，提供**零转码直放、硬件加速解码、多媒体全格式覆盖（视频/音频/HTML5/SVG/图像）、微粒天气系统、音频反应式律动、2.5D 景深视差与智能场景联动**。

---

## 📚 官方详细文档与项目 Wiki (Documentation)

项目包含全套生产级技术文档与创作者集成指南，欢迎查阅：

* 📖 **[Wiki 首页 (Home)](wiki/Home.md)**
* 📐 **[系统架构与解耦设计 (Architecture & Design)](wiki/Architecture-and-Design.md)**
* 🔌 **[开发者公共 API 参考 (Public API Reference)](wiki/Public-API-Reference.md)**
* 🌧️ **[微粒天气系统 (Atmospheric Weather Engine)](wiki/Atmospheric-Weather-Engine.md)**
* 🎵 **[音频引擎与律动频谱 (Audio Engine & Visualizer)](wiki/Audio-Engine-and-Visualizer.md)**
* ⚡ **[智能场景触发器 (Smart Triggers & Scenes)](wiki/Smart-Triggers-and-Scene-Automation.md)**
* 🎭 **[角色卡集成与创作者指南 (Character Card Integration)](wiki/Character-Card-Integration.md)**
* 🚀 **[性能优化与缓存体系 (Performance & Caching)](wiki/Performance-and-Caching-Guide.md)**
* ❓ **[常见问题与排查 (FAQ & Troubleshooting)](wiki/FAQ-and-Troubleshooting.md)**

---

## 🌟 核心特性总览 (Features)

### 1. 彻底革新视频播放（零转码，纯硬件加速）
- **直接直放**：调用浏览器原生硬件加速解码器（支持 H.264/H.265/AV1 的 MP4，以及 VP8/VP9/AV1 的 WebM）。
- **零转码流式缓存**：上传视频直接通过 CacheStorage 流式存储并生成 Blob URL 即点即播，秒传秒开。
- **GPU 极速合成**：独立 `.st-bg-media-container` 图层提升，4K 60FPS 动态背景极致丝滑，CPU 占用接近 0%。

### 2. 多媒体全格式覆盖
- **视频 (Video)**：MP4, WebM, MOV, OGV（支持带透明通道的 WebM 动态背景）。
- **音频 (Audio & BGM)**：MP3, WAV, OGG, FLAC, AAC（支持独立伴奏/BGM 播放、单曲循环、随机播放）。
- **动态沙箱 (HTML5 & SVG)**：HTML/CSS 动效、Canvas 粒子、WebGL 场景与 SVG 矢量动画，运行于独立沙箱中，支持可选鼠标点击穿透交互。
- **传统图片 (Image)**：PNG, JPG, WebP, GIF 无缝兼容，双缓冲淡入淡出过渡。

### 3. 微粒天气与环境氛围系统 (Atmospheric Weather FX)
- **细雨微涟 (`rain`)**：倾斜雨丝随风飘落，屏幕底部激起扩散水花涟漪。
- **冬日飘雪 (`snow`)**：正弦波振荡漂移雪花，具有层次景深。
- **落樱缤纷 (`sakura`)**：3D 椭圆花瓣随风旋转飘落。
- **赛博微粒 (`cyber_motes`)**：霓虹光晕微粒伴随热对流缓缓上升。
- **复古扫描线 (`scanlines`)**：CRT 阴极射线管质感与滚动波束。
- **严格零开销**：关闭时完全停止动画帧，**CPU 0% 占用**。

### 4. 音频反应式视觉律动 (Audio Visualizer & Reactive FX)
- **低音呼吸律动 (`pulse`)**：根据低频贝斯能量，背景画面随鼓点产生平滑呼吸心跳微动。
- **底部炫彩频谱 (`spectrum`)**：实时傅里叶变换 (FFT 256) 呈现渐变圆角音频柱状波形。

### 5. 隔壁房间声学模拟 (Lo-Fi Room Acoustic Muffle)
- WebAudio API `BiquadFilterNode` 800Hz 动态低通滤波，瞬间营造出类似身处室内隔壁、门扉半掩的沉浸感。

### 6. 2.5D 鼠标景深视差 (Parallax Controller)
- 随着鼠标或陀螺仪轻微移动产生纵深空间感，弹簧阻尼平滑插值，自带扩容防黑边设计。

### 7. 智能场景触发器 (Smart Triggers)
- 深度监听 SillyTavern 事件，支持根据 **角色名称 (`character`)**、**聊天室 ID (`chat`)** 或 **消息对白正则 (`regex`)** 自动切换背景、BGM、天气与色彩滤镜！

### 8. 复合流式持久化缓存 (CacheStorage + IndexedDB)
- **CacheStorage**：大文件流式存储与 Range 请求响应，内存零拷贝，实测 105MB 视频秒级载入。
- **IndexedDB**：结构化元数据索引与 LRU 时间戳管理，支持磁盘配额超额自动清理。

### 9. 环境白噪音发生器 (Procedural Ambient Sound Generator)
- 原生 WebAudio 实时程序化合成雨声、壁炉木炭噼啪声与夜风，**无需额外下载音频文件**，可与 BGM 并存混合播放。

### 10. 毛玻璃对话框穿透 (Frosted Glass Chat UI)
- 开启后，SillyTavern 聊天消息框呈现通透磨砂毛玻璃质感，背景动效与微粒穿透可见，极大提升视觉沉浸度。

### 11. 全景视听预设快照 (Scene Snapshots & Bookmarks)
- 一键将当前媒体、BGM、滤镜、天气、律动、白噪音与毛玻璃打包为场景快照，支持一键切换。

### 12. 视觉小说便捷快捷键 (Alt Shortcuts)
- 支持 `Alt+B`（背景显示切换）、`Alt+P`（播放/暂停）、`Alt+M`（隔音滤波）、`Alt+W`（轮换天气）、`Alt+F`（毛玻璃开关）。

---

## 🚀 极速安装 (Installation)

### 方式 1：SillyTavern 扩展安装器一键安装
1. 打开 SillyTavern 右上角 **扩展 (Extensions)** 面板；
2. 点击 **安装扩展 (Install Extension)**；
3. 输入本仓库 Git 链接：`https://github.com/jiozhaoyue/ST-BgLoader.git` 点击安装。

### 方式 2：本地手动部署
```bash
cd SillyTavern/public/scripts/extensions/third-party
git clone https://github.com/jiozhaoyue/ST-BgLoader.git
```

### 开发与构建
```bash
npm install
npm run build      # 极速打包出 dist/index.js 与 dist/style.css
npm run type-check # TypeScript 严格类型检查
node tests/e2e.mjs # 运行全套 24 项自动化 E2E 测试
```

---

## 🛠️ 开发者基建与公共 API 规范 (Quick API Overview)

全局暴露 `window.stBgLoader`（及 `window.STBgLoader.getAPI()`）：

```javascript
// 切换背景
await window.stBgLoader.setBackground('https://assets.example.com/cyberpunk.mp4', {
    type: 'video',
    name: '赛博雨夜',
    saveToLibrary: true
});

// 播放背景音乐
await window.stBgLoader.playBGM('https://assets.example.com/ambient.mp3', {
    volume: 0.8,
    loop: true
});

// 切换天气
window.stBgLoader.setWeather('rain', { density: 'high', speed: 1.2 });

// 开启隔壁房间声学模拟
window.stBgLoader.setMuffled(true);

// 开启音频反应式律动
window.stBgLoader.setVisualizer('pulse');

// 开启 2.5D 景深视差
window.stBgLoader.setParallax(true, 0.4);

// 预热流式资源
await window.stBgLoader.preloadMedia(['https://assets.example.com/scene.mp4']);
```

完整接口参数与角色卡实战，请参阅 [Public API Reference](wiki/Public-API-Reference.md) 与 [Character Card Integration Guide](wiki/Character-Card-Integration.md)。

---

## 📄 许可说明 (License)
本项目遵循 [MIT License](LICENSE) 开源。
