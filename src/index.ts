import './ui/style.css';
import { BgLoaderSettings, DEFAULT_SETTINGS, MediaItem, MediaType, mergeSettings } from './types';
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
import { AmbientSoundGenerator } from './audio/AmbientSoundGenerator';
import { FrostedGlassController } from './ui/FrostedGlassController';
import { SceneManager } from './core/SceneManager';
import { AuthorityBridge } from './backend/AuthorityBridge';
import { SettingsSync } from './backend/SettingsSync';
import { ServerSettings } from './backend/ServerSettings';
import { AgentBridge, AgentToolHost } from './backend/AgentBridge';
import { WeatherOptions, WeatherType } from './types';

const SETTINGS_KEY = 'st_bgloader_settings';
const SETTINGS_REV_KEY = 'st_bgloader_settings_rev';

export class STBgLoaderExtension {
    public isInitialized: boolean = false;
    private settings: BgLoaderSettings = { ...DEFAULT_SETTINGS };
    private settingsRevision: number = 0;
    private serverSettings: ServerSettings = new ServerSettings();
    private cacheManager: CacheManager;
    private audioEngine: AudioEngine;
    private mediaMount: MediaMount;
    private overlaysMounted = false;
    private settingsDrawer: SettingsDrawer | null = null;
    private nativeAugmenter: NativeBgAugmenter | null = null;
    private miniPlayer: MiniPlayer | null = null;
    private atmosphereFX: AtmosphereFX;
    private audioVisualizer: AudioVisualizer;
    private parallaxController: ParallaxController;
    private triggerManager: TriggerManager;
    private ambientSoundGenerator: AmbientSoundGenerator;
    private frostedGlassController: FrostedGlassController;
    // Lazy: created in init() with real configuration. No speculative instance that init()
    // would replace.
    private sceneManager: SceneManager | null = null;
    private authorityBridge: AuthorityBridge = new AuthorityBridge();
    private settingsSync: SettingsSync | null = null;
    private agentBridge: AgentBridge | null = null;
    public publicApi: PublicAPI;

