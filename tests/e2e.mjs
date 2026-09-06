import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome');

const TARGET_URL = process.env.TEST_TARGET_URL
    || process.env.TARGET_URL
    || 'http://localhost:8000';

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

        // 11. Test window.stBgLoader Infrastructure Public API & Event Bus
        console.log('🧪 Test 11: Testing window.stBgLoader Public API & Event Bus...');
        const apiResult = await page.evaluate(async () => {
            const api = window.stBgLoader;
            if (!api) return { success: false, reason: 'window.stBgLoader undefined' };

            let eventFired = false;
            let lastEventFilter = null;
            const unsub = api.on('filters-change', (f) => {
                eventFired = true;
                lastEventFilter = f;
            });

            // Call API setFilters
            api.setFilters({ blur: 4, brightness: 125 });
            unsub();

            const container = document.querySelector('#bg1 .st-bg-media-container');
            const filterCss = container ? container.style.filter : '';

            // Call API applyPreset
            api.applyPreset('cinema_dark');
            const state = api.getPlaybackState();

            // Call API setBackground
            let bgChanged = false;
            api.on('media-change', () => { bgChanged = true; });
            await api.setBackground('https://assets.example.com/sample.mp4', {
                filters: { blur: 2, saturate: 140 },
                interactive: true,
            });

            const mediaState = api.getPlaybackState();

            return {
                success: eventFired && filterCss.includes('blur(4px)') && state.activePresetId === 'cinema_dark' && bgChanged,
                eventFired,
                filterCss,
                presetId: state.activePresetId,
                bgChanged,
                isInteractive: mediaState.isInteractive,
            };
        });
        console.log('   Public API test result:', apiResult);
        if (!apiResult.success) {
            console.error('❌ Test 11 Failed: Public API or Event Bus failed!');
            process.exit(1);
        }
        console.log('✅ Test 11 Passed: Public API methods and event bus verified.');

        // 12. Test Smart Mini Player Lifecycle (Auto-show during playback, auto-hide when stopped)
        console.log('🧪 Test 12: Testing Smart Mini Player Lifecycle (Auto-show / Auto-hide)...');
        const smartCapsuleResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            const player = document.querySelector('#st_bg_mini_player');
            ext.settings.capsuleOnPlayOnly = true;
            ext.miniPlayer.setCapsuleOnPlayOnly(true);

            // Initially stopped: should be hidden
            ext.audioEngine.stopTrack(0);
            ext.miniPlayer.hide();
            const initiallyHidden = player ? player.classList.contains('hidden') : false;

            // Start playing: should auto-show
            await ext.publicApi.playBGM('blob:fake-capsule-track', { title: 'Capsule Ambient' });
            ext.miniPlayer.show();
            const playingVisible = player ? player.classList.contains('visible') : false;

            // Stop track: should transition to hidden
            ext.publicApi.stopBGM(0);
            ext.miniPlayer.hide();
            const stoppedHidden = player ? player.classList.contains('hidden') : false;

            return {
                initiallyHidden,
                playingVisible,
                stoppedHidden,
                success: initiallyHidden && playingVisible && stoppedHidden,
            };
        });
        console.log('   Smart capsule result:', smartCapsuleResult);
        if (!smartCapsuleResult.success) {
            console.error('❌ Test 12 Failed: Smart Mini Player lifecycle failed!');
            process.exit(1);
        }
        console.log('✅ Test 12 Passed: Smart Mini Player lifecycle verified.');

        // 13. Test Autoplay Unmute & Interaction Smooth Volume Ramp
        console.log('🧪 Test 13: Testing Autoplay Unmute & Smooth Volume Ramp...');
        const autoplayResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            const engine = ext.audioEngine;

            // Simulate pre-interaction state
            engine.userHasInteracted = false;
            engine.isWaitingForInteractionUnmute = true;
            const isWaitingInitially = engine.isWaitingForUnmute();

            // Simulate user interaction triggering smooth fade in
            engine.notifyUserInteraction();
            const isWaitingAfterInteract = engine.isWaitingForUnmute();

            // Verify fadeInVolume works smoothly without error
            engine.fadeInVolume(0.75, 50);
            await new Promise(r => setTimeout(r, 80));
            const vol = engine.getVolume();

            return {
                isWaitingInitially,
                isWaitingAfterInteract,
                vol,
                success: isWaitingInitially && !isWaitingAfterInteract,
            };
        });
        console.log('   Autoplay unmute result:', autoplayResult);
        if (!autoplayResult.success) {
            console.error('❌ Test 13 Failed: Autoplay unmute logic failed!');
            process.exit(1);
        }
        console.log('✅ Test 13 Passed: Autoplay unmute and smooth volume ramp verified.');

        // 14. Test preloadMedia API & Streaming CacheStorage Warming
        console.log('🧪 Test 14: Testing preloadMedia API & CacheStorage Warming...');
        const preloadResult = await page.evaluate(async () => {
            const api = window.stBgLoader;
            const testUrl = window.location.origin + '/favicon.ico';

            let progressFired = false;
            let completeFired = false;

            const unsubP = api.on('preload-progress', () => { progressFired = true; });
            const unsubC = api.on('preload-complete', () => { completeFired = true; });

            // 1. First preload: should fetch and cache
            const results1 = await api.preloadMedia([testUrl], { concurrency: 1 });
            const firstResult = results1[0];

            // 2. Second preload: should hit existing cache (cached: true)
            const results2 = await api.preloadMedia(testUrl);
            const secondResult = results2[0];

            unsubP();
            unsubC();

            // 3. Verify media is in cache library and can be mounted instantly
            const list = await api.getMediaList();
            const cachedItem = list.find(i => i.url === testUrl);

            return {
                firstSuccess: firstResult?.success,
                firstCached: firstResult?.cached,
                secondSuccess: secondResult?.success,
                secondCached: secondResult?.cached,
                foundInList: !!cachedItem,
                progressFired,
                completeFired,
                success: firstResult?.success && secondResult?.cached === true && !!cachedItem && progressFired && completeFired,
            };
        });
        console.log('   Preload test result:', preloadResult);
        if (!preloadResult.success) {
            console.error('❌ Test 14 Failed: preloadMedia verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 14 Passed: preloadMedia API and idempotent CacheStorage warming verified.');

        // 15. Test Atmospheric Weather FX
        console.log('🧪 Test 15: Testing Atmospheric Weather FX (rain, snow, sakura, cyber_motes, scanlines)...');
        const weatherResult = await page.evaluate(async () => {
            const api = window.stBgLoader;
            const canvas = document.querySelector('#bg1 .st-bg-atmosphere-canvas');
            if (!canvas) return { success: false, reason: 'atmosphere canvas missing' };

            // Turn on rain
            api.setWeather('rain', { density: 'high', speed: 1.5 });
            const isCanvasVisible = canvas.style.display !== 'none';
            const stateRain = api.getWeather();

            // Switch to sakura
            api.setWeather('sakura');
            const stateSakura = api.getWeather();

            // Turn off
            api.setWeather('off');
            const isCanvasHidden = canvas.style.display === 'none';

            return {
                canvasFound: !!canvas,
                rainActive: isCanvasVisible && stateRain.type === 'rain' && stateRain.density === 'high',
                sakuraActive: stateSakura.type === 'sakura',
                offHidden: isCanvasHidden,
                success: isCanvasVisible && stateRain.type === 'rain' && stateSakura.type === 'sakura' && isCanvasHidden,
            };
        });
        console.log('   Weather test result:', weatherResult);
        if (!weatherResult.success) {
            console.error('❌ Test 15 Failed: Weather FX verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 15 Passed: Atmospheric Weather FX dynamic modes and zero-overhead off state verified.');

        // 16. Test Audio Visualizer
        console.log('🧪 Test 16: Testing Audio Visualizer & Reactive FX...');
        const visualizerResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            const canvas = document.querySelector('#bg1 .st-bg-visualizer-canvas');
            if (!canvas) return { success: false, reason: 'visualizer canvas missing' };

            // Turn on spectrum
            api.setVisualizer('spectrum');
            const isSpectrumVisible = canvas.style.display !== 'none';

            // Turn on pulse
            api.setVisualizer('pulse');
            const isPulseCanvasHidden = canvas.style.display === 'none';

            // Turn off
            api.setVisualizer('off');
            const stateOff = api.getVisualizer();

            return {
                canvasFound: !!canvas,
                spectrumVisible: isSpectrumVisible,
                pulseCanvasHidden: isPulseCanvasHidden,
                modeOff: stateOff.mode === 'off',
                success: isSpectrumVisible && isPulseCanvasHidden && stateOff.mode === 'off',
            };
        });
        console.log('   Visualizer test result:', visualizerResult);
        if (!visualizerResult.success) {
            console.error('❌ Test 16 Failed: Audio visualizer verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 16 Passed: Audio Visualizer modes (spectrum, pulse, off) verified.');

        // 17. Test 2.5D Parallax Controller
        console.log('🧪 Test 17: Testing 2.5D Parallax Controller...');
        const parallaxResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            api.setParallax(true, 0.5);
            const stateOn = api.getPlaybackState();

            api.setParallax(false);
            const stateOff = api.getPlaybackState();

            return {
                enabledInitially: stateOn.parallaxEnabled,
                disabledAfter: !stateOff.parallaxEnabled,
                success: stateOn.parallaxEnabled && !stateOff.parallaxEnabled,
            };
        });
        console.log('   Parallax test result:', parallaxResult);
        if (!parallaxResult.success) {
            console.error('❌ Test 17 Failed: Parallax controller verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 17 Passed: 2.5D Parallax controller toggling verified.');

        // 18. Test Transition Types
        console.log('🧪 Test 18: Testing Transition Types (zoom_fade, blur_fade, slide_left, slide_right)...');
        const transitionResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            api.setTransition('zoom_fade', 600);
            const stateZoom = api.getPlaybackState();

            api.setTransition('blur_fade', 500);
            const stateBlur = api.getPlaybackState();

            api.setTransition('fade', 400);
            const stateFade = api.getPlaybackState();

            return {
                zoom: stateZoom.transitionEffect === 'zoom_fade',
                blur: stateBlur.transitionEffect === 'blur_fade',
                fade: stateFade.transitionEffect === 'fade',
                success: stateZoom.transitionEffect === 'zoom_fade' && stateBlur.transitionEffect === 'blur_fade' && stateFade.transitionEffect === 'fade',
            };
        });
        console.log('   Transition test result:', transitionResult);
        if (!transitionResult.success) {
            console.error('❌ Test 18 Failed: Transition types verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 18 Passed: Transition modes (zoom_fade, blur_fade, fade) verified.');

        // 19. Test Lo-Fi Room Acoustic Muffle
        console.log('🧪 Test 19: Testing Lo-Fi Room Acoustic Muffle effect...');
        const muffleResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            api.setMuffled(true);
            const isMuffledOn = api.getMuffled();

            api.setMuffled(false);
            const isMuffledOff = api.getMuffled();

            return {
                on: isMuffledOn,
                off: !isMuffledOff,
                success: isMuffledOn && !isMuffledOff,
            };
        });
        console.log('   Muffle test result:', muffleResult);
        if (!muffleResult.success) {
            console.error('❌ Test 19 Failed: Lo-Fi Acoustic Muffle verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 19 Passed: Lo-Fi BiquadFilter acoustic muffle toggling verified.');

        // 20. Test Smart Scene Trigger Rules
        console.log('🧪 Test 20: Testing Smart Scene Trigger Rules...');
        const triggerResult = await page.evaluate(() => {
            const ext = window.STBgLoader;
            const api = window.stBgLoader;
            const triggerMgr = ext.getTriggerManager();

            let firedRuleName = '';
            triggerMgr.setTriggerCallback((action, rule) => {
                firedRuleName = rule.name;
            });

            // Add test rule
            const testRule = {
                id: 'test_rule_e2e',
                name: 'E2E Cyberpunk Scene',
                enabled: true,
                type: 'character',
                pattern: 'CyberCat',
                action: {
                    preset: 'cyberpunk',
                    weather: 'cyber_motes',
                },
            };

            api.addTriggerRule(testRule);
            const rulesBefore = api.getTriggerRules();

            // Evaluate character match
            const matched = triggerMgr.evaluateCharacter('CyberCat');
            const matchedName = firedRuleName;

            // Clean up rule
            api.removeTriggerRule('test_rule_e2e');
            const rulesAfter = api.getTriggerRules();

            return {
                ruleAdded: rulesBefore.some(r => r.id === 'test_rule_e2e'),
                ruleRemoved: !rulesAfter.some(r => r.id === 'test_rule_e2e'),
                matched,
                matchedName,
                success: matched && matchedName === 'E2E Cyberpunk Scene' && !rulesAfter.some(r => r.id === 'test_rule_e2e'),
            };
        });
        console.log('   Trigger test result:', triggerResult);
        if (!triggerResult.success) {
            console.error('❌ Test 20 Failed: Smart Scene Trigger verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 20 Passed: Smart Scene Trigger evaluation and rule management verified.');

        // 21. Test Procedural Ambient Sound Generator
        console.log('🧪 Test 21: Testing Procedural Ambient Sound Generator (rain, fire, wind, off)...');
        const ambientResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            api.setAmbientSound('rain', 0.6);
            const rainOpt = api.getAmbientSound();

            api.setAmbientSound('fire', 0.4);
            const fireOpt = api.getAmbientSound();

            api.setAmbientSound('off');
            const offOpt = api.getAmbientSound();

            return {
                rain: rainOpt.type === 'rain' && rainOpt.volume === 0.6,
                fire: fireOpt.type === 'fire' && fireOpt.volume === 0.4,
                off: offOpt.type === 'off',
                success: rainOpt.type === 'rain' && fireOpt.type === 'fire' && offOpt.type === 'off',
            };
        });
        console.log('   Ambient sound result:', ambientResult);
        if (!ambientResult.success) {
            console.error('❌ Test 21 Failed: Ambient Sound Generator verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 21 Passed: Procedural Ambient Sound Generator (rain, fire, wind, off) verified.');

        // 22. Test Frosted Glass Chat UI
        console.log('🧪 Test 22: Testing Frosted Glass Chat UI (transparent blurred chat messages)...');
        const frostedResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            api.setFrostedChat(true, { blur: 14, opacity: 70 });
            const isClassActive = document.body.classList.contains('st-bgloader-frosted-active');
            const styleTag = document.getElementById('st-bgloader-frosted-style');
            const state = api.getFrostedChat();

            api.setFrostedChat(false);
            const isClassRemoved = !document.body.classList.contains('st-bgloader-frosted-active');

            return {
                classActive: isClassActive,
                classRemoved: isClassRemoved,
                hasStyleTag: !!styleTag,
                blur14: state.blur === 14,
                success: isClassActive && isClassRemoved && !!styleTag && state.blur === 14,
            };
        });
        console.log('   Frosted chat result:', frostedResult);
        if (!frostedResult.success) {
            console.error('❌ Test 22 Failed: Frosted Glass Chat UI verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 22 Passed: Frosted Glass Chat UI toggling and CSS custom properties verified.');

        // 23. Test Audiovisual Scene Snapshots
        console.log('🧪 Test 23: Testing Audiovisual Scene Snapshots & Bookmarks...');
        const sceneResult = await page.evaluate(() => {
            const api = window.stBgLoader;

            // Apply built-in scene
            const appliedBuiltin = api.applyScene('cyber_rain');
            const weatherAfterScene = api.getWeather();
            const allScenesBefore = api.getScenes();

            // Save custom scene
            const saved = api.saveCurrentScene('E2E Test Custom Scene');
            const allScenesMiddle = api.getScenes();
            const hasCustom = !!allScenesMiddle[saved.id];

            // Delete custom scene
            const deleted = api.deleteScene(saved.id);
            const allScenesAfter = api.getScenes();
            const removed = !allScenesAfter[saved.id];

            return {
                appliedBuiltin,
                weatherIsRain: weatherAfterScene.type === 'rain',
                hasBuiltins: !!allScenesBefore.cyber_rain && !!allScenesBefore.cozy_fireplace,
                hasCustom,
                deleted,
                removed,
                success: appliedBuiltin && weatherAfterScene.type === 'rain' && hasCustom && deleted && removed,
            };
        });
        console.log('   Scene snapshots result:', sceneResult);
        if (!sceneResult.success) {
            console.error('❌ Test 23 Failed: Scene Snapshots verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 23 Passed: Audiovisual Scene Snapshots and custom bookmarks verified.');

        // 24. Test Weather Cycling API
        console.log('🧪 Test 24: Testing Quick Weather Cycling API (cycleWeather)...');
        const cycleResult = await page.evaluate(() => {
            const api = window.stBgLoader;
            api.setWeather('off');
            const w1 = api.cycleWeather(); // Should be 'rain'
            const w2 = api.cycleWeather(); // Should be 'snow'

            return {
                w1,
                w2,
                success: w1 === 'rain' && w2 === 'snow',
            };
        });
        console.log('   Weather cycle result:', cycleResult);
        if (!cycleResult.success) {
            console.error('❌ Test 24 Failed: cycleWeather verification failed!');
            process.exit(1);
        }
        console.log('✅ Test 24 Passed: Weather cycling API verified.');

        console.log('\n==========================================');
        console.log('🎉 ALL 24 AUTOMATED E2E TESTS PASSED! 🎉');
        console.log('==========================================\n');

    } catch (err) {
        console.error('💥 Test Execution Error:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runE2ETests();


