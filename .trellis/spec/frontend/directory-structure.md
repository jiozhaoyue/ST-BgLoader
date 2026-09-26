# Directory Structure

> How frontend code is organized in this project.

Vanilla TypeScript + Vite, no framework, no component library. One class per file.

---

## Directory Layout

```
src/
├── index.ts            # plugin core: init(), settings, wiring, lifecycle (~489 lines)
├── api/PublicAPI.ts    # user-facing scripting API + event bus (on/off/emit)
├── core/               # orchestration subsystems
│   ├── MediaMount.ts       # #bg1 layer A/B double-buffering, transitions, fitting
│   ├── SceneManager.ts     # scene snapshots & bookmarks
│   └── ParallaxController.ts
│   # (no ShortcutManager: the Alt+letter shortcuts were removed on 2026-09-26 —
│   #  Alt+F collides with the browser's own app-menu accelerator and Ctrl+Alt is
│   #  reserved by Windows. Background visibility is a panel checkbox instead.)
├── renderers/          # one per media type: VideoRenderer, IframeRenderer, ImageRenderer
├── ui/                 # SettingsDrawer (DOM-built panel), MiniPlayer,
│                       # NativeBackgroundController, FrostedGlassController, style.css
│   # (NativeBackgroundController replaced NativeBgAugmenter on 2026-09-26 when the
│   #  native picker takeover landed: decoration and interception had to share one
│   #  module, because a capture-phase interceptor makes element-level listeners
│   #  unreachable — see host-native-ui.md §8.1. Its URL construction also fixed a
│   #  latent bug: the old code read `data-url`, which jQuery never writes to the DOM.)
├── audio/              # AudioEngine (BGM), AmbientSoundGenerator (procedural)
├── fx/                 # AtmosphereFX (weather particles)
├── visualizer/         # AudioVisualizer
├── triggers/           # TriggerManager (event-driven scene rules)
├── cache/              # CacheManager facade
├── backend/            # server integration (see backend/directory-structure.md)
└── types/              # shared types + DEFAULT_SETTINGS (single module)
```

---

## Module Organization

- A new feature = a new subsystem class in its domain directory, wired in
  `src/index.ts` as a private field, configured from settings via
  `applySettingsToSubsystems()`, and exposed (if needed) via `getX()` accessor and a
  `PublicAPI` method.
- DOM overlays mount into `#bg1` (SillyTavern's background layer); media containers use
  class prefix `st-bg-` (e.g. `st-bg-media-container`, `st-bg-video-element`).
- All CSS lives in `src/ui/style.css` (single file, bundled to `dist/style.css`).
- Build output is `dist/index.js` + `dist/style.css`; Vite is configured for the
  SillyTavern extension contract (`manifest.json` at repo root).

---

## Naming Conventions

- Classes PascalCase, methods camelCase verbs (`applyFitting`, `setWeather`).
- Subsystem settings fields mirror the subsystem name (`visualizer`, `frostedChat`,
  `agentToolsEnabled`).
