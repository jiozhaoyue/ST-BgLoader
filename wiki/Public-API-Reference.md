# Public API Reference (开发者 API 参考)

ST-BgLoader 向全局挂载了现代化的 JavaScript/TypeScript SDK，可通过 `window.stBgLoader` 或 `window.STBgLoader.getAPI()` 直接调用。

第三方插件、SillyTavern 宏命令脚本、角色卡前端嵌入代码均可借助该 SDK 达成完全自动化的音画控制。

---

## 🧭 访问方式

```javascript
const api = window.stBgLoader;
// 或者从实例提取
const api = window.STBgLoader.getAPI();
```

---

## 🖼️ 1. 背景媒体控制 (Background APIs)

### `api.setBackground(urlOrId, options?): Promise<void>`
切换全局背景，支持 MP4/WebM 视频、HTML/Canvas 沙箱、SVG、静态图片。

- **参数**：
  - `urlOrId` (`string`): 媒体库内部 ID，或任意外部网络直链 (HTTP/HTTPS)、本地绝对/相对路径。
  - `options` (`BackgroundOptions`，可选)：
    - `type` (`'video' | 'audio' | 'html' | 'svg' | 'image'`): 显式指定媒体类型（默认自动嗅探）。
    - `filters` (`Partial<VisualFilters>`): 切换后应用的新滤镜。
    - `interactive` (`boolean`): 是否开启鼠标点击穿透交互（沙箱/小游戏背景）。
    - `name` (`string`): 保存到库中的显示名称。
    - `saveToLibrary` (`boolean`): 是否持久化保存在媒体库中。

**代码示例**：
```javascript
// 切换为远程 MP4 动态视频背景
await window.stBgLoader.setBackground('https://assets.example.com/cyberpunk-city.mp4', {
    type: 'video',
    name: '赛博朋克雨夜',
    saveToLibrary: true
});

// 切换为交互式 Three.js 粒子星空网页背景
await window.stBgLoader.setBackground('https://example.com/threejs-stars.html', {
    interactive: true
});
```

### `api.clearBackground(): void`
清空当前活动背景，恢复 SillyTavern 默认背景。

---

## 🎵 2. 音频与 BGM 控制 (Audio APIs)

### `api.playBGM(urlOrId, options?): Promise<void>`
播放指定音轨或背景音乐。

- **参数**：
  - `urlOrId` (`string`): 媒体库音频 ID 或直链 URL。
  - `options` (`AudioOptions`，可选)：
    - `volume` (`number`): 播放音量 (0.0 至 1.0)。
    - `loop` (`boolean`): 是否单曲循环。
    - `title` (`string`): 胶囊播放器显示的曲目名称。

```javascript
await window.stBgLoader.playBGM('https://assets.example.com/lofi-rain.mp3', {
    volume: 0.8,
    title: '深夜雨声 Lo-Fi',
    loop: true
});
```

### `api.stopBGM(fadeOutMs = 300): void`
停止播放背景音乐，自带平滑音量渐隐（默认 300ms）。

### `api.togglePlay(): void`
在播放与暂停状态之间切换。

### `api.nextTrack(): void` / `api.prevTrack(): void`
切换至播放列表的下一首 / 上一首曲目。

### `api.setVolume(volume: number): void`
调整主音量 (0.0 ~ 1.0)。

### `api.setMuted(muted: boolean): void`
静音或解除静音。

### `api.setMuffled(muffled: boolean): void` / `api.getMuffled(): boolean`
开启或关闭 **隔壁房间声学模拟** (Lo-Fi 800Hz 动态低通滤波)。

```javascript
// 开启隔壁房间沉浸感低通滤波
window.stBgLoader.setMuffled(true);
```

---

## 🌧️ 3. 微粒天气控制 (Weather APIs)

### `api.setWeather(typeOrOptions, options?): void`
设置当前天气效果。

