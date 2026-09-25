# Authority 真后端联调发现（2026-09-25）

> 实例：Dev Luker HTTPS:8003 · Authority：jiozhaoyue/ST-Delegation-of-authority fork @ 034b962（v1.6.8）
> 安装方式：`git clone` → `Instance/Dev/Luker/plugins/authority`（L0-1 允许路径，实例 config.yaml 零改动）

## 部署事实

- 宿主启动日志：`[authority] Managed SDK deployed ... Core artifact verified for win32-x64` + `AUTHORITY_CORE_READY`——fork 的 MSVC Windows 产物（10.29MB）本机可用。
- `Host Bridge error: SillyTavern 2.7.0 is not supported by Host Bridge 1.1.1` 属预期（L0-12：跨宿主插件禁用 Host Bridge；能力内核与宿主解耦，不受影响）。
- probe：`installStatus: "installed"`、26 条特性路径全开、限额 KV 128KiB / Blob 16MiB / inline 256KiB（与文档一致）。
- 宿主 `enableServerPluginsAutoUpdate: true` 会在启动时从 origin（fork main）拉取——克隆即 fork HEAD，漂移风险低。
- 实例 config.yaml 零改动（用户裁定）；Dev ST (8001) `enableServerPlugins: false` 未动，本次只测 Luker。

## 真实差异（mock 时代掩盖的）

### D1 权限声明门控：未声明 = 硬 blocked

`AuthorityBridge.declaredPermissions` 未声明 `agent` → `registerTools` 直接 `AuthorityPermissionError（被平台安全规则或管理员策略封锁）`。源码定位：fork `permission-service.ts` 的 `getDeclarationDecision`——**只要声明过权限集，未声明的资源一律 blocked，且管理员无法解**（"没声明 = declaration gate 拦截，即使管理员默认 granted"）。mock 不查权限，所以 mock 全绿真后端翻车。

**修复**：声明 `agent: { browser: ['st-bgloader-main'] }`（限定实例 id，最小授权）。声明后判定下落至软默认 prompt。

### D2 授权走宿主原生弹窗（prompt 判定）

声明后首次 `registerTools` 不再立即失败，而是**在页面内弹出 Authority 权限弹窗**（宿主原生 Popup，按钮为 `DIV.result-control`：仅允许一次 / 允许本会话 / 始终允许 / 拒绝并记住），点「始终允许」→ POST `/permissions/resolve` → 持久授权 → 注册成功。无人在场时调用挂起（探针实测 15s 超时）。**已在本实例点击「始终允许」，授权持久化——后续运行不再弹窗。**

**修复（配套）**：能力位新增诚实状态 `agentToolsState: 'unknown' | 'pending' | 'ok' | 'blocked'` + `agentToolsNote`；pending/blocked 均有面板文案（等待授权 / 被策略封锁→Security Center）。

### D3 claim 轮询会放大弹窗风暴（防住）

`claim()` 每 2s 也走 `ensurePermission(agent.browser)`（fork client.ts:2225）。未授权窗口期若放任 claim 循环，每 2s 堆一个授权弹窗。

**修复**：`registrationOk` 门控——注册成功前 claim 循环空转；register 单飞（`registerInFlight`）；超时/封锁退避（pending 2min、blocked 5min，warn 一次后降 debug），管理员中途放行可自愈。

### D4 能力位说了谎（修复后诚实）

旧 `caps.agentTools` 在 init 成功后硬编码 true。现由 AgentBridge 首次注册结果回报真实状态（`reportAgentToolsState`），`syncAgentTools` 门控改由用户设置驱动（能力位仅作信息）。

## 测试套件双模式（tests/authority.mjs）

- **真后端模式**（自然）：S5 断言读真实 KV（`settings:data`）、agent 注册轮询 `agentToolsState` 落定 ok/blocked、出现授权弹窗则自动点「始终允许」（幂等，已授权则无弹窗）。
- **mock 模式**（`FORCE_MOCK=1`）：锁定 mock 槽位（`defineProperty` 吞掉真实 SDK 赋值）——使 mock 路径在装了 Authority 的实例上仍可回归。
- **S6 降级覆盖双环境通用**：`injectAuthoritySuppressor` 在 document-start 吞掉 `window.STAuthority` 赋值 → 插件走与裸实例相同的 sdk-missing 降级路径。
- **结果**：真后端 18/18 + FORCE_MOCK 18/18 双绿。

## 坑（复用价值高）

1. **puppeteer `evaluateOnNewDocument` 注入函数被序列化到全新页面作用域**——引用任何 Node 侧顶层函数都会 ReferenceError 且**静默失败**（页面照常跑，注入完全无效）。注入函数必须自包含，或用第二参数传可序列化数据（函数不可序列化）。
2. **ST Popup 按钮不是 `<button>`**，是 `DIV.menu_button.result-control`——按文本找按钮要用 `.popup .result-control`。
3. **Authority HTTP probe 端点有 CSRF 门禁**，curl 直探 403——安装态探测走页面内 `AuthoritySDK.probe()`。
4. **stress.mjs 默认地址曾是 `http://localhost:8000`**（L0-16 红线：8000 出厂默认禁用）——已修为与 E2E/authority 一致的 `https://127.0.0.1:8003`。

## 副作用与还原

- 实例获得一条持久授权：agent.browser → st-bgloader-main（allow-always，Dev 实例，测试自有扩展，无害）。
- 套件 S5.3 已做开关还原（agentToolsEnabled 恢复原值）；S7 恢复 volume。
- 一次性探针保留于本目录（probe-live / probe-capabilities / probe-permission-flow / probe-popup-dom / probe-lock），不进 git（.trellis/tasks/ 被排除）。

## 后续可选

- Dev ST (8001) 若要真后端联调：需用户自行把 `enableServerPlugins` 改 true（本次裁定不改）。
- Authority fork 侧零缺陷发现——本次全部差异均属 ST-BgLoader 插件侧（声明缺失 + 能力位谎言 + 风暴防护缺失）。
