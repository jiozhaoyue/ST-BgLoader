# 实现清单 — 全功能文档补齐

> 复选框随执行**实时勾选**（L0-2）。前置条件：子任务 1 / 2 / 3 全部提交。

## Phase A：冻结基线

- [ ] A1 确认子任务 1 / 2 / 3 已提交、`git status` 干净
- [ ] A2 重新核对 `src/` 与 `dist/` 一致性（`npm run build` 后 `git status` 应无 `dist/` 变更；若有则说明产物未同步，先同步再冻结）
- [ ] A3 `npm run type-check && npm run build` 绿
- [ ] A4 记录本次文档基线的 commit hash 到 `research/doc-baseline.md`
- [ ] A5 任务激活（`task.py start`）

## Phase B：事实采集（只读）

- [ ] B1 读 `src/types/index.ts` 提取：`DEFAULT_SETTINGS` 全字段 + `BUILTIN_PRESETS` + `BUILTIN_SCENES` + 全部枚举（`WeatherType`/`VisualizerMode`/`TransitionType`/`AmbientSoundType`/`PlaybackMode`/`MediaType`）
- [ ] B2 读 `src/api/PublicAPI.ts` 提取全部公开方法签名 + `emit()` 的事件名清单
- [ ] B3 读 `src/ui/SettingsDrawer.ts` 提取面板分区结构与文案、每个控件的 id 与对应设置项
- [ ] B4 读 `src/core/ShortcutManager.ts` 提取快捷键表
- [ ] B5 读 `src/backend/*` 提取存储模型与 Authority 能力面（`AuthorityCapabilities` 各字段语义）
- [ ] B6 读 `src/index.ts` 提取初始化顺序与生命周期钩子
- [ ] B7 逐文件清点 29 个模块的对外功能，形成覆盖矩阵草稿

## Phase C：覆盖矩阵与不确定项

- [ ] C1 `research/coverage-matrix.md` 落盘（29 行，无空缺）
- [ ] C2 `research/doc-uncertainties.md` 落盘（无法从代码确证且无法实测的陈述）
- [ ] C3 逐条验证 PRD 的 D4 待核对项（天气清单、压力测试数据、CORS 答案、设置项文案）

## Phase D：新增文档

- [ ] D1 `wiki/Settings-Reference.md`（**核心交付物**：全字段 + 默认值 + 作用 + 面板入口 + 无入口项汇总）
- [ ] D2 `wiki/Storage-and-Authority-Integration.md`（服务端真源 + 浏览器热缓存 + Authority 能力 + Agent 工具 + 降级路径）
- [ ] D3 `wiki/Native-Background-Integration.md`（原生面板徽章 + 接管开关 + 接管范围 + 退出方式）
- [ ] D4 `wiki/UI-Components-and-Shortcuts.md`（迷你播放器 + 毛玻璃 + 转场 5 种 + 快捷键全表）
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
