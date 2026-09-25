import puppeteer from 'puppeteer-core';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-web-security'],
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
    window.__diag = [];
    window.__diag.push('start: hasProp=' + Object.prototype.hasOwnProperty.call(window, 'STAuthority'));
    try {
        Object.defineProperty(window, 'STAuthority', {
            configurable: false,
            get: () => ({ __stbgMock: true }),
            set: () => {},
        });
        window.__diag.push('defineProperty OK');
    } catch (e) { window.__diag.push('defineProperty FAILED: ' + e.message); }
    window.__diag.push('after: desc=' + JSON.stringify(Object.getOwnPropertyDescriptor(window, 'STAuthority')?.get ? 'accessor' : String(Object.getOwnPropertyDescriptor(window, 'STAuthority')?.value)).slice(0, 100));
    window.__diag.push('read: ' + JSON.stringify(window.STAuthority));
});
await page.goto('https://127.0.0.1:8003', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => !!window.STBgLoader, { timeout: 60000 }).catch(() => {});
const diag = await page.evaluate(() => ({
    diag: window.__diag,
    afterLoad: JSON.stringify(window.STAuthority)?.slice(0, 120),
    stbgMock: window.STAuthority?.__stbgMock,
}));
console.log(JSON.stringify(diag, null, 2));
await browser.close();
