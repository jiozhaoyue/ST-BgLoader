import { MediaItem, PlaybackMode } from '../types';

// play() stays pending on a stalled host until the media stack times out; bound the wait.
const PLAY_SETTLE_TIMEOUT_MS = 10000;

export class AudioEngine {
    private audioElement: HTMLAudioElement | null = null;
    private attachedVideo: HTMLVideoElement | null = null;
    private volume: number = 0.8;
    private muted: boolean = false;
    private isPausedForBlur: boolean = false;
    private fadeTimer: number | null = null;

    private playlist: MediaItem[] = [];
    private currentIndex: number = -1;
    private playbackMode: PlaybackMode = 'loop';

    private urlResolver?: (item: MediaItem) => Promise<string>;
    private userHasInteracted: boolean = false;
    private isWaitingForInteractionUnmute: boolean = false;

    // WebAudio Graph for Lo-Fi muffle and Visualizer
    private audioContext: AudioContext | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private biquadFilter: BiquadFilterNode | null = null;
    private analyserNode: AnalyserNode | null = null;
    private isMuffled: boolean = false;

    // Multicast listeners (subscribe via addTrackListener/addPlayStateListener, both
    // return an unsubscriber). The old single-slot onTrackChange/onPlayStateChange
    // properties are gone: last-writer-wins silently dropped earlier subscribers.
    private trackListeners: Array<(item: MediaItem | null) => void> = [];
    private playStateListeners: Array<(isPlaying: boolean) => void> = [];
    public onAnalyserReady?: (analyser: AnalyserNode) => void;

    public addTrackListener(listener: (item: MediaItem | null) => void): () => void {
        this.trackListeners.push(listener);
        return () => {
            this.trackListeners = this.trackListeners.filter(l => l !== listener);
        };
    }

    public addPlayStateListener(listener: (isPlaying: boolean) => void): () => void {
        this.playStateListeners.push(listener);
        return () => {
            this.playStateListeners = this.playStateListeners.filter(l => l !== listener);
        };
    }

    private emitTrackChange(item: MediaItem | null): void {
        for (const listener of this.trackListeners) {
            try {
                listener(item);
            } catch (err) {
                console.error('[ST-BgLoader AudioEngine] Track listener failed:', err);
            }
        }
    }

    private emitPlayState(isPlaying: boolean): void {
        for (const listener of this.playStateListeners) {
            try {
                listener(isPlaying);
            } catch (err) {
                console.error('[ST-BgLoader AudioEngine] Play-state listener failed:', err);
            }
        }
    }

    public setUrlResolver(resolver: (item: MediaItem) => Promise<string>): void {
        this.urlResolver = resolver;
    }

    public isWaitingForUnmute(): boolean {
        return this.isWaitingForInteractionUnmute;
    }

    public notifyUserInteraction(): void {
        this.userHasInteracted = true;
        this.resumeAudioContext();
        this.initWebAudio();
        if (this.isWaitingForInteractionUnmute) {
            this.isWaitingForInteractionUnmute = false;
            this.fadeInVolume(this.volume, 400);
        }
    }

