# Quality Guidelines

> Code quality standards for backend/server-integration development.

---

## Gates (all must pass before committing)

```bash
npm run type-check   # tsc --noEmit (strict mode)
npm run build        # vite build — must stay green
npm run test:e2e     # 24-check Puppeteer E2E suite
node tests/authority.mjs   # 15 server-origin storage scenarios
node tests/stress.mjs      # 4 extreme stress scenarios
```

- Browser suites need the test instance: `TEST_TARGET_URL=https://127.0.0.1:8003`
  (Dev/Luker instance, extension wired via symlink). `tests/authority.mjs` skips
  (exit 0) when the instance is unreachable; `e2e.mjs` fails — it expects a target.
- Zero regression is the release bar: all suites green, no exceptions in the browser
  console log the suites capture.
- Server/origin or mount-chain changes: run the stress suite at least once; run it
  multiple times when touching renderer/async code (hangs are timing-dependent — the
  stress test 3 hang only reproduced in full-suite context, not in isolation).

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
