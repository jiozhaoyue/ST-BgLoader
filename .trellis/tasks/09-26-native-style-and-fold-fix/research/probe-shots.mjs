// 一次性截图（用后即删）：视觉验收证据
// 打开宿主的扩展面板 → 展开本扩展面板 → 导入一个真实媒体条目以呈现媒体库与选中态
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const OUT = '.trellis/tasks/09-26-native-style-and-fold-fix/research';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1.4 });
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => window.STBgLoader && window.STBgLoader.isInitialized, { timeout: 40000 });
await sleep(1000);

// 打开宿主的顶层「扩展」抽屉（测试装置操作：直接切宿主的状态类）
await page.evaluate(() => {
    const block = document.querySelector('#rm_extensions_block');
    if (block) { block.classList.remove('closedDrawer'); block.classList.add('openDrawer'); block.style.display = ''; }
    const btn = document.querySelector('#extensions-settings-button');
    if (btn) { btn.classList.remove('closedDrawer'); btn.classList.add('openDrawer'); }
});
await sleep(600);

// 折叠态截图
const root = '#st_bgloader_settings';
await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), root);
await sleep(300);
const headerBox = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), w: Math.min(1500, r.width + 24), h: 90 };
}, root);
if (headerBox) {
    await page.screenshot({ path: `${OUT}/shot-1-collapsed.png`, clip: { x: headerBox.x, y: headerBox.y, width: headerBox.w, height: Math.max(60, headerBox.h) } });
    console.log('shot-1-collapsed.png 完成');
}

// 展开面板
await page.evaluate((sel) => document.querySelector(`${sel} .inline-drawer-toggle`)?.click(), root);
await sleep(900);

// 导入一个真实媒体条目，触发媒体库渲染与选中态
await page.evaluate(async () => {
    const ext = window.STBgLoader;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2a4a"/><stop offset="1" stop-color="#6d3b8f"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="160" cy="90" r="46" fill="#f5d76e" opacity="0.85"/></svg>`;
    const item = await ext.cacheManager.saveMedia(svg, 'visual-check.svg', 'svg', 'server');
    await ext.applyMedia(item);
});
await sleep(1500);

// 展开态整面板截图
await page.evaluate((sel) => document.querySelector(`${sel} .inline-drawer-content`)?.scrollIntoView({ block: 'start' }), root);
await sleep(400);
const panelBox = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(1500, r.width + 20), height: Math.min(1000, window.innerHeight - Math.max(0, r.y - 10)) };
}, root);
await page.screenshot({ path: `${OUT}/shot-2-expanded.png`, clip: panelBox });
console.log('shot-2-expanded.png 完成', JSON.stringify(panelBox));

// 媒体库 + 选中态特写
const gridBox = await page.evaluate(() => {
    const g = document.querySelector('#st_bgloader_grid');
    if (!g) return null;
    const r = g.getBoundingClientRect();
    return { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 34), width: Math.min(1400, r.width + 24), height: Math.min(500, r.height + 50) };
});
if (gridBox && gridBox.height > 40) {
    await page.screenshot({ path: `${OUT}/shot-3-media-grid-selected.png`, clip: gridBox });
    console.log('shot-3-media-grid-selected.png 完成');
}

// 迷你播放器胶囊特写
await page.evaluate(() => { window.STBgLoader.getMiniPlayer()?.show(); });
await sleep(500);
const capBox = await page.evaluate(() => {
    const el = document.querySelector('#st_bg_mini_player');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - 16), y: Math.max(0, r.y - 16), width: r.width + 32, height: r.height + 32 };
});
if (capBox) {
    await page.screenshot({ path: `${OUT}/shot-4-mini-capsule.png`, clip: capBox });
    console.log('shot-4-mini-capsule.png 完成');
}

await browser.close();
console.log('截图完毕');
