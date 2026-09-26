# 技术设计 — 全仓体检与健壮性加固

## 1. 扫描方法论（保证可复现、不失控）

按模块顺序扫描，每模块固定问六个问题。发现以「**可复现 + 带 `file:line` + 一句话失败场景**」为入库门槛，纯风格偏好不入库。

| 维度 | 提问 |
| --- | --- |
| 正确性 | 有没有路径让状态与事实不一致（悬空 id、半更新、写者冲突）？ |
| 竞态 | 两个 async 分支能否交错并各自写同一状态？（队列/守卫是否覆盖全部入口） |
| 泄漏 | 监听器 / observer / timer / RAF / objectURL / AudioNode 是否都有配对释放？ |
| 边界 | 外部输入（URL、文件名、manifest、远端 KV、事件载荷）是否都校验/转义？ |
| 一致性 | 同一概念是否有多个真源（常量、类型、字面量）？ |
| 性能 | 主路径上是否有可避免的网络往返 / 全量扫描 / 无界增长？ |

## 2. 修复设计

### 2.1 A1 — MediaMount 持有可见性状态

**现状问题**：可见性被写成了容器上的行内 `display`，属「游状态（state in the DOM）」——`MediaMount` 不知道它，于是渲染时不会保留。

**方案**：把可见性收进 `MediaMount`，成为受控状态。

```ts
// MediaMount 新增
private visible = true;

public setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.containerEl) {
        this.containerEl.style.display = visible ? 'block' : 'none';
    }
}

public isVisible(): boolean { return this.visible; }
```

- `setupContainer()` 末尾应用 `this.visible`（容器新建/复用后状态一致）。
- `doMountMedia()` 不动 `display`（渲染与可见性正交）。
- `index.ts` 的 `onToggleBackground` 改为 `mediaMount.setVisible(!mediaMount.isVisible())`，不再直接摸 DOM。

**收益**：可见性成为单一真源；渲染不再破坏它；将来若要在设置里加「背景显示开关」也直接复用。

**契约影响**：`MediaMount` 是内部类（不在 `PublicAPI` 契约面），新增方法安全。

### 2.2 A2 — 让 `activeMediaId` 只承载可复现的引用

**问题**：内存虚拟项（`custom_<ts>`）被写进持久化字段，重载后悬空。

**方案（二选一，实现前须定）**：

| 方案 | 做法 | 优点 | 缺点 |
| --- | --- | --- | --- |
| A2-a（拟选） | 非持久化背景**不写** `activeMediaId`，仅设置内存态 `transientItem` | 语义诚实：持久化字段只存目录内 id | 重载后不恢复（本就是「临时」语义） |
| A2-b | `saveToLibrary` 默认改为 `true`，一律落库 | 重载可恢复 | 改变 PublicAPI 默认行为；会给用户媒体库塞入未预期的条目 |

**拟选 A2-a**，理由：`PublicAPI.setBackground(url)` 的语义是「临时切一张背景」，落库应由 `saveToLibrary: true` 显式选择；不该因为内部实现细节而悄悄改变用户媒体库。

配套：清理悬空 id —— `init()` 恢复背景时若 `getMedia(activeMediaId)` 返回 `null`，把 `activeMediaId` 置 `null` 并保存（自愈）。

### 2.3 A3 — 双写消解（与子任务 3 协同）

A3 与子任务 3 是**同一接缝的两面**：这里要「消除双写」，那里要「接管原生选择」。设计上不在本子任务内自成一案，而是：

1. 本子任务**先只做「消除双写」的最小修复**：`NativeBgAugmenter` 的点击监听器对非图片项调用 `e.stopPropagation()` + `e.preventDefault()`，阻止事件继续冒泡到宿主的委托处理器 —— 即「扩展接管时不让宿主也执行」。
2. 若子任务 3 落地了完整的接管方案（捕获阶段拦截 + 统一入口），则本处的 `stopPropagation` 由子任务 3 的方案取代。

**顺序约束**：本子任务先提交最小修复保证不双写；子任务 3 再在其上做完整接管。子任务 3 的 `design.md` 须显式声明「A3 的最小修复已被本方案取代」。

> 注意：ST 的委托处理器绑在 `document` 的**冒泡阶段**。`stopPropagation()` 在元素自身的冒泡监听器内调用，会阻止事件继续冒泡到 `document` → 宿主处理器不执行。这是可靠的。

### 2.4 E1 — 目录列表缓存 + 失效时机

**方案**：`ServerOrigin` 内加短时缓存。

```ts
private catalogCache: { items: MediaItem[]; at: number } | null = null;
private static readonly CATALOG_TTL_MS = 2000;
```

失效点（必须全部覆盖）：

| 时机 | 原因 |
| --- | --- |
| `putMedia` / `deleteMedia` 成功后 | 自身写操作 |
| TTL 到期（2s） | 兜底原生面板的外部变更 |
| 显式 `invalidateCatalog()` | 子任务 3 接管时由原生面板变更事件调用 |

