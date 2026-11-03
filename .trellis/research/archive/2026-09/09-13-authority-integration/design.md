# Design: 存储倒置重构 —— Authority 后端为媒体库源端

> 任务: 09-13-authority-integration
> 决策来源: 用户确认「背景媒体本就应存后端存储，现浏览器优先架构是错的，重构」；
> 实现前先出 design.md；Authority 缺席/权限被拒时静默降级 + 提示一次。

## 1. 问题陈述

当前 `src/cache/CacheManager.ts` 把 **浏览器 CacheStorage 当作媒体唯一事实源**，IndexedDB 存元数据，
设置存 localStorage。后果：

- 媒体困在单浏览器 profile：换设备、换浏览器、清站点数据即全部丢失；
- 受浏览器配额约束，LRU 驱逐会**永久删除**用户媒体；
- 无法跨端同步场景/设置/播放列表；
- 远程导入受 CORS 限制。

Authority（服务端插件）已验证可提供 `storage.blob`（自动分块大文件）、`sql.private`（迁移/事务）、
`storage.kv`、`events.stream`(SSE)、`http.fetch`、`agent.browser` 能力（见 `research/sdk/client.ts` 精确签名）。

**重构原则：存储倒置。后端（Authority）是源端（Origin），浏览器只是缓存（L1）。**

## 2. 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│ 调用方（index.ts / SettingsDrawer / PublicAPI / SceneManager │
│ / AudioEngine / TriggerManager）—— 公共 API 完全不变         │
└──────────────────────────┬──────────────────────────────────┘
                           │ CacheManager 现有方法签名不变
┌──────────────────────────▼──────────────────────────────────┐
│ CacheManager（重构为"库门面"，类名/方法名保留，调用点零改动）  │
│  saveMedia:      写穿 Origin(源端) → 回填 L1(热缓存)         │
│  getMediaBlobUrl: L1 命中→播放；未命中→Origin 读→回填 L1→播放 │
│  listMedia/getMedia: 读 Origin 目录（源端是唯一目录）         │
│  deleteMedia:    删 Origin + 删 L1                           │
│  cleanLRU:       云模式下仅逐 L1，源端永不驱逐                │
└───────┬────────────────────────────────┬────────────────────┘
        │ bridge.available === true      │ bridge.available === false
┌───────▼────────────────┐  ┌────────────▼────────────────────┐
│ AuthorityOrigin        │  │ LocalOrigin（现 CacheManager    │
│  源端二进制: blob       │  │ 逻辑原样下沉）                   │
│  源端目录: sql.private  │  │  二进制: CacheStorage           │
│  (迁移/事务)            │  │  元数据: IndexedDB              │
└────────────────────────┘  └─────────────────────────────────┘
        │
        ├─ SettingsSync:  设置/场景 kv 镜像 + SSE 应用远端变更（本地先行）
        ├─ RemoteImporter: 直连 fetch 失败(CORS) → authority.http.fetch 回退
        └─ AgentBridge(P2): agent.browser 注册氛围工具（默认关）
```

### 2.1 为什么保留 CacheManager 类名与方法签名

`SettingsDrawer`、`index.ts`、`PublicAPI`、`SceneManager`、`AudioEngine` 共 6 处调用
`cacheManager.listMedia/getMedia/saveMedia/getMediaBlobUrl/deleteMedia/cleanLRU/preloadUrl/clearAll`。
门面保签名 = 重构波及面限定在 `src/cache/` 与新增 `src/backend/`，回归风险最小。

## 3. 新增模块与接口

### 3.1 `src/backend/AuthorityBridge.ts` — 连接与能力位

```ts
export interface AuthorityCapabilities {
    available: boolean;        // SDK 检测 + init 成功
    cloudLibrary: boolean;     // storage.blob + sql.private 可用
    sync: boolean;             // storage.kv + events.stream 可用
    serverFetch: boolean;      // http.fetch 可用（按声明的 hostname）
    agentTools: boolean;       // agent.browser 可用（默认关闭，见 3.6）
    degradedReason?: 'sdk-missing' | 'init-failed' | 'permission-denied';
}

