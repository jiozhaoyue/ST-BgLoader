# P3 改进批：体检遗留 12 项 + spec 教训

## Goal

实施上一个任务（archive/2026-09/09-25-full-audit-ui-logic）定稿的 14 项 P3 中全部 12 项可执行项（P3-12 已在上任务顺手修复、P3-14 为无操作基线记录），并把「shell cd 进子目录导致 pre-shell hook 失联」的坑沉淀为 spec 工程纪律。完成后插件零回归，P3 清单闭环。

## Background

- 上一任务 findings.md（已随归档入库：`.trellis/tasks/archive/2026-09/09-25-full-audit-ui-logic/research/findings.md`）§3 P3 表为需求真源，每项带 file:line 证据与建议方案、成本估计。
- 用户裁定（2026-09-25）：全部 14 项 P3 + spec 补教训，建任务实施。
- 起点：`git status` 干净，HEAD `2dc83b0`，三套件全绿（e2e 24/24、stress 4/4×2、authority 18/18 真后端）。

## Requirements

1. **P3-1 设置深合并**：新增 `mergeSettings(stored)`（types 层纯函数，顶层合并 + 已知嵌套对象键一层深合并，数组整体替换），接入 `index.ts loadSettings/reconcileSettings` 与 `SettingsDrawer` 设置导入，旧存档新增嵌套字段补默认值。
2. **P3-2 init 兜底**：bootstrap 两条路径（DOMContentLoaded 回调 + 直接调用）加 `.catch` 记录 `[ST-BgLoader] Initialization failed`。
3. **P3-3 SceneManager 懒创建**：与 ShortcutManager 同模式——字段可空、init 中创建、getter 放宽、`applySettingsToSubsystems` 与 PublicAPI 四个调用点空值安全。
4. **P3-4 观察者放弃上限**：MediaMount docObserver / NativeBgAugmenter bodyObserver / SettingsDrawer render observer 三处加 ~30s 放弃上限（找到目标即清除定时器）。
5. **P3-5 pulse/视差分层**：MediaMount 在 container 内加 pump 包裹层（layerA/B 的父级），AudioVisualizer pulse 写包裹层 transform，视差继续写 container——两写者解耦；包裹层 pointer-events 透传、不影响挂载/过渡逻辑。
6. **P3-6 manifest 单飞**：ServerOrigin.saveManifest promise 链排队，消除并行上传时的无序写与冗余并行 POST。
7. **P3-7 postMessage 收紧**：IframeRenderer.postMessage 目标 origin 从 `'*'` 改为按 iframe.src 推导（http/https 用其 origin，srcdoc/其他回退 `window.location.origin`），并加信任边界注释（sandbox 组合风险已在 Authority 无关的自有媒体场景下接受）。
8. **P3-8 徽章色变量化**：五个媒体徽章语义色收进 `.st-bgloader-panel` 作用域的自定义属性（`--st-bg-badge-*`），规则引用 var；豁免理由注释保留。
9. **P3-9 正则编译缓存**：TriggerManager 按 pattern 缓存已编译 RegExp（setRules 时失效），MESSAGE_RECEIVED/RENDERED 双事件源**保留**（500ms 冷却已兜底，去重属行为变更不做）。
10. **P3-10 渐进两项**：playMediaItem 播放列表去重（同 id 更新索引不重复 push）；refreshMediaGrid 加渲染签名守卫（列表 JSON 未变则跳过重建）。内联样式清理**明确不做**（纯外观、回归风险大于收益，保持 open）。
11. **P3-11 设置冲突检测**：ServerSettings.flush 写前读服务器文档 revision，远端更新时放弃本次写入并触发冲突回调；index.ts 接冲突回调走既有 reconcileSettings + 扇出（带 in-flight 守卫防风暴）。
12. **P3-13 事件多播**：AudioEngine 的 onTrackChange/onPlayStateChange 改监听器数组（addTrackListener/addPlayStateListener 返回退订函数），MiniPlayer 与 index.ts 桥接改订阅制，消除「后写者覆盖」脆弱链；属性本身删除（仓内三处调用点全改）。
13. **spec 教训**：新增 `.trellis/spec/guides/trellis-shell-discipline.md`（hook 相对路径失联的坑、恢复手段、预防纪律：Bash 命令禁止 `cd` 进子目录），guides/index.md 加行。
14. **零回归门禁**：tsc + build + e2e 24/24 + stress 4/4×2 + authority 18/18（真后端）+ CSS 裸选择器门禁 0 + Dev 冒烟（抽屉、切背景、迷你播放器、pulse+视差同开不冲突）。

## Non-goals

- 不做内联样式清理（P3-10 的外观子项，明确保持 open）。
- 不改三套件断言结构（测试只允许因行为意图变化的适配，不允许为绿而绿）。
- 不新增功能特性；不动 Authority 契约面。

## Acceptance Criteria

- [x] 12 项 P3 全部实施并在任务 research/deliverables 记录（含 P3-10 内联样式保持 open 的显式说明）。
- [x] `npm run type-check` + `npm run build` 通过。
- [x] `TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e` 24/24、`node tests/stress.mjs` 4/4 ×2、`node tests/authority.mjs` 18/18（真后端），零回归。
- [x] CSS 裸选择器门禁 0；徽章色经自定义属性引用。
- [x] Dev 冒烟：设置抽屉开合、背景切换、迷你播放器、pulse+视差同开无 transform 打架（页面求值验证两写者分离）。
- [x] spec 教训文件自包含入库，guides 索引更新。
- [x] 提交推送 origin master，任务归档。

## Risks

- **P3-5 包裹层动 DOM 结构** → e2e Test 2 断言 `.st-bg-media-container` 挂载，包裹层在其内部不影响断言；stress 3 覆盖快速切换；冒烟专门验证。
- **P3-13 删公共回调属性** → 先全仓 grep 确认仅 3 处仓内调用；tests 不直接依赖该属性。
- **P3-11 冲突回调风暴** → in-flight 守卫 + 冲突处理复用既有 reconcile（自身无保存路径）。
- **P3-1 深合并没有覆盖到的字段** → mergeSettings 仅做一层嵌套合并（嵌套对象均为扁平结构），未知新键走顶层默认。

## Rollback

全部改动常规 git 提交，按提交粒度 revert；无实例侧改动。
