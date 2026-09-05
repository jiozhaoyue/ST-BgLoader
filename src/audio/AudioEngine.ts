export class AudioEngine {
    private audioElement: HTMLAudioElement | null = null;
    private attachedVideo: HTMLVideoElement | null = null;
    private volume: number = 0.8;
    private muted: boolean = false;
    private isPausedForBlur: boolean = false;
    private fadeTimer: number | null = null;

    constructor() {
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.preload = 'auto';
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        this.applyVolume();
    }

    public setMuted(muted: boolean): void {
        this.muted = muted;
        this.applyVolume();
    }

    public getVolume(): number {
        return this.volume;
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public attachVideo(video: HTMLVideoElement | null): void {
        this.attachedVideo = video;
        if (this.attachedVideo) {
            this.applyVolume();
        }
    }

    public async playTrack(url: string, loop: boolean = true): Promise<void> {
        if (!this.audioElement) return;

        this.clearFade();
        this.audioElement.src = url;
        this.audioElement.loop = loop;
        this.applyVolume();

        try {
            await this.audioElement.play();
        } catch (err) {
            console.warn('[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:', err);
        }
    }

    public stopTrack(fadeOutMs: number = 300): void {
        if (!this.audioElement || this.audioElement.paused) return;

        if (fadeOutMs <= 0) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            return;
        }

        const startVolume = this.audioElement.volume;
        const startTime = performance.now();

        const step = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / fadeOutMs);
            if (this.audioElement) {
                this.audioElement.volume = startVolume * (1 - progress);
            }
            if (progress < 1) {
                this.fadeTimer = requestAnimationFrame(step);
            } else {
                if (this.audioElement) {
                    this.audioElement.pause();
                    this.audioElement.currentTime = 0;
                    this.applyVolume();
                }
            }
        };

        this.clearFade();
        this.fadeTimer = requestAnimationFrame(step);
    }

    public handleVisibilityChange(hidden: boolean, pauseOnBlur: boolean): void {
        if (!pauseOnBlur) return;

        if (hidden) {
            if (this.audioElement && !this.audioElement.paused) {
                this.audioElement.pause();
                this.isPausedForBlur = true;
            }
            if (this.attachedVideo && !this.attachedVideo.paused) {
                this.attachedVideo.pause();
            }
        } else {
            if (this.isPausedForBlur && this.audioElement) {
                this.audioElement.play().catch(() => {});
                this.isPausedForBlur = false;
            }
            if (this.attachedVideo) {
                this.attachedVideo.play().catch(() => {});
            }
        }
    }

    private applyVolume(): void {
        const effectiveVolume = this.muted ? 0 : this.volume;

        if (this.audioElement) {
            this.audioElement.volume = effectiveVolume;
            this.audioElement.muted = this.muted;
        }

        if (this.attachedVideo) {
            this.attachedVideo.volume = effectiveVolume;
            this.attachedVideo.muted = this.muted;
        }
    }

    private clearFade(): void {
        if (this.fadeTimer !== null) {
            cancelAnimationFrame(this.fadeTimer);
            this.fadeTimer = null;
        }
    }

    public destroy(): void {
        this.clearFade();
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
            this.audioElement = null;
        }
        this.attachedVideo = null;
    }
}
