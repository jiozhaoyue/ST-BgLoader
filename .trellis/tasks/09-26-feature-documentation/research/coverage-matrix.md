# 覆盖矩阵 — `src/` 模块 → 文档位置

> 子任务 4 PRD R1 的交付物。**基线 `141dc72`**（见 `doc-baseline.md`）。
>
> ⚠️ **模块数是 28，不是 PRD 规划期写的 29**：规划期清点 29 个文件（~7231 行），此后
> `src/core/ShortcutManager.ts` 被删除（子任务 2 的 K1）、`src/ui/NativeBackgroundController.ts` 新增
> （子任务 3）、`src/ui/NativeBgAugmenter.ts` 被删除 —— 净 −1。当前 `src/` 为 **27 个 `.ts` + 1 个
> `.css` = 28 个文件，8096 行**（`.ts` 7550 + `style.css` 546）。验收标准里的「29 个模块」按此理解为
> 「`src/` 全部文件」。

文档位置图例：`SET`=`wiki/Settings-Reference.md`、`STOR`=`wiki/Storage-and-Authority-Integration.md`、
`NATIVE`=`wiki/Native-Background-Integration.md`、`UI`=`wiki/UI-Components-and-Transitions.md`、
`ARCH`=`Architecture-and-Design.md`、`API`=`Public-API-Reference.md`、`WEATHER`=`Atmospheric-Weather-Engine.md`、
`AUDIO`=`Audio-Engine-and-Visualizer.md`、`TRIG`=`Smart-Triggers-and-Scene-Automation.md`、
`CARD`=`Character-Card-Integration.md`、`PERF`=`Performance-and-Caching-Guide.md`、
`FAQ`=`FAQ-and-Troubleshooting.md`、`HOME`=`Home.md`、`README`=`README.md`

## api/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `PublicAPI.ts` | `window.stBgLoader` 全部方法（40 个）+ 事件总线（`on/off/emit`）+ 22 个事件名 | API（全量）+ SET（config 类）+ ARCH | 待写 |

## audio/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `AudioEngine.ts` | BGM 播放、循环/单曲/随机、音量/静音/隔音、自动播放解锁、切后台暂停、上一首/下一首 | AUDIO（主体）+ SET | 待写 |
| `AmbientSoundGenerator.ts` | 程序化白噪音（雨/火/风），`type` + `volume` | AUDIO + SET | 待写 |

## backend/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `ServerOrigin.ts` | **存储真源**：宿主 `backgrounds/` 目录；上传/删除/列出/读取/下载；目录 TTL 缓存；宿主自有文件（favicon 等）读侧过滤 | STOR（主体）+ PERF（TTL 缓存） | 待写 |
| `ServerSettings.ts` | 设置的服务端文档 `st-bg-loader-settings.json`；revision 收敛；`hasServerDocument` 探测 | STOR + ARCH | 待写 |
| `SettingsSync.ts` | Authority KV 镜像（**降级为回退**，服务端文档优先）；防抖推送、指纹防回声、revision 轮询 | STOR | 待写 |
| `AuthorityBridge.ts` | Authority SDK 探测与能力面；`onCapabilitiesChanged`；**失败仅 console.warn，不阻断插件加载** | STOR | 待写 |
| `AgentBridge.ts` | AI 导演模式：把扩展能力注册为 Agent Runtime 工具（opt-in，`agentToolsEnabled`） | STOR + SET | 待写 |
| `RemoteImporter.ts` | URL 导入的服务端回退路径（直连下载失败时经 Authority 导入） | STOR + FAQ（CORS 答案） | 待写 |

## cache/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `CacheManager.ts` | 浏览器热缓存（CacheStorage L1 + IndexedDB LRU 索引）；配额、LRU 清理、objectURL 生命周期；**只作缓存、可清理可重建** | PERF（主体）+ STOR + SET | 待写 |

## core/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `MediaMount.ts` | 背景图层双缓冲挂载、5 种转场、fittings（对齐宿主）、滤镜、可见性、交互 | ARCH + UI（转场）+ SET | 待写 |
| `ParallaxController.ts` | 2.5D 视差（`enabled` + `intensity`） | SET + ARCH | 待写 |
| `SceneManager.ts` | 场景快照（内置 4 + 用户自定义）的应用与增删 | TRIG（场景自动化）+ SET | 待写 |
| `mediaType.ts` | 媒体类型判定单一真源（`detectMediaType`） | ARCH（模块清单） | 待写 |
| `sanitize.ts` | `escapeHtml` 共享工具 | ARCH（模块清单） | 待写 |
| ~~`ShortcutManager.ts`~~ | **已删除**（子任务 2 的 K1） | — | 无需文档；在 UI 篇写「快捷键已移除及替代入口」 |

