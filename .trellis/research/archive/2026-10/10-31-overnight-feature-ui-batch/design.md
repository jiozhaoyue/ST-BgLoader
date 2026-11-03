# Design：夜间批 10-31

## D0 现状锚点

- 设置收敛：`src/index.ts:648 applyConvergedSettings()`；持久化在 `SettingsSync`（服务端真源，localStorage 降级）；`mergeSettings` 在 `src/types/index.ts`。
- 音频：`src/audio/AudioEngine.ts` 已有 `fadeInVolume(target, ms)` / `stopTrack(fadeOutMs)` / `setPlaylist(items, autoPlay)` / `nextTrack`（错误跳轨预算 errorSkipBudget）。
- UI：`TopbarBackgroundDrawer.ts` 466-469 为「配置备份」导出/导入块（`st_backup_export_btn` / `st_backup_import_file`），处理器在 ~806-830。
- 端点登记：`src/api/EndpointRegistry.ts`（58 端点唯一登记源，登记表↔实现零漂移由 api-harness 双向对照）。

## D1 F1 BGM 播放列表自动轮播

**设置字段**（进 `DEFAULT_SETTINGS`，避免 activeSceneId 式合并丢字段教训）：

```ts
bgmAutoAdvance: {
  enabled: boolean;        // 默认 false
  intervalSec: number;     // 30–3600，默认 300；越界值被 sanitize 夹紧
  fadeMs: number;          // 0–2000，默认 800；0 = 硬切
}
```

**AudioEngine**：新增 `startAutoAdvance(intervalSec, fadeMs)` / `stopAutoAdvance()`；
- 用自持 `setTimeout`（非 setInterval——上一曲未 settle 时绝不叠发）；
- 触发即 `stopTrack(fadeMs)` → `nextTrack(true)` → `fadeInVolume(volume, fadeMs)`；
- `setPlaylist()` 重建列表时重置计时器；`destroy()` 与主开关关闭时必须 `stopAutoAdvance()`；
- 每次重排/暂停/手动切歌都重置倒计时（避免「刚手动切歌 5 秒后又自动跳」）；
- 非激活态（无曲目/列表<2/主开关关）不启动。

**PublicAPI + EndpointRegistry**：`setBgmAutoAdvance(enabled, intervalSec?, fadeMs?)` / `getBgmAutoAdvance()`（async: false，同步读写设置并走 applyConvergedSettings 持久化）。登记 2 端点 → 58+2。

**UI**：BGM 区块加「自动轮播」开关 + 间隔输入（分钟粒度输入，秒存储）+ 淡入淡出时长；开关关闭即时停轮播。

**事件**：轮播触发 emit `st_bgloader:bgm_auto_advance`（三通道自动获得）。

## D2 F2 场景快照导出/导入

**导出**：`exportScenes(ids?: string[])`（PublicAPI）→ `{ format: 'st-bgloader-scenes', version: 1, exportedAt, scenes: SceneSnapshot[] }`；UI 在备份块旁加「导出场景」按钮（全部）+ 每张场景卡片右键/菜单「导出」（单卡按时间做全部导出后再说明，或单卡按钮——以 DOM 现状取最小侵入）。
**导入**：`importScenes(json)` 语义合并：
- 校验 format/version/scenes 形状（名称、快照字段白名单）；非法 → 拒绝并 toastr，现状零改动；
- 同名（id 同）场景：覆盖该场景（用户显式选择导入即有意覆盖同 id）；其余既有场景不动；
- id 冲突策略：保留导入 id，若与用户既有 id 相同但内容不同 → 仍覆盖（同 id 即同一场景的另一个版本），在结果 toastr 中报「更新 N / 新增 M」。
**落点**：SceneManager 已有 saveScene/setUserScenes；设置持久化 `settings.scenes`（走收敛路径整体写回）。

## D3 UI 优化批（截图驱动，清单在执行时按截图发现回填）

- 基线截图：dev:ui + puppeteer（抽屉开、媒体库、设置页、MiniPlayer、BGM 区）。
- 已知候选（以截图实证为准）：网格卡 hover 反馈、空状态文案、分区折叠指示、MiniPlayer 进度可视。
- 约束：只动 `src/ui/style.css` 与组件模板类名；全部双前缀；配色走 `--SmartTheme*` + 回退；`check:css` 门禁必须绿。

## D4 4 酒馆错峰测试协议

```
顺序（错峰，串行，不并行）：
 1. 8001 Dev ST   → 探活；离线则启动（node server.js，端口 8001）
                    → e2e / stress / authority / smoke / extreme-media（TEST_TARGET_URL=http://127.0.0.1:8001）
 2. 8003 Dev Luker→ 探活；离线则启动（其原生启动方式）
                    → e2e / smoke（补上次 SKIP 的 Luker 侧矩阵）
 3. 8002 Real ST  → 只读探活（GET / 状态码），不启套件、不写数据；原离线则探活后关闭
 4. 8004 Real Luker→ 同上
```

- 启动实例 = `run_in_background` Bash，测试完停进程（Dev 侧）；Real 侧探活完即停，恢复进入前状态。
- 任何测试失败：记录 → 修复或登记 [SKIP] 理由，不带病收尾。

## D5 风险与回滚

- 每个 feature 独立提交；出问题 revert 单个提交即可。
- Real 实例零写操作由「不启套件 + 只读 GET」结构性保证。
- 设置新字段必须进 DEFAULT_SETTINGS + mergeSettings，否则复现 activeSceneId 丢失 bug。
