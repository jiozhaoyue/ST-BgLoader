# 技术设计 — 全功能文档补齐

## 1. 文档架构（新增与修订）

既有 8 个专题文档的结构保留，**新增 4 个专题文档**，修订 3 个既有文档。

```
wiki/
├── Home.md                                   [修订] 功能矩阵补 4 项；目录补新增文档
├── _Sidebar.md                               [修订] 补新增文档
├── Architecture-and-Design.md                [修订] 补模块清单；修正存储定位
├── Public-API-Reference.md                   [修订] 补 config/settings 类 API；补事件总线全表
├── Atmospheric-Weather-Engine.md             [核对]
├── Audio-Engine-and-Visualizer.md            [核对]
├── Smart-Triggers-and-Scene-Automation.md    [修订] 区分面板可配 vs API 可配（D3）
├── Character-Card-Integration.md             [核对]
├── Performance-and-Caching-Guide.md          [重写] 存储模型修正（D1）
├── FAQ-and-Troubleshooting.md                [修订] CORS 答案补 Authority 回退
├── ── 新增 ──
├── Settings-Reference.md                     【新】全部设置项 + 默认值 + 作用 + 面板入口
├── Storage-and-Authority-Integration.md      【新】存储模型 + Authority 增强 + Agent 工具
├── Native-Background-Integration.md          【新】原生面板集成 + 接管开关 + 徽章
└── UI-Components-and-Shortcuts.md            【新】迷你播放器 + 毛玻璃 + 转场 + 快捷键
README.md                                     [修订] 文档索引同步
```

**为什么用 4 篇而非 10 篇**：新增面之间存在强关联——「设置项全表」是索引性文档，「存储与 Authority」是后端面，「原生背景集成」是宿主集成面，「UI 组件与快捷键」是前端交互面。按「读者要解决什么问题」分篇，而非按代码模块分篇；避免 29 个模块各写一章导致无人阅读。

## 2. `Settings-Reference.md` 的结构（核心交付物）

```markdown
# 设置项参考 (Settings Reference)

> 与本页对应的代码真源：`src/types/index.ts` 的 `BgLoaderSettings` 与 `DEFAULT_SETTINGS`。
> 「面板入口」列标注该设置在设置抽屉中的位置；标为「—」表示无面板控件，仅可通过
> 公共 API 或导入 JSON 修改。

## 媒体与显示
| 设置项 | 类型 | 默认值 | 作用 | 面板入口 |
| --- | --- | --- | --- | --- |
| `activeMediaId` | `string \| null` | `null` | 当前生效的媒体条目 id | 媒体库卡片点击 |

## 音频
…

## 视觉滤镜
…

## 天气 / 律动 / 视差 / 白噪音
…

## 触发器与场景
…

## 存储与后端
| `cacheQuotaMB` | `number` | `1024` | 浏览器缓存上限（MB），超出时按 LRU 清理 | — （无面板控件） |
| `lruAutoClean` | `boolean` | `true` | 导入后是否自动执行 LRU 清理 | — |
| `agentToolsEnabled` | `boolean` | `false` | 允许 Authority Agent 调度氛围工具 | 存储与 Authority 增强 区 |
…

## 无面板入口的设置项汇总
> 以下字段当前没有任何 UI 入口，只能通过 API 或导入 JSON 设置。它们的实际状态见
> `.trellis/tasks/09-26-full-audit-and-hardening/research/prune-candidates.md`。
| `enabled` / `muffleOnDrawer` / `playlist` / `chatBindings` | … |
```

**关键设计**：把「无面板入口」的字段**显式列出并标注**，而不是假装它们可用。这直接满足用户「把现有功能全部写清楚」——包括「看起来有其实没有」的部分。

## 3. `coverage-matrix.md` 的格式

```markdown
| # | 源文件 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | src/core/MediaMount.ts | 双缓冲图层挂载、5 种转场、滤镜、fitting 联动 | UI-Components-and-Shortcuts.md §转场 | ✅ |
| 2 | src/ui/NativeBgAugmenter.ts | 原生面板类型徽章、点击接管 | Native-Background-Integration.md | ✅ |
| … | … | … | … | … |
```

