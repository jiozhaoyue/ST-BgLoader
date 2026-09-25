# 技术设计 — P3 改进批

> 需求与证据真源：`archive/2026-09/09-25-full-audit-ui-logic/research/findings.md` §3 P3 表（本仓 git 内，引用安全）。

## 1. 实施批次与关键设计

### B1 装配与设置（P3-1/2/3）

- **mergeSettings**（`src/types/index.ts` 导出）：`{ ...DEFAULT_SETTINGS, ...stored }` 之后，对 DEFAULT 中值为普通对象且 stored 同键也为普通对象的键做一层 `{ ...def, ...stored[k] }`。嵌套对象（weather/visualizer/parallax/ambientSound/frostedChat/filters）均为扁平结构，一层足够；数组（triggerRules/playlist）与 record（userPresets/scenes/chatBindings）整体替换（record 合并 defaults 空对象无意义）。三处接入：index.ts loadSettings、reconcileSettings 服务器分支、SettingsDrawer 导入。
- **init 兜底**：`instance.init().catch(err => console.error('[ST-BgLoader] Initialization failed:', err))`，DOMContentLoaded 分支同样。
- **SceneManager 懒创建**：照抄 ShortcutManager 修复模式（`| null = null` + init 赋值 + getter 放宽）。PublicAPI 四个调用点 `getSceneManager()` 改空值安全：applyScene → 返回 false；saveCurrentScene/getScenes/deleteScene → warn + 安全返回值。

### B2 持久化（P3-6/11）

- **saveManifest 单飞**：`private saveQueue: Promise<void> = Promise.resolve()`，saveManifest 入链（失败不毒化队列，rethrow 语义保留给调用方——链内 catch 后 rethrow）。manifest 为单实例内存对象、变更是同步的，队列化后最后一次写入必为最新状态。
- **冲突检测**：ServerSettings 构造接受可选 `onRemoteNewer(doc)`；flush 循环写前 `load()`，若 `doc.revision > payload.revision` → 放弃 pending、调用回调、清 warned 标志。index.ts 接线：`new ServerSettings(...)` 不变（构造在字段初始化器，改为 init 内可注入或在回调里判空）→ 简化：ServerSettings 增设 `public onRemoteNewer: ((doc) => void) | null = null` 公有字段，index.ts init 时赋值 `() => this.reconcileRemoteConflict()`；`reconcileRemoteConflict` 带 in-flight 布尔守卫：`reconcileSettings() → applySettingsToSubsystems() → drawer.applyRemoteSettings`（与 SettingsSync 远端分支同构）。

### B3 媒体与 iframe（P3-7/5）

- **postMessage origin**：`const origin = (() => { try { const u = new URL(this.iframeElement.src); return u.protocol.startsWith('http') ? u.origin : window.location.origin; } catch { return window.location.origin; } })()`；srcdoc 场景 src 为空/inline → 回退同源。注释标注：sandbox allow-scripts+allow-same-origin 对同源自有媒体的可信边界。
- **pump 包裹层**：setupContainer 创建 `container > pumpWrapper > layerA + layerB`（wrapper: absolute 全幅、pointerEvents none→随 setInteractive？不——wrapper 不承接交互，保持 `pointer-events: none`，交互开关仍作用 container 与 layerA/B）。存 `pumpWrapperEl` 字段 + getter `getPumpWrapperElement()`；复用路径（container 已存在）querySelector 补齐。AudioVisualizer：mount 的 `mediaContainer` 参数语义改为「pulse 目标」→ index.ts 传 pumpWrapper；pulse 分支写 wrapper transform，destroy 清理时判空同元素。视差 attach 仍用 containerEl。

### B4 观察者上限（P3-4）

统一微模式：`const giveUp = window.setTimeout(() => obs.disconnect(), 30_000)`，命中目标路径 `clearTimeout(giveUp)`。三处：MediaMount.init docObserver、NativeBgAugmenter.start bodyObserver、SettingsDrawer.render renderObserver。

### B5 触发器与音频（P3-9/13/10）

- **正则缓存**：`private regexCache = new Map<string, RegExp>()`；evaluateMessage 以 pattern 为键 try/catch 编译；setRules/deleteRule 时 `regexCache.clear()`（removeRule 走 setRules 路径？removeRule 只改数组——在 removeRule 中也清缓存，或干脆 evaluate 前 lazy 编译 + setRules/addRule/removeRule 全清，保守取「写操作全清」）。
- **事件多播**：AudioEngine 增加 `private trackListeners: Array<(item: MediaItem | null) => void>` 与 playState 同构；`addTrackListener(cb): () => void` / `addPlayStateListener(cb)`；内部 `emitTrackChange(item)` 替换 `this.onTrackChange?.(item)` 四处（playMediaItem/playCurrentTrack 及 playState 两处事件监听）。删除公开属性 onTrackChange/onPlayStateChange/onAnalyserReady？onAnalyserReady 同样单槽——index.ts init 里赋值一次，无覆盖链，保留不动（只改两处脆弱链）。MiniPlayer.render 两处赋值改 `this.audioEngine.addTrackListener(...)`（注意 render 可重入：重复 render 会叠加监听器——MiniPlayer.render 先 remove 旧 DOM；监听器订阅放 destroy 清理 + render 时退订旧的：持有退订函数字段）。
- **播放列表去重**：playMediaItem 中 `findIndex !== -1` 已更新索引；问题在 playBGM 每次造新 id 的虚拟条目——改为 push 前按 url+name 查重，存在则复用（更新引用）。
- **网格签名守卫**：refreshMediaGrid 计算 `JSON.stringify(items.map(i => [i.id, i.name, i.type]))` + activeMediaId，与 `lastGridSignature` 相同则 return（早退前不清空 DOM）。

### B6 CSS（P3-8）

`.st-bgloader-panel { --st-bg-badge-video: #e53935; --st-bg-badge-audio: #8e24aa; --st-bg-badge-html: #fb8c00; --st-bg-badge-svg: #43a047; --st-bg-badge-image: #1e88e5; }`（作用域合规，非 :root），徽章规则改 `var(--st-bg-badge-video)` 等；`.st-bg-native-badge` 在原生菜单内无 panel 祖先，其底色本就是中性 rgba，不动。豁免注释更新。

### B7 spec 教训（P3 清单外）

新增 `.trellis/spec/guides/trellis-shell-discipline.md`：坑（宿主以相对路径从 shell cwd 解析 pre-shell hook；cd 进子目录后所有 Bash 调用被阻断，含 task.py 调用）、恢复（在卡死 cwd 下用文件工具写同名 shim 转发真 hook → cd 回根 → 删 shim）、预防（Bash 命令一律不 `cd` 进子目录，需要相对路径时用绝对路径替代）。guides/index.md 表加行。

## 2. 验证设计

- 批内每完成一批：`npx tsc --noEmit`。
- 终验：build + e2e 24/24 + stress 4/4×2 + authority 18/18 + CSS 门禁。
- 冒烟探针（用后即删）：抽屉/切背景/迷你播放器常规项 + pulse 与视差同开时 wrapper transform ≠ container transform（两写者分离证据）+ 旧存档深合并（localStorage 预置缺字段设置重载验证补齐）。

## 3. 风险与回滚

见 PRD Risks；全部改动常规提交可按粒度 revert。