- **支持的天气类型**：
  - `'off'`：完全关闭，0% CPU 占用
  - `'rain'`：细雨微涟（带地面水花飞溅）
  - `'snow'`：冬日飘雪（正弦波漂移）
  - `'sakura'`：落樱缤纷（三维立体花瓣自转与风向受力）
  - `'cyber_motes'`：赛博霓虹微粒（发光粒子随风浮升）
  - `'scanlines'`：复古 CRT 扫描线（电子阴极射线管质感）

- **参数选项 (`WeatherOptions`)**：
  - `density`: `'low' | 'medium' | 'high'` (微粒密度)
  - `speed`: `number` (速度倍率，0.5 至 2.5)
  - `opacity`: `number` (透明度，0.1 至 1.0)
  - `wind`: `number` (水平风向偏移，-2.0 至 2.0)

```javascript
// 召唤樱花雨
window.stBgLoader.setWeather('sakura', {
    density: 'high',
    speed: 1.2,
    opacity: 0.85,
    wind: 0.8
});

// 关闭天气
window.stBgLoader.setWeather('off');
```

---

## 📊 4. 音频律动与频谱控制 (Visualizer APIs)

### `api.setVisualizer(modeOrOptions): void`
- **模式 (`mode`)**：
  - `'off'`：关闭律动
  - `'pulse'`：低音呼吸律动（背景微缩放与发光联动）
  - `'spectrum'`：底部音频频谱柱状波形

```javascript
window.stBgLoader.setVisualizer({
    mode: 'spectrum',
    color: '#00f0ff',
    sensitivity: 1.2
});
```

---

## 📐 5. 景深与转场控制 (Parallax & Transitions)

### `api.setParallax(enabled: boolean, intensity = 0.3): void`
开启或关闭 2.5D 鼠标/陀螺仪景深视差。

### `api.setTransition(type, durationMs = 400): void`
设置媒体切换时的过渡效果：
- `'fade'`：平滑淡入淡出
- `'zoom_fade'`：缩放推进淡入
- `'blur_fade'`：虚化柔焦渐变
- `'slide_left'`：向左推移
- `'slide_right'`：向右推移

---

## ⚡ 6. 智能场景触发器规则 (Triggers APIs)

### `api.addTriggerRule(rule: TriggerRule): void`
添加自动化场景联动规则。

```javascript
window.stBgLoader.addTriggerRule({
    id: 'cyberpunk_scene',
    name: '赛博朋克酒馆场景',
    enabled: true,
    type: 'character', // 'character' | 'chat' | 'regex'
    pattern: 'CyberLucy',
    action: {
        preset: 'cyberpunk',
        weather: 'cyber_motes',
        bgmUrl: 'https://example.com/neon-ambient.mp3'
    }
});
```

### `api.removeTriggerRule(id: string): void`
根据规则 ID 移除规则。

---

## 🌊 7. 环境白噪音发生器 (Ambient Sound APIs)

### `api.setAmbientSound(typeOrOptions, volume?): void`
播放程序化合成的逼真白噪音，不依赖外部音频文件，可与 BGM 同时并存播放。
- **声音类型 (`type`)**：
  - `'off'`：关闭白噪音
  - `'rain'`：粉红噪声双带通滤波淅沥雨声
  - `'fire'`：低频隆隆声搭配随机木炭噼啪声
  - `'wind'`：LFO 低频正弦调制的空灵夜风
- **音量 (`volume`)**：0.0 至 1.0

```javascript
window.stBgLoader.setAmbientSound('rain', 0.6);
```

### `api.getAmbientSound(): AmbientSoundOptions`
获取当前环境白噪音状态。

---

## 🪟 8. 毛玻璃对话框穿透 (Frosted Glass Chat UI APIs)

### `api.setFrostedChat(enabled: boolean, options?): void`
开启或关闭透明毛玻璃对话气泡增强，使背景视频或粒子穿透显示在聊天消息背后。

```javascript
window.stBgLoader.setFrostedChat(true, {
    blur: 14,      // 模糊度 (0-20px)
    opacity: 70    // 不透明度 (20-100%)
});
```

### `api.getFrostedChat(): { enabled: boolean; blur: number; opacity: number }`
获取当前毛玻璃参数。

