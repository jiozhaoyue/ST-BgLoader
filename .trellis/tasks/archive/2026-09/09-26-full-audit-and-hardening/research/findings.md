# 体检发现（子任务 2）

> 判定标准见父任务 `design.md` §5：P0 数据丢失/功能失效/异常中断 · P1 竞态/泄漏/无界增长/状态错乱 · P2 主路径性能热点/外部输入未校验/静默错误 · P3 可读性/重复代码/死代码 · P4 纯外观。
>
> 每条标注**证据类型**：`实测` = 在 Dev 实例（Luker :8003）上运行探针取得；`交叉引用` = 全仓符号检索确认；`代码阅读` = 逐行确认。
> 探针脚本与输出见本目录 `probe-*.mjs` / `probe-*-output.txt`。

---

## 一、确认的用户可见缺陷

### A1 — Alt+B 隐藏背景后的可见性**状态管理**缺陷（**P2 · 原定性 P1 已复核下调**）

> **⚠️ 本项结论经 `trellis-check` 复核后更正**（原记录在事故中丢失，此处重述）。原标题把
> 「隐藏后切背景不显示」当作用户可见缺陷（P1）。复核指出并**经复盘确认**：修复前后
> **可观测行为完全一致**——都是「隐藏后切背景仍隐藏」。因为**原实现的 `display` 切换本身
> 就是全局开关语义**（`display === 'none' ? 'block' : 'none'`，按两次即恢复）。
>
> 因此**「隐藏后切背景不显示」不是缺陷，而是既定行为**；把它当缺陷是原报告的定性错误。
>
> **本项中真正成立、且已修复的两点**：
> 1. **按键意图被吞（真实修复）**：旧代码 `if (cont) { … }` —— 若 `#bg1`/容器尚未出现，
>    按键被静默吞掉、意图永久丢失。新实现先把状态落进 `MediaMount.visible`，容器创建时
>    由 `setupContainer()` 补写。
> 2. **可见性由 DOM 行内样式迁为受控状态**：成为单一真源（`MediaMount` 持有 + 设置字段持久化）。
>
> **后续演进**：Alt+B 已随 K1 移除（Alt+F 撞浏览器主菜单、Ctrl+Alt 为 Windows 保留组合），
> 改为面板勾选框 + `PublicAPI.setBackgroundVisible/isBackgroundVisible`，并**持久化**
> `settings.backgroundVisible`（见 §十二 A1 组实测）。

**证据**（`probe-verify-seeds.mjs`）：

```
{"before":"(未设置)","afterAltB":"none","afterSwitch":"none","layerVisible":true,"otherName":"_black.jpg"}
```

- 按一次 Alt+B → 容器 `display: none`。
- 此后切换背景：新图层**已渲染且 opacity=1**（`layerVisible: true`），但容器仍是 `display: none` → 画面无变化。
- 再按一次 Alt+B → 恢复（奇偶相消）。

**机理**：可见性被写成容器上的行内 `display`（[`index.ts:211-217`](../../../src/index.ts) 的 `onToggleBackground`），而 `MediaMount` 不知道这个状态；[`doMountMedia`](../../../src/core/MediaMount.ts) 渲染新媒体时不重置 `display`，容器也只在 `init()` 时创建一次。

**建议修复**：把可见性收进 `MediaMount` 作为受控状态（`visible` + `setVisible()/isVisible()`），`setupContainer()` 应用、`doMountMedia` 不触碰（详见本任务 `design.md` §2.1）。

### A2 — 非持久化背景写入 `activeMediaId`，留下悬空引用（P1 · 实测）

**证据**（`probe-verify-seeds.mjs`）：

```
{"activeId":"custom_1790360112859","resolvableIsNull":true,"resolvableType":"object"}
```

调 `stBgLoader.setBackground(url)`（不带 `saveToLibrary`）后，持久化字段 `activeMediaId` 被写成内存虚拟 id `custom_<ts>`，而该 id 在媒体库中查不到（`getMedia` 返回 `null`；`typeof null === 'object'` 造成输出标签歧义，`resolvableIsNull:true` 才是实质）。

