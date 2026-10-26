import { defineConfig } from 'vite';
import { devMockServer } from './dev/mock-server';

/**
 * Dev-only config for the standalone UI harness (`npm run dev:ui`).
 * The product still builds through vite.config.ts (lib mode) — this file only serves
 * dev/index.html plus the mock host endpoints, so nothing here can reach dist/.
 */
export default defineConfig({
    // root=dev so the harness page is served at "/" — the extension resolves media as the
    // relative path "backgrounds/<file>", exactly like it does inside a real host. Serving
    // the page under /dev/ instead would push every media URL to /dev/backgrounds/ and 404.
    root: 'dev',
    server: {
        port: 5173,
        strictPort: true,
        fs: {
            // src/ lives one level above the harness root.
            allow: ['..'],
        },
    },
    plugins: [devMockServer()],
});
