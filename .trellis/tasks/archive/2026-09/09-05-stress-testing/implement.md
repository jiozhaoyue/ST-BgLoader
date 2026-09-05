# Implementation Plan: Large File & Resilience Stress Testing

## Phase 1: Robustness Hardening in Source
- [x] 在 `src/core/MediaMount.ts` 增加快速切换下的定时器取消与重入保护（防止 450ms 过渡期内多次切图导致图层状态错乱）。
- [x] 在 `src/renderers/VideoRenderer.ts` 增加 `error` 事件侦听与释放防护。
- [x] 检查 `src/cache/CacheManager.ts`，确保 `URL.revokeObjectURL` 在媒体替换或清理时严格调用。

## Phase 2: Create Dedicated Stress Test Suite
- [x] 创建 `tests/stress.mjs`：
  - 测试 1：100MB+ 大文件流式存储与挂载测试。
  - 测试 2：极速连续切换（10次/秒）重入与竞态消除测试。
  - 测试 3：异常与无效 URL 容错性测试。
  - 测试 4：Blob URL 与 DOM 节点生命周期审计。

## Phase 3: Build & Execution
- [x] 运行 `npm run build` 产出最新代码。
- [x] 执行 `node tests/stress.mjs`，在真实 SillyTavern 环境中跑完全部压力用例。