    constructor() {
        this.cacheManager = new CacheManager();
        this.audioEngine = new AudioEngine();
        this.mediaMount = new MediaMount(this.audioEngine, (container) => this.mountOverlays(container));
        this.atmosphereFX = new AtmosphereFX();
        this.audioVisualizer = new AudioVisualizer();
        this.parallaxController = new ParallaxController();
        this.triggerManager = new TriggerManager();
        this.ambientSoundGenerator = new AmbientSoundGenerator();
        this.frostedGlassController = new FrostedGlassController();
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
    public getAmbientSoundGenerator(): AmbientSoundGenerator { return this.ambientSoundGenerator; }
    public getFrostedGlassController(): FrostedGlassController { return this.frostedGlassController; }
    public getSceneManager(): SceneManager | null { return this.sceneManager; }
    public getAuthorityBridge(): AuthorityBridge { return this.authorityBridge; }
    public getServerSettings(): ServerSettings { return this.serverSettings; }
    public getAPI(): PublicAPI { return this.publicApi; }

    public clearActiveBackground(): void {
        this.settings.activeMediaId = null;
        this.mediaMount.clear();
        this.saveSettings();
        if (this.settingsDrawer) {
            this.settingsDrawer.refreshMediaGrid();
        }
    }

    /**
     * Mounts a media item as the background. `persist` = false is for TRANSIENT items that
     * exist only in memory (PublicAPI.setBackground without saveToLibrary): recording their
     * id in the durable `activeMediaId` left a reference no reload could resolve (finding A2).
     */
    public async applyMediaItem(item: MediaItem, persist: boolean = true): Promise<void> {
        await this.applyMedia(item, persist);
    }

    public async init(): Promise<void> {
        console.log('[ST-BgLoader] Initializing Rich Media Background Plugin...');

        // 1. Load persisted settings, reconciled against the server copy (higher revision
        //    wins; the server is the durable copy and localStorage the fast cache).
        await this.reconcileSettings();

        // 2. Initialize storage: the server backgrounds/ directory is the source of truth
        //    (Authority is an optional enhancement); the browser keeps an evictable cache.
        await this.cacheManager.init(this.authorityBridge);
        this.mediaMount.init();
        this.mediaMount.applyFilters(this.settings.filters);
        this.mediaMount.setInteractive(this.settings.interactiveBackground);
        this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs);

        // 3. Mount FX & Controllers to host — happens via MediaMount's onHostReady callback
        //    (immediately when #bg1 exists at init, or when the DOM observer finds it later),
        //    so a late-appearing host no longer leaves FX/visualizer/parallax unmounted.
        this.mountOverlaysIfHostReady();

        // Apply subsystem configurations
        this.atmosphereFX.setWeather(this.settings.weather);
        this.audioVisualizer.setOptions(this.settings.visualizer);
        this.parallaxController.setOptions(this.settings.parallax);
        this.ambientSoundGenerator.setSound(this.settings.ambientSound);
        this.frostedGlassController.setOptions(this.settings.frostedChat);

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

        // Connect AudioEngine events to PublicAPI (multicast subscriptions — the old
        // single-slot wrap chain broke whenever another subscriber reassigned the slot).
        this.audioEngine.addTrackListener((item) => {
            this.publicApi.emit('track-change', item);
        });

        this.audioEngine.addPlayStateListener((playing) => {
            this.publicApi.emit('play-state-change', playing);
        });

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

        // 7. Setup Scene Manager
        this.sceneManager = new SceneManager(this.settings.scenes || {}, async (scene) => {
            if (scene.mediaId) {
                const item = await this.cacheManager.getMedia(scene.mediaId);
                if (item) await this.applyMedia(item);
            } else if (scene.mediaUrl) {
                await this.publicApi.setBackground(scene.mediaUrl);
            }
            if (scene.bgmUrl) {
                await this.publicApi.playBGM(scene.bgmUrl);
            }
            if (scene.presetId) {
                this.publicApi.applyPreset(scene.presetId);
            }
            if (scene.filters) {
                this.publicApi.setFilters(scene.filters);
            }
            if (scene.weather) {
                this.publicApi.setWeather(scene.weather);
            }
            if (scene.visualizer) {
                this.publicApi.setVisualizer(scene.visualizer);
            }
            if (scene.parallax) {
                this.publicApi.setParallax(scene.parallax.enabled, scene.parallax.intensity);
            }
            if (scene.ambientSound) {
                this.publicApi.setAmbientSound(scene.ambientSound);
            }
            if (typeof scene.frostedChat === 'boolean') {
                this.publicApi.setFrostedChat(scene.frostedChat);
            }
        });

        // 8. Setup Settings Drawer
        this.settingsDrawer = new SettingsDrawer(this.settings, this.cacheManager, {
            onSettingsChanged: (updated) => {
                this.settings = updated;
                this.saveSettings();
                this.applySettingsToSubsystems();
                this.enforceQuotaIfChanged();
            },
            // Replaces the removed Alt+B shortcut: visibility is MediaMount's controlled state
            // (finding A1), and routing the panel through the PublicAPI keeps one write path and
            // one event for third-party callers.
            getBackgroundVisible: () => this.mediaMount.isVisible(),
            onBackgroundVisibilityChanged: (visible) => {
                this.publicApi.setBackgroundVisible(visible);
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
        }, this.authorityBridge);
        this.settingsDrawer.render();

        // 9. Setup Native Background Augmenter
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

        // 10. Register Global Lifecycle Hooks
        document.addEventListener('visibilitychange', () => {
            this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
        });

        // 10.5 Cross-device settings sync (Authority cloud mirror; no-op in local mode)
        this.authorityBridge.onCapabilitiesChanged(() => this.settingsDrawer?.updateCloudPanel());
        // Server settings document written newer by another tab/device → converge now
        // instead of letting the pending write silently revert it (S7-style conflict).
        this.serverSettings.onRemoteNewer = () => void this.reconcileRemoteConflict();
        await this.startSettingsSync();
        this.syncAgentTools();

        // 11. Hook into SillyTavern EventSource
        this.hookSillyTavernEvents();

        // 12. Auto-restore active media if set
        if (this.settings.activeMediaId) {
            const activeItem = await this.cacheManager.getMedia(this.settings.activeMediaId);
            if (activeItem) {
                await this.applyMedia(activeItem);
            } else {
                // Self-heal (A2): the persisted id resolves to nothing — the media was deleted,
                // or the reference was written by an older release / a stale cloud mirror.
                // Keeping it would re-persist a dangling pointer forever, so clear it now.
                console.warn(`[ST-BgLoader] Active background "${this.settings.activeMediaId}" no longer exists; clearing the reference.`);
                this.settings.activeMediaId = null;
                this.saveSettings();
            }
        }

        this.isInitialized = true;
        console.log('[ST-BgLoader] All Modular Subsystems fully initialized.');
    }

    private async applyMedia(item: MediaItem, persist: boolean = true): Promise<void> {
        if (persist) {
            this.settings.activeMediaId = item.id;
            this.saveSettings();
        }

        const mediaUrl = await this.cacheManager.getMediaBlobUrl(item);
        await this.mediaMount.mountMedia(item, mediaUrl);

        if (this.settingsDrawer) {
            this.settingsDrawer.refreshMediaGrid();
            this.settingsDrawer.updateCacheStats();
        }
    }

    /** Mounted-once guard for the onHostReady callback path (idempotent across late hosts). */
    private mountOverlaysIfHostReady(): void {
        const containerEl = this.mediaMount.getContainerElement();
        if (containerEl) {
            this.mountOverlays(containerEl);
        }
    }

    private mountOverlays(containerEl: HTMLElement): void {
        if (this.overlaysMounted) return;
        this.overlaysMounted = true;
        const hostEl = this.mediaMount.getHostElement();
        if (hostEl) {
            this.atmosphereFX.mount(hostEl);
            // Pulse pump targets the dedicated wrapper layer, not the container the
            // parallax controller transforms (two writers would fight).
            this.audioVisualizer.mount(hostEl, this.mediaMount.getPumpWrapperElement() ?? containerEl);
        }
        this.parallaxController.attach(containerEl);
    }

    private applySettingsToSubsystems(): void {
        this.mediaMount.applyFilters(this.settings.filters);
        this.mediaMount.setInteractive(this.settings.interactiveBackground);
        this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs);
        this.audioEngine.setVolume(this.settings.volume);
        this.audioEngine.setMuted(this.settings.muted);
        this.audioEngine.setMuffled(this.settings.muffleBGM);
        this.audioEngine.setPlaybackMode(this.settings.playbackMode);
        this.atmosphereFX.setWeather(this.settings.weather);
        this.audioVisualizer.setOptions(this.settings.visualizer);
        this.parallaxController.setOptions(this.settings.parallax);
        this.ambientSoundGenerator.setSound(this.settings.ambientSound);
        this.frostedGlassController.setOptions(this.settings.frostedChat);
        this.triggerManager.setRules(this.settings.triggerRules || []);
        this.sceneManager?.setUserScenes(this.settings.scenes || {});
        this.syncAgentTools();
    }

