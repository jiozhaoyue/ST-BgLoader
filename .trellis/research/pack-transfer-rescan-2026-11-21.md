# pack-transfer 经验迁移复扫裁决报告（2026-11-21）

> 本报告由独立汇总裁判基于 12 路结构化调查结论去重合并而成，裁判未参与任何一路调查过程。
> 报告中一切仓库文件引用均采用仓内相对路径；不记录本机绝对路径、密钥与隐私数据。
> 本仓 = `ST-BgLoader`（`package.json:2` name=st-bg-loader），参照仓 = pack-transfer（ST-pack-transfer）。

---

## 一、结论段

猫猫（汇总裁判）对 12 路结论交叉核验后，得出三条总判断喵：

1. **报告原始前提大面积失真，必须整体纠偏喵。** 前 5 路（按行段切分的 workflows/脚本/tooling/core/ui/测试/文档章节复核）一致发现：报告把本仓误当成「ChatFilesys 零构建直载插件 + VitePress 双语 docs + scripts/guards 数十守卫 + Python harness + AGPL 许可证」。而本仓实测形态为：`package.json:7` build=`vite build`、`package.json:8-9` 有 dev/dev:ui 脚本、`package.json:32-36` 仅 puppeteer-core/typescript/vite 三个 devDependency、`package-lock.json` 存在（45911 字节）、`dist/index.js`（257710 字节）+ `dist/style.css`（17194 字节）为构建产物、无 `docs/`（有 `wiki/`）、无 `web/`（有 `dev/`）、无 `scripts/`、无 `.github/workflows/`、无 `public/`、测试体系为 `tests/*.mjs`（Node）而非 Python。据此，凡以「零构建 / 无 lock / 无 dist / 已有 docs / 已有守卫」为由的 REJECT 与落地描述均不成立，已全部翻案或标注。

2. **可移植的「机制」与不可移植的「业务载体」必须分离喵。** 通用机制（构建/发布纪律、隐私脱敏、静态守卫族、规则引擎、几何截图取证、E2E 防误连纪律、宿主单一桥、令牌单一真源、E2E 夹具卫生、渐进式挂载范式）与本仓高度契合，判「立即可做」；依赖本仓并不存在的载体（VitePress 文档站、双语 i18n、Pages 双 active 部署、多实例真机宿主、整套 Issue/PAT 提交、Worker 体系、整套 upstream 溯源、公开化脱敏分层）的条目判「需主人裁定」或「不建议」。

3. **后 7 路专项盘点给出了落点修正与真实缺口喵。** UI 层/work 台/守卫/文档/参照仓框架/框架生态/Dev Luker 环境七路，把「机制可用」进一步落到本仓真实锚点（`dev/index.html` 预览台、`tests/css-gate.mjs` 唯一静态守卫、`wiki/` 15 篇文档、00-tokens.css 单一真源），并暴露出三类真实缺口：守卫体系缺 CI 门禁、wiki 缺「全形态×分辨率断点差异表」、FrostedGlassController 绕过令牌单一真源。

裁决分布（按主题去重合并后的建议条目）：立即可做约 40 组、需主人裁定约 17 组、不建议约 9 组；另有 20+ 条 REJECT 因前提失实被复核翻案。

---

## 二、建议采纳清单

> 说明：多路重复的同一机制已去重合并为一组；「来源」栏标注调查路编号（1-5 为行段复核路，6-12 为专项盘点路）。

### 2.1 立即可做（adopted）

**A. CI 与构建发布纪律（本仓 vite 构建已确认）**
- A1 新建最小门禁工作流骨架：push+pull_request 双触发、permissions contents:read 最小权限、checkout@v4、setup-node 钉版本+cache:npm、ubuntu-latest，沿用 `name: host-direct checks` 命名纪律。〔来源：路1、路2〕
- A2 root `npm ci` 装构建依赖并挂 CI（推翻报告「无 lock、npm ci 失败」的拒绝理由）。〔来源：路1 id8、路2 id1.43、路4  rejecting 复核〕
- A3 构建冒烟 `npm run build`（vite build）与 dev server（Vite createServer）接入门禁，替换报告错误剔除。〔来源：路1 id15、路2 id3.10、路4 id14.1/14.3〕
- A4 发布产物非空校验（MIN_SIZE，目标换 `dist/index.js`）、幂等发布、步骤摘要（$GITHUB_STEP_SUMMARY）、仅 tag/手动触发的发布纪律、大产物走 Release asset 不入库。〔来源：路2 1.46-1.48、路2 1.36-1.37〕
- A5 发版前 `npm test` 门槛——机制采纳，但需先补测试脚本（本仓 package.json:6-14 仅 7 条脚本、无 npm test）。〔来源：路2 1.44〕

