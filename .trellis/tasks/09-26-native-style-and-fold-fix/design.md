# 技术设计 — 原生风格对齐与折叠修复

## 1. 折叠修复：放弃 flex，改用块级间距

### 问题回顾

宿主用 `slideToggle()` 控制 `.inline-drawer-content` 的 `display`；本扩展在此元素上写了行内 `display:flex`。两者不可能共存。

### 方案（实现期改进版）

**不加内层容器，直接让 `.inline-drawer-content` 保持块级布局，用 `margin-bottom` 替代 flex `gap`。**

```html
<div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
        <b><i class="fa-solid fa-photo-film"></i> ST-BgLoader …</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">      <!-- 宿主 slideToggle 独占 display，扩展完全不碰 -->
        …11 个 .st-bgloader-section…          <!-- 标记结构不变 -->
    </div>
</div>
```

```css
.st-bgloader-panel .inline-drawer-content {
    padding-top: 10px;                     /* 原行内 padding 迁到 CSS */
}
.st-bgloader-panel .inline-drawer-content > .st-bgloader-section {
    margin-bottom: 12px;                   /* 替代 flex gap: 12px */
}
.st-bgloader-panel .inline-drawer-content > .st-bgloader-section:last-child {
    margin-bottom: 0;
}
```

### 为什么优于「加内层 flex 容器」

| 维度 | 内层 flex 容器 | 块级 + margin（选定） |
| --- | --- | --- |
| DOM 节点 | 多一层 | 不增加 |
| 模板 diff | 需重排 330 行缩进 | 仅删 2 处、加 1 处 CSS |
| 与宿主动画的耦合 | 内层若设百分比高度会与 `slideToggle` 写的 `height` 打架 | **完全不碰 `display`/`height`，零耦合** |
| 未来宿主改动 | 若宿主改 `.inline-drawer-content` 的 display，内层布局假设仍成立但也无收益 | 宿主怎么改 display 都不影响 |
| 视觉等价性 | 等价 | 等价（`gap` 与 `margin-bottom` 对块级单列同效） |

**可逆性**：`padding` / `margin` 均非 `slideToggle` 的争用属性（jQuery 只控制 `display`/`height`/`overflow`，且会自行存取 padding），因此最坏情况也只是间距不对，不会导致折叠失效。

### 为什么不是「保留自建逻辑 + 阻止宿主处理器」

可选方案对比：

| 方案 | 做法 | 否决理由 |
| --- | --- | --- |
| A（选定） | 删自建逻辑，交还宿主；布局不用 flex | 与页面内其它扩展行为天然一致；无宿主同步维护成本 |
| B | 保留自建，`e.stopPropagation()` 阻止宿主委托 | 仍要自行维护图标类名与动画；宿主换动画/换类名即错位；且与「原生风格」诉求相悖 |
| C | 保留自建，但改成只切宿主认的类 | 等于重新实现 slideToggle，收益为负 |

→ 选 A。

### 重渲染路径的折叠态

`render()` 会 `existing.remove()` 后重建，新面板回到宿主默认的折叠态。这是**期望行为**（与原生扩展一致），但需保证：

- 重建后不残留宿主 `slideToggle` 写入的 `height`（宿主的 `complete` 回调会 `css('height','')`，但动画中途被移除会残留）→ 由于是**整体移除重建**，旧节点及其样式一并销毁，无残留。
- `render()` 现有调用点：`init` 后首次渲染、`applyRemoteSettings`、导入 JSON。三条路径共用同一 `render()`，无需分别处理。

## 2. 视觉规范：选中态与溢光

### 溢光移除

```css
/* 改前 —— 溢光 */
.st-bgloader-media-card.active {
    border: 2px solid var(--SmartThemeQuoteColor, #4fa3d1);
    box-shadow: 0 0 8px rgba(79, 163, 209, 0.5);
    box-shadow: 0 0 8px color-mix(in srgb, var(--SmartThemeQuoteColor, #4fa3d1) 50%, transparent);
}

/* 改后 —— 边框 + 前景对比，无溢光 */
.st-bgloader-media-card.active {
    border: 2px solid var(--SmartThemeQuoteColor, #4fa3d1);
    background: color-mix(in srgb, var(--SmartThemeQuoteColor, #4fa3d1) 18%, var(--SmartThemeBlurTintColor, #1e1e24));
}
.st-bgloader-media-card.active .st-bgloader-media-card-title {
    background: var(--SmartThemeQuoteColor, #4fa3d1);
    color: #fff;
    font-weight: 600;
}
```

`color-mix` 保留 fixed-rgba fallback 的既有惯例（`background: rgba(...)` 在前、`color-mix` 在后）。

### hover 动效移除