**为什么是 TTL 而非纯事件**：原生面板的上传/删除走宿主自己的代码路径，扩展无法收到通知；短 TTL 是最低成本的一致性兜底。切背景是低频操作，2s 窗口足够。

### 2.5 E2 — `touchCache` 的内存索引镜像

**方案**：`CacheManager` 内维护 `Map<string, CacheIndexEntry>` 内存镜像，`indexAll()` 仅在首次 `init()` 时读一次，此后读写都走内存 + 异步落 IDB。消除热路径上的全量 `getAll`。

**风险**：多标签页下 IDB 会被另一标签页改写 → 内存镜像陈旧。缓解：`clearAll`/`cleanLRU` 前强制重读一次；`storage` 事件或 `visibilitychange` 时重读。**若评估认为风险大于收益，本项可降级为「不做」并写明理由。**

### 2.6 E3 — `objectUrls` 有界化

**方案**：`objectUrls` 改为带容量的 LRU（如上限 32 条），淘汰时 `URL.revokeObjectURL`。**但**正在挂载的背景其 objectURL 必须保活 —— 被淘汰的条目在下次 `getMediaBlobUrl` 时会重新从 CacheStorage 或服务端取得，代价可接受。

**更保守的替代**：仅在 `cleanLRU` 淘汰 cache 条目时同步释放对应 objectURL（即「不为不在缓存里的条目留 objectURL」）。**拟选此保守方案**：改动小、无淘汰逻辑引入、与既有 LRU 语义天然一致。

## 3. 裁剪候选的分类与建议口径

清单按「性质」分组，每组给统一口径，避免逐条的主观化：

| 组 | 口径 |
| --- | --- |
| 死字段（B1–B3） | 建议**砍掉**（从类型与默认值移除）。理由：唯一作用是让设置对象变大、让 `mergeSettings` 多合并一层；无任何行为 |
| 半接线-不可达（B4 `chatBindings`） | 建议**二选一**：① 补 UI/API 接线（按聊天绑定背景是个合理特性）；② 砍掉。**倾向②**——无入口的字段是「看起来有、其实没有」，比没有更糟 |
| 半接线-无控件（B5 `cacheQuotaMB`/`lruAutoClean`） | 建议**补控件**（功能本身有价值，只是缺入口）。属新增 UI，需用户确认是否要 |
| 死代码（C1–C7） | 建议**砍掉**。其中 C6 需连带移除为它存在的 class observer（省一次无效唤醒） |
| 重复真源（D1） | 建议**收敛为单一真源**（`types` 导出常量，`PublicAPI` 引用它） |
| 一致性（D2） | 建议**补齐**原生徽章的按类型配色（或统一改为无类型色），二选一 |
| 重复逻辑（D3） | 建议**合并**为单一实现 |
| PublicAPI 无内部调用者 | 建议**保留**，注明契约属性（`wiki/Public-API-Reference.md` 已文档化） |

**每条候选必须写明**：建议 / 理由 / 影响面（改哪些文件）/ 成本（S/M/L）/ 是否影响既有用户数据。

## 4. 与其它子任务的接缝

| 事项 | 归属 | 说明 |
| --- | --- | --- |
| 设置面板视觉、溢光、折叠 | 子任务 1 | 本子任务只读，发现问题转交 |
| 原生选择器接管（完整方案） | 子任务 3 | 本子任务只做 A3 最小修复 + `invalidateCatalog()` 钩子 |
| 迷你播放器 | 子任务 1（视觉）/ 本子任务（逻辑） | 投影属视觉 → 转交子任务 1 |

## 5. 验证设计

| 发现 | 修复前证据 | 修复后验证 |
| --- | --- | --- |
| A1 | Dev 冒烟：Alt+B 隐藏 → 切背景 → 容器 `display:none` 且画面无变化 | 同上操作后背景正常显示；`mediaMount.isVisible()` 与 DOM 一致 |
| A2 | 调 `STBgLoader.getAPI().setBackground(url)` → 查 localStorage 中 `activeMediaId` 为该虚拟 id | 同上后 `activeMediaId` 为 `null`（或落库后的真实 id） |
| A3 | 点击原生视频缩略图 → 观察 `#bg1` 的 `background-image` 被写入（宿主也执行了） | 同上后 `#bg1` 的 `background-image` 不被改写 |
| E1 | 统计 5 次切背景的 `/api/backgrounds/all` 请求数 | 请求数下降（网络面板或 fetch 计数探针） |
| E2 | 统计 `getMediaBlobUrl` 触发多少次 IDB `getAll` | 热路径上为 0 次（首次除外） |

通用回归：`type-check` + `build` + e2e + stress + authority。

## 6. 回滚

按发现编号分组提交（如 `fix(audit): A1 …`），可独立 revert。`research/` 清单为只读产物。

## 7. 未决项

- A1 的「隐藏」语义：全局开关 vs 仅当前背景（拟定为全局开关）。
- A2 的 a/b 取舍（拟定 A2-a）。
- E2 是否实施（风险大于收益则不做，写明理由）。
- B5 是否补控件（依赖用户是否想要缓存配额 UI）。
