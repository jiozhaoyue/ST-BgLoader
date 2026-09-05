import './ui/style.css';
import { BgLoaderSettings, DEFAULT_SETTINGS, MediaItem, MediaType } from './types';
import { CacheManager } from './cache/CacheManager';
import { AudioEngine } from './audio/AudioEngine';
import { MediaMount } from './core/MediaMount';
import { SettingsDrawer } from './ui/SettingsDrawer';
import { NativeBgAugmenter } from './ui/NativeBgAugmenter';
import { MiniPlayer } from './ui/MiniPlayer';
import { PublicAPI } from './api/PublicAPI';

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
    public publicApi: PublicAPI;

    constructor() {
        this.cacheManager = new CacheManager();
        this.audioEngine = new AudioEngine();
        this.mediaMount = new MediaMount(this.audioEngine);
        this.publicApi = new PublicAPI(this);
    }

    public getCacheManager(): CacheManager { return this.cacheManager; }
    public getAudioEngine(): AudioEngine { return this.audioEngine; }
    public getMediaMount(): MediaMount { return this.mediaMount; }
    public getSettings(): BgLoaderSettings { return this.settings; }
    public getMiniPlayer(): MiniPlayer | null { return this.miniPlayer; }
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

        // 3. Configure AudioEngine
        this.audioEngine.setUrlResolver((item) => this.cacheManager.getMediaBlobUrl(item));
        this.audioEngine.setVolume(this.settings.volume);
        this.audioEngine.setMuted(this.settings.muted);
        this.audioEngine.setPlaybackMode(this.settings.playbackMode);

        const allItems = await this.cacheManager.listMedia();
        const audioItems = allItems.filter(i => i.type === 'audio');
        this.audioEngine.setPlaylist(audioItems);

        // 4. Initialize MiniPlayer
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

        // 5. Setup Settings Drawer & Native Augmenter
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

        // 4. Setup Native Background Augmenter
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

        // 5. Register Global Lifecycle Hooks
        document.addEventListener('visibilitychange', () => {
            this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
        });

        // 6. Hook into SillyTavern EventSource if available
        this.hookSillyTavernEvents();

        // 7. Auto-restore active media if set
        if (this.settings.activeMediaId) {
            const activeItem = await this.cacheManager.getMedia(this.settings.activeMediaId);
            if (activeItem) {
                await this.applyMedia(activeItem);
            }
        }

        this.isInitialized = true;
        console.log('[ST-BgLoader] Initialization complete.');
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
        if (globalAny.eventSource && globalAny.event_types) {
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
                // If chat has no binding, restore default or do nothing
                if (this.settings.activeMediaId) {
                    const defaultItem = await this.cacheManager.getMedia(this.settings.activeMediaId);
                    if (defaultItem) {
                        await this.applyMedia(defaultItem);
                    }
                }
            });
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