**且不自愈**：`init()` 第 13 步恢复背景时若 `getMedia(activeMediaId)` 为 `null`，什么也不做——悬空 id 会一直留在设置里，并被写进服务端文档与 KV 镜像（见 A5）。

**建议修复**：非持久化背景不写 `activeMediaId`（只设内存态）；`init()` 恢复时对无法解析的 id 自愈清空。

### A3 — 原生面板 SVG 缩略图点击**双写**（P1 · 实测 · **范围较原设想已修正**）

**重要前提实测**：原生 `/api/backgrounds/all` 返回 **27 项，其中非图片扩展名 0 项**（响应只有 `images`/`config` 两个字段）。但原生网格里确实出现了 3 个 `.svg` 文件——因为 `detectMediaType('*.svg')` 返回 **`'svg'`**（非 `'image'`）。

**证据**（`probe-a3-svg.mjs`）：被徽章标注的缩略图恰为那 3 个 `.svg`（`badge: "SVG"`、`augmented: true`）。点击其中一个：

```
{"file":"visual-check_1790359463100.svg",
 "hostBgBefore":"url(\"backgrounds/__transparent.png\")",
 "hostBgAfter":"url(\"backgrounds/visual-check_1790359463100.svg\")",
 "hostWritten":true,
 "activeBefore":"custom_1790360112859",
 "activeAfter":"native_visual-check_1790359463100.svg"}
```

→ **宿主改写了 `#bg1` 的 `background-image`，同时扩展也切换了自己的背景**。一次点击、两个写者、同一视觉结果。

**机理**：[`NativeBgAugmenter.ts:48-51`](../../../src/ui/NativeBgAugmenter.ts) 对 `detectMediaType(bgFile) !== 'image'` 的项追加元素级 click 监听器；宿主的选择处理器是 document 级委托，两者都会执行。

**推论（对子任务 3 至关重要）**：受影响集合是「原生网格中**非 `image` 类型**的条目」，当前实际只有 `.svg`。**因此子任务 3 若选 T1（只接管非图片）将几乎无对象——其可行性矩阵中 T1 是近似空操作。** 用户已选 T2（接管全部选择），这是唯一有实质效果的层级。

### A4 — 设置面板媒体库间歇性渲染为空（P1 · 实测 · 由子任务 1 转交）

详见 [`findings-from-child1.md`](./findings-from-child1.md)。机理：`refreshMediaGrid` 的签名守卫 `lastGridSignature` 是**抽屉实例级共享字段**，而栅格元素**每次渲染新建**；启动期面板会被替换 2–3 次（`init` + 云端同步触发的 `applyRemoteSettings`），两处 `await listMedia()` 的完成顺序决定是否命中「写入已脱离文档的旧栅格 + 新栅格被守卫跳过」。

复现率实测：一批 3 次中 2 次为空；另一批 4 次全正常。

### A5 — 跨存储优先级倒置：启动时 Authority KV 镜像**无条件**覆盖服务端设置文档（P1 · 实测+代码阅读 · **本次体检新发现**）

**三套并存的设置存储**：

| # | 存储 | 真源含义 | 当前 revision |
| --- | --- | --- | --- |
| 1 | `localStorage`（`st_bgloader_settings`） | 快速缓存 | 与 2 同源 |
| 2 | 服务端 `backgrounds/st-bg-loader-settings.json`（`ServerSettings`） | 服务端持久副本 | **202** |
| 3 | Authority KV（`settings:data` / `settings:rev`，`SettingsSync`） | 跨设备镜像 | **41** |

**实测**（`probe-kv-mirror.mjs`）：三者 revision **完全独立且量级悬殊（41 vs 202）**，无法互相比较。

**实测症状**：两次观察到「服务端文档已是 `null`，但运行态 `activeMediaId` 仍是先前的悬空 `custom_` 值」。由于每个探针使用全新 Chrome 配置（`localStorage` 为空）、且服务端文档已确认为 `null`，该陈旧值的**唯一可能来源就是 KV 镜像**。

