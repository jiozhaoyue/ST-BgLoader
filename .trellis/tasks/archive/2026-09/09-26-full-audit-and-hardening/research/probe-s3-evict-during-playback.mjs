// S3 实测探针：缓存淘汰（cleanLRU / clearAll）打到**正在播放/正在挂载**的媒体上时，是否真的断流？
//
// 背景：F3 把 objectUrls 改成「随 cache 条目淘汰同步 revoke」（旧代码在播放路径上永不 revoke）。
// 复核提出 RES-3：正在播放的 BGM 若其 cache 条目被淘汰，元素若尚未完整缓冲可能中断播放。
//
// 本探针把两个面都钉死：
//   ① cleanLRU(1)  —— 上传触发的淘汰路径（配额 1 字节 = 清空全部缓存条目，最激烈）
//   ② clearAll()   —— Clear Cache 按钮（revoke 全部 objectURL，含正在挂载的；改动前既有行为）
// 每种各测「已缓冲完」与「刚起播、未缓冲」两种时序，并同时覆盖 BGM（audio 元素）与已挂载背景（img 元素）。
// 每次淘汰测试都重新热身一个新条目——淘汰本身就是把缓存清空，复用同一个条目测不出第二种时序。
//
// 产物：探针自建的探针媒体在结束时全部删除，不留残留。
import puppeteer from 'puppeteer-core';

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0, info = 0;
const check = (n, ok, d) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); ok ? pass++ : fail++; };
const note = (n, d) => { console.log(`INFO  ${n}${d ? ' — ' + d : ''}`); info++; };
const section = (t) => console.log(`\n══════════ ${t} ══════════`);

const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
        '--autoplay-policy=no-user-gesture-required'],
});

async function freshPage() {
    const p = await browser.newPage();
    await p.setViewport({ width: 1500, height: 1000 });
    await p.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1000);
    // 交互一次：让 AudioEngine 认为用户已交互（解除自动播放静音等待）
    await p.evaluate(() => window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await sleep(200);
    return p;
}

