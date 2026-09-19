# Directory Structure

> How backend (server-facing integration) code is organized in this project.

This is a single-repo SillyTavern browser extension. There is no standalone server: the
"backend" layer is the code that talks to the SillyTavern server's native HTTP endpoints and
to the optional Authority extension SDK.

---

## Directory Layout

```
src/
├── backend/            # ALL server-facing integration code lives here
│   ├── ServerOrigin.ts     # the ONLY media source of truth (server backgrounds/ dir)
│   ├── AuthorityBridge.ts  # optional Authority SDK detection + capability bits
│   ├── RemoteImporter.ts   # CORS fallback: server-side import via Authority http.fetch
│   ├── SettingsSync.ts     # cloud settings mirror (revision + fingerprint convergence)
│   └── AgentBridge.ts      # opt-in Agent Runtime ambient tools
├── cache/              # CacheManager: browser L1 (CacheStorage + IndexedDB index) only
├── api/                # PublicAPI: the scripting surface + event bus
├── core/               # MediaMount (layer A/B double buffering), SceneManager, etc.
├── renderers/          # per-media-type renderers (video / iframe / image)
├── audio/              # AudioEngine, AmbientSoundGenerator
├── ui/                 # SettingsDrawer, MiniPlayer, overlays; style.css
├── fx/                 # AtmosphereFX weather particles
├── visualizer/         # AudioVisualizer
├── triggers/           # TriggerManager (scene trigger rules)
├── types/              # ALL shared types (single module, see frontend/type-safety.md)
└── index.ts            # plugin core: wiring, settings, lifecycle
```

---

## Module Organization

- Any code that performs `fetch()` against SillyTavern endpoints (`/api/backgrounds/*`,
  `backgrounds/<file>`) or the Authority SDK belongs in `src/backend/`. UI, renderers and
  the cache facade must go through these modules, never call server endpoints directly.
- `CacheManager` (`src/cache/CacheManager.ts`) is a facade: public API stays stable while
  the origin behind it can change (this was the storage-refactor boundary).
- The plugin core (`src/index.ts`) owns wiring: subsystems are instantiated in the
  constructor and exposed through narrow `getX()` accessors (see `src/index.ts:62-70`).

---

## Naming Conventions

- Files: PascalCase named after the single class they export (e.g. `ServerOrigin.ts`).
- One class per file; shared helpers are exported functions at the bottom of the file
  (e.g. `mediaUrl()`, `guessMimeType()` in `src/backend/ServerOrigin.ts`).

---

## Examples

- `src/backend/ServerOrigin.ts` — reference for adding new server endpoint integration
  (CSRF headers, upload form field `avatar`, manifest cataloging).
- `src/backend/SettingsSync.ts` — reference for sync/anti-echo-loop design.
