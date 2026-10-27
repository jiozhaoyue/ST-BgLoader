import {
    VisualFilters,
    BUILTIN_PRESETS,
    MediaItem,
    MediaType,
    PlaybackState,
    PreloadOptions,
    PreloadResult,
    WeatherOptions,
    WeatherType,
    VisualizerOptions,
    VisualizerMode,
    TransitionType,
    TriggerRule,
    AmbientSoundOptions,
    AmbientSoundType,
    SceneSnapshot,
    WEATHER_TYPES,
    BgLoaderSettings,
    mergeSettings,
    PlaybackMode,
} from '../types';
import type { STBgLoaderExtension } from '../index';
import { detectMediaType } from '../core/mediaType';
import { HostBridge as HostBridgeSingleton } from '../bridge/HostBridge';
import { API_VERSION, getEndpointCategories, ENDPOINT_METHODS } from './EndpointRegistry';

export const PLAYBACK_MODES: readonly string[] = ['loop', 'single', 'shuffle'];

export interface BackgroundOptions {
    type?: MediaType;
    filters?: Partial<VisualFilters>;
    interactive?: boolean;
    name?: string;
    saveToLibrary?: boolean;
}

export interface AudioOptions {
    volume?: number;
    loop?: boolean;
    title?: string;
    fadeInMs?: number;
}

export type EventCallback = (...args: any[]) => void;

export class PublicAPI {
    private ext: STBgLoaderExtension;
    private eventListeners: Map<string, Set<EventCallback>> = new Map();
    /** PostMessageBridge 在位标志（getCapabilities 上报用；由桥自身置位）。 */
    public bridgeActive: boolean = false;
    /** 跨 iframe 事件推送钩子（index 装配 PostMessageBridge 后注入；可空）。 */
    private eventBroadcaster: ((event: string, args: unknown[]) => void) | null = null;

    constructor(extension: STBgLoaderExtension) {
        this.ext = extension;
    }

    /** index.ts 装配时注入；桥 stop() 后传 null 摘除。 */
    public setEventBroadcaster(fn: ((event: string, args: unknown[]) => void) | null): void {
        this.eventBroadcaster = fn;
    }

    /**
     * Switch background to a URL, cached media ID, or local file.
     * Supports MP4/WebM video, HTML/Canvas sandboxed pages, SVG animations, and images.
     *
     * Without `saveToLibrary` the background is TRANSIENT: it is rendered from an in-memory
     * item whose id exists nowhere in the catalog, so it is deliberately NOT recorded in
     * `activeMediaId` (a persisted id that cannot be resolved came back as a dangling
     * reference after every reload — finding A2). Choose `saveToLibrary: true` to keep it.
     */
    public async setBackground(urlOrId: string, options?: BackgroundOptions): Promise<void> {
        const items = await this.ext.getCacheManager().listMedia();
        let targetItem = items.find(i => i.id === urlOrId || i.name === urlOrId || i.url === urlOrId || i.cacheKey === urlOrId);
        let transient = false;

        if (!targetItem) {
            const name = options?.name || urlOrId.split('/').pop()?.split('?')[0] || 'remote_background';
            const type = options?.type || detectMediaType(urlOrId);

            if (options?.saveToLibrary) {
                targetItem = await this.ext.getCacheManager().saveMedia(new Blob([]), name, type, 'url', urlOrId);
            } else {
                transient = true;
                targetItem = {
                    id: 'custom_' + Date.now(),
                    name,
                    type,
                    source: 'url',
                    url: urlOrId,
                    cacheKey: urlOrId,
                    size: 0,
                    mimeType: '',
                    addedTimestamp: Date.now(),
                    lastUsedTimestamp: Date.now(),
                };
            }
        }

        if (options?.filters) {
            this.setFilters(options.filters);
        }

        if (typeof options?.interactive === 'boolean') {
            this.setInteractive(options.interactive);
        }

        await this.ext.applyMediaItem(targetItem, !transient);
        this.emit('media-change', targetItem);
    }

    /**
     * Clear the current background
     */
    public clearBackground(): void {
        this.ext.clearActiveBackground();
        this.emit('media-change', null);
    }

