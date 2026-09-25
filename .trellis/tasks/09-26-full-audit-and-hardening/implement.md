# 实现清单 — 全仓体检与健壮性加固

> 复选框随执行**实时勾选**（L0-2）。**本清单不含任何删除类条目**——裁剪动作须经用户逐项批准后另立清单。

## Phase A：激活与基线

- [x] A1 任务激活（`task.py start`；**须在子任务 1 提交之后**）
- [x] A2 基线：`git status` 干净、`npm run type-check && npm run build` 绿
- [x] A3 基线三套件留档

## Phase B：复核种子发现

- [x] B1 复核 A1（Alt+B 隐藏后切背景不显示）——Dev 实例复现并留证
- [x] B2 复核 A2（虚拟项持久化后丢失）——留证
- [x] B3 复核 A3（原生缩略图点击双写）——留证
- [x] B4 复核 B1–B5（半接线字段）——交叉引用确认
- [x] B5 复核 C1–C7（死代码）——交叉引用确认
- [x] B6 复核 D1–D3（一致性）、E1–E3（性能）、F1–F2（安全/边界）
- [x] B7 复核结论写入 `research/findings.md`（确认/推翻各有结论）

## Phase C：补齐全模块扫描

- [x] C1 core/（MediaMount、ParallaxController、SceneManager、ShortcutManager、mediaType、sanitize）
- [x] C2 renderers/（Video、Iframe、Image）
- [x] C3 audio/（AudioEngine、AmbientSoundGenerator）
- [x] C4 fx/ + visualizer/
- [x] C5 ui/（SettingsDrawer、MiniPlayer、FrostedGlassController、NativeBgAugmenter）——**只记录不修改**（视觉归子任务 1、接管归子任务 3）
- [x] C6 cache/ + backend/（CacheManager、ServerOrigin、ServerSettings、SettingsSync、AuthorityBridge、AgentBridge、RemoteImporter）
- [x] C7 api/ + triggers/ + types/ + index.ts
- [x] C8 全部发现按 P0–P4 分级写入 `research/findings.md`

## Phase D：产出裁剪候选清单

- [x] D1 `research/prune-candidates.md` 落盘：死字段 / 半接线 / 死代码 / 重复真源 / 一致性 / 重复逻辑 六组
- [x] D2 每条含：建议（保留/合并/砍掉）、理由、影响面、成本（S/M/L）、是否影响用户数据
- [x] D3 `PublicAPI` 对外方法统一标注「保留（契约）」并注明文档出处
- [x] D4 文首明确标注「**待用户批准，本轮不执行任何删除**」
- [x] D5 **交付用户逐项拍板**


## 执行记录（Phase A–D）

- **Phase A** 完成。任务激活于子任务 1 提交之后。
- **Phase B 复核结论（重要修正）**：
  - A1 **确认成立**（实测：Alt+B 隐藏后切背景，图层已渲染且 opacity=1 但容器仍 `display:none`；奇偶次 Alt+B 相消）。
  - A2 **确认成立**（实测：`setBackground(url)` 不带 `saveToLibrary` 时把 `custom_<ts>` 写进持久化的 `activeMediaId`，该 id 无法解析；且 `init()` 不自愈）。
  - A3 **确认成立但范围修正**：原生 `/api/backgrounds/all` 实测返回 **27 项、非图片 0 项**，故「非图片双写」的原设想不成立；实际受影响集合是原生网格中**被判为非 `image` 类型**的条目，当前仅 `.svg`（`detectMediaType('.svg') === 'svg'`）。实测点击 SVG 缩略图：宿主改写 `#bg1` 的 `background-image` **且** 扩展同时切换自身背景 → 双写成立。
  - B1–B5 / C1–C7 / D1–D3 / E1–E3 **交叉引用确认**（证据见 `research/findings.md`）。
  - F2 **核验为非问题**：ST 的扩展启停/更新一律 `location.reload()`（`extensions.js:479/496/1325`），不存在原地重载导致监听器翻倍的路径 → 降级为防御性候选。
  - **C8 新增**：`NativeBgAugmenter` 在当前宿主上只对 `.svg` 生效（原生网格 27 项全为图片扩展名，其中 3 个 `.svg` 命中）→ 其面向 video/audio/html 的功能面在现实中为零。
  - **A5 新增（本次体检新发现）**：三套设置存储并存，KV 与服务端文档的 revision **互相独立且量级悬殊（实测 41 vs 202）**，而 `SettingsSync.start()` **无条件**套用 KV 镜像 → 启动时陈旧 KV 会覆盖服务端文档已修正的状态（实测症状：服务端已是 `null`，运行态仍复活悬空的 `custom_` id）。
  - **A4** 由子任务 1 转交（见 `research/findings-from-child1.md`）。
