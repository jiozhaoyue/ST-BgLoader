# PRD: Preload Engine for Zero-Latency Asset Caching (Phase 4)

## 1. Goal

作为富媒体基建引擎的核心扩展，实现流式静默预加载系统 (`preloadMedia`)。
角色卡或脚本可在对话开始前或后台提前发起资源的预载指令。插件通过 `CacheStorage` 在后台分片/流式拉取大体积视频 (`.mp4`, `.webm`)、音频 (`.mp3`, `.wav`) 或沙箱页面，并持久化到浏览器离线存储中。
当角色后续切换场景时，背景和音乐将以零网络延迟（0ms 等待）秒速挂载，杜绝黑屏闪烁和卡顿。

---

## 2. Technical Decisions

1. **零耦合纯净设计**：
   - 不依赖、不过度耦合 SillyTavern 内部未稳定公开的 Slash Command 或命令解析器。
   - 聚焦高内聚的 JavaScript SDK：统一收敛在 `window.stBgLoader.preloadMedia(urls, options)`。
2. **多并发与流式预热**：
   - 接受单 URL、URL 数组或包含元数据的对象数组。
   - 针对重复预载进行哈希与 URL 幂等性校验，避免多余的网络消耗。
   - 提供预载进度监听与就绪状态返回：`{ url: string, success: boolean, size: number, cached: boolean }`。
3. **与 MediaMount 及 AudioEngine 联动**：
   - 当 `setBackground(url)` 或 `playBGM(url)` 被调用时，优先直接从 `CacheStorage` 命中并复用已生成的 Blob URL，实现纯瞬时切换。

---

## 3. Requirements

### 3.1 `CacheManager.preload(url: string)` 核心流式拉取
- 通过 `fetch` 获取远端资源流，自动计算大小与 MIME 类型。
- 写入 `CacheStorage`（`st-bg-cache-v1`）并记录到 `IndexedDB`。
- 如果资源已存在于缓存，直接标记为已缓存（`cached: true`）并更新 LRU 时间戳。

### 3.2 `PublicAPI.preloadMedia(urls, options)`
- 支持批量并发控制（默认并发度 3，防止阻塞主线程与 ST 主网络请求）。
- 支持进度回调 `onProgress(loaded, total, currentUrl)`。
- 触发全局事件 `preload-progress` 和 `preload-complete`。

---

## 4. Acceptance Criteria
- [x] 调用 `stBgLoader.preloadMedia(urls)` 能在后台静默将远端资源写入 CacheStorage 与 IndexedDB。
- [x] 重复预载相同 URL 时不会重复拉取，直接命中本地缓存。
- [x] 预载后的视频/音频在被 `setBackground` 或 `playBGM` 调用时无网络请求，瞬间渲染。
- [x] 扩展测试套件，在 `tests/e2e.mjs` 中添加预加载专项验证并实现全绿通过。
