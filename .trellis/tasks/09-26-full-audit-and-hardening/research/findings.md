# 体检发现（子任务 2）

> 判定标准见父任务 `design.md` §5：P0 数据丢失/功能失效/异常中断 · P1 竞态/泄漏/无界增长/状态错乱 · P2 主路径性能热点/外部输入未校验/静默错误 · P3 可读性/重复代码/死代码 · P4 纯外观。
>
> 每条标注**证据类型**：`实测` = 在 Dev 实例（Luker :8003）上运行探针取得；`交叉引用` = 全仓符号检索确认；`代码阅读` = 逐行确认。
> 探针脚本与输出见本目录 `probe-*.mjs` / `probe-*-output.txt`。

---

## 一、确认的用户可见缺陷

### A1 — Alt+B 隐藏背景后，新选中的背景永不显示（P1 · 实测）

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
| C1 | `CacheManager.ts:110` / `ServerOrigin.ts:240` | `touchMedia` 两处均空实现，无调用者 |
| C2 | `SceneManager.ts:12` | `setApplyCallback` 无调用者（回调经构造函数传入） |
| C3 | `AudioEngine.ts:74` | `isWaitingForUnmute` 无调用者 |
| C4 | `AudioEngine.ts:125` | `getAnalyserNode` 无调用者（分析器经 `onAnalyserReady` 下发） |
| C5 | `IframeRenderer.ts:59` | `postMessage` 无调用者 |
| C6 | `MediaMount.ts:145-147,183-185` | `syncFitting()` 空实现；为它存在的 `#bg1` class observer 每次类变化唤醒却什么也不做 |
| C7 | `AudioVisualizer.ts:140` | pulse 分支 `const brightness = 100 + pump * 25` 计算后从未使用 |
| **C8** | `NativeBgAugmenter.ts:41-52` | **实测**：当前宿主上仅对 `.svg` 生效（原生网格 27 项全为图片扩展名，其中 3 个 `.svg` 被判为 `'svg'` 类型）。即该组件的「非图片徽章 + 点击接管」功能面对 `MediaType` 中的 video/audio/html 实际为空——因为原生网格不列这些文件。**其价值集中在子任务 3 的接管上，独占存在意义薄弱。** |

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