**机理**（代码阅读，[`SettingsSync.ts`](../../../src/backend/SettingsSync.ts) `start()`）：

```ts
public async start(): Promise<void> {
    const remote = await this.readPayload();
    if (remote) {
        this.localRevision = remote.revision;
        this.lastPushedFingerprint = remote.fingerprint;
        this.applyingRemote = true;
        try { this.onRemoteSettings(remote.settings); } finally { this.applyingRemote = false; }   // ← 无条件套用
```

而 [`index.ts`](../../../src/index.ts) 的 `startSettingsSync()` 回调把 `this.settings` **整体替换**为 KV 的副本。

**启动期的实际优先级**：`localStorage` → `ServerSettings` 文档（**按 revision 比较，较新者胜**）→ **KV 镜像（无条件，最终生效）**。

→ 任何已在服务端文档中被修正的状态，都会被一个可能更陈旧的 KV 副本在**每次页面加载时**恢复。这正是 A2 的悬空 id 反复复活的原因。

**建议修复**（方向，需用户确认优先级语义）：`SettingsSync.start()` 不得无条件套用 KV。至少应满足其一：
- (a) 让 KV 也参与 revision 比较（需要两套计数器统一，或让 KV 只存「自上次服务端写入以来的增量」）；
- (b) KV 镜像改为**仅在服务端文档缺失/不可读时**才作为回退（即降级为备份角色）；
- (c) 明确「KV 是跨设备真源、服务端文档是本机真源」，并让启动合并规则显式化（时间戳较新者胜，而非计数器）。当前实现三者交错、无统一语义，是缺陷的根源。

---

## 二、半接线（字段存在但无入口或无人读 · 交叉引用）

| 编号 | 字段 | 证据 | 状态 |
| --- | --- | --- | --- |
| B1 | `BgLoaderSettings.enabled` | `types/index.ts:133/283` 定义+默认；全仓无读取（`.enabled` 命中均为 `rule.enabled` / `parallax.enabled` / `frostedChat.enabled` 等其它对象） | 无人读 |
| B2 | `muffleOnDrawer` | `types/index.ts:160/325`；全仓无引用 | 无人读 |
| B3 | `playlist: string[]` | `types/index.ts:145/300`；无读写（`AudioEngine.playlist` 是 `MediaItem[]`，同名不同物） | 无人读 |
| B4 | `chatBindings` | `index.ts:482-490` **读**并驱动 CHAT_CHANGED 分支；全仓**无写入点**（无 UI、无 API） | 分支不可达 |
| B5 | `cacheQuotaMB` / `lruAutoClean` | `index.ts:293-294` 读并驱动 `cleanLRU`；`SettingsDrawer` **无对应控件** | 永远停在默认值 |

## 三、死代码（定义但无调用者 · 交叉引用）

| 编号 | 位置 | 说明 |
| --- | --- | --- |
| C1 | `CacheManager.ts:110` | `touchMedia` 空实现，无调用者。**执行时订正**：原记录写的 `ServerOrigin.ts:240` 有误——该文件在 `11977b4` 里根本没有 `touchMedia`（更早的任务已删）。已删除（F10） |
| C2 | `SceneManager.ts:12` | `setApplyCallback` 无调用者（回调经构造函数传入）。已删除（F10） |
| C3 | `AudioEngine.ts:74` | ~~`isWaitingForUnmute` 无调用者~~ → **本项结论错误，已推翻**：`tests/e2e.mjs:404-410` 用 `engine.isWaitingForUnmute()` 作为**第 13 项（autoplay 解锁）的观测面**，删除它 e2e 必挂。原结论来自只扫 `src/` 的交叉引用，**漏扫了 `tests/`**。→ **保留**，源码处已加注释标明「回归套件观测面」 |
| C4 | `AudioEngine.ts:125` | `getAnalyserNode` 无调用者（分析器经 `onAnalyserReady` 下发）。已删除（F10） |
| C5 | `IframeRenderer.ts:59` | `postMessage` 无调用者。已删除（F10） |
| C6 | `MediaMount.ts:145-147,183-185` | `syncFitting()` 空实现；为它存在的 `#bg1` class observer 每次类变化唤醒却什么也不做。已删除（F10，观察者一并移除） |
| C7 | `AudioVisualizer.ts:140` | pulse 分支 `const brightness = 100 + pump * 25` 计算后从未使用。已删除（F10） |
| **C8** | `NativeBgAugmenter.ts:41-52` | **实测**：当前宿主上仅对 `.svg` 生效（原生网格 27 项全为图片扩展名，其中 3 个 `.svg` 被判为 `'svg'` 类型）。即该组件的「非图片徽章 + 点击接管」功能面对 `MediaType` 中的 video/audio/html 实际为空——因为原生网格不列这些文件。**其价值集中在子任务 3 的接管上，独占存在意义薄弱。** 处置权归子任务 3（用户裁定） |