// 页面内工具：合成可缓存、可播放的 WAV（不依赖任何外部资源）；并提供状态观测面
const PAGE_HELPERS = `
window.__s3makeWav = function (seconds, freq) {
    const rate = 44100, ch = 1, bits = 16;
    const n = Math.floor(rate * seconds);
    const dataSize = n * ch * bits / 8;
    const buf = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buf);
    const w = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); w(8, 'WAVE'); w(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, ch, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * ch * bits / 8, true);
    view.setUint16(32, ch * bits / 8, true); view.setUint16(34, bits, true);
    w(36, 'data'); view.setUint32(40, dataSize, true);
    for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, Math.sin(2 * Math.PI * freq * i / rate) * 8000, true);
    return new Blob([buf], { type: 'audio/wav' });
};
window.__s3cacheAudio = async function (name, seconds) {
    const cm = window.STBgLoader.getCacheManager();
    const item = await cm.saveMedia(window.__s3makeWav(seconds || 8, 440), name, 'audio', 'server');
    const cache = await caches.open('st-bg-cache-v1');
    return { id: item.id, name: item.name, cacheKey: item.cacheKey, cached: !!(await cache.match(item.cacheKey)) };
};
window.__s3cacheBg = async function (name, color) {
    const cm = window.STBgLoader.getCacheManager();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="135"><rect width="240" height="135" fill="' + (color || '#123456') + '"/></svg>';
    const item = await cm.saveMedia(svg, name, 'svg', 'server');
    const cache = await caches.open('st-bg-cache-v1');
    return { id: item.id, name: item.name, cacheKey: item.cacheKey, cached: !!(await cache.match(item.cacheKey)) };
};
window.__s3cacheImage = async function (name, color) {
    const cm = window.STBgLoader.getCacheManager();
    const c = document.createElement('canvas');
    c.width = 64; c.height = 36;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color || '#3355aa';
    ctx.fillRect(0, 0, 64, 36);
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const item = await cm.saveMedia(blob, name, 'image', 'server');
    const cache = await caches.open('st-bg-cache-v1');
    return { id: item.id, name: item.name, cacheKey: item.cacheKey, cached: !!(await cache.match(item.cacheKey)) };
};
window.__s3audio = function () { return window.STBgLoader.getAudioEngine().audioElement; };
window.__s3audioState = function (label) {
    const el = window.__s3audio();
    return {
        label, hasEl: !!el,
        isBlobSrc: !!(el && el.src && el.src.startsWith('blob:')),
        src: el && el.src ? el.src.slice(0, 24) : '(none)',
        paused: el ? el.paused : null,
        currentTime: el ? Number(el.currentTime.toFixed(3)) : null,
        readyState: el ? el.readyState : null,
        networkState: el ? el.networkState : null,
        error: el && el.error ? (el.error.code + '/' + (el.error.message || '')) : null,
    };
};
window.__s3blobAlive = async function (url) {
    try { const r = await fetch(url); return r.ok ? 'ok' : ('http ' + r.status); }
    catch (e) { return 'REVOKED(' + (e && e.name) + ')'; }
};
window.__s3bgState = function (label) {
    const cont = window.STBgLoader.getMediaMount().getContainerElement();
    const layers = [...document.querySelectorAll('#bg1 .st-bg-layer')];
    const media = layers.map(l => l.querySelector('img,video,iframe')).filter(Boolean);
    const first = media[0] || null;
    return {
        label,
        containerVisible: window.STBgLoader.getMediaMount().isVisible(),
        containerDisplay: cont ? (cont.style.display || '(unset)') : null,
        mediaTag: first ? first.tagName.toLowerCase() : null,
        mediaSrc: first && first.src ? first.src : (first ? String(first.getAttribute('src') || '') : null),
        imgComplete: first && first.tagName === 'IMG' ? first.complete : null,
        imgNaturalWidth: first && first.tagName === 'IMG' ? first.naturalWidth : null,
        iframeDocAlive: first && first.tagName === 'IFRAME'
            ? !!(first.contentDocument && first.contentDocument.documentElement
                && first.contentDocument.documentElement.innerHTML.length > 0)
            : null,
        // 一个 SVG 资源被 iframe 加载时，documentElement 本身就是 <svg> 根，所以
        // innerHTML 里看不到 '<svg' —— 判据是根标签名 + 仍含 <rect>。
        iframeRootTag: first && first.tagName === 'IFRAME' && first.contentDocument && first.contentDocument.documentElement
            ? first.contentDocument.documentElement.tagName.toLowerCase()
            : null,
        iframeHasSvg: first && first.tagName === 'IFRAME' && first.contentDocument && first.contentDocument.documentElement
            ? (first.contentDocument.documentElement.tagName.toLowerCase() === 'svg'
                || first.contentDocument.documentElement.innerHTML.indexOf('<svg') >= 0)
            : null,
        layerOpacity: layers.map(l => getComputedStyle(l).opacity),
    };
};
window.__s3waitBuffered = async function (ms) {
    for (let i = 0; i < (ms / 50); i++) {
        const el = window.__s3audio();
        if (el && el.src && el.readyState >= 3 && !el.paused) return true;
        await new Promise(r => setTimeout(r, 50));
    }
    return false;
};
window.__s3waitBlobSrc = async function (ms) {
    for (let i = 0; i < (ms / 10); i++) {
        const el = window.__s3audio();
        if (el && el.src && el.src.startsWith('blob:')) return true;
        await new Promise(r => setTimeout(r, 10));
    }
    return false;
};
// 等到「本曲确实在用 blob 源、且已经在播」——否则淘汰会抢在 URL 解析之前，
// 测的就不是「播放中 revoke」而是「解析前淘汰」（那是另一条路径，见 ③ INFO）。
window.__s3waitPlayingBlob = async function (ms) {
    for (let i = 0; i < (ms / 25); i++) {
        const el = window.__s3audio();
        if (el && el.src && el.src.startsWith('blob:') && !el.paused && el.currentTime > 0) return true;
        await new Promise(r => setTimeout(r, 25));
    }
    return false;
};
`;

