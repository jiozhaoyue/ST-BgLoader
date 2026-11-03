// 一次性清理：把 G6 冒烟探针遗留的 backgroundVisible 复原为用户原态（true）。
//
// 起因：探针首次运行在 S5 抛错，复原段没跑到，而 saveSettings() 是防抖写盘 —— 页面被关闭时
// 最后一次写入没落盘，于是 Dev 实例的可见性停在 false。后续运行把 false 当作"初始值"复原，
// 残留就被固化了。本脚本显式设回 true 并**读回确认已落盘**。
//
// 用后即删类别：本文件留在任务 research/ 作为留痕；执行后不再需要。
import puppeteer from 'puppeteer-core';

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
});

try {
    const p = await browser.newPage();
    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1200);

    const before = await p.evaluate(() => window.STBgLoader.getSettings().backgroundVisible);
    await p.evaluate(() => window.stBgLoader.setBackgroundVisible(true));
    await sleep(2500);   // the settings write is debounced; let it land before closing
    const after = await p.evaluate(() => ({
        setting: window.STBgLoader.getSettings().backgroundVisible,
        api: window.stBgLoader.isBackgroundVisible(),
        display: window.STBgLoader.getMediaMount().getContainerElement()?.style.display || '(unset)',
    }));
    console.log(`backgroundVisible: before=${before} → after=${after.setting} api=${after.api} display=${after.display}`);
    await p.close();
} catch (err) {
    console.error('CLEANUP ERROR:', err?.message || err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