    /**
     * Shows or hides the background layer WITHOUT unloading the mounted media (the removed
     * Alt+B shortcut used to do this; the settings panel checkbox and this method replace it).
     */
    public setBackgroundVisible(visible: boolean): void {
        this.ext.setBackgroundVisible(visible);
        this.emit('background-visibility-change', visible);
    }

    public isBackgroundVisible(): boolean {
        return this.ext.getMediaMount().isVisible();
    }

    /**
     * Play background music or sound track
     */
    public async playBGM(urlOrId: string, options?: AudioOptions): Promise<void> {
        if (typeof options?.volume === 'number') {
            this.setVolume(options.volume);
        }

        const items = await this.ext.getCacheManager().listMedia();
        let item = items.find(i => i.id === urlOrId || i.name === urlOrId || i.url === urlOrId || i.cacheKey === urlOrId);

        if (!item) {
            const title = options?.title || urlOrId.split('/').pop()?.split('?')[0] || 'BGM';
            item = {
                id: 'bgm_' + Date.now(),
                name: title,
                type: 'audio',
                source: 'url',
                url: urlOrId,
                cacheKey: urlOrId,
                size: 0,
                mimeType: 'audio/mpeg',
                addedTimestamp: Date.now(),
                lastUsedTimestamp: Date.now(),
            };
        }

        const audioEngine = this.ext.getAudioEngine();
        await audioEngine.playMediaItem(item);
        this.emit('track-change', item);
    }

    /**
     * Stop background music with optional fade-out
     */
    public stopBGM(fadeOutMs: number = 300): void {
        this.ext.getAudioEngine().stopTrack(fadeOutMs);
        this.emit('track-change', null);
    }

    public togglePlay(): void {
        this.ext.getAudioEngine().togglePlay();
    }

    public nextTrack(): void {
        this.ext.getAudioEngine().playNext();
    }

    public prevTrack(): void {
        this.ext.getAudioEngine().playPrev();
    }

    public setVolume(volume: number): void {
        const clamped = Math.max(0, Math.min(1, volume));
        this.ext.getSettings().volume = clamped;
        this.ext.getAudioEngine().setVolume(clamped);
        this.ext.saveSettings();
        this.emit('volume-change', clamped);
    }

    public setMuted(muted: boolean): void {
        this.ext.getSettings().muted = muted;
        this.ext.getAudioEngine().setMuted(muted);
        this.ext.saveSettings();
        this.emit('mute-change', muted);
    }

    /**
     * Toggle or set Lo-Fi acoustic muffle effect (800Hz lowpass filter)
     */
    public setMuffled(muffled: boolean): void {
        this.ext.getSettings().muffleBGM = muffled;
        this.ext.getAudioEngine().setMuffled(muffled);
        this.ext.saveSettings();
        this.emit('muffle-change', muffled);
    }

    public getMuffled(): boolean {
        return this.ext.getAudioEngine().getMuffled();
    }

    public setFilters(filters: Partial<VisualFilters>): void {
        const current = this.ext.getSettings().filters;
        const updated: VisualFilters = {
            blur: filters.blur !== undefined ? filters.blur : current.blur,
            brightness: filters.brightness !== undefined ? filters.brightness : current.brightness,
            opacity: filters.opacity !== undefined ? filters.opacity : current.opacity,
            saturate: filters.saturate !== undefined ? filters.saturate : current.saturate,
        };
        this.ext.getSettings().filters = updated;
        this.ext.getMediaMount().applyFilters(updated);
        this.ext.saveSettings();
        this.emit('filters-change', updated);
    }

    public applyPreset(presetId: string): void {
        const settings = this.ext.getSettings();
        let filters: VisualFilters | undefined = BUILTIN_PRESETS[presetId]?.filters;
        if (!filters && settings.userPresets[presetId]) {
            filters = settings.userPresets[presetId];
        }

        if (filters) {
            settings.activePresetId = presetId;
            settings.filters = { ...filters };
            this.ext.getMediaMount().applyFilters(filters);
            this.ext.saveSettings();
            this.emit('preset-change', presetId, filters);
        } else {
            console.warn(`[ST-BgLoader PublicAPI] Preset "${presetId}" not found.`);
        }
    }

