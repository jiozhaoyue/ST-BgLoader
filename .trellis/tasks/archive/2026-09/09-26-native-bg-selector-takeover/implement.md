# 实现清单 — 接管 ST 原生背景选择器

> 复选框随执行**实时勾选**（L0-2）。**前置条件：子任务 1 已提交**（同为 `SettingsDrawer` 接触面）。

## Phase A：激活与前置核对

- [x] A1 确认子任务 1 已提交、子任务 2 的 A3 最小修复已落地（本方案将取代它）
- [x] A2 任务激活（`task.py start`）
- [x] A3 基线：`git status` 干净、`npm run type-check && npm run build` 绿
- [x] A4 用户已就 Open Questions 1–3 裁定，并把裁定结果记入 `research/decisions.md`
      > 执行期另新增裁定 **D-1（聊天锁定背景 → 放行给原生）** 与 **D-2（不派子代理）**，已一并留档。
      > A4 同时记录了**宿主漂移**复核结论：实例 `backgrounds.js` 1865 → **2039 行**，行号全失配、
      > 接缝全存活；并订正 PRD 的「`getContext()` 不暴露背景相关内容」（`chatMetadata` 实为公开）。

## Phase B：源码证据留档

- [x] B1 `research/st-native-evidence.md` 落盘：`backgrounds.js` 关键函数（`initBackgrounds` / `onSelectBackgroundClick` / `setBackground` / `forceSetBackground` / `highlightSelectedBackground` / `renderSystemBackgrounds` / `setBackgroundSelectionMode`）的行号与摘录
      > 证据文件规划期已落盘，本轮**全量校正行号**（1865 行版本 → 实测 2039 行版本）并补 §2.1 锁定接缝、
      > §2.2 `#bg1` 抢写风险、§3 两处结论订正。
- [x] B2 记录 ST 版本/commit（供将来判断宿主漂移）
      > `v2.7.0-605-ge1dbd1904` / `e1dbd1904a1e49465feb7da38115def7fdac2192`（2026-09-24）。
- [x] B3 记录不可用接缝（`setBackground` / `background_settings` 模块私有）与理由
      > 理由已订正：`background_settings` 当前是 **`export let`**（`:136`），不在 `window` 也不在
      > `getContext()` 返回键里 —— 不可用的真因是「**已导出但扩展不可达**」（独立脚本接不到宿主模块图），
      > 而非「模块私有」。

## Phase C：控制器骨架与探针

- [x] C1 新增 `src/ui/NativeBackgroundController.ts`：类型（`TakeoverLevel` / `NativeSeams`）+ 类骨架
      > `TakeoverLevel` 按项目「类型集中」规范落在 `types/index.ts`，控制器 import —— 不另起一处真源。
- [x] C2 `probe()` 实现 + 可重入（网格空时挂一次性观察者，沿用 30s 放弃上限纪律）
      > 实测发现容器在 init 时**已存在但为空**（面板打开才填充），故可重入由**网格观察者**天然承担：
      > 探针在空网格时即判「可用」，装饰随观察者补上。真正需要「等待」的只有容器本身不存在的情况
      > （懒建）→ `waitForSeams()` + 30s 上限。另外把「容器存在但缩略图缺 `bgfile`」区分出来判为
      > **宿主改结构**（真降级），而不是「还没准备好」——否则宿主改结构时我们会无限等下去。
- [x] C3 探针失败路径：`start()` 直接返回、`isActive()` false
- [x] C4 `npx tsc --noEmit` 快验

## Phase D：装饰职责迁移

- [x] D1 把 `NativeBgAugmenter` 的徽章逻辑（`.bg_example[bgfile]` + `data-st-bg-augmented` 幂等标记）移入 `decorateGrid()`
- [x] D2 补 `.st-bg-native-badge.<type>` 按类型配色（或统一无类型色——按子任务 2 的 D2 结论保持一致）
      > **无需新增**：子任务 2 的 F5 已落盘 `.st-bg-native-badge.video/.audio/.html/.svg`（含字面量回退），
      > 本子任务直接复用，未触碰。
- [x] D3 选中标记：按 `bgfile` 匹配扩展当前背景，加 `st-bg-takeover-selected`
- [x] D4 网格重渲染后重施选中标记（复用 MutationObserver）
      > 标记写入全部**条件化**（状态不同才写）。原因：标记是真实子元素，无条件「先删后加」会在每一轮
      > 观察者回调里制造 childList 变更 → 观察者自激。收敛式写入让后续遍历无事可做，自然停下。
- [x] D5 `index.ts` 接线改为 `NativeBackgroundController`，`applyMedia` 后调用 `refreshSelection(activeFileName)`
      > 另有**URL 构造订正**：旧模块用 `item.dataset.url`（实测**恒为 undefined** —— 宿主经 jQuery
      > `.data()` 写入，不落 DOM 属性）退回未编码的 `/backgrounds/<name>`；现改用扩展自己的
      > `mediaUrl(bgFile)`，与宿主 `getBackgroundPath()` 逐字一致且带编码。