const createdIds = [];
const createdNames = [];

try {
    const p = await freshPage();
    await p.evaluate(PAGE_HELPERS);

    const makeAudio = async (name, seconds) => {
        const r = await p.evaluate((n, s) => window.__s3cacheAudio(n, s), name, seconds);
        createdIds.push(r.id); createdNames.push(r.name);
        return r;
    };
    const makeBg = async (name, color) => {
        const r = await p.evaluate((n, c) => window.__s3cacheBg(n, c), name, color);
        createdIds.push(r.id); createdNames.push(r.name);
        return r;
    };
    const makeImage = async (name, color) => {
        const r = await p.evaluate((n, c) => window.__s3cacheImage(n, c), name, color);
        createdIds.push(r.id); createdNames.push(r.name);
        return r;
    };

    // ══════════ ① BGM 已缓冲完 → cleanLRU(1)（上传触发路径）══════════
    section('① BGM fully buffered → cleanLRU(1)   [upload-path eviction]');
    {
        const audio = await makeAudio('probe-s3-tone-1.wav', 8);
        check('SETUP-1 probe audio backfilled into CacheStorage', audio.cached);
        const r = await p.evaluate(async (audioId) => {
            const ext = window.STBgLoader;
            await window.stBgLoader.playBGM(audioId);
            const buffered = await window.__s3waitBuffered(6000);
            const before = window.__s3audioState('before cleanLRU');
            const blobBefore = before.isBlobSrc ? await window.__s3blobAlive(window.__s3audio().src) : 'not-blob';
            await ext.getCacheManager().cleanLRU(1);
            const atEvict = window.__s3audioState('at eviction');
            const usage = await ext.getCacheManager().getCacheUsage();
            await new Promise(r => setTimeout(r, 1800));
            const after = window.__s3audioState('1.8s after cleanLRU');
            const blobAfter = before.isBlobSrc ? await window.__s3blobAlive(before.src) : 'not-blob';
            return { buffered, before, blobBefore, atEvict, usage, after, blobAfter, advancing: after.currentTime > before.currentTime };
        }, audio.id);
        console.log('  ', JSON.stringify(r));
        check('①-1 playback was running from a cached objectURL (blob:)', r.before.isBlobSrc, `src=${r.before.src}`);
        check('①-2 the playing track\'s cache entry really got evicted', r.usage.itemCount === 0, `index items=${r.usage.itemCount}`);
        check('①-3 that objectURL really got revoked (old code never revoked)', r.blobAfter.startsWith('REVOKED'), r.blobAfter);
        check('①-4 no media error on the element', r.after.error === null, `error=${r.after.error}`);
        note('①-5 element state', JSON.stringify(r.after));
        check('①-6 **playback kept advancing** (no stream break)', r.advancing && r.after.paused === false,
            `t ${r.before.currentTime} → ${r.after.currentTime}, paused=${r.after.paused}`);
    }

    // ══════════ ② BGM 已缓冲完 → clearAll()（Clear Cache 按钮）══════════
    section('② BGM fully buffered → clearAll()   [Clear Cache button]');
    {
        const audio = await makeAudio('probe-s3-tone-2.wav', 8);
        check('SETUP-2 probe audio backfilled into CacheStorage', audio.cached);
        const r = await p.evaluate(async (audioId) => {
            const ext = window.STBgLoader;
            await window.stBgLoader.playBGM(audioId);
            const buffered = await window.__s3waitBuffered(6000);
            const before = window.__s3audioState('before clearAll');
            const srcBefore = window.__s3audio().src;
            await ext.getCacheManager().clearAll();
            const atEvict = window.__s3audioState('at clearAll');
            await new Promise(r => setTimeout(r, 1800));
            const after = window.__s3audioState('1.8s after clearAll');
            const blobAfter = before.isBlobSrc ? await window.__s3blobAlive(srcBefore) : 'not-blob';
            return { buffered, before, atEvict, after, blobAfter, advancing: after.currentTime > before.currentTime };
        }, audio.id);
        console.log('  ', JSON.stringify(r));
        check('②-1 clearAll() revoked the objectURL in use', r.blobAfter.startsWith('REVOKED'), r.blobAfter);
        check('②-2 no media error on the element', r.after.error === null, `error=${r.after.error}`);
        note('②-3 element state', JSON.stringify(r.after));
        check('②-4 **playback kept advancing** (no stream break)', r.advancing && r.after.paused === false,
            `t ${r.before.currentTime} → ${r.after.currentTime}, paused=${r.after.paused}`);
    }

    // ══════════ ③ BGM 正在播（blob 源、曲中未播完）→ cleanLRU(1) ══════════
    section('③ BGM playing from a blob source, mid-track → cleanLRU(1)');
    {
        const audio = await makeAudio('probe-s3-tone-3.wav', 20);
        check('SETUP-3 probe audio backfilled into CacheStorage', audio.cached);
        const r = await p.evaluate(async (audioId) => {
            const ext = window.STBgLoader;
            ext.getAudioEngine().stopTrack(0);
            const play = window.stBgLoader.playBGM(audioId);            // 故意不 await
            // 必须等「本曲确实在用 blob 源且在播」，否则淘汰会抢在 URL 解析之前 ——
            // 那时测到的是「解析前淘汰」，元素会自愈回服务端直连，而不是「播放中 revoke」。
            const playingBlob = await window.__s3waitPlayingBlob(9000);
            const atEvict = window.__s3audioState('at revoke');
            const srcBefore = window.__s3audio().src;
            if (playingBlob) await ext.getCacheManager().cleanLRU(1);
            await play.catch(() => {});
            await new Promise(r => setTimeout(r, 2000));
            const after = window.__s3audioState('2s after');
            const blobAlive = await window.__s3blobAlive(srcBefore);
            return {
                playingBlob, atEvict, after, blobAlive,
                advanced: after.currentTime > atEvict.currentTime,
                partialBuffer: atEvict.readyState !== null && atEvict.readyState < 4,
            };
        }, audio.id);
        console.log('  ', JSON.stringify(r));
        check('③-1 the element really was playing (mid-track) from a blob source when we evicted',
            r.playingBlob && r.atEvict.isBlobSrc && r.atEvict.paused === false,
            `paused=${r.atEvict.paused}, src=${r.atEvict.src}, t=${r.atEvict.currentTime}`);
        check('③-2 that in-use objectURL got revoked', String(r.blobAlive).startsWith('REVOKED'), String(r.blobAlive));
        note('③-3 buffer state at the moment of revocation (readyState<4 = a partial buffer was live)',
            `readyState=${r.atEvict.readyState}, networkState=${r.atEvict.networkState}, partialBuffer=${r.partialBuffer}`);
        check('③-4 **playback kept advancing** (no stream break)', r.advanced && r.after.paused === false,
            `t ${r.atEvict.currentTime} → ${r.after.currentTime}, paused=${r.after.paused}, err=${r.after.error}`);
    }

    // ══════════ ④ 已挂载背景（image/img）→ cleanLRU(1) ══════════
    section('④ background mounted (image) → cleanLRU(1)');
    {
        const bg = await makeImage('probe-s3-img-1.png', '#3355aa');
        check('SETUP-4 probe image backfilled into CacheStorage', bg.cached);
        const r = await p.evaluate(async (bgId) => {
            const ext = window.STBgLoader;
            await ext.applyMedia(await ext.getCacheManager().getMedia(bgId));
            await new Promise(r => setTimeout(r, 900));
            const before = window.__s3bgState('before cleanLRU');
            await ext.getCacheManager().cleanLRU(1);
            await new Promise(r => setTimeout(r, 900));
            const after = window.__s3bgState('after cleanLRU');
            const blobAlive = /^blob:/.test(before.mediaSrc || '') ? await window.__s3blobAlive(before.mediaSrc) : 'not-blob';
            return { before, after, blobAlive };
        }, bg.id);
        console.log('  ', JSON.stringify(r));
        check('④-1 the background was mounted from a cached objectURL', /^blob:/.test(r.before.mediaSrc || ''),
            `tag=${r.before.mediaTag} src=${String(r.before.mediaSrc).slice(0, 40)}`);
        check('④-2 the mounted background\'s objectURL got revoked', String(r.blobAlive).startsWith('REVOKED'), String(r.blobAlive));
        check('④-3 the image is **still rendered** (element present, decoded)',
            r.after.mediaTag === 'img' && r.after.imgComplete === true && r.after.imgNaturalWidth > 0,
            `tag=${r.after.mediaTag} complete=${r.after.imgComplete} naturalWidth=${r.after.imgNaturalWidth}`);
        check('④-4 the layer is still visible', r.after.containerDisplay !== 'none' && r.after.layerOpacity.includes('1'),
            JSON.stringify(r.after.layerOpacity));
    }

    // ══════════ ⑤ 已挂载背景（svg/iframe）→ clearAll() → 冷缓存重挂 ══════════
    section('⑤ background mounted (svg/iframe) → clearAll() → remount with a cold cache');
    {
        const bg = await makeBg('probe-s3-bg-2.svg', '#654321');
        check('SETUP-5 probe svg backfilled into CacheStorage', bg.cached);
        const r = await p.evaluate(async (bgId) => {
            const ext = window.STBgLoader;
            await ext.applyMedia(await ext.getCacheManager().getMedia(bgId));
            await new Promise(r => setTimeout(r, 1200));
            const before = window.__s3bgState('before clearAll');
            await ext.getCacheManager().clearAll();
            await new Promise(r => setTimeout(r, 900));
            const after = window.__s3bgState('after clearAll');
            const blobAlive = /^blob:/.test(before.mediaSrc || '') ? await window.__s3blobAlive(before.mediaSrc) : 'not-blob';
            await ext.applyMedia(await ext.getCacheManager().getMedia(bgId));
            await new Promise(r => setTimeout(r, 1200));
            const remount = window.__s3bgState('after remount, cache cold');
            return { before, after, blobAlive, remount };
        }, bg.id);
        console.log('  ', JSON.stringify(r));
        check('⑤-1 clearAll() revoked the mounted background\'s objectURL', String(r.blobAlive).startsWith('REVOKED'), String(r.blobAlive));
        check('⑤-2 the rendered document survived the revocation (iframe still holds its SVG)',
            r.after.mediaTag === 'iframe' && r.after.iframeDocAlive === true && r.after.iframeHasSvg === true,
            `tag=${r.after.mediaTag} docAlive=${r.after.iframeDocAlive} rootTag=${r.after.iframeRootTag}`);
        check('⑤-3 the layer is still visible', r.after.containerDisplay !== 'none' && r.after.layerOpacity.includes('1'),
            JSON.stringify(r.after.layerOpacity));
        check('⑤-4 a remount with a cold cache falls back to the server stream (non-blob src)',
            !!r.remount.mediaSrc && !/^blob:/.test(r.remount.mediaSrc), `src=${String(r.remount.mediaSrc).slice(0, 60)}`);
    }

    // ══════════ 清理 ══════════
    section('CLEANUP: remove probe media');
    await p.evaluate(async (ids) => {
        window.STBgLoader.clearActiveBackground();
        window.STBgLoader.getAudioEngine().stopTrack(0);
        for (const id of ids) { try { await window.STBgLoader.getCacheManager().deleteMedia(id); } catch (e) { console.warn(e); } }
    }, createdIds);
    await sleep(1500);
    await p.close();

    const v = await freshPage();
    const residue = await v.evaluate(async (names) => {
        const items = await window.STBgLoader.getCacheManager().listMedia();
        return items.filter(i => names.includes(i.name)).map(i => i.name);
    }, createdNames);
    check('CLEANUP-1 probe media gone from the library', residue.length === 0, `residue=${JSON.stringify(residue)}`);
    await v.close();
} catch (err) {
    console.error('PROBE ERROR:', err);
    fail++;
} finally {
    await browser.close();
}

console.log(`\n===== S3 probe summary: ${pass} passed, ${fail} failed, ${info} info =====`);
process.exit(fail === 0 ? 0 : 1);