    private resumeAudioContext(): void {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }
    }

    public initWebAudio(): void {
        if (this.audioContext || !this.audioElement) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            this.audioContext = new AudioCtx();
            this.audioElement.crossOrigin = 'anonymous';
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

            // Biquad filter for Lo-Fi Room Acoustic Muffle effect
            this.biquadFilter = this.audioContext.createBiquadFilter();
            this.biquadFilter.type = 'lowpass';
            this.biquadFilter.frequency.value = this.isMuffled ? 800 : 20000;
            this.biquadFilter.Q.value = 1.0;

            // Analyser for real-time visualizer
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 256;

            this.sourceNode.connect(this.biquadFilter);
            this.biquadFilter.connect(this.analyserNode);
            this.analyserNode.connect(this.audioContext.destination);

            if (this.onAnalyserReady) {
                this.onAnalyserReady(this.analyserNode);
            }
        } catch (err) {
            console.warn('[ST-BgLoader AudioEngine] WebAudio graph init note (falling back to direct output):', err);
        }
    }

    public setMuffled(muffled: boolean): void {
        this.isMuffled = muffled;
        if (this.biquadFilter && this.audioContext) {
            const targetFreq = muffled ? 800 : 20000;
            const currTime = this.audioContext.currentTime;
            this.biquadFilter.frequency.cancelScheduledValues(currTime);
            this.biquadFilter.frequency.setTargetAtTime(targetFreq, currTime, 0.08);
        }
    }

    public getMuffled(): boolean {
        return this.isMuffled;
    }

    public async playMediaItem(item: MediaItem, mediaUrl?: string): Promise<void> {
        let idx = this.playlist.findIndex(p => p.id === item.id);
        if (idx === -1) {
            // Repeated playBGM calls with the same URL used to append a fresh virtual
            // item every time, growing the playlist for the whole session — reuse.
            idx = this.playlist.findIndex(p => p.url === item.url && p.type === item.type);
            if (idx === -1) {
                this.playlist.push(item);
                idx = this.playlist.length - 1;
            } else {
                this.playlist[idx] = item;
            }
        }
        this.currentIndex = idx;
        await this.startTrack(item, mediaUrl);
    }

    public async playCurrentTrack(): Promise<void> {
        const item = this.getCurrentTrack();
        if (!item) return;
        await this.startTrack(item);
    }

    /**
     * The single entry point behind playMediaItem()/playCurrentTrack() (finding D3: the two
     * public methods held near-identical copies of the same sequence, so a fix to one silently
     * missed the other). The src/loop/unmute/play sequence itself stays in playTrack(), which
     * was a third copy of it; the only thing the callers differed on is who supplies the media
     * URL — playMediaItem may already have it (the item it just mounted), otherwise it is
     * resolved here through the same urlResolver. Track-change emission is unchanged: exactly
     * one per successful call, none when there is no audio element to play into.
     */
    private async startTrack(item: MediaItem, mediaUrl?: string): Promise<void> {
        if (!this.audioElement) return;
        const url = mediaUrl || (this.urlResolver ? await this.urlResolver(item) : item.url);
        await this.playTrack(url, this.playbackMode === 'single');
        this.emitTrackChange(item);
    }

    constructor() {
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';

        this.audioElement.addEventListener('ended', () => {
            this.handleTrackEnded();
        });

        this.audioElement.addEventListener('play', () => {
            this.emitPlayState(true);
        });

        this.audioElement.addEventListener('pause', () => {
            this.emitPlayState(false);
        });

        this.setupInteractionListener();
    }

    private setupInteractionListener(): void {
        const onInteract = () => {
            this.notifyUserInteraction();
            window.removeEventListener('pointerdown', onInteract);
            window.removeEventListener('keydown', onInteract);
            window.removeEventListener('touchstart', onInteract);
        };

        window.addEventListener('pointerdown', onInteract, { passive: true, once: true });
        window.addEventListener('keydown', onInteract, { passive: true, once: true });
        window.addEventListener('touchstart', onInteract, { passive: true, once: true });
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

    public isPlaying(): boolean {
        return !!(this.audioElement && !this.audioElement.paused);
    }

    public setPlaybackMode(mode: PlaybackMode): void {
        this.playbackMode = mode;
        if (this.audioElement) {
            this.audioElement.loop = mode === 'single';
        }
    }

    public getPlaybackMode(): PlaybackMode {
        return this.playbackMode;
    }

    public setPlaylist(items: MediaItem[], autoPlay: boolean = false): void {
        this.playlist = items;
        if (this.playlist.length > 0 && this.currentIndex === -1) {
            this.currentIndex = 0;
            if (autoPlay) {
                this.playCurrentTrack();
            }
        }
    }

    public getPlaylist(): MediaItem[] {
        return this.playlist;
    }

    public getCurrentTrack(): MediaItem | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
            return this.playlist[this.currentIndex];
        }
        return null;
    }

    public async playNext(): Promise<void> {
        if (this.playlist.length === 0) return;

        if (this.playbackMode === 'shuffle') {
            let nextIndex = Math.floor(Math.random() * this.playlist.length);
            if (this.playlist.length > 1 && nextIndex === this.currentIndex) {
                nextIndex = (nextIndex + 1) % this.playlist.length;
            }
            this.currentIndex = nextIndex;
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        }

        await this.playCurrentTrack();
    }

    public async playPrev(): Promise<void> {
        if (this.playlist.length === 0) return;

        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        await this.playCurrentTrack();
    }

    public async togglePlay(): Promise<void> {
        if (!this.audioElement) return;

        if (this.audioElement.paused) {
            this.initWebAudio();
            this.resumeAudioContext();
            if (!this.audioElement.src && this.playlist.length > 0) {
                if (this.currentIndex === -1) this.currentIndex = 0;
                await this.playCurrentTrack();
            } else {
                await this.audioElement.play().catch(() => {});
            }
        } else {
            this.audioElement.pause();
        }
    }

    private handleTrackEnded(): void {
        if (this.playbackMode === 'single') {
            return;
        }
        // Loop/shuffle with a single track must replay too (element loop is only set for
        // 'single' mode, so without this the music stops after one pass).
        if (this.playlist.length >= 1) {
            this.playNext().catch(err => console.error(err));
        }
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

        if (!this.userHasInteracted && !this.muted) {
            this.isWaitingForInteractionUnmute = true;
            this.audioElement.muted = true;
        } else {
            this.applyVolume();
        }

        try {
            this.initWebAudio();
            this.resumeAudioContext();
            // play() stays pending on a stalled host until the media stack times out; bound it.
            await Promise.race([
                this.audioElement.play().catch((err) => {
                    console.warn('[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:', err);
                }),
                new Promise((resolve) => window.setTimeout(resolve, PLAY_SETTLE_TIMEOUT_MS)),
            ]);
        } catch (err) {
            console.warn('[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:', err);
        }
    }

    public fadeInVolume(targetVolume: number, durationMs: number = 400): void {
        this.clearFade();
        const startTime = performance.now();
        const target = Math.max(0, Math.min(1, targetVolume));

        if (this.audioElement) {
            this.audioElement.muted = false;
            this.audioElement.volume = 0;
        }
        if (this.attachedVideo) {
            this.attachedVideo.muted = false;
            this.attachedVideo.volume = 0;
        }

        const step = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            const currentVol = target * progress;

            if (this.audioElement) {
                this.audioElement.volume = currentVol;
            }
            if (this.attachedVideo) {
                this.attachedVideo.volume = currentVol;
            }

            if (progress < 1) {
                this.fadeTimer = requestAnimationFrame(step);
            } else {
                this.applyVolume();
            }
        };

        this.fadeTimer = requestAnimationFrame(step);
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
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        this.attachedVideo = null;
        this.playlist = [];
    }
}
