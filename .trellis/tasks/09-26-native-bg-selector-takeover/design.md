# 技术设计 — 接管 ST 原生背景选择器

## 1. 模块结构

现有 [`NativeBgAugmenter`](src/ui/NativeBgAugmenter.ts) 只是一个「打徽章 + 逐元素挂 click」的小工具。接管需要与之共享：接缝探测、网格重渲染观察、`bgfile` 匹配逻辑。因此**合并为单一控制器**，同时满足 PRD R2「单一拦截点」：

```
src/ui/NativeBackgroundController.ts     ← 新（取代 NativeBgAugmenter.ts）
    ├─ probe()                接缝探测（PRD R1）
    ├─ start() / stop()       安装 / 卸载拦截（PRD R7 开关）
    ├─ decorateGrid()         徽章 + 选中标记（原 augmenter 职责 + PRD R5）
    ├─ onDocumentClickCapture 唯一拦截点（PRD R2/R4）
    └─ refreshSelection()     重渲染后重施选中态
```

`index.ts` 的接线从 `nativeAugmenter` 改为 `nativeController`；`NativeBgAugmenter.ts` 删除（其职责被完全吸收）。

### 对外契约

```ts
export type TakeoverLevel = 'off' | 'non-image' | 'all';

export interface NativeSeams {
    menuContent: HTMLElement;   // #bg_menu_content
    customContent: HTMLElement; // #bg_custom_content
    bgHost: HTMLElement;        // #bg1
    hasForceEvent: boolean;     // event_types.FORCE_SET_BACKGROUND 存在
}

export class NativeBackgroundController {
    constructor(onSelect: (bgFile: string, type: MediaType) => void);

    /** 接缝探测；返回 null 表示宿主不支持接管 */
    public probe(): NativeSeams | null;

    /** 安装（幂等）：decorateGrid + 注册唯一捕获监听 */
    public start(level: TakeoverLevel): void;

    /** 卸载（幂等）：移除监听、清徽章与选中标记、恢复 #bg1 背景图 */
    public stop(): void;

    public setLevel(level: TakeoverLevel): void;
    public isActive(): boolean;
    public refreshSelection(activeFileName: string | null): void;
}
```

## 2. 接缝探测（PRD R1）

```ts
public probe(): NativeSeams | null {
    const menuContent = document.querySelector<HTMLElement>('#bg_menu_content');
    const bgHost = document.querySelector<HTMLElement>('#bg1');
    const eventTypes = (window as any).event_types;
    // 结构探针：网格里至少要有一个 .bg_example 带 bgfile，否则说明宿主改了缩略图结构
    const sample = menuContent?.querySelector<HTMLElement>('.bg_example');
    const结构OK = !!sample && sample.hasAttribute('bgfile');

    if (!menuContent || !bgHost || !结构OK) return null;   // → 降级为增强模式
    return {
        menuContent,
        customContent: document.querySelector<HTMLElement>('#bg_custom_content') ?? menuContent,
        bgHost,
        hasForceEvent: !!eventTypes?.FORCE_SET_BACKGROUND,
    };
}
```

**探针在网格首次渲染之前可能无样本**（`#bg_menu_content` 初始为空，由 `getBackgrounds()` 异步填充）→ 探针必须**可重入**：若 `menuContent` 存在但无样本，则挂一次性观察者，等首个 `.bg_example` 出现后二次探测。这是既有 `NativeBgAugmenter.start()` 已经在做的时间窗问题，沿用「找到目标即清定时器 + 30s 放弃上限」的既有纪律。

探测失败 → `start()` 直接返回，`isActive()` 为 false，扩展回到「增强模式」（只打徽章、不拦截）。**媒体功能完全不受影响**。

## 3. 拦截逻辑（PRD R2 / R4）

```ts
private onDocumentClickCapture = (e: MouseEvent): void => {
    if (!this.active) return;
    const target = e.target as HTMLElement | null;
    const example = target?.closest<HTMLElement>('.bg_example');
    if (!target || !example || !this.shouldTakeOver(example, target)) return;

    const bgFile = example.getAttribute('bgfile');
    if (!bgFile) return;

    e.preventDefault();
    e.stopPropagation();          // 打断 document 冒泡阶段的宿主委托处理器
    this.onSelect(bgFile, detectMediaType(bgFile));
};

private shouldTakeOver(example: HTMLElement, target: HTMLElement): boolean {
    // 1) 原生「多选背景加分组」模式 → 放行（宿主信号：#Backgrounds.bg-selection-mode）
    if (document.querySelector('#Backgrounds.bg-selection-mode')) return false;
    // 2) 非「选择背景」语义的点击 → 放行
    if (target.closest('.jg-button, .bg_folder_tile, .mobile-only-menu-toggle')) return false;
    // 3) 聊天专属（custom）背景 → 不接管，交回宿主语义
    if (example.getAttribute('custom') === 'true') return false;
    // 4) 层级：non-image 只接管非图片
    const bgFile = example.getAttribute('bgfile') || '';
    if (this.level === 'non-image' && detectMediaType(bgFile) === 'image') return false;
    return true;
}
```

