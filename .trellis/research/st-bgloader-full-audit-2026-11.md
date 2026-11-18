# ST-BgLoader 全仓审计与竞品定位研究报告（2026-11-19）

- 方法：两波蜂群只读审计。第一波 8 路并行（敏感信息 / 规范合规 / 注入链路 / 业务逻辑 / UI 红队 / 后端必要性 / 竞品调研 / 测试守卫），第二波 3 路交叉找茬（技术面 / UI 产品面 / 竞品网络复核），共 11 项任务、13 个代理实例。子代理模型：hy4-flash-free 免费档（注册表未暴露 cost 字段，按 `-free` 档 + 用户指令采信；Explore 一路为会话默认档，如实标注）。
- 结论可信度：全部关键结论经第二波独立复核，误报已修正（见 §2）。仍有少量「推测」标注项，均为无法只读验证的内容。

## 1. 敏感信息与 git 卫生（最高优先）

| 级别 | 发现 | 证据 | 处置 |
|---|---|---|---|
| 高危 | 已泄露的真实 API Key 残留于本地 .git 不可达 blob（22.8MB `settings-backup-before-enable.json`，含可直连 LLM 端点 + `sk-` 开头密钥，完整值不在本报告记录） | blob `8d2be5e0`；`.gitignore:12-14` 注释自述 2026-09-26 曾推送公开仓库 | **立即轮换该密钥**；本地 `git reflog expire --expire=now --all && git gc --prune=now --aggressive`；远端旧 SHA 是否可达本地无法验证（推测），必要时重建仓库 |
| 高危 | `.agents/mcp_config.json` 未被 .gitignore 覆盖（当前内容干净：env 占位 + disabled，无明文 token） | `git check-ignore` 退出码 1 | .gitignore 精确加入该文件 |
| 中 | `data/` 目录无 ignore 规则（现为空，填充后 `git add -A` 即重演泄露事故） | `.gitignore` 无 `data/` 条目 | .gitignore 加入 `data/` |
| 中 | `.zcode/config.json.bak-20261031` 被跟踪（内容干净，但 .bak 会随源漂移） | `git ls-files .zcode` | `git rm --cached` + 忽略 `*.bak` |
| 中 | wiki 两处 `file:///d:/Repo/...` 本机绝对路径 | `wiki/Native-Background-Integration.md:81`、`wiki/Settings-Reference.md:4` | 改相对路径 |
| 低 | 本机 284KB 测试日志 `.st-test-server.log`（已被 ignore，仅本机残留） | 根目录 | 本地删除 |

合规面：127 提交单一作者 + noreply 隐私邮箱（D-10 达标）；跟踪文件中零密钥/零真实邮箱/零 URL 内嵌凭据；`dist/` 入库是 ST 扩展分发设计使然。跟踪文件约 94% 是 .trellis 与 20 余个 agent 平台工件（体量失衡，建议对 .trellis 加 pre-commit 敏感词扫描）。

## 2. 交叉验证修正记录（相互找茬的实效）