---

## 🗺️ 9. 全景视听预设快照 (Scene Snapshots APIs)

### `api.applyScene(sceneId: string): boolean`
一键应用完整场景包（背景 + BGM + 天气 + 滤镜 + 视差 + 白噪音 + 毛玻璃）。
- 内置场景：`cyber_rain`, `cozy_fireplace`, `sakura_shrine`, `winter_cabin`
- 自定义场景：用户保存的任意自定义快照 ID

```javascript
window.stBgLoader.applyScene('cyber_rain');
```

### `api.saveCurrentScene(name: string): SceneSnapshot`
将当前所有视听状态打包保存为一个全新场景快照。

### `api.getScenes(): Record<string, SceneSnapshot>`
获取所有内置和自定义场景列表。

### `api.deleteScene(id: string): boolean`
删除自定义场景（内置场景不可删除）。

### `api.cycleWeather(): WeatherType`
按顺时针快速轮换天气模式 (`off` -> `rain` -> `snow` -> `sakura` -> `cyber_motes` -> `scanlines`)。

---

## ⚡ 10. 流式资源预热预加载 (Preload API)

### `api.preloadMedia(urls, options?): Promise<PreloadResult[]>`
将高分辨率媒体批量预热至本地 `CacheStorage`，后续应用该资源时实现真正的 **0 毫秒秒切**。

```javascript
await window.stBgLoader.preloadMedia([
    'https://assets.example.com/boss-battle.mp4',
    'https://assets.example.com/victory-bgm.mp3'
], {
    concurrency: 2,
    onProgress: (loaded, total, url) => {
        console.log(`[预热进度] ${loaded}/${total}: ${url}`);
    }
});
```

---

### `api.setBackgroundVisible(visible: boolean): void`
控制背景图层的显示与隐藏。隐藏时背景媒体停止呈现但不会终止音频。

### `api.isBackgroundVisible(): boolean`
获取当前背景图层是否可见。

---

## 📡 11. 事件监听总线 (Event Bus)

`window.stBgLoader` 的事件在**三个通道**同步广播，按你的运行环境任选其一：

| 通道 | 监听方式 | 适用场景 |
| --- | --- | --- |
| ① 内部总线 | `api.on(event, cb)` | 同窗口脚本（最全语义） |
| ② 酒馆事件源 | `eventSource.on('st_bgloader:<event>', cb)` | 走酒馆标准事件机制的其他扩展 |
| ③ DOM 自定义事件 | `document.addEventListener('st-bgloader:<event>', e => e.detail.args)` | 零依赖监听（无法拿到 api 引用时） |

```javascript
// 监听媒体变更
const unsub = window.stBgLoader.on('media-change', (mediaItem) => {
    console.log('当前背景已变更:', mediaItem);
});

// 监听曲目变更
window.stBgLoader.on('track-change', (trackItem) => {
    console.log('播放曲目更新:', trackItem);
});

// 监听播放/暂停状态
window.stBgLoader.on('play-state-change', (isPlaying) => {
    console.log('播放状态变更为:', isPlaying);
});

// 取消监听
unsub();
```

### 全量 28 个事件对照表

