# 损失清单：git 不可恢复的部分（逐项核验）

> 生成时间：2026-09-26（事故后）
> 核验方式：对每个改动项取**唯一特征串**，在当前工作树与备份中逐个 `grep` 计数。下表是核验结果，不是凭记忆。
> 恢复源：`wip/09-26-audit-recovery`（=`11977b4`，亦已恢复到 `master`）、`origin/master`、`research/survived-backup/`、`research/INCIDENT-prewipe-worktree.diff`

---

## 一、已保住，**无需重做**（核验通过）

| 项 | 所在 | 核验特征 |
| --- | --- | --- |
| 子任务 1 全部代码改动（折叠修复、去溢光、内联样式类化、P3-10 结项） | commit `ceb9eec` → 已恢复到 master | `git log` 可达 |
| 子任务 1 的 `dist/` 构建产物 | commit `ceb9eec` | 同上 |
| 全部任务规划与留痕文档（prd/design/implement、findings、prune-candidates、宿主核验、验收探针与输出、决策记录） | `11977b4` + 工作区 | 文件在位 |
| `.trellis/spec/frontend/host-native-ui.md` | 工作区（未跟踪） | 6870 字节，在位 |
| `.trellis/spec/frontend/index.md` 的 host-native-ui 索引行 | commit `6486550` | `grep -c host-native-ui` = 1 |
| `.trellis/spec/guides/trellis-shell-discipline.md` | 工作区（未跟踪） | 在位 |
| **F1**（目录 TTL 缓存 + `invalidateCatalog`）与 **S4**（favicon 过滤） | `src/backend/ServerOrigin.ts` —— **存活**，已回填 | `CATALOG_TTL\|invalidateCatalog` = 7；`HOST_OWNED_FILENAMES` = 2 |
| **A5 本体**（KV 仅在服务端文档缺失时回退） | `src/backend/SettingsSync.ts` —— **存活**，已回填 | `hasServerDocument` = 2 |
| **D4**（AgentBridge 天气常量收敛，消除第 4 处真源） | `src/backend/AgentBridge.ts` —— **存活**，已回填 | `WEATHER_TYPES` = 3 |
| **S7.3 测试修复**（`window.top === window`，只清主文档） | `tests/authority.mjs` —— **存活**，已回填 | `window.top === window` = 1 |
| **e2e Test 14 素材修复**（blob URL + 自清理） | `tests/e2e.mjs` —— 已**重新施加** | `self-contained blob URL` = 1 |
| **S3 的实测结论**（RES-3 不成立，无需加固） | 仅文档，无代码改动 | 结论已是文档，**不需要重做** |

## 二、git 不可恢复、**必须重做**（核验为缺失）

> 以下改动只存在于被覆写的工作树文件中，从未进入任何 commit，因此**不在 git 对象库、不在 reflog、不在远程**。只能按施工说明重做。

