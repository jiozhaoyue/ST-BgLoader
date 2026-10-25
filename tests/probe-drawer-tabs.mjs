// 抽屉双标签截图：打开顶栏抽屉，分别截媒体库与设置标签。
// 用法: node tests/probe-drawer-tabs.mjs [targetUrl] [outPrefix]
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
    || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = process.argv[2] || process.env.TEST_TARGET_URL || 'https://localhost:8003';
const PREFIX = process.argv[3] || 'drawer';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await ensureExtensionLoaded(page);
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 35000 });
    // 等宿主启动加载层退场，否则截图被覆盖
    await page.waitForFunction(() => {
        const loader = document.querySelector('#loader, #loading');
        return !loader || loader.style.display === 'none' || getComputedStyle(loader).display === 'none';
    }, { timeout: 40000 });

    await page.evaluate(() => {
        window.STBgLoader.getTopbarDrawer()?.mount();
        const drawer = document.querySelector('#Backgrounds');
        const toggle = document.querySelector('#backgrounds-drawer-toggle');
        if (drawer && !drawer.classList.contains('openDrawer') && toggle) toggle.click();
    });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: join(outDir, `${PREFIX}-library.png`) });

    await page.evaluate(() => {
        document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]')?.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: join(outDir, `${PREFIX}-settings.png`) });
    console.log('OK:', join(outDir, `${PREFIX}-library.png`), '+', `${PREFIX}-settings.png`);
} finally {
    await browser.close();
}
