# 全功能文档补齐

## Goal

把扩展**现有全部功能**写清楚：每个功能的用途、入口位置、设置项与默认值、交互方式、依赖与限制；补齐模块与数据流说明；并核对既有 `wiki/` 与 `README.md`，消除遗漏、过期与臆造。

## Background — 现状盘点

### 已有文档（`wiki/` 10 篇 / 853 行 + `README.md`）

| 文档 | 覆盖 |
| --- | --- |
| `Home.md` | 功能矩阵、快速上手、目录 |
| `Architecture-and-Design.md` | 架构全景图、零负载抽象、双缓冲重入锁、WebAudio 图谱、流式存储 |
| `Public-API-Reference.md` | `window.stBgLoader` 全部 API |
| `Atmospheric-Weather-Engine.md` | 天气预设、参数、性能 |
| `Audio-Engine-and-Visualizer.md` | 播放模式、自动播放策略、切后台、隔音、律动/频谱 |
| `Smart-Triggers-and-Scene-Automation.md` | 触发维度、动作、正则案例、防抖 |
| `Character-Card-Integration.md` | 开场白初始化、世界书绑定、Canvas 小游戏背景 |
| `Performance-and-Caching-Guide.md` | 缓存体系、LRU、内存生命周期、压力测试数据 |
| `FAQ-and-Troubleshooting.md` | 5 条 FAQ + 控制台自检 |

### 已识别的文档缺陷

**D1 — 存储模型描述过期（重要）**
`Performance-and-Caching-Guide.md` 与 `Architecture-and-Design.md` 把「`CacheStorage` + `IndexedDB` 复合缓存」描述为存储体系主体。但经 `09-13-server-native-storage`、`09-19-server-settings-persistence` 两个任务后，**真源已是服务端 `backgrounds/` 目录**（`ServerOrigin`），浏览器侧只是**可清理的热缓存**（`CacheManager`）。当前描述会误导读者以为媒体只存在浏览器本地。→ 必须改写。

**D2 — 完全缺失的功能面**

| 缺失面 | 对应实现 | 影响 |
| --- | --- | --- |
| **存储模型与 Authority 集成** | `ServerOrigin` / `ServerSettings` / `SettingsSync` / `AuthorityBridge` / `AgentBridge` / `RemoteImporter` | 设置面板有「存储与 Authority 增强」区，文档零覆盖 |
| **原生背景面板集成** | `NativeBgAugmenter`（及子任务 3 的接管） | 用户会在原生面板看到徽章却无处可查 |
| **毛玻璃对话 UI** | `FrostedGlassController` | 仅在功能矩阵出现一行，无参数与使用说明 |
| **迷你播放器** | `MiniPlayer` | 同上 |
| **快捷键全文** | `ShortcutManager` | 功能矩阵一句话，无逐键行为与冲突说明 |
| **设置项全表** | `BgLoaderSettings`（约 30 个字段） | **没有任何一处列出全部设置项 + 默认值 + 作用** |
| **内置预设与内置场景名录** | `BUILTIN_PRESETS`（6 个）/ `BUILTIN_SCENES`（4 个） | 内置值未成表 |
| **转场特效说明** | `MediaMount` 的 5 种转场 | 无专项说明 |
| **模块与文件结构** | `src/` 29 个文件 | 架构图不含模块清单 |
| **测试体系** | `tests/e2e.mjs` / `stress.mjs` / `authority.mjs` | 无文档；贡献者不知如何验证 |

**D3 — 能力与界面不一致（需在文档中说清）**
`TriggerAction` 类型支持 `mediaIdOrUrl` / `bgmUrl` / `weather` / `preset` / `filters` 五类动作，但设置面板的规则表单只创建 `{ preset, weather }`（[`SettingsDrawer.ts:958-961`](src/ui/SettingsDrawer.ts:958)）。→ 文档须区分「面板可配」与「API 可配」，避免读者以为面板能做全部。

**D4 — 待核对项**（文档任务执行时逐条验证，不得凭印象）
- 天气预设清单是否与 `WeatherType`（`off/rain/snow/sakura/cyber_motes/scanlines`）一致。
- `Performance-and-Caching-Guide.md` 的压力测试数据是否为可复现的当前数据（否则标注测试条件与日期，或移除）。
- `FAQ` 中「URL 导入 CORS」的答案是否仍准确（现已具备 Authority 服务端导入回退）。
- 各文档提到的设置项名称是否与面板实际文案一致。