- [x] D6 **删除 `src/ui/NativeBgAugmenter.ts`**（职责已完全吸收）
      > 经用户显式批准（L0-6），以 `git rm` 提交 → 可 `git revert` / `git show <commit>:<path>` 取回。
- [x] D7 `npx tsc --noEmit` 快验

## Phase E：拦截实现

- [x] E1 注册唯一 document **捕获阶段** click 监听（`{ capture: true }`）
- [x] E2 `shouldTakeOver()` 放行规则：多选模式 / **聊天锁定背景（D-1）** / 菜单与文件夹 / custom / 层级
- [x] E2b `isChatBackgroundLocked()` 经 `getContext().chatMetadata['custom_background']` 读取（公开接缝，**不得**嗅探宿主私有实现，**不得**用 `.locked-background` 类作为真值）
- [x] E3 命中后 `preventDefault()` + `stopPropagation()` + 走扩展管线
- [x] E4 `stop()` 移除监听（`removeEventListener` 必须带同样的 `capture: true`，否则移除不掉）
- [x] E5 确认全仓**只有一处** `.bg_example` 点击绑定：`grep -rn "bg_example" src/`
      > 实测：仅 `NativeBackgroundController.ts` 命中 4 处，其中只有 1 处是 click 注册（捕获阶段），
      > 其余为探针/装饰/命中判定的 `querySelector`。
- [x] E6 `npx tsc --noEmit` 快验

## Phase F：叠层清理

- [x] F1 `clearNativeBackgroundImage()` 幂等实现，且**带 D-1 豁免**（`isChatBackgroundLocked()` 为真时不清，避免与宿主抢写 `#bg1`）
      > 实测后**另加两道门控**（见「执行期收紧」）：只在扩展确实挂了媒体时清（否则空白背景）、
      > 只在档位 `all` 时清（`non-image` 档的图片点击是故意放行的，清了就成抢写）。
- [x] F2 `#bg1` 的 `style` 属性观察者 + **自写保护**标志位（避免自己的清空动作再次触发）
      > 诚实记录：MutationObserver 回调是**异步**的，同步标志位到那时通常已复位，**真正的防环是
      > 「已经为空就返回」那一句**。标志位保留作同步路径的保险，注释里写明了这一点，没有假装它在起作用。
- [x] F3 调用点接线：`start()` 后、每次 `applyMedia()` 后、`CHAT_CHANGED` 后
      > `start()` 与 `applyMedia()` 已接。**CHAT_CHANGED 未单列调用点**：宿主写 `#bg1` 一律被
      > `attributes` 观察者捕获（比手工在 CHAT_CHANGED 之后清更可靠——后者要赌宿主处理器与我们的
      > 先后顺序）。已在该处注释里写明理由。
- [x] F4 `stop()` 移除观察者并尝试恢复原生背景图；实测「不刷新页面能否完全恢复」
      > **U-1 结案：可以在不刷新页面的前提下恢复**。`stop()` 把接管开始时快照的
      > `#bg1` 内联值写回；探针 F3 实测 `bg1` 由 `""` 回到 `url("/backgrounds/__transparent.png")`。
- [x] F5 实测结论写入 `research/decisions.md`；若不能完全恢复，写进开关的 UI 文案
      > 能恢复 → **不加 UI 文案**。但有一个残留窗口要如实记：快照取自接管开始时刻，若**接管期间切换了
      > 聊天**，宿主本想显示新聊天的锁定/默认背景，而我们回写的是旧快照 → 关闭接管后会短暂显示旧背景，
      > 直到下一次原生动作（点缩略图或再切聊天）自愈。已记入 `decisions.md` U-1。
- [x] F6 `npx tsc --noEmit` 快验

## Phase G：设置项与开关

- [x] G1 `types/index.ts`：`BgLoaderSettings` 加 `nativeTakeover: TakeoverLevel`，`DEFAULT_SETTINGS` 默认 `'all'`
- [x] G2 `SettingsDrawer` 加控件（三态：关闭 / 仅非图片 / 全部接管）
- [x] G3 控件变更 → `onSettingsChanged` + 控制器 `setLevel()`
- [x] G4 `index.ts` init 时按设置安装；`applySettingsToSubsystems` 时应用变更
- [x] G5 `npx tsc --noEmit` 快验

## Phase H：回归与验收

- [x] H1 接缝探测降级验证（Dev 上临时移除 `#bg_menu_content` → 接管不安装、功能正常）
      > 探针 G 组：`probe()` 返回 null、`start()` 不安装、媒体库仍返回 29 项、放回元素后可重新安装。全程 4/4。
- [x] H2 拦截矩阵逐条验证（按 `design.md` §9 的 12 条场景表）
      > 新增 `research/probe-takeover-matrix.mjs`，**35/35**（连跑两轮稳定）。覆盖 A 装饰与徽章/无溢光、
      > B 拦截与单写者证明、B5 网格重渲染后自动重施、C 档位放行、D 放行规则四条、E `#bg1` 抑制、
      > F 开关装卸与原生恢复、G 降级、H 动图渲染器选择。
