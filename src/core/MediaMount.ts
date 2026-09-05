import { VisualFilters, MediaItem, TransitionType } from '../types';
import { VideoRenderer } from '../renderers/VideoRenderer';
import { IframeRenderer } from '../renderers/IframeRenderer';
import { ImageRenderer } from '../renderers/ImageRenderer';
import { AudioEngine } from '../audio/AudioEngine';

export class MediaMount {
    private hostEl: HTMLElement | null = null;
    private containerEl: HTMLElement | null = null;
    private layerA: HTMLElement | null = null;
    private layerB: HTMLElement | null = null;
    private activeLayer: 'A' | 'B' = 'A';

    private videoRendererA: VideoRenderer | null = null;
    private videoRendererB: VideoRenderer | null = null;
    private iframeRendererA: IframeRenderer | null = null;
    private iframeRendererB: IframeRenderer | null = null;
    private imageRendererA: ImageRenderer | null = null;
    private imageRendererB: ImageRenderer | null = null;

    private audioEngine: AudioEngine;
    private observer: MutationObserver | null = null;
    private crossfadeTimer: number | null = null;

    private transitionType: TransitionType = 'fade';
    private transitionDurationMs: number = 400;

    constructor(audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
    }

    public setTransition(type: TransitionType, durationMs: number = 400): void {
        this.transitionType = type;
        this.transitionDurationMs = Math.max(100, Math.min(2000, durationMs));
    }

    public getContainerElement(): HTMLElement | null {
        return this.containerEl;
    }

    public getHostElement(): HTMLElement | null {
        return this.hostEl;
    }

    public init(): void {
        this.hostEl = document.querySelector('#bg1');
        if (!this.hostEl) {
            const docObserver = new MutationObserver(() => {
                const bg1 = document.querySelector('#bg1') as HTMLElement;
                if (bg1) {
                    docObserver.disconnect();
                    this.hostEl = bg1;
                    this.setupContainer();
                }
            });
            docObserver.observe(document.body, { childList: true, subtree: true });
            return;
        }

        this.setupContainer();
    }

    private setupContainer(): void {
        if (!this.hostEl) return;

        const computedStyle = window.getComputedStyle(this.hostEl);
        if (computedStyle.position === 'static') {
            this.hostEl.style.position = 'relative';
        }

        let container = this.hostEl.querySelector('.st-bg-media-container') as HTMLElement;
        if (!container) {
            container = document.createElement('div');
            container.className = 'st-bg-media-container';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.overflow = 'hidden';
            container.style.zIndex = '0';
            container.style.pointerEvents = 'none';

            this.layerA = document.createElement('div');
            this.layerA.className = 'st-bg-layer st-bg-layer-a';
            this.setupLayerStyle(this.layerA);

            this.layerB = document.createElement('div');
            this.layerB.className = 'st-bg-layer st-bg-layer-b';
            this.setupLayerStyle(this.layerB);

            container.appendChild(this.layerA);
            container.appendChild(this.layerB);

            this.hostEl.appendChild(container);
        } else {
            this.layerA = container.querySelector('.st-bg-layer-a');
            this.layerB = container.querySelector('.st-bg-layer-b');
        }

        this.containerEl = container;

        this.videoRendererA = new VideoRenderer(this.layerA!, this.audioEngine);
        this.videoRendererB = new VideoRenderer(this.layerB!, this.audioEngine);
        this.iframeRendererA = new IframeRenderer(this.layerA!);
        this.iframeRendererB = new IframeRenderer(this.layerB!);
        this.imageRendererA = new ImageRenderer(this.layerA!);
        this.imageRendererB = new ImageRenderer(this.layerB!);

        this.observer = new MutationObserver(() => this.syncFitting());
        this.observer.observe(this.hostEl, { attributes: true, attributeFilter: ['class'] });
        this.syncFitting();
    }

