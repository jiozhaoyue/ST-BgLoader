import './ui/style.css';
import { BgLoaderSettings, DEFAULT_SETTINGS, MediaItem, MediaType } from './types';
import { CacheManager } from './cache/CacheManager';
import { AudioEngine } from './audio/AudioEngine';
import { MediaMount } from './core/MediaMount';
import { SettingsDrawer } from './ui/SettingsDrawer';
import { NativeBgAugmenter } from './ui/NativeBgAugmenter';
import { MiniPlayer } from './ui/MiniPlayer';
import { PublicAPI } from './api/PublicAPI';
import { AtmosphereFX } from './fx/AtmosphereFX';
import { AudioVisualizer } from './visualizer/AudioVisualizer';
import { ParallaxController } from './core/ParallaxController';
import { TriggerManager } from './triggers/TriggerManager';

const SETTINGS_KEY = 'st_bgloader_settings';

export class STBgLoaderExtension {
    public isInitialized: boolean = false;
    private settings: BgLoaderSettings = { ...DEFAULT_SETTINGS };
    private cacheManager: CacheManager;
    private audioEngine: AudioEngine;
    private mediaMount: MediaMount;
    private settingsDrawer: SettingsDrawer | null = null;
    private nativeAugmenter: NativeBgAugmenter | null = null;
    private miniPlayer: MiniPlayer | null = null;
    private atmosphereFX: AtmosphereFX;
    private audioVisualizer: AudioVisualizer;
    private parallaxController: ParallaxController;
    private triggerManager: TriggerManager;
    public publicApi: PublicAPI;

    constructor() {
        this.cacheManager = new CacheManager();
        this.audioEngine = new AudioEngine();
        this.mediaMount = new MediaMount(this.audioEngine);
        this.atmosphereFX = new AtmosphereFX();
        this.audioVisualizer = new AudioVisualizer();
        this.parallaxController = new ParallaxController();
        this.triggerManager = new TriggerManager();
        this.publicApi = new PublicAPI(this);
    }

    public getCacheManager(): CacheManager { return this.cacheManager; }
    public getAudioEngine(): AudioEngine { return this.audioEngine; }
    public getMediaMount(): MediaMount { return this.mediaMount; }
    public getSettings(): BgLoaderSettings { return this.settings; }
    public getMiniPlayer(): MiniPlayer | null { return this.miniPlayer; }
    public getAtmosphereFX(): AtmosphereFX { return this.atmosphereFX; }
    public getAudioVisualizer(): AudioVisualizer { return this.audioVisualizer; }
    public getParallaxController(): ParallaxController { return this.parallaxController; }
    public getTriggerManager(): TriggerManager { return this.triggerManager; }
    public getAPI(): PublicAPI { return this.publicApi; }

    public clearActiveBackground(): void {
        this.settings.activeMediaId = null;
        this.mediaMount.clear();
        this.saveSettings();
        if (this.settingsDrawer) {
            this.settingsDrawer.refreshMediaGrid();
        }
    }

    public async applyMediaItem(item: MediaItem): Promise<void> {
        await this.applyMedia(item);
    }

    public async init(): Promise<void> {
        console.log('[ST-BgLoader] Initializing Rich Media Background Plugin...');

        // 1. Load persisted settings
        this.loadSettings();

        // 2. Initialize Cache & Mount
        await this.cacheManager.init();
        this.mediaMount.init();
        this.mediaMount.applyFilters(this.settings.filters);
        this.mediaMount.setInteractive(this.settings.interactiveBackground);
        this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs);

        // 3. Mount FX & Controllers to host
        const hostEl = this.mediaMount.getHostElement() || document.querySelector('#bg1') as HTMLElement;
        const containerEl = this.mediaMount.getContainerElement();

        if (hostEl) {
            this.atmosphereFX.mount(hostEl);
            this.audioVisualizer.mount(hostEl, containerEl || undefined);
        }
        if (containerEl) {
            this.parallaxController.attach(containerEl);
        }

        // Apply subsystem configurations
        this.atmosphereFX.setWeather(this.settings.weather);
        this.audioVisualizer.setOptions(this.settings.visualizer);
        this.parallaxController.setOptions(this.settings.parallax);