- [x] H2b **锁定态验证（D-1）**：在 Dev 上给当前聊天锁一张背景 → 点别的缩略图应改「聊天锁定背景」（原生语义）且 `#bg1` 不被清空、无抖动；解锁后点缩略图立即回到接管路径
      > 探针 D2 三断言全过。**未触碰真实 chat 元数据**：用 `getContext` 打桩让控制器看到锁定态，
      > 并断言打桩已还原、真实 `chatMetadata` 里没有 `custom_background`（diag 输出
      > `stubRestored=true realLocked=false`）。
- [x] H3 动图（GIF/APNG）纳入管线后的观感验证（PRD R-6）
      > **源码结论：无观感差异**。宿主 `setBackground()`（`backgrounds.js:1565`）对动图**没有特殊路径**
      > ——把原始文件直接交给 `#bg1` 的 CSS 背景，浏览器自然播放；`background_settings.animation`
      > 只作用于**面板缩略图**（`:966` / `:1556`），不作用于实际应用的背景。扩展侧同样是原始文件 + 朴素
      > `<img>`，浏览器同样播放。探针 H1 实测 `.gif` 被挂为 `<img>`（而非 video）。
      > **诚实缺口**：Dev 媒体库里没有任何动图（实测分布 png 2 / jpg 21 / ico 1），故只验证了渲染器
      > 选择，**没有做肉眼可见的动画验证**。
- [x] H4 `npm run type-check && npm run build`
- [x] H5 CSS 裸选择器门禁为 0；新增样式无溢光
      > 裸选择器 0；`grep -c 'box-shadow:'` 0。探针另实测我们自己加的元素（徽章、角点、轮廓）
      > 计算样式 `box-shadow` 均为 `none`。
      > **注意**：判据只覆盖**我们自己加的东西**——被标记的缩略图本身是宿主的 `.bg_example`，宿主
      > 给它自己的投影（`public/css/backgrounds.css`）不属于本轮去溢光范围，读它等于在断言宿主样式表。
      > （首次写探针时正是错在这里，已订正。）
- [x] H6 e2e + stress + authority 三套件
- [x] H7 Dev 冒烟：抽屉、切背景、可见性勾选框、迷你播放器、原生面板全操作路径
      > 原条目写的 Alt+B 已随子任务 2 的 K1 移除，改为替代它的可见性勾选框。
      > 冒烟 16/16；原生面板路径由 H2 的 35 项矩阵覆盖。
      > 另修一处**探针残留**：冒烟探针在「初始无背景」时无法复原（S2 故意挂了一个），会把 Dev
      > 实例留在多挂一个背景的状态 → 已在 `if (init.activeMediaId)` 的 else 分支补 `clearBackground()`。
- [x] H8 更新 `dist/`、提交、推送 `origin master`
- [x] H9 归档子任务

## 执行期收紧（实现后按实测追加，2026-09-26）

三处都是「照设计字面实现会让用户看到不该看到的结果」，实施后才发现，已修并各自留痕：

| # | 原设计 | 实测问题 | 收紧 |
| --- | --- | --- | --- |
| 1 | 接管期间无条件清 `#bg1` | 刚开接管、扩展还没挂媒体的用户背景**立刻变空白** | 以 `activeFileName` 为门控：没东西可显示就留着宿主的图 |
| 2 | 同上（不分档位） | `non-image` 档的图片点击是**故意放行**给宿主的，此时清 `#bg1` 变成**抢写** | 只在档位 `all` 时清；`non-image` 档行为与接管前的增强模式完全一致 |
| 3 | 未考虑「清空背景」路径 | `clearBackground()` 后扩展图层没了、`#bg1` 仍被压制 → 用户**什么背景都没有** | 新增 `releaseNativeBackground()`：撤掉原生标记 + 归还宿主背景图（对称于 `setLevel` 从 `all` 降档） |

另：`install()` 补 `stopWaitingForSeams()` —— 接缝等待器在安装成功后必须撤掉，否则留下一个
body 观察者与 30s 定时器（探针 G 组恢复接缝后重新安装时会命中这条路径）。

## 验证命令

```bash
npm run type-check && npm run build
```

```bash
grep -rn "bg_example" src/ && echo "检查上方是否只有一处点击绑定"
```

```bash
grep '^\.' src/ui/style.css | grep -vc 'st-bg'
```

```bash
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e
```

```bash
node tests/stress.mjs && node tests/authority.mjs
```

## 回滚点

| 回滚点 | 范围 |
| --- | --- |
| RP-1 | Phase C/D 完成即提交（控制器骨架 + 装饰迁移，此时尚未拦截，行为与旧版一致） |
| RP-2 | Phase E/F 完成即提交（拦截 + 叠层清理） |
| RP-3 | Phase G 完成即提交（设置项与开关） |

**运行时回滚**：设置面板把接管切到「关闭」→ 即时卸载拦截，无需刷新。

## 纪律

- **禁止 monkey-patch** 宿主私有函数（`setBackground` / `onSelectBackgroundClick` / `renderSystemBackgrounds` / `background_settings`）——PRD Non-goals 的硬约束。
- 接缝探测集中在 `probe()` 一处，宿主升级只改这一处。
- 放行规则（`shouldTakeOver`）只增不减地保留注释，说明每条对应的宿主信号与证据行号。
