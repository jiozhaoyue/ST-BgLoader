# 服务端原生存储为源（浏览器纯缓存）+ Authority 仅作增强

## Goal

媒体一律存酒馆服务端原生 backgrounds/ 目录（原生上传/删除端点 + Range 流式静态服务），非图片条目用同目录清单 JSON 编目；浏览器 CacheStorage 仅为可管理缓存（LRU 只逐缓存、面板可清理）；Authority 仅做增强：KV 设置同步、Agent 氛围工具、CORS 服务端导入。删除 Authority 媒体 blob 层；旧浏览器媒体一次性自动上载服务端。

## 实测依据（Dev/Luker 实例，浏览器上下文原生 API）

- `POST /api/backgrounds/upload`（multipart 字段 `avatar`）：**200，无 MIME 限制**，任意媒体落入 `data/<user>/backgrounds/`，响应返回落盘文件名。
- `GET /backgrounds/<file>`：200，MIME 正确，**`accept-ranges: bytes`**（Range 流式，视频边下边播硬件解码）。
- `POST /api/backgrounds/delete {bg}`：200，任意文件可删。
- `POST /api/backgrounds/all`：只列图片（非图片传得上但列表不显示）→ 清单文件补编目。
- CSRF：`SillyTavern.getContext().getRequestHeaders({omitContentType:true})`。

## Requirements

### R1 ServerOrigin（唯一媒体源端，P0）
- 上传：原生 `/api/backgrounds/upload`；删除：原生 `/delete`；读取：直接相对 URL `backgrounds/<file>`（Range 流式，不整块进内存）。
- 编目：图片条目取自原生 `/all`；非图片条目记入同目录清单 `st-bg-loader-manifest.json`（原生列表忽略它；含稳定 id/类型/大小/时间戳，保障场景书签与聊天绑定引用不断）。
- 目录合并：`/all` 图片 ∪ 清单条目，按文件名去重（清单优先，提供稳定 id）。

### R2 浏览器纯缓存（P0）
- CacheStorage + IDB 缓存索引（cacheKey→lastUsed/size）只是缓存：`saveMedia`/`preload` 回填、命中加速；未命中直接走服务端 URL。
- `cleanLRU` 只逐缓存；`clearAll` 只清缓存（**永不删服务端文件**）；`getCacheUsage` 统计缓存。
- `deleteMedia`（用户显式删除）才删服务端文件 + 缓存。

### R3 旧数据一次性迁移（P1）
- 首次加载：把旧浏览器库（旧 IDB+CacheStorage 条目）自动上传服务端（幂等、localStorage 旗标、本地保留为缓存）。

### R4 Authority 仅增强（P1）
- **删除** AuthorityOrigin 媒体 blob 层。
- 保留：KV 设置/场景同步（revision+fingerprint）、Agent 氛围工具（默认关）、`http.fetch` CORS 服务端导入回退。
- 无 Authority：媒体一切功能可用（本来就是服务端），仅同步/增强关闭，静默降级 + 一次性提示。

### R5 UI（P1）
- 面板「存储与缓存」区块：源端=服务端目录说明、缓存用量与条数、清理缓存按钮、Authority 增强状态、Agent 开关。

## Acceptance Criteria

- [ ] 无 Authority 环境：上传视频/HTML → 文件真实落盘服务端 backgrounds/ 目录，`GET /backgrounds/<file>` 200 且 Range 可用；换浏览器登录同用户可见同一库（清单+原生列表）。
- [ ] LRU/清理缓存后：服务端文件全部完好；`getCacheUsage` 归零；再次播放自动直连服务端。
- [ ] 显式删除某条：服务端文件删除（404）+ 清单同步移除。
- [ ] 旧库迁移：旧 IDB 条目上传服务端且 id 不变；二次启动不重复迁移。
- [ ] Authority 在场：设置同步 + Agent 工具照常；离场零媒体功能损失。
- [ ] 24 项既有 E2E 零回归。

## 非目标

- 不写服务端插件（零服务端改动）；不做跨 ST 服务器同步；不做自动删服务端文件的 LRU。

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