29 行，无空缺。`状态` 列取值 `✅ 已覆盖` / `📝 本次新增` / `🔄 本次修订`。

## 4. `doc-uncertainties.md` 的格式

凡无法从代码确证、又无法实测的陈述，一律进此表，正文对应处标注 `⚠️ 待核实` 并指向本表：

```markdown
| 编号 | 陈述 | 出处 | 不确定原因 | 处置 |
| --- | --- | --- | --- | --- |
| U1 | 「天气关闭时 0% CPU 占用」 | Home.md 功能矩阵 | 未实测；canvas 停止 RAF 后理论为 0，但 ResizeObserver 仍在 | 改为可验证表述 |
```

## 5. 修订既有文档的边界

| 文档 | 允许的改动 | 禁止的改动 |
| --- | --- | --- |
| `Performance-and-Caching-Guide.md` | 重写「存储体系」定位为「服务端真源 + 浏览器热缓存」；保留 LRU 与内存生命周期的技术细节 | 删除压力测试章节（改为标注测试条件与日期，或标注为历史数据） |
| `Architecture-and-Design.md` | 补模块清单表；存储章节与上者对齐 | 重画架构图（保留原有图，仅补文字清单） |
| `Smart-Triggers-and-Scene-Automation.md` | 加「面板可配 vs API 可配」对照表 | 改既有正则案例 |
| `FAQ-and-Troubleshooting.md` | 补 Authority 服务端导入回退 | 删既有 Q&A |
| `Home.md` / `_Sidebar.md` / `README.md` | 同步索引 | 改功能矩阵中已有条目的技术实现描述（除无法核实的表述） |

其余文档（天气 / 音频 / 角色卡）**只核对不改写**，除非发现事实错误。

## 6. 事实核验方法

| 文档内容 | 核验方式 |
| --- | --- |
| 设置项名/默认值 | 直接读 `src/types/index.ts` 的 `DEFAULT_SETTINGS` |
| 面板文案与位置 | 读 `src/ui/SettingsDrawer.ts` 的模板字符串 |
| API 签名 | 读 `src/api/PublicAPI.ts` 的公开方法签名 |
| 事件名与载荷 | 读 `src/api/PublicAPI.ts` 的 `emit()` 调用点 |
| 内置预设/场景值 | 读 `src/types/index.ts` 的 `BUILTIN_PRESETS` / `BUILTIN_SCENES` |
| 运行时行为（自动播放解锁、切后台、降级路径） | Dev 实例实测；不可实测则进 `doc-uncertainties.md` |
| 快捷键 | 读 `src/core/ShortcutManager.ts` |

**不采用「凭 README/wiki 现有描述推断」的方式**——现有描述本身可能是待修正对象。

## 7. 验证设计

1. **覆盖矩阵自检**：29 行全部填满，`grep -c '| ✅\|📝\|🔄'` 等于总行数。
2. **设置项自检**：脚本比对 `DEFAULT_SETTINGS` 的键集合与 `Settings-Reference.md` 表格首列，**差集为空**。
3. **内置值自检**：`BUILTIN_PRESETS` / `BUILTIN_SCENES` / 枚举类型与文档表格逐项比对。
4. **死链自检**：`_Sidebar.md` / `Home.md` / `README.md` 中的相对链接目标文件均存在。
5. **过期表述自检**：`grep -rn "CacheStorage.*存储\|缓存在浏览器\|仅存于本地" wiki/ README.md` 无命中。
6. **抽查**：随机抽 10 条陈述回查 `src/`。

## 8. 回滚

纯文档，revert 即恢复。

## 9. 未决项

- `Performance-and-Caching-Guide.md` 的压力测试数据是保留（标注历史）还是移除——取决于其是否可复现；执行时先跑一次 `tests/stress.mjs` 对比。
- 新增 4 篇是否有需要合并的——若某篇最终不足 40 行，则并入相邻文档。
