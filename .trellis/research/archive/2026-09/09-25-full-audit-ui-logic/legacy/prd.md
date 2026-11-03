# 全仓全面体检：代码检查与 UI/逻辑优化

## Goal

对 `src/` 全部 27 个源文件（约 6800 行）做一轮全面代码体检，覆盖 **UI、逻辑、架构一致性、测试覆盖** 四个维度，产出分级问题清单（P1/P2/P3）；**P1/P2 当场修复**并过全量回归，**P3 记录汇总**供用户决策。完成后插件在 Dev 实例上功能零回归、UI 合规自查全过。

## Background

- 真后端集成任务（09-25-authority-live-integration）已归档，`git status` 干净，是本轮体检的干净起点。
- 代码库现状：核心大文件为 `ui/SettingsDrawer.ts`(1049)、`index.ts`(529)、`api/PublicAPI.ts`(517)、`audio/AudioEngine.ts`(447)、`backend/ServerOrigin.ts`(373)、`backend/AgentBridge.ts`(371)、`fx/AtmosphereFX.ts`(369)。
- 既有质量基建：`tests/e2e.mjs`(24 项)、`tests/stress.mjs`(4 项)、`tests/authority.mjs`(真后端 + mock 双模式)，门禁为全绿零回归（L0-13 / L1-MR-13）。
- 项目硬约束（审查基准）：AGENTS.md 统一规则块 v1.2.0 —— 特别是 L1-MR-3（CSS 双前缀）、L1-MR-7（有界等待）、L1-MR-8（Worker 置空）、L0-9/11/12（桥接层 / 适配器降级 / 禁 Host Bridge）、L1-MR-2（事实源在服务端原生目录）、L1-MR-4（UI 只落官方位置）。
- 本仓 spec 已全部填充（backend 5 篇 + frontend 6 篇），审查同时验证「实现与 spec 是否漂移」。

## Requirements

1. **全面审查**：`src/` 全部 27 个源文件逐文件过审，维度：
   - **逻辑正确性**：边界条件、错误路径、竞态、资源泄漏（事件监听/定时器/Worker/AbortController 未清理）、destroy 契约完整性；
   - **有界等待**（L1-MR-7）：所有 `await` 的媒体事件 / 跨源 fetch / 渲染 promise 必须可 settle；
   - **降级路径**（L0-11/L1-MR-1）：Authority 不可用时纯前端主路径全功能，后端调用 fire-and-forget 或显式降级；
   - **UI/UX**：加载态、错误反馈、文案一致性（中文）、操作反馈、焦点/键盘可达性、设置项分组合理性；
   - **CSS 合规**（L1-MR-3/L0-10）：双前缀、无裸选择器、无硬编码颜色（`var(--SmartTheme*, fallback)`）、自查 grep 为 0；
   - **架构一致性**：层边界（桥接层集中、核心不感知后端）、构造注入、事件总线代替 hooks、中央类型模块、cast 边界；
   - **与 spec 漂移**：实现与 `.trellis/spec/` 既有条文冲突之处。
2. **分级清单**：发现的问题按严重度分级并落盘任务目录 `research/findings.md`：
   - **P1**：bug / 回归风险 / 数据丢失风险 / 违反 MUST 规则（如 CSS 泄漏、无界等待、terminate 后引用未置空）；
   - **P2**：明显体验缺陷、一致性违规、冗余重复代码、日志噪音；
   - **P3**：改进建议（重构、命名、覆盖缺口、文档）。
3. **P1/P2 修复**：逐项修复，每项修完跑对应验证子集；UI 改动需在 Dev 实例人工冒烟（截图或页面求值确认）。
4. **P3 汇总**：形成带「建议方案 + 成本估计」的改进清单，交用户决策，不在本任务实施。
5. **零回归门禁**：`npm run type-check` + `npm run build` 通过；`npm run test:e2e` 24/24；`node tests/stress.mjs` 4/4 ×2 轮；`node tests/authority.mjs` 双模式全绿。E2E 只对 Dev 实例（8001/8003），绝不触碰 Real（L0-1/P-11）。

## Non-goals

- 不新增功能特性——本任务只做检查、修复与优化，不扩能力面。
- 不实施 P3 改进项（仅记录）。
- 不改实例配置文件；不向 `Instance/**` 写任何文件（实例隔离三条例外，本任务也用不到）。
- 不做大规模重构（如目录搬迁、模块拆分超过单文件范围）——那是 P3 建议的范畴。
- 不凭记忆改宿主 API 调用（L1-MR-5：以官方文档为准，发现疑似 API 误用先核对文档再改）。

## Acceptance Criteria

- [x] `research/findings.md` 落盘：覆盖全部 27 个源文件，逐文件有审查结论（含「无问题」的明确记录），P1/P2/P3 分级清晰、每项带 file:line 证据。
- [x] 全部 P1 与 P2 已修复；每项修复在 findings.md 中回填「修复说明 + 验证结果」。
- [x] CSS 合规自查为 0：`grep '^\.' src/ui/style.css | grep -vc 'st-bg'` = 0（本仓实际前缀为 `st-bgloader-`/`st-bg-mini-`/`st-bg-native-*`）；硬编码色已主题化或带豁免注释。
- [x] `npm run type-check` + `npm run build` 通过（165.39 kB）。
- [x] `npm run test:e2e` 24/24、`node tests/stress.mjs` 4/4 ×2、`node tests/authority.mjs` 双模式全绿，零回归。
- [x] P3 清单含建议方案与成本估计，已向用户汇报（14 项，见 findings §3 P3 表）。
- [x] spec 如有新教训已更新（`.trellis/spec/`，自包含）；提交已推送 origin master。

## Risks

- **审查主观性**：UI/UX 判断缺乏客观标准 → 以 spec 既有 UI 条文 + 宿主一致性为锚，拿不准的列入 P3 征询用户。
- **修复引入回归** → 小步修 + 每步对应验证子集 + 末尾全量三套件；UI 改动必冒烟。
- **E2E 依赖 Dev 实例存活** → Phase A 先确认实例可达（8003），不可达则先启动实例再跑基线。
- **审查发现超范围问题**（如架构级缺陷）→ 不当场大改，记 P3 并向用户汇报。

## Rollback

全部改动走常规 git 提交，小步提交语义，必要时按提交粒度 revert；无实例侧改动，天然可回滚。
