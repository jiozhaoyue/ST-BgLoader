# Rich Media Background Plugin (ST-BgLoader)

## Goal

为 SillyTavern 打造次世代富媒体背景插件，彻底解决官方转码方案的耗时与失真痛点。提供原生级硬件加速播放、多媒体全格式覆盖（视频、音频、HTML/Canvas/WebGL、SVG 动画）、完备的视图滤镜微调、多层级持久化缓存（CacheStorage + IndexedDB + ST 服务端存储同步），以及无感丝滑的会话级背景过渡。

---

## Upstream Official Plugin Deep Dive (`Extension-VideoBackgroundLoader`)

对官方插件源码仓库 (`https://github.com/SillyTavern/Extension-VideoBackgroundLoader`) 与 ST 核心代码 (`public/scripts/backgrounds.js:1510-1540`) 进行的逐行深度审计：
1. **工作机制**：
   - 官方插件本质是一个**无前端 UI 的 WASM 转换模块**，仅向全局导出 `globalThis.convertVideoToAnimatedWebp`。
   - 用户在 ST 原生背景抽屉选择视频后，ST 核心截获该文件并调用 `@ffmpeg/ffmpeg` 执行转码：
     ```bash
     ffmpeg -i input.mp4 -vcodec libwebp -lossless 0 -loop 0 -preset picture -an -vsync 0 output.webp
     ```
   - 强制将视频逐帧栅格化为单张 WebP 动图上传至 `/api/backgrounds/upload`。
2. **核心缺陷**：
   - **严重 CPU 瓶颈**：纯客户端软解软编，数秒高清视频转码常耗时数分钟，导致 UI 假死或浏览器内存溢出 (OOM)。
   - **体积极度膨胀**：动图 WebP 缺乏现代视频编码（H.264/WebM）的帧间预测压缩，文件体积暴增 5~10 倍。
   - **音轨硬性剥离**：命令包含 `-an` 参数，音频轨被永久剥离，无法支持伴音或背景音乐。
   - **零富媒体拓展**：完全不支持 HTML 动画、Canvas、WebGL、交互式 SVG 或独立音频。

---

## Confirmed Architecture & Product Decisions

| 维度 | 方案 | 细节与设计收益 |
|---|---|---|
| **DOM 挂载策略** | 在原生 `#bg1` 内部挂载多媒体渲染视图 (`.st-bg-media-container`) | 完美复用原生 `.cover` / `.contain` / `.stretch` 适配样式与 `z-index: -1`，不破坏 ST 核心视图与任何第三方主题。 |
| **HTML/SVG 隔离** | 沙箱化 `<iframe>` 独立运行 | 严格隔离复杂 WebGL/Canvas 及 CSS 样式，杜绝全局样式和脚本污染，通过安全的 PostMessage 进行状态同步。 |
| **音频体系** | 独立音频管理引擎 + 全局音量控制 | 统一管理视频伴音与独立 BGM，支持音量滑块调节、一键静音、离焦自动静音/暂停，支持与特定角色/会话绑定。 |
| **多层存储架构** | 混合存储模式 (CacheStorage + IndexedDB + 服务端同步) | 优先通过客户端 CacheStorage (大二进制媒体流) 与 IndexedDB (元数据/配置) 实现秒级加载；可选同步至 ST 服务端支持多端共享。 |
| **缓存清理机制** | 智能 LRU 自动清理 + 手动清空入口 | 支持配置最大缓存配额（如 500MB/1GB/自定义），超额自动剔除最久未使用的背景，并支持一键清理全部缓存。 |
| **UI 交互入口** | 扩展专属抽屉面板 + 无缝接管原生背景抽屉 | 用户既可在原生背景选择面板直接预览与应用多媒体背景，也可在扩展面板深度配置音量、特效与缓存。 |
| **视觉滤镜引擎** | 多维实时 CSS 滤镜套件 | 支持在面板实时调节：模糊度 (Blur)、亮度/明暗 (Brightness)、不透明度 (Opacity)、饱和度 (Saturate)。 |
| **媒体导入源** | 本地文件拖拽上传 + 外部远程 URL 引入 | 既支持本地多格式媒体文件加载与持久化，也支持输入 HTTP/HTTPS 远程流地址并异步存入本地缓存。 |
| **工程结构** | TypeScript + 模块化打包 (Vite/Rollup) | 类型安全、模块清晰，打包输出单文件标准 ST Extension Bundle，附带完整 `manifest.json` 与自动化构建脚本。 |
| **会话继承逻辑** | 严格兼容 ST 原生体系 | 单聊/群聊专属富媒体背景 > 全局默认富媒体背景，切换会话时自动平滑淡入淡出。 |

