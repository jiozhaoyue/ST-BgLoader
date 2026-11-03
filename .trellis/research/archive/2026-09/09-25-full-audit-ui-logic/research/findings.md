# 体检发现 — 09-25-full-audit-ui-logic

> 逐文件结论 + 分级问题清单。每项带 file:line 证据；P1/P2 修复后回填「修复说明 + 验证结果」。
> 严重度定义见 design.md §3。

## 0. 基线（Phase A，2026-09-25）

| 项 | 结果 |
| --- | --- |
| `npm run type-check` | ✓ 通过 |
| `npm run build` | ✓ 160.35 kB（gzip 36.45 kB） |
| `npm run test:e2e`（8003） | ✓ 24/24 |
| `node tests/stress.mjs` | ✓ 4/4 |
| `node tests/authority.mjs` | ✓ 18/18（真后端模式，revision=125） |
| Dev 实例 | 8003 在线（302 正常）；8001 未启动 |

## 1. 机械自查（Phase B）

### 1.1 CSS 合规

- **作用域合规**：`style.css` 无 `*`/`body`/`:root`/裸元素顶层选择器。全部规则挂扩展前缀（`st-bgloader-*` / `st-bg-mini-*` / `st-bg-native-*`）。AGENTS.md 模板自查命令的 `bg-loader` 模式与本仓实际前缀不匹配，修正模式后：`grep '^\.' src/ui/style.css | grep -vc 'st-bg'` = 0 ✓。
- **硬编码色**（详见 F8）：`#1e1e24`(:99)、`#fff`(:128/:180)、`#ff5252`(:155)、box-shadow 影子色(:116)、五类媒体徽章语义色(:132-136)、中性半透明覆盖层多处；SettingsDrawer 内联样式与 `updateCloudPanel` 状态色（`#4fae6b`/`#c9a34f`）；FrostedGlass 暗色底 `rgba(18,18,24,…)`。

### 1.2 等待与泄漏面

- 渲染器三件套有界等待完好（Iframe 8s / Image、Video 15s + pendingSettle）✓；AudioEngine play() 两处 10s 竞速 ✓。
- document/window 挂点 9 处：AudioEngine `{once:true}` 自移除 ✓；其余见 F2/F13/F14 与逐文件结论。

### 1.3 合规面

- Host Bridge 零依赖 ✓（AuthorityBridge 仅探测 `window.STAuthority`，L0-12 合规）。
- `as any` 7 处（spec 基线 11）：5 处正当边界，2 处见 F9/P3-14。
- 日志 30 处全部带 `[ST-BgLoader]` 系标签 ✓，分布符合 spec（warn 21 / error 8 / log 13 量级）。

## 2. 逐文件结论（Phase C 精读）

