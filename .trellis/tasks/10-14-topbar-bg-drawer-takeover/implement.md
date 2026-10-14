# 夺舍顶栏背景设置与单开关设置面板 — 执行计划

- [x] **Phase 1: 宿主桥接层 (HostBridge)**
  - [x] 1.1 创建 `src/bridge/HostBridge.ts`，实现 4 种酒馆（SillyTavern/Luker/PureTavern/TauriTavern）的探测与 DOM 选择器抽象。
  - [x] 1.2 接入 CSRF 请求头获取逻辑，重构 `ServerOrigin.ts` 消除分散的宿主环境读取。

- [x] **Phase 2: 顶栏抽屉接管面板 (TopbarBackgroundDrawer)**
  - [x] 2.1 创建 `src/ui/TopbarBackgroundDrawer.ts`，实现 `#Backgrounds` 原位夺舍生命周期（挂载/卸载/原生显隐控制）。
  - [x] 2.2 组装 Tab 1「背景媒体库」：网格渲染、上传导入、类型筛选与当前激活高亮。
  - [x] 2.3 组装 Tab 2「详细设置」：视听调节、环境天气、音频频谱、视差、BGM与环境音、全景预设、转场、毛玻璃、触发器与缓存管理。

- [x] **Phase 3: 扩展设置列表面板极简化 (SettingsDrawer)**
  - [x] 3.1 重构 `src/ui/SettingsDrawer.ts` 为单一总开关面板：仅保留主开关、状态提示与「打开背景与详细设置」直达按钮。
  - [x] 3.2 联动主开关与 `TopbarBackgroundDrawer` 的挂载/还原生命周期。

- [x] **Phase 4: 原生样式与零溢光规范 (style.css)**
  - [x] 4.1 补充顶栏抽屉夺舍面板与 Tab 的样式，全部使用 `--SmartTheme*` 配色。
  - [x] 4.2 校验确保无任何 `box-shadow` 溢光特效，保持 100% 酒馆原生观感。

- [x] **Phase 5: 全局装配与构建验证**
  - [x] 5.1 在 `src/index.ts` 中整合所有子系统与回调。
  - [x] 5.2 运行 `npm run type-check` 与 `npm run build` 确保零错误通过。