**B. 隐私与凭据红线（G-11 / D-10，通用强契合）**
- B1 docs-privacy 凭据泄露扫描，扫描目标改本仓公开目录 `wiki/`。〔来源：路1 1.11、路2 1.25、路3 3.5、路4 9.29〕
- B2 移植 desensitize 脱敏工具（路径/用户名/邮箱/凭据/日期→占位符），出处 `tooling/rules/desensitize.mjs:1-14` 已核。〔来源：路2 3.23〕
- B3 Issue 相关一律遵循「零网络采集敏感 + 统一 redact + 令牌独立存储键隔离」，若落地 Issue 提交必须采纳。〔来源：路5 13.15/13.27/13.54〕
- B4 `.gitignore` 已有的 `.env`/凭据/真实数据/产物忽略项保持（本仓 `.gitignore` 已落地）。〔来源：路4 9.51-9.52〕

**C. 静态守卫族与统一串跑（本仓仅 `tests/css-gate.mjs` 一个静态守卫）**
- C1 保持并纳管 `check:css-scope`（由 `tests/css-gate.mjs:1-8,53-61` 覆盖全局选择器/扩展前缀/box-shadow 三条规则，实跑 `npm run check:css` 退出码 0）。〔来源：路2 2.7、路4 9.21、路8〕
- C2 新增 `check:ui-tokens`，针对 `src/ui/styles/00-tokens.css` 令牌单一真源做回归校验（本仓 e2e.mjs:948-949 Test 26 已有运行期断言，可静态化）。〔来源：路1 1.13、路4 9.30、路8〕
- C3 新增 dom-injection、dom-scope、template-source、control-consumer 四类零依赖静态守卫（单模板源锚点选在本仓唯一 UI 骨架 `dev/index.html`），语义按增强式内嵌改写。〔来源：路2 2.8/2.9/2.18/2.5、路4 rejectRecheck 5.22〕
- C4 新增 `check:copy` 文案审计守卫（禁长句/括号说明/未转义 HTML），可复用 `tests/verify-ui-compact.mjs:111-138` 已有运行期断言。〔来源：路3 2.6、路4 9.27、路8〕
- C5 建立 `qa:static` 固定顺序串行 + 非零中止的统一串跑入口，消除守卫散落与漏跑。〔来源：路2 3.9、路4 9.46〕
- C6 移植规则注册表 `registry.mjs` 与入口 `run.mjs`（--list/--only/--json/退出码汇总），让铁律可被 CI/agent 消费。〔来源：路2 2.72-2.73〕

**D. 规则引擎与铁律一致性校验（本仓铁律密集，强契合）**
- D1 移植 git-add-all 守卫，直对本仓 G-10「显式 pathspec」红线。〔来源：路2 2.74〕
- D2 移植 iron-rule 三层一致性守卫，指向全局 AGENTS.md + 项目 AGENTS.md + spec 真源（对应 §12.5 三层同步铁律）。〔来源：路2 2.76、路2 3.22〕
- D3 移植 tavern-rules 块哈希校验，baseline 填本仓 `AGENTS.md` 声明的 sha256（b963f91a…），校验声明与正文一致。〔来源：路2 2.78〕
- D4 移植 version 一致性守卫（本仓 `package.json:3` 与 manifest.json 均 version=1.0.0）。〔来源：路2 2.79〕
- D5 移植 qa-static-coverage 漂移防护，防 package.json 脚本/guards/CI 三层名单不一致。〔来源：路2 2.77〕
- D6 建立 `verify:rules` / `verify:all` 总入口，串接现有 check:css、type-check、test:e2e。〔来源：路4 9.38/9.42〕

**E. UI 几何与截图取证（本仓有 puppeteer-core + `dev/` 预览台，G-17）**
- E1 移植 layout-geometry 与 no-overflow 几何断言并按报告建议合并去重（含自检 self 断言），落地 `dev/` 预览台。〔来源：路2 3.12/3.13、路4 9.31-9.34〕
- E2 移植 checkbox-centering 几何断言。〔来源：路2 3.11、路4 9.31〕
- E3 整合多视口/设备矩阵截图脚本为单一入口（ui-shot、responsive、extra-matrix 合并），复用 `tests/screenshot-night.mjs` 基础。〔来源：路2 2.20/2.30/2.32、路3 3.25/3.26、路5 15.37〕
- E4 负例优先自测：先证守卫能抓违规再信 0 读数；程序化断言判收截图。〔来源：路3 7.19、路3 7.39〕