    public setInteractive(enabled: boolean): void {
        this.ext.getSettings().interactiveBackground = enabled;
        this.ext.getMediaMount().setInteractive(enabled);
        this.ext.saveSettings();
        this.emit('interactive-change', enabled);
    }

    /**
     * Atmospheric weather & particle FX
     */
    public setWeather(typeOrOptions: WeatherType | WeatherOptions, options?: Partial<WeatherOptions>): void {
        let opts: WeatherOptions;
        if (typeof typeOrOptions === 'string') {
            opts = {
                ...this.ext.getSettings().weather,
                type: typeOrOptions,
                ...(options || {}),
            };
        } else {
            opts = { ...typeOrOptions };
        }

        // External callers (agent tools, third-party scripts) are not bound by the TS union;
        // a bogus type would otherwise be persisted and leave the FX loop spinning on a
        // type no renderer knows.
        if (!WEATHER_TYPES.includes(opts.type)) {
            console.warn(`[ST-BgLoader PublicAPI] Ignored invalid weather type "${String(opts.type)}".`);
            return;
        }

        this.ext.getSettings().weather = opts;
        this.ext.getAtmosphereFX().setWeather(opts);
        this.ext.saveSettings();
        this.emit('weather-change', opts);
    }

    public getWeather(): WeatherOptions {
        return { ...this.ext.getSettings().weather };
    }

    /**
     * Audio visualizer options
     */
    public setVisualizer(modeOrOptions: VisualizerMode | VisualizerOptions): void {
        let opts: VisualizerOptions;
        if (typeof modeOrOptions === 'string') {
            opts = {
                ...this.ext.getSettings().visualizer,
                mode: modeOrOptions,
            };
        } else {
            opts = { ...modeOrOptions };
        }

        this.ext.getSettings().visualizer = opts;
        this.ext.getAudioVisualizer().setOptions(opts);
        this.ext.saveSettings();
        this.emit('visualizer-change', opts);
    }

    public getVisualizer(): VisualizerOptions {
        return { ...this.ext.getSettings().visualizer };
    }

    /**
     * 2.5D Parallax controls
     */
    public setParallax(enabled: boolean, intensity?: number): void {
        const parallax = {
            enabled,
            intensity: intensity !== undefined ? intensity : this.ext.getSettings().parallax.intensity,
        };
        this.ext.getSettings().parallax = parallax;
        this.ext.getParallaxController().setOptions(parallax);
        this.ext.saveSettings();
        this.emit('parallax-change', parallax);
    }

    /**
     * Transition effect and duration
     */
    public setTransition(type: TransitionType, durationMs?: number): void {
        this.ext.getSettings().transitionEffect = type;
        if (durationMs !== undefined) {
            this.ext.getSettings().transitionDurationMs = durationMs;
        }
        this.ext.getMediaMount().setTransition(type, this.ext.getSettings().transitionDurationMs);
        this.ext.saveSettings();
        this.emit('transition-change', type, this.ext.getSettings().transitionDurationMs);
    }

    /**
     * Trigger rule management
     */
    public addTriggerRule(rule: TriggerRule): void {
        this.ext.getTriggerManager().addRule(rule);
        this.ext.getSettings().triggerRules = this.ext.getTriggerManager().getRules();
        this.ext.saveSettings();
        this.emit('trigger-rules-change', this.ext.getSettings().triggerRules);
    }

    public removeTriggerRule(id: string): void {
        this.ext.getTriggerManager().removeRule(id);
        this.ext.getSettings().triggerRules = this.ext.getTriggerManager().getRules();
        this.ext.saveSettings();
        this.emit('trigger-rules-change', this.ext.getSettings().triggerRules);
    }

    public getTriggerRules(): TriggerRule[] {
        return this.ext.getTriggerManager().getRules();
    }

