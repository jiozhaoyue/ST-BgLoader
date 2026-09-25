# 全仓体检与健壮性加固

## Goal

对 `src/` 全量代码做一次体检（正确性 / 竞态 / 泄漏 / 边界 / 一致性 / 性能），产出**带证据的分级发现清单**；实施 P0–P2 健壮性修复；并产出**功能裁剪候选清单**交用户逐项拍板。

**硬约束**：本轮**不删除任何功能**。裁剪清单只产出、不执行，等用户批准。

## Background

规划期已通读 `src/` 全部 29 个文件（~7231 行）并做交叉引用核查，得到一批**已核验的种子发现**（下方 §种子发现）。子任务 2 的职责是：复核种子发现、补齐全量扫描（含规划期未覆盖的边界）、分级、实施、并把裁剪项整理成清单。

上一任务 `09-25-p3-batch-improvements` 已闭环 12 项 P3；本任务是**新的一轮**体检，不重复其范围（设置深合并、观察者放弃上限、manifest 单飞、postMessage origin 收紧、正则缓存、网格签名守卫、播放列表去重、设置冲突检测等已完成项不再列入）。

## 种子发现（规划期已核验，带 `file:line` 证据）

### A. 功能失效类

**A1 — Alt+B 隐藏背景后，新选中的背景永不显示（P1，用户可见）**
[`index.ts:211-217`](src/index.ts:211) 的 `onToggleBackground` 只在容器行内样式上切换 `display`：

```js
const cont = this.mediaMount.getContainerElement();
if (cont) cont.style.display = cont.style.display === 'none' ? 'block' : 'none';
```

而 [`MediaMount.doMountMedia`](src/core/MediaMount.ts:194) 渲染新媒体时**不重置**容器的 `display`；容器也只在 `init()` 时经 `setupContainer()` 创建一次（已存在则复用）。→ 按一次 Alt+B 隐藏后，此后**任何**背景切换都渲染进一个 `display:none` 的容器，背景永久不可见，直到再按一次 Alt+B（偶数次切换即互相抵消）。

**A2 — 虚拟媒体项被持久化，重载后背景丢失（P1）**
[`PublicAPI.setBackground`](src/api/PublicAPI.ts:65) 在 `saveToLibrary` 非真时构造内存项 `id: 'custom_' + Date.now()`；[`index.ts applyMedia`](src/index.ts:353) 立即把它写入 `settings.activeMediaId`。该 id 不存在于服务端目录 → 重载后 [`cacheManager.getMedia(id)`](src/index.ts:342) 返回 `null` → 背景静默消失，且 `settings.activeMediaId` 留着一个悬空 id。

**A3 — 原生缩略图点击双写（P1）**
[`NativeBgAugmenter.ts:48-51`](src/ui/NativeBgAugmenter.ts:48) 给非图片 `.bg_example` 追加 click 监听器；ST 自己的 document 级委托处理器（`onSelectBackgroundClick`）对同一元素同样生效 → 一次点击同时走**宿主**的 `setBackground`（写 `#bg1` 的 `background-image`）与**扩展**的 `applyMedia`（挂载图层）。两个写者、同一视觉结果。这与子任务 3「接管原生选择器」是同一接缝，须协同处理。

### B. 半接线（字段存在但无入口或无人读）

| 编号 | 字段 | 证据 | 状态 |
| --- | --- | --- | --- |
| B1 | `BgLoaderSettings.enabled` | `types/index.ts:133/283` 定义 + 默认；全仓无读取 | 无人读 |
| B2 | `muffleOnDrawer` | `types/index.ts:160/325` 定义 + 默认；全仓无引用 | 无人读 |
| B3 | `playlist: string[]` | `types/index.ts:145/300` 定义 + 默认；无读写（`AudioEngine.playlist` 是 `MediaItem[]`，同名不同物） | 无人读 |
| B4 | `chatBindings` | `index.ts:482-490` **读**并驱动 CHAT_CHANGED 分支；全仓**无写入点**（无 UI、无 API） | 分支不可达 |
| B5 | `cacheQuotaMB` / `lruAutoClean` | `index.ts:293-294` 读并驱动 `cleanLRU`；`SettingsDrawer` **无对应控件** | 永远停在默认值 |

### C. 死代码（定义但无调用者，均已交叉引用核验）

