import { VisualFilters, BUILTIN_PRESETS, MediaItem, MediaType, PlaybackState, BgLoaderSettings, PreloadOptions, PreloadResult } from '../types';
import type { STBgLoaderExtension } from '../index';

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

    constructor(extension: STBgLoaderExtension) {
        this.ext = extension;
    }

    /**
     * Switch background to a URL, cached media ID, or local file.
     * Supports MP4/WebM video, HTML/Canvas sandboxed pages, SVG animations, and images.
     */
    public async setBackground(urlOrId: string, options?: BackgroundOptions): Promise<void> {
        // 1. Check if urlOrId matches an existing item in library
        const items = await this.ext.getCacheManager().listMedia();
        let targetItem = items.find(i => i.id === urlOrId || i.name === urlOrId || i.url === urlOrId || i.cacheKey === urlOrId);

        if (!targetItem) {
            // Treat as URL or path
            const name = options?.name || urlOrId.split('/').pop()?.split('?')[0] || 'remote_background';
            const type = options?.type || this.detectType(urlOrId);

            if (options?.saveToLibrary) {
                targetItem = await this.ext.getCacheManager().saveMedia(new Blob([]), name, type, 'url', urlOrId);
            } else {
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

        // Apply filters if provided
        if (options?.filters) {
            this.setFilters(options.filters);
        }

        // Apply interactive if specified
        if (typeof options?.interactive === 'boolean') {
            this.setInteractive(options.interactive);
        }

        await this.ext.applyMediaItem(targetItem);
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

    /**
     * Toggle play/pause for background audio
     */
    public togglePlay(): void {
        this.ext.getAudioEngine().togglePlay();
    }

    /**
     * Play next track in playlist
     */
    public nextTrack(): void {
        this.ext.getAudioEngine().playNext();
    }

    /**
     * Play previous track in playlist
     */
    public prevTrack(): void {
        this.ext.getAudioEngine().playPrev();
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    public setVolume(volume: number): void {
        const clamped = Math.max(0, Math.min(1, volume));
        this.ext.getSettings().volume = clamped;
        this.ext.getAudioEngine().setVolume(clamped);
        this.ext.saveSettings();
        this.emit('volume-change', clamped);
    }

    /**
     * Mute or unmute audio
     */
    public setMuted(muted: boolean): void {
        this.ext.getSettings().muted = muted;
        this.ext.getAudioEngine().setMuted(muted);
        this.ext.saveSettings();
        this.emit('mute-change', muted);
    }

    /**
     * Dynamically adjust CSS visual filters
     */
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

    /**
     * Apply built-in or custom filter preset
     */
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

    /**
     * Set mouse interaction passthrough for HTML/Canvas/WebGL backgrounds
     */
    public setInteractive(enabled: boolean): void {
        this.ext.getSettings().interactiveBackground = enabled;
        this.ext.getMediaMount().setInteractive(enabled);
        this.ext.saveSettings();
        this.emit('interactive-change', enabled);
    }

    /**
     * Return current playback, filter, and media status
     */
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
        };
    }

    /**
     * Get list of all media items in cache library
     */
    public async getMediaList(): Promise<MediaItem[]> {
        return this.ext.getCacheManager().listMedia();
    }

    /**
     * Preload remote media files (video, audio, html, svg, images) into CacheStorage.
     * Guarantees zero-network-delay instant switching when subsequently set as background or BGM.
     */
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

    // --- Event Bus ---

    /**
     * Subscribe to ST-BgLoader events. Returns unsubscribe function.
     * Events: 'media-change', 'track-change', 'play-state-change', 'volume-change', 'mute-change', 'filters-change', 'preset-change', 'interactive-change'
     */
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
        this.eventListeners.get(event)?.forEach(cb => {
            try {
                cb(...args);
            } catch (err) {
                console.error(`[ST-BgLoader PublicAPI] Error in listener for "${event}":`, err);
            }
        });
    }

    private detectType(url: string): MediaType {
        const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
        if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
        if (ext === 'html' || ext === 'htm') return 'html';
        if (ext === 'svg') return 'svg';
        return 'image';
    }
}
