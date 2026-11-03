# 10-27-overnight-endpoint-expansion

## Goal

夜间批：为 ST-BgLoader 开放极多对外端点（postMessage JSON-RPC 桥 + PublicAPI 扩充 + 双通道事件广播），并完成缺陷修复、性能改进与文档同步；06:00 前收尾交接。

## 背景

现有对外面（截至 10-26）：
- `window.STBgLoader`（扩展实例全引用）与 `window.stBgLoader`（PublicAPI，约 35 方法）
- 内部事件总线 `on/off/emit`（仅同窗口可达）
- Authority AgentBridge（云端 AI 工具，可选增强）

**关键缺口**：酒馆助手（TavernHelper/JS-Slash-Runner）脚本运行在 **iframe** 中，其 `window.parent` 才挂有本插件——现有 API 对它们完全不可达；其他扩展也只能靠持有全局引用，没有标准事件通道。

## Requirements

- **R1 PostMessage JSON-RPC 桥**：iframe 内脚本通过 `window.parent.postMessage` 调用本插件全部公开方法；请求-响应以 id 关联，支持超时与错误传播；宿主侧校验来源并只放行白名单方法。
- **R2 PublicAPI 扩充**（≥15 个新方法，覆盖）：媒体库管理（上传/删除/重命名/详情/取 blob URL）、播放列表控制（列表/模式/跳转）、设置读写（读副本/合并更新/导入导出）、缓存统计与清理、主开关/可见性控制、可视化器频谱数据只读端点、能力发现（版本/能力表/方法清单）。
- **R3 事件双通道广播**：PublicAPI 的每个 `emit` 同步镜像到 ① 酒馆 `eventSource`（事件名 `st_bgloader:<event>`，宿主存在时）② `document` CustomEvent（`st-bgloader:<event>`，detail 携带载荷）。三通道（内部总线/eventSource/CustomEvent）载荷一致。
- **R4 发现接口**：`getApiVersion()` / `getCapabilities()` / `listMethods()` 供调用方特性检测。
- **R5 输入健壮性**：全部新端点做参数校验（类型/范围），错误以结构化 `Error`（带 code）reject 或返回安全默认值，禁止裸抛内部异常、禁止挂起（有界等待，L1-MR-7）。
- **R6 测试**：dev-harness（免酒馆预览台）新增 API 自检套件，覆盖 R1–R4 主路径与至少一个错误路径，全绿。
- **R7 缺陷巡检**：`type-check` / `build` / `check:css` 全绿；巡检发现 bug 即修（P2 级优先）。
- **R8 性能改进**：至少 1 项可测量优化（候选：媒体网格缩略图会话缓存复用、事件广播零拷贝、rAF 合帧补漏）。
- **R9 文档同步**：wiki `Public-API-Reference.md` 扩充新端点与桥协议；README 提及；spec 沉淀契约。

## Acceptance Criteria

- [x] **A1** dev-harness API 自检套件全绿（含 postMessage 往返、id 关联、超时、错误传播、事件三通道一致性、发现接口）。
- [x] **A2** `npm run type-check` + `npm run build` + `npm run check:css` 全绿。
- [x] **A3** postMessage 桥：iframe 调用 → 结果返回全程在 harness 断言（成功/失败/超时三路径）。
- [x] **A4** `emit` 一次 → 三通道各收到相同载荷（harness 断言）。
- [x] **A5** wiki 新增章节与实现签名逐一对照，死链检查通过。
- [x] **A6** 全部提交显式 pathspec、暂存区校验、推送 origin master（L0-7）。
- [x] **A7** goal-state.json 计划项随执行实时勾选（L0-2）。

## 非目标

- 不改 Authority 服务端协议；不做 HTTP 服务器端点；不重写既有 UI；不动宿主源码（L0-1）。
