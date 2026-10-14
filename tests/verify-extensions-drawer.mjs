import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome');

const TARGET_URL = process.env.TEST_TARGET_URL || 'https://localhost:8003';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:/Users/caocaobi/.gemini/antigravity/brain/cfee64b0-a461-4cf7-b44a-0593b2c6a0dd';

async function runVerification() {
    console.log('🚀 Starting Automated Extension Drawer Verification on', TARGET_URL);

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

        // Open extensions drawer on right top navbar
        console.log('⏳ Opening extensions settings drawer...');
        await page.evaluate(() => {
            const toggle = document.querySelector('#extensions-settings-button .drawer-toggle');
            if (toggle) toggle.click();
        });
        await new Promise(r => setTimeout(r, 1200));

        // Scroll to ST-BgLoader in #extensions_settings
        await page.evaluate(() => {
            const el = document.querySelector('#st_bgloader_container, #st_bgloader_settings');
            if (el) el.scrollIntoView({ block: 'center' });
        });
        await new Promise(r => setTimeout(r, 600));

        // =========================================================================
        // Test Step 1: DOM Hierarchy & Structure Audit
        // =========================================================================
        console.log('🧪 Step 1: Auditing DOM Structure & Host Hierarchy...');
        const domStructure = await page.evaluate(() => {
            const container = document.querySelector('#st_bgloader_container');
            const drawer = document.querySelector('#st_bgloader_settings');
            const toggle = drawer?.querySelector('.inline-drawer-toggle.inline-drawer-header');
            const icon = drawer?.querySelector('.inline-drawer-icon');
            const content = drawer?.querySelector('.inline-drawer-content');
            const masterCard = content?.querySelector('.st-bgloader-master-card');

            return {
                hasContainer: !!container,
                containerClass: container?.className,
                containerExtensionName: container?.getAttribute('data-extension-name'),
                containerDisplay: container ? window.getComputedStyle(container).display : null,
                containerPadding: container ? window.getComputedStyle(container).padding : null,
                hasDrawer: !!drawer,
                drawerClass: drawer?.className,
                hasToggle: !!toggle,
                hasIcon: !!icon,
                hasContent: !!content,
                hasMasterCard: !!masterCard,
            };
        });

        console.log('DOM Structure result:', domStructure);

        if (!domStructure.hasContainer || !domStructure.hasDrawer || !domStructure.hasToggle || !domStructure.hasContent) {
            throw new Error(`DOM hierarchy audit failed: ${JSON.stringify(domStructure)}`);
        }
        if (!domStructure.containerClass?.includes('extension_container')) {
            throw new Error(`Outer container must have class "extension_container", got: ${domStructure.containerClass}`);
        }
        console.log('✅ Step 1 Passed: DOM Structure conforms strictly to host native extension standards.');

        // =========================================================================
        // Test Step 2: Width & Alignment Assertion Against Neighbors
        // =========================================================================
        console.log('🧪 Step 2: Asserting Width & Pixel Alignment Against Neighbor Extensions...');
        const alignment = await page.evaluate(() => {
            const stHeader = document.querySelector('#st_bgloader_settings .inline-drawer-header');
            const stRect = stHeader?.getBoundingClientRect();

            // Find all other visible inline-drawer-headers in the same #extensions_settings column
            const container = document.querySelector('#extensions_settings');
            const allHeaders = Array.from(container?.querySelectorAll('.inline-drawer-header') || [])
                .filter(el => el !== stHeader && el.getBoundingClientRect().width > 50)
                .map(el => {
                    const rect = el.getBoundingClientRect();
                    return {
                        text: el.textContent?.trim().slice(0, 25),
                        width: rect.width,
                        left: rect.left,
                        right: rect.right,
                    };
                });

            return {
                st: {
                    width: stRect?.width,
                    left: stRect?.left,
                    right: stRect?.right,
                },
                neighbors: allHeaders,
            };
        });

        console.log('ST-BgLoader Header metrics:', alignment.st);
        console.log(`Found ${alignment.neighbors.length} neighbor extension headers.`);

        if (!alignment.st.width || alignment.st.width <= 0) {
            throw new Error('ST-BgLoader header width is 0 or undefined!');
        }

        for (const neighbor of alignment.neighbors) {
            const deltaWidth = Math.abs(alignment.st.width - neighbor.width);
            const deltaLeft = Math.abs(alignment.st.left - neighbor.left);
            const deltaRight = Math.abs(alignment.st.right - neighbor.right);

            console.log(`  Comparing with [${neighbor.text}]: width diff = ${deltaWidth.toFixed(3)}px, left diff = ${deltaLeft.toFixed(3)}px, right diff = ${deltaRight.toFixed(3)}px`);

            if (deltaWidth >= 1.0) {
                throw new Error(`Width mismatch with [${neighbor.text}]: ST=${alignment.st.width}px, neighbor=${neighbor.width}px, diff=${deltaWidth}px (must be < 1px)!`);
            }
            if (deltaLeft >= 1.0) {
                throw new Error(`Left alignment mismatch with [${neighbor.text}]: ST=${alignment.st.left}px, neighbor=${neighbor.left}px, diff=${deltaLeft}px!`);
            }
        }
        console.log('✅ Step 2 Passed: Header width and alignment perfectly matches all neighbor extensions with 0px deviation!');

        // Take initial collapsed screenshot
        const collapsedShotPath = path.join(ARTIFACT_DIR, 'extensions_drawer_collapsed_aligned.png');
        await page.screenshot({ path: collapsedShotPath, fullPage: false });
        console.log('📸 Captured Screenshot: extensions_drawer_collapsed_aligned.png');

        // =========================================================================
        // Test Step 3: Expand Toggle Interaction Test
        // =========================================================================
        console.log('🧪 Step 3: Testing Drawer Expand Toggle Interaction...');

        // Verify initial state is closed
        const stateBefore = await page.evaluate(() => {
            const content = document.querySelector('#st_bgloader_settings .inline-drawer-content');
            const icon = document.querySelector('#st_bgloader_settings .inline-drawer-icon');
            return {
                display: content ? window.getComputedStyle(content).display : null,
                height: content ? content.getBoundingClientRect().height : null,
                isDown: icon?.classList.contains('down') || icon?.classList.contains('fa-circle-chevron-down'),
            };
        });
        console.log('State before click:', stateBefore);
        if (stateBefore.display !== 'none' && stateBefore.height > 5) {
            throw new Error(`Initial state should be collapsed, but got display=${stateBefore.display}, height=${stateBefore.height}`);
        }

        // Perform real mouse click on the toggle header
        console.log('🖱️ Clicking toggle header to expand...');
        await page.click('#st_bgloader_settings .inline-drawer-toggle');
        await new Promise(r => setTimeout(r, 800));

        // Verify expanded state
        const stateExpanded = await page.evaluate(() => {
            const content = document.querySelector('#st_bgloader_settings .inline-drawer-content');
            const icon = document.querySelector('#st_bgloader_settings .inline-drawer-icon');
            return {
                display: content ? window.getComputedStyle(content).display : null,
                height: content ? content.getBoundingClientRect().height : null,
                isUp: icon?.classList.contains('up') || icon?.classList.contains('fa-circle-chevron-up'),
            };
        });
        console.log('State after expand click:', stateExpanded);

        if (stateExpanded.display === 'none' || stateExpanded.height <= 20) {
            throw new Error(`Drawer failed to expand! display=${stateExpanded.display}, height=${stateExpanded.height}`);
        }
        if (!stateExpanded.isUp) {
            throw new Error('Chevron icon did not transition to "up" state on expand!');
        }
        console.log(`✅ Drawer expanded successfully! Content height: ${stateExpanded.height.toFixed(2)}px`);

        // Take expanded screenshot
        const expandedShotPath = path.join(ARTIFACT_DIR, 'extensions_drawer_expanded.png');
        await page.screenshot({ path: expandedShotPath, fullPage: false });
        console.log('📸 Captured Screenshot: extensions_drawer_expanded.png');

        // =========================================================================
        // Test Step 4: Collapse Toggle Interaction Test
        // =========================================================================
        console.log('🧪 Step 4: Testing Drawer Collapse Toggle Interaction...');

        // Click toggle again to collapse
        console.log('🖱️ Clicking toggle header again to collapse...');
        await page.click('#st_bgloader_settings .inline-drawer-toggle');
        await new Promise(r => setTimeout(r, 800));

        // Verify collapsed state
        const stateCollapsedAgain = await page.evaluate(() => {
            const content = document.querySelector('#st_bgloader_settings .inline-drawer-content');
            const icon = document.querySelector('#st_bgloader_settings .inline-drawer-icon');
            return {
                display: content ? window.getComputedStyle(content).display : null,
                height: content ? content.getBoundingClientRect().height : null,
                isDown: icon?.classList.contains('down') || icon?.classList.contains('fa-circle-chevron-down'),
            };
        });
        console.log('State after collapse click:', stateCollapsedAgain);

        if (stateCollapsedAgain.display !== 'none' && stateCollapsedAgain.height > 5) {
            throw new Error(`Drawer failed to collapse! display=${stateCollapsedAgain.display}, height=${stateCollapsedAgain.height}`);
        }
        if (!stateCollapsedAgain.isDown) {
            throw new Error('Chevron icon did not transition back to "down" state on collapse!');
        }
        console.log('✅ Step 4 Passed: Drawer collapsed smoothly back to closed state.');

        // Take re-collapsed screenshot
        const recollapsedShotPath = path.join(ARTIFACT_DIR, 'extensions_drawer_recollapsed.png');
        await page.screenshot({ path: recollapsedShotPath, fullPage: false });
        console.log('📸 Captured Screenshot: extensions_drawer_recollapsed.png');

        console.log('\n🎉 ALL AUTOMATED VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');

    } catch (err) {
        console.error('❌ Verification Failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runVerification();
