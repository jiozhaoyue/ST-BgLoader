# 原生风格对齐与折叠修复

## Goal

修复扩展设置面板**无法折叠**的缺陷，并让面板与全部交互控件彻底贴合 SillyTavern 原生视觉与交互惯例（含移除溢光按钮特效）。同时给上一任务遗留的 P3-10「内联样式清理」一个明确结论。

## Background

### 折叠缺陷的根因（已定位，证据充分）

ST 原生以 **document 级委托**接管所有内联抽屉（`public/script.js:12193`）：

```js
$(document).on('click', '.inline-drawer-toggle', async function (e) {
    if ($(e.target).hasClass('text_pole')) return;
    const drawer = $(this).closest('.inline-drawer');
    const icon = drawer.find('>.inline-drawer-header .inline-drawer-icon');
    const drawerContent = drawer.find('>.inline-drawer-content');
    icon.toggleClass('down up');
    icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
    drawer.trigger('inline-drawer-toggle');
    drawerContent.stop().slideToggle({ complete: () => { $(this).css('height', ''); } });
});
```

原生纯 CSS 侧：`.inline-drawer-content { display: none; }`（`public/style.css:5543`）。

本扩展在 [SettingsDrawer.ts:523-533](src/ui/SettingsDrawer.ts:523) **又自建了一套折叠逻辑**：

```js
const toggle = this.container.querySelector('.inline-drawer-toggle');
const content = this.container.querySelector('.inline-drawer-content') as HTMLElement;
const icon = this.container.querySelector('.inline-drawer-icon');
toggle?.addEventListener('click', () => {
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'flex' : 'none';
    ...
});
```

**互斗机制**：同一次点击，元素级监听器（扩展的）先于 document 级委托（宿主的）触发。扩展把 `display` 设为 `none`；宿主随后的 `slideToggle()` 检测到元素已隐藏，于是执行 **slideDown** 把它重新展开 → 面板**永远折不上**。

**三处同源缺陷**：

1. 折叠逻辑双重绑定（上述）。
2. 图标 `down`/`up` 类被切换两次 → 箭头方向与实际状态错位。宿主还会切 `fa-circle-chevron-down`/`fa-circle-chevron-up`，扩展完全不处理这对类。
3. [SettingsDrawer.ts:95](src/ui/SettingsDrawer.ts:95) 把 `display: flex; flex-direction: column; gap: 12px` 写死在行内样式上。宿主默认 `display: none`，扩展写死 `flex` 使面板**默认展开**（与页面内其它扩展不一致），且行内 `display` 与宿主 `slideToggle()` 的 display 控制直接冲突。

### 溢光特效清单（`src/ui/style.css`）

| 位置 | 声明 | 判定（已经用户裁定） |
| --- | --- | --- |
| [style.css:131](src/ui/style.css:131) | `.st-bgloader-media-card.active` 的 `box-shadow: 0 0 8px color-mix(...)` | **溢光，移除**。选中态改用边框表达 |
| [style.css:254](src/ui/style.css:254) | `.st-bg-mini-capsule` 的 `box-shadow: 0 4px 16px rgba(0,0,0,.4)`（基础投影） | **移除**（用户裁定：投影全部去掉），改用 1px 边框表达边界 |
| [style.css:261](src/ui/style.css:261) | `.st-bg-mini-capsule:hover` 的 `box-shadow: 0 6px 20px rgba(0,0,0,.6)` | **移除**（hover 只改 `border-color`） |
| [style.css:278](src/ui/style.css:278) | `.st-bg-mini-btn:hover` 的 `transform: scale(1.1)` | 非原生按钮动效，**改为原生 hover 语义**（配色变化） |
| [style.css:123](src/ui/style.css:123) | `.st-bgloader-media-card:hover` 的 `transform: scale(1.02)` | 非原生，**移除**（原生缩略图 hover 只有边框/遮罩变化） |

> 基础投影被一同移除后，迷你播放器胶囊的边界完全由 `border: 1px solid rgba(255,255,255,0.15)` 承担 → 须实测在浅色主题下边界是否仍可辨；不足则提高边框对比度，而不是加回投影。


### P3-10 遗留

上一任务明确将「内联样式清理」保持 open，理由为「纯外观、回归风险大于收益」。本轮因折叠修复**必须**触碰 `SettingsDrawer` 的容器样式与 L95 行内样式，该项转入本轮范围。

## Requirements

