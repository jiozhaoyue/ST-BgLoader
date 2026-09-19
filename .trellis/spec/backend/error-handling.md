# Error Handling

> How errors are caught, logged, and returned in this project.

---

## The two tiers

1. **Hard failure → `throw new Error` with context.** Operations that must not silently
   proceed (server upload/delete/download) throw with the failing URL and HTTP status:

   ```ts
   // src/backend/ServerOrigin.ts
   const response = await fetch('/api/backgrounds/delete', { ... });
   if (!response.ok) {
       throw new Error(`Server delete failed for "${filename}": HTTP ${response.status}`);
   }
   ```

2. **Recoverable degradation → `try/catch` + `console.warn` and keep going.** Anything
   that has a working fallback logs a warning and degrades (native listing unavailable,
   manifest missing, cache backfill failed). Example: `ServerOrigin.init()` starts a fresh
   manifest when the fetch fails; `CacheManager.backfillCache` warns and keeps playback
   on the server path.

---

## Required patterns

- **Bounded waits (added 2026-09):** every `await` on a DOM media event (`canplay`,
  `error`, `onload`, `play()`) or a cross-origin `fetch()` must settle via a timeout or
  destroy-signal fallback. The stress suite hung because `IframeRenderer.render` waited
  on `onload` only. See the `settle` pattern in `src/renderers/*.ts` and
  `AbortSignal.timeout` in `ServerOrigin.download` (cross-origin only).
- **Untrusted globals:** wrap `window.SillyTavern` context access in try/catch and return
  safe defaults (`csrfHeaders()` in `ServerOrigin.ts`).
- **Event listeners:** user callbacks on the PublicAPI event bus are invoked inside
  try/catch so one bad listener cannot break emission (`PublicAPI.emit`).
- **Cloud/optional deps:** missing Authority never throws — capability checks return
  false and the plugin degrades (`AuthorityBridge.getCapabilities()`,
  `RemoteImporter.import` throws a descriptive error that callers turn into a failed
  `PreloadResult` rather than a crash).

---

## Forbidden

- Empty catch blocks that hide a failing operation (silently swallowing an upload error).
- Rejecting with non-`Error` values; always `Error` with a message a maintainer can grep.
- Letting a render/mount promise stay pending forever — tests will hang (this actually
  happened; see `tests/stress.mjs` test 3).
