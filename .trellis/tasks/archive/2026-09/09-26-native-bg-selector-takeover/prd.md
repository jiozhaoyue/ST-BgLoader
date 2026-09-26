# 接管 ST 原生背景选择器

## Goal

让扩展的富媒体背景与 ST 原生背景面板成为**统一入口**：用户在原生面板里选任何背景（图片或视频/音频/HTML/SVG）都经扩展的渲染管线生效；扩展当前生效的背景在原生面板中有明确选中标记。同时给出**可行性结论、风险清单与降级策略**，保证宿主版本变化时功能可回退、不锁死用户。

## Background — 可行性调研结论（已基于 ST 源码核验）

调研对象：`SillyTavern/SillyTavern` 的 `public/scripts/backgrounds.js`（1865 行）、`events.js`、`st-context.js`、`style.css`、`script.js`。

### 原生背景管线

| 环节 | 实现 | 位置 |
| --- | --- | --- |
| 存储 | `/api/backgrounds/upload`(FormData `avatar`)、`/api/backgrounds/all`(POST)、`/api/backgrounds/delete`(POST `{bg}`) | 后端接口，**扩展的 `ServerOrigin` 已在用同一套与同一目录** |
| 应用 | `$('#bg1').css('background-image', url)` —— 直接写 `#bg1` 的内联样式 | `backgrounds.js:1442 setBackground`、`:249 forceSetBackground`、`:383`、`:266` |
| 全局设置态 | 模块作用域对象 `background_settings {name, url, fitting, animation, thumbnailColumns}` | 仅在同模块内可见 |
| 选中态 | `highlightSelectedBackground()` 给 `data('url') === background_settings.url` 的 `.bg_example` 加 `.selected-background` | `backgrounds.js:1641` |
| 网格渲染 | `renderSystemBackgrounds()` → `$('#bg_menu_content').empty()` 后整块重建 | `backgrounds.js:661` |

### 可用接缝（逐条核验）

> **执行期复核（2026-09-26）**：实例上的 `backgrounds.js` 已从规划期的 **1865 行**漂移到 **2039 行**
> （宿主 `v2.7.0-605-ge1dbd1904`），下表与 `design.md` 中的 `backgrounds.js:NNNN` 引用**行号已全部失配**。
> 逐条复核后**接缝全部存活**，方案无需改设计；当前行号见
> `research/decisions.md` §二.2。下表保留了规划期行号以便对照，引用时以那份为准。

| 能力 | 可行性 | 机制 / 证据 |
| --- | --- | --- |
| 读取当前原生背景 | ✅ | `#bg1` 的内联 `background-image` |
| 感知原生背景变化 | ⚠️ 间接 | **无专用事件**（`events.js` 中与背景相关的只有 `FORCE_SET_BACKGROUND`，且方向是「监听」）；可观察 `#bg1` 的 `style` 属性变化 |
| **拦截原生选择** | ✅ | ST 的选择处理器是 **document 级冒泡阶段委托**（`backgrounds.js:1733`：`$(document).off('click','.bg_example').on('click','.bg_example', onSelectBackgroundClick)`）。在 **document 捕获阶段**监听并 `stopPropagation()` 即可完全拦下 |
| 让原生走扩展管线 | ✅ | 拦截后直接调用扩展 `applyMedia()` |
| 用原生路径设置背景 | ✅ 但有副作用 | `eventSource.emit(event_types.FORCE_SET_BACKGROUND, {url, path})`（`backgrounds.js:1695` 监听）。`forceSetBackground` 会把背景**推入 chat 元数据列表**（`backgrounds.js:253-257`），语义是「聊天专属背景」而非「全局背景」→ 用于全局切换会污染 chat 元数据 |
| 在原生网格展示扩展媒体 | ⚠️ 高风险 | `#bg_menu_content` 被 `renderSystemBackgrounds()` 整块 `empty()` 重建，注入节点会被抹掉；原生缩略图构造（`createThumbnailElement` / `activateLazyLoader` / `getUrlParameter`）均为**模块私有**、无法复用，注入即需自造结构 |
| 显示扩展的选中态 | ✅ | 给匹配的 `.bg_example` 加自定义类。**注意**：原生 `highlightSelectedBackground()` 会重算并覆盖选中态，因此须在每次重渲染后重新施加（既有 MutationObserver 可复用） |
| 匹配原生缩略图 ↔ 扩展媒体 | ✅ | 用 `.bg_example` 的 **`bgfile` 属性**（文件名）与扩展目录条目的文件名匹配。**不要用 URL 匹配**——原生 `data-url` 是缩略图 CSS 串，与扩展的媒体 URL 不同 |
| 替换 `setBackground()` | ❌ | 模块私有、未导出、未挂 `window` |
| `background_settings`（全局背景设置态） | ❌ | 模块作用域。`getContext()` **不暴露** `background_settings` 本身；它仅出现在设置**保存载荷**中（`script.js:8091`） |
| **chat 元数据（含锁定背景）** | ✅ | `getContext().chatMetadata`（`st-context.js:2477`）是公开 getter。**订正**：规划期原写「`getContext()` 不暴露任何 backgrounds 相关内容」，该结论对 `background_settings` 成立、对 chat 元数据**不成立** —— 见 `research/decisions.md` §二.4 |
| 聊天锁定背景 | ✅ 可判定 | `isChatBackgroundLocked()` = `chat_metadata['custom_background']`（`backgrounds.js:403`、键 `:14`）。它是 `onSelectBackgroundClick` 的**第二分支**（`:431`），规划期遗漏 → 已补放行规则（裁定 D-1） |

