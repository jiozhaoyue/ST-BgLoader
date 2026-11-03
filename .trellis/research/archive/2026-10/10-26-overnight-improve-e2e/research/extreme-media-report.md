# 极端媒体实测报告（2026-10-26 夜间批）

- 目标实例：Dev Luker `:8003`（扩展以 junction 直连工作仓，manual-import 引导装载）
- 脚本：`tests/extreme-media.mjs`（提交 `99c0590`）；产物：`tests/e2e-artifacts/extreme/*.png`
- 结论：**10/10 通过；上传登记表清理 11/11；残留 xm_=0**（探针零残留）
- 全部截图由主会话逐张人工（AI）核验，证据见下表。

| 用例 | 语料 | 断言 | 截图核验 |
|------|------|------|----------|
| c1 | 6000×4000 PNG（数十 MB） | opacity=1、容器可见 | ✅ 紫色 bokeh 渐变铺满全屏 |
| c2 | MediaRecorder 8s webm | opacity=1、无错误 | ✅ 视频帧 "EXTREME" 字样可见 |
| c3 | 零字节 PNG | 不挂死、UI 完好 | ✅ UI 完好；media-error 事件 ×1（新功能生效） |
| c4 | 损坏 JPEG（合法头+随机体） | media-error ≥1 | ✅ 事件 ×1，界面无白屏无挂死 |
| c5 | 截断 webm（30%） | 有界 settle | ✅ 15s 兜底收敛，UI 完好 |
| c6 | 文本伪装 .png / PNG 伪装 .jpg | 容错 | ✅ 文本伪装 errs=1；内容真实者浏览器嗅探渲染（绿色背景可见） |
| c7 | 195 字符 Unicode+emoji 文件名 | 目录可见+渲染 | ✅ "UNICODE 极端文件名" 蓝底大字铺满 |
| c8 | 1 小时 WAV（≈56MB） | isPlaying | ✅ 迷你播放器显示曲名+播放态 |
| c9 | SVG 含脚本 + HTML canvas | iframe 沙箱渲染 | ✅ SVG 粉红大圆可见；沙箱内脚本未越权（无宿主 console 错误） |
| c10 | 10 项 ×300ms 快速切换 | 终态一致 | ✅ opacity=1、A/B 层 children 0/1（无叠加） |
| c11 | 媒体库视图 | 抽屉接管 | ✅ 顶栏抽屉打开，47+ 卡片、搜索/过滤/导入齐全 |
| c12 | 清理后 | 残留=0 | ✅ DOM 断言残留 xm_=0 |

## 过程发现（已修）

1. 实例内其它扩展的阻塞弹窗（chatfilesys 导入提示、停止维护公告）会遮挡截图证据 → 套件内置 `dismissInstancePopups`（只点对方自己的按钮：不入库/我知道了/…），不动其 DOM。
2. 清理以 `results.itemId` 为准会漏掉一个用例上传多条的项（c6b/c9a）→ 改为页内上传登记表 `window.__xmCreated`，清理 11/11、残留 0。
3. c11 `mount()` ≠ 打开抽屉 → 补点宿主 `#backgrounds-drawer-toggle`。
4. 随批修复：坏媒体 toastr 文案中"已保留上一背景"与实际行为不符（坏图会替换显示层），已删去该句。

## 遗留观察（不修，记录）

- 实例 settings.json 的 `disabledExtensions` 含 `third-party/ST-BgLoader`：Luker 无 `ctx.enableExtension` API，e2e/stress/authority/extreme 四套件均以模块导入兜底装载（仅页面会话内生效，实例状态零改动）。这解释了 stress 此前"35s 等扩展超时"的历史现象。
