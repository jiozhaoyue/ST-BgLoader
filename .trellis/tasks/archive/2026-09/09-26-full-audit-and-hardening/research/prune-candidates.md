# 功能裁剪候选清单

> ## ⚠️ 本轮不执行任何删除
>
> 本清单**只产出、不执行**。用户 2026-09-26 明确裁定：裁剪尺度由用户逐项拍板。
> 在获得逐项批准前，本任务（及任何子任务）**不得删除下列任何一项**。
> 批准后应另立清单执行，且删除动作单独提交，与健壮性修复分离，便于单独回滚。

---

## 口径说明

| 列 | 含义 |
| --- | --- |
| 编号 | 与 `findings.md` 对应 |
| 建议 | `砍掉` / `接线`（补入口使其可用）/ `合并` / `保留` |
| 成本 | S（<30 行） / M（需动 2+ 文件或需设计） / L（需设计 + 迁移） |
| 数据影响 | 是否影响既有用户的已存数据 |

**一条硬约束**：`PublicAPI` 的对外方法即使仓内无任何调用者，也**只列入「保留」**——它们是 `wiki/Public-API-Reference.md` 已文档化的对外契约，第三方脚本与角色卡可能依赖。

---

## 第一组：死字段（建议砍掉）

字段存在、有默认值、**全仓无人读取**。唯一的实际作用是让设置对象变大、让 `mergeSettings` 多合并一层键。

| 编号 | 字段 | 建议 | 理由 | 影响面 | 成本 | 数据影响 |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | `enabled` | **砍掉** | 无任何读取点；语义上「扩展总开关」由宿主自身的扩展启停承担 | `types/index.ts`（类型 + 默认值） | S | 无（用户设置里该键的值无处生效） |
| B2 | `muffleOnDrawer` | **砍掉** | 无任何引用；`muffleBGM` 才是实际生效的隔音开关 | `types/index.ts` | S | 无 |
| B3 | `playlist: string[]` | **砍掉** | 无读写。注意：`AudioEngine.playlist` 是 `MediaItem[]`，**同名不同物**——这个类型字段纯属历史残留，易误导 | `types/index.ts` | S | 无（真正在用的播放列表由 `AudioEngine` 自行维护，不来自设置） |

**你的选择**：每项 `砍掉` / `保留`。

---

## 第二组：半接线（需二选一：接线 或 砍掉）

| 编号 | 项 | 现状 | 可选方案 | 我的倾向 | 影响面 | 成本 | 数据影响 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B4 | `chatBindings`（按聊天绑定背景） | `index.ts:482-490` 有完整的**读取逻辑**（CHAT_CHANGED 时按 chatId 切背景），但**全仓无写入点**——没有 UI、没有 API，这个分支永远不可达 | ① **接线**：加一个「绑定当前聊天」按钮 + PublicAPI 方法；② **砍掉**：删除字段与那段不可达逻辑 | **② 砍掉**。理由：一个「看起来支持、实际无从触发」的特性，比没有更糟——它会误导使用者以为存在该能力；若将来真要做，再接也不迟 | ① 需动 `SettingsDrawer`（UI）+ `index.ts` + `PublicAPI` + wiki；② 仅 `index.ts` 删一段 + `types` 删字段 | ① M；② S | ① 无；② 无（既无写入点，用户数据里不会有该键的实际内容） |
| B5 | `cacheQuotaMB` / `lruAutoClean` | **功能是活的**（`index.ts:293-294` 读并驱动 `cleanLRU`），但**设置面板没有对应控件** → 永远停在默认值（1024 MB / 自动清理开） | ① **接线**：加配额滑块 + 自动清理勾选框；② **砍掉并硬编码**：删字段，把 1024MB/true 写死在调用处 | **① 接线**。理由：功能本身有价值（用户可能想调大配额或关掉自动清理），只是缺入口；② 会永久失去可配置性，是「为了少 20 行代码而删掉一个真功能」 | ① `SettingsDrawer`（2 个控件）+ 回调接线；② `index.ts` + `types` | ① M；② S | 无 |

**你的选择**：B4 选 ① 还是 ②；B5 选 ① 还是 ②。

---

## 第三组：死代码（建议砍掉）

定义完整、无任何调用者。

| 编号 | 位置 | 内容 | 理由 | 成本 | 删除风险 |
| --- | --- | --- | --- | --- | --- |
| C1 | `CacheManager.ts:110` / `ServerOrigin.ts:240` | `touchMedia` ×2（空实现） | 两者都是空方法（注释自陈「LRU 是浏览器缓存的事」），无调用者。留着会让读者以为 LRU 有服务端侧触点 | S | 极低 |
| C2 | `SceneManager.ts:12` | `setApplyCallback` | 回调已由构造函数注入，此 setter 从未被调用 | S | 极低 |
| C3 | `AudioEngine.ts:74` | `isWaitingForUnmute` | 无调用者（内部字段 `isWaitingForInteractionUnmute` 另有用处，保留） | S | 极低 |
| C4 | `AudioEngine.ts:125` | `getAnalyserNode` | 无调用者；分析器经 `onAnalyserReady` 回调下发 | S | 极低 |
| C5 | `IframeRenderer.ts:59` | `postMessage` | 无调用者（没有任何代码向沙箱 iframe 发消息） | S | 极低（但见下方「注意」） |
| C6 | `MediaMount.ts:145-147, 183-185` | `syncFitting()` 空实现 + 为它存在的 `#bg1` class observer | 观察者每次 `#bg1` 类变化都被唤醒，却调用一个空函数——**每次缩放/fitting 切换都白跑一轮** | S | 低（`getFitting()` 是另一回事，保留） |
| C7 | `AudioVisualizer.ts:140` | pulse 分支的 `const brightness = ...` | 计算后从未使用（疑似漏写 `filter` 赋值，但按当前设计 pulse 只写 transform，故应是纯残留） | S | 极低 |

