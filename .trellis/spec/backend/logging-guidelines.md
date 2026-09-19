# Logging Guidelines

> Log levels, format, and what to log in this project.

---

## Format

Every log line starts with a bracketed plugin tag; subsystems append their own qualifier:

- `[ST-BgLoader]` — default tag (50+ call sites across src/)
- `[ST-BgLoader AudioEngine]`, `[ST-BgLoader PublicAPI]` — subsystem-qualified variants

```ts
console.warn('[ST-BgLoader] Cache backfill failed (playback still streams from server):', err);
console.error('[ST-BgLoader] Failed to save server media manifest:', err);
console.log('[ST-BgLoader] Server media library ready: 11 cataloged entries.');
```

---

## Level usage (measured distribution in src/)

| Level | When | Example |
|-------|------|---------|
| `console.warn` (21×) | Recoverable failure or degradation — the dominant level | autoplay blocked, CORS fallback engaged, manifest missing |
| `console.error` (8×) | Operation actually failed and user-visible state is affected | manifest save failed, video load error |
| `console.log` (13×) | Init milestones and state transitions only | subsystems initialized, storage mode |
| `console.info` (1×) | Rare; avoid | — |

---

## Rules

- Attach the error object as the last argument (not stringified) so the browser devtools
  show the stack.
- Init-path logs state which storage mode the plugin is running in (server-native,
  Authority enhanced, degraded) — keep that when touching `src/index.ts` init.
- Never log absolute local paths or user-identifying data (repo hygiene rule; see
  commit a568b10 "sanitize sensitive local paths").
- No debug logging in hot paths (render loop, visualizer frame callbacks).