    private setupLayerStyle(layer: HTMLElement): void {
        layer.style.position = 'absolute';
        layer.style.top = '0';
        layer.style.left = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
        layer.style.opacity = '0';
        layer.style.transition = `all ${this.transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        layer.style.pointerEvents = 'none';
    }

    public applyFilters(filters: VisualFilters): void {
        if (!this.containerEl) return;
        const filterStr = `blur(${filters.blur}px) brightness(${filters.brightness}%) opacity(${filters.opacity}%) saturate(${filters.saturate}%)`;
        this.containerEl.style.filter = filterStr;
    }

    public setInteractive(enabled: boolean): void {
        const value = enabled ? 'auto' : 'none';
        if (this.containerEl) this.containerEl.style.pointerEvents = value;
        if (this.layerA) this.layerA.style.pointerEvents = value;
        if (this.layerB) this.layerB.style.pointerEvents = value;
    }

    public getFitting(): string {
        if (!this.hostEl) return 'cover';
        if (this.hostEl.classList.contains('contain')) return 'contain';
        if (this.hostEl.classList.contains('stretch')) return 'stretch';
        if (this.hostEl.classList.contains('center')) return 'center';
        return 'cover';
    }

    public syncFitting(): void {
        // Fitted via CSS cover/contain
    }

    public async mountMedia(item: MediaItem, mediaUrl: string): Promise<void> {
        if (!this.containerEl || !this.layerA || !this.layerB) return;

        // Cancel pending crossfade and finalize previous state immediately
        if (this.crossfadeTimer !== null) {
            clearTimeout(this.crossfadeTimer);
            this.crossfadeTimer = null;
            const inactiveVideoR = this.activeLayer === 'A' ? this.videoRendererB! : this.videoRendererA!;
            const inactiveIframeR = this.activeLayer === 'A' ? this.iframeRendererB! : this.iframeRendererA!;
            const inactiveImageR = this.activeLayer === 'A' ? this.imageRendererB! : this.imageRendererA!;
            inactiveVideoR.destroy();
            inactiveIframeR.destroy();
            inactiveImageR.destroy();
            const inactiveLayer = this.activeLayer === 'A' ? this.layerB : this.layerA;
            if (inactiveLayer) {
                inactiveLayer.style.opacity = '0';
                inactiveLayer.style.transform = 'none';
                inactiveLayer.style.filter = 'none';
            }
        }

        const nextLayerName = this.activeLayer === 'A' ? 'B' : 'A';
        const targetLayer = nextLayerName === 'B' ? this.layerB : this.layerA;
        const oldLayer = this.activeLayer === 'A' ? this.layerA : this.layerB;

        const videoR = nextLayerName === 'B' ? this.videoRendererB! : this.videoRendererA!;
        const iframeR = nextLayerName === 'B' ? this.iframeRendererB! : this.iframeRendererA!;
        const imageR = nextLayerName === 'B' ? this.imageRendererB! : this.imageRendererA!;

        // Clean target layer first
        videoR.destroy();
        iframeR.destroy();
        imageR.destroy();

        const fitting = this.getFitting();

        // Render to target layer
        switch (item.type) {
            case 'video':
                await videoR.render(mediaUrl, fitting);
                break;
            case 'html':
            case 'svg':
                await iframeR.render(mediaUrl, true);
                break;
            case 'image':
                await imageR.render(mediaUrl, fitting);
                break;
            case 'audio':
                await this.audioEngine.playMediaItem(item, mediaUrl);
                break;
        }

        // Apply transition styling
        const dur = this.transitionDurationMs;
        targetLayer.style.transition = `all ${dur}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        oldLayer.style.transition = `all ${dur}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        const transition = this.transitionType;
        if (transition === 'zoom_fade') {
            targetLayer.style.transform = 'scale(1.06)';
            targetLayer.style.opacity = '0';
            targetLayer.offsetHeight; // Force reflow
            targetLayer.style.transform = 'scale(1)';
            targetLayer.style.opacity = '1';
            oldLayer.style.transform = 'scale(0.96)';
            oldLayer.style.opacity = '0';
        } else if (transition === 'blur_fade') {
            targetLayer.style.filter = 'blur(10px)';
            targetLayer.style.opacity = '0';
            targetLayer.offsetHeight; // Force reflow
            targetLayer.style.filter = 'blur(0px)';
            targetLayer.style.opacity = '1';
            oldLayer.style.filter = 'blur(10px)';
            oldLayer.style.opacity = '0';
        } else if (transition === 'slide_left') {
            targetLayer.style.transform = 'translate3d(100%, 0, 0)';
            targetLayer.style.opacity = '1';
            targetLayer.offsetHeight; // Force reflow
            targetLayer.style.transform = 'translate3d(0, 0, 0)';
            oldLayer.style.transform = 'translate3d(-100%, 0, 0)';
            oldLayer.style.opacity = '0';
        } else if (transition === 'slide_right') {
            targetLayer.style.transform = 'translate3d(-100%, 0, 0)';
            targetLayer.style.opacity = '1';
            targetLayer.offsetHeight; // Force reflow
            targetLayer.style.transform = 'translate3d(0, 0, 0)';
            oldLayer.style.transform = 'translate3d(100%, 0, 0)';
            oldLayer.style.opacity = '0';
        } else {
            // Default 'fade'
            targetLayer.style.transform = 'none';
            targetLayer.style.filter = 'none';
            targetLayer.style.opacity = '1';
            oldLayer.style.transform = 'none';
            oldLayer.style.filter = 'none';
            oldLayer.style.opacity = '0';
        }

        this.activeLayer = nextLayerName;

        // Clean up old layer after transition completes
        this.crossfadeTimer = window.setTimeout(() => {
            this.crossfadeTimer = null;
            const oldVideoR = this.activeLayer === 'A' ? this.videoRendererB! : this.videoRendererA!;
            const oldIframeR = this.activeLayer === 'A' ? this.iframeRendererB! : this.iframeRendererA!;
            const oldImageR = this.activeLayer === 'A' ? this.imageRendererB! : this.imageRendererA!;
            oldVideoR.destroy();
            oldIframeR.destroy();
            oldImageR.destroy();
            oldLayer.style.transform = 'none';
            oldLayer.style.filter = 'none';
        }, dur + 50);
    }

    public clear(): void {
        if (this.crossfadeTimer !== null) {
            clearTimeout(this.crossfadeTimer);
            this.crossfadeTimer = null;
        }
        if (this.layerA) {
            this.layerA.style.opacity = '0';
            this.layerA.style.transform = 'none';
            this.layerA.style.filter = 'none';
        }
        if (this.layerB) {
            this.layerB.style.opacity = '0';
            this.layerB.style.transform = 'none';
            this.layerB.style.filter = 'none';
        }
        this.videoRendererA?.destroy();
        this.videoRendererB?.destroy();
        this.iframeRendererA?.destroy();
        this.iframeRendererB?.destroy();
        this.imageRendererA?.destroy();
        this.imageRendererB?.destroy();
    }
}
