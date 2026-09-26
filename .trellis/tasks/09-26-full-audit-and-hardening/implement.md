# 实现清单 — 全仓体检与健壮性加固

> 复选框随执行**实时勾选**（L0-2）。**本清单不含任何删除类条目**——裁剪动作须经用户逐项批准后另立清单。

## Phase A：激活与基线

- [x] A1 任务激活（`task.py start`；**须在子任务 1 提交之后**）
- [x] A2 基线：`git status` 干净、`npm run type-check && npm run build` 绿
- [x] A3 基线三套件留档

## Phase B：复核种子发现

- [x] B1 复核 A1（Alt+B 隐藏后切背景不显示）——Dev 实例复现并留证
- [x] B2 复核 A2（虚拟项持久化后丢失）——留证
- [x] B3 复核 A3（原生缩略图点击双写）——留证
- [x] B4 复核 B1–B5（半接线字段）——交叉引用确认
- [x] B5 复核 C1–C7（死代码）——交叉引用确认
- [x] B6 复核 D1–D3（一致性）、E1–E3（性能）、F1–F2（安全/边界）
- [x] B7 复核结论写入 `research/findings.md`（确认/推翻各有结论）

## Phase C：补齐全模块扫描

- [x] C1 core/（MediaMount、ParallaxController、SceneManager、ShortcutManager、mediaType、sanitize）
- [x] C2 renderers/（Video、Iframe、Image）
- [x] C3 audio/（AudioEngine、AmbientSoundGenerator）
- [x] C4 fx/ + visualizer/
- [x] C5 ui/（SettingsDrawer、MiniPlayer、FrostedGlassController、NativeBgAugmenter）——**只记录不修改**（视觉归子任务 1、接管归子任务 3）
- [x] C6 cache/ + backend/（CacheManager、ServerOrigin、ServerSettings、SettingsSync、AuthorityBridge、AgentBridge、RemoteImporter）
- [x] C7 api/ + triggers/ + types/ + index.ts
- [x] C8 全部发现按 P0–P4 分级写入 `research/findings.md`

## Phase D：产出裁剪候选清单

- [x] D1 `research/prune-candidates.md` 落盘：死字段 / 半接线 / 死代码 / 重复真源 / 一致性 / 重复逻辑 六组
- [x] D2 每条含：建议（保留/合并/砍掉）、理由、影响面、成本（S/M/L）、是否影响用户数据
- [x] D3 `PublicAPI` 对外方法统一标注「保留（契约）」并注明文档出处
- [x] D4 文首明确标注「**待用户批准，本轮不执行任何删除**」
- [x] D5 **交付用户逐项拍板**


## 执行记录（Phase A–D）

- **Phase A** 完成。任务激活于子任务 1 提交之后。
- **Phase B 复核结论（重要修正）**：
  - A1 **确认成立**（实测：Alt+B 隐藏后切背景，图层已渲染且 opacity=1 但容器仍 `display:none`；奇偶次 Alt+B 相消）。
  - A2 **确认成立**（实测：`setBackground(url)` 不带 `saveToLibrary` 时把 `custom_<ts>` 写进持久化的 `activeMediaId`，该 id 无法解析；且 `init()` 不自愈）。
  - A3 **确认成立但范围修正**：原生 `/api/backgrounds/all` 实测返回 **27 项、非图片 0 项**，故「非图片双写」的原设想不成立；实际受影响集合是原生网格中**被判为非 `image` 类型**的条目，当前仅 `.svg`（`detectMediaType('.svg') === 'svg'`）。实测点击 SVG 缩略图：宿主改写 `#bg1` 的 `background-image` **且** 扩展同时切换自身背景 → 双写成立。
  - B1–B5 / C1–C7 / D1–D3 / E1–E3 **交叉引用确认**（证据见 `research/findings.md`）。
  - F2 **核验为非问题**：ST 的扩展启停/更新一律 `location.reload()`（`extensions.js:479/496/1325`），不存在原地重载导致监听器翻倍的路径 → 降级为防御性候选。
  - **C8 新增**：`NativeBgAugmenter` 在当前宿主上只对 `.svg` 生效（原生网格 27 项全为图片扩展名，其中 3 个 `.svg` 命中）→ 其面向 video/audio/html 的功能面在现实中为零。
  - **A5 新增（本次体检新发现）**：三套设置存储并存，KV 与服务端文档的 revision **互相独立且量级悬殊（实测 41 vs 202）**，而 `SettingsSync.start()` **无条件**套用 KV 镜像 → 启动时陈旧 KV 会覆盖服务端文档已修正的状态（实测症状：服务端已是 `null`，运行态仍复活悬空的 `custom_` id）。
  - **A4** 由子任务 1 转交（见 `research/findings-from-child1.md`）。
