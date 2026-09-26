# ST 原生背景管线 — 源码证据留档

> 用途：子任务 3 `implement.md` Phase B1 要求的证据文件。**将来宿主升级时，用本文件逐条比对**，即可判断接管方案所依赖的接缝是否仍成立。
>
> 采集时间：2026-09-26
> 采集对象：**实际运行的宿主**，而非上游原版。
>
> ⚠️ **行号已按执行期实测版本校正（2026-09-26）**。初次采集时的 `backgrounds.js` 是 **1865 行**
> （上游/更早的检出），而实例上实际运行的已是 **2039 行** —— 两者行号**整体失配**。本文件现已改为
> 引用**实例上的 2039 行版本**；凡与 `prd.md` / `design.md` 中残留的旧行号冲突，**以本文件为准**
> （规划文档已加漂移注记指向此处）。

## 宿主身份

| 项 | 值 |
| --- | --- |
| 宿主 | **Luker**（SillyTavern 深度重写分支，luker.cups.moe） |
| 版本 | `v2.7.0-605-ge1dbd1904` |
| commit | `e1dbd1904a1e49465feb7da38115def7fdac2192`（2026-09-24） |
| 实例路径 | `D:\Repo\Tavern-repo\Instance\Dev\Luker` |
| 测试目标 URL | `https://127.0.0.1:8003` |
| `public/scripts/backgrounds.js` | **2039 行**（初次采集时 1865 行 —— 已漂移） |
| 另有关联实例 | `Instance\Dev\SillyTavern`、`Instance\Real\Luker`、`Instance\Real\SillyTavern` |

**注意**：规划期最初的分析基于上游 `SillyTavern/SillyTavern`。经核验，Luker 的 `inline-drawer` 机制与上游**逐字一致**（见下），因此结论对实际宿主成立。但**其余接缝仍需以 Luker 为准**——本文件的证据全部取自 Luker 本地检出。

---

## 1. 内联抽屉（`.inline-drawer`）

### 委托处理器 — `public/script.js:21422`

```js
$(document).on('click', '.inline-drawer-toggle', async function (e) {
    if ($(e.target).hasClass('text_pole')) {
        return;
    }
    const drawer = $(this).closest('.inline-drawer');
    const icon = drawer.find('>.inline-drawer-header .inline-drawer-icon');
    const drawerContent = drawer.find('>.inline-drawer-content');
    icon.toggleClass('down up');
    icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
    drawer.trigger('inline-drawer-toggle');
    drawerContent.stop().slideToggle({
        complete: function () {
            $(this).css('height', '');
        },
    });

    // Set the height of "autoSetHeight" textareas within the inline-drawer to their scroll height
    if (!CSS.supports('field-sizing', 'content')) {
        const textareas = drawerContent.find('textarea.autoSetHeight');
        for (const textarea of textareas) {
            await resetScrollHeight($(textarea));
        }
    }
});
```

与上游 `SillyTavern/SillyTavern` 的 `public/script.js:12193` **逐字一致**，唯一差异是 `complete` 回调由箭头函数写作 `function`，无行为差异。

**关键含义**：document 级委托 → 动态插入的抽屉自动被接管；扩展若自建元素级监听必与之互斗（已实测）。

### 原始 CSS — `public/style.css:5804`

```css
.inline-drawer-content {
    display: none;
}
```

**关键含义**：宿主默认折叠；该元素的 `display` 由 `slideToggle()` 独占，扩展写 `display` 会反转动画方向（已实测）。

---

## 2. 原生背景管线（`public/scripts/backgrounds.js`，共 **2039** 行）

### 存储接口

| 端点 | 方法 | 载荷 | 用途 |
| --- | --- | --- | --- |
| `/api/backgrounds/all` | POST | `{}` | 列出背景，响应 `{images: [{filename, isAnimated}], config}` |
| `/api/backgrounds/upload` | POST | FormData `avatar` = File | 上传 |
| `/api/backgrounds/delete` | POST | `{bg: filename}` | 删除 |

**实测（`probe-native-panel.mjs`）**：`/api/backgrounds/all` 返回 **27 项，非图片扩展名 0 项**；响应字段恰为 `images` / `config`。