第一波 → 第二波修正：
1. D-01「宿主访问散落 4 处」→ **实为 1 处硬违规**（`src/ui/NativeBackgroundController.ts:345` 直用 `SillyTavern.getContext()`，HostBridge 已有替代）+ 1 处误报（`src/triggers/TriggerManager.ts:111` 是参数注入，不碰全局）+ 2 处轻度（`window.eventSource` 且桥上无对应访问器：`src/index.ts:731-737`、`src/api/PublicAPI.ts:946`）。
2. 「移动端必横向溢出」→ 过度断言。toolbar min-content ≈349px，375px 多数装得下，360px 临界；且父容器 overflow-x 计算为 auto，溢出是抽屉内滚动条。降级 MINOR（真实缺陷是「全文件零 @media，窄屏无响应式」）。
3. 「三层滚动嵌套」→ 实为 2 层（media-grid 与 trigger-list 位于互斥 tab，`src/ui/style.css:664-670`），行号引用有误。
4. 「FrostedGlass 违反 D-02 硬编码压盖主题」→ **推翻**：主路径用 `var(--SmartThemeBlurTintColor, …)` + color-mix，硬编码 rgba 仅是无 color-mix 的 fallback（`src/ui/FrostedGlassController.ts:42-54`）。真实问题：css-gate 守卫对 TS 动态注入面只查 box-shadow，**扫不到宿主全局选择器与 !important 注入**（`tests/css-gate.mjs:102-124`）——守卫盲区。
5. 「G-18 系统性违规」→ 不成立：项目 spec 明文「Elevation is expressed with a border」（`.trellis/spec/frontend/host-native-ui.md:87-88`），色差路径也在用。真问题是**全局 G-18 与项目 spec 的优先级冲突**（G-25 单一真源议题），需用户裁决。
6. 「DJ 台式硬耦合，别人该接 API 的被自己做了」→ **推翻**。8 个演出模块不 import 面板，面板回调经组合根（`src/index.ts` 构造器）注入，多数经 PublicAPI 中转——是正常依赖注入。「面板 vs API」消费者不同：9 项演出类中 8 项有专用 API 方法，Agent 导演可走 `updateSettings`（`src/api/PublicAPI.ts:842`）——**没有一项是「拆面板就砍功能」**。
7. 「全生态唯一零转码视频背景」→ **推翻**。`LenAnderson/SillyTavern-VideoBackgrounds` 已是零转码方案（20 stars、无上传管理 UI、自称 hacky）。定位应改写为「唯一工程化的零转码方案（上传/管理/锁定/特效全流程）」。另：官方 VideoBackgroundLoader 实为 6 stars 小项目（非 560+）。
8. 「约 20 个模块无任何测试」→ 修正：本仓**完全没有单元测试框架**（无 *.test.ts/vitest/jest），全部是经 `window.STBgLoader` 的集成/E2E，约 20 个模块零专属断言、部分仅被间接执行。
9. 「1414 passed / 2 skipped」→ 确认无出处（全仓零命中；journal 只有 10/13/14 项记录）。
10. 新发现（第一波漏报）：`MediaMount.clear()` 不进 mountQueue，与在途挂载交错会**复活已清除背景**（`src/core/MediaMount.ts:333-354` vs `:218-331`）；自动轮播淡出窗口内手动暂停后 `pendingAdvanceTimer` 仍强制切歌（`src/audio/AudioEngine.ts:347-357`）；`setPlaylist(autoPlay=true)` fire-and-forget（`src/audio/AudioEngine.ts:383`）。

## 3. 规范是否「真的规范化」

硬约束（CSS 作用域/零 CDN/产物自包含/降级链/有界等待/隐私邮箱）落实度高、可复现。漂移集中在规范文档自身：
- 规范入口失效：`AGENTS.md:86` 指向不存在的 `.trellis/spec/tavern-dev/index.md`。
- spec 数字大面积过时：index.ts 标 ~489 行（实测 847）、e2e 标 24 checks（实测 25）、api-harness 标 25 断言（实测 38）、frontend/backend 两份 spec 的 scenario 数自相矛盾（15 vs 18）。
- 规则层冲突待裁决：① 全局 G-18（阴影/色差分区）vs 项目 spec「边框表达层级」+ 用户 2026-09-26 零 box-shadow 裁定；② 全局 D-06（复杂 UI 用官方 Popup）vs 项目 spec 授权「夺舍原生 #Backgrounds 抽屉」，实现按后者。两处都是 G-25 单一真源问题，需用户裁定谁服从谁。
- 守卫现实：唯一守卫 `check:css` 实测有效（构造 5 项违规 5 项全拦）但有盲区（TS 注入面只查 box-shadow）；无 `npm test` 汇总入口；README 宣称 8 个测试入口仅 3 个登记进 scripts；e2e/stress 依赖手工起 Dev 实例 + `TEST_TARGET_URL`，「一条命令全绿」不存在。

## 4. 注入点与「只接管原生背景设置」差距