```css
/* 改前 */
.st-bgloader-media-card:hover { transform: scale(1.02); border-color: …; }
.st-bg-mini-btn:hover { color: …; transform: scale(1.1); }
.st-bg-mini-capsule { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); }
.st-bg-mini-capsule:hover { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6); border-color: …; }

/* 改后 */
.st-bgloader-media-card:hover { border-color: var(--SmartThemeQuoteColor, #4fa3d1); }
.st-bg-mini-btn:hover { color: var(--SmartThemeQuoteColor, #4fa3d1); }
.st-bg-mini-capsule {
    /* 无 box-shadow：层级改由边框表达（用户裁定：投影全部去掉） */
    border: 1px solid rgba(255, 255, 255, 0.15);
}
.st-bg-mini-capsule:hover { border-color: rgba(255, 255, 255, 0.3); }
```

依据：原生缩略图 hover 只改边框/遮罩，不做几何变换；几何变换会让栅格抖动，本就不符原生手感。

### 例外白名单（用户裁定后仅剩一项）

| 保留项 | 理由 |
| --- | --- |
| 媒体类型徽章五色（`--st-bg-badge-*`） | 语义色须跨主题可读，跟随主题会读不出 |
| `.st-bg-native-badge` 的 `rgba(0,0,0,.8)` 底 | 覆盖在任意缩略图上，主题中性是唯一稳妥选择 |

**已移除的例外**：迷你播放器胶囊的 `box-shadow: 0 4px 16px rgba(0,0,0,.4)` 原被列为「悬浮层级投影，非发光」而保留；用户 2026-09-26 裁定**投影全部去掉**，边界改由 `border: 1px solid rgba(255,255,255,0.15)` 承担。同时移除 `.st-bg-mini-capsule:hover` 的投影加深（hover 只改 `border-color`）。

→ 结果：`.st-bg-mini-capsule` 不再有任何 `box-shadow`。须在浅色主题下实测边框可辨性；不足则提高边框对比度，**不得加回投影**。


## 3. P3-10 内联样式清理

### 清理范围与判据

**判据**：行内样式若表达**布局结构**（`display` / `flex` / `gap` / `width` / `height` / `margin` / `padding` / `grid-column`）→ 移入 CSS 类；若表达**动态值**（滑块位置、`option` 的 `selected`、`value`）→ 保留在模板中。

### 具体项

| 位置 | 行内样式 | 处置 |
| --- | --- | --- |
| L95 | `display:flex; flex-direction:column; gap:12px; padding-top:10px` | **删**（双层结构后由 `.st-bgloader-panel` 承担） |
| L101 | `margin-bottom: 6px; opacity: 0.7` | 移入 `.st-bgloader-dropzone i` |
| L123/138/188/200/226/259/302/330/374/382/386 | `font-size:0.9em; flex:0 0 NNpx` | 移入 `.st-bgloader-preset-row > label`（含 `--st-label-w` 修饰类区分宽度） |
| L175/240/338/402/417/989/1048 | `margin-top/border-top/padding-top` 分隔线 | 新增 `.st-bgloader-divider` 类 |
| L279/339/343/347/351/355/359 | checkbox 行 `display:flex; align-items:center; gap:6px` | 新增 `.st-bgloader-check` 类 |
| L394 | `width: 100%` | 新增 `.st-bgloader-btn-full` 类 |
| L446/451-459 | `color:#4fae6b` / `#c9a34f` 状态色 | 移入 `.st-bgloader-status-ok` / `.st-bgloader-status-warn` |
| L360 | `margin-left:18px; font-size:0.9em; opacity:0.85` | 新增 `.st-bgloader-check-sub`（子级缩进） |
| `option` 的 `selected`、滑块 `value` | 动态值 | **保留** |

**净效果**：模板可读性提升、样式单一真源、`updateCloudPanel()` 的 innerHTML 拼接不再夹带配色（`color:#4fae6b` 两处因此类名化而消失）。

### 风险控制

清理项**逐类落地、每类一次 `tsc` 快验**，不做一次性大改；每类提交前在 Dev 实例截图或 DOM 探针确认外观未变。

## 4. 落盘到 spec

新增/扩展 `.trellis/spec/frontend/` 的原生风格规范，内容：

1. **宿主接缝优先**：能用宿主既有机制（内联抽屉委托、`.menu_button`、主题变量）就不得自建。
2. **折叠/展开一律不自建**：禁止在扩展内绑定 `.inline-drawer-toggle`。
3. **溢光禁令**：不得以 `box-shadow` 表达选中/hover；选中态用边框与前景对比。
4. **例外白名单**：语义色徽章、悬浮控件层级投影两处，须注释理由。
5. **行内样式判据**：布局结构→CSS 类；动态值→保留。
6. **主题变量**：颜色/边框/圆角引用 `--SmartTheme*`，保留 fallback。

在 `.trellis/spec/frontend/index.md` 索引中加行。

## 5. 兼容性与回滚

- 仅改 `src/ui/SettingsDrawer.ts`、`src/ui/style.css`，加 `.trellis/spec/frontend/` 文档。
- 不改任何公开 API、设置项、存储格式。
- 回滚：revert 本子任务提交组。

## 6. 未决项

无。用户已于 2026-09-26 就胶囊投影（全部去掉）与选中态表达（边框 + 标题条强调，不复用原生类名）作出裁定。
