# Authority 后端能力集成（云同步/服务端抓取/Agent 氛围工具）

## Goal

研究并集成 ST-Delegation-of-authority 服务端能力：媒体库云同步（blob）、设置与场景跨端同步（kv+sse）、服务端 HTTP 抓取（http.fetch）、Agent 氛围浏览器工具（agent.browser），实现纯前端插件无法做到的能力，并保持无 Authority 时优雅降级。

## 研究结论（可行性：✅ 可以结合，且是互补关系）

Authority（ST-Delegation-of-authority）是 SillyTavern **服务端插件**，通过 `host-bridge` + `sdk-extension`
向任意第三方**前端扩展**暴露统一后端能力与权限治理。ST-BgLoader 是纯前端扩展，接入方式为：

```ts
const sdk = window.STAuthority?.AuthoritySDK;           // 特征检测，未安装则跳过
const client = await sdk.init({
    extensionId: 'third-party/ST-BgLoader',
    displayName: 'ST-BgLoader',
    version: manifest.version,
    installType: 'local',
    uiLabel: 'ST-BgLoader',
    declaredPermissions: {
        storage: { kv: true, blob: true },
        http:    { allow: [] },                // 按需声明主机名
        jobs:    { background: ['delay', 'sql.backup'] },
        events:  { channels: ['extension:third-party/ST-BgLoader'] },
    },
});
// client.storage.kv.* / client.storage.blob.* / client.http.fetch()
// client.jobs.* / client.events.subscribe() / client.agent.browser.*
```

SDK 接入面已通过官方 `packages/example-extension` 源码验证（见 `research/authority-example-index.ts`）；
能力矩阵、权限判定链、数据隔离模型见 `research/authority-capabilities.md`；
Agent 浏览器工具注册模型见 `research/authority-agent-platform.md`。

## 核心价值：纯前端插件做不到的事情

| # | 能力 | 现状（纯前端的墙） | 结合 Authority 后 |
|---|------|--------------------|-------------------|
| 1 | **媒体库云同步** | 媒体困在单浏览器 CacheStorage/IndexedDB，换设备/清缓存即失，受浏览器配额与 LRU 驱逐 | `storage.blob` 分块大文件传输作为持久源端（L2），本地 CacheStorage 降级为热缓存（L1）拉取式缓存；一次上传全设备可用 |
| 2 | **设置/场景/播放列表跨端同步** | localStorage 仅本浏览器，清站点数据即丢 | `storage.kv` 存云端副本 + `events.stream` SSE 订阅：A 设备切场景，B 设备在线即同步切换 |
| 3 | **任意远程媒体导入（无 CORS）** | fetch 受 CORS 限制，大量图站/壁纸 API 无法导入 | `http.fetch` 经服务端中转（按 hostname 授权），导入任意来源并落盘 blob |
| 4 | **元数据结构化库 + 自动备份** | IndexedDB 无跨端、无备份 | `sql.private` 存标签/评分/播放统计/角色绑定，支持查询迁移；`jobs.background: sql.backup` 定时备份 |
| 5 | **定时氛围任务** | setTimeout 随页面死亡 | `jobs.background: delay` + SSE：到点服务端推事件，所有在线端切换夜幕/清晨场景 |
| 6 | **Agent 氛围工具（最独特）** | 前端插件无任何通道进入 Agent Runtime | `client.agent.browser.*` 注册浏览器工具（set_background / set_scene / set_weather / play_bgm / apply_preset / set_filters），Authority Agent 会话在自主运行中可直接调度氛围，实现"AI 导演" |
| 7 | **语义场景检索（进阶可选）** | IndexedDB 无法向量检索 | `trivium.private` 混合检索（调用方自备 embedding）：按情绪/描述找场景（"雨夜对话的氛围"） |
| 8 | **权限治理与审计** | 无 | 所有数据访问在 Security Center 可见、可管、可拒；合规透明 |

## Requirements

> **用户决策（2026-09-13）**：媒体本就应以后端存储为源端，现行"浏览器 CacheStorage 为唯一事实源"
> 架构是错的。本任务按**存储倒置重构**执行：Authority 可用时后端即源端，浏览器降级为缓存；
> Authority 缺席/权限被拒时静默降级为现状本地模式并提示一次。技术设计见 `design.md`。

### R1 存储倒置核心（P0）
- 新增 `MediaOrigin` 源端抽象：`AuthorityOrigin`（blob 二进制源端 + sql.private 目录源端）与
  `LocalOrigin`（现 CacheStorage+IndexedDB 逻辑原样下沉）。
- `CacheManager` 重构为库门面：**公共方法签名不变**（6 个调用点零改动）；
  云模式写穿源端→回填 L1 热缓存；L1 未命中自动从源端拉取播放；
  云模式 LRU 仅逐 L1，**源端永不驱逐**。

### R2 AuthorityBridge 连接层（P0）
- 特征检测 `window.STAuthority?.AuthoritySDK` + `init` + 声明权限
  （storage.kv/blob、sql.private、jobs、events）。
- 永不 throw；能力位 `{available, cloudLibrary, sync, serverFetch, agentTools, degradedReason}`。

### R3 一次性本地→云端迁移（P1）
- 首次云连接且云目录为空、本地非空 → 后台逐条上传（幂等、进度提示、本地数据保留）。

### R4 设置/场景/播放列表云同步（P1）
- 本地先行 + 防抖推 KV（revision+fingerprint 防回环）+ SSE 订阅应用远端变更，双端 ≤2s。

### R5 服务端 CORS 导入回退（P2）
- 直连 fetch 失败且 `http.fetch` 可用 → 服务端抓取入库（hostname 增量声明 + 内建授权提示）。

### R6 Agent 氛围工具（P2，默认关闭）
- `agent.browser.registerTools` 注册 `stbg_*` 幂等只读氛围工具集（背景/场景/天气/BGM/滤镜/预设），
  claim 循环 + submitResult；设置面板显式开关。

### R7 降级与兼容（贯穿，用户已确认策略）
- 无 Authority / init 失败 / 权限被拒：静默降级本地模式 + **一次性** toastr 提示；本地功能零阻塞。
- 现有 24 项 E2E 零回归（LocalOrigin 路径 = 现状行为）。

## Acceptance Criteria

- [ ] 安装 Authority 后：上传媒体同时出现在本地库与云端库（blob.list 可见），换浏览器登录同一用户可拉取播放。
- [ ] 经服务端导入一个无 CORS 头的远程媒体 URL 成功入库。
- [ ] 两浏览器会话同用户：A 端切换背景，B 端 ≤2s 内同步切换。
- [ ] Agent 工作台会话中可发现并调用 ST-BgLoader 氛围工具且生效（默认关闭时不可见）。
- [ ] 卸载/未装 Authority 时：全部既有功能与 24 项 E2E 测试零回归。
- [ ] 权限被管理员拒绝时：插件正常加载，云功能标记不可用，无未捕获异常。

## 非目标

- 不做跨扩展媒体共享（Authority 按扩展 ID 隔离，无此公开 API）。
- 不做 embedding 生成（Trivium 需调用方自备向量；接入留给后续任务）。
- 不做服务端转码/音频处理（本插件零转码设计不变）。
