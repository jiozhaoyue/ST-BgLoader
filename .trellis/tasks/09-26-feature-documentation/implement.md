# 实现清单 — 全功能文档补齐

> 复选框随执行**实时勾选**（L0-2）。前置条件：子任务 1 / 2 / 3 全部提交。

## Phase A：冻结基线

- [x] A1 确认子任务 1 / 2 / 3 已提交、`git status` 干净
- [x] A2 重新核对 `src/` 与 `dist/` 一致性（`npm run build` 后 `git status` 应无 `dist/` 变更；若有则说明产物未同步，先同步再冻结）
      > 实测：build 后 `git status` 仍为空 → 一致。
- [x] A3 `npm run type-check && npm run build` 绿
- [x] A4 记录本次文档基线的 commit hash 到 `research/doc-baseline.md`
      > 基线 `141dc72`。该文件同时记录了 **PRD R-1 风险成真的清单**：前两个子任务作废了本任务规划的
      > 4 处（快捷键已删、`NativeBgAugmenter` 已删、设置字段集合已变），**动手写文档前必须先读它**。
- [x] A5 任务激活（`task.py start`）

## Phase B：事实采集（只读）

- [x] B1 读 `src/types/index.ts` 提取：`DEFAULT_SETTINGS` 全字段 + `BUILTIN_PRESETS` + `BUILTIN_SCENES` + 全部枚举（`WeatherType`/`VisualizerMode`/`TransitionType`/`AmbientSoundType`/`PlaybackMode`/`MediaType`）
      > 实测：`DEFAULT_SETTINGS` **26** 个顶层键 + 6 个嵌套对象；`BUILTIN_PRESETS` 6 个；`BUILTIN_SCENES` 4 个；
      > 枚举含 `TakeoverLevel` 共 7 个。天气 6 种（`WEATHER_TYPES` + `WEATHER_LABELS` 同处声明）。
- [x] B2 读 `src/api/PublicAPI.ts` 提取全部公开方法签名 + `emit()` 的事件名清单
      > **40** 个公开方法（含 4 个 `async`）、**22** 个事件名（`PublicAPI.ts` 与 `src/index.ts` 的 `emit`
      > 调用点并集 —— 只看前者会漏掉 `play-state-change` 与 `settings-sync`）。
- [x] B3 读 `src/ui/SettingsDrawer.ts` 提取面板分区结构与文案、每个控件的 id 与对应设置项
      > 11 个分区、**73** 个控件 id（全量 `grep -oE 'id="st_[a-z_0-9]+"' | sort -u`）。
- [x] B4 ~~读 `src/core/ShortcutManager.ts` 提取快捷键表~~
      > **已作废**：该文件在子任务 2 的 K1 中被删除（五个 Alt 快捷键全部移除）。改为「**确认快捷键确实
      > 不存在**」——`grep -rn "shortcutsEnabled\|ShortcutManager" src/` 应为 0，并在文档中写明移除理由
      > （Alt+F 与浏览器 app-menu 加速键冲突、Ctrl+Alt 被 Windows 保留）与替代入口。
      > 实测：`src/` 内两者**均为 0 命中**（仅 `implement.md` 与 spec 的历史说明里出现文件名）。
- [x] B4b 读 `src/ui/NativeBackgroundController.ts` 提取接管行为面（三档开关、五条放行规则、降级条件）
      > 该模块为本会话所写，行为面已固化在 `.trellis/spec/frontend/host-native-ui.md` §8（可直接引用）。
- [x] B5 读 `src/backend/*` 提取存储模型与 Authority 能力面（`AuthorityCapabilities` 各字段语义）
      > `available` / `sync`（KV 跨设备同步）/ `serverFetch`（CORS 受阻媒体的服务端导入回退）/
      > `agentTools`（Agent 工具注册，另受用户设置门控）+ `agentToolsState`（`unknown` 直到首次注册尝试）
      > + `degradedReason`（`sdk-missing` / `init-failed` / `permission-denied`）。
- [x] B6 读 `src/index.ts` 提取初始化顺序与生命周期钩子
- [x] B7 逐文件清点 29 个模块的对外功能，形成覆盖矩阵草稿
      > 实际是 **28 个文件**（规划期的 29 已过期，原因见 `doc-baseline.md`）。矩阵已落盘。

## Phase C：覆盖矩阵与不确定项

- [x] C1 `research/coverage-matrix.md` 落盘（29 行，无空缺）
      > 按 28 个 src 文件 + 3 个测试套件分 13 组，**空缺 0**。
- [x] C2 `research/doc-uncertainties.md` 落盘（无法从代码确证且无法实测的陈述）
      > 7 条待核实（U-1..U-7）+ 7 条已核实（V-1..V-7）+ 2 条「已知的文档-实现不一致」（X-1..X-2）。
