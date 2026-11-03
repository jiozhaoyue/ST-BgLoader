# Design — 夜间改进批

## 1. 总体阶段

```
Phase A 审计  →  Phase B 修复/增强批  →  Phase C 测试环境  →  Phase D 全量自动化 + 极端媒体  →  Phase E 收尾
```

## 2. Phase A：审计（只读）

- 并发派只读探子（scout/Explore）分片审计 `src/` 全部模块（按子系统分片：core 状态机 / media 管线 / ui 抽屉 / triggers / audio / storage-authority）。
- 审计维度：上次 16 项修复的同形缺陷（detach 匹配、异步回调兜底、观察者叠加、有界等待、事件解绑、rAF 合帧、并发去重、超时兜底）、跨模块契约、CSS/类型契约。
- 结论持久化到 `{TASK_DIR}/research/audit-20261026.md`，按 P1/P2/P3 分级，每项带 file:line 证据。

## 3. Phase B：修复与增强批

- 每批 = 一组同域修复（1 commit/批），批次间跑 `type-check + build + check:css`。
- dist 与 src 同批重建提交（L1-MR-10）。
- 功能增强从审计结论中选"自然延伸点"（倾向：异常媒体的 UI 容错反馈、可达性小增强），避免大改架构。
- 提交后即推送 origin master（保持远端最新，Dev ST :8001 旧克隆后续可 pull 同步）。

## 4. Phase C：测试环境

- 主目标 Dev Luker `:8003`：junction 直连工作仓，免同步。启动方式：实例自带启动器（Start.bat / config.yaml port 8003）。
- 备选 Dev ST `:8001`：内含旧克隆，若时间允许，推送后 `git -C <clone> pull` 同步再跑（克隆工作区有未跟踪删除项，优先级低，不阻塞主目标）。
- 启动用后台任务（run_in_background），curl 探活到 `/` 返回 200 为准。
- Chrome 路径用 e2e.mjs 既有解析（PUPPETEER_EXECUTABLE_PATH / 默认 `C:\Program Files\Google\Chrome\Application\chrome.exe`），启动前核验存在。

## 5. Phase D：全量自动化 + 极端媒体

### 5.1 三套件
- `TEST_TARGET_URL=https://localhost:8003 npm run test:e2e`（24 项）
- `npm run test:stress`（4 项）
- authority 18 项（tests/authority.mjs，按脚本既有用法跑）
- 任一失败：修复 → 重跑，直到全绿（零回归门槛 L1-MR-13）。

### 5.2 极端媒体语料（新脚本 `tests/extreme-media.mjs`，puppeteer-core 驱动）
语料构造（Node 侧生成，不引外部二进制依赖）：
1. 超大图片（canvas 生成 ~6000×4000 PNG，>20MB）
2. 超大视频（拼接生成的高分辨率 mp4/webm，或用 MediaRecorder 在浏览器内生成大 webm）
3. 零字节文件（空 image/png）
4. 损坏文件（JPEG 头 + 随机字节；截断的 mp4）
5. 异形扩展名/伪装 MIME（.png 实为文本；.jpg 实为 PNG）
6. Unicode/超长文件名（中文 + emoji + 200+ 字符）
7. 超长音频（生成 1h+ 静音 wav 或大 mp3）
8. SVG 含脚本/动画（XSS 面 + 渲染验证）
9. HTML 媒体（自绘 canvas 动画，含 while(true) 防护对照——仅验证扩展的 iframe 沙箱不挂死宿主）
10. 快速切换序列（10+ 媒体 1s 间隔连续切换，验证双缓冲与 objectURL 回收）

验证方式：
- 每类用例导入 → 渲染 → 截图（`page.screenshot` 存 `tests/e2e-artifacts/extreme/<case>.png`）→ Read 人工（AI）核验。
- 异常类（3/4/5）断言：扩展不白屏、不挂死、给出可感知容错（console warn 或 UI 提示）且有界 settle（L1-MR-7）。
- 正常类断言：背景层出现媒体、双缓冲类名存在、切换后旧 objectURL 释放。
- 探针卫生：用例结束复原设置与背景状态（AC6）。

### 5.3 截图核验
- 截图落盘后由主会话用 Read 工具逐张核验（内容非黑屏/非白屏/预期元素在位），结论记录 `research/extreme-media-report.md`。

## 6. Phase E：收尾

- `trellis-update-spec` 判定：新知识（极端媒体容错契约、探针卫生新条目）→ 沉淀 `.trellis/spec/frontend/quality-guidelines.md`。
- `add_session.py` 记 journal；显式 pathspec 分批提交（工作提交 → 任务工件 → journal）；推送 origin master。

## 7. 回滚预案

- 每批独立 commit，出问题 `git revert <hash>` 单批回退。
- 实例侧只写 data 区（设置/背景文件），探针复原 + 必要时删除本轮上传的测试媒体文件。
- 极端媒体语料放在 `tests/e2e-artifacts/extreme-media-corpus/`（gitignore 区，不入库，防大文件入库 L1-MR-14）。
