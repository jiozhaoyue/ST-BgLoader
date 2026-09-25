import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(1200);
const before = await p.evaluate(() => window.STBgLoader.getSettings().activeMediaId);
console.log('清理前 activeMediaId:', before);
const r = await p.evaluate(async () => {
  const id = window.STBgLoader.getSettings().activeMediaId;
  // 若为悬空虚拟 id（custom_*），清空并落盘
  if (typeof id === 'string' && id.startsWith('custom_')) {
    window.STBgLoader.clearActiveBackground();
    await new Promise(r => setTimeout(r, 1500));   // 等 ServerSettings 防抖写盘
    return { cleaned: true };
  }
  return { cleaned: false };
});
const after = await p.evaluate(() => ({
  activeId: window.STBgLoader.getSettings().activeMediaId,
  ls: JSON.parse(localStorage.getItem('st_bgloader_settings') || '{}').activeMediaId ?? null,
}));
console.log('清理动作:', JSON.stringify(r));
console.log('清理后:', JSON.stringify(after));
await b.close();