    /**
     * Shows/hides the background layer (MediaMount owns the state — finding A1). The panel
     * checkbox calls this through PublicAPI so both entry points share one write path.
     */
    public setBackgroundVisible(visible: boolean): void {
        this.mediaMount.setVisible(visible);
        // Reflect API-driven changes back into the panel (the checkbox does not emit an event
        // when written programmatically, so there is no feedback loop).
        this.settingsDrawer?.syncBackgroundVisible(visible);
    }

    /**
     * Applies a changed cache quota immediately (S2: the slider used to write the setting and
     * nothing happened until the next upload). Runs only when the quota really changed — an
     * unrelated settings change must not trigger a sweep — and only while auto-clean is on,
     * because the quota is meaningless with it off (the panel documents that gating).
     */
    private enforceQuotaIfChanged(): void {
        if (!this.settings.lruAutoClean) return;
        const maxBytes = this.settings.cacheQuotaMB * 1024 * 1024;
        if (maxBytes === this.lastEnforcedQuotaBytes) return;
        this.lastEnforcedQuotaBytes = maxBytes;
        void this.cacheManager.cleanLRU(maxBytes);
    }

    /** null = nothing enforced yet, so the first change under auto-clean compares honestly. */
    private lastEnforcedQuotaBytes: number | null = null;

    /** Opt-in Agent Runtime ambient tools (AI director mode); requires the cloud backend. */
    public syncAgentTools(): void {
        const client = this.authorityBridge.getClient();
        // Gated by the user setting only: caps.agentTools is an outcome report (may be blocked by
        // policy after start), not a pre-known fact — the bridge corrects it via reportAgentToolsOutcome.
        const want = this.settings.agentToolsEnabled && !!client;

        if (want && !this.agentBridge && client) {
            this.agentBridge = new AgentBridge(client, this.buildAgentHost(), (state, note) => {
                this.authorityBridge.reportAgentToolsState(state, note);
            });
            this.agentBridge.start();
            console.log('[ST-BgLoader] Agent ambient tools enabled.');
        } else if (!want && this.agentBridge) {
            this.agentBridge.stop();
            this.agentBridge = null;
            console.log('[ST-BgLoader] Agent ambient tools disabled.');
        }
    }

    private buildAgentHost(): AgentToolHost {
        return {
            setBackground: (target) => this.publicApi.setBackground(target),
            playBGM: (url) => this.publicApi.playBGM(url),
            setWeather: (type, density) => {
                this.publicApi.setWeather(
                    type as WeatherType,
                    density ? { density: density as WeatherOptions['density'] } : undefined,
                );
            },
            applyPreset: (presetId) => this.publicApi.applyPreset(presetId),
            setFilters: (filters) => this.publicApi.setFilters(filters),
            applyScene: (sceneId) => this.publicApi.applyScene(sceneId),
        };
    }