### 为什么用捕获阶段 + `stopPropagation()`

宿主的处理器是 **document 冒泡阶段**的委托（`backgrounds.js:1733`）。document 是事件路径的根，捕获阶段最先执行；此时 `stopPropagation()` 会阻止事件继续传播到目标与冒泡阶段，宿主处理器不会执行。**已在规划期核验该机制成立。**

### 为什么必须删掉逐元素监听（PRD R2 的硬约束）

原 `NativeBgAugmenter` 把 click 挂在 `.bg_example` 元素自身（**目标阶段**）。若保留，document 捕获阶段的 `stopPropagation()` 会让事件根本到不了目标阶段 → 那个监听器永远不触发，形成「看起来还在、其实已死」的死逻辑。所以必须合并成单一拦截点。

### 放行信号的核验依据

| 放行条件 | 宿主信号 | 证据 |
| --- | --- | --- |
| 多选分组模式 | `#Backgrounds` 带 `bg-selection-mode` 类 | `backgrounds.js:924` `$('#Backgrounds').toggleClass('bg-selection-mode', isBackgroundSelectionMode)` |
| 菜单按钮 | `.jg-button` | `backgrounds.js:1773` 起 `$(document).on('click','.jg-button', …)` 处理 lock/edit/delete/copy/folder/set-cover |
| 文件夹磁贴 | `.bg_folder_tile` | `backgrounds.js:1701` 起 |
| 移动端菜单开关 | `.mobile-only-menu-toggle` | `backgrounds.js:1734` |
| 聊天专属背景 | `.bg_example[custom="true"]` | `backgrounds.js:371` `$(this).attr('custom') === 'true'` |

## 4. 选中态标记（PRD R5）

原生 `highlightSelectedBackground()`（`backgrounds.js:1641`）每次都会 `$('.bg_example.selected-background').removeClass(...)` 后按 `background_settings.url` 重算。由于接管期间我们**不更新** `background_settings`，原生的选中态会指向一个陈旧项或什么都不选。

因此：

1. 使用**独立类名** `st-bg-takeover-selected`，不与原生 `.selected-background` 争。
2. 匹配键用 **`bgfile` 属性 ↔ 扩展目录条目的文件名**（`item.name`）。**不用 URL**——原生 `data-url` 是缩略图 CSS 串（`getUrlParameter(this)` 取出的是 `url("...")`），与扩展的媒体 URL 不同源。
3. 每次原生网格重渲染后重施：复用既有的 MutationObserver（观察 `#bg_menu_content` 的 `childList/subtree`），在 `decorateGrid()` 末尾调用选中的重施逻辑。注意原生 `renderSystemBackgrounds()` 是 `empty()` 后整块重建，观察者会收到通知。
4. 样式按子任务 1 的原生视觉规范：**无溢光**，用边框 + 角标表达。

## 5. 叠层清理（PRD R6）

接管期间清空 `#bg1` 的内联 `background-image`：

```ts
private clearNativeBackgroundImage(): void {
    if (!this.seams) return;
    if (this.seams.bgHost.style.backgroundImage) {
        this.seams.bgHost.style.backgroundImage = '';
    }
}
```

**幂等、可重复**：宿主的 `onChatChanged`（`backgrounds.js:266`）会在 `CHAT_CHANGED` 时写回 `lockedUrl || background_settings.url`。因此不能只清一次——调用点：

| 时机 | 理由 |
| --- | --- |
| `start()` 后 | 初始接管 |
| 每次扩展 `applyMedia()` 之后 | 保证扩展图层独占视觉 |
| 监听 `CHAT_CHANGED` 事件后（微任务/task 之后） | 宿主刚写回，需在其后清 |

实现上给 `#bg1` 挂一个 `attributes` 观察者（`attributeFilter: ['style']`），检测到 `background-image` 被写入且当前处于接管状态 → 清空。需加**自写保护**（自己的清空动作会再次触发观察者，用一个 `clearing` 标志位短路）。

`stop()` 时必须**移除该观察者**并让原生背景图恢复（重新触发一次宿主的 `onChatChanged` 行为不可行 → 改为：`stop()` 后调用 `getBackgrounds()`（已导出，`backgrounds.js:708`）以让宿主重绘并重算 `#bg1` 背景，前提是能从 `eventSource` 侧触发；若不可行，则明确告知用户「关闭接管后需刷新一次页面以完全恢复原生态」）。

> **这一条是 `stop()` 的已知粗糙点**，实现时须实测：若无法在不刷新页面的前提下完全恢复原生背景图，则必须在开关的 UI 文案里写明。

## 6. 层级与开关（PRD R7）

`BgLoaderSettings` 新增：

```ts
nativeTakeover: TakeoverLevel;   // 'off' | 'non-image' | 'all'
```

默认 `'all'`（T2，用户已明确要求接管选择器）。

