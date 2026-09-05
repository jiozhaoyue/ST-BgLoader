import './ui/style.css';
import { BgLoaderSettings, DEFAULT_SETTINGS, MediaItem, MediaType } from './types';
import { CacheManager } from './cache/CacheManager';
import { AudioEngine } from './audio/AudioEngine';
import { MediaMount } from './core/MediaMount';
import { SettingsDrawer } from './ui/SettingsDrawer';
import { NativeBgAugmenter } from './ui/NativeBgAugmenter';

const SETTINGS_KEY = 'st_bgloader_settings';

export class STBgLoaderExtension {
    private settings: BgLoaderSettings = { ...DEFAULT_SETTINGS };
    private cacheManager: CacheManager;
    private audioEngine: AudioEngine;
    private mediaMount: MediaMount;
    private settingsDrawer: SettingsDrawer | null = null;
    private nativeAugmenter: NativeBgAugmenter | null = null;

    constructor() {
        this.cacheManager = new CacheManager();
        this.audioEngine = new AudioEngine();
        this.mediaMount = new MediaMount(this.audioEngine);
    }

    public async init(): Promise<void> {
        console.log('[ST-BgLoader] Initializing Rich Media Background Plugin...');

        // 1. Load persisted settings
        this.loadSettings();

        // 2. Initialize Cache & Mount
        await this.cacheManager.init();
        this.mediaMount.init();
        this.mediaMount.applyFilters(this.settings.filters);
        this.audioEngine.setVolume(this.settings.volume);
        this.audioEngine.setMuted(this.settings.muted);

        // 3. Setup Settings Drawer & Native Augmenter
        this.settingsDrawer = new SettingsDrawer(this.settings, this.cacheManager, {
            onSettingsChanged: (updated) => {
                this.settings = updated;
                this.saveSettings();
                this.mediaMount.applyFilters(this.settings.filters);
                this.audioEngine.setVolume(this.settings.volume);
                this.audioEngine.setMuted(this.settings.muted);
            },
            onMediaSelected: async (item) => {
                await this.applyMedia(item);
            },
            onMediaDeleted: (id) => {
                if (this.settings.activeMediaId === id) {
                    this.settings.activeMediaId = null;
                    this.mediaMount.clear();
                    this.audioEngine.stopTrack();
                    this.saveSettings();
                }
            },
            onMediaUploaded: async (item) => {
                // Check quota and auto-clean if needed
                if (this.settings.lruAutoClean) {
                    const maxBytes = this.settings.cacheQuotaMB * 1024 * 1024;
                    await this.cacheManager.cleanLRU(maxBytes);
                }
                // Automatically activate newly uploaded media
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

    private saveSettings(): void {
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
