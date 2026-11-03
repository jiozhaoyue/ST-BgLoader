# 夺舍顶栏背景设置与单开关设置面板

## Goal

夺舍 4 种酒馆（SillyTavern, Luker, PureTavern, TauriTavern）顶栏背景设置抽屉（`#Backgrounds`），在抽屉内提供统一的「背景媒体库」与「详细设置」标签页；在插件列表设置面板（`#extensions_settings`）中仅保留一个总开关与直达按钮；视觉与交互风格与宿主完全一致。

## Requirements

1. **R1 统一 HostBridge 抽象层 (`src/bridge/HostBridge.ts`)**：
   - 按照仓群规则 L0-9，集中封装 4 种酒馆的宿主探测、DOM 挂载点选择器（`#backgrounds-button`、`#Backgrounds`、`#bg_menu_content`、`#extensions_settings`）、CSRF Header 获取及环境变量差异。业务层禁止直接探测宿主类型。

2. **R2 顶栏背景抽屉原位夺舍 (`#Backgrounds`)**：
   - 点击顶栏背景按钮时，利用酒馆原生抽屉动画原位展开 `#Backgrounds`。
   - 在插件启用状态下，原位接管 `#Backgrounds` 抽屉内部结构：隐藏原生旧内容，注入统一的酒馆风格面板 (`#st_bgloader_topbar_panel`)。
   - 面板顶部提供标签页切换：「背景库」与「详细设置」，以及搜索、上传、关闭等原生风格操作栏。
   - 面板尺寸自适应宿主抽屉宽度，滚动与手势与原生完全一致。

3. **R3 背景媒体库（与原版同一后端存储）**：
   - 复用 `ServerOrigin`，与酒馆原生 `/api/backgrounds/` 完全同源同目录存储。
   - 完整展示图片、视频、音频、HTML5、SVG 等所有富媒体卡片。
   - 支持拖拽/文件上传与远程 URL 导入。
   - 卡片显示类型徽章、当前选中高亮标记、删除按钮。
   - 支持「设为全局背景」与「锁定到当前对话」语义。

4. **R4 详细设置抽屉集成**：
   - 将原本散落于 `#extensions_settings` 的全套高级功能移入「详细设置」标签页：
     - 视觉调节（滤镜、模糊度、亮度、对比度、预设保存）
     - 天气与环境粒子（下雨、飘雪、樱花、余烬、迷雾等）
     - 动态音频可视化（波形、频谱柱、粒子环等）
     - 3D 视差微动（强度、反转）
     - BGM 音频引擎与环境音效生成器
     - 视听全景预设（Scenes）
     - 平滑转场特效与毛玻璃对话框
     - 缓存限额与动态触发器（Triggers）
     - 云端设置同步与 Agent 工具开关

5. **R5 扩展列表界面极简单开关**：
   - 在 `#extensions_settings` 中，ST-BgLoader 仅渲染一个极简卡片：
     - 一个启用/禁用总开关（Master Toggle）
     - 状态摘要（当前背景名称与接管状态）
     - 「打开背景与详细设置」便捷直达按钮（点击自动触发顶栏背景抽屉打开）

6. **R6 平滑降级与一键回退**：
   - 当用户在扩展列表中关闭总开关时，立即卸载顶栏接管，恢复原生 `#Backgrounds` 内容，宿主背景管理无缝回退为原版行为。

7. **R7 原生视觉与零溢光规范**：
   - 严格遵循 `host-native-ui.md` 与规则 L0-10：
   - 配色一律采用 `--SmartTheme*` 变量（提供回退值），按钮全部采用 `.menu_button`，输入框采用 `.text_pole`。
   - 严禁任何 `box-shadow` 溢光按钮特效；选中态采用 2px 边框与对比度表达。

8. **R8 零回归**：
   - `npm run type-check` 与 `npm run build` 必须无报错通过。
   - 产物 `dist/index.js` 和 `dist/style.css` 正确构建并提交。

## Acceptance Criteria

- [x] `HostBridge` 模块完成，正确识别并适配 4 种酒馆环境与挂载点。
- [x] 顶栏背景按钮点击后展开 `#Backgrounds`，展示背景库与详细设置标签页。
- [x] 背景库卡片正确加载与原生同源的背景文件（视频、音频、图片、HTML、SVG），点击可应用。
- [x] 详细设置内包含视听滤镜、天气、音乐、预设、转场等全部完整配置项。
- [x] 扩展设置面板（#extensions_settings）仅显示一个总开关与直达按钮。
- [x] 关闭总开关后，顶栏背景抽屉立即恢复为原生酒馆背景选择器。
- [x] 界面与酒馆原生 UI 风格 100% 融合，无任何 `box-shadow` 溢光特效。
- [x] `npm run type-check` 与 `npm run build` 成功。

## Notes

- 严格遵循 Trellis 与仓群规则（L0-1 实例隔离、L0-4 块级编辑、L0-9 宿主桥接、L0-10 样式隔离、L0-11 纯前端降级）。
