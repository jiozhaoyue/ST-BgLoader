export type MediaType = 'video' | 'audio' | 'html' | 'svg' | 'image';
export type MediaSource = 'local' | 'url' | 'server';
export type PlaybackMode = 'loop' | 'single' | 'shuffle';

export interface VisualFilters {
    blur: number;         // 0 to 20 px
    brightness: number;   // 0 to 200 %
    opacity: number;      // 0 to 100 %
    saturate: number;     // 0 to 200 %
}

export interface FilterPreset {
    id: string;
    name: string;
    isCustom?: boolean;
    filters: VisualFilters;
}

export const BUILTIN_PRESETS: Record<string, FilterPreset> = {
    default: {
        id: 'default',
        name: 'Default (原色)',
        filters: { blur: 0, brightness: 100, opacity: 100, saturate: 100 },
    },
    cinema_dark: {
        id: 'cinema_dark',
        name: 'Cinema Dark (影院暗调)',
        filters: { blur: 3, brightness: 75, opacity: 90, saturate: 95 },
    },
    cyberpunk: {
        id: 'cyberpunk',
        name: 'Cyberpunk (赛博霓虹)',
        filters: { blur: 0, brightness: 110, opacity: 100, saturate: 160 },
    },
    vintage_sepia: {
        id: 'vintage_sepia',
        name: 'Vintage (复古胶片)',
        filters: { blur: 1, brightness: 90, opacity: 90, saturate: 70 },
    },
    dreamy_bloom: {
        id: 'dreamy_bloom',
        name: 'Dreamy (梦幻光晕)',
        filters: { blur: 6, brightness: 125, opacity: 95, saturate: 115 },
    },
    monochrome: {
        id: 'monochrome',
        name: 'Monochrome (黑白极简)',
        filters: { blur: 0, brightness: 100, opacity: 100, saturate: 0 },
    },
};

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
    activePresetId: string;
    userPresets: Record<string, VisualFilters>;
    interactiveBackground: boolean;
    showMiniPlayer: boolean;
    playbackMode: PlaybackMode;
    playlist: string[];           // IDs of MediaItems in playlist
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
    activePresetId: 'default',
    userPresets: {},
    interactiveBackground: false,
    showMiniPlayer: true,
    playbackMode: 'loop',
    playlist: [],
    cacheQuotaMB: 1024,
    lruAutoClean: true,
    chatBindings: {},
};