- **Phase C** 完成：按模块（core / renderers / audio / fx+visualizer / ui / cache+backend / api+triggers+types+index）扫描；种子之外新增 C8、A5 两项。`ui/` 只记录不修改（视觉归子任务 1、接管归子任务 3），已遵守。
- **Phase D** 完成：`research/prune-candidates.md` 落盘，含 11 个待用户拍板的决策点、每组统一口径、逐项建议/理由/影响面/成本/数据影响，并显式标注「本轮不执行任何删除」。

### Phase B–D 期间的实例侧副作用（已复原）

- A2 复核留下悬空 `activeMediaId` → 已跨**三套存储**清理并实测三方一致（`localStorage` / 服务端文档 / KV 镜像均为 `null`）。
- 探针在服务端 `backgrounds/` 留下了 `visual-check*.svg` 与既有 e2e/stress 产物（`test-animation*.html` 等）。**未擅自删除这些文件**——删除属不可逆操作，已列入待用户确认事项。


## 用户裁定（2026-09-26）与 Phase E/F 定稿清单

> 四项决策**全部采用推荐项**。以下为本任务获准执行的完整工作集，其余一切不改。

| 决策点 | 裁定 |
| --- | --- |
| 冗余清理与一致性整理 | **全部执行** —— 砍 3 个死字段 + 7 处死代码；并做 D1 天气真源收敛、D2 原生徽章配色补齐、D3 播放逻辑合并 |
| 半接线字段 | **B4 砍掉 + B5 补控件** |
| A5 修复方向 | **KV 降为回退** —— KV 仅在服务端文档缺失/不可读时用作回退；服务端文档为本机真源 |
| Dev 实例测试产物 | **两类都清** —— 已执行（见下） |

### Phase E — P0/P1 修复（定稿）

- [x] E1 **A1**：`MediaMount` 新增 `visible` 受控状态 + `setVisible()/isVisible()`；`setupContainer()` 末尾应用；`doMountMedia()` **不触碰** `display`；`index.ts` 的 `onToggleBackground` 改为调用 `setVisible()`
- [x] E2 **A2**：`PublicAPI.setBackground` 在 `saveToLibrary` 非真时**不写** `settings.activeMediaId`（仅设内存态）；`index.ts` `init()` 恢复背景时若 `getMedia(activeMediaId)` 为 `null` → 置 `null` 并保存（自愈）
- [x] E3 **A3**：`NativeBgAugmenter` 非 `image` 项点击处理加 `preventDefault()` + `stopPropagation()`，消除双写；**注释须写明「本处理将被子任务 3 的 `NativeBackgroundController` 取代」**
- [x] E4 **A4**（子任务 1 转交）：`refreshMediaGrid` 的守卫改为**元素级**（`grid.dataset.gridSignature`），并在 `await` 之后复核 `this.container` 里的栅格是否仍是同一个（否则 return，交给那次渲染自己填充）；删除 `private lastGridSignature` 字段及 `render()` 中对它的重置
- [x] E5 **A5**：`SettingsSync.start()` 不再无条件套用 KV 镜像。改为**先比对服务端文档**：仅当服务端文档缺失/不可读时才用 KV 回退。`SettingsSync` 需要能读到服务端文档的存在性与 revision（经 `ServerSettings.load()`），并据此决定是否套用
- [x] E6 每项修复后 `npx tsc --noEmit` 快验；**每个发现独立提交**（提交信息含编号）

