import { AudioEngine } from '../audio/AudioEngine';
import { PlaybackMode } from '../types';

export class MiniPlayer {
    private container: HTMLElement | null = null;
    private audioEngine: AudioEngine;
    private isVisible: boolean = true;

    constructor(audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
    }

    public render(visible: boolean = true): void {
        this.isVisible = visible;
        const existing = document.querySelector('#st_bg_mini_player');
        if (existing) existing.remove();

        if (!this.isVisible) return;

        const el = document.createElement('div');
        el.id = 'st_bg_mini_player';
        el.className = 'st-bg-mini-player';

        const currentTrack = this.audioEngine.getCurrentTrack();
        const trackTitle = currentTrack ? currentTrack.name : 'No Audio Selected';
        const isPlaying = this.audioEngine.isPlaying();
        const mode = this.audioEngine.getPlaybackMode();

        el.innerHTML = `
            <div class="st-bg-mini-capsule">
                <button class="st-bg-mini-btn" id="st_mini_prev" title="Previous Track">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button class="st-bg-mini-btn st-bg-mini-play" id="st_mini_play" title="Play/Pause">
                    <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button class="st-bg-mini-btn" id="st_mini_next" title="Next Track">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <div class="st-bg-mini-track" id="st_mini_title" title="${trackTitle}">${trackTitle}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${mode}">
                    <i class="fa-solid ${this.getModeIcon(mode)}"></i>
                </button>
            </div>
        `;

        document.body.appendChild(el);
        this.container = el;
        this.bindEvents();

        // Listen for AudioEngine events
        this.audioEngine.onTrackChange = (item) => {
            const titleEl = this.container?.querySelector('#st_mini_title');
            if (titleEl) {
                const name = item ? item.name : 'No Audio';
                titleEl.textContent = name;
                titleEl.setAttribute('title', name);
            }
        };

        this.audioEngine.onPlayStateChange = (playing) => {
            const icon = this.container?.querySelector('#st_mini_play i');
            if (icon) {
                icon.className = `fa-solid ${playing ? 'fa-pause' : 'fa-play'}`;
            }
        };
    }

    private bindEvents(): void {
        if (!this.container) return;

        this.container.querySelector('#st_mini_prev')?.addEventListener('click', () => {
            this.audioEngine.playPrev();
        });

        this.container.querySelector('#st_mini_play')?.addEventListener('click', () => {
            this.audioEngine.togglePlay();
        });

        this.container.querySelector('#st_mini_next')?.addEventListener('click', () => {
            this.audioEngine.playNext();
        });

        this.container.querySelector('#st_mini_mode')?.addEventListener('click', () => {
            const current = this.audioEngine.getPlaybackMode();
            const nextMode: PlaybackMode = current === 'loop' ? 'shuffle' : current === 'shuffle' ? 'single' : 'loop';
            this.audioEngine.setPlaybackMode(nextMode);

            const modeBtn = this.container?.querySelector('#st_mini_mode') as HTMLElement;
            if (modeBtn) {
                modeBtn.setAttribute('title', `Mode: ${nextMode}`);
                const icon = modeBtn.querySelector('i');
                if (icon) icon.className = `fa-solid ${this.getModeIcon(nextMode)}`;
            }
        });
    }

    private getModeIcon(mode: PlaybackMode): string {
        switch (mode) {
            case 'shuffle': return 'fa-shuffle';
            case 'single': return 'fa-repeat-1';
            case 'loop':
            default:
                return 'fa-repeat';
        }
    }

    public setVisible(visible: boolean): void {
        this.isVisible = visible;
        if (this.container) {
            this.container.style.display = visible ? 'block' : 'none';
        } else if (visible) {
            this.render(true);
        }
    }

    public destroy(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
