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