| 事件名 (`Event Name`) | 回调参数 | 触发时机 |
| --- | --- | --- |
| `media-change` | `(item: MediaItem \| null)` | 背景媒体发生切换或被清空时 |
| `media-error` | `(info: { type: 'image' \| 'video' })` | 已挂载的图片/视频解码失败时（损坏字节、404、不支持的编码） |
| `media-added` | `(item: MediaItem)` | 有媒体通过 API 加入媒体库时 |
| `media-deleted` | `(id: string)` | 有媒体通过 API 从媒体库删除时 |
| `master-switch` | `(enabled: boolean)` | 主开关开启/关闭时（关闭 = 视听同停） |
| `playback-mode-change` | `(mode: 'loop' \| 'single' \| 'shuffle')` | 播放模式切换时 |
| `cache-cleared` | `()` | 缓存与媒体库被整体清空时 |
| `background-visibility-change` | `(visible: boolean)` | 背景图层显隐状态切换时 |
| `track-change` | `(item: MediaItem \| null)` | 当前播放的 BGM 音轨发生切换时 |
| `play-state-change` | `(isPlaying: boolean)` | 音频开始播放或暂停时 |
| `volume-change` | `(volume: number)` | 主音量滑块被调节时 (0.0~1.0) |
| `mute-change` | `(muted: boolean)` | 切换全局静音状态时 |
| `muffle-change` | `(muffled: boolean)` | 隔壁房间低通隔音滤波器开启/关闭时 |
| `filters-change` | `(filters: VisualFilters)` | 模糊/亮度/饱和度/不透明度数值变化时 |
| `preset-change` | `(presetId: string, filters: VisualFilters)` | 应用新的调色预设时 |
| `interactive-change` | `(enabled: boolean)` | HTML/SVG 交互背景鼠标事件穿透开启/关闭时 |
| `weather-change` | `(opts: WeatherOptions)` | 天气类型或粒子风速密度变化时 |
| `visualizer-change` | `(opts: VisualizerOptions)` | 音频律动模式或灵敏度变化时 |
| `parallax-change` | `(parallax: { enabled: boolean; intensity: number })` | 2.5D 景深视差开启/关闭或强度变化时 |
| `transition-change` | `(type: TransitionType, durationMs: number)` | 转场特效类型或过渡时长变化时 |
| `trigger-rules-change`| `(rules: TriggerRule[])` | 场景自动化触发器规则新增、编辑或删除时 |
| `ambient-sound-change` | `(opts: AmbientSoundOptions)` | 环境白噪音类型或音量发生改变时 |
| `frosted-chat-change` | `(opts: { enabled: boolean; blur: number; opacity: number })` | 对话框毛玻璃通透度参数变化时 |
| `scene-change` | `(sceneId: string)` | 激活全新的全景视听场景时 |
| `scenes-change` | `(scenes: Record<string, SceneSnapshot>)` | 场景快照列表更新（新增或删除）时 |
| `preload-progress` | `(completed: number, total: number, currentUrl: string)` | 批量预热流式资源进度更新时 |
| `preload-complete` | `(results: PreloadResult[])` | 批量预热全部完成时 |
| `settings-sync` | `(settings: BgLoaderSettings)` | 全局配置持久化保存或跨设备同步完成时 |

---

## 🧭 12. 端点发现接口 (Discovery APIs)

供调用方做特性检测，避免硬编码版本判断。

### `api.getApiVersion(): { api: number; plugin: string }`
返回 API 协议版本（当前 `2`）与插件版本。

### `api.getCapabilities(): { api, postMessageBridge: boolean, eventChannels: string[], categories: Record<string, string[]> }`
能力表：桥是否在位、可用事件通道、按分类聚合的端点清单。

### `api.listMethods(): string[]`
全部白名单端点方法名（与 `EndpointRegistry` 登记表同源，`st-bgloader:postMessage` 桥只放行此清单）。

---

## 📚 13. 媒体库管理端点 (Media Library APIs)

### `api.uploadMedia(blob, name?, type?): Promise<MediaItem>`
把一个 `Blob`/`File` 存入媒体库（与设置面板上传同路径，落服务端原生目录）。`type` 省略时按文件名自动嗅探。

### `api.deleteMedia(id): Promise<boolean>`
删除媒体并联动清理播放面（正作背景则清背景、正在播放则停轨、刷新播放列表）。删除不存在项返回 `false` 不抛错。

### `api.getMediaInfo(id): Promise<MediaItem | null>`
按 id 取媒体条目详情（副本，改动不影响插件状态）。

### `api.getMediaUrl(id): Promise<string | null>`
取一个本会话内可复用的 `blob:` URL（供其他插件直接渲染该媒体；生命周期由 CacheManager 管理，跨会话无效）。

---

## 🎛️ 14. 播放列表与主开关端点 (Playlist & Master APIs)

### `api.getPlaylist(): MediaItem[]`
当前 BGM 播放列表（副本）。