**F. E2E 测试纪律（本仓 `tests/e2e.mjs` Node 体系）**
- F1 端口/实例集中冻结登记 + guard 白名单（只连 Dev、启动即断言、无默认值、禁自动改写），载体落本仓 Node 侧而非 Python。〔来源：路3 7.11-7.13、路5 15.25-15.26〕
- F2 harness 可归因读数（PLUGIN_SLUG 归因）、splash 有界等待（90s 只告警）、弹窗只看不碰、reportBlockingPopups、installPromptGuard。〔来源：路3 7.6-7.10、路5 15.27〕
- F3 有界等待/回读/非空前置门三纪律 + finally 关服务器 + strictPort 端口占用即失败。〔来源：路3 7.29-7.35、路4 12.16〕
- F4 错误归因隔离与 slug 双栏判定过滤第三方噪声（本仓跑在多扩展宿主强相关）。〔来源：路3 7.7〕
- F5 确定性夹具生成器 + CLI 双向负例 + 三向断言防退出码 0 零产物。〔来源：路3 7.42/7.43/7.46/7.50〕
- F6 静态服务器多挂载最长前缀优先 + 敏感段/路径穿越防护。〔来源：路3 7.29-7.30〕
- F7 fixture-prune 跨 spec 持久化 profile 自清理（E2E 夹具卫生）。〔来源：路3 7.14、路5 rejectRecheck 15.34〕

**G. 宿主适配与单一真源（D-01 / D-02，本仓已有 HostBridge.ts / 00-tokens.css）**
- G1 宿主能力显式声明表（禁按平台推导），落本仓 `src/bridge/HostBridge.ts`。〔来源：路3 4.31〕
- G2 唯一宿主桥 detectHost/getContext/Popup 语义对齐本仓 `src/bridge/HostBridge.ts`，剔除备份端点业务。〔来源：路3 5.9、路5 13.19/13.22〕
- G3 保持 `src/ui/styles/00-tokens.css` 令牌单一真源 + 宿主令牌派生 `--st-bg-*` + 只挂容器根不写 :root 的作用域隔离（实测已落地）。〔来源：路4 12.1/12.18/12.19、路5〕
- G4 两形态共用入口与锚点对齐（dev 已补 `#extensions_settings`/`#Backgrounds`/`#backgrounds-drawer-toggle`），MiniPlayer/SettingsDrawer/TopbarDrawer 三块两形态共用。〔来源：路6、路7〕
- G5 HTML 转义 + isSafeHttpUrl 协议把关 + path-safety 路径段净化（防穿越），本仓有 innerHTML 渲染与本地媒体加载。〔来源：路3 4.45/5.4〕
- G6 有界 fetch 封装 + 流停滞守卫，落 `src/backend/RemoteImporter.ts`（契合 G-19）。〔来源：路3 5.6〕
- G7 把 no-bundler-only 守卫语义改写为「构建产物自包含/零外部引用校验」后采纳（检查 `dist/index.js` 无裸模块 import、无 CDN 引用），契合 G-13；不改「本仓零构建」的原始措辞。〔来源：路1 1.9、路2 3.8、路3 7.51/7.58〕

**H. 通用纯逻辑工具（去业务绑定后可移植）**
- H1 app-version 版本单一真源（构建注入 + 运行时回退）。〔来源：路3 4.1〕
- H2 logger 结构化日志/脱敏/环形缓冲/导出 + report 分类计数/丢弃警告（G-20 失败不静默）。〔来源：路3 4.34/4.51〕
- H3 sanitize-share 对齐本仓 `src/core/sanitize.ts`（D-10/G-11）；selection-defaults 默认值单一源；stage-timings 异步分段计时（D-12 性能预算）。〔来源：路3 4.55/4.56/4.60〕
- H4 export-queue（formatBytes/triggerBlobDownload）、plugin-data 配置导入导出+凭据分档、settings-store localStorage+宿主双层持久化。〔来源：路3 5.5/5.15/5.19〕
- H5 issue-report 通用反馈通道（环境采集+脱敏+提交，坐标换本仓、沿用 redact）。〔来源：路3 5.12〕
- H6 docs-site.js 唯一源 + 合法 http(s) URL 校验 + 三态回退（默认站点值本地化）。〔来源：路3 rejectRecheck 4.12、路5 13.63〕
- H7 upstream-resolver 的纯工具子集：owner/repo 正则与长度上限、scp→ssh 归一化、parseGitHubUrl 四 URL 解析、3 秒超时 + AbortController、isFork 判定、provenance 如实标注、离线权威托底、URL 长度护栏、ISSUE_REPO_DEFAULT 空占位、normalizeSettings 白名单。〔来源：路5 13.4-13.13/13.31-13.32/13.42/13.47〕
- H8 日志与脱敏纯函数：filterEntriesByMinLevel、safeSerializeDetail、collectLogText、escHtml/mdCell/redactPageUrl、renderMarkdownSafe、previewRedacted。〔来源：路5 13.18/13.23-13.27/13.51〕
- H9 异步有界与内存释放：composeIssueReportText 剪贴板降级 + objectURL 60s 释放、disposeSettingsPanel 监听注销、debounce 联动。〔来源：路5 13.56/13.58/13.61〕
- H10 buildGitHubNewIssueUrl 零凭据 URL 拼装（仅在当前无凭据风险范围内复用）。〔来源：路5 13.31〕

