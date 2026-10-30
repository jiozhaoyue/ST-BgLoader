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
* ⚙️ **[全量设置项对照表 (Settings Reference)](wiki/Settings-Reference.md)**
* 💾 **[存储模型与 Authority 增强集成 (Storage & Authority)](wiki/Storage-and-Authority-Integration.md)**
* 🏛️ **[顶栏原生抽屉夺舍与跨宿主集成 (Native Background Integration)](wiki/Native-Background-Integration.md)**
* 🖼️ **[UI 组件、视听转场与毛玻璃 (UI Components & Transitions)](wiki/UI-Components-and-Transitions.md)**
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

### 0. 顶栏原生抽屉原位夺舍与单总开关 (Topbar Drawer Takeover)
- **顶栏原位展开**：点击酒馆顶栏背景按钮，原位展开接管后的 `#Backgrounds` 抽屉，内含「背景媒体库」与「详细设置」双标签页，保持酒馆原生折叠动画与滑动手势。
- **单总开关极简面板**：在扩展设置列表 (`#extensions_settings`) 仅保留主总开关、激活状态与直达按钮，告别大段冗余表单。
- **跨 4 宿主抹平**：统一兼容 SillyTavern、Luker、PureTavern、TauriTavern。
- **零溢光原生视觉**：严格继承 `--SmartTheme*` 主题变量，全样式无 `box-shadow` 溢光。

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

### 8. 服务端同源真源与客户端热缓存 (Server Origin & Hot Cache)
- **服务端真源**：以酒馆服务端 `backgrounds/` 物理目录为唯一持久化真源（`/api/backgrounds/`），与酒馆原生背景零拷贝同源共享；
- **客户端热缓存**：浏览器端 `CacheStorage` 仅充当大二进制块热缓存与 LRU 配额管理，用户清理浏览器缓存绝不丢失服务端资产。
- **Authority 协同**：支持跨域外链服务端代抓取 (`RemoteImporter`)、跨设备配置镜像与 AI 导演模式 Agent Runtime 工具注册。

### 9. 环境白噪音发生器 (Procedural Ambient Sound Generator)
- 原生 WebAudio 实时程序化合成雨声、壁炉木炭噼啪声与夜风，**无需额外下载音频文件**，可与 BGM 并存混合播放。

### 10. 毛玻璃对话框穿透 (Frosted Glass Chat UI)
- 开启后，SillyTavern 聊天消息框呈现通透磨砂毛玻璃质感，背景动效与微粒穿透可见，极大提升视觉沉浸度。

### 11. 全景视听预设快照 (Scene Snapshots & Bookmarks)
- 一键将当前媒体、BGM、滤镜、天气、律动、白噪音与毛玻璃打包为场景快照，支持一键切换。

### 12. 悬浮音乐胶囊播放器 (Mini Player)
- 屏幕右下角提供轻量微型音乐胶囊，仅在播放音频时智能显现，支持切歌、模式切换与动态音浪呼吸微动。

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
npm run dev:ui     # 独立 UI 预览台（不需要启动酒馆），见下节
npm run type-check # TypeScript 严格类型检查
npm run check:css  # CSS 作用域门禁：裸选择器 / 扩展前缀 / box-shadow 三合一自查（对 src 生效）
```

### 独立 UI 预览台（无需酒馆实例）
```bash
npm run dev:ui     # 打开 http://localhost:5173/
```
预览台把宿主的必要接缝（事件源、上下文、toastr、四个 DOM 锚点）用宿主桩补齐，并用中间件模拟
`/api/backgrounds/*` 三个端点，数据落在 `dev/.data/`（已 gitignore）。可以完整操作扩展设置面板、
顶栏背景抽屉、媒体库上传/删除/搜索/过滤/排序，以及 BGM 与环境音，**无需启动 SillyTavern 或 Luker**。

> 预览台是开发工具，**不替代真机验收**：宿主桩可能滞后于真实宿主行为，发布前仍需在 Dev 实例上跑一遍
> `e2e` / `smoke` 套件。产品构建（`npm run build`）不包含 `dev/` 的任何代码。

### 自动化测试套件
项目配备了完整的自动化质量门禁套件：
- `npm run check:css`：CSS 作用域静态门禁（无需实例，随时可跑）；
- `node tests/dev-harness.mjs`：预览台自检（免实例，需先 `npm run dev:ui`，14 项断言）；
- `node tests/api-harness.mjs`：对外端点面自检（免实例，需先 `npm run dev:ui`，38 项断言：发现接口 / postMessage 桥往返与错误帧 / 事件三通道一致性 / 媒体库-设置-缓存-播放列表端点往返 / 登记表零漂移 / 网格合帧 / BGM 自动轮播端点 / 场景导出导入与白名单清洗）；
- `node tests/e2e.mjs`：端到端功能回归测试（24 项断言）；
- `node tests/stress.mjs`：极限并发切换、大文件流、异常容错与显存泄漏压力测试；
- `node tests/authority.mjs`：服务端存储与 Authority 扩展交互能力测试；
- `node tests/extreme-media.mjs`：极端媒体实测（超大图 / 真实视频 / 损坏与截断文件 / 伪装扩展名 / 超长文件名 / 超长音频 / 沙箱脚本 / 快速切换，逐项截图留证并自动清理）；
- `node tests/smoke-ui.mjs`：真实 UI 冒烟（搜索/过滤/点击应用/显隐/天气/视觉器/场景/抽屉开合，逐步截图并全量复原）。

> ⚠️ **运行门禁前置条件**：除 `check:css` 与 `dev-harness` 外，测试套件需连接运行中的酒馆本地实例，并通过环境变量指定 `TEST_TARGET_URL`（如 `http://localhost:8001`）。**严禁针对真实数据区或生产实例运行 E2E 测试**（端口 8002/8004 严禁作为测试目标）。

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
