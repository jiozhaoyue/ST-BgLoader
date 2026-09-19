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
