# PRD：面板 UI 四面重构（11-19-panel-ui-refactor）

> 状态：设计定案。依据 = 10×4 交互问答 40 项定案 + 蜂群 5 路调研（4 路已回报）+ 全仓审计 §6。
> 决策流：见 task.jsonl；技术方案：见 design.md；执行与进度：见 implement.md。

## 1 背景

审计（.trellis/research/st-bgloader-full-audit-2026-11.md §6）实锤面板四大问题：
①替换式接管（`display:none!important` 全灭原生抽屉）收窄原生功能面；②11+ 个 section 一屏堆叠无信息层级；
③移动端零适配（全 CSS 零 @media）；④文案与分区违反自家 UI 规范（G-16/原生弹窗违反 D-06）。
用户裁定方向：**最小视觉 + 功能覆盖最全 + 酒馆风格 + 随主题切换**，四面全部重做。

## 2 目标

- **最小**：渐进披露——功能零裁剪全保留，默认只露高频项，其余折叠分组。
- **覆盖最全**：面板 20 个功能块全部保留可达；全部功能继续保有 API 等价路径。
- **酒馆风格**：酒馆原生同构（官方扩展范式：折叠组/menu_button/Font Awesome/宿主样式类）。
- **随主题**：纯 CSS 变量跟随宿主 --SmartTheme*，语义层派生，fallback 统一基准。
- **移动端基线一次到位**：@media 1000/450px + 触摸目标 ≥36px + 窄屏全屏接管。

## 3 范围（四面）

| # | UI 面 | 文件 | 处置 |
|---|---|---|---|
| 1 | 顶栏抽屉（媒体+设置双 Tab） | src/ui/TopbarBackgroundDrawer.ts (1572 行) | 信息架构全面重排 + 增强式内嵌改造 |
| 2 | 扩展设置面板 | src/ui/SettingsDrawer.ts (194 行) | 行式重排 + 合规修 |
| 3 | 悬浮胶囊 | src/ui/MiniPlayer.ts (186 行) | 主题变量化 + z-index 分档 |
| 4 | 原生网格装饰 | src/ui/NativeBackgroundController.ts (471 行) | 徽标/选中标记接语义变量 |
| 附 | 样式体系 | src/ui/style.css (897 行) | 拆分多文件 + 语义层 + 断点 |
| 附 | 组件工厂 | src/ui/UIComponents.ts (171 行) | 接入率 100% + 新组件 + 可解绑绑定器 |

## 4 定案决策表（10×4 问答，2026-11-19）

| 批次 | 定案 |
|---|---|
| 1 总纲 | 四面全部重做；渐进披露；增强式内嵌（原生入口保留）；维持边框方案（G-18 项目豁免，零 box-shadow） |
| 2 信息架构 | 双 Tab+分组折叠；按功能域五组（画面/氛围/声音/自动化/系统）；顶栏三快捷+场景下拉；场景入媒体 Tab |
| 3 媒体库 | 卡片操作悬停显现；批量删+批量换（多选模式）；懒加载+content-visibility 窗口化；类型分段胶囊 |
| 4 移动端 | 本轮必须；窄屏全屏接管；触摸目标 ≥36px；桌面窄窗同断点同步 |
| 5 演出类 | 面板内折叠（不拆 addon）；BGM 保留全量+折叠；触发器列表+行内开关；不做新手-专家分层 |
| 6 合规 | a11y 三处全修；官方 Popup 替换全部原生 alert/confirm/prompt；文案全量清理；z-index 语义分档变量 |
| 7 主题 | 语义层派生（--st-bg-* ← --SmartTheme*）；fallback 统一主流值；纯 CSS 跟随不新增 JS 监听；面板底色透明融入宿主 |
| 8 实现 | innerHTML 模板+工厂强化；CSS 分文件构建合并（产物仍单文件）；绑定器统一可解绑；全量重渲+窗口化 |
| 9 性能流程 | 面板首渲 <50ms（e2e 断言）；计算样式探针+截图双轨验收；全量回归+新增用例；分阶段提交（4-6 个） |
| 10 样板 | 酒馆原生同构（官方扩展范式为本）；行式布局（标题左控件右）；悬停信息条；自由折叠+开闭状态记忆 |

## 5 验收标准（全部非 TBD）

**硬门（命令可复现）**
1. `npm run type-check`、`npm run build`、`npm run check:css` 全绿。
2. 免实例套件：dev-harness 14/14 + api-harness 38/38 全绿。
3. 真机：Dev ST :8001 e2e 25/25 + Dev Luker :8003 e2e 25/25（被测物身份核验后才算数）。
4. `grep -c 'box-shadow:' src/ui/styles/*.css` = 0（边框表达层级维持）。
5. `grep '^\.' src/ui/styles/*.css | grep -vc 'st-bg'` = 0（前缀门禁）。
6. `grep -c '@media' src/ui/styles/*.css` ≥ 2（1000px / 450px 断点存在）。
7. `grep -rn "alert(\|confirm(\|prompt(" src/ui/` = 0 处（官方 Popup 替换完成）。
8. fallback 统一：BodyColor #e0e0e0 / BorderColor rgba(255,255,255,0.1) / QuoteColor #4fa3d1 / BlurTintColor #1e1e24（语义层单点定义）。
9. 触摸目标 ≥36px：卡片操作钮/顶栏快捷钮/开关行 min 尺寸入 CSS。
10. 文案：面板内无括号注解、无斜杠分隔、无长句说明；分组标题 1-4 字。

**数字指标（D-12）**
11. 面板同步骨架构建（mount→panel DOM 就绪，不含异步网格加载）<50ms（e2e Test 26 计时断言）。
12. 媒体网格卡片带 content-visibility:auto（离屏渲染跳过）且预览懒挂载（data-lazy-* 进入视口 200px 前瞻带才 hydrate，e2e Test 26 断言）。

**视觉验收（G-17）**
13. dev 预览台 ≥9 视角截图 + Dev Luker 真机抽屉截图，逐张检查无溢出/无错位/无长文案折行灾难。
14. 计算样式探针：激活卡 borderWidth=2px 且 boxShadow=none；切主题后面板文字色跟随 --SmartThemeBodyColor 变化。

## 6 非目标

- 不做演出类 addon 拆分；不做新手-专家双模式；不重复造原生多选/文件夹管理；不引入框架与 CDN；不改 src/core 与 API 契约（端点数 62 不变）。
- P0 安全项（泄露密钥轮换、.gitignore 补丁、wiki file:/// 路径）独立于本任务，保持挂起待用户授权。

## 7 风险与缓解

| 风险 | 缓解 |
|---|---|
| 图片选择双入口（原生网格 vs 我们库网格）让用户困惑 | design.md §2.2 双入口策略：文案区分「宿主原生选择」与「媒体库管理」，激活路径收敛同源 |
| callGenericPopup 在 4 宿主可用性差异 | HostBridge 弹窗适配器：特性检测→官方 Popup→异常降级原生弹窗（bridge 层，不属 src/ui 弹窗门禁面） |
| 批量多选与原生 bg-selection-mode 冲突 | 多选模式仅作用于我们的库网格；原生网格 pass-through 规则（§8.2）不动 |
| 折叠记忆写 settings 导致远程镜像噪音 | 开闭状态存 localStorage（视图态），不进 settings 持久化面 |