注入点共 7 处（全带 `st-bgloader-*`/`st-bg-*` 前缀，无 shadow DOM）：`#bg1` 媒体容器、`#Backgrounds` 内整面板、`#extensions_settings` 极简面板、原生缩略图装饰、head 动态 style（毛玻璃）、MiniPlayer fixed 层、manifest css 通道。
- 接管是**替换式**：`display:none!important` 全灭 `#Backgrounds` 原生子元素后整体替换（`src/ui/TopbarBackgroundDrawer.ts:144-149`）——原生上传/文件夹/多选等子功能被藏起，收窄了原生功能面。目标应是「增强内嵌」而非「替换」。
- 与聊天界面的唯一样式冲突路径是毛玻璃（`#chat/.mes` + `!important`，`FrostedGlassController.ts:46-54`，默认关、可关）；背景层本身 pointer-events:none 隔离在 `#bg1` 内，不碰消息 DOM。
- **移动端适配≈0**：style.css 无一个 @media，无触摸/视口分支（唯一触摸监听是音频解锁）。
- 清理不对称：总开关 off 会还原 `#bg1` 快照并卸面板（`NativeBackgroundController.ts:134-160`），但 document 级监听/事件总线/轮询仅早退守卫不摘除（低风险，扩展本无卸载 API）。
- iframe 渲染器 `sandbox="allow-scripts allow-same-origin"` 等于无沙箱（`IframeRenderer.ts:31`，代码注释自承）。

## 5. 业务逻辑行不行

主干可靠（有测试背书）：挂载/manifest 写入串行化、存储单一真源、schema 迁移单入口、异步等待普遍有界、事件解绑成对、ObjectURL 释放在途去重。
修正后 Top 5 风险（全部经复核确认）：
1. iframe 同源+脚本 = 宿主特权执行（安全，代码已自承「留待用户决策」）。
2. 持久化 `bgmAutoAdvance` 启动不生效（`src/index.ts` init 从不调 `applySettingsToSubsystems`，:187-199/:534-563 断开）。
3. `enabled=false` 启动只执行一半（native 接管/可见性/天气照常启动，`src/index.ts:406` vs `:102-125`）。
4. `MediaMount.clear()` 竞态复活已清背景。
5. 自动轮播无视用户暂停（`AudioEngine.ts:347-357`）。
其后：PublicAPI 三个方法未捕获 rejection（`PublicAPI.ts:235-245`）、LRU revoke 在用 ObjectURL（`CacheManager.ts:251-279`，注释自承取舍）。
结构问题：`src/index.ts` 847 行上帝对象，单点装配约 20 个子系统。

## 6. UI 重构的事实基础

- 实锤必修：无障碍三处（删除按钮无 label `TopbarBackgroundDrawer.ts:1481`；dropzone 无键盘路径 `:248/:595`；全 CSS 无 :focus-visible 而卡片已可聚焦）；MiniPlayer `z-index:9999` fixed 冲突面（`style.css:300-303`）；触摸目标 ~20px（`:340-351`）；媒体网格零虚拟化 + 缩略图并发抽帧（`TopbarBackgroundDrawer.ts:1036-1155`）；原生 `alert/confirm/prompt` 6+ 处（违反 D-06 官方 Popup）；两处文案违 G-16（`:281/:1449`）。
- 面板功能盘点（复核后口径）：**全部功能均有 API 路径**，面板不是功能的唯一入口。演出类 9 项中 7 项模块独立可整体降级为可选 addon（音效/轮播/低通/视差/律动/天气/毛玻璃），**场景快照与触发器是跨模块编排器拆不干净**（`SceneManager` 扇出 8 类子系统 `index.ts:237-268`；`TriggerManager` 绑宿主事件总线），Agent 导演受 Authority 门槛限制且默认关。
- 重构抓手：面板问题的本质不是「功能不该在」，而是 ①替换式接管收窄原生功能；②11+ 个 section 一屏堆叠无信息层级；③移动端零适配；④文案与分区违反自家 UI 规范。

## 7. 后端接入点（回答「一定要吗」）

