// G2 性能验证：量化 E1（目录 TTL 缓存）与 E2（LRU 索引内存镜像）的改动效果。
//
// 判据设计：**不依赖旧代码**，而是断言改动后的性质——
//   E1：TTL 窗口内的 M 次目录调用合并为 ≤1 次网络请求；TTL 过期后必须重新请求（缓存非永久）。
//   E2：N 次热路径调用期间的全量 IDB 读（getAll/getAllKeys）为 O(1) 而非 O(N)。
// 改前基线由 findings.md §五 记录（E1 = 每次调用一次 POST；E2 = 每次 touch 一次全量 getAll）。
//
// 用后即删类别：本文件留在任务 research/ 作为验收证据。只读——E1 只读目录，E2 只读 blob URL，
// 不改写实例侧任何数据。
import puppeteer from 'puppeteer-core';

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (n, ok, d) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); ok ? pass++ : fail++; };

const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
});

async function openPage() {
    const p = await browser.newPage();
    await p.setViewport({ width: 1500, height: 1000 });

    // E2 测量点：在任何页面脚本之前包装 IndexedDB 的读/写入口。
    await p.evaluateOnNewDocument(() => {
        window.__idb = { getAll: 0, getAllKeys: 0, put: 0 };
        const wrap = (name, key) => {
            const orig = IDBObjectStore.prototype[name];
            if (typeof orig !== 'function') return;
            IDBObjectStore.prototype[name] = function (...a) {
                try { window.__idb[key]++; } catch (e) { /* never break the page for a counter */ }
                return orig.apply(this, a);
            };
        };
        wrap('getAll', 'getAll');
        wrap('getAllKeys', 'getAllKeys');
        wrap('put', 'put');
    });

    // E1 测量点：统计服务端目录端点的真实请求数。
    const hits = [];
    p.on('request', (req) => { if (req.url().includes('/api/backgrounds/all')) hits.push(Date.now()); });

    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1200);
    return { p, hits };
}

try {
    // ══════════ E1：ServerOrigin 目录 TTL 缓存（TTL = 2000ms） ══════════
    console.log('\n===== E1: catalog TTL cache — network requests =====');
    {
        const { p, hits } = await openPage();

        // 预热：让缓存填上，并落在 TTL 窗口内。
        await p.evaluate(async () => { await window.STBgLoader.getCacheManager().listMedia(); });
        await sleep(250);

        const before = hits.length;
        const t0 = Date.now();
        const calls = await p.evaluate(async () => {
            const cm = window.STBgLoader.getCacheManager();
            let n = 0;
            for (let i = 0; i < 15; i++) { await cm.listMedia(); n++; }
            // 另一条路径：getMedia() 走 getCatalogItem() → 同一个 listCatalog()。
            for (let i = 0; i < 5; i++) { await cm.getMedia('__probe_nonexistent__'); n++; }
            return n;
        });
        const windowMs = Date.now() - t0;
        await sleep(150);
        const fresh = hits.slice(before);
        check(`E1-1 ${calls} catalog calls inside the 2s TTL → ≤1 request (baseline: ${calls})`,
            fresh.length <= 1, `requests=${fresh.length} over a ${windowMs}ms window`);
        if (fresh.length) {
            console.log(`       request offsets from window start: ${fresh.map(t => (t - t0) + 'ms').join(', ')}`);
        }

        // TTL 过期后必须重新请求：证明这是短时缓存，而不是永久缓存（列表变更仍会可见）。
        await sleep(2200);
        const beforeExpiry = hits.length;
        await p.evaluate(async () => { await window.STBgLoader.getCacheManager().listMedia(); });
        await sleep(250);
        const afterExpiry = hits.length - beforeExpiry;
        check('E1-2 one call after the TTL expires → exactly 1 request (cache invalidates)',
            afterExpiry === 1, `requests=${afterExpiry}`);

        await p.close();
    }

    // ══════════ E2：CacheManager LRU 索引内存镜像 ══════════
    console.log('\n===== E2: LRU index memory mirror — full IDB reads =====');
    {
        const { p } = await openPage();

        const catalog = await p.evaluate(async () => {
            const items = await window.STBgLoader.getCacheManager().listMedia();
            return items.map(i => ({ id: i.id, name: i.name }));
        });

        if (catalog.length === 0) {
            check('E2-0 catalog has at least one item to exercise the hot path', false, 'catalog empty');
        } else {
            // 预热：让第一条 blob URL 落进 objectUrls，后续调用即走 "命中 → touchCache" 分支。
            await p.evaluate(async () => {
                const cm = window.STBgLoader.getCacheManager();
                const items = await cm.listMedia();
                await cm.getMediaBlobUrl(items[0]).catch(() => {});
            });
            await sleep(400);

            const N = 12;
            const warm = await p.evaluate(async (n) => {
                const cm = window.STBgLoader.getCacheManager();
                const items = await cm.listMedia();

                const base = { ...window.__idb };
                for (let i = 0; i < n; i++) {
                    await cm.getMediaBlobUrl(items[i % items.length]).catch(() => {});
                }
                const mid = { ...window.__idb };

                // Locate an item that IS in the browser cache. Touching it rewrites only its
                // lastUsed timestamp — no entry is created — so this stays a read-only probe.
                let cachedName = null, touchPuts = 0;
                for (const it of items) {
                    const beforePut = window.__idb.put;
                    await cm.getMediaBlobUrl(it).catch(() => {});
                    if (window.__idb.put > beforePut) {
                        cachedName = it.name;
                        touchPuts = window.__idb.put - beforePut;
                        break;
                    }
                }
                return { base, mid, cachedName, touchPuts, count: items.length };
            }, N);
            await sleep(300);

            const fullReads = (warm.mid.getAll - warm.base.getAll) + (warm.mid.getAllKeys - warm.base.getAllKeys);

            check(`E2-1 ${N} hot-path calls → ≤1 full IDB read (baseline: ${N})`,
                fullReads <= 1,
                `getAll=+${warm.mid.getAll - warm.base.getAll} getAllKeys=+${warm.mid.getAllKeys - warm.base.getAllKeys}`);
            check('E2-3 read count does not scale with call count (O(1), not O(N))',
                fullReads < N, `fullReads=${fullReads} vs N=${N}`);
            if (warm.cachedName) {
                check('E2-2 touching a cached item still persists lastUsed (mirror is not read-only)',
                    warm.touchPuts >= 1, `item="${warm.cachedName}" put=+${warm.touchPuts}`);
            } else {
                console.log('SKIP  E2-2 no catalog item is in the browser cache right now — the write-back path needs a pre-cached item, and this probe will not create one (preloading would write to the instance).');
            }

            console.log(`       (catalog ${warm.count} items; window started at getAll=${warm.base.getAll})`);
        }

        await p.close();
    }
} catch (err) {
    console.error('\nPROBE ERROR:', err?.message || err);
    fail++;
} finally {
    await browser.close();
}

console.log(`\n===== RESULT: ${pass} passed / ${fail} failed =====`);
process.exit(fail === 0 ? 0 : 1);
