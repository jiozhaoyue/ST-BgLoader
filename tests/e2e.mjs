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
            return window.STBgLoader && window.STBgLoader.isInitialized;
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

        // 7. Test Visual Filter Presets
        console.log('🧪 Test 7: Testing Visual Filter Presets & Custom Preset saving...');
        const presetResult = await page.evaluate(() => {
            const ext = window.STBgLoader;
            const select = document.querySelector('#st_preset_select');
            if (!select) return { success: false, reason: 'preset select missing' };

            // Switch to cyberpunk preset
            select.value = 'cyberpunk';
            select.dispatchEvent(new Event('change'));

            const container = document.querySelector('#bg1 .st-bg-media-container');
            const cyberpunkApplied = container && container.style.filter.includes('saturate(160%)');

            // Save custom preset
            ext.settings.userPresets['E2E_Custom'] = { blur: 3, brightness: 115, opacity: 95, saturate: 140 };
            ext.settings.activePresetId = 'E2E_Custom';
            ext.mediaMount.applyFilters(ext.settings.userPresets['E2E_Custom']);

            const customApplied = container && container.style.filter.includes('blur(3px)');

            return {
                success: cyberpunkApplied && customApplied,
                cyberpunkApplied,
                customApplied,
                activePreset: ext.settings.activePresetId,
            };
        });
        console.log('   Preset test result:', presetResult);
        if (!presetResult.success) {
            console.error('❌ Test 7 Failed: Filter presets failed!');
            process.exit(1);
        }
        console.log('✅ Test 7 Passed: Built-in and custom filter presets verified.');

        // 8. Test Floating Mini Player Capsule
        console.log('🧪 Test 8: Verifying Floating Mini Player Capsule & Controls...');
        const miniPlayerResult = await page.evaluate(() => {
            const player = document.querySelector('#st_bg_mini_player');
            const prevBtn = document.querySelector('#st_mini_prev');
            const playBtn = document.querySelector('#st_mini_play');
            const nextBtn = document.querySelector('#st_mini_next');
            const titleEl = document.querySelector('#st_mini_title');
            const modeBtn = document.querySelector('#st_mini_mode');

            return {
                hasPlayer: !!player,
                hasPrev: !!prevBtn,
                hasPlay: !!playBtn,
                hasNext: !!nextBtn,
                hasTitle: !!titleEl,
                hasMode: !!modeBtn,
                titleText: titleEl?.textContent || '',
            };
        });
        console.log('   Mini Player elements:', miniPlayerResult);
        if (!miniPlayerResult.hasPlayer || !miniPlayerResult.hasPlay || !miniPlayerResult.hasTitle) {
            console.error('❌ Test 8 Failed: Mini Player elements missing!');
            process.exit(1);
        }
        console.log('✅ Test 8 Passed: Floating mini player capsule verified.');

        // 9. Test Audio Engine Playlist & Playback Modes
        console.log('🧪 Test 9: Testing Audio Engine Playlist & Playback Modes...');
        const playlistResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            const track1 = {
                id: 'bg_track_1',
                name: 'Ambient Track 1.mp3',
                type: 'audio',
                source: 'local',
                url: 'blob:fake-url-1',
                cacheKey: '/fake/1',
                size: 1024,
                mimeType: 'audio/mpeg',
                addedTimestamp: Date.now(),
                lastUsedTimestamp: Date.now(),
            };
            const track2 = {
                id: 'bg_track_2',
                name: 'Ambient Track 2.mp3',
                type: 'audio',
                source: 'local',
                url: 'blob:fake-url-2',
                cacheKey: '/fake/2',
                size: 2048,
                mimeType: 'audio/mpeg',
                addedTimestamp: Date.now(),
                lastUsedTimestamp: Date.now(),
            };

            ext.audioEngine.setPlaylist([track1, track2]);
            const current = ext.audioEngine.getCurrentTrack();

            ext.audioEngine.setPlaybackMode('shuffle');
            const modeShuffle = ext.audioEngine.getPlaybackMode();

            ext.audioEngine.setPlaybackMode('single');
            const modeSingle = ext.audioEngine.getPlaybackMode();

            ext.audioEngine.setPlaybackMode('loop');
            const modeLoop = ext.audioEngine.getPlaybackMode();

            return {
                hasCurrent: !!current,
                trackName: current?.name,
                modeShuffle,
                modeSingle,
                modeLoop,
            };
        });
        console.log('   Playlist & modes result:', playlistResult);
        if (!playlistResult.hasCurrent || playlistResult.modeShuffle !== 'shuffle' || playlistResult.modeLoop !== 'loop') {
            console.error('❌ Test 9 Failed: Audio playlist logic failed!');
            process.exit(1);
        }
        console.log('✅ Test 9 Passed: Audio playlist queue and playback modes verified.');

        // 10. Test Interactive Sandbox Mode Toggle
        console.log('🧪 Test 10: Testing Interactive Sandbox Pointer Events Toggle...');
        const interactiveResult = await page.evaluate(() => {
            const ext = window.STBgLoader;
            const container = document.querySelector('#bg1 .st-bg-media-container');

            // Default or disabled: pointer-events: none
            ext.mediaMount.setInteractive(false);
            const pointerNone = container ? window.getComputedStyle(container).pointerEvents : '';

            // Enabled: pointer-events: auto
            ext.mediaMount.setInteractive(true);
            const pointerAuto = container ? window.getComputedStyle(container).pointerEvents : '';

            // Reset back
            ext.mediaMount.setInteractive(false);

            return {
                pointerNone,
                pointerAuto,
                toggledCorrectly: pointerNone === 'none' && pointerAuto === 'auto',
            };
        });
        console.log('   Interactive toggle result:', interactiveResult);
        if (!interactiveResult.toggledCorrectly) {
            console.error('❌ Test 10 Failed: Interactive toggle failed!');
            process.exit(1);
        }
        console.log('✅ Test 10 Passed: Interactive sandbox pointer-events toggle verified.');

        console.log('\n==========================================');
        console.log('🎉 ALL 10 AUTOMATED E2E TESTS PASSED! 🎉');
        console.log('==========================================\n');

    } catch (err) {
        console.error('💥 Test Execution Error:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runE2ETests();
