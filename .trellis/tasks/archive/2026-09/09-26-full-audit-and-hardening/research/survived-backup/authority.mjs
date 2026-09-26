/**
 * Server-origin storage + Authority enhancement E2E scenarios.
 *
 * Media scenarios run against the REAL SillyTavern native endpoints of the test instance:
 * uploads must land in the server's backgrounds/ directory (same place as native backgrounds),
 * be served with HTTP Range, survive browser-cache clearing, and be visible from a fresh page
 * (manifest + native listing).
 *
 * Authority scenarios run in the mode the instance offers, detected per page:
 * - real backend (Authority extension installed): assertions read the real KV domain, grant the
 *   agent.browser permission prompt when it appears (idempotent — persistent grant skips it), and
 *   expect the bridge's honest capability verdict.
 * - no real backend: an in-page mock SDK is injected instead (identical surface, Map-backed).
 *
 * Degradation coverage (S6) works in BOTH modes: on real-backend instances the page swallows the
 * window.STAuthority assignment before extension scripts run, so the plugin exercises the same
 * no-SDK degradation path a bare instance would take. Skips (exit 0) when the instance is unreachable.
 */
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome');
const TARGET_URL = process.env.TEST_TARGET_URL
    || process.env.TARGET_URL
    || 'https://127.0.0.1:8003';

let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
    if (condition) {
        passed += 1;
        console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
    } else {
        failed += 1;
        console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Injected before page scripts on Authority-enhanced pages; no-op if a real SDK is present. */
/**
 * Injected before page scripts. MUST stay fully self-contained: evaluateOnNewDocument
 * serializes the function into a fresh page scope where Node-side bindings do not exist.
 *
 * lock=false: natural mock — no-op when a real SDK is already present (real SDK wins).
 * lock=true (FORCE_MOCK): hold the window.STAuthority slot even against a real backend by
 * swallowing its later assignment — keeps the mock path testable on an Authority instance.
 */
function injectAuthorityMockInPage(lock) {
    const kvStore = new Map();
    const calls = { registerTools: 0 };
    window.__authMockState = { kvStore, calls };
    const client = {
        storage: {
            kv: {
                get: async k => (kvStore.has(k) ? kvStore.get(k) : undefined),
                set: async (k, v) => { kvStore.set(k, JSON.parse(JSON.stringify(v))); },
                delete: async k => { kvStore.delete(k); },
                list: async () => Object.fromEntries(kvStore.entries()),
            },
        },
        http: { fetch: async () => ({ url: '', hostname: '', status: 404, ok: false, headers: {}, body: '', bodyEncoding: 'base64', contentType: '' }) },
        jobs: { create: async () => ({ id: 'job_mock' }) },
        events: { subscribe: async () => ({ close() { } }) },
        agent: {
            browser: {
                registerTools: async (request) => {
                    calls.registerTools += 1;
                    window.__authMockLastRegistration = request;
                    return { browserInstanceId: request.browserInstanceId, registrationId: 'reg_mock_1', leaseExpiresAt: new Date(Date.now() + 60000).toISOString(), tools: [] };
                },
                claim: async () => ({ sessionId: null, invocation: null }),
                submitResult: async () => ({}),
            },
        },
        getSession: () => ({ user: 'default-user', mock: true }),
        getCapabilities: () => ({ mock: true }),
    };
    const mock = {
        __stbgMock: true, // lets the suite tell the mock from a real backend
        AuthoritySDK: {
            init: async (cfg) => {
                window.__authMockInitConfig = cfg;
                return client;
            },
        },
    };
    if (lock) {
        try {
            Object.defineProperty(window, 'STAuthority', {
                configurable: false,
                get: () => mock,
                set: () => { /* real SDK assignment swallowed — FORCE_MOCK coverage */ },
            });
        } catch {
            window.STAuthority = mock;
        }
    } else {
        if (window.STAuthority) return; // real SDK wins
        window.STAuthority = mock;
    }
}

/**
 * Injected before page scripts to simulate a bare instance on a real-backend host: the
 * window.STAuthority assignment from the deployed SDK extension is swallowed, so the plugin
 * takes the same sdk-missing degradation path an instance without Authority would.
 */
function injectAuthoritySuppressor() {
    try {
        Object.defineProperty(window, 'STAuthority', {
            configurable: false,
            get: () => undefined,
            set: () => { /* swallowed — degradation coverage */ },
        });
    } catch {
        // defineProperty refused — the page runs with the real backend; S6.1 would then be invalid.
    }
}

async function openPage(browser, { mock = false, lockMock = false, hideAuthority = false } = {}) {
    const page = await browser.newPage();
    if (hideAuthority) await page.evaluateOnNewDocument(injectAuthoritySuppressor);
    if (lockMock) await page.evaluateOnNewDocument(injectAuthorityMockInPage, true);
    else if (mock) await page.evaluateOnNewDocument(injectAuthorityMockInPage, false);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.STBgLoader && window.STBgLoader.isInitialized, { timeout: 35000 });
    return page;
}

