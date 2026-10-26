/**
 * Harness entry: install the host seam FIRST, then boot the real extension entry.
 * ES modules evaluate in import order, so the stub's globals exist before src/index.ts
 * runs its module-level bootstrap.
 */
import './host-stub';
import '../src/index';

const status = document.getElementById('dev-status');

function setStatus(text: string, ok: boolean): void {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('st-bgloader-dev-ok', ok);
    status.classList.toggle('st-bgloader-dev-bad', !ok);
}

// Autoplay policy: a real user gesture is required before any AudioContext may start.
// Creating and resuming one here marks the document as unlocked for the rest of the session.
const unlockBtn = document.getElementById('dev-unlock-audio');
unlockBtn?.addEventListener('click', async () => {
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        await ctx.resume();
        await ctx.close();
        unlockBtn.textContent = '音频已解锁';
        unlockBtn.setAttribute('disabled', 'true');
    } catch (err) {
        console.warn('[harness] audio unlock failed:', err);
    }
});

// Drawer toggle: the extension reads `.openDrawer` on #Backgrounds to decide whether
// the drawer is already open, so the harness keeps that class in sync with its own.
const drawer = document.getElementById('Backgrounds');
document.getElementById('backgrounds-drawer-toggle')?.addEventListener('click', () => {
    if (!drawer) return;
    const open = drawer.classList.toggle('openDrawer');
    drawer.classList.toggle('st-bgloader-dev-open', open);
});

document.getElementById('dev-emit-message')?.addEventListener('click', () => {
    (window as any).__devHarness?.emitMessage('雨越下越大，书店里飘着旧纸的味道。');
});

document.getElementById('dev-emit-chat')?.addEventListener('click', () => {
    (window as any).__devHarness?.emitChatChanged('harness-chat-2');
});

// The extension logs a tagged error instead of throwing; surface either outcome.
window.addEventListener('error', e => setStatus(`运行错误：${e.message}`, false));
window.addEventListener('unhandledrejection', e => setStatus(`未处理拒绝：${String(e.reason)}`, false));

window.setTimeout(() => {
    const api = (window as any).STBgLoader?.getAPI?.();
    if (api) setStatus('扩展已启动（API 就绪）', true);
    else setStatus('扩展未启动：查看控制台', false);
}, 1200);
