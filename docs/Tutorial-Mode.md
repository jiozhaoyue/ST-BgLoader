# 教程模式（Tutorial Mode）

> 面向演示者与文档录制者：教程模式是预览台的 dry-run 开关，用内存演示数据替代磁盘与浏览器持久化，避免演示过程写入真实数据。
> 事实真源＝`dev/mock-server.ts`、`dev/host-stub.ts`、`dev/boot.ts`（2026-11-21 实测）。代码拦截层由对应开发者负责，本文只描述已落地的 dev 层开关与覆盖范围。

---

## 1. 启动方式（dev 层开关）

教程模式由两个开关协同，缺一不可：

1. **服务端权威开关（环境变量）**：`DEV_TUTORIAL=1`，在启动预览台时设置。
   - 命令：`DEV_TUTORIAL=1 npm run dev:ui`
   - 依据：`dev/mock-server.ts:84` 定义 `const TUTORIAL = process.env.DEV_TUTORIAL === '1'`；注释 `:78-83` 说明 mock-server 运行在 Node（Vite 插件），读不到浏览器 URL 参数，故环境变量为权威开关。
2. **浏览器侧标识（URL 参数）**：`?tutorial=1`，附加到预览台地址。
   - 地址示例：`http://localhost:5173/?tutorial=1`
   - 依据：`dev/host-stub.ts:190-191` 用 `new URLSearchParams(location.search)` 读取 `tutorial` 参数；`dev/mock-server.ts:81` 注释该参数「仅用于状态标识，由 host-stub 处理」。
   - UI 提示：`dev/boot.ts:57-58` 读到 `__devHarness.isTutorial` 后在状态文案追加「· 教程（不写真实数据）」。

> `?tutorial=1` 单独使用只会显示标识、不会切换服务端内存数据；`DEV_TUTORIAL=1` 单独使用则服务端进内存、但浏览器 localStorage 拦截不触发。完整 dry-run 需两者同时启用。

---

## 2. 覆盖范围

### 2.1 HTTP 接口拦截（已落地）

服务端开关开启后，`dev/mock-server.ts` 的内存演示集 `demoFiles`（`:91`、`:93-101`）替代磁盘 `dev/.data`：

- 演示数据：`tutorial-landscape.svg`、`tutorial-ambient.wav`、`tutorial-night.svg`，纯内存、复用 SVG/WAV 生成器，零磁盘写入（`:86-101`）。
- `/api/backgrounds/all`：教程态从内存集列举文件名（`:182`）。
- `/api/backgrounds/upload`：只落内存演示集，不碰 `dev/.data`（`:207-209`）。
- `/api/backgrounds/delete`：只作用于内存集，幂等、零磁盘副作用（`:244-245`）。
- `/backgrounds/<file>`：静态资源从内存集回吐，供媒体层正常解码渲染（`:262-263`）。
- 磁盘自愈跳过：教程态不 seeding、不写 `dev/.data`、跳过 readdir 补种（`:152-153,176-177`）。
- 启动日志：`[dev-mock] 教程模式（dry-run）：演示数据在内存，/api/backgrounds/* 与 /backgrounds/* 全部零磁盘写入`（`:297-298`）。

### 2.2 浏览器 localStorage 拦截（已落地）

浏览器侧开关开启后，`dev/host-stub.ts:178-188` 的 `createMemoryStorage()` 以内存 `Map` 实现标准 `Storage` 接口（getItem/setItem/removeItem/clear/key/length），并通过 `Object.defineProperty(window, 'localStorage', ...)` 替换全局 localStorage（`:192-194`）。业务层（`src/index` 直接读写全局 localStorage）无感知。

- 降级路径：宿主禁止改写 localStorage 描述符时 catch 并 `console.warn('[harness] 教程模式无法替换 localStorage，服务端写入仍为 dry-run')`（`:195-198`）——此时浏览器侧真实 localStorage 可能仍被写入，需注意。
- 状态暴露：`__devHarness.isTutorial`（`:206-213`）供测试与 UI 读取。

### 2.3 边界：未拦截的存储（如实措辞）

教程模式**当前不拦截**以下浏览器持久化：

- **CacheStorage**：`src/cache/CacheManager.ts:53-54,187-189` 通过 `caches.open()` / `caches.delete()` 操作 CacheStorage 热缓存；dev 层未对其做内存替换。
- **IndexedDB**：`src/cache/CacheManager.ts:283` 通过 `indexedDB.open()` 操作元数据索引；dev 层未对其做内存替换。

即：教程模式保证「背景媒体 HTTP 请求 + 设置 localStorage + 磁盘 dev/.data」三层零真实写入，但媒体热缓存与元数据索引仍可能写入浏览器真实 CacheStorage / IndexedDB。这部分拦截由对应开发者负责，本文不宣称其已落地。演示结束后如需彻底清理浏览器存储，请手动清除站点数据。

---

## 3. 使用注意事项

- 教程模式只在 `dev:ui` 预览台生效，不影响产品构建 `dist/`（`vite.config.dev.ts:4-8` 明确本配置不触及 dist）。
- 演示数据为固定 SVG/WAV 三件套，媒体库操作（列举/上传/删除/静态回吐）均可交互，但均为内存态，刷新页面后重置。
- 预览台不替代真机验收；教程模式用于演示与录制，功能完整性仍以 Dev 实例为准（见 `Development-Harness.md`、`Dev-Guide.md`）。
