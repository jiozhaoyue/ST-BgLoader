# Design：面板 UI 四面重构（11-19-panel-ui-refactor）

> 依据：prd.md 定案表 + 蜂群 5 路调研（样板出处见 §8）。约束来源：.trellis/spec/frontend/host-native-ui.md 全文。

## 1 设计基调：酒馆原生同构

蜂群核验（scout 酒馆生态）：官方扩展（Expression/QuickReply/SD）全部为「单列 inline-drawer 折叠组 + menu_button 贴行右 + Font Awesome + 宿主样式类」；酒馆助手是「原生抽屉外壳 + 自定义内部」的可行先例。我们取前者为基调，理由：永随宿主演进、零同步债、天然符合 host-native-ui §1。

**模式映射表**

| 采用模式 | 样板来源 | 落点 |
|---|---|---|
| 单列折叠组 | 官方扩展 inline-drawer 范式 | 设置 Tab 五组（我们自绘折叠头，行为对齐原生：不写 display，slideToggle 语义见 §2.4） |
| 标题右操作条 | QuickReply `qr--head/qr--actions` | 组头右侧组级按钮（如场景组「导入导出」收为图标钮） |
| 隐藏 file input + menu_button 触发 | 官方扩展 | 上传/导入入口 |
| 行式控件行 | shadcn/Apple HIG 设置行 | 全部设置项「标题左+控件右」，滑条值右对齐 |
| 悬停信息条 | Wallhaven/图库类（scout 图库） | 媒体卡片 |
| content-visibility 窗口化 | web.dev 实测 232ms→30ms | 网格性能 |
| 分段胶囊 | shadcn Segmented / 官方 tab 样式 | 类型过滤 |

## 2 信息架构

### 2.1 顶栏抽屉总体

```
#Backgrounds（原生抽屉，宿主外壳不动）
 ├─ 原生背景网格区 #bg_menu_content（完全保留可见可用：上传/文件夹/多选/锁定）
 └─ .st-bgloader-topbar-panel（我们的增强面板，挂载其后；底色透明融入）
     ├─ header：双 Tab（媒体/设置）+ 三快捷（显隐/清除/收起）+ 场景快切下拉
     ├─ Tab 媒体：
     │   ├─ 工具条：分段胶囊类型（全部/图/视频/音频/文档）+ 排序 + 搜索 + 上传钮
     │   ├─ 场景条：快切下拉 + 应用/保存/删除 + 导入导出（图标钮）
     │   ├─ 多选条（进入多选态出现）：已选 n · 批量删 · 批量换（顺序/随机） · 退出
     │   └─ 网格：悬停信息条 + 懒挂载 + content-visibility
     └─ Tab 设置：五组折叠（自由折叠+记忆）
         1 画面：滤镜（滑条×4+预设）、毛玻璃、转场
         2 氛围：天气、动效（律动/视差）、音效
         3 声音：音乐（音量/模式/胶囊）、轮播（默认折叠）
         4 自动化：触发器（列表+行内开关，行点击展开编辑）
         5 系统：存储（配额/清理/备份）、云端（Agent 导演）
```

### 2.2 双入口策略（增强式内嵌核心）

- 原生网格与我们的库网格**共存**：原生网格继续由宿主管理（图片选择/文件夹/多选），我们的网格提供全类型（视频/音频/HTML/SVG/图片）管理+激活+批量。
- 激活收敛同源：两路激活都经既有接管逻辑（NativeBackgroundController §8.2 分支不动），#bg1 抑制规则不变。
- 文案区分：原生网格上不加载任何我们的文案；我们面板头部状态行标明「当前」来源类型。

### 2.3 折叠组行为

- 自绘折叠头（`.st-bg-group`）：点击切 `data-open` + `max-height` 动画？——**不用 max-height/display 动画**，与宿主 inline-drawer 契约对齐：我们不用宿主 slideToggle（那属于 `.inline-drawer-toggle`，禁绑 §1），自绘组用 `grid-template-rows 0fr/1fr` 过渡或直接无动画切换 `hidden` 属性（`[hidden]{display:none}` 作用于内容包装层，不碰宿主管辖元素）。**开闭状态存 localStorage（`st_bgloader_group_state`），不进 settings。**
- 默认开闭：画面=开（高频）；氛围/声音/自动化/系统=合。轮播子块默认合。

### 2.4 SettingsDrawer / MiniPlayer / 原生装饰

- SettingsDrawer：结构不变（主开关+状态+直达钮），行式重排，文案合规，仍走宿主 inline-drawer 委托（§9.3 契约全保留）。
- MiniPlayer：样式接语义变量（底色 color-mix(BlurTint)），z-index 用 `var(--st-z-float)`。
- 原生装饰徽标：颜色保留语义例外清单（spec §4 不随主题），但位置/圆角/边框接 token。

## 3 CSS 架构

### 3.1 文件拆分（Vite 多入口合并，产物仍 dist/style.css 单文件）

```
src/ui/styles/
  00-tokens.css        语义变量 + fallback 基准 + z-index 分档 + 语义色例外（spec §4 迁入）
  01-base.css          前缀基类 / 行式布局行 / 按钮 / 分段胶囊 / 折叠组
  02-topbar-drawer.css 面板骨架 / header / tab / 工具条
  03-media-grid.css    网格 / 卡片 / 悬停信息条 / 多选条 / 空态
  04-settings-groups.css 五组表单行 / 滑条 / 开关
  05-miniplayer.css    悬浮胶囊
  06-native-decor.css  原生网格徽标 / 选中标记
  07-responsive.css    @media (max-width:1000px) 全屏接管 / (max-width:450px) 小屏 / 触摸目标 ≥36px
```
style.css 原文件变为聚合入口（`@import` 七件）或由 index.ts 改 import 00~07——**取聚合入口方案**（index.ts 不动，分发产物结构不变）。