### 结论

**接管可行**，且有一条干净、版本鲁棒的路子：**捕获阶段拦截 + 扩展自行渲染 + 自行维护选中态**，完全不碰宿主私有函数。代价是「原生网格注入」这一子目标成本与风险都很高（见 T3）。

## 方案分层（用户已选定 **T2**）

| 层级 | 内容 | 风险 | 成本 | 裁定 |
| --- | --- | --- | --- | --- |
| T1 只接管非图片 | 原生面板点视频/音频/HTML/SVG → 走扩展管线（= 消除 A3 双写）；点图片仍走原生。加类型徽章 | 低 | S | 不采用 |
| **T2 接管全部选择** | T1 + **图片点击也接管**，路由进扩展的 `ImageRenderer`；扩展当前背景在原生面板加自定义选中标记；`#bg1` 原生背景图在接管期间清空避免叠层 | 中 | M | **✔ 采用** |
| T3 T2 + 注入扩展媒体到原生网格 | 把扩展的非图片媒体注入 `#bg_menu_content` 供用户直接点选 | 高 | L | **不做** |

### 推荐 T2 的理由

- **T2 才真正是「接管选择器」**：面板里点什么都经扩展管线，滤镜/转场/天气/视差对所有背景一致生效。
- 扩展已有 `ImageRenderer` 与统一的 `detectMediaType`，图片纳入管线**不需要新渲染能力**。
- **不选 T3 的理由（重要）**：注入的原生节点**不参与**原生面板的文件夹归类、`#bg-filter` 筛选、群组多选、移动端菜单等机制——用户会觉得「这些东西怎么跟别的不一样」。而且每次 `renderSystemBackgrounds()` 都要重注入，宿主升级改结构即全线失效。**功能上原生网格本来也列不出非图片文件**（`/api/backgrounds/all` 只返回图片），所以 T1/T2 用徽章标注 + 扩展自身的媒体库已能覆盖用户需求。

## Requirements

1. **R1 接缝探测**：启动时探测本方案依赖的接缝（`#bg_menu_content` 存在、`event_types.FORCE_SET_BACKGROUND` 存在、`.bg_example` 结构与 `bgfile` 属性存在）。任一缺失 → **不安装接管**，静默回退为当前「增强模式」（徽章标注 + 点击接管自身管线），媒体功能不受影响。
2. **R2 单一拦截点**：接管安装后，**删除 `NativeBgAugmenter` 现有的逐元素 click 监听**，改由**唯一一个 document 捕获阶段监听器**处理所有 `.bg_example` 点击。（若保留逐元素监听，捕获阶段的 `stopPropagation` 会连它自己一起打断，形成死逻辑。）
3. **R3 接管范围**：按用户选定的层级（T1 / T2）实现拦截范围。
4. **R4 事件处理**：
   - 拦截命中 → `e.preventDefault()` + `e.stopPropagation()`，然后走扩展 `applyMedia()`。
   - 不命中（如处于原生「背景群组多选模式」`isBackgroundSelectionMode`、或点的是文件夹磁贴/菜单按钮）→ **不拦截**，放行给原生。
   - 需识别并放行非「选择背景」语义的点击：`.bg_folder_tile`、`.jg-button`（lock/edit/delete/copy/folder/set-cover）、`.mobile-only-menu-toggle`。
   - **当前聊天已锁定背景 → 放行**（裁定 D-1）。`onSelectBackgroundClick` 实为**三分支**（多选 / 聊天锁定或专属 / 全局），规划期只识别了首末两支；锁定分支被拦截会让原生「把背景锁定给本聊天」的功能静默失效。放行范围同时覆盖 `#bg1` 的叠层清理（否则会与宿主抢写）。