### Phase F — P2 修复与已批准的裁剪/整理（定稿）

**性能**
- [x] F1 **E1**：`ServerOrigin` 目录短时缓存（TTL 2000ms）+ 写操作（`putMedia`/`deleteMedia`）成功后失效 + 公开 `invalidateCatalog()` 钩子供子任务 3 调用
- [x] F2 **E2**：`CacheManager.touchCache` 去全量 `indexAll()`——维护内存索引镜像，首次 `init()` 读一次 IDB，其后读写走内存 + 异步落盘；`clearAll`/`cleanLRU` 前强制重读
- [x] F3 **E3**：`objectUrls` 保守有界化——随 cache 条目淘汰同步 `revokeObjectURL`（只释放不再被 LRU 追踪的条目）

**一致性 / 去重**
- [x] F4 **D1**：天气类型收敛为单一真源——`types/index.ts` 导出 `WEATHER_TYPES` 常量，`PublicAPI` 的两处（常量与 `cycleWeather` 字面量）改为引用它
- [x] F5 **D2**：原生徽章按类型配色补齐——在 `style.css` 补 `.st-bg-native-badge.video/.audio/.html/.svg`，复用面板作用域的 `--st-bg-badge-*`（与媒体库徽章一致）
- [x] F6 **D3**：`AudioEngine.playMediaItem` 与 `playCurrentTrack` 的重复逻辑合并为单一内部实现；**对外行为与事件发射次数不得改变**
- [x] F7 **F1**：`IframeRenderer` sandbox 注释修正——明确「`allow-scripts allow-same-origin` 组合下，从 URL 导入的第三方 HTML 同样可访问 `parent.document` 与宿主 API」，把风险讲清楚（**sandbox 收紧不在本轮**）

**已批准的裁剪（B4 + 死字段 + 死代码）**
- [x] F8 **B4**：砍掉 `chatBindings`——删 `types` 字段与默认值、删 `index.ts` 中不可达的 CHAT_CHANGED 绑定分支
- [x] F9 **B1/B2/B3**：砍掉 `enabled` / `muffleOnDrawer` / `playlist` 三个死字段（类型 + 默认值）
- [x] F10 **C1–C7**：砍掉 7 处死代码——`CacheManager.touchMedia`、`ServerOrigin.touchMedia`、`SceneManager.setApplyCallback`、`AudioEngine.isWaitingForUnmute`、`AudioEngine.getAnalyserNode`、`IframeRenderer.postMessage`、`MediaMount.syncFitting` **连同**为它存在的 `#bg1` class observer、`AudioVisualizer` pulse 分支未使用的 `brightness`
      > **执行时订正（2026-09-26 重做）**：本条清单文本已过时，两点未按其字面执行——
      > ① `AudioEngine.isWaitingForUnmute` **保留**（它是 `tests/e2e.mjs:404-410` 的观测面，删了 e2e 必挂），以「重做范围」F10 为准；
      > ② `ServerOrigin.touchMedia` **在 `11977b4` 就不存在**（`git show HEAD:src/backend/ServerOrigin.ts | grep touchMedia` 无输出），`findings.md` 的 `ServerOrigin.ts:240` 行号引用有误，故实际只删了 `CacheManager.touchMedia` 一处。
      > 其余 5 处按字面删除：`setApplyCallback`、`getAnalyserNode`、`postMessage`、`syncFitting`+observer、pulse 未使用的 `brightness`。
- [x] F11 **B5**：补 `cacheQuotaMB`（滑块，建议范围 128–8192 MB）+ `lruAutoClean`（勾选框）两个控件，按子任务 1 落盘的 `host-native-ui.md` 规范实现（**用现有类，不加行内样式，不加溢光**），接线到 `onSettingsChanged`