    private async startSettingsSync(): Promise<void> {
        const client = this.authorityBridge.getClient();
        if (!client) return;

        this.settingsSync = new SettingsSync(client, (remoteSettings) => {
            this.settings = remoteSettings;
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
            } catch { /* quota errors keep the cloud copy authoritative */ }
            this.applySettingsToSubsystems();
            this.settingsDrawer?.applyRemoteSettings(this.settings);
            this.publicApi.emit('settings-sync', this.settings);
        }, () => this.hasServerSettingsDocument());
        await this.settingsSync.start();
    }

    /**
     * Precedence fact handed to SettingsSync (finding A5): the KV mirror carries its own
     * revision counter, which cannot be compared with the server document's (observed 41 vs
     * 202), so it must not be applied unconditionally at startup — that resurrected state the
     * server document had already corrected (a deleted background came back as a dangling id).
     * The server document is this machine's source of truth; the mirror is only a fallback
     * for a missing/unreadable document.
     */
    private async hasServerSettingsDocument(): Promise<boolean> {
        return (await this.serverSettings.load()) !== null;
    }

    private reconcilingRemote = false;

    /** A newer server settings document was detected mid-session (another tab/device);
     *  converge the same way the init-time reconcile does. */
    private async reconcileRemoteConflict(): Promise<void> {
        if (this.reconcilingRemote) return;
        this.reconcilingRemote = true;
        try {
            await this.reconcileSettings();
            this.applySettingsToSubsystems();
            this.settingsDrawer?.applyRemoteSettings(this.settings);
            this.publicApi.emit('settings-sync', this.settings);
        } finally {
            this.reconcilingRemote = false;
        }
    }

    private hookSillyTavernEvents(): void {
        const globalAny = window as any;
        if (globalAny.eventSource) {
            this.triggerManager.bindSillyTavernEvents(globalAny.eventSource, globalAny.event_types);

            if (globalAny.event_types && globalAny.event_types.CHAT_CHANGED) {
                globalAny.eventSource.on(globalAny.event_types.CHAT_CHANGED, async () => {
                    // (B4, 2026-09-26: the per-chat binding branch that used to run first here
                    // was removed with `settings.chatBindings` — it had no writer anywhere, so
                    // it was unreachable.)
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
                this.settings = mergeSettings(JSON.parse(raw));
            }
            this.settingsRevision = parseInt(localStorage.getItem(SETTINGS_REV_KEY) || '0', 10) || 0;
        } catch (e) {
            console.error('[ST-BgLoader] Failed to parse saved settings:', e);
            this.settings = { ...DEFAULT_SETTINGS };
            this.settingsRevision = 0;
        }
    }

    /**
     * Merges the localStorage cache with the server settings document before any
     * subsystem is configured: the copy with the higher revision wins (server wins
     * ties). A local copy with no server document yet is uploaded (first-run migration).
     */
    private async reconcileSettings(): Promise<void> {
        this.loadSettings();
        try {
            const doc = await this.serverSettings.load();
            if (doc && doc.revision >= this.settingsRevision) {
                this.settings = mergeSettings(doc.settings);
                this.settingsRevision = doc.revision;
                this.persistLocalSettings();
            } else if (this.settingsRevision > 0) {
                this.serverSettings.scheduleSave(this.settings, this.settingsRevision);
            }
        } catch (err) {
            console.warn('[ST-BgLoader] Server settings unavailable, using local settings:', err);
        }
    }

    private persistLocalSettings(): void {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
            localStorage.setItem(SETTINGS_REV_KEY, String(this.settingsRevision));
        } catch (e) {
            console.error('[ST-BgLoader] Failed to save settings:', e);
        }
    }

    public saveSettings(): void {
        this.settingsRevision += 1;
        this.persistLocalSettings();
        this.serverSettings.scheduleSave(this.settings, this.settingsRevision);
        this.settingsSync?.schedulePush(this.settings);
    }
}

// Auto bootstrap when script loads or DOM is ready — a failed init must surface as a
// tagged error instead of an anonymous unhandled rejection.
const instance = new STBgLoaderExtension();
const boot = () => instance.init().catch(err => console.error('[ST-BgLoader] Initialization failed:', err));
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}

// Export global reference for debugging or external plugins
(window as any).STBgLoader = instance;
(window as any).stBgLoader = instance.getAPI();