5. **R5 选中态标记**：扩展当前背景对应的 `.bg_example`（按 `bgfile` 匹配）加自定义类（如 `st-bg-takeover-selected`），样式遵循子任务 1 落盘的原生视觉规范（**无溢光**）。每次原生网格重渲染后重新施加。
6. **R6 叠层清理**：接管期间清空 `#bg1` 的内联 `background-image`，避免原生图片与扩展图层同时加载；但须容忍宿主在 `CHAT_CHANGED` 时重写它（`onChatChanged` → `backgrounds.js:266`），即清空动作需可重复执行。
7. **R7 用户开关**：设置面板提供 `接管原生背景选择器` 开关（默认开启，因用户明确要求）；关闭后立即卸载拦截、恢复原生行为，扩展媒体库照常可用。
8. **R8 一次性回写（可选，需评估）**：若决定让扩展状态与原生 `background_settings` 保持同步，仅允许使用 `FORCE_SET_BACKGROUND`。**默认不使用**（副作用：污染 chat 元数据）。若用户希望「切背景后刷新页面仍由原生显示」，再评估。
9. **R9 视觉规范**：所有新增 UI（徽章、选中标记）遵守子任务 1 落盘的原生视觉规范与溢光禁令。
10. **R10 零回归**：`type-check` + `build` + 三套件不劣于基线。

## Non-goals

- **不 monkey-patch** ST 私有函数（`setBackground` / `onSelectBackgroundClick` / `renderSystemBackgrounds` / `background_settings` 一律不可触碰）。
- 不改 ST 的存储接口或目录布局（已在共用，保持）。
- **不实现 T3**（原生网格注入），用户已于 2026-09-26 裁定不做。
- 不改 `ServerOrigin` 的存储语义；不动 Authority 契约。
- 不与子任务 2 的 A3 最小修复并存——子任务 3 落地后由本方案取代 A3 修复。

## 用户裁定（2026-09-26）

| 决策点 | 裁定 | 落地影响 |
| --- | --- | --- |
| 接管层级 | **T2 — 接管全部选择** | `nativeTakeover` 默认 `'all'`；图片点击路由进扩展 `ImageRenderer`；**T3 不做** |
| 优先级语义 | **方案 α** —— 接管期间以扩展状态为准；回到原生靠关闭接管开关 | `shouldTakeOver()` **不实现**「点原生图片即退出接管」分支；R7 开关是唯一退出手段 |
| `FORCE_SET_BACKGROUND` 回写 | **不启用** | R8 保持默认关闭，`probe()` 仍探测该事件存在性（供将来使用） |
| **聊天锁定背景（D-1，执行期新增）** | **锁定期间放行给原生** | `shouldTakeOver()` 增第 2 条放行规则；`#bg1` 叠层清理同判定豁免。理由与代价见 `research/decisions.md` §一 D-1 |

## Open Questions

无未决项。执行期新增的 U-1（`stop()` 能否不刷新页面完全恢复原生背景图）在 Phase F 实测裁定，
见 `research/decisions.md` §三。


## Acceptance Criteria

- [x] 可行性结论、风险清单、降级策略落盘（含 ST 源码 `file:line` 证据），可独立阅读。
      > `research/st-native-evidence.md`（行号已按执行期实测的 2039 行版本全量校正）+ `research/decisions.md`
      > （裁定与漂移复核 + U-1 结案）。两份都可独立阅读。
- [x] 用户已就 Open Questions 1–3 给出裁定，方案按裁定实施。
      > T2 / 方案 α / 不启用 `FORCE_SET_BACKGROUND`（PRD 裁定表）+ 执行期新增 **D-1**（聊天锁定放行）
      > 与 **D-2**（主会话实施，不派子代理）。
- [x] 接缝探测生效：人为破坏接缝（Dev 上临时移除 `#bg_menu_content` 或改 `.bg_example` 结构）→ 接管不安装、扩展其余功能完全正常。
      > 探针 G 组 4/4：`probe()` 返 null、`start()` 不安装、媒体库仍返回 29 项、接缝放回后可重新安装。