---

## Requirements

### 1. 媒体格式全面兼容 (Media Rendering Engine)
- **视频引擎 (VideoPlayer)**：
  - 支持 HTML5 原生硬解播放：MP4 (H.264/AV1)、WebM (VP8/VP9/AV1)。
  - 自动循环、硬解加速、自适应填充，支持透明通道 WebM。
- **音频引擎 (AudioEngine)**：
  - 支持 MP3, OGG, WAV, FLAC 格式。
  - 支持视频内嵌音轨静音/取消静音、独立音频背景播放。
  - 平滑淡入淡出（切歌或暂停时）。
- **动态组件引擎 (SandboxFrame)**：
  - 支持 HTML/CSS 动画、HTML5 Canvas 粒子/动效、WebGL 场景。
  - 支持独立 SVG 矢量动效。
- **传统图像兼容**：
  - 遇到普通 PNG/JPG/WebP/GIF 时回退至原生流畅渲染。

### 2. 交互与控制界面 (UI/UX)
- **扩展设置抽屉面板**：
  - 媒体库管理器：上传、URL 导入、预览、重命名、删除。
  - 视觉效果调节条：模糊度 (0-20px)、明暗遮罩 (0-100%)、不透明度 (0-100%)、饱和度 (0-200%)。
  - 音频控制区：主音量滑块、一键静音、后台静音开关。
  - 缓存仪表盘：当前占用体积、条目数量、LRU 策略开关、一键清空缓存。
- **原生背景面板增强**：
  - 原生背景列表中为视频/动态媒体追加格式角标标识（[VIDEO], [HTML], [SVG], [AUDIO]）。
  - 点击即可实时无感切换。

### 3. 性能优化与生命周期管理
- **Page Visibility API**：切出当前标签页或窗口最小化时，自动暂停视频解码与动画更新，释放 GPU 资源。
- **低开销流式缓存**：利用 CacheStorage 直接响应 Range 请求，避免大视频占用主内存。
- **GPU 合成层**：通过 `will-change: transform; transform: translateZ(0);` 独立提升图层，避免主聊天流重排回流。

---

## Out of Scope
- 客户端放弃慢速的 WASM 视频再编码/转码（始终采用浏览器原生硬件解码器）。
- 不破坏 SillyTavern 核心界面布局与主题 CSS 变量系统。

---

## Acceptance Criteria

- [x] 本地与远程 MP4/WebM 视频可即点即播，无需转码等待，硬件加速解码。
- [x] 视频伴音或独立 BGM 正常发声，支持音量调节、静音与离开页面自动休眠。
- [x] HTML 与 SVG 动画在沙箱中正常运转，不干扰聊天框打字、气泡展示与主题布局。
- [x] 滤镜参数（模糊、亮度、不透明度、饱和度）调节实时生效。
- [x] 重复加载同一背景时命中 CacheStorage / IndexedDB 离线缓存，无额外全量网络下载延迟。
- [x] 缓存占用超出设定阈值时，自动按 LRU 顺序安全回收最老数据。
- [x] 支持 SillyTavern 单聊/群聊特定背景与全局背景的无缝层叠覆盖。
