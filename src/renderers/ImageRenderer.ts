// onload/onerror cover normal loads, but a stalled host fires neither; settle anyway.
const RENDER_SETTLE_TIMEOUT_MS = 15000;

export class ImageRenderer {
    private imageElement: HTMLImageElement | null = null;
    private container: HTMLElement;
    private pendingSettle: (() => void) | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public async render(url: string, fitting: string = 'cover'): Promise<HTMLImageElement> {
        this.destroy();

        const img = document.createElement('img');
        img.className = 'st-bg-image-element';
        img.src = url;

        this.applyFitting(img, fitting);

        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.pointerEvents = 'none';
        img.style.opacity = '0';
        img.style.transition = 'opacity 400ms ease-in-out';

        this.container.appendChild(img);
        this.imageElement = img;

        return new Promise<HTMLImageElement>((resolve) => {
            let settled = false;
            const settle = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(fallback);
                this.pendingSettle = null;
                resolve(img);
            };
            const fallback = window.setTimeout(settle, RENDER_SETTLE_TIMEOUT_MS);
            this.pendingSettle = settle;

            img.onload = () => {
                img.style.opacity = '1';
                settle();
            };
            img.onerror = () => {
                console.error('[ST-BgLoader] Failed to load background image:', url);
                settle();
            };
        });
    }

    public applyFitting(img: HTMLImageElement, fitting: string): void {
        switch (fitting) {
            case 'contain':
                img.style.objectFit = 'contain';
                break;
            case 'stretch':
                img.style.objectFit = 'fill';
                break;
            case 'center':
                img.style.objectFit = 'none';
                break;
            case 'cover':
            default:
                img.style.objectFit = 'cover';
                break;
        }
    }

    public destroy(): void {
        if (this.imageElement) {
            this.pendingSettle?.();
            this.imageElement.remove();
            this.imageElement = null;
        }
    }
}