- [x] 原生面板点击行为符合所选层级：按选定范围，命中项走扩展管线；未命中项（文件夹磁贴、菜单按钮、群组多选模式）行为与原生完全一致。
      > 探针 B/C/D 组：`all` 档拦截（B1–B4 + 单写者证明）、`non-image` 档图片放行给宿主（C1–C3）、
      > 多选/菜单/`custom` 放行（D1/D3/D4）。
- [x] **聊天锁定背景放行生效（D-1）**：当前聊天有锁定背景时，点缩略图改的是该聊天锁定的背景（原生语义），且 `#bg1` **不被**扩展清空、无抖动；解锁后接管立即恢复生效。
      > 探针 D2 三断言全过（用 `getContext` 打桩，未触碰真实 chat 元数据，并断言打桩已还原）。
- [x] `NativeBgAugmenter` 的逐元素 click 监听已删除，全仓仅一个 document 捕获阶段拦截器。
      > 文件已删（经用户批准，`git rm` 可追溯）；`grep -rn "bg_example" src/` 仅 4 处命中且只有 1 处是
      > click 注册（`{ capture: true }`），其余为查询/判定。
- [x] 扩展当前背景在原生面板有选中标记；原生网格重渲染（点刷新/重进面板）后标记仍在。
      > 探针 B4（标记随切换移动）+ B5（宿主式 `empty()` + 整块 append 后装饰与标记自动重施）。
      > B5 用 `replaceChildren` 忠实模拟宿主的重建动作，不依赖某个按钮触发。
- [x] 开启接管后 `#bg1` 不再保留原生背景图；关掉开关后原生行为完整恢复。
      > 探针 E（拥有图层时宿主写入被清）、F3（关掉后归还背景图）—— `""` → `url("/backgrounds/__transparent.png")`
      > 即接管开始时的值，**无需刷新页面**（U-1 结案）。
      > **一处有意偏离字面**：清空只在**扩展确实挂了媒体**时进行，否则刚开接管、扩展还没有媒体的用户
      > 背景会被清成空白。见 `implement.md`「执行期收紧」表第 1 条。
- [x] 设置面板的接管开关生效：关 → 拦截卸载、原生可正常选背景；开 → 拦截恢复。
      > 探针 F 组 5/5（含 F4：关闭后宿主重新接管点击，其选中标记正常移动）。
- [x] 新增样式无溢光，符合子任务 1 落盘的原生视觉规范。
      > `grep -c 'box-shadow:'` = 0；裸选择器 0；探针 A5 另实测我们加的元素计算样式 `box-shadow`
      > 均为 `none`。
- [x] `npm run type-check` + `npm run build` 通过；三套件回归不劣于基线。
      > tsc + build 双绿；e2e 24/24 · stress 4/4 · authority 18/18（基线同为全绿）。
      > 留痕：authority 曾偶发一次 16/18，随后连 4 轮（含相同串跑顺序）未复现。
- [x] 提交推送 `origin master`，子任务归档。

## Risks

- **R-1 宿主升级破坏接缝**：ST 改 `#bg_menu_content` / `.bg_example` 结构 / 委托方式 → 拦截失效或误拦。缓解：R1 接缝探测 + 收窄命中条件（只拦「选择背景」语义的点击）；探测失败时自动降级。
- **R-2 误拦导致原生面板功能受损**：文件夹、群组多选、菜单按钮被吃掉 → 用户在原生面板里做不了事。缓解：显式放行清单（R4）+ 放行条件以「元素是否含 `bgfile` 且不带菜单/文件夹类」为准。
- **R-3 选中态与原生互斥**：原生 `highlightSelectedBackground()` 会清掉所有 `.selected-background` 并重算，我们的自定义类若与原生共名会被清 → 使用独立类名，并在每次重渲染后重施。
- **R-4 与子任务 2 的 A3 修复冲突**：两处都改 `NativeBgAugmenter` 的点击路径 → 顺序上子任务 2 先落地最小修复，子任务 3 明确取代它，避免并存两套拦截。
- **R-5 `#bg1` 背景图清空的重复性**：宿主在 `CHAT_CHANGED` 等时机重写它 → 清空需幂等且可重复，不能只做一次。
- **R-6 图片纳入管线后的观感差异**：原生图片背景有动画背景（`isAnimated`）与缩略图优化路径，扩展的 `ImageRenderer` 是朴素 `<img>` → 动图背景（GIF/APNG）行为可能不同。须验证并对 GIF 行为给出结论。

## Rollback

- 接管逻辑集中在单一模块 + 一个开关。回滚方式：关开关 → 卸载拦截，扩展回到「增强模式」；或直接 revert 本子任务提交组。
- 无数据迁移、无服务端改动。
