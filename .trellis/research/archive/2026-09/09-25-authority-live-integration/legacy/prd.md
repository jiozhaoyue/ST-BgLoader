# Authority 真后端联调（jiozhaoyue fork → Dev Luker 实测）

## Goal

把 jiozhaoyue/ST-Delegation-of-authority fork 通过 git clone 装进 Dev Luker (8003)，在真实后端上验证 ST-BgLoader 三项增强能力（设置 KV 镜像同步 / http.fetch CORS 代理导入 / agent.browser 氛围工具），修复真实环境差异，E2E/stress 零回归；不改任何实例 config.yaml。

## Background

- ST-BgLoader 的 Authority 增强层（`src/backend/`：AuthorityBridge / SettingsSync / RemoteImporter / AgentBridge）至今**全部用 mock SDK 验证**（tests/authority.mjs S5 系列注入页面级 mock），真后端从未连接过。
- mock 注入逻辑为「真 SDK 优先」（`if (window.STAuthority) return`），插件侧会自动切换真后端；**但断言不会**：S5.2/S5.3 读 `window.__authMockState`（真后端下不存在，断言抛错），S6.1 断言「无 Authority 降级」（真后端在场时必然失败）——测试套件需要双模式适配。
- jiozhaoyue/ST-Delegation-of-authority fork 就绪（本地克隆 `Myfork/ST-Delegation-of-authority`）：领先上游 12 提交（Windows core 产物 MSVC 重建 17.74MB→10.29MB、插件注册表发现层 L12、消费者契约规范），origin 已指向 fork。
- Dev Luker (8003) `enableServerPlugins: true` 已就绪、未装 Authority；Dev ST (8001) `enableServerPlugins: false`。
- **用户裁定（2026-09-25）**：实例 config.yaml 一律不改——autoUpdate 保持 true、Dev ST 保持关闭、只测 Dev Luker。
- Authority 官方安装路径即 `git clone <repo> plugins/authority`（实例隔离规范 L0-1 允许的三条路之一），启动后插件自动部署 SDK 扩展并拉起 Rust core。

## Requirements

1. **安装**：`git clone https://github.com/jiozhaoyue/ST-Delegation-of-authority.git` 到 `Instance/Dev/Luker/plugins/authority`。除 git clone 外**零实例文件写入**（SDK 目录、core 产物由宿主自身部署行为产生，非人工复制）。
2. **部署验证**：启动 Dev Luker (8003)，确认 authority 插件加载、core 启动、SDK 扩展 `third-party/st-authority-sdk` 自动部署；probe 返回 ok、Security Center 可见。
3. **权限流实测**：ST-BgLoader 的 declaredPermissions（storage.kv/blob、sql.private、jobs.background、events 通道）在真后端上走真实授权判定；如遇 prompt/403，验证插件按契约处置（一次性降级提示 / 授权后恢复），不阻塞媒体主功能。
4. **测试套件双模式适配**（本任务主要代码工作）：
   - tests/authority.mjs 检测真后端在场时，S5 断言改用真实 API 读侧（真实 KV 内容、真实 agent 工具注册状态），不再依赖 `window.__authMockState`；
   - S6（无 Authority 降级语义）在真后端在场时跳过或走显式无后端验证路径；
   - mock 路径完整保留，无后端环境下套件仍可独立运行。
5. **真实差异修复**：联调发现的**插件侧**缺陷（能力位判定、降级提示、错误分类处置、权限声明）就地修复；**fork 侧**缺陷只记录到任务 `research/` 目录并反馈用户（本任务不改 fork 代码）。
6. **零回归门禁**：E2E 24/24、stress 4/4、authority 双模式全绿；type-check + build 绿。

## Non-goals

- 不改任何实例 config.yaml（用户明确裁定）。
- 不在 Dev ST (8001) 上联调（enableServerPlugins: false 保持原样）。
- 不修改 Authority fork 代码（发现缺陷记录 + 反馈，另行处理）。
- 不新增插件功能特性——本任务只做真后端接入验证与差异修复。

## Acceptance Criteria

- [ ] `Instance/Dev/Luker/plugins/authority` 为 fork 克隆（origin 指向 jiozhaoyue/ST-Delegation-of-authority），宿主启动后 probe ok、Security Center 可见。
- [ ] `node tests/authority.mjs` 对**真后端**全绿：S5 系列用真实 API 断言（无 `__authMockState` 依赖）、S6 系列在真后端在场时正确跳过/切换；mock 路径（无后端页面）保持绿。
- [ ] `TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e` 24/24、`node tests/stress.mjs` 4/4（≥2 轮）零回归。
- [ ] `npm run type-check` + `npm run build` 通过。
- [ ] 设置抽屉「存储与 Authority 增强」面板显示真实连接状态（available=true，非降级）。
- [ ] 除 git clone 外零实例写入；联调差异与坑已落盘任务 `research/`；spec 有新教训则同步更新。

## Risks

- **权限判定默认 prompt** → init 或 API 调用 403：预期路径，按 AuthorityApiError 分类处置（permission → 一次性降级提示 + Security Center 指引）。
- **SDK 目录冲突坑**（旧版残留致部署失败）：按技能处置——probe 的 installStatus → 备份删除重启重部署。
- **autoUpdate=true** 在启动时从 origin（即 fork main）拉取更新：克隆即 fork HEAD，版本漂移风险低，如遇行为变化以 git log 核对。
- **core 二进制启动失败**（win32-x64 已由 fork MSVC 重建，预期本机可用）：按 503/core_unavailable 处置并记录到 research/。

## Rollback

删除 `Instance/Dev/Luker/plugins/authority` 克隆目录即完全卸载；实例零配置改动，天然可回滚。插件侧代码改动走常规 git revert。
