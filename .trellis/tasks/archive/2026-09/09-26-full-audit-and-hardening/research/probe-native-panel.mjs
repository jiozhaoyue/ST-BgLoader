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

// 强制打开原生背景面板（宿主顶层抽屉 + 背景抽屉）
await p.evaluate(() => {
  document.querySelectorAll('.closedDrawer').forEach(el => el.classList.replace('closedDrawer', 'openDrawer'));
  document.querySelectorAll('.drawer-content').forEach(el => { el.style.removeProperty('display'); });
  // 原生背景面板的 inline-drawer
  document.querySelectorAll('.inline-drawer-content').forEach(el => { if (el.closest('#backgrounds_block, #Backgrounds')) el.style.display = 'block'; });
});
await sleep(800);
// 若原生网格为空，主动触发一次加载
await p.evaluate(async () => {
  const grid = document.querySelector('#bg_menu_content');
  if (grid && grid.children.length === 0) {
    const ev = window.eventSource; const et = window.event_types;
    if (ev && et) ev.emit(et.CHAT_CHANGED, window.getCurrentChatId?.());
  }
});
await sleep(2500);

const r = await p.evaluate(async () => {
  const anchors = [...document.querySelectorAll('#bg_menu_content .bg_example')];
  const withBgfile = anchors.filter(a => (a.getAttribute('bgfile') || '') !== '');
  const ext = (n) => (n.split('.').pop() || '').toLowerCase();
  const NON = ['mp4','webm','mov','m4v','ogv','mp3','wav','ogg','flac','aac','m4a','html','htm'];
  const nonImage = withBgfile.filter(a => NON.includes(ext(a.getAttribute('bgfile') || '')));
  // 扩展自身目录里有哪些非图片条目（来自服务端 manifest）
  let extNonImage = [];
  try {
    const items = await window.STBgLoader.getCacheManager().listMedia();
    extNonImage = items.filter(i => i.type !== 'image').map(i => i.name);
  } catch (e) { extNonImage = ['err:' + e.message]; }
  return {
    nativeGridChildren: document.querySelector('#bg_menu_content')?.children.length ?? -1,
    anchorsTotal: anchors.length,
    anchorsWithBgfile: withBgfile.length,
    nonImageAnchors: nonImage.length,
    augmentedAnchors: anchors.filter(a => a.hasAttribute('data-st-bg-augmented')).length,
    badges: document.querySelectorAll('.st-bg-native-badge').length,
    extNonImageCount: extNonImage.length,
    extNonImageSample: extNonImage.slice(0, 6),
  };
});
console.log(JSON.stringify(r, null, 2));
console.log('\n判定：非图片缩略图数量 =', r.nonImageAnchors,
  '→ NativeBgAugmenter 的非图片分支', r.nonImageAnchors === 0 ? '【在当前宿主上无对象，功能实际为空转】' : '【有对象】');
await b.close();
