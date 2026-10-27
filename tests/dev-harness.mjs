/**
 * Dev harness suite — verifies the standalone preview (npm run dev:ui) without any
 * SillyTavern instance. Covers PRD AC1–AC4 of the dev-ui-harness task.
 *
 * Usage: node tests/dev-harness.mjs   (expects the harness already running on :5173)
 * Artifacts: tests/e2e-artifacts/dev-harness-*.png
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'e2e-artifacts');
mkdirSync(outDir, { recursive: true });

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.HARNESS_URL || 'http://localhost:5173/';

// 1x1 opaque PNG — upload probe only, never leaves e2e-artifacts/ on the client side.
const PROBE_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
);
const probePath = join(outDir, 'harness-probe.png');
writeFileSync(probePath, PROBE_PNG);

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

let passed = 0;
let failed = 0;
const step = (name, ok, note = '') => {
    if (ok) { passed++; console.log(`✅ ${name}${note ? ' — ' + note : ''}`); }
    else { failed++; console.log(`❌ ${name}${note ? ' — ' + note : ''}`); }
};

const settle = (page, ms) => page.evaluate(t => new Promise(r => setTimeout(r, t)), ms);

async function boot(page) {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 30000 });
}

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1360, height: 900 });
    const pageErrors = [];
    const failedResponses = [];
    // First-run absence of the two state documents is documented behaviour (readServerJson
    // returns null and the extension seeds defaults), so their 404s are not failures.
    const EXPECTED_404 = /st-bg-loader-(settings|manifest)\.json|favicon\.ico/;
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('console', m => {
        // Resource-level failures are asserted through responses below (the message text
        // carries no URL); only real script errors belong here.
        if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) pageErrors.push(m.text());
    });
    page.on('response', r => {
        if (r.status() >= 400 && !EXPECTED_404.test(r.url())) failedResponses.push(`${r.status()} ${r.url()}`);
    });

    // ---- AC1: boots with no host, no uncaught errors, settings panel renders ----
    await boot(page);
    await settle(page, 600);
    const panelOk = await page.evaluate(() =>
        !!document.querySelector('#extensions_settings #st_bgloader_container #st_bgloader_master_enable'));
    step('AC1 扩展在宿主桩下启动', true);
    step('AC1 设置面板渲染于 #extensions_settings', panelOk);
    step('AC1 无未捕获异常', pageErrors.length === 0 && failedResponses.length === 0,
        [...pageErrors, ...failedResponses].slice(0, 3).join(' | '));
    await page.screenshot({ path: join(outDir, 'dev-harness-01-settings.png') });

    // ---- AC2: drawer opens, media library comes from mock ----
    await page.click('#backgrounds-drawer-toggle');
    await settle(page, 400);
    const panelMounted = await page.waitForFunction(
        () => !!document.querySelector('#Backgrounds #st_bgloader_topbar_panel'),
        { timeout: 15000 }
    ).then(() => true).catch(() => false);
    step('AC2 顶栏抽屉面板挂载', panelMounted);

    const baseline = await page.evaluate(() =>
        document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card').length);
    step('AC2 媒体库列表来自 mock 端点', baseline > 0, `卡片=${baseline}`);
    await page.screenshot({ path: join(outDir, 'dev-harness-02-drawer.png') });

    // upload round-trip through the real file input
    const listFiles = () => page.evaluate(async () => {
        const res = await fetch('/api/backgrounds/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        });
        const data = await res.json();
        return (data.images ?? []).map(i => i.filename);
    });
    const beforeFiles = await listFiles();

    const input = await page.$('#st_bgloader_file_input');
    let uploadedName = '';
    if (input) {
        await input.uploadFile(probePath);
        await settle(page, 1800);
        const afterFiles = await listFiles();
        uploadedName = afterFiles.find(f => !beforeFiles.includes(f)) || '';
    }
    step('AC2 上传后出现在网格', !!uploadedName, uploadedName || 'file input 未找到或未落盘');

    // survives a reload (i.e. it really hit the mock server, not just DOM)
    await boot(page);
    await settle(page, 600);
    await page.click('#backgrounds-drawer-toggle');
    await settle(page, 600);
    const afterReload = await page.evaluate(() =>
        document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card').length);
    step('AC2 上传结果刷新后仍在', afterReload > baseline, `刷新后=${afterReload} 基线=${baseline}`);

    // delete it again so the harness data stays clean.
    // Must go through the extension's deleteMedia (catalog + file together): the bare
    // mock endpoint only removes the file, leaving a catalog entry + activeMediaId that
    // the NEXT boot would try to restore as a 404 background (observed twice).
    const deleted = await page.evaluate(async (name) => {
        if (!name) return false;
        const api = window.STBgLoader.getAPI();
        const items = await api.getMediaList();
        const item = items.find(i => i.name === name);
        if (!item) return false;
        return api.deleteMedia(item.id);
    }, uploadedName);
    step('AC2 删除回到基线（走扩展 deleteMedia）', deleted);

    // ---- AC3: master toggle persists to the mock server document ----
    await page.evaluate(() => {
        const cb = document.querySelector('#st_bgloader_master_enable');
        cb.checked = false;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(page, 1400);
    const persistedOff = await page.evaluate(async () => {
        const res = await fetch(`/backgrounds/st-bg-loader-settings.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const doc = await res.json();
        return doc?.settings?.enabled;
    });
    step('AC3 主开关关闭写入服务端文档', persistedOff === false, `enabled=${persistedOff}`);

    // ---- AC4: audio stops with the master switch ----
    await page.evaluate(() => {
        const cb = document.querySelector('#st_bgloader_master_enable');
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(page, 1200);

    const audioStarted = await page.evaluate(async () => {
        const api = window.STBgLoader.getAPI();
        api.togglePlay();
        await new Promise(r => setTimeout(r, 1200));
        return api.getPlaybackState().isPlaying;
    });
    step('AC4 开启主开关后可播放 BGM', audioStarted === true);

    await page.evaluate(() => {
        const cb = document.querySelector('#st_bgloader_master_enable');
        cb.checked = false;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(page, 1200);
    const afterOff = await page.evaluate(() => {
        const api = window.STBgLoader.getAPI();
        const el = document.querySelector('audio');
        return {
            isPlaying: api.getPlaybackState().isPlaying,
            paused: el ? el.paused : null,
            ambient: api.getAmbientSound(),
        };
    });
    step('AC4 关闭主开关后 BGM 停止', afterOff.isPlaying === false, `paused=${afterOff.paused}`);
    step('AC4 关闭主开关后环境音为 off', afterOff.ambient?.type === 'off', `type=${afterOff.ambient?.type}`);

    // re-enabling must NOT resume audio on its own
    await page.evaluate(() => {
        const cb = document.querySelector('#st_bgloader_master_enable');
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle(page, 1000);
    const afterOn = await page.evaluate(() => window.STBgLoader.getAPI().getPlaybackState().isPlaying);
    step('AC4 重新开启不自动续播', afterOn === false);

    await page.screenshot({ path: join(outDir, 'dev-harness-03-final.png') });

    step('全程无未捕获异常', pageErrors.length === 0 && failedResponses.length === 0,
        [...pageErrors, ...failedResponses].slice(0, 3).join(' | '));
} catch (err) {
    failed++;
    console.error('❌ 套件异常：', err?.message || err);
} finally {
    await browser.close();
}

console.log(`\n===== Dev Harness：${passed} 通过 / ${failed} 失败 =====`);
process.exit(failed > 0 ? 1 : 0);
