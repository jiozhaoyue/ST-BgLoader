# 裁定与接缝复核记录 — 接管 ST 原生背景选择器

> 本文件是执行期的**裁定留痕**。规划期的三份裁定在任务 `prd.md` 的「用户裁定」表中，此处只记
> 执行期新增的裁定与规划文档的订正项。

## 一、执行期新增裁定（2026-09-26）

### D-1 聊天锁定背景 → 锁定期间放行给原生

**触发**：执行前的接缝复核发现规划期遗漏了 `onSelectBackgroundClick` 的**第三条分支**（详见 §二.3）。
「方案 α 接管一律优先」的字面执行会让原生面板的「锁定背景给当前聊天」功能**静默失效**。

**候选与代价**（三选一，已向用户列出）：

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| **✔ 采用** 锁定态放行 | 检测到当前聊天有锁定背景 → 该聊天内不接管：点击放行给原生，叠层清理器同样豁免（不清 `#bg1`） | 锁定期间该背景走原生路径，扩展的滤镜/天气/视差不作用于它；扩展媒体库与面板照常可用 |
| 严格方案 α | 无视锁定，一律路由进扩展管线 | 用户在原生面板的锁定操作在接管期间完全无效，且 `#bg1` 还会被清理器清掉 |
| 映射为扩展 per-chat 背景 | 扩展侧新建 per-chat 背景概念 | 成本 L，超出本子任务范围（子任务 2 刚把无写入方的 `chatBindings` 当死代码删除，等于重新设计） |

**用户裁定**：**锁定态放行给原生**。

**落地影响**：
- `shouldTakeOver()` 新增第 5 条放行规则：当前聊天存在锁定背景 → `return false`。
- 叠层清理器（`#bg1` 的 `style` 观察者）新增豁免条件：同一判定为真时**不清**——否则会出现
  「接管放行 → 原生写 `#bg1` → 扩展立刻清掉」的互斥抖动。
- 锁定态的**检测接缝**：`SillyTavern.getContext().chatMetadata['custom_background']`（见 §二.4）。
  非空即视为「当前聊天已锁定背景」。
- 与方案 α 的关系：α 仍然成立——接管**默认**以扩展状态为准；锁定是一个**显式的、用户主动施加的**
  例外信号，尊重它不违反 α（α 的退出手段仍是接管开关，锁定只是就地让路）。

### D-2 执行方式：主会话实施，不派子代理

**用户裁定**：不用子代理，由主会话直接实施并自验。
**理由**：执行者对模块上下文与全部接缝证据已有完整掌握，派子代理需重建上下文而无并发收益
（本子任务是一处内聚改动，无可并行的独立工作面），符合 L0-8「无净时间收益就不开」。

---

## 二、接缝复核：宿主已漂移，但接缝全部存活（2026-09-26 实测）

### 1. 宿主版本

| 项 | 规划期 | 执行期实测 | 结论 |
| --- | --- | --- | --- |
| 实例 | — | `D:\Repo\Tavern-repo\Instance\Dev\Luker` | — |
| 宿主版本 | — | `v2.7.0-605-ge1dbd1904`（commit `e1dbd1904a1e49465feb7da38115def7fdac2192`，2026-09-24） | — |
| `public/scripts/backgrounds.js` | **1865 行** | **2039 行** | ⚠️ **行号已全部失配** |
| `events.js` 的 `FORCE_SET_BACKGROUND` | 存在 | `:67` = `'force_set_background'` | ✅ 存活 |

**影响**：`prd.md` 与 `design.md` 中的 `backgrounds.js:NNNN` 引用**不可再按原行号核对**。
本文件 §二.2 重新给定**当前版本**的行号；凡后续再引用，一律以本节为准。

### 2. 方案依赖的接缝逐条复核（当前 2039 行版本）

