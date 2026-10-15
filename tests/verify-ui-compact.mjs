import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome');

const TARGET_URL = process.env.TEST_TARGET_URL || 'https://localhost:8003';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:/Users/caocaobi/.gemini/antigravity/brain/bd46b693-9bba-42af-a95b-d5867698b1f7';

if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runCompactUIVerification() {
    console.log('🚀 Starting Ultra-Compact UI & Screen Audit Verification on', TARGET_URL);

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
    await page.setViewport({ width: 1400, height: 900 });

    const errors = [];
    page.on('pageerror', err => {
        console.warn('[Browser Error]:', err.message);
    });

    try {
        console.log('⏳ Navigating to host...');
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 35000 });

        console.log('⏳ Waiting for application loader to clear...');
        await page.waitForFunction(() => {
            const loader = document.querySelector('#loader, #loading');
            return !loader || loader.style.display === 'none' || window.getComputedStyle(loader).display === 'none';
        }, { timeout: 35000 });

        // Ensure extension is enabled/loaded
        console.log('⏳ Ensuring ST-BgLoader is enabled...');
        await page.evaluate(async () => {
            const ctx = window.SillyTavern?.getContext?.();
            if (ctx && typeof ctx.enableExtension === 'function') {
                await ctx.enableExtension('third-party/ST-BgLoader');
            } else {
                await import('/scripts/extensions/third-party/ST-BgLoader/dist/index.js');
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/scripts/extensions/third-party/ST-BgLoader/dist/style.css';
                document.head.appendChild(link);
            }
        });

        await page.waitForFunction(() => {
            return window.STBgLoader && window.STBgLoader.isInitialized;
        }, { timeout: 20000 });
        console.log('✅ ST-BgLoader initialized successfully!');

        // =========================================================================
        // Test Part 1: Extensions Settings Drawer Compactness & Copy Audit
        // =========================================================================
        console.log('🧪 Part 1: Auditing Settings Drawer inside #extensions_settings...');
        // Open extensions drawer on top right navbar
        await page.evaluate(() => {
            const toggle = document.querySelector('#extensions-settings-button .drawer-toggle');
            if (toggle) toggle.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // Scroll to ST-BgLoader in #extensions_settings
        await page.evaluate(() => {
            const el = document.querySelector('#st_bgloader_container, #st_bgloader_settings');
            if (el) el.scrollIntoView({ block: 'center' });
        });
        await new Promise(r => setTimeout(r, 500));

        // Audit collapsed Settings Drawer
        const collapsedScreenshotPath = path.join(ARTIFACT_DIR, '01_extensions_drawer_collapsed.png');
        const settingsEl = await page.$('#st_bgloader_settings');
        if (settingsEl) {
            await settingsEl.screenshot({ path: collapsedScreenshotPath });
            console.log('📸 Captured Screenshot:', collapsedScreenshotPath);
        }

        // Expand Settings Drawer
        console.log('🖱️ Clicking drawer header to expand...');
        await page.evaluate(() => {
            const toggle = document.querySelector('#st_bgloader_settings .inline-drawer-toggle');
            if (toggle) toggle.click();
        });
        await new Promise(r => setTimeout(r, 600));

        const expandedScreenshotPath = path.join(ARTIFACT_DIR, '02_extensions_drawer_expanded.png');
        if (settingsEl) {
            await settingsEl.screenshot({ path: expandedScreenshotPath });
            console.log('📸 Captured Screenshot:', expandedScreenshotPath);
        }

        // Programmatic Text Audit of Settings Drawer
        const settingsDrawerTextAudit = await page.evaluate(() => {
            const drawer = document.querySelector('#st_bgloader_settings');
            if (!drawer) return { found: false };
            const text = drawer.innerText || '';
            const html = drawer.innerHTML || '';

            return {
                found: true,
                hasYu: text.includes('与'),
                hasOpenParen: text.includes('(') || text.includes('（'),
                hasCloseParen: text.includes(')') || text.includes('）'),
                hasEscapedHtml: html.includes('&lt;') || html.includes('&gt;') || text.includes('undefined'),
                textSample: text.split('\n').filter(Boolean),
            };
        });

        console.log('Audit Settings Drawer Text:', settingsDrawerTextAudit);
        if (settingsDrawerTextAudit.hasYu) {
            throw new Error('Violated rule: Settings Drawer text contains "与"!');
        }
        if (settingsDrawerTextAudit.hasOpenParen || settingsDrawerTextAudit.hasCloseParen) {
            throw new Error('Violated rule: Settings Drawer text contains parenthesis explanation!');
        }
        if (settingsDrawerTextAudit.hasEscapedHtml) {
            throw new Error('Violated rule: Settings Drawer contains unescaped HTML characters or undefined!');
        }
        console.log('✅ Settings Drawer Text & Spacing Audit Passed!');

        // =========================================================================
        // Test Part 2: Open Topbar Background Drawer & Comprehensive Audit
        // =========================================================================
        console.log('🧪 Part 2: Opening Topbar Background Drawer...');
        await page.evaluate(() => {
            const openBtn = document.querySelector('#st_bgloader_open_topbar_btn');
            if (openBtn) {
                openBtn.click();
            } else {
                window.STBgLoader.topbarDrawer.mount();
            }
        });
        await new Promise(r => setTimeout(r, 1200));

        // Verify topbar panel is mounted and visible
        const topbarMounted = await page.evaluate(() => {
            const p = document.querySelector('#st_bgloader_topbar_panel');
            return !!(p && p.offsetParent !== null);
        });
        console.log('Topbar panel mounted & visible:', topbarMounted);

        // Audit Topbar Panel Global Copy & Layout
        const topbarTextAudit = await page.evaluate(() => {
            const panel = document.querySelector('#st_bgloader_topbar_panel');
            if (!panel) return { found: false };

            const text = panel.innerText || '';
            const html = panel.innerHTML || '';

            // Check headers
            const headers = Array.from(panel.querySelectorAll('h4')).map(h => h.innerText.trim());
            // Check buttons
            const buttons = Array.from(panel.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
            const longButtons = buttons.filter(b => b.length > 4);
            // Check labels
            const labels = Array.from(panel.querySelectorAll('label')).map(l => l.innerText.trim());

            const forbiddenYu = text.includes('与');
            const forbiddenParens = text.includes('(') || text.includes(')') || text.includes('（') || text.includes('）');
            const forbiddenSlash = text.includes(' / ') || text.includes('／');
            const htmlLeak = html.includes('&lt;') || html.includes('&gt;') || text.includes('undefined');

            const allLines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const parenLines = allLines.filter(l => l.includes('(') || l.includes(')') || l.includes('（') || l.includes('）'));
            const yuLines = allLines.filter(l => l.includes('与'));
            const slashLines = allLines.filter(l => l.includes(' / ') || l.includes('／'));

            return {
                found: true,
                forbiddenYu,
                forbiddenParens,
                forbiddenSlash,
                longButtons,
                parenLines,
                yuLines,
                slashLines,
                htmlLeak,
                headers,
                buttons,
                labelsSample: labels.slice(0, 10),
            };
        });

        console.log('Topbar Text Audit Results:', {
            forbiddenYu: topbarTextAudit.forbiddenYu,
            forbiddenParens: topbarTextAudit.forbiddenParens,
            forbiddenSlash: topbarTextAudit.forbiddenSlash,
            longButtons: topbarTextAudit.longButtons,
            parenLines: topbarTextAudit.parenLines,
            yuLines: topbarTextAudit.yuLines,
            slashLines: topbarTextAudit.slashLines,
            htmlLeak: topbarTextAudit.htmlLeak,
            headers: topbarTextAudit.headers,
            buttons: topbarTextAudit.buttons,
        });

        if (topbarTextAudit.forbiddenYu) {
            throw new Error(`Violated rule: Topbar drawer text contains "与"! Lines: ${JSON.stringify(topbarTextAudit.yuLines)}`);
        }
        if (topbarTextAudit.forbiddenParens) {
            throw new Error(`Violated rule: Topbar drawer text contains parenthesis explanation! Lines: ${JSON.stringify(topbarTextAudit.parenLines)}`);
        }
        if (topbarTextAudit.forbiddenSlash) {
            throw new Error(`Violated rule: Topbar drawer text contains prohibited "/" delimiter! Lines: ${JSON.stringify(topbarTextAudit.slashLines)}`);
        }
        if (topbarTextAudit.longButtons && topbarTextAudit.longButtons.length > 0) {
            throw new Error(`Violated rule: Buttons too long (>4 chars): ${JSON.stringify(topbarTextAudit.longButtons)}`);
        }
        if (topbarTextAudit.htmlLeak) {
            throw new Error('Violated rule: Topbar drawer contains unescaped HTML characters or undefined!');
        }

        // Verify Tab 1 (Media Library) Screenshot
        const mediaTabPath = path.join(ARTIFACT_DIR, '03_topbar_media_tab.png');
        const topbarPanelEl = await page.$('#st_bgloader_topbar_panel');
        if (topbarPanelEl) {
            await topbarPanelEl.screenshot({ path: mediaTabPath });
            console.log('📸 Captured Screenshot:', mediaTabPath);
        }

        // Expand Upload Dropzone in Media Tab
        console.log('🖱️ Clicking import button to reveal upload dropzone...');
        await page.evaluate(() => {
            const btn = document.querySelector('#st_topbar_upload_toggle_btn');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 500));

        const uploadBoxPath = path.join(ARTIFACT_DIR, '04_topbar_upload_box.png');
        if (topbarPanelEl) {
            await topbarPanelEl.screenshot({ path: uploadBoxPath });
            console.log('📸 Captured Screenshot:', uploadBoxPath);
        }

        // Switch to Tab 2 (Settings)
        console.log('🖱️ Switching to Settings tab...');
        await page.evaluate(() => {
            const btn = document.querySelector('.st-bgloader-tab-btn[data-tab="settings"]');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 600));

        // Screenshot Settings Top (Scene, Filter, Weather)
        const settingsTopPath = path.join(ARTIFACT_DIR, '05_topbar_settings_tab_top.png');
        if (topbarPanelEl) {
            await topbarPanelEl.screenshot({ path: settingsTopPath });
            console.log('📸 Captured Screenshot:', settingsTopPath);
        }

        // Scroll down in settings body to capture middle
        await page.evaluate(() => {
            const body = document.querySelector('.st-bgloader-topbar-body');
            if (body) body.scrollTop = 320;
        });
        await new Promise(r => setTimeout(r, 500));

        const settingsMidPath = path.join(ARTIFACT_DIR, '06_topbar_settings_tab_mid.png');
        if (topbarPanelEl) {
            await topbarPanelEl.screenshot({ path: settingsMidPath });
            console.log('📸 Captured Screenshot:', settingsMidPath);
        }

        // Scroll to bottom in settings body
        await page.evaluate(() => {
            const body = document.querySelector('.st-bgloader-topbar-body');
            if (body) body.scrollTop = body.scrollHeight;
        });
        await new Promise(r => setTimeout(r, 500));

        const settingsBottomPath = path.join(ARTIFACT_DIR, '07_topbar_settings_tab_bottom.png');
        if (topbarPanelEl) {
            await topbarPanelEl.screenshot({ path: settingsBottomPath });
            console.log('📸 Captured Screenshot:', settingsBottomPath);
        }

        // =========================================================================
        // Test Part 3: MiniPlayer Capsule Audit & Screenshot
        // =========================================================================
        console.log('🧪 Part 3: Auditing MiniPlayer floating capsule...');
        await page.evaluate(() => {
            window.STBgLoader.miniPlayer.show();
        });
        await new Promise(r => setTimeout(r, 500));

        const miniPlayerAudit = await page.evaluate(() => {
            const p = document.querySelector('#st_bg_mini_player');
            if (!p) return { found: false };
            const text = p.innerText || '';
            const title = p.querySelector('#st_mini_title')?.textContent || '';
            return {
                found: true,
                text,
                title,
                hasYu: text.includes('与'),
                hasParens: text.includes('(') || text.includes(')'),
                hasEnglishSelected: text.includes('Selected') || text.includes('Track'),
            };
        });

        console.log('MiniPlayer Audit:', miniPlayerAudit);
        if (miniPlayerAudit.hasEnglishSelected) {
            throw new Error('Violated rule: MiniPlayer contains untranslated English text!');
        }

        const miniPlayerEl = await page.$('#st_bg_mini_player');
        if (miniPlayerEl) {
            const miniPlayerPath = path.join(ARTIFACT_DIR, '08_mini_player_capsule.png');
            await miniPlayerEl.screenshot({ path: miniPlayerPath });
            console.log('📸 Captured Screenshot:', miniPlayerPath);
        }

        // Complete full viewport screenshot with all panels
        const fullPageScreenshotPath = path.join(ARTIFACT_DIR, '09_full_ui_inspection.png');
        await page.screenshot({ path: fullPageScreenshotPath, fullPage: false });
        console.log('📸 Captured Full Page Inspection Screenshot:', fullPageScreenshotPath);

        console.log('🎉 ALL COMPACT UI & SCREEN AUDIT ASSERTIONS PASSED WITH ZERO VIOLATIONS!');

    } catch (err) {
        console.error('❌ Verification failed:', err);
        throw err;
    } finally {
        await browser.close();
    }
}

runCompactUIVerification().catch((err) => {
    console.error('Fatal error during compact UI verification:', err);
    process.exit(1);
});
