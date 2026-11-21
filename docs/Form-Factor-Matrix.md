# 全形态 × 分辨率断点差异矩阵

> 本文记录 ST-BgLoader 各 UI 形态在不同视口宽度下的真实布局差异与控件可用性。
> 目的：让「全形态全分辨率差异」成为可查阅文档，杜绝静默设计喵。
> 本文只描述实现中真实存在的断点与规则；实现未定义的差异一律标注「无专门规则」，不作推测。

---

## 一、事实真源（实现依据）

| 事实 | 源码位置 |
| :--- | :--- |
| 主断点 `max-width: 1000px` | `src/ui/styles/07-responsive.css:9` |
| 小屏断点 `max-width: 450px` | `src/ui/styles/07-responsive.css:25` |
| 纯宽度断点，无 UA 嗅探（问答定案「同断点同步」） | `src/ui/styles/07-responsive.css:4` |
| 窄屏随宿主抽屉 100dvw 全屏接管（宿主置 `.drawer-content`） | `src/ui/styles/07-responsive.css:5` |
| 滚动链约束 `overscroll-behavior: contain` | `src/ui/styles/07-responsive.css:47-51` |
| 减弱动效降级 `prefers-reduced-motion` | `src/ui/styles/07-responsive.css:56-65` |
| 触摸目标下限 `--st-touch-min: 36px` | `src/ui/styles/00-tokens.css:44` |
| 令牌单一真源与语义派生层 | `src/ui/styles/00-tokens.css:13-40` |
| 断点规格复述（1000 / 450 / 36px） | `.trellis/spec/frontend/host-native-ui.md:359` |

> 层叠说明：`450px` 与 `1000px` 均为 `max-width` 规则，视口 `<450px` 时两条同时命中，
> 故「小屏」格同时包含「窄屏」格的全部规则，再叠加 450px 专属规则。

---

## 二、三档断点定义

| 档位 | 视口宽度 | 命中规则 |
| :--- | :--- | :--- |
| A · 宽屏 | `>1000px` | 无响应式覆盖，走各组件基线样式 |
| B · 窄屏 | `450px–1000px` | 命中 1000px 规则 |
| C · 小屏 | `<450px` | 同时命中 1000px 与 450px 规则 |

---

## 三、主矩阵：全形态 × 三档断点

> 「控件可用性」列在同一行的三格中逐格说明。所有档位下触摸目标下限 36px 均不变。

| 形态 | A · 宽屏 `>1000px` | B · 窄屏 `450–1000px` | C · 小屏 `<450px` |
| :--- | :--- | :--- | :--- |
| **桌面** | 全套 UI 基线布局；顶栏抽屉高 420px 起、上限 85vh（`02-topbar-drawer.css:11-12`）；鼠标精确点击，全部控件可用 | 桌面窄窗走同一套纯宽度断点（`:4`），表现与移动端窄屏一致：顶栏面板放开高度上限、媒体网格限高 40vh；全部控件可用 | 极窄桌面窗同移动端小屏规则：网格 96px 列、工具条折行；全部控件可用，触摸目标仍 ≥36px |
| **移动端** | 横屏或平板大屏走基线，表现与桌面宽屏一致 | 命中 1000px 规则：面板放开 `max-height`、网格 `40vh`、头部 padding 收紧为 `6px 8px`；控件可用，触摸目标 ≥36px | 叠加 450px 规则：网格列 `minmax(96px,1fr)`、分段控件折行、卡片占位 54px；随宿主抽屉 100dvw 全屏接管；控件可用 |
| **顶栏抽屉**（媒体 / 设置双 Tab） | 基线：两 Tab 常显；顶栏含场景快切、显示隐藏、清除按钮（`TopbarBackgroundDrawer.ts:230-244`）；网格默认列；控件全可用 | `min-height` 降为 320px、`max-height:none`（`:10-13`）；头部 `padding:6px 8px`、`gap:6px`（`:19-22`）；网格 `max-height:40vh`（`:15-17`）；控件全可用 | 叠加网格 96px 列、`gap:6px`、`.st-bgloader-seg` 折行（`:26-38`）；滚动链 `contain`；Tab / 快切 / 眼睛 / 清除均可用，快捷钮 36×36 |
| **设置抽屉**（`#extensions_settings`） | 无专门断点规则；基线为 `display:contents` 容器 + 宽 100% 内联抽屉（`:76-95`）；单主开关 + 状态胶囊 + 直达按钮；可用 | 同 A，无专门规则；主开关 label 触摸目标 ≥36px（`04-settings-groups.css:118`） | 同 A，无专门规则；整行铺满、主开关与直达按钮可用，触摸目标 ≥36px |
| **全屏**（宿主抽屉窄屏接管） | 不适用：宿主抽屉非全屏，插件无独立全屏模式 | 宿主将 `.drawer-content` 置 100dvw（`:5`）；插件侧仅放开自身高度上限并收敛滚动，不强制全屏 | 同 B，宿主全屏接管；插件面板随宿主全屏，网格与工具条按小屏规则收敛；控件可用 |
| **mini 播放器**（悬浮胶囊） | 无宽度断点规则；基线 `fixed` 右下 20px、`z-index:var(--st-z-float)`（`05-miniplayer.css:10-18`）；按钮 36×36（`:62-63`）；播放时显现 | 同 A，无宽度断点差异；位置与尺寸不变，控件可用 | 同 A，无宽度断点差异；仅受减弱动效影响移除过渡；控件可用 |