→ **原生网格不列视频/音频/HTML**。这是接管方案设计的硬前提。

### 应用背景（全部是模块私有，**不可调用**）

| 函数 | 行 | 行为 |
| --- | --- | --- |
| `setBackground(bg, url)` | 1565 | 若聊天背景未锁定 → `$('#bg1').css('background-image', url)`；设 `background_settings.name/url`；`saveSettingsDebounced()` |
| `forceSetBackground(backgroundInfo)` | 286 | `saveBackgroundMetadata(url)` + `$('#bg1').css('background-image', url)` + **把背景推入 `chat_metadata[LIST_METADATA_KEY]`** + `renderChatBackgrounds()` |
| `onChatChanged()` | 306 | `$('#bg1').css('background-image', lockedUrl \|\| background_settings.url)` |
| `resolveImageUrl(bg, isCustom, isAnimated)` | 1549 | 缩略图 URL 解析 |
| `getUrlParameter(block)` | 1529 | 从缩略图元素取 CSS url 串（`highlightSelectedBackground` 的匹配键来源） |
| `isChatBackgroundLocked()` | 403 | `return chat_metadata[BG_METADATA_KEY]` —— **锁定态判定**（键值见 §2.1） |
| `saveBackgroundMetadata(file)` | 407 | `chat_metadata[BG_METADATA_KEY] = file` + `saveMetadataDebounced()` |
| `highlightLockedBackground()` | 355 | 给锁定的缩略图加 `.locked-background`（渲染结果，非真值） |

**`forceSetBackground` 的副作用**（决定子任务 3 是否可用 `FORCE_SET_BACKGROUND`）：
```js
const list = chat_metadata[LIST_METADATA_KEY] || [];
const bg = backgroundInfo.path;
list.push(bg);
chat_metadata[LIST_METADATA_KEY] = list;
saveMetadataDebounced();
```
→ 语义是「**聊天专属背景**」，用于全局切换会污染 chat 元数据。用户已裁定**不启用**。

### 选择处理器（模块私有，不可替换）

`onSelectBackgroundClick` — `backgrounds.js:421`：

```js
function onSelectBackgroundClick(e) {
    const bgFile = $(this).attr('bgfile');
    const isCustom = $(this).attr('custom') === 'true';
    if (isBackgroundSelectionMode && !isCustom) {      // ← 多选分组模式
        toggleBackgroundGroupSelection(bgFile);
        return;
    }
    const backgroundCssUrl = getUrlParameter(this);
    const bypassGlobalLock = !isCustom && e.shiftKey;
    if ((isChatBackgroundLocked() || isCustom) && !bypassGlobalLock) {
        saveBackgroundMetadata(backgroundCssUrl);
        $('#bg1').css('background-image', backgroundCssUrl);
    } else {
        setBackground(bgFile, backgroundCssUrl);       // ← 全局背景路径
    }
    highlightLockedBackground();
    highlightSelectedBackground();
}
```

**⚠️ 三条分支必须都处理**（执行期订正）：上面的代码里有**三条**互斥路径 ——
① `isBackgroundSelectionMode` 多选分组；② **`isChatBackgroundLocked() || isCustom`**（聊天锁定 / 聊天专属）；
③ 全局背景。规划期的 `shouldTakeOver()` 只放行了 ① 与 `isCustom` 那一半，**漏了「聊天锁定」** →
按「方案 α 接管一律优先」执行会让原生「把背景锁定给本聊天」的功能静默失效。
补的放行规则见 `research/decisions.md` §一 D-1。

补充：`e.shiftKey` 可绕过锁定（`bypassGlobalLock`）。放行后这是宿主的内部分支，原生行为自然生效。

### 2.1 锁定态与 chat 元数据的读取接缝（裁定 D-1 的依据）

```js
const BG_METADATA_KEY = 'custom_background';    // backgrounds.js:14
const LIST_METADATA_KEY = 'chat_backgrounds';   // backgrounds.js:15

function isChatBackgroundLocked() {             // :403
    return chat_metadata[BG_METADATA_KEY];
}
```

