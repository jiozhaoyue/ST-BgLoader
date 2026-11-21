/**
 * 禁用宿主里的旧上游插件 Extension-VideoBackgroundLoader（与本仓功能域重叠，
 * 双加载/事件冲突风险——Session 26 Test 15 双 fx 画布假失败前科）。
 * 走宿主正规路径：内存 disabledExtensions 增补 → saveSettingsDebounced 收敛。
 * 用法：node tests/disable-legacy-loader.mjs   （需 Dev 实例在线）
 * 环境：TEST_TARGET_URL（默认 https://localhost:8003）
 */
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://localhost:8003/';
const LEGACY_ID = 'third-party/Extension-VideoBackgroundLoader';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox'],
});

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
    // 等宿主 context 与完整版扩展设置就绪（轻量首屏的 disabledExtensions 是空数组，
    // 会被 full settings 整体替换——必须等 length >= 5 的完整版特征出现再操作）
    await page.waitForFunction(() => {
        const ctx = window.SillyTavern?.getContext?.();
        return !!ctx && Array.isArray(ctx.extensionSettings?.disabledExtensions)
            && ctx.extensionSettings.disabledExtensions.length >= 5;
    }, { timeout: 40000, polling: 500 });

    const result = await page.evaluate((legacyId) => {
        const ctx = window.SillyTavern.getContext();
        const arr = ctx.extensionSettings.disabledExtensions;
        if (arr.includes(legacyId)) {
            return { changed: false, note: 'already-disabled', count: arr.length };
        }
        arr.push(legacyId);
        if (typeof ctx.saveSettingsDebounced === 'function') ctx.saveSettingsDebounced();
        return { changed: true, count: arr.length };
    }, LEGACY_ID);

    console.log(`📋 disabledExtensions 处置结果: ${JSON.stringify(result)}`);

    // 落盘确认：等收敛写盘后再读回（saveSettingsDebounced 是去抖的，给足落盘窗口）
    if (result.changed) {
        await new Promise(r => setTimeout(r, 2500));
        const persisted = await page.evaluate(async (legacyId) => {
            // 服务端读回：宿主 settings API 属正规收敛路径
            const ctx = window.SillyTavern.getContext();
            return { inMemory: ctx.extensionSettings.disabledExtensions.includes(legacyId) };
        }, LEGACY_ID);
        console.log(`📋 内存态确认: ${JSON.stringify(persisted)}`);
        if (!persisted.inMemory) {
            console.error('❌ 禁用未在内存生效');
            process.exitCode = 1;
        } else {
            console.log('✅ 旧插件已禁用（内存态）。服务端落盘以 settings.json 下次收敛为准。');
        }
    }
} catch (err) {
    console.error('❌ 禁用流程失败：', err);
    process.exitCode = 1;
} finally {
    await browser.close();
}
