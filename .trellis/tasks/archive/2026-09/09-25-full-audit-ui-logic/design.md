# 技术设计 — 全仓全面体检

## 1. 审查对象与分组

27 个源文件按子系统分 6 组，审查顺序按「逻辑核心 → 后端 → UI」推进（先审被依赖方，修复时不易连锁返工）：

| 组 | 文件 | 审查重点 |
| --- | --- | --- |
| G1 入口/装配 | `index.ts`(529) | 装配顺序、destroy 顺序与完整性、事件总线接法、`as any` 边界 |
| G2 渲染 | `renderers/{Iframe,Image,Video}Renderer.ts`(246)、`core/MediaMount.ts`(288)、`core/ParallaxController.ts`(121)、`core/SceneManager.ts`(62) | 有界等待（L1-MR-7 教训源）、destroy 契约、A/B 双缓冲、内存泄漏（objectURL/监听器） |
| G3 缓存与挂载 | `cache/CacheManager.ts`(282)、`backend/ServerOrigin.ts`(373)、`backend/ServerSettings.ts`(93)、`backend/SettingsSync.ts`(155)、`backend/RemoteImporter.ts`(41) | 三层持久化边界（L1-MR-2）、缓存可清理可重建、写路径去抖/单飞/最新胜出、CSRF、AbortController 生命周期 |
| G4 Authority 增强 | `backend/AuthorityBridge.ts`(308)、`backend/AgentBridge.ts`(371) | 降级契约（L0-11/12）：fire-and-forget、错误分类、Host Bridge 零依赖、能力位判定 |
| G5 音频/特效 | `audio/AudioEngine.ts`(447)、`audio/AmbientSoundGenerator.ts`(200)、`visualizer/AudioVisualizer.ts`(190)、`fx/AtmosphereFX.ts`(369) | play() 竞速兜底、AudioContext 挂起/恢复、canvas 资源释放、rAF 循环停止 |
| G6 UI/触发/API | `ui/SettingsDrawer.ts`(1049)、`ui/MiniPlayer.ts`(174)、`ui/FrostedGlassController.ts`(75)、`ui/NativeBgAugmenter.ts`(67)、`style.css`(317)、`triggers/TriggerManager.ts`(155)、`core/ShortcutManager.ts`(53)、`api/PublicAPI.ts`(517)、`types/index.ts`(311) | UI/UX、CSS 双前缀（L1-MR-3）、UI 落点（L1-MR-4）、键盘可达性、公开 API 面稳定性 |

## 2. 审查方法（三层过滤）

1. **机械自查（脚本化，零遗漏）**：
   - CSS：`grep -n '^\.' src/ui/style.css` 逐条核对前缀；`grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' src/ui/style.css` 找硬编码色；
   - 等待与泄漏面：`grep -nE 'await|addEventListener|setInterval|setTimeout|new Worker|AbortController|createObjectURL|requestAnimationFrame' src -r` 逐处核对「有 cleanup、有超时、有置空」；
   - 合规面：`grep -nE 'STAuthority|Host Bridge|hostBridge' src` 确认禁用面；`grep -nc 'as any' src -r` 对 spec 既有 cast 边界计数。
2. **主脑精读**：6 组逐文件通读，按组产出结论。判断点对照 spec 条文与 AGENTS.md MUST 规则，不凭感觉。
3. **交叉子代理复核（≤3 并发、小模型）**：主脑精读完成后，把 findings.md 的 P1/P2 结论按组分批派子代理复核「证据是否成立、是否有漏网同类问题」，防止主脑误判与遗漏。子代理任务自包含（指明文件、行号、判定标准），只读不改。

## 3. 分级标准（判定即文档）

| 级别 | 判定 | 处置 |
| --- | --- | --- |
| P1 | 会产生错误行为或数据风险：竞态、泄漏累积、无界等待、降级路径断裂、违反 MUST 规则、destroy 后复用 | 当场修，回归验证 |
| P2 | 不产生错误行为但伤体验/一致性：错误反馈缺失、文案不一致、冗余重复代码、日志噪音、可达性缺陷 | 当场修，回归验证 |
| P3 | 改进建议：重构机会、命名、测试覆盖缺口、文档同步、更优交互方案 | 记录 + 建议方案 + 成本，交用户 |

边界裁定：**不确定是否有行为影响的候选 P1 → 降半级处理（按 P2 修但标注存疑）或列 P3**，不当场扩范围。

## 4. 修复策略

- 修复顺序：P1 按「数据风险 > 崩溃/挂死 > 泄漏累积 > 合规」排序，P2 按 UI 组优先（用户可感知）。
- 每修一项：`npx tsc --noEmit` 快验 → 对应测试子集（渲染类 → stress；后端类 → authority；UI 类 → e2e + Dev 实例冒烟）。
- UI 改动统一收口一次冒烟（避免逐项重启实例）。
- 禁止借修复之名重构：diff 面保持最小，重构机会记 P3。

## 5. 验证门禁（Phase D 全量）

```bash
npm run type-check && npm run build
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e   # 24/24
node tests/stress.mjs                                      # 4/4 ×2
node tests/authority.mjs                                   # 双模式全绿
# CSS 自查（前缀以实际为准）
grep '^\.' src/ui/style.css | grep -vc 'app-container\|bg-loader'
```

- 实例要求：Dev Luker (8003) 存活；不可达则用实例目录既有启动方式拉起（仅启动进程，零配置改动）。
- 全绿后 UI 面人工冒烟：设置抽屉开合、背景切换、迷你播放器、错误态展示。

## 6. 产出物

- `research/findings.md`：逐文件结论 + 分级问题清单（P1/P2 带修复回填，P3 带方案与成本）。
- 代码修复：小步提交（按组或按问题簇），master 直推 origin。
- spec 更新：如审查发现 spec 未覆盖的新教训（如新型泄漏模式），补进对应 spec 文件（自包含条文）。
