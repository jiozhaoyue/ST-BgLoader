# Implement: Server-native settings persistence

Ordered checklist with validation gates. Rollback point: single commit; feature is
additive and degrades to current behavior — revert commit to roll back.

## Steps

1. [x] ServerOrigin generic JSON helpers
   - Export `readServerJson(filename): Promise<any | null>` (GET with cache-bust +
     no-store; 404 → null; parse errors → null + warn).
   - Export `writeServerJson(filename, data): Promise<void>` (FormData `avatar` upload,
     CSRF headers, throw on !ok).
   - Files: `src/backend/ServerOrigin.ts`.
   - Gate: `npm run type-check`.

2. [x] ServerSettings module
   - `src/backend/ServerSettings.ts`: SETTINGS_FILE constant, doc types, `load()`,
     `scheduleSave()` with trailing 800ms debounce + in-flight serialization +
     latest-payload-wins, `flushForTests()` hook (exposed via cacheManager? No — expose
     `flush()` method on the class; index.ts keeps the instance private but reachable
     through `getX()`-style accessor for tests).
   - Warn-once-per-burst semantics on failure.
   - Gate: `npm run type-check`.

3. [x] index.ts wiring
   - `loadSettings()` also reads `st_bgloader_settings_rev`.
   - New `private async reconcileSettings()`: fetch server doc, higher-revision wins
     (server wins ties), persist winner locally, remember `settingsRevision`.
   - `saveSettings()`: revision++ → localStorage (settings + rev) → `scheduleSave` →
     (existing) `settingsSync.schedulePush`.
   - init step 1 becomes `await this.reconcileSettings()`.
   - Migration: in reconcile, when server doc is null and local revision > 0 →
     schedule an immediate save.
   - Accessor `getServerSettings()` for tests.
   - Gate: `npm run type-check && npm run build`.

4. [x] Tests (extend `tests/authority.mjs` with S7 block)
   - S7.1 write round-trip, S7.2 fresh-page server restore (localStorage cleared),
     S7.3 local→server migration; cleanup restores original settings doc.
   - Gate: `node tests/authority.mjs` all green.

5. [x] Full verification
   - `npm run type-check && npm run build`
   - `TEST_TARGET_URL=https://127.0.0.1:8003 npm run test:e2e` (24/24)
   - `node tests/authority.mjs` (15 + 3 new)
   - `node tests/stress.mjs` ×2 (async timing touched)

6. [x] Spec + docs
   - Update `.trellis/spec/backend/database-guidelines.md` layer 3 (settings now
     server-backed, localStorage = fast cache).
   - Journal session entry.

7. [x] Commit + push.
