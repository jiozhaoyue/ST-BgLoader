# Implement — Remove legacy compatibility layer

Ordered checklist; each step compiles standalone. Validate with `npm run type-check` after each
numbered group, `npm run build` at the end.

1. [ ] `src/backend/ServerOrigin.ts`
   - Move `guessMimeType()` in from `LocalOrigin.ts`; export it (CacheManager imports it).
   - Inline `MediaPutInput` (without `id?`) from `MediaOrigin.ts`; drop `implements MediaOrigin`
     and the `MediaOrigin` import; simplify `putMedia` id generation (no `input.id ??`).
2. [ ] Delete `src/backend/LegacyMigration.ts`, `src/backend/LocalOrigin.ts`, `src/backend/MediaOrigin.ts`.
3. [ ] `src/cache/CacheManager.ts`
   - Remove imports of `LegacyBrowserStore`/`LegacyMigration`; import `guessMimeType` from ServerOrigin.
   - Remove `legacy` field, `getLocalOrigin()`, `isCloudBacked()`, `migrateLegacyLibrary()`,
     `migrateLegacyForTest()`, and the `void this.migrateLegacyLibrary()` call.
   - Clean class doc: drop "Public API is unchanged from earlier releases" compat line.
4. [ ] `src/types/index.ts`: `MediaSource = 'url' | 'server'`.
5. [ ] `src/ui/SettingsDrawer.ts` (~1012): `saveMedia(file, file.name, type, 'server')`.
6. [ ] `src/index.ts`: rewrite the init storage comment without the legacy-migration sentence.
7. [ ] `tests/authority.mjs`: delete `seedLegacyLibrary()`, `seedLegacy` param, S5 block,
     `isCloudBacked()` usage (line ~297) and any `st_bgloader_legacy_migrated_v2` references.
8. [ ] Grep sweep: no references remain to `LegacyBrowserStore|LegacyMigration|MediaOrigin|
     isCloudBacked|getLocalOrigin|migrateLegacyForTest|'local'` (MediaSource context).
9. [ ] `npm run type-check` && `npm run build`; run `npm run test:e2e` / `test:stress` if a live
     ST instance is reachable, otherwise record that in the wrap-up.
10. [ ] Commit `feat!: remove legacy compatibility layer` + push origin master.

Rollback point: single commit; revert restores the compat layer wholesale.
