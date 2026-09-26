// G6 Dev 冒烟：抽屉开合 / 切背景 / 背景可见性勾选框 / 迷你播放器 / pulse+视差同开。
//
// 目标不是穷举功能，而是**交互路径不崩**：每一步都真实点击 DOM（而非直接调 API），
// 因为子任务 1 定稿的折叠与控件接线只有走用户路径才会暴露问题。
//
// 纪律：全程不点删除按钮（有 confirm 弹窗）；切背景与视觉开关会改变运行态设置，
// 探针结束前**逐项复原**为该实例的初始值。用后即删类别：本文件留在任务 research/ 作为证据。
import puppeteer from 'puppeteer-core';

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (n, ok, d) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); ok ? pass++ : fail++; };

const consoleErrors = [];
const pageErrors = [];

const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
});

try {
    const p = await browser.newPage();
    await p.setViewport({ width: 1500, height: 1000 });
    p.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    p.on('pageerror', (err) => {
        // Keep the origin: the host page loads many third-party extensions, and a bare message
        // cannot tell ours apart from theirs.
        const stack = String(err?.stack || '');
        const where = (stack.match(/https?:\/\/[^\s)]+/g) || [])[0] || 'unknown';
        pageErrors.push(`${err?.message || err} :: ${where}`);
    });

    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1500);

    // ── 记录初始态，用于收尾复原 ──────────────────────────────────────────
    const initial = await p.evaluate(() => {
        const ext = window.STBgLoader;
        return {
            activeMediaId: ext.getSettings().activeMediaId,
            backgroundVisible: ext.getSettings().backgroundVisible,
            showMiniPlayer: ext.getSettings().showMiniPlayer,
            visualizer: { ...ext.getSettings().visualizer },
            parallax: { ...ext.getSettings().parallax },
        };
    });
    console.log(`initial state: activeMediaId=${initial.activeMediaId} visible=${initial.backgroundVisible} miniPlayer=${initial.showMiniPlayer}`);

    // ══════════ S1 抽屉开合（子任务 1 的修复面） ══════════
    console.log('\n===== S1: settings drawer collapse/expand =====');
    {
        const r = await p.evaluate(async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const toggle = document.querySelector('#st_bgloader_settings .inline-drawer-toggle');
            const content = document.querySelector('#st_bgloader_settings .inline-drawer-content');
            if (!toggle || !content) return { error: 'drawer/toggle not found' };
            // The host's slideToggle() writes an inline display, but the initial state is driven by
            // the host stylesheet — so read the computed value, not style.display.
            const disp = () => getComputedStyle(content).display;
            const initialDisp = disp();

            toggle.click(); await sleep(700);
            const afterFirst = disp();
            toggle.click(); await sleep(700);
            const afterSecond = disp();
            return { initialDisp, afterFirst, afterSecond };
        });
        if (r.error) {
            check('S1-0 drawer present', false, r.error);
        } else {
            check('S1-1 clicking the header toggles the drawer body',
                r.afterFirst !== r.initialDisp, `${r.initialDisp} → ${r.afterFirst}`);
            check('S1-2 a second click returns it to the initial state (re-collapsible, not stuck)',
                r.afterSecond === r.initialDisp, `${r.afterFirst} → ${r.afterSecond}`);
        }
    }

    // ══════════ S2 切背景（真实点击网格卡片） ══════════
    console.log('\n===== S2: switch background by clicking a grid card =====');
    {
        const r = await p.evaluate(async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const ext = window.STBgLoader;
            const cards = [...document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card')];
            // Make the layer visible first: the mount assertion below is only meaningful when the
            // layer is not hidden (the restore block at the end puts the initial value back).
            window.stBgLoader.setBackgroundVisible(true);
            await sleep(300);

            const activeId = ext.getSettings().activeMediaId;
            const card = cards.find(c => !c.classList.contains('active')) || cards[0];
            if (!card) return { error: `no media cards (grid has ${cards.length})` };

            const before = activeId;
            card.click();
            await sleep(1200);

            const container = ext.getMediaMount().getContainerElement();
            return {
                cards: cards.length,
                before,
                after: ext.getSettings().activeMediaId,
                mounted: container ? container.querySelectorAll('img, video, iframe').length : 0,
                display: container?.style.display || '(unset)',
            };
        });
        if (r.error) {
            check('S2-0 media grid populated', false, r.error);
        } else {
            check('S2-1 card click switches activeMediaId',
                r.after !== r.before, `${r.before} → ${r.after} (of ${r.cards} cards)`);
            check('S2-2 a media element is mounted in the background layer',
                r.mounted > 0, `elements=${r.mounted} display=${r.display}`);
        }
    }

    // ══════════ S3 背景可见性勾选框（K6-K8） ══════════
    console.log('\n===== S3: background visibility checkbox =====');
    {
        const r = await p.evaluate(async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const ext = window.STBgLoader;
            const cb = document.querySelector('#st_bg_visible');
            if (!cb) return { error: '#st_bg_visible not found' };
            const disp = () => ext.getMediaMount().getContainerElement()?.style.display || '(unset)';
            const api = () => window.stBgLoader.isBackgroundVisible();

            // Direction-relative, not absolute: the checkbox starts from whatever the persisted
            // setting is, and this probe must not assume it.
            const wasChecked = cb.checked;
            cb.click(); await sleep(400);
            const toggled = { checked: cb.checked, disp: disp(), api: api() };
            cb.click(); await sleep(400);
            const restored = { checked: cb.checked, disp: disp(), api: api() };
            return { wasChecked, toggled, restored };
        });
        if (r.error) {
            check('S3-0 visibility checkbox present', false, r.error);
        } else {
            check('S3-1 clicking the checkbox flips the layer (and PublicAPI agrees)',
                r.toggled.checked === !r.wasChecked
                && (r.toggled.disp === 'none') === !r.toggled.checked
                && r.toggled.api === r.toggled.checked,
                `checked ${r.wasChecked}→${r.toggled.checked} display=${r.toggled.disp} api=${r.toggled.api}`);
            check('S3-2 a second click returns it to the initial state',
                r.restored.checked === r.wasChecked && r.restored.api === r.wasChecked,
                `checked=${r.restored.checked} display=${r.restored.disp} api=${r.restored.api}`);
        }
    }

    // ══════════ S4 迷你播放器开关 ══════════
    console.log('\n===== S4: mini player toggle =====');
    {
        const r = await p.evaluate(async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const cb = document.querySelector('#st_mini_player_toggle');
            if (!cb) return { error: '#st_mini_player_toggle not found' };
            // hide() only swaps a class (the node stays in the DOM), so assert what the user sees.
            const visible = () => {
                const el = document.querySelector('#st_bg_mini_player');
                return !!el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
            };

            const wasChecked = cb.checked;
            if (wasChecked) { cb.click(); await sleep(500); }
            const off = visible();
            cb.click(); await sleep(600);
            const on = visible();
            // 复原为初始勾选态
            if (!wasChecked) { cb.click(); await sleep(500); }
            return { wasChecked, off, on };
        });
        if (r.error) {
            check('S4-0 mini player toggle present', false, r.error);
        } else {
            check('S4-1 unchecked → capsule absent', r.off === false, `present=${r.off}`);
            check('S4-2 checked → capsule present', r.on === true, `present=${r.on}`);
        }
    }

    // ══════════ S5 pulse 视觉化 + 视差同开 ══════════
    console.log('\n===== S5: pulse visualizer + parallax together =====');
    {
        const r = await p.evaluate(async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            window.stBgLoader.setVisualizer('pulse');
            window.stBgLoader.setParallax(true, 6);
            await sleep(900);
            const s = window.STBgLoader.getSettings();
            const container = window.STBgLoader.getMediaMount().getContainerElement();
            return {
                visualizerMode: s.visualizer.mode,
                visualizerEnabled: s.visualizer.enabled,
                parallaxEnabled: s.parallax.enabled,
                mounted: container ? container.querySelectorAll('img, video, iframe').length : 0,
                canvas: container ? container.querySelectorAll('canvas').length : 0,
            };
        });
        check('S5-1 visualizer set to pulse', r.visualizerMode === 'pulse',
            `mode=${r.visualizerMode}`);
        check('S5-2 parallax enabled alongside it', r.parallaxEnabled === true, `enabled=${r.parallaxEnabled}`);
        check('S5-3 background still mounted with both FX on', r.mounted > 0,
            `elements=${r.mounted} canvas=${r.canvas}`);
    }

    // ── 收尾复原 ──────────────────────────────────────────────────────────
    console.log('\n===== restore initial state =====');
    {
        const r = await p.evaluate(async (init) => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const ext = window.STBgLoader;
            window.stBgLoader.setVisualizer(init.visualizer);
            window.stBgLoader.setParallax(init.parallax.enabled, init.parallax.intensity);
            window.stBgLoader.setBackgroundVisible(init.backgroundVisible);
            await sleep(300);
            if (init.activeMediaId) {
                const item = await ext.getCacheManager().getMedia(init.activeMediaId);
                if (item) await ext.applyMedia(item);
            } else {
                // S2 deliberately mounts a background to exercise the click path, so with an
                // initially empty state there is something to undo. (Without this the probe
                // leaves the instance changed — the residue class flagged in the audit.)
                window.stBgLoader.clearBackground();
            }
            // saveSettings() is debounced — give the write time to land before the page closes,
            // otherwise the next run starts from this run's state (observed once).
            await sleep(1800);
            const s = ext.getSettings();
            return {
                activeMediaId: s.activeMediaId,
                backgroundVisible: s.backgroundVisible,
                visualizerMode: s.visualizer.mode,
                parallaxEnabled: s.parallax.enabled,
            };
        }, initial);
        check('R-1 activeMediaId restored', r.activeMediaId === initial.activeMediaId,
            `${r.activeMediaId} (initial ${initial.activeMediaId})`);
        check('R-2 visibility restored', r.backgroundVisible === initial.backgroundVisible,
            `${r.backgroundVisible}`);
        check('R-3 visualizer + parallax restored',
            r.visualizerMode === initial.visualizer.mode && r.parallaxEnabled === initial.parallax.enabled,
            `mode=${r.visualizerMode} parallax=${r.parallaxEnabled}`);
    }

    // ══════════ S6 全程无异常 ══════════
    console.log('\n===== S6: no runtime errors during the smoke run =====');
    {
        const own = consoleErrors.filter(t => /ST-BgLoader|bgloader/i.test(t));
        // The host page loads other third-party extensions; only errors originating from our own
        // bundle are a failure here, and the rest are reported for context.
        const ownPageErrors = pageErrors.filter(e => /ST-BgLoader|dist\/index\.js/i.test(e));
        const foreign = pageErrors.filter(e => !ownPageErrors.includes(e));

        check('S6-1 no uncaught page error from this extension', ownPageErrors.length === 0,
            ownPageErrors.length ? ownPageErrors.slice(0, 3).join(' | ') : `0 (page-wide: ${pageErrors.length})`);
        check('S6-2 no ST-BgLoader console errors', own.length === 0,
            own.length ? own.slice(0, 3).join(' | ') : `0 (page-wide console errors: ${consoleErrors.length})`);
        if (foreign.length) {
            console.log(`       note: ${foreign.length} page-wide error(s) not from this extension:`);
            foreign.slice(0, 4).forEach(e => console.log(`         - ${e.slice(0, 160)}`));
        }
        if (consoleErrors.length && own.length === 0) {
            console.log(`       note: ${consoleErrors.length} page-wide console error(s) not from this extension, e.g. ${consoleErrors[0].slice(0, 120)}`);
        }
    }

    await p.close();
} catch (err) {
    console.error('\nPROBE ERROR:', err?.message || err);
    fail++;
} finally {
    await browser.close();
}

console.log(`\n===== RESULT: ${pass} passed / ${fail} failed =====`);
process.exit(fail === 0 ? 0 : 1);
