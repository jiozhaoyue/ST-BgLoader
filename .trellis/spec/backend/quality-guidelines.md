# Quality Guidelines

> Code quality standards for backend/server-integration development.

---

## Gates (all must pass before committing)

```bash
npm run type-check   # tsc --noEmit (strict mode)
npm run build        # vite build — must stay green
npm run test:e2e     # 24-check Puppeteer E2E suite
node tests/authority.mjs   # 18 server-origin storage + Authority scenarios (dual-mode)
node tests/stress.mjs      # 4 extreme stress scenarios
```

- Browser suites need the test instance: `TEST_TARGET_URL=https://127.0.0.1:8003`
  (Dev/Luker instance, extension wired via symlink; all three suites default to it —
  never to port 8000, see rule L0-16). `tests/authority.mjs` skips (exit 0) when the
  instance is unreachable; `e2e.mjs` fails — it expects a target.
- `tests/authority.mjs` is dual-mode: with the Authority backend installed (jiozhaoyue
  fork under `plugins/authority`) S5 asserts against the real KV domain and the real
  agent registration verdict; `FORCE_MOCK=1 node tests/authority.mjs` locks the mock
  slot so the mock path stays testable on an Authority instance. S6's degradation
  coverage works in both modes (document-start suppression of `window.STAuthority`).
- Zero regression is the release bar: all suites green, no exceptions in the browser
  console log the suites capture.
- Server/origin or mount-chain changes: run the stress suite at least once; run it
  multiple times when touching renderer/async code (hangs are timing-dependent — the
  stress test 3 hang only reproduced in full-suite context, not in isolation).
- Test-injected page functions (`evaluateOnNewDocument`) must be **self-contained**:
  puppeteer serializes them into a fresh page scope where Node-side bindings are
  undefined, and a ReferenceError there fails silently (2026-09-25: the locked-mock
  injector crashed this way until inlined).

---

## Instance isolation (hard rule)

Development happens only in this repo. Never copy code into a SillyTavern instance;
instances pull via git, and test instances serve this repo through a symlink. Test
artifacts created by suites must be cleaned by the suite (leaked server files from a
crashed run are removed via the plugin API, not by hand-editing instance files).

---

## Code standards

- `tsc` strict: no implicit any, no unchecked casts beyond the narrow `window` access
  pattern (see frontend/type-safety.md).
- No new runtime dependencies without discussion; the plugin is dependency-free at
  runtime (devDependencies only: typescript, vite, puppeteer-core).
- Server-facing modules must be resilient when the server lacks an endpoint (probe the
  capability, degrade with a warn — never assume a SillyTavern fork has upstream APIs).
- Public API surface (`src/api/PublicAPI.ts`) is user-facing scripting: additive changes
  only, document every new method in `README.md`.
