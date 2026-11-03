# Implement: 10-27-overnight-endpoint-expansion

> 复选框随执行实时勾选（L0-2）。每完成一步立即 `[x]`，不批量补勾。

## 阶段 A：准备

- [x] A1 L0-3 检索先行：GitHub API 检索酒馆扩展 postMessage/API 暴露惯例（发起调用即算满足），结论记入 research/
- [x] A2 `task.py start` 激活任务

## 阶段 B：端点扩充（核心）

- [x] B1 `src/api/EndpointRegistry.ts`：白名单表 + 发现数据 + 与 PublicAPI 的对照辅助
- [x] B2 `src/api/PublicAPI.ts`：新增 16 方法（发现×3 / 媒体库×5 / 播放×3 / 设置×4 / 缓存×2 / 可视化×1 中去重计数）
- [x] B3 `emit()` 三通道广播（eventSource + CustomEvent，try/catch 降级）
- [x] B4 `src/api/PostMessageBridge.ts`：message 监听/白名单分发/30s 超时/单次响应/stop()
- [x] B5 `src/index.ts` 装配 + `window.stBgLoader` 语义不变（向后兼容）

## 阶段 C：测试

- [x] C1 dev-harness 增加 API 自检套件（design §9 矩阵 8 项）
- [x] C2 套件全绿跑通并留证据输出

## 阶段 D：巡检与性能

- [x] D1 `npm run type-check && npm run build && npm run check:css` 全绿
- [x] D2 巡检修复批（发现即修，逐项记录）
- [x] D3 性能项：媒体网格缩略图会话 LRU + 可测量证据

## 阶段 E：文档与收尾

- [x] E1 wiki Public-API-Reference.md 扩充（新方法表 + 桥协议 + 客户端样板）
- [x] E2 README 开发节提及 + spec 契约沉淀
- [x] E3 逐项显式 pathspec 提交并推送 origin master
- [x] E4 journal 记录 + goal-state 完成收口（complete=true、停轮询 cron）
