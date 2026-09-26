# 实现清单 — 接管 ST 原生背景选择器

> 复选框随执行**实时勾选**（L0-2）。**前置条件：子任务 1 已提交**（同为 `SettingsDrawer` 接触面）。

## Phase A：激活与前置核对

- [x] A1 确认子任务 1 已提交、子任务 2 的 A3 最小修复已落地（本方案将取代它）
- [x] A2 任务激活（`task.py start`）
- [x] A3 基线：`git status` 干净、`npm run type-check && npm run build` 绿
- [x] A4 用户已就 Open Questions 1–3 裁定，并把裁定结果记入 `research/decisions.md`
      > 执行期另新增裁定 **D-1（聊天锁定背景 → 放行给原生）** 与 **D-2（不派子代理）**，已一并留档。
      > A4 同时记录了**宿主漂移**复核结论：实例 `backgrounds.js` 1865 → **2039 行**，行号全失配、
      > 接缝全存活；并订正 PRD 的「`getContext()` 不暴露背景相关内容」（`chatMetadata` 实为公开）。

## Phase B：源码证据留档

- [x] B1 `research/st-native-evidence.md` 落盘：`backgrounds.js` 关键函数（`initBackgrounds` / `onSelectBackgroundClick` / `setBackground` / `forceSetBackground` / `highlightSelectedBackground` / `renderSystemBackgrounds` / `setBackgroundSelectionMode`）的行号与摘录
      > 证据文件规划期已落盘，本轮**全量校正行号**（1865 行版本 → 实测 2039 行版本）并补 §2.1 锁定接缝、
      > §2.2 `#bg1` 抢写风险、§3 两处结论订正。
- [x] B2 记录 ST 版本/commit（供将来判断宿主漂移）
      > `v2.7.0-605-ge1dbd1904` / `e1dbd1904a1e49465feb7da38115def7fdac2192`（2026-09-24）。
- [x] B3 记录不可用接缝（`setBackground` / `background_settings` 模块私有）与理由
      > 理由已订正：`background_settings` 当前是 **`export let`**（`:136`），不在 `window` 也不在
      > `getContext()` 返回键里 —— 不可用的真因是「**已导出但扩展不可达**」（独立脚本接不到宿主模块图），
      > 而非「模块私有」。

## Phase C：控制器骨架与探针

- [ ] C1 新增 `src/ui/NativeBackgroundController.ts`：类型（`TakeoverLevel` / `NativeSeams`）+ 类骨架
- [ ] C2 `probe()` 实现 + 可重入（网格空时挂一次性观察者，沿用 30s 放弃上限纪律）
- [ ] C3 探针失败路径：`start()` 直接返回、`isActive()` false
- [ ] C4 `npx tsc --noEmit` 快验

## Phase D：装饰职责迁移

- [ ] D1 把 `NativeBgAugmenter` 的徽章逻辑（`.bg_example[bgfile]` + `data-st-bg-augmented` 幂等标记）移入 `decorateGrid()`
- [ ] D2 补 `.st-bg-native-badge.<type>` 按类型配色（或统一无类型色——按子任务 2 的 D2 结论保持一致）
- [ ] D3 选中标记：按 `bgfile` 匹配扩展当前背景，加 `st-bg-takeover-selected`
- [ ] D4 网格重渲染后重施选中标记（复用 MutationObserver）
- [ ] D5 `index.ts` 接线改为 `NativeBackgroundController`，`applyMedia` 后调用 `refreshSelection(activeFileName)`
- [ ] D6 **删除 `src/ui/NativeBgAugmenter.ts`**（职责已完全吸收）
- [ ] D7 `npx tsc --noEmit` 快验

## Phase E：拦截实现

