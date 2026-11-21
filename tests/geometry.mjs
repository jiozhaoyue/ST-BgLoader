/**
 * 几何断言（裁决项 E1/E2）：无头连接 Dev 预览台，断言关键控件无横向溢出、
 * 复选框在其容器内垂直居中（±2px）。失败输出具体元素与几何读数。
 * 用法：node tests/geometry.mjs
 * 需 HARNESS_URL（默认 http://localhost:5173/）可达。
 * 说明：溢出与居中都允许 TOLERANCE 容差；隐藏元素（display:none / hidden /
 * 零尺寸）不参与采样，避免折叠区产生伪失败。宽窄两档视口各采样一次。
 */
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.HARNESS_URL || 'http://localhost:5173/';
const TOLERANCE = 2; // px：溢出与居中的容差
const VIEWPORTS = [
    { width: 1360, height: 900 },
    { width: 375, height: 700 },
];

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const settle = (page, ms) => page.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms);

/** 在页面内收集几何读数，纯读取不改动任何状态。 */
const collect = (page) => page.evaluate((tol) => {
    const describe = (el) => {
        let s = el.tagName.toLowerCase();
        if (el.id) s += `#${el.id}`;
        const cls = Array.from(el.classList || [])
            .filter((c) => c.startsWith('st-bgloader') || c.startsWith('st-bg-') || c === 'active' || c.startsWith('menu_button'));
        if (cls.length) s += `.${cls.join('.')}`;
        return s;
    };
    const visible = (el) => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.hidden;
    };
    const out = { overflow: [], checks: [], touch: [], panelCount: 0, drawerCount: 0 };

    // 1) 关键容器：面板、抽屉、工具行、标签栏、复选框栈等
    const overflowSelectors = [
        '.st-bgloader-panel',
        '#st_bgloader_topbar_panel',
        '.st-bgloader-topbar-panel',
        '#Backgrounds',
        '.st-bgloader-topbar-header',
        '.st-bgloader-tab-bar',
        '.st-bgloader-tab-content.active',
        '.st-bgloader-toolbar-row',
        '.st-bgloader-scene-bar',
        '.st-bgloader-preset-row',
        '.st-bgloader-check-stack',
        '.st-bgloader-group-head',
        '.st-bgloader-media-grid',
        '.st-bgloader-master-card',
        '.st-bgloader-master-actions',
    ];
    const seen = new Set();
    overflowSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            if (sel === '.st-bgloader-panel') out.panelCount += 1;
            if (sel === '#Backgrounds') out.drawerCount += 1;
            if (!visible(el)) return;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const diff = el.scrollWidth - el.clientWidth;
            out.overflow.push({
                sel: describe(el),
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                diff,
                passed: diff <= tol,
            });
        });
    });

    // 2) 复选框：在 label.st-bgloader-check 内容盒内垂直居中（flex align-items:center）
    document.querySelectorAll('.st-bgloader-check input[type=checkbox]').forEach((cb) => {
        const container = cb.closest('.st-bgloader-check') || cb.parentElement;
        if (!container || !visible(container)) return;
        const cbRect = cb.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        if (cbRect.height === 0 || cRect.height === 0) return;
        const cbCenterY = cbRect.top + cbRect.height / 2;
        const cCenterY = cRect.top + cRect.height / 2;
        const deltaY = Math.abs(cbCenterY - cCenterY);
        out.checks.push({
            sel: describe(cb),
            container: describe(container),
            cbTop: +cbRect.top.toFixed(1),
            cbHeight: +cbRect.height.toFixed(1),
            containerTop: +cRect.top.toFixed(1),
            containerHeight: +cRect.height.toFixed(1),
            centerDeltaY: +deltaY.toFixed(2),
            passed: deltaY <= tol,
        });
    });
    // 3) 触摸目标：Tab 按钮 / 顶栏快捷钮 / mini 播放器按钮，getBoundingClientRect 高度
    //    必须 ≥ --st-touch-min（缺省 36px）。失败输出元素描述与实际高度。
    const panel = document.querySelector('.st-bgloader-panel') || document.documentElement;
    const rawMin = getComputedStyle(panel).getPropertyValue('--st-touch-min').trim();
    const touchMin = Number.parseFloat(rawMin) || 36;
    const touchSelectors = [
        '.st-bgloader-tab-btn',
        '.st-bgloader-topbar-actions .menu_button',
        '.st-bgloader-scene-bar .menu_button',
        '.st-bgloader-toolbar-row .menu_button',
        '.st-bg-mini-btn',
    ];
    const touchSeen = new Set();
    touchSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
            if (touchSeen.has(el)) return;
            touchSeen.add(el);
            if (!visible(el)) return;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return;
            const height = +rect.height.toFixed(1);
            out.touch.push({
                sel: describe(el),
                height,
                min: touchMin,
                passed: height >= touchMin,
            });
        });
    });
    return out;
}, TOLERANCE);

