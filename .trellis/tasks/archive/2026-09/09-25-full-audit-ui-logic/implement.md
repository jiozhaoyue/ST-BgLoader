# 实现清单 — 全仓全面体检

> 复选框随执行实时勾选（L0-2）。验证命令集中在文末。

## Phase A：基线验证（起点必须全绿）

- [x] A1 确认 Dev Luker (8003) 可达；不可达则用实例目录既有启动方式拉起（零配置改动）
- [x] A2 `npm run type-check` + `npm run build` 通过（记录产物体积基线）
- [x] A3 `TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e` 24/24
- [x] A4 `node tests/stress.mjs` 4/4、`node tests/authority.mjs` 双模式全绿
- [x] A5 记录基线结果到 findings.md（审查期间发现的失败与修复导致的失败以基线区分）

## Phase B：机械自查（脚本化零遗漏）

- [x] B1 CSS 合规：前缀逐条核对 + 硬编码色扫描，结果记 findings.md
- [x] B2 等待与泄漏面扫描：await / addEventListener / 定时器 / Worker / AbortController / objectURL / rAF 逐处核对清理与超时
- [x] B3 合规面扫描：Host Bridge 引用、`as any` 计数对 spec 基线、console 噪音分布
- [x] B4 扫描结果并入 findings.md 候选问题池

## Phase C：逐组精读审查（G1→G6）

- [x] C1 G1 入口/装配：index.ts
- [x] C2 G2 渲染：renderers/* + core/{MediaMount,ParallaxController,SceneManager}
- [x] C3 G3 缓存与挂载：cache/* + backend/{ServerOrigin,ServerSettings,SettingsSync,RemoteImporter}
- [x] C4 G4 Authority 增强：backend/{AuthorityBridge,AgentBridge}
- [x] C5 G5 音频/特效：audio/* + visualizer/* + fx/*
- [x] C6 G6 UI/触发/API：ui/* + style.css + triggers/* + core/ShortcutManager + api/* + types/*
- [x] C7 子代理交叉复核 P1/P2 结论（≤3 并发、小模型、自包含任务），误判修正 —— 子代理供应商不可用，降级为主脑逐条二次核验（F1/F5 两处修正，见 findings §5）
- [x] C8 findings.md 定稿：逐文件结论 + P1/P2/P3 分级清单（P3 带方案与成本估计）

## Phase D：修复 P1/P2

- [x] D1 修复全部 P1（每项：tsc 快验 + 对应测试子集）
- [x] D2 修复全部 P2（每项：tsc 快验 + 对应测试子集；UI 项收口一次 Dev 实例冒烟）
- [x] D3 findings.md 回填每项「修复说明 + 验证结果」
- [x] D4 Dev 实例 UI 面人工冒烟：设置抽屉、背景切换、迷你播放器、错误态

## Phase E：全量回归与收尾

- [x] E1 全量门禁：type-check + build + e2e 24/24 + stress 4/4 ×2 + authority 双模式
- [ ] E2 P3 清单向用户汇报（带方案与成本）
- [ ] E3 spec 新教训更新（如有；条文自包含，落 .trellis/spec/）
- [ ] E4 提交推送 origin master + 归档任务

## 验证命令

```bash
npm run type-check && npm run build
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e   # 24 项
node tests/stress.mjs                                      # 4 项 ×2
node tests/authority.mjs                                   # 真后端 + mock 双模式
grep '^\.' src/ui/style.css | grep -vc 'app-container\|bg-loader'   # 必须为 0
```

## 回滚点

- Phase A 后基线已定，任何修复引入回归且无法快速定位 → 按提交粒度 revert，问题项降级转 P3 记录。
