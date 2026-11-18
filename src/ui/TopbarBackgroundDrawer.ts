import {
    BgLoaderSettings,
    BUILTIN_PRESETS,
    BUILTIN_SCENES,
    FilterPreset,
    MediaItem,
    MediaType,
    mergeSettings,
    PlaybackMode,
    SceneSnapshot,
    TransitionType,
    TriggerRule,
    VisualizerMode,
    VisualizerOptions,
    WeatherOptions,
    WeatherType,
    WEATHER_LABELS,
    WEATHER_TYPES,
    AmbientSoundOptions,
    AmbientSoundType,
} from '../types';
import { CacheManager } from '../cache/CacheManager';
import { AuthorityBridge } from '../backend/AuthorityBridge';
import { HostBridge } from '../bridge/HostBridge';
import { escapeHtml } from '../core/sanitize';
import { detectMediaType } from '../core/mediaType';
import { UIComponents } from './UIComponents';

export interface TopbarBackgroundDrawerCallbacks {
    onSettingsChanged: (settings: BgLoaderSettings) => void;
    onMediaSelected: (item: MediaItem) => void;
    onMediaDeleted: (id: string) => void;
    onMediaUploaded: (item: MediaItem) => void;
    getBackgroundVisible?: () => boolean;
    onBackgroundVisibilityChanged?: (visible: boolean) => void;
    onClearActiveBackground?: () => void;
    onPresetChanged: (preset: FilterPreset) => void;
    onInteractiveChanged: (enabled: boolean) => void;
    onMiniPlayerToggle: (visible: boolean) => void;
    onCapsuleOnPlayToggle?: (enabled: boolean) => void;
    onPlaybackModeChanged: (mode: PlaybackMode) => void;
    onWeatherChanged?: (weather: WeatherOptions) => void;
    onVisualizerChanged?: (visualizer: VisualizerOptions) => void;
    onParallaxChanged?: (parallax: { enabled: boolean; intensity: number }) => void;
    onTransitionChanged?: (type: TransitionType, durationMs: number) => void;
    onMuffleChanged?: (muffled: boolean) => void;
    onAmbientSoundChanged?: (options: AmbientSoundOptions) => void;
    onFrostedChatChanged?: (options: { enabled: boolean; blur: number; opacity: number }) => void;
    onSceneApplied?: (sceneId: string) => void;
    /** F2 场景分享：导出当前用户场景信封（null = 无场景管理器）。 */
    onScenesExport?: () => unknown;
    /** F2 场景分享：语义合并导入；null = 信封非法。 */
    onScenesImport?: (payload: unknown) => { added: number; updated: number; skipped: number } | null;
}

const NATIVE_HIDDEN_CLASS = 'st-bg-native-hidden';

/**
 * TopbarBackgroundDrawer:
 * Mounts the enhancement panel inside the host's native `#Backgrounds` drawer
 * across 4 taverns (SillyTavern, Luker, PureTavern, TauriTavern).
 *
 * Native drawer contents stay visible and usable; takeover-style hiding was
 * retired 2026-11-19. The panel presents the unified Rich Media Library and
 * Detailed Settings tabs alongside the native content.
 */
export class TopbarBackgroundDrawer {
    private panel: HTMLElement | null = null;
    private hostDrawer: HTMLElement | null = null;
    private settings: BgLoaderSettings;
    private cacheManager: CacheManager;
    private callbacks: TopbarBackgroundDrawerCallbacks;
    private authority: AuthorityBridge | null;
    private activeTab: 'library' | 'settings' = 'library';
    private searchQuery: string = '';
    private typeFilter: string;
    private sortOrder: 'name' | 'time' | 'size';
    /** Pending DOM-wait observer between mount() and the host drawer appearing. */
    private mountObserver: MutationObserver | null = null;
    private searchDebounceTimer: number | null = null;
    /** 15s 挂载兜底定时（技术面复检 D：可清理，避免 unmount 后残留回掉） */
    private mountGiveUpTimer: number | null = null;
    /** Monotonic token for in-flight grid refreshes: only the newest run may write the grid. */
    private refreshGeneration = 0;
    /** Video first-frame thumbnails (itemId → dataURL), generated lazily per grid render. */
    private thumbCache = new Map<string, string>();
    private static readonly THUMB_CACHE_CAP = 64;
    private thumbInflight = new Map<string, Promise<string | null>>();
    /** 多选批量模式（会话内视图态）：批量删/顺换/随机换 */
    private multiSelectMode = false;
    private selectedIds = new Set<string>();
    /** 网格懒挂载观察器：卡片进入视口 200px 前瞻带才 hydrate 预览 */
    private gridObserver: IntersectionObserver | null = null;
    /** 最近一次网格构建的可见列表（懒抽帧按 id 回查 item 用） */
    private lastGridItems: MediaItem[] | null = null;

    constructor(
        settings: BgLoaderSettings,
        cacheManager: CacheManager,
        callbacks: TopbarBackgroundDrawerCallbacks,
        authority?: AuthorityBridge | null
    ) {
        this.settings = settings;
        this.cacheManager = cacheManager;
        this.callbacks = callbacks;
        this.authority = authority ?? null;
        // View state persists in settings (libraryView); defensive fallbacks for callers that
        // hand us an unmerged object (older builds, tests).
        this.sortOrder = this.settings.libraryView?.sortOrder ?? 'name';
        // 旧值 'html' 归一为 'doc'（分段胶囊把 html/svg 合并为「文档」段）
        const storedType = this.settings.libraryView?.typeFilter ?? 'all';
        this.typeFilter = storedType === 'html' ? 'doc' : storedType;
    }

    public applyRemoteSettings(next: BgLoaderSettings): void {
        this.settings = next;
        this.sortOrder = next.libraryView?.sortOrder ?? this.sortOrder;
        const remoteType = next.libraryView?.typeFilter ?? this.typeFilter;
        this.typeFilter = remoteType === 'html' ? 'doc' : remoteType;
        if (this.panel) {
            this.syncFormControls();
        }
    }

    public syncBackgroundVisible(visible: boolean): void {
        const btn = this.panel?.querySelector('#st_topbar_bg_vis_btn') as HTMLButtonElement | null;
        if (btn) {
            btn.innerHTML = `<i class="fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'}"></i>`;
            btn.title = visible ? '隐藏' : '显示';
        }
        const check = this.panel?.querySelector('#st_bg_visible_topbar') as HTMLInputElement | null;
        if (check) check.checked = visible;
    }

    /** Mounts the takeover panel into the host's #Backgrounds drawer */
    public mount(): void {
        const hostBridge = HostBridge.getInstance();
        this.hostDrawer = hostBridge.getBackgroundDrawer();

        if (!this.hostDrawer) {
            // Wait for DOM if not ready yet. One pending observer at a time: repeated mount()
            // calls (init + master re-enable) must not stack observers on document.body.
            if (this.mountObserver) return;
            const observer = new MutationObserver(() => {
                const drawer = hostBridge.getBackgroundDrawer();
                if (drawer) {
                    this.dropMountObserver();
                    this.hostDrawer = drawer;
                    this.mount();
                }
            });
            this.mountObserver = observer;
            observer.observe(document.body, { childList: true, subtree: true });
            // 技术面复检 D：兜底定时存字段，dropMountObserver/unmount 时可撤销
            this.mountGiveUpTimer = window.setTimeout(() => this.dropMountObserver(), 15000);
            return;
        }

        // 增强式内嵌（问答定案 2026-11-19）：原生抽屉内容完全保留可见可用
        // （原生上传/文件夹/多选/锁定全部保留），本面板挂载其后作为增强层。
        // 替换式接管（display:none 全灭原生）废止；NATIVE_HIDDEN_CLASS 仅保留给
        // unmount 的对称清理路径（升级瞬间摘除旧类，避免残留隐藏态）。

        // Remove existing panel if any
        const existing = this.hostDrawer.querySelector('#st_bgloader_topbar_panel');
        if (existing) existing.remove();

        this.panel = document.createElement('div');
        this.panel.id = 'st_bgloader_topbar_panel';
        this.panel.className = 'st-bgloader-topbar-panel';

        this.renderPanel();
        this.hostDrawer.appendChild(this.panel);

        this.bindEvents();
        void this.refreshMediaGrid();
        void this.updateCacheStats();
        this.updateCloudPanel();
    }

    /** Restores the host drawer to its native state */
    public unmount(): void {
        // Also cancel the pending DOM-wait: after a master disable, a later observer tick
        // would otherwise re-run mount() and bring the panel back from the dead.
        this.dropMountObserver();
        // 技术面复检 D：撤销未决搜索防抖，避免卸载后刷新已移除的面板
        if (this.searchDebounceTimer !== null) {
            window.clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = null;
        }
        this.gridObserver?.disconnect();
        this.gridObserver = null;
        this.lastGridItems = null;
        this.multiSelectMode = false;
        this.selectedIds.clear();
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        if (this.hostDrawer) {
            Array.from(this.hostDrawer.children).forEach((child) => {
                child.classList.remove(NATIVE_HIDDEN_CLASS);
            });
        }
    }

    private dropMountObserver(): void {
        // 技术面复检 D：同时撤销 15s 兜底，避免卸载后残留定时回掉
        if (this.mountGiveUpTimer !== null) {
            window.clearTimeout(this.mountGiveUpTimer);
            this.mountGiveUpTimer = null;
        }
        this.mountObserver?.disconnect();
        this.mountObserver = null;
    }

