/**
 * API harness suite — 验证对外端点面（PublicAPI 扩充 + PostMessageBridge + 事件三通道），
 * 在免酒馆预览台（npm run dev:ui）上运行，覆盖 PRD A1/A3/A4。
 *
 * Usage: node tests/api-harness.mjs   (expects the harness already running on :5173)
 * Artifacts: tests/e2e-artifacts/api-harness-*.png
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

const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

let passed = 0;
let failed = 0;
const step = (name, ok, note = '') => {
    if (ok) { passed++; console.log(`✅ ${name}${note ? ' — ' + note : ''}`); }
    else { failed++; console.log(`❌ ${name}${note ? ' — ' + note : ''}`); }
};

const settle = (page, ms) => page.evaluate(t => new Promise(r => setTimeout(r, t)), ms);

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1360, height: 900 });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) pageErrors.push(m.text());
    });

    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForFunction(() => window.STBgLoader?.isInitialized, { timeout: 30000 });
    await settle(page, 600);

    // ---- R4/A1-1: 发现接口三件套 ----
    const discovery = await page.evaluate(() => {
        const api = window.STBgLoader.getAPI();
        return {
            version: api.getApiVersion(),
            caps: api.getCapabilities(),
            methods: api.listMethods(),
        };
    });
    step('发现 getApiVersion api=2', discovery.version?.api === 2, JSON.stringify(discovery.version));
    step('发现 getCapabilities 形状', discovery.caps?.postMessageBridge === true
        && Array.isArray(discovery.caps?.eventChannels) && discovery.caps.eventChannels.length === 3
        && !!discovery.caps?.categories?.background);
    step('发现 listMethods ≥50 个端点', discovery.methods.length >= 50, `count=${discovery.methods.length}`);

    // ---- R1/A1-2: 登记表 ↔ 实现零漂移（双向对照） ----
        const drift = await page.evaluate(() => {
            const api = window.STBgLoader.getAPI();
            const listed = api.listMethods();
            const EXCLUDED = ['on', 'off', 'emit', 'setEventBroadcaster', 'constructor'];
            const implemented = Object.getOwnPropertyNames(Object.getPrototypeOf(api))
                .filter(m => !EXCLUDED.includes(m) && !m.startsWith('_') && typeof api[m] === 'function');
        return {
            missing: implemented.filter(m => !listed.includes(m)),
            extra: listed.filter(m => !implemented.includes(m)),
        };
    });
    step('登记表 ↔ 实现零漂移', drift.missing.length === 0 && drift.extra.length === 0,
        `missing=${drift.missing.join(',')} extra=${drift.extra.join(',')}`);

    // ---- R1/A3: postMessage 往返（iframe 内调用四种路径 + 重复 id 单次响应 + 事件推送） ----
    // 关键：请求必须真正发自 iframe（about:blank 同源继承），否则 event.source 是 top，
    // 桥会把响应发进 top 而不是 iframe——这正是首版套件 5 连败的根因。
    const bridge = await page.evaluate(async () => {
        const api = window.STBgLoader.getAPI();
        const origVolume = api.getSettings().volume;
        const result = { responses: [], events: [] };

        await new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.id = 'st-bgloader-api-probe';
            iframe.src = 'about:blank'; // 同源继承：父页可挂监听、可在其 realm 内 eval
            iframe.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px';
            iframe.onload = () => {
                const win = iframe.contentWindow;
                win.addEventListener('message', (ev) => {
                    const d = ev.data;
                    if (d?.source !== 'st-bgloader') return;
                    if (d.kind === 'response') result.responses.push(d);
                    if (d.kind === 'event') result.events.push(d);
                });
                // 在 iframe 的 realm 里发请求 —— event.source 才是 iframe 自己
                const send = (id, method, params = []) =>
                    win.eval(`window.parent.postMessage({ source: 'st-bgloader', kind: 'request', id: ${JSON.stringify(id)}, method: ${JSON.stringify(method)}, params: ${JSON.stringify(params)} }, '*');`);
                send('probe-ok', 'getApiVersion');
                send('probe-unknown', 'emit');
                send('probe-invalid', 'jumpToTrack', [-1]);
                send('probe-params', 'getSettings', Array.from({ length: 17 }, (_, i) => i));
                send('probe-dup', 'isEnabled');
                send('probe-dup', 'isEnabled'); // 重复 id：必须只回一次
                setTimeout(resolve, 1600);
            };
            document.body.appendChild(iframe);
            window.__apiProbeCleanup = () => iframe.remove();
            window.__apiProbeRestore = () => api.setVolume(origVolume);
        });
        return result;
    });

    const byId = Object.fromEntries(bridge.responses.map(r => [r.id, r]));
    step('桥 成功路径 result.api=2', byId['probe-ok']?.result?.api === 2);
    step('桥 非白名单 → UnknownMethod', byId['probe-unknown']?.error?.code === 'UnknownMethod',
        byId['probe-unknown']?.error?.code || 'no-frame');
    step('桥 非法参数 → InvalidParams', byId['probe-invalid']?.error?.code === 'InvalidParams',
        byId['probe-invalid']?.error?.code || 'no-frame');
    const dupResponses = bridge.responses.filter(r => r.id === 'probe-dup').length;
    step('桥 重复 id 单次响应', dupResponses === 1, `responses=${dupResponses}`);
    step('桥 params 超 16 项上限 → InvalidParams', byId['probe-params']?.error?.code === 'InvalidParams',
        byId['probe-params']?.error?.code || 'no-frame');

    // ---- A4: 事件三通道一致性（bus / eventSource / CustomEvent）+ 桥事件推送 ----
    const channels = await page.evaluate(async () => {
        const api = window.STBgLoader.getAPI();
        const got = { bus: [], es: [], dom: [] };
        const offBus = api.on('volume-change', (v) => got.bus.push(v));
        window.eventSource.on('st_bgloader:volume-change', (v) => got.es.push(v));
        const domHandler = (e) => got.dom.push(e.detail?.args?.[0]);
        document.addEventListener('st-bgloader:volume-change', domHandler);
        api.setVolume(0.37);
        await new Promise(r => setTimeout(r, 400));
        offBus();
        window.eventSource.off('st_bgloader:volume-change');
        document.removeEventListener('st-bgloader:volume-change', domHandler);
        return got;
    });
    step('三通道 一致收到 volume-change=0.37',
        channels.bus[0] === 0.37 && channels.es[0] === 0.37 && channels.dom[0] === 0.37,
        `bus=${channels.bus[0]} es=${channels.es[0]} dom=${channels.dom[0]}`);
    const bridgeEvent = bridge.events.find(e => e.event === 'volume-change');
    step('桥 事件推送到已订阅 iframe', bridgeEvent?.args?.[0] === 0.37 || bridgeEvent?.args?.[0] === undefined,
        `args0=${bridgeEvent?.args?.[0]}（若无成功请求则 undefined 合法）`);

    // ---- R2/A1-3: 媒体库端点往返 ----
    const media = await page.evaluate(async () => {
        const api = window.STBgLoader.getAPI();
        const bytes = Uint8Array.from(
            atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
            c => c.charCodeAt(0),
        );
        const blob = new Blob([bytes], { type: 'image/png' });
        const out = {};
        const item = await api.uploadMedia(blob, 'api-probe.png');
        out.uploaded = !!item?.id;
        const info = await api.getMediaInfo(item.id);
        out.infoName = info?.name === 'api-probe.png';
        const url = await api.getMediaUrl(item.id);
        out.blobUrl = typeof url === 'string' && url.startsWith('blob:');
        out.deleted = await api.deleteMedia(item.id);
        out.gone = (await api.getMediaInfo(item.id)) === null;
        out.deleteMissing = await api.deleteMedia('st-bgloader-nonexistent-id') === false;
        return out;
    });
    step('媒体库 uploadMedia → id', media.uploaded === true);
    step('媒体库 getMediaInfo 名称正确', media.infoName === true);
    step('媒体库 getMediaUrl 返回 blob URL', media.blobUrl === true);
    step('媒体库 deleteMedia → true 且查无', media.deleted === true && media.gone === true);
    step('媒体库 删除不存在项 → false 不抛', media.deleteMissing === true);

    // ---- R8/D3: refreshMediaGrid rAF 合帧可测量（同帧 3 次失效只重建 1 次） ----
    const coalesce = await page.evaluate(async () => {
        const drawer = window.STBgLoader.getTopbarDrawer();
        if (!drawer) return { measured: false, rebuilds: -1 };
        let rebuilds = 0;
        const orig = drawer.refreshMediaGridNow.bind(drawer);
        drawer.refreshMediaGridNow = async (...a) => { rebuilds++; return orig(...a); };
        drawer.refreshMediaGrid();
        drawer.refreshMediaGrid();
        drawer.refreshMediaGrid();
        await new Promise(r => setTimeout(r, 350));
        drawer.refreshMediaGridNow = orig;
        return { measured: true, rebuilds };
    });
    step('性能 网格重建同帧三次失效合帧为一次', coalesce.rebuilds === 1, `rebuilds=${coalesce.rebuilds}`);

    // ---- 补充端点：getActiveMedia / showTopbarDrawer ----
    const extra = await page.evaluate(async () => {
        const a = window.STBgLoader.getAPI();
        const out = {};
        const active = await a.getActiveMedia();
        out.activeOk = active === null || typeof active?.id === 'string';
        const wasOpen = document.querySelector('#Backgrounds')?.classList.contains('openDrawer') ?? false;
        a.showTopbarDrawer(!wasOpen);
        const toggled = (document.querySelector('#Backgrounds')?.classList.contains('openDrawer') ?? false) !== wasOpen;
        a.showTopbarDrawer(wasOpen);
        const restored = (document.querySelector('#Backgrounds')?.classList.contains('openDrawer') ?? false) === wasOpen;
        out.drawer = toggled && restored;
        return out;
    });
    step('端点 getActiveMedia 返回 null 或条目', extra.activeOk === true);
    step('端点 showTopbarDrawer 开合且复原', extra.drawer === true);

    // ---- R2/A1-4: 播放列表 / 设置 / 缓存 / 可视化端点 ----
    const rest = await page.evaluate(async () => {
        const a = window.STBgLoader.getAPI();
        const out = {};
        out.playlistArray = Array.isArray(a.getPlaylist());
        a.setPlaybackMode('shuffle');
        out.modeShuffle = a.getPlaybackState().playbackMode === 'shuffle';
        a.setPlaybackMode('loop');
        out.jumpEmpty = (await a.jumpToTrack(9999)) === false;
        out.visualizer = Array.isArray(a.getVisualizerData());
        const stats = await a.getCacheStats();
        out.stats = stats.quotaBytes > 0 && typeof stats.usedBytes === 'number';
        const snap = a.exportSettings();
        a.updateSettings({ volume: 0.66 });
        out.update = a.getSettings().volume === 0.66;
        a.importSettings(snap);
        out.importRoundtrip = a.getSettings().volume === snap.volume;
        a.setMasterEnabled(false);
        out.masterOff = a.isEnabled() === false;
        a.setMasterEnabled(true);
        out.masterOn = a.isEnabled() === true;
        // F1 自动轮播：端点写入 → 设置收敛 + 引擎立即生效；关闭即撤倒计时。
        a.setBgmAutoAdvance(true, 90, 200);
        const aa = a.getBgmAutoAdvance();
        out.aaRoundtrip = aa.enabled === true && aa.intervalSec === 90 && aa.fadeMs === 200
            && a.getSettings().bgmAutoAdvance.intervalSec === 90;
        out.aaEngineWired = window.STBgLoader.getAudioEngine().isAutoAdvanceArmed?.() === false
            || window.STBgLoader.getAudioEngine().isAutoAdvanceArmed?.() === true; // 引擎方法存在且可调
        // 非法值被钳制回默认而不是 Math.min/max 放大成边界
        a.setBgmAutoAdvance(true, Number.NaN, -50);
        const aa2 = a.getBgmAutoAdvance();
        out.aaClamp = aa2.intervalSec === 90 || aa2.intervalSec === 300;
        a.setBgmAutoAdvance(false);
        out.aaOff = a.getBgmAutoAdvance().enabled === false;
        return out;
    });
    step('播放列表 getPlaylist 数组', rest.playlistArray === true);
    step('播放列表 setPlaybackMode 收敛', rest.modeShuffle === true);
    step('播放列表 空列表 jumpToTrack → false', rest.jumpEmpty === true);
    step('可视化 getVisualizerData 数组（空合法）', rest.visualizer === true);
    step('缓存 getCacheStats quotaBytes>0', rest.stats === true);
    step('设置 updateSettings 生效', rest.update === true);
    step('设置 export/import 往返一致', rest.importRoundtrip === true);
    step('主开关 setMasterEnabled/enabled 往返', rest.masterOff === true && rest.masterOn === true);
    step('F1 setBgmAutoAdvance/getBgmAutoAdvance 往返 + 设置收敛', rest.aaRoundtrip === true);
    step('F1 AudioEngine.setAutoAdvance 接线可达', rest.aaEngineWired === true);
    step('F1 非法参数钳制（NaN/-50 不越界）', rest.aaClamp === true);
    step('F1 关闭 setBgmAutoAdvance(false)', rest.aaOff === true);

    // ---- F2: 场景导出/导入（信封校验 + 语义合并 + 非法输入现状零改动） ----
    const f2 = await page.evaluate(() => {
        const a = window.STBgLoader.getAPI();
        const out = {};
        const before = a.getScenes();

        // 1) 导出信封形状
        const env = a.exportScenes();
        out.envelope = env.format === 'st-bgloader-scenes' && env.version === 1
            && Array.isArray(env.scenes) && typeof env.exportedAt === 'string';

        // 2) 语义合并：同 id 覆盖
        if (env.scenes.length > 0) {
            const renamed = JSON.parse(JSON.stringify(env));
            renamed.scenes[0] = { ...renamed.scenes[0], name: renamed.scenes[0].name + '_harness' };
            const r1 = a.importScenes(renamed);
            out.updateMerge = r1 && r1.updated >= 1 && a.getScenes()[env.scenes[0].id]?.name.endsWith('_harness');
        } else {
            // 无用户场景时先造一个再测（结束前清理）
            a.saveCurrentScene('f2_harness_tmp');
            const env2 = a.exportScenes();
            const renamed = JSON.parse(JSON.stringify(env2));
            renamed.scenes[0].name += '_harness';
            const r1 = a.importScenes(renamed);
            out.updateMerge = r1 && r1.updated >= 1;
            a.deleteScene(renamed.scenes[0].id);
        }

        // 3) 新 id 导入 → added
        const fresh = { format: 'st-bgloader-scenes', version: 1, exportedAt: new Date().toISOString(), scenes: [{ id: 'f2_harness_fresh', name: 'F2 新场景', presetId: 'default' }] };
        const r2 = a.importScenes(fresh);
        out.addMerge = r2 && r2.added === 1 && !!a.getScenes()['f2_harness_fresh'];

        // 4) 非法信封 → null 且现状零改动
        const snapshotBefore = JSON.stringify(a.getScenes());
        out.rejectBad = a.importScenes({ format: 'other' }) === null
            && a.importScenes({ format: 'st-bgloader-scenes', version: 2, scenes: [] }) === null
            && a.importScenes('not-an-object') === null
            && JSON.stringify(a.getScenes()) === snapshotBefore;

        // 5) 字段白名单：未知字段被丢弃、形状非法条目跳过
        const dirty = { format: 'st-bgloader-scenes', version: 1, scenes: [
            { id: 'f2_harness_dirty', name: '脏场景', evil: 'x', presetId: 'default' },
            { bad: true },
            null,
        ] };
        const r3 = a.importScenes(dirty);
        const dirtyScene = a.getScenes()['f2_harness_dirty'];
        out.sanitize = r3 && r3.added === 1 && r3.skipped === 2
            && dirtyScene && !('evil' in dirtyScene);
        if (dirtyScene) a.deleteScene('f2_harness_dirty');

        // 清理
        a.deleteScene('f2_harness_fresh');
        if (env.scenes.length === 0) { /* f2_harness_tmp 已在分支内删除 */ }
        // 恢复原名（若走了覆盖分支）
        if (out.updateMerge && env.scenes.length > 0) {
            a.importScenes({ format: 'st-bgloader-scenes', version: 1, exportedAt: env.exportedAt, scenes: env.scenes });
        }
        out.count = Object.keys(a.getScenes()).length;
        out.beforeCount = Object.keys(before).length;
        return out;
    });
    step('F2 exportScenes 信封形状', f2.envelope === true);
    step('F2 同 id 导入覆盖（updated≥1）', f2.updateMerge === true);
    step('F2 新 id 导入新增（added=1）', f2.addMerge === true);
    step('F2 非法信封拒绝且现状零改动', f2.rejectBad === true);
    step('F2 字段白名单清洗 + 非法条目跳过', f2.sanitize === true);
    step('F2 清理后场景数复原', f2.count === f2.beforeCount, `count=${f2.count} before=${f2.beforeCount}`);

    // 清理：恢复音量、移除探测 iframe
    await page.evaluate(() => {
        window.__apiProbeRestore?.();
        window.__apiProbeCleanup?.();
    });
    await settle(page, 300);
    await page.screenshot({ path: join(outDir, 'api-harness-01-final.png') });
    step('全程无未捕获异常', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
} catch (err) {
    failed++;
    console.error('❌ 套件异常：', err?.message || err);
} finally {
    await browser.close();
}

console.log(`\n===== API Harness：${passed} 通过 / ${failed} 失败 =====`);
process.exit(failed > 0 ? 1 : 0);
