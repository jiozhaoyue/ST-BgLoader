# Character Card Integration Guide (角色卡集成指南)

作为角色卡（Character Card / V2 PNG）或世界书（Lorebook）创作者，你可以直接利用 ST-BgLoader 为你的角色赋予电影级的背景动态视听盛宴！

---

## 💡 优雅降级原则 (Graceful Degradation)

在编写任何针对 ST-BgLoader 的脚本前，务必遵循优雅降级规范：

```javascript
// 检查宿主 SillyTavern 是否安装了 ST-BgLoader
if (typeof window.stBgLoader !== 'undefined') {
    // 启用 ST-BgLoader 富媒体特性
} else {
    // 降级使用 SillyTavern 原生静态背景或默认展示
}
```
这样即便玩家未安装本插件，角色卡也不会抛出任何控制台红字，保障 100% 兼容性。

---

## 🎨 场景 1：在开场白 (First Message) 中初始化氛围

在角色卡的开场白（Greeting / First Message）末尾，可以嵌入隐藏的 HTML `<script>` 标签（或配合 QuickReply/QR 宏）：

```html
<script>
(async () => {
    if (!window.stBgLoader) return;

    // 1. 预热高质量 4K 视频背景与 BGM
    await window.stBgLoader.preloadMedia([
        'https://assets.mycard.org/characters/alice/room-night.mp4',
        'https://assets.mycard.org/characters/alice/piano-theme.mp3'
    ]);

    // 2. 切换背景并开启 2.5D 景深视差
    await window.stBgLoader.setBackground('https://assets.mycard.org/characters/alice/room-night.mp4', {
        name: '爱丽丝的静谧书房',
        saveToLibrary: true
    });
    window.stBgLoader.setParallax(true, 0.4);

    // 3. 播放主题曲并加上窗外小雨天气
    await window.stBgLoader.playBGM('https://assets.mycard.org/characters/alice/piano-theme.mp3', {
        volume: 0.7,
        loop: true,
        title: 'Alice - Night Piano'
    });
    window.stBgLoader.setWeather('rain', { density: 'low', speed: 1.0, opacity: 0.6 });
})();
</script>
```

---

## 🗺️ 场景 2：在世界书 (Lorebook / World Info) 中绑定地点

如果你构建了一个庞大的 RPG 世界书，可以在特定词条（例如 `“精灵之森”`、`“蒸汽朋克酒吧”`）的内容中嵌入执行脚本：

### 词条：`“暗夜森林 (Shadow Forest)”`
- **激活关键词**：`暗夜森林, 迷雾森林, 枯树林`
- **词条内容**：
  ```markdown
  周围是参天古木，阴冷的雾霭在地面弥漫...
  <script>
  if (window.stBgLoader) {
      window.stBgLoader.applyPreset('cinema_dark');
      window.stBgLoader.setWeather('snow', { density: 'medium', speed: 0.8 });
  }
  </script>
  ```

---

## 🎮 场景 3：HTML5/Canvas 可交互小游戏背景

ST-BgLoader 支持完整的网页与交互穿透。你可以挂载一个完整的 HTML5 场景或小游戏（例如像素风格篝火、3D 捏脸房间）：

```javascript
await window.stBgLoader.setBackground('https://mygames.org/pixel-campfire.html', {
    interactive: true, // 允许玩家鼠标直接在背景点击拾取柴火、点燃营火
    name: '交互式营地篝火'
});
```

玩家在打字聊天的同时，还能与背景产生真实的物理交互！
