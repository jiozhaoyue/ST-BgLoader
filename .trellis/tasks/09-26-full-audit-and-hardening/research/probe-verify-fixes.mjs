// 验收探针：逐条实测 Phase E 的五处修复（A1–A5）
// 用后即删类别：本文件留在任务 research/ 作为验收证据；其中 A3 会临时上传并删除一个测试 SVG
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

async function freshPage() {
    const p = await browser.newPage();
    await p.setViewport({ width: 1500, height: 1000 });
    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1200);
    return p;
}

try {
    // ══════════ A1：Alt+B 隐藏后切背景应恢复可见 ══════════
    console.log('\n===== A1: background visibility is a controlled, persisted state =====');
    {
        const p = await freshPage();
        const r = await p.evaluate(async () => {
            const ext = window.STBgLoader;
            const disp = () => ext.getMediaMount().getContainerElement()?.style.display || '(unset)';
            const vis = () => ext.getMediaMount().isVisible();
            const apiVis = () => window.stBgLoader.isBackgroundVisible();
            const setting = () => ext.getSettings().backgroundVisible;
            const cb = () => document.querySelector('#st_bg_visible')?.checked;

            const before = { disp: disp(), vis: vis(), apiVis: apiVis(), setting: setting() };
            // Alt+B is gone (removed 2026-09-26); visibility is now driven by the panel checkbox
            // and PublicAPI, both routing through one write path.
            window.stBgLoader.setBackgroundVisible(false);
            await new Promise(r => setTimeout(r, 250));
            const hidden = { disp: disp(), vis: vis(), apiVis: apiVis(), setting: setting(), cb: cb() };

            const items = await ext.getCacheManager().listMedia();
            const other = items.find(i => i.id !== ext.getSettings().activeMediaId) || items[0];
            await ext.applyMedia(other);
            await new Promise(r => setTimeout(r, 900));
            const afterSwitch = { disp: disp(), vis: vis(), otherName: other?.name };

            window.stBgLoader.setBackgroundVisible(true);
            await new Promise(r => setTimeout(r, 250));
            const restored = { disp: disp(), vis: vis(), apiVis: apiVis(), setting: setting(), cb: cb() };

            // Leave it hidden so the reload below can prove the setting persists.
            window.stBgLoader.setBackgroundVisible(false);
            await new Promise(r => setTimeout(r, 1400));   // let the debounced settings write land
            return { before, hidden, afterSwitch, restored };
        });
        console.log('  ', JSON.stringify(r));
        check('A1-1 setBackgroundVisible(false) hides container and records the setting',
            r.hidden.disp === 'none' && r.hidden.vis === false && r.hidden.setting === false,
            `display=${r.hidden.disp} setting=${r.hidden.setting}`);
        check('A1-2 panel checkbox reflects the state', r.hidden.cb === false, `checked=${r.hidden.cb}`);
        check('A1-3 PublicAPI reports the same state', r.hidden.apiVis === false);
        check('A1-4 switching background keeps it hidden (controlled state, not lost)',
            r.afterSwitch.disp === 'none' && r.afterSwitch.vis === false, `display=${r.afterSwitch.disp}`);
        check('A1-5 setBackgroundVisible(true) restores visibility',
            r.restored.disp === 'block' && r.restored.vis === true && r.restored.setting === true,
            `display=${r.restored.disp}`);

        // A1-6: persistence — the whole point of the 2026-09-26 follow-up.
        // Persistence is proved on a BRAND NEW page (empty localStorage, so the value can only
        // have come back through the server settings document). Navigating the same page is
        // avoided deliberately: SillyTavern registers a beforeunload handler and an in-place
        // navigation can hang behind it under automation.
        await sleep(1200);   // let the debounced settings write reach the server document
        const p2 = await freshPage();
        const after = await p2.evaluate(() => ({
            disp: window.STBgLoader.getMediaMount().getContainerElement()?.style.display || '(unset)',
            setting: window.STBgLoader.getSettings().backgroundVisible,
            cb: document.querySelector('#st_bg_visible')?.checked,
        }));
        console.log('   fresh page:', JSON.stringify(after));
        check('A1-6 hidden state survives a fresh page load (persisted via the settings document)',
            after.setting === false && after.disp === 'none',
            `setting=${after.setting} display=${after.disp}`);
        check('A1-7 checkbox reflects the persisted state after reload', after.cb === false, `checked=${after.cb}`);

        // Restore the default so the probe leaves no visible change behind.
        await p2.evaluate(() => window.stBgLoader.setBackgroundVisible(true));
        await sleep(1400);
        await p2.close();
        await p.close();
    }

    // ══════════ A2：瞬时背景不得写入 activeMediaId，且仍需可见 ══════════
    console.log('\n===== A2: transient background must not persist a virtual id =====');
    {
        const p = await freshPage();
        const r = await p.evaluate(async () => {
            const ext = window.STBgLoader;
            const before = ext.getSettings().activeMediaId;
            const url = 'https://example.invalid/a2-verify-transient.mp4';
            await window.stBgLoader.setBackground(url);
            await new Promise(r => setTimeout(r, 900));
            const after = ext.getSettings().activeMediaId;
            const ls = JSON.parse(localStorage.getItem('st_bgloader_settings') || '{}').activeMediaId ?? null;
            // 该瞬时项仍应被渲染
            const cont = ext.getMediaMount().getContainerElement();
            const layers = [...document.querySelectorAll('#bg1 .st-bg-layer')];
            return {
                before, after, ls,
                wroteVirtualId: typeof after === 'string' && after.startsWith('custom_'),
                stillMounted: !!cont,
                anyLayerVisible: layers.some(l => getComputedStyle(l).opacity === '1'),
            };
        });
        console.log('  ', JSON.stringify(r));
        check('A2-1 no virtual custom_* id written to activeMediaId', !r.wroteVirtualId, `activeMediaId=${r.after}`);
        check('A2-2 localStorage does not carry a virtual id', !(typeof r.ls === 'string' && r.ls.startsWith('custom_')), `ls=${r.ls}`);
        check('A2-3 media container still mounted', r.stillMounted);
        await p.close();
    }

    // ══════════ A3：原生 SVG 缩略图点击不得双写 ══════════
    console.log('\n===== A3: no double-write when clicking a native SVG thumbnail =====');
    {
        let p = await freshPage();
        // 临时上传一个 SVG，使其出现在原生网格中
        const uploaded = await p.evaluate(async () => {
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="68"><rect width="120" height="68" fill="#204060"/></svg>';
            const item = await window.STBgLoader.getCacheManager().saveMedia(svg, 'a3-verify-temp.svg', 'svg', 'server');
            return { id: item.id, name: item.name };
        });
        console.log('   临时上传:', JSON.stringify(uploaded));
        await sleep(1500);
        // Reopen on a FRESH page (an in-place navigation can hang behind SillyTavern's
        // beforeunload guard once the probe has mutated state) so the native grid is rebuilt
        // and now includes the new file.
        await p.close();
        p = await freshPage();
        await sleep(1500);
        await p.evaluate(() => {
            document.querySelectorAll('.closedDrawer').forEach(el => el.classList.replace('closedDrawer', 'openDrawer'));
            document.querySelectorAll('.drawer-content').forEach(el => el.style.removeProperty('display'));
        });
        await sleep(2000);

        const r = await p.evaluate(async (name) => {
            const anchor = [...document.querySelectorAll('#bg_menu_content .bg_example[bgfile]')]
                .find(a => (a.getAttribute('bgfile') || '') === name);
            if (!anchor) return { skipped: 'temp svg not in native grid' };
            const host = document.querySelector('#bg1');
            const before = host.style.backgroundImage || '(empty)';
            const activeBefore = window.STBgLoader.getSettings().activeMediaId;
            anchor.click();
            await new Promise(r => setTimeout(r, 1200));
            return {
                file: anchor.getAttribute('bgfile'),
                hostBgBefore: before,
                hostBgAfter: host.style.backgroundImage || '(empty)',
                hostRewritten: before !== (host.style.backgroundImage || '(empty)'),
                activeBefore, activeAfter: window.STBgLoader.getSettings().activeMediaId,
            };
        }, 'a3-verify-temp.svg');
        console.log('  ', JSON.stringify(r));
        if (r.skipped) {
            check('A3-1 temp SVG reachable in native grid', false, r.skipped);
        } else {
            check('A3-1 host does NOT rewrite #bg1 background-image (double-write eliminated)', !r.hostRewritten,
                `${r.hostBgBefore} -> ${r.hostBgAfter}`);
            check('A3-2 extension still switches its own background', r.activeBefore !== r.activeAfter,
                `${r.activeBefore} -> ${r.activeAfter}`);
        }
        // 清理临时文件
        const cleanup = await p.evaluate(async (id) => {
            try { await window.STBgLoader.getCacheManager().deleteMedia(id); return 'deleted'; }
            catch (e) { return 'error: ' + String(e); }
        }, uploaded.id);
        console.log('   临时文件清理:', cleanup);
        check('A3-3 temp SVG removed', cleanup === 'deleted');
        await p.close();
    }

    // ══════════ A4：媒体库栅格在全新加载后必须始终被填充 ══════════
    console.log('\n===== A4: media grid must never be left empty on load =====');
    {
        let empty = 0, total = 0;
        for (let i = 0; i < 10; i++) {
            const p = await freshPage();
            const r = await p.evaluate(() => {
                const g = document.querySelector('#st_bgloader_grid');
                return { children: g?.children.length ?? -1, html: (g?.innerHTML || '').slice(0, 60).replace(/\s+/g, ' ') };
            });
            total++;
            if (r.children === 0) empty++;
            if (i < 3 || r.children === 0) console.log(`   load#${i + 1}: children=${r.children} html="${r.html}"`);
            await p.close();
        }
        check(`A4-1 grid populated on every one of ${total} fresh loads`, empty === 0, `empty ${empty}/${total}`);
    }

    // A4 逆序加固：第一次 listMedia 快、第二次慢（制造原先触发空栅格的时序）
    {
        const p = await browser.newPage();
        await p.setViewport({ width: 1500, height: 1000 });
        await p.evaluateOnNewDocument(() => {
            window.__listMediaCalls = 0;
            const patch = () => {
                const ext = window.STBgLoader;
                if (!ext?.getCacheManager) return setTimeout(patch, 10);
                const cm = ext.getCacheManager();
                const orig = cm.listMedia.bind(cm);
                cm.listMedia = async function () {
                    window.__listMediaCalls++;
                    if (window.__listMediaCalls >= 2) await new Promise(r => setTimeout(r, 900));
                    return orig();
                };
            };
            patch();
        });
        await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
        await sleep(3500);
        const r = await p.evaluate(() => ({
            calls: window.__listMediaCalls,
            children: document.querySelector('#st_bgloader_grid')?.children.length ?? -1,
            html: (document.querySelector('#st_bgloader_grid')?.innerHTML || '').slice(0, 50).replace(/\s+/g, ' '),
        }));
        console.log('   reversed-order run:', JSON.stringify(r));
        check('A4-2 grid populated even when the 2nd listMedia is delayed', r.children > 0, `children=${r.children} calls=${r.calls}`);
        await p.close();
    }

    // ══════════ A5：陈旧 KV 镜像不得覆盖服务端文档 ══════════
    console.log('\n===== A5: stale KV mirror must not override the server document =====');
    {
        const p = await freshPage();
        const base = await p.evaluate(async () => {
            const client = window.STBgLoader.getAuthorityBridge().getClient();
            const doc = await (await fetch('backgrounds/st-bg-loader-settings.json?t=' + Date.now(), { cache: 'no-store' })).json();
            return {
                authority: !!client,
                serverVolume: doc.settings?.volume ?? null,
                serverRevision: doc.revision ?? null,
            };
        });
        console.log('   baseline:', JSON.stringify(base));
        if (!base.authority || base.serverVolume === null) {
            check('A5-x Authority + server doc available for the test', false, JSON.stringify(base));
        } else {
            const marker = base.serverVolume === 0.11 ? 0.22 : 0.11;
            const planted = await p.evaluate(async (v) => {
                const client = window.STBgLoader.getAuthorityBridge().getClient();
                const payload = await client.storage.kv.get('settings:data');
                const rev = await client.storage.kv.get('settings:rev');
                const next = { ...(payload || {}), revision: (typeof rev === 'number' ? rev : 0) + 5, settings: { ...(payload?.settings || {}), volume: v } };
                await client.storage.kv.set('settings:data', next);
                await client.storage.kv.set('settings:rev', next.revision);
                return { plantedVolume: v, kvRevision: next.revision };
            }, marker);
            console.log('   planted stale KV marker:', JSON.stringify(planted));

            const p2 = await freshPage();
            const after = await p2.evaluate(() => ({
                runtimeVolume: window.STBgLoader.getSettings().volume,
                kvVolume: null,
            }));
            console.log('   after fresh load:', JSON.stringify(after));
            check('A5-1 server document wins over the stale KV marker', after.runtimeVolume === base.serverVolume,
                `runtime=${after.runtimeVolume} serverDoc=${base.serverVolume} staleKvMarker=${marker}`);
            check('A5-2 stale KV value did NOT resurrect', after.runtimeVolume !== marker, `runtime=${after.runtimeVolume} marker=${marker}`);
            await p2.close();

            // 复原 KV 为服务端文档的当前值，避免给用户留下被篡改的镜像
            const restore = await p.evaluate(async (doc) => {
                const client = window.STBgLoader.getAuthorityBridge().getClient();
                const payload = await client.storage.kv.get('settings:data');
                const rev = await client.storage.kv.get('settings:rev');
                const next = { ...(payload || {}), revision: (typeof rev === 'number' ? rev : 0) + 1, settings: doc };
                await client.storage.kv.set('settings:data', next);
                await client.storage.kv.set('settings:rev', next.revision);
                return 'restored';
            }, (await p.evaluate(async () => (await (await fetch('backgrounds/st-bg-loader-settings.json?t=' + Date.now(), { cache: 'no-store' })).json()).settings)));
            console.log('   KV restore:', restore);
            check('A5-3 KV mirror restored to the server document content', restore === 'restored');
        }
        await p.close();
    }

    console.log(`\n===== RESULT: ${pass} passed / ${fail} failed =====`);
} catch (e) {
    console.error('probe error:', e);
    fail++;
} finally {
    await browser.close();
    process.exit(fail === 0 ? 0 : 1);
}