- [x] C3 逐条验证 PRD 的 D4 待核对项（天气清单、压力测试数据、CORS 答案、设置项文案）
      > - D4-1 天气清单：**通过**，与 `WEATHER_TYPES`（6 种）完全一致。
      > - D4-2 压力测试数据：**待 Phase E1 处置**（本轮未重跑可复现基准 → 已登记为 U-2）。
      > - D4-3 CORS 答案：**确认过期**。`FAQ-and-Troubleshooting.md:17` 既未提 Authority 服务端导入
      >   回退（`RemoteImporter`，`AuthorityCapabilities.serverFetch`），还把结果描述成「存入本地持久化
      >   离线缓存」——**与 D1 同源的过期表述**，Phase E4 一并修正（已登记为 X-2）。
      > - D4-4 设置项文案：**待 Phase E9/写 SET 时逐条比对**（面板文案以 `SettingsDrawer.ts` 模板串为
      >   唯一真源，已登记为 V-7）。

## Phase D：新增文档

- [ ] D1 `wiki/Settings-Reference.md`（**核心交付物**：全字段 + 默认值 + 作用 + 面板入口 + 无入口项汇总）
- [ ] D2 `wiki/Storage-and-Authority-Integration.md`（服务端真源 + 浏览器热缓存 + Authority 能力 + Agent 工具 + 降级路径）
- [ ] D3 `wiki/Native-Background-Integration.md`（原生面板徽章 + 接管开关三档 + 接管范围与五条放行规则 + 退出方式）
      > 实现主体是 `src/ui/NativeBackgroundController.ts`（**不是**规划期写的 `NativeBgAugmenter`——该文件
      > 已删除）。接管的完整行为契约见 `.trellis/spec/frontend/host-native-ui.md` §8。
- [ ] D4 `wiki/UI-Components-and-Transitions.md`（迷你播放器 + 毛玻璃 + 转场 5 种）
      > **原名为 `UI-Components-and-Shortcuts.md`**：快捷键已不存在（B4 已作废），文件名与内容一并去掉
      > 快捷键全表；改加一小节「快捷键的历史与替代入口」，说明移除了什么、为什么、现在用什么。
      > 注意 `_Sidebar.md` / `Home.md` / `README.md` 的链接要跟着用**新文件名**。
- [ ] D5 每篇写完即做一次「抽查 10 条陈述回查 `src/`」

## Phase E：修订既有文档

- [ ] E1 `Performance-and-Caching-Guide.md`：存储模型定位修正（D1）+ 压力测试数据按 A/B 裁定处置
- [ ] E2 `Architecture-and-Design.md`：补模块清单表 + 存储章节对齐
- [ ] E3 `Smart-Triggers-and-Scene-Automation.md`：加「面板可配 vs API 可配」对照表（D3）
- [ ] E4 `FAQ-and-Troubleshooting.md`：CORS 答案补 Authority 服务端导入回退
- [ ] E5 `Public-API-Reference.md`：补 config/settings 类 API 与事件总线全表
- [ ] E6 `Home.md`：功能矩阵补 4 项 + 目录补新增文档
- [ ] E7 `wiki/_Sidebar.md`：补新增文档
- [ ] E8 `README.md`：文档索引同步
- [ ] E9 天气 / 音频 / 角色卡三篇：**仅核对**，发现事实错误才改

## Phase F：自检与收尾

- [ ] F1 覆盖矩阵自检：29 行状态列全满
- [ ] F2 设置项自检：`DEFAULT_SETTINGS` 键集合 与 `Settings-Reference.md` 首列 差集为空
- [ ] F3 内置值自检：预设/场景/枚举与文档表格逐项一致
- [ ] F4 死链自检：相对链接目标文件均存在
- [ ] F5 过期表述自检（命令见下）
- [ ] F6 抽查 10 条陈述回查 `src/`
- [ ] F7 提交、推送 `origin master`
- [ ] F8 归档子任务

## 验证命令

```bash
node -e "const t=require('fs').readFileSync('wiki/Settings-Reference.md','utf8');const s=require('fs').readFileSync('src/types/index.ts','utf8');const m=s.match(/export const DEFAULT_SETTINGS[\s\S]*?\n};/)[0];const keys=[...m.matchAll(/^\s{4}([a-zA-Z_]+):/gm)].map(x=>x[1]);const missing=keys.filter(k=>!t.includes(k));console.log('缺失设置项:',missing.length?missing:'无')"
```

```bash
grep -rn "CacheStorage.*存储\|仅存于本地\|只存在浏览器" wiki/ README.md || echo "OK: 无过期存储表述"
```

```bash
for f in $(grep -oE '\]\([A-Za-z0-9._/-]+\.md\)' wiki/_Sidebar.md wiki/Home.md | sed 's/](\(.*\))/\1/' | sort -u); do [ -f "wiki/$f" ] || echo "死链: $f"; done; echo "死链检查完毕"
```

```bash
npm run type-check && npm run build
```

## 回滚点

- RP-1：Phase D 新增文档单独提交（纯新增，可独立回滚）
- RP-2：Phase E 修订既有文档单独提交（可从旧版恢复）

## 纪律

- **不臆造**：任何无法在 `src/` 定位依据的陈述不得写成确定语气。
- **不改代码**：发现必须改代码才自洽的问题 → 记录并转交对应子任务。
- 既有文档的既有内容默认保留；修正是**例外**且须在提交信息中说明理由。
- 文档语言：中文正文，代码标识符/命令/专有名词保留原文。