| 文件 | 结论 |
| --- | --- |
| index.ts | F2/F13/P3-1/P3-2/P3-3；settings 扇出与 reconcile 逻辑正确 |
| ShortcutManager.ts | 本体干净（destroy 对称）；问题在 index.ts 双实例化（F2） |
| SceneManager.ts | 干净；P3-3（构造后替换的陈旧模式） |
| MediaMount.ts | F1（mount 并发竞态）/F13（host-ready 无回调）/P3-4（docObserver 无上限）；A/B 双缓冲与 crossfade 取消逻辑正确 |
| ParallaxController.ts | F14（enable 重入双监听）；rAF 循环停止条件正确 |
| renderers/* | 有界等待完好 ✓；P3-7（sandbox 组合 + postMessage '*' 安全面） |
| CacheManager.ts | 三层边界清晰 ✓；P3-6 相邻（objectUrl 并发创建窗口小） |
| ServerOrigin.ts | F7（sanitizeFilename 中文）/P3-6（manifest 并发写）；原生端点复用与 CSRF 探针符合 spec |
| ServerSettings.ts | 去抖/单飞/最新胜出正确 ✓；P3-11（跨标签页收敛仅限重载） |
| SettingsSync.ts | 指纹防回环 + 轮询收敛正确 ✓ |
| RemoteImporter.ts | 干净 ✓ |
| AuthorityBridge.ts | 降级契约完整 ✓；P3-12（notifyOnce 死分支）；ensureHttpAllowed 二次 init 失败会降级健康会话（自愈，可接受） |
| AgentBridge.ts | 有界注册/退避/claim 前置守卫/幂等补报 ✓ 全部健康 |
| AudioEngine.ts | F3（loop 单曲停止）；其余（竞速、交互解锁、音量应用）正确 |
| AmbientSoundGenerator.ts | F4（suspended ctx 无交互唤醒）；合成器资源清理正确 |
| AudioVisualizer.ts | P3-5（pulse 与视差同写 transform）；resize/destroy 对称 ✓ |
| AtmosphereFX.ts | 生命周期对称 ✓；垃圾 type 兜底依赖 F9 校验 |
| MiniPlayer.ts | F5（trackTitle 未转义）/P3-13（show 重建丢事件包装） |
| FrostedGlassController.ts | F8（暗色底硬编码）；样式注入前缀合规 ✓ |
| NativeBgAugmenter.ts | F10（detectType 清单漂移）/P3-4（bodyObserver 无上限）；复选标记防重复 ✓ |
| TriggerManager.ts | unbind/destroy 对称 ✓；P3-9（双事件源 + 逐消息编译正则，有 500ms 冷却） |
| SettingsDrawer.ts | F5/F6/F11/F12/P3-14（:668 as any）/P3-10（内联样式、全量刷新） |
| style.css | F8（硬编码色清单见 1.1）；作用域合规 ✓ |
| PublicAPI.ts | F9（setWeather 无校验）/F10（detectType 重复）；事件总线隔离 ✓ |
| types/index.ts | 干净 ✓（中央类型、默认值完整） |
| api/PublicAPI.ts 其余 | preload 并发队列正确 ✓ |
| vite.config / tests | 未在审查范围（三套件全绿为既有门禁） |

## 3. 分级问题清单

### P1（行为错误/风险 — 当场修）

| ID | 位置 | 问题 | 修复方案 | 状态 |
| --- | --- | --- | --- | --- |
| F1 | MediaMount.ts:151-263 | `mountMedia` 无并发保护：连点两个媒体卡片/触发器与自动恢复同时生效时，两次 async mount 交错读写同一目标层与 activeLayer，可能展示错误媒体 | mountPromise 链串行化（本次调用排队到前一次完成之后） | 待修 |
| F2 | index.ts:62 + ShortcutManager.ts:13-16 | 构造函数创建的 ShortcutManager（isEnabled 默认 true）注册了 window keydown，init() 换新实例但旧实例永不 destroy → 孤儿监听 | 字段懒创建：构造不建、init() 建，applySettingsToSubsystems 加空值保护 | 待修 |
| F3 | AudioEngine.ts:276-283 | loop 模式下 `audioElement.loop=false`，`handleTrackEnded` 又要求 `playlist.length > 1` → 单曲播完即停 | 条件改 `>= 1`（single 模式已提前 return） | 待修 |
| F4 | AmbientSoundGenerator.ts 全文 | 保存了环境音的用户刷新页面后 AudioContext suspended 且无交互唤醒监听 → 环境音静默失效直到碰设置 | 加一次性交互监听（pointerdown/keydown/touchstart）恢复 suspended ctx | 待修 |
| F5 | SettingsDrawer.ts:912-913/971 + MiniPlayer.ts:46 | 触发规则名/模式、媒体名、曲名未转义直接拼 innerHTML → 文件名含引号/HTML 时注入执行 | 新增 escapeHtml 工具，所有用户可控插值转义 | 待修 |

### P2（体验/一致性 — 当场修）

| ID | 位置 | 问题 | 修复方案 | 状态 |
| --- | --- | --- | --- | --- |
| F6 | SettingsDrawer.ts:642-651 | 滑块 `input` 事件每次触发 `onSettingsChanged` → 全量 settings localStorage 同步写 + revision 自增（拖一次滑块几十次写放大） | bindSlider 内对 onSettingsChanged 尾沿去抖 ~300ms；子系统实时回调保留 | 待修 |
| F7 | ServerOrigin.ts:371-373 | `sanitizeFilename` 把中文等非 ASCII 全替换为 `_` → 中文命名的媒体显示为 `______.mp4` | 正则改 unicode 类 `[\p{L}\p{N}]`（u 标志） | 待修 |
| F8 | style.css + SettingsDrawer + FrostedGlassController + MiniPlayer 内联 | 硬编码色多处（清单见 1.1）；FrostedGlass 暗色底在浅色主题下把气泡压暗 | 主题相关色改 `var(--SmartTheme*, fallback)`；语义/中性色保留并注释豁免理由 | 待修 |
| F9 | PublicAPI.ts:219-235 + SettingsDrawer.ts:668 | `setWeather` 不校验类型白名单：agent 工具/外部调用传入垃圾类型会持久化进设置并让 FX 空转 rAF；`:668` 用 `as any` 断言 density | PublicAPI 加白名单校验（invalid → warn + 忽略）；density 改显式窄化 | 待修 |
| F10 | 四处 detectType 重复且已漂移 | PublicAPI/CacheManager/ServerOrigin/SettingsDrawer/NativeBgAugmenter 五份实现，NativeBgAugmenter 缺 `m4v/aac/m4a` → m4v 被当 image | 收敛为单一 `src/core/mediaType.ts`，五处引用 | 待修 |
| F11 | SettingsDrawer.ts:869-892 | 添加触发规则需连过 3 个原生 prompt，删除/保存用原生 confirm/prompt——全抽屉最差交互 | 改为内联添加表单（类型/名称/模式 + 展开收起），删除保留 confirm | 待修 |
| F12 | SettingsDrawer.ts:1016-1031 | 文件上传/URL 导入无加载态：大文件或 60s 外部超时期间 UI 无任何反馈 | dropzone/按钮 busy 态（禁用 + 文案 + 样式类） | 待修 |
| F13 | index.ts:112-121 + MediaMount.ts:45-61 | `#bg1` 晚于插件 init 出现时（docObserver 路径），FX/可视化/视差永久不挂载 | MediaMount 增加 onHostReady 回调，index.ts 挂载逻辑进回调（幂等守卫） | 待修 |
| F14 | ParallaxController.ts:57-63 | `enable()` 可重入（setOptions 与 attach 路径）→ mousemove 双重注册 | 加 listenerAttached 标志 | 待修 |

### P3（改进建议 — 记录汇报）

| ID | 位置 | 问题 | 建议方案 | 成本 |
| --- | --- | --- | --- | --- |
| P3-1 | index.ts:471/491、SettingsDrawer.ts:856 | 设置合并是浅合并：嵌套对象（weather/visualizer/…）新增字段时旧存档丢失默认值 | 已知嵌套键深合并 util | 小 |
| P3-2 | index.ts:520-525 | init() 无兜底 catch：初始化中途抛错成 unhandled rejection，`isInitialized` 停留 false 无日志 | bootstrap 加 `.catch(console.error)` | 极小 |
| P3-3 | index.ts:61/184 | SceneManager 构造后整体替换（首个实例白建） | 与 F2 同模式懒创建 | 极小 |
| P3-4 | MediaMount/NativeBgAugmenter/SettingsDrawer 的 MutationObserver | `#bg1`/`#bg_menu_content`/`#extensions_settings` 永不出现时观察者终身挂（独立页每 mutation 触发查询） | 观察者加放弃上限（如 30s） | 小 |
| P3-5 | AudioVisualizer pulse + ParallaxController | 两个子系统同写 `containerEl.style.transform`，同开时互相打架 | pulse 写宿主层或合成（translate+scale 统一计算） | 中 |
| P3-6 | ServerOrigin.saveManifest | 并发 putMedia 时 manifest read-modify-write 竞态可丢条目（单用户低概率） | saveManifest 单飞队列 | 小 |
| P3-7 | IframeRenderer:19,61 | `sandbox=allow-scripts+allow-same-origin` 组合 + `postMessage('*')`：远程 HTML 背景可 postMessage 反向通信 | 文档标注信任边界；postMessage 目标 origin 收紧 | 小 |
| P3-8 | style.css:132-136 | 徽章五色为语义色，不应随主题漂移，但违反"无硬编码色"字面规则 | 集中声明为扩展自定义属性并注释豁免 | 极小 |
| P3-9 | TriggerManager | MESSAGE_RECEIVED 与 MESSAGE_RENDERED 双触发（500ms 冷却兜底）；正则逐消息重编译 | 编译缓存 + 去重事件源 | 小 |
| P3-10 | SettingsDrawer | 内联样式多；refreshMediaGrid 全量重建（37 项 × 2 请求/次切换）；playBGM 虚拟条目会话内累积 | 渐进式：diff 更新网格、播放列表去重 | 中 |
| P3-11 | ServerSettings | 双标签页并发写设置文档时靠 revision 收敛仅在 init 时 | 写前读版本冲突检测 | 中 |
| P3-12 | AuthorityBridge.notifyOnce:279-282 | if/else 两分支完全相同（死分支） | 顺手清理（本次已并入 D1） | 极小 |
| P3-13 | MiniPlayer.show:130 | destroy 后 show() 重建会重写 onTrackChange，丢掉 index.ts 的 API 事件包装 | 事件改为多播（AudioEngine 内数组） | 中 |
| P3-14 | SettingsDrawer.ts:668 等 | 其余 `as any` 为正当边界；本条仅记录 cast 基线（7 < spec 基线 11） | — | — |

## 4. 修复批次（Phase D）

- **D1 核心逻辑**：F1、F2、F3、F4、F9、F13、F14、P3-12（顺手清理）→ tsc + authority + stress
- **D2 安全转义**：F5 → tsc + e2e
- **D3 一致性**：F7、F10 → tsc + e2e
- **D4 UI/UX**：F6、F8、F11、F12 → tsc + build + Dev 实例冒烟 + 全量三套件

## 5. 修复回填（Phase D，2026-09-25）

> 复核说明：子代理交叉复核因宿主子代理供应商不可用而降级为主脑二次核验（逐条重验机制），两处修正——F1 并发交错最终收敛到最后一次调用（表现为瞬时错误画面而非永久错状态，修复与定级不变）；F5 注入可达路径补充（远程引用条目名 = 原始 URL 未转义）。

| ID | 修复说明 | 验证 |
| --- | --- | --- |
| F1 | MediaMount 增加 `mountQueue` promise 链，mountMedia 改为排队入口 + doMountMedia 原体；失败不毒化队列 | e2e 24/24、stress 4/4×2 |
| F2 | index.ts 的 shortcutManager 改懒创建（字段可空 + init 中创建），getter 返回类型放宽，两处 setEnabled 加 `?.` | tsc ✓；e2e 含快捷键路径绿 |
| F3 | handleTrackEnded 条件 `> 1` → `>= 1`（single 模式提前 return 不受影响；shuffle 长度 1 安全） | 代码核验 + e2e |
| F4 | AmbientSoundGenerator 增加交互唤醒监听（pointerdown/keydown/touchstart，ctx running 后自摘除，destroy 清理） | 构建绿；运行时行为属浏览器自动播放策略路径 |
| F5 | 新增 `src/core/sanitize.ts` escapeHtml；触发规则名/模式、媒体卡标题（含 title 属性）、迷你播放器曲名全部转义 | 冒烟探针：含 `<b>`/`<img>` 的规则名与模式入列表后无原始标签渲染 ✓ |
| F6 | bindSlider 的 onSettingsChanged 尾沿去抖 300ms；label 与子系统实时回调保持每帧 | e2e 设置流绿 |
| F7 | sanitizeFilename 改 `[^\p{L}\p{N}._ -]`（u 标志）——中文名保留，路径分隔符/引号/尖括号仍折叠为 `_` | 构建绿；e2e 上传路径绿 |
| F8 | style.css：卡片底色→`var(--SmartThemeBlurTintColor, …)`、active 光晕→color-mix(QuoteColor)（双声明回退）、删除钮→`var(--SmartThemeEmColor, …)`；FrostedGlass 气泡底色→color-mix(BlurTintColor)+固定 rgba 回退、边框→BorderColor var；语义色（徽章五色、迷你胶囊暗玻璃）加豁免注释 | 冒烟：页面样式正常、抽屉可交互 |
| F9 | PublicAPI.setWeather 加 WEATHER_TYPES 白名单（invalid → warn + 忽略，不落设置）；density 断言改 `as WeatherOptions['density']` | 冒烟：`setWeather('garbage_type_xyz')` 被拒、设置无污染 ✓ |
| F10 | 新增 `src/core/mediaType.ts` 单一实现（含 mimeType 参数），五处调用点收敛；NativeBgAugmenter 补齐 m4v/aac/m4a | grep 全仓无残留重复实现 ✓ |
| F11 | 三连 prompt 改内联表单（类型下拉 + 名称 + 匹配 + 确认/取消），regex 类型保存前预编译校验 | 冒烟：表单开合、添加、校验全流程 ✓ |
| F12 | 导入 busy 态（dropzone.busy 类 + URL 按钮禁用/文案）+ 失败 toastr 错误反馈（此前导入失败是无声的 unhandled rejection） | 冒烟：URL 导入期间按钮禁用 ✓ |
| F13 | MediaMount 构造增加 onHostReady 回调（setupContainer 末尾触发）；index.ts 挂载逻辑进 mountOverlays（幂等守卫），#bg1 延迟出现也能挂载 FX | 冒烟：FX/可视化画布恰好各 1 个 ✓ |
| F14 | ParallaxController 加 listenerAttached 标志，enable/disable 对称防重入 | tsc ✓ |
| P3-12 | notifyOnce 死分支清理（两分支合一） | 构建绿 |

**回归汇总**：`npm run type-check` ✓、`npm run build` 165.39 kB（基线 160.35，+5 kB 来自表单/工具/转义代码）✓、`test:e2e` 24/24 ✓、`stress` 4/4 ×2 ✓、`authority` 18/18（真后端）✓、CSS 裸选择器门禁 0 ✓。

**冒烟探针补充观察**：页面存在 3 条与本插件无关的脚本错误（`Unexpected reserved word` 无栈、`$(...) is not a function` 来自 blob: 脚本、`SPresetSettings` 重复声明——均非本仓标识符/产物），改动前后 e2e 结果一致，定性为宿主环境其他扩展噪音，不处理。探针脚本已用后即删。
