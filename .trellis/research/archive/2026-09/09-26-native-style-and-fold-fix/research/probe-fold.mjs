// 一次性验证探针（用后即删）：折叠修复的宿主行为验证
// 针对实际宿主 Luker（Instance/Dev/Luker，127.0.0.1:8003）
//
// 说明：点击采用程序化派发（element.click()）。宿主的处理器是 document 级 jQuery 委托，
// 程序化 click 会正常冒泡并触发它；面板是否处于可见容器内不影响 getComputedStyle(...).display
// 的读数（该值只反映元素自身的 computed display，与祖先可见性无关）。为了让「等价性」可证，
// 同一套断言也在一个原生扩展抽屉上跑一遍作基线对比。
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome');

const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let failures = 0;
function check(name, ok, detail) {
    console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
    if (!ok) failures++;
}

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--autoplay-policy=no-user-gesture-required',
    ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const pageErrors = [];       // 页面 JS 异常（含来源文件）
const httpErrors = [];       // 4xx/5xx 资源（含 URL）
page.on('pageerror', err => pageErrors.push({ msg: err.message, stack: (err.stack || '').split('\n').slice(0, 3).join(' ⏎ ') }));
page.on('response', res => {
    if (res.status() >= 400) httpErrors.push(`${res.status()} ${res.url()}`);
});
page.on('requestfailed', req => httpErrors.push(`FAILED ${req.url()} (${req.failure()?.errorText})`));

const SEL = '#st_bgloader_settings';

/** 读取某个抽屉根元素的当前状态 */
const readState = (sel) => page.evaluate((s) => {
    const root = document.querySelector(s);
    if (!root) return { missing: true };
    const content = root.querySelector('.inline-drawer-content');
    const icon = root.querySelector('.inline-drawer-icon');
    if (!content) return { missing: 'content' };
    const cs = getComputedStyle(content);
    return {
        display: cs.display,
        visible: cs.display !== 'none',
        inlineDisplay: content.style.display || '(none)',
        height: content.style.height || '(auto)',
        iconClass: icon ? icon.className : '(no icon)',
        sectionCount: content.querySelectorAll('.st-bgloader-section').length,
        firstSectionGap: content.querySelector('.st-bgloader-section')
            ? getComputedStyle(content.querySelector('.st-bgloader-section')).marginBottom
            : '(none)',
    };
}, sel);

/** 程序化点击某抽屉的标题栏 */
const clickToggle = (sel) => page.evaluate((s) => {
    const t = document.querySelector(`${s} .inline-drawer-toggle`);
    if (!t) return false;
    t.click();
    return true;
}, sel);

/** 开合 n 轮，返回每轮的 display 序列 */
async function exerciseDrawer(sel, label, rounds) {
    const seq = [];
    for (let i = 0; i < rounds; i++) {
        await clickToggle(sel);
        await sleep(650);
        seq.push((await readState(sel)).display);
        await clickToggle(sel);
        await sleep(650);
        seq.push((await readState(sel)).display);
    }
    console.log(`   ${label} display 序列: ${seq.join(' → ')}`);
    return seq;
}