> **C3 的教训（值得沉淀）**：交叉引用式死代码检测**必须把 `tests/` 纳入扫描范围**。本仓三套件把插件内部状态当作观测面（`window.STBgLoader` 上的实例与其子系统直接暴露），因此「仓内无调用者」不等于「无人使用」。下轮体检的检测命令应形如 `grep -rn "<symbol>" src/ tests/`。

## 四、一致性

| 编号 | 说明 |
| --- | --- |
| D1 | 天气类型清单三处真源：`types/index.ts:80`（联合类型）、`PublicAPI.ts:40`（`WEATHER_TYPES`）、`PublicAPI.ts:427`（`cycleWeather` 内字面量） |
| D2 | `NativeBgAugmenter` 产出 `.st-bg-native-badge.<type>`，但 `style.css` 只定义基础样式，无 `.video/.audio/.html/.svg` 变体（而媒体库徽章有变体）→ 原生徽章各类型外观相同 |
| D3 | `AudioEngine.playMediaItem` 与 `playCurrentTrack` 逻辑高度重复（`AudioEngine.ts:143-191`） |

## 五、性能（均在主路径上）

| 编号 | 说明 |
| --- | --- |
| E1 | `ServerOrigin.listCatalog()` 每次调用都发一次 `/api/backgrounds/all` POST（`ServerOrigin.ts:109-137`）。经 `PublicAPI.setBackground → listMedia()` 与 `getCatalogItem → listCatalog()` 频繁触发 → 每次切背景、每次 `getMedia` 都走一次网络往返 |
| E2 | `CacheManager.touchCache` 每次做全量 `indexAll()`（IndexedDB `getAll`）再写回，且位于 `getMediaBlobUrl` 热路径（`CacheManager.ts:210-216`） |
| E3 | `CacheManager.objectUrls` 无上限，仅在 `deleteMedia`/`clearAll` 释放（`CacheManager.ts:31`）→ 长会话内存持续增长 |

## 六、安全 / 边界

| 编号 | 说明 |
| --- | --- |
| F1 | `IframeRenderer.ts:19` 的 `sandbox="allow-scripts allow-same-origin"`：该组合下同源 iframe 可访问 `parent.document` 与宿主 API。代码注释声明为「用户自有同源媒体的已接受信任边界」，但 `saveMedia` 的 `source:'url'` 路径会把**外部 URL 的 HTML** 落进同源 `backgrounds/` 目录 → **注释的表述与事实不完全相符**，需修正表述（或收紧 sandbox，但会牺牲 HTML 背景功能，需用户裁定） |
| **F2（已核验为非问题，降级为防御性候选）** | ST 的扩展启用/停用/更新一律走 `location.reload()`（`extensions.js:479/496/1325`），**不存在**「扩展被原地重载导致监听器翻倍」的路径。扩展自身无 teardown 汇总仍是不足，但在支持原地热重载的宿主分支（Luker/TauriTavern）或未来引入热重载时才会显现 → **不按 P0/P1 处理** |

## 七、子任务 3 的既有结论复核

