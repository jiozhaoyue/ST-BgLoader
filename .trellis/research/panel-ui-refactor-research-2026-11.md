# 面板 UI 重构调研与定案综合（2026-11-19）

- 方法：5 路蜂群只读调研（子代理模型 `new-provider/opencodego/hy4-flash-free` 免费档）+ 10×4 交互问答（40 项全部定案）+ 前置审计（[st-bgloader-full-audit-2026-11.md](./st-bgloader-full-audit-2026-11.md) §6）。
- 蜂群分工：①面板信息架构精读 ②酒馆生态 UI 样板 ③现代设计系统样板 ④图库/媒体类样板 ⑤主题跟随+移动端基线。
- 配套任务工件：`.trellis/workspace/jiozhaoyue/tasks/11-19-panel-ui-refactor/`（prd/design/implement/task.jsonl）。

## 1. 蜂群关键结论（均带出处，原文见各路代理回报）

### ① 信息架构精读（现状事实）
- 面板 20 个功能块、设置 Tab 11 个 section 一屏堆叠（`TopbarBackgroundDrawer.ts` 1572 行、`style.css` 897 行、`UIComponents.ts` 171 行）。
- 工厂只用了一半：`renderSelect`/`renderButton` 在 drawer 内 0 调用；select/button 全部模板手写。
- 网格零虚拟化（`items.forEach` 全量建卡，仅 `max-height:280px` 容器滚动）；视频抽帧 2 并发 + LRU 64。
- 类前缀不统一（`st-bgloader-` 110 处 vs `st-bg-` 43 处）；`--SmartTheme*` 仅 5 种变量、fallback 值多处不一致；全 CSS 零 @media；触摸目标约 20px。

### ② 酒馆生态样板（官方扩展范式）
- Expression Images / Quick Reply / Image Generation 官方三扩展全部为「单列 `.inline-drawer` 折叠 + `<hr>`/块分段 + 操作按钮贴标题行右（`qr--head/qr--actions` 范式）+ 隐藏 file input + `menu_button`」；SD 扩展 650 行单列靠条件显隐而非 tab。
- 酒馆助手（N0VI028/JS-Slash-Runner，1446★）：原生抽屉外壳 + 内部自定义 5 tab（`bg-[color-mix(...var(--SmartThemeQuoteColor)...)]` 选中态）——「原生壳+自定义内部」可行先例。
- LenAnderson/SillyTavern-VideoBackgrounds（20★）：零设置控件纯说明抽屉，靠文件命名约定 hacky 实现。
- Luker（funnycups/Luker，566★）：扩展 seam 与 ST 完全一致（`frontend-plugin.md:110-127`），移动端适配更细（`mobile-styles.css` 多档精确断点）。

### ③ 现代设计系统样板
- shadcn `Field` 结构（Label+Control+Description+Error）与 `data-[state=on]` 属性状态机；Radix SegmentedControl `inline-grid; grid-auto-flow: column` 等宽分段 + `:focus-visible` outline 规范；M3 行高由行数决定（56/72/88px）。
- Vercel Web Interface Guidelines：`:focus-visible`/`:focus-within`、命中目标（桌面≥24px/移动 44px）、`overscroll-behavior: contain`（modals/drawers）、`prefers-reduced-motion`、Never `transition: all`、Inline help first。
- VS Code/Raycast：设置搜索/过滤/`@modified` 高亮；Apple HIG：渐进披露、子菜单单层、状态标签合并。
- 未核验（如实标注）：Linear/Notion/Arc/Figma 设置 IA 一级正文未能取得（404/空抽取），未纳入模式提炼。

### ④ 图库/媒体类样板
- Wallhaven API：筛选全部参数化（categories/purity/sorting/q…）；Immich 能力表：`Virtual scroll`、`Scrubbable scrollbar`、Tags/Albums/Favorites。
- 前端实现层（证据最硬）：MDN content-visibility（离屏跳过渲染，保留可访问性树）+ web.dev 实测 232ms→30ms（7x）；MDN IntersectionObserver（rootMargin 200px 前瞻 + unobserve 去重）；原生 `loading="lazy"`。
- 未核验：Eagle/Billfish/Wallpaper Engine/Google Photos 选择工具栏/macOS Quick Look 的逐像素交互（SPA/404/429），主代理需浏览器实机复核才能引用——本次仅采其「能力清单」级结论。

