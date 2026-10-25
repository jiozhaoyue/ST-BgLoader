// 共享引导：确保被测页面上 ST-BgLoader 已装载。
// 与 tests/e2e.mjs 内联的启用逻辑保持同一语义：优先走宿主 enableExtension；
// 宿主没有该 API（如 Luker）或扩展被实例禁用时，直接 import 扩展模块兜底——
// 只影响当前页面会话，不改动实例的禁用清单（探针零残留）。
export async function ensureExtensionLoaded(page) {
    await page.evaluate(async () => {
        const ctx = window.SillyTavern?.getContext?.();
        if (ctx && typeof ctx.enableExtension === 'function') {
            await ctx.enableExtension('third-party/ST-BgLoader');
        } else if (!window.STBgLoader) {
            await import('/scripts/extensions/third-party/ST-BgLoader/dist/index.js');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/scripts/extensions/third-party/ST-BgLoader/dist/style.css';
            document.head.appendChild(link);
        }
    });
}
