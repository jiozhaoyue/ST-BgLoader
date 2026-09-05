# PRD: Large File Streaming & Extreme Format Stress Testing (Phase 5)

## 1. Goal

针对实际高负载场景，对 ST-BgLoader 进行极限压力测试与极端边缘案例验证：
验证 100MB+ 超大体积媒体流在浏览器环境下的持久化写入速度、磁盘缓存流式读取稳定性、JS 堆内存控制、高并发预载、以及 500ms 内极速切歌/切背景下的双缓冲竞态与内存泄漏防范。

---

## 2. Test Dimensions

1. **超大文件流式存储测试 (100MB+ Large File Streaming)**：
   - 生成 100MB+ 二进制视频流数据，模拟 4K 60FPS 超清动态背景。
   - 检验 `CacheStorage` 流式持久化性能，确认非内存驻留（流式写入磁盘，避免 OOM 崩溃）。
   - 验证生成 Blob URL 及 `MediaMount` 挂载就绪耗时。
2. **极速切换高频压力测试 (Rapid Switch & Race Condition Stress)**：
   - 在 1 秒内连续发出 10 次跨媒体切换指令（视频 -> 音频 -> HTML沙箱 -> 图像 -> 视频）。
   - 验证双缓冲层（Layer A/B）在过渡动画被频繁打断时的竞态处理，确保不会出现重叠残影或僵尸渲染器。
3. **异常与损坏媒体容错测试 (Corrupted Media & Resilience)**：
   - 载入 0 字节文件、损坏媒体流、无效 404 URL。
   - 确保插件捕获错误并平稳降级，严防主界面白屏或未捕获异常。
4. **内存泄漏与 Blob URL 生命周期审计 (Memory Leak & Resource Disposal)**：
   - 跟踪 `URL.createObjectURL` 与 `URL.revokeObjectURL` 的配对释放。
   - 监测 DOM 节点与已挂载 `<video>` / `<iframe>` 实例的销毁完整性。

---

## 3. Acceptance Criteria
- [x] 100MB+ 超大文件成功流式写入 CacheStorage，内存未发生 OOM 崩溃。
- [x] 连续高频快速切换（10次/秒）无报错，最终状态正确，未留存孤儿视频或音频元素。
- [x] 损坏媒体与 404 远端资源优雅降级，错误被正确捕获并在控制台给出友好告警。
- [x] 所有临时创建的 Blob URL 在删除或覆盖后均被及时 revoke，无内存泄露。
- [x] 编写专门的压力测试脚本并在真实测试环境中全项通过。
