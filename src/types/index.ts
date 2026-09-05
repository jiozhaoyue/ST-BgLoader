export type MediaType = 'video' | 'audio' | 'html' | 'svg' | 'image';
export type MediaSource = 'local' | 'url' | 'server';

export interface VisualFilters {
    blur: number;         // 0 to 20 px
    brightness: number;   // 0 to 200 %
    opacity: number;      // 0 to 100 %
    saturate: number;     // 0 to 200 %
}

export interface MediaItem {
    id: string;
    name: string;
    type: MediaType;
    source: MediaSource;
    url: string;                  // Original URL or Object/Blob URL
    cacheKey: string;             // CacheStorage key
    size: number;                 // in bytes
    mimeType: string;
    addedTimestamp: number;
    lastUsedTimestamp: number;
    thumbnailUrl?: string;
    hasAudio?: boolean;
}

export interface BgLoaderSettings {
    enabled: boolean;
    activeMediaId: string | null;
    volume: number;               // 0.0 to 1.0
    muted: boolean;
    pauseOnBlur: boolean;
    filters: VisualFilters;
    cacheQuotaMB: number;
    lruAutoClean: boolean;
    chatBindings: Record<string, string>; // chatId -> mediaId
}

export const DEFAULT_SETTINGS: BgLoaderSettings = {
    enabled: true,
    activeMediaId: null,
    volume: 0.8,
    muted: false,
    pauseOnBlur: true,
    filters: {
        blur: 0,
        brightness: 100,
        opacity: 100,
        saturate: 100,
    },
    cacheQuotaMB: 1024,
    lruAutoClean: true,
    chatBindings: {},
};