export class AuthorityBridge {
    static EXTENSION_ID = 'third-party/ST-BgLoader';
    async detectAndInit(): Promise<AuthorityCapabilities>;  // 永不 throw
    getClient(): AuthorityClient | null;
}
```

- 检测 `window.STAuthority?.AuthoritySDK`，缺失 → `{available:false, degradedReason:'sdk-missing'}`。
- `init({extensionId, displayName, version, installType:'local', uiLabel, declaredPermissions})`：

```ts
declaredPermissions = {
    storage: { kv: true, blob: true },
    sql:     { private: { default: true } },          // 数据库名 target = 'default'
    http:    { allow: [] },                           // Phase E 按导入来源动态补充声明
    jobs:    { background: ['delay', 'sql.backup'] },
    events:  { channels: ['extension:third-party/ST-BgLoader'] },
};
```

> 声明门（declaration gate）是权限链第一关：**未声明的资源一律被拦**，故声明宁全勿缺；
> 用户/管理员仍可在 Security Center 收紧（deny 优先）。

- init 抛错（权限拒绝/服务端离线）→ 捕获 → `degradedReason` 记录 → **永不阻塞本地模式**。

### 3.2 `src/backend/MediaOrigin.ts` — 源端抽象

```ts
export interface MediaPutInput {
    blob: Blob; name: string; type: MediaType; source: MediaSource; remoteUrl?: string;
}
export interface MediaOrigin {
    readonly kind: 'authority' | 'local';
    init(): Promise<void>;
    listCatalog(): Promise<MediaItem[]>;
    getCatalogItem(id: string): Promise<MediaItem | null>;
    putMedia(input: MediaPutInput): Promise<MediaItem>;       // 写源端（二进制+目录）
    deleteMedia(id: string): Promise<void>;                    // 删源端（二进制+目录）
    readMedia(item: MediaItem): Promise<Blob | null>;          // 读源端二进制
    touchMedia(id: string, ts: number): Promise<void>;
    findByUrl(url: string): Promise<MediaItem | null>;         // preloadUrl 去重用
}
```

### 3.3 `src/backend/LocalOrigin.ts` — 现状逻辑下沉

现 `CacheManager` 的 CacheStorage+IndexedDB 代码**原样**迁入，行为零变化。
`MediaItem.cacheKey` 语义不变（本地 CacheStorage key）。本地模式（无 Authority）下
`cleanLRU` 仍删除全部数据 —— 与今天一致。

### 3.4 `src/backend/AuthorityOrigin.ts` — 云源端

**SQL 目录**（`sql.private`，database=`default`，`sql.migrate` 建表）：

```sql
-- migration v1
CREATE TABLE IF NOT EXISTS media_items (
    id                 TEXT PRIMARY KEY,
    blob_id            TEXT NOT NULL,
    name               TEXT NOT NULL,
    type               TEXT NOT NULL CHECK (type IN ('video','audio','html','svg','image')),
    source             TEXT NOT NULL,
    remote_url         TEXT,
    size               INTEGER NOT NULL,
    mime_type          TEXT NOT NULL,
    added_timestamp    INTEGER NOT NULL,
    last_used_timestamp INTEGER NOT NULL,
    has_audio          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_media_last_used ON media_items(last_used_timestamp);
CREATE TABLE IF NOT EXISTS schema_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

**Blob 命名**：`media/<id>/<sanitize(name)>`；`blob.put({name, content, encoding:'base64', contentType})`
→ 返回 `BlobRecord.id` 存入目录行 `blob_id`。SDK 内部自动处理大文件分块传输
（`putBlobWithTransfer` / `getBlobWithTransfer`，见 research/sdk/client.ts L749-772），调用方无感。

**读路径**：`blob.get(blob_id)` → base64 → `Uint8Array` → `new Blob([bytes], {type: mime_type})`。

**touch**：`sql.exec UPDATE media_items SET last_used_timestamp=? WHERE id=?`（防抖 5s）。

### 3.5 `src/cache/CacheManager.ts` 重构 — 门面 + L1 热缓存

```ts
export class CacheManager {           // 公共 API 不变
    private origin: MediaOrigin;      // 运行时选定
    private l1: Cache | null;         // CacheStorage 热缓存（两种模式都用）

    async init(bridge?: AuthorityBridge): Promise<void>;
    // authority 模式：
    //   cacheKey = `/st-bg-cache/<blob_id>`
    //   saveMedia: origin.putMedia → l1.put(cacheKey, blob) → 返回 item
    //   getMediaBlobUrl: l1.match → 命中即播；未命中 origin.readMedia → 回填 l1 → objectURL
    //   cleanLRU: 只删 l1 条目 + 撤销 objectURL，不动 origin（源端永不丢）
    //              云模式配额独立于 settings.cacheQuotaMB（L1 缓存配额，默认 512MB）
    // local 模式：行为与今天完全一致（L1 即源端，LRU 删真数据）
}
```

`MediaItem.source` 新增枚举值 `'server'` 已存在（NativeBgAugmenter 在用），云入库条目沿用
`source='server'` + `cacheKey=/st-bg-cache/<blob_id>`，无需改类型。

### 3.6 `src/backend/SettingsSync.ts`（Phase D）

- 本地先行：`saveSettings()` 仍写 localStorage（现状），随后防抖 2s 推 KV `settings:v1`
  `{revision, fingerprint(sha-1 of json), settings}`。
- 启动时 `kv.get`：云端 revision 较新 → 应用并触发 UI 刷新（经 `onSettingsChanged` 回调链）。
- `events.subscribe({channel:'extension:third-party/ST-BgLoader'})`：收 `settings.remote-change`
  → 比对 revision/fingerprint 防回环 → 应用。
- 场景书签/播放列表在 `settings.scenes` 内，随设置整体同步，无独立通道。

### 3.7 `src/backend/RemoteImporter.ts`（Phase E）

`preloadUrl`/URL 导入路径：先浏览器直连 fetch（快、可流式）；失败（TypeError/CORS）且
`bridge.capabilities.serverFetch` → `authority.http.fetch({url, method:'GET'})` → 响应体 →
Blob → `origin.putMedia(source:'url', remoteUrl:url)`。导入的 URL-hostname 需在声明中，
首见 host 时弹权限提示（Authority 内建 prompt 流程），用户允许后 SDK 放行。

### 3.8 `src/backend/AgentBridge.ts`（P2，默认关闭）

- 设置面板开关 `agentToolsEnabled`（默认 false）。
- 开启后 `agent.browser.registerTools` 注册幂等只读氛围工具：
  `stbg_set_background(mediaId|url) / stbg_apply_scene(sceneId) / stbg_set_weather(type,density)`
  `/stbg_play_bgm(url) / stbg_apply_preset(presetId) / stbg_set_filters(filters)`，
  每个 `AgentToolDescriptor` 带稳定 ID + JSON Schema + risk:'low' + changesWorkspace:false。
- claim 循环：短租约轮询 `agent.browser.claim` → 本地执行（映射到 `PublicAPI`）→ `submitResult`。
- Agent 侧需 `agent.browser:<browserInstanceId>` 独立授权，审批记录进 Security Center。

## 4. 数据迁移（Phase C，一次性）

Authority 首次 init 成功且云目录为空而本地 IDB 非空时：

```
for item of localCatalog:
    blob = localOrigin.readMedia(item)
    authorityOrigin.putMedia({...item, blob})   // 源端建立
local 标记 migration.done（kv 'migration:local-to-cloud:v1'）
```

- 迁移在后台执行（不阻塞 init），进度 toastr 提示；
- 本地数据保留不动（双保险），此后源端=云端；
- 迁移中断幂等：按 id 逐条 put，重跑跳过已存在。

## 5. 降级矩阵（用户已确认：静默降级 + 提示一次）

| 场景 | 行为 |
|---|---|
| 未装 Authority | LocalOrigin，一切现状；toastr.info 一次性提示「本地模式（仅本浏览器）」 |
| init 失败/服务端离线 | 同上，degradedReason 记 console |
| 权限被管理员拒绝 | available=false + toastr.warning 一次性提示具体被拒资源 |
| 云操作运行中失败 | 该条操作回退本地路径 + console.warn，不中断 UI |

一次性提示旗标存 localStorage `st_bgloader_cloud_notice_v1`。

## 6. 风险与对策

| 风险 | 对策 |
|---|---|
| blob base64 往返内存峰值（105MB→~140MB 字符串） | L1 命中后不再走网络；put 用 SDK 分块传输；文档标注大文件首次上云耗时 |
| SSE 为 DB-backed 轮询桥，延迟百 ms~秒级 | 同步目标 ≤2s 满足；fingerprint 防回环 |
| sql.private 默认 granted 但管理员可拒 | 降级矩阵第 3 行 |
| 迁移大库上传耗时 | 后台逐条 + 进度提示 + 幂等续跑 |
| `http.fetch` 声明收敛 | 声明留空数组，仅用户显式导入时按 host 增量声明 + 内建 prompt 授权 |

## 7. 测试策略

- 现有 24 项 Puppeteer E2E 必须零回归（无 Authority 环境 = LocalOrigin 路径）。
- 有 Authority 环境（手动/可选）：新增 `tests/authority.mjs`：
  上传→blob.list 可见；清 L1 后播放自动拉取；双页签 settings 同步；迁移幂等。
  Authority 缺席时整套 skip，不算失败。

## 8. 非目标（与 PRD 一致）

跨扩展共享媒体、embedding 生成、服务端转码。