| 接缝 | 现状 | 当前行号 | 规划期行号 |
| --- | --- | --- | --- |
| `.bg_example` 点击委托（**document 冒泡阶段**） | ✅ `$(document).off('click','.bg_example').on('click','.bg_example', onSelectBackgroundClick)` | `:1884` | 1733 |
| `onSelectBackgroundClick` 定义 | ✅ | `:421` | — |
| `#bg_menu_content` | ✅ | `:715`、`:1040`、`:1789` | 661 区 |
| `#bg_custom_content` | ✅ | `:742`、`:1789` | — |
| `#bg1` 写入点 | ✅ `onChatChanged :310`、`onLockBackgroundClick :380`、`forceSetBackground :288`、`onSelectBackgroundClick` 锁定分支 | — | 249/266/383 |
| 多选分组模式信号 | ✅ `$('#Backgrounds').toggleClass('bg-selection-mode', isBackgroundSelectionMode)` | `:1033` | 924 |
| `.jg-button` 委托（lock/edit/delete/copy/folder/set-cover） | ✅ 且其处理器自己 `e.stopPropagation()` | `:1901` | 1773 起 |
| `.bg_folder_tile` 委托（非 `bg_new_folder_tile`） | ✅ 且**宿主自己**就用了 `if ($(e.target).closest('.jg-button').length) return;` 的放行写法 | `:1849`、`:1851` | 1701 起 |
| `.bg_example .mobile-only-menu-toggle` | ✅ 委托 + `e.stopPropagation()` | `:1885` | 1734 |
| `.bg_folder_tile .mobile-only-menu-toggle` | ✅ 委托 + `e.stopPropagation()` | `:1871` | — |
| `.bg_example[custom="true"]` | ✅ 选择处理器内判定 | `:423` | 371 |
| `highlightSelectedBackground()` | ✅ 清 `.selected-background` 后按 **`data('url')`** 匹配 `background_settings.url` 重算 | `:1773` | 1641 |
| `highlightLockedBackground()` | ✅ 清 `.locked-background` 后按 chat 元数据重算 | `:355` | — |
| `renderSystemBackgrounds()` | ✅ `$('#bg_menu_content').empty()` 后整块重建 | `:715` 区 | 661 |
| `isBackgroundSelectionMode` 判定 | ✅ | `:423`、`:1903` | — |
| `#Backgrounds` 多选类 | ✅ | `:1033` | — |

**结论**：接缝全部存活，方案（T2 + 捕获阶段拦截）**无需改设计**；需要改的只有**行号引用**与 D-1 的放行规则。

### 3. ⚠️ 规划期遗漏：`onSelectBackgroundClick` 实为**三分支**

`backgrounds.js:421-441` 当前实现：

```js
function onSelectBackgroundClick(e) {
    const bgFile = $(this).attr('bgfile');
    const isCustom = $(this).attr('custom') === 'true';
    if (isBackgroundSelectionMode && !isCustom) {          // 分支 1：多选分组
        toggleBackgroundGroupSelection(bgFile);
        return;
    }

    const backgroundCssUrl = getUrlParameter(this);
    const bypassGlobalLock = !isCustom && e.shiftKey;

    if ((isChatBackgroundLocked() || isCustom) && !bypassGlobalLock) {
        // 分支 2：聊天锁定背景 或 聊天专属背景 —— 写 chat 元数据 + 直写 #bg1，不动全局
        saveBackgroundMetadata(backgroundCssUrl);
        $('#bg1').css('background-image', backgroundCssUrl);
    } else {
        // 分支 3：全局背景
        setBackground(bgFile, backgroundCssUrl);
    }

    highlightLockedBackground();
    highlightSelectedBackground();
}
```

规划文档只识别了分支 1 与分支 3，**漏了分支 2 的锁定语义**（`custom` 那一半已被放行规则覆盖，
锁定那一半没有）。D-1 即为此补的放行规则。

补充证据：
- `isChatBackgroundLocked()` = `chat_metadata['custom_background']`（`:403`，键值定义 `:14`）
- 锁定写入口 `saveBackgroundMetadata(file)` = 写 `chat_metadata[BG_METADATA_KEY]` + `saveMetadataDebounced()`（`:407-410`）
- `e.shiftKey` 可绕过锁定（`bypassGlobalLock`）——**放行后可原生行为自然生效，无需扩展处理**

