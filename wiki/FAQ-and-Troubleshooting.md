# FAQ & Troubleshooting (常见问题与故障排查)

---

## ❓ 常见问题 (FAQ)

### Q1: 为什么刚打开页面时，带声音的视频或音乐默认没有声音？
**答**：这是现代主流浏览器（Google Chrome、Edge、Safari、Firefox）的安全限制（**Autoplay Policy**）。浏览器严禁任何页面在未经用户交互（鼠标点击或键盘敲击）前发出大声音。
**ST-BgLoader 的优化对策**：
- 系统会自动静音播放以保证视频/动画正常渲染；
- 你只需在页面任意位置点击一下鼠标、敲击一下键盘或发送一条消息，插件内置的手势监听器会立即捕捉并以 **400ms 平滑渐变淡入**唤醒声音，避免突兀刺耳！

---

### Q2: 导入网络 URL 时提示 CORS 跨域错误怎么办？
**答**：某些第三方图床或视频站点配置了严格的防盗链（缺少 `Access-Control-Allow-Origin: *` 响应头）。
- **解决方案 1**：建议直接将视频/音频文件下载到本地，然后通过拖拽上传方式直接存入 ST-BgLoader 的本地持久化离线缓存；
- **解决方案 2**：使用支持公共 CORS 访问的图床（如 Catbox、Imgur 等）。

---

### Q3: 为什么切换某些视频会有轻微黑边？
**答**：ST-BgLoader 完全继承并同步 SillyTavern 原生的背景填充规则（Cover、Contain、Stretch、Center）。
- 如果你的视频比例（如 21:9）与当前浏览器窗口比例（如 16:9）不一致且处于 `contain` 模式，周围自然会显示留白；
- 建议在 SillyTavern 主界面将背景填充模式切换为 **Cover (裁剪填满)**，画面将自适应居中铺满全屏。

---

### Q4: 开启天气特效后，老旧电脑发热或掉帧怎么办？
**答**：ST-BgLoader 遵循严格的零开销解耦原则：
- 在设置抽屉中将 **Weather** 设为 **Off**，微粒引擎会彻底注销 `requestAnimationFrame` 动画帧，**CPU 占用瞬间归零**；
- 或者将 Weather 的 **Density (密度)** 调整为 **Low (稀疏)**，减少 50% 粒子计算量。

---

### Q5: 如何在不同设备或浏览器之间同步我的背景预设和触发器规则？
**答**：
1. 打开 **ST-BgLoader** 设置面板；
2. 滚到最底部 **Backup & Cache** 区域；
3. 点击 **Export Settings JSON**，系统将自动下载包含所有滤镜预设、天气设置与场景触发规则的 `.json` 配置文件；
4. 在另一台设备上点击 **Import Settings JSON** 并选择该文件，一秒无损迁移！

---

## 🛠️ 开发者控制台自检指令 (Console Diagnostics)

按 `F12` 打开浏览器控制台，可运行以下命令快速自检插件状态：

```javascript
// 1. 检查插件是否已正确就绪
console.log(window.STBgLoader.isInitialized); // 应输出 true

// 2. 查看当前播放状态与滤镜
console.log(window.stBgLoader.getPlaybackState());

// 3. 查看本地缓存空间占用
window.STBgLoader.getCacheManager().getCacheUsage().then(console.log);

// 4. 手动切换天气排查
window.stBgLoader.setWeather('rain');
```
