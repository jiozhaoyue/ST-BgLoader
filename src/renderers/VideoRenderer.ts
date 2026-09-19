import { AudioEngine } from '../audio/AudioEngine';

// canplay/error cover normal loads, but a stalled host fires neither for minutes;
// the render promise must settle so the mount chain and tests cannot hang.
const RENDER_SETTLE_TIMEOUT_MS = 15000;

export class VideoRenderer {
    private videoElement: HTMLVideoElement | null = null;
    private container: HTMLElement;
    private audioEngine: AudioEngine;
    private pendingSettle: (() => void) | null = null;

    constructor(container: HTMLElement, audioEngine: AudioEngine) {
        this.container = container;
        this.audioEngine = audioEngine;
    }

    public async render(url: string, fitting: string = 'cover'): Promise<HTMLVideoElement> {
        this.destroy();

        const video = document.createElement('video');
        video.className = 'st-bg-video-element';
        video.src = url;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;

        // Apply fitting
        this.applyFitting(video, fitting);

        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.pointerEvents = 'none';
        video.style.transform = 'translateZ(0)';
        video.style.willChange = 'transform';
        video.style.opacity = '0';
        video.style.transition = 'opacity 400ms ease-in-out';

        this.container.appendChild(video);
        this.videoElement = video;

        // Attach to audioEngine for unified volume management
        this.audioEngine.attachVideo(video);

        return new Promise<HTMLVideoElement>((resolve) => {
            let settled = false;
            const settle = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(fallback);
                this.pendingSettle = null;
                video.removeEventListener('canplay', onCanPlay);
                resolve(video);
            };
            const fallback = window.setTimeout(settle, RENDER_SETTLE_TIMEOUT_MS);
            this.pendingSettle = settle;

            const onCanPlay = async () => {
                try {
                    await video.play();
                } catch (e) {
                    // If autoplay with audio is blocked, try muted first
                    console.warn('[ST-BgLoader] Video autoplay failed, trying muted:', e);
                    video.muted = true;
                    video.play().catch((err) => console.error('[ST-BgLoader] Video playback error:', err));
                }
                video.style.opacity = '1';
                settle();
            };

            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', (e) => {
                console.error('[ST-BgLoader] Error loading video:', e);
                settle();
            });
        });
    }

    public applyFitting(video: HTMLVideoElement, fitting: string): void {
        switch (fitting) {
            case 'contain':
                video.style.objectFit = 'contain';
                break;
            case 'stretch':
                video.style.objectFit = 'fill';
                break;
            case 'center':
                video.style.objectFit = 'none';
                break;
            case 'cover':
            default:
                video.style.objectFit = 'cover';
                break;
        }
    }

    public destroy(): void {
        if (this.videoElement) {
            this.pendingSettle?.();
            this.audioEngine.attachVideo(null);
            this.videoElement.pause();
            this.videoElement.removeAttribute('src');
            this.videoElement.load();
            this.videoElement.remove();
            this.videoElement = null;
        }
    }
}
