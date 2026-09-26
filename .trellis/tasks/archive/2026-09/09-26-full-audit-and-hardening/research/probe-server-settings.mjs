import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(1500);

const readServer = async (tag) => {
  const d = await p.evaluate(async () => {
    const r = await fetch('backgrounds/st-bg-loader-settings.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return { http: r.status };
    const doc = await r.json();
    return { revision: doc.revision, activeMediaId: doc.settings?.activeMediaId ?? null, updated: doc.updatedTimestamp };
  });
  console.log(`[${tag}] 服务端设置文档:`, JSON.stringify(d));
  return d;
};

const init = await readServer('初始');
const local = await p.evaluate(() => ({ activeId: window.STBgLoader.getSettings().activeMediaId, rev: localStorage.getItem('st_bgloader_settings_rev') }));
console.log('[初始] 运行态:', JSON.stringify(local));

// 若服务端仍持有悬空 id，则清空并等待写盘落定
const cleaned = await p.evaluate(async () => {
  const id = window.STBgLoader.getSettings().activeMediaId;
  if (typeof id === 'string' && id.startsWith('custom_')) {
    window.STBgLoader.clearActiveBackground();
    await new Promise(r => setTimeout(r, 2500));
    return { action: 'cleared' };
  }
  return { action: 'noop' };
});
console.log('[清理]', JSON.stringify(cleaned));
await sleep(2000);
const after = await readServer('写后');
const ok = after.activeMediaId === null;
console.log('\n判定：服务端 activeMediaId 已清空 =', ok, ok ? '' : '→ 设置在服务端写盘未生效，需排查');
await b.close();
