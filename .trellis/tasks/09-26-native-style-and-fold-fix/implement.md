# 实现清单 — 原生风格对齐与折叠修复

> 复选框随执行**实时勾选**（L0-2）。验证命令集中在文末。

## Phase A：激活与基线

- [x] A1 任务激活（`task.py start`）
- [x] A2 基线：`git status` 干净、`npm run type-check && npm run build` 绿
- [x] A3 缺陷成因留证 —— **未做「修复前现场复现」，改以宿主源码逐字核验**（更强的证据）：确认实际宿主是 Luker（`Instance/Dev/Luker`，:8003），其 `public/script.js:21422` 的 document 级委托与原版 ST `public/script.js:12193` **逐字一致**，`public/style.css:5804` 同为 `display: none`。留档见 `research/host-verification.md`。

## Phase B：折叠修复（R1–R4）

- [x] B1 删除 `SettingsDrawer.ts` 自建 toggle 监听器整块（原 L523-533）
- [x] B2 删除 `.inline-drawer-content` 上的行内 `display:flex; flex-direction:column; gap:12px`；`padding-top:10px` 移入 CSS
- [x] B3 ~~模板改双层结构~~ —— **方案改进，未采用内层容器**。改用「块级 + `margin-bottom`」替代 flex `gap`：不加 DOM、不缩进 330 行、且**永不触碰宿主动画控制的 `display`/`height`**。设计文档 §1 已同步更新并附两方案对比表。
- [x] B4 确认分区间距仍生效（`margin-bottom: 12px`，探针实测）
- [x] B5 全仓 grep 确认无残留自建折叠实现（`grep -rn "inline-drawer-toggle" src/` 只剩宿主所需的 HTML 类名与说明注释）
- [x] B6 `npx tsc --noEmit` 快验

## Phase C：溢光与动效清理（R5）

- [x] C1 移除 `.st-bgloader-media-card.active` 的双行 `box-shadow` 溢光，改「边框 + 色调填充 + 标题强调」
- [x] C2 移除 `.st-bgloader-media-card:hover` 的 `transform: scale(1.02)`
- [x] C3 移除 `.st-bg-mini-btn:hover` 的 `transform: scale(1.1)`
- [x] C4 移除 `.st-bg-mini-capsule` 的**基础投影**（用户裁定：投影全部去掉）
- [x] C5 移除 `.st-bg-mini-capsule:hover` 的投影加深，hover 只改 `border-color`
- [x] C6 边框对比度由 `rgba(255,255,255,.15)` 提到 `.25`（hover `.45`）以独立承担边界
- [x] C7 例外白名单注释更新（仅剩语义徽章与状态色两项）
- [x] C8 `npx tsc --noEmit` 快验

## Phase D：P3-10 内联样式清理（R7）

> 采用「带出现次数断言」的脚本批量落地（命中数不符即中止），避免静默漏改。

- [x] D1 checkbox 行 → `.st-bgloader-check`（7 处）+ `.st-bgloader-check-sub`（1）+ `.st-bgloader-check-lead`（1）+ `.st-bgloader-check-inline`（1）
- [x] D2 preset-row 标签 → `.st-bgloader-preset-row > label` 默认 90px；`.st-bgloader-label-sm`（2 处 60px）/ `.st-bgloader-label-md`（2 处 80px）
- [x] D3 分隔线 → `.st-bgloader-divider`（2 处）+ `.st-bgloader-gap-top`(6px) / `.st-bgloader-gap-top-md`(8px) 精确保留原值
- [x] D4 状态色 → `.st-bgloader-status-ok` / `.st-bgloader-status-warn`（并纳入面板作用域变量 `--st-bg-status-*`，与 P3-8 徽章色同模式）
- [x] D5 其余：dropzone 图标、`.st-bgloader-btn-full`、`.st-bgloader-row-between`、`.st-bgloader-status-text`、`.st-bgloader-empty`、`.st-bgloader-empty-grid`、`.st-bgloader-hidden`(2 处)、`.st-bgloader-trigger-row`
- [x] D6 保留项确认：仅 `#st_trigger_form` 的 `style="display: none;"` 保留（JS 运行时切换 `display`，类会与之打架）；`option` 的 `selected`、滑块 `value`、`checkbox` 的 `checked` 等动态值仍在模板中
- [x] D7 `npx tsc --noEmit` 快验

> **P3-10 结论**：由「明确不做」改为**已实施**。清理后 `SettingsDrawer` 从 43 处行内样式降到 **1 处**（且该 1 处有充分理由）。新增 19 个类均有 CSS 定义与实际使用（计数对称已核验）。

## Phase E：规范落盘（R9）

- [x] E1 新增 `.trellis/spec/frontend/host-native-ui.md`（自包含：宿主接缝优先 / 禁止自建折叠 / 禁止在宿主动画元素上写 display / 选中态禁光 / 例外白名单 / 行内样式判据 / 前缀门禁 / 验证方法）
- [x] E2 `.trellis/spec/frontend/index.md` 索引加行
- [x] E3 规范自包含可读，含宿主源码行号与反例代码

