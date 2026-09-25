import { MediaType } from '../types';
import { detectMediaType } from '../core/mediaType';

export class NativeBgAugmenter {
    private observer: MutationObserver | null = null;
    private onNativeMediaSelect: (url: string, type: MediaType, name: string) => void;

    constructor(onNativeMediaSelect: (url: string, type: MediaType, name: string) => void) {
        this.onNativeMediaSelect = onNativeMediaSelect;
    }

    public start(): void {
        const menuContent = document.querySelector('#bg_menu_content');
        if (menuContent) {
            this.augmentThumbnails(menuContent as HTMLElement);
            this.observer = new MutationObserver(() => this.augmentThumbnails(menuContent as HTMLElement));
            this.observer.observe(menuContent, { childList: true, subtree: true });
        } else {
            // Wait for drawer to be created — but give up eventually: in a non-host page
            // the node never appears and the observer would query on every mutation.
            const bodyObserver = new MutationObserver(() => {
                const target = document.querySelector('#bg_menu_content');
                if (target) {
                    window.clearTimeout(giveUp);
                    bodyObserver.disconnect();
                    this.start();
                }
            });
            bodyObserver.observe(document.body, { childList: true, subtree: true });
            const giveUp = window.setTimeout(() => bodyObserver.disconnect(), 30000);
        }
    }

    private augmentThumbnails(container: HTMLElement): void {
        const items = container.querySelectorAll<HTMLElement>('.bg_example[bgfile]:not([data-st-bg-augmented])');
        items.forEach((item) => {
            item.setAttribute('data-st-bg-augmented', 'true');
            const bgFile = item.getAttribute('bgfile') || '';
            const type = detectMediaType(bgFile);

            if (type !== 'image') {
                const badge = document.createElement('span');
                badge.className = `st-bg-native-badge ${type}`;
                badge.textContent = type.toUpperCase();
                item.appendChild(badge);

                // Add click listener
                item.addEventListener('click', () => {
                    const dataUrl = item.dataset.url || `/backgrounds/${bgFile}`;
                    this.onNativeMediaSelect(dataUrl, type, bgFile);
                });
            }
        });
    }

    public stop(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
