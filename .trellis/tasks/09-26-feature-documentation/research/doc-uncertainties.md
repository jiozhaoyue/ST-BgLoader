# 文档不确定项（不得写成确定语气）

> 子任务 4 PRD R4 / `implement.md` C2 的交付物。凡**无法在 `src/` 定位依据、也无法在 Dev 实例实测**
> 的陈述，一律登记在此，正文中标注「待核实」而不是写成定论。
>
> 基线 `141dc72`。

## 待核实

| # | 陈述 | 为何无法确证 | 正文处理 |
| --- | --- | --- | --- |
| U-1 | 「扩展对宿主渲染性能的影响可忽略 / 0% CPU 占用」 | 规划期已有文档出现过这类表述（PRD Non-goals 点名）。性能随媒体类型、分辨率、是否开天气/视差/律动而变，单一数字不成立 | **不写绝对数字**。改为列出「会持续消耗的分项」（视差 rAF、律动 rAF、天气粒子、视频解码）并给出「可关掉哪些」的操作建议。若 `Performance-and-Caching-Guide.md` 原句无法核实，删除该句并在提交信息说明 |
| U-2 | 压力测试的具体数字（缓存命中耗时、内存占用、大文件吞吐） | 与机器、媒体、浏览器版本强相关；本轮**未**重跑可复现的基准测试 | 保留原数字时**必须**标注测试条件与日期来源；无法标注来源的整段删除（PRD D4 已列为待核对项，执行 Phase E 时逐条处置） |
| U-3 | 各图床（Catbox / Imgur）当前的 CORS 行为 | 属第三方服务的外部事实，随时可变 | FAQ 不用「支持 CORS 的图床（如 …）」这种会过期的推荐；改为说明**判定方法与失败后的回退**（见 U-4） |
| U-4 | Authority 服务端导入回退（`RemoteImporter`）在宿主**未装 Authority** 时的确切失败形态 | 代码路径明确（直连失败 → `RemoteImporter.import` → 未装则抛错），但**用户可见的错误文案**未实测 | 只写机制与「未装 Authority 时该回退不可用」，不猜测具体弹窗文案 |
| U-5 | 宿主 `backgrounds/` 目录在不同宿主（ST / Luker / PureTavern / TauriTavern）下是否同路径 | 本轮只实测了 **Dev Luker**；仓规 L0-12 明确宿主间存在差异 | 文档写「在 SillyTavern 及其分支上为服务端 `backgrounds/` 用户目录」，**不逐宿主承诺**；跨宿主差异指向 `.trellis/spec/frontend/host-native-ui.md` |
| U-6 | AI 导演模式（`agentToolsEnabled`）注册的 Agent 工具在 Authority 侧的**完整**工具清单与调用样例 | 代码给出注册面，但真实调用需要一个跑着 Agent Runtime 的后端，本轮未做端到端调用验证 | 只写「注册了哪些能力的工具」与开启方式，**不给调用样例**，并注明需自行在 Authority 侧查看 |
| U-7 | 「自动播放策略」在各浏览器/宿主下的具体表现 | 依赖浏览器 autoplay 策略与用户交互历史 | 写机制（首次用户交互前静音等待解锁）+ 可观测表现，不写「所有浏览器都会 …」 |

## 已核实、可以放心写成定论（反向记录，避免后来者重复怀疑）

| # | 陈述 | 依据 |
| --- | --- | --- |
| V-1 | 天气类型恰为 6 种，与 `WeatherType` 完全一致 | `src/types/index.ts:94` `WEATHER_TYPES`；PRD D4-1 核对通过 |
| V-2 | 内置预设 6 个、内置场景 4 个 | `src/types/index.ts` 的 `BUILTIN_PRESETS` / `BUILTIN_SCENES` |
| V-3 | 转场类型 5 种 | `TransitionType`（`src/types/index.ts:111`） |
| V-4 | `settings` 顶层键 **26** 个 | `DEFAULT_SETTINGS` 实测清点（`grep -cE '^\s{4}\w+:'` 得 26）。**注意**：初稿曾误记为 28（手数出错），已按命令输出订正 —— 文档里的任何计数都必须来自命令输出而不是目测 |
| V-5 | 公开 API 方法 **40** 个（含 4 个 `async`：`getMediaList` / `playBGM` / `preloadMedia` / `setBackground`）、事件名 **22** 个 | `src/api/PublicAPI.ts`（方法）+ `PublicAPI.ts` 与 `src/index.ts` 的 `emit` 调用点**并集**（事件）。初稿用不含 `async` 的正则漏计 4 个方法，已订正 |
| V-6 | `src/` = **28 个文件**（27 `.ts` + `style.css`）、**8096 行**（`.ts` 7550 + `css` 546） | 与 PRD 规划期的「29 个文件 / ~7231 行」不同，差异原因见 `doc-baseline.md` |
| V-7 | 面板控件 id **73** 个 | `grep -oE 'id="st_[a-z_0-9]+"' src/ui/SettingsDrawer.ts \| sort -u \| wc -l`。初稿曾误记为 60 |

## 已知的文档-实现不一致（须在正文中**显式区分**，不是「待核实」）

| # | 内容 | 依据 | 正文处理 |
| --- | --- | --- | --- |
| X-1 | `TriggerAction` 类型支持 5 类动作（`mediaIdOrUrl` / `bgmUrl` / `weather` / `preset` / `filters`），但设置面板的规则表单只创建 `{ preset, weather }` | PRD D3；`SettingsDrawer.ts` 的规则表单实现 | 触发篇必须给出「**面板可配 vs 仅 API 可配**」对照表，并注明 API 出处。不写成「面板能配全部」 |
| X-2 | `FAQ` 的 Q2 把导入结果描述为「存入本地持久化离线缓存」 | `wiki/FAQ-and-Troubleshooting.md:17` | **这是 D1 同源的过期表述**：真源是服务端 `backgrounds/`，浏览器侧只是可清理的热缓存。Phase E4 一并修正 |

## 执行时新增（如有）

写文档过程中若遇到新的无法确证项，追加到本表，不要在正文里含糊过去。