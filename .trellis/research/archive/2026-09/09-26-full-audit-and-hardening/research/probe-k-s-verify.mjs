// 验收探针：K1–K8（移除 Alt 快捷键 + 补面板控件/API）+ S1（栅格刷新单调 token）+ S2（配额即时生效）
//
// 用后即删类别：留在任务 research/ 作为验收证据。**不创建任何服务端媒体**；只读媒体库，
// 用 applyMediaItem(item, false) 挂载（不写 activeMediaId），并在结束时把被探针改动的
// 设置项（配额 / 自动清理 / 静音 / 交互）恢复原值。
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../..');

// 真源文件解析（node 侧）：① 文档化契约方法集（wiki）② 源码声明的方法集（src）
const wikiText = readFileSync(resolve(REPO, 'wiki/Public-API-Reference.md'), 'utf8');
const documentedMethods = [...new Set([...wikiText.matchAll(/api\.([A-Za-z_]\w*)\s*\(/g)].map(m => m[1]))].sort();
const apiSource = readFileSync(resolve(REPO, 'src/api/PublicAPI.ts'), 'utf8');
const declaredMethods = [...new Set([...apiSource.matchAll(/^\s{4}public\s+(?:async\s+)?([A-Za-z_]\w*)\s*[<(]/gm)].map(m => m[1]))].sort();

let pass = 0, fail = 0, info = 0;
const check = (n, ok, d) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); ok ? pass++ : fail++; };
const note = (n, d) => { console.log(`INFO  ${n}${d ? ' — ' + d : ''}`); info++; };
const section = (t) => console.log(`\n══════════ ${t} ══════════`);

console.log(`documented API methods (wiki): ${documentedMethods.length}`);
console.log(`declared API methods (src)   : ${declaredMethods.length}`);

const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
        '--autoplay-policy=no-user-gesture-required'],
});