- **已确认可用接缝**（`probe-native-panel.mjs` 实测）：原生网格 `#bg_menu_content` 存在且已被宿主填充（27 个 `.bg_example[bgfile]`）。
- **`NativeBgAugmenter` 会在宿主渲染后正确补标**：`augmentedAnchors: 27`，说明 MutationObserver 重施逻辑工作正常，子任务 3 的选中态重施可复用同一机制。
- **`/api/backgrounds/all` 只返回图片**（27 项，非图片 0），响应字段 `images`/`config`，**已实测确认**。
- 因此子任务 3 的 T2 是唯一有实质效果的层级（T1 近乎空操作）；T3（把扩展非图片媒体注入原生网格）的动机被加强（扩展自有 19 个非图片条目在原生网格中完全不可见），但其成本/风险不变，用户已裁定不做。

---

## 十二、重做后的运行期验收结果（2026-09-26，Dev Luker :8003）

> 前置：实例上本扩展曾被停用（`disabledExtensions`），经用户授权从实例
> `data/default-user/settings.json` 移除该条目并重启后恢复加载。停用的事实与证据见
> `probe-ext-state.mjs` / `probe-ext-state2.mjs`。

| 套件 / 探针 | 结果 |
| --- | --- |
| `npm run test:e2e` | **24/24 通过** |
| `node tests/stress.mjs` | **4/4 通过** |
| `node tests/authority.mjs` | **18/18 通过**（真后端；含修好的 S4.1 与 S7.3） |
| A1–A5 专项探针 `probe-verify-fixes.mjs` | **18/18 通过** |
| 子任务 1 折叠回归 `probe-fold.mjs` | **全通过**（未打坏上一轮成果） |
| `npm run type-check` + `npm run build` | 双绿 |
| 裸选择器 / `box-shadow` 声明 | 0 / 0 |

### A1–A5 逐条结论

- **A1（7 项）**：`PublicAPI.setBackgroundVisible(false)` 隐藏容器、面板勾选框同步、
  API 回报一致、随后切背景**保持隐藏**（受控状态不丢）、`true` 恢复可见；
  **隐藏态跨全新页面加载保持**（经服务端设置文档往返，新页面 localStorage 为空故
  只能来自文档）；勾选框在重载后正确回显。**持久化已实测生效。**
- **A2（3 项）**：瞬时背景不产生 `custom_*` 虚拟 id（运行态与 localStorage 均保持原值）；
  背景仍正常挂载渲染。
- **A3（3 项）**：临时上传 SVG 使其进入原生网格 → 点击它：**宿主不再改写 `#bg1` 的
  `background-image`**（双写消除），扩展自身背景正常切换；临时文件已删除。
- **A4（2 项）**：**10/10 次**全新加载栅格均有内容（修复前实测 3 次中 2 次为空）；
  刻意逆序（第 2 次 `listMedia` 延迟 900ms）下同样有内容。
- **A5（3 项）**：植入陈旧 KV 标记（`volume=0.11`、KV revision 76，服务端文档
  `0.33`/revision 365）→ 全新加载后**服务端文档胜出（0.33）**，陈旧值未复活；
  KV 已复原为服务端文档内容。

### 验收探针的两处自身缺陷（已修，非产品问题）

1. **A1 原本用 Alt+B 驱动** —— 该快捷键已随 K1 移除，探针随之失效。已改为
   `PublicAPI.setBackgroundVisible` + 面板勾选框，并补上持久化断言。
2. **同页再导航会挂起** —— 探针在改动状态后用 `page.goto`/`reload` 重载同一页面时
   导航超时（SillyTavern 注册了 `beforeunload`，自动化下会拦住）。已改为**开新页面**
   验证，这同时是更严格的持久化证明（新页面无旧 localStorage）。

### 两处测试素材修复（因批准的行为变更而适配，断言一字未动）

- `tests/e2e.mjs` Test 14 与 `tests/authority.mjs` S4.1 原以宿主自身的
  `/favicon.ico` 作测试素材；S4 批准把 `favicon.ico` 排除出媒体库后，该素材必然找不到。
  改为**自包含 blob URL** 并让用例**自清理**（此前每次运行都会往服务端库塞一个
  `favicon.ico` 副本——这正是 M1 垃圾卡片的来源）。