- **本仓无任何自研后端**：manifest 只声明 js/css；唯一服务器代码是 dev-only Vite mock。主路径 100% 复用 ST 原生 `/api/backgrounds/all|upload|delete` + 静态 Range 流（`src/backend/ServerOrigin.ts:26-28`，注释自证 zero server-side changes）。
- 关键技巧：settings/manifest 两份 JSON **借原生 upload 端点当文件存进 backgrounds/**（`ServerOrigin.ts:64-72`）——原生 `/all` 只列图片，这是唯一真实缺口，也是「零服务端改动」的核心。
- Authority 是可选第三方插件（`window.STAuthority.AuthoritySDK` 检测，`AuthorityBridge.ts:214`），D-03 降级链实测完备（never throws / 一次性 toastr / UI 显「本地模式」）。无 Authority 只失去：跨设备设置镜像、CORS 服务端代抓、默认关闭的 Agent 导演。核心功能零损失。
- 结论：**不需要后端接入**。真正实用的是「复用原生背景目录 + 借道 upload 存 JSON」这一设计，而非任何服务端。SDK 的 blob/sql/jobs/events 四接口面只有类型声明零调用（`AuthorityBridge.ts:14-69`），属超前声明，应删。

## 8. 竞品与差异化（全部经网络复核）

| 维度 | 本仓 | Luker（564★） | TauriTavern（2.3k★） | 酒馆助手生态（1.4k★） |
|---|---|---|---|---|
| 视频背景 | 工程化零转码全流程 | 无 | 无（原生仅图片） | 无一等能力 |
| 特效（天气/视差/律动/毛玻璃） | 全套自研 | 无 | 无 | **脚本可复刻大半**（iframe + 全局 CSS 注入先例） |
| BGM/按角色绑定 | 有 | 无 | 无 | **已有轮子**（官方 Dynamic Audio 按表情切 BGM + 助手音频 API） |
| 扩展锚点兼容 | — | 数据兼容、扩展需手动迁移（实测证据查不到） | 保留 `#bg1` 但 DOM 虚拟化改了生命周期（适配风险，实测证据查不到） | 楼层内 iframe 渲染，非背景层 |
| 形态 | 扩展即装 | 换宿主 | 换宿主（免装 Node） | 装助手 + KB 级脚本热更新分发 |

- 「stagedog 的酒馆脚本助手」查无此名：实为酒馆助手（JS-Slash-Runner）+ 其首席贡献者 StageDog/青空莉（作品集无任何背景/音画脚本）。错位竞争。
- 护城河判断：特效层会被酒馆助手脚本生态部分复刻（分发形态更轻）；**视频硬解管线 + 媒体库工程化管理 + Canvas 特效引擎**是脚本生态无对应一等能力的重资产部分。差异化应押注于此；「跨 4 宿主」不是护城河（TauriTavern/Luker 均主动兼容 ST 扩展生态，是渠道不是对手）。
- 待办：对 TauriTavern 的 DOM 虚拟化做一次实测适配验证（K9 双方均查不到实测证据）。

## 9. 行动优先级建议（供决策，未执行）

- P0（安全/数据）：轮换泄露密钥 + 清理 .git 不可达对象；.gitignore 补 `.agents/mcp_config.json`、`data/`、`*.bak`；wiki 去 file:/// 路径。
- P1（确定性 bug）：iframe 沙箱策略收敛；init 收敛缺口两处（autoAdvance / enabled=false）；MediaMount.clear 竞态；autoAdvance 无视暂停；PublicAPI 三方法 catch。
- P2（UI 重构）：面板从「替换式接管」转向「增强内嵌」（原生功能入口保留）；section 分层重组；移动端 @media 基线；无障碍三处；z-index 与虚拟化；文案/Popup 合规。
- P3（规范修复）：AGENTS.md 入口指向真实 spec；spec 数字校准；裁决 G-18 与项目 spec、D-06 与夺舍授权的优先级；补 `npm test` 汇总入口 + css-gate 盲区；README 测试入口与 scripts 对齐。
- P4（定位）：README 差异化改写（去「全生态唯一」表述）；Authority 超前声明清理；TauriTavern 适配实测。
