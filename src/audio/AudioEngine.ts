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
    // A broken/deleted track fires 'error' with no listener today: playback fails silently and
    // the playlist stalls on the bad entry forever. Auto-skip is bounded by how many tracks the
    // playlist had when the first error hit, so a playlist that is entirely corrupt cannot spin
    // an endless skip loop.
    private errorSkipBudget: number = 0;

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

        this.audioElement.addEventListener('error', () => {
            const src = this.audioElement?.src || '(no src)';
            console.error('[ST-BgLoader AudioEngine] Track failed to load:', src);
            // A failed play() leaves the paused flag FALSE (play() clears it before failing and
            // nothing sets it back on a load error), so isPlaying() would report phantom
            // playback forever. Normalize the element state before any skip decision.
            try { this.audioElement?.pause(); } catch { /* already stopped */ }
            this.handleTrackError();
        });

        // A track that actually STARTS playing refills the error auto-skip budget. Refilling at
        // playTrack() instead would defeat the bound: each auto-skip calls playTrack, which
        // would restore the budget before the next error lands, and an all-corrupt playlist
        // would loop skips forever.
        this.audioElement.addEventListener('playing', () => {
            this.errorSkipBudget = Math.max(this.errorSkipBudget, this.playlist.length);
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
        // 'single' means the user wants THIS track on repeat: drop the countdown now instead of
        // letting it tick to a no-op. Switching back re-arms (next track start or, if playing,
        // immediately below).
        if (this.autoAdvanceTimer !== null) {
            window.clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (mode !== 'single') {
            this.armAutoAdvance();
        }
    }

    public getPlaybackMode(): PlaybackMode {
        return this.playbackMode;
    }

    // --- BGM playlist auto-advance (F1) -----------------------------------------------
    // One self-held setTimeout per countdown (never setInterval: a tick that lands while the
    // previous switch is still settling must not stack). The countdown RESETS on every track
    // start — manual switches included — so "switched by hand, jumped again 5s later" cannot
    // happen. Guarded at tick time by isPlaying() / playlist length / playbackMode, so a
    // stale timer that survived a pause simply does nothing.

    private autoAdvanceTimer: number | null = null;
    /** The fade-then-switch follow-up: armed by autoAdvanceTick, cancelled by any manual track start. */
    private pendingAdvanceTimer: number | null = null;
    private autoAdvanceConfig: { intervalSec: number; fadeMs: number } | null = null;

    /** Enables/reconfigures the auto-advance countdown (values clamped to the setting's range). */
    public setAutoAdvance(enabled: boolean, intervalSec: number = 300, fadeMs: number = 800): void {
        if (!enabled) {
            this.stopAutoAdvance();
            return;
        }
        this.autoAdvanceConfig = {
            intervalSec: Math.max(30, Math.min(3600, Math.floor(intervalSec))),
            fadeMs: Math.max(0, Math.min(2000, Math.floor(fadeMs))),
        };
        this.armAutoAdvance();
    }

    public stopAutoAdvance(): void {
        if (this.autoAdvanceTimer !== null) {
            window.clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (this.pendingAdvanceTimer !== null) {
            window.clearTimeout(this.pendingAdvanceTimer);
            this.pendingAdvanceTimer = null;
        }
        this.autoAdvanceConfig = null;
    }

    /** True while a countdown is armed (UI status display / harness assertions). */
    public isAutoAdvanceArmed(): boolean {
        return this.autoAdvanceTimer !== null;
    }

    /** (Re)starts the countdown; a no-op unless enabled + playing + ≥2 tracks. */
    private armAutoAdvance(): void {
        if (this.autoAdvanceTimer !== null) {
            window.clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        // A manual track start during the fade-out window cancels the scheduled auto switch:
        // the user's pick already decided what plays next, and a stale follow-up would yank
        // playback away from it a moment later.
        if (this.pendingAdvanceTimer !== null) {
            window.clearTimeout(this.pendingAdvanceTimer);
            this.pendingAdvanceTimer = null;
        }
        const cfg = this.autoAdvanceConfig;
        if (!cfg || this.playbackMode === 'single') return;
        if (this.playlist.length < 2 || !this.isPlaying()) return;
        this.autoAdvanceTimer = window.setTimeout(() => this.autoAdvanceTick(), cfg.intervalSec * 1000);
    }

    private autoAdvanceTick(): void {
        this.autoAdvanceTimer = null;
        const cfg = this.autoAdvanceConfig;
        if (!cfg || this.playbackMode === 'single') return;
        // State may have changed since arming (paused, list shrunk): re-evaluate, don't act.
        if (this.playlist.length < 2 || !this.isPlaying()) return;
        const fadeMs = cfg.fadeMs;
        this.stopTrack(fadeMs);
        // Wait out the fade-out BEFORE starting the next track (playTrack would clearFade and
        // snap the volume back up mid-fade otherwise), then fade the new track in.
        this.pendingAdvanceTimer = window.setTimeout(() => {
            this.pendingAdvanceTimer = null;
            if (!this.autoAdvanceConfig || this.playbackMode === 'single') return;
            this.playNext()
                .then(() => {
                    if (fadeMs > 0) {
                        this.fadeInVolume(this.volume, fadeMs);
                    }
                })
                .catch((err) => console.error('[ST-BgLoader AudioEngine] Auto-advance failed:', err));
        }, fadeMs + 30);
    }

    public setPlaylist(items: MediaItem[], autoPlay: boolean = false): void {
        this.playlist = items;
        // A fresh playlist gets a full skip budget: an all-corrupt list may then burn through
        // exactly one pass before auto-skip stops (refilled only by tracks that really play).
        this.errorSkipBudget = Math.max(this.errorSkipBudget, this.playlist.length);
        // Index normalization (a replaced playlist used to keep a raw numeric index: deleting
        // a track shifted every later track down by one, so currentIndex silently pointed at
        // a DIFFERENT song; a shorter list left it out of bounds with getCurrentTrack()=null).
        // Keep pointing at the same song by id when it survives; otherwise reset to the head.
        const current = this.getCurrentTrack();
        const previousId = this.currentIndex >= 0 && current ? current.id : null;
        if (previousId) {
            const kept = this.playlist.findIndex(p => p.id === previousId);
            this.currentIndex = kept !== -1 ? kept : (this.playlist.length > 0 ? 0 : -1);
        } else if (this.currentIndex >= this.playlist.length) {
            this.currentIndex = this.playlist.length > 0 ? 0 : -1;
        }
        // The countdown must re-evaluate against the NEW list: fewer than 2 tracks disarms it,
        // and a longer list (re)arms it while playback continues.
        this.armAutoAdvance();
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
                this.armAutoAdvance();
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

    /**
     * A track failed to load (corrupt file, deleted server-side, bad URL). Skip forward the
     * same way 'ended' does, but only while a skip budget lasts: it is refilled whenever a
     * track is successfully started and sized against the whole playlist, so an all-corrupt
     * playlist stops after one pass instead of looping on errors forever. 'single' mode keeps
     * the user's explicit choice: stop, don't silently play something else.
     */
    private handleTrackError(): void {
        this.isWaitingForInteractionUnmute = false;
        if (this.playbackMode === 'single' || this.playlist.length === 0) {
            this.emitPlayState(false);
            return;
        }
        if (this.errorSkipBudget <= 0) {
            console.warn('[ST-BgLoader AudioEngine] Skip budget exhausted (every track failed?); stopping auto-skip.');
            this.emitPlayState(false);
            return;
        }
        this.errorSkipBudget -= 1;
        this.playNext().catch(err => console.error('[ST-BgLoader AudioEngine] Auto-skip after error failed:', err));
    }

    public attachVideo(video: HTMLVideoElement | null): void {
        this.attachedVideo = video;
        if (this.attachedVideo) {
            this.applyVolume();
        }
    }

    /**
     * Detaches a video only if it is the one currently attached. During a video→video
     * crossfade the outgoing layer's destroy() runs AFTER the incoming layer attached
     * its element; an unconditional clear here would drop volume/mute/visibility control
     * from the video that is actually playing.
     */
    public detachVideo(video: HTMLVideoElement): void {
        if (this.attachedVideo === video) {
            this.attachedVideo = null;
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
            let settleTimer: number | undefined;
            await Promise.race([
                this.audioElement.play().catch((err) => {
                    console.warn('[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:', err);
                }),
                new Promise((resolve) => {
                    settleTimer = window.setTimeout(resolve, PLAY_SETTLE_TIMEOUT_MS);
                }),
        ]).finally(() => {
            // play() usually wins the race; without this the 10s bail-out timer would dangle.
            window.clearTimeout(settleTimer);
            // Every real track start (manual pick, skip, auto-advance) resets the countdown.
            this.armAutoAdvance();
        });
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

        // setTimeout-driven (16ms), NOT requestAnimationFrame: rAF stops entirely in a hidden
        // tab, which left a fade-in/fade-out frozen mid-way and the element unpaused. Volume
        // fades must complete even when the tab is hidden (the auto-advance scheduler relies
        // on stopTrack's fade actually pausing the old track).
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
                this.fadeTimer = window.setTimeout(step, 16);
            } else {
                this.applyVolume();
            }
        };

        this.fadeTimer = window.setTimeout(step, 16);
    }

    public stopTrack(fadeOutMs: number = 300): void {
        // Stopping cancels the pending unmute too: without this, the first user interaction
        // after an explicit stop would fade in an idle element for no reason.
        this.isWaitingForInteractionUnmute = false;
        if (!this.audioElement || this.audioElement.paused) return;

        if (fadeOutMs <= 0) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            return;
        }

        const startVolume = this.audioElement.volume;
        const startTime = performance.now();

        // setTimeout-driven, not rAF — see fadeInVolume for the hidden-tab rationale.
        const step = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / fadeOutMs);
            if (this.audioElement) {
                this.audioElement.volume = startVolume * (1 - progress);
            }
            if (progress < 1) {
                this.fadeTimer = window.setTimeout(step, 16);
            } else {
                if (this.audioElement) {
                    this.audioElement.pause();
                    this.audioElement.currentTime = 0;
                    this.applyVolume();
                }
            }
        };

        this.clearFade();
        this.fadeTimer = window.setTimeout(step, 16);
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
                this.armAutoAdvance();
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
            window.clearTimeout(this.fadeTimer);
            this.fadeTimer = null;
        }
    }

    public destroy(): void {
        this.clearFade();
        this.stopAutoAdvance();
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