## fx/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `AtmosphereFX.ts` | 天气粒子（6 种类型 + 密度/速度/不透明度/风） | WEATHER（主体）+ SET | 待写 |

## renderers/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `VideoRenderer.ts` | 视频背景（`<video>`，自动播放策略） | ARCH + PERF | 待写 |
| `ImageRenderer.ts` | 图片背景（朴素 `<img>` + `objectFit`） | ARCH | 待写 |
| `IframeRenderer.ts` | HTML/SVG 背景（sandbox `allow-scripts allow-same-origin`，**同源能力风险已在注释中说明**） | ARCH + FAQ（安全） | 待写 |

## triggers/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `TriggerManager.ts` | 智能触发规则（维度匹配 + 动作 + 防抖）；绑定宿主事件 | TRIG（主体）+ SET | 待写 |

## types/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `index.ts` | 全部类型与默认值：`BgLoaderSettings`（**26** 个顶层键）、`DEFAULT_SETTINGS`、`BUILTIN_PRESETS`（6）、`BUILTIN_SCENES`（4）、6 个枚举 | SET（全表，**必交付**）+ ARCH | 待写 |

## ui/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `SettingsDrawer.ts` | 设置面板全部分区与控件（**73** 个控件 id，全量清点） | SET（控件入口列）+ UI + HOME | 待写 |
| `MiniPlayer.ts` | 浮动迷你播放器胶囊（显隐、仅播放时显示、上一首/播放/下一首/模式） | UI（主体）+ SET | 待写 |
| `FrostedGlassController.ts` | 毛玻璃对话 UI（`enabled`/`blur`/`opacity`） | UI（主体）+ SET | 待写 |
| `NativeBackgroundController.ts` | **原生背景选择器接管**：三档开关、五条放行规则、徽章、选中标记、降级 | NATIVE（主体）+ SET | 待写 |
| `style.css` | 全部扩展样式（单文件，双前缀，无溢光） | ARCH（模块清单）+ NATIVE（视觉） | 待写 |
| ~~`NativeBgAugmenter.ts`~~ | **已删除**（子任务 3，被接管控制器取代） | — | 无需文档 |

## visualizer/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `AudioVisualizer.ts` | 音频律动（`off`/`pulse`/`spectrum`）+ 颜色 + 灵敏度 | AUDIO（主体）+ SET | 待写 |

## index.ts

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `index.ts` | 插件入口：初始化顺序、生命周期钩子、`applyMedia`、设置持久化与扇出、`PublicAPI` 装配 | ARCH（初始化顺序）+ API | 待写 |

## tests/

| 模块 | 对外功能 | 文档位置 | 状态 |
| --- | --- | --- | --- |
| `tests/e2e.mjs`（24 项） | 端到端功能回归 | README/ARCH（测试体系一节，PRD R10） | 待写 |
| `tests/stress.mjs`（4 项） | 大文件 / 0 字节 / 404 / Blob URL 生命周期 | 同上 | 待写 |
| `tests/authority.mjs`（18 项） | 服务端存储与 Authority 集成（需真后端） | 同上 | 待写 |

> 测试三套件均需**运行中的 ST 实例**与 `TEST_TARGET_URL`；文档须写明**只对 Dev 实例**运行
> （真实数据区禁止 E2E，见仓规 L0-1 / L0-13）。

## 汇总

| 分组 | 模块数 | 已定文档位置 | 空缺 |
| --- | --- | --- | --- |
| api | 1 | 1 | 0 |
| audio | 2 | 2 | 0 |
| backend | 6 | 6 | 0 |
| cache | 1 | 1 | 0 |
| core | 5（+1 已删） | 5 | 0 |
| fx | 1 | 1 | 0 |
| renderers | 3 | 3 | 0 |
| triggers | 1 | 1 | 0 |
| types | 1 | 1 | 0 |
| ui | 5（+1 已删） | 5 | 0 |
| visualizer | 1 | 1 | 0 |
| 入口 | 1 | 1 | 0 |
| tests | 3 | 3 | 0 |
| **合计** | **28 个 src 文件 + 3 个测试** | 全部 | **0** |

> 文档写完后再回来把「待写」逐行改为具体的**章节锚点**（如 `SET#音量`），以满足验收里的
> 「抽查任意 10 条陈述均可在 `src/` 中定位依据」。