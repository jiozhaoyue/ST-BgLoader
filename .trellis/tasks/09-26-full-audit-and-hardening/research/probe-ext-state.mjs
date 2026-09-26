import puppeteer from 'puppeteer-core';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','--disable-web-security'] });
const p = await b.newPage();
await p.goto(process.env.TEST_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 8000));
const r = await p.evaluate(() => {
  const ctx = window.SillyTavern?.getContext?.();
  const es = ctx?.extensionSettings || {};
  const disabled = es.disabledExtensions || [];
  return {
    STBgLoaderDefined: typeof window.STBgLoader !== 'undefined',
    stBgLoaderDefined: typeof window.stBgLoader !== 'undefined',
    disabledExtensions: Array.isArray(disabled) ? disabled : Object.keys(disabled),
    extensionScriptTags: [...document.querySelectorAll('script[src*="ST-BgLoader"]')].map(s => s.getAttribute('src')),
    enabledFlag: es['third-party/ST-BgLoader']?.enabled ?? es['ST-BgLoader']?.enabled ?? '(未找到该键)',
  };
});
console.log(JSON.stringify(r, null, 2));
await b.close();
