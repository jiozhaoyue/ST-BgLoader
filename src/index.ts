import './ui/style.css';
import { BgLoaderSettings, DEFAULT_SETTINGS, MediaItem, MediaType, mergeSettings } from './types';
import { CacheManager } from './cache/CacheManager';
import { AudioEngine } from './audio/AudioEngine';
import { MediaMount } from './core/MediaMount';
import { SettingsDrawer } from './ui/SettingsDrawer';
import { TopbarBackgroundDrawer } from './ui/TopbarBackgroundDrawer';
import { HostBridge } from './bridge/HostBridge';
import { NativeBackgroundController } from './ui/NativeBackgroundController';
import { MiniPlayer } from './ui/MiniPlayer';
import { PublicAPI } from './api/PublicAPI';
import { PostMessageBridge } from './api/PostMessageBridge';
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
import { mediaUrl as serverMediaUrl } from './backend/ServerOrigin';
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
    private topbarDrawer: TopbarBackgroundDrawer | null = null;
    private nativeController: NativeBackgroundController | null = null;
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
    /** 跨 iframe JSON-RPC 端点桥（init 时启动；纯浏览器可用，无宿主依赖）。 */
    private postMessageBridge: PostMessageBridge | null = null;
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
    public getNativeController(): NativeBackgroundController | null { return this.nativeController; }
    public getTopbarDrawer(): TopbarBackgroundDrawer | null { return this.topbarDrawer; }

    public setMasterEnabled(enabled: boolean): void {
        this.settings.enabled = enabled;
        this.saveSettings();
        this.applyMasterEnabled(enabled);
    }

    /**
     * Master-switch side effects WITHOUT persistence: the local toggle path persists via
     * setMasterEnabled; the remote-convergence path (applySettingsToSubsystems) must apply
     * the converged `enabled` without writing settings back (that would re-bump the revision
     * and push the pre-convergence state over the remote one).
     */
    private applyMasterEnabled(enabled: boolean): void {
        if (enabled) {
            this.topbarDrawer?.mount();
            this.nativeController?.start(this.settings.nativeTakeover);
            this.mediaMount.setVisible(this.settings.backgroundVisible);
            this.atmosphereFX.handleBackgroundVisibilityChange(this.settings.backgroundVisible);
            this.audioVisualizer.handleBackgroundVisibilityChange(this.settings.backgroundVisible);
        } else {
            this.topbarDrawer?.unmount();
            this.nativeController?.stop();
            this.mediaMount.clear();
            this.atmosphereFX.handleBackgroundVisibilityChange(false);
            this.audioVisualizer.handleBackgroundVisibilityChange(false);
            this.nativeController?.releaseNativeBackground();
            // P2-5: the master switch means "the plugin is off", so sound stops with the visuals.
            // Leaving BGM/ambience running behind an empty stage reads as a ghost state. The
            // generator's own options are not written back — re-enabling deliberately stays
            // silent rather than startling the user with a sudden track.
            this.audioEngine.stopTrack(300);
            this.ambientSoundGenerator.setSound({ ...this.settings.ambientSound, type: 'off' });
        }
    }

    public clearActiveBackground(): void {
        this.settings.activeMediaId = null;
        this.mediaMount.clear();
        // Nothing is mounted any more: drop the native picker's marker and give the host's own
        // background layer back, otherwise the user is left with no background at all.
        this.nativeController?.releaseNativeBackground();
        this.saveSettings();
        this.settingsDrawer?.updateActiveMedia(null);
        if (this.topbarDrawer) {
            void this.topbarDrawer.refreshMediaGrid();
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
        // Re-entry guard: a second call would re-register the visibilitychange listener,
        // rebuild both drawers and start a second SettingsSync — none of that is idempotent.
        if (this.isInitialized) return;
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
        this.mediaMount.setVisible(this.settings.backgroundVisible);
        this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs);
        // Broken-media feedback: decode failures are now observable (event + one-shot toastr)
        // instead of a silent broken layer — also the assertion point of the extreme-media suite.
        this.mediaMount.setRenderErrorHandler((type) => {
            this.publicApi.emit('media-error', { type });
            this.notifyMediaRenderErrorOnce();
        });

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

        // 8. Setup Topbar Background Drawer Takeover
        this.topbarDrawer = new TopbarBackgroundDrawer(this.settings, this.cacheManager, {
            onSettingsChanged: (updated) => {
                this.settings = updated;
                this.saveSettings();
                this.applySettingsToSubsystems();
                this.enforceQuotaIfChanged();
            },
            getBackgroundVisible: () => this.settings.backgroundVisible,
            onBackgroundVisibilityChanged: (visible) => {
                this.publicApi.setBackgroundVisible(visible);
            },
            onClearActiveBackground: () => {
                this.clearActiveBackground();
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
            onAmbientSoundChanged: (options) => {
                this.ambientSoundGenerator.setSound(options);
            },
            onFrostedChatChanged: (options) => {
                this.frostedGlassController.setOptions(options);
            },
            onSceneApplied: (sceneId) => {
                this.publicApi.applyScene(sceneId);
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
                } else if (this.audioEngine.getCurrentTrack()?.id === id) {
                    // Deleted the track that is currently playing (the background is something
                    // else): refreshing the playlist alone would leave the deleted track playing.
                    this.audioEngine.stopTrack();
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

        if (this.settings.enabled !== false) {
            this.topbarDrawer.mount();
        }

        // 8.5 Minimalist Extensions Settings Drawer (single master switch)
        this.settingsDrawer = new SettingsDrawer(this.settings, {
            onMasterToggle: (enabled) => {
                this.setMasterEnabled(enabled);
            },
            onSettingsChanged: (updated) => {
                this.settings = updated;
                this.saveSettings();
            },
        });
        this.settingsDrawer.render();

        // 9. Setup native background takeover
        //
        // One interception point for the host's own picker: clicking any thumbnail in the host's
        // background panel routes through this extension, so filters/weather/transitions apply to
        // every background alike. The URL is built with `mediaUrl()` — byte-identical to the
        // host's `getBackgroundPath()` — rather than from the tile's `data-url`, which holds a
        // CSS `url("…")` wrapper (and is only readable through jQuery's own data store).
        this.nativeController = new NativeBackgroundController(async (bgFile, type) => {
            const url = serverMediaUrl(bgFile);
            const virtualItem: MediaItem = {
                id: 'native_' + bgFile,
                name: bgFile,
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
        this.nativeController.start(this.settings.nativeTakeover);

        // 10. Register Global Lifecycle Hooks
        document.addEventListener('visibilitychange', () => {
            const hidden = document.hidden;
            this.audioEngine.handleVisibilityChange(hidden, this.settings.pauseOnBlur);
            this.atmosphereFX.handleVisibilityChange(hidden);
            this.audioVisualizer.handleVisibilityChange(hidden);
        });
        window.addEventListener('pagehide', () => this.flushPendingPersist());

        // 10.5 Cross-device settings sync (Authority cloud mirror; no-op in local mode)
        this.authorityBridge.onCapabilitiesChanged(() => this.topbarDrawer?.updateCloudPanel());
        // Server settings document written newer by another tab/device → converge now
        // instead of letting the pending write silently revert it (S7-style conflict).
        this.serverSettings.onRemoteNewer = () => void this.reconcileRemoteConflict();
        await this.startSettingsSync();
        this.syncAgentTools();

        // 10.6 PostMessageBridge：让 iframe 内脚本（酒馆助手等）经 postMessage 调用全部
        // 白名单端点。纯浏览器能力，无宿主依赖；失败只降级不阻断初始化（L0-11）。
        try {
            this.postMessageBridge = new PostMessageBridge(this.publicApi);
            this.postMessageBridge.start();
            this.publicApi.setEventBroadcaster((event, args) => this.postMessageBridge?.broadcastEvent(event, args));
        } catch (err) {
            console.warn('[ST-BgLoader] PostMessageBridge unavailable:', err);
        }

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

        // init itself already mounted per settings.enabled (step 8) — record it so the first
        // remote convergence compares against reality instead of null.
        this.appliedEnabled = this.settings.enabled;

        this.isInitialized = true;
        console.log('[ST-BgLoader] All Modular Subsystems fully initialized.');
    }

    private async applyMedia(item: MediaItem, persist: boolean = true): Promise<void> {
        const previousActiveId = this.settings.activeMediaId;
        if (persist) {
            this.settings.activeMediaId = item.id;
            this.saveSettings();
        }

        try {
            const mediaUrl = await this.cacheManager.getMediaBlobUrl(item);
            await this.mediaMount.mountMedia(item, mediaUrl);
        } catch (err) {
            // The durable pointer must not keep targeting media that never mounted: roll it
            // back so the next reload doesn't try to restore a broken background. The old
            // layer may already be torn down at this point, hence no best-effort remount.
            if (persist) {
                this.settings.activeMediaId = previousActiveId ?? null;
                this.saveSettings();
                // Drawer surfaces must un-announce the failed pick too: the active-name label
                // and the grid's "current" badge otherwise keep pointing at the broken item.
                const previous = previousActiveId ? await this.cacheManager.getMedia(previousActiveId).catch(() => null) : null;
                this.settingsDrawer?.updateActiveMedia(previous?.name ?? null);
                void this.topbarDrawer?.refreshMediaGrid();
            }
            this.notifyMediaMountErrorOnce();
            console.error(`[ST-BgLoader] Failed to mount media "${item.name}":`, err);
            throw err;
        }

        // Keep the host's picker in sync with what we just mounted: mark the matching native
        // thumbnail, and make sure the host's own layer is not showing underneath ours.
        // (Host-initiated `#bg1` writes are caught by the controller's own observer, so the
        // CHAT_CHANGED case needs no extra call site here — it would only be a timing race.)
        this.nativeController?.refreshSelection(item.name);
        this.nativeController?.clearNativeBackgroundImage();

        this.settingsDrawer?.updateActiveMedia(item.name);
        if (this.topbarDrawer) {
            void this.topbarDrawer.refreshMediaGrid();
            void this.topbarDrawer.updateCacheStats();
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
        // The master switch is part of the converged object too: a remote disable must
        // actually stop the takeover/unmount the drawer here, not just repaint the toggle.
        if (this.settings.enabled !== this.appliedEnabled) {
            this.appliedEnabled = this.settings.enabled;
            this.applyMasterEnabled(this.settings.enabled);
        }
        this.mediaMount.applyFilters(this.settings.filters);
        this.mediaMount.setInteractive(this.settings.interactiveBackground);
        this.mediaMount.setVisible(this.settings.backgroundVisible);
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
        this.nativeController?.setLevel(this.settings.nativeTakeover);
        this.syncAgentTools();
    }

    /**
     * Shows/hides the background layer. MediaMount owns the applied state (finding A1) while
     * `settings.backgroundVisible` is the durable intent — the setting replaced the Alt+B
     * shortcut, so unlike its first incarnation this one persists across reloads. The panel
     * checkbox and PublicAPI both come through here, so there is a single write path.
     */
    public setBackgroundVisible(visible: boolean): void {
        this.settings.backgroundVisible = visible;
        this.mediaMount.setVisible(visible);
        this.atmosphereFX.handleBackgroundVisibilityChange(visible);
        this.audioVisualizer.handleBackgroundVisibilityChange(visible);
        this.saveSettings();
        // Reflect API-driven changes back into topbar drawer
        this.topbarDrawer?.syncBackgroundVisible(visible);
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

    /** One-shot toastr for a broken mounted medium; repeats still emit `media-error` events. */
    private notifiedMediaRenderError = false;

    /** One-shot toastr for a mount that never completed (resolution/mount failure, not decode). */
    private notifiedMediaMountError = false;

    /** Tracks the enabled state actually applied to subsystems (remote convergence compares against this). */
    private appliedEnabled: boolean | null = null;

    private notifyMediaRenderErrorOnce(): void {
        if (this.notifiedMediaRenderError) return;
        this.notifiedMediaRenderError = true;
        try {
            const toastr = (window as unknown as { toastr?: { warn(msg: string, title?: string): void } }).toastr;
            toastr?.warn('背景媒体加载失败（文件可能损坏或格式不受支持），详见控制台', 'ST-BgLoader');
        } catch {
            // toastr unavailable — the media-error event and console log carry the signal.
        }
    }

    /** One-shot toastr for a mount that never completed (resolution/mount failure, not decode). */
    private notifyMediaMountErrorOnce(): void {
        if (this.notifiedMediaMountError) return;
        this.notifiedMediaMountError = true;
        try {
            const toastr = (window as unknown as { toastr?: { error(msg: string, title?: string): void } }).toastr;
            toastr?.error('背景媒体挂载失败，详见控制台', 'ST-BgLoader');
        } catch {
            // toastr unavailable — the rethrown error is logged at every call site already.
        }
    }

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

    /**
     * 应用一份已收敛的完整设置（PublicAPI.updateSettings/importSettings 的落点）。
     * 与 reconcileRemoteConflict 同一条应用路径：子系统全量同步 + 两个抽屉回填 + 事件，
     * 保证 API 写入不旁路 UI 与远端镜像（否则抽屉下一次 save() 会把旧状态整体写回）。
     */
    public applyConvergedSettings(next: BgLoaderSettings): void {
        this.settings = next;
        this.saveSettings();
        this.applySettingsToSubsystems();
        this.enforceQuotaIfChanged();
        this.topbarDrawer?.applyRemoteSettings(next);
        this.settingsDrawer?.applyRemoteSettings(next);
        this.publicApi.emit('settings-sync', next);
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
            this.topbarDrawer?.applyRemoteSettings(this.settings);
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
            // Both drawers must re-point at the converged object. If the topbar drawer keeps
            // its stale reference, its next save() writes the pre-convergence snapshot back
            // wholesale and silently reverts the remote state.
            this.topbarDrawer?.applyRemoteSettings(this.settings);
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
                    try {
                        if (this.settings.activeMediaId) {
                            const defaultItem = await this.cacheManager.getMedia(this.settings.activeMediaId);
                            if (defaultItem) {
                                await this.applyMedia(defaultItem);
                            }
                        }
                    } catch (err) {
                        console.error('[ST-BgLoader] Failed to restore background on chat change:', err);
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

    private persistTimer: number | null = null;

    /**
     * Sliders drive saveSettings() once per rAF frame while dragging; the server/KV mirrors
     * already debounce their own schedules, so the synchronous localStorage write was the
     * only per-frame cost (60 full-JSON writes per second of dragging). Trailing-debounce
     * it, with a pagehide flush so a tab close never loses the tail of a drag.
     */
    private persistLocalSettings(): void {
        if (this.persistTimer !== null) {
            window.clearTimeout(this.persistTimer);
        }
        this.persistTimer = window.setTimeout(() => {
            this.persistTimer = null;
            this.persistLocalSettingsNow();
        }, 250);
    }

    /** Last-chance synchronous flush of a pending debounced write (pagehide). */
    private flushPendingPersist(): void {
        if (this.persistTimer !== null) {
            window.clearTimeout(this.persistTimer);
            this.persistTimer = null;
            this.persistLocalSettingsNow();
        }
    }

    private persistLocalSettingsNow(): void {
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
