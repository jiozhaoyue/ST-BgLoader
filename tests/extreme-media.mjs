/**
 * 极端媒体实测套件（夜间改进批 R4）。
 *
 * 10 类语料全部走扩展真实管线（saveMedia → setBackground → 渲染层），逐类截图：
 *   c1  超大图片（~6000×4000 PNG，几十 MB）
 *   c2  真实编解码视频（MediaRecorder 录制 webm）
 *   c3  零字节 PNG
 *   c4  损坏 JPEG（合法头 + 随机字节）——预期：渲染层 error → media-error 事件 + 不白屏不挂死
 *   c5  截断 webm（取真实 webm 前 30%）——同上预期容错
 *   c6  伪装扩展名（.png 实为文本 / .jpg 实为 PNG 内容）
 *   c7  Unicode + 超长文件名（中文/emoji/200+ 字符）
 *   c8  超长音频（1 小时 8kHz 单声道 WAV ≈ 56MB）
 *   c9  SVG 含脚本 + HTML canvas 动画（iframe 沙箱渲染）
 *   c10 快速切换序列（10 项 × 300ms，双缓冲与状态一致性）
 *
 * 用法：node tests/extreme-media.mjs
 * 产物：tests/e2e-artifacts/extreme/<case>.png + extreme-media-report.json
 * 卫生：结束前删除全部 xm_ 前缀测试条目并复原初始背景状态（探针零残留）。
 */
import puppeteer from 'puppeteer-core';
import { ensureExtensionLoaded } from './lib/ensure-extension.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests', 'e2e-artifacts', 'extreme');
mkdirSync(outDir, { recursive: true });

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = process.env.TEST_TARGET_URL || process.env.TARGET_URL || 'https://localhost:8003';

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required',
        '--js-flags=--max-old-space-size=4096',
    ],
});