设置面板（子任务 1 完成后的面板结构上）加一个下拉或三态控件。改动落在 `SettingsDrawer` → **与子任务 1 有文件接触**，故本子任务须在子任务 1 提交后动工。

`setLevel('off')` → `stop()`；`setLevel(其它)` → 若未 active 则 `start()`，否则仅更新 `this.level`。

## 7. `FORCE_SET_BACKGROUND` 的取舍（PRD R8）

**默认不启用。** 若未来要让扩展状态与原生 `background_settings` 同步，唯一允许的手段是：

```ts
eventSource.emit(eventTypes.FORCE_SET_BACKGROUND, { url, path });
```

代价：`forceSetBackground` 会把背景推入 `chat_metadata[LIST_METADATA_KEY]`（`backgrounds.js:253-257`），即变成「聊天专属背景」——会污染 chat 元数据、并在聊天下拉里多出一堆「自定义背景」。**用于全局背景切换语义不符。**

若 Open Question 3 裁定要启用，须先与用户确认该副作用的接受度，并限制在「只对原生网格里已存在的项回写」。

## 8. 图片纳入管线的观感风险（PRD R-6）

| 类型 | 原生行为 | 扩展 `ImageRenderer` | 差异 |
| --- | --- | --- | --- |
| 静态图 | `#bg1` 的 background-image（`object-fit` 由 `#bg1` 的 fitting 类控制） | 绝对定位 `<img>` + `objectFit` | 观感一致（`getFitting()` 已读 `#bg1` 的 fitting 类） |
| 动图（GIF/APNG） | 同静态图，浏览器自然播放 | 同静态图，浏览器自然播放 | 一致 |
| 视频类扩展名的静态图 | 走 `isAnimatedBackgroundExtension` 判断 | 由 `detectMediaType` 判定 | 需实测二者判定是否一致 |

**`getFitting()` 已复用 `#bg1` 的 fitting 类**（[`MediaMount.ts:175-181`](src/core/MediaMount.ts:175)），所以 fitting 语义天然对齐——这是既有的良好接缝，接管后继续有效。

## 9. 验证设计

| 场景 | 期望 |
| --- | --- |
| 探针失败（Dev 上临时移除 `#bg_menu_content`） | 接管不安装，徽章也不打，媒体库与切背景全部正常 |
| 原生面板点视频缩略图 | 走扩展管线；`#bg1` 的 `background-image` **未**被写入（单写者） |
| 原生面板点图片缩略图（level=all） | 走扩展 `ImageRenderer`；`#bg1` 的 `background-image` 未写入 |
| 原生面板点图片缩略图（level=non-image） | 放行给原生，原生行为与未安装接管时完全一致 |
| 打开多选分组模式后点缩略图 | 放行，正常多选，不触发背景切换 |
| 点缩略图上的 lock/edit/delete/copy 菜单 | 放行，原生菜单功能正常 |
| 点文件夹磁贴 | 放行，正常进入文件夹 |
| 点聊天专属背景（custom=true） | 放行给原生 |
| 扩展当前背景在原生面板 | 有 `st-bg-takeover-selected` 标记；重进面板后标记仍在 |
| 切到别的聊天（触发 `CHAT_CHANGED`） | `#bg1` 的 `background-image` 被清空，不出现叠层 |
| 关闭接管开关 | 拦截卸载、徽章清除、原生可正常选背景 |
| 关闭接管后刷新页面 | 原生行为完整恢复（验证 §5 的已知粗糙点） |

## 10. 兼容性与回滚

- 新增 `src/ui/NativeBackgroundController.ts`，删除 `src/ui/NativeBgAugmenter.ts`，其余改动为 `index.ts` 接线、`types` 加一个字段、`SettingsDrawer` 加一个控件。
- 无服务端改动、无数据迁移。
- 回滚：`setLevel('off')` 即时恢复到「增强模式」；或 revert 本子任务提交组（`NativeBgAugmenter` 一并恢复）。

## 11. 用户裁定（2026-09-26）与未决项

| 决策点 | 裁定 |
| --- | --- |
| 接管层级 | **T2**（`level = 'all'`）。`'non-image'` 与 `'off'` 作为可选档位保留在 `TakeoverLevel` 中（供用户按需降档），但默认值为 `'all'` |
| 优先级语义 | **方案 α**。因此 §3 的 `shouldTakeOver()` 中**不存在**「点原生图片即退出接管」分支——`#bg1` 的原生背景在接管期间一律被清空（§5），扩展图层独占视觉 |
| `FORCE_SET_BACKGROUND` | **不启用**（§7 保留实现说明但默认关闭；`probe()` 仍探测其存在性） |
| T3 原生网格注入 | **不做**。§1 模块设计中不包含任何向 `#menuContent` 注入节点的逻辑 |

**唯一未决项**：§5 的 `stop()` 能否在不刷新页面的前提下完全恢复原生背景图 —— 执行时实测裁定；若不能，写进接管开关的 UI 文案。
