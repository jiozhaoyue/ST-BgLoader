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

---

## Probe hygiene (added 2026-09-26 full audit)

The Dev-instance probes under `.trellis/tasks/*/research/probe-*.mjs` drive a **live** host that
holds real (Dev) settings, so they carry production obligations:

- **A probe that changes state must restore it — and must wait for the write to actually land
  before closing the page.** Settings writes are debounced *and* pushed to the server document
  asynchronously, while startup trusts the server document (see state-management.md, A5). A page
  closed right after the last mutation can therefore leave the instance changed. The nastier half:
  the *next* run then reads that residue as its "initial" value and faithfully restores it,
  cementing the pollution. Observed 2026-09-26 — `settings.backgroundVisible` stuck at `false`
  after a probe threw mid-run, skipping its restore block. Sit out the write, then assert the
  restore (`probe-smoke-g6.mjs` R-1..R-3).
- **Never write to the instance just to set up a test.** `CacheManager.preloadUrl()` calls
  `origin.putMedia()`, i.e. it adds a real entry to the user's server-side media library — that is
  exactly how the junk-card finding (M1) got in. Prefer read-only setup; when the evidence is
  unreachable without writing, record an honest `SKIP` and give the source-level evidence instead
  (`probe-perf-e1-e2.mjs` E2-2).
- **Write assertions against the implementation's semantics, not against intuition.** Three false
  failures on 2026-09-26 came from the assertion rather than the product:
  - drawer collapse: read `getComputedStyle().display` — the initial state comes from the host
    stylesheet, so inline `style.display` is empty until a click makes slideToggle write it;
  - `MiniPlayer.hide()` only swaps a class and keeps the node, so "element exists" is not
    visibility — check the `hidden`/`visible` class or the computed display;
  - a checkbox whose initial value is a persisted setting must be asserted **directionally**
    (relative to `wasChecked`), never as an absolute state.
  - **assert on your own additions, not on the host's styling.** Probing "our additions do not
    glow" by reading `boxShadow` off a host `.bg_example` measures the *host's* stylesheet — the
    host gives its thumbnails a shadow by design. Read it off the elements we actually create
    (the badge, the marker dot), and enforce "we add no `box-shadow` anywhere" at source level.
  - **a "did the host handle it" assertion must not click an element already in the target state,
    and must re-query the element first.** Clicking the tile the host already had selected makes
    "nothing happened" and "the host handled it" indistinguishable; dispatching on a *detached*
    node bypasses document-level listeners entirely, so a pass-through assertion can pass for
    the wrong reason. Both happened on 2026-09-26; asserting "the host's mark moved **to the tile
    I clicked**" (plus `isConnected`) is what makes the test mean something.
- **Record page errors with their origin.** The host page loads other third-party extensions, so a
  bare message cannot be attributed (`Identifier 'SPresetSettings' has already been declared` is
  plainly someone else's). Assert "no error originating from `dist/index.js`" and print the foreign
  ones as context — requiring a page-wide zero-error run is not achievable on a real tavern.