### 仍未处理（留待后续）

- `tests/authority.mjs` 的 `openPageWithClearedLocalSettings` 的 `window.top === window`
  修复已在位（事故中存活回填）。
- `wiki/` 仍宣传已移除的 Alt 快捷键，`Public-API-Reference.md` 缺 3 个新条目
  （`setBackgroundVisible` / `isBackgroundVisible` / `background-visibility-change`）
  → 归子任务 4。

---

## 十三、`trellis-check` 复核提出的残留项与处置

> 本节在事故中丢失后重述。复核结论：**无 P0**；无越界、无契约破坏、无确定性缺陷。

### 已在重做中随项解决

| 编号 | 内容 | 处置 |
| --- | --- | --- |
| RES-1 | A4 同栅格并发残留：较旧快照可能后落地覆盖较新内容（表现为「新导入卡片暂时不显示」，自愈） | ✅ **由 S1 解决**——刷新票据存 `grid.dataset.refreshSeq`，await 前预约、await 后相等判定 |
| RES-2 | 配额滑块不即时生效（要等下次上传才清理） | ✅ **由 S2 解决**——`enforceQuotaIfChanged()`，门控 `lruAutoClean`，仅配额真变时触发 |
| RES-3 | F3 的 BGM 残留风险：正在播放的音乐，其 objectURL 可能被上传触发的 cleanLRU revoke | ✅ **实测结案：不成立，不加固**（详下） |
| 复核订正 1 | `CacheManager.evictCacheEntry` 注释「挂载项是最后候选」的论据不成立 | ✅ 已如实改写（LRU 不保证 + 写明真实残留窗口） |
| 复核订正 2 | `host-native-ui.md` 门禁命令会被说明性注释假红 | ✅ 已改为 `grep -c 'box-shadow:'` |
| 复核订正 3 | `state-management.md` 未同步 `chatBindings` 移除与 A5 优先级 | ✅ 已同步（另加「Runtime-only state」小节） |

### RES-3 的实测结案（`probe-s3-evict-during-playback.mjs`，25/25 通过）

淘汰**确实发生**（objectURL 实测 `REVOKED`、索引条目清零），但媒体元素**全部存活**：

| 场景 | 观测 |
| --- | --- |
| BGM 已缓冲 + `cleanLRU(1)` | currentTime 正常推进、`paused=false`、`error=null` |
| BGM 已缓冲 + `clearAll()` | 同上 |
| BGM **曲中**（blob 源在播）+ `cleanLRU(1)` | currentTime 推进、淘汰瞬间 `readyState=4` |
| 已挂载 image 背景 + `cleanLRU(1)` | `complete=true`、`naturalWidth=64`、图层 opacity=1 |
| 已挂载 svg(iframe) 背景 + `clearAll()` | iframe 文档仍在；冷缓存重挂返回服务端直连 |

**结构性理由**：缓存命中路径是「CacheStorage 取 Blob → `createObjectURL`」，objectURL 指向
**已在内存的 Blob**，revoke 不中断已开始的资源加载；未命中路径元素直接用服务端相对 URL，
**根本没有 objectURL 可 revoke**。「网络流被 revoke 掐断」这一时序不可达。
附带：淘汰若抢在 URL 解析前落地（上传路径真实时序），`getMediaBlobUrl` 会**自愈**回服务端直连。

### 仍未处理（记录在案）

| 编号 | 内容 | 归属 |
| --- | --- | --- |
| RES-4 | `ServerOrigin.invalidateCatalog()` 目前无外部调用者（为子任务 3 预留）。若子任务 3 不落地它即为新死代码 | 子任务 3 决断 |
| RES-5 | `listCatalog()` 返回浅拷贝（只复制数组、共享 `MediaItem`）；当前调用方只读 | 仅记录 |
| RES-6 | A3 的 `stopPropagation()` 会拦掉**所有** document 冒泡阶段 click，不只宿主的 `onSelectBackgroundClick`。现实影响很小（仅 `.svg` 受影响） | Dev 冒烟 + 子任务 3 |
| RES-7 | F2 的内存镜像与 IDB 为**最终一致、非强一致**（两处有界小窗口，下次 reload 自愈） | 仅记录，不再投入 |