- **Phase C** 完成：按模块（core / renderers / audio / fx+visualizer / ui / cache+backend / api+triggers+types+index）扫描；种子之外新增 C8、A5 两项。`ui/` 只记录不修改（视觉归子任务 1、接管归子任务 3），已遵守。
- **Phase D** 完成：`research/prune-candidates.md` 落盘，含 11 个待用户拍板的决策点、每组统一口径、逐项建议/理由/影响面/成本/数据影响，并显式标注「本轮不执行任何删除」。

### Phase B–D 期间的实例侧副作用（已复原）

- A2 复核留下悬空 `activeMediaId` → 已跨**三套存储**清理并实测三方一致（`localStorage` / 服务端文档 / KV 镜像均为 `null`）。
- 探针在服务端 `backgrounds/` 留下了 `visual-check*.svg` 与既有 e2e/stress 产物（`test-animation*.html` 等）。**未擅自删除这些文件**——删除属不可逆操作，已列入待用户确认事项。

## Phase E：实施 P0/P1 修复

- [ ] E1 A1：`MediaMount` 新增 `visible` 状态 + `setVisible()/isVisible()`；`setupContainer` 应用；`doMountMedia` 不触碰 display；`index.ts` 改调用
- [ ] E2 A2：非持久化背景不写 `activeMediaId`（按 A2-a）+ `init()` 恢复时清理悬空 id 自愈
- [ ] E3 A3：`NativeBgAugmenter` 非图片项点击 `stopPropagation/preventDefault`，消除双写（并注明将被子任务 3 取代）
- [ ] E4 其余 P0/P1 项按 `findings.md` 逐个实施
- [ ] E5 每项修复后 `npx tsc --noEmit` 快验

## Phase F：实施 P2 修复

- [ ] F1 E1：`ServerOrigin` 目录短时缓存（TTL 2s）+ 写操作失效 + `invalidateCatalog()` 公开钩子
- [ ] F2 E2：按 §2.5 评估——实施内存索引镜像，或给出「不做」的书面理由
- [ ] F3 E3：`objectUrls` 保守有界化（随 cache 条目淘汰同步释放）
- [ ] F4 D1：天气类型收敛为单一真源（`types` 导出，`PublicAPI` 引用）
- [ ] F5 D2：原生徽章按类型配色补齐（或统一无类型色，二选一并在 findings 记录理由）
- [ ] F6 D3：`playMediaItem`/`playCurrentTrack` 重复逻辑合并
- [ ] F7 F1：复核 iframe sandbox 注释表述是否覆盖「URL 导入的第三方 HTML」；修正表述（sandbox 收紧需用户裁定，不在本轮）
- [ ] F8 其余 P2 项逐个实施或给出不做理由
- [ ] F9 `npx tsc --noEmit` 快验

## Phase G：回归与收尾

- [ ] G1 A1/A2/A3 修复前证据 + 修复后验证（按 `design.md` §5 的验证表）
- [ ] G2 E1/E2 性能验证（请求数 / IDB 调用数前后对比）
- [ ] G3 `npm run type-check && npm run build`
- [ ] G4 CSS 裸选择器门禁为 0
- [ ] G5 e2e + stress + authority 三套件
- [ ] G6 Dev 冒烟：抽屉开合、切背景、Alt+B、迷你播放器、pulse+视差同开
- [ ] G7 **未越界核对**：`git diff --stat` 确认未修改 SettingsDrawer 视觉区与原生接管接缝（子任务 1/3 范围）
- [ ] G8 **未删除核对**：清单比对，确认本轮零删除
- [ ] G9 更新 `dist/` 并按发现编号分组提交、推送 `origin master`
- [ ] G10 归档子任务

## 验证命令

```bash
npm run type-check && npm run build
```

```bash
grep '^\.' src/ui/style.css | grep -vc 'st-bg'
```

```bash
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e
```

```bash
node tests/stress.mjs && node tests/authority.mjs
```

```bash
git diff --stat HEAD -- src/ui/SettingsDrawer.ts src/ui/style.css
```

末条用于 G7 越界核对（若与子任务 1 提交后相比无新增改动，则未越界）。

## 回滚点

| 回滚点 | 范围 |
| --- | --- |
| RP-1 | Phase E 全部（P0/P1 修复）按发现编号分组，可单条 revert |
| RP-2 | Phase F 全部（P2 修复）同上 |
| RP-3 | `research/` 清单为只读产物，不参与回滚 |

## 纪律

- 每项修复独立提交，提交信息含发现编号（`fix(audit): A1 …`）。
- 发现的问题若落在子任务 1 / 子任务 3 范围内 → **只记录、转交**，不在本子任务修改。
- 裁剪动作**本轮一次都不执行**，即使清单条目看起来毫无争议。
