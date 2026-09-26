// 一次性取证：原生缩略图 `.bg_example` 的真实属性/数据形态。
// 决定接管后点击该喂什么 URL 给扩展管线 —— 源码上 `data-url` 是 CSS 串 `url("...")`，
// 而 jQuery `.data()` 的写入是否同时落到 DOM 属性需实测确认。
// 只读，用后即删类别（留在任务 research/ 作为证据）。
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
    await sleep(1500);

    const r = await p.evaluate(async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        // 打开原生背景抽屉（只读 UI 动作，不改任何状态）——网格是打开时才填充的。
        document.querySelector('#backgrounds-drawer-toggle')?.click();
        await sleep(2500);

        const dump = (sel) => [...document.querySelectorAll(sel)].slice(0, 4).map((el) => ({
            bgfile: el.getAttribute('bgfile'),
            custom: el.getAttribute('custom'),
            animated: el.getAttribute('animated'),
            dataUrlAttr: el.getAttribute('data-url'),
            jqDataUrl: window.jQuery ? window.jQuery(el).data('url') : '(no jQuery)',
            classes: el.className,
            childEls: [...el.querySelectorAll('*')].slice(0, 6).map(c => c.className || c.tagName),
        }));

        // jQuery .data(k, v) 是否也写 DOM 属性？直接实测（与宿主 createThumbnailElement 同法）。
        const probeEl = document.createElement('div');
        window.jQuery(probeEl).data('url', 'url("X")');
        const jqWritesAttr = probeEl.getAttribute('data-url');

        // 网格里各类型的分布（决定徽章逻辑是否还有意义）
        const types = {};
        document.querySelectorAll('#bg_menu_content .bg_example').forEach((el) => {
            const n = el.getAttribute('bgfile') || '';
            const ext = (n.split('.').pop() || '').toLowerCase();
            types[ext] = (types[ext] || 0) + 1;
        });

        return {
            menuContentExists: !!document.querySelector('#bg_menu_content'),
            menuCount: document.querySelectorAll('#bg_menu_content .bg_example').length,
            customCount: document.querySelectorAll('#bg_custom_content .bg_example').length,
            sample: dump('#bg_menu_content .bg_example'),
            customSample: dump('#bg_custom_content .bg_example'),
            jqDataWritesDomAttr: jqWritesAttr,
            extensionHistogram: types,
            bg1: (() => { const e = document.querySelector('#bg1'); return e ? { bgImage: e.style.backgroundImage, cls: e.className } : null; })(),
            selectionBtns: {
                modeBtn: !!document.querySelector('#bg_selection_mode_button'),
                selectionModeClass: document.querySelector('#Backgrounds')?.className,
            },
        };
    });
    console.log(JSON.stringify(r, null, 2));
    await p.close();
} catch (err) {
    console.error('PROBE ERROR:', err?.message || err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