---

## 四、逐形态补充说明

### 4.1 顶栏抽屉（受断点影响最大的形态）
- 1000px 规则只作用于 `.st-bgloader-topbar-panel`、`.st-bgloader-media-grid`、`.st-bgloader-topbar-header` 三个选择器（`07-responsive.css:10,15,19`）。
- 450px 规则只作用于 `.st-bgloader-media-grid`、`.st-bgloader-seg`、`.st-bgloader-media-card` 三个选择器（`:26,31,35`）。
- 卡片 `contain-intrinsic-size:auto 54px`（`:37`）用于消除 96px 列下 16:9 卡片的滚动跳动（源码注释标注红队 P1-3）。

### 4.2 设置抽屉与原生装饰
- 设置抽屉、原生网格徽标（`.st-bg-native-badge` 等，`06-native-decor.css:8-55`）在三档下均无断点规则，表现一致。
- 原生接管选中态用 2px accent 描边表达层级（`06-native-decor.css:40-43`），不用阴影。

### 4.3 全屏
- 「全屏」不是插件独立模式；实现依据是宿主在窄屏把抽屉设为 100dvw（`07-responsive.css:5`）。
- 插件不主动申请全屏、不写全屏 API；只做放开高度上限与收敛滚动。

### 4.4 mini 播放器
- 位置、尺寸、层级在三档下完全一致；唯一跨档影响来自 `@media (prefers-reduced-motion: reduce)` 移除其 `transition`（`07-responsive.css:60`）。

---

## 五、三档通用的全局规则

| 规则 | 说明 | 依据 |
| :--- | :--- | :--- |
| 触摸目标 ≥36px | 由 `--st-touch-min` 统一提供，覆盖 Tab、场景快切、场景条下拉、快捷钮、触发器行、主开关、mini 按钮 | `00-tokens.css:44`；`02-topbar-drawer.css:52,136,157,164`；`04-settings-groups.css:45,118`；`05-miniplayer.css:62-63` |
| 滚动链约束 | 顶栏主体、媒体网格、触发器列表设 `overscroll-behavior:contain`，防滚动穿透宿主 | `07-responsive.css:47-51` |
| 减弱动效 | 系统开启减弱动态效果时移除卡片、Tab、分段钮、mini 播放器、折叠箭头、投放区过渡 | `07-responsive.css:56-65` |
| 主题跟随 | 纯 CSS，无 JS 主题态；组件只引 `--st-bg-*`，`--SmartTheme*` 仅限 `00-tokens.css` | `00-tokens.css:4-10`；项目覆盖规则 |

---

## 六、未在本文出现的形态（如实标注）

- 本仓无独立「全屏播放器」「画中画」「独立窗口」形态，矩阵不虚构此类条目。
- 本仓无 JS 主题切换、无 i18n 语言切换、无 UA 嗅探对应分支；相关差异不在本文范围。
- 断点仅覆盖宽度与系统动效偏好；宿主主题差异见设置与令牌文档。

*本文所有断点、选择器与数值均来自上表所列实现文件；未实测项已标注「无专门规则」，未以推测填充。*
