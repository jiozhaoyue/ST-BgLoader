# 夜间改进批：功能/修复 + dev酒馆全自动化E2E + 极端媒体截图验证

## Goal

持续改进 ST-BgLoader（修 bug + 加功能），错峰启动 dev 酒馆跑全量自动化测试全绿，构造极端媒体实测并逐项截图验证，08:50 前收尾。

## Background

- 上一轮巡检（journal Session 22）修复 16 项缺陷并固化 CSS 门禁；本轮为下一轮自主巡检 + 测试验证批。
- 三套件基线：e2e 24 项 / stress 4 项 / authority 18 项（2026-09-26 全绿记录，:8001/:8003 离线未跑，本轮补跑）。
- Dev Luker `:8003` 的 `data/default-user/extensions/ST-BgLoader` 是指向本工作仓的 junction ⇒ E2E 直测工作代码；Dev ST `:8001` 内为 9-26 旧克隆（a568b10），需推送后同步才可测。
- 用户指令「dev4酒馆」在本仓与 trellis 知识库中均无记载；按现场取证裁定为 **Dev 侧酒馆实例**（P-11 铁律：E2E 只允许对 Dev，:8002/:8004 Real 侧一律不碰）。

## Requirements

- **R1 缺陷巡检修复**：对 src 全部模块再审计一轮；新发现的 P1/P2 缺陷全部修复；P3 修复与否按性价比裁定，不修的逐项记录原因。P2-5（主开关关闭不停 BGM/环境音）沿用上轮产品裁定保持现状。
- **R2 功能增强**：交付至少 1 项低风险、与产品定位一致的功能增强（候选：极端媒体容错提示 / 媒体库键盘可达性 / 设置导出导入 / 其它审计中发现的自然延伸点），须有验证证据。
- **R3 全自动化测试**：错峰启动 Dev 酒馆，三套件（e2e / stress / authority）全绿，输出留痕。
- **R4 极端媒体实测**：构造 ≥8 类极端媒体语料（超大、损坏、零字节、异形格式、超长音频、Unicode 文件名、超高分辨率、快速切换序列等），经扩展导入/渲染管线实测，每类有截图证据。
- **R5 时间盒收尾**：08:50 前完成 spec 更新、journal 记录、全部提交推送。

## Constraints

- L0-2 计划先行：本 PRD/design/implement 先于 `task.py start`。
- L0-4 块级编辑：修改现有源码用 Edit，禁整文件覆盖。
- L0-7 提交纪律：显式 pathspec、暂存区校验、完成后推送 origin master。
- L1-MR-3 CSS 双前缀：`npm run check:css` 必须保持 0 违规。
- L1-MR-13 质量门槛：type-check / build / 测试全绿，零回归。
- L1-MR-10 多入口同源同改：src 改动后重建 dist 并同批提交。
- P-11 探针卫生：测试不得在 Dev 实例残留状态（quality-guidelines 的 Probe hygiene 章节）。

## Acceptance Criteria

- [x] AC1 `npm run type-check` / `npm run build` / `npm run check:css` 全绿。
  - 证据：最终 dist（5c4e19b）上三件套全部通过；check:css 输出 "0 全局泄漏 / 0 缺前缀 / 0 box-shadow（src/ui/style.css + src/**/*.ts 注入面）"。
- [x] AC2 本轮审计发现的 P1/P2 缺陷全部修复，不修的 P3 逐项记录理由。
  - 证据：`research/audit-20261026.md`——P2×4 全修（设置导入合并/注入面溢光/坏轨跳转/挂载失败回滚），P3-1/P3-2/P3-3 修复，P3-4 记录不修理由；另在实现与自查中追加修复 2 项（跳轨预算补满泄漏、paused 幽灵态）。
- [x] AC3 至少 1 项功能增强落地，附验证证据。
  - 证据（超额）：①媒体失败可感知反馈（media-error 事件 + toastr，c3/c4 断言通过）；②媒体网格键盘可达性（c11-kb 断言通过）；③卡片真实预览层 + 视频首帧缩略图（c11-thumb 断言通过 + 截图核验）；④媒体库视图状态持久化（c14 跨会话断言通过）；⑤坏歌单有界跳轨（c13 断言通过）。
- [x] AC4 Dev 酒馆在线，e2e + stress + authority 三套件全绿，输出留痕。
  - 证据：Dev Luker :8003（junction 直连工作仓）e2e 24/24 · stress 4/4 · authority 18/18；跨宿主 Dev ST :8001（旧克隆恢复并同步至 5c4e19b）e2e 24/24 · authority 18/18 · extreme 14/14。
- [x] AC5 极端媒体语料 ≥8 类全部实测，每类有截图证据，异常输入正确容错。
  - 证据：`tests/extreme-media.mjs` 14 用例（超大图/真实视频/零字节/损坏 JPEG/截断 webm/伪装扩展名/Unicode 超长名/1h WAV/SVG 脚本/HTML canvas/快速切换/键盘/缩略图/视图持久化），截图在 `tests/e2e-artifacts/extreme/`（gitignore 区）并由主会话逐张核验（见 `research/extreme-media-report.md` 对照表）；异常类不白屏不挂死、media-error 可感知。
- [x] AC6 探针零残留。
  - 证据：极端套件上传登记表清理 13/13、残留 xm_=0（DOM 断言）；视图状态复原（c14 尾部）；实例 disabledExtensions 全程未改；初始背景复原；测试结束实例侧仅新增 probe-session/probe-drawer 截图（gitignore 区，无实例状态）。
- [x] AC7 spec 按判定更新；journal 记录本 session。
  - 证据：`.trellis/spec/frontend/quality-guidelines.md` 新增三节（测试引导与实例禁用态/CSS 门禁 TS 注入面/媒体失败反馈契约 + 探针卫生补充）；journal 于收尾批记录。
- [x] AC8 全部提交推送 origin master，工作区干净。
  - 证据：本轮工作提交 1a56896 → 5c4e19b（9 笔）全部推送 origin master；收尾批含任务工件 + journal + 归档提交。
