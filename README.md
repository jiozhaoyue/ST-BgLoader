# ST-BgLoader (Rich Media Backgrounds for SillyTavern)

次世代 SillyTavern 富媒体背景增强插件。针对官方视频插件需依赖 CPU 软解转码、严重发热、文件膨胀及强制剥离音轨等局限，提供**零转码直放、硬件加速解码、多媒体全格式覆盖（视频/音频/HTML5/SVG/图像）与多层级流式缓存**。

---

## 🌟 核心特性与架构优势

### 1. 彻底革新视频播放（零转码，纯硬件加速）
- **官方插件痛点**：利用 `@ffmpeg/wasm` 在浏览器执行 `-vcodec libwebp -an output.webp`，转码耗时数分钟，CPU 占用 100%，体积膨胀数倍，且永久丢失音轨。
- **ST-BgLoader 解决方案**：
  - **直接直放**：直接调用浏览器原生硬件加速解码器（支持 H.264/H.265/AV1 的 MP4，以及 VP8/VP9/AV1 的 WebM）。
  - **零转码流式缓存**：上传视频直接通过 CacheStorage 流式存储并生成 Blob URL 即点即播，秒传秒开。
  - **GPU 合成渲染**：通过 `transform: translateZ(0)` 与独立的 `.st-bg-media-container` 图层提升，CPU 占用接近 0%，即便 4K 60FPS 动态背景也极致丝滑。

### 2. 多媒体全格式覆盖
- **视频 (Video)**：MP4, WebM, MOV, OGV（支持带透明通道的 WebM 动态背景）。
- **音频 (Audio & BGM)**：MP3, WAV, OGG, FLAC, AAC（支持独立伴奏/BGM 播放与单聊会话绑定）。
- **动态沙箱 (HTML5 & SVG)**：HTML/CSS 动效、Canvas 粒子粒子、WebGL 场景与 SVG 矢量动画，运行于受控的 `<iframe sandbox>` 沙箱中，严密防范样式和变量污染。
- **传统图片 (Image)**：PNG, JPG, WebP, GIF 无缝兼容，双缓冲淡入淡出过渡。

### 3. 独立音频引擎 (AudioEngine)
- 视频自带伴音与独立 BGM 统一纳管。
- 提供主音量滑块（0% - 100%）、一键静音、切歌/停止时平滑淡入淡出。
- **智能离焦省电**：切换标签页或窗口隐藏时，自动静音或挂起视频与音频解码，返回时自动恢复。

### 4. 复合流式持久化缓存 (CacheStorage + IndexedDB)
- **CacheStorage**：大文件流式存储与 Range 请求响应，内存零拷贝。
- **IndexedDB**：结构化元数据索引与 LRU 时间戳管理。
- **智能淘汰**：支持配置缓存配额（默认 1GB），超额自动淘汰最久未访问的背景，同时提供一键清空。

### 5. 实时视觉滤镜微调
- 模糊度 (Blur, 0-20px)
- 亮度/对比度 (Brightness, 0-200%)
- 不透明度 (Opacity, 0-100%)
- 饱和度 (Saturation, 0-200%)

---

## 🚀 安装与使用

### 安装方式 1：通过 SillyTavern 扩展安装器
1. 打开 SillyTavern 顶部 **扩展 (Extensions)** 菜单。
2. 点击 **安装扩展 (Install Extension)**。
3. 输入本仓库 Git 链接或本地路径即可一键安装。

### 安装方式 2：本地手动部署
将本项目放入 SillyTavern 目录下的 `public/scripts/extensions/third-party/ST-BgLoader`：
```bash
# 拷贝到 ST 扩展目录
cp -r ST-BgLoader <SillyTavern_Path>/public/scripts/extensions/third-party/
```

### 开发与构建
```bash
npm install
npm run build      # 极速打包出 dist/index.js 与 dist/style.css
npm run type-check # TypeScript 严格类型检查
```

---

## 📄 许可说明
本项目遵循 MIT 协议开源。
