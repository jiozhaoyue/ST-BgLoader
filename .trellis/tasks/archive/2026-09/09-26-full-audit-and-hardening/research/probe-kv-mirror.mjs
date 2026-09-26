import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(1600);

const r = await p.evaluate(async () => {
  const out = {};
  try {
    const client = window.STBgLoader.getAuthorityBridge().getClient();
    out.authorityAvailable = !!client;
    if (client) {
      const payload = await client.storage.kv.get('settings:data');
      const rev = await client.storage.kv.get('settings:rev');
      out.kvRevision = rev;
      out.kvActiveMediaId = payload?.settings?.activeMediaId ?? null;
      out.kvPayloadRevision = payload?.revision ?? null;
    }
  } catch (e) { out.kvError = String(e); }
  // 服务端文档
  try {
    const r2 = await fetch('backgrounds/st-bg-loader-settings.json?t=' + Date.now(), { cache: 'no-store' });
    const doc = await r2.json();
    out.serverDocRevision = doc.revision;
    out.serverDocActiveMediaId = doc.settings?.activeMediaId ?? null;
  } catch (e) { out.serverDocError = String(e); }
  out.runtimeActiveMediaId = window.STBgLoader.getSettings().activeMediaId;
  out.localStorageRev = localStorage.getItem('st_bgloader_settings_rev');
  return out;
});
console.log(JSON.stringify(r, null, 2));
const conflicts = [];
if (r.serverDocActiveMediaId !== r.runtimeActiveMediaId) conflicts.push(`服务端文档=${r.serverDocActiveMediaId} 与 运行态=${r.runtimeActiveMediaId} 不一致`);
if (r.kvActiveMediaId !== undefined && r.kvActiveMediaId !== r.runtimeActiveMediaId && r.kvActiveMediaId !== null) conflicts.push(`KV 镜像=${r.kvActiveMediaId} 与 运行态=${r.runtimeActiveMediaId} 不一致`);
console.log('\n一致性判定:', conflicts.length ? conflicts.join(' / ') : '三者一致');
await b.close();
