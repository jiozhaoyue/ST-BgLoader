# fix-extension-drawer-alignment-and-toggle

## Goal

Fix extension settings drawer width alignment and toggle expand/collapse behavior to strictly match native host drawers, with automated visual and width verification.

## Requirements

1. **DOM 结构与类名标准规范**:
   - 扩展设置面板外层容器使用 `<div id="st_bgloader_container" class="extension_container" data-extension-name="ST-BgLoader">`，完全契合 SillyTavern 与 Luker 宿主规范；
   - 抽屉采用标准 `<div id="st_bgloader_settings" class="inline-drawer">`，移除外层 `.st-bgloader-panel` 所附带的 `padding: 10px` 与 `gap: 15px` 导致的宽度缩水与内缩死区；
   - 抽屉标题栏与触发器采用 `.inline-drawer-toggle.inline-drawer-header`，内部包含图标、双语国际化标题与 `.inline-drawer-icon` 旋转箭头；
   - 抽屉内容区采用 `.inline-drawer-content`，内嵌 `.st-bgloader-master-card` 主控面板。

2. **宽度对齐与视觉一致性**:
   - ST-BgLoader 在 `#extensions_settings` 中的标题栏宽度必须与同列相邻扩展（如 `Silence Player`、`regex` 等）完全一致（像素误差绝对值 < 1px）；
   - 移除导致内缩 20px 的多余外层 padding，恢复与酒馆所有原生及第三方扩展一致的左右对齐和边距。

3. **抽屉展开与折叠交互可靠性**:
   - 点击抽屉标题栏任意区域均能流畅展开与折叠 `.inline-drawer-content`，箭头图标正常切换 `down` / `up`；
   - 无缝接入宿主 jQuery 事件委托 (`$(document).on('click', '.inline-drawer-toggle')`)；
   - 具备安全回退机制：当宿主委托未响应或在无 jQuery 宿主环境下，自动平滑切换展开/折叠，且与宿主原生机制互斥不冲突，杜绝双重触发。

4. **全面自动化测试与截图验证**:
   - 编写自动化 E2E 验证脚本，针对正在运行的 Dev Luker 实例进行无头/自动化浏览器断言：
     - 精确断言 `#st_bgloader_settings .inline-drawer-header` 宽度与相邻扩展的误差 < 1px；
     - 自动化触发展开与折叠，断言 `.inline-drawer-content` 高度与可见性状态；
     - 捕获高分辨率对齐与展开对比截图并输出到 artifacts 目录。

## Acceptance Criteria

- [x] C1: `SettingsDrawer.ts` DOM 结构重构为标准的 `.extension_container` + `.inline-drawer` + `.inline-drawer-toggle.inline-drawer-header` + `.inline-drawer-content`。
- [x] C2: 样式表 `style.css` 调整，消除 `#extensions_settings` 中外层容器的不当 padding 与 flex 挤压，确保宽度与相邻扩展完全相同（delta < 1px）。
- [x] C3: 展开/折叠逻辑具备高可靠性，在原生宿主下正常触发展开折叠动画，且有安全回退保障。
- [x] C4: 构建构建产物 `npm run build`，并通过 TypeScript 类型检查 (`npm run type-check`)。
- [x] C5: 运行自动化 E2E 测试脚本，宽度对齐与展开折叠全绿通过，并生成折叠与展开的高清截图产物。

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
