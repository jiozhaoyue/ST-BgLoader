// Phase H 验收探针：接管 ST 原生背景选择器（T2）的拦截矩阵、放行规则、叠层清理、
// D-1 锁定豁免、开关与降级。
//
// 判据设计：一切以**可观测后果**为准（扩展的 activeMediaId、宿主自己的 .selected-background
// 标记、#bg1 的内联样式），而不是读控制器内部状态——内部状态自证不了拦截真的生效。
//
// 纪律：不点删除/锁定/复制等会改数据的菜单按钮；点 .mobile-only-menu-toggle 代替
// （宿主的处理器只切一个无害的 class）。结束前逐项复原并把防抖写盘等过去。
// 只读为主；会在过程里切换背景，故末尾恢复为初始媒体。
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

try {
    const p = await browser.newPage();
    await p.setViewport({ width: 1500, height: 1000 });
    const warnLog = [];
    p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'warn') warnLog.push(m.text()); });
    p.on('pageerror', (e) => console.log('  [pageerror]', (e?.message || e).toString().slice(0, 200)));

    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1500);

    // 装好页面内助手，后面每段 evaluate 都能用
    await p.evaluate(() => {
        window.__h = {
            grid: () => document.querySelector('#bg_menu_content'),
            tiles: () => [...document.querySelectorAll('#bg_menu_content .bg_example')],
            tileFor: (name) => [...document.querySelectorAll('#bg_menu_content .bg_example')]
                .find(t => t.getAttribute('bgfile') === name) || null,
            names: () => [...document.querySelectorAll('#bg_menu_content .bg_example')]
                .map(t => t.getAttribute('bgfile')),
            marked: () => [...document.querySelectorAll('#bg_menu_content .st-bg-takeover-selected')]
                .map(t => t.getAttribute('bgfile')),
            hostSelected: () => [...document.querySelectorAll('#bg_menu_content .bg_example.selected-background')]
                .map(t => t.getAttribute('bgfile')),
            bg1: () => document.querySelector('#bg1')?.style.backgroundImage || '',
            active: () => window.STBgLoader.getSettings().activeMediaId,
            ctrl: () => window.STBgLoader.getNativeController(),
        };
    });

    // 打开原生面板（网格是打开时才填充的）
    await p.evaluate(() => document.querySelector('#backgrounds-drawer-toggle')?.click());
    await sleep(2500);

    const initial = await p.evaluate(() => ({
        level: window.STBgLoader.getSettings().nativeTakeover,
        activeMediaId: window.STBgLoader.getSettings().activeMediaId,
        bg1: window.__h.bg1(),
        tileCount: window.__h.names().length,
    }));
    console.log(`initial: level=${initial.level} active=${initial.activeMediaId} tiles=${initial.tileCount} bg1=${initial.bg1}`);

    // ══════════ A 安装与装饰 ══════════
    console.log('\n===== A: takeover installed and decorations applied =====');
    {
        const r = await p.evaluate(() => {
            const h = window.__h;
            const grid = h.grid();
            return {
                active: h.ctrl()?.isActive(),
                level: h.ctrl()?.getLevel(),
                tiles: h.tiles().length,
                augmented: grid.querySelectorAll('[data-st-bg-augmented]').length,
                marked: h.marked(),
                markers: grid.querySelectorAll('[data-st-bg-current]').length,
            };
        });
        check('A1 controller active at the default level', r.active === true && r.level === 'all', `active=${r.active} level=${r.level}`);
        check('A2 every grid tile is decorated', r.tiles > 0 && r.augmented === r.tiles, `augmented=${r.augmented}/${r.tiles}`);
        // The extension may legitimately start with nothing mounted; then there is nothing to
        // mark, and an empty marker set is the correct state (B4 proves the positive case).
        check('A3 no marker while no media is mounted', initial.activeMediaId ? r.marked.length === 1 : r.marked.length === 0,
            `active=${initial.activeMediaId} marked=${JSON.stringify(r.marked)} markers=${r.markers}`);

        // Badge logic + the no-glow visual rule, exercised on a synthetic non-image tile so the
        // test does not depend on this library happening to contain an SVG/video. Purely DOM-side:
        // the instance's media library is never touched.
        const badge = await p.evaluate(async () => {
            const h = window.__h;
            // Measure our currently-applied styles FIRST: the badge sub-test below renames
            // `tiles[0]`, which is often exactly the tile carrying the selection marker — doing
            // it the other way round would measure a state the test itself just destroyed.
            const markedTile = h.grid().querySelector('.st-bg-takeover-selected');
            const markerEl = h.grid().querySelector('[data-st-bg-current]');
            const baseline = {
                markerShadow: markerEl ? getComputedStyle(markerEl).boxShadow : 'none',
                selectedOutline: markedTile ? getComputedStyle(markedTile).outlineWidth : 'n/a',
            };

            const tile = h.tiles()[0];
            const original = tile.getAttribute('bgfile');
            tile.setAttribute('bgfile', 'probe-synthetic.svg');
            tile.removeAttribute('data-st-bg-augmented');
            tile.querySelectorAll('[data-st-bg-badge]').forEach(b => b.remove());
            // Touch the grid's childList so the observer runs decorateGrid again.
            const poke = document.createElement('i');
            h.grid().appendChild(poke);
            poke.remove();
            await new Promise(r => setTimeout(r, 500));
            const el = tile.querySelector('[data-st-bg-badge]');
            const cs = el ? getComputedStyle(el) : null;
            const out = {
                badgePresent: !!el,
                badgeText: el?.textContent || '',
                badgeClass: el?.className || '',
                badgeBg: cs?.backgroundColor || '',
                badgeShadow: cs?.boxShadow || 'none',
                ...baseline,
            };
            // restore
            tile.setAttribute('bgfile', original);
            tile.removeAttribute('data-st-bg-augmented');
            el?.remove();
            const poke2 = document.createElement('i');
            h.grid().appendChild(poke2);
            poke2.remove();
            await new Promise(r => setTimeout(r, 400));
            return out;
        });
        check('A4 a non-image tile gets a type badge', badge.badgePresent && badge.badgeText === 'SVG' && /st-bg-native-badge/.test(badge.badgeClass),
            `present=${badge.badgePresent} text="${badge.badgeText}" class="${badge.badgeClass}"`);
        // Only OUR additions are judged. The marked tile *is* a host `.bg_example`, and the host
        // gives those its own box-shadow (public/css/backgrounds.css) — reading it back would be
        // asserting the host's stylesheet. What we own is the badge, the marker dot, and the
        // outline; the "we add no box-shadow anywhere" rule is enforced at source level (H5).
        check('A5 our additions carry no glow (project rule: no box-shadow)',
            badge.badgeShadow === 'none' && badge.markerShadow === 'none'
            && badge.badgeBg !== 'rgba(0, 0, 0, 0)' && badge.selectedOutline === '2px',
            `badgeShadow=${badge.badgeShadow} markerShadow=${badge.markerShadow} selectedOutline=${badge.selectedOutline} badgeBg=${badge.badgeBg}`);
    }

    // ══════════ B 拦截（level=all，点图片缩略图） ══════════
    console.log('\n===== B: interception at level=all (image thumbnails) =====');
    let pickB = null;
    {
        const before = await p.evaluate(() => ({ active: window.__h.active(), hostSelected: window.__h.hostSelected(), bg1: window.__h.bg1() }));
        const target = await p.evaluate((cur) => {
            const h = window.__h;
            const curName = (cur || '').replace(/^native_/, '');
            const t = h.tiles().find(x => x.getAttribute('bgfile') !== curName) || null;
            if (!t) return null;
            const name = t.getAttribute('bgfile');
            t.click();
            return { name };
        }, before.active);
        pickB = target?.name || null;
        await sleep(1400);

        const after = await p.evaluate(() => ({ active: window.__h.active(), hostSelected: window.__h.hostSelected(), bg1: window.__h.bg1(), marked: window.__h.marked() }));

        check('B1 the click switched this extension\'s media',
            pickB && after.active === 'native_' + pickB, `clicked=${pickB} active=${after.active}`);
        check('B2 the host did NOT handle the click (its own selection mark is untouched)',
            JSON.stringify(after.hostSelected) === JSON.stringify(before.hostSelected),
            `before=${JSON.stringify(before.hostSelected)} after=${JSON.stringify(after.hostSelected)}`);
        check('B3 the host\'s background layer is cleared while we own it',
            after.bg1 === '', `bg1="${after.bg1}"`);
        check('B4 the selection marker followed to the new tile',
            after.marked.length === 1 && after.marked[0] === pickB, `marked=${JSON.stringify(after.marked)}`);
    }

    // B5 网格重渲染后装饰必须回来（宿主是 empty() 后整块重建，标记会被一起抹掉）
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const grid = h.grid();
            const tiles = [...grid.children];
            grid.replaceChildren();                       // 等价于宿主的 .empty()
            await new Promise(r => setTimeout(r, 400));
            const afterEmpty = {
                augmented: grid.querySelectorAll('[data-st-bg-augmented]').length,
                markers: grid.querySelectorAll('[data-st-bg-current]').length,
            };
            grid.replaceChildren(...tiles);               // 等价于宿主的整块 append
            await new Promise(r => setTimeout(r, 700));
            return {
                afterEmpty,
                augmented: grid.querySelectorAll('[data-st-bg-augmented]').length,
                total: tiles.length,
                markers: grid.querySelectorAll('[data-st-bg-current]').length,
                marked: h.marked(),
            };
        });
        check('B5-1 a host-style grid rebuild wipes our decorations (as expected)', r.afterEmpty.augmented === 0 && r.afterEmpty.markers === 0,
            `augmented=${r.afterEmpty.augmented} markers=${r.afterEmpty.markers}`);
        check('B5-2 the re-render is re-decorated automatically',
            r.augmented === r.total && r.markers === 1,
            `augmented=${r.augmented}/${r.total} markers=${r.markers}`);
        check('B5-3 the selection marker survived the re-render',
            r.marked.length === 1 && r.marked[0] === pickB, `marked=${JSON.stringify(r.marked)} (expected ${pickB})`);
    }

    // ══════════ C 层级 non-image：图片应放行给宿主 ══════════
    console.log('\n===== C: level=non-image passes images through to the host =====');
    {
        await p.evaluate(() => window.STBgLoader.getNativeController().setLevel('non-image'));
        await sleep(400);
        // Pick a tile that is neither our mounted media nor the host's current selection, so the
        // host's own mark is guaranteed to move — otherwise this test can pass/fail by accident.
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const extName = (h.active() || '').replace(/^native_/, '');
            const hostNames = h.hostSelected();
            const before = { active: h.active(), hostSelected: hostNames };
            const t = h.tiles().find(x => {
                const n = x.getAttribute('bgfile');
                return n !== extName && !hostNames.includes(n);
            });
            if (!t) return { error: 'no suitable tile (test instance too small)', before };
            const name = t.getAttribute('bgfile');
            const connected = t.isConnected;
            t.click();
            await new Promise(r => setTimeout(r, 1400));
            return {
                before, name, connected,
                after: { active: h.active(), hostSelected: h.hostSelected(), bg1: h.bg1() },
            };
        });
        if (r.error) {
            check('C-0 a tile outside both selections exists', false, r.error);
        } else {
            check('C1 the extension did NOT switch media (the host owns image clicks here)',
                r.after.active === r.before.active, `active=${r.after.active} (clicked ${r.name})`);
            check('C2 the HOST handled it (its selection mark moved to the clicked tile)',
                r.after.hostSelected.includes(r.name), `hostSelected=${JSON.stringify(r.after.hostSelected)} clicked=${r.name}`);
            check('C3 the host\'s background layer is left alone at this level',
                r.after.bg1 !== '', `bg1="${r.after.bg1}"`);
        }

        await p.evaluate(() => window.STBgLoader.getNativeController().setLevel('all'));
        await sleep(400);
    }

    // ══════════ D 放行规则 ══════════
    console.log('\n===== D: pass-through rules =====');

    // D1 多选分组模式
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const modeBtn = document.querySelector('#bg_selection_mode_button');
            if (!modeBtn) return { error: '#bg_selection_mode_button missing' };
            modeBtn.click();
            await new Promise(r => setTimeout(r, 600));
            const inMode = !!document.querySelector('#Backgrounds.bg-selection-mode');
            const before = h.active();
            const t = h.tiles()[0];
            const name = t?.getAttribute('bgfile');
            t?.click();
            await new Promise(r => setTimeout(r, 900));
            const groupSelected = !!h.tileFor(name)?.classList.contains('folder-group-selected');
            const after = h.active();
            // 退出多选模式
            modeBtn.click();
            await new Promise(r => setTimeout(r, 600));
            return { inMode, before, after, name, groupSelected, outOfMode: !document.querySelector('#Backgrounds.bg-selection-mode') };
        });
        if (r.error) check('D1-0 selection-mode button present', false, r.error);
        else {
            check('D1-1 group multi-select mode is left to the host (no background switch)',
                r.inMode && r.after === r.before && r.groupSelected,
                `inMode=${r.inMode} active ${r.before}→${r.after} groupSelected=${r.groupSelected}`);
            check('D1-2 selection mode toggled back off', r.outOfMode === true);
        }
    }

    // D2 聊天锁定背景（裁定 D-1）——用 getContext 打桩，不动任何真实 chat 元数据
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const realGet = window.SillyTavern.getContext;
            const extName = (h.active() || '').replace(/^native_/, '');
            // Re-query the tile before every click: a detached node would swallow the event and
            // make a pass-through assertion look like a success for the wrong reason.
            const pick = () => h.tiles().find(x => x.getAttribute('bgfile') !== extName) || null;

            const before = h.active();
            const tile1 = pick();
            const name = tile1?.getAttribute('bgfile');
            const connected = !!tile1?.isConnected;

            // 打桩：让控制器看到「当前聊天已锁定背景」
            window.SillyTavern.getContext = () => ({ ...realGet.call(window.SillyTavern), chatMetadata: { custom_background: 'backgrounds/locked.jpg' } });
            const stubbedReads = (() => { try { return !!window.SillyTavern.getContext().chatMetadata.custom_background; } catch { return false; } })();
            tile1?.click();
            await new Promise(r => setTimeout(r, 1000));
            const duringLock = { active: h.active(), bg1: h.bg1() };

            // 锁定期间宿主写 #bg1 应**不被**清（D-1 的第二个落点）
            document.querySelector('#bg1').style.backgroundImage = 'url("/backgrounds/locked.jpg")';
            await new Promise(r => setTimeout(r, 600));
            const afterHostWrite = h.bg1();

            window.SillyTavern.getContext = realGet;
            const restoredFn = window.SillyTavern.getContext === realGet;
            const realMeta = (() => { try { return window.SillyTavern.getContext().chatMetadata; } catch { return null; } })();
            const realLocked = !!(realMeta && realMeta.custom_background);

            // 解锁后同一个点击应恢复接管（重新取节点）
            const tile2 = pick();
            const secondConnected = !!tile2?.isConnected;
            tile2?.click();
            await new Promise(r => setTimeout(r, 1200));
            return {
                before, name, connected, stubbedReads, duringLock, afterHostWrite,
                restoredFn, realLocked, secondConnected,
                unlocked: { active: h.active() },
            };
        });

        console.log(`       diag: tileConnected=${r.connected}/${r.secondConnected} stubRead=${r.stubbedReads} stubRestored=${r.restoredFn} realLocked=${r.realLocked}`);
        check('D2-1 a chat-locked background keeps the click native (D-1)',
            r.connected && r.name && r.duringLock.active === r.before,
            `active ${r.before} → ${r.duringLock.active} (clicked ${r.name}, connected=${r.connected})`);
        check('D2-2 the host\'s #bg1 write is NOT cleared while the chat is locked (D-1 layer half)',
            r.afterHostWrite !== '', `bg1="${r.afterHostWrite}"`);
        check('D2-3 after unlocking, the same click is taken over again',
            r.restoredFn && !r.realLocked && r.unlocked.active === 'native_' + r.name,
            `active=${r.unlocked.active} expected=native_${r.name} stubRestored=${r.restoredFn} realLocked=${r.realLocked}`);
    }

    // D3 菜单控件（.mobile-only-menu-toggle）应放行
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const before = h.active();
            const t = h.tiles().find(x => x.querySelector('.mobile-only-menu-toggle'));
            if (!t) return { error: 'no tile with .mobile-only-menu-toggle' };
            const toggle = t.querySelector('.mobile-only-menu-toggle');
            toggle.click();
            await new Promise(r => setTimeout(r, 500));
            const opened = t.classList.contains('mobile-menu-open');
            const after = h.active();
            t.classList.remove('mobile-menu-open');   // 复原无害的 class
            return { before, after, opened };
        });
        if (r.error) check('D3-0 tile menu control present', false, r.error);
        else check('D3-1 tile menu controls are passed to the host (no background switch, host handler ran)',
            r.after === r.before && r.opened === true, `active ${r.before}→${r.after} hostOpenedMenu=${r.opened}`);
    }

    // D4 .jg-button 也应放行（只验证不抢：不发会改数据的动作）
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const before = h.active();
            const t = h.tiles().find(x => x.querySelector('.jg-button'));
            if (!t) return { error: 'no tile with .jg-button' };
            // 只派发事件、不点具体动作：jg-button 的处理器会自己 stopPropagation；
            // 我们只需证明控制器没有把它当成「选择背景」。
            const btn = t.querySelector('.jg-button');
            const ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            btn.dispatchEvent(ev);
            await new Promise(r => setTimeout(r, 700));
            return { before, after: h.active(), prevented: ev.defaultPrevented };
        });
        if (r.error) check('D4-0 tile jg-button present', false, r.error);
        else check('D4-1 .jg-button clicks are not treated as background selection',
            r.after === r.before && r.prevented === false,
            `active ${r.before}→${r.after} ourHandlerPrevented=${r.prevented}`);
    }

    // ══════════ E 叠层清理（正常路径） ══════════
    console.log('\n===== E: #bg1 suppression while we own the layer =====');
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            document.querySelector('#bg1').style.backgroundImage = 'url("/backgrounds/_black.jpg")';
            await new Promise(r => setTimeout(r, 700));
            return { bg1: h.bg1(), active: h.active() };
        });
        check('E1 a host write to #bg1 is cleared while the extension owns the layer',
            r.bg1 === '', `bg1="${r.bg1}" (active=${r.active})`);
    }

    // ══════════ F 开关 ══════════
    console.log('\n===== F: the takeover switch =====');
    let levelBeforeF = 'all';
    {
        const off = await p.evaluate(async () => {
            const h = window.__h;
            window.STBgLoader.getNativeController().setLevel('off');
            await new Promise(r => setTimeout(r, 600));
            return {
                active: h.ctrl().isActive(),
                level: h.ctrl().getLevel(),
                badged: h.grid().querySelectorAll('[data-st-bg-badge]').length,
                marked: h.marked().length,
                markers: h.grid().querySelectorAll('[data-st-bg-current]').length,
                augmented: h.grid().querySelectorAll('[data-st-bg-augmented]').length,
                bg1: h.bg1(),
            };
        });
        check('F1 switching off uninstalls the interception', off.active === false && off.level === 'off', `active=${off.active} level=${off.level}`);
        check('F2 switching off removes every decoration we added',
            off.badged === 0 && off.marked === 0 && off.markers === 0 && off.augmented === 0,
            `badges=${off.badged} marked=${off.marked} markers=${off.markers} augmented=${off.augmented}`);
        check('F3 the host\'s background layer is restored', off.bg1 !== '', `bg1="${off.bg1}"`);

        // 关闭后原生应能正常选背景
        const nativeWorks = await p.evaluate(async () => {
            const h = window.__h;
            const hostNames = h.hostSelected();
            const before = { hostSelected: hostNames, active: h.active() };
            // Must not click a tile the host already has selected: its mark would stay put and the
            // assertion below could not tell "host handled it" from "nothing happened".
            const t = h.tiles().find(x => !hostNames.includes(x.getAttribute('bgfile')));
            if (!t) return { error: 'no tile outside the host selection' };
            const name = t.getAttribute('bgfile');
            t.click();
            await new Promise(r => setTimeout(r, 1200));
            return { before, name, after: { hostSelected: h.hostSelected(), active: h.active() } };
        });
        if (nativeWorks.error) {
            check('F4-0 a tile outside the host selection exists', false, nativeWorks.error);
        } else {
            check('F4 with takeover off the host handles clicks again (native picker intact)',
                nativeWorks.after.hostSelected.includes(nativeWorks.name)
                && nativeWorks.after.active === nativeWorks.before.active,
                `hostSelected=${JSON.stringify(nativeWorks.after.hostSelected)} clicked=${nativeWorks.name}`);
        }

        // 再打开
        const on = await p.evaluate(async (lvl) => {
            const h = window.__h;
            window.STBgLoader.getNativeController().setLevel(lvl);
            await new Promise(r => setTimeout(r, 800));
            return { active: h.ctrl().isActive(), augmented: h.grid().querySelectorAll('[data-st-bg-augmented]').length };
        }, initial.level);
        check('F5 switching back on re-installs and re-decorates', on.active === true && on.augmented > 0,
            `active=${on.active} augmented=${on.augmented}`);
    }

    // ══════════ G 降级：接缝探测失败 ══════════
    console.log('\n===== G: probe failure degrades instead of breaking =====');
    {
        const r = await p.evaluate(async () => {
            const h = window.__h;
            const grid = h.grid();
            const parent = grid.parentNode;
            const next = grid.nextSibling;

            grid.remove();                                   // 模拟宿主改结构 / 元素消失
            const probedMissing = h.ctrl().probe();

            h.ctrl().stop();
            h.ctrl().start('all');
            await new Promise(r => setTimeout(r, 300));
            const afterStart = { active: h.ctrl().isActive() };

            parent.insertBefore(grid, next);                 // 复原宿主元素
            await new Promise(r => setTimeout(r, 300));
            const media = (await window.STBgLoader.getCacheManager().listMedia()).length;

            h.ctrl().start('all');
            await new Promise(r => setTimeout(r, 600));
            return { probedMissing, afterStart, media, restored: h.ctrl().isActive() };
        });
        check('G1 probe() reports "unsupported" when a seam is gone', r.probedMissing === null, `probe=${JSON.stringify(r.probedMissing)}`);
        check('G2 start() declines to install when the seam is missing', r.afterStart.active === false, `active=${r.afterStart.active}`);
        check('G3 the media library keeps working with no takeover', r.media > 0, `items=${r.media}`);
        check('G4 restoring the seam lets the takeover install again', r.restored === true, `active=${r.restored}`);
    }

    // ══════════ H 动图纳入管线（PRD R-6） ══════════
    console.log('\n===== H: animated images (gif/webp/apng) in the pipeline =====');
    {
        // The Dev library holds only png/jpg/ico, so an end-to-end animated check is not possible
        // here. What IS checkable deterministically: the type classification that decides which
        // renderer the takeover picks (a GIF must not be mistaken for a video), and the fact that
        // the mount is a plain <img> — i.e. the browser animates it exactly as it animates the
        // host's own CSS background-image. Uses a synthetic data URL: the instance library is
        // never written to.
        const r = await p.evaluate(async () => {
            const h = window.__h;
            // The bundle exports nothing, so the renderer choice is inferred from behaviour:
            // mount a synthetic GIF through the very path the takeover uses.
            const gifDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            const item = {
                id: 'probe_gif', name: 'probe_animated.gif', type: 'image', source: 'url',
                url: gifDataUrl, cacheKey: gifDataUrl, size: 0, mimeType: 'image/gif',
                addedTimestamp: Date.now(), lastUsedTimestamp: Date.now(),
            };
            await window.STBgLoader.applyMedia(item);
            await new Promise(r2 => setTimeout(r2, 1200));
            const host = window.STBgLoader.getMediaMount().getContainerElement();
            const imgs = [...(host?.querySelectorAll('img') || [])];
            const gifImg = imgs.find(i => (i.getAttribute('src') || '').startsWith('data:image/gif'));
            return {
                mountedAs: gifImg ? 'img' : (host?.querySelectorAll('video').length ? 'video' : 'none'),
                imgs: imgs.length,
                videos: host?.querySelectorAll('video').length || 0,
            };
        });
        check('H1 a .gif is mounted as a plain <img> (browser-native animation, same as the host\'s CSS background)',
            r.mountedAs === 'img', `mountedAs=${r.mountedAs} imgs=${r.imgs} videos=${r.videos}`);
        console.log('       note: the Dev library contains no animated file, so this checks the renderer choice, not an eye-visible animation.');
    }

    // ══════════ 复原 ══════════
    console.log('\n===== restore =====');
    {
        const r = await p.evaluate(async (init) => {
            const h = window.__h;
            window.STBgLoader.getNativeController().setLevel(init.level);
            await new Promise(r => setTimeout(r, 400));
            if (init.activeMediaId) {
                const item = await window.STBgLoader.getCacheManager().getMedia(init.activeMediaId);
                if (item) await window.STBgLoader.applyMedia(item);
            }
            await new Promise(r => setTimeout(r, 1800));
            return { active: h.active(), level: window.STBgLoader.getSettings().nativeTakeover, bg1: h.bg1() };
        }, initial);
        check('R-1 active media restored', r.active === initial.activeMediaId, `${r.active} (initial ${initial.activeMediaId})`);
        check('R-2 takeover level restored', r.level === initial.level, `${r.level}`);
    }

    const ours = warnLog.filter(t => /ST-BgLoader/i.test(t));
    console.log(`\n[console warnings from this extension: ${ours.length}]`);
    ours.slice(0, 3).forEach(w => console.log('  - ' + w.slice(0, 160)));

    await p.close();
} catch (err) {
    console.error('\nPROBE ERROR:', err?.message || err);
    fail++;
} finally {
    await browser.close();
}

console.log(`\n===== RESULT: ${pass} passed / ${fail} failed =====`);
process.exit(fail === 0 ? 0 : 1);
