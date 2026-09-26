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
border. `grep -c 'box-shadow:' src/ui/style.css` must be 0.

(The pattern includes the colon on purpose: a bare `grep -c box-shadow` also matches the
comments that explain *why* there is no shadow, and a false red gate is worse than none.)

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

---

## 8. Taking over a host surface (native picker, added 2026-09-26)

The extension can replace what a host control does, not just decorate it.
`NativeBackgroundController` takes over the native background picker (plan T2); these are the rules
that made it safe.

### 8.1 Intercept in the capture phase, and keep ONE interception point

The host binds its selection handler as a **document-level delegated click in the bubble phase**
(`backgrounds.js`: `$(document).off('click','.bg_example').on('click','.bg_example', handler)`).
Document is the root of the event path, so a listener registered there with `{ capture: true }` runs
first, and `stopPropagation()` keeps the event from ever reaching the host's handler.

The consequence for us: **an element-level listener on the same target can never fire again.** The
previous `NativeBgAugmenter` bound `click` directly on each tile; keeping it alongside the capture
listener would have left code that looks alive but is unreachable. That is why the takeover replaced
the augmenter instead of sitting next to it — one module, one interception point.

`removeEventListener` must repeat the same capture flag, or it silently removes nothing.

Verify there is only one: `grep -rn "bg_example" src/` and confirm the hits are queries, not bindings.

### 8.2 Every interception must name the host branch it bypasses

Interception is only safe if you know precisely what you are removing. Read the host handler and
handle **each** of its branches — the picker's handler has three (`backgrounds.js:421`): group
multi-select, chat-locked / chat-specific, and global. Planning found only two, and the miss would
have made the host's "lock this background to this chat" feature fail silently.

For every branch you do not own, pass through — and pass through by *deciding* not to intercept
(return before `preventDefault`), never by re-implementing the host's behaviour:

| Pass-through | Host signal |
| --- | --- |
| Group multi-select mode | `#Backgrounds.bg-selection-mode` |
| Chat has a locked background | `chat_metadata['custom_background']` |
| Tile menu buttons / folder tiles / mobile menu toggles | `.jg-button`, `.bg_folder_tile`, `.mobile-only-menu-toggle` |
| Chat-specific backgrounds | `.bg_example[custom="true"]` |
| Level `non-image` leaves images alone | own setting |

A takeover that eats host features is a regression, not a feature. When a pass-through forces a second
change somewhere else, drive both from the **same** predicate (here `isChatBackgroundLocked()` gates
both the click and the `#bg1` suppression) — otherwise the two halves drift and the host ends up
fighting you.

### 8.3 Read host state through public APIs, and prefer the authority over the rendering

- `getContext().chatMetadata` is a documented getter (`st-context.js`) → reading the lock through it is
  a public seam. Do not monkey-patch, and do not sniff a host module's internals.
- The lock key `custom_background` is **persisted in the chat file**, so renaming it would invalidate
  every historical chat's lock — it is more stable than any DOM class name.
- Prefer authoritative data over rendering results: `.bg_example.locked-background` is produced by the
  host's `highlightLockedBackground()` and only refreshed at certain moments; the metadata is the truth.
- **jQuery `.data()` values are not in the DOM.** `createThumbnailElement` calls `.data('url', …)`, and
  `el.getAttribute('data-url')` returns `null` — verified live. Read such values with `jQuery(el).data()`
  or find another attribute. (`data-url` also holds a CSS string `url("backgrounds/x.jpg")`, not a URL;
  build URLs with our own `mediaUrl()`, which matches the host's `getBackgroundPath()` byte for byte.)

### 8.4 Suppress a host layer only while you actually own it — and give it back

Clearing `#bg1` is what stops the host's image showing under ours. Three gates make it correct, and
each one was a real defect first:

1. **Only when something is mounted.** Otherwise enabling the takeover blanks a user's wallpaper.
2. **Only at the level where you own every selection.** At `non-image`, image clicks are deliberately
   passed through, so clearing would fight a click you just allowed.
3. **Not while the host owns the layer** (the chat-lock case above).

Symmetrically, when the extension stops owning the layer — takeover switched off, background cleared
through the API — **hand it back**: `releaseNativeBackground()` and `stop()` both restore the snapshot
taken at install time. Forgetting this leaves the user with no background at all.

The host rewrites `#bg1` on chat change and on lock actions, so suppression must be repeatable, not
one-shot. An `attributes` observer filtered to `style` catches every host write without touching host
code. Note the callback is **async**: a synchronous "I am writing" flag is usually already reset by
then — the real loop-breaker is the "already empty, return" check. Say so in the comment rather than
implying the flag does the work.

### 8.5 Your own observers must not be self-exciting

`decorateGrid()` runs from a `MutationObserver` on the grid, and it writes to that same subtree. Two
rules keep it convergent:

- **Idempotent markers**: a `data-st-bg-*` attribute per tile, so a second pass finds nothing to do.
- **Conditional writes**: compare desired vs current state and only touch the DOM when they differ. An
  unconditional "clear all, then re-add" mutates on every pass → callback → mutation → loop. Our
  selection marker is a real child element, so this matters: remove-then-add each pass never settles,
  while "add if missing / remove if present" settles after one extra pass.

### 8.6 Marking host DOM: prefer a real child element over a pseudo-element

The host already uses `::before` (selection checkmark) and `::after` (padlock) on `.bg_example`. Reusing
either means one of us wins by specificity or both paint on top of each other. Add a real child
(`<span class="st-bg-native-current">`) with `pointer-events: none` instead, and place it clear of the
host's own affordances — the badge sits top-left, the padlock bottom-right, the mobile toggle top-right,
so the marker goes bottom-left.

### 8.7 When the seam is gone, degrade — never half-work

`probe()` reads the elements and tile structure the takeover depends on. Distinguish the two kinds:

- **Containers not rendered yet** (the drawer is built lazily) → wait, with a give-up timer (30s).
- **Containers present but tiles lost `bgfile`** → the host changed its structure → do **not** install,
  log once, and stay in enhancement mode. Media, the panel and the public API keep working.

A takeover that installs on a changed structure breaks the host's picker; one that refuses to install
costs the user only the enhancement.

### 8.8 Verifying a takeover

Judge by **observable consequences**, not by the controller's own fields — internal state cannot prove
interception happened. What the probe asserts instead:

- the extension's `activeMediaId` changed → we handled it;
- the **host's** own mark (`selected-background`) did *not* move → the host did not, i.e. single writer;
- `#bg1` ends up empty → suppression ran.

For pass-through cases, assert the host's effect *did* appear (and pick a tile the host has not already
selected — otherwise "nothing happened" and "the host handled it" look identical). Re-query elements
before each click: dispatching on a detached node bypasses document-level listeners entirely and makes
a pass-through assertion succeed for the wrong reason.
