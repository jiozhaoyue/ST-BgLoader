/**
 * 一次性探针 3：完整 agent.browser 授权流 —— 启用 → 等待 Authority 权限弹窗 → 点击「始终允许」→
 * 轮询能力位落定为 ok。验证注册/claim 全链路。用后可删。
 */
import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.CHROME_PATH
    || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const TARGET_URL = process.env.TEST_TARGET_URL || 'https://127.0.0.1:8003';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
});
try {
    const page = await browser.newPage();
    page.on('console', m => { const t = m.text(); if (/ST-BgLoader|authority/i.test(t)) console.log('[console]', t.slice(0, 260)); });
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => !!window.STBgLoader, { timeout: 60000 });

    const result = await page.evaluate(async () => {
        const out = { steps: [] };
        const bridge = window.STBgLoader.getAuthorityBridge();
        await bridge.detectAndInit();
        out.steps.push(['init', bridge.getCapabilities().agentToolsState]);

        const wasEnabled = window.STBgLoader.getSettings().agentToolsEnabled;
        window.STBgLoader.getSettings().agentToolsEnabled = true;
        window.STBgLoader.saveSettings();
        window.STBgLoader.syncAgentTools();
        out.steps.push(['enabled (was ' + wasEnabled + ')']);

        // 等待授权弹窗出现并点击「始终允许」（ST Popup 按钮是 DIV.result-control，不是 <button>）
        let clicked = false;
        for (let i = 0; i < 20 && !clicked; i++) {
            await new Promise(r => setTimeout(r, 500));
            clicked = await (function () {
                const controls = [...document.querySelectorAll('.popup .result-control')];
                const allow = controls.find(b => (b.textContent || '').includes('始终允许'));
                if (allow) { allow.click(); return true; }
                return false;
            })();
        }
        out.steps.push(['prompt clicked', clicked]);

        // 轮询能力位落定（注册成功或明确失败；pending 窗口 2min 内应被授权解除）
        for (let i = 0; i < 90; i++) {
            const c = bridge.getCapabilities();
            if (c.agentToolsState === 'ok' || c.agentToolsState === 'blocked') { out.finalCaps = c; break; }
            await new Promise(r => setTimeout(r, 1000));
        }
        out.finalCaps = out.finalCaps || bridge.getCapabilities();

        // 注册成功后 claim 循环应已在工作：直接做一次 claim 语义验证（无 invocation 属正常）
        const client = bridge.getClient();
        try {
            const r = await Promise.race([
                client.agent.browser.claim({ browserInstanceId: 'st-bgloader-main', claimId: 'probe-claim-' + Date.now() }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('claim timed out')), 10000)),
            ]);
            out.claimProbe = { ok: true, invocation: r.invocation };
        } catch (e) {
            out.claimProbe = { ok: false, error: String(e) };
        }

        // 恢复原开关
        window.STBgLoader.getSettings().agentToolsEnabled = wasEnabled;
        window.STBgLoader.saveSettings();
        window.STBgLoader.syncAgentTools();
        out.steps.push(['restored to ' + wasEnabled]);
        return out;
    });
    console.log('PERMISSION_FLOW_RESULT', JSON.stringify(result, null, 2));
} finally {
    await browser.close();
}