**I. 文档与开源基建（落本仓 `wiki/`）**
- I1 README 中文主文档保持，新增 `README.en.md` 英文版互链。〔来源：路4 9.1-9.3〕
- I2 新增 CONTRIBUTING.md、CODE_OF_CONDUCT.md、SECURITY.md 三份通用开源文件。〔来源：路4 9.55-9.57〕
- I3 `.trellis/` 顶层结构保持，补建 `.trellis/audit/` 作 G-26 证据留存落点（不删本仓私有 agents/tasks 增强）。〔来源：路4 11.6-11.12/11.17〕
- I4 wiki 补「全形态（桌面/移动端/抽屉/全屏/mini）× 分辨率断点（1000/450）差异表」——P0 铁律①缺口，实现 `src/ui/styles/07-responsive.css:9,25,56` 与 spec `.trellis/spec/frontend/host-native-ui.md:359` 已定义但文档零命中。〔来源：路9〕
- I5 用户使用指南与排查指南补强（P1）：Home 快速上手仅 2 节、FAQ 仅 5 问，需补分形态操作说明。〔来源：路9〕

**J. 架构范式借鉴（不引入完整框架）**
- J1 借鉴参照仓渐进式挂载范式：动态 import + 特性检测 + try/catch 静默降级 + in-flight 并发守卫 + unmount 清理，与本仓 D-03 同构。〔来源：路10、路11 方向论证〕
- J2 借鉴响应式单向数据流 store（reactive+computed+具名 mutation）用于本仓复杂面板状态，以及单一模板源 getWorkbenchHtml() + 守卫脚本的多落点思路。〔来源：路10〕

### 2.2 需主人裁定（needsUser）

- N1 是否新建 GitHub Pages 文档站——本仓无 `docs/`（有 `wiki/`），报告所述 VitePress 站、双 active 部署、白名单校验、Pages 三件套（configure-pages/deploy-pages/upload-artifact）全部无落点。〔来源：路1 1.10/1.16/1.18-1.21/1.29-1.34、路2 1.34、路4〕
- N2 是否建立 docs 双语体系（.md↔.en.md、frontmatter alt_url/alt_lang、hreflang、语言按钮），本仓纯中文、无 i18n/locales。〔来源：路3 3.6、路4 8.18/8.20-8.21、路9〕
- N3 是否引入 i18n/locales（含 i18n-guard、check:i18n）——本仓中文 UI 无该体系，且路3 判 reject、路4 部分判 adopt，口径冲突。〔来源：路2 2.10/2.75、路3 6.8/7.59、路4 9.26〕
- N4 是否引入前端框架（Vue/Preact/Solid/Lit/Svelte）及采用哪种——涉及零运行时依赖、宿主 ESM 支持边界与体积增量，属重大方向决策。〔来源：路3 5.24-5.25、路5 15.31、路10、路11〕
- N5 是否引入 Worker 重计算与任务体系（converter-worker、worker-client、task-manager、task-queue-controls）。〔来源：路3 4.8/4.63/4.64/4.70〕
- N6 是否移植整套 Issue 报告与提交体系（含 PAT 直连外部写操作 G-07、动态表单、双轨跳转、设置面板分组）。〔来源：路5 13.1/13.16-13.17/13.22/13.26/13.28-13.30/13.33/13.36-13.55/13.57-13.62〕
- N7 是否移植整套 upstream-resolver 双通道溯源体系（探测链、upstream remote 优先、API source 反查、四字段返回结构）。〔来源：路3 rejectRecheck 4.68、路5 13.1-13.2/13.7-13.9/13.14〕
- N8 是否做公开化脱敏分层（.private/ 私有层 + 精细 ignore + 脱敏命令），属 P2 方向决策，本任务未运行脱敏。〔来源：路4 9.53/11.1-11.4/11.18-11.19〕
- N9 LICENSE 换证——README 徽章与 `package.json:16` 均为 MIT，报告称已有 AGPL，性质冲突。〔来源：路4 9.58〕
- N10 是否新增 web 主题切换 UI（head 防闪脚本、themeKey、applyTheme、主题按钮、matchMedia 监听）——本仓纯 CSS 跟随宿主、无 JS 主题态。〔来源：路4 8.19/8.22/8.29-8.30/8.33-8.36、12.11/12.13〕
- N11 是否建多实例真机 E2E 基础设施（报告所称 hosts.py/Python harness 本仓均无）。〔来源：路2 3.15、路5 15.31/15.40〕
- N12 是否建立 node --test 细粒度单测体系（报告称有 46 个 .test.mjs，实测无）。〔来源：路3 7.48〕
- N13 是否引入 BackupSet/size-model/storage-inspector/transfer-prune 等缓存增强（本仓有 CacheManager，需评估是否重复）。〔来源：路3 4.3/4.32/4.57/4.61/4.66〕
- N14 harness 教程/「不写真实数据」模式（dry-run 拦截持久化）——当前 harness 写真实数据，全仓零教程命中，是否新增需裁定。〔来源：路7〕
- N15 是否把守卫族从 `tests/*.mjs` 迁到 `scripts/guards/` 并挂 CI/提交前门禁（本仓现无 CI、无 husky）。〔来源：路8〕
- N16 Dev Luker 8003 端口占用进程来源确认，以及旧插件 Extension-VideoBackgroundLoader 与本仓符号链接的双加载/功能重叠风险是否处理。〔来源：路12〕
- N17 dist-offline 单文件离线分发形态是否新增（本仓 dist 为 vite lib 产物，无单文件离线形态）。〔来源：路4 14.2〕