        // 4. Configure AudioEngine
        this.audioEngine.setUrlResolver((item) => this.cacheManager.getMediaBlobUrl(item));
        this.audioEngine.setVolume(this.settings.volume);
        this.audioEngine.setMuted(this.settings.muted);
        this.audioEngine.setMuffled(this.settings.muffleBGM);
        this.audioEngine.setPlaybackMode(this.settings.playbackMode);

        this.audioEngine.onAnalyserReady = (analyser) => {
            this.audioVisualizer.setAnalyser(analyser);
        };

        const allItems = await this.cacheManager.listMedia();
        const audioItems = allItems.filter(i => i.type === 'audio');
        this.audioEngine.setPlaylist(audioItems);

        // 5. Initialize MiniPlayer
        this.miniPlayer = new MiniPlayer(this.audioEngine);
        this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly);

        // Connect AudioEngine events to PublicAPI
        const origTrackChange = this.audioEngine.onTrackChange;
        this.audioEngine.onTrackChange = (item) => {
            origTrackChange?.(item);
            this.publicApi.emit('track-change', item);
        };

        const origPlayChange = this.audioEngine.onPlayStateChange;
        this.audioEngine.onPlayStateChange = (playing) => {
            origPlayChange?.(playing);
            this.publicApi.emit('play-state-change', playing);
        };

        // 6. Setup Smart Scene Triggers
        this.triggerManager.setRules(this.settings.triggerRules || []);
        this.triggerManager.setTriggerCallback(async (action, rule) => {
            console.log(`[ST-BgLoader] Executing trigger rule: "${rule.name}"`);
            if (action.mediaIdOrUrl) {
                await this.publicApi.setBackground(action.mediaIdOrUrl);
            }
            if (action.bgmUrl) {
                await this.publicApi.playBGM(action.bgmUrl);
            }
            if (action.weather) {
                this.publicApi.setWeather(action.weather);
            }
            if (action.preset) {
                this.publicApi.applyPreset(action.preset);
            }
            if (action.filters) {
                this.publicApi.setFilters(action.filters);
            }
        });

        // 7. Setup Settings Drawer
        this.settingsDrawer = new SettingsDrawer(this.settings, this.cacheManager, {
            onSettingsChanged: (updated) => {
                this.settings = updated;
                this.saveSettings();
                this.mediaMount.applyFilters(this.settings.filters);
                this.audioEngine.setVolume(this.settings.volume);
                this.audioEngine.setMuted(this.settings.muted);
            },
            onPresetChanged: (preset) => {
                this.mediaMount.applyFilters(preset.filters);
                this.publicApi.emit('preset-change', preset.id, preset.filters);
            },
            onInteractiveChanged: (enabled) => {
                this.mediaMount.setInteractive(enabled);
                this.publicApi.emit('interactive-change', enabled);
            },
            onMiniPlayerToggle: (visible) => {
                this.miniPlayer?.setVisible(visible);
            },
            onCapsuleOnPlayToggle: (enabled) => {
                this.miniPlayer?.setCapsuleOnPlayOnly(enabled);
            },
            onPlaybackModeChanged: (mode) => {
                this.audioEngine.setPlaybackMode(mode);
            },
            onWeatherChanged: (weather) => {
                this.atmosphereFX.setWeather(weather);
                this.publicApi.emit('weather-change', weather);
            },
            onVisualizerChanged: (vis) => {
                this.audioVisualizer.setOptions(vis);
                this.publicApi.emit('visualizer-change', vis);
            },
            onParallaxChanged: (plx) => {
                this.parallaxController.setOptions(plx);
                this.publicApi.emit('parallax-change', plx);
            },
            onTransitionChanged: (type, durationMs) => {
                this.mediaMount.setTransition(type, durationMs);
                this.publicApi.emit('transition-change', type, durationMs);
            },
            onMuffleChanged: (muffled) => {
                this.audioEngine.setMuffled(muffled);
                this.publicApi.emit('muffle-change', muffled);
            },
            onMediaSelected: async (item) => {
                await this.applyMedia(item);
            },
            onMediaDeleted: async (id) => {
                if (this.settings.activeMediaId === id) {
                    this.settings.activeMediaId = null;
                    this.mediaMount.clear();
                    this.audioEngine.stopTrack();
                    this.saveSettings();
                }
                const currentItems = await this.cacheManager.listMedia();
                this.audioEngine.setPlaylist(currentItems.filter(i => i.type === 'audio'));
            },
            onMediaUploaded: async (item) => {
                if (this.settings.lruAutoClean) {
                    const maxBytes = this.settings.cacheQuotaMB * 1024 * 1024;
                    await this.cacheManager.cleanLRU(maxBytes);
                }
                if (item.type === 'audio') {
                    const currentItems = await this.cacheManager.listMedia();
                    this.audioEngine.setPlaylist(currentItems.filter(i => i.type === 'audio'));
                }
                await this.applyMedia(item);
            },
        });
        this.settingsDrawer.render();

        // 8. Setup Native Background Augmenter
        this.nativeAugmenter = new NativeBgAugmenter(async (url, type, name) => {
            const virtualItem: MediaItem = {
                id: 'native_' + name,
                name,
                type,
                source: 'server',
                url,
                cacheKey: url,
                size: 0,
                mimeType: '',
                addedTimestamp: Date.now(),
                lastUsedTimestamp: Date.now(),
            };
            await this.applyMedia(virtualItem);
        });
        this.nativeAugmenter.start();

        // 9. Register Global Lifecycle Hooks
        document.addEventListener('visibilitychange', () => {
            this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
        });

        // 10. Hook into SillyTavern EventSource
        this.hookSillyTavernEvents();

        // 11. Auto-restore active media if set
        if (this.settings.activeMediaId) {
            const activeItem = await this.cacheManager.getMedia(this.settings.activeMediaId);
            if (activeItem) {
                await this.applyMedia(activeItem);
            }
        }

        this.isInitialized = true;
        console.log('[ST-BgLoader] Full-Power Initialization complete.');
    }

    private async applyMedia(item: MediaItem): Promise<void> {
        this.settings.activeMediaId = item.id;
        this.saveSettings();

        const mediaUrl = await this.cacheManager.getMediaBlobUrl(item);
        await this.mediaMount.mountMedia(item, mediaUrl);

        if (this.settingsDrawer) {
            this.settingsDrawer.refreshMediaGrid();
            this.settingsDrawer.updateCacheStats();
        }
    }

    private hookSillyTavernEvents(): void {
        const globalAny = window as any;
        if (globalAny.eventSource) {
            this.triggerManager.bindSillyTavernEvents(globalAny.eventSource, globalAny.event_types);

            if (globalAny.event_types && globalAny.event_types.CHAT_CHANGED) {
                globalAny.eventSource.on(globalAny.event_types.CHAT_CHANGED, async () => {
                    const chatId = globalAny.getCurrentChatId ? globalAny.getCurrentChatId() : null;
                    if (chatId && this.settings.chatBindings[chatId]) {
                        const boundId = this.settings.chatBindings[chatId];
                        const item = await this.cacheManager.getMedia(boundId);
                        if (item) {
                            await this.applyMedia(item);
                            return;
                        }
                    }
                    if (this.settings.activeMediaId) {
                        const defaultItem = await this.cacheManager.getMedia(this.settings.activeMediaId);
                        if (defaultItem) {
                            await this.applyMedia(defaultItem);
                        }
                    }
                });
            }
        }
    }

    private loadSettings(): void {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
            }
        } catch (e) {
            console.error('[ST-BgLoader] Failed to parse saved settings:', e);
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    public saveSettings(): void {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.error('[ST-BgLoader] Failed to save settings:', e);
        }
    }
}

// Auto bootstrap when script loads or DOM is ready
const instance = new STBgLoaderExtension();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => instance.init());
} else {
    instance.init();
}

// Export global reference for debugging or external plugins
(window as any).STBgLoader = instance;
(window as any).stBgLoader = instance.getAPI();
