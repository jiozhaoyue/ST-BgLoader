# Type Safety

> TypeScript conventions in this project.

---

## Compiler configuration (tsconfig.json — keep as is)

- `strict: true`, `noImplicitAny: true`, `target: ES2022`, `moduleResolution: Bundler`.
- `tsc --noEmit` (`npm run type-check`) is a commit gate.

---

## Types live in one module

All shared types are exported from `src/types/index.ts` — union string literals for
closed sets, interfaces for data shapes:

```ts
export type MediaType = 'video' | 'audio' | 'html' | 'svg' | 'image';
export interface MediaItem {
    id: string; type: MediaType; source: MediaSource; url: string; cacheKey: string; ...
}
```

- Adding a setting or media field: extend the interface in `src/types/index.ts`, add the
  default to `DEFAULT_SETTINGS`, never redeclare locally.
- Closed vocabularies (weather, visualizer mode, transition type, ambient sound) are
  string-literal unions — do not widen to `string`.

---

## Casting reality

- `as any` / `as unknown` exist only for untyped external surfaces (SillyTavern's
  `window` globals, Authority SDK probing) — 11 occurrences across src/ at the time of
  writing. Confine new casts to the same kind of boundary and prefer
  `window as unknown as { ... }` shape assertions over bare `any`.
- Untyped library probe pattern: assert the minimal shape you need, wrap in try/catch,
  return `undefined` on mismatch (`ServerOrigin.csrfHeaders()`).
- DOM queries: assume null and guard (`document.querySelector` results are checked —
  see `MediaMount.mountMedia` early return).

---

## Async types

- Renderers promise their element type (`Promise<HTMLVideoElement>`); subsystem methods
  promise `void`; PublicAPI results are typed (`PreloadResult[]`).
- Never `Promise<any>` in new code — use the concrete type or a union with `null`.
