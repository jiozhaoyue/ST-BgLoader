# Component Guidelines

> How UI pieces ("components") are built in this framework-free project.

There is no React/Vue. A "component" is a class that owns a DOM subtree and exposes
imperative methods. Follow the established shape.

---

## The subsystem class shape

```ts
export class VideoRenderer {
    private videoElement: HTMLVideoElement | null = null;
    constructor(container: HTMLElement, audioEngine: AudioEngine) { ... }  // deps injected
    public async render(url: string, fitting: string): Promise<HTMLVideoElement> { ... }
    public destroy(): void { ... }   // ALWAYS provide destroy; remove nodes + release
}
```

- Constructor injection of dependencies; no service locator, no globals.
- Every class that creates DOM implements `destroy()` that removes its nodes and
  releases attached resources (`MediaMount.mountMedia` calls destroy on all three
  renderers of a layer before rendering; `MediaMount.clear()` destroys everything).
- `render()` methods return a promise of the created element and MUST settle
  unconditionally (see backend/error-handling.md bounded-wait rule).

---

## Double-buffered layers

Background media mounts into layer A/B (`MediaMount`, `src/core/MediaMount.ts`): the new
item renders on the inactive layer, a crossfade transition runs, and a timer destroys the
old layer after `dur + 50` ms. A pending crossfade is cancelled by finalizing the
previous state immediately at the top of `mountMedia`. Preserve this pattern for any new
media type; do not mount outside the layer system.

---

## Panels

- `SettingsDrawer` builds its DOM programmatically and is the only large UI surface
  (storage status panel, cloud toggle, per-feature controls). Apply remote settings via
  `applyRemoteSettings()`, refresh grids via `refreshMediaGrid()`.
- Overlays (`AtmosphereFX`, `AudioVisualizer`, `FrostedGlassController`) receive options
  via `setOptions(...)` — never reach into another subsystem's DOM.
- `setOptions` implementations must not clear styles they do not own (a visualizer
  once wiped `style.filter` set by the filter engine — caught by the E2E suite).

---

## Lazy construction & idempotent mounting (added 2026-09-25 full audit)

- A subsystem whose constructor binds window listeners must NOT be instantiated
  speculatively: `index.ts` used to create a throwaway `ShortcutManager` (keydown bound
  in its constructor) and replace it in `init()` — the orphan listener leaked forever.
  Fields holding such subsystems are `| null = null` and built once in `init()`.
- Entry points that can be invoked concurrently must serialize themselves:
  `MediaMount.mountMedia` queues through a promise chain — two interleaved mounts would
  both target the same layer and race the A/B bookkeeping.
- Overlay mounting routes through `MediaMount`'s `onHostReady` callback with a
  mounted-once guard in `index.ts` (`mountOverlays`): when `#bg1` appears after plugin
  init, FX/visualizer/parallax still mount exactly once (previously they never mounted
  on that path).
- `ParallaxController.enable()` is reentrancy-guarded by `listenerAttached` — the
  attach and setOptions paths may both run.
