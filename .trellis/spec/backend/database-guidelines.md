# Database Guidelines

> Persistence layers and data conventions in this project.

There is no SQL database and no ORM. The plugin has three persistence layers; know which
one you are touching before writing code.

---

## Layer 1: SillyTavern server `backgrounds/` directory (source of truth)

- Media files live in the same directory the native background picker uses. Upload via
  `POST /api/backgrounds/upload` (multipart, field name `avatar`), delete via
  `POST /api/backgrounds/delete` (`{ bg: <filename> }`), static route `backgrounds/<file>`
  supports HTTP Range streaming. See `src/backend/ServerOrigin.ts`.
- Non-image files are invisible to the native `/all` listing, so they are cataloged in a
  manifest JSON `st-bg-loader-manifest.json` stored **in the same directory** (the native
  listing ignores it). The manifest is the plugin's catalog: stable ids (`bg_<ts>_<rand>`,
  `native_<filename>`), type, size, mimeType, timestamps.
- Server files are NEVER evicted or cleaned by cache maintenance. LRU/clear operations
  touch only browser cache (see `CacheManager.clearAll()` — "server files are never touched").

---

## Layer 2: browser L1 cache (`src/cache/CacheManager.ts`)

- `CacheStorage` (name `st-bgloader-media-v2` style constant) holds blobs keyed by
  `item.cacheKey`; an `IndexedDB` store (`INDEX_DB_NAME`/`INDEX_STORE`) holds the index
  (`{ cacheKey, lastUsed, size }`) for LRU and usage stats.
- Write-through: `saveMedia` → server upload → `backfillCache` (skips 0-size blobs).
- Miss path: stream directly from the server relative URL (`getMediaBlobUrl` returns
  `item.url`); object URLs are tracked in `objectUrls` and revoked on delete.

---

## Layer 3: settings

- Single `BgLoaderSettings` object in `localStorage` key `st_bgloader_settings`
  (`src/index.ts`), merged over `DEFAULT_SETTINGS` with a spread on load.
- Optional cloud mirror via Authority KV with revision + fingerprint (see
  `src/backend/SettingsSync.ts`).

---

## Conventions

- `MediaItem.id` must stay stable across migrations so scene/chat bindings survive
  (`LegacyMigration` preserved ids; keep that property for any future migration).
- `cacheKey` = server relative URL for uploaded entries; the id for remote references.
- Manifest writes go through `saveManifest()` only — never hand-edit manifest state in
  place without persisting.
