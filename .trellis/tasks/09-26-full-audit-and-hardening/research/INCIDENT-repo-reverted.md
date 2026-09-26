# 事故记录：仓库被回退到 2026-09-06 状态

> 发现时间：2026-09-26 15:47 前后（`.git/index` mtime 15:47:01）
> 记录时间：2026-09-26
> 状态：**已止血**（事故前的提交已固定；存活的未提交工作已备份）

---

## 一、现象

工作区在会话进行中发生了变化：

| 观察项 | 事故前 | 事故后 |
| --- | --- | --- |
| `HEAD` / `master` | `11977b4`（本会话第 9 个提交） | **`a568b10`**（2026-09-06 的提交） |
| `src/index.ts` | 本会话改动版 | 09-06 版 |
| `src/cache/CacheManager.ts` | `ServerOrigin` 门面版 | **IndexedDB + `cacheKey` 旧架构版** |
| `src/ui/SettingsDrawer.ts` / `style.css` | 本会话改动版 | 09-06 版 |
| `dist/index.js` | 176.11 kB（新构建） | **128699 字节**（09-06 构建，含 `ShortcutManager`） |
| `src/backend/` | 已跟踪 | 变为**未跟踪**（文件仍在，内容为本会话版） |
| `.trellis/tasks/09-26-*` | 已跟踪 | 变为**未跟踪**（文件仍在，内容完整） |
| `tests/authority.mjs` | 已跟踪 | 变为**未跟踪**（文件仍在，含本会话的 S7.3 修复） |

`a568b10` 的提交信息是：`chore: sanitize sensitive local paths, add MIT license, and prepare for public release`（提交时间 2026-09-06 15:43:01）。

## 二、机制（已用 `git ls-tree` 逐路径确认）

这是一次**「把工作树回退到 `a568b10`」**的操作，且**只影响在该提交里已存在的路径**：

| 路径 | 在 `a568b10` 中跟踪数 | 在 `11977b4` 中跟踪数 | 结果 |
| --- | --- | --- | --- |
| `src/index.ts` | 1 | 1 | ❌ 被覆盖为 09-06 内容 |
| `src/ui/SettingsDrawer.ts` | 1 | 1 | ❌ 被覆盖 |
| `src/cache/CacheManager.ts` | 1 | 1 | ❌ 被覆盖 |
| `src/backend/` | **0** | 6 | ✅ 未受影响（文件与内容均存活） |
| `tests/authority.mjs` | **0** | 1 | ✅ 存活 |
| `.trellis/tasks/` | 38 | 151 | 部分：09-06 的 38 个被回退，本会话新增的目录存活 |

→ 规律：**在 09-06 提交里尚不存在的路径，回退操作不会触碰它们**，因此带本会话内容的副本得以存活。

## 三、损伤图

### ✅ 零损失

1. **本会话全部 9 个提交**：已固定为分支 `wip/09-26-audit-recovery` 与同名 tag，指向 `11977b4`。reflog 完好并已备份至本目录 `INCIDENT-reflog-backup.txt`。
   - 含子任务 1 的全部代码改动（折叠修复、去溢光、内联样式清理）、新增的 `host-native-ui.md` 规范、全部任务的规划与留痕文档。
2. **子任务 2 的规划与证据文档**：`.trellis/tasks/09-26-full-audit-and-hardening/` 下的 `prd/design/implement/research/*`（体检发现、裁剪清单、宿主核验、验收探针与输出）**全部完整**——因为它们同时在 `11977b4` 与工作区中。
3. **存活的未提交代码**（已另备份至本目录 `survived-backup/`）：
   - `src/backend/ServerOrigin.ts` —— 含 S4 的 `HOST_OWNED_FILENAMES` 过滤
   - `src/backend/SettingsSync.ts` —— 含 A5 的 `hasServerDocument` 回退改造
   - `src/backend/` 其余 4 个文件、`src/core/mediaType.ts`、`src/core/sanitize.ts`
   - `tests/authority.mjs` —— 含我修的 S7.3 用例（`window.top === window`）

### ❌ 已丢失（未提交 + 位于被覆盖的跟踪文件）

以下改动**只存在于被回退的工作区**，从未提交，故不在 git 对象中：

| 范围 | 内容 |
| --- | --- |
| A1 | `MediaMount` 受控可见性 + `index.ts` 接线 |
| A2 | 瞬时背景不写 `activeMediaId` + 悬空 id 自愈 |
| A3 | `NativeBgAugmenter` 阻止冒泡（**注**：`src/ui/NativeBgAugmenter.ts` 被覆盖） |
| A4 | `refreshMediaGrid` 元素级守卫 + 栅格身份复核 |
| A5 | `index.ts` 侧的 `hasServerDocument` 接线（**`SettingsSync.ts` 本体存活**） |
| 裁剪 | `chatBindings`、`enabled`/`muffleOnDrawer`/`playlist` 三个死字段、7 处死代码（实删 6） |
| 性能/一致 | 目录 TTL 缓存调用点、索引内存镜像、objectURL 有界化、天气真源收敛、原生徽章配色、播放逻辑合并 |
| 快捷键 | K1–K5 移除五个 Alt 快捷键、K6–K8 可见性控件与 API |
| 收尾 | S1 网格刷新票据、S2 配额即时生效、S4 的调用点 |
| 复核订正 | `CacheManager` / `IframeRenderer` 的注释订正、`state-management.md` 与 `frontend/index.md` 的 spec 同步 |

> **注**：`src/ui/style.css` 同时被覆盖，因此子任务 1 的去溢光与内联样式类化**在工作区里也没了**——但它们**在提交 `ceb9eec` 中**，属可恢复。

## 四、恢复可行性

**完全可恢复**，因为本会话把每项改动都写成了可执行的施工说明：

- `implement.md` 的「Phase E/F 定稿清单」与「追加裁定（第二轮）」逐条写明改哪个文件的什么行为（含 A1/A2 的设计取舍、A4 的元素级守卫形态、K6–K8 的配套要求）
- `research/findings.md` 每条发现带 `file:line` 证据与建议修法
- `research/prune-candidates.md` 列出全部获准的删除项
- 两轮实现子代理与一轮复核子代理的报告（在本会话记录中）含具体文件与净行数

→ 恢复路径：在 `wip/09-26-audit-recovery` 之上重新施加改动，或按用户指定的新基线重做。

## 五、待用户裁定

1. **这次回退是你的有意操作吗？**（提交信息显示是「为公开发布做准备」）若是有意的，我不应把工作树改回去。
2. **后续工作应基于哪条基线继续？**
   - (a) 继续在 `wip/09-26-audit-recovery`（`11977b4`）上，把丢失的改动重做一遍
   - (b) 接受当前 `a568b10`（09-06 基线）为新起点，把子任务 1 与子任务 2 的改动**全部重做**
   - (c) 你先说明公开发布的计划，我再据此安排
3. **要不要我先把丢失的工作在当前基线上重做一遍**（按 `implement.md` 的施工说明），还是先等你确认？

## 六、已做的止血动作（非破坏性）

1. `git branch wip/09-26-audit-recovery 11977b4` + `git tag wip-09-26-audit-recovery 11977b4`
2. reflog 备份 → 本目录 `INCIDENT-reflog-backup.txt`
3. 存活文件备份 → 本目录 `survived-backup/`

**未做任何写操作**于 `master`、工作树或其它分支。未执行任何 `checkout` / `reset` / `clean` / `stash`。
