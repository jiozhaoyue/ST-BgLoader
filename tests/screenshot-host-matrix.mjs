/**
 * 真机宿主全形态 × 全分辨率截图矩阵（Dev Luker :8003）。
 * 用法：node tests/screenshot-host-matrix.mjs  （需 Dev Luker 在 :8003 且插件已启用）
 * 产物：tests/e2e-artifacts/host-matrix-<视口>-<形态>.png
 * 断点依据：Session 28 定案的 1000 / 450 响应式断点；320 为极窄下限探底。
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'e2e-artifacts');
mkdirSync(outDir, { recursive: true });

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.HOST_URL || 'https://localhost:8003/';

const VIEWPORTS = [
    { tag: '1360x900', width: 1360, height: 900 },
    { tag: '1000x800', width: 1000, height: 800 },
    { tag: '450x800', width: 450, height: 800 },
    { tag: '320x700', width: 320, height: 700 },
];

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const settle = (page, ms) => page.evaluate(t => new Promise(r => setTimeout(r, t)), ms);
const shot = async (page, tag, form) => {
    await page.screenshot({ path: join(outDir, `host-matrix-${tag}-${form}.png`) });
    console.log(`📷 host-matrix-${tag}-${form}.png`);
};

const pageErrors = [];
let shotCount = 0;

try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

    // 一次性登录首屏（自签证书已在 launch 参数豁免；Luker 可能跳转登录页）
    await page.setViewport({ width: 1360, height: 900 });
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await settle(page, 2000);

    const cur = page.url();
    if (/login/i.test(cur)) {
        console.log(`⚠️ 页面被重定向到登录页：${cur}（本矩阵要求免登录 Dev 环境，终止）`);
        await browser.close();
        process.exit(2);
    }

    // 等插件初始化（宿主自动激活后 window.STBgLoader 挂 API；元素兜底）
    try {
        await page.waitForFunction(
            () => window.STBgLoader?.isInitialized === true || document.querySelectorAll('[id^="st_bgloader"]').length >= 5,
            { timeout: 40000, polling: 500 },
        );
    } catch {
        console.log('❌ 插件未在 40s 内初始化（元素与 API 均未出现）——被测物身份或启用状态异常');
        await page.screenshot({ path: join(outDir, 'host-matrix-init-failure.png') });
        await browser.close();
        process.exit(3);
    }
    // mount 链（#Backgrounds 内嵌面板）在 init 后约 2-4s 才就绪（实测 4.4s 内），稳定窗等 4s
    await settle(page, 4000);
    // 关闭宿主侧公告/更新弹窗，避免遮挡后续形态截图
    await page.evaluate(() => {
        document.querySelectorAll('.popup button').forEach((b) => {
            const t = (b.textContent || '').trim();
            if (t === '我知道了' || t === '稍后' || t === '×') b.click();
        });
    });
    await settle(page, 600);

    for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await settle(page, 600);

        // 形态 1：主界面
        await shot(page, vp.tag, '01-main');
        shotCount += 1;

        // 形态 2：原生抽屉 + 插件增强式内嵌（先关再开，保证状态干净）
        await page.evaluate(() => {
            const t = document.querySelector('#backgrounds-drawer-toggle');
            if (t && !t.closest('.drawer-content')?.classList.contains('openDrawer')) t.click();
        });
        await settle(page, 900);
        await shot(page, vp.tag, '02-bg-drawer');
        shotCount += 1;

        // 形态 2b：滚动到插件面板（增强式内嵌挂载在原生内容之后，视口内需滚动到位）
        await page.evaluate(() => {
            const panel = document.querySelector('#st_bgloader_topbar_panel');
            panel?.scrollIntoView({ block: 'start' });
        });
        await settle(page, 700);
        await shot(page, vp.tag, '02b-plugin-panel');
        shotCount += 1;

        // 形态 3：插件面板 Tab=设置（展开全部折叠组）
        await page.evaluate(() => {
            const btn = document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]');
            btn?.click();
            document.querySelectorAll('#st_tab_settings .st-bgloader-group-head').forEach((h) => h.click());
        });
        await settle(page, 600);
        await shot(page, vp.tag, '03-panel-settings');
        shotCount += 1;

        // 形态 4：插件面板 Tab=媒体（懒挂载网格）
        await page.evaluate(() => {
            const btn = document.querySelector('.st-bgloader-tab-btn[data-tab="media"], .st-bgloader-tab-btn:not([data-tab="settings"])');
            btn?.click();
        });
        await settle(page, 900);
        await shot(page, vp.tag, '04-panel-media');
        shotCount += 1;

        // 形态 5：关闭抽屉回到主界面
        await page.evaluate(() => {
            const t = document.querySelector('#backgrounds-drawer-toggle');
            t?.click();
        });
        await settle(page, 600);
    }

    console.log(`✅ 矩阵完成：${shotCount} 张（${VIEWPORTS.map(v => v.tag).join(' / ')} × 4 形态）`);
    if (pageErrors.length) {
        console.log(`⚠️ 页面脚本错误 ${pageErrors.length} 条：`);
        for (const e of [...new Set(pageErrors)].slice(0, 10)) console.log(`   - ${e}`);
        process.exitCode = 4;
    }
} catch (err) {
    console.error('❌ 矩阵执行失败：', err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
