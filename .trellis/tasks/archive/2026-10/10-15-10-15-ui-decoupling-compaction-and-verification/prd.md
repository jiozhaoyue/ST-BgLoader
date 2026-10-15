# 10-15-ui-decoupling-compaction-and-verification

## Goal

UI组件解耦复用、紧凑文案重构、性能节流优化与全量自动化截图审计

## Requirements

- **UI组件解耦与复用**: 新增 `src/ui/UIComponents.ts` 抽象工厂，统一封装 section、slider、select、checkbox、button 等原子组件，完全消除重复的 HTML 拼装与事件冗余绑定。
- **文案极简硬约束**: 严禁长句、说明副标题、括号解释（`(...)`/`（...）`）及“与”字组合；所有按钮与标题控制在2-4字以内（如“场景”、“滤镜”、“动效”、“天气”、“音效”、“毛玻璃”、“转场”、“音乐”、“触发器”、“存储”、“云端”）。
- **零冗余紧凑布局**: 消除多余 divider 与大空白间隔，面板 padding/margin 收敛为紧凑精致形态，消除一切大间隙。
- **性能深度节流优化**: 滑块调节、滤镜刷新与视差事件使用 `requestAnimationFrame` 节流；列表渲染采用 `DocumentFragment` 批量挂载。
- **自动化测试与全量截图审计**: 在测试中截取设置抽屉、顶栏面板、媒体库与MiniPlayer截图，程序化断言无HTML泄漏、无长句违规、无“与”字、无括号说明、无颠倒和大空白。

## Acceptance Criteria

- [ ] 新建 `src/ui/UIComponents.ts`，重构 `SettingsDrawer.ts` 与 `TopbarBackgroundDrawer.ts`，实现组件复用
- [ ] 净化所有 UI 文本，彻底消除括号说明、副标题说明、长句与“与”字，标题与按钮精简为极简短语
- [ ] 优化 CSS 样式，彻底消除大间隙、大边距与无意义分隔符，布局紧凑统一
- [ ] 性能优化：为高频变更引入 rAF 节流与批量 DOM 片段挂载
- [ ] `npm run type-check` 与 `npm run build` 100% 成功无错误
- [ ] 运行自动化 Puppeteer 测试，完成多场景全景截图审计，无布局错误或违规文案，测试全部通过

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
