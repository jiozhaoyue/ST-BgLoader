# ST-BgLoader 逐项故障排查

> 本文按症状逐项给出可操作的排查步骤。
> 每步都对应实现中的真实机制；控制台命令见文末喵。

---

## 症状一：背景不显示

1. **查总开关**：在 Extensions 面板确认主开关为「已启用」，状态胶囊显示「已启用」（`SettingsDrawer.ts:49-53`）。停用时插件释放接管、还原宿主原生背景。
2. **查显示状态**：点顶栏抽屉眼睛按钮确认背景未被隐藏；图标为睁眼表示可见（`TopbarBackgroundDrawer.ts:239-241`）。
3. **查是否清除**：确认未误点顶栏清除按钮（`:242-244`）。
4. **查媒体应用**：在「媒体」Tab 单击目标卡片重新应用；图片与视频渲染器分别处理不同格式。
5. **查接管级别**：原生背景接管有 `off / non-image / all` 三档（`types/index.ts:11`）；`off` 不拦截原生背景，需在设置中调整。
6. **查服务源**：媒体来自服务端 `backgrounds/` 目录；服务端不可用时应走纯前端主路径（D-03 适配器静默降级），仍不显示再看控制台日志。

---

## 症状二：黑屏 / 画面异常

1. **区分留白与黑屏**：若仅有黑边，是填充模式不匹配——把宿主背景填充改为 Cover（`FAQ-and-Troubleshooting.md:23-26`）。
2. **查视频解码**：只支持 MP4/WebM 硬件直解；不支持的编码会失败，换标准编码文件重试。
3. **查自动播放**：视频 `autoplay` 遇阻时会自动改静音重试（`VideoRenderer.ts:73-78`）；点击页面任意处恢复声音。
4. **查场景滤镜**：设置里的滤镜 `blur` 取值范围 0–20px（`types/index.ts:14`）；模糊过大可能像黑屏，调回 0。
5. **查背景透明度**：滤镜 `opacity`（`types/index.ts:31-56` 的 filters）设为 0 会导致不可见，恢复正常值。
6. **查缓存**：缓存配额过小会导致媒体反复加载失败；在设置 Tab 备份/缓存分组调大配额或开启自动清理。

---

## 症状三：音频不播 / 没有声音

1. **浏览器自动播放策略**：首次加载时带声音的媒体被浏览器拦截，属正常现象（`FAQ-and-Troubleshooting.md:7-12`）。点击页面任意处或发一条消息，插件用手势监听以 400ms 平滑淡入声音（`AudioEngine.ts:89,529`）。
2. **查静音降级**：视频自动播放失败时会自动静音重试（`VideoRenderer.ts:75-78`）；此时需手动解除静音。
3. **查后台暂停**：设置开启「后台暂停」后，切到后台会暂停音频与附着视频（`AudioEngine.ts:606-625`）；回到前台自动恢复。若不希望暂停，关闭该项（`TopbarBackgroundDrawer.ts:441`）。
4. **查音量与模式**：确认音量非 0，播放模式为所需值（循环 / 单曲 / 随机，`types/index.ts:3`）。
5. **查音频上下文**：手势触发会恢复 AudioContext（`AudioEngine.ts:93-95`）；仍无声时点一下页面再试。
6. **查白噪音**：环境音类型设为 off 时无程序化白噪音（`types/index.ts:237`）。

---

## 症状四：自动轮播不工作

按顺序核对四条硬约束（`types/index.ts:181-183`）：

1. **开关**：「设置」Tab 音频分组勾选「自动轮播」（`TopbarBackgroundDrawer.ts:447`）。
2. **列表数量**：BGM 列表少于 2 首时不计时轮播。
3. **播放状态**：未在播放时不计时轮播。
4. **播放模式**：单曲 `single` 模式不轮播（用户意图是单曲循环）；改用循环 `loop` 或随机 `shuffle`。
5. **间隔时长**：轮播间隔 30–3600 秒、默认 300 秒（`PublicAPI.ts:285`），界面以分钟输入 1–60（`TopbarBackgroundDrawer.ts:450-451`）。间隔设得过长会看似无反应。
6. **淡入淡出**：时长 0–2000ms、默认 800ms（`PublicAPI.ts:286`）；设为 0 是硬切，不是故障。
7. **控制台复核**：运行 `window.stBgLoader.getBgmAutoAdvance()`（端点见 `EndpointRegistry.ts` 的 `bgm-auto-advance-change` 关联）核对生效值。

