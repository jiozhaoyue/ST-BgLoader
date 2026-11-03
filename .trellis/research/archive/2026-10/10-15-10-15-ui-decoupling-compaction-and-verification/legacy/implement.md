# Implementation Checklist

- [x] 1. 架构解耦：新建 `src/ui/UIComponents.ts` 提供统一组件工厂与 rAF 节流绑定
- [x] 2. 抽屉重构：重构 `src/ui/SettingsDrawer.ts`，全面应用 UIComponents 并净化文案与间隙
- [x] 3. 面板重构：重构 `src/ui/TopbarBackgroundDrawer.ts`，全面应用 UIComponents、极简文案与 DocumentFragment 批量挂载
- [x] 4. 浮窗重构：检查并优化 `src/ui/MiniPlayer.ts` 文案与事件解耦
- [x] 5. 样式紧凑：更新 `src/ui/style.css` 压缩各容器 padding/margin，移除冗余 divider 与空白
- [x] 6. 静态检查与构建：通过 `npm run type-check` 与 `npm run build`
- [x] 7. 自动化测试编写：编写 `tests/verify-ui-compact.mjs`，包含无“与”、无括号、无泄漏、紧凑对齐断言与全景截图
- [x] 8. 自动化运行验证：在 Dev Luker 8003 上执行测试并捕获高质量界面截图
- [x] 9. 审查产物并完成提交与远程推送
