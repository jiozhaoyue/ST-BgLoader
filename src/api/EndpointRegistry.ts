/**
 * EndpointRegistry — 对外端点的唯一登记源（design §3）。
 *
 * 三处消费：
 *  1. PostMessageBridge：method 白名单（不在此表 = UnknownMethod，杜绝内部方法外泄）；
 *  2. PublicAPI.listMethods()：发现接口返回体；
 *  3. dev-harness API 自检：对照 PublicAPI 实际方法名，防登记表与实现漂移。
 *
 * 纪律：新增公开方法必须同 PR 在此登记；`on/off/emit`（总线管理）与下划线内部方法
 * 永不登记——跨 iframe 的事件订阅走桥的事件推送（见 PostMessageBridge）。
 */

export const API_VERSION = 2;

export type EndpointCategory =
    | 'discovery'
    | 'background'
    | 'audio'
    | 'effects'
    | 'scenes'
    | 'triggers'
    | 'media'
    | 'playlist'
    | 'settings'
    | 'cache'
    | 'visualizer'
    | 'state';

export interface EndpointMeta {
    method: string;
    category: EndpointCategory;
    async: boolean;
}

export const ENDPOINTS: readonly EndpointMeta[] = [
    // --- discovery ---
    { method: 'getApiVersion', category: 'discovery', async: false },
    { method: 'getCapabilities', category: 'discovery', async: false },
    { method: 'listMethods', category: 'discovery', async: false },
    // --- background ---
    { method: 'setBackground', category: 'background', async: true },
    { method: 'clearBackground', category: 'background', async: false },
    { method: 'setBackgroundVisible', category: 'background', async: false },
    { method: 'isBackgroundVisible', category: 'background', async: false },
    // --- audio ---
    { method: 'playBGM', category: 'audio', async: true },
    { method: 'stopBGM', category: 'audio', async: false },
    { method: 'togglePlay', category: 'audio', async: false },
    { method: 'nextTrack', category: 'audio', async: false },
    { method: 'prevTrack', category: 'audio', async: false },
    { method: 'setVolume', category: 'audio', async: false },
    { method: 'setMuted', category: 'audio', async: false },
    { method: 'setMuffled', category: 'audio', async: false },
    { method: 'getMuffled', category: 'audio', async: false },
    // --- effects ---
    { method: 'setFilters', category: 'effects', async: false },
    { method: 'applyPreset', category: 'effects', async: false },
    { method: 'setInteractive', category: 'effects', async: false },
    { method: 'setWeather', category: 'effects', async: false },
    { method: 'getWeather', category: 'effects', async: false },
    { method: 'setVisualizer', category: 'effects', async: false },
    { method: 'getVisualizer', category: 'effects', async: false },
    { method: 'setParallax', category: 'effects', async: false },
    { method: 'setTransition', category: 'effects', async: false },
    { method: 'setAmbientSound', category: 'effects', async: false },
    { method: 'getAmbientSound', category: 'effects', async: false },
    { method: 'setFrostedChat', category: 'effects', async: false },
    { method: 'getFrostedChat', category: 'effects', async: false },
    { method: 'cycleWeather', category: 'effects', async: false },
    // --- scenes ---
    { method: 'applyScene', category: 'scenes', async: false },
    { method: 'saveCurrentScene', category: 'scenes', async: false },
    { method: 'getScenes', category: 'scenes', async: false },
    { method: 'deleteScene', category: 'scenes', async: false },
    // --- triggers ---
    { method: 'addTriggerRule', category: 'triggers', async: false },
    { method: 'removeTriggerRule', category: 'triggers', async: false },
    { method: 'getTriggerRules', category: 'triggers', async: false },
    // --- media ---
    { method: 'getMediaList', category: 'media', async: true },
    { method: 'uploadMedia', category: 'media', async: true },
    { method: 'deleteMedia', category: 'media', async: true },
    { method: 'getMediaInfo', category: 'media', async: true },
    { method: 'getMediaUrl', category: 'media', async: true },
    { method: 'getActiveMedia', category: 'media', async: true },
    { method: 'preloadMedia', category: 'media', async: true },
    // --- background（补充：程序化开合顶栏抽屉） ---
    { method: 'showTopbarDrawer', category: 'background', async: false },
    // --- playlist ---
    { method: 'getPlaylist', category: 'playlist', async: false },
    { method: 'setPlaybackMode', category: 'playlist', async: false },
    { method: 'jumpToTrack', category: 'playlist', async: true },
    // --- settings ---
    { method: 'getSettings', category: 'settings', async: false },
    { method: 'updateSettings', category: 'settings', async: false },
    { method: 'exportSettings', category: 'settings', async: false },
    { method: 'importSettings', category: 'settings', async: false },
    { method: 'setMasterEnabled', category: 'settings', async: false },
    { method: 'isEnabled', category: 'settings', async: false },
    // --- cache ---
    { method: 'getCacheStats', category: 'cache', async: true },
    { method: 'clearCache', category: 'cache', async: true },
    // --- visualizer ---
    { method: 'getVisualizerData', category: 'visualizer', async: false },
    // --- state ---
    { method: 'getPlaybackState', category: 'state', async: false },
] as const;

const ENDPOINT_SET: ReadonlySet<string> = new Set(ENDPOINTS.map(e => e.method));

/** 全部白名单方法名（listMethods() 返回体；harness 用它对照 PublicAPI 实现防漂移）。 */
export const ENDPOINT_METHODS: readonly string[] = ENDPOINTS.map(e => e.method);

/** 桥白名单判定：仅此表内的方法可被 postMessage 调用。 */
export function isWhitelisted(method: unknown): method is string {
    return typeof method === 'string' && ENDPOINT_SET.has(method);
}

/** 分类聚合（getCapabilities 用）。 */
export function getEndpointCategories(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const e of ENDPOINTS) {
        (out[e.category] ??= []).push(e.method);
    }
    return out;
}
