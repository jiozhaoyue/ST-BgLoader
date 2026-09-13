# Remove legacy compatibility layer

## Goal

Delete all legacy/compatibility code left over from the storage-inversion refactor. The SillyTavern
server's `backgrounds/` directory (ServerOrigin) is the only storage path; no migration shims, no
legacy readers, no compat typing. User directive: no compatibility, no fallbacks beyond confirmed
functional features, no rollback paths.

## Scope (decided with user)

### Delete outright
1. `src/backend/LegacyMigration.ts` — entire file (one-time legacy browser library → server upload).
2. `src/backend/LocalOrigin.ts` — `LegacyBrowserStore` class + file; `guessMimeType()` moves to
   `src/backend/ServerOrigin.ts` (it is a live utility, not compat).
3. `src/cache/CacheManager.ts` compat surface: `legacy` field, `getLocalOrigin()`,
   `migrateLegacyLibrary()`, `migrateLegacyForTest()`, `isCloudBacked()` ("kept for UI
   compatibility", zero UI callers), the `void this.migrateLegacyLibrary()` call in `init()`,
   and the "Public API is unchanged from earlier releases" doc line.
4. `src/backend/MediaOrigin.ts` — entire file. Only ServerOrigin implements it; `kind` union members
   `'authority' | 'local'` exist purely for typing compatibility and are never read. `MediaPutInput`
   moves into `ServerOrigin.ts`; drop its `id?` field (only consumer was the migration).
5. `src/index.ts` — init comment mentioning legacy migration.
6. `tests/authority.mjs` — S5 migration test block, `seedLegacyLibrary()`, `seedLegacy` openPage
   parameter, and the `isCloudBacked()` reference in the S-scan at line ~297.

### Change semantics
7. `src/types/index.ts` — `MediaSource` narrows from `'local' | 'url' | 'server'` to `'url' | 'server'`.
   `src/ui/SettingsDrawer.ts` upload path (`saveMedia(..., 'local')` at ~line 1012) passes `'server'`.

### Explicitly kept (user decision)
- `TriggerManager` event_types fallback branch (environment tolerance, not version compat).
- `CacheManager.fetchForStorage` Authority CORS proxy fallback (functional Authority feature).

## Acceptance Criteria

- [ ] `LegacyMigration.ts`, `LocalOrigin.ts`, `MediaOrigin.ts` no longer exist.
- [ ] No source file references `LegacyBrowserStore`, `LegacyMigration`, `MediaOrigin`, `isCloudBacked`,
      `getLocalOrigin`, `migrateLegacyForTest`, or `'local'` as a MediaSource value.
- [ ] `npm run type-check` passes.
- [ ] `npm run build` passes.
- [ ] `tests/authority.mjs` updated; remaining suites pass (e2e requires a live ST instance — run if
      available, otherwise type-check + build + explicit note).
- [ ] Changes committed and pushed to origin master.

## Constraints

- Diff-based edits only (Edit tool), no whole-file rewrites of existing sources.
- Work only in the code repo; never touch instance directories.
- No re-implementation of any migration path; if legacy browser data exists it is simply ignored.