    /**
     * Ambient sound generator (procedural rain, fire, wind)
     */
    public setAmbientSound(typeOrOptions: AmbientSoundType | AmbientSoundOptions, volume?: number): void {
        let opts: AmbientSoundOptions;
        if (typeof typeOrOptions === 'string') {
            opts = {
                type: typeOrOptions,
                volume: volume !== undefined ? volume : this.ext.getSettings().ambientSound.volume,
            };
        } else {
            opts = { ...typeOrOptions };
        }

        this.ext.getSettings().ambientSound = opts;
        this.ext.getAmbientSoundGenerator().setSound(opts);
        this.ext.saveSettings();
        this.emit('ambient-sound-change', opts);
    }

    public getAmbientSound(): AmbientSoundOptions {
        return { ...this.ext.getSettings().ambientSound };
    }

    /**
     * Frosted glass transparent chat bubbles UI
     */
    public setFrostedChat(enabled: boolean, options?: { blur?: number; opacity?: number }): void {
        const updated = {
            enabled,
            blur: options?.blur !== undefined ? options.blur : this.ext.getSettings().frostedChat.blur,
            opacity: options?.opacity !== undefined ? options.opacity : this.ext.getSettings().frostedChat.opacity,
        };
        this.ext.getSettings().frostedChat = updated;
        this.ext.getFrostedGlassController().setOptions(updated);
        this.ext.saveSettings();
        this.emit('frosted-chat-change', updated);
    }

    public getFrostedChat(): { enabled: boolean; blur: number; opacity: number } {
        return { ...this.ext.getSettings().frostedChat };
    }

    /**
     * Audiovisual Scene Snapshots
     */
    public applyScene(id: string): boolean {
        const sceneManager = this.ext.getSceneManager();
        if (!sceneManager) return false;
        const success = sceneManager.applyScene(id);
        if (success) {
            this.ext.getSettings().activeSceneId = id;
            this.ext.saveSettings();
            this.emit('scene-change', id);
        }
        return success;
    }

    public saveCurrentScene(name: string): SceneSnapshot | null {
        const sceneManager = this.ext.getSceneManager();
        if (!sceneManager) return null;
        const settings = this.ext.getSettings();
        const snapshot: SceneSnapshot = {
            id: `scene_${Date.now()}`,
            name,
            mediaId: settings.activeMediaId || undefined,
            presetId: settings.activePresetId,
            filters: { ...settings.filters },
            weather: { ...settings.weather },
            visualizer: { ...settings.visualizer },
            parallax: { ...settings.parallax },
            ambientSound: { ...settings.ambientSound },
            frostedChat: settings.frostedChat.enabled,
        };

        sceneManager.saveScene(snapshot);
        settings.scenes = sceneManager.getUserScenes();
        this.ext.saveSettings();
        this.emit('scenes-change', sceneManager.getAllScenes());
        return snapshot;
    }

    public getScenes(): Record<string, SceneSnapshot> {
        return this.ext.getSceneManager()?.getAllScenes() ?? {};
    }

    public deleteScene(id: string): boolean {
        const sceneManager = this.ext.getSceneManager();
        if (!sceneManager) return false;
        const deleted = sceneManager.deleteScene(id);
        if (deleted) {
            this.ext.getSettings().scenes = sceneManager.getUserScenes();
            this.ext.saveSettings();
            this.emit('scenes-change', sceneManager.getAllScenes());
        }
        return deleted;
    }

    /**
     * Quick cycle through weather types
     */
    public cycleWeather(): WeatherType {
        const current = this.ext.getSettings().weather.type;
        const nextIdx = (WEATHER_TYPES.indexOf(current) + 1) % WEATHER_TYPES.length;
        const nextType = WEATHER_TYPES[nextIdx];
        this.setWeather(nextType);
        return nextType;
    }


    public getPlaybackState(): PlaybackState {
        const settings = this.ext.getSettings();
        const audioEngine = this.ext.getAudioEngine();
        return {
            isPlaying: audioEngine.isPlaying(),
            currentTrack: audioEngine.getCurrentTrack(),
            volume: audioEngine.getVolume(),
            muted: audioEngine.isMuted(),
            playbackMode: audioEngine.getPlaybackMode(),
            activeMediaId: settings.activeMediaId,
            activePresetId: settings.activePresetId,
            filters: { ...settings.filters },
            isInteractive: settings.interactiveBackground,
            weather: settings.weather.type,
            visualizerMode: settings.visualizer.mode,
            parallaxEnabled: settings.parallax.enabled,
            transitionEffect: settings.transitionEffect,
            isMuffled: audioEngine.getMuffled(),
        };
    }

