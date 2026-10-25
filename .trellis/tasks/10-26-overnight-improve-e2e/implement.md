# Implement — 夜间改进批

> 复选框随执行实时勾选（L0-2）。

## Phase A：审计

- [x] A1 派只读探子分片审计 src（core / media / ui / triggers / audio / storage 六片）→ 子代理被服务端拦截，改主会话内联精读全部 30 模块
- [x] A2 审计结论落 `research/audit-20261026.md`（0×P1 / 4×P2 / 4×P3，每项 file:line 证据）

## Phase B：修复与增强批（每批后验证）

- [x] B1 批次1：审计 P2×4 + P3×3 修复 + 媒体失败反馈功能（commit `1a56896`）
  - 验证：type-check / build / check:css 全绿
- [x] B1b 测试基建：stress/authority 接入扩展装载兜底（commit `4087ba5`）
- [x] B2 批次2：极端媒体套件 + media-error 反馈（commit `99c0590`）
- [x] B3 批次3：远端收敛应用主开关 + 挂载失败 toastr（commit `84ee2a9`）
- [x] B4 批次4：媒体网格键盘可达性 + 文档同步（commit `221765b`）
- [x] B5 批次5：抽屉截图基建 + UI 文档（commit `6698af5`）
- [x] B6 批次6：卡片真实预览层 + 视频首帧缩略图（commit `b7aa37b`）
- [x] B7 批次7：跳轨预算补满泄漏修复 + error 路径 pause 归一化（自查发现，commit `f721631`）
- [x] B8 批次8：媒体库视图状态持久化 + 挂载失败回滚同步抽屉表面（commit `5c4e19b`）
- [x] B 跨宿主：Dev ST :8001 旧克隆恢复并同步至最新，e2e/authority/extreme 全绿复验

## Phase C：测试环境

- [x] C1 启动 Dev Luker :8003（后台 node server.js，探活 302）
- [x] C2 确认扩展装载（manual-import 兜底；Luker 无 enableExtension API，实例保持禁用零改动）

## Phase D：全量自动化 + 极端媒体

- [x] D1 e2e 24 项全绿（TEST_TARGET_URL=:8003 主 + :8001 跨宿主）
- [x] D2 stress 4 项全绿（:8003 + :8001）
- [x] D3 authority 18 项全绿（:8003 + :8001）
- [x] D4 编写 `tests/extreme-media.mjs` + 语料生成（10 类 → 最终 14 用例）
- [x] D5 极端媒体实测 + 截图落盘（commit `99c0590` 起随批迭代）
- [x] D6 截图逐张核验，报告落 `research/extreme-media-report.md`
- [x] D7 探针零残留复原 + 验证（上传登记表清理、视图状态复原）
- [x] D8 发现的缺陷修复并重跑至全绿（弹窗遮挡/清理遗漏/抽屉未开/文案失实/跳轨预算泄漏/paused 幽灵态；最终 dist 上两台实例 24+4+18+14 全绿）

## Phase E：收尾（08:50 前）

- [ ] E1 spec 判定与更新
- [ ] E2 journal 记录 session
- [ ] E3 分批提交（工作 → 任务工件 → journal）+ 推送 origin master
- [ ] E4 工作区干净核查（git status --short 仅剩 gitignore 区）

## 回滚点

- 每批一个 commit，可 `git revert` 单批回退
- 实例 data 区改动有探针复原脚本兜底
