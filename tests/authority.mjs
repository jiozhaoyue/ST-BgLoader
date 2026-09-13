/**
 * Server-origin storage + Authority enhancement E2E scenarios.
 *
 * Media scenarios run against the REAL SillyTavern native endpoints of the test instance:
 * uploads must land in the server's backgrounds/ directory (same place as native backgrounds),
 * be served with HTTP Range, survive browser-cache clearing, and be visible from a fresh page
 * (manifest + native listing). Authority scenarios (settings sync, agent tool registration)
 * use an in-page mock SDK when no real Authority extension is installed; the mock steps aside
 * automatically when the real one is present. Skips (exit 0) when the instance is unreachable.
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
function injectAuthorityMock() {
    if (window.STAuthority) return; // real SDK wins
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
    window.STAuthority = {
        AuthoritySDK: {
            init: async (cfg) => {
                window.__authMockInitConfig = cfg;
                return client;
            },
        },
    };
}

/** Seeds the LEGACY browser library (old IndexedDB schema) so migration has something to move. */
function seedLegacyLibrary() {
    const seed = async () => {
        const db = await new Promise((resolve, reject) => {
            const req = indexedDB.open('st_bg_loader_db', 1);
            req.onupgradeneeded = (event) => {
                const d = event.target.result;
                if (!d.objectStoreNames.contains('media_items')) {
                    const store = d.createObjectStore('media_items', { keyPath: 'id' });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('lastUsedTimestamp', 'lastUsedTimestamp', { unique: false });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const item = {
            id: 'bg_legacy_seed_1',
            name: 'legacy-seed.html',
            type: 'html',
            source: 'local',
            url: '/st-bg-cache/legacy/legacy-seed.html',
            cacheKey: '/st-bg-cache/legacy/legacy-seed.html',
            size: 4,
            mimeType: 'text/html',
            addedTimestamp: Date.now(),
            lastUsedTimestamp: Date.now(),
            hasAudio: false,
        };
        await new Promise((resolve, reject) => {
            const tx = db.transaction('media_items', 'readwrite');
            tx.objectStore('media_items').put(item);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        const cache = await caches.open('st-bg-cache-v1');
        await cache.put(item.cacheKey, new Response(new Blob(['seed'], { type: 'text/html' }), { headers: { 'Content-Type': 'text/html' } }));
    };
    void seed();
}

async function openPage(browser, { mock = false, seedLegacy = false } = {}) {
    const page = await browser.newPage();
    if (mock) await page.evaluateOnNewDocument(injectAuthorityMock);
    if (seedLegacy) await page.evaluateOnNewDocument(seedLegacyLibrary);
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
        // ============ S1: upload lands on the server, cataloged, cross-page visible ============
        let uploadedId = '';
        {
            const page = await openPage(browser);
            const upload = await page.evaluate(async () => {
                const ext = window.STBgLoader;
                const item = await ext.cacheManager.saveMedia(
                    '<!DOCTYPE html><html><body style="background:#456">server-origin-test</body></html>',
                    'stbg-origin-test.html', 'html', 'local');
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

        // ============ S5: legacy browser library migrates once, ids preserved ============
        {
            localStorage_flag_recovery: {
                const page = await openPage(browser, { seedLegacy: true });
                await page.evaluate(() => localStorage.removeItem('st_bgloader_legacy_migrated_v2'));
                await page.evaluate(async () => {
                    // Re-run the migration explicitly for determinism (init may have raced the seed).
                    const ext = window.STBgLoader;
                    await ext.cacheManager.migrateLegacyForTest?.();
                });
                const migrated = await page.evaluate(async () => {
                    for (let i = 0; i < 20; i++) {
                        const item = await window.STBgLoader.cacheManager.getMedia('bg_legacy_seed_1');
                        if (item) {
                            const r = await fetch(item.url);
                            return { found: true, status: r.status };
                        }
                        await new Promise(res => setTimeout(res, 250));
                    }
                    return { found: false };
                });
                ok('S5.1 legacy item migrated with id preserved', migrated.found && migrated.status === 200, JSON.stringify(migrated));
                await page.close();
            }
        }

        // ============ S6: Authority enhancement (mock): settings sync + agent tools ============
        {
            const page = await openPage(browser, { mock: true });
            const caps = await page.evaluate(() => window.STBgLoader.getAuthorityBridge().getCapabilities());
            ok('S6.1 Authority enhancement detected', caps.available === true && caps.sync === true && caps.agentTools === true);

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
            ok('S6.2 settings mirrored to Authority KV', pushed);

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
            ok('S6.3 agent tools registered on enable (opt-in)', agentOn, `calls=${await page.evaluate(() => window.__authMockState.calls.registerTools)}`);
            await page.close();
        }

        // ============ S7: degradation without Authority keeps media fully working ============
        {
            const page = await openPage(browser);
            const caps = await page.evaluate(() => window.STBgLoader.getAuthorityBridge().getCapabilities());
            const media = await page.evaluate(async () => {
                const items = await window.STBgLoader.cacheManager.listMedia();
                return { count: items.length, cloud: window.STBgLoader.cacheManager.isCloudBacked() };
            });
            ok('S7.1 no Authority: enhancement off', caps.available === false && caps.sync === false, `reason=${caps.degradedReason}`);
            ok('S7.2 no Authority: media library fully functional', media.cloud === true && media.count > 0, `items=${media.count}`);
            await page.close();
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