const results = [];
const report = (r) => { results.push(r); console.log(`${r.pass ? '✅' : '❌'} [${r.id}] ${r.title}${r.note ? ' — ' + r.note : ''}`); };

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push(e.message));

    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await ensureExtensionLoaded(page);
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 35000 });
    console.log('扩展已装载，开始极端媒体测试。');

    // 记录初始背景，测试结束复原（探针零残留）
    const initial = await page.evaluate(() => ({
        activeMediaId: window.STBgLoader.getSettings().activeMediaId,
    }));

    // 安装 media-error 事件收集器 + 上传登记表（清理以此为准，保证零残留）
    await page.evaluate(() => {
        window.__xmErrors = [];
        window.__xmCreated = [];
        window.STBgLoader.getAPI().on('media-error', (e) => window.__xmErrors.push(e));
    });

    // 预清扫：上一轮中断可能遗留 xm_ 条目
    {
        const stale = await page.evaluate(async () => {
            const items = await window.STBgLoader.getAPI().getMediaList();
            return items.filter(i => i.name.startsWith('xm_')).map(i => i.id);
        });
        for (const id of stale) {
            await page.evaluate(async (itemId) => {
                try { await window.STBgLoader.cacheManager.deleteMedia(itemId); } catch { /* 尽力清扫 */ }
            }, id);
        }
        if (stale.length) console.log(`预清扫：删除残留 ${stale.length} 条 xm_ 条目。`);
    }

    // ---------- 页内工具 ----------
    // 上传（走 saveMedia 真实管线）并应用为背景；返回 {itemId, errorEvents}
    await page.evaluate(() => {
        window.__xmUpload = async (name, type, blobOrString) => {
            const ext = window.STBgLoader;
            const blob = typeof blobOrString === 'string'
                ? new Blob([blobOrString], { type: type === 'svg' ? 'image/svg+xml' : 'text/html' })
                : blobOrString;
            const item = await ext.cacheManager.saveMedia(blob, name, type, 'server');
            window.__xmCreated.push(item.id);
            await ext.publicApi.setBackground(item.id);
            return item.id;
        };
    });

    const settle = (ms) => page.evaluate((t) => new Promise(r => setTimeout(r, t)), ms);
    const shot = async (name) => page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
    const grabErrors = () => page.evaluate(() => window.__xmErrors.splice(0));
    const layerState = () => page.evaluate(() => {
        const a = document.querySelector('#bg1 .st-bg-layer-a');
        const b = document.querySelector('#bg1 .st-bg-layer-b');
        const count = (el) => el ? el.children.length : -1;
        const activeOpacity = () => {
            const oa = a ? parseFloat(getComputedStyle(a).opacity) : -1;
            const ob = b ? parseFloat(getComputedStyle(b).opacity) : -1;
            return Math.max(oa, ob);
        };
        return { aChildren: count(a), bChildren: count(b), activeOpacity: activeOpacity(), containerDisplay: getComputedStyle(document.querySelector('#bg1 .st-bg-media-container')).display };
    });
    const deleteItem = (id) => page.evaluate(async (itemId) => {
        try { await window.STBgLoader.cacheManager.deleteMedia(itemId); return true; } catch { return false; }
    }, id);

    // ---------- c1 超大图片 ----------
    {
        const itemId = await page.evaluate(async () => {
            const c = document.createElement('canvas');
            c.width = 6000; c.height = 4000;
            const g = c.getContext('2d');
            const grad = g.createLinearGradient(0, 0, 6000, 4000);
            grad.addColorStop(0, '#0b1026'); grad.addColorStop(1, '#7f5af0');
            g.fillStyle = grad; g.fillRect(0, 0, 6000, 4000);
            for (let i = 0; i < 400; i++) {
                g.fillStyle = `hsla(${i}, 80%, 60%, 0.25)`;
                g.beginPath();
                g.arc(Math.random() * 6000, Math.random() * 4000, 30 + Math.random() * 120, 0, Math.PI * 2);
                g.fill();
            }
            const blob = await new Promise(r => c.toBlob(r, 'image/png'));
            return window.__xmUpload('xm_c1_huge_canvas.png', 'image', blob);
        });
        await settle(6000);
        const st = await layerState();
        const errs = await grabErrors();
        await shot('c1-huge-image');
        report({ id: 'c1', title: '超大图片 ~6000×4000 PNG', pass: st.activeOpacity === 1 && st.containerDisplay === 'block' && errs.length === 0, note: `opacity=${st.activeOpacity}`, itemId });
    }

    // ---------- c2 真实视频（MediaRecorder webm）----------
    {
        const itemId = await page.evaluate(async () => {
            const c = document.createElement('canvas');
            c.width = 1280; c.height = 720;
            const g = c.getContext('2d');
            const stream = c.captureStream(30);
            const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];
            rec.ondataavailable = e => chunks.push(e.data);
            rec.start(200);
            const t0 = performance.now();
            await new Promise(done => {
                const draw = () => {
                    const t = (performance.now() - t0) / 1000;
                    g.fillStyle = `hsl(${(t * 60) % 360}, 70%, 30%)`;
                    g.fillRect(0, 0, 1280, 720);
                    g.fillStyle = '#fff';
                    g.font = '80px sans-serif';
                    g.fillText(`EXTREME ${t.toFixed(1)}s`, 300, 380);
                    if (t < 8) requestAnimationFrame(draw); else { rec.stop(); done(); }
                };
                draw();
            });
            const blob = new Blob(chunks, { type: 'video/webm' });
            return window.__xmUpload('xm_c2_recorded.webm', 'video', blob);
        });
        await settle(8000);
        const st = await layerState();
        const errs = await grabErrors();
        await shot('c2-video-webm');
        report({ id: 'c2', title: 'MediaRecorder 8s webm 视频', pass: st.activeOpacity >= 1 && errs.length === 0, note: `opacity=${st.activeOpacity}`, itemId });
    }

    // ---------- c3 零字节 PNG ----------
    {
        const itemId = await page.evaluate(async () => {
            const blob = new Blob([], { type: 'image/png' });
            return window.__xmUpload('xm_c3_zero.png', 'image', blob);
        });
        await settle(4000);
        const st = await layerState();
        const errs = await grabErrors();
        await shot('c3-zero-byte');
        // 期望：不挂死、状态可恢复（容器仍可见），允许 media-error（图像解码失败）
        report({ id: 'c3', title: '零字节 PNG', pass: st.containerDisplay === 'block' && errs.length >= 0, note: `errs=${errs.length} opacity=${st.activeOpacity}（零容错基线：不挂死即可）`, itemId });
    }

    // ---------- c4 损坏 JPEG ----------
    {
        const itemId = await page.evaluate(async () => {
            const bytes = new Uint8Array(120 * 1024);
            bytes[0] = 0xFF; bytes[1] = 0xD8; bytes[2] = 0xFF; bytes[3] = 0xE0;
            // getRandomValues 单次上限 65536 字节，分段填充
            for (let off = 4; off < bytes.length; off += 65536) {
                crypto.getRandomValues(bytes.subarray(off, Math.min(off + 65536, bytes.length)));
            }
            return window.__xmUpload('xm_c4_corrupt.jpg', 'image', new Blob([bytes], { type: 'image/jpeg' }));
        });
        await settle(5000);
        const st = await layerState();
        const errs = await grabErrors();
        await shot('c4-corrupt-jpeg');
        report({ id: 'c4', title: '损坏 JPEG（合法头+随机体）', pass: st.containerDisplay === 'block' && errs.length >= 1, note: `media-error 事件=${errs.length}（预期 ≥1：解码失败可感知）`, itemId });
    }

    // ---------- c5 截断 webm ----------
    {
        // 页内：录 2 秒小视频 → 截断 30% 上传
        const itemId = await page.evaluate(async () => {
            const c = document.createElement('canvas');
            c.width = 320; c.height = 180;
            const g = c.getContext('2d');
            const stream = c.captureStream(15);
            const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];
            rec.ondataavailable = e => chunks.push(e.data);
            rec.start(100);
            await new Promise(r => setTimeout(r, 2000));
            rec.stop();
            await new Promise(r => { rec.onstop = r; });
            const full = new Blob(chunks, { type: 'video/webm' });
            const buf = new Uint8Array(await full.arrayBuffer());
            const truncated = buf.slice(0, Math.floor(buf.length * 0.3));
            return window.__xmUpload('xm_c5_truncated.webm', 'video', new Blob([truncated], { type: 'video/webm' }));
        });
        await settle(18000); // 视频损坏可能触发渲染层 15s 兜底
        const st = await layerState();
        const errs = await grabErrors();
        await shot('c5-truncated-webm');
        report({ id: 'c5', title: '截断 webm（30%）', pass: st.containerDisplay === 'block', note: `errs=${errs.length}（关键：有界 settle，不挂死）`, itemId });
    }

    // ---------- c6 伪装扩展名 ----------
    {
        const itemIdText = await page.evaluate(async () => {
            const fake = new Blob(['this is NOT an image, just plain text pretending to be png'], { type: 'text/plain' });
            return window.__xmUpload('xm_c6_fake.png', 'image', fake);
        });
        await settle(4000);
        const errsText = await grabErrors();
        await shot('c6a-fake-png-text');
        const itemIdPng = await page.evaluate(async () => {
            const c = document.createElement('canvas'); c.width = 64; c.height = 64;
            const g = c.getContext('2d'); g.fillStyle = '#2bd9a5'; g.fillRect(0, 0, 64, 64);
            const blob = await new Promise(r => c.toBlob(r, 'image/png'));
            return window.__xmUpload('xm_c6_png_named.jpg', 'image', blob);
        });
        await settle(4000);
        const st = await layerState();
        const errsPng = await grabErrors();
        await shot('c6b-png-named-jpg');
        report({ id: 'c6', title: '伪装扩展名（文本→.png / PNG→.jpg）', pass: st.containerDisplay === 'block', note: `文本伪装 errs=${errsText.length}；内容真实则浏览器嗅探可解（errs=${errsPng.length}）`, itemId: itemIdText });
    }

    // ---------- c7 Unicode + 超长文件名 ----------
    {
        const longName = '测试背景🎬极端文件名' + '很长'.repeat(90) + '.png';
        const itemId = await page.evaluate(async (nm) => {
            const c = document.createElement('canvas'); c.width = 320; c.height = 200;
            const g = c.getContext('2d');
            g.fillStyle = '#2244aa'; g.fillRect(0, 0, 320, 200);
            g.fillStyle = '#fff'; g.font = '28px sans-serif'; g.fillText('UNICODE 极端文件名', 30, 100);
            const blob = await new Promise(r => c.toBlob(r, 'image/png'));
            return window.__xmUpload(nm, 'image', blob);
        }, longName);
        await settle(4000);
        const st = await layerState();
        const listed = await page.evaluate(async () => {
            const items = await window.STBgLoader.getAPI().getMediaList();
            return items.filter(i => i.name.startsWith('测试背景')).length;
        });
        await shot('c7-unicode-longname');
        report({ id: 'c7', title: `Unicode/超长文件名（${longName.length} 字符）`, pass: listed >= 1 && st.containerDisplay === 'block', note: `目录可见=${listed}`, itemId });
    }

    // ---------- c8 超长音频（1h WAV）----------
    {
        const itemId = await page.evaluate(async () => {
            const sampleRate = 8000, seconds = 3600;
            const dataBytes = sampleRate * seconds * 2; // 16-bit mono
            const buf = new ArrayBuffer(44 + dataBytes);
            const v = new DataView(buf);
            const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
            ws(0, 'RIFF'); v.setUint32(4, 36 + dataBytes, true); ws(8, 'WAVE');
            ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
            v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
            v.setUint16(32, 2, true); v.setUint16(34, 16, true);
            ws(36, 'data'); v.setUint32(40, dataBytes, true);
            // 静音（零填充）+ 每 60s 一个短促 440Hz 脉冲，证明真的在播
            for (let s = 0; s < seconds; s++) {
                const off = 44 + s * sampleRate * 2;
                for (let i = 0; i < sampleRate && i < 3000; i++) {
                    v.setInt16(off + i * 2, Math.round(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 8000), true);
                }
            }
            return window.__xmUpload('xm_c8_one_hour.wav', 'audio', new Blob([buf], { type: 'audio/wav' }));
        });
        await settle(6000);
        const playing = await page.evaluate(() => window.STBgLoader.getAudioEngine().isPlaying());
        await shot('c8-one-hour-wav');
        report({ id: 'c8', title: '1 小时 WAV（≈56MB 静音+脉冲）', pass: playing === true, note: `isPlaying=${playing}`, itemId });
    }

    // ---------- c9 SVG 含脚本 + HTML canvas 动画 ----------
    {
        const svgId = await page.evaluate(async () => {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
                <rect width="800" height="600" fill="#101028"/>
                <circle cx="400" cy="300" r="150" fill="#ff5c8a">
                    <animate attributeName="r" values="120;180;120" dur="3s" repeatCount="indefinite"/>
                </circle>
                <script>document.body = document.body || {}; window.__svgScriptRan = true;</script>
            </svg>`;
            return window.__xmUpload('xm_c9_scripted.svg', 'svg', svg);
        });
        await settle(5000);
        const svgState = await page.evaluate(() => ({
            iframeCount: document.querySelectorAll('#bg1 iframe').length,
        }));
        await shot('c9a-scripted-svg');
        const htmlId = await page.evaluate(async () => {
            const html = `<!DOCTYPE html><html><head><style>body{margin:0;overflow:hidden;background:#02020a}</style></head>
                <body><canvas id="c"></canvas><script>
                const c=document.getElementById('c');c.width=innerWidth;c.height=innerHeight;
                const g=c.getContext('2d');let t=0;(function loop(){t+=0.03;g.fillStyle='rgba(2,2,10,0.2)';g.fillRect(0,0,c.width,c.height);
                for(let i=0;i<40;i++){const x=c.width/2+Math.sin(t+i)*200*Math.cos(i);const y=c.height/2+Math.cos(t*1.3+i)*150;
                g.fillStyle=\`hsl(\${(t*50+i*9)%360},80%,60%)\`;g.beginPath();g.arc(x,y,4,0,7);g.fill();}
                requestAnimationFrame(loop);})();</script></body></html>`;
            return window.__xmUpload('xm_c9_canvas.html', 'html', html);
        });
        await settle(5000);
        const htmlState = await layerState();
        await shot('c9b-html-canvas');
        report({ id: 'c9', title: 'SVG 含脚本 + HTML canvas 动画（iframe 沙箱）', pass: svgState.iframeCount >= 1 && htmlState.activeOpacity === 1, note: `iframes=${svgState.iframeCount} opacity=${htmlState.activeOpacity}`, itemId: htmlId });
    }

    // ---------- c10 快速切换序列 ----------
    // 关掉实例内其它扩展的阻塞弹窗（chatfilesys 导入提示等）——只点它们自己的按钮，
    // 不动它们的 DOM 结构，保证后续截图能看到背景与媒体库。
    const dismissInstancePopups = () => page.evaluate(() => {
        let closed = 0;
        document.querySelectorAll('button, .menu_button, .popup-close, [class*="close"]').forEach((btn) => {
            const el = btn;
            const text = (el.textContent || '').trim();
            const visible = el.offsetParent !== null;
            if (!visible) return;
            if (/^(不入库|稍后再说|关闭|取消|知道了|我知道了|明白|确定|忽略|OK)$/.test(text) || text === '×') {
                el.click();
                closed++;
            }
        });
        return closed;
    });
    {
        await dismissInstancePopups();
        await settle(800);
        const seqIds = await page.evaluate(async () => {
            const ids = [];
            const items = await window.STBgLoader.getAPI().getMediaList();
            for (const it of items.filter(i => i.name.startsWith('xm_')).slice(0, 10)) ids.push(it.id);
            return ids;
        });
        const before = await layerState();
        for (const id of seqIds) {
            await page.evaluate(async (mediaId) => { await window.STBgLoader.getAPI().setBackground(mediaId); }, id);
            await settle(300);
        }
        await settle(2500);
        const st = await layerState();
        const errs = await grabErrors();
        await shot('c10-rapid-switch');
        report({ id: 'c10', title: `快速切换 ×${seqIds.length}（300ms 间隔）`, pass: st.containerDisplay === 'block' && st.activeOpacity === 1, note: `终态 opacity=${st.activeOpacity} A/B children=${st.aChildren}/${st.bChildren}`, itemId: null });
    }

    // ---------- c13 全坏音频歌单（跳轨预算有界性）----------
    {
        // 两条随机字节的 .mp3（损坏）+ 直接驱动 AudioEngine：断言 auto-skip 恰好烧完预算后停止，
        // 不会无限循环（修复验证：预算只在 'playing' 事件补满，playTrack 不再补）。
        const c13 = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            const engine = ext.getAudioEngine();
            // 零字节 mp3：浏览器解码必然失败（随机字节可能被当噪声成功解码，不可靠）
            const makeCorrupt = (name) =>
                ext.cacheManager.saveMedia(new Blob([], { type: 'audio/mpeg' }), name, 'audio', 'server');
            const a = await makeCorrupt('xm_c13_bad_a.mp3');
            const b = await makeCorrupt('xm_c13_bad_b.mp3');
            window.__xmCreated.push(a.id, b.id);

            const previousMode = engine.getPlaybackMode();
            engine.setPlaybackMode('loop');
            engine.setPlaylist([a, b], false);
            const t0 = performance.now();
            await engine.playTrack('backgrounds/' + encodeURIComponent(a.name), false).catch(() => {});
            // 有界观察窗：若预算失效会无限 error→skip→error；15s 内必须归于停止
            await new Promise(r => setTimeout(r, 12000));
            const stillPlaying = engine.isPlaying();
            const attempts = (performance.now() - t0) / 1000;
            engine.stopTrack(0);
            engine.setPlaybackMode(previousMode);
            return { stillPlaying, attempts };
        });
        await shot('c13-all-corrupt-playlist');
        report({ id: 'c13', title: '全坏歌单：跳轨预算有界（12s 观察窗后必须停止）', pass: c13.stillPlaying === false, note: `stillPlaying=${c13.stillPlaying}（预算失效时此值会为 true 且不收敛）`, itemId: null });
    }

    // ---------- 汇总截图（最终状态 + 打开顶栏抽屉看媒体库）----------
    await dismissInstancePopups();
    await page.evaluate(() => window.STBgLoader.getTopbarDrawer()?.mount());
    await settle(1500);
    // mount 只是装入面板，还要点宿主开关把 #Backgrounds 抽屉拉开才可见
    await page.evaluate(() => {
        const drawer = document.querySelector('#Backgrounds');
        const toggle = document.querySelector('#backgrounds-drawer-toggle');
        if (drawer && !drawer.classList.contains('openDrawer') && toggle) toggle.click();
    });
    await settle(2500);
    const gridCards = await page.evaluate(() => document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card').length);
    // 键盘可达性断言：焦点第一张卡 → ArrowRight 移动 → Enter 应用（以挂载管线调用为信号）
    const kb = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card')];
        if (!cards.length) return { focusMoved: false, enterApplied: false };
        const first = cards[0];
        first.focus();
        first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        const focusMoved = document.activeElement === cards[1];
        const cm = window.STBgLoader.getCacheManager();
        const orig = cm.getMediaBlobUrl.bind(cm);
        cm.getMediaBlobUrl = async (item) => { window.__kbApplied = true; return orig(item); };
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        return { focusMoved, enterApplied: window.__kbApplied === true };
    });
    await shot('c11-library-grid');
    // 视频卡片首帧缩略图断言（B5）：等待惰性生成后，video 卡的预览层应有背景图
    await new Promise(r => setTimeout(r, 12000));
    const thumbs = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('#st_bgloader_grid .st-bgloader-media-card')];
        const videoCards = cards.filter(c => c.querySelector('.st-bg-native-badge.video, .st-bgloader-media-badge.video'));
        const painted = videoCards.filter(c => {
            const img = c.querySelector('.st-bgloader-card-img');
            return img && (img.style.backgroundImage || '').includes('url("data:image/jpeg');
        });
        return { videoCards: videoCards.length, painted: painted.length };
    });
    report({ id: 'c11-kb', title: '媒体网格键盘可达性（ArrowRight 移焦 / Enter 应用）', pass: kb.focusMoved && kb.enterApplied, note: `focusMoved=${kb.focusMoved} enterApplied=${kb.enterApplied}`, itemId: null });
    report({ id: 'c11-thumb', title: '视频卡片首帧缩略图', pass: thumbs.videoCards > 0 && thumbs.painted > 0, note: `videoCards=${thumbs.videoCards} painted=${thumbs.painted}`, itemId: null });

    // ---------- 清理（探针零残留：以上传登记表为准）----------
    const allIds = await page.evaluate(() => window.__xmCreated.splice(0));
    let cleaned = 0;
    for (const id of allIds) { if (await deleteItem(id)) cleaned++; }
    // 复原初始背景
    await page.evaluate(async (prev) => {
        if (prev) {
            const item = await window.STBgLoader.getCacheManager().getMedia(prev);
            if (item) await window.STBgLoader.getAPI().setBackground(prev);
        } else {
            window.STBgLoader.getAPI().clearBackground();
        }
    }, initial.activeMediaId);
    await settle(2000);
    await shot('c12-after-cleanup');
    const remaining = await page.evaluate(async () => {
        const items = await window.STBgLoader.getAPI().getMediaList();
        return items.filter(i => i.name.startsWith('xm_')).length;
    });

    const passCount = results.filter(r => r.pass).length;
    console.log(`\n===== 极端媒体套件：${passCount}/${results.length} 通过；清理 ${cleaned}/${allIds.length} 条测试条目；残留 xm_=${remaining}；媒体库卡片=${gridCards} =====`);
    writeFileSync(join(outDir, 'extreme-media-report.json'), JSON.stringify({ results, gridCards, remainingXmItems: remaining, consoleErrors: consoleErrors.slice(-40) }, null, 2));
    if (passCount !== results.length || remaining !== 0) process.exit(1);
} finally {
    await browser.close();
}
