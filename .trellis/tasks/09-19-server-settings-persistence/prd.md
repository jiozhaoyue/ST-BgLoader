# Server-native settings persistence

## Goal

Persist the full settings object (scenes, chat bindings, trigger rules, presets, and
every other `BgLoaderSettings` field) to the SillyTavern server's `backgrounds/`
directory as a JSON file, so the plugin is **fully backend-stored even with zero
optional dependencies** (no Authority). Media already lives server-side; settings are
the last browser-only state. localStorage becomes a fast cache / degraded fallback.

## Background

- Storage inversion (task 09-13-server-native-storage) moved media + manifest to the
  server (`backgrounds/` directory + `st-bg-loader-manifest.json`).
- Settings still live only in `localStorage` (`src/index.ts` `loadSettings`/
  `saveSettings`); the Authority KV mirror (`SettingsSync`) only exists when the
  optional Authority extension is installed.
- Consequence today: scenes, chat bindings, trigger rules, presets and preferences are
  lost when the browser storage is cleared or the user switches browser/device.

## Requirements

1. A settings JSON document (`st-bg-loader-settings.json`) is stored in the same server
   `backgrounds/` directory the manifest uses (native listing ignores it; upload via
   the native `avatar` field endpoint, like the manifest).
2. On plugin init the server copy is fetched (cache-busted) and reconciled with the
   local copy before any subsystem is configured: the copy with the higher revision
   wins; server wins ties.
3. Every `saveSettings()` persists to localStorage immediately (fast path, unchanged
   semantics) and schedules a debounced, serialized server write.
4. First-run migration: if the server has no settings file but localStorage does, the
   local copy is uploaded (idempotent; revision preserved).
5. Graceful degradation: any server read/write failure logs a warning and the plugin
   keeps working exactly as before (localStorage-only). Never blocks init beyond the
   bounded fetch.
6. The Authority `SettingsSync` mirror keeps working unchanged (S5.x scenarios stay
   green).
7. `activeMediaId` churn (every background switch) must not spam the server: writes are
   debounced and coalesced; a write in flight never overtakes a newer pending payload.

## Non-goals

- Real-time multi-tab sync (pre-existing localStorage behavior unchanged).
- Conflict UI / merge of divergent edits (single user; last-writer-wins by revision).
- Server-side settings for anything outside `BgLoaderSettings`.

## Acceptance Criteria

- [x] New test scenarios cover: (a) settings change reaches the server file, (b) a
      fresh page with cleared localStorage restores settings from the server,
      (c) local→server migration when the server file does not exist yet.
- [x] Full suites green: E2E 24/24, authority scenarios (existing 15 + new), stress
      4/4 (stress run at least once because async/mount-chain timing is touched).
- [x] `npm run type-check` + `npm run build` green.
- [x] Degraded mode: with the settings endpoint failing, plugin still boots and
      functions (code review + existing suites unaffected).