try {
    console.log('⏳ 打开', TARGET_URL);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.STBgLoader && window.STBgLoader.isInitialized, { timeout: 40000 });
    await sleep(800);

    console.log('\n── A. 结构与静态断言 ──');
    const initial = await readState(SEL);
    check('面板已渲染', !initial.missing, JSON.stringify(initial.missing || ''));
    check('内容区含 13 个分区', initial.sectionCount === 13, `实际 ${initial.sectionCount}`);
    check('分区间距由 CSS margin 承担（替代 flex gap）',
        initial.firstSectionGap === '12px', `marginBottom=${initial.firstSectionGap}`);
    check('扩展未在内容区上写行内 display',
        initial.inlineDisplay === '(none)', `inlineDisplay=${initial.inlineDisplay}`);
    check('初始为折叠态', !initial.visible, `display=${initial.display}`);
    check('初始 height 无残留',
        ['(auto)', '', 'auto'].includes(initial.height), `height=${initial.height}`);

    console.log('\n── B. 扩展面板连续开合 5 轮 ──');
    const extSeq = [];
    for (let round = 1; round <= 5; round++) {
        await clickToggle(SEL);
        await sleep(650);
        const opened = await readState(SEL);
        extSeq.push(opened.display);
        check(`第 ${round} 轮 → 展开`, opened.visible && opened.display === 'block', `display=${opened.display}`);
        check(`第 ${round} 轮展开后图标为展开态（up）`, /\bup\b/.test(opened.iconClass), opened.iconClass);

        await clickToggle(SEL);
        await sleep(650);
        const closed = await readState(SEL);
        extSeq.push(closed.display);
        check(`第 ${round} 轮 → 折叠（核心断言）`, !closed.visible, `display=${closed.display}`);
        check(`第 ${round} 轮折叠后图标为折叠态（down）`, /\bdown\b/.test(closed.iconClass), closed.iconClass);
        check(`第 ${round} 轮折叠后 height 无残留`,
            ['(auto)', '', 'auto'].includes(closed.height), `height=${closed.height}`);
    }
    console.log(`   扩展面板序列: ${extSeq.join(' → ')}`);

    check('5 轮后回到初始态', extSeq[extSeq.length - 1] === initial.display,
        `initial=${initial.display} final=${extSeq[extSeq.length - 1]}`);
    check('序列严格交替（无卡死/无弹回）',
        extSeq.every((d, i) => (i % 2 === 0 ? d === 'block' : d === 'none')),
        extSeq.join(','));

    console.log('\n── C. 与同页面原生抽屉的等价性基线 ──');
    const nativeSel = await page.evaluate((s) => {
        for (const d of document.querySelectorAll('#extensions_settings .inline-drawer')) {
            if (d.closest(s)) continue;
            if (d.querySelector('.inline-drawer-content') && d.querySelector('.inline-drawer-toggle')) {
                d.setAttribute('data-probe-native', 'true');
                return '[data-probe-native="true"]';
            }
        }
        return null;
    }, SEL);
    if (nativeSel) {
        const nativeInitial = await readState(nativeSel);
        const nativeSeq = await exerciseDrawer(nativeSel, '原生抽屉', 3);
        check('原生抽屉初始折叠', nativeInitial.display === 'none', `display=${nativeInitial.display}`);
        check('原生抽屉序列严格交替',
            nativeSeq.every((d, i) => (i % 2 === 0 ? d === 'block' : d === 'none')),
            nativeSeq.join(','));
        check('扩展与原生行为一致（同序列模式）',
            nativeSeq.slice(0, 6).join(',') === extSeq.slice(0, 6).join(','),
            `native=[${nativeSeq.slice(0, 6)}] ext=[${extSeq.slice(0, 6)}]`);

        // 图标类名语义一致性：up=展开态 / down=折叠态，两侧应同构
        const iconParity = await page.evaluate((ext) => {
            const norm = (s) => (/\bup\b/.test(s) ? 'up' : 'down');
            const extIcon = document.querySelector(`${ext} .inline-drawer-icon`)?.className || '';
            const natIcon = document.querySelector('[data-probe-native="true"] .inline-drawer-icon')?.className || '';
            return { ext: norm(extIcon), native: norm(natIcon), extRaw: extIcon, natRaw: natIcon };
        }, SEL);
        console.log('   图标态对比:', JSON.stringify({ ext: iconParity.ext, native: iconParity.native }));
        check('图标态语义与原生一致', iconParity.ext === iconParity.native,
            `ext=${iconParity.ext} native=${iconParity.native}`);
    } else {
        console.log('   ⚠️ 未找到同页面原生抽屉作基线');
    }

    console.log('\n── D. 去溢光断言 ──');
    const glow = await page.evaluate(() => {
        const sels = ['.st-bgloader-media-card.active', '.st-bg-mini-capsule', '.st-bg-mini-btn'];
        const out = {};
        for (const s of sels) {
            const el = document.querySelector(s);
            if (!el) { out[s] = 'not-in-DOM'; continue; }
            out[s] = getComputedStyle(el).boxShadow;
        }
        return out;
    });
    console.log('   box-shadow:', JSON.stringify(glow));
    for (const [k, v] of Object.entries(glow)) {
        if (v === 'not-in-DOM') continue;
        check(`${k} 无投影`, v === 'none', `boxShadow=${v}`);
    }

    console.log('\n── E. 功能未受损 ──');
    const fnOk = await page.evaluate(() => ({
        initialized: !!window.STBgLoader?.isInitialized,
        container: !!document.querySelector('#bg1 .st-bg-media-container'),
        layers: !!document.querySelector('#bg1 .st-bg-layer-a') && !!document.querySelector('#bg1 .st-bg-layer-b'),
        api: typeof window.stBgLoader?.setBackground === 'function',
        miniPlayer: !!document.querySelector('#st_bg_mini_player'),
    }));
    console.log('   运行时状态:', JSON.stringify(fnOk));
    check('媒体挂载与双缓冲完好', fnOk.container && fnOk.layers);
    check('公共 API 完好', fnOk.api);
    check('迷你播放器已渲染', fnOk.miniPlayer);

    console.log('\n── F. 错误归因 ──');
    console.log('   JS 异常:', pageErrors.length ? JSON.stringify(pageErrors, null, 2) : '无');
    console.log('   HTTP 错误:', httpErrors.length ? JSON.stringify(httpErrors, null, 2) : '无');
    // 只把「可归因到本扩展」的错误算作失败：本扩展的产物只有 dist/index.js 与 dist/style.css，
    // 且初始化已成功 —— 其它第三方扩展/宿主自身的报错不属于本次改动的回归范围。
    const ours = [...pageErrors, ...httpErrors].filter(e => {
        const s = typeof e === 'string' ? e : JSON.stringify(e);
        return /ST-BgLoader|st_bgloader|st-bg-loader/i.test(s);
    });
    check('本扩展自身无错误', ours.length === 0, ours.join(' | '));
    console.log(`   （宿主/其它扩展的错误 ${pageErrors.length + httpErrors.length - ours.length} 条，已隔离，不计入回归）`);

    console.log(failures === 0 ? '\n🎉 全部通过' : `\n💥 ${failures} 项失败`);
} catch (err) {
    console.error('探针异常:', err);
    failures++;
} finally {
    await browser.close();
    process.exit(failures === 0 ? 0 : 1);
}