/** Fresh page whose localStorage is seeded before extension scripts run (migration test). */
async function openPageWithSeededLocalSettings(browser, settingsJson, revision, volumeOverride) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((snapshot, rev, vol) => {
        const parsed = JSON.parse(snapshot);
        parsed.volume = vol;
        localStorage.setItem('st_bgloader_settings', JSON.stringify(parsed));
        localStorage.setItem('st_bgloader_settings_rev', String(rev));
    }, settingsJson, revision, volumeOverride);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.STBgLoader && window.STBgLoader.isInitialized, { timeout: 35000 });
    return page;
}

/** Fresh page whose localStorage is wiped before extension scripts run (restore test). */
async function openPageWithClearedLocalSettings(browser) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
        // Only the top-level document may clear these. Puppeteer applies this script to EVERY
        // new document, iframes included — and the extension mounts same-origin sandboxed iframes
        // for html/svg backgrounds, so a frame loading *after* startup would otherwise wipe the
        // settings the app had just restored from the server (S7.3 then reads them back as
        // absent while the in-memory volume is correct). The intent here is "start with no local
        // settings", which is a main-frame concern only.
        if (window.top === window) {
            localStorage.removeItem('st_bgloader_settings');
            localStorage.removeItem('st_bgloader_settings_rev');
        }
    });
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.STBgLoader && window.STBgLoader.isInitialized, { timeout: 35000 });
    return page;
}