| 编号 | 位置 | 说明 |
| --- | --- | --- |
| C1 | [`CacheManager.ts:110`](src/cache/CacheManager.ts:110) / [`ServerOrigin.ts:240`](src/backend/ServerOrigin.ts:240) | `touchMedia` 两处均为空实现，无调用者 |
| C2 | [`SceneManager.ts:12`](src/core/SceneManager.ts:12) | `setApplyCallback` 无调用者（回调由构造函数传入） |
| C3 | [`AudioEngine.ts:74`](src/audio/AudioEngine.ts:74) | `isWaitingForUnmute` 无调用者 |
| C4 | [`AudioEngine.ts:125`](src/audio/AudioEngine.ts:125) | `getAnalyserNode` 无调用者（分析器经 `onAnalyserReady` 下发） |
| C5 | [`IframeRenderer.ts:59`](src/renderers/IframeRenderer.ts:59) | `postMessage` 无调用者 |
| C6 | [`MediaMount.ts:145-147,183-185`](src/core/MediaMount.ts:145) | `syncFitting()` 空实现；为它存在的 `#bg1` class observer 每次类变化唤醒却什么也不做 |
| C7 | [`AudioVisualizer.ts:140`](src/visualizer/AudioVisualizer.ts:140) | pulse 分支 `const brightness = 100 + pump * 25` 计算后从未使用 |

### D. 一致性

- **D1** 天气类型清单三处真源：`types/index.ts:80`（联合类型）、`PublicAPI.ts:40`（`WEATHER_TYPES` 常量）、`PublicAPI.ts:427`（`cycleWeather` 内字面量）。
- **D2** [`NativeBgAugmenter.ts:43`](src/ui/NativeBgAugmenter.ts:43) 产生 `.st-bg-native-badge.<type>`，但 [`style.css:189-201`](src/ui/style.css:189) 只定义基础样式，**无** `.video/.audio/.html/.svg` 变体；而媒体库徽章 `.st-bgloader-media-badge.<type>` 有变体 → 原生徽章五种类型外观完全相同。
- **D3** [`AudioEngine.ts:143-191`](src/audio/AudioEngine.ts:143) `playMediaItem` 与 `playCurrentTrack` 逻辑高度重复。

### E. 性能（均在主路径上）

- **E1** [`ServerOrigin.listCatalog()`](src/backend/ServerOrigin.ts:109) 每次调用都发一次 `/api/backgrounds/all` POST。经 `PublicAPI.setBackground → listMedia()` 与 `getCatalogItem → listCatalog()` 频繁触发 → 每次切背景、每次 `getMedia` 都走一次网络往返。
- **E2** [`CacheManager.touchCache`](src/cache/CacheManager.ts:210) 每次做全量 `indexAll()`（IndexedDB `getAll`）再写回，且位于 `getMediaBlobUrl` 热路径。
- **E3** [`CacheManager.objectUrls`](src/cache/CacheManager.ts:31) 无上限，仅在 `deleteMedia`/`clearAll` 释放 → 长会话内存持续增长。

### F. 安全 / 边界

- **F1** [`IframeRenderer.ts:19`](src/renderers/IframeRenderer.ts:19) `sandbox="allow-scripts allow-same-origin"`：该组合下同源 iframe 可访问 `parent.document` 与宿主 API。代码注释将其声明为「用户自有同源媒体的已接受信任边界」——**须复核该表述是否覆盖从 URL 导入的第三方 HTML**（`saveMedia` 的 `source:'url'` 路径会把外部 HTML 落到同源 `backgrounds/` 目录）。若覆盖不全，则注释与事实不符，需修正表述或收紧 sandbox。
- **F2（已核验为「非问题」，降级为防御性候选）** ST 的扩展启用/停用/更新一律走 `location.reload()`（`public/scripts/extensions.js:479/496/1325`），因此**不存在**「扩展被原地重载导致监听器翻倍」的路径。但扩展自身**无 teardown 汇总**（无 `destroy()` 聚合），在支持原地热重载的宿主分支（Luker / TauriTavern）或未来引入热重载时即为隐患 → 记为防御性候选，不按 P0 处理。

## Requirements

