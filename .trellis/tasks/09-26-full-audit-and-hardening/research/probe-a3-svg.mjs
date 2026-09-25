import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setViewport({ width: 1500, height: 1000 });
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(1000);
await p.evaluate(() => {
  document.querySelectorAll('.closedDrawer').forEach(el => el.classList.replace('closedDrawer', 'openDrawer'));
  document.querySelectorAll('.drawer-content').forEach(el => el.style.removeProperty('display'));
});
await sleep(2500);

const info = await p.evaluate(() => {
  const badged = [...document.querySelectorAll('#bg_menu_content .bg_example')]
    .filter(a => a.querySelector('.st-bg-native-badge'));
  return {
    badged: badged.map(a => ({ file: a.getAttribute('bgfile'), badge: a.querySelector('.st-bg-native-badge')?.textContent, augmented: a.hasAttribute('data-st-bg-augmented') })),
  };
});
console.log('被徽章标注的原生缩略图:', JSON.stringify(info.badged, null, 2));

// 实测：点击其中一个 SVG 缩略图，观察宿主是否也改写了 #bg1
const click = await p.evaluate(async () => {
  const el = [...document.querySelectorAll('#bg_menu_content .bg_example')]
    .find(a => a.querySelector('.st-bg-native-badge'));
  if (!el) return { skip: '无被标注的缩略图' };
  const host = document.querySelector('#bg1');
  const before = host.style.backgroundImage || '(空)';
  const beforeActive = window.STBgLoader.getSettings().activeMediaId;
  el.click();
  await new Promise(r => setTimeout(r, 1200));
  return {
    file: el.getAttribute('bgfile'),
    hostBgBefore: before,
    hostBgAfter: host.style.backgroundImage || '(空)',
    hostWritten: before !== (host.style.backgroundImage || '(空)'),
    activeBefore: beforeActive,
    activeAfter: window.STBgLoader.getSettings().activeMediaId,
    extMounted: !!document.querySelector('#bg1 .st-bg-media-container'),
  };
});
console.log('\n点击结果:', JSON.stringify(click, null, 2));
console.log('\n判定：宿主改写 #bg1 =', click.hostWritten, '；扩展同时切换自身背景 =', click.activeBefore !== click.activeAfter,
  '→', (click.hostWritten && click.activeBefore !== click.activeAfter) ? '【双写成立】' : '【未观察到双写】');
await b.close();