    public async getMediaList(): Promise<MediaItem[]> {
        return this.ext.getCacheManager().listMedia();
    }

    public async preloadMedia(
        urls: string | string[],
        options?: PreloadOptions
    ): Promise<PreloadResult[]> {
        const list = Array.isArray(urls) ? urls : [urls];
        const results: PreloadResult[] = [];
        const concurrency = options?.concurrency || 3;
        let completed = 0;

        const queue = [...list];
        const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
            while (queue.length > 0) {
                const url = queue.shift()!;
                try {
                    const { item, isNew } = await this.ext.getCacheManager().preloadUrl(url);
                    const res: PreloadResult = {
                        url,
                        success: true,
                        cached: !isNew,
                        size: item.size || 0,
                    };
                    results.push(res);
                } catch (err: any) {
                    results.push({
                        url,
                        success: false,
                        cached: false,
                        size: 0,
                        error: err?.message || String(err),
                    });
                }
                completed++;
                options?.onProgress?.(completed, list.length, url);
                this.emit('preload-progress', completed, list.length, url);
            }
        });

        await Promise.all(workers);
        this.emit('preload-complete', results);
        return results;
    }

    // --- Discovery（发现接口：调用方特性检测用） ---

    public getApiVersion(): { api: number; plugin: string } {
        let pluginVersion = 'unknown';
        try {
            const manifest = (window as unknown as { manifest?: { version?: string } }).manifest;
            if (manifest?.version) pluginVersion = manifest.version;
        } catch {
            // 独立页/harness 无 manifest——保持 unknown
        }
        return { api: API_VERSION, plugin: pluginVersion };
    }

    public getCapabilities(): {
        api: number;
        postMessageBridge: boolean;
        eventChannels: string[];
        categories: Record<string, string[]>;
    } {
        return {
            api: API_VERSION,
            postMessageBridge: this.bridgeActive,
            eventChannels: ['bus', 'eventSource', 'customEvent'],
            categories: getEndpointCategories(),
        };
    }

    public listMethods(): string[] {
        // 与 EndpointRegistry 对表（登记表是唯一事实源，见 EndpointRegistry 头注）
        return ENDPOINT_METHODS.slice();
    }

    // --- Media library management（媒体库管理端点） ---

    /**
     * 上传一个 Blob/File 进媒体库（与顶栏抽屉上传同路径：saveMedia(..., 'server')）。
     * 返回新条目。type 省略时按文件名探测。
     */
    public async uploadMedia(blob: Blob | File, name?: string, type?: MediaType): Promise<MediaItem> {
        if (!(blob instanceof Blob)) {
            throw new Error('INVALID_PARAMS: uploadMedia(blob) 需要 Blob 或 File');
        }
        if (name !== undefined && typeof name !== 'string') {
            throw new Error('INVALID_PARAMS: name 必须是字符串');
        }
        const fileName = (name || (blob as File).name || `upload_${Date.now()}`).trim();
        if (!fileName) {
            throw new Error('INVALID_PARAMS: name 不能为空');
        }
        const mediaType = type ?? detectMediaType(fileName);
        const item = await this.ext.getCacheManager().saveMedia(blob, fileName, mediaType, 'server');
        this.emit('media-added', item);
        return item;
    }

    /**
     * 删除媒体条目并联动清理播放面（与顶栏抽屉 onMediaDeleted 同语义）：
     * 正作背景则清背景，正在播放则停轨，随后刷新播放列表。
     */
    public async deleteMedia(id: string): Promise<boolean> {
        this._assertId(id, 'deleteMedia');
        const cm = this.ext.getCacheManager();
        const item = await cm.getMedia(id);
        if (!item) return false;

        await cm.deleteMedia(id);
        if (this.ext.getSettings().activeMediaId === id) {
            this.ext.clearActiveBackground();
        }
        const ae = this.ext.getAudioEngine();
        if (ae.getCurrentTrack()?.id === id) {
            ae.stopTrack();
        }
        const items = await cm.listMedia();
        ae.setPlaylist(items.filter(i => i.type === 'audio'));
        this.emit('media-deleted', id);
        return true;
    }

    public async getMediaInfo(id: string): Promise<MediaItem | null> {
        this._assertId(id, 'getMediaInfo');
        const item = await this.ext.getCacheManager().getMedia(id);
        return item ? { ...item } : null;
    }

    /**
     * 取一个可在本会话内复用的 blob URL（CacheManager 内部有在途去重与生命周期管理）。
     * 该 URL 仅本会话有效——跨会话复用请改用 getMediaInfo().url 或重新调用本方法。
     */
    public async getMediaUrl(id: string): Promise<string | null> {
        this._assertId(id, 'getMediaUrl');
        const item = await this.ext.getCacheManager().getMedia(id);
        if (!item) return null;
        return this.ext.getCacheManager().getMediaBlobUrl(item);
    }

    // --- Playlist control（播放列表端点） ---

    public getPlaylist(): MediaItem[] {
        return this.ext.getAudioEngine().getPlaylist().map(item => ({ ...item }));
    }

    public setPlaybackMode(mode: PlaybackMode): void {
        if (!PLAYBACK_MODES.includes(mode)) {
            throw new Error(`INVALID_PARAMS: playbackMode 必须是 ${PLAYBACK_MODES.join('/')} 之一`);
        }
        this.ext.getSettings().playbackMode = mode;
        this.ext.getAudioEngine().setPlaybackMode(mode);
        this.ext.saveSettings();
        this.emit('playback-mode-change', mode);
    }

    /** 跳到播放列表第 index 首并播放；越界返回 false（不抛错）。 */
    public async jumpToTrack(index: number): Promise<boolean> {
        if (!Number.isInteger(index) || index < 0) {
            throw new Error('INVALID_PARAMS: index 必须是非负整数');
        }
        const playlist = this.ext.getAudioEngine().getPlaylist();
        if (index >= playlist.length) return false;
        const item = playlist[index];
        const url = await this.ext.getCacheManager().getMediaBlobUrl(item);
        await this.ext.getAudioEngine().playMediaItem(item, url);
        this.emit('track-change', item);
        return true;
    }

    /**
     * 当前激活的背景条目（getPlaybackState 只给 id，本端点直接给解析后的条目）。
     * 未设置/引用已失效时返回 null。
     */
    public async getActiveMedia(): Promise<MediaItem | null> {
        const id = this.ext.getSettings().activeMediaId;
        if (!id) return null;
        const item = await this.ext.getCacheManager().getMedia(id);
        return item ? { ...item } : null;
    }

    /**
     * 程序化开合顶栏背景抽屉（复用宿主原生开合钮的点击语义）。
     * 宿主 DOM 不可用时返回 false。
     */
    public showTopbarDrawer(open: boolean): boolean {
        if (typeof open !== 'boolean') {
            throw new Error('INVALID_PARAMS: showTopbarDrawer(open) 需要 boolean');
        }
        const bridge = HostBridgeSingleton.getInstance();
        if (open) return bridge.openBackgroundDrawer();
        bridge.closeBackgroundDrawer();
        return true;
    }

    // --- Settings endpoints（设置读写端点） ---

    /** 只读快照（深拷贝；调用方改它不会影响插件状态）。 */
    public getSettings(): BgLoaderSettings {
        return JSON.parse(JSON.stringify(this.ext.getSettings())) as BgLoaderSettings;
    }

    /**
     * 合并更新设置：patch 与当前设置合并后走 mergeSettings 全量收敛，
     * 与顶栏抽屉/远端收敛同一条应用路径（不旁路子系统同步）。
     */
    public updateSettings(patch: Partial<BgLoaderSettings>): BgLoaderSettings {
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
            throw new Error('INVALID_PARAMS: updateSettings(patch) 需要 plain object');
        }
        const merged = mergeSettings({ ...this.ext.getSettings(), ...patch });
        this.ext.applyConvergedSettings(merged);
        return this.getSettings();
    }

    /** 导出设置快照（JSON 序列化安全，可直接存文件或发给 importSettings）。 */
    public exportSettings(): BgLoaderSettings {
        return this.getSettings();
    }

    /** 导入设置（整体替换，走 mergeSettings 收敛；非法 JSON 结构会静默回退默认值）。 */
    public importSettings(payload: unknown): BgLoaderSettings {
        const merged = mergeSettings(payload);
        this.ext.applyConvergedSettings(merged);
        return this.getSettings();
    }

    // --- Master switch（主开关端点；语义同 P2-5：关 = 视听同停） ---

    public setMasterEnabled(enabled: boolean): void {
        if (typeof enabled !== 'boolean') {
            throw new Error('INVALID_PARAMS: setMasterEnabled(enabled) 需要 boolean');
        }
        this.ext.setMasterEnabled(enabled);
        this.emit('master-switch', enabled);
    }

    public isEnabled(): boolean {
        return this.ext.getSettings().enabled !== false;
    }

    // --- Cache endpoints（缓存端点） ---

    public async getCacheStats(): Promise<{
        usedBytes: number;
        itemCount: number;
        quotaBytes: number;
        lruAutoClean: boolean;
    }> {
        const usage = await this.ext.getCacheManager().getCacheUsage();
        const settings = this.ext.getSettings();
        return {
            usedBytes: usage.usedBytes,
            itemCount: usage.itemCount,
            quotaBytes: settings.cacheQuotaMB * 1024 * 1024,
            lruAutoClean: settings.lruAutoClean,
        };
    }

    /** 清空全部缓存与媒体库（破坏性端点：等同设置面板的清空按钮）。 */
    public async clearCache(): Promise<void> {
        await this.ext.getCacheManager().clearAll();
        this.ext.clearActiveBackground();
        this.ext.getAudioEngine().setPlaylist([]);
        this.emit('cache-cleared');
    }

    // --- Visualizer data（可视化数据只读端点） ---

    /**
     * 当前频谱快照（0-255 字节数组副本）。无 analyser（未播放/不支持）时返回 []，
     * 永不挂起——供其他插件做自己的可视化。
     */
    public getVisualizerData(): number[] {
        const spectrum = this.ext.getAudioVisualizer().getSpectrum();
        return spectrum ? Array.from(spectrum) : [];
    }

    /** 路径内部共用：id 参数守卫。 */
    private _assertId(id: unknown, caller: string): void {
        if (typeof id !== 'string' || id.length === 0) {
            throw new Error(`INVALID_PARAMS: ${caller}(id) 需要非空字符串 id`);
        }
    }

    // --- Event Bus ---

    public on(event: string, callback: EventCallback): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
        return () => this.off(event, callback);
    }

    public off(event: string, callback: EventCallback): void {
        this.eventListeners.get(event)?.delete(callback);
    }

    public emit(event: string, ...args: any[]): void {
        // ① 内部总线（既有订阅面，语义不变）
        this.eventListeners.get(event)?.forEach(cb => {
            try {
                cb(...args);
            } catch (err) {
                console.error(`[ST-BgLoader PublicAPI] Error in listener for "${event}":`, err);
            }
        });
        // ② 酒馆 eventSource 镜像（`st_bgloader:<event>`；宿主缺失/抛错静默降级，L0-11）
        try {
            const es = (window as unknown as { eventSource?: { emit?(name: string, ...a: unknown[]): void } }).eventSource;
            if (es && typeof es.emit === 'function') {
                es.emit(`st_bgloader:${event}`, ...args);
            }
        } catch {
            // 宿主事件源不可用——①③ 两通道已覆盖订阅需求
        }
        // ③ DOM CustomEvent 镜像（`st-bgloader:<event>`，detail 统一为 { args }，
        //    让任何脚本零依赖监听；与 CSS 双前缀纪律同型的命名空间隔离）
        try {
            document.dispatchEvent(new CustomEvent(`st-bgloader:${event}`, { detail: { args } }));
        } catch {
            // 无文档环境（非浏览器宿主）
        }
        // ④ PostMessageBridge：推给 TTL 内活跃过的 iframe 调用方
        if (this.eventBroadcaster) {
            try {
                this.eventBroadcaster(event, args);
            } catch {
                // 广播失败不影响本地订阅面
            }
        }
    }
}