async function main() {
    console.log('🚀 Server-origin storage scenarios on', TARGET_URL);
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
    });

    try {
        // Backend mode, detected in S5 and reused by S6's degradation coverage.
        let authorityMode = 'mock';

        // ============ S1: upload lands on the server, cataloged, cross-page visible ============
        let uploadedId = '';
        {
            const page = await openPage(browser);
            const upload = await page.evaluate(async () => {
                const ext = window.STBgLoader;
                const item = await ext.cacheManager.saveMedia(
                    '<!DOCTYPE html><html><body style="background:#456">server-origin-test</body></html>',
                    'stbg-origin-test.html', 'html', 'server');
                return { id: item.id, url: item.url, name: item.name };
            });
            uploadedId = upload.id;
            ok('S1.1 upload returns server URL', upload.url.startsWith('backgrounds/'), upload.url);

            const served = await page.evaluate(async (url) => {
                const r = await fetch(url);
                return { status: r.status, type: r.headers.get('content-type'), range: r.headers.get('accept-ranges'), body: (await r.text()).includes('server-origin-test') };
            }, upload.url);
            ok('S1.2 file served from server with Range', served.status === 200 && served.body && served.range === 'bytes', `${served.status} ${served.type}`);

            const manifest = await page.evaluate(async () => {
                const r = await fetch(`/backgrounds/st-bg-loader-manifest.json?t=${Date.now()}`, { cache: 'no-store' });
                if (!r.ok) return null;
                return r.json();
            });
            ok('S1.3 manifest catalogs the entry', !!manifest && manifest.items.some(i => i.id === uploadedId));

            const roundTrip = await page.evaluate(async (id) => {
                const item = await window.STBgLoader.cacheManager.getMedia(id);
                return !!item && item.id === id;
            }, uploadedId);
            ok('S1.4 stable id round-trip', roundTrip);

            // Cross-page visibility: a fresh page sees the same library entry
            const page2 = await openPage(browser);
            const visible = await page2.evaluate(async (id) => {
                const item = await window.STBgLoader.cacheManager.getMedia(id);
                return !!item;
            }, uploadedId);
            ok('S1.5 library visible from a fresh page', visible);
            await page2.close();
            await page.close();
        }

        // ============ S2: browser cache is evictable without touching the server ============
        {
            const page = await openPage(browser);
            const cacheState = await page.evaluate(async (id) => {
                const ext = window.STBgLoader;
                const item = await ext.cacheManager.getMedia(id);
                await ext.cacheManager.clearAll();          // cache maintenance
                await ext.cacheManager.cleanLRU(1);         // aggressive LRU
                const usage = await ext.cacheManager.getCacheUsage();
                const r = await fetch(item.url);
                return { usageCount: usage.itemCount, serverStatus: r.status, body: (await r.text()).includes('server-origin-test') };
            }, uploadedId);
            ok('S2.1 clear/LRU touch only the cache', cacheState.usageCount === 0, `cache entries=${cacheState.usageCount}`);
            ok('S2.2 server file survives cache maintenance', cacheState.serverStatus === 200 && cacheState.body);
            await page.close();
        }

        // ============ S3: explicit delete removes the server file ============
        {
            const page = await openPage(browser);
            const deleted = await page.evaluate(async (id) => {
                const ext = window.STBgLoader;
                const item = await ext.cacheManager.getMedia(id);
                const url = item.url;
                await ext.cacheManager.deleteMedia(id);
                const r = await fetch(url);
                const manifest = await (await fetch(`/backgrounds/st-bg-loader-manifest.json?t=${Date.now()}`, { cache: 'no-store' })).json();
                return { status: r.status, inManifest: manifest.items.some(i => i.id === id) };
            }, uploadedId);
            ok('S3.1 explicit delete removes server file', deleted.status === 404);
            ok('S3.2 manifest entry removed', !deleted.inManifest);
            await page.close();
        }

        // ============ S4: URL import downloads + dedupes, without stubs ============
        {
            const page = await openPage(browser);
            const urlImport = await page.evaluate(async () => {
                const api = window.stBgLoader;
                const testUrl = window.location.origin + '/favicon.ico';
                const first = (await api.preloadMedia([testUrl], { concurrency: 1 }))[0];
                const second = (await api.preloadMedia(testUrl))[0];
                const list = await api.getMediaList();
                return { firstSuccess: first?.success, secondCached: second?.cached, found: list.some(i => i.url === testUrl) };
            });
            ok('S4.1 URL import stored server-side + dedupe', urlImport.firstSuccess && urlImport.secondCached && urlImport.found,
                JSON.stringify(urlImport));
            await page.close();
        }

        // ============ S5: Authority enhancement (real backend or mock): settings sync + agent tools ============
        {
            // FORCE_MOCK=1 keeps the mock slot locked against a real backend — exercises the mock
            // path on an Authority-installed instance; natural runs prefer the real backend.
            const forceMock = process.env.FORCE_MOCK === '1';
            const page = await openPage(browser, forceMock ? { mock: true, lockMock: true } : { mock: true });
            const real = await page.evaluate(() => !!window.STAuthority && !window.STAuthority.__stbgMock);
            const caps = await page.evaluate(() => window.STBgLoader.getAuthorityBridge().getCapabilities());
            // agentTools starts optimistic (true); a first-time authorization may leave it 'pending'.
            const s51ok = real
                ? caps.available === true && caps.sync === true && (caps.agentTools === true || caps.agentToolsState === 'pending')
                : caps.available === true && caps.sync === true && caps.agentTools === true;
            ok('S5.1 Authority enhancement detected', s51ok, real ? 'real backend' : 'mock backend');

            const originalAgentEnabled = await page.evaluate(() => window.STBgLoader.getSettings().agentToolsEnabled);

            if (real) {
                // Real backend: the payload lands in the extension's isolated KV domain.
                const pushed = await page.evaluate(async () => {
                    window.STBgLoader.getSettings().volume = 0.33;
                    window.STBgLoader.saveSettings();
                    for (let i = 0; i < 30; i++) {
                        await new Promise(r => setTimeout(r, 500));
                        const client = window.STBgLoader.getAuthorityBridge().getClient();
                        const payload = client ? await client.storage.kv.get('settings:data') : null;
                        if (payload?.settings?.volume === 0.33) return true;
                    }
                    return false;
                });
                ok('S5.2 settings mirrored to Authority KV', pushed, 'real backend');
            } else {
                const pushed = await page.evaluate(async () => {
                    window.STBgLoader.getSettings().volume = 0.33;
                    window.STBgLoader.saveSettings();
                    for (let i = 0; i < 10; i++) {
                        await new Promise(r => setTimeout(r, 500));
                        const payload = window.__authMockState.kvStore.get('settings:data');
                        if (payload?.settings?.volume === 0.33) return true;
                    }
                    return false;
                });
                ok('S5.2 settings mirrored to Authority KV', pushed, 'mock backend');
            }

            if (real) {
                const agentOn = await page.evaluate(async () => {
                    const ext = window.STBgLoader;
                    ext.getSettings().agentToolsEnabled = true;
                    ext.saveSettings();
                    ext.syncAgentTools();
                    // First-ever registration opens the Authority permission prompt; grant it
                    // persistently. With the grant already stored the prompt never appears and
                    // the loop just expires (idempotent).
                    for (let i = 0; i < 24; i++) {
                        await new Promise(r => setTimeout(r, 500));
                        const controls = [...document.querySelectorAll('.popup .result-control')];
                        const allow = controls.find(b => (b.textContent || '').includes('始终允许'));
                        if (allow) { allow.click(); break; }
                    }
                    // The bridge publishes the honest verdict of the registration attempt.
                    for (let i = 0; i < 60; i++) {
                        const c = ext.getAuthorityBridge().getCapabilities();
                        if (c.agentToolsState === 'ok' || c.agentToolsState === 'blocked') {
                            return { state: c.agentToolsState, note: c.agentToolsNote };
                        }
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    return { state: 'timeout', note: 'registration verdict never landed' };
                });
                ok('S5.3 agent tools registered on enable (opt-in)', agentOn.state === 'ok',
                    `state=${agentOn.state} ${agentOn.note || ''}`);
            } else {
                const agentOn = await page.evaluate(async () => {
                    const ext = window.STBgLoader;
                    ext.getSettings().agentToolsEnabled = true;
                    ext.saveSettings();
                    ext.syncAgentTools();
                    for (let i = 0; i < 10; i++) {
                        await new Promise(r => setTimeout(r, 300));
                        if (window.__authMockState.calls.registerTools > 0) return true;
                    }
                    return false;
                });
                ok('S5.3 agent tools registered on enable (opt-in)', agentOn, `calls=${await page.evaluate(() => window.__authMockState.calls.registerTools)}`);
            }

            // Restore the pre-test agent switch (it persists to the server settings document).
            await page.evaluate((wasEnabled) => {
                const ext = window.STBgLoader;
                ext.getSettings().agentToolsEnabled = wasEnabled;
                ext.saveSettings();
                ext.syncAgentTools();
            }, originalAgentEnabled);
            await page.close();
            // S6's degradation coverage must mimic a bare instance whenever the real backend is
            // installed — including a FORCE_MOCK run, whose S5 page was mock but whose instance is not.
            authorityMode = (real || forceMock) ? 'real' : 'mock';
        }

        // ============ S6: degradation without Authority keeps media fully working ============
        {
            // On a real-backend instance the page suppresses window.STAuthority before extension
            // scripts run, exercising the same sdk-missing degradation path a bare instance takes.
            const page = await openPage(browser, { hideAuthority: authorityMode === 'real' });
            const caps = await page.evaluate(() => window.STBgLoader.getAuthorityBridge().getCapabilities());
            const media = await page.evaluate(async () => {
                const items = await window.STBgLoader.cacheManager.listMedia();
                return { count: items.length };
            });
            ok('S6.1 no Authority: enhancement off', caps.available === false && caps.sync === false, `reason=${caps.degradedReason}`);
            ok('S6.2 no Authority: media library fully functional', media.count > 0, `items=${media.count}`);
            await page.close();
        }

        // ============ S7: settings are server-persisted (fully backend-stored) ============
        {
            // Capture the pre-test marker so cleanup can restore the instance settings.
            const page1 = await openPage(browser);
            const originalVolume = await page1.evaluate(() => window.STBgLoader.getSettings().volume);
            const settingsSnapshot = await page1.evaluate(() => JSON.stringify(window.STBgLoader.getSettings()));

            // S7.1 migration: a local-only settings copy is uploaded when the server
            // document does not exist (first run on a backend).
            await page1.evaluate(async () => {
                const headers = window.SillyTavern.getContext().getRequestHeaders({ omitContentType: true });
                await fetch('/api/backgrounds/delete', {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bg: 'st-bg-loader-settings.json' }),
                });
            });
            const page2 = await openPageWithSeededLocalSettings(browser, settingsSnapshot, 50, 0.33);
            const migrated = await page2.evaluate(async () => {
                const ext = window.STBgLoader;
                await ext.getServerSettings().flush();
                const r = await fetch(`/backgrounds/st-bg-loader-settings.json?t=${Date.now()}`, { cache: 'no-store' });
                if (!r.ok) return { ok: false };
                const doc = await r.json();
                return { ok: doc.settings && doc.settings.volume === 0.33, revision: doc.revision };
            });
            ok('S7.1 local-only settings migrated to the server', migrated.ok === true, `revision=${migrated.revision}`);

            // S7.2 live write round-trip: a settings change reaches the server document.
            const roundTrip = await page2.evaluate(async () => {
                const ext = window.STBgLoader;
                ext.getSettings().volume = 0.42;
                ext.saveSettings();
                await ext.getServerSettings().flush();
                const r = await fetch(`/backgrounds/st-bg-loader-settings.json?t=${Date.now()}`, { cache: 'no-store' });
                if (!r.ok) return { ok: false };
                const doc = await r.json();
                return { ok: doc.settings && doc.settings.volume === 0.42, revision: doc.revision };
            });
            ok('S7.2 settings change round-trips to the server', roundTrip.ok === true, `revision=${roundTrip.revision}`);

            // S7.3 fresh-page restore: with localStorage wiped, settings come from the server.
            const page3 = await openPageWithClearedLocalSettings(browser);
            const restored = await page3.evaluate(() => {
                const volume = window.STBgLoader.getSettings().volume;
                const recached = !!localStorage.getItem('st_bgloader_settings');
                return { volume, recached };
            });
            ok('S7.3 fresh page restores settings from the server', restored.volume === 0.42 && restored.recached,
                `volume=${restored.volume} recached=${restored.recached}`);

            // Cleanup: restore the pre-test settings on the server document.
            await page3.evaluate(async (vol) => {
                const ext = window.STBgLoader;
                ext.getSettings().volume = vol;
                ext.saveSettings();
                await ext.getServerSettings().flush();
            }, originalVolume);
            await page3.close();
            await page2.close();
            await page1.close();
        }

        console.log(`\n📊 Server-origin scenarios: ${passed} passed, ${failed} failed`);
        process.exit(failed > 0 ? 1 : 0);
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    // Unreachable instance = environment without a running SillyTavern: skip, not fail.
    if (/ERR_|ECONNREFUSED|net::ERR|Timeout|timeout/i.test(err.message)) {
        console.warn('⏭️ Test instance unreachable, skipping server-origin scenarios:', err.message);
        process.exit(0);
    }
    console.error('💥 Server-origin scenarios crashed:', err.message);
    process.exit(1);
});
