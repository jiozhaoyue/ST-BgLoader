export type MediaType = 'video' | 'audio' | 'html' | 'svg' | 'image';
export type MediaSource = 'url' | 'server';
export type PlaybackMode = 'loop' | 'single' | 'shuffle';

/**
 * How much of the host's own background picker the extension takes over.
 * - `off`       — enhance only: type badges, no interception.
 * - `non-image` — intercept only what the native grid cannot preview anyway.
 * - `all`       — intercept every selection, images included.
 */
export type TakeoverLevel = 'off' | 'non-image' | 'all';

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

/**
 * The weather vocabulary — the ONE source of truth (finding D1). The runtime whitelist must
 * exist as a value (agent-tool schemas, `PublicAPI.setWeather`'s validation gate for untrusted
 * callers), and the union is derived from it, so adding a weather type can no longer leave the
 * value list or the literal in `cycleWeather` behind.
 */
export const WEATHER_TYPES = ['off', 'rain', 'snow', 'sakura', 'cyber_motes', 'scanlines'] as const;
export type WeatherType = (typeof WEATHER_TYPES)[number];

/**
 * Display names for the weather vocabulary. Co-located with WEATHER_TYPES and typed as a total
 * Record so adding a type without a label is a compile error — the settings dropdown used to be
 * a fourth, hand-maintained copy of the list and would silently drift.
 */
export const WEATHER_LABELS: Record<WeatherType, string> = {
    off: 'Off (关闭天气)',
    rain: 'Rain (细雨微涟)',
    snow: 'Snow (冬日飘雪)',
    sakura: 'Sakura (落樱缤纷)',
    cyber_motes: 'Cyber Motes (赛博霓虹微粒)',
    scanlines: 'Scanlines (复古CRT扫描线)',
};
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
    activeMediaId: string | null;
    volume: number;               // 0.0 to 1.0
    muted: boolean;
    pauseOnBlur: boolean;
    filters: VisualFilters;
    activePresetId: string;
    userPresets: Record<string, VisualFilters>;
    interactiveBackground: boolean;
    /**
     * Whether the background layer is shown. Persisted since 2026-09-26: it replaced the Alt+B
     * shortcut, and a panel checkbox that silently forgot its state on reload felt broken.
     */
    backgroundVisible: boolean;
    showMiniPlayer: boolean;
    capsuleOnPlayOnly: boolean;
    playbackMode: PlaybackMode;
    cacheQuotaMB: number;
    lruAutoClean: boolean;
    /**
     * Takeover of the host's native background picker. Defaults to `all`: clicking any thumbnail
     * in the host's own panel routes through this extension, so filters, weather and transitions
     * apply to every background alike.
     */
    nativeTakeover: TakeoverLevel;

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

    // Authority backend (opt-in): register ambient tools into the Agent Runtime
    agentToolsEnabled: boolean;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges a stored/partial settings object onto DEFAULT_SETTINGS: top-level spread plus
 * ONE level of nested-object merge. Persisted settings from older versions lack keys
 * added later, and a shallow spread left those nested objects (weather/visualizer/…)
 * with missing fields at runtime. Arrays (triggerRules) and records (userPresets/scenes)
 * replace wholesale — merging them with defaults is meaningless; nested option objects are all
 * flat, so one level is enough.
 */
export function mergeSettings(stored: unknown): BgLoaderSettings {
    const merged: BgLoaderSettings = { ...DEFAULT_SETTINGS };
    if (!isPlainObject(stored)) return merged;
    const source = stored as Record<string, unknown>;
    const defaults = DEFAULT_SETTINGS as unknown as Record<string, unknown>;
    const target = merged as unknown as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
        const incoming = source[key];
        if (incoming === undefined) continue;
        const def = defaults[key];
        target[key] = isPlainObject(def) && isPlainObject(incoming)
            ? { ...def, ...incoming }
            : incoming;
    }
    return merged;
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
    backgroundVisible: true,
    showMiniPlayer: true,
    capsuleOnPlayOnly: true,
    playbackMode: 'loop',
    cacheQuotaMB: 1024,
    lruAutoClean: true,
    nativeTakeover: 'all',

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
    agentToolsEnabled: false,
};
