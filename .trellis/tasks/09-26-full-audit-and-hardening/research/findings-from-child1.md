# 体检发现（子任务 1 执行期发现，转交本子任务处置）

> 本文件记录在子任务 1 执行过程中发现的**非视觉类逻辑缺陷**。按子任务 1 `prd.md` 的范围约定（视觉归子任务 1、接管归子任务 3），此项属健壮性范畴，转由本子任务处置。
>
> 编号 A4 起，接续子任务 2 `prd.md` 的种子发现（A1–A3 在其文内）。

---

## A4 — 设置面板媒体库间歇性渲染为空（P1，用户可见，已确认）

### 症状

加载 SillyTavern 后，扩展设置面板的媒体库栅格**有时是空的**（显示模板占位符，连「No media items imported yet.」空态都没有），而同一次加载中扩展的媒体功能完全正常（背景正常显示、公共 API 正常）。重新展开面板或再次渲染后恢复。

### 复现率（实测，同一构建）

| 批次 | 空 | 正常 |
| --- | --- | --- |
| 第 1 批（3 次独立加载） | **2** | 1 |
| 第 2 批（4 次独立加载） | 0 | 4 |

→ **间歇性**，取决于启动期两处异步的完成顺序。

### 证据

1. **空的判据**：`#st_bgloader_grid` 的 `innerHTML` 停在模板占位符 `<!-- Injected dynamically -->`，`children.length === 0`。
   - 关键：若 `refreshMediaGrid()` 正常走完「先清空再填充」，空列表时 `innerHTML` 会是 `No media items imported yet.` 空态。停在**原始占位符**说明该函数**在 `grid.innerHTML = ''` 之前就 return 了** —— 即命中了签名守卫的提前返回分支。

2. **面板在启动期被替换多次**（同一页面安装 MutationObserver 观测 `#st_bgloader_settings` 的插入/移除）：

```
run1: panel-inserted(11203) → panel-removed(11451) → panel-inserted(11451)
      → panel-removed(12259) → panel-inserted(12259)          共 3 次插入
run2: panel-inserted(7597) → panel-removed(8003) → panel-inserted(8003)   共 2 次
run3: panel-inserted(6359) → panel-removed(6475) → panel-inserted(6475)   共 2 次
run4: panel-inserted(8137) → panel-removed(8923) → panel-inserted(8923)   共 2 次
```

→ 启动期确有 **2–3 次 `render()`**（首次来自 `init()` 第 9 步；后续来自 `applyRemoteSettings` —— 即 `SettingsSync` 从 Authority 云端拉到设置后经 `index.ts` 回灌触发重渲染）。

3. **代码机理**（[`SettingsDrawer.ts`](../../../src/ui/SettingsDrawer.ts)）：

```ts
private lastGridSignature = '';                    // ← 抽屉实例级共享

public async refreshMediaGrid(): Promise<void> {
    const grid = this.container?.querySelector('#st_bgloader_grid');  // ← await 之前捕获元素
    if (!grid) return;
    const items = await this.cacheManager.listMedia();                // ← 异步让出
    const signature = JSON.stringify([this.settings.activeMediaId, items.map(...)]);
    if (signature === this.lastGridSignature) return;                 // ← 守卫
    this.lastGridSignature = signature;
    grid.innerHTML = '';                                              // ← 写入「捕获时」的元素
    ...填充...
}
```

`render()` 会 `existing.remove()` 后重建面板（新栅格元素），并把 `this.container` 指向新面板。

**竞态序列**（导致空栅格的那个分支）：

| 步骤 | 渲染 #1 的 `refreshMediaGrid`（A） | 渲染 #2 的 `refreshMediaGrid`（B） |
| --- | --- | --- |
| 1 | 捕获**旧**栅格元素到 `grid` | — |
| 2 | `await listMedia()` | 捕获**新**栅格元素到 `grid` |
| 3 | — | `await listMedia()` |
| 4 | 恢复：`signature` 与 `''` 不同 → 设 `lastGridSignature = sig` → `grid.innerHTML=''` + 填充 **旧（已脱离文档）**元素 | — |
| 5 | — | 恢复：`signature === lastGridSignature` → **提前 return** |

→ 结果：新栅格的 `innerHTML` 从未被写过，停在模板占位符。

**反向序列**（A 比 B 慢）则一切正常 —— 这解释了间歇性。

### 归属判定

**预先存在**，与子任务 1 的改动无关：

- 签名守卫 `lastGridSignature` 由上一任务 `09-25-p3-batch-improvements` 的 P3-10 引入。
- `applyRemoteSettings() → render()` 路径早于本轮。
- 子任务 1 只改了「折叠绑定 + 行内 `display` + 溢光 + 行内样式类化」，均不触及该路径。
- 复核方式：对子任务 1 改动前的 HEAD 复跑同一探针亦可复现（机理与改动无关，未单独回退验证）。

### 建议修复

把守卫状态从「抽屉实例字段」改为「**栅格元素自身的数据属性**」，从根上消除跨面板实例的干扰：

```ts
const items = await this.cacheManager.listMedia();
// 面板可能已被一次并发 render() 替换：此时本函数捕获的 grid 已脱离文档，
// 应由那次渲染自己的 refreshMediaGrid 负责填充，这里直接退出。
if (this.container?.querySelector('#st_bgloader_grid') !== grid) return;

const signature = JSON.stringify([this.settings.activeMediaId, items.map(...)]);
if (grid.dataset.gridSignature === signature) return;   // ← 守卫改为元素级
grid.dataset.gridSignature = signature;
```

要点：

1. **元素级守卫**（`grid.dataset.gridSignature`）天然随新栅格重置，A 不可能污染 B 的判定。
2. **身份复核**（`!== grid` 则退出）让 A 在面板被替换后不再做无用功，也避免它去写脱离文档的节点。
3. 删掉 `private lastGridSignature` 字段与 `render()` 里对它的那行重置。
4. 修复后应能在**刻意制造的逆序**下稳定通过：把第 1 次 `listMedia` 加快、第 2 次加慢，空栅格应消失。

### 验证建议

- 加载 10 次，栅格为空次数应为 **0**。
- 加一条回归断言到 `tests/e2e.mjs`：加载后 `#st_bgloader_grid` 的 `children.length > 0`（或用 `dataset.gridSignature` 已设置作为已填充的判据）。**这是本项修复的长期防回归手段，强烈建议纳入。**

### 影响面

- 仅 `src/ui/SettingsDrawer.ts`（`refreshMediaGrid` + 删除一个字段）。
- 不影响存储、不影响媒体功能、不改变对外契约。
- 与子任务 3 无耦合（子任务 3 不动媒体库栅格）。
