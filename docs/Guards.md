# 守卫族清单与用法（Guards）

> 面向维护者与 CI/agent 接入者，说明本仓静态守卫的现状、语义、串跑入口与负例自测方法。
> 事实真源＝实际代码（`scripts/guards/`、`tests/css-gate.mjs`、`.github/workflows/`、`package.json`）与 `.trellis/research/pack-transfer-rescan-2026-11-21.md`（12 路调查＋裁判汇总）。
> 状态按 2026-11-21 实测复核；早期文档所述「无 guards 目录 / 无 CI / type-check exit 2」为实施前旧状态，已失效。架构与运行形态见 `Dev-Guide.md`。

---

## 1. 现状总览（2026-11-21 实测）

- **`scripts/guards/` 六守卫已落地**：实测 `ls scripts/guards/` 命中 `check-ui-tokens.mjs`、`control-consumer.mjs`、`copy-audit.mjs`、`dom-injection.mjs`、`qa-static.mjs`、`template-source.mjs`。
- **`qa-static.mjs` 串跑入口已落地**：`scripts/guards/qa-static.mjs:1-16` 定义固定顺序串行（ui-tokens → dom-injection → template-source → control-consumer → copy-audit），前序失败即中止，提供 `--list/--only/--json/--self-test` 供 CI 与 agent 消费。
- **CI 门禁已存在**：`.github/workflows/checks.yml`（host-direct checks，push/PR 触发，`:34` 串 `npm run type-check`、`:40` 串 `npm run check:css`）与 `.github/workflows/release.yml` 均已落地。注意 CI 当前只串 `type-check` + `check:css`，尚未直接调用 `qa-static`。
- **npm script 仍为 7 条**（`package.json:6-14`）：`build`/`dev`/`dev:ui`/`type-check`/`check:css`/`test:e2e`/`test:stress`；`qa:static` / `verify:all` 尚未挂到 npm script。运行串跑入口需直接 `node scripts/guards/qa-static.mjs`。
- **`npm run type-check` 实测退出码 0（通过）**：`detectCapabilities()` 已在 `src/bridge/HostBridge.ts:108` 定义，构造函数 `:55` 调用有效；早期文档所述 `TS2551` 报错已不存在。
- 下方第 2 节列已落地的校验入口，第 3 节保留真源报告的守卫族编号与语义供追溯（状态列已按实测更新）。

---

## 2. 已落地的守卫与校验入口

### 2.1 `tests/css-gate.mjs` — CSS 作用域门禁

- 运行方式：`npm run check:css`（`package.json:11` 定义为 `node tests/css-gate.mjs`）。退出码非 0 即违规，逐条列出 `file:line` 证据（`tests/css-gate.mjs:8`）。
- 依据：双前缀铁律（L1-MR-3），见文件头注释 `tests/css-gate.mjs:1-8`。
- 三条规则：
  1. **禁全局选择器泄漏**：`*`、`html`、`body`、`:root` 开头的选择器一律违规（`tests/css-gate.mjs:52-56`）。
  2. **前缀纪律**：每条选择器须含 `.st-bg-*`（含 `.st-bgloader-*`）或 `#st_bg*`（`tests/css-gate.mjs:57-61`）；`@媒体/@keyframes/@import` 前置声明与 keyframes 内部 `from/to/N%` 豁免（`:46,50-51`）。
  3. **box-shadow 零容忍**：用户裁定 2026-09-26，边界用边框＋色调表达（`tests/css-gate.mjs:5,110-116`）。
- 扫描范围（不止聚合入口）：
  - `src/ui/style.css` 聚合入口 + `src/ui/styles/*.css` 拆分件（`tests/css-gate.mjs:6-7,16-25`）—— 2026-11-19 样式拆分后补齐的盲区教训。
  - `src/**/*.ts` 全量补扫 TS 模板字符串里的动态 CSS `box-shadow:`（`:123-145`）—— 2026-10-26 夜间审计 P2-2：`FrostedGlassController` 曾因此漏网。行内 `//` 注释豁免（`:140`）。
