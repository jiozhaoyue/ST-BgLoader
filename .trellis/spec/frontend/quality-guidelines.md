# Quality Guidelines

> Code quality standards for frontend/UI development.

---

## Gates (same as backend quality-guidelines.md)

```bash
npm run type-check && npm run build
TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e   # 24 checks
node tests/authority.mjs                                   # 15 scenarios
node tests/stress.mjs                                      # 4 scenarios
```

The E2E suite is the UI regression bar: it drives the real settings drawer, renderer
mounts, visualizer, frosted glass, scenes, triggers, ambient sound, weather cycling and
the PublicAPI surface against the running test instance. A UI change is not done until
all 24 pass.

---

## UI code standards

- All styles in `src/ui/style.css`; DOM elements use the `st-bg-` class prefix. No
  inline `<style>` injection except where the frosted-glass controller deliberately
  manages CSS custom properties.
- Overlays sit inside `#bg1` with `pointer-events: none` unless interactive
  (`MediaMount.setInteractive` toggles it) — keep click-through semantics.
- Transitions rely on layer opacity/transform/filter managed exclusively by
  `MediaMount` — never clear or overwrite those properties from another subsystem
  (past regression: the visualizer wiped `style.filter`).
- `destroy()` completeness: every node created is removed; every timer/listener is
  cleared; every object URL is revoked (`CacheManager` audits revocation in stress
  test 4).

---

## Async/UI responsiveness

- No synchronous long work on the main thread (large blobs go through
  `CacheStorage`/streaming, not base64 in JS).
- Every awaited event has a bounded fallback (bounded-wait rule, see
  backend/error-handling.md) — UI state must never depend on a promise that may never
  settle.

---

## Accessibility (current reality)

- The settings drawer is keyboard-reachable through SillyTavern's UI; media overlays are
  decorative and `aria-hidden` semantics are not yet systematically applied. Do not make
  this worse; improve when touching the drawer anyway.

---

## HTML injection & shared string utilities (added 2026-09-25 full audit)

- Every user-controlled string interpolated into an `innerHTML` template (media/file
  names, trigger rule names/patterns, remote URLs — remote-reference items keep the raw
  URL as their display name) MUST go through `escapeHtml()` from `src/core/sanitize.ts`.
  Found and fixed: trigger list, media grid, and mini-player title interpolated raw.
- Media type detection lives ONLY in `src/core/mediaType.ts` (`detectMediaType(name,
  mimeType?)`). It was duplicated in five files whose extension lists had drifted
  (NativeBgAugmenter mislabeled m4v/aac/m4a as images); do not re-create local copies.
- Long imports (file upload, external URL download up to the 60s timeout) must show a
  busy state and report failure (`SettingsDrawer.setImportBusy` + toastr; before the
  audit a failed import died as an unhandled rejection with zero UI feedback).
- High-frequency settings writes are trailing-debounced (~300ms): slider `input` events
  update labels/subsystems in realtime but persist settings through the debounce
  (`SettingsDrawer` bindSlider), otherwise each drag step stringifies and writes
  localStorage synchronously.
