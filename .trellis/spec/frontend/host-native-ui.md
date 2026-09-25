# Host-Native UI Guidelines

> How this extension's settings UI stays indistinguishable from the host's own UI.
> Derived from the 2026-09-26 fold-fix task; applies to every third-party surface we inject
> into SillyTavern / Luker.

The host (SillyTavern, and the Luker fork this project is developed against) ships its own
conventions for drawers, buttons, colours and selection states. Every time we reimplement one
of those conventions ourselves, we inherit a permanent synchronisation debt against a codebase
we do not control — and the failure mode is user-visible.

---

## 1. Use host seams before building your own

If the host already provides a mechanism, use it. Do not rebuild it.

| Need | Use | Do NOT |
| --- | --- | --- |
| Collapsible settings panel | The host's own markup: `.inline-drawer` > `.inline-drawer-toggle.inline-drawer-header` > `.inline-drawer-content` | Bind your own click handler |
| Button | `.menu_button` (and `.menu_button_danger` for destructive actions) | Custom-styled `<button>` |
| Colours / borders / radii | `var(--SmartThemeBodyColor)`, `--SmartThemeBorderColor`, `--SmartThemeQuoteColor`, `--SmartThemeBlurTintColor`, `--SmartThemeEmColor` — always with a `fallback` | Hardcoded hex values |
| Icon | Font Awesome classes the host already loads (`fa-solid fa-*`) | Inline SVG or images |

### Why the drawer case is the cautionary tale

The host binds ONE **document-level delegated** handler for `.inline-drawer-toggle`:

```js
// Luker public/script.js:21422  (identical to SillyTavern public/script.js:12193)
$(document).on('click', '.inline-drawer-toggle', async function (e) {
    const drawer = $(this).closest('.inline-drawer');
    const icon = drawer.find('>.inline-drawer-header .inline-drawer-icon');
    const drawerContent = drawer.find('>.inline-drawer-content');
    icon.toggleClass('down up');
    icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
    drawerContent.stop().slideToggle({ complete() { $(this).css('height', ''); } });
});
```

Because it is delegated, it already covers dynamically-inserted panels. An element-level
listener of our own runs **first** (target phase precedes the document bubble phase), so it
would set `display:none`, after which the host's `slideToggle()` sees a hidden element and
**slides it back open** — the panel becomes impossible to collapse. The same double handling
also flips the icon classes twice, leaving the chevron pointing the wrong way.

**Rule: never bind `.inline-drawer-toggle` yourself. Ever.**

## 2. Never write `display` on an element the host animates

`.inline-drawer-content`'s `display` is owned by the host's `slideToggle()`, which reads the
computed display to decide the animation direction. Writing a `display` value there (inline or
via CSS) inverts the animation.

Consequence: **`flex` layout is unavailable inside `.inline-drawer-content`.** Use the
block-level equivalents instead:

```css
/* Spacing between sections: margin, not flex gap */
.st-bgloader-panel .inline-drawer-content > .st-bgloader-section {
    margin-bottom: 12px;
}
```

`padding` and `margin` are safe (jQuery stores and restores padding around its animation);
`display` and `height` are not.

## 3. Express selection with border + contrast, never with a glow

```css
/* Correct — border, tinted fill, accented label */
.st-bgloader-media-card.active {
    border: 2px solid var(--SmartThemeQuoteColor, #4fa3d1);
    background: color-mix(in srgb, var(--SmartThemeQuoteColor, #4fa3d1) 18%, var(--SmartThemeBlurTintColor, #1e1e24));
}

/* Forbidden — a glow reads as a non-native button effect */
.st-bgloader-media-card.active {
    box-shadow: 0 0 8px color-mix(in srgb, var(--SmartThemeQuoteColor) 50%, transparent);
}
```

Native thumbnails mark the selected background with a border/overlay (`.selected-background`);
a `box-shadow` glow is not part of the host's visual language, and geometric hover effects
(`transform: scale()`) make the grid jitter in a way the host never does.

**Rule: no `box-shadow` anywhere in the extension's stylesheet.** Elevation is expressed with a
border. `grep -c box-shadow src/ui/style.css` must be 0.

## 4. Exceptions: semantic colours that must NOT follow the theme

A small set of colours encode meaning rather than decoration. These are declared once as
custom properties on `.st-bgloader-panel` (theme-independent by design) and must carry a
comment saying why:

| Property | Why it is not a theme variable |
| --- | --- |
| `--st-bg-badge-video` / `-audio` / `-html` / `-svg` / `-image` | Media-type badges must stay readable on every theme; following the theme can make them unreadable |
| `--st-bg-status-ok` / `--st-bg-status-warn` | Storage/Authority verdicts must read identically everywhere |
| `.st-bg-native-badge`'s `rgba(0,0,0,.8)` backdrop | Sits on top of arbitrary thumbnails, so theme-neutral is the only safe choice |

Anything else that hardcodes a colour is a bug.

## 5. Inline styles: structural vs dynamic

| Kind | Example | Where it goes |
| --- | --- | --- |
| Structural (layout) | `display:flex; gap:6px; margin-top:10px; width:100%` | A CSS class in `src/ui/style.css` |
| Dynamic (interpolated value) | `<option selected>`, `<input value="${n}">`, `<input checked>` | Stays in the template |
| Runtime-toggled by JS | `#st_trigger_form`'s `display` (JS writes it on open/close) | Stays inline — a class would fight the JS |

This keeps `innerHTML` templates readable and makes the stylesheet the single source of truth
for appearance. It also removes hardcoded colours from JS string literals (e.g. status colours
in `updateCloudPanel()`).

## 6. Panel class prefix

Every top-level selector in our stylesheet must be prefixed with `st-bg` (or be scoped under
`.st-bgloader-panel`), so the extension cannot leak styles into the host page.

```bash
# Gate: must print 0
grep '^\.' src/ui/style.css | grep -vc 'st-bg'
```

## 7. Verifying a UI change

Computed styles beat screenshots for anything style-related:

```js
// In a Puppeteer probe against the running instance
getComputedStyle(el).boxShadow      // 'none' for anything that must not glow
getComputedStyle(el).borderTopWidth // the selection affordance
```

For drawer behaviour, assert the **`display` sequence** over repeated clicks and compare it to
a *native* drawer in the same page — parity against the host is the actual requirement, not
"it toggles":

```js
// must alternate strictly, e.g. block,none,block,none,...
// and must match the sequence a native .inline-drawer produces under the same clicks
```

The host's icon convention is `up` = expanded, `down` = collapsed (plus the paired
`fa-circle-chevron-up` / `fa-circle-chevron-down` classes).
