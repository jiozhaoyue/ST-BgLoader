/**
 * 夜间批 UI 截图（阶段 4：截图驱动的 UI 优化）。
 * 用法：node tests/screenshot-night.mjs  （需 dev:ui 在 :5173）
 * 产物：tests/e2e-artifacts/ui-night-*.png
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'e2e-artifacts');
mkdirSync(outDir, { recursive: true });

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.HARNESS_URL || 'http://localhost:5173/';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const settle = (page, ms) => page.evaluate(t => new Promise(r => setTimeout(r, t)), ms);
const shot = async (page, name) => {
    await page.screenshot({ path: join(outDir, `ui-night-${name}.png`) });
    console.log(`📷 ui-night-${name}.png`);
};

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1360, height: 900 });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 30000 });
    await settle(page, 800);

    // 1. 主视图（聊天 + 抽屉按钮）
    await shot(page, '01-main-view');

    // 2. 媒体库标签（空库状态）
    await page.click('#backgrounds-drawer-toggle');
    await settle(page, 900);
    await shot(page, '02-library-empty');

    // 3. 设置标签全览
    await page.evaluate(() => {
        const btn = document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]');
        btn?.click();
    });
    await settle(page, 500);
    await shot(page, '03-settings-top');

    // 4. 设置标签滚动到音乐区（F1 自动轮播控件）
    await page.evaluate(() => {
        const el = document.querySelector('#st_bgm_auto_advance');
        el?.scrollIntoView({ block: 'center' });
    });
    await settle(page, 400);
    await shot(page, '04-settings-bgm-autoadvance');

    // 5. 开启自动轮播后的控件形态
    await page.evaluate(() => {
        const cb = document.querySelector('#st_bgm_auto_advance');
        if (cb && !cb.checked) cb.click();
    });
    await settle(page, 400);
    await shot(page, '05-settings-bgm-autoadvance-on');
    // 恢复关闭，避免污染后续截图与设置
    await page.evaluate(() => {
        const cb = document.querySelector('#st_bgm_auto_advance');
        if (cb && cb.checked) cb.click();
    });

    // 6. 场景区（F2 导出/导入按钮）
    await page.evaluate(() => {
        const el = document.querySelector('#st_scene_export_btn');
        el?.scrollIntoView({ block: 'center' });
    });
    await settle(page, 400);
    await shot(page, '06-scene-share-buttons');

    // 7. 存储区 + 云端区
    await page.evaluate(() => {
        const el = document.querySelector('#st_cache_used');
        el?.scrollIntoView({ block: 'center' });
    });
    await settle(page, 400);
    await shot(page, '07-storage-cloud');

    // 8. 库里传两张样张（1x1 PNG + 小 SVG）看网格卡片视觉
    await page.evaluate(async () => {
        const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], 'ui-night-sample.png', { type: 'image/png' });
        const api = window.STBgLoader.getAPI();
        await api.uploadMedia(file, { name: '夜间样张-蓝点' }).catch(() => null);
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#ff5577"/><circle cx="32" cy="32" r="14" fill="#fff"/></svg>';
        const svgFile = new File([svg], 'ui-night-sample.svg', { type: 'image/svg+xml' });
        await api.uploadMedia(svgFile, { name: '夜间样张-圆点' }).catch(() => null);
    });
    await page.evaluate(() => {
        const btn = document.querySelector('.st-bgloader-tab-btn[data-tab="library"]');
        btn?.click();
    });
    await settle(page, 800);
    await shot(page, '08-library-with-items');

    // 9. 悬浮胶囊（触发一次播放状态）
    await page.evaluate(() => {
        const api = window.STBgLoader.getAPI();
        api.setMasterEnabled(true);
    });
    await settle(page, 300);
    await shot(page, '09-final-state');

    console.log(`\n===== 截图完成 =====`);
} catch (err) {
    console.error('❌ 截图脚本失败:', err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
