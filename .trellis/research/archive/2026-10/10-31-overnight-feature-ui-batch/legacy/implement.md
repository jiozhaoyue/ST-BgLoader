# Implement：夜间批 10-31

> 复选框随执行实时勾选；每步完成后立即更新本文件。

## 阶段 0：开工（00:30–00:50）

- [x] T1 保活：goal-state 重建（截止 10-31 09:00）+ 15 分钟轮询 cron（automation-f0c64255）
- [x] T2 规划工件：prd.md / design.md / implement.md 就位
- [x] `task.py start` 激活任务

## 阶段 1：巡检修复批（00:50–02:30）

- [x] 定向巡检：TopbarBackgroundDrawer / AudioEngine / MediaMount / CacheManager / index.ts（按已知 bug 形态清单）
- [x] 修复实证 bug ×3（音频误挂载清空舞台 P2 / 播放列表索引漂移 / 隐藏页 rAF 淡出冻结），提交 0a2e434
- [x] `type-check` + `check:css` 绿 → 提交（显式 pathspec）+ 推送

## 阶段 2：F1 BGM 自动轮播（02:30–04:00）

- [x] types：`bgmAutoAdvance` 进 DEFAULT_SETTINGS + mergeSettings + 钳制
- [x] AudioEngine：setAutoAdvance/stopAutoAdvance（自持 timeout、各路径重置、淡出后才切曲、destroy 清理）
- [x] PublicAPI + EndpointRegistry：setBgmAutoAdvance / getBgmAutoAdvance（58→60）
- [x] UI：BGM 区开关 + 间隔 + 淡入淡出输入 + 远端回填
- [x] 断言：api-harness +4（往返/接线/钳制/关闭），32/32
- [x] `type-check` / `build` / `check:css` / dev-harness 14/14 / api-harness 32/32 绿 → 提交 24a048a + 推送

## 阶段 3：F2 场景导出/导入（04:00–05:30）

- [x] PublicAPI：exportScenes(ids?) / importScenes(json)（语义合并 + 形状校验 + 字段白名单）
- [x] EndpointRegistry：登记 2 端点（60→62）
- [x] UI：场景区「导出场景」「导入场景」按钮 + 结果 toastr
- [x] 断言：api-harness +6（信封/覆盖/新增/拒绝/白名单/复原），38/38
- [x] 质量门全绿 → 提交 a4748a4 + 推送

## 阶段 4：UI 优化批（05:30–07:00）

- [x] dev:ui 起预览台，tests/screenshot-night.mjs 九视角截图（提交为常备工具）
- [ ] 按截图发现实施优化（清单回填于此）：
  - [x] 卡片模板类 card-info/card-name/card-meta/card-icon 补齐 CSS（名称裸叠亮图不可读→磨砂信息条+ellipsis+激活强调）
  - [x] 卡片内类型徽标 absolute 压名称行→作用域内覆写 static
  - [x] slider/preset 行 label 定宽压 CJK 竖排残行→auto+nowrap
  - [x] btn-row 导出/导入一宽一窄→label 纳入 flex:1
  - [x] dev 预览台补 vendored FontAwesome（外链 CDN 会挂住 dev-harness networkidle，已回退为本地副本）
- [x] 优化后截图对照留证；`check:css` 绿 → 提交 9586a33 + 推送

## 阶段 5：4 酒馆错峰测试（07:00–08:30）

- [x] 8001 Dev ST：chdir 启动 → e2e 24/24 + stress 4/4 + authority 18/18 + smoke 11/11 + extreme-media 14/14（清理 13/13 零残留）
- [x] 8003 Dev Luker：HTTPS 启动 → e2e 24/24 + smoke 11/11（上次会话 SKIP 的 Luker 侧矩阵本轮已覆盖）
- [x] 8002 Real ST：只读探活 GET / 200 + /version 1.19.0；零套件零写
- [x] 8004 Real Luker：只读探活 HTTPS GET / 200；零套件零写
- [x] 测后清理：4 实例全部停止，8001-8004 恢复进入前离线状态；注：ST 以 ./config.yaml 相对 cwd 解析，必须 chdir 启动（首次误启动已在仓库根创建的默认 config.yaml 已删）

## 阶段 6：收尾（08:45–09:00，08:45 前禁止开始）

- [x] 全量质量门最终跑：type-check / build(242.38 kB) / check:css / dev-harness 14/14 / api-harness 38/38 全绿
- [x] 追加真机矩阵（当前代码复跑）：8001 e2e 25/25 + stress 4/4 + smoke 11/11 + authority 18/18（S7.3 负载顺序抖动，独立复跑过）+ extreme-media 14/14；8003 e2e 25/25
- [x] 运维事故与修复：① Dev ST 扩展为 10-26 陈旧平拷贝（junction 已失）→ 改 junction 到工作区（stale 拷贝曾改名留原地导致 ST 双加载扩展 → 双 fx 画布 → Test 15 假失败，已移出发现路径）；② TaskStop 不收割 ST 子进程树，三次孤儿监听均按端口 PID 清杀；③ ST 以 ./config.yaml 相对 cwd 解析，实例必须 chdir 启动
- [ ] spec 更新（.trellis/spec/frontend/：public-endpoints.md 已随 docs 提交更新至 62 端点；收尾时补运维教训页）
- [ ] journal Session 26 落盘
- [ ] goal complete=true + 停 15 分钟 cron（CronDelete）
- [ ] `task.py archive` + 最终推送确认（HEAD == origin/master）

## 验证命令速查

```bash
npm run type-check && npm run check:css && npm run build
node tests/dev-harness.mjs            # 需 dev:ui 在跑
node tests/api-harness.mjs            # 同上
TEST_TARGET_URL=http://127.0.0.1:8001 node tests/e2e.mjs
```

## 回滚点

- 阶段 1/2/3/4 各自独立提交；任一阶段失败 revert 对应提交，不连带。
- Real 实例零写操作是结构性保证（不启套件、只 GET）。
