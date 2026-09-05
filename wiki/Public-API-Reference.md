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

## 📡 8. 事件监听总线 (Event Bus)

```javascript
// 监听媒体变更
const unsub = window.stBgLoader.on('media-change', (mediaItem) => {
    console.log('当前背景已变更:', mediaItem);
});

// 监听曲目变更
window.stBgLoader.on('track-change', (trackItem) => {
    console.log('播放曲目更新:', trackItem);
});

// 取消监听
unsub();
```

**支持的事件列表**：
`media-change`, `track-change`, `play-state-change`, `volume-change`, `mute-change`, `muffle-change`, `weather-change`, `visualizer-change`, `parallax-change`, `transition-change`, `preload-progress`, `preload-complete`
