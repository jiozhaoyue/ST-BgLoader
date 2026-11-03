import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security'] });
const p = await b.newPage();
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(1200);
const r = await p.evaluate(async () => {
  const items = await window.STBgLoader.getCacheManager().listMedia();
  const targets = items.filter(i => /^a3-verify-temp(_\d+)?\.svg$/i.test(i.name));
  const out = { found: targets.map(t => t.name), deleted: [], failed: [] };
  for (const t of targets) {
    try { await window.STBgLoader.getCacheManager().deleteMedia(t.id); out.deleted.push(t.name); }
    catch (e) { out.failed.push(t.name + ': ' + String(e)); }
  }
  await new Promise(r => setTimeout(r, 1500));
  const after = await window.STBgLoader.getCacheManager().listMedia();
  out.remaining = after.filter(i => /a3-verify-temp/i.test(i.name)).map(i => i.name);
  return out;
});
console.log(JSON.stringify(r, null, 2));
await b.close();