### 3.2 语义层（00-tokens.css）

```css
.st-bgloader-panel, .st-bg-mini-player, .st-bg-native-badge {
  /* 派生层：唯一书写点，fallback 统一基准 */
  --st-bg-text:    var(--SmartThemeBodyColor, #e0e0e0);
  --st-bg-border:  var(--SmartThemeBorderColor, rgba(255,255,255,0.1));
  --st-bg-accent:  var(--SmartThemeQuoteColor, #4fa3d1);
  --st-bg-surface: var(--SmartThemeBlurTintColor, #1e1e24);
  --st-bg-warn:    #ff5252;           /* 语义例外：警示恒定（spec §4） */
  /* z-index 分档 */
  --st-z-badge: 1; --st-z-header: 10; --st-z-float: 9990;
}
```
- 组件 CSS **只允许**引用 `--st-bg-*`；直接引用 `--SmartTheme*` 仅限 00-tokens 一处。
- 现有 5 处 `--st-bg-badge-*` / `--st-bg-status-*` 语义例外原样迁入 00-tokens（带 why 注释）。
- 面板底色：`background: transparent`（融入宿主抽屉），卡面用 `color-mix(in srgb, var(--st-bg-accent) 6%, transparent)` 类的轻表面层。

### 3.3 响应式（07-responsive.css）

- 断点与宿主官方一致：`@media screen and (max-width:1000px)`（抽屉随宿主全宽 `100dvw`，面板高度 `calc(100dvh - 45px)` 内滚动，`overflow-y:auto; overflow-x:hidden`）；`@media screen and (max-width:450px)`（网格 minmax 130→96px、工具条折行）。
- 触摸目标：`--st-touch-min: 36px`；卡片钮/快捷钮/tab `min-width:min-height:36px`（桌面 hover 环境不受影响，仅尺寸下限）。
- 桌面窄窗同断点自然生效（纯宽度条件，无 UA 嗅探）。

## 4 组件工厂（UIComponents 强化）

- **接入率 100%**：renderSelect / renderButton 替换 drawer 内全部手写 select/button（审计：工厂在 drawer 内 0 调用）。
- 新增：
  - `renderRow(opts)`：行式布局行（label 左 + 控件右，label 支持 icon）。
  - `renderGroup(opts)`：折叠组（id 作记忆 key，读 localStorage 初始态，头右插槽 actionsHtml）。
  - `renderSegmented(opts)`：分段胶囊（单选，返回按钮组）。
  - `renderToolbar(opts)`：工具条容器。
- 绑定器改造：`bindRafSlider` 等返回 `() => void` 解绑函数；`mountPanel()` 统一先 teardown 旧绑定再渲染（修复审计「无 cleanup」面）。

## 5 交互与弹窗

- **批量操作**：网格进入多选态（工具条「多选」钮或长按）→ 卡片点击切换选中（accent 边框+对勾角标）→ 浮动操作条：批量删（HostBridge 弹窗适配器确认）／批量换（顺序=替换轮换列表；随机=随机激活一张）→ 退出恢复单选。
- **弹窗适配器**（HostBridge 新增 `confirmDialog()`）：优先宿主 `callGenericPopup`（官方 Popup，D-06）→ 异常降级原生弹窗（bridge 层，不属 src/ui 弹窗门禁面）→ 永不 throw。全部 6+ 处 alert/confirm/prompt 迁入。
- **a11y 三处**：删除钮 `aria-label`；dropzone `tabindex=0` + Enter/Space 触发文件选择 + `role=button`；全局 `:focus-visible` 用 accent 边框。
- **文案**：按 §10.2 纪律全量重写（1-4 字标题；禁括号/斜杠/连词/长句）。

## 6 性能方案

- 网格：IntersectionObserver（rootMargin 200px）懒挂载卡片内容；`content-visibility:auto` + `contain-intrinsic-size: auto 96px`（16:9 占位）；`contentvisibilityautostatechange` 暂停/恢复视频抽帧。
- 搜索/过滤后全量重渲维持（窗口化后成本可控），rAF 合帧保留。
- 首渲 <50ms：e2e performance 计时（打开抽屉→网格可见）。

## 7 样板与机制出处（蜂群证据）

- 官方扩展范式：SillyTavern release expressions/quick-reply/stable-diffusion settings.html（raw 源码核验）。
- 原生壳+自定义内部：N0VI028/JS-Slash-Runner Panel.vue（1446★）。
- Luker seam 一致性：funnycups/Luker docs/development/frontend-plugin.md:110-127。
- content-visibility：MDN + web.dev（232→30ms）；IntersectionObserver：MDN（rootMargin/unobserve）。
- 断点权威：宿主 mobile-styles.css 1000px/450px（Luker release 同款+更细分档）。
- 主题变量全集：宿主 power-user.js applyThemeColor（官方主题 JSON 键一一对应）；纯 CSS 变量自动跟随（:root 内联变量重算）。

## 8 明确不做

- 不引框架/库；不用宿主源码内部 API；不写宿主全局选择器（双前缀维持）；不做主题 JS 监听；不动 core/API。
