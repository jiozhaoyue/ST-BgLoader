// 会话探针：打开目标酒馆，截图留证，报告登录态 / 宿主 API / 扩展装载状态。
// 用法: node tests/probe-session.mjs [targetUrl]
// 截图输出到 tests/e2e-artifacts/probe-session.png
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'e2e-artifacts');
mkdirSync(outDir, { recursive: true });

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = process.argv[2] || process.env.TEST_TARGET_URL || 'https://localhost:8003';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required',
    ],
});
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const consoleLines = [];
    page.on('console', m => consoleLines.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', e => consoleLines.push(`[pageerror] ${e.message}`));

    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });

    // 等扩展初始化（宿主 extensions 批次可能滞后 10s+）
    let extLoaded = false;
    try {
        await page.waitForFunction(() => !!(window).STBgLoader?.isInitialized, { timeout: 25000 });
        extLoaded = true;
    } catch { /* 超时仍未装载 */ }
    await new Promise(r => setTimeout(r, 2000));

    const state = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        hasLogin: !!document.querySelector('#login, .login, #user_select, form[data-login]'),
        bodyClass: document.body.className.slice(0, 200),
        hasST: !!(window).SillyTavern,
        hasCtx: typeof (window).SillyTavern?.getContext === 'function',
        extLoaded: !!(window).STBgLoader?.isInitialized,
        hasBg1: !!document.querySelector('#bg1'),
        mountReady: !!document.querySelector('#bg1 .st-bg-media-container'),
        topbarPanel: !!document.querySelector('#st_bgloader_topbar_panel'),
        settingsEntry: !!document.querySelector('#st_bgloader_container'),
        enabledSetting: (window).STBgLoader?.getSettings?.()?.enabled,
    }));
    state.extLoaded = extLoaded && state.extLoaded;
    console.log(JSON.stringify(state, null, 2));

    const shot = join(outDir, 'probe-session.png');
    await page.screenshot({ path: shot, fullPage: false });
    console.log('SCREENSHOT:', shot);
    console.log('--- console tail ---');
    for (const l of consoleLines.slice(-15)) console.log(l);
} finally {
    await browser.close();
}