---

## 十四、其他新发现（复核阶段报出，记录在案）

| 编号 | 内容 | 处置 |
| --- | --- | --- |
| D4 | 天气词汇**第 4 处**真源：`AgentBridge.ts` 的工具描述与 JSON-schema `enum` | ✅ 已收敛（引用 `WEATHER_TYPES`）；**第 5 处**（设置面板 `<option>`）也已收敛为派生（`WEATHER_LABELS` + `Record<WeatherType,string>`，漏标签即编译错误） |
| E4 | `--noUnusedLocals` 下暴露 4 处**既有**未用声明（`index.ts`/`SettingsDrawer` 的 `MediaType` 导入、`forEach` 的 `filters`、`AudioVisualizer` 的 `VisualizerMode`）。**HEAD 即存在，非本轮引入**；`tsconfig` 未开该选项故 `type-check` 不报 | 仅记录（不扩大删除面） |
| M1 | manifest 把宿主自身 `favicon.ico` 登记为媒体条目 → 媒体库出现垃圾卡片 | ✅ **根因查明即测试素材**：`tests/e2e.mjs` Test 14 与 `authority.mjs` S4.1 都以 `/favicon.ico` 作预载素材，每次运行都往服务端库塞一份。双管齐下：S4 读侧过滤 + 两处素材改自包含 blob URL 并自清理 |
| M2 | manifest 中早期条目的 `source` 值为 `'local'`，越出 `MediaSource = 'url' \| 'server'` | 仅记录（老版本遗留，当前代码不再写入该值） |
| M3 | 媒体库存在指向已失效外部 URL 的条目（实测 `files.catbox.moe/...` 404） | 仅记录（属用户数据） |
| — | 设置面板「保存场景」按钮另有一套内联实现，未复用 `PublicAPI.saveCurrentScene` | 未获批准，未动 |
| — | `PublicAPI.setBackgroundVisible` 未接入 `buildAgentHost`，AI 导演模式暂无法开关背景 | 下一轮小增量 |

---

## 十五、Phase G 收尾验证（2026-09-26）

三套件在**当前 HEAD** 重跑（`TEST_TARGET_URL=https://127.0.0.1:8003`）：**e2e 24/24 · stress 4/4 ·
authority 18/18**（真后端）。本轮收尾改动只有注释与 spec 文本，仍重跑，以保持「提交前必测」的纪律。

### G2 性能量化（`research/probe-perf-e1-e2.mjs`，只读探针，不写实例）

| 发现 | 指标 | 改前基线 | 改后实测 | 结论 |
| --- | --- | --- | --- | --- |
| E1 | TTL 窗口内 **20 次**目录调用（`listMedia` ×15 + `getMedia` ×5）触发的 `/api/backgrounds/all` 请求数 | 20（每次调用一次 POST） | **0**（3ms 窗口内跑完） | TTL 合并生效 |
| E1 | TTL 过期后 **1 次**调用的请求数 | — | **1** | 是**短时缓存**而非永久缓存，列表变更仍可见 |
| E2 | **12 次** `getMediaBlobUrl` 热路径调用的全量 IDB 读（`getAll`/`getAllKeys`） | 12 | **0** | 内存镜像生效 |

**E2-2 记 SKIP（诚实缺口）**：探针**无法在零写入前提下**取得「touch 仍写回 lastUsed」的运行期证据——
该路径要求被测条目已在浏览器 CacheStorage 中，而当前 CacheStorage 为空；探针**拒绝**用 `preloadUrl`
预热，因为那会 `origin.putMedia()` 往实例媒体库写入条目（`src/cache/CacheManager.ts:187`），
正是 M1「媒体库垃圾卡片」的来源。替代证据为**源级**：`src/cache/CacheManager.ts:226-233` 的
`touchCache()` 为 `if (entry) { entry.lastUsed = Date.now(); await this.indexPut(entry); }`
—— 存量条目仍写回单条 `lastUsed`，只不再读全量。**不影响 E2 结论**：省读来自内存镜像，不是靠不写。

