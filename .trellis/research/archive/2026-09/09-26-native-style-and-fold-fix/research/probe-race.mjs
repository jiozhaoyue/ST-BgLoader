import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setViewport({ width: 1400, height: 1000 });

// 在页面脚本执行前安装面板替换观察器，记录每次 #st_bgloader_settings 被插入/移除的时刻
await p.evaluateOnNewDocument(() => {
    window.__panelLog = [];
    const t0 = performance.now();
    const install = () => {
        const host = document.querySelector('#extensions_settings') || document.body;
        if (!host) return setTimeout(install, 50);
        new MutationObserver((muts) => {
            for (const m of muts) {
                for (const n of m.addedNodes) {
                    if (n.nodeType === 1 && n.id === 'st_bgloader_settings') {
                        window.__panelLog.push({ ev: 'panel-inserted', t: Math.round(performance.now() - t0) });
                    }
                }
                for (const n of m.removedNodes) {
                    if (n.nodeType === 1 && n.id === 'st_bgloader_settings') {
                        window.__panelLog.push({ ev: 'panel-removed', t: Math.round(performance.now() - t0) });
                    }
                }
            }
        }).observe(host, { childList: true, subtree: true });
    };
    install();
});

const run = async (label) => {
    await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(2500);
    const r = await p.evaluate(() => ({
        log: window.__panelLog,
        gridCards: document.querySelector('#st_bgloader_grid')?.children.length ?? -1,
        gridHtmlHead: (document.querySelector('#st_bgloader_grid')?.innerHTML || '').slice(0, 40).replace(/\s+/g, ' '),
    }));
    const inserts = r.log.filter(x => x.ev === 'panel-inserted').length;
    console.log(`[${label}] 面板插入 ${inserts} 次 | 栅格卡片 ${r.gridCards} | head="${r.gridHtmlHead}"`);
    console.log('           时间线:', JSON.stringify(r.log));
    return r.gridCards;
};

let empty = 0, full = 0;
for (let i = 1; i <= 4; i++) {
    const n = await run(`run${i}`);
    if (n === 0) empty++; else full++;
}
console.log(`\n结果: 栅格为空 ${empty} 次 / 正常 ${full} 次`);
await b.close();
