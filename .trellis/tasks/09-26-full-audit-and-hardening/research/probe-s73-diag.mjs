import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const frames = [];
p.on('frameattached', f => frames.push(f.url().slice(0, 60)));
await p.evaluateOnNewDocument(() => {
    localStorage.removeItem('st_bgloader_settings');
    localStorage.removeItem('st_bgloader_settings_rev');
    window.__clearedAt = performance.now();
});
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });

const snap = async (tag) => {
  const d = await p.evaluate(() => ({
    lsSettings: localStorage.getItem('st_bgloader_settings') ? 'present' : 'ABSENT',
    lsSettingsLen: (localStorage.getItem('st_bgloader_settings') || '').length,
    lsRev: localStorage.getItem('st_bgloader_settings_rev'),
    runtimeVolume: window.STBgLoader.getSettings().volume,
    runtimeRev: 'n/a',
    iframeCount: document.querySelectorAll('iframe').length,
  }));
  console.log(`[${tag}]`, JSON.stringify(d));
  return d;
};
await snap('init 后立即');
await sleep(300);  await snap('+300ms');
await sleep(1200); await snap('+1.5s');
await sleep(3000); await snap('+4.5s');
console.log('frames attached:', JSON.stringify(frames.slice(0, 8)));
await b.close();
