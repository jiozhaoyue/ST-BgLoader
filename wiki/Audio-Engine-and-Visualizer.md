# Audio Engine & Visualizer (音频引擎与律动频谱)

ST-BgLoader 集成了一套功能完整、与背景音画无缝联动的独立音频播放引擎 (`AudioEngine`) 以及实时音频反应式视觉律动系统 (`AudioVisualizer`)。

---

## 🎧 音频引擎核心功能 (AudioEngine)

### 1. 播放模式 (Playback Modes)
- **`loop` (循环列表)**：按顺序顺序播放当前音频队列中的所有曲目，播至末尾自动返回首曲。
- **`single` (单曲循环)**：依靠底层 HTML5 MediaElement 的 `loop` 属性无缝单曲重放，0 延迟循环。
- **`shuffle` (随机播放)**：从列表中随机挑选曲目，自带防重算法（避免连续抽取同一首）。

### 2. 绕过浏览器自动播放策略 (Autoplay Resilience)
现代浏览器（Chrome、Edge、Safari）禁止未经用户显式交互的有声自动播放。
- 当媒体加载且尚未产生用户手势时，播放器安全启动并先设为 `muted: true` 静音播放，确保时间戳正常行进；
- 注册一次性全局监听器（`pointerdown`, `keydown`, `touchstart`）；
- 一旦检测到任何交互操作，系统将在 **400ms 内平滑拉起音量 (`fadeInVolume`)** 唤醒声音，带来舒适无爆音的自然体验。

### 3. 切后台智能控制 (Smart Tab Inactive Pause)
在配置项开启 `pauseOnBlur` 时，页面切换为后台标签页（`document.hidden`）时将自动暂停音频和视频播放，切回当前标签页时自动恢复，既节省电量与系统资源，又避免在切换其他工作时造成打扰。

### 4. 隔壁房间声学模拟 (Lo-Fi Acoustic Muffle)
利用 WebAudio API 的 `BiquadFilterNode`：
- **原理**：二阶低通滤波 (Low-pass Filter)，Q 因子设为 1.0；
- **状态过渡**：调用 `setMuffled(true)` 时，截止频率从 20,000 Hz 借助 `setTargetAtTime` 平滑衰减至 800 Hz（时间常数 80ms）；
- **听觉体验**：瞬间营造出类似身处室内隔壁、门扉半掩、雨夜咖啡厅外的绝佳电影感氛围。

---

## 📊 音频反应式律动与频谱 (AudioVisualizer)

音频引擎通过 `createMediaElementSource` 接入 WebAudio 节点图谱，并在输出至声卡前挂载了高精度 `AnalyserNode` (FFT 大小 256)。

### 1. 低音呼吸律动 (`pulse`)
- **算法**：分析前 10 个频段（约 0 ~ 200 Hz 的低频贝斯与鼓点能量），提取归一化低音均值；
- **视觉反馈**：以平滑非线性指数函数动态放大背景图层（`scale(1.00 ~ 1.03)`），并同步提升微量背景亮度；
- **效果**：背景画面随着音乐鼓点产生深邃的“呼吸心跳”共鸣。

### 2. 炫彩底部频谱柱 (`spectrum`)
- **算法**：实时获取 128 个频段能量分布，使用 HTML5 Canvas 在屏幕底部绘制圆角柱状波形；
- **美学渲染**：采用垂直线性渐变（半透明底色 -> 明亮强调色 -> 纯白高光），色彩可自定义；
- **抗锯齿与自适应**：柱宽与间距自适应屏幕宽度，高分屏下自动开启矢量渲染。

### 3. 性能控制
当 `visualizer.mode === 'off'` 时，立即断开逐帧采样与重绘，**CPU 0% 占用**。