### 4. ⚠️ 订正 PRD 的一处结论：`chatMetadata` **是**公开暴露的

`prd.md` 的接缝表写「`getContext()`（`st-context.js:115`）**不暴露**任何 backgrounds 相关内容」，
并据此把 `background_settings` 与 chat 元数据一并归为「不可访问」。

**实测订正**：`public/scripts/st-context.js:2477` 的 `getContext()` 返回对象内含

```js
get chatMetadata() { return chat_metadata; },
set chatMetadata(value) { updateChatMetadata(value, true); },
```

即 **chat 元数据可经公开 context API 读取**（`:2411` 是 `getContext` 定义）。PRD 的结论对
`background_settings`（模块私有、确实不可达）**仍然成立**，但对 chat 元数据**不成立**。

**落地影响**：D-1 的锁定态检测走 `getContext().chatMetadata['custom_background']`，
是**公开接缝**（context API），不是嗅探宿主私有实现，也不是 monkey-patch —— 不违反 PRD 的 Non-goals。

**键值稳定性论证**：`'custom_background'` 是**落盘在聊天文件里的元数据键**（`saveMetadataDebounced()` 会
持久化）。该键一旦变更就会让所有历史聊天的锁定背景失效，故宿主实际上**不可能**在不做迁移的前提下改它
—— 读它比读任何 DOM 类名都稳定。（`'chat_backgrounds'` 同理。）

**备选接缝（不采用，仅记录）**：`.bg_example.locked-background` 类由 `highlightLockedBackground()`
维护，同样是可观测信号。不用它的原因：它是**渲染结果**而非真值，只在若干时机被刷新；而
`chatMetadata` 是权威真值。两者在正常情况下一致，取权威者。

---

## 三、U-1 结案：`stop()` 能否不刷新页面恢复原生背景图

**结论：可以恢复，不需要刷新页面，因此不加 UI 文案。**

实现方式：`install()` 时把 `#bg1` 的内联 `background-image` 快照到 `savedNativeBgImage`，
`stop()` 时写回（值相同则跳过）。宿主自己的 loader（`setBackground` / `onChatChanged`）不可调用，
所以走快照回写。

**实测证据**（`research/probe-takeover-matrix.mjs` F 组）：接管期间 `#bg1` 为 `""`，
切到 `off` 后变回 `url("/backgrounds/__transparent.png")` —— 即接管开始时的值。同组还验证了
关闭后宿主重新接管点击（其 `.selected-background` 正常移动到被点的缩略图）。

**残留窗口（如实记录，不修）**：快照取自**接管开始时刻**，而接管期间宿主无法更新全局背景
（那些点击都被我们拦了），所以宿主的自我认知仍与快照一致 —— 唯一对不上的是**接管期间切换了聊天**：
宿主本想在 `CHAT_CHANGED` 时显示新聊天的锁定/默认背景，而我们回写的是旧快照。表现是关闭接管后
**短暂**显示旧背景，直到下一次原生动作（点缩略图或再切聊天）自愈。

不进一步处理的原因：要修就得在接管期间持续跟读宿主**想要**的值，而那个值在 `background_settings`
（不可达）与 chat 元数据之间，且宿主自己的写入已被我们拦掉 —— 为一个「关闭开关后短暂显示旧背景」
的窗口引入持续跟踪不值得。已在 `NativeBackgroundController.restoreNativeBackgroundImage()` 的注释里写明。

## 四、Phase A 基线（2026-09-26）

| 项 | 结果 |
| --- | --- |
| 前置：子任务 1 已归档 | ✅ `.trellis/tasks/archive/2026-09/09-26-native-style-and-fold-fix` |
| 前置：子任务 2 的 A3 最小修复已落地 | ✅ `src/ui/NativeBgAugmenter.ts:60-65`（含「将被本子任务取代」的注释） |
| `git status` | 干净 |
| `npm run type-check` | ✅ |
| `npm run build` | ✅ `dist/index.js` 177.36 kB、`dist/style.css` 7.41 kB |