`chat_metadata` 本身由 `backgrounds.js:2` 从 `../script.js` 导入（模块私有）——**但 `getContext()` 暴露了它**：

```js
// public/scripts/st-context.js:2477（getContext 定义在 :2411）
get chatMetadata() { return chat_metadata; },
set chatMetadata(value) { updateChatMetadata(value, true); },
```

**结论**：锁定态可经**公开 context API** 读取 —— `getContext().chatMetadata['custom_background']`。

**键值稳定性**：`'custom_background'` 是**落盘在聊天文件里**的元数据键（配合 `saveMetadataDebounced()`，`:409`），
改名会让所有历史聊天的锁定背景失效 → 宿主实际上不可能在不做迁移的前提下改它。比任何 DOM 类名都稳。

**不采用的备选**：`.bg_example.locked-background` 类（由 `highlightLockedBackground()` `:355` 维护）——
是渲染结果而非真值，只在若干时机刷新。两者正常情况下一致，取权威者。

### 2.2 接管期间与 `#bg1` 抢写的风险（D-1 的第二个落点）

`#bg1` 的 `background-image` 有**三个**宿主写入点：`onChatChanged()` `:310`、
`onLockBackgroundClick()` `:380`、`forceSetBackground()` `:288`，
外加 `onSelectBackgroundClick` 锁定分支 `:433`。

**含义**：扩展的叠层清理器（观察 `#bg1` 的 `style` 属性）若**无条件**清空，就会与宿主的锁定语义
互相抢写 —— 表现为「接管放行 → 宿主写 `#bg1` → 扩展立刻清掉」的抖动，锁定背景永远显示不出来。
因此**同一判定必须在拦截入口与叠层清理两处都生效**（`isChatBackgroundLocked()`）。

### 绑定点 — `backgrounds.js:1844` `initBackgrounds()`

```js
export function initBackgrounds() {
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);              // :1845
    eventSource.on(event_types.FORCE_SET_BACKGROUND, forceSetBackground); // :1846

    $(document).on('click', '.bg_folder_tile:not(.bg_new_folder_tile)', ...)
        .on('click', '#bg_add_folder_button', ...)
        .on('click', '#bg_back_to_folders', ...)
        .on('click', '.bg_folder_tile [data-action="rename-folder"]', ...)
        .on('click', '.bg_folder_tile [data-action="delete-folder"]', ...)
        .on('click', '.bg_folder_tile .mobile-only-menu-toggle', ...);

    $(document)
        .off('click', '.bg_example').on('click', '.bg_example', onSelectBackgroundClick)   // ← 冒泡阶段委托
        .off('click', '.bg_example .mobile-only-menu-toggle').on('click', '.bg_example .mobile-only-menu-toggle', ...)
        .off('blur', '.bg_example.mobile-only-menu-open').on('blur', ...)
        .off('click', '.jg-button').on('click', '.jg-button', function (e) {                // ← 缩略图菜单
            e.stopPropagation();
            if (isBackgroundSelectionMode && $(this).closest('#bg_menu_content').length) return;
            const action = $(this).data('action');
            switch (action) {
                case 'lock': ... case 'unlock': ... case 'edit': ...
                case 'delete': ... case 'copy': ...
                case 'folder': { const bgEl = $(this).closest('.bg_example');
                                 if (bgEl.attr('custom') === 'true') break;
                                 const bgFile = bgEl.attr('bgfile'); if (bgFile) onAssignToFolder(bgFile); break; }
                case 'set-cover': { ... }
            }
        });
    $('#bg_thumb_zoom_in').on('click', ...);
    ...
    $('#bg_selection_mode_button').on('click', () => setBackgroundSelectionMode(!isBackgroundSelectionMode));
    $('#add_bg_button').on('change', (e) => onBackgroundUploadSelected(e.originalEvent));
    ...
}
```

**关键含义**：`.bg_example` 的选择处理器是 **document 冒泡阶段委托**（`.off(...).on(...)` 形式，说明是重绑定）。在 document **捕获阶段**监听并 `stopPropagation()` 即可完整拦下。

### 选中态 — `backgrounds.js:1773`

