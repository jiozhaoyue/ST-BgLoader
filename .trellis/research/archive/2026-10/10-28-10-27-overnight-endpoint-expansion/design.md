# Design: 10-27-overnight-endpoint-expansion

## 1. 总体

三个新模块 + 两处装配点，全部落在 `src/api/`，不影响既有模块内部：

```
src/api/PublicAPI.ts            ← 扩充方法 + emit 三通道广播（R2/R3/R4）
src/api/PostMessageBridge.ts    ← 新增：window message JSON-RPC 桥（R1）
src/api/EndpointRegistry.ts     ← 新增：方法白名单 + 发现数据（R1/R4 共源）
src/index.ts                    ← 装配：init() 尾部 start 桥 + 广播通道
```

## 2. PostMessageBridge（R1）

### 协议（双方约定，帧格式）

```ts
// 请求（iframe → 插件，target = window.parent）
{ source: 'st-bgloader', kind: 'request', id: string, method: string, params?: unknown[] }

// 响应（插件 → iframe，event.source 回发）
{ source: 'st-bgloader', kind: 'response', id: string,
  result?: unknown,                       // 成功
  error?: { code: string, message: string } }  // 失败（含 UnknownMethod/InvalidParams/Timeout/InvokeError）

// 事件订阅推送（插件 → 所有已知 iframe）
{ source: 'st-bgloader', kind: 'event', event: string, args: unknown[] }
```

### 行为

- `window.addEventListener('message', handler)`：仅处理 `data.source === 'st-bgloader' && kind === 'request'`。
- **方法白名单**：method 必须在 EndpointRegistry 中且不是下划线开头；`getAPI()`/内部访问器一律不暴露。
- **origin 策略**：默认只响应 `event.source` 的回发（不校验 origin 值，因为酒馆助手 iframe 常为 blob/srcdoc 无稳定 origin），但**绝不**响应对 `window.top` 以外来源的主动推送；事件推送只发往「最近 60s 内成功调用过」的 source，避免全窗口广播泄漏。
- **有界等待**：调用统一 `Promise.race` 30s 超时（L1-MR-7），超时返回 `Timeout` 错误帧。
- **id 关联**：id 由调用方生成，插件原样回填；响应必须且只发一次。
- `stop()`：移除监听（对齐插件其他子系统的可卸载纪律）。

### 客户端配套（写进 wiki 的一段 15 行样板脚本，供酒馆助手脚本复制）

`window.parent.postMessage(...)` + `addEventListener('message')` 过滤 id + Promise 包装。

## 3. EndpointRegistry（R1/R4 共源）

- 静态登记：`{ method: string, category: string, async: boolean }[]`，由 PublicAPI 公开方法清单维护（手写表，构建期用 `listMethods()` 自检对照断言，防漂移）。
- `getApiVersion()`：返回 `{ api: 2, plugin: manifest.version }`。
- `getCapabilities()`：返回 `{ postMessageBridge, eventChannels: ['bus','eventSource','customEvent'], categories }`。

## 4. PublicAPI 扩充（R2）

新方法清单（16 个）：

| 组 | 方法 | 说明 |
| --- | --- | --- |
| 发现 | `getApiVersion` / `getCapabilities` / `listMethods` | R4 |
| 媒体库 | `uploadMedia(blob, name?, type?)` / `deleteMedia(id)` / `renameMedia(id, name)` / `getMediaInfo(id)` / `getMediaUrl(id)` | 复用 CacheManager；getMediaUrl 返回可复用 blob URL 并登记引用 |
| 播放 | `getPlaylist()` / `setPlaybackMode(mode)` / `jumpToTrack(index)` | 复用 AudioEngine |
| 设置 | `getSettings()`（深拷贝只读）/ `updateSettings(patch)`（走 mergeSettings 全量收敛）/ `exportSettings()` / `importSettings(json)` | 与顶栏抽屉同一收敛路径，避免旁路写 |
| 缓存 | `getCacheStats()` / `clearCache()` | 复用 CacheManager |
| 可视化 | `getVisualizerData()` | 只读频谱 Uint8Array→Array（无 analyser 时返回空数组，不挂起） |

参数校验统一走私有 `assertParam` 辅助（类型/范围），失败抛 `Error('INVALID_PARAMS: …')`——桥层捕获转 `error.code`。

## 5. 事件双通道广播（R3）

`emit()` 内部统一分发（单点改，所有既有 28 处 emit 自动获得）：

```ts
emit(event, ...args) {
  // ① 原有内部总线（不变）
  // ② eventSource?.emit('st_bgloader:' + event, ...args)   —— try/catch 包裹，宿主缺失静默
  // ③ document.dispatchEvent(new CustomEvent('st-bgloader:' + event, { detail: { args } }))
}
```

- CustomEvent 的 detail 统一为 `{ args: unknown[] }`，避免不同事件参数个数不同导致监听器歧义。
- eventSource 通道：初始化时探测 `window.eventSource`，缺失/抛错时置空（纯前端降级，L0-11）。

## 6. 装配（index.ts）

- `init()` 第 12 步后：`this.pmBridge = new PostMessageBridge(this.publicApi); this.pmBridge.start();`
- 构造器无关：桥不依赖酒馆存在，纯浏览器可用（独立页/预览台同样可测）。

## 7. 性能项（R8 候选，实现时择一）

1. 媒体网格缩略图：为视频首帧缩略图加会话级 LRU（现有实现每格重解码）——预期滚动重渲染时 CPU 显著下降，用 harness 计时断言。
2. 事件广播：CustomEvent 仅在存在监听器时构造（`document.all` 探测不可行 → 用 once 收集器判断）——低收益，备选。
3. `getSettings()` 深拷贝改 structuredClone 惰性——非热点，弃。

→ **选定候选 1**（可测量、用户可感）。

## 8. 风险与对策

| 风险 | 对策 |
| --- | --- |
| postMessage 桥被滥用调内部方法 | 白名单 + 不暴露实例 + 错误码不泄露内部栈 |
| eventSource 自定义事件名冲突 | 统一 `st_bgloader:` 前缀 |
| CustomEvent 泄漏宿主全局监听 | 事件名 `st-bgloader:` 前缀，与 CSS 前缀纪律同型 |
| 桥响应超时挂起调用方 | 30s race + 单次响应保证 |
| 与既有单测/门禁漂移 | EndpointRegistry ↔ PublicAPI 对照自检进 harness |

## 9. 测试矩阵（dev-harness 新套件 api-harness）

1. 发现接口三件套返回值形状
2. 同窗口 postMessage 请求 → 成功响应（setBackground → getPlaybackState 断言）
3. 未知方法 → UnknownMethod 错误帧
4. 非法参数 → InvalidParams 错误帧
5. 30s 超时路径（stub 慢方法，短超时注入）
6. 事件三通道一致性（track-change 触发）
7. 媒体库五端点往返（上传→详情→重命名→URL→删除）
8. `listMethods()` 与 EndpointRegistry 对照
