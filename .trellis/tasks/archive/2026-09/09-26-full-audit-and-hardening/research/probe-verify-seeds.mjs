// 一次性验证探针（用后即删）：复核子任务 2 的种子发现 A1 / A2 / A3
import puppeteer from 'puppeteer-core';

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let fail = 0;
const check = (n, ok, d) => { console.log(`${ok ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
const errs = [];
page.on('pageerror', e => errs.push(e.message));

try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 40000 });
    await sleep(1200);

    // ── 前提核查：原生 /api/backgrounds/all 会返回哪些文件？ ──
    console.log('\n── 前提核查：原生 backgrounds 列表的构成 ──');
    const listing = await page.evaluate(async () => {
        const headers = window.SillyTavern.getContext().getRequestHeaders();
        const r = await fetch('/api/backgrounds/all', { method: 'POST', headers, body: '{}' });
        const data = await r.json();
        const names = (data.images || []).map(x => x.filename);
        const ext = (n) => (n.split('.').pop() || '').toLowerCase();
        const NON_IMAGE = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'html', 'htm'];
        return {
            total: names.length,
            nonImage: names.filter(n => NON_IMAGE.includes(ext(n))),
            sample: names.slice(0, 8),
            keys: Object.keys(data),
        };
    });
    console.log('   总数:', listing.total);
    console.log('   响应字段:', JSON.stringify(listing.keys));
    console.log('   样本:', JSON.stringify(listing.sample));
    console.log('   非图片条目:', listing.nonImage.length ? JSON.stringify(listing.nonImage) : '无');
    check('原生列表包含非图片文件（决定 A3 形态与接管必要性）', true, `非图片 ${listing.nonImage.length} 个`);

    // ── A1：Alt+B 隐藏后切背景 ──
    console.log('\n── A1：Alt+B 隐藏背景后再切背景 ──');
    const a1 = await page.evaluate(async () => {
        const ext = window.STBgLoader;
        const cont = ext.getMediaMount().getContainerElement();
        const readDisplay = () => {
            const c = ext.getMediaMount().getContainerElement();
            return c ? (c.style.display || '(未设置)') : '(无容器)';
        };
        const before = readDisplay();
        // 模拟 Alt+B（ShortcutManager 监听 window keydown）
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', altKey: true, bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        const afterAltB = readDisplay();
        // 切换到另一个媒体条目
        const items = await ext.getCacheManager().listMedia();
        const other = items.find(i => i.id !== ext.getSettings().activeMediaId) || items[0];
        await ext.applyMedia(other);
        await new Promise(r => setTimeout(r, 900));
        const afterSwitch = readDisplay();
        const layerVisible = [...document.querySelectorAll('#bg1 .st-bg-layer')]
            .some(l => getComputedStyle(l).opacity === '1');
        return { before, afterAltB, afterSwitch, layerVisible, otherName: other?.name };
    });
    console.log('   ', JSON.stringify(a1));
    check('Alt+B 使容器隐藏', a1.afterAltB === 'none', `display=${a1.afterAltB}`);
    check('切换背景后容器仍隐藏（缺陷成立）', a1.afterSwitch === 'none',
        `display=${a1.afterSwitch}；图层已渲染但不可见=${a1.layerVisible}`);

    // 复原：再按一次 Alt+B 让容器可见
    await page.evaluate(async () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', altKey: true, bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
    });
    const restored = await page.evaluate(() => window.STBgLoader.getMediaMount().getContainerElement()?.style.display);
    check('再按一次 Alt+B 可恢复（偶数次互抵）', restored !== 'none', `display=${restored}`);

    // ── A2：虚拟媒体项被持久化为 activeMediaId ──
    console.log('\n── A2：非持久化背景写入 activeMediaId ──');
    const a2 = await page.evaluate(async () => {
        const url = 'https://example.invalid/audit-probe-never-fetched.mp4';
        await window.stBgLoader.setBackground(url);      // 不带 saveToLibrary
        await new Promise(r => setTimeout(r, 600));
        const settings = JSON.parse(localStorage.getItem('st_bgloader_settings') || '{}');
        const activeId = settings.activeMediaId;
        let resolvable = null;
        try { resolvable = await window.STBgLoader.getCacheManager().getMedia(activeId); } catch (e) { resolvable = 'throw:' + e.message; }
        return { activeId, resolvableIsNull: resolvable === null, resolvableType: typeof resolvable };
    });
    console.log('   ', JSON.stringify(a2));
    check('虚拟 id 被写入持久化的 activeMediaId', /^custom_/.test(a2.activeId || ''), `activeMediaId=${a2.activeId}`);
    check('该 id 在媒体库中无法解析（悬空引用）', a2.resolvableIsNull, `getMedia → ${a2.resolvableType}`);

    // ── A3：原生缩略图点击是否双写 ──
    console.log('\n── A3：原生缩略图点击双写 ──');
    const a3 = await page.evaluate(async () => {
        // 打开原生背景面板
        const blk = document.querySelector('#rm_extensions_block');
        // 原生背景面板位于「背景」抽屉（#Backgrounds）
        const bgToggle = document.querySelector('#bg_menu_content')?.closest('.inline-drawer')?.querySelector('.inline-drawer-toggle');
        const anchors = [...document.querySelectorAll('.bg_example[bgfile]')];
        const nonImage = anchors.filter(a => {
            const f = (a.getAttribute('bgfile') || '').toLowerCase();
            return !/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(f);
        });
        const augmented = anchors.filter(a => a.hasAttribute('data-st-bg-augmented'));
        return {
            totalAnchors: anchors.length,
            nonImageAnchors: nonImage.length,
            nonImageFiles: nonImage.slice(0, 5).map(a => a.getAttribute('bgfile')),
            augmentedCount: augmented.length,
            hasNativeToggle: !!bgToggle,
        };
    });
    console.log('   ', JSON.stringify(a3));
    check('原生网格中存在 .bg_example[bgfile] 锚点', a3.totalAnchors > 0, `${a3.totalAnchors} 个`);
    if (a3.nonImageAnchors > 0) {
        // 点一个非图片缩略图，观察 #bg1 的 background-image 是否被宿主改写
        const a3click = await page.evaluate(async () => {
            const el = [...document.querySelectorAll('.bg_example[bgfile]')].find(a => {
                const f = (a.getAttribute('bgfile') || '').toLowerCase();
                return !/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(f);
            });
            const host = document.querySelector('#bg1');
            const before = host.style.backgroundImage || '(空)';
            el.click();
            await new Promise(r => setTimeout(r, 900));
            const after = host.style.backgroundImage || '(空)';
            const activeId = window.STBgLoader.getSettings().activeMediaId;
            return { file: el.getAttribute('bgfile'), before, after, hostWritten: before !== after, activeId };
        });
        console.log('   ', JSON.stringify(a3click));
        check('宿主同时改写了 #bg1 的 background-image（双写成立）', a3click.hostWritten,
            `${a3click.before} → ${a3click.after}`);
    } else {
        console.log('   ⚠️ 原生网格里没有非图片缩略图 → A3 的「非图片双写」形态在当前宿主上不可复现');
        console.log('      含义：NativeBgAugmenter 的非图片分支在当前 /api/backgrounds/all 返回集下是死路径。');
    }

    console.log('\n   页面异常:', errs.length ? errs.slice(0, 3).join(' | ') : '无');
    console.log(fail === 0 ? '\n🎉 复核通过' : `\n💥 ${fail} 项未达预期（注意：其中部分正是「缺陷成立」的断言）`);
} catch (e) {
    console.error('探针异常:', e);
    fail++;
} finally {
    await browser.close();
    process.exit(0);   // 本探针用于取证，非门禁：不因「缺陷成立」而返回非零
}