### 2.3 不建议（rejected）

- R1 无本仓业务载体的纯业务模块：chart-model/git-graph/delta/demo-tree/merge-packages/migration-* 全套/null-writer/plan-preview/restore-batch/s3-crypto/zip-io/zone-model/target-inventory（分支树、迁移、zip、加密、S3 导出等本仓均无业务）。〔来源：路3〕
- R2 纯 VitePress 文档站组件：侧栏数据驱动/移动端目录抽屉/TOC 生成与滚动高亮/当前页高亮/上下篇 pager/页脚返回链接/docs.js IIFE/初始主题应用/系统主题监听/语言切换保留 hash。〔来源：路4 8.23-8.28/8.31-8.32/8.35/8.37-8.38〕
- R3 JS 主题态全套：themeKey 持久化/applyTheme+data-theme/matchMedia 跟随/防闪脚本/#docs-theme 按钮——本仓纯 CSS @media 已跟随宿主，引入属过度设计。〔来源：路4 12.8-12.10/12.12/12.14-12.15/8.35/8.37〕
- R4 描述他仓形态而非本仓的「本仓现状」条目：ui/common.js 分支色板、core/design-contract.js THEME_MODES、web/style.css 变量集、组件直接用 SmartTheme（与本仓「组件只引 --st-bg-*、SmartTheme 仅限 00-tokens.css」规则直接矛盾）。〔来源：路4 12.20-12.24〕
- R5 login-state-guard（Git 登录态徽标，本仓为背景插件无此 UI）。〔来源：路2 3.7〕
- R6 docs-sync 与 docs-sync.manifest.json（无 `docs/` 载体、无 verify:sync）。〔来源：路2 3.6、路4 9.60〕
- R7 check:i18n 硬编码文案守卫（本仓无 i18n，与各路口径冲突；文案审计走 C4 的 check:copy）。〔来源：路4 9.26〕
- R8 双 active 部署精细管理（依赖 Pages 部署及其复杂度，本仓无部署流）。〔来源：路1 1.34、路2 1.34〕
- R9 public/ 静态资源交付根（本仓无 public/，源码在 src/、产物在 dist/）。〔来源：路4 14.7〕

---

## 三、REJECT 复核

> 共通根因：报告以「本仓零构建 / 根目录无 package-lock.json / 无 dist / vendor ESM 直载 / 已有 build-release.mjs」为由 REJECT。猫猫实测：`package.json:7` build=vite build、根目录 `package-lock.json` 45911 字节、`dist/index.js` 257710 字节、`dist/style.css` 17194 字节；build-release.mjs 不存在。据此下列 REJECT 前提失实，逐条裁决：