- 实现要点：单遍字符扫描，剥注释、跟踪括号深度、缓冲选择器并记录起始行（`:34-108`）；box-shadow 用「保行号去注释」二次扫描定位原始行（`:110-116`）。
- 通过输出：`tests/css-gate.mjs:152` 的「CSS 门禁通过：0 全局泄漏 / 0 缺前缀 / 0 box-shadow（…）」。

### 2.2 `npm run type-check` — 类型门禁（非守卫脚本，但同属静态校验入口）

- `package.json:10` 定义为 `tsc --noEmit`，配置 `tsconfig.json:2-13`（strict + noImplicitAny，包含 `src/**/*`）。本轮实测退出码 0（通过）：`detectCapabilities()` 已在 `src/bridge/HostBridge.ts:108` 定义，构造函数 `:55` 调用有效。早期文档「exit 2 / TS2551」为实施前旧状态，已失效。

### 2.3 `scripts/guards/` 六守卫与 `qa-static` 串跑（已落地）

- 六文件：`check-ui-tokens.mjs`、`control-consumer.mjs`、`copy-audit.mjs`、`dom-injection.mjs`、`qa-static.mjs`、`template-source.mjs`（实测 `ls scripts/guards/`）。
- 串跑命令：`node scripts/guards/qa-static.mjs`；固定顺序 ui-tokens → dom-injection → template-source → control-consumer → copy-audit，前序失败即中止；退出码全部通过 0 / 任一失败 1 / `--only` 名称不存在 2（`scripts/guards/qa-static.mjs:1-16`）。
- 接入缺口：串跑入口尚未挂 npm script（`package.json:6-14` 仍 7 条）；CI（`.github/workflows/checks.yml`）当前只串 `type-check` + `check:css`，未直接调用 `qa-static`。本轮未逐项复现六守卫的实跑读数，故不宣称「六守卫全绿」。

---

## 3. 真源报告守卫族语义索引（编号保留供追溯，状态已按实测更新）

> 下表保留真源报告的守卫编号与语义；C1–C5、D6 相关脚本已在 `scripts/guards/` 与 CI 部分落地（见第 2 节），状态列已按 2026-11-21 实测更新。仍属建议、未落地项如实标注。

### 3.1 静态守卫族（C 组）

| 编号 | 守卫名 | 语义 | 本仓锚点 / 状态 |
| :--- | :--- | :--- | :--- |
| C1 | `check:css-scope`（现有 `check:css` 纳管） | 全局选择器 / 扩展前缀 / box-shadow 三条规则 | `tests/css-gate.mjs:1-8,53-61`，已实跑退出码 0 |
| C2 | `check:ui-tokens` | 令牌单一真源回归校验 | 已落地 `scripts/guards/check-ui-tokens.mjs`；令牌真源 `src/ui/styles/00-tokens.css`；运行期断言见 `tests/e2e.mjs:948-949` Test 26 |
| C3 | `dom-injection`、`template-source`、`control-consumer` | 零依赖静态守卫：单一模板源锚点、按「增强式内嵌」语义 | 已落地 `scripts/guards/dom-injection.mjs`、`template-source.mjs`、`control-consumer.mjs`；UI 骨架 `dev/index.html` |
| C4 | `check:copy` | 文案审计：禁长句 / 括号说明 / 未转义 HTML | 已落地 `scripts/guards/copy-audit.mjs`；可复用 `tests/verify-ui-compact.mjs:111-138` 运行期断言（G-16） |
| C5 | `qa:static` | 固定顺序串行 + 非零中止的统一串跑入口 | 已落地 `scripts/guards/qa-static.mjs`；尚未挂 npm script |
| C6 | `registry.mjs` + `run.mjs` | 规则注册表与入口，支持 `--list/--only/--json/` 退出码汇总 | `qa-static.mjs` 内含 GUARDS 注册表与 CLI（`:18` 起），部分满足 |

### 3.2 规则一致性守卫（D 组）

