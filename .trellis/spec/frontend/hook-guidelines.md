# Hook Guidelines

> This project has no React (no hooks). Read this for the equivalent conventions.

The plugin is vanilla TypeScript. Do not import a framework. The roles hooks play in
React apps are covered by two mechanisms here.

---

## 1. Settings fan-out instead of effects

When settings change, the plugin core re-applies the whole configuration to every
subsystem through one function (`src/index.ts`):

```ts
private applySettingsToSubsystems(): void {
    this.mediaMount.applyFilters(this.settings.filters);
    this.audioVisualizer.setOptions(this.settings.visualizer);
    this.frostedGlassController.setOptions(this.settings.frostedChat);
    this.triggerManager.setRules(this.settings.triggerRules || []);
    this.syncAgentTools();
    // ...one line per subsystem
}
```

Convention: a subsystem exposes `setOptions(<its slice>)` / `apply*` methods and stays
stateless w.r.t. persistence. Add your subsystem here and in `BgLoaderSettings`
(`src/types/index.ts`) + `DEFAULT_SETTINGS`.

---

## 2. Event bus instead of context/callbacks

`PublicAPI` (`src/api/PublicAPI.ts`) implements `on/off/emit` with listener-level error
isolation. Use it for cross-module notifications (`media-change`, `preload-progress`,
`settings-sync`) instead of ad-hoc callbacks — it is also the user scripting surface,
so events are contract.

---

## Async lifecycle rules (the "hook rules" that matter here)

- Mount/render promises must settle unconditionally (bounded waits — see
  backend/error-handling.md).
- Timers and listeners added by a subsystem are removed in `destroy()`
  (`crossfadeTimer`, interaction listeners).
- Polling loops (`SettingsSync` revision poll) store their timer handle and clear it on
  stop.
