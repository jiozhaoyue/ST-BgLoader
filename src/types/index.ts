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

export interface PreloadOptions {
    concurrency?: number;
    onProgress?: (loadedCount: number, totalCount: number, currentUrl: string) => void;
}

export interface PreloadResult {
    url: string;
    success: boolean;
    cached: boolean;
    size: number;
    error?: string;
}

export type WeatherType = 'off' | 'rain' | 'snow' | 'sakura' | 'cyber_motes' | 'scanlines';
export type VisualizerMode = 'off' | 'pulse' | 'spectrum';
export type TransitionType = 'fade' | 'zoom_fade' | 'blur_fade' | 'slide_left' | 'slide_right';

export interface WeatherOptions {
    type: WeatherType;
    density: 'low' | 'medium' | 'high';
    speed: number;       // 0.5 to 2.0
    opacity: number;     // 0.1 to 1.0
    wind: number;        // -2 to 2
}

export interface VisualizerOptions {
    mode: VisualizerMode;
    color: string;
    sensitivity: number; // 0.5 to 2.0
}

export interface TriggerAction {
    mediaIdOrUrl?: string;
    bgmUrl?: string;
    weather?: WeatherType;
    preset?: string;
    filters?: Partial<VisualFilters>;
}

export interface TriggerRule {
    id: string;
    name: string;
    enabled: boolean;
    type: 'character' | 'chat' | 'regex';
    pattern: string;     // character name, chatId, or regex pattern
    action: TriggerAction;
}

export interface PlaybackState {
    isPlaying: boolean;
    currentTrack: MediaItem | null;
    volume: number;
    muted: boolean;
    playbackMode: PlaybackMode;
    activeMediaId: string | null;
    activePresetId: string;
    filters: VisualFilters;
    isInteractive: boolean;
    weather: WeatherType;
    visualizerMode: VisualizerMode;
    parallaxEnabled: boolean;
    transitionEffect: TransitionType;
    isMuffled: boolean;
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
    capsuleOnPlayOnly: boolean;
    playbackMode: PlaybackMode;
    playlist: string[];           // IDs of MediaItems in playlist
    cacheQuotaMB: number;
    lruAutoClean: boolean;
    chatBindings: Record<string, string>; // chatId -> mediaId

    // New Modular Subsystems
    weather: WeatherOptions;
    visualizer: VisualizerOptions;
    parallax: {
        enabled: boolean;
        intensity: number; // 0.0 to 1.0
    };
    transitionEffect: TransitionType;
    transitionDurationMs: number;
    muffleBGM: boolean;
    muffleOnDrawer: boolean;
    triggerRules: TriggerRule[];
    // Ambient Sound Generator
    ambientSound: AmbientSoundOptions;

    // Frosted Glass Chat UI
    frostedChat: {
        enabled: boolean;
        blur: number;      // 0 to 20 px
        opacity: number;   // 10 to 100 %
    };

    // Scene Snapshots
    scenes: Record<string, SceneSnapshot>;
    activeSceneId?: string;

    // Keyboard Shortcuts
    shortcutsEnabled: boolean;
}

export type AmbientSoundType = 'off' | 'rain' | 'fire' | 'wind';

export interface AmbientSoundOptions {
    type: AmbientSoundType;
    volume: number; // 0.0 to 1.0
}

export interface SceneSnapshot {
    id: string;
    name: string;
    mediaId?: string;
    mediaUrl?: string;
    bgmUrl?: string;
    presetId?: string;
    filters?: VisualFilters;
    weather?: WeatherOptions;
    visualizer?: VisualizerOptions;
    parallax?: { enabled: boolean; intensity: number };
    ambientSound?: AmbientSoundOptions;
    frostedChat?: boolean;
    isBuiltin?: boolean;
}

export const BUILTIN_SCENES: Record<string, SceneSnapshot> = {
    cyber_rain: {
        id: 'cyber_rain',
        name: 'Cyberpunk Rain (赛博雨夜)',
        presetId: 'cyberpunk',
        weather: { type: 'rain', density: 'high', speed: 1.3, opacity: 0.85, wind: 0.8 },
        visualizer: { mode: 'pulse', color: '#00f0ff', sensitivity: 1.2 },
        parallax: { enabled: true, intensity: 0.4 },
        ambientSound: { type: 'rain', volume: 0.5 },
        frostedChat: true,
        isBuiltin: true,
    },
    cozy_fireplace: {
        id: 'cozy_fireplace',
        name: 'Cozy Fireplace (壁炉夜话)',
        presetId: 'vintage_sepia',
        weather: { type: 'cyber_motes', density: 'low', speed: 0.8, opacity: 0.6, wind: 0.2 },
        visualizer: { mode: 'off', color: '#ffaa44', sensitivity: 1.0 },
        parallax: { enabled: false, intensity: 0.2 },
        ambientSound: { type: 'fire', volume: 0.6 },
        frostedChat: true,
        isBuiltin: true,
    },
    sakura_shrine: {
        id: 'sakura_shrine',
        name: 'Sakura Shrine (落樱古刹)',
        presetId: 'dreamy_bloom',
        weather: { type: 'sakura', density: 'high', speed: 1.0, opacity: 0.8, wind: 0.6 },
        visualizer: { mode: 'off', color: '#ffb7c5', sensitivity: 1.0 },
        parallax: { enabled: true, intensity: 0.3 },
        ambientSound: { type: 'wind', volume: 0.4 },
        frostedChat: true,
        isBuiltin: true,
    },
    winter_cabin: {
        id: 'winter_cabin',
        name: 'Winter Cabin (雪山木屋)',
        presetId: 'cinema_dark',
        weather: { type: 'snow', density: 'high', speed: 1.1, opacity: 0.85, wind: 0.4 },
        visualizer: { mode: 'off', color: '#ffffff', sensitivity: 1.0 },
        parallax: { enabled: true, intensity: 0.3 },
        ambientSound: { type: 'wind', volume: 0.5 },
        frostedChat: true,
        isBuiltin: true,
    },
};

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
    capsuleOnPlayOnly: true,
    playbackMode: 'loop',
    playlist: [],
    cacheQuotaMB: 1024,
    lruAutoClean: true,
    chatBindings: {},

    // Subsystem Defaults
    weather: {
        type: 'off',
        density: 'medium',
        speed: 1.0,
        opacity: 0.75,
        wind: 0.5,
    },
    visualizer: {
        mode: 'off',
        color: '#4fa3d1',
        sensitivity: 1.0,
    },
    parallax: {
        enabled: false,
        intensity: 0.3,
    },
    transitionEffect: 'fade',
    transitionDurationMs: 400,
    muffleBGM: false,
    muffleOnDrawer: false,
    triggerRules: [],

    ambientSound: {
        type: 'off',
        volume: 0.5,
    },
    frostedChat: {
        enabled: false,
        blur: 10,
        opacity: 75,
    },
    scenes: {},
    shortcutsEnabled: true,
};
