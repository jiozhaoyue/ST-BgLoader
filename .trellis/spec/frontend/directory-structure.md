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
│   ├── ShortcutManager.ts  # keyboard shortcuts
│   └── ParallaxController.ts
├── renderers/          # one per media type: VideoRenderer, IframeRenderer, ImageRenderer
├── ui/                 # SettingsDrawer (1043 lines, DOM-built panel), MiniPlayer,
│                       # NativeBgAugmenter, FrostedGlassController, style.css
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