| 原编号 | 名称 | 报告拒绝理由 | 复核裁决 | 来源 |
| --- | --- | --- | --- | --- |
| 1.8 / 1.43 / 9.5-9.10 / 9.50 | root npm ci / vite scripts | 无 lock、零依赖 | 翻案采纳：lock 与 devDeps 俱在，CI 装依赖必需 | 路1/2/4 |
| 1.15 / 14.1 / 14.3 | Build sanity / dist 构建产物 / build.lib | 零构建、无 build 脚本 | 翻案采纳：vite build 成立，dist 为产物 | 路1/4 |
| 1.24 | deploy 侧 npm ci | 根目录零依赖无 lock | 翻案采纳：同 1.8 | 路1 |
| 1.27 | Build Web Application | web/ vendor 直载无 build（实测无 web/，为 dev/） | 翻案采纳 | 路1 |
| 3.10 / 12.17 | start-dev-server / vite 构建态 | 固定 3050、http-server 零构建 | 翻案采纳：本仓 `dev:ui=vite --config vite.config.dev.ts` | 路2/4 |
| 2.17 | run-e2e-instances | 多实例矩阵被整体拒 | 部分采纳：去多实例后复用编排骨架（本仓已有 e2e.mjs、smoke-ui.mjs） | 路2 |
| 3.3 | check-download-html | 硬编码路径 + 声称本仓已有 build-release.mjs（实测无） | 部分采纳：产物体积/DOCTYPE/自包含校验思路可用 | 路2 |
| 2.2 | capture-instance-shots | 多 Instance 布局被拒 | 部分采纳：去多实例后复用错峰截图落盘 | 路2 |
| 4.12 | docs-site.js | 被拒 | 翻案采纳：唯一源+绝对 URL 校验通用（见 H6） | 路3 |
| 4.68 | upstream-resolver.js | 被拒 | 部分采纳：纯溯源工具可用，整套体系待裁定（见 N7） | 路3 |
| 5.1 | chart-prefs.js | 被拒 | 部分采纳：localStorage 归一化+默认值迁移可借鉴 | 路3 |
| 5.2 | chat-store-bridge.js | 被拒 | 部分采纳：能力自述+有界超时+冻结探针范式（本仓 src/api/PublicAPI.ts） | 路3 |
| 5.22 | workbench-template.js | 被拒（称本仓已有 check:template-source，实测无） | 翻案采纳：单一模板源纪律（见 C3） | 路3 |
| 5.26 | InspectModal.vue | 被拒 | 范式采纳：scoped 令牌化样式写法，组件本身不落 | 路3 |
| 6.1 | authority-store.js | 被拒 | 对齐采纳：本仓已有 src/backend/AuthorityBridge.ts 同类适配器 | 路3 |
| 6.2 | db.js | 被拒（称本仓已有 idb.js，实测无） | 对齐采纳：CacheManager 可对齐 IndexedDB 适配层 | 路3 |
| 6.8 | i18n/dom.js | 被拒 | 随 N3 裁定，暂不采纳 | 路3 |
| 7.24 / 7.27 | standalone/dist 挂载 / ensureBuild | 零构建无 dist | 翻案采纳：dist 存在、build 可复测，构建新鲜度检测可用 | 路3 |
| 7.59 | check:i18n / check:copy | 被拒（称本仓已有模板真源守卫，实测无） | copy 翻案采纳（见 C4），i18n 随 N3 | 路3 |
| 13.35 | import.meta.glob | 零构建 vendor 直载 | 部分采纳：本仓 vite 构建态可用，需实测 | 路4 |
| 15.32-15.34 / 15.38 | workbench-flow/entry/fixture-prune/e2e specs | 业务专属被拒 | 范式采纳：E2E 流程框架与用例组织可借鉴（见 F1/F7） | 路5 |

---

## 四、框架引入方案对比

> 数据来源：路11 实测 bundlephobia API（size 为包自身 minified、gzip 为 minified+gzip 参考值）、官方 README 原文抓取、本仓 `package.json:32-36` 与 `vite.config.ts:7-24`；路10 提供参照仓 Vue 3 渐进式实践。所有数字为包自身参考值，**非本仓实际增量**（本次未运行 build，实际增量未实测）。

| 方案 | size / gzip | 依赖数 | 集成路径 | 共存风险证据 | 推荐度 |
| --- | --- | --- | --- | --- | --- |
| 强化原生 DOM（现状） | 0 B / 0 B | 0 | 沿用事件监听+DOM API，零构建链改动 | 最低：已有 `.st-bgloader-*` 前缀与 `--st-bg-*` 令牌，按共存验证方式运行 | ★★★★★ 首选 |
| Preact | 11636 / 4798 B | 0 | devDependency + vite lib 打包，或 ESM vendor 相对 import | 渲染真实 DOM，须保留自有根前缀、不重建宿主原生抽屉 | ★★★★ 若需组件化 |
| Solid | 21809 / 8220 B | 3 | 同 Preact | 官方明示「编译到真实 DOM、无虚拟 DOM diff」，须只操作自有根节点 | ★★★ 中 |
| Lit | 15501 / 6023 B | 3 | Web Components 自定义元素 | Shadow DOM 隔离理论最优，但官方隔离原文未取到、`--SmartTheme*` 能否穿透 Shadow Tree 未验证 | ★★★ 待证据 |
| Svelte | 19578 / 8006 B | 14 | 需引入 vite svelte 插件编译 | 依赖数 14 + 编译链复杂度，是否违反 D-07「安装即用/不得要求构建」待确认 | ★★ 中低 |
| Vue 3（参照仓） | 约 71725 B min | — | 参照仓渐进式局部用（仅 InspectModal.vue + mount.js + store.js 三文件） | 动态 import + 特性检测 + 静默降级 + in-flight 守卫成熟，但全套引入属重大决策 | 随 N4 裁定 |

