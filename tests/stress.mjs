import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://dev.localho.st:8003';

async function runStressTests() {
    console.log('⚡ Starting Large File Streaming & Resilience Stress Tests on', TARGET_URL);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: [
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--autoplay-policy=no-user-gesture-required',
            '--js-flags=--max-old-space-size=4096',
        ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const logs = [];
    page.on('console', msg => {
        logs.push(`[Browser ${msg.type()}]: ${msg.text()}`);
    });
    page.on('pageerror', err => {
        logs.push(`[Browser Error]: ${err.message}`);
    });

    try {
        console.log('⏳ Navigating to SillyTavern...');
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 35000 });

        console.log('⏳ Waiting for STBgLoader initialization...');
        await page.waitForFunction(() => {
            return window.STBgLoader && window.STBgLoader.isInitialized;
        }, { timeout: 35000 });

        // ========================================================
        // TEST 1: 100MB+ Synthetic Media Stream Stress Test
        // ========================================================
        console.log('\n🧪 STRESS TEST 1: 105MB Large Binary Stream Storage & Mounting...');
        const largeFileResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            const targetBytes = 105 * 1024 * 1024; // 105MB

            // Construct 105MB using 1MB reusable buffer to avoid browser JS heap exhaustion
            const chunkSize = 1024 * 1024; // 1MB
            const chunk = new Uint8Array(chunkSize);
            for (let i = 0; i < 100; i++) chunk[i] = i % 256;

            const chunks = new Array(105).fill(chunk);
            const largeBlob = new Blob(chunks, { type: 'video/mp4' });

            const startTime = performance.now();
            const item = await ext.cacheManager.saveMedia(
                largeBlob,
                'extreme-4k-bg-105mb.mp4',
                'video',
                'local'
            );
            const saveDurationMs = Math.round(performance.now() - startTime);

            // Verify metadata
            const cachedItem = await ext.cacheManager.getMedia(item.id);

            // Mount the 105MB video
            const mountStart = performance.now();
            await ext.applyMedia(item);
            const mountDurationMs = Math.round(performance.now() - mountStart);

            const videoEl = document.querySelector('#bg1 video.st-bg-video-element');
            const blobUrl = videoEl ? videoEl.src : '';

            // Clean up to free storage
            await ext.cacheManager.deleteMedia(item.id);

            return {
                id: item.id,
                size: item.size,
                matchesSize: item.size === targetBytes,
                cachedFound: !!cachedItem,
                saveDurationMs,
                mountDurationMs,
                hasVideoEl: !!videoEl,
                blobUrlStarts: blobUrl.slice(0, 15),
                success: item.size === targetBytes && !!cachedItem && !!videoEl,
            };
        });

        console.log('   105MB Streaming Result:', largeFileResult);
        if (!largeFileResult.success) {
            console.error('❌ Stress Test 1 Failed!');
            process.exit(1);
        }
        console.log(`✅ Stress Test 1 Passed: 105MB streamed into CacheStorage in ${largeFileResult.saveDurationMs}ms, mounted in ${largeFileResult.mountDurationMs}ms.`);

        // ========================================================
        // TEST 2: High-Frequency Rapid Switching Race Condition
        // ========================================================
        console.log('\n🧪 STRESS TEST 2: Rapid Switching Stress (10 cross-media switches in <400ms)...');
        const rapidResult = await page.evaluate(async () => {
            const api = window.stBgLoader;

            const items = [
                { type: 'image', url: 'https://dev.localho.st/sample1.png' },
                { type: 'html', url: 'https://dev.localho.st/sample-canvas.html' },
                { type: 'video', url: 'https://dev.localho.st/sample-video.mp4' },
                { type: 'audio', url: 'https://dev.localho.st/sample-bgm.mp3' },
                { type: 'svg', url: 'https://dev.localho.st/vector.svg' },
            ];

            // Rapid fire 10 mounts with 20ms delay (much faster than 450ms crossfade)
            for (let i = 0; i < 10; i++) {
                const target = items[i % items.length];
                if (target.type === 'audio') {
                    api.playBGM(target.url);
                } else {
                    api.setBackground(target.url, { type: target.type });
                }
                await new Promise(r => setTimeout(r, 25));
            }

            // Wait 600ms for final settle
            await new Promise(r => setTimeout(r, 600));

            // Verify clean DOM state
            const container = document.querySelector('#bg1 .st-bg-media-container');
            const activeLayers = container?.querySelectorAll('.st-bg-layer[style*="opacity: 1"]');
            const hiddenLayers = container?.querySelectorAll('.st-bg-layer[style*="opacity: 0"]');
            const totalVideos = container?.querySelectorAll('video');
            const totalIframes = container?.querySelectorAll('iframe');

            return {
                activeLayerCount: activeLayers ? activeLayers.length : 0,
                hiddenLayerCount: hiddenLayers ? hiddenLayers.length : 0,
                totalVideos: totalVideos ? totalVideos.length : 0,
                totalIframes: totalIframes ? totalIframes.length : 0,
                success: (activeLayers?.length === 1) && ((totalVideos?.length || 0) + (totalIframes?.length || 0) <= 2),
            };
        });

        console.log('   Rapid Switch Result:', rapidResult);
        if (!rapidResult.success) {
            console.error('❌ Stress Test 2 Failed: Zombie elements or multiple active layers detected!');
            process.exit(1);
        }
        console.log('✅ Stress Test 2 Passed: Double-buffering cancelled cleanly, exactly 1 active layer settles.');

        // ========================================================
        // TEST 3: Extreme Edge Cases & Corrupted Media Resilience
        // ========================================================
        console.log('\n🧪 STRESS TEST 3: Malformed & 0-byte Media Resilience...');
        const edgeResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;

            // 1. Zero-byte blob
            const emptyBlob = new Blob([], { type: 'video/mp4' });
            const emptyItem = await ext.cacheManager.saveMedia(emptyBlob, 'corrupted_zero_byte.mp4', 'video', 'local');
            let zeroByteHandled = true;
            try {
                await ext.applyMedia(emptyItem);
            } catch (err) {
                zeroByteHandled = false;
            }

            // 2. Non-existent 404 URL preload
            const preload404 = await ext.publicApi.preloadMedia('https://dev.localho.st:8003/non-existent-file-404.mp4');
            const handled404 = preload404.length === 1 && preload404[0].success === false;

            // Clean up empty item
            await ext.cacheManager.deleteMedia(emptyItem.id);

            return {
                zeroByteHandled,
                handled404,
                errorReported: preload404[0]?.error,
                success: zeroByteHandled && handled404,
            };
        });

        console.log('   Edge Case Result:', edgeResult);
        if (!edgeResult.success) {
            console.error('❌ Stress Test 3 Failed: Corrupted media crashed plugin!');
            process.exit(1);
        }
        console.log('✅ Stress Test 3 Passed: 0-byte blobs and 404 network errors caught without breaking state.');

        // ========================================================
        // TEST 4: Blob URL Lifecycle & Revocation Verification
        // ========================================================
        console.log('\n🧪 STRESS TEST 4: Blob URL Lifecycle & Memory Deallocation Audit...');
        const revokeResult = await page.evaluate(async () => {
            const ext = window.STBgLoader;
            let revokeCalledWith = null;

            const origRevoke = URL.revokeObjectURL;
            URL.revokeObjectURL = function(url) {
                revokeCalledWith = url;
                origRevoke.call(URL, url);
            };

            // Save and mount a test item
            const sampleBlob = new Blob(['sample-test-content'], { type: 'text/html' });
            const item = await ext.cacheManager.saveMedia(sampleBlob, 'temp-revoke-test.html', 'html', 'local');
            const blobUrl = await ext.cacheManager.getMediaBlobUrl(item);

            // Delete item and verify revoke was invoked
            await ext.cacheManager.deleteMedia(item.id);
            URL.revokeObjectURL = origRevoke;

            return {
                blobUrlCreated: blobUrl.startsWith('blob:'),
                revokeInvoked: revokeCalledWith === blobUrl,
                success: blobUrl.startsWith('blob:') && revokeCalledWith === blobUrl,
            };
        });

        console.log('   Blob Revoke Audit Result:', revokeResult);
        if (!revokeResult.success) {
            console.error('❌ Stress Test 4 Failed: Blob URL not revoked upon deletion!');
            process.exit(1);
        }
        console.log('✅ Stress Test 4 Passed: Blob URLs are properly revoked and deallocated on deletion.');

        console.log('\n============================================================');
        console.log('🎉 ALL 4 EXTREME STRESS & LARGE FILE TESTS PASSED! 🎉');
        console.log('============================================================\n');

    } catch (err) {
        console.error('💥 Stress Test Error:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runStressTests();