### G6 Dev 冒烟（`research/probe-smoke-g6.mjs`，**16/16 通过**，全程真实点击 DOM）

| 场景 | 实测 |
| --- | --- |
| 抽屉开合（子任务 1 折叠修复回归） | 计算 `display`：`none → block → none` |
| 点网格卡片切背景 | `activeMediaId` 变更；容器内挂载 1 个媒体元素 |
| 背景可见性勾选框 | 勾掉 → `display:none` 且 `PublicAPI.isBackgroundVisible()=false`；勾回即恢复 |
| 迷你播放器 | 取消勾选 → capsule 不可见；勾选 → 可见 |
| pulse 视觉化 + 视差同开 | 两者均生效，背景仍挂载（`canvas=0` 属正常：pulse 走 CSS transform 而非 canvas） |
| 收尾复原 | `activeMediaId` / 可见性 / 视觉化+视差 三项断言全过（复原后留 1800ms 等防抖写盘落盘） |

**页面上另有 3 个非本扩展的 page error**：`Unexpected reserved word`、`$(...) is not a function`
（来源 `https://127.0.0.1:8003/a0ce1ded-…`，即宿主自身脚本）、`Identifier 'SPresetSettings' has
already been declared`（第三方扩展的预设脚本）。另有 14 条 console error（含 404 资源）。
**来源均非 `dist/index.js`** → 判据收紧为「无源自本扩展的 page error / console error」，
并把外来错误原样打印供对照，而不是要求整页零错误（那在装满扩展的真实酒馆上不可能成立）。

### 探针自身踩到的坑（教训，已固化到 spec）

1. **会改状态的探针必须自己负责复原，且要等写入真正落盘（含服务端文档）再关页面。**
   G6 探针首次运行在 S5 抛错 → 复原段没执行；设置写入是防抖 + 异步推服务端文档，而**启动以
   服务端文档为准**（见 A5），页面关闭时最后一次写入未必已到达那里 → Dev 实例
   `backgroundVisible` 停在 `false`。**更隐蔽的是下一次运行**：它把 `false` 读作「初始值」并
   "忠实"复原，把残留固化了下来。已用 `research/probe-cleanup-g6residue.mjs` 设回 `true` 并读回确认。
2. **判据要跟着实现语义走，别跟着直觉走。** 本轮三处初期误判都源于判据写错而非产品缺陷：
   折叠态要读**计算样式**（初始态由宿主样式表决定，inline `style.display` 是空的）；
   迷你播放器的 `hide()` **只换类名、不移除 DOM**，故不能用「元素是否存在」判可见性；
   可见性勾选框的初始值取决于**持久化设置**，断言必须写成方向性（相对 `wasChecked`）而非绝对。
3. **page error 必须带来源**。宿主页面同时加载多个第三方扩展，裸消息无法区分归属（`SPresetSettings`
   这种显然是别人的），不记来源就会把别人的错误算到自己头上。

### 收尾期一致性订正（2 处，均与提交 `1ee8e2a` 的持久化改造同源）

背景可见性改为 `settings.backgroundVisible` 持久化之后，两处表述仍停留在旧形态，都会诱导后来者
**重新引入 A1 的裸 `display` 写法**：

- `src/ui/SettingsDrawer.ts`：`getBackgroundVisible` 的 JSDoc 与 `render()` 内注释仍写
  「visibility is controlled runtime state」「MediaMount owns the state, not settings」→ 已订正为
  「读 `settings.backgroundVisible`，面板只做镜像」。
- `.trellis/spec/frontend/state-management.md`：背景可见性仍被列在「Runtime-only state（不持久化）」
  表格里 → 已移出该表，改为「单一真源」小节里的一条（并保留 A1 的历史教训）。
