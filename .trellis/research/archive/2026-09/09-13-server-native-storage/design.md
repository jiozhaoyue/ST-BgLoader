# Design: 服务端原生存储为源 + 浏览器纯缓存

## 架构

```
调用方（公共 API 不变）
        │
CacheManager（门面，签名不变）
  saveMedia:   ServerOrigin.putMedia(原生上传) → L1 回填(缓存)
  getMediaBlobUrl: L1 命中 → blobURL（快）
                    未命中 → 直接返回 item.url（相对 URL，Range 流式，不落内存）
  deleteMedia: 用户显式删 → 原生 /delete + 清单移除 + L1 逐出
  cleanLRU / clearAll / getCacheUsage: 只动 L1（缓存）
        │
ServerOrigin（唯一源端 = 酒馆服务端 data/<user>/backgrounds/）
  上传: POST /api/backgrounds/upload（multipart 'avatar'，CSRF 经 SillyTavern.getContext）
  删除: POST /api/backgrounds/delete {bg}
  图片目录: POST /api/backgrounds/all（原生，仅图片）
  非图片编目: backgrounds/st-bg-loader-manifest.json（同一目录，原生列表忽略）
  读取: backgrounds/<encodeURIComponent(file)>（原生静态路由，Range）
        │
LegacyBrowserStore（只读，仅迁移用）：旧 CacheStorage+IDB 库一次性上载服务端

Authority 增强层（无也全功能）：SettingsSync(KV) + AgentBridge(agent.browser) + RemoteImporter(http.fetch CORS 回退)
```

## 清单文件 `st-bg-loader-manifest.json`

```json
{ "version": 1, "items": [{ "id": "bg_...", "filename": "x.mp4", "type": "video",
    "source": "local|url", "remoteUrl": null, "size": 123, "mimeType": "video/mp4",
    "addedTimestamp": 0, "lastUsedTimestamp": 0, "hasAudio": true }] }
```

- 写：整文件重新上传（原子覆盖，单用户酒馆 last-write-wins 可接受）；读时加 `?t=` 破 HTTP 缓存。
- 合并：`/all` 图片 + 清单；按文件名去重，清单条目优先（稳定 id 保引用）。
- id 在上传时客户端生成并写入清单 → 场景书签/聊天绑定跨端不断。

## 缓存索引（IDB `st_bg_cache_index`，store: entries）

`{cacheKey, lastUsed, size}` —— 只服务 LRU 与用量统计；缓存本体 CacheStorage `st-bg-cache-v1`（沿用）。
LRU 驱逐 = 删 CacheStorage 条目 + 索引行 + objectURL；**永不触及服务端**。

## 播放路径

- 命中 L1（preload 过或刚上传）→ blobURL。
- 未命中 → `item.url`（相对 URL 直接给 `<video>/<img>/<iframe>`；同源 + Range，浏览器自行流式与 HTTP 缓存）。
- HTML 沙箱 iframe src 同理直接用相对 URL。

## 迁移（LegacyMigration）

localStorage 旗标 `st_bgloader_legacy_migrated_v2`；旧 IDB（st_bg_loader_db/media_items）逐条：
读旧缓存 Blob → 原生上传 → 清单登记（**保留旧 id**）→ 旧条目转为缓存回填；失败跳过不阻塞。

## 删除项

`AuthorityOrigin.ts`、`Migration.ts`（旧云迁移）、`LocalOrigin.ts`（收缩为 LegacyBrowserStore 只读）。
AuthorityBridge 能力位变为 `{available, sync, serverFetch, agentTools}`。

## UI

面板「存储与缓存」：源端说明（服务端目录）、缓存用量/条数、清理缓存按钮、Authority 增强状态、Agent 开关。

## 测试

- 24 项 E2E 零回归（getCacheUsage 语义变为缓存统计）。
- tests/authority.mjs 改造：服务端落盘断言（文件存在/Range/删除后 404）、清单编目、缓存清理不伤源端、迁移幂等；Authority 部分继续用 mock SDK。
