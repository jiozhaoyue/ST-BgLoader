# ST 原生背景管线 — 源码证据留档

> 用途：子任务 3 `implement.md` Phase B1 要求的证据文件。**将来宿主升级时，用本文件逐条比对**，即可判断接管方案所依赖的接缝是否仍成立。
>
> 采集时间：2026-09-26
> 采集对象：**实际运行的宿主**，而非上游原版。

## 宿主身份

| 项 | 值 |
| --- | --- |
| 宿主 | **Luker**（SillyTavern 深度重写分支，luker.cups.moe） |
| 实例路径 | `D:\Repo\Tavern-repo\Instance\Dev\Luker` |
| 服务进程 | `node server.js --browserLaunchEnabled=false`（曾监听 0.0.0.0:8003） |
| 测试目标 URL | `https://127.0.0.1:8003` |
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

## 2. 原生背景管线（`public/scripts/backgrounds.js`，共 1865 行）

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
| `setBackground(bg, url)` | ~1442 | 若聊天背景未锁定 → `$('#bg1').css('background-image', url)`；设 `background_settings.name/url`；`saveSettingsDebounced()` |
| `forceSetBackground(backgroundInfo)` | 249 | `saveBackgroundMetadata(url)` + `$('#bg1').css('background-image', url)` + **把背景推入 `chat_metadata[LIST_METADATA_KEY]`** + `renderChatBackgrounds()` |
| `onChatChanged()` | 263 | `$('#bg1').css('background-image', lockedUrl \|\| background_settings.url)` |
| `resolveImageUrl(bg, isCustom, isAnimated)` | ~1424 | 缩略图 URL 解析 |

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

`onSelectBackgroundClick` — `backgrounds.js:369`：

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

### 绑定点 — `backgrounds.js:1693` `initBackgrounds()`

```js
export function initBackgrounds() {
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
    eventSource.on(event_types.FORCE_SET_BACKGROUND, forceSetBackground);

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

### 选中态 — `backgrounds.js:1641`

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

### 网格渲染 — `backgrounds.js:661` `renderSystemBackgrounds()`

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

### 多选分组模式的 DOM 信号 — `backgrounds.js:924`

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

`loadBackgroundSettings` · `isCustomBackgroundUrl` · `getBackgroundPath` · `getBackgrounds` · `getActiveBackgroundTab` · `initBackgrounds`

### 确认**不可用**的接缝

| 目标 | 结论 | 依据 |
| --- | --- | --- |
| `setBackground()` | ❌ 模块私有、未导出、未挂 `window` | `backgrounds.js:1442`，无 `export` |
| `onSelectBackgroundClick()` | ❌ 同上 | `backgrounds.js:369` |
| `renderSystemBackgrounds()` / `createThumbnailElement()` | ❌ 同上 | `backgrounds.js:661` 等 |
| `background_settings` 对象 | ❌ 模块作用域 | 仅出现在设置**保存载荷**中（`script.js:8091` 的 `payload.background = background_settings`），未挂 `window` |
| `getContext()` 暴露背景能力 | ❌ **实测确认无** | `public/scripts/st-context.js:115` 的 `getContext()` 返回键中无任何背景相关项（逐项核对了其导入列表与返回对象） |
| `isBackgroundSelectionMode` 变量 | ❌ 私有 | 但 DOM 上有等价信号，见 §2 |

### 唯一可用的**公开事件**

`public/scripts/events.js:50`：

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
