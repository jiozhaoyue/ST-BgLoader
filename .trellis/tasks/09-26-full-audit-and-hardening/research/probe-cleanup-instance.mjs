// 清理 Dev 实例 backgrounds/ 中的测试产物（用户已批准）
// 只删两族：test-animation*.html（e2e/stress 产物）、visual-check*.svg（本会话探针产物）
// 走扩展自身的 deleteMedia，确保服务端文件与 manifest 条目一并移除（否则留下幽灵条目）
import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const DRY = process.env.DRY_RUN === '1';

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
await sleep(1500);

const plan = await p.evaluate(async () => {
  const items = await window.STBgLoader.getCacheManager().listMedia();
  const isTestArtifact = (n) => /^test-animation(_\d+)?\.html$/i.test(n) || /^visual-check(_\d+)?\.svg$/i.test(n);
  const targets = items.filter(i => isTestArtifact(i.name));
  return {
    total: items.length,
    targets: targets.map(i => ({ id: i.id, name: i.name, type: i.type })),
    protectedFiles: items.filter(i => /st-bg-loader-(manifest|settings)\.json/i.test(i.name)).map(i => i.name),
  };
});
console.log('DRY_RUN =', DRY);
console.log('media library total:', plan.total);
console.log('to delete (' + plan.targets.length + '):');
for (const t of plan.targets) console.log('   ', t.name, '|', t.type, '|', t.id);
console.log('protected (never touched):', JSON.stringify(plan.protectedFiles));

if (!DRY && plan.targets.length) {
  const res = await p.evaluate(async (ids) => {
    const out = { ok: [], fail: [] };
    for (const id of ids) {
      try { await window.STBgLoader.getCacheManager().deleteMedia(id); out.ok.push(id); }
      catch (e) { out.fail.push(id + ': ' + String(e)); }
    }
    return out;
  }, plan.targets.map(t => t.id));
  console.log('deleted ok:', res.ok.length, 'failed:', res.fail.length);
  if (res.fail.length) console.log('failures:', JSON.stringify(res.fail));
  await sleep(2000);
  const after = await p.evaluate(async () => {
    const items = await window.STBgLoader.getCacheManager().listMedia();
    const isTestArtifact = (n) => /^test-animation(_\d+)?\.html$/i.test(n) || /^visual-check(_\d+)?\.svg$/i.test(n);
    return { total: items.length, remainingTestArtifacts: items.filter(i => isTestArtifact(i.name)).map(i => i.name) };
  });
  console.log('after: total =', after.total, '| remaining test artifacts =', JSON.stringify(after.remainingTestArtifacts));
}
await b.close();