### `api.setPlaybackMode(mode: 'loop' | 'single' | 'shuffle'): void`
设置播放模式；非法值抛 `INVALID_PARAMS`。

### `api.jumpToTrack(index: number): Promise<boolean>`
跳到播放列表第 `index` 首并播放；越界返回 `false`。

### `api.setMasterEnabled(enabled: boolean): void` / `api.isEnabled(): boolean`
主开关（关闭 = 背景与 BGM/环境音同停，P2-5 语义）。

---

## ⚙️ 15. 设置读写端点 (Settings APIs)

### `api.getSettings(): BgLoaderSettings`
只读深拷贝快照。

### `api.updateSettings(patch): BgLoaderSettings`
合并更新：patch 与当前设置合并后走与设置面板/远端收敛**同一条**应用路径（子系统全量同步 + 两个抽屉回填），不会旁路 UI。

### `api.exportSettings(): BgLoaderSettings` / `api.importSettings(payload): BgLoaderSettings`
导出快照 / 整体导入（走 `mergeSettings` 收敛，非法结构回退默认值）。

---

## 💾 16. 缓存与运行时数据端点 (Cache & Runtime Data APIs)

### `api.getCacheStats(): Promise<{ usedBytes, itemCount, quotaBytes, lruAutoClean }>`
缓存用量统计（含配额与自动清扫开关状态）。

### `api.clearCache(): Promise<void>`
清空缓存与媒体库（**破坏性端点**，等同设置面板清空按钮）。

### `api.getVisualizerData(): number[]`
当前频谱快照（0–255 字节数组副本）。未播放/不支持时返回 `[]`，永不挂起——供其他插件做自己的可视化。

---

## 🌉 17. 跨 iframe PostMessage 桥（酒馆助手脚本接入）

酒馆助手（TavernHelper / JS-Slash-Runner）等脚本运行在 **iframe** 内，拿不到 `window.stBgLoader`。本插件在宿主窗口监听 postMessage 请求，任何 iframe 内脚本可直接调用**全部白名单端点**（`listMethods()` 清单）。

**帧协议**（`source` 恒为 `'st-bgloader'`）：

```text
请求  { source:'st-bgloader', kind:'request',  id, method, params?: any[] }
响应  { source:'st-bgloader', kind:'response', id, result? } | { ..., error: { code, message } }
事件  { source:'st-bgloader', kind:'event',    event, args: any[] }
```

- `id` 由调用方生成，**同一 id 本会话内永远只回一次**（并发与先后重发都忽略）；
- 任何方法 30s 内必须返回，超时回 `error.code = 'InvokeError'`（消息含 `BRIDGE_TIMEOUT`）；
- 错误码：`UnknownMethod`（不在白名单）/ `InvalidParams` / `InvokeError`；
- 事件推送只发给**近 60 秒内成功调用过**的 iframe（隐式订阅，无需注册）。

**客户端样板**（直接粘进酒馆助手脚本）：

```javascript
(async () => {
    const pending = new Map();
    window.addEventListener('message', (ev) => {
        const d = ev.data;
        if (d?.source !== 'st-bgloader' || d.kind !== 'response') return;
        const p = pending.get(d.id);
        if (!p) return;
        pending.delete(d.id);
        d.error ? p.reject(new Error(`${d.error.code}: ${d.error.message}`)) : p.resolve(d.result);
    });
    let seq = 0;
    const call = (method, ...params) => new Promise((resolve, reject) => {
        const id = `bg_${Date.now()}_${seq++}`;
        pending.set(id, { resolve, reject });
        window.parent.postMessage({ source: 'st-bgloader', kind: 'request', id, method, params }, '*');
        setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('timeout')); } }, 35000);
    });

    // —— 用法示例 ——
    console.log(await call('getApiVersion'));               // { api: 2, plugin: '…' }
    await call('setBackground', 'bg_id_or_url');
    await call('setWeather', 'rain');
    await call('setVolume', 0.4);
    const state = await call('getPlaybackState');
    console.log('当前状态:', state);
})();
```