1. **R1 折叠交还宿主**：删除扩展自建的折叠逻辑，折叠行为完全由 ST 原生委托处理器承担。
2. **R2 布局不依赖 display**：内容容器的 flex 布局不得依赖 `display:flex` 出现在 `.inline-drawer-content` 上（宿主 slideToggle 会改写它）；改用内层布局容器承载。
3. **R3 默认折叠**：面板初始状态为折叠（与页面内其它扩展一致），移除写死的行内 `display`。
4. **R4 重渲染后折叠态正确**：`render()` 会整块重建面板（远端设置同步 / 导入 JSON / 云端收敛三条路径都会触发），重建后折叠态与图标必须自洽。
5. **R5 移除溢光**：按上表移除溢光与跨张动效；选中态改由边框与前景对比表达。
6. **R6 主题变量**：所有颜色/边框/圆角引用 ST 主题变量并保留 fallback；新增的例外须以注释写明豁免理由。
7. **R7 P3-10 结论**：清理 `SettingsDrawer` 中影响布局与状态的行内样式（`display`/`width`/`gap`/`margin` 等结构性行内样式移入 CSS 类）；纯一次性取值（如 `<option>` 的 `selected`）保留。给出「哪些清了、哪些留、为什么」的明确记录。
8. **R8 原生交互语义**：按钮复用宿主 `.menu_button` 惯例；抽屉头部结构（`.inline-drawer` > `.inline-drawer-toggle.inline-drawer-header` > `.inline-drawer-icon`）保持与原生模板一致。
9. **R9 规范落盘**：把「原生风格 + 溢光禁令 + 例外白名单」写入 `.trellis/spec/frontend/`，供后续子任务与未来改动遵循。
10. **R10 零回归**：`type-check` + `build` 通过；CSS 裸选择器门禁保持 0。

## Non-goals

- 不重构设置面板的信息架构（分区、字段顺序、控件类型一律不动）。
- 不新增/删除任何设置项或功能。
- 不改 `dist/` 之外的服务端契约；不引入外部依赖。
- 迷你播放器胶囊的**全部投影**（含基础投影）按用户裁定移除，边界改由 1px 边框承担。

## 用户裁定（2026-09-26）

| 决策点 | 裁定 |
| --- | --- |
| 迷你播放器胶囊的基础投影 | **全部去掉**（原本拟保留，用户裁定去掉） |
| 选中态表达 | 采用「2px 主题色边框 + 标题条强调」方案；不进一步复用原生 `.selected-background` 类名（避免与宿主 `highlightSelectedBackground()` 争用同一类） |

## Open Questions

无未决项。


## Acceptance Criteria

- [ ] 点击面板标题栏一次 → 折叠；再点一次 → 展开。连续 5 次后状态与图标始终自洽，无抖动、无「弹回」。
- [ ] 页面加载后面板**初始为折叠**状态，与同页面其它第三方扩展的抽屉行为一致。
- [ ] 触发一次重渲染（导入设置 JSON）后，折叠/展开仍正常。
- [ ] `src/ui/style.css` 中**不存在任何 `box-shadow`**（含迷你播放器胶囊的基础投影与 hover 加深，均按裁定移除）；仅在语义徽章处保留必要的固定色值，并注明豁免理由。
- [ ] 迷你播放器胶囊在**浅色主题**下边界仍清晰可辨（实测；不足则提高 `border` 对比度而非加回投影）。
- [ ] `.st-bgloader-media-card:hover` 与 `.st-bg-mini-btn:hover` 不再使用 `transform: scale()`。
- [ ] 扩展自建的 `.inline-drawer-toggle` 监听器已删除；全仓 grep 不再有自建的抽屉折叠实现。
- [ ] P3-10 结论落盘（清理清单 + 保留清单 + 理由）。
- [ ] `.trellis/spec/frontend/` 中原生风格规范已落盘并被索引引用。
- [ ] `npm run type-check` + `npm run build` 通过；`grep '^\.' src/ui/style.css | grep -vc 'st-bg'` 为 0。
- [ ] 三套件回归不劣于基线。

## Risks

- **R-1 slideToggle 与内层 flex 的兼容**：宿主 slideToggle 在动画中会对 `.inline-drawer-content` 设置 `height` 与 `display`，若内层容器高度依赖父级百分比可能跳动 → 内层容器只做 flex/gap/padding，不设百分比高度。
- **R-2 重渲染打断动画**：`render()` 在远端同步时可能于动画中途重建面板 → 重建后为折叠态属可接受行为（与原生扩展一致），但须验证不留下 `height` 残留。
- **R-3 行内样式清理范围蔓延**：清理可能牵连其它子系统 → 严格限定在 `SettingsDrawer` 生成的 DOM 与其对应 CSS。
- **R-4 图标类名依赖宿主**：宿主切 `fa-circle-chevron-down/up`，本扩展不得再自行维护这对类，避免二次错位。

## Rollback

单子任务提交组，revert 即回到当前行为（折叠不可用 + 溢光存在）。无数据影响。