## Requirements

1. **R1 全量清点**：以 `src/` 为准逐模块清点对外功能，形成「功能 → 文档位置」的覆盖矩阵，**不留空行**。
2. **R2 修正过期**：修正 D1 等过期描述，使文档与当前实现一致。
3. **R3 补齐缺失**：按 D2 清单补齐缺失文档面；「设置项全表」为**必交付物**（用户明确要求「把现有功能全部写清楚」）。
4. **R4 不臆造**：所有陈述必须能在 `src/` 中找到依据；不确定的标注「待核实」并列入 `research/doc-uncertainties.md`，**不得写成确定语气**。
5. **R5 内置值成表**：`BUILTIN_PRESETS`、`BUILTIN_SCENES`、转场类型、天气类型、白噪音类型、快捷键 —— 一律以表格呈现，值取自 `src/types/index.ts`。
6. **R6 区分层级**：明确区分「设置面板可配」与「仅 API 可配」（如 D3），并注明 API 文档出处。
7. **R7 结构自洽**：新增文档纳入 `wiki/_Sidebar.md` 与 `Home.md` 目录；`README.md` 的文档索引同步更新。
8. **R8 语言与风格**：中文正文，代码标识符/命令/专有名词保留原文（项目既有惯例）。
9. **R9 覆盖平台集成**：文档须说明与原生背景面板的关系（含子任务 3 的接管行为与开关）。
10. **R10 测试体系文档**：新增一节说明三套件的作用、前置条件（需运行中的 ST 实例与 `TEST_TARGET_URL`）与执行方式。

## Non-goals

- 不写营销文案；不夸大能力（既有文档中的「0% CPU 占用」等表述若无法核实，改为可验证的表述）。
- 不为尚未实现的功能写文档（如 T3 原生网格注入若未做，不写）。
- 不改代码（纯文档任务）；若发现必须改代码才能自洽，记录并转交对应子任务。
- 不重写已有文档的结构（除非内容确实过期）。

## Acceptance Criteria

- [ ] `research/coverage-matrix.md` 落盘：`src/` 全部 29 个模块 → 文档位置，无空缺。
- [ ] 「设置项全表」落盘：`BgLoaderSettings` 全部字段 + 默认值 + 作用 + 面板入口（或标注「无面板入口」）。
- [ ] D2 缺失清单 10 项全部补齐。
- [ ] D1 过期描述已修正；全库 grep 不再出现把浏览器缓存描述为存储真源的表述。
- [ ] D4 逐条核对完毕；无法核实的项列入 `research/doc-uncertainties.md` 并在正文标注。
- [ ] 内置预设、内置场景、转场、天气、白噪音、快捷键全部成表，取值与 `src/types/index.ts` 一致。
- [ ] 三套件（e2e/stress/authority）有文档说明其作用与执行前置。
- [ ] 原生背景面板集成（含接管开关）有说明。
- [ ] `wiki/_Sidebar.md`、`Home.md`、`README.md` 的索引与新增文档一致，无死链。
- [ ] 抽查任意 10 条文档陈述，均可在 `src/` 中定位依据。
- [ ] 提交推送 `origin master`，子任务归档。

## Risks

- **R-1 文档与实现漂移**：本子任务排在最后，若前三子任务有返工则文档失效 → 开工前重新核对 `src/` 与 `dist/` 一致性并冻结基线（见 `implement.md` Phase A）。
- **R-2 只读代码易漏行为**：某些行为只在运行时显现（自动播放解锁、切后台暂停、降级路径）→ 以「代码 + Dev 实测」双证据为准，无法实测的标注来源。
- **R-3 范围膨胀**：29 个模块全写会失控 → 以「用户能用到的功能面」组织文档，模块清单作为附录取一次即可，不为每个内部类写专章。
- **R-4 改动既有文档引发争议**：重写 `Performance-and-Caching-Guide.md` 会删除既有表述 → 保留有价值的技术细节，只修正错误的定位，并在提交信息中说明修正理由。

## Rollback

纯文档改动，revert 即恢复旧文档；无运行时影响、无数据影响。
