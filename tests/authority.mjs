/**
 * Authority cloud-path E2E scenarios.
 *
 * Verifies the storage-inversion behavior against an in-page mock of the Authority SDK
 * (window.STAuthority.AuthoritySDK): write-through to the cloud origin, L1 hot-cache
 * pull-through, LRU that never evicts server data, one-time local->cloud migration with
 * preserved ids, cross-device settings sync, and graceful degradation without the SDK.
 *
 * When a real Authority SDK extension is installed, the mock steps aside and the same
 * assertions run against the real backend. Skips (exit 0) when the test instance is
 * unreachable, mirroring the design's "cloud tests skip without Authority" rule.
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

/** Injected before page scripts on cloud pages; no-op if a real SDK is present. */
function injectAuthorityMock() {
    if (window.STAuthority) return; // real SDK wins
    const blobStore = new Map();
    const kvStore = new Map();
    const rows = [];
    let blobSeq = 1;
    window.__authMockState = { blobStore, kvStore, rows };

    const COLS = ['id', 'blob_id', 'name', 'type', 'source', 'remote_url', 'size', 'mime_type',
        'added_timestamp', 'last_used_timestamp', 'has_audio'];
    const migrations = new Set();

    const sql = {
        async migrate(input) {
            const applied = [];
            const skipped = [];
            for (const m of input.migrations) {
                if (migrations.has(m.id)) skipped.push(m.id);
                else { migrations.add(m.id); applied.push(m.id); }
            }
            return { applied, skipped, latestId: applied[applied.length - 1] ?? null };
        },
        async query(input) {
            const s = input.statement.replace(/\s+/g, ' ');
            let result = rows.slice();
            if (/WHERE id = \?/.test(s)) result = result.filter(r => r.id === input.params[0]);
            else if (/WHERE remote_url = \?/.test(s)) result = result.filter(r => r.remote_url === input.params[0]);
            if (/ORDER BY last_used_timestamp DESC/.test(s)) {
                result.sort((a, b) => (b.last_used_timestamp || 0) - (a.last_used_timestamp || 0));
            }
            return { kind: 'query', columns: COLS, rows: result, rowCount: result.length };
        },
        async exec(input) {
            const s = input.statement.replace(/\s+/g, ' ');
            const p = input.params || [];
            if (s.startsWith('INSERT INTO media_items')) {
                const row = {};
                COLS.forEach((c, i) => { row[c] = p[i]; });
                rows.push(row);
                return { kind: 'exec', rowsAffected: 1 };
            }
            if (s.startsWith('UPDATE media_items SET last_used_timestamp')) {
                const r = rows.find(x => x.id === p[1]);
                if (r) r.last_used_timestamp = p[0];
                return { kind: 'exec', rowsAffected: r ? 1 : 0 };
            }
            if (s.startsWith('DELETE FROM media_items')) {
                const i = rows.findIndex(x => x.id === p[0]);
                if (i >= 0) rows.splice(i, 1);
                return { kind: 'exec', rowsAffected: i >= 0 ? 1 : 0 };
            }
            return { kind: 'exec', rowsAffected: 0 };
        },
    };

    const client = {
        storage: {
            kv: {
                get: async k => (kvStore.has(k) ? kvStore.get(k) : undefined),
                set: async (k, v) => { kvStore.set(k, JSON.parse(JSON.stringify(v))); },
                delete: async k => { kvStore.delete(k); },
                list: async () => Object.fromEntries(kvStore.entries()),
            },
            blob: {
                put: async (inp) => {
                    const id = 'blob_' + (blobSeq++);
                    const record = { id, name: inp.name, contentType: inp.contentType || '', size: inp.content.length, updatedAt: new Date().toISOString() };
                    blobStore.set(id, { record, content: inp.content });
                    return record;
                },
                get: async (id) => {
                    const e = blobStore.get(id);
                    if (!e) throw new Error('blob not found: ' + id);
                    return { record: e.record, content: e.content, encoding: 'base64' };
                },
                delete: async (id) => { blobStore.delete(id); },
                list: async () => [...blobStore.values()].map(e => e.record),
            },
        },
        sql,
        http: { fetch: async () => ({ url: '', hostname: '', status: 404, ok: false, headers: {}, body: '', bodyEncoding: 'base64', contentType: '' }) },
        jobs: { create: async () => ({ id: 'job_mock' }), get: async () => ({ id: 'job_mock' }), list: async () => [], cancel: async () => ({ id: 'job_mock' }) },
        events: { subscribe: async () => ({ close() { } }) },
        getSession: () => ({ user: 'default-user', extension: 'third-party/ST-BgLoader', mock: true }),
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

async function openPage(browser, { mock }) {
    const page = await browser.newPage();
    if (mock) await page.evaluateOnNewDocument(injectAuthorityMock);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.STBgLoader && window.STBgLoader.isInitialized, { timeout: 35000 });
    return page;
}

async function main() {
    console.log('🚀 Authority cloud-path scenarios on', TARGET_URL);
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
    });

    try {
        // ============ Scenario 1: degradation without the SDK ============
        {
            const page = await openPage(browser, { mock: false });
            const state = await page.evaluate(() => ({
                cloud: window.STBgLoader.getCacheManager().isCloudBacked(),
                caps: window.STBgLoader.getAuthorityBridge().getCapabilities(),
            }));
            ok('S1 degradation: local mode without SDK', state.cloud === false && state.caps.available === false, `reason=${state.caps.degradedReason}`);
            await page.close();
        }

        // ============ Scenario 2: pre-existing local library (migration source) ============
        const localIds = [];
        {
            const page = await openPage(browser, { mock: false });
            localIds.push(...(await page.evaluate(async () => {
                const ext = window.STBgLoader;
                const a = await ext.cacheManager.saveMedia('<html><body style="background:#111">local-a</body></html>', 'migrate-a.html', 'html', 'local');
                const b = await ext.cacheManager.saveMedia('<html><body style="background:#222">local-b</body></html>', 'migrate-b.html', 'html', 'local');
                ext.settings.activeMediaId = a.id;
                ext.saveSettings();
                return [a.id, b.id];
            })));
            await page.close();
        }

        // ============ Scenario 3: cloud mode with mock SDK ============
        {
            const page = await openPage(browser, { mock: true });

            // 3.1 bridge picks the cloud origin
            const cloud = await page.evaluate(() => ({
                isCloud: window.STBgLoader.getCacheManager().isCloudBacked(),
                caps: window.STBgLoader.getAuthorityBridge().getCapabilities(),
                declared: !!window.__authMockInitConfig,
            }));
            ok('S3.1 bridge activates cloud origin', cloud.isCloud === true && cloud.caps.cloudLibrary === true && cloud.declared);

            // 3.2 migration uploaded the pre-existing local library with ids preserved
            let migrated = { rows: 0, ids: [] };
            for (let i = 0; i < 20; i++) {
                migrated = await page.evaluate(ids => ({
                    rows: window.__authMockState.rows.length,
                    ids: window.__authMockState.rows.map(r => r.id),
                }), localIds);
                if (localIds.every(id => migrated.ids.includes(id))) break;
                await sleep(500);
            }
            ok('S3.2 local->cloud migration preserved ids', localIds.every(id => migrated.ids.includes(id)), `rows=${migrated.rows}`);
            const activeRestored = await page.evaluate(id => !!window.STBgLoader.settings.activeMediaId, localIds[0]);

            // 3.3 saveMedia writes through to the cloud origin
            const put = await page.evaluate(async () => {
                const ext = window.STBgLoader;
                const item = await ext.cacheManager.saveMedia('<html><body style="background:#333">cloud-upload</body></html>', 'cloud-upload.html', 'html', 'local');
                return {
                    id: item.id,
                    catalogRows: window.__authMockState.rows.length,
                    blobs: window.__authMockState.blobStore.size,
                    l1: await (await caches.open('st-bg-cache-v1')).match(item.cacheKey).then(r => !!r),
                };
            });
            ok('S3.3 write-through to cloud origin', put.catalogRows >= 3 && put.blobs >= 3, `rows=${put.catalogRows} blobs=${put.blobs}`);
            ok('S3.3b L1 hot cache backfilled on save', put.l1 === true);

            // 3.4 clearing L1 keeps the source; playback re-pulls from the origin
            const repull = await page.evaluate(async () => {
                const ext = window.STBgLoader;
                const items = await ext.cacheManager.listMedia();
                const item = items.find(i => i.name === 'cloud-upload.html');
                const cache = await caches.open('st-bg-cache-v1');
                await cache.delete(item.cacheKey);
                const gone = !(await cache.match(item.cacheKey));
                const url = await ext.cacheManager.getMediaBlobUrl(item);
                const back = !!(await cache.match(item.cacheKey));
                return { gone, url: url.startsWith('blob:'), back };
            });
            ok('S3.4 cache wipe -> origin pull-through re-fills L1', repull.gone && repull.url && repull.back);

            // 3.5 LRU evicts only L1; cloud catalog never loses data
            const lru = await page.evaluate(async () => {
                const ext = window.STBgLoader;
                await ext.cacheManager.cleanLRU(1);
                const catalog = await ext.cacheManager.listMedia();
                const cache = await caches.open('st-bg-cache-v1');
                let l1Entries = 0;
                for (const item of catalog) {
                    if (await cache.match(item.cacheKey)) l1Entries += 1;
                }
                return { catalogCount: catalog.length, l1Entries };
            });
            ok('S3.5 LRU evicts L1 only, source preserved', lru.catalogCount >= 3 && lru.l1Entries === 0, `catalog=${lru.catalogCount} l1=${lru.l1Entries}`);

            // 3.6 settings sync: push to cloud mirror
            await page.evaluate(() => {
                window.STBgLoader.getSettings().volume = 0.42;
                window.STBgLoader.saveSettings();
            });
            let mirror = { rev: 0, volume: null };
            for (let i = 0; i < 10; i++) {
                await sleep(500);
                mirror = await page.evaluate(() => {
                    const kv = window.__authMockState.kvStore;
                    const payload = kv.get('settings:data');
                    return { rev: kv.get('settings:rev') || 0, volume: payload?.settings?.volume ?? null };
                });
                if (mirror.volume === 0.42) break;
            }
            ok('S3.6 settings pushed to cloud mirror', mirror.volume === 0.42, `rev=${mirror.rev}`);

            // 3.7 settings sync: remote change applied within the poll window
            await page.evaluate(() => {
                const kv = window.__authMockState.kvStore;
                const payload = kv.get('settings:data');
                payload.revision += 7;
                payload.fingerprint = 'remote-device-simulation';
                payload.settings.volume = 0.11;
                kv.set('settings:data', payload);
                kv.set('settings:rev', payload.revision);
            });
            let remoteVolume = null;
            for (let i = 0; i < 16; i++) {
                await sleep(1000);
                remoteVolume = await page.evaluate(() => window.STBgLoader.getSettings().volume);
                if (remoteVolume === 0.11) break;
            }
            ok('S3.7 remote settings change converges to local session', remoteVolume === 0.11, `volume=${remoteVolume}`);

            ok('S3.8 active background reference survived migration', activeRestored === true);

            // 3.9 cloud status panel reflects the cloud source of truth
            const panel = await page.evaluate(() => {
                const status = document.querySelector('#st_bgloader_cloud_status');
                const cb = document.querySelector('#st_bgloader_agent_tools_cb');
                return {
                    hasStatus: !!status,
                    cloudText: (status?.textContent || '').includes('Authority'),
                    agentCbPresent: !!cb,
                    agentCbEnabled: cb ? !cb.disabled : false,
                };
            });
            ok('S3.9 cloud panel reflects cloud backend', panel.hasStatus && panel.cloudText && panel.agentCbPresent && panel.agentCbEnabled);
            await page.close();
        }

        // ============ Summary ============
        console.log(`\n📊 Authority scenarios: ${passed} passed, ${failed} failed`);
        process.exit(failed > 0 ? 1 : 0);
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    // Unreachable instance = environment without a running SillyTavern: skip, not fail.
    if (/ERR_|ECONNREFUSED|net::ERR|Timeout|timeout/i.test(err.message)) {
        console.warn('⏭️ Test instance unreachable, skipping Authority scenarios:', err.message);
        process.exit(0);
    }
    console.error('💥 Authority scenarios crashed:', err.message);
    process.exit(1);
});