**证据缺口（如实声明，禁止臆测）：** ①酒馆官方 Extensions 文档各分支路径均 http=404，扩展对 ESM import/自定义元素/Shadow DOM 的支持边界无可靠证据；②各框架打入 `dist/index.js` 后的真实体积增量未实测（基线 257710 B）；③Lit/Svelte 下宿主主题变量 `--SmartTheme*` 能否穿透未验证；④Vite rollupOptions.external 官方原文未取到（本仓 `vite.config.ts:15-24` 有实测配置）；⑤Svelte 官方 kB 数字与「no virtual DOM」明确声明未取到。以上均未以推测填补。

---

## 五、本仓现状与缺口

**UI 层（路6）：** `src/ui/` 共 6 个 TS 控制器 + 1 聚合 CSS（`src/ui/style.css`）+ 8 个拆分样式（`src/ui/styles/00~07`）；DOM 生成统一为手写 innerHTML 字符串模板 + 局部 createElement，无框架；所有样式经 `src/index.ts:1` 唯一入口注入。两形态共用入口（`dev/boot.ts:6-7` 先装 host-stub 再 import `../src/index`）。真实缺口：**`src/ui/FrostedGlassController.ts:50,53` 在运行时 CSS 中直接引用 `--SmartThemeBlurTintColor`/`--SmartThemeBorderColor`，与 `src/ui/styles/00-tokens.css:6`「全仓唯一允许引用 --SmartTheme*」声明冲突，属待修的令牌单一真源违例**；工作台因缺 `#bg1`/原生瓦片/`FORCE_SET_BACKGROUND` 事件类型/主题变量注入，原生接管装饰与拦截不生效（host-stub 自述属预期 drift，预览不能替代真机验收）。

**web 工作台（路7）：** `dev/` 五文件齐备（index.html、boot.ts、host-stub.ts、mock-server.ts、styles/harness.css），mock-server 模拟四端点；但它是「开发预览台」(`dev/index.html:7`) 而非完整全控件 web 工作台，无独立全控件渲染面；云端不可用走文字提示「本地模式」而非灰化（B 端能力缺失无统一「渲染+灰化」策略，仅主开关一个灰化正例 `SettingsDrawer.ts:55-58`）；**教程/只读/不写真实数据模式全仓零命中，现有 harness 反而写真实数据**。

**守卫测试（路8）：** `scripts/guards/` 不存在，全部守卫在 `tests/*.mjs`；仅 `tests/css-gate.mjs` 一个静态守卫被 npm script 引用（`npm run check:css` 实跑退出码 0），`npm run type-check` 实跑退出码 0；**无 CI（无 .github/workflows）、无 husky/lint-staged/pre-commit**；12 个测试脚本均不自启服务器，依赖外部 :5173 或 :8003；check-sync、copy-audit、ui-tokens、dom-injection 等均无独立静态守卫（部分仅内嵌在真机套件的运行期断言中）。

**文档（路9）：** 无 `docs/`，实际为 `wiki/` 15 篇 1572 行；开发者文档 10 类齐全，但**响应式/多形态适配主题完全缺席**（断点关键词命中 0，而实现 `src/ui/styles/07-responsive.css:9,25,56` 与 spec `.trellis/spec/frontend/host-native-ui.md:359` 均已定义 1000/450/36px），属 P0「静默设计」缺口；用户指南偏薄（Home 快速上手 2 节、FAQ 5 问），为 P1。

---

## 六、Dev Luker 环境状况

> 来源：路12 全程只读探测；涉及路径按仓库层级相对表述，不记录本机绝对路径。

- Dev 实例根下有 Luker、PureTavern、SillyTavern、TauriTavern、Tavern-Viewer、TavernHeadless、_diag-scripts、_stale-extensions-backup、nocturne_memory 九个目录及 readme.md。
- 8003 端口：严格命令 `netstat -ano | grep ":8003" | grep LISTENING` 首次执行无输出，重跑得到 `TCP 0.0.0.0:8003 0.0.0.0:0 LISTENING 57904`——探测窗口内由无监听转为有监听，最终态有监听、PID 57904；进程来源待运行方确认（见 N16）。
- 扩展链接：Luker 的 third-party 扩展目录下 `ST-BgLoader` 为符号链接（lrwxrwxrwx），指向本仓库；链接可达、未断裂。
- 产物同源：链接侧与本仓 `dist/index.js` 大小 257710 字节、修改时间 Nov 19 06:39 完全一致，结合符号链接确认为同一文件，无陈旧拷贝。
- 同目录存在旧上游插件 `Extension-VideoBackgroundLoader`（display_name "Video Background Loader"、auto_update true、homePage 指向上游），与本仓功能域重叠，双加载/事件冲突风险未在只读任务中验证（见 N16）。
- 全程只读：未启动服务、未写文件、未做 git 写操作；端口时序不一致已如实记录，未以推测填补。