    /** Fire-and-forget async callback with a tagged rejection log (never an unhandled rejection). */
    private reportMediaAction(action: Promise<void> | void, label: string): void {
        Promise.resolve(action).catch((err) => console.error(`[ST-BgLoader] ${label}:`, err));
    }

    private renderPanel(): void {
        if (!this.panel) return;

        const backgroundVisible = this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? true;

        this.panel.innerHTML = `
            <div class="st-bgloader-topbar-header">
                <div class="st-bgloader-tab-bar">
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === 'library' ? 'active' : ''}" data-tab="library">
                        <i class="fa-solid fa-photo-film"></i> 媒体
                    </button>
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
                        <i class="fa-solid fa-sliders"></i> 设置
                    </button>
                </div>
                <div class="st-bgloader-topbar-actions">
                    <select id="st_topbar_scene_quick" class="st-bgloader-scene-quick" title="场景快切"></select>
                    <button type="button" id="st_topbar_bg_vis_btn" class="menu_button menu_button_icon" title="${backgroundVisible ? '隐藏' : '显示'}">
                        <i class="fa-solid ${backgroundVisible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button type="button" id="st_topbar_bg_clear_btn" class="menu_button menu_button_icon" title="清除">
                        <i class="fa-solid fa-ban"></i>
                    </button>
                    <button type="button" id="st_topbar_drawer_close" class="menu_button menu_button_icon" title="收起">
                        <i class="fa-solid fa-chevron-up"></i>
                    </button>
                </div>
            </div>

            <div class="st-bgloader-topbar-body">
                <!-- Tab 1: Library -->
                <div id="st_tab_library" class="st-bgloader-tab-content ${this.activeTab === 'library' ? 'active' : ''}">
                    <div class="st-bgloader-toolbar-row">
                        <div class="st-bgloader-search-wrap">
                            <input type="search" id="st_topbar_search" class="text_pole" placeholder="搜索..." value="${escapeHtml(this.searchQuery)}" />
                        </div>
                        ${UIComponents.renderSegmented({
                            id: 'st_topbar_type_seg',
                            options: [
                                { value: 'all', label: '全部', icon: 'fa-border-all', selected: this.typeFilter === 'all' },
                                { value: 'image', label: '图', icon: 'fa-image', selected: this.typeFilter === 'image' },
                                { value: 'video', label: '视频', icon: 'fa-film', selected: this.typeFilter === 'video' },
                                { value: 'audio', label: '音频', icon: 'fa-music', selected: this.typeFilter === 'audio' },
                                { value: 'doc', label: '文档', icon: 'fa-file-code', selected: this.typeFilter === 'doc' },
                            ],
                        })}
                        ${UIComponents.renderSelect({
                            id: 'st_topbar_sort',
                            label: '',
                            compact: true,
                            title: '排序',
                            options: [
                                { value: 'name', label: '名称', selected: this.sortOrder === 'name' },
                                { value: 'time', label: '时间', selected: this.sortOrder === 'time' },
                                { value: 'size', label: '大小', selected: this.sortOrder === 'size' },
                            ],
                        })}
                        ${UIComponents.renderButton({ id: 'st_topbar_upload_toggle_btn', icon: 'fa-cloud-arrow-up', label: '导入', title: '导入' })}
                        ${UIComponents.renderButton({ id: 'st_topbar_multiselect_btn', className: 'menu_button_icon', icon: 'fa-list-check', title: '多选' })}
                    </div>

                    <!-- Collapsible Upload Box -->
                    <div id="st_topbar_upload_box" class="st-bgloader-upload-box" style="display: none;">
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone" tabindex="0" role="button" aria-label="导入文件">
                            <i class="fa-solid fa-file-video fa-2x"></i>
                            <div>点击或拖拽文件导入</div>
                            <input type="file" id="st_bgloader_file_input" class="st-bgloader-hidden" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" class="text_pole" placeholder="媒体 URL..." />
                            ${UIComponents.renderButton({ id: 'st_bgloader_url_btn', label: '导入' })}
                        </div>
                    </div>

                    <!-- 多选操作条（进入多选态才显示） -->
                    <div id="st_bgloader_multiselect_bar" class="st-bgloader-multiselect-bar" hidden>
                        <span id="st_multiselect_count" class="st-bgloader-dim-text">已选 0</span>
                        ${UIComponents.renderButton({ id: 'st_multiselect_delete_btn', variant: 'danger', icon: 'fa-trash', label: '批量删' })}
                        ${UIComponents.renderButton({ id: 'st_multiselect_first_btn', icon: 'fa-play', label: '顺换', title: '应用首个选中' })}
                        ${UIComponents.renderButton({ id: 'st_multiselect_random_btn', icon: 'fa-shuffle', label: '随机换', title: '随机应用一张' })}
                        ${UIComponents.renderButton({ id: 'st_multiselect_exit_btn', label: '退出' })}
                    </div>

                    <!-- 场景条：场景入媒体 Tab（顶栏为快切，此处为管理） -->
                    <div class="st-bgloader-toolbar-row">
                        <div class="st-bgloader-scene-bar">
                            <select id="st_scene_select" class="text_pole" title="场景"></select>
                            ${UIComponents.renderButton({ id: 'st_scene_apply_btn', className: 'menu_button_icon', icon: 'fa-play', title: '应用' })}
                            ${UIComponents.renderButton({ id: 'st_scene_save_btn', className: 'menu_button_icon', icon: 'fa-floppy-disk', title: '保存' })}
                            ${UIComponents.renderButton({ id: 'st_scene_del_btn', variant: 'danger', className: 'menu_button_icon', icon: 'fa-trash', title: '删除' })}
                            ${UIComponents.renderButton({ id: 'st_scene_export_btn', className: 'menu_button_icon', icon: 'fa-file-arrow-down', title: '导出' })}
                            <label for="st_scene_import_file" class="menu_button menu_button_icon" title="导入">
                                <i class="fa-solid fa-file-arrow-up"></i>
                                <input type="file" id="st_scene_import_file" class="st-bgloader-hidden" accept=".json" />
                            </label>
                        </div>
                    </div>

                    <!-- Media Grid -->
                    <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                        <div class="st-bgloader-grid-loading"><i class="fa-solid fa-spinner fa-spin"></i> 加载中...</div>
                    </div>
                </div>

                <!-- Tab 2: Settings —— 五组折叠（画面/氛围/声音/自动化/系统），开闭状态记忆 -->
                <div id="st_tab_settings" class="st-bgloader-tab-content ${this.activeTab === 'settings' ? 'active' : ''}">
                    ${UIComponents.renderGroup({
                        id: 'st_group_visual',
                        title: '画面',
                        icon: 'fa-image',
                        open: true,
                        contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-sliders"></i>滤镜</div>
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-sm">预设:</label>
                                <select id="st_preset_select" class="text_pole"></select>
                                ${UIComponents.renderButton({ id: 'st_preset_save_btn', className: 'menu_button_icon', icon: 'fa-floppy-disk', title: '保存' })}
                                ${UIComponents.renderButton({ id: 'st_preset_del_btn', variant: 'danger', className: 'menu_button_icon', icon: 'fa-trash', title: '删除' })}
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_filter_blur', valId: 'st_filter_blur_val', label: '模糊', min: 0, max: 20, step: 1, value: this.settings.filters.blur, unit: 'px' })}
                            ${UIComponents.renderSlider({ id: 'st_filter_brightness', valId: 'st_filter_brightness_val', label: '亮度', min: 0, max: 200, step: 5, value: this.settings.filters.brightness, unit: '%' })}
                            ${UIComponents.renderSlider({ id: 'st_filter_opacity', valId: 'st_filter_opacity_val', label: '不透明', min: 0, max: 100, step: 5, value: this.settings.filters.opacity, unit: '%' })}
                            ${UIComponents.renderSlider({ id: 'st_filter_saturate', valId: 'st_filter_saturate_val', label: '饱和度', min: 0, max: 200, step: 5, value: this.settings.filters.saturate, unit: '%' })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_bg_interactive', label: '背景交互', checked: this.settings.interactiveBackground })}
                            </div>
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-eye"></i>毛玻璃</div>
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_frosted_enabled', label: '启用', checked: this.settings.frostedChat.enabled })}
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_frosted_blur', valId: 'st_frosted_blur_val', label: '模糊', min: 0, max: 25, step: 1, value: this.settings.frostedChat.blur, unit: 'px' })}
                            ${UIComponents.renderSlider({ id: 'st_frosted_opacity', valId: 'st_frosted_opacity_val', label: '不透明', min: 20, max: 100, step: 5, value: this.settings.frostedChat.opacity, unit: '%' })}
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-wand-magic-sparkles"></i>转场</div>
                            ${UIComponents.renderSelect({
                                id: 'st_transition_effect',
                                label: '效果',
                                options: [
                                    { value: 'fade', label: '淡入', selected: this.settings.transitionEffect === 'fade' },
                                    { value: 'zoom_fade', label: '缩放', selected: this.settings.transitionEffect === 'zoom_fade' },
                                    { value: 'blur_fade', label: '柔焦', selected: this.settings.transitionEffect === 'blur_fade' },
                                    { value: 'slide_left', label: '左移', selected: this.settings.transitionEffect === 'slide_left' },
                                    { value: 'slide_right', label: '右移', selected: this.settings.transitionEffect === 'slide_right' },
                                ],
                            })}
                            ${UIComponents.renderSlider({ id: 'st_transition_dur', valId: 'st_transition_dur_val', label: '时长', min: 200, max: 1500, step: 50, value: this.settings.transitionDurationMs, unit: 'ms' })}
                        `,
                    })}

                    ${UIComponents.renderGroup({
                        id: 'st_group_atmosphere',
                        title: '氛围',
                        icon: 'fa-cloud-sun-rain',
                        contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-cloud-sun-rain"></i>天气</div>
                            ${UIComponents.renderSelect({
                                id: 'st_weather_type',
                                label: '天气',
                                options: WEATHER_TYPES.map((t) => ({ value: t, label: WEATHER_LABELS[t], selected: this.settings.weather.type === t })),
                            })}
                            ${UIComponents.renderSelect({
                                id: 'st_weather_density',
                                label: '密度',
                                options: [
                                    { value: 'low', label: '稀疏', selected: this.settings.weather.density === 'low' },
                                    { value: 'medium', label: '适中', selected: this.settings.weather.density === 'medium' },
                                    { value: 'high', label: '密集', selected: this.settings.weather.density === 'high' },
                                ],
                            })}
                            ${UIComponents.renderSlider({ id: 'st_weather_speed', valId: 'st_weather_speed_val', label: '速度', min: 5, max: 25, step: 1, value: Math.round(this.settings.weather.speed * 10), unit: 'x' })}
                            ${UIComponents.renderSlider({ id: 'st_weather_opacity', valId: 'st_weather_opacity_val', label: '不透明', min: 10, max: 100, step: 5, value: Math.round(this.settings.weather.opacity * 100), unit: '%' })}
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-chart-simple"></i>动效</div>
                            ${UIComponents.renderSelect({
                                id: 'st_visualizer_mode',
                                label: '律动',
                                options: [
                                    { value: 'off', label: '关闭', selected: this.settings.visualizer.mode === 'off' },
                                    { value: 'pulse', label: '呼吸', selected: this.settings.visualizer.mode === 'pulse' },
                                    { value: 'spectrum', label: '频谱', selected: this.settings.visualizer.mode === 'spectrum' },
                                ],
                            })}
                            ${UIComponents.renderSlider({ id: 'st_visualizer_sens', valId: 'st_visualizer_sens_val', label: '灵敏度', min: 5, max: 25, step: 1, value: Math.round(this.settings.visualizer.sensitivity * 10), unit: 'x' })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_parallax_enabled', label: '景深视差', checked: this.settings.parallax.enabled })}
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_parallax_intensity', valId: 'st_parallax_intensity_val', label: '深度', min: 1, max: 10, step: 1, value: Math.round(this.settings.parallax.intensity * 10), unit: '' })}
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-fire"></i>音效</div>
                            ${UIComponents.renderSelect({
                                id: 'st_ambient_type',
                                label: '音效',
                                options: [
                                    { value: 'off', label: '关闭', selected: this.settings.ambientSound.type === 'off' },
                                    { value: 'rain', label: '雨声', selected: this.settings.ambientSound.type === 'rain' },
                                    { value: 'fire', label: '壁炉', selected: this.settings.ambientSound.type === 'fire' },
                                    { value: 'wind', label: '风声', selected: this.settings.ambientSound.type === 'wind' },
                                ],
                            })}
                            ${UIComponents.renderSlider({ id: 'st_ambient_vol', valId: 'st_ambient_vol_val', label: '音量', min: 0, max: 100, step: 5, value: Math.round(this.settings.ambientSound.volume * 100), unit: '%' })}
                        `,
                    })}

                    ${UIComponents.renderGroup({
                        id: 'st_group_audio',
                        title: '声音',
                        icon: 'fa-volume-high',
                        contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-volume-high"></i>音乐</div>
                            ${UIComponents.renderSlider({ id: 'st_audio_volume', valId: 'st_audio_volume_val', label: '音量', min: 0, max: 100, step: 1, value: Math.round(this.settings.volume * 100), unit: '%' })}
                            ${UIComponents.renderSelect({
                                id: 'st_playback_mode',
                                label: '模式',
                                options: [
                                    { value: 'loop', label: '列表循环', selected: this.settings.playbackMode === 'loop' },
                                    { value: 'single', label: '单曲循环', selected: this.settings.playbackMode === 'single' },
                                    { value: 'shuffle', label: '随机播放', selected: this.settings.playbackMode === 'shuffle' },
                                ],
                            })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_audio_mute', label: '静音', checked: this.settings.muted })}
                                ${UIComponents.renderCheckbox({ id: 'st_audio_muffle', label: '沉浸低通', checked: this.settings.muffleBGM })}
                                ${UIComponents.renderCheckbox({ id: 'st_audio_blur', label: '后台暂停', checked: this.settings.pauseOnBlur })}
                                ${UIComponents.renderCheckbox({ id: 'st_mini_player_toggle', label: '悬浮胶囊', checked: this.settings.showMiniPlayer })}
                                ${UIComponents.renderCheckbox({ id: 'st_capsule_on_play', label: '播放时显示', checked: this.settings.capsuleOnPlayOnly, sub: true })}
                            </div>
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-rotate"></i>轮播</div>
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_bgm_auto_advance', label: '自动轮播', checked: this.settings.bgmAutoAdvance.enabled })}
                            </div>
                            <div class="st-bgloader-preset-row" id="st_bgm_auto_advance_row" ${this.settings.bgmAutoAdvance.enabled ? '' : 'style="display:none;"'}>
                                <label for="st_bgm_auto_advance_min">轮播间隔:</label>
                                <input type="number" id="st_bgm_auto_advance_min" class="text_pole" min="1" max="60" step="1" value="${Math.max(1, Math.round(this.settings.bgmAutoAdvance.intervalSec / 60))}" />
                                <label>分</label>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_bgm_auto_advance_fade', valId: 'st_bgm_auto_advance_fade_val', label: '淡入淡出', min: 0, max: 2000, step: 100, value: this.settings.bgmAutoAdvance.fadeMs, unit: ' ms' })}
                        `,
                    })}

                    ${UIComponents.renderGroup({
                        id: 'st_group_auto',
                        title: '自动化',
                        icon: 'fa-bolt',
                        contentHtml: `
                            <div class="st-bgloader-trigger-list" id="st_trigger_list"></div>
                            <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                                ${UIComponents.renderSelect({
                                    id: 'st_trigger_type',
                                    label: '类型',
                                    options: [
                                        { value: 'character', label: '角色' },
                                        { value: 'chat', label: '聊天' },
                                        { value: 'regex', label: '正则' },
                                    ],
                                })}
                                <div class="st-bgloader-preset-row">
                                    <label>规则:</label>
                                    <input type="text" id="st_trigger_name" class="text_pole" placeholder="名称" />
                                </div>
                                <div class="st-bgloader-preset-row">
                                    <label>匹配:</label>
                                    <input type="text" id="st_trigger_pattern" class="text_pole" placeholder="匹配文本" />
                                </div>
                                <div class="st-bgloader-btn-row">
                                    ${UIComponents.renderButton({ id: 'st_trigger_confirm_btn', icon: 'fa-check', label: '添加' })}
                                    ${UIComponents.renderButton({ id: 'st_trigger_cancel_btn', label: '取消' })}
                                </div>
                            </div>
                            ${UIComponents.renderButton({ id: 'st_trigger_add_btn', variant: 'full', icon: 'fa-plus', label: '添加' })}
                        `,
                    })}

                    ${UIComponents.renderGroup({
                        id: 'st_group_system',
                        title: '系统',
                        icon: 'fa-gear',
                        contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-file-export"></i>存储</div>
                            <div class="st-bgloader-row-between">
                                <div>已用: <strong id="st_cache_used">0 MB</strong> <span id="st_cache_count">0</span>项</div>
                                ${UIComponents.renderButton({ id: 'st_cache_clear_btn', variant: 'danger', label: '清空' })}
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_cache_quota', valId: 'st_cache_quota_val', label: '配额', min: 128, max: 8192, step: 128, value: this.settings.cacheQuotaMB, unit: ' MB' })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_cache_autoclean', label: '自动清理', checked: this.settings.lruAutoClean })}
                            </div>
                            <div class="st-bgloader-btn-row">
                                ${UIComponents.renderButton({ id: 'st_backup_export_btn', icon: 'fa-download', label: '导出' })}
                                <label for="st_backup_import_file" class="menu_button">
                                    <i class="fa-solid fa-upload"></i> 导入
                                    <input type="file" id="st_backup_import_file" class="st-bgloader-hidden" accept=".json" />
                                </label>
                            </div>
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-cloud"></i>云端</div>
                            <div id="st_authority_section" class="st-bgloader-cloud-note"></div>
                            <div id="st_cloud_status_text" class="st-bgloader-cloud-note"></div>
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_agent_tools_enable', label: 'Agent导演', checked: this.settings.agentToolsEnabled })}
                            </div>
                        `,
                    })}
                </div>
            </div>
        `;
    }

    private bindEvents(): void {
        if (!this.panel) return;

        // Tab Switching
        this.panel.querySelectorAll<HTMLButtonElement>('.st-bgloader-tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab as 'library' | 'settings';
                if (!tab) return;
                this.activeTab = tab;
                this.panel?.querySelectorAll('.st-bgloader-tab-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                this.panel?.querySelectorAll('.st-bgloader-tab-content').forEach((tc) => tc.classList.remove('active'));
                const targetContent = this.panel?.querySelector(`#st_tab_${tab}`);
                if (targetContent) targetContent.classList.add('active');
            });
        });

        // Topbar Quick Actions
        const visBtn = this.panel.querySelector('#st_topbar_bg_vis_btn') as HTMLButtonElement | null;
        visBtn?.addEventListener('click', () => {
            const current = this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? true;
            const next = !current;
            this.callbacks.onBackgroundVisibilityChanged?.(next);
            this.syncBackgroundVisible(next);
        });

        const clearBtn = this.panel.querySelector('#st_topbar_bg_clear_btn') as HTMLButtonElement | null;
        clearBtn?.addEventListener('click', () => {
            this.callbacks.onClearActiveBackground?.();
        });

        const closeBtn = this.panel.querySelector('#st_topbar_drawer_close') as HTMLButtonElement | null;
        closeBtn?.addEventListener('click', () => {
            HostBridge.getInstance().closeBackgroundDrawer();
        });

        // Search & Filter
        const searchInput = this.panel.querySelector('#st_topbar_search') as HTMLInputElement | null;
        searchInput?.addEventListener('input', () => {
            this.searchQuery = searchInput.value.trim().toLowerCase();
            // Debounced: once the catalog TTL expires, every keystroke would otherwise fire a
            // full POST /api/backgrounds/all. 250ms trailing is imperceptible for a grid filter.
            if (this.searchDebounceTimer !== null) {
                window.clearTimeout(this.searchDebounceTimer);
            }
            this.searchDebounceTimer = window.setTimeout(() => {
                this.searchDebounceTimer = null;
                void this.refreshMediaGrid();
            }, 250);
        });

        // 分段类型过滤（定案：分段胶囊）——html/svg 合并为「文档」段
        UIComponents.bindSegmented(this.panel, (value) => {
            this.typeFilter = value || 'all';
            // Persisted view state: the library opens with the same filter next session.
            if (!this.settings.libraryView) this.settings.libraryView = { sortOrder: this.sortOrder, typeFilter: 'all' };
            this.settings.libraryView.typeFilter = this.typeFilter;
            this.save();
            void this.refreshMediaGrid();
        });

        // 五组折叠 + 开闭状态记忆（视图态 localStorage，不进 settings）
        UIComponents.bindGroups(this.panel, {
            st_group_visual: true,
            st_group_atmosphere: false,
            st_group_audio: false,
            st_group_auto: false,
            st_group_system: false,
        });

        // 多选批量模式
        const multiBtn = this.panel.querySelector('#st_topbar_multiselect_btn') as HTMLButtonElement | null;
        multiBtn?.addEventListener('click', () => this.setMultiSelectMode(!this.multiSelectMode));
        this.panel.querySelector('#st_multiselect_delete_btn')?.addEventListener('click', () => { void this.bulkDeleteSelected(); });
        this.panel.querySelector('#st_multiselect_first_btn')?.addEventListener('click', () => { void this.applyFirstSelected(); });
        this.panel.querySelector('#st_multiselect_random_btn')?.addEventListener('click', () => { void this.applyRandomSelected(); });
        this.panel.querySelector('#st_multiselect_exit_btn')?.addEventListener('click', () => this.setMultiSelectMode(false));

        // 顶栏场景快切：选中即应用
        const quickScene = this.panel.querySelector('#st_topbar_scene_quick') as HTMLSelectElement | null;
        quickScene?.addEventListener('change', () => {
            if (quickScene.value) this.callbacks.onSceneApplied?.(quickScene.value);
        });

        const sortSelect = this.panel.querySelector('#st_topbar_sort') as HTMLSelectElement | null;
        sortSelect?.addEventListener('change', () => {
            this.sortOrder = (sortSelect.value as 'name' | 'time' | 'size') || 'name';
            if (!this.settings.libraryView) this.settings.libraryView = { sortOrder: 'name', typeFilter: this.typeFilter };
            this.settings.libraryView.sortOrder = this.sortOrder;
            this.save();
            void this.refreshMediaGrid();
        });

        // Upload toggle
        const uploadToggleBtn = this.panel.querySelector('#st_topbar_upload_toggle_btn') as HTMLButtonElement | null;
        const uploadBox = this.panel.querySelector('#st_topbar_upload_box') as HTMLElement | null;
        uploadToggleBtn?.addEventListener('click', () => {
            if (!uploadBox) return;
            const isHidden = uploadBox.style.display === 'none';
            uploadBox.style.display = isHidden ? 'block' : 'none';
            uploadToggleBtn.classList.toggle('active', isHidden);
        });

        // Drag and drop upload
        const dropzone = this.panel.querySelector('#st_bgloader_dropzone');
        const fileInput = this.panel.querySelector('#st_bgloader_file_input') as HTMLInputElement | null;

        dropzone?.addEventListener('click', () => fileInput?.click());
        // 键盘可达（a11y 定案）：dropzone 可聚焦，Enter/Space 触发文件选择
        dropzone?.addEventListener('keydown', (e) => {
            const key = (e as KeyboardEvent).key;
            if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                fileInput?.click();
            }
        });
        dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const files = (e as DragEvent).dataTransfer?.files;
            if (files && files.length > 0) {
                void this.handleFileUpload(files[0]);
            }
        });

        fileInput?.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                void this.handleFileUpload(fileInput.files[0]);
            }
        });

        // URL import
        const urlBtn = this.panel.querySelector('#st_bgloader_url_btn');
        const urlInput = this.panel.querySelector('#st_bgloader_url_input') as HTMLInputElement | null;
        urlBtn?.addEventListener('click', () => {
            const url = urlInput?.value.trim();
            if (url) {
                void this.handleUrlImport(url);
                if (urlInput) urlInput.value = '';
            }
        });

        // Wire Detailed Settings
        this.bindSettingsFormEvents();
    }

    private bindSettingsFormEvents(): void {
        if (!this.panel) return;

        // Sliders with rAF Throttling
        const bindSlider = (id: string, valId: string, suffix: string, onChange: (v: number) => void) => {
            if (!this.panel) return;
            UIComponents.bindRafSlider(this.panel, id, valId, suffix, onChange);
        };

        bindSlider('st_filter_blur', 'st_filter_blur_val', 'px', (val) => {
            this.settings.filters.blur = val;
            this.callbacks.onPresetChanged({ id: 'custom', name: 'Custom', filters: this.settings.filters });
            this.save();
        });
        bindSlider('st_filter_brightness', 'st_filter_brightness_val', '%', (val) => {
            this.settings.filters.brightness = val;
            this.callbacks.onPresetChanged({ id: 'custom', name: 'Custom', filters: this.settings.filters });
            this.save();
        });
        bindSlider('st_filter_opacity', 'st_filter_opacity_val', '%', (val) => {
            this.settings.filters.opacity = val;
            this.callbacks.onPresetChanged({ id: 'custom', name: 'Custom', filters: this.settings.filters });
            this.save();
        });
        bindSlider('st_filter_saturate', 'st_filter_saturate_val', '%', (val) => {
            this.settings.filters.saturate = val;
            this.callbacks.onPresetChanged({ id: 'custom', name: 'Custom', filters: this.settings.filters });
            this.save();
        });

        // Interactive
        const interactiveCb = this.panel.querySelector('#st_bg_interactive') as HTMLInputElement | null;
        interactiveCb?.addEventListener('change', () => {
            this.settings.interactiveBackground = interactiveCb.checked;
            this.callbacks.onInteractiveChanged(interactiveCb.checked);
            this.save();
        });

        // Weather
        const weatherType = this.panel.querySelector('#st_weather_type') as HTMLSelectElement | null;
        const weatherDensity = this.panel.querySelector('#st_weather_density') as HTMLSelectElement | null;
        const updateWeather = () => {
            if (weatherType) this.settings.weather.type = weatherType.value as WeatherType;
            if (weatherDensity) this.settings.weather.density = weatherDensity.value as WeatherOptions['density'];
            this.callbacks.onWeatherChanged?.(this.settings.weather);
            this.save();
        };
        weatherType?.addEventListener('change', updateWeather);
        weatherDensity?.addEventListener('change', updateWeather);

        bindSlider('st_weather_speed', 'st_weather_speed_val', 'x', (val) => {
            this.settings.weather.speed = val / 10;
            this.callbacks.onWeatherChanged?.(this.settings.weather);
            this.save();
        });
        bindSlider('st_weather_opacity', 'st_weather_opacity_val', '%', (val) => {
            this.settings.weather.opacity = val / 100;
            this.callbacks.onWeatherChanged?.(this.settings.weather);
            this.save();
        });

        // Visualizer & Parallax
        const visMode = this.panel.querySelector('#st_visualizer_mode') as HTMLSelectElement | null;
        visMode?.addEventListener('change', () => {
            this.settings.visualizer.mode = visMode.value as VisualizerMode;
            this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
            this.save();
        });
        bindSlider('st_visualizer_sens', 'st_visualizer_sens_val', 'x', (val) => {
            this.settings.visualizer.sensitivity = val / 10;
            this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
            this.save();
        });

        const parallaxCb = this.panel.querySelector('#st_parallax_enabled') as HTMLInputElement | null;
        parallaxCb?.addEventListener('change', () => {
            this.settings.parallax.enabled = parallaxCb.checked;
            this.callbacks.onParallaxChanged?.(this.settings.parallax);
            this.save();
        });
        bindSlider('st_parallax_intensity', 'st_parallax_intensity_val', '', (val) => {
            this.settings.parallax.intensity = val / 10;
            this.callbacks.onParallaxChanged?.(this.settings.parallax);
            this.save();
        });

        // Ambient Sound
        const ambientType = this.panel.querySelector('#st_ambient_type') as HTMLSelectElement | null;
        ambientType?.addEventListener('change', () => {
            this.settings.ambientSound.type = ambientType.value as AmbientSoundType;
            this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
            this.save();
        });
        bindSlider('st_ambient_vol', 'st_ambient_vol_val', '%', (val) => {
            this.settings.ambientSound.volume = val / 100;
            this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
            this.save();
        });

        // Frosted Chat
        const frostedCb = this.panel.querySelector('#st_frosted_enabled') as HTMLInputElement | null;
        frostedCb?.addEventListener('change', () => {
            this.settings.frostedChat.enabled = frostedCb.checked;
            this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
            this.save();
        });
        bindSlider('st_frosted_blur', 'st_frosted_blur_val', 'px', (val) => {
            this.settings.frostedChat.blur = val;
            this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
            this.save();
        });
        bindSlider('st_frosted_opacity', 'st_frosted_opacity_val', '%', (val) => {
            this.settings.frostedChat.opacity = val;
            this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
            this.save();
        });

        // Transitions
        const transSelect = this.panel.querySelector('#st_transition_effect') as HTMLSelectElement | null;
        transSelect?.addEventListener('change', () => {
            this.settings.transitionEffect = transSelect.value as TransitionType;
            this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
            this.save();
        });
        bindSlider('st_transition_dur', 'st_transition_dur_val', 'ms', (val) => {
            this.settings.transitionDurationMs = val;
            this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
            this.save();
        });

        // Audio & BGM
        bindSlider('st_audio_volume', 'st_audio_volume_val', '%', (val) => {
            this.settings.volume = val / 100;
            this.save();
        });
        const playModeSelect = this.panel.querySelector('#st_playback_mode') as HTMLSelectElement | null;
        playModeSelect?.addEventListener('change', () => {
            this.settings.playbackMode = playModeSelect.value as PlaybackMode;
            this.callbacks.onPlaybackModeChanged(this.settings.playbackMode);
            this.save();
        });

        const muteCb = this.panel.querySelector('#st_audio_mute') as HTMLInputElement | null;
        muteCb?.addEventListener('change', () => {
            this.settings.muted = muteCb.checked;
            this.save();
        });

        const muffleCb = this.panel.querySelector('#st_audio_muffle') as HTMLInputElement | null;
        muffleCb?.addEventListener('change', () => {
            this.settings.muffleBGM = muffleCb.checked;
            this.callbacks.onMuffleChanged?.(muffleCb.checked);
            this.save();
        });

        // BGM 自动轮播（F1）：开关控制间隔行的显隐；间隔以分钟输入、秒存储；淡入淡出走滑条。
        const autoAdvanceCb = this.panel.querySelector('#st_bgm_auto_advance') as HTMLInputElement | null;
        autoAdvanceCb?.addEventListener('change', () => {
            this.settings.bgmAutoAdvance.enabled = autoAdvanceCb.checked;
            const row = this.panel?.querySelector('#st_bgm_auto_advance_row') as HTMLElement | null;
            if (row) row.style.display = autoAdvanceCb.checked ? '' : 'none';
            this.save();
        });
        const autoAdvanceMin = this.panel.querySelector('#st_bgm_auto_advance_min') as HTMLInputElement | null;
        autoAdvanceMin?.addEventListener('change', () => {
            const minutes = Math.max(1, Math.min(60, Math.floor(Number(autoAdvanceMin.value) || 1)));
            autoAdvanceMin.value = String(minutes);
            this.settings.bgmAutoAdvance.intervalSec = minutes * 60;
            this.save();
        });
        bindSlider('st_bgm_auto_advance_fade', 'st_bgm_auto_advance_fade_val', ' ms', (val) => {
            this.settings.bgmAutoAdvance.fadeMs = val;
            this.save();
        });

        const blurCb = this.panel.querySelector('#st_audio_blur') as HTMLInputElement | null;
        blurCb?.addEventListener('change', () => {
            this.settings.pauseOnBlur = blurCb.checked;
            this.save();
        });

        const miniPlayerCb = this.panel.querySelector('#st_mini_player_toggle') as HTMLInputElement | null;
        miniPlayerCb?.addEventListener('change', () => {
            this.settings.showMiniPlayer = miniPlayerCb.checked;
            this.callbacks.onMiniPlayerToggle(miniPlayerCb.checked);
            this.save();
        });

        const capsuleOnPlayCb = this.panel.querySelector('#st_capsule_on_play') as HTMLInputElement | null;
        capsuleOnPlayCb?.addEventListener('change', () => {
            this.settings.capsuleOnPlayOnly = capsuleOnPlayCb.checked;
            this.callbacks.onCapsuleOnPlayToggle?.(capsuleOnPlayCb.checked);
            this.save();
        });

        // Cache quota & autoclean
        bindSlider('st_cache_quota', 'st_cache_quota_val', ' MB', (val) => {
            this.settings.cacheQuotaMB = val;
            this.save();
        });
        const autoCleanCb = this.panel.querySelector('#st_cache_autoclean') as HTMLInputElement | null;
        autoCleanCb?.addEventListener('change', () => {
            this.settings.lruAutoClean = autoCleanCb.checked;
            this.save();
        });
        const clearCacheBtn = this.panel.querySelector('#st_cache_clear_btn');
        clearCacheBtn?.addEventListener('click', async () => {
            await this.cacheManager.clearAll();
            void this.updateCacheStats();
            void this.refreshMediaGrid();
        });

        // Export/Import backup
        const exportBtn = this.panel.querySelector('#st_backup_export_btn');
        exportBtn?.addEventListener('click', () => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.settings, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `st-bgloader-backup-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });

        const importInput = this.panel.querySelector('#st_backup_import_file') as HTMLInputElement | null;
        importInput?.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string);
                    // mergeSettings, not a shallow spread: a partial backup (e.g. filters without
                    // `saturate`) would otherwise replace the nested object wholesale and later
                    // render `saturate(undefined%)` into the container's CSS filter.
                    this.settings = mergeSettings({ ...this.settings, ...parsed });
                    this.save();
                    this.syncFormControls();
                } catch (err) {
                    void HostBridge.getInstance().alertDialog('导入失败：不是有效的 JSON 配置文件');
                }
            };
            reader.readAsText(file);
        });

        // Presets & Scenes
        this.updatePresetSelect();
        this.updateSceneSelect();
        this.updateTriggersUI();
    }

    private save(): void {
        this.callbacks.onSettingsChanged(this.settings);
    }

    private syncFormControls(): void {
        if (!this.panel) return;
        this.updateFilterSliders();
        this.updateSettingsControls();
        this.updatePresetSelect();
        this.updateSceneSelect();
        this.updateTriggersUI();
        void this.updateCacheStats();
        this.updateCloudPanel();
    }

    private updateFilterSliders(): void {
        if (!this.panel) return;
        const setVal = (id: string, valId: string, v: number, suffix: string) => {
            const el = this.panel?.querySelector(`#${id}`) as HTMLInputElement | null;
            const lbl = this.panel?.querySelector(`#${valId}`);
            if (el) el.value = String(v);
            if (lbl) lbl.textContent = `${v}${suffix}`;
        };
        setVal('st_filter_blur', 'st_filter_blur_val', this.settings.filters.blur, 'px');
        setVal('st_filter_brightness', 'st_filter_brightness_val', this.settings.filters.brightness, '%');
        setVal('st_filter_opacity', 'st_filter_opacity_val', this.settings.filters.opacity, '%');
        setVal('st_filter_saturate', 'st_filter_saturate_val', this.settings.filters.saturate, '%');
    }

    /**
     * Backfills every settings-tab control from the (possibly remotely updated) settings
     * object: weather, visualizer, parallax, ambient, frosted glass, transition, audio,
     * cache quota and agent tools. Without this, a remote convergence left those form
     * controls showing stale values even though the subsystems had already applied them.
     */
    private updateSettingsControls(): void {
        if (!this.panel) return;
        const setSelect = (id: string, v: string) => {
            const el = this.panel?.querySelector(`#${id}`) as HTMLSelectElement | null;
            if (el) el.value = v;
        };
        const setVal = (id: string, valId: string, v: number, suffix: string) => {
            const el = this.panel?.querySelector(`#${id}`) as HTMLInputElement | null;
            const lbl = this.panel?.querySelector(`#${valId}`);
            if (el) el.value = String(v);
            if (lbl) lbl.textContent = `${v}${suffix}`;
        };
        const setChecked = (id: string, v: boolean) => {
            const el = this.panel?.querySelector(`#${id}`) as HTMLInputElement | null;
            if (el) el.checked = v;
        };

        setSelect('st_weather_type', this.settings.weather.type);
        setSelect('st_weather_density', this.settings.weather.density);
        setVal('st_weather_speed', 'st_weather_speed_val', Math.round(this.settings.weather.speed * 10), 'x');
        setVal('st_weather_opacity', 'st_weather_opacity_val', Math.round(this.settings.weather.opacity * 100), '%');

        setSelect('st_visualizer_mode', this.settings.visualizer.mode);
        setVal('st_visualizer_sens', 'st_visualizer_sens_val', Math.round(this.settings.visualizer.sensitivity * 10), 'x');
        setChecked('st_parallax_enabled', this.settings.parallax.enabled);
        setVal('st_parallax_intensity', 'st_parallax_intensity_val', Math.round(this.settings.parallax.intensity * 10), '');

        setSelect('st_ambient_type', this.settings.ambientSound.type);
        setVal('st_ambient_vol', 'st_ambient_vol_val', Math.round(this.settings.ambientSound.volume * 100), '%');

        setChecked('st_frosted_enabled', this.settings.frostedChat.enabled);
        setVal('st_frosted_blur', 'st_frosted_blur_val', this.settings.frostedChat.blur, 'px');
        setVal('st_frosted_opacity', 'st_frosted_opacity_val', this.settings.frostedChat.opacity, '%');

        setSelect('st_transition_effect', this.settings.transitionEffect);
        setVal('st_transition_dur', 'st_transition_dur_val', this.settings.transitionDurationMs, 'ms');

        setVal('st_audio_volume', 'st_audio_volume_val', Math.round(this.settings.volume * 100), '%');
        setSelect('st_playback_mode', this.settings.playbackMode);
        setChecked('st_audio_mute', this.settings.muted);
        setChecked('st_audio_muffle', this.settings.muffleBGM);
        setChecked('st_audio_blur', this.settings.pauseOnBlur);
        setChecked('st_bgm_auto_advance', this.settings.bgmAutoAdvance.enabled);
        const autoAdvanceRow = this.panel.querySelector('#st_bgm_auto_advance_row') as HTMLElement | null;
        if (autoAdvanceRow) autoAdvanceRow.style.display = this.settings.bgmAutoAdvance.enabled ? '' : 'none';
        const autoAdvanceMin = this.panel.querySelector('#st_bgm_auto_advance_min') as HTMLInputElement | null;
        if (autoAdvanceMin) autoAdvanceMin.value = String(Math.max(1, Math.round(this.settings.bgmAutoAdvance.intervalSec / 60)));
        setVal('st_bgm_auto_advance_fade', 'st_bgm_auto_advance_fade_val', this.settings.bgmAutoAdvance.fadeMs, ' ms');
        setChecked('st_mini_player_toggle', this.settings.showMiniPlayer);
        setChecked('st_capsule_on_play', this.settings.capsuleOnPlayOnly);

        setVal('st_cache_quota', 'st_cache_quota_val', this.settings.cacheQuotaMB, ' MB');
        setChecked('st_cache_autoclean', this.settings.lruAutoClean);
        setChecked('st_agent_tools_enable', this.settings.agentToolsEnabled);

        // Library view state（远程收敛回填）：分段胶囊选中态 + 排序下拉。
        for (const b of Array.from(this.panel.querySelectorAll<HTMLButtonElement>('#st_topbar_type_seg .st-bgloader-seg-btn'))) {
            b.classList.toggle('active', b.dataset.segValue === this.typeFilter);
        }
        const sortEl = this.panel?.querySelector('#st_topbar_sort') as HTMLSelectElement | null;
        if (sortEl) sortEl.value = this.sortOrder;
    }

    /**
     * rAF 合帧入口（L1-MR-9）：同一帧内到达的多次失效（上传→挂载→配额清扫的连发，
     * 或删除→统计的连发）只触发一次网格重建。调用方签名不变（返回共享的 pending）。
     */
    public refreshMediaGrid(): Promise<void> {
        if (this.refreshPending) return this.refreshPending;
        this.refreshPending = new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                this.refreshPending = null;
                resolve(this.refreshMediaGridNow());
            });
        });
        return this.refreshPending;
    }

    private refreshPending: Promise<void> | null = null;

    private async refreshMediaGridNow(): Promise<void> {
        const grid = this.panel?.querySelector('#st_bgloader_grid');
        if (!grid) return;

        // Out-of-order completion guard: two overlapping refreshes (search debounce racing a
        // sort change) used to let the stale result overwrite the newer one.
        const generation = ++this.refreshGeneration;

        let items = await this.cacheManager.listMedia();
        if (generation !== this.refreshGeneration) return;

        // Filter by type（'doc' = html + svg 合并段）
        if (this.typeFilter !== 'all') {
            items = items.filter((i) => this.typeFilter === 'doc'
                ? (i.type === 'html' || i.type === 'svg')
                : i.type === this.typeFilter);
        }

        // Filter by search
        if (this.searchQuery) {
            items = items.filter((i) => i.name.toLowerCase().includes(this.searchQuery));
        }

        // Sort items
        if (this.sortOrder === 'time') {
            items.sort((a, b) => (b.addedTimestamp || 0) - (a.addedTimestamp || 0));
        } else if (this.sortOrder === 'size') {
            items.sort((a, b) => (b.size || 0) - (a.size || 0));
        } else {
            items.sort((a, b) => a.name.localeCompare(b.name));
        }
        this.lastGridItems = items;

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="st-bgloader-empty-state">
                    <i class="fa-solid fa-folder-open fa-2x"></i>
                    <div>无文件</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        items.forEach((item) => {
            const card = document.createElement('div');
            const isActive = this.settings.activeMediaId === item.id;
            card.className = `st-bgloader-media-card ${isActive ? 'active' : ''}`;
            card.title = item.name;
            card.dataset.itemId = item.id;

            let iconClass = 'fa-file-image';
            if (item.type === 'video') iconClass = 'fa-file-video';
            if (item.type === 'audio') iconClass = 'fa-file-audio';
            if (item.type === 'html' || item.type === 'svg') iconClass = 'fa-file-code';

            // 懒挂载：图片/视频预览不在构建期写入（data-lazy-*），进入视口 200px 前瞻带才 hydrate
            const previewContent = item.type === 'image'
                ? `<div class="st-bgloader-card-img" data-lazy-image="${escapeHtml(item.url)}"></div>`
                : item.type === 'video'
                    ? `<div class="st-bgloader-card-img st-bgloader-card-img-pending" data-lazy-thumb="${escapeHtml(item.id)}"></div>`
                    : `<div class="st-bgloader-card-icon"><i class="fa-solid ${iconClass} fa-2x"></i></div>`;

            const displayName = item.name.replace(/[\(\（][^\)\）]*[\)\）]/g, '').trim() || item.name;

            card.innerHTML = `
                ${previewContent}
                <div class="st-bgloader-card-info">
                    <div class="st-bgloader-card-name">${escapeHtml(displayName)}</div>
                    <div class="st-bgloader-card-meta">
                        <span class="st-bg-native-badge ${item.type}">${item.type.toUpperCase()}</span>
                        ${isActive ? '<span class="st-bgloader-active-tag"><i class="fa-solid fa-check"></i> 当前</span>' : ''}
                    </div>
                </div>
                <button type="button" class="st-bgloader-media-delete st-card-delete" title="删除" aria-label="删除 ${escapeHtml(item.name)}"><i class="fa-solid fa-trash"></i></button>
            `;

            card.querySelector('.st-card-delete')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (await HostBridge.getInstance().confirmDialog('确认删除？')) {
                    try {
                        await this.cacheManager.deleteMedia(item.id);
                        // 缩略图缓存同步失效：否则重建网格会命中旧缓存（或滞留已删条目）
                        this.thumbCache.delete(item.id);
                        await this.callbacks.onMediaDeleted(item.id);
                    } catch (err) {
                        console.error('[ST-BgLoader] 删除媒体失败:', err);
                    }
                    void this.refreshMediaGrid();
                    void this.updateCacheStats();
                }
            });

            card.addEventListener('click', () => {
                if (this.multiSelectMode) {
                    const id = card.dataset.itemId;
                    if (!id) return;
                    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
                    else this.selectedIds.add(id);
                    this.syncCardSelection(card);
                    this.syncMultiSelectCount();
                    return;
                }
                this.reportMediaAction(this.callbacks.onMediaSelected(item), '应用媒体失败');
            });

            // Keyboard reachability: Enter/Space applies, arrow keys move through the grid
            // (column count read from the live CSS grid so a layout change stays correct).
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `应用媒体 ${item.name}`);
            card.addEventListener('keydown', (e) => {
                const key = (e as KeyboardEvent).key;
                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    this.reportMediaAction(this.callbacks.onMediaSelected(item), '应用媒体失败');
                    return;
                }
                if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'ArrowUp' && key !== 'ArrowDown') return;
                e.preventDefault();
                const cards = Array.from(grid.querySelectorAll<HTMLElement>('.st-bgloader-media-card'));
                const idx = cards.indexOf(card);
                const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
                let next = idx;
                if (key === 'ArrowRight') next = idx + 1;
                else if (key === 'ArrowLeft') next = idx - 1;
                else if (key === 'ArrowUp') next = idx - cols;
                else next = idx + cols;
                if (next >= 0 && next < cards.length) cards[next].focus();
            });

            fragment.appendChild(card);
        });
        grid.appendChild(fragment);
        this.observeGridLazyLoad(grid);

        // 多选态下重建网格后回写选中视觉与计数（技术面复检 A：否则 selectedIds 与 DOM 失步）
        if (this.multiSelectMode) {
            for (const card of Array.from(grid.querySelectorAll<HTMLElement>('.st-bgloader-media-card'))) {
                this.syncCardSelection(card);
            }
            this.syncMultiSelectCount();
        }
    }

    /**
     * 懒挂载（定案：懒加载+窗口化）：卡片进入视口 200px 前瞻带才写预览背景或生成视频
     * 抽帧；离屏渲染由 CSS content-visibility 跳过。老宿主无 IntersectionObserver 时
     * 降级为构建后直接全量 hydrate（功能不变，只是放弃懒优化）。
     */
    private observeGridLazyLoad(grid: Element): void {
        this.gridObserver?.disconnect();
        const cards = Array.from(grid.querySelectorAll<HTMLElement>('.st-bgloader-media-card'));
        if (!('IntersectionObserver' in window)) {
            for (const card of cards) this.hydrateCardPreview(card);
            return;
        }
        this.gridObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const card = entry.target as HTMLElement;
                this.gridObserver?.unobserve(card);
                this.hydrateCardPreview(card);
            }
        }, { rootMargin: '200px 0px' });
        for (const card of cards) this.gridObserver.observe(card);
    }

    /** 写入单卡预览：图片直接落背景，视频进入既有 LRU 抽帧管线（生成后按 id 回填）。 */
    private hydrateCardPreview(card: HTMLElement): void {
        const img = card.querySelector<HTMLElement>('.st-bgloader-card-img');
        if (!img) return;
        const lazyImage = img.dataset.lazyImage;
        if (lazyImage) {
            img.style.backgroundImage = `url('${lazyImage}')`;
            delete img.dataset.lazyImage;
            return;
        }
        const lazyThumb = img.dataset.lazyThumb;
        if (!lazyThumb) return;
        delete img.dataset.lazyThumb;
        const item = this.lastGridItems?.find((i) => i.id === lazyThumb);
        if (!item) return;
        void this.getVideoThumbnail(item).then((dataUrl) => {
            if (!dataUrl || !this.panel) return;
            const target = this.panel?.querySelector(
                `#st_bgloader_grid .st-bgloader-media-card[data-item-id="${CSS.escape(item.id)}"] .st-bgloader-card-img`,
            ) as HTMLElement | null;
            if (target) {
                target.style.backgroundImage = `url('${dataUrl}')`;
                target.classList.remove('st-bgloader-card-img-pending');
            }
        });
    }

    /** 多选批量模式切换（会话内视图态）：进出时同步操作条显隐与卡片角标。 */
    private setMultiSelectMode(on: boolean): void {
        this.multiSelectMode = on;
        if (!on) this.selectedIds.clear();
        const bar = this.panel?.querySelector('#st_bgloader_multiselect_bar') as HTMLElement | null;
        if (bar) bar.hidden = !on;
        const btn = this.panel?.querySelector('#st_topbar_multiselect_btn');
        if (btn) btn.classList.toggle('active', on);
        for (const card of Array.from(this.panel?.querySelectorAll<HTMLElement>('.st-bgloader-media-card') ?? [])) {
            this.syncCardSelection(card);
        }
        this.syncMultiSelectCount();
    }

    private syncCardSelection(card: HTMLElement): void {
        const id = card.dataset.itemId;
        const selected = this.multiSelectMode && !!id && this.selectedIds.has(id);
        card.classList.toggle('selected', selected);
        const mark = card.querySelector('.st-bgloader-select-mark');
        if (selected && !mark) {
            const el = document.createElement('div');
            el.className = 'st-bgloader-select-mark';
            el.innerHTML = '<i class="fa-solid fa-check"></i>';
            card.appendChild(el);
        } else if (!selected && mark) {
            mark.remove();
        }
    }

    private syncMultiSelectCount(): void {
        const el = this.panel?.querySelector('#st_multiselect_count');
        if (el) el.textContent = `已选 ${this.selectedIds.size}`;
    }

    private async findItemById(id: string): Promise<MediaItem | undefined> {
        return (await this.cacheManager.listMedia()).find((i) => i.id === id);
    }

    private async applyFirstSelected(): Promise<void> {
        const id = Array.from(this.selectedIds)[0];
        if (!id) return;
        const item = await this.findItemById(id);
        if (item) this.reportMediaAction(this.callbacks.onMediaSelected(item), '应用媒体失败');
    }

    private async applyRandomSelected(): Promise<void> {
        const ids = Array.from(this.selectedIds);
        if (ids.length === 0) return;
        const pick = ids[Math.floor(Math.random() * ids.length)];
        const item = await this.findItemById(pick);
        if (item) this.reportMediaAction(this.callbacks.onMediaSelected(item), '应用媒体失败');
    }

    private async bulkDeleteSelected(): Promise<void> {
        const ids = Array.from(this.selectedIds);
        if (ids.length === 0) return;
        const ok = await HostBridge.getInstance().confirmDialog(`删除 ${ids.length} 个媒体？`);
        if (!ok) return;
        let failed = 0;
        for (const id of ids) {
            try {
                await this.cacheManager.deleteMedia(id);
                this.thumbCache.delete(id);
                await this.callbacks.onMediaDeleted(id);
                this.selectedIds.delete(id);
            } catch (err) {
                failed++;
                console.error('[ST-BgLoader] 批量删除失败:', id, err);
            }
        }
        if (failed > 0) {
            void HostBridge.getInstance().alertDialog(`批量删除完成，失败 ${failed} 个`);
        }
        void this.refreshMediaGrid();
        void this.updateCacheStats();
    }

    private async getVideoThumbnail(item: MediaItem): Promise<string | null> {
        const cached = this.thumbCache.get(item.id);
        if (cached) return cached;
        const inflight = this.thumbInflight.get(item.id);
        if (inflight) return inflight;
        const task = this.makeVideoThumb(item)
            .then((dataUrl) => {
                if (dataUrl) {
                    // LRU：先删再设保持 Map 插入序 = 最近使用序；dataUrl 是完整位图
                    // 字符串（数十 KB/条），无上限会在长会话里线性吃内存。
                    this.thumbCache.delete(item.id);
                    this.thumbCache.set(item.id, dataUrl);
                    if (this.thumbCache.size > TopbarBackgroundDrawer.THUMB_CACHE_CAP) {
                        const oldest = this.thumbCache.keys().next().value;
                        if (oldest !== undefined) this.thumbCache.delete(oldest);
                    }
                }
                return dataUrl;
            })
            .finally(() => this.thumbInflight.delete(item.id));
        this.thumbInflight.set(item.id, task);
        return task;
    }

    private makeVideoThumb(item: MediaItem): Promise<string | null> {
        return new Promise((resolve) => {
            let video: HTMLVideoElement | null = null;
            let settled = false;
            const done = (dataUrl: string | null) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timer);
                if (video) {
                    video.removeEventListener('loadeddata', onLoadedData);
                    video.removeEventListener('seeked', onSeeked);
                    video.removeEventListener('error', onError);
                    video.removeAttribute('src');
                    video.load();
                    video.remove();
                    video = null;
                }
                resolve(dataUrl);
            };
            // Bounded wait (L1-MR-7): a stalled source must not leave the promise pending.
            const timer = window.setTimeout(() => done(null), 8000);
            const onLoadedData = () => {
                try {
                    const target = (video && Number.isFinite(video.duration)) ? Math.min(0.5, video.duration / 3) : 0.1;
                    video!.currentTime = target;
                } catch {
                    done(null);
                }
            };
            const onSeeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 240;
                    canvas.height = 135;
                    canvas.getContext('2d')!.drawImage(video!, 0, 0, 240, 135);
                    done(canvas.toDataURL('image/jpeg', 0.6));
                } catch {
                    done(null);
                }
            };
            const onError = () => done(null);

            this.cacheManager.getMediaBlobUrl(item)
                .then((url) => {
                    if (settled) return;
                    video = document.createElement('video');
                    video.muted = true;
                    video.preload = 'metadata';
                    video.style.display = 'none';
                    video.addEventListener('loadeddata', onLoadedData);
                    video.addEventListener('seeked', onSeeked);
                    video.addEventListener('error', onError);
                    document.body.appendChild(video);
                    video.src = url;
                })
                .catch(() => done(null));
        });
    }

    private async handleFileUpload(file: File): Promise<void> {
        try {
            const type = detectMediaType(file.name);
            const item = await this.cacheManager.saveMedia(
                file,
                file.name,
                type,
                'server'
            );
            this.callbacks.onMediaUploaded(item);
            void this.refreshMediaGrid();
            void this.updateCacheStats();
        } catch (err) {
            console.error('[ST-BgLoader] Upload failed:', err);
            void HostBridge.getInstance().alertDialog(`上传失败: ${(err as Error).message}`);
        }
    }

    private async handleUrlImport(url: string): Promise<void> {
        try {
            const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'remote_media';
            const type = detectMediaType(fileName);
            const item = await this.cacheManager.saveMedia(
                new Blob([]),
                fileName,
                type,
                'url',
                url
            );
            this.callbacks.onMediaUploaded(item);
            void this.refreshMediaGrid();
            void this.updateCacheStats();
        } catch (err) {
            console.error('[ST-BgLoader] URL Import failed:', err);
            void HostBridge.getInstance().alertDialog(`URL 导入失败: ${(err as Error).message}`);
        }
    }

    private updatePresetSelect(): void {
        const select = this.panel?.querySelector('#st_preset_select') as HTMLSelectElement | null;
        if (!select) return;
        select.innerHTML = '';

        Object.values(BUILTIN_PRESETS).forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            opt.selected = this.settings.activePresetId === p.id;
            select.appendChild(opt);
        });

        Object.entries(this.settings.userPresets || {}).forEach(([id, filters]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `⭐ ${id}`;
            opt.selected = this.settings.activePresetId === id;
            select.appendChild(opt);
        });

        select.onchange = () => {
            const val = select.value;
            this.settings.activePresetId = val;
            const targetFilters = BUILTIN_PRESETS[val]?.filters || this.settings.userPresets?.[val];
            if (targetFilters) {
                this.settings.filters = { ...targetFilters };
                this.updateFilterSliders();
                this.callbacks.onPresetChanged({ id: val, name: val, filters: this.settings.filters });
                this.save();
            }
        };

        const saveBtn = this.panel?.querySelector<HTMLButtonElement>('#st_preset_save_btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const name = await HostBridge.getInstance().promptDialog('预设名称');
                if (name) {
                    if (!this.settings.userPresets) this.settings.userPresets = {};
                    this.settings.userPresets[name] = { ...this.settings.filters };
                    this.settings.activePresetId = name;
                    this.save();
                    this.updatePresetSelect();
                }
            };
        }

        const delBtn = this.panel?.querySelector<HTMLButtonElement>('#st_preset_del_btn');
        if (delBtn) {
            delBtn.onclick = () => {
                const cur = select.value;
                if (BUILTIN_PRESETS[cur]) {
                    void HostBridge.getInstance().alertDialog('无法删除内置预设');
                    return;
                }
                if (this.settings.userPresets?.[cur]) {
                    delete this.settings.userPresets[cur];
                    this.settings.activePresetId = 'default';
                    this.settings.filters = { ...BUILTIN_PRESETS.default.filters };
                    this.updateFilterSliders();
                    this.save();
                    this.updatePresetSelect();
                }
            };
        }
    }

    private updateSceneSelect(): void {
        const select = this.panel?.querySelector('#st_scene_select') as HTMLSelectElement | null;
        const quick = this.panel?.querySelector('#st_topbar_scene_quick') as HTMLSelectElement | null;
        const populate = (target: HTMLSelectElement | null, placeholder?: string) => {
            if (!target) return;
            target.innerHTML = '';
            if (placeholder !== undefined) {
                const ph = document.createElement('option');
                ph.value = '';
                ph.textContent = placeholder;
                target.appendChild(ph);
            }
            Object.values(BUILTIN_SCENES).forEach((s) => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                opt.selected = this.settings.activeSceneId === s.id;
                target.appendChild(opt);
            });
            Object.entries(this.settings.scenes || {}).forEach(([id, s]) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `⭐ ${s.name}`;
                opt.selected = this.settings.activeSceneId === id;
                target.appendChild(opt);
            });
        };
        populate(select);
        populate(quick, '场景');

        const applyBtn = this.panel?.querySelector<HTMLButtonElement>('#st_scene_apply_btn');
        if (applyBtn) {
            applyBtn.onclick = () => {
                const val = (this.panel?.querySelector('#st_scene_select') as HTMLSelectElement | null)?.value ?? '';
                this.callbacks.onSceneApplied?.(val);
            };
        }

        const saveBtn = this.panel?.querySelector<HTMLButtonElement>('#st_scene_save_btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const name = await HostBridge.getInstance().promptDialog('场景名称');
                if (!name) return;
                const id = 'scene_' + Date.now();
                if (!this.settings.scenes) this.settings.scenes = {};
                this.settings.scenes[id] = {
                    id,
                    name,
                    presetId: this.settings.activePresetId,
                    weather: { ...this.settings.weather },
                    visualizer: { ...this.settings.visualizer },
                    parallax: { ...this.settings.parallax },
                    ambientSound: { ...this.settings.ambientSound },
                    frostedChat: this.settings.frostedChat.enabled,
                    isBuiltin: false,
                };
                this.settings.activeSceneId = id;
                this.save();
                this.updateSceneSelect();
            };
        }

        const delBtn = this.panel?.querySelector<HTMLButtonElement>('#st_scene_del_btn');
        if (delBtn) {
            delBtn.onclick = () => {
                const cur = (this.panel?.querySelector('#st_scene_select') as HTMLSelectElement | null)?.value ?? '';
                if (BUILTIN_SCENES[cur]) {
                    void HostBridge.getInstance().alertDialog('无法删除内置场景');
                    return;
                }
                if (this.settings.scenes?.[cur]) {
                    delete this.settings.scenes[cur];
                    this.settings.activeSceneId = undefined;
                    this.save();
                    this.updateSceneSelect();
                }
            };
        }

        // F2 场景分享：导出全部用户场景 / 导入合并（同 id 覆盖、其余不动）。
        const sceneExportBtn = this.panel?.querySelector<HTMLButtonElement>('#st_scene_export_btn');
        if (sceneExportBtn) {
            sceneExportBtn.onclick = () => {
                const payload = this.callbacks.onScenesExport?.();
                if (!payload) return;
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
                const anchor = document.createElement('a');
                anchor.setAttribute('href', dataStr);
                anchor.setAttribute('download', `st-bgloader-scenes-${Date.now()}.json`);
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
            };
        }

        const sceneImportInput = this.panel?.querySelector<HTMLInputElement>('#st_scene_import_file');
        if (sceneImportInput) {
            sceneImportInput.addEventListener('change', () => {
                const file = sceneImportInput.files?.[0];
                // 先清空选择：同一文件改内容后要能再次选取。
                sceneImportInput.value = '';
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    let parsed: unknown;
                    try {
                        parsed = JSON.parse(event.target?.result as string);
                    } catch {
                        void HostBridge.getInstance().alertDialog('导入失败：不是有效的 JSON 文件');
                        return;
                    }
                    const result = this.callbacks.onScenesImport?.(parsed);
                    if (!result) {
                        void HostBridge.getInstance().alertDialog('导入失败：场景文件格式不符');
                        return;
                    }
                    this.updateSceneSelect();
                    const summary = `场景导入：新增 ${result.added} 更新 ${result.updated}` +
                        (result.skipped ? ` 跳过 ${result.skipped}` : '');
                    try {
                        (window as unknown as { toastr?: { success(msg: string): void } }).toastr?.success(summary);
                    } catch { /* toastr 不在时静默——选择器已刷新，结果可从场景列表核对 */ }
                };
                reader.readAsText(file);
            });
        }
    }

    private updateTriggersUI(): void {
        const list = this.panel?.querySelector('#st_trigger_list');
        if (!list) return;
        list.innerHTML = '';

        const rules = this.settings.triggerRules || [];
        if (rules.length === 0) {
            list.innerHTML = '<div class="st-bgloader-dim-text">暂无规则</div>';
        } else {
            rules.forEach((rule, idx) => {
                const row = document.createElement('div');
                row.className = 'st-bgloader-trigger-row';
                row.innerHTML = `
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''} class="st-bgloader-trigger-check" />
                    <span class="st-bgloader-trigger-badge">${rule.type === 'character' ? '角色' : rule.type === 'chat' ? '聊天' : '正则'}</span>
                    <span class="st-bgloader-trigger-name">${escapeHtml(rule.name)}</span>
                    <span class="st-bgloader-trigger-pattern">${escapeHtml(rule.pattern)}</span>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-bgloader-trigger-del"><i class="fa-solid fa-trash"></i></button>
                `;

                row.querySelector('.st-bgloader-trigger-check')?.addEventListener('change', (e) => {
                    rule.enabled = (e.target as HTMLInputElement).checked;
                    this.save();
                });

                row.querySelector('.st-bgloader-trigger-del')?.addEventListener('click', () => {
                    this.settings.triggerRules.splice(idx, 1);
                    this.save();
                    this.updateTriggersUI();
                });

                list.appendChild(row);
            });
        }

        const form = this.panel?.querySelector('#st_trigger_form') as HTMLElement | null;
        const addBtn = this.panel?.querySelector('#st_trigger_add_btn') as HTMLElement | null;
        const cancelBtn = this.panel?.querySelector<HTMLButtonElement>('#st_trigger_cancel_btn');
        const confirmBtn = this.panel?.querySelector<HTMLButtonElement>('#st_trigger_confirm_btn');

        if (addBtn && form) {
            (addBtn as HTMLElement).onclick = () => {
                form.style.display = 'block';
                addBtn.style.display = 'none';
            };
        }
        if (cancelBtn && form && addBtn) {
            cancelBtn.onclick = () => {
                form.style.display = 'none';
                addBtn.style.display = 'block';
            };
        }
        if (confirmBtn && form && addBtn) {
            confirmBtn.onclick = () => {
                const type = (this.panel?.querySelector('#st_trigger_type') as HTMLSelectElement)?.value as TriggerRule['type'];
                const name = (this.panel?.querySelector('#st_trigger_name') as HTMLInputElement)?.value.trim();
                const pattern = (this.panel?.querySelector('#st_trigger_pattern') as HTMLInputElement)?.value.trim();
                if (!name || !pattern) {
                    void HostBridge.getInstance().alertDialog('名称、匹配文本必填');
                    return;
                }
                const newRule: TriggerRule = {
                    id: 'trig_' + Date.now(),
                    name,
                    enabled: true,
                    type,
                    pattern,
                    action: {
                        preset: this.settings.activePresetId,
                        weather: this.settings.weather.type,
                    },
                };
                if (!this.settings.triggerRules) this.settings.triggerRules = [];
                this.settings.triggerRules.push(newRule);
                this.save();
                this.updateTriggersUI();
                form.style.display = 'none';
                addBtn.style.display = 'block';
            };
        }
    }

    public async updateCacheStats(): Promise<void> {
        if (!this.panel) return;
        try {
            const stats = await this.cacheManager.getCacheUsage();
            const usedEl = this.panel.querySelector('#st_cache_used');
            const countEl = this.panel.querySelector('#st_cache_count');
            if (usedEl) {
                const mb = (stats.usedBytes / (1024 * 1024)).toFixed(1);
                usedEl.textContent = `${mb} MB`;
            }
            if (countEl) countEl.textContent = String(stats.itemCount);
        } catch {
            // cache probe best-effort
        }
    }

    public updateCloudPanel(): void {
        const textEl = this.panel?.querySelector('#st_cloud_status_text');
        if (!textEl) return;
        const client = this.authority?.getClient();
        if (!client) {
            textEl.innerHTML = '<span class="st-bgloader-dim-text">本地模式</span>';
            return;
        }
        textEl.innerHTML = '<span class="st-bgloader-success-text"><i class="fa-solid fa-cloud-check"></i> 云端就绪</span>';
    }
}
