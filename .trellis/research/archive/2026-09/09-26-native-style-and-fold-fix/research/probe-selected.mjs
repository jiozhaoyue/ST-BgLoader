import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_ = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(900);
await p.evaluate(() => {
  const blk = document.querySelector('#rm_extensions_block');
  if (blk) { blk.classList.remove('closedDrawer'); blk.classList.add('openDrawer'); blk.style.display = ''; }
  document.querySelector('#extensions-settings-button')?.classList.remove('closedDrawer');
});
await sleep(400);
await p.evaluate(async () => {
  const ext = window.STBgLoader;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2a4a"/><stop offset="1" stop-color="#6d3b8f"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="160" cy="90" r="46" fill="#f5d76e" opacity="0.85"/></svg>`;
  const item = await ext.cacheManager.saveMedia(svg, 'visual-check.svg', 'svg', 'server');
  await ext.applyMedia(item);
});
await sleep(1600);
const res = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card')];
  const active = cards.find(c => c.classList.contains('active'));
  const anyCard = cards[0];
  const read = (el) => { const cs = getComputedStyle(el); return { boxShadow: cs.boxShadow, border: cs.borderTopWidth + ' ' + cs.borderTopColor, background: cs.backgroundColor, transition: cs.transition }; };
  const out = {
    totalCards: cards.length,
    activeFound: !!active,
    activeTitle: active?.querySelector('.st-bgloader-media-card-title')?.textContent,
    anyGlowOnGrid: cards.some(c => getComputedStyle(c).boxShadow !== 'none'),
  };
  if (active) {
    out.active = read(active);
    out.activeTitleStyle = { color: getComputedStyle(active.querySelector('.st-bgloader-media-card-title')).color,
                             weight: getComputedStyle(active.querySelector('.st-bgloader-media-card-title')).fontWeight };
  }
  if (anyCard) out.inactive = read(anyCard);
  return out;
});
console.log(JSON.stringify(res, null, 2));
// 滚动到选中卡并特写
const box = await p.evaluate(() => {
  const active = document.querySelector('#st_bgloader_grid .st-bgloader-media-card.active');
  if (!active) return null;
  active.scrollIntoView({ block: 'center' });
  const r = active.getBoundingClientRect();
  return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16 };
});
if (box) {
  await sleep(300);
  await p.screenshot({ path: '.trellis/tasks/09-26-native-style-and-fold-fix/research/shot-5-active-card.png', clip: box });
  console.log('shot-5-active-card.png 完成');
}
await b.close();
