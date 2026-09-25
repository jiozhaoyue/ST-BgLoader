# 宿主验证证据 — 折叠缺陷根因

## 为什么必须验证宿主而非只看原版 ST

规划期的根因分析基于 `SillyTavern/SillyTavern` 原版源码。但用户的实际 Dev 实例运行的是 **Luker**（SillyTavern 深度重写分支），其 UI 层可能有差异。若 Luker 改用了组件化渲染或不同的折叠机制，修复方向就会错。

**结论：已验证，Luker 与原版 ST 的机制完全一致，根因分析成立。**

## 实际宿主信息

| 项 | 值 |
| --- | --- |
| 实例路径 | `D:\Repo\Tavern-repo\Instance\Dev\Luker` |
| 服务进程 | `node server.js --browserLaunchEnabled=false`（PID 76784，监听 0.0.0.0:8003） |
| 测试目标 URL | `https://127.0.0.1:8003`（与既有三套件用的 `TEST_TARGET_URL` 一致） |

## 证据 1 — 委托处理器（`public/script.js:21422`）

```js
$(document).on('click', '.inline-drawer-toggle', async function (e) {
    if ($(e.target).hasClass('text_pole')) {
        return;
    }
    const drawer = $(this).closest('.inline-drawer');
    const icon = drawer.find('>.inline-drawer-header .inline-drawer-icon');
    const drawerContent = drawer.find('>.inline-drawer-content');
    icon.toggleClass('down up');
    icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
    drawer.trigger('inline-drawer-toggle');
    drawerContent.stop().slideToggle({
        complete: function () {
            $(this).css('height', '');
        },
    });
    ...
});
```

与原版 ST `public/script.js:12193` **逐字一致**（仅 `complete` 回调的写法由箭头函数改为 `function`，无行为差异）。

→ document 级委托，动态插入的面板铁定被接管。

## 证据 2 — 原始 CSS（`public/style.css:5804`）

```css
.inline-drawer-content {
    display: none;
}
```

与原版 ST `public/style.css:5543` 一致。

→ 宿主默认折叠；扩展写死行内 `display:flex` 会与之冲突。

## 证据 3 — 标记结构一致

`public/index.html` 中大量 `.inline-drawer-toggle.inline-drawer-header`（含 `.inline-drawer` > `.inline-drawer-toggle.inline-drawer-header` > `.inline-drawer-content` 的原生模板），扩展生成的标记与之一致。

## 互斗机制的完整链条

1. 用户点击 `.inline-drawer-toggle`。
2. **元素级监听器先触发**（扩展自建，[`SettingsDrawer.ts:526`](../../../src/ui/SettingsDrawer.ts)）：`content.style.display = 'none'`。
3. **document 级委托后触发**（宿主）：`drawerContent.stop().slideToggle()`。
4. jQuery 判断元素当前不可见 → 执行 **slideDown** → 面板被重新展开，`display` 被设为 `block`。
5. 净效果：**面板永远折不上**。图标亦被两侧各切一次 `down`/`up`，方向错乱。

## 附带确认的次要事实

- 宿主只认 `down`/`up` 与 `fa-circle-chevron-down`/`fa-circle-chevron-up` 两对类名；扩展目前只处理前者。
- 宿主 `slideToggle` 动画期间会在 `.inline-drawer-content` 上写 `height`，`complete` 回调会清空 → 内层布局容器**不得依赖父级百分比高度**。
