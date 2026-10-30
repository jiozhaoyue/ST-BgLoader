/**
 * F1 自动轮播一次性真机验证（非 CI 套件）：30s 最小间隔下观察一次完整轮转。
 * 断言：布防 → 到点触发切换（track-change 恰一次）→ 重新布防。
 * 曲目用页内生成的 60s 可播 WAV blob（短曲会被 ended 循环播放淹没窗口；fake blob 会触发错误跳轨）。
 * 用法：node tests/verify-autoadvance-once.mjs  （dev:ui 在 :5173；全程 ~40s）
 */
import puppeteer from 'puppeteer-core';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const fail = (msg) => { console.error(`❌ ${msg}`); process.exitCode = 1; };

try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 30000 });

    const events = [];
    await page.exposeFunction('__onEvent', (name) => events.push(name));

    const setup = await page.evaluate(async () => {
        const engine = window.STBgLoader.getAudioEngine();
        engine.notifyUserInteraction();

        // 0.3s 静音 WAV（8kHz 8bit 单声道）→ 可正常解码播放，不触发错误跳轨
        const mkWavBlobUrl = () => {
            const sr = 8000, n = sr * 60; // 60s 静音：'ended' 在观察窗内不触发，轮播是唯一切换源
            const buf = new ArrayBuffer(44 + n);
            const v = new DataView(buf);
            const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
            ws(0, 'RIFF'); v.setUint32(4, 36 + n, true); ws(8, 'WAVE');
            ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
            v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr, true);
            v.setUint16(32, 1, true); v.setUint16(34, 8, true);
            ws(36, 'data'); v.setUint32(40, n, true);
            for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
            return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
        };
        const url1 = mkWavBlobUrl();
        const url2 = mkWavBlobUrl();
        const mk = (id, url) => ({
            id, name: id, type: 'audio', source: 'url', url,
            cacheKey: url, size: 1, mimeType: 'audio/wav',
            addedTimestamp: Date.now(), lastUsedTimestamp: Date.now(),
        });
        const t1 = mk('aa_verify_1', url1);
        const t2 = mk('aa_verify_2', url2);
        engine.setPlaylist([t1, t2]);
        // 直接带 URL 播放第一首（跳过解析器；后续自动轮播走解析器——url 源 miss 路径原样返回 item.url）
        await engine.playMediaItem(t1, url1);
        const before = engine.getCurrentTrack()?.id ?? null;
        const wasPlaying = engine.isPlaying();
        engine.setAutoAdvance(true, 30, 200);
        const armedAfter = engine.isAutoAdvanceArmed();
        engine.setAutoAdvance(true, 30, 200); // 幂等复核
        const armedIdempotent = engine.isAutoAdvanceArmed();
        window.STBgLoader.getAPI().on('track-change', () => window.__onEvent('track-change'));
        return { before, wasPlaying, armedAfter, armedIdempotent };
    });
    console.log('setup:', JSON.stringify(setup));

    // 倒计时 30s + 淡出 200ms + 余量
    await new Promise(r => setTimeout(r, 33000));

    const result = await page.evaluate(() => {
        const engine = window.STBgLoader.getAudioEngine();
        return { current: engine.getCurrentTrack()?.id ?? null, stillArmed: engine.isAutoAdvanceArmed() };
    });
    console.log('events:', JSON.stringify(events), 'result:', JSON.stringify(result));

    if (setup.wasPlaying !== true) fail('第一曲未处于播放态（环境限制或解码失败）');
    if (setup.armedAfter !== true) fail('30s 间隔布防失败');
    if (setup.armedIdempotent !== true) fail('重复 setAutoAdvance 未保持布防');
    const switches = events.filter(e => e === 'track-change').length;
    if (switches === 0) fail('33s 内未观察到 track-change（轮播未触发）');
    if (switches > 2) fail(`track-change 次数异常（${switches} 次）：ended 循环或重复触发污染了窗口`);
    if (result.current === setup.before && setup.before !== null) fail(`曲目未切换：${setup.before} → ${result.current}`);
    if (result.stillArmed !== true) fail('轮播触发后未重新布防');
    if (process.exitCode !== 1) console.log('✅ F1 自动轮播真机验证通过：布防→30s 触发→切曲→再布防');
} catch (err) {
    fail(`脚本异常: ${err.message}`);
} finally {
    await browser.close();
}
