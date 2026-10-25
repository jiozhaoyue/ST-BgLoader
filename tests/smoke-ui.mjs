/**
 * 真实 UI 冒烟套件（夜间批沉淀）：浏览器里逐项真实点击/切换顶栏抽屉交互，
 * 每步断言 + 截图，末尾全量复原（探针零残留）。
 *
 * 与 e2e.mjs（API 级）互补：这里走的是用户真实路径（搜索/过滤/点击卡片/开关/场景）。
 * 用法：node tests/smoke-ui.mjs   （TEST_TARGET_URL 缺省 https://localhost:8003）
 * 产物：tests/e2e-artifacts/smoke-*.png
 */
import puppeteer from 'puppeteer-core';
import { ensureExtensionLoaded } from './lib/ensure-extension.mjs';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'e2e-artifacts');
mkdirSync(outDir, { recursive: true });

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.argv[2] || process.env.TEST_TARGET_URL || 'https://localhost:8003';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

let passed = 0, failed = 0;
const step = (name, ok, note = '') => {
    if (ok) { passed++; console.log(`✅ ${name}${note ? ' — ' + note : ''}`); }
    else { failed++; console.log(`❌ ${name}${note ? ' — ' + note : ''}`); }
};

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push(e.message));
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await ensureExtensionLoaded(page);
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 35000 });
    await page.waitForFunction(() => {
        const loader = document.querySelector('#loader, #loading');
        return !loader || loader.style.display === 'none' || getComputedStyle(loader).display === 'none';
    }, { timeout: 40000 });
    console.log('扩展装载完成，开始 UI 冒烟。');

    const shot = (n) => page.screenshot({ path: join(outDir, `smoke-${n}.png`) });
    const settle = (ms) => page.evaluate((t) => new Promise(r => setTimeout(r, t)), ms);

    // 记录初始状态（末尾复原用）
    const initial = await page.evaluate(() => {
        const s = window.STBgLoader.getSettings();
        return {
            activeMediaId: s.activeMediaId,
            backgroundVisible: s.backgroundVisible,
            weather: { ...s.weather },
            visualizer: { ...s.visualizer },
            activeSceneId: s.activeSceneId,
            libraryView: { ...(s.libraryView || {}) },
        };
    });

    // S1 开抽屉 + 接管面板
    await page.evaluate(() => {
        window.STBgLoader.getTopbarDrawer()?.mount();
        const drawer = document.querySelector('#Backgrounds');
        const toggle = document.querySelector('#backgrounds-drawer-toggle');
        if (drawer && !drawer.classList.contains('openDrawer') && toggle) toggle.click();
    });
    await settle(2000);
    step('S1 抽屉打开且接管面板挂载', await page.evaluate(() =>
        !!document.querySelector('#st_bgloader_topbar_panel') &&
        document.querySelector('#Backgrounds').classList.contains('openDrawer')));
    await shot('01-drawer-open');

    // 网格就绪等待（有界）：首次目录请求可能撞上实例瞬时抖动；若库真的为空则后续用例 SKIP
    let libraryEmpty = false;
    {
        let cards = 0;
        for (let i = 0; i < 20; i++) {
            cards = await page.evaluate(() =>
                document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card').length);
            if (cards > 0) break;
            const listed = await page.evaluate(async () =>
                (await window.STBgLoader.getAPI().getMediaList()).length);
            if (listed === 0) { libraryEmpty = true; break; }
            await settle(1000);
        }
        step('S1b 媒体网格就绪', libraryEmpty || cards > 0, libraryEmpty ? '实例媒体库为空（SKIP S2/S4）' : `${cards} 卡片`);
    }

    // S2 搜索过滤（用首卡名称前缀作搜索词，不依赖特定文件名）
    if (!libraryEmpty) {
        const needle = await page.evaluate(() => {
            const name = document.querySelector('#st_bgloader_grid .st-bgloader-media-card .st-bgloader-card-name')?.textContent || '';
            return name.slice(0, 4).toLowerCase();
        });
        await page.type('#st_topbar_search', needle, { delay: 40 });
        await settle(900);
        const searchCount = await page.evaluate(() =>
            document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card').length);
        const totalCount = await page.evaluate(async () => (await window.STBgLoader.getAPI().getMediaList()).length);
        step('S2 搜索过滤生效', searchCount > 0 && searchCount <= totalCount, `"${needle}" → ${searchCount}/${totalCount}`);
        await shot('02-search');
        await page.evaluate(() => { const i = document.querySelector('#st_topbar_search'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
        await settle(600);
    } else {
        step('S2 搜索过滤生效', true, 'SKIP（空库）');
    }

    // S3 类型过滤 + 复原
    await page.evaluate(() => {
        const t = document.querySelector('#st_topbar_type_filter');
        t.value = 'video';
        t.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(900);
    const allVideo = await page.evaluate(() =>
        [...document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card')].every(c =>
            c.querySelector('.st-bg-native-badge.video, .st-bgloader-media-badge.video')));
    step('S3 类型过滤（video）生效', allVideo);
    await shot('03-type-filter');
    await page.evaluate((tf) => {
        const t = document.querySelector('#st_topbar_type_filter');
        t.value = tf || 'all';
        t.dispatchEvent(new Event('change', { bubbles: true }));
    }, initial.libraryView?.typeFilter || 'all');
    await settle(600);

    // S4 点击卡片应用（真实点击）
    if (!libraryEmpty) {
        const before = await page.evaluate(() => window.STBgLoader.getSettings().activeMediaId);
        await page.evaluate(() => {
            // 分级探针：记录失败发生在挂载管线的哪一段（间歇性问题定位用）
            window.__s4 = { stage: null, err: null };
            const cm = window.STBgLoader.getCacheManager();
            const mm = window.STBgLoader.getMediaMount();
            const origUrl = cm.getMediaBlobUrl.bind(cm);
            cm.getMediaBlobUrl = async (item) => {
                try { const u = await origUrl(item); window.__s4.stage = 'url-ok'; return u; }
                catch (e) { window.__s4 = { stage: 'blobUrl', err: String(e?.message || e) }; throw e; }
            };
            const origMount = mm.mountMedia.bind(mm);
            mm.mountMedia = (item, url) => {
                const p = origMount(item, url);
                return p.then(() => { window.__s4.stage = 'mount-ok'; }, (e) => {
                    window.__s4 = { stage: 'mount', err: String(e?.message || e) };
                    throw e;
                });
            };
            const card = document.querySelector('#st_bgloader_grid .st-bgloader-media-card');
            card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        await settle(3500);
        const s4 = await page.evaluate(() => ({ after: window.STBgLoader.getSettings().activeMediaId, probe: window.__s4 }));
        const after = s4.after;
        const mounted = await page.evaluate(() => {
            const c = document.querySelector('#bg1 .st-bg-media-container');
            return !!c && getComputedStyle(c).display !== 'none';
        });
        const note = `${before} → ${after} 探针=${JSON.stringify(s4.probe)}`;
        step('S4 点击卡片应用媒体', !!after && after !== before && mounted, note);
        await shot('04-applied');
    } else {
        step('S4 点击卡片应用媒体', true, 'SKIP（空库）');
    }

    // S5 显示/隐藏切换 + 复原
    await page.click('#st_topbar_bg_vis_btn');
    await settle(500);
    const hidden = await page.evaluate(() =>
        getComputedStyle(document.querySelector('#bg1 .st-bg-media-container')).display === 'none');
    await page.click('#st_topbar_bg_vis_btn');
    await settle(500);
    const shown = await page.evaluate(() =>
        getComputedStyle(document.querySelector('#bg1 .st-bg-media-container')).display !== 'none');
    step('S5 显示/隐藏切换往返', hidden && shown);
    await shot('05-visibility');

    // S6 设置标签：切天气 + 复原
    await page.evaluate(() => document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]')?.click());
    await settle(400);
    await page.evaluate(() => {
        const w = document.querySelector('#st_weather_type');
        w.value = 'rain';
        w.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(1200);
    const weatherOn = await page.evaluate(() => {
        const canvas = document.querySelector('.st-bg-atmosphere-canvas');
        return window.STBgLoader.getSettings().weather.type === 'rain' && canvas && getComputedStyle(canvas).display === 'block';
    });
    step('S6 天气切换（rain）生效', weatherOn);
    await shot('06-weather');
    await page.evaluate((w) => window.STBgLoader.getAPI().setWeather(w), initial.weather);
    await settle(400);

    // S7 视觉器 spectrum + 复原
    await page.evaluate(() => {
        const v = document.querySelector('#st_visualizer_mode');
        v.value = 'spectrum';
        v.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(800);
    const spectrumOn = await page.evaluate(() =>
        getComputedStyle(document.querySelector('.st-bg-visualizer-canvas')).display === 'block');
    step('S7 视觉器 spectrum 画布显示', spectrumOn);
    await shot('07-visualizer');
    await page.evaluate((v) => window.STBgLoader.getAPI().setVisualizer(v), initial.visualizer);
    await settle(400);

    // S8 场景应用 + 复原
    await page.evaluate(() => {
        const sel = document.querySelector('#st_scene_select');
        sel.value = 'cyber_rain';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('#st_scene_apply_btn')?.click();
    });
    await settle(2500);
    const sceneApplied = await page.evaluate(() => window.STBgLoader.getSettings().weather.type === 'rain');
    step('S8 场景应用（cyber_rain → rain）', sceneApplied);
    await shot('08-scene');

    // S9 关抽屉 → 原生内容恢复可见
    await page.evaluate(() => document.querySelector('#st_topbar_drawer_close')?.click());
    await settle(800);
    const drawerClosed = await page.evaluate(() => {
        const drawer = document.querySelector('#Backgrounds');
        return drawer && !drawer.classList.contains('openDrawer');
    });
    step('S9 抽屉收起', drawerClosed);
    await shot('09-drawer-closed');

    // 复原（探针零残留）
    await page.evaluate(async (init) => {
        const api = window.STBgLoader.getAPI();
        api.setWeather(init.weather);
        api.setVisualizer(init.visualizer);
        if (init.activeMediaId) {
            const item = await window.STBgLoader.getCacheManager().getMedia(init.activeMediaId);
            if (item) await api.setBackground(init.activeMediaId);
        } else {
            api.clearBackground();
        }
        window.STBgLoader.setBackgroundVisible(init.backgroundVisible);
    }, initial);
    await settle(2500);
    const restored = await page.evaluate((init) => {
        const s = window.STBgLoader.getSettings();
        return s.weather.type === init.weather.type
            && s.visualizer.mode === init.visualizer.mode
            && s.activeMediaId === init.activeMediaId
            && s.backgroundVisible === init.backgroundVisible;
    }, initial);
    step('S10 状态全量复原', restored);
    await shot('10-restored');

    console.log(`\n===== UI 冒烟：${passed} 通过 / ${failed} 失败 =====`);
    if (failed > 0) process.exit(1);
} finally {
    await browser.close();
}