### ⑤ 主题跟随 + 移动端基线
- 主题机制：宿主 `applyThemeColor` 把主题色写为 `documentElement` 内联 CSS 变量 → 切主题时所有 `var()` 引用自动重算 → **纯 CSS 引用即可跟随，无需 JS 监听**（需 JS 的仅限非颜色态）。
- 官方变量全集（power-user.js）：BodyColor/EmColor/UnderlineColor/QuoteColor/BlurTintColor/ChatTintColor/User|BotMesBlurTintColor/ShadowColor/BorderColor + `--blurStrength/--shadowWidth/--fontScale`。本仓已用 5 种；其余未引用非必需。
- 断点权威：宿主官方 `mobile-styles.css` 主断点 **1000px**、小屏 **450px**（Luker 同款+更细分档）；抽屉窄屏全宽 `100dvw`、`max-height:calc(100dvh - 45px)`、滚动容器 `overflow-y:auto; overflow-x:hidden`。
- 官方触摸目标数值：docs 无专门规范（仅 `6em`/`100px` 语义不同条目）；36/44px 属通用惯例，本项目按问答定案取 ≥36px（已标注非官方出处）。

## 2. 问答定案（40 项，10 批次）

| 批次 | 定案 |
|---|---|
| 1 总纲 | 四面全部重做；渐进披露；增强式内嵌；维持边框方案（G-18 项目豁免） |
| 2 信息架构 | 双 Tab+分组折叠；功能域五组；三快捷+场景下拉；场景入媒体 Tab |
| 3 媒体库 | 悬停显现；批量删+批量换；懒加载+窗口化；分段胶囊 |
| 4 移动端 | 本轮必须；全屏接管；≥36px；同断点同步 |
| 5 演出类 | 面板内折叠；BGM 全量+折叠；触发器行内开关；不分层 |
| 6 合规 | a11y 三处全修；官方 Popup；文案全量清理；z-index 语义分档 |
| 7 主题 | 语义层派生；fallback 统一主流值；纯 CSS 跟随；底色透明融入 |
| 8 实现 | 模板+工厂强化；CSS 分文件构建合并；绑定器可解绑；全量重渲+窗口化 |
| 9 性能流程 | 首渲<50ms；探针+截图双轨；全量回归+新增；分阶段提交 |
| 10 样板 | 酒馆原生同构；行式布局；悬停信息条；自由折叠+记忆 |

## 3. 采纳映射（蜂群结论 → 实现落点）

| 蜂群证据 | 落点 |
|---|---|
| 官方单列折叠范式 + qr--actions 贴行右 | 设置 Tab 五组 `renderGroup`；组头右 `actions` 插槽（预留） |
| shadcn/Radix data 属性状态机 | 折叠组 `data-open`、分段 `data-seg-value`、激活类 `.active` |
| M3 行高由行数决定 / Apple 行式 | `renderRow` 行式布局（标题左+控件右，`min-height:36px`） |
| Vercel overscroll/reduced-motion/focus-visible | `07-responsive.css` 三件套；`01-base.css` `:focus-visible` 环 |
| content-visibility 7x + IntersectionObserver 200px | `03-media-grid.css` `content-visibility:auto; contain-intrinsic-size:auto 92px`；`observeGridLazyLoad()` |
| 宿主断点 1000/450 + 100dvw | `07-responsive.css` 两断点；桌面窄窗同断点自然生效 |
| 主题纯 CSS 变量跟随（power-user.js 机制） | `00-tokens.css` 唯一 fallback 书写点，语义层 `--st-bg-*` 派生 |
| Radix `:focus-visible` outline 规范 | 分段/折叠/面板全局 focus 环（accent 色） |
| Apple「状态标签合并」 | 顶栏场景快切下拉（Show/Hide 合一） |

## 4. 遗留与未核验（如实标注）

- 图库类与商业产品的逐像素交互未核验（见 ④），已用「能力清单」级结论；如需更细参照需浏览器实机截图。
- 触摸目标 ≥36px 为通用惯例值（官方无数值规范），已按问答定案执行并在 spec 标注。
- 视频抽帧未接 `contentvisibilityautostatechange`（懒挂载已避免离屏生成，按 YAGNI 跳过，留待 profiling 有据再加）。
- AGENTS.md G-18 豁免声明与 spec §9.2 增强式内嵌同步：随本任务 docs 阶段落地。
