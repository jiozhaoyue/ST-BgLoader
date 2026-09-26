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
- `settings.activeMediaId` is the mounted media pointer; `applyMedia(item, persist)` writes it
  first when `persist` is true (the default), so a page reload restores the last background.
  Transient backgrounds (`PublicAPI.setBackground` WITHOUT `saveToLibrary`, `persist = false`)
  deliberately do not record it — see the Runtime-only state section below.
- `settings.backgroundVisible` is the durable intent for the background layer's visibility; it
  replaced the removed Alt+B shortcut. `MediaMount.visible` is only the *applied mirror*:
  `setBackgroundVisible()` writes the setting, persists it, and fans out through
  `applySettingsToSubsystems()`; `init()` and the panel checkbox both read the setting, and the
  checkbox routes its `change` back through that same public path. Rendering never writes a
  stray inline `display` on the container any more — doing so once meant mounts into a hidden
  container and a background that never came back (audit A1).
- `settings.nativeTakeover` (`'off' | 'non-image' | 'all'`, default `'all'`) is how much of the
  **host's own** background picker this extension replaces. It is read in `init()` to install
  `NativeBackgroundController` and re-applied on every fan-out
  (`applySettingsToSubsystems()` → `setLevel()`), so the panel switch and the persisted setting
  cannot drift. Unlike `backgroundVisible` there is no second copy of the state: the controller's
  `level` field is the applied value, not an independent truth (see host-native-ui.md §8 for what
  the takeover may and may not touch).

---

## Runtime-only state (not in `settings`)

Some state is genuinely per-session and must NOT be persisted, because persisting it created
dangling references:

| State | Owner | Why it is not persisted |
| --- | --- | --- |
| Transient background | `MediaMount` mount + `applyMedia(item, persist = false)` | Its item id (`custom_<ts>`) exists nowhere in the catalog, so a persisted `activeMediaId` could never be resolved on reload (audit A2). `PublicAPI.setBackground` opts in with `saveToLibrary: true`. |

`init()` self-heals the one dangling case that IS persisted: if `activeMediaId` no longer
resolves (`CacheManager.getMedia` returns null), it is cleared and saved instead of being
carried forever.

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

### Startup priority (audit A5, 2026-09-26)

Three settings stores coexist and their revision counters are **independent**, so they cannot be
ordered against each other (observed 41 in KV vs 202 in the server document). Precedence is
therefore explicit rather than by counter:

1. `localStorage` and the server settings document are reconciled by revision in
   `index.reconcileSettings()` — higher revision wins, the server wins ties.
2. The KV mirror is a cross-device **backup**, not a third source of truth:
   `SettingsSync.start()` adopts it only when the server document is missing/unreadable, which
   the caller reports through the `hasServerDocument` port
   (`index.hasServerSettingsDocument()` → `ServerSettings.load() !== null`). It used to be
   applied unconditionally, which let a stale mirror resurrect state the server document had
   already corrected on every page load (a deleted background came back as a dangling id).

**Known consequence — it does not self-heal.** When the server document wins, the stale mirror
is neither corrected nor deleted: it is only overwritten by the next local write
(`saveSettings()` → `SettingsSync.schedulePush`). The reverse case is the same: with the server
document missing, the mirror is adopted as-is and pushed back as the current state. No
reconciliation between the two counters is attempted, by design — the counters are not
comparable, so any such attempt would be a guess.

---

## Media library state

The library itself is NOT in settings: it is the server manifest + native listing
(see backend/database-guidelines.md). `CacheManager.listMedia()` is always re-read,
never cached in settings. On SillyTavern's `CHAT_CHANGED` event the active background is
re-applied from `settings.activeMediaId`.