let failed = false;

try {
    for (const vp of VIEWPORTS) {
        const tag = `${vp.width}x${vp.height}`;
        const page = await browser.newPage();
        try {
            await page.setViewport(vp);
            // 用 domcontentloaded 而非 networkidle2：Vite dev 的 HMR 长连接会让
            // networkidle2 永远不达成（实测卡死），这是与 screenshot-night.mjs 的关键差异。
            await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
            // 双重兜底：API 初始化标志 或 插件元素已挂载（预览台已验证两种路径都可达）。
            await page.waitForFunction(
                () => window.STBgLoader?.isInitialized === true
                    || document.querySelectorAll('[id^="st_bgloader"]').length >= 5,
                { timeout: 30000, polling: 500 },
            );
            await settle(page, 500);

            // 顶栏抽屉面板在点击开关后才挂载
            await page.click('#backgrounds-drawer-toggle');
            await settle(page, 700);

            // 切到设置区并展开全部折叠组，让组内控件进入可视布局
            await page.evaluate(() => {
                document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]')?.click();
                document.querySelectorAll('.st-bgloader-group-head[aria-expanded="false"]').forEach((h) => h.click());
                // mini 胶囊默认 hidden 态带 scale(0.96)，会让 getBoundingClientRect 量到
                // 缩放后的 34.56px（伪失败）；切到 visible 态再采样其按钮的真实触摸尺寸。
                document.querySelector('#st_bg_mini_player')?.classList.replace('hidden', 'visible');
            });
            await settle(page, 400);

            const data = await collect(page);
            console.log(`\n===== 视口 ${tag} =====`);
            console.log(`面板锚点 .st-bgloader-panel: ${data.panelCount}，宿主抽屉 #Backgrounds: ${data.drawerCount}`);
            console.log(`溢出采样 ${data.overflow.length} 项，复选框采样 ${data.checks.length} 项，触摸目标采样 ${data.touch.length} 项`);

            const badOverflow = data.overflow.filter((r) => !r.passed);
            if (badOverflow.length === 0) {
                console.log(`✅ 无横向溢出（scrollWidth<=clientWidth+${TOLERANCE}，${data.overflow.length}/${data.overflow.length}）`);
            } else {
                failed = true;
                badOverflow.forEach((r) => {
                    console.log(`❌ 溢出 ${r.sel}: scrollWidth=${r.scrollWidth} clientWidth=${r.clientWidth} diff=${r.diff}px > ${TOLERANCE}px`);
                });
            }

            const badChecks = data.checks.filter((r) => !r.passed);
            if (data.checks.length === 0) {
                failed = true;
                console.log('❌ 未采样到任何复选框，断言覆盖不足');
            } else if (badChecks.length === 0) {
                console.log(`✅ 复选框垂直居中（±${TOLERANCE}px，${data.checks.length}/${data.checks.length}）`);
            } else {
                failed = true;
                badChecks.forEach((r) => {
                    console.log(`❌ 未居中 ${r.sel} @ ${r.container}: cbTop=${r.cbTop} cbH=${r.cbHeight} containerTop=${r.containerTop} containerH=${r.containerHeight} centerDeltaY=${r.centerDeltaY}px > ${TOLERANCE}px`);
                });
            }

            const badTouch = data.touch.filter((r) => !r.passed);
            const touchMin = data.touch[0]?.min ?? 36;
            if (data.touch.length === 0) {
                failed = true;
                console.log('❌ 未采样到任何触摸目标，断言覆盖不足');
            } else if (badTouch.length === 0) {
                console.log(`✅ 触摸目标高度 ≥${touchMin}px（${data.touch.length}/${data.touch.length}）`);
            } else {
                failed = true;
                badTouch.forEach((r) => {
                    console.log(`❌ 触摸目标过小 ${r.sel}: 实际高度=${r.height}px < ${r.min}px（--st-touch-min）`);
                });
            }
        } finally {
            await page.close();
        }
    }
    console.log(`\n===== 几何断言${failed ? '失败' : '全绿'} =====`);
    if (failed) process.exitCode = 1;
} catch (err) {
    console.error('❌ 几何断言脚本异常:', err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