| 编号 | 内容 | 涉及文件 | 规模 |
| --- | --- | --- | --- |
| **A1** | `MediaMount` 受控可见性（`visible` + `setVisible()/isVisible()`；`setupContainer` 应用；`doMountMedia` 不碰 display）+ `index.ts` 接线 | `src/core/MediaMount.ts`、`src/index.ts` | S |
| **A2** | 瞬时背景不写 `activeMediaId`（`applyMediaItem(item, persist)`）+ `init()` 悬空 id 自愈 | `src/api/PublicAPI.ts`、`src/index.ts` | M |
| **A3** | `NativeBgAugmenter` 非图片项点击 `preventDefault()+stopPropagation()`（消除双写） | `src/ui/NativeBgAugmenter.ts` | S |
| **A4** | `refreshMediaGrid` 元素级守卫（`grid.dataset.gridSignature`）+ await 后栅格身份复核；删 `lastGridSignature` | `src/ui/SettingsDrawer.ts` | M |
| **A5′** | `index.ts` 侧的 `hasServerDocument` 探测接线（本体已在 ServerSettings/SettingsSync） | `src/index.ts` | S |
| **F2** | `CacheManager` 索引内存镜像（消除 `getMediaBlobUrl` 热路径上的全量 IDB `getAll`） | `src/cache/CacheManager.ts` | M |
| **F3** | `objectUrls` 有界化（改 `Map<id,{url,cacheKey}>`，随 cache 条目淘汰释放） | `src/cache/CacheManager.ts` | S |
| **F4** | 天气单一真源：`types` 导出 `WEATHER_TYPES`，`PublicAPI` 两处改为引用 | `src/types/index.ts`、`src/api/PublicAPI.ts` | S |
| **F5** | 原生徽章按类型配色（`.st-bg-native-badge.video/.audio/.html/.svg`，追加） | `src/ui/style.css` | S |
| **F6** | `playMediaItem` / `playCurrentTrack` 合并为单一 `startTrack`（保持事件发射次数不变） | `src/audio/AudioEngine.ts` | M |
| **F7** | `IframeRenderer` sandbox 注释订正（准确表述：失去的是同源能力，非脚本能力） | `src/renderers/IframeRenderer.ts` | S |
| **F8** | 删 `chatBindings`（字段 + `index.ts` 不可达分支） | `src/types/index.ts`、`src/index.ts` | S |
| **F9** | 删 3 个死字段（`enabled` / `muffleOnDrawer` / `playlist`） | `src/types/index.ts` | S |
| **F10** | 删 6 处死代码（`touchMedia`×2、`setApplyCallback`、`getAnalyserNode`、`postMessage`、`syncFitting`+其 observer、`brightness`）。**C3 保留**（是 e2e 观测面） | 6 个文件 | S |
| **F11** | 补 `cacheQuotaMB` 滑块 + `lruAutoClean` 勾选框（复用既有类，无行内样式） | `src/ui/SettingsDrawer.ts` | M |
| **K1–K5** | 移除五个 Alt 快捷键：删 `ShortcutManager.ts`；清 `index.ts`/`types`/`SettingsDrawer` 的接线与 `shortcutsEnabled` | 4 个文件（含整删 1 个） | S |
| **K6–K8** | 背景可见性控件（面板勾选框）+ `index.ts` 回调 + `PublicAPI.setBackgroundVisible()/isBackgroundVisible()` | `src/ui/SettingsDrawer.ts`、`src/index.ts`、`src/api/PublicAPI.ts` | M |
| **S1** | 网格刷新票据（`grid.dataset.refreshSeq`，await 前预约、await 后相等才写回） | `src/ui/SettingsDrawer.ts` | S |
| **S2** | 配额变化即时 `cleanLRU`（`enforceQuotaIfChanged()`，门控 `lruAutoClean`，仅配额真变时触发） | `src/index.ts` | S |
| **复核订正 1** | `CacheManager.evictCacheEntry` 注释订正（"挂载项是最后候选"的论据不成立；如实写明 LRU 不保证 + BGM 残留窗口） | `src/cache/CacheManager.ts` | S |
| **复核订正 2** | `host-native-ui.md` §3 门禁命令订正 → `grep -c 'box-shadow:'`（避免说明性注释假红） | `.trellis/spec/frontend/host-native-ui.md` | S |
| **复核订正 3** | `state-management.md` 同步：删 `chatBindings` 段、加 A5「启动优先级」与「已知后果（不自愈）」 | `.trellis/spec/frontend/state-management.md` | S |

### 规模合计

- **S（小）**：13 项 · **M（中）**：6 项 · 整删文件 1 个
- 涉及文件：`src/core/MediaMount.ts`、`src/api/PublicAPI.ts`、`src/ui/NativeBgAugmenter.ts`、`src/ui/SettingsDrawer.ts`、`src/ui/style.css`、`src/index.ts`、`src/types/index.ts`、`src/cache/CacheManager.ts`、`src/audio/AudioEngine.ts`、`src/renderers/IframeRenderer.ts`、`src/core/SceneManager.ts`、`src/visualizer/AudioVisualizer.ts`、`src/core/ShortcutManager.ts`（删）、2 个 spec

### 重做依据（都在）

- `implement.md` 的「用户裁定（2026-09-26）与 Phase E/F 定稿清单」—— E1–E6 / F1–F14 逐条施工说明
- `implement.md` 的「追加裁定（2026-09-26 第二轮）」—— K1–K8 / S1–S4 逐条施工说明（含 Chromium 加速键表证据）
- `findings.md` 每条发现的 `file:line` 与建议修法
- `prune-candidates.md` 全部获准删除项
- 两轮实现子代理 + 一轮复核子代理的具体偏差说明（A5 的 `hasServerDocument` 形态、A4 的 token 形态、S2 的门控、F5 的字面量兜底等）

## 三、恢复操作记录（本次已做，均非破坏性或有据）

| 动作 | 说明 |
| --- | --- |
| `git branch wip/09-26-audit-recovery 11977b4` + 同名 tag | 固定事故前提交 |
| `git reflog -30 > INCIDENT-reflog-backup.txt` | 备份 reflog |
| `cp -r src/backend .../survived-backup/` | 备份存活的未提交代码 |
| `git diff > INCIDENT-prewipe-worktree.diff` | 备份覆写前工作树差异 |
| `git reset --hard 11977b4` | 用户裁定：恢复 master（已执行） |
| 回填 4 个文件 | `SettingsSync.ts`、`ServerOrigin.ts`、`AgentBridge.ts`、`tests/authority.mjs` |
| 重新施加 2 处编辑 | `tests/e2e.mjs` 的 Test 14 素材修复 |