**明确不做（记录在案）**
- [ ] F12 **不做** C8（`NativeBgAugmenter` 处置）—— 处置权归子任务 3
- [ ] F13 **不做** iframe sandbox 收紧（需另行裁定）
- [ ] F14 **不做** 设置面板「保存场景」改调 `PublicAPI.saveCurrentScene`（未批准）

### 执行纪律

- **一次都不许删除** unapproved 项；F8–F10 是**唯一**获准的删除动作。
- 每项独立提交，提交信息含编号（`fix(audit): A1 …` / `chore(audit): prune B1-B3 …`）。
- 所有改动须遵守 `.trellis/spec/frontend/host-native-ui.md`（子任务 1 落盘）：不加行内结构样式、不加 `box-shadow`、不自建宿主已提供的机制。
- **不修改** `Wiki`/`README`（归子任务 4）。

### 实例侧清理（已执行，用户已批准）

- Dev 实例 `data/default-user/backgrounds/` 中的测试产物已清理：**18 个文件**（15 个 `test-animation*.html` + 3 个 `visual-check*.svg`），并同步移除 manifest 中对应的 18 条登记（20 → 2 条），避免留下指向已删文件的幽灵条目。
- 当时实例未运行，故采用**磁盘层等价操作**（删文件 + 同步改 manifest），而非扩展的 `deleteMedia`。
- **manifest 已备份**：`research/manifest-backup-20260926-084638.json`；操作清单留痕 `research/instance-cleanup-20260926-084638.txt`。
- **未触碰**：`st-bg-loader-manifest.json`、`st-bg-loader-settings.json`、用户真实背景、`legacy-seed.html`。
- **附带发现（未处理，仅记录）**：manifest 中登记了 `favicon.ico`（`src=url`，type=image）——即宿主自身的 favicon 被扩展当成了媒体条目，会在媒体库里显示为一张垃圾卡；另有早期条目的 `source` 值为 `local`，越出 `MediaSource = 'url' | 'server'` 联合类型（老版本遗留）。

## Phase E：实施 P0/P1 修复（已由上方定稿清单取代，保留原条目作对照）

- [x] E1 A1：`MediaMount` 新增 `visible` 状态 + `setVisible()/isVisible()`；`setupContainer` 应用；`doMountMedia` 不触碰 display；`index.ts` 改调用
- [x] E2 A2：非持久化背景不写 `activeMediaId`（按 A2-a）+ `init()` 恢复时清理悬空 id 自愈
- [x] E3 A3：`NativeBgAugmenter` 非图片项点击 `stopPropagation/preventDefault`，消除双写（并注明将被子任务 3 取代）
- [x] E4 其余 P0/P1 项按 `findings.md` 逐个实施
- [x] E5 每项修复后 `npx tsc --noEmit` 快验

## Phase F：实施 P2 修复

- [x] F1 E1：`ServerOrigin` 目录短时缓存（TTL 2s）+ 写操作失效 + `invalidateCatalog()` 公开钩子
- [x] F2 E2：按 §2.5 评估——实施内存索引镜像，或给出「不做」的书面理由
- [x] F3 E3：`objectUrls` 保守有界化（随 cache 条目淘汰同步释放）
- [x] F4 D1：天气类型收敛为单一真源（`types` 导出，`PublicAPI` 引用）
- [x] F5 D2：原生徽章按类型配色补齐（或统一无类型色，二选一并在 findings 记录理由）
- [x] F6 D3：`playMediaItem`/`playCurrentTrack` 重复逻辑合并
- [x] F7 F1：复核 iframe sandbox 注释表述是否覆盖「URL 导入的第三方 HTML」；修正表述（sandbox 收紧需用户裁定，不在本轮）
- [x] F8 其余 P2 项逐个实施或给出不做理由
- [x] F9 `npx tsc --noEmit` 快验

## Phase G：回归与收尾