1. **R1 复核种子**：A1–E3 逐条复核（确认/推翻），推翻的须写明理由。
2. **R2 补齐扫描**：按模块（core / renderers / audio / fx / visualizer / ui / cache / backend / api / triggers）全覆盖扫描，补齐种子之外的发现；每条带 `file:line` + 一句话失败场景。
3. **R3 分级**：按父任务 `design.md` §5 的 P0–P4 标准给每条定级。
4. **R4 实施 P0–P2**：P0（数据丢失/功能失效/异常中断）、P1（竞态/泄漏/无界增长/状态错乱）、P2（主路径性能热点/外部输入未校验/静默错误）**必做**，且**不得改变对外契约**。
5. **R5 裁剪清单**：P3/P4 及 B/C/D 类整理为候选清单，每条给出「保留 / 合并 / 砍掉」建议 + 理由 + 影响面 + 成本；**交用户逐项拍板**。
6. **R6 PublicAPI 保护**：`PublicAPI` 的对外方法是**已文档化的契约**（见 `wiki/Public-API-Reference.md`），即使仓内无调用者也**不得**列入「砍掉」候选，只能列入「保留」并注明契约属性。
7. **R7 不越界**：不改设置面板视觉（子任务 1 范围）、不改原生接管接缝（子任务 3 范围）。若发现的问题落在两者范围内，**记录并转交**，不自行修改。
8. **R8 修复即验证**：每项修复附最小验证（单测式中探针、Dev 冒烟或三套件回归）。
9. **R9 零回归**：`type-check` + `build` + 三套件不劣于基线。

## Non-goals

- **不执行任何删除**（B1–C7、D1–D3 全部只进清单）。
- 不做架构级重构（拆模块、改分层）；不引入外部依赖。
- 不动 Authority 契约面与 `manifest.json`。
- 不优化 `ServerSettings.flush` 的写前读取（那是刻意为之的冲突检测，见上一任务 P3-11）。

## Acceptance Criteria

- [ ] `research/findings.md` 落盘：A1–E3 全部复核完毕（确认/推翻各有结论）+ 全模块扫描补齐 + 每条带 `file:line`、失败场景、分级。
- [ ] `research/prune-candidates.md` 落盘：含建议、理由、影响面、成本，且**明确标注「待用户批准，本轮不执行」**。
- [ ] 全部 P0/P1 项已修复并通过验证；P2 项已修复或给出「为何不移除」的书面理由。
- [ ] A1 / A2 / A3 三条用户可见缺陷有可复现的修复前证据与修复后验证。
- [ ] `PublicAPI` 对外方法无删除、无签名变更。
- [ ] `implement.md` 中**不存在勾选的删除类条目**（可用清单比对证明本轮未删除功能）。
- [ ] `npm run type-check` + `npm run build` 通过；三套件回归不劣于基线。
- [ ] 未越界修改子任务 1 / 子任务 3 范围内的文件（用 diff 核对）。
- [ ] 提交推送 `origin master`，子任务归档。

## Risks

- **R-1 A1 的修复方式牵动 MediaMount 状态机**：朴素做法是「渲染时重置 display」，但那会让 Alt+B 的隐藏状态在切背景后自动失效（可能是期望行为，也可能不是）→ 需先确认期望语义：**「隐藏」是全局开关还是仅当前背景**？拟定为全局开关（渲染时不重置），改为在 `MediaMount` 内维护 `visible` 状态并提供 `setVisible()`，`doMountMedia` 尊重该状态。
- **R-2 A2 的修复涉及 PublicAPI 语义**：非持久化背景若要支持「重载后恢复」，必须真正落库；否则应**不写入 `activeMediaId`**（保持内存态的语义诚实）。两种方向都会改变可观测行为 → 需在实现前明确取舍。
- **R-3 E1 加缓存引入陈旧风险**：`listCatalog` 加缓存后，原生面板上传的新文件可能不立即可见 → 缓存必须能在「用户打开媒体库 / 导入后 / 原生面板变更后」失效。
- **R-4 体检范围蔓延**：29 个文件的全面扫描易失控 → 以「带证据的可复现问题」为准，纯风格偏好不进清单。
- **R-5 F1 安全表述**：若复核认定注释与事实不符，需在「修正注释」与「收紧 sandbox」之间选择；后者会破坏 HTML 背景的功能（`allow-same-origin` 是当前能操作 DOM 的前提）→ 优先修正表述并把风险讲清楚，sandbox 收紧需用户裁定。

## Rollback

- 健壮性修复按发现编号分组提交，可按组 revert。
- `research/` 两份清单为只读产物，不参与回滚。
- 无删除动作 → 不存在「误删无法恢复」的风险面。