| 编号 | 守卫（规划名） | 语义 |
| :--- | :--- | :--- |
| D1 | git-add-all 守卫 | 直对 G-10「显式 pathspec」红线 |
| D2 | iron-rule 三层一致性守卫 | 全局 AGENTS.md + 项目 AGENTS.md + spec 真源同步（§12.5） |
| D3 | tavern-rules 块哈希校验 | baseline 用本仓 `AGENTS.md` 声明的 `sha256:b963f91a…` |
| D4 | version 一致性守卫 | `package.json:3` 与 `manifest.json:9` 均应 `1.0.0` |
| D5 | qa-static-coverage 漂移防护 | 防 package.json 脚本 / guards / CI 三层名单不一致 |
| D6 | `verify:rules` / `verify:all` 总入口 | 串接现有 `check:css`、`type-check`、`test:e2e`；CI 已串前两者 |

### 3.3 几何与取证守卫（E 组）

| 编号 | 守卫（规划名） | 语义 |
| :--- | :--- | :--- |
| E1 | layout-geometry + no-overflow | 几何断言合并去重（含 self 断言），落 `dev/` 预览台（G-17） |
| E2 | checkbox-centering | 勾选框居中几何断言 |
| E3 | ui-shot / responsive / extra-matrix 合并 | 多视口截图脚本整合，复用 `tests/screenshot-night.mjs` |
| E4 | 负例优先自测 | 先证守卫能抓违规再信 0 读数；程序化断言判收截图（见第 4 节） |

---

## 4. 负例自测方法

> 原则（真源报告 E4）：守卫「退出码 0」只有在证明它能抓到违规后才有意义。已落地守卫的规则见第 2 节源码；以下配方基于 `css-gate` 真实规则，供接入 CI 时作为回归自检。

1. **全局选择器负例**：在 `src/ui/style.css` 临时加入 `body { color: red; }`，运行 `npm run check:css`，期望退出码非 0 且输出含 `全局选择器泄漏`（规则见 `:52-56`）。验证后**必须还原**该文件。
2. **缺前缀负例**：临时加入 `.foo { color: red; }`，期望输出 `缺少扩展前缀`（规则见 `:57-61`）。验证后还原。
3. **box-shadow 负例**：临时在样式或某 `src/**/*.ts` 注入面写 `box-shadow: 0 0 4px red`，期望输出 `禁止 box-shadow`（CSS 规则 `:110-116`、TS 注入面 `:136-144`）。验证后还原。
4. **拆分件盲区负例**：把违规写进 `src/ui/styles/` 下某个拆分 CSS（非聚合入口），确认仍被扫到（`:16-25` 的样式拆分补齐）。验证后还原。
5. **正例收尾**：还原后重跑 `npm run check:css`，期望退出码 0 与通过文案（`:152`）；再跑 `npm run type-check` 确认无回归。
6. **纪律**：负例改动仅在临时工作副本进行，遵循「变更用 diff、块级编辑、禁整文件覆盖」（G-09），验证后逐字还原，不得遗留。

> 状态：上述负例自测**本轮未实际运行**。上面是基于守卫源码规则推导的配方，不是本轮已通过的检查。

---

## 5. 验证状态（2026-11-21 本轮）

- 已实际运行的检查：
  - `npm run type-check`：**退出码 0（通过）**。命令 `npm run type-check`，输出头两行为脚本回显，无 TS 报错；日志末行 `TYPECHECK_EXIT=0`。证据：`detectCapabilities()` 定义于 `src/bridge/HostBridge.ts:108`。
  - 目录/文件实测：`ls scripts/guards/` 命中六守卫文件；`ls .github/workflows/` 命中 `checks.yml`、`release.yml`；`grep -n detectCapabilities src/bridge/HostBridge.ts` 命中 `:55`、`:108`；`head scripts/guards/qa-static.mjs` 与 `head .github/workflows/checks.yml` 已读取确认串跑与 CI 内容。
  - `npm run check:css`：真源报告与早期文档记载退出码 0，但**本轮未重跑**，不计为本轮实测通过。
- 未实际运行：`qa-static` 六守卫逐项串跑、第 4 节负例自测配方、`dist` 产物 grep 校验。均不宣称通过。
- 如实标注的接入缺口：`qa:static` 未挂 npm script；CI 未直接串 `qa-static`。早期文档「无 guards / 无 CI / type-check exit 2 / 无 Preact」为实施前旧状态，已在本文更正。
