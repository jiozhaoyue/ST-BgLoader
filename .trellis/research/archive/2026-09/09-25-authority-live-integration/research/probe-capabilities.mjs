/**
 * 一次性真后端能力探针 2：KV 读写往返 + agent.browser 存在性与 registerTools 真实判定。
 * 用后可删（不入库产品代码）。
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
        const out = { kv: null, agent: null };
        const bridge = window.STBgLoader.getAuthorityBridge();
        await bridge.detectAndInit();
        const client = bridge.getClient();
        if (!client) return { error: 'no client', caps: bridge.getCapabilities() };

        // 1) KV write/read/delete round-trip (probe key in our isolated extension domain)
        try {
            await client.storage.kv.set('probe:roundtrip', { v: 42, at: Date.now() });
            const back = await client.storage.kv.get('probe:roundtrip');
            await client.storage.kv.delete('probe:roundtrip');
            const after = await client.storage.kv.get('probe:roundtrip');
            out.kv = { setOk: true, readBack: back?.v, deleted: after === undefined || after === null };
        } catch (e) { out.kv = { error: String(e) }; }

        // 2) agent surface presence + registerTools real verdict (declared target only)
        const api = client?.agent?.browser ?? null;
        out.agent = { surfacePresent: !!api };
        if (api) {
            try {
                const r = await Promise.race([
                    api.registerTools({
                        browserInstanceId: 'st-bgloader-main',
                        leaseDurationMs: 30000,
                        tools: [{
                            id: 'stbg_probe_tool',
                            title: 'probe',
                            description: 'probe',
                            inputSchema: { type: 'object', properties: {} },
                            riskLevel: 'low',
                            approvalPolicy: 'never',
                            mutatesWorkspace: false,
                        }],
                    }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('probe register timed out after 20s')), 20000)),
                ]);
                out.agent.register = { ok: true, registrationId: r?.registrationId, leaseExpiresAt: r?.leaseExpiresAt };
            } catch (e) {
                out.agent.register = { ok: false, error: String(e), name: e?.name, status: e?.status, category: e?.category };
            }
        }

        // 3) wait for the plugin's own registration outcome to land (bridge reports it into caps)
        for (let i = 0; i < 50; i++) {
            const c = bridge.getCapabilities();
            if (c.agentToolsState && c.agentToolsState !== 'unknown') break;
            await new Promise(r => setTimeout(r, 500));
        }
        out.pluginOutcome = bridge.getCapabilities();
        out.agentToolsEnabled = window.STBgLoader.getSettings().agentToolsEnabled;
        return out;
    });
    console.log('CAPS_PROBE_RESULT', JSON.stringify(result, null, 2));
} finally {
    await browser.close();
}