**注意（C5）**：`IframeRenderer.postMessage` 是**类实例方法**，虽无内部调用者，但若第三方通过某种途径拿到 renderer 实例可能用到。概率极低（renderer 未对外暴露），但请注意这不是 `PublicAPI` 契约的一部分，所以列在可砍组。

**你的选择**：整组一起砍 / 逐项挑 / 全部保留。

---

## 第四组：C8 — `NativeBgAugmenter` 的独立存在价值（建议：**并入子任务 3，不作为独立组件保留**）

| 项 | 说明 |
| --- | --- |
| 现状 | **实测**：原生 `/api/backgrounds/all` 返回 27 项、**非图片 0 项**；而该组件只对 `detectMediaType !== 'image'` 的项打徽章 + 挂点击监听。所以它当前**只对 `.svg` 生效**（`detectMediaType('.svg') === 'svg'`），本次实测恰有 3 个 `.svg` 命中 |
| 含义 | 面向 `MediaType` 中 video/audio/html 的「非图片徽章」功能面对**现实为零**——原生网格根本不列这些文件 |
| 建议 | **不要作为独立组件保留**。它要么（a）被列入「待子任务 3 接管后由 `NativeBackgroundController` 完全取代并删除」，要么（b）若子任务 3 最终不做，则它连同其点击监听应作为死代码砍掉（因为它同时是 A3 双写缺陷的来源） |
| 成本 | 取决于子任务 3 的结论；作为独立删除动作为 S |
| 数据影响 | 无 |
| **重要** | 这一项**不宜单独决策**，应等子任务 3 落地后一并裁定。建议你现在只需确认「同意它的处置权归子任务 3」 |

---

## 第五组：一致性 / 重复（建议合并或补齐，非删除）

| 编号 | 项 | 建议 | 理由 | 成本 | 数据影响 |
| --- | --- | --- | --- | --- | --- |
| D1 | 天气类型三处真源（`types` 联合类型 / `PublicAPI.WEATHER_TYPES` / `cycleWeather` 字面量） | **合并**为单一真源 | 三处已存在漂移风险；新增天气类型时必须记得改三处 | S | 无 |
| D2 | 原生徽章无按类型配色（媒体库徽章有） | **补齐**或**统一去掉类型色**（二选一） | 现状会让原生徽章各类型外观完全相同，与媒体库徽章的行为不一致 | S | 无 |
| D3 | `playMediaItem` / `playCurrentTrack` 逻辑重复 | **合并** | 两段近乎逐行相同；行为目前一致，但将来改一处忘另一处即出 bug | M | 无 |

**你的选择**：D1/D2/D3 是否做；D2 选「补齐配色」还是「统一无色」。

---

## 第六组：PublicAPI 保留项（**仅供知悉，不建议动**）

以下方法在仓内无内部调用者，但**都是 `wiki/Public-API-Reference.md` 已文档化的对外契约**，第三方脚本与角色卡可能依赖：

`setBackground` · `clearBackground` · `playBGM` · `stopBGM` · `togglePlay` · `nextTrack` / `prevTrack` · `setVolume` · `setMuted` · `setMuffled` / `getMuffled` · `setFilters` · `applyPreset` · `setInteractive` · `setWeather` / `getWeather` · `setVisualizer` / `getVisualizer` · `setParallax` · `setTransition` · `addTriggerRule` / `removeTriggerRule` / `getTriggerRules` · `setAmbientSound` / `getAmbientSound` · `setFrostedChat` / `getFrostedChat` · `applyScene` · `saveCurrentScene` · `getScenes` · `deleteScene` · `cycleWeather` · `getPlaybackState` · `getMediaList` · `preloadMedia` · `on` / `off` / `emit`

**建议：全部保留。** 其中 `saveCurrentScene` 与 `preloadMedia` 在仓内确实无人调用（设置面板的「保存场景」按钮另有一套内联实现），但这属于「对外 API 未被内部复用」，不是死代码。

**可选的清理（非删除）**：让设置面板的「保存场景」按钮改调 `PublicAPI.saveCurrentScene`，消除那份内联重复实现——这样对外 API 与内部实现合一。成本 S。

---

## 汇总：需要你拍板的条目

| # | 决策点 | 选项 |
| --- | --- | --- |
| 1 | B1 `enabled` 字段 | 砍掉 / 保留 |
| 2 | B2 `muffleOnDrawer` 字段 | 砍掉 / 保留 |
| 3 | B3 `playlist` 设置字段 | 砍掉 / 保留 |
| 4 | B4 `chatBindings` | ① 接线补 UI / ② 砍掉 |
| 5 | B5 `cacheQuotaMB` + `lruAutoClean` | ① 接线补控件 / ② 砍字段硬编码 |
| 6 | C1–C7 死代码 | 整组砍 / 逐项挑 / 全保留 |
| 7 | C8 `NativeBgAugmenter` | 同意「处置权归子任务 3」/ 现在单独决策 |
| 8 | D1 天气类型三真源合并 | 做 / 不做 |
| 9 | D2 原生徽章配色 | 补齐配色 / 统一无色 / 不做 |
| 10 | D3 播放逻辑去重 | 做 / 不做 |
| 11 | 设置面板「保存场景」改调 `PublicAPI.saveCurrentScene` | 做 / 不做 |

**未获批准的条目，本轮与后续子任务都不会动。**
