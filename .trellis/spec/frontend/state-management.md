# State Management

> Where state lives and how it flows in this project.

---

## The one source: `settings` on the plugin core

```ts
// src/index.ts
private settings: BgLoaderSettings = { ...DEFAULT_SETTINGS };
```

- Type + defaults in `src/types/index.ts` (`BgLoaderSettings`, `DEFAULT_SETTINGS`).
- Persisted as JSON in `localStorage` key `st_bgloader_settings` (fast cache) and as the
  durable server document `st-bg-loader-settings.json` (see
  backend/database-guidelines.md); loading merges a stored partial over
  `DEFAULT_SETTINGS` with a spread, then reconciles against the server copy by revision,
  so new fields default cleanly and settings survive browser-cache clears.
- Writes go through `saveSettings()`; every mutation path ends in
  `applySettingsToSubsystems()` (the fan-out — see hook-guidelines.md).
- `settings.activeMediaId` is the mounted media pointer; every `applyMedia` updates it
  first, so a page reload restores the last background.

---

## Derived/runtime state per subsystem

Subsystems hold only runtime state (active layer, fade timers, audio context) and are
reconfigured from settings. They never persist anything themselves.

---

## Cloud mirror (optional Authority)

`src/backend/SettingsSync.ts` mirrors settings into Authority KV:

- Every payload carries `revision` (monotonic) + `fingerprint` (content hash).
- Pushes are debounced; a fingerprint check prevents echo loops (do not re-apply a
  settings payload identical to the last one applied).
- Remote wins only when its revision is newer; convergence is via a cheap revision
  poll (no SSE assumption).
- On remote apply: settings are replaced, persisted to localStorage (quota errors are
  tolerated — cloud stays authoritative), and `applyRemoteSettings` refreshes the UI.

---

## Media library state

The library itself is NOT in settings: it is the server manifest + native listing
(see backend/database-guidelines.md). `CacheManager.listMedia()` is always re-read,
never cached in settings. Chat-scoped bindings live in `settings.chatBindings[chatId]`
and re-apply on SillyTavern's `CHAT_CHANGED` event.
