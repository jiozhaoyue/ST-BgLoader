/**
 * 一次性探针 4：dump 授权等待期页面 DOM —— Authority 权限弹窗到底渲染在哪、按钮是什么元素。
 * 用后可删。
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
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => !!window.STBgLoader, { timeout: 60000 });

    const result = await page.evaluate(async () => {
        const bridge = window.STBgLoader.getAuthorityBridge();
        await bridge.detectAndInit();
        window.STBgLoader.getSettings().agentToolsEnabled = true;
        window.STBgLoader.saveSettings();
        window.STBgLoader.syncAgentTools();

        // 等注册进入 pending（弹窗应已在某处）
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 500));
            if (bridge.getCapabilities().agentToolsState === 'pending') break;
        }
        await new Promise(r => setTimeout(r, 2000));

        const dump = {
            popups: [...document.querySelectorAll('.popup')].map(p => ({
                classes: p.className,
                text: (p.textContent || '').slice(0, 200),
                buttons: [...p.querySelectorAll('button, .menu_button, a, [role="button"]')].map(b => ({
                    tag: b.tagName, cls: (b.className || '').toString().slice(0, 80), text: (b.textContent || '').trim().slice(0, 40),
                })),
            })),
            dialogs: [...document.querySelectorAll('dialog')].map(d => ({ open: d.open, text: (d.textContent || '').slice(0, 120) })),
            dataFieldNodes: [...document.querySelectorAll('[data-field]')].map(n => ({
                field: n.getAttribute('data-field'), text: (n.textContent || '').slice(0, 60),
            })),
            toastr: [...document.querySelectorAll('#toastr *')].slice(0, 5).map(n => (n.textContent || '').slice(0, 80)),
            allButtonsSample: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 40),
        };
        return dump;
    });
    console.log('DOM_DUMP', JSON.stringify(result, null, 2));
} finally {
    await browser.close();
}
