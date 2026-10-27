# Public Endpoints Contract (对外端点契约)

> 本页自包含（L0-17）：不引用任务目录。证据均以内联 file:line 或断言名给出。
> 建立背景：2026-10-28 夜间批（任务 10-27-overnight-endpoint-expansion）——用户要求
> 「开放极多端点供其他酒馆功能或插件调用」。

## 1. 对外面全景（四类端点，全部纯浏览器可用，L1-MR-1）

| 端点类 | 载体 | 可达方 |
| --- | --- | --- |
| 全局对象 | `window.stBgLoader`（PublicAPI）、`window.STBgLoader`（实例） | 同窗口脚本（src/index.ts 装配尾部） |
| postMessage 桥 | `src/api/PostMessageBridge.ts`（JSON-RPC 帧协议） | **iframe 内脚本**（酒馆助手等）——同窗口全局不可达的唯一通路 |
| 事件广播 | 总线 `on/off` + 酒馆 `eventSource`（`st_bgloader:<event>`）+ DOM CustomEvent（`st-bgloader:<event>`，`detail.args`） | 三通道同发同载荷（api-harness「三通道一致性」断言） |
| 云端 Agent 工具 | `src/backend/AgentBridge.ts`（Authority 可选增强） | 服务端 AI（L0-11 降级语义，非本契约范围） |

## 2. EndpointRegistry：白名单唯一登记源（MUST）

`src/api/EndpointRegistry.ts` 是**唯一**登记表（56 端点，12 分类）。纪律：

1. **新增公开方法必须同 PR 登记**——`listMethods()`、postMessage 桥白名单、
   `getCapabilities().categories` 三者都以它为事实源；
2. `on` / `off` / `emit`（总线管理）与下划线开头方法**永不登记**——桥不暴露实例，
   错误帧不携带内部栈（`UnknownMethod` / `InvalidParams` / `InvokeError` 三码而已）；
3. **零漂移双向对照**是质量门：api-harness 用
   `Object.getOwnPropertyNames(proto)`（排除上述非登记名与 `_` 前缀）与
   `listMethods()` 求差集，双向都必须为空（断言「登记表 ↔ 实现零漂移」）。

违反后果：桥白名单与实现漂移 → 外部调用方拿到 UnknownMethod，或内部方法意外暴露。

## 3. PostMessageBridge 帧协议（MUST，改协议即改本节）

```text
请求  { source:'st-bgloader', kind:'request',  id, method, params?: any[] }
响应  { source:'st-bgloader', kind:'response', id, result? } | { ..., error:{ code, message } }
事件  { source:'st-bgloader', kind:'event',    event, args: any[] }
```

- **单次响应保证**：id 已服务登记（FIFO 上限 512，`servedIds`）——并发与先后重发一律忽略；
  响应只回 `event.source`，绝不广播；
- **有界等待**（L1-MR-7）：任何方法 30s 超时（`withTimeout`），超时回 `InvokeError`（消息含
  `BRIDGE_TIMEOUT`）；端点自身也不得挂起（`getVisualizerData` 无 analyser 返回 `[]` 即范例）；
- **隐式事件订阅**：只向「60s 内成功请求过」的 source 推事件（TTL 表），不主动全窗口广播；
- **装配点**：`src/index.ts` init 步骤 10.6（try/catch 降级，桥失败不阻断初始化）。

实测坑（写套件时踩过）：测试若在**顶层窗口**调 `iframe.contentWindow.parent.postMessage`，
`event.source` 是 top 而非 iframe，桥会把响应发进 top——跨 iframe 测试必须让请求真正发自
iframe realm（`about:blank` 同源 iframe + `contentWindow.eval`）。

## 4. 设置端点走收敛路径（MUST）

`updateSettings` / `importSettings`（`src/api/PublicAPI.ts`）必须经
`ext.applyConvergedSettings`（`src/index.ts`）：settings 替换 → saveSettings →
applySettingsToSubsystems → enforceQuotaIfChanged → **两个抽屉 applyRemoteSettings** →
emit settings-sync。任何「直接改 settings 字段」的旁路写法都违反
state-management.md 的收敛纪律——抽屉持旧引用时下一次 save() 会整体回写旧状态。

**mergeSettings 键完整性**：`mergeSettings` 只拷 `DEFAULT_SETTINGS` 里出现过的键。
`BgLoaderSettings` 接口新字段**必须**同时进 `DEFAULT_SETTINGS`（哪怕是
`undefined as unknown as string`），否则重启/远端收敛/导入时被静默丢弃——
`activeSceneId` 曾因此丢失（2026-10-28 巡检修复，commit 897c5a6）。

## 5. 事件命名空间（MUST）

- 酒馆事件源通道前缀 `st_bgloader:`；DOM CustomEvent 前缀 `st-bgloader:`
  （与 L1-MR-3 的 CSS 前缀纪律同型的命名空间隔离，防宿主事件污染）；
- CustomEvent `detail` 统一为 `{ args: unknown[] }`（不同事件参数个数不同，统一包装
  消除监听器歧义）；
- `emit()` 是三通道唯一分发点（`src/api/PublicAPI.ts`）——新事件只管 `emit`，通道自动获得。

## 6. 质量门（本契约的验收面）

- `node tests/api-harness.mjs`：25 断言（需 `npm run dev:ui`）——发现接口、登记表零漂移、
  桥四路径（成功/UnknownMethod/InvalidParams/重复 id 单响应）、三通道一致性、媒体库端点
  往返、设置收敛往返、主开关往返、合帧可测量（3 失效→1 重建）；
- `node tests/dev-harness.mjs`：14 断言——其删除步骤**必须走扩展 `deleteMedia`**：
  裸 fetch 删文件会留下清单条目 + activeMediaId，下次 boot 恢复成 404 背景（两轮复现实录）；
- 通用门：`npm run type-check && npm run build && npm run check:css` 全绿。