```js
function highlightSelectedBackground() {
    $('.bg_example.selected-background').removeClass('selected-background');
    const activeUrl = background_settings.url;
    if (activeUrl) {
        $('.bg_example').filter(function () {
            return $(this).data('url') === activeUrl;
        }).addClass('selected-background');
    }
}
```

**关键含义**：以 `background_settings.url` 为匹配键，且**每次都会先清空所有 `.selected-background`**。接管期间若不更新 `background_settings.url`，原生选中态会指向陈旧项或为空 → 扩展须用**独立类名**并每次重渲染后重施。

**匹配键的选择**：`data('url')` 是缩略图 CSS 串（由 `getUrlParameter(this)` 取出，形如 `url("...")`），与扩展的媒体 URL 不同源。**应改用 `.bg_example` 的 `bgfile` 属性（文件名）与扩展目录条目的文件名匹配。**

### 网格渲染 — `backgrounds.js:713` `renderSystemBackgrounds()`

```js
function renderSystemBackgrounds(backgrounds) {
    const sourceList = backgrounds || [];
    const container = $('#bg_menu_content');
    container.empty();                                    // ← 整块清空重建
    if (sourceList.length === 0) { syncGroupSelectionUi(); return; }
    const sortedList = sortBackgrounds(sourceList.map(bg => bg.filename), false);
    const metadataByFilename = new Map(sourceList.map(bg => [bg.filename, bg]));
    sortedList.forEach(filename => {
        const bg = metadataByFilename.get(filename);
        const imageData = { filename, isCustom: false, isAnimated: bg?.isAnimated ?? false };
        const thumbnail = createThumbnailElement(imageData);   // ← 模块私有，不可复用
        container.append(thumbnail);
    });
    syncGroupSelectionUi();
    activateLazyLoader();
}
```

**关键含义**：注入的节点会被 `empty()` 抹掉，需每次重建后重注入；且 `createThumbnailElement` / `activateLazyLoader` / `getUrlParameter` 均**模块私有**，注入即需自造结构。二者共同构成 T3（原生网格注入）高成本的理由。

### 多选分组模式的 DOM 信号 — `backgrounds.js:1033`（在 `syncGroupSelectionUi()` 内，`:1027`）

```js
function setBackgroundSelectionMode(enabled) {
    isBackgroundSelectionMode = enabled;
    if (!enabled) selectedSystemBackgroundFiles.clear();
    $('#bg_menu_content .bg_example.mobile-menu-open').removeClass('mobile-menu-open');
    syncGroupSelectionUi();
}
// syncGroupSelectionUi() 内：
$('#Backgrounds').toggleClass('bg-selection-mode', isBackgroundSelectionMode);
$('#bg_selection_mode_button').toggleClass('active', isBackgroundSelectionMode);
```

**关键含义**：`isBackgroundSelectionMode` 是模块私有变量**不可读**，但宿主把它**投射到了 DOM 上**——`#Backgrounds.bg-selection-mode`。接管拦截器据此放行即可，无需脆弱启发式。

---

## 3. 导出与可达性

### `backgrounds.js` 的导出（可被 `import`，但扩展是独立脚本、接不到宿主的模块图）

当前版本的**全部** `export`：

| 导出 | 行 |
| --- | --- |
| `background_settings`（**`export let`**） | 136 |
| `loadBackgroundSettings(settings)` | 239 |
| `isCustomBackgroundUrl(fileUrl)` | 330 |
| `getBackgroundPath(fileUrl)` | 340 |
| `getBackgrounds()` | 768 |
| `getActiveBackgroundTab()` | 1819 |
| `initBackgrounds()` | 1844 |

> ⚠️ **订正（执行期实测）**：初次采集时把 `background_settings` 记为「模块作用域、未导出」。
> 当前版本它**是 `export let`**（`:136`），且被 `public/script.js:277` 与
> `public/scripts/slash-commands.js` 导入。**但结论不变**——它不是 `window` 上的对象，也不在
> `getContext()` 的返回键里（见下），而本扩展是**独立脚本**（经 `manifest.json` 的 `js: dist/index.js`
> 加载），接不到宿主的 ES 模块图。理由从「模块私有」订正为「**已导出但扩展不可达**」。