---

## 症状五：移动端异常

1. **确认断点表现**：≤1000px 面板放开高度上限、网格限高 40vh；<450px 网格列 96px、工具条折行（`07-responsive.css:9-38`）。与此不符通常是自定义样式覆盖了响应式规则。
2. **触摸目标**：所有快捷钮 Tab、场景快切、mini 按钮触摸目标 ≥36px（`00-tokens.css:44`）；点不中多为外部 CSS 降低了 `min-height`。
3. **滚动穿透**：顶栏主体、媒体网格、触发器列表设 `overscroll-behavior:contain`（`07-responsive.css:47-51`）；滚动穿透宿主页面说明该规则被覆盖。
4. **全屏接管**：窄屏由宿主把抽屉置 100dvw（`07-responsive.css:5`）；全屏异常优先排查宿主抽屉样式，而非插件。
5. **动效过冲**：系统开启「减弱动态效果」时插件移除自身过渡（`07-responsive.css:56-65`）；若动画仍在，检查系统设置是否被应用读取。
6. **无 UA 嗅探**：本插件不区分手机 UA，桌面窄窗与手机走同一断点（`07-responsive.css:4`）；桌面复现即可辅助定位。

---

## 症状六：性能问题（发热 / 掉帧）

1. **关闭天气**：天气设「关闭」时粒子引擎注销动画帧、CPU 归零（`FAQ-and-Troubleshooting.md:30-33`）；六档选项见 `types/index.ts:94,102-109`。
2. **降密度**：把天气密度调为 Low，减少约一半粒子计算。
3. **关闭律动**：可视化模式设 off（`types/index.ts:110`），停止频谱/呼吸重绘。
4. **后台休眠**：切换后台标签时，天气与频谱立即中止 rAF 循环（监听在 `index.ts:409-413`，实现在 `AtmosphereFX.ts:236` 与 `AudioVisualizer.ts:167`）；后台仍高占用说明可见性监听未生效。
5. **隐藏背景**：隐藏背景或停用扩展时粒子与频谱画布停止循环（`FAQ-and-Troubleshooting.md:31-33`）。
6. **清理缓存**：缓存配额 `cacheQuotaMB` 与自动清理 `lruAutoClean`（`types/index.ts:189-190`）；缓存过大时调小配额并开启自动清理。
7. **扫描线优化**：扫描线用 1x4 离屏 Pattern 单次填充替代每帧 300 次绘制（`.trellis/spec/frontend/host-native-ui.md:337`）；若仍卡顿，关掉扫描线特效。

---

## 控制台自检（F12）

以下方法均为公开 API（`PublicAPI.ts`；详见 [Public API Reference](Public-API-Reference.md)）：

```javascript
// 查看当前播放状态与全套视听参数
console.log(window.stBgLoader.getPlaybackState());   // PublicAPI.ts:613

// 查看当前已加载的媒体列表
window.stBgLoader.getMediaList().then(console.log);  // PublicAPI.ts:634

// 手动切换天气排查
window.stBgLoader.setWeather('rain');                // PublicAPI.ts:346

// 测试隔壁房间 Lo-Fi 低通滤波器
window.stBgLoader.setMuffled(true);                  // PublicAPI.ts:265

// 查询自动轮播当前生效值
window.stBgLoader.getBgmAutoAdvance();               // PublicAPI.ts:294
```

---

## 相关文档
- [用户使用指南](User-Guide.md)
- [全形态 × 分辨率断点差异矩阵](Form-Factor-Matrix.md)
- [常见问题与排查](FAQ-and-Troubleshooting.md)
- [性能优化与缓存体系](Performance-and-Caching-Guide.md)

*本文排查步骤均对应上列实现机制；无实现的诊断项未写入喵。*
