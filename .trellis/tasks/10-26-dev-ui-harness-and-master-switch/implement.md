# Implement — 独立 UI 预览台 + 主开关视觉音频同停

> 复选框随执行实时勾选（L0-2）。每阶段结束跑一次验证再进下一阶段。

## Phase A：主开关收口（先做，独立可验）

- [x] A1 确认 `AudioEngine.stopTrack()` 未播放时幂等（`paused` 提前返回）、`AmbientSoundGenerator.setSound({type:'off'})` 走 `stop()` 不抛
- [x] A2 改 `src/index.ts applyMasterEnabled`：false 分支停 BGM（300ms 淡出）+ 环境音 `type:'off'`；true 分支不恢复音频
- [x] A3 `npm run type-check` 通过

## Phase B：预览台骨架

- [x] B1 `dev/index.html`：宿主外壳 + 4 个 DOM 锚点 + 「点击解锁音频」按钮
- [x] B2 `dev/host-stub.ts`：`SillyTavern.getContext()`（eventSource/event_types/getRequestHeaders）、`toastr`（含 `warn`）
- [x] B3 `vite.config.dev.ts`（root=dev、port 5173、strictPort）+ `package.json` 增 `dev:ui`
- [x] B4 首次启动：页面加载后控制台零未捕获异常，`#extensions_settings` 内扩展面板渲染成功（AC1）

## Phase C：mock 服务端

- [x] C1 `dev/mock-server.ts`：`all` / `upload`（multipart 字段 `avatar`）/ `delete`（`{bg}`）/ `GET /backgrounds/<file>`，含目录穿越防护
- [x] C2 数据落 `dev/.data/backgrounds/`；启动时 seed 两个示例媒体（图 + 音频），清单由插件首次写入
- [x] C3 设置文档（`st-bg-loader-settings.json`）与清单（`st-bg-loader-manifest.json`）读写往返成立（AC3）

## Phase D：抽屉与媒体库

- [x] D1 顶栏抽屉可打开（`#Backgrounds` + 顶栏按钮 + `.openDrawer` 切换）
- [x] D2 媒体库网格：列表来自 mock；上传后出现、删除后消失、刷新后仍在（AC2）
- [x] D3 搜索 / 类型过滤 / 排序沿用插件原逻辑，状态随设置文档持久化（c14 同一路径，未单独断言）
- [x] D4 URL 导入在 mock 下仍会被跨域 / CORS 限制：标注为「需真宿主验证」，README 与 wiki 已写明该限制

## Phase E：自动化断言

- [x] E1 新增 `tests/dev-harness.mjs`（puppeteer-core），断言 AC1–AC4 → **14/14 通过**
- [x] E2 主开关音频断言：关闭后 `isPlaying=false`；重新开启后仍不自动播放

## Phase F：真宿主回归与收尾

- [x] F1 重启 Dev Luker `:8003`，跑 e2e **24/24 全绿**（P2-5 未影响既有用例）
- [x] F2 `type-check` / `build` / `check:css` 全绿；`dist/index.js` 已按改动重建（同批提交）
- [x] F3 `.gitignore` 增 `dev/.data/`；README + wiki（新增 Development-Harness 页 + 设置项语义）已更新（AC6/AC7）
- [x] F4 spec 新增「Dev harness & master-switch semantics」四节；journal 记录、提交推送 origin master、归档任务
- [x] F5 `:8003` 已停（本轮启动，用后即停）

## 回滚点

- 单个提交可 `git revert` 完全回退；预览台全部为新增文件，删除即恢复原状