- [ ] E1 注册唯一 document **捕获阶段** click 监听（`{ capture: true }`）
- [ ] E2 `shouldTakeOver()` 放行规则：多选模式 / **聊天锁定背景（D-1）** / 菜单与文件夹 / custom / 层级
- [ ] E2b `isChatBackgroundLocked()` 经 `getContext().chatMetadata['custom_background']` 读取（公开接缝，**不得**嗅探宿主私有实现，**不得**用 `.locked-background` 类作为真值）
- [ ] E3 命中后 `preventDefault()` + `stopPropagation()` + 走扩展管线
- [ ] E4 `stop()` 移除监听（`removeEventListener` 必须带同样的 `capture: true`，否则移除不掉）
- [ ] E5 确认全仓**只有一处** `.bg_example` 点击绑定：`grep -rn "bg_example" src/`
- [ ] E6 `npx tsc --noEmit` 快验

## Phase F：叠层清理

- [ ] F1 `clearNativeBackgroundImage()` 幂等实现，且**带 D-1 豁免**（`isChatBackgroundLocked()` 为真时不清，避免与宿主抢写 `#bg1`）
- [ ] F2 `#bg1` 的 `style` 属性观察者 + **自写保护**标志位（避免自己的清空动作再次触发）
- [ ] F3 调用点接线：`start()` 后、每次 `applyMedia()` 后、`CHAT_CHANGED` 后
- [ ] F4 `stop()` 移除观察者并尝试恢复原生背景图；实测「不刷新页面能否完全恢复」
- [ ] F5 实测结论写入 `research/decisions.md`；若不能完全恢复，写进开关的 UI 文案
- [ ] F6 `npx tsc --noEmit` 快验

## Phase G：设置项与开关

- [ ] G1 `types/index.ts`：`BgLoaderSettings` 加 `nativeTakeover: TakeoverLevel`，`DEFAULT_SETTINGS` 默认 `'all'`
- [ ] G2 `SettingsDrawer` 加控件（三态：关闭 / 仅非图片 / 全部接管）
- [ ] G3 控件变更 → `onSettingsChanged` + 控制器 `setLevel()`
- [ ] G4 `index.ts` init 时按设置安装；`applySettingsToSubsystems` 时应用变更
- [ ] G5 `npx tsc --noEmit` 快验

## Phase H：回归与验收

- [ ] H1 接缝探测降级验证（Dev 上临时移除 `#bg_menu_content` → 接管不安装、功能正常）
- [ ] H2 拦截矩阵逐条验证（按 `design.md` §9 的 12 条场景表）
- [ ] H2b **锁定态验证（D-1）**：在 Dev 上给当前聊天锁一张背景 → 点别的缩略图应改「聊天锁定背景」（原生语义）且 `#bg1` 不被清空、无抖动；解锁后点缩略图立即回到接管路径
- [ ] H3 动图（GIF/APNG）纳入管线后的观感验证（PRD R-6）
- [ ] H4 `npm run type-check && npm run build`
- [ ] H5 CSS 裸选择器门禁为 0；新增样式无溢光
- [ ] H6 e2e + stress + authority 三套件
- [ ] H7 Dev 冒烟：抽屉、切背景、Alt+B、迷你播放器、原生面板全操作路径
- [ ] H8 更新 `dist/`、提交、推送 `origin master`
- [ ] H9 归档子任务

## 验证命令

```bash
npm run type-check && npm run build
```

```bash
grep -rn "bg_example" src/ && echo "检查上方是否只有一处点击绑定"
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

## 回滚点

| 回滚点 | 范围 |
| --- | --- |
| RP-1 | Phase C/D 完成即提交（控制器骨架 + 装饰迁移，此时尚未拦截，行为与旧版一致） |
| RP-2 | Phase E/F 完成即提交（拦截 + 叠层清理） |
| RP-3 | Phase G 完成即提交（设置项与开关） |

**运行时回滚**：设置面板把接管切到「关闭」→ 即时卸载拦截，无需刷新。

## 纪律

- **禁止 monkey-patch** 宿主私有函数（`setBackground` / `onSelectBackgroundClick` / `renderSystemBackgrounds` / `background_settings`）——PRD Non-goals 的硬约束。
- 接缝探测集中在 `probe()` 一处，宿主升级只改这一处。
- 放行规则（`shouldTakeOver`）只增不减地保留注释，说明每条对应的宿主信号与证据行号。
