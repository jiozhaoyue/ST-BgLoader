# Implementation Plan: Preload Engine

## Phase 1: CacheManager Preload Capability
- [x] 在 `src/cache/CacheManager.ts` 中实现 `preloadMediaUrl(url: string, type?: MediaType): Promise<MediaItem>`：
  - 检查是否已有缓存项。
  - 通过 `fetch` 获取数据并写入 `CacheStorage` 与 `IndexedDB`。
  - 更新 LRU 时间戳。

## Phase 2: PublicAPI Preload Interface
- [x] 在 `src/api/PublicAPI.ts` 中增加 `preloadMedia(urls: string | string[], options?: PreloadOptions): Promise<PreloadResult[]>`。
- [x] 支持并发限制与进度回调，触发 `preload-progress` 与 `preload-complete` 事件。

## Phase 3: Types & Documentation
- [x] 在 `src/types/index.ts` 中导出 `PreloadOptions` 与 `PreloadResult` 类型。
- [x] 更新 `README.md`，添加预加载使用示例。

## Phase 4: Build & E2E Automated Verification
- [x] 编译生产包 `npm run build`。
- [x] 在 `tests/e2e.mjs` 中添加预加载测试用例，执行全量自动化测试。
