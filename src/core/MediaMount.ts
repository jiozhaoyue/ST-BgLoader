import { VisualFilters, MediaItem } from '../types';
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

    constructor(audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
    }

    public init(): void {
        this.hostEl = document.querySelector('#bg1');
        if (!this.hostEl) {
            // If #bg1 is not ready yet, observe body until it appears
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

        // Ensure host has relative/absolute positioning
        const computedStyle = window.getComputedStyle(this.hostEl);
        if (computedStyle.position === 'static') {
            this.hostEl.style.position = 'relative';
        }

        // Check if container already exists
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

        // Initialize Renderers for each layer
        this.videoRendererA = new VideoRenderer(this.layerA!, this.audioEngine);
        this.videoRendererB = new VideoRenderer(this.layerB!, this.audioEngine);
        this.iframeRendererA = new IframeRenderer(this.layerA!);
        this.iframeRendererB = new IframeRenderer(this.layerB!);
        this.imageRendererA = new ImageRenderer(this.layerA!);
        this.imageRendererB = new ImageRenderer(this.layerB!);

        // Observe fitting class changes on #bg1
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
        layer.style.transition = 'opacity 400ms ease-in-out';
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
        // Can notify active video or image renderer
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
            if (inactiveLayer) inactiveLayer.style.opacity = '0';
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
                // For audio, we play track via AudioEngine and hide background layer
                await this.audioEngine.playMediaItem(item, mediaUrl);
                break;
        }

        // Crossfade
        targetLayer.style.opacity = '1';
        oldLayer.style.opacity = '0';
        this.activeLayer = nextLayerName;

        // Wait for crossfade to finish, then destroy previous layer renderers
        this.crossfadeTimer = window.setTimeout(() => {
            this.crossfadeTimer = null;
            const oldVideoR = this.activeLayer === 'A' ? this.videoRendererB! : this.videoRendererA!;
            const oldIframeR = this.activeLayer === 'A' ? this.iframeRendererB! : this.iframeRendererA!;
            const oldImageR = this.activeLayer === 'A' ? this.imageRendererB! : this.imageRendererA!;
            oldVideoR.destroy();
            oldIframeR.destroy();
            oldImageR.destroy();
        }, 450);
    }

    public clear(): void {
        if (this.crossfadeTimer !== null) {
            clearTimeout(this.crossfadeTimer);
            this.crossfadeTimer = null;
        }
        if (this.layerA) this.layerA.style.opacity = '0';
        if (this.layerB) this.layerB.style.opacity = '0';
        this.videoRendererA?.destroy();
        this.videoRendererB?.destroy();
        this.iframeRendererA?.destroy();
        this.iframeRendererB?.destroy();
        this.imageRendererA?.destroy();
        this.imageRendererB?.destroy();
    }
}
