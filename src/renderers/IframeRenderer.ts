// An iframe removed before its load completes (rapid switching) or pointed at a stalled
// host never fires onload; every render must settle anyway or the mount chain hangs.
const RENDER_SETTLE_TIMEOUT_MS = 8000;

export class IframeRenderer {
    private iframeElement: HTMLIFrameElement | null = null;
    private container: HTMLElement;
    private pendingSettle: (() => void) | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public async render(contentOrUrl: string, isUrl: boolean = false): Promise<HTMLIFrameElement> {
        this.destroy();

        const iframe = document.createElement('iframe');
        iframe.className = 'st-bg-iframe-element';
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'auto'; // allow user interaction if needed, or none
        iframe.style.transition = 'opacity 400ms ease-in-out';

        this.container.appendChild(iframe);
        this.iframeElement = iframe;

        return new Promise<HTMLIFrameElement>((resolve) => {
            let settled = false;
            const settle = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(fallback);
                this.pendingSettle = null;
                resolve(iframe);
            };
            const fallback = window.setTimeout(settle, RENDER_SETTLE_TIMEOUT_MS);
            this.pendingSettle = settle;

            iframe.onload = () => {
                iframe.style.opacity = '1';
                settle();
            };

            if (isUrl) {
                iframe.src = contentOrUrl;
            } else {
                // If it's inline HTML or SVG string
                iframe.srcdoc = contentOrUrl;
            }
        });
    }

    public postMessage(message: unknown): void {
        if (this.iframeElement && this.iframeElement.contentWindow) {
            this.iframeElement.contentWindow.postMessage(message, '*');
        }
    }

    public destroy(): void {
        if (this.iframeElement) {
            this.pendingSettle?.();
            this.iframeElement.srcdoc = '';
            this.iframeElement.src = 'about:blank';
            this.iframeElement.remove();
            this.iframeElement = null;
        }
    }
}
