import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://dev.localho.st:8003';

async function runE2ETests() {
    console.log('🚀 Starting Automated E2E Test on', TARGET_URL);

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
    await page.setViewport({ width: 1280, height: 800 });

    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(`[Browser ${msg.type()}]: ${text}`);
    });
    page.on('pageerror', err => logs.push(`[Browser Error]: ${err.message}`));

    try {
        console.log('⏳ Navigating to SillyTavern...');
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for SillyTavern to bootstrap extensions (waiting for STBgLoader)
        console.log('⏳ Waiting for SillyTavern to activate third-party/ST-BgLoader...');
        await page.waitForFunction(() => {
            return typeof window.STBgLoader !== 'undefined';
        }, { timeout: 35000 });

        // 1. Check window.STBgLoader
        console.log('🧪 Test 1: Verifying window.STBgLoader extension instance...');
        const hasExtension = await page.evaluate(() => {
            return typeof window.STBgLoader !== 'undefined';
        });
        if (!hasExtension) {
            console.error('❌ Test 1 Failed: window.STBgLoader not found!');
            process.exit(1);
        }
        console.log('✅ Test 1 Passed: window.STBgLoader successfully loaded and activated.');

        // 2. Check DOM Mount in #bg1
        console.log('🧪 Test 2: Verifying .st-bg-media-container mounted inside #bg1...');
        const hasMount = await page.evaluate(() => {
            const container = document.querySelector('#bg1 .st-bg-media-container');
            const layerA = document.querySelector('#bg1 .st-bg-layer-a');
            const layerB = document.querySelector('#bg1 .st-bg-layer-b');
            return !!(container && layerA && layerB);
        });
        if (!hasMount) {
            console.error('❌ Test 2 Failed: Mount container or double-buffer layers missing!');
            process.exit(1);
        }
        console.log('✅ Test 2 Passed: MediaMount and double-buffering layers active in #bg1.');

        // 3. Test Filter Application
        console.log('🧪 Test 3: Testing real-time CSS visual filters application...');
        const filterApplied = await page.evaluate(() => {
            const ext = window.STBgLoader;
            ext.mediaMount.applyFilters({
                blur: 8,
                brightness: 120,
                opacity: 90,
                saturate: 110,
            });
            const container = document.querySelector('#bg1 .st-bg-media-container');
            return container ? container.style.filter : '';
        });
        console.log('   Applied filter style:', filterApplied);
        if (!filterApplied.includes('blur(8px)') || !filterApplied.includes('brightness(120%)')) {
            console.error('❌ Test 3 Failed: Filters not applied correctly!');
            process.exit(1);
        }
        console.log('✅ Test 3 Passed: Real-time CSS visual filters verified.');

        // 4. Test Media Import & Cache Storage with HTML Canvas Animation
        console.log('🧪 Test 4: Testing Media CacheStorage & Sandboxed Iframe rendering...');
        const renderResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            const sampleHtml = `
                <!DOCTYPE html>
                <html>
                <body style="margin:0;background:radial-gradient(circle, #ff0055, #000022);display:flex;align-items:center;justify-content:center;height:100vh;">
                    <h1 style="color:white;font-family:sans-serif;">ST-BgLoader E2E</h1>
                </body>
                </html>
            `;
            const item = await ext.cacheManager.saveMedia(sampleHtml, 'test-animation.html', 'html', 'local');
            await ext.applyMedia(item);

            // Wait for crossfade
            await new Promise(r => setTimeout(r, 600));
            const iframe = document.querySelector('#bg1 iframe.st-bg-iframe-element');
            const activeLayer = document.querySelector('#bg1 .st-bg-layer[style*="opacity: 1"]');
            const usage = await ext.cacheManager.getCacheUsage();

            return {
                itemId: item.id,
                hasIframe: !!iframe,
                hasActiveLayer: !!activeLayer,
                cachedItems: usage.itemCount,
                cachedBytes: usage.usedBytes,
            };
        });

        console.log('   Render test result:', renderResult);
        if (!renderResult.hasIframe || renderResult.cachedItems === 0) {
            console.error('❌ Test 4 Failed: Render result unexpected!');
            process.exit(1);
        }
        console.log('✅ Test 4 Passed: CacheStorage and Sandboxed Iframe rendering verified.');

        // 5. Test Audio Engine
        console.log('🧪 Test 5: Testing Audio Engine...');
        const audioResult = await page.evaluate(() => {
            const ext = window.STBgLoader;
            ext.audioEngine.setVolume(0.65);
            ext.audioEngine.setMuted(false);
            return {
                volume: ext.audioEngine.getVolume(),
                muted: ext.audioEngine.isMuted(),
            };
        });
        console.log('   Audio engine state:', audioResult);
        if (Math.abs(audioResult.volume - 0.65) > 0.01 || audioResult.muted !== false) {
            console.error('❌ Test 5 Failed: Audio engine state mismatch!');
            process.exit(1);
        }
        console.log('✅ Test 5 Passed: AudioEngine controls verified.');

        // 6. Test Settings Drawer in UI
        console.log('🧪 Test 6: Verifying Settings Drawer in DOM...');
        const hasDrawer = await page.evaluate(() => {
            const drawer = document.querySelector('#st_bgloader_settings');
            const dropzone = document.querySelector('#st_bgloader_dropzone');
            const grid = document.querySelector('#st_bgloader_grid');
            return !!(drawer && dropzone && grid);
        });
        if (!hasDrawer) {
            console.error('❌ Test 6 Failed: Settings drawer not found in DOM!');
            process.exit(1);
        }
        console.log('✅ Test 6 Passed: Settings drawer and UI components verified.');

        console.log('\n========================================');
        console.log('🎉 ALL 6 AUTOMATED E2E TESTS PASSED! 🎉');
        console.log('========================================\n');

    } catch (err) {
        console.error('💥 Test Execution Error:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runE2ETests();