- [ ] G1 A1/A2/A3 修复前证据 + 修复后验证（按 `design.md` §5 的验证表）
- [ ] G2 E1/E2 性能验证（请求数 / IDB 调用数前后对比）
- [x] G3 `npm run type-check && npm run build`
- [x] G4 CSS 裸选择器门禁为 0
- [ ] G5 e2e + stress + authority 三套件
- [ ] G6 Dev 冒烟：抽屉开合、切背景、Alt+B、迷你播放器、pulse+视差同开
- [ ] G7 **未越界核对**：`git diff --stat` 确认未修改 SettingsDrawer 视觉区与原生接管接缝（子任务 1/3 范围）
- [ ] G8 **未删除核对**：清单比对，确认本轮零删除
      > **本条已被重做范围取代**：本轮**确有获准删除**（F8 `chatBindings`、F9 三个死字段、F10 6 处死代码、K1 `src/core/ShortcutManager.ts`）。判据改为「删除只出现在获批清单内、无超范围删除」，而不是「零删除」。
- [ ] G9 更新 `dist/` 并按发现编号分组提交、推送 `origin master`
- [ ] G10 归档子任务

## 验证命令

```bash
npm run type-check && npm run build
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

```bash
git diff --stat HEAD -- src/ui/SettingsDrawer.ts src/ui/style.css
```

末条用于 G7 越界核对（若与子任务 1 提交后相比无新增改动，则未越界）。

## 回滚点

| 回滚点 | 范围 |
| --- | --- |
| RP-1 | Phase E 全部（P0/P1 修复）按发现编号分组，可单条 revert |
| RP-2 | Phase F 全部（P2 修复）同上 |
| RP-3 | `research/` 清单为只读产物，不参与回滚 |

## 纪律

- 每项修复独立提交，提交信息含发现编号（`fix(audit): A1 …`）。
- 发现的问题若落在子任务 1 / 子任务 3 范围内 → **只记录、转交**，不在本子任务修改。
- 裁剪动作**本轮一次都不执行**，即使清单条目看起来毫无争议。

---

## 重做范围（2026-09-26 事故后，用户裁定「现在重做，逐项提交」）

> **背景**：工作树曾被外部工具覆写到 2026-09-06 状态，未提交的改动丢失。master 已恢复到 `11977b4`。完整事故记录见 `research/INCIDENT-repo-reverted.md`，损失清单见 `research/INCIDENT-lost-work-inventory.md`。
>
> **重做依据**：本文件上方的「Phase E/F 定稿清单」与「追加裁定（第二轮）」即为逐条施工说明，本节只界定**范围**。

### ⚠️ 已存活、**绝对不要重做**（已回填，重复施加会出错）

| 项 | 落在哪个文件 | 核验特征（应已存在） |
| --- | --- | --- |
| **F1** 目录 TTL 缓存 + `invalidateCatalog` | `src/backend/ServerOrigin.ts` | `CATALOG_TTL` / `invalidateCatalog` |
| **S4** favicon 等宿主自有文件过滤 | `src/backend/ServerOrigin.ts` | `HOST_OWNED_FILENAMES` / `isHostOwnedFilename` |
| **A5 本体** KV 降为回退 | `src/backend/SettingsSync.ts` | `hasServerDocument` |
| **D4** 天气常量收敛 | `src/backend/AgentBridge.ts` | `WEATHER_TYPES` |
| **S7.3 测试修复** | `tests/authority.mjs` | `window.top === window` |
| **e2e Test 14 素材修复** | `tests/e2e.mjs` | `self-contained blob URL` |

→ 动手前**先 grep 上表特征确认它们仍在**；若某项不见了，说明又被覆写，先报告再继续。

### 需重做清单（19 项 + 3 处订正）

**第一组（P1 缺陷，来自「Phase E/F 定稿清单」）**
- [x] A1 `MediaMount` 受控可见性 + `index.ts` 接线
- [x] A2 瞬时背景不写 `activeMediaId` + `init()` 悬空 id 自愈
- [x] A3 `NativeBgAugmenter` 阻止冒泡（消除双写）
- [x] A4 `refreshMediaGrid` 元素级守卫 + await 后栅格身份复核；删 `lastGridSignature`
- [x] A5′ `index.ts` 的 `hasServerDocument` 探测接线（**本体已在，只接线**）

**第二组（P2 与裁剪，同一清单）**
- [x] F2 `CacheManager` 索引内存镜像
- [x] F3 `objectUrls` 有界化
- [x] F4 天气单一真源（`types` 导出 `WEATHER_TYPES`，`PublicAPI` 两处引用）
- [x] F5 原生徽章按类型配色（**仅追加** CSS 规则，勿动子任务 1 已定稿的折叠/去溢光规则）
- [x] F6 `playMediaItem`/`playCurrentTrack` 合并为 `startTrack`（**事件发射次数不得变**）
- [x] F7 `IframeRenderer` sandbox 注释订正（同源能力表述）
- [x] F8 删 `chatBindings`（字段 + `index.ts` 不可达分支）
- [x] F9 删 `enabled` / `muffleOnDrawer` / `playlist` 三字段
- [x] F10 删 6 处死代码（`touchMedia`×2 / `setApplyCallback` / `getAnalyserNode` / `postMessage` / `syncFitting`+其 observer / `brightness`）。**C3 `isWaitingForUnmute` 必须保留**——它是 `tests/e2e.mjs:404-410` 的观测面
- [x] F11 补 `cacheQuotaMB` 滑块 + `lruAutoClean` 勾选框

**第三组（快捷键与收尾，来自「追加裁定（第二轮）」）**
- [x] K1–K5 移除五个 Alt 快捷键（删 `src/core/ShortcutManager.ts`；清 `index.ts`/`types`/`SettingsDrawer` 的接线与 `shortcutsEnabled`）
- [x] K6–K8 背景可见性：面板勾选框 + `index.ts` 回调 + `PublicAPI.setBackgroundVisible()/isBackgroundVisible()`
- [x] S1 网格刷新票据（`grid.dataset.refreshSeq`；await 前预约、await 后**相等判定**）
- [x] S2 配额变化即时 `cleanLRU`（门控 `lruAutoClean`，仅配额真变时触发）

**第四组（复核订正）**
- [x] 订正 1 `CacheManager.evictCacheEntry` 注释（"挂载项是最后候选"论据不成立；如实写 LRU 不保证 + BGM 残留窗口）
- [x] 订正 2 `.trellis/spec/frontend/host-native-ui.md` §3 门禁 → `grep -c 'box-shadow:'`
- [x] 订正 3 `.trellis/spec/frontend/state-management.md`：删 `chatBindings` 段；加 A5「启动优先级」与「已知后果（不自愈）」

### 提交纪律（本次事故的直接教训）

**每完成一组立即提交，不攒到最后。** 事故正是因为改动长期留在工作树未提交而全数丢失。
- 提交信息含编号，如 `fix(audit): A1 受控可见性 …`
- 组间不要跨文件混提交

### 执行记录（重做，2026-09-26）

- **动手前复核「已存活项」**：F1 / S4 / A5 本体 / D4 / S7.3 / e2e Test14 六条特征串计数分别为 7 / 2 / 2 / 3 / 1 / 1，**全部命中** → 未重做，未改动 `src/backend/ServerOrigin.ts`、`SettingsSync.ts`、`AgentBridge.ts`、`tests/*.mjs`。
- **第一组 A1–A5′**：全部落地（`MediaMount` 受控可见性；`applyMediaItem(item, persist)` + `init()` 悬空 id 自愈；`NativeBgAugmenter` 阻止冒泡；`refreshMediaGrid` 元素级守卫 + 栅格身份复核并删 `lastGridSignature`；`index.ts` 接 `hasServerSettingsDocument`）。
  - A1 的 `index.ts` 接线**由 K6 承担**：Alt+B 已随 K1 移除，可见性入口改为面板勾选框 → `PublicAPI.setBackgroundVisible()`。
- **第二组 F2–F11**：全部落地。F10 见上方执行时订正（`isWaitingForUnmute` 保留 / `ServerOrigin.touchMedia` 本就不存在）。
  - F6 合并形态：`startTrack(item, mediaUrl?)` 为两个公开方法的唯一入口，src/loop/unmute/play 序列复用既有 `playTrack()`（避免把它变成第三处死代码），`emitTrackChange` 仍是每次成功调用恰好一次。
  - F4 采用**派生式单一真源**：`types` 的 `WEATHER_TYPES` 常量是唯一真源，`WeatherType` 由它派生（`typeof WEATHER_TYPES[number]`），漂移在编译期即暴露。（`AgentBridge` 的 D4 已直接引用该常量，故 F4 是编译通过的前置条件。）
  - F5 采用 `var(--st-bg-badge-*, #字面量)` 兜底：原生徽章位于 `.st-bgloader-panel` 作用域**之外**，面板级自定义属性不解析，故必须带字面量回退；**仅追加**规则，未触碰子任务 1 定稿的折叠/去溢光规则。
- **第三组 K1–K8 / S1–S2**：全部落地。`src/core/ShortcutManager.ts` 已删除；`PublicAPI` 净增 2 个方法、0 删除；A4 与 S1 的守卫状态均落在栅格元素 `dataset` 上（`refreshSeq` / `gridSignature`）。
- **第四组 3 处订正**：全部落地。
  - 订正 3 除清单所列两项外，**另同步了一处已失真的表述**：`activeMediaId` 那条「每次 `applyMedia` 均写入」在 A2 后不再成立，已改为「`persist` 为真时写入（默认）」并加「Runtime-only state」小节——否则该 spec 会诱导后来者重新引入 A2。此额外改动已在此显式记录。
- **静态验证**：`npx tsc --noEmit` 全程绿；`npm run type-check && npm run build` 双绿（`dist/index.js` 177.26 kB、`dist/style.css` 7.41 kB，`dist` 已随构建更新）；CSS 裸选择器门禁 0；`grep -c 'box-shadow:'` 0。
- **K8 契约面的源级模拟**（照 `probe-k-s-verify.mjs` 的解析规则跑）：wiki 文档化方法 27 个，`src/api/PublicAPI.ts` 声明 40 个，**文档化方法缺失 0 个**，声明集 = 既有 38 + 新增 `setBackgroundVisible` / `isBackgroundVisible`（无删除）。
- **⚠️ 运行期验证被环境阻塞（需用户处置）**：Dev 实例 `https://127.0.0.1:8003` 上，**ST-BgLoader 处于停用状态**——`SillyTavern.getContext().extensionSettings.disabledExtensions` 含 `"third-party/ST-BgLoader"`，页面无该扩展的 script 标签，故 `window.STBgLoader` 为 `undefined`、`isInitialized` 永不为真；`probe-k-s-verify.mjs` 在等 `isInitialized` 40s 后超时（0 passed / 1 failed）。扩展文件本身在位（实例经 `manifest.json` 的 `js: dist/index.js` 提供本仓 `dist/`，服务端字节数 178523 = 本地 `dist/index.js` 字节数，特征串命中）。
  → **待用户在实例中重新启用扩展后**，G1/G2/G6 与 `probe-k-s-verify.mjs` / `probe-verify-fixes.mjs` 才能取得运行期证据；G5 三套件按主会话指示本轮未跑。
- **G7 越界核对的读法需更新**：`git diff --stat HEAD -- src/ui/SettingsDrawer.ts src/ui/style.css` 现在**必然非空**，因为 F11（配额控件）与 F5/K6/S1/A4 本就落在两个文件里——判据应是「只有本子任务获准的那几处改动」，而非「无改动」。已人工核对：样式表只有**追加**的类型徽章规则，折叠规则（`display`/`height` 相关）与去溢光既定规则一字未动。
