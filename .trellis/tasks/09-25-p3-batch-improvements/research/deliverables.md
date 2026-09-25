# 实施记录 — P3 改进批（2026-09-25）

> 对应 findings.md（archive/2026-09/09-25-full-audit-ui-logic）§3 P3 表的 12 项可执行项。

| 项 | 实施说明 | 验证 |
| --- | --- | --- |
| P3-1 | `src/types/index.ts` 新增 `mergeSettings`（顶层合并 + 已知嵌套对象一层深合并，数组/record 整体替换）；接入 index.ts loadSettings、reconcileSettings、SettingsDrawer 导入 | 冒烟：预置缺 `weather.speed/opacity/wind` 的存档重载后补齐默认值 ✓ |
| P3-2 | bootstrap 两条路径（DOMContentLoaded + 直接调用）合并为 `boot()` 并 `.catch` 记录 `[ST-BgLoader] Initialization failed` | tsc ✓；错误路径日志可 grep |
| P3-3 | SceneManager 懒创建（字段可空、init 创建、getter 放宽）；PublicAPI applyScene/saveCurrentScene/getScenes/deleteScene 空值安全（saveCurrentScene 返回类型改 `SceneSnapshot \| null`） | 冒烟：saveCurrentScene 正常返回 ✓ |
| P3-4 | 三处 MutationObserver（MediaMount docObserver / NativeBgAugmenter bodyObserver / SettingsDrawer render observer）加 30s 放弃上限（命中即清定时器） | tsc ✓ |
| P3-5 | MediaMount 新增 `st-bg-pump-wrapper` 包裹层（创建/复用/防御三路径 + getPumpWrapperElement）；AudioVisualizer pulse 改写包裹层（字段更名 pumpTargetEl）；index.ts mountOverlays 传包裹层 | 冒烟：DOM 分层正确；mousemove 只写 container transform，包裹层独立 ✓ |
| P3-6 | ServerOrigin.saveManifest 拆 `doSaveManifest` 并 promise 链排队（失败不毒化队列） | tsc ✓；authority 套件（含媒体上传路径）18/18 ✓ |
| P3-7 | postMessage 目标 origin 按 iframe.src 推导（http/https 用其 origin，其余回退同源）；信任边界注释 | tsc ✓ |
| P3-8 | 徽章五色收进 `.st-bgloader-panel` 作用域自定义属性 `--st-bg-badge-*`，规则改 var 引用；豁免注释保留 | CSS 裸选择器门禁 0 ✓ |
| P3-9 | TriggerManager 正则编译缓存（Map<pattern, RegExp\|null>，写操作全清，无效 pattern 只告警一次）；双事件源保留（设计裁定见 design.md §B5） | 冒烟：invalid pattern 安全返回 false、valid 触发 ✓ |
| P3-10 | playMediaItem 按 url+type 复用列表条目（不再无限追加虚拟 BGM）；refreshMediaGrid 签名守卫（render 重建时强制失效）。**内联样式清理保持 open**（纯外观、回归风险大于收益） | e2e 24/24 ✓ |
| P3-11 | ServerSettings.flush 写前 load() 比对 revision，远端更新时放弃写入并触发 `onRemoteNewer`；index.ts 接 `reconcileRemoteConflict`（in-flight 守卫，复用 reconcile + 扇出） | authority S7.1-S7.3 全绿 ✓ |
| P3-13 | AudioEngine 事件改多播（addTrackListener/addPlayStateListener 返回退订函数，emit 隔离异常）；删除单槽属性；MiniPlayer 订阅制（render 退订重订、destroy 清理）；index.ts 桥接改订阅（wrap 链删除）；onAnalyserReady 保留单槽（无覆盖链） | e2e 24/24（track-change/play-state 事件断言路径）✓ |

## 回归汇总

- `npm run type-check` ✓ / `npm run build` 170.84 kB（上任务 165.39 → +5.4 kB）
- e2e 24/24 ✓、stress 4/4 ×2 ✓、authority 18/18（真后端）✓
- CSS 裸选择器门禁 0 ✓
- Dev 冒烟 5/5 ✓（深合并、DOM 分层、写者分离、正则缓存、零插件报错），探针用后即删

## 保持 open

- P3-10 内联样式清理（外观类，后续任务再议）
- P3-9 双事件源去重（行为变更，500ms 冷却已兜底，不做）
- P3-12 已在上任务修复、P3-14 为无操作记录
