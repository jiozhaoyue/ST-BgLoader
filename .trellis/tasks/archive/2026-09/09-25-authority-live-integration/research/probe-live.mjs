/**
 * 一次性真后端探针：页面上下文内 probe Authority 安装态与 ST-BgLoader 能力位。
 * 用后可删（不入库产品代码）。
 */
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.CHROME_PATH
    || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
});
try {
    const page = await browser.newPage();
    page.on('console', m => { const t = m.text(); if (/authority|ST-BgLoader/i.test(t)) console.log('[console]', t.slice(0, 300)); });
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => !!window.STBgLoader, { timeout: 60000 });

    const probe = await page.evaluate(async () => {
        const out = { hasSTAuthority: !!window.STAuthority, sdkProbe: null, caps: null, securityCenter: typeof window.STAuthority?.openSecurityCenter };
        try {
            out.sdkProbe = await window.STAuthority?.AuthoritySDK?.probe?.();
        } catch (e) { out.sdkProbe = { error: String(e) }; }
        try {
            await window.STBgLoader.getAuthorityBridge().detectAndInit();
            out.caps = window.STBgLoader.getAuthorityBridge().getCapabilities();
        } catch (e) { out.caps = { error: String(e) }; }
        return out;
    });
    console.log('PROBE_RESULT', JSON.stringify(probe, null, 2));
} finally {
    await browser.close();
}
