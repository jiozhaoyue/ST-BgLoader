/**
 * 多视口矩阵截图（裁决项 E3）：四档视口 × 三处覆盖区，落盘 tests/e2e-artifacts。
 * 连接姿势、浏览器启动参数与 tests/screenshot-night.mjs 完全一致（puppeteer-core
 * 无头 CDP，headless:'new'，CHROME_PATH 环境变量回退默认路径）。
 * 用法：node tests/ui-shot-matrix.mjs
 * 需 HARNESS_URL（默认 http://localhost:5173/）可达。
 * 产物：tests/e2e-artifacts/matrix-{视口}-{区域}.png，共 4×3=12 张。
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
const TARGET_URL = process.env.HARNESS_URL || 'http://localhost:5173/';

const VIEWPORTS = [
    { width: 1360, height: 900 },
    { width: 1000, height: 800 },
    { width: 450, height: 800 },
    { width: 375, height: 700 },
];

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const settle = (page, ms) => page.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms);
const shot = async (page, name) => {
    await page.screenshot({ path: join(outDir, `matrix-${name}.png`) });
    console.log(`📷 matrix-${name}.png`);
};

let failed = false;

try {
    for (const vp of VIEWPORTS) {
        const tag = `${vp.width}x${vp.height}`;
        // 每档视口独立 page，避免抽屉开关/标签状态跨视口串扰
        const page = await browser.newPage();
        try {
            await page.setViewport(vp);
            // domcontentloaded + 双重兜底：Vite HMR 长连接会让 networkidle2 永不达成。
            await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
            await page.waitForFunction(
                () => window.STBgLoader?.isInitialized === true
                    || document.querySelectorAll('[id^="st_bgloader"]').length >= 5,
                { timeout: 30000, polling: 500 },
            );
            await settle(page, 700);

            // 区域 1：主视图（聊天 + 抽屉按钮，抽屉未打开）
            await shot(page, `${tag}-01-main`);

            // 区域 2：顶栏抽屉（媒体标签默认态）
            await page.click('#backgrounds-drawer-toggle');
            await settle(page, 900);
            await shot(page, `${tag}-02-drawer`);

            // 区域 3：设置区（展开全部折叠组，滚到设置面板顶部）
            await page.evaluate(() => {
                document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]')?.click();
                document.querySelectorAll('.st-bgloader-group-head[aria-expanded="false"]').forEach((h) => h.click());
            });
            await settle(page, 500);
            await page.evaluate(() => {
                document.querySelector('#st_bgloader_topbar_panel')?.scrollIntoView({ block: 'start' });
            });
            await settle(page, 300);
            await shot(page, `${tag}-03-settings`);
        } catch (err) {
            failed = true;
            console.error(`❌ 视口 ${tag} 截图失败:`, err);
        } finally {
            await page.close();
        }
    }
    console.log(`\n===== 矩阵截图${failed ? '部分失败' : '完成'} =====`);
    if (failed) process.exitCode = 1;
} catch (err) {
    console.error('❌ 矩阵截图脚本异常:', err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