## Phase F：回归与收尾

- [x] F1 `npm run type-check && npm run build`（build 后 `dist/style.css` 5.74→7.14 kB、`dist/index.js` 170.71→169.56 kB）
- [x] F2 CSS 裸选择器门禁：`grep '^\.' src/ui/style.css | grep -vc 'st-bg'` → **0**
- [x] F2b `box-shadow` 门禁：`grep -c box-shadow src/ui/style.css` → **0**（仅存一处说明性注释，见验证命令）
- [ ] F2c **浅色主题下胶囊边界可辨性 —— 未实测**。当前 Dev 实例为暗色主题；已预先提高边框对比度（`.15`→`.25`）作为对投影移除的补偿。**待用户在浅色主题下确认**。
- [x] F3 e2e：24/24 通过
- [x] F4 stress：4/4 通过
- [x] F5 authority：18/18 通过（真后端）
- [x] F6 **折叠验收（核心）**：探针连续开合 5 轮，`display` 序列 `block,none,block,none,block,none,block,none,block,none` 严格交替；图标态自洽（展开 `up`/折叠 `down`）；每轮折叠后无 `height` 残留
- [x] F7 **初始态验收**：刷新后初始为折叠（`display: none`），与页面内原生抽屉一致
- [x] F8 **重渲染验收（部分覆盖）**：启动期面板实际被替换 **2–3 次**（`init` 渲染 + 云端设置同步触发的 `applyRemoteSettings` 渲染，已用 MutationObserver 记录时间线），替换后折叠行为仍全部通过。**「导入设置 JSON」这条具体路径未单独触发**（与云端同步共用同一 `render()`）。
- [x] F9 **原生一致性验收**：扩展面板与同页面原生抽屉在同一操作序列下 `display` 序列完全相同，图标态语义一致
- [x] F10 更新 `dist/` 并提交、推送 `origin master`
- [x] F11 归档子任务

## 执行期新发现（已转交）

- [x] **A4 设置面板媒体库间歇性渲染为空**（P1）——执行期发现并确认机理（签名守卫跨面板实例共享 + 栅格元素按渲染新建，`await` 完成顺序决定命中）。已连同完整证据与建议修复转交子任务 2：`.trellis/tasks/09-26-full-audit-and-hardening/research/findings-from-child1.md`。**本子任务不修**（属健壮性范畴，按范围约定归子任务 2）。

## 验证命令

```bash
npm run type-check && npm run build
```

```bash
grep -rn "inline-drawer-toggle" src/ ; echo "（应只剩宿主要求的 HTML 类名与说明注释）"
```

```bash
grep '^\.' src/ui/style.css | grep -vc 'st-bg'
```

```bash
grep -n '^\s*box-shadow' src/ui/style.css | wc -l
```

```bash
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e
```

```bash
TEST_TARGET_URL=https://127.0.0.1:8003 node tests/stress.mjs && TEST_TARGET_URL=https://127.0.0.1:8003 node tests/authority.mjs
```

```bash
TEST_TARGET_URL=https://127.0.0.1:8003 node .trellis/tasks/09-26-native-style-and-fold-fix/research/probe-fold.mjs
```

末条为折叠修复的专项验证探针（43 项断言：结构 / 行内 display / 初始态 / 5 轮开合 / 原生等价性 / 去溢光 / 功能未损 / 错误归因）。

## 回滚点

- RP-1：Phase B（折叠修复）独立提交，可单独 revert
- RP-2：Phase C（视觉清理）独立提交，可单独 revert
- RP-3：Phase D（内联样式类化）独立提交，纯结构，可单独 revert
- RP-4：Phase E（spec）独立提交，纯文档

## 证据文件

| 文件 | 内容 |
| --- | --- |
| `research/host-verification.md` | 实际宿主（Luker）源码逐字核验 + 互斗机制链条 |
| `research/probe-fold.mjs` | 折叠专项验证探针（可复跑） |
| `research/probe-fold-output.txt` | 探针输出（43 通过 / 0 失败） |
| `research/probe-race.mjs` | A4 竞态证据探针（面板替换次数观测） |
| `research/probe-selected.mjs` | 选中态计算样式断言（无投影 / 边框 / 标题色） |
| `research/shot-1-collapsed.png` | 折叠态：与原生抽屉形态一致 |
| `research/shot-2-expanded.png` | 展开态：全 panel 无溢光 |
| `research/shot-4-mini-capsule.png` | 迷你播放器胶囊（无投影，1px 边框） |

### 已知局限（如实记录）

- **选中态没有可用的截图证据**：栅格处于可滚动且折叠的容器内，元素截图只取到可见薄条，生成的图无信息量，已删除该产物。选中态改以**计算样式断言**为准（`probe-selected.mjs`）：栅格内 43 张卡片**全部** `boxShadow: none`；选中卡 `border: 2px rgb(225,138,36)`、背景为主题强调色 18% 混合、标题取强调色且 `font-weight: 600`。按 `fe-ui-inspect` 原则，计算样式本就比截图更可靠。
- F2c 与 F8 的后半部分为未完全覆盖项，已在清单中标注。
