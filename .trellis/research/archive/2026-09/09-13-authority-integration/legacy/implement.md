# Implement: 存储倒置重构执行计划

> 依赖: `design.md`（架构与接口契约）、`research/sdk/`（SDK 精确签名）

## Phase A — 源端抽象抽取（零行为变化）

1. 新建 `src/backend/MediaOrigin.ts`：`MediaPutInput` / `MediaOrigin` 接口。
2. 新建 `src/backend/LocalOrigin.ts`：现 `CacheManager.ts` 的 CacheStorage+IndexedDB 逻辑整体迁入，
   方法一一对应接口；`MediaItem` 生成逻辑不动。
3. 重写 `src/cache/CacheManager.ts` 为门面：持 `origin: MediaOrigin` + L1 CacheStorage；
   local 模式下所有方法直通 LocalOrigin（L1=源端），对外行为与今天一致。
4. `src/index.ts` 构造处暂以 `new CacheManager()`（默认 local origin）跑通。
5. ✅ 门：`npm run build` 通过；24 项 E2E 全绿（无 Authority 环境）。

## Phase B — Authority 源端

1. 新建 `src/backend/AuthorityBridge.ts`：detect/init/能力位/一次性降级提示（localStorage 旗标）。
2. 新建 `src/backend/AuthorityOrigin.ts`：
   - `sql.migrate` 建 `media_items`（v1，见 design 3.4）；
   - `putMedia` = blob.put(base64, contentType) → sql.exec INSERT；
   - `readMedia` = blob.get(blob_id) → base64 → Blob；
   - `touchMedia` 防抖 UPDATE；`findByUrl` SELECT。
3. `CacheManager.init(bridge)`：bridge 可用 → AuthorityOrigin；否则 LocalOrigin。
4. L1 语义按 design 3.5 分叉：云模式 cacheKey=`/st-bg-cache/<blob_id>`，cleanLRU 仅逐 L1。
5. ✅ 门：build 通过；类型无 any 泄漏到调用方。

## Phase C — 本地→云端迁移

1. `src/backend/Migration.ts`：后台逐条 `localOrigin.readMedia → authorityOrigin.putMedia`，
   幂等跳过已存在（按 id SELECT），kv 记 `migration:local-to-cloud:v1` 完成；toastr 进度。
2. `CacheManager.init` 成功连云后触发（不 await，不阻塞首帧）。

## Phase D — 设置/场景云同步

1. 新建 `src/backend/SettingsSync.ts`：本地先行、防抖 2s 推 KV `settings:v1`
   （含 revision + fingerprint）；启动拉取比对；`events.subscribe` 收 `settings.remote-change`
   应用（revision 高者胜，fingerprint 相同跳过）。
2. `src/index.ts` 接线：`saveSettings` 后调 `settingsSync.push`；远端应用走现有
   `settingsDrawer` 刷新 + 各子系统 setter。
3. `sql.backup` 延迟任务：每日备份目录库（jobs.create('sql.backup')）。

## Phase E — 服务端导入回退

1. 新建 `src/backend/RemoteImporter.ts`：直连失败（CORS）→ `http.fetch` → Blob →
   `origin.putMedia(source:'url', remoteUrl)`。
2. AuthorityBridge 增量补充 hostname 声明并重 init（SDK init 幂等，已验证 map+lock）。

## Phase F — Agent 氛围工具（默认关）

1. 新建 `src/backend/AgentBridge.ts`：`agentToolsEnabled`（默认 false）开启时
   `registerTools`（stbg_* 六工具，risk low, no workspace change）+ claim 循环 + submitResult，
   执行体全部映射 `PublicAPI`。
2. SettingsDrawer 增加开关与说明。

## Phase G — UI 与文档

1. SettingsDrawer「云端」区块：能力位状态、迁移/同步进度、L1 配额、Agent 开关。
2. README + wiki 增补 Authority 集成章节（安装依赖、权限声明、能力矩阵）。

## 验证

- 每 Phase 结束 `npm run build` + 现有 E2E。
- 新增 `tests/authority.mjs`：有 Authority 跑云断言（上传入云/清 L1 自动回拉/双页签同步/迁移幂等），
  无 Authority 整套 skip。
- 最终 `npm test` 全绿后提交推送。
