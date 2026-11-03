import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security'] });
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message.slice(0,120)));
p.on('response', r => { if (r.url().includes('ST-BgLoader')) errs.push(`${r.status()} ${r.url().slice(-60)}`); });
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 12000));
const r = await p.evaluate(() => {
  const ctx = window.SillyTavern?.getContext?.();
  const es = ctx?.extensionSettings || {};
  const key = Object.keys(es).find(k => k.includes('BgLoader'));
  return {
    STBgLoader: typeof window.STBgLoader,
    stBgLoader: typeof window.stBgLoader,
    esKey: key ?? '(extension_settings 中无该键)',
    enabled: key ? es[key]?.enabled : '(n/a)',
    disabledContains: (es.disabledExtensions||[]).some(x=>x.includes('BgLoader')),
    extensionNamesHasIt: (ctx?.extensionNames||[]).some?.(x=>String(x).includes('BgLoader')) ?? '(n/a)',
    hasManifest: !!document.querySelector('script[src*="extensions/third-party"]'),
    allThirdPartyScripts: [...document.querySelectorAll('script[src*="extensions"]')].map(s=>s.getAttribute('src')).slice(0,12),
  };
});
console.log(JSON.stringify(r, null, 2));
console.log('相关网络/错误:', JSON.stringify(errs.slice(0,8), null, 2));
await b.close();