try {
    const p = await browser.newPage();
    await p.setViewport({ width: 1500, height: 1000 });
    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1200);

    // ══════════ K1–K5：快捷键已移除 ══════════
    section('K1–K5: the Alt shortcut family is gone');
    {
        const r = await p.evaluate(() => {
            const ext = window.STBgLoader;
            const before = {
                visible: ext.getMediaMount().isVisible(),
                playing: ext.getAudioEngine().isPlaying(),
                muted: ext.getAudioEngine().getMuffled(),
                weather: ext.getSettings().weather.type,
                frosted: ext.getSettings().frostedChat.enabled,
            };
            for (const key of ['b', 'p', 'm', 'w', 'f']) {
                window.dispatchEvent(new KeyboardEvent('keydown', { key, altKey: true, bubbles: true }));
            }
            return {
                before,
                getterGone: typeof ext.getShortcutManager === 'undefined',
                fieldGone: ext.getSettings().shortcutsEnabled === undefined,
                panelCbGone: !document.querySelector('#st_shortcuts_enabled'),
                after: {
                    visible: ext.getMediaMount().isVisible(),
                    playing: ext.getAudioEngine().isPlaying(),
                    muted: ext.getAudioEngine().getMuffled(),
                    weather: ext.getSettings().weather.type,
                    frosted: ext.getSettings().frostedChat.enabled,
                },
            };
        });
        console.log('  ', JSON.stringify(r));
        check('K1/K2 no getShortcutManager() on the extension any more', r.getterGone);
        check('K3 settings.shortcutsEnabled is gone', r.fieldGone);
        check('K4 the "Enable Alt Shortcuts" checkbox is gone from the panel', r.panelCbGone);
        check('K1–K5 no Alt+key changes any state any more',
            JSON.stringify(r.before) === JSON.stringify(r.after), JSON.stringify(r.after));
    }

    // ══════════ K6/K7：面板「显示背景」控件 ══════════
    section('K6/K7: the panel control that replaces Alt+B');
    {
        const r = await p.evaluate(async () => {
            const ext = window.STBgLoader;
            const cb = document.querySelector('#st_bg_visible');
            const cont = () => ext.getMediaMount().getContainerElement();
            const initial = cb ? cb.checked : null;
            if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); }
            await new Promise(r => setTimeout(r, 200));
            const hidden = { isVisible: ext.getMediaMount().isVisible(), display: cont() ? cont().style.display : null, checked: cb ? cb.checked : null };
            if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
            await new Promise(r => setTimeout(r, 200));
            const shown = { isVisible: ext.getMediaMount().isVisible(), display: cont() ? cont().style.display : null, checked: cb ? cb.checked : null };
            // 反向：API 改变可见性 → 面板勾选态必须跟上（syncBackgroundVisible）
            window.stBgLoader.setBackgroundVisible(false);
            await new Promise(r => setTimeout(r, 150));
            const apiHidden = { isVisible: ext.getMediaMount().isVisible(), checked: cb ? cb.checked : null };
            window.stBgLoader.setBackgroundVisible(true);
            await new Promise(r => setTimeout(r, 150));
            const apiShown = { isVisible: ext.getMediaMount().isVisible(), checked: cb ? cb.checked : null };
            return { exists: !!cb, initial, hidden, shown, apiHidden, apiShown };
        });
        console.log('  ', JSON.stringify(r));
        check('K6 #st_bg_visible exists and starts checked', r.exists && r.initial === true);
        check('K6 unchecking it hides the layer (MediaMount state + DOM agree)',
            r.hidden.isVisible === false && r.hidden.display === 'none', JSON.stringify(r.hidden));
        check('K6 re-checking it shows the layer again',
            r.shown.isVisible === true && r.shown.display === 'block', JSON.stringify(r.shown));
        check('K7 PublicAPI.setBackgroundVisible(false) hides the layer AND unchecks the panel box',
            r.apiHidden.isVisible === false && r.apiHidden.checked === false, JSON.stringify(r.apiHidden));
        check('K7 setBackgroundVisible(true) restores both',
            r.apiShown.isVisible === true && r.apiShown.checked === true, JSON.stringify(r.apiShown));
    }

    // ══════════ K6 收尾：新控件不破坏子任务 1 的宿主原生外观 ══════════
    section('K6 hygiene: host-native rules still hold in the panel');
    {
        const r = await p.evaluate(() => {
            const cb = document.querySelector('#st_bg_visible');
            const row = cb ? cb.closest('label') : null;
            const stack = cb ? cb.closest('.st-bgloader-check-stack') : null;
            const drawerContent = document.querySelector('#st_bgloader_settings .inline-drawer-content');
            return {
                rowClass: row ? row.className : null,
                stackClass: stack ? stack.className : null,
                rowInlineStyle: row ? (row.getAttribute('style') || '') : '(no row)',
                cbInlineStyle: cb ? (cb.getAttribute('style') || '') : '(no cb)',
                rowBoxShadow: row ? getComputedStyle(row).boxShadow : null,
                stackBoxShadow: stack ? getComputedStyle(stack).boxShadow : null,
                drawerContentInlineDisplay: drawerContent ? (drawerContent.style.display || '') : '(missing)',
                usesHostDrawer: !!document.querySelector('#st_bgloader_settings .inline-drawer > .inline-drawer-toggle.inline-drawer-header'),
            };
        });
        console.log('  ', JSON.stringify(r));
        check('K6 the new row reuses the existing check/stack classes (no new CSS)',
            r.rowClass === 'st-bgloader-check' && r.stackClass === 'st-bgloader-check-stack', `${r.rowClass} / ${r.stackClass}`);
        check('K6 no inline structural styles on the new row/checkbox',
            r.rowInlineStyle === '' && r.cbInlineStyle === '', `row="${r.rowInlineStyle}" cb="${r.cbInlineStyle}"`);
        check('K6 no box-shadow on the new row', r.rowBoxShadow === 'none' && r.stackBoxShadow === 'none',
            `${r.rowBoxShadow} / ${r.stackBoxShadow}`);
        check('subtask-1 outcome intact: host drawer markup used and no inline display on .inline-drawer-content',
            r.usesHostDrawer && r.drawerContentInlineDisplay === '', `display="${r.drawerContentInlineDisplay}"`);
    }

    // ══════════ K8：PublicAPI 新增两个方法 + 无文档化方法被删 ══════════
    section('K8: PublicAPI surface (2 additions, 0 removals)');
    {
        const r = await p.evaluate(async (documented, declared) => {
            const api = window.stBgLoader;
            const proto = Object.getPrototypeOf(api);
            const live = Object.getOwnPropertyNames(proto).filter(k => k !== 'constructor' && typeof api[k] === 'function').sort();
            const events = [];
            const off = api.on('background-visibility-change', (v) => events.push(v));
            api.setBackgroundVisible(false);
            api.setBackgroundVisible(true);
            off();
            return {
                hasSetter: typeof api.setBackgroundVisible === 'function',
                hasGetter: typeof api.isBackgroundVisible === 'function',
                isVisibleNow: api.isBackgroundVisible(),
                events,
                missingDocumented: documented.filter(m => !live.includes(m)),
                missingDeclared: declared.filter(m => !live.includes(m)),
                liveNotDeclared: live.filter(m => !declared.includes(m)),
                liveCount: live.length,
            };
        }, documentedMethods, declaredMethods);
        console.log('  ', JSON.stringify(r));
        check('K8 api.setBackgroundVisible exists', r.hasSetter);
        check('K8 api.isBackgroundVisible exists and reads MediaMount', r.hasGetter && r.isVisibleNow === true);
        check('K8 setBackgroundVisible emits background-visibility-change', JSON.stringify(r.events) === JSON.stringify([false, true]), JSON.stringify(r.events));
        check('K8 no method documented in wiki/Public-API-Reference.md disappeared',
            r.missingDocumented.length === 0, `missing=${JSON.stringify(r.missingDocumented)}`);
        check('K8 the live surface matches src/api/PublicAPI.ts exactly (nothing else added/removed)',
            r.missingDeclared.length === 0 && r.liveNotDeclared.length === 0,
            `missing=${JSON.stringify(r.missingDeclared)} extra=${JSON.stringify(r.liveNotDeclared)}`);
        note('K8 live method count', String(r.liveCount));
    }

    // ══════════ S1：栅格刷新单调 token（同栅格并发、旧快照后落地）══════════
    section('S1: grid refresh token (older snapshot must not overwrite a newer one)');
    {
        const r = await p.evaluate(async () => {
            const ext = window.STBgLoader;
            const cm = ext.getCacheManager();
            const items = await cm.listMedia();
            const a = items[0];
            const b = items[1] || items[0];
            const real = cm.listMedia.bind(cm);
            const MARK = 'S1-NEWEST-SNAPSHOT';
            let n = 0;
            cm.listMedia = async (...args) => {
                n += 1;
                const mine = n;
                const list = await real(...args);
                if (mine === 1) await new Promise(r => setTimeout(r, 700));  // 旧快照晚落地
                return mine === 2
                    ? [...list, {
                        id: 's1fake', name: MARK, type: 'image', source: 'server',
                        url: 'backgrounds/s1fake.png', cacheKey: 'backgrounds/s1fake.png',
                        size: 0, mimeType: 'image/png', addedTimestamp: 0, lastUsedTimestamp: 0,
                    }]
                    : list;
            };
            const grid = document.querySelector('#st_bgloader_grid');
            const p1 = ext.applyMediaItem(a, false);   // persist=false：不动 activeMediaId
            const p2 = ext.applyMediaItem(b, false);
            await Promise.allSettled([p1, p2]);
            await new Promise(r => setTimeout(r, 1500));  // 等旧快照也落地完
            cm.listMedia = real;
            const text = grid ? grid.textContent : '';
            return {
                listMediaCalls: n,
                showsNewest: text.includes(MARK),
                cardCount: grid ? grid.querySelectorAll('.st-bgloader-media-card').length : -1,
                seq: grid ? grid.dataset.refreshSeq : null,
            };
        });
        console.log('  ', JSON.stringify(r));
        check('S1 two concurrent refreshes really ran', r.listMediaCalls >= 2, `calls=${r.listMediaCalls}`);
        check('S1 the grid keeps the NEWEST snapshot (old one did not overwrite it)', r.showsNewest);
        check('S1 the grid is populated (A4 regression guard)', r.cardCount > 0, `cards=${r.cardCount}`);
    }

    // ══════════ S2：配额滑块即时生效（且只在变化时、且受 auto-clean 门控）══════════
    section('S2: quota slider takes effect immediately');
    {
        const r = await p.evaluate(async () => {
            const ext = window.STBgLoader;
            const cm = ext.getCacheManager();
            const before = {
                cacheQuotaMB: ext.getSettings().cacheQuotaMB,
                lruAutoClean: ext.getSettings().lruAutoClean,
                muted: ext.getSettings().muted,
                interactive: ext.getSettings().interactiveBackground,
            };
            const calls = [];
            const settingsSyncEvents = [];
            const remoteApplies = [];
            const offSync = window.stBgLoader.on('settings-sync', (s) => {
                settingsSyncEvents.push(Date.now());
                remoteApplies.push({ quota: s?.cacheQuotaMB, at: Date.now(), liveQuota: ext.getSettings().cacheQuotaMB });
            });
            const realClean = cm.cleanLRU.bind(cm);
            cm.cleanLRU = async (bytes) => { calls.push({ bytes, at: Date.now(), quota: ext.getSettings().cacheQuotaMB }); };   // 拦截，不真的清理

            const quota = document.querySelector('#st_cache_quota');
            const auto = document.querySelector('#st_cache_autoclean');
            const mute = document.querySelector('#st_audio_mute');
            const inter = document.querySelector('#st_bg_interactive');

            // ① 改配额（1024 → 128）→ 必须触发一次 cleanLRU(128MB)
            quota.value = '128';
            quota.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 1200));
            const afterQuota = calls.map(c => c.bytes);

            // ② 同配额下的其它设置变更 → 不得再触发
            mute.checked = !before.muted;
            mute.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 900));
            const afterOther = calls.map(c => c.bytes);

            // ③ 关掉 auto-clean 后再改配额 → 不得触发（配额只在 auto-clean 开时才有意义）
            auto.checked = false;
            auto.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 700));
            quota.value = '256';
            quota.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 1200));
            const afterGated = calls.map(c => c.bytes);
            const quotaAtGated = ext.getSettings().cacheQuotaMB;

            // ④ 先卸掉拦截，再恢复设置 —— 否则「恢复配额」本身会记进 calls，让证据含混
            cm.cleanLRU = realClean;
            const callsAfterGated = calls.map(c => c.bytes);

            // ⑤ 恢复：配额 / auto-clean / 静音 / 交互
            auto.checked = before.lruAutoClean;
            auto.dispatchEvent(new Event('change', { bubbles: true }));
            quota.value = String(before.cacheQuotaMB);
            quota.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 900));
            mute.checked = before.muted;
            mute.dispatchEvent(new Event('change', { bubbles: true }));
            inter.checked = before.interactive;
            inter.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 1200));

            offSync();
            const restored = {
                cacheQuotaMB: ext.getSettings().cacheQuotaMB,
                lruAutoClean: ext.getSettings().lruAutoClean,
                muted: ext.getSettings().muted,
                interactive: ext.getSettings().interactiveBackground,
            };
            return {
                before, afterQuota, afterOther, afterGated, quotaAtGated, callsAfterGated, calls,
                settingsSyncEvents: settingsSyncEvents.length, remoteApplies, restored,
                expected: 128 * 1024 * 1024,
            };
        });
        console.log('  ', JSON.stringify(r));
        check('S2 changing the quota fires cleanLRU exactly once, with the new budget',
            r.afterQuota.length === 1 && r.afterQuota[0] === r.expected, `calls=${JSON.stringify(r.afterQuota)}`);
        check('S2 a later unrelated settings change does NOT re-fire it',
            r.afterOther.length === r.afterQuota.length, `calls=${JSON.stringify(r.afterOther)}`);
        check('S2 with lruAutoClean off, changing the quota does NOT fire it (documented gating)',
            r.afterGated.length === r.afterOther.length,
            `calls=${JSON.stringify(r.afterGated)}, quotaAtGated=${r.quotaAtGated}`);
        check('S2 the whole S2 window produced exactly ONE cleanup call (no spurious sweeps)',
            r.callsAfterGated.length === 1, `timeline=${JSON.stringify(r.calls)}`);
        check('S2 no cloud settings payload was applied mid-probe (the measurement was not disturbed)',
            r.settingsSyncEvents === 0, `settings-sync events=${r.settingsSyncEvents}, ${JSON.stringify(r.remoteApplies)}`);
        check('S2 probe restored every settings field it touched',
            JSON.stringify(r.restored) === JSON.stringify(r.before), `${JSON.stringify(r.restored)} vs ${JSON.stringify(r.before)}`);
    }

    await p.close();
} catch (err) {
    console.error('PROBE ERROR:', err);
    fail++;
} finally {
    await browser.close();
}

console.log(`\n===== K1–K8 / S1 / S2 probe summary: ${pass} passed, ${fail} failed, ${info} info =====`);
process.exit(fail === 0 ? 0 : 1);
