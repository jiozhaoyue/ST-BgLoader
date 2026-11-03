# 文档基线（冻结）

> 子任务 4 `implement.md` Phase A 要求的基线留档。**文档只描述这个基线**：任何在本文件之后、
> 未被重新核对的代码改动都可能让文档失效（PRD R-1）。

## 基线 commit

| 项 | 值 |
| --- | --- |
| commit | `141dc72bfcbc0f062109ce2867850e6323f506bf` |
| 提交时间 | 2026-09-26 23:58:53 +0800 |
| 提交信息 | `chore: record journal` |
| 分支 | `master` |
| `git status` | 干净 |
| `npm run type-check` | 通过 |
| `npm run build`（构建后再看 `git status`） | **无 `dist/` 变更** → `src/` 与 `dist/` 一致 |

## 前置子任务状态（PRD 要求 1/2/3 全部完成）

| 子任务 | 状态 | 归档位置 |
| --- | --- | --- |
| 1 `09-26-native-style-and-fold-fix` | ✅ 已归档 | `archive/2026-09/` |
| 2 `09-26-full-audit-and-hardening` | ✅ 已归档 | `archive/2026-09/` |
| 3 `09-26-native-bg-selector-takeover` | ✅ 已归档 | `archive/2026-09/` |

## ⚠️ 前序子任务已作废的规划条目（本文件的核心警告）

PRD 的 R-1 风险**已成真**：文档任务排在最后，而前两个子任务改掉了它规划时假设的东西。
执行前必须按本表修订，否则会写出**描述已删除功能**的文档。

| 规划条目 | 原内容 | 现状 | 处置 |
| --- | --- | --- | --- |
| **B4** | 「读 `src/core/ShortcutManager.ts` 提取快捷键表」 | 文件**已删除**（子任务 2 的 K1：五个 Alt 快捷键全部移除） | 删除该步骤；改为在文档中说明「快捷键已移除」及其**替代入口**（背景可见性 → 面板勾选框；接管 → 面板下拉） |
| **D4** 的一半 | 「`UI-Components-and-Shortcuts.md`（迷你播放器 + 毛玻璃 + 转场 5 种 + **快捷键全表**）」 | 快捷键已不存在；`shortcutsEnabled` 字段已从 `BgLoaderSettings` 删除 | 文档改为「UI 组件与转场」，**不写快捷键全表**；另加一小节说明「曾经有快捷键、为何移除、现在用什么」（含 Alt+F 与浏览器app-menu 加速键冲突的理由） |
| **D2 的「原生背景面板集成」** | 「`NativeBgAugmenter`（及子任务 3 的接管）」 | `NativeBgAugmenter` **已删除**，由 `NativeBackgroundController` 接管整体取代 | 文档以**接管控制器**为准：位置 `src/ui/NativeBackgroundController.ts` |
| **D2 的「设置项全表」** | 「`BgLoaderSettings`（约 30 个字段）」 | 字段集合已变：**删** `chatBindings`/`enabled`/`muffleOnDrawer`/`playlist`/`shortcutsEnabled`；**增** `backgroundVisible`/`cacheQuotaMB`/`lruAutoClean`/`nativeTakeover` | 以 `src/types/index.ts` 的 `DEFAULT_SETTINGS` 为准**重新清点**，不沿用规划期数量 |

## 前序子任务新增的、必须在文档中体现的能力

| 能力 | 实现 | 用户可见入口 |
| --- | --- | --- |
| 背景可见性（持久化） | `settings.backgroundVisible` + `MediaMount.setVisible` | 设置面板「Media Library」区勾选框 |
| 浏览器缓存配额 + 自动清理 | `settings.cacheQuotaMB` / `lruAutoClean` | 设置面板缓存区滑块 + 勾选框 |
| **原生选择器接管** | `NativeBackgroundController` + `settings.nativeTakeover` | 设置面板「Media Library」区下拉（全部接管 / 仅非图片 / 关闭） |
| 原生缩略图按类型徽章 | `.st-bg-native-badge.<type>` | 原生背景面板缩略图左上角 |
| 原生面板当前背景标记 | `.st-bg-takeover-selected` + `.st-bg-native-current` | 原生背景面板对应缩略图轮廓 + 左下角圆点 |

## 已确认不可写入文档的内容（Non-goals）

- 快捷键全表（已移除）。
- T3（把扩展媒体注入原生网格）—— 用户已裁定不做，不写。
- 任何无法在 `src/` 定位依据或 Dev 实测的断言（如「0% CPU 占用」这类表述）→ 改写为可验证表述，
  或列入 `research/doc-uncertainties.md`。