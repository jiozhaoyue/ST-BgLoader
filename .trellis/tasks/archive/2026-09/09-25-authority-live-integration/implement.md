# 实现清单 — Authority 真后端联调

> 复选框随执行实时勾选（L0-2）。验证命令集中在文末。

## Phase A：环境准备

- [x] A1 收尾归档 `00-bootstrap-guidelines`（验收早已达成，仅状态残留）
- [x] A2 `git clone https://github.com/jiozhaoyue/ST-Delegation-of-authority.git Instance/Dev/Luker/plugins/authority`（L0-1 唯一允许的安装路径）；核对 `git -C ... remote -v` origin 指向 fork、HEAD 为 fork main
- [x] A3 启动 Dev Luker (8003)（实例目录 `node server.js` 或既有启动方式；仅启动进程，不改任何配置文件）
- [x] A4 部署验证：宿主启动日志确认 authority 插件加载 + core 启动；`curl -X POST http://127.0.0.1:8003/api/plugins/authority/probe` 返回 ok；页面上 `window.STAuthority.AuthoritySDK.probe()` 可用；Security Center 扩展可见

## Phase B：真实差异探查

- [x] B1 权限流实测：打开页面观察 ST-BgLoader init 是否触发 prompt / 403；记录 declaredPermissions 六项的真实判定结果到 `research/`
- [x] B2 能力位实测：`window.STBgLoader.getAuthorityBridge().getCapabilities()` 真后端下应为 available=true（sync/serverFetch/agentTools 按实际授权记录）
- [x] B3 手动冒烟：设置修改 → KV 镜像、跨页签收敛；URL 导入（CORS 域）→ http.fetch 回退；agentToolsEnabled 开启 → 工具注册
- [x] B4 发现的差异分级：插件侧缺陷（本任务修）/ fork 侧缺陷（记录 `research/`，不改 fork 代码）

## Phase C：测试套件双模式适配（主要代码工作）

- [x] C1 tests/authority.mjs 增加真后端检测（页面侧真实 SDK 在场 = 真 backend 模式）
- [x] C2 S5 系列：真后端模式下断言改读真实 KV 内容（经 bridge client）与真实 agent 注册状态；mock 模式断言原样保留
- [x] C3 S6 系列：真后端在场时跳过降级断言（或以显式无后端页面验证降级语义，视可行性定）
- [x] C4 双模式分别跑绿：真后端环境一轮 + 断言 mock 路径未被破坏（可用无 mock 注入页 + 临时探测逻辑确认覆盖）

## Phase D：修复与回归

- [x] D1 按 B4 分级逐项修复插件侧差异（每修一项跑对应子集）
- [x] D2 回归：`TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e`（24/24）+ `node tests/stress.mjs`（4/4 ×2 轮）+ authority 套件双模式
- [x] D3 `npm run type-check` + `npm run build` 通过

## Phase E：收尾

- [x] E1 联调差异与坑落盘 `research/`（权限判定实际行为、部署坑、断言双模式改造要点）
- [x] E2 spec 有新教训则更新（`trellis-update-spec` 路径：.trellis/spec/backend/ 相关文件）
- [x] E3 提交推送（origin master）+ 归档任务

## 验证命令

```bash
npm run type-check && npm run build
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e   # 24 项
node tests/authority.mjs                                   # 真后端 + mock 双模式
node tests/stress.mjs                                      # 4 项 ×2
curl -X POST http://127.0.0.1:8003/api/plugins/authority/probe
```

## 回滚点

- Phase A 后：删除 `plugins/authority` 克隆即完全卸载（实例零配置改动）。
- Phase C/D 后：插件侧改动 `git revert`；测试套件改动随代码同 revert。