### 确认**不可用**的接缝

| 目标 | 结论 | 依据 |
| --- | --- | --- |
| `setBackground()` | ❌ 未导出、未挂 `window` | `backgrounds.js:1565`，无 `export` |
| `onSelectBackgroundClick()` | ❌ 同上 | `backgrounds.js:421` |
| `renderSystemBackgrounds()` / `createThumbnailElement()` / `activateLazyLoader()` | ❌ 同上 | `backgrounds.js:713` / `183` / `1466` |
| `background_settings` 对象 | ❌ 已导出（`export let`，`:136`）但**扩展不可达** | 不在 `window`、不在 `getContext()` 返回键；扩展是独立脚本，接不到宿主模块图 |
| `getContext()` 暴露**背景专用**能力 | ❌ **实测确认无** | `public/scripts/st-context.js` 全文**不含** `background_settings` / `backgrounds.js` 字样；`getContext()`（定义在 `:2411`）返回键中无任何背景相关项 |
| `isBackgroundSelectionMode` 变量 | ❌ 私有 | 但 DOM 上有等价信号，见 §2 |

> **订正说明**：初次采集把上表最后两行合并写成「`getContext()` 不暴露任何 backgrounds 相关内容」。
> 该结论对**背景专用**能力成立，但**不适用于 chat 元数据** —— `getContext().chatMetadata`
> 是公开 getter（`st-context.js:2477`），锁定态因此有**公开读法**。见 §2.1。

### 唯一可用的**公开事件**

`public/scripts/events.js:67`：

```js
FORCE_SET_BACKGROUND: 'force_set_background',
```

宿主**监听**它（`backgrounds.js:1695`）。扩展可 `emit` 它来驱动宿主应用背景——但带上 §2 记录的 chat 元数据副作用。另有 `CHAT_CHANGED`（`chat_id_changed`）。

**不存在** `BACKGROUND_CHANGED` 之类「背景已变更」的对外事件 → 感知原生变更只能靠观察 `#bg1` 的 `style` 属性或拦截点击。

---

## 4. 升级期比对清单

宿主升级后，逐条确认：

1. `public/script.js` 中 `.inline-drawer-content` 的 `display` 是否仍由 `slideToggle()` 独占（若宿主改为 class 驱动，扩展的折叠修复可简化）。
2. `.inline-drawer-toggle` 是否仍是 **document 级委托**。
3. `/api/backgrounds/all` 是否仍只返回图片（若开始返回非图片，T3 的必要性上升，接管受影响集合扩大）。
4. `.bg_example` 是否仍是选择单元、是否仍带 **`bgfile`** 属性。
5. `.bg_example` 的选择处理器是否仍是 **document 冒泡阶段委托**（若改为捕获阶段，本方案需改用别的拦截点）。
6. `#Backgrounds.bg-selection-mode` 信号是否仍存在（若移除，放行规则需换判据）。
7. `event_types.FORCE_SET_BACKGROUND` 是否仍存在（本方案不依赖它，但 `probe()` 探测其存在性）。
8. `#bg_menu_content` 是否仍被 `empty()` 后重建（决定扩展选中标记是否需要重施）。
9. **`onSelectBackgroundClick` 是否仍是三分支**（多选 / 聊天锁定或专属 / 全局）。若宿主删掉锁定分支，
   放行规则可简化；若新增第四分支（例如「多背景叠加」），**必须为新分支补放行或补接管判定**。
10. **`getContext().chatMetadata` 是否仍为公开 getter**（`st-context.js:~2477`）。这是锁定态的唯一读取接缝；
    若被移除，需退回 `.bg_example.locked-background` 类（渲染信号，精度较低）。
11. **元数据键 `'custom_background'` 是否变更**（`backgrounds.js:~14`）。它是落盘键，变更需迁移，
    因此极稳定；若真变了，说明有迁移逻辑需要跟随。
12. `#bg1` 的写入点是否仍为四处（`onChatChanged` / `onLockBackgroundClick` / `forceSetBackground` /
    `onSelectBackgroundClick` 锁定分支）—— 叠层清理器的豁免逻辑依赖「锁定期间由宿主独占 `#bg1`」。
