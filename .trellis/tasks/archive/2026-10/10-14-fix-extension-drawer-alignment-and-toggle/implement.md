# Implementation Plan: 修复扩展设置面板对齐与展开交互

- [x] C1: 重构 `src/ui/SettingsDrawer.ts` DOM 结构与挂载方式
  - 将外层根元素改为 `<div id="st_bgloader_container" class="extension_container" data-extension-name="ST-BgLoader">`
  - 内部嵌套 `<div id="st_bgloader_settings" class="inline-drawer">`
  - 增加双通道安全折叠事件处理逻辑
- [x] C2: 调整 `src/ui/style.css` 抽屉与卡片样式
  - 确保 `#st_bgloader_container` 保持 0 padding/margin，确保子 drawer 填满整列
  - 保持 `.st-bgloader-master-card` 在 `.inline-drawer-content` 中美观居中
- [x] C3: 构建产物并进行类型检查
  - 运行 `npm run build`
  - 运行 `npm run type-check`
- [x] C4: 全面自动化 E2E 测试与截图验证
  - 编写并运行自动化断言测试：比对 ST-BgLoader 与同列相邻扩展的宽度（assert delta < 1px）
  - 测试并断言点击展开与折叠的状态切换（height, display, icon class）
  - 捕获高分辨率对比截图（折叠对齐图、展开图）并保存至 artifacts 目录
- [x] C5: 收口质检与会话归档
