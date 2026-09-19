# Design: Server-native settings persistence

## Boundaries

- New module `src/backend/ServerSettings.ts` — owns the server settings document
  (read, debounced+serialized write, revision reconciliation). Knows nothing about
  subsystems.
- `src/index.ts` — calls `ServerSettings.load()` during init reconciliation and
  `scheduleSave()` from `saveSettings()`; keeps owning localStorage + subsystem fan-out.
- `src/backend/ServerOrigin.ts` — exports two small generic helpers so the settings
  document reuses the exact upload/read/CSRF path as the manifest:
  `readServerJson(filename)` and `writeServerJson(filename, data)`.

## Server document format

`backgrounds/st-bg-loader-settings.json`:

```json
{
  "version": 1,
  "revision": 7,
  "updatedTimestamp": 1789800000000,
  "settings": { ...BgLoaderSettings... }
}
```

The manifest and the native `/all` listing ignore this file (non-image, non-media name).
Note: the manifest cataloging in `ServerOrigin.putMedia` filters by filename — settings
file never enters the media catalog because it is written by the dedicated helpers, not
`putMedia`.

## Revision mechanism

- `BgLoaderSettings` stays untouched; revision lives in the document wrapper, not in
  settings (settings keep being plain data for the Authority mirror).
- Local revision is tracked in localStorage next to the settings blob under
  `st_bgloader_settings_rev` (number). `loadSettings()` reads it.
- Reconciliation on init:
  - server missing → keep local (migration upload happens on the next scheduled save;
    init explicitly schedules one if local revision > 0 to satisfy migration acceptance).
  - local missing → take server settings (revision from server).
  - both exist → higher revision wins; tie → server wins.
- `saveSettings()` increments the local revision, then localStorage write (sync fast
  path) then `serverSettings.scheduleSave()`.

## Write path (debounce + serialization)

```
saveSettings() ──► scheduleSave(settings)   [trailing debounce 800ms]
                        │  (coalesces bursts, e.g. 10 rapid background switches)
                        ▼
                 flush(): if write in flight → mark pending; loop after settle
                          writeServerJson(...) → on failure: warn once per burst
```

- Single in-flight guard prevents out-of-order server writes (always the newest payload
  wins because flush re-runs with the latest state after the in-flight completes).
- No awaits on the critical path: `saveSettings()` stays sync for callers.

## Read path

- `ServerSettings.load(): Promise<ServerSettingsDoc | null>` — fetch
  `backgrounds/st-bg-loader-settings.json?t=<ts>` with `cache: 'no-store'`; 404 → null
  (first run); parse errors → null + warn. Fetch is bounded by the browser default and
  same-origin, matching `ServerOrigin.init` behavior.
- init becomes: `loadSettings()` (localStorage) → `await reconcileSettings()` →
  everything else unchanged. This runs before `cacheManager.init` and subsystem
  configuration, so the applied settings are the reconciled ones.

## Degradation

- Server unreachable / upload endpoint fails → `console.warn('[ST-BgLoader] ...')`,
  revision stays local, localStorage-only behavior (exactly today's semantics).
- No new capability bits, no Authority dependency.

## Compatibility

- `SettingsSync` (Authority KV mirror) untouched; it keeps its own revision+fingerprint
  scheme. The two schemes are independent documents (KV vs server file).
- Legacy localStorage from older versions: no `st_bgloader_settings_rev` → revision 0;
  any server doc (revision ≥ 1 after first write) wins, local is uploaded by migration
  only when server file is absent.

## Test design (extends tests/authority.mjs)

- S7.1 round-trip: flip a marker setting through the plugin API → wait debounce →
  re-read server JSON → contains marker.
- S7.2 fresh-page restore: new page, `localStorage.removeItem` both settings keys
  before extension init → reconciled settings come from server (marker present).
- S7.3 migration: fresh page, seed localStorage with settings+rev, ensure no server
  file (S7.1 runs after and creates it — order: run S7.3 in a pristine library state
  BEFORE S7.1 or delete the file in-between via the plugin's delete endpoint).
- Suites must clean up: restore the pre-test settings at the end to not pollute the
  shared test instance library state.