---

## 七、矛盾与裁决

| # | 矛盾 | 裁决 |
| --- | --- | --- |
| 1 | 前 5 路一致称报告把本仓当成 ChatFilesys 零构建插件 | 以本仓实测为准（`package.json:2` name=st-bg-loader），报告「本仓现状」陈述整体失实，落地方向须重建在本仓形态上 |
| 2 | 报告称本仓零构建/无 lock/无 dist vs 实测 vite build + lock 45911B + dist/index.js 257710B | 实测为准；相关 REJECT（npm ci/build/start-dev-server/14.1/14.3/13.35 等）全部翻案，见第三章 |
| 3 | 报告称本仓「无 .github 目录」 vs 猫猫实测 `.github/` 存在（含 agents/skills/hooks/prompts/copilot） | 精确化裁决：有 `.github` 治理目录，但**无 `.github/workflows/` 子目录**；「无 CI 工作流」结论成立，笼统「无 .github」表述失实 |
| 4 | 报告称有 docs/（VitePress）/web/scripts/guards vs 实测无 docs（有 wiki）/无 web（有 dev）/无 scripts | 实测为准；所有 docs 站、双语、守卫目录「已存在」前提不成立，统一转 N1-N3/N15 |
| 5 | no-bundler-only：路1 判 needs-user、路2/3 判 adopt、路4 判 reject | 裁决为「改造后采纳」：本仓产物经构建但以 ESM 直载进宿主，改写为产物自包含/零外部引用校验（G7），措辞去掉「零构建」 |
| 6 | check:i18n / i18n-guard：路3 拒、路4 部分采 | i18n 维度归 N3 待裁定；文案审计以 check:copy（C4）落地，二者拆分 |
| 7 | 报告称 scripts/guards 已落地 15/30 个守卫 vs 路8 实测仅 `tests/css-gate.mjs` 一个静态守卫 | 实测为准；守卫族整体为「待建」，见 C 组与 N15 |
| 8 | LICENSE 类型冲突：报告称 AGPL 已存在 vs README 徽章与 `package.json:16` 均 MIT | 以 MIT 为当前事实，换证属重大决策归 N9 |
| 9 | 报告称 vendor 有 dagre/vue/jszip vs 实测仅 `dev/vendor/fontawesome` | 实测为准；相关 git-graph/zip-io/vue 条目无 vendor 前提，见 R1/N4 |
| 10 | 报告称 tests/branches 有 46 个 .test.mjs vs 实测无 branches/ | 实测为准；细粒度单测体系归 N12 |
| 11 | 报告称本仓 Python harness（hosts.py/harness.py/run_suite.py/take_visual_proof.py）已覆盖 vs 实测全为 Node `.mjs`、无这些文件 | 实测为准；E2E 纪律落 Node 侧，多实例基建归 N11 |
| 12 | 报告称有 `src/ui/common.js`、`src/core/design-contract.js`、`web/style.css` vs 实测均无 | 实测为准；相关「本仓现状」条目归 R4 |
| 13 | 报告 982 行称默认上游应为 jiozhaoyue/st-chatfilesys-frontend vs 本仓 ST-BgLoader | 以本仓坐标为准，换上游值须主人确认（随 N7） |
| 14 | 防闪脚本/JS 主题态：报告称 `web/index.html` 缺脚本 vs 路6/路4 实测本仓纯 CSS 跟随、无 JS 主题态 | 实测为准，无闪白问题，相关条目归 R3 |
| 15 | `00-tokens.css:6` 声明令牌唯一真源 vs `FrostedGlassController.ts:50,53` 直接引用 --SmartTheme* | 以 00-tokens.css 声明为准，视为待修违例（第五章），不推广该写法 |
| 16 | 路12 内部 8003 端口时序：首次 LISTENING 无输出、重跑出现 PID 57904 | 如实记录时序不一致，当前有监听、来源待确认，未以推测填补（第六章） |
| 17 | 工作流命名 1.1 判 adopt vs 本仓无 workflows 目录 | 命名纪律采纳（A1），落地依赖新建门禁流；部署/Pages 类才需主人裁定（N1） |
| 18 | 路7 与报告 2.20/2.32/2.33 口径差异：报告称「本仓 web 工作台」 vs 路6/7 实测为「开发预览台」 | 采用路7 实测口径：截图/响应式脚本落点表述为 `dev/` 预览台，非完整工作台 |

---

*报告完。裁决严格基于 12 路输入与裁判本轮只读探测；凡未实测项（框架体积增量、Shadow DOM 主题穿透、酒馆 ESM 支持边界、8003 进程来源）均如实标注为未验证，未以推测填补。*
