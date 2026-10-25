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
}

const NATIVE_HIDDEN_CLASS = 'st-bg-native-hidden';

/**
 * TopbarBackgroundDrawer:
 * Takes over the host's native `#Backgrounds` drawer across 4 taverns (SillyTavern, Luker, PureTavern, TauriTavern).
 *
 * When enabled, hides native drawer contents and presents the unified Rich Media Library
 * and Detailed Settings tabs inside the native top bar drawer.
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
    private typeFilter: string = 'all';
    private sortOrder: 'name' | 'time' | 'size' = 'name';
    /** Pending DOM-wait observer between mount() and the host drawer appearing. */
    private mountObserver: MutationObserver | null = null;
    private searchDebounceTimer: number | null = null;
    /** Monotonic token for in-flight grid refreshes: only the newest run may write the grid. */
    private refreshGeneration = 0;

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
    }

    public applyRemoteSettings(next: BgLoaderSettings): void {
        this.settings = next;
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
            setTimeout(() => this.dropMountObserver(), 15000);
            return;
        }

        // Hide native children of #Backgrounds
        Array.from(this.hostDrawer.children).forEach((child) => {
            if (child.id !== 'st_bgloader_topbar_panel') {
                child.classList.add(NATIVE_HIDDEN_CLASS);
            }
        });

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
                        <select id="st_topbar_type_filter" class="text_pole">
                            <option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>全部</option>
                            <option value="image" ${this.typeFilter === 'image' ? 'selected' : ''}>图片</option>
                            <option value="video" ${this.typeFilter === 'video' ? 'selected' : ''}>视频</option>
                            <option value="audio" ${this.typeFilter === 'audio' ? 'selected' : ''}>音频</option>
                            <option value="html" ${this.typeFilter === 'html' ? 'selected' : ''}>网页</option>
                        </select>
                        <select id="st_topbar_sort" class="text_pole">
                            <option value="name" ${this.sortOrder === 'name' ? 'selected' : ''}>名称</option>
                            <option value="time" ${this.sortOrder === 'time' ? 'selected' : ''}>时间</option>
                            <option value="size" ${this.sortOrder === 'size' ? 'selected' : ''}>大小</option>
                        </select>
                        <button type="button" id="st_topbar_upload_toggle_btn" class="menu_button" title="导入">
                            <i class="fa-solid fa-cloud-arrow-up"></i> 导入
                        </button>
                    </div>

                    <!-- Collapsible Upload Box -->
                    <div id="st_topbar_upload_box" class="st-bgloader-upload-box" style="display: none;">
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone">
                            <i class="fa-solid fa-file-video fa-2x"></i>
                            <div>点击或拖拽文件导入</div>
                            <input type="file" id="st_bgloader_file_input" class="st-bgloader-hidden" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" class="text_pole" placeholder="媒体 URL..." />
                            <button type="button" id="st_bgloader_url_btn" class="menu_button">导入</button>
                        </div>
                    </div>

                    <!-- Media Grid -->
                    <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                        <div class="st-bgloader-grid-loading"><i class="fa-solid fa-spinner fa-spin"></i> 加载中...</div>
                    </div>
                </div>

                <!-- Tab 2: Settings -->
                <div id="st_tab_settings" class="st-bgloader-tab-content ${this.activeTab === 'settings' ? 'active' : ''}">
                    <!-- Scene -->
                    ${UIComponents.renderSection({
                        title: '场景',
                        icon: 'fa-earth-americas',
                        contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-sm">场景:</label>
                                <select id="st_scene_select" class="text_pole"></select>
                                <button type="button" id="st_scene_apply_btn" class="menu_button" title="应用"><i class="fa-solid fa-play"></i> 应用</button>
                                <button type="button" id="st_scene_save_btn" class="menu_button" title="保存"><i class="fa-solid fa-floppy-disk"></i></button>
                                <button type="button" id="st_scene_del_btn" class="menu_button" title="删除"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `,
                    })}

                    <!-- Filters -->
                    ${UIComponents.renderSection({
                        title: '滤镜',
                        icon: 'fa-sliders',
                        contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-sm">预设:</label>
                                <select id="st_preset_select" class="text_pole"></select>
                                <button type="button" id="st_preset_save_btn" class="menu_button" title="保存"><i class="fa-solid fa-floppy-disk"></i></button>
                                <button type="button" id="st_preset_del_btn" class="menu_button" title="删除"><i class="fa-solid fa-trash"></i></button>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_filter_blur', valId: 'st_filter_blur_val', label: '模糊', min: 0, max: 20, step: 1, value: this.settings.filters.blur, unit: 'px' })}
                            ${UIComponents.renderSlider({ id: 'st_filter_brightness', valId: 'st_filter_brightness_val', label: '亮度', min: 0, max: 200, step: 5, value: this.settings.filters.brightness, unit: '%' })}
                            ${UIComponents.renderSlider({ id: 'st_filter_opacity', valId: 'st_filter_opacity_val', label: '不透明', min: 0, max: 100, step: 5, value: this.settings.filters.opacity, unit: '%' })}
                            ${UIComponents.renderSlider({ id: 'st_filter_saturate', valId: 'st_filter_saturate_val', label: '饱和度', min: 0, max: 200, step: 5, value: this.settings.filters.saturate, unit: '%' })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_bg_interactive', label: '背景交互', checked: this.settings.interactiveBackground })}
                            </div>
                        `,
                    })}

                    <!-- Weather -->
                    ${UIComponents.renderSection({
                        title: '天气',
                        icon: 'fa-cloud-sun-rain',
                        contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-md">天气:</label>
                                <select id="st_weather_type" class="text_pole">
                                    ${WEATHER_TYPES.map((t) => `<option value="${t}" ${this.settings.weather.type === t ? 'selected' : ''}>${WEATHER_LABELS[t]}</option>`).join('')}
                                </select>
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-md">密度:</label>
                                <select id="st_weather_density" class="text_pole">
                                    <option value="low" ${this.settings.weather.density === 'low' ? 'selected' : ''}>稀疏</option>
                                    <option value="medium" ${this.settings.weather.density === 'medium' ? 'selected' : ''}>适中</option>
                                    <option value="high" ${this.settings.weather.density === 'high' ? 'selected' : ''}>密集</option>
                                </select>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_weather_speed', valId: 'st_weather_speed_val', label: '速度', min: 5, max: 25, step: 1, value: Math.round(this.settings.weather.speed * 10), unit: 'x' })}
                            ${UIComponents.renderSlider({ id: 'st_weather_opacity', valId: 'st_weather_opacity_val', label: '不透明', min: 10, max: 100, step: 5, value: Math.round(this.settings.weather.opacity * 100), unit: '%' })}
                        `,
                    })}

                    <!-- Motion -->
                    ${UIComponents.renderSection({
                        title: '动效',
                        icon: 'fa-chart-simple',
                        contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label>律动:</label>
                                <select id="st_visualizer_mode" class="text_pole">
                                    <option value="off" ${this.settings.visualizer.mode === 'off' ? 'selected' : ''}>关闭</option>
                                    <option value="pulse" ${this.settings.visualizer.mode === 'pulse' ? 'selected' : ''}>呼吸</option>
                                    <option value="spectrum" ${this.settings.visualizer.mode === 'spectrum' ? 'selected' : ''}>频谱</option>
                                </select>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_visualizer_sens', valId: 'st_visualizer_sens_val', label: '灵敏度', min: 5, max: 25, step: 1, value: Math.round(this.settings.visualizer.sensitivity * 10), unit: 'x' })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_parallax_enabled', label: '景深视差', checked: this.settings.parallax.enabled })}
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_parallax_intensity', valId: 'st_parallax_intensity_val', label: '深度', min: 1, max: 10, step: 1, value: Math.round(this.settings.parallax.intensity * 10), unit: '' })}
                        `,
                    })}

                    <!-- Ambient Sound -->
                    ${UIComponents.renderSection({
                        title: '音效',
                        icon: 'fa-fire',
                        contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label>音效:</label>
                                <select id="st_ambient_type" class="text_pole">
                                    <option value="off" ${this.settings.ambientSound.type === 'off' ? 'selected' : ''}>关闭</option>
                                    <option value="rain" ${this.settings.ambientSound.type === 'rain' ? 'selected' : ''}>雨声</option>
                                    <option value="fire" ${this.settings.ambientSound.type === 'fire' ? 'selected' : ''}>壁炉</option>
                                    <option value="wind" ${this.settings.ambientSound.type === 'wind' ? 'selected' : ''}>风声</option>
                                </select>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_ambient_vol', valId: 'st_ambient_vol_val', label: '音量', min: 0, max: 100, step: 5, value: Math.round(this.settings.ambientSound.volume * 100), unit: '%' })}
                        `,
                    })}

                    <!-- Frosted Chat -->
                    ${UIComponents.renderSection({
                        title: '毛玻璃',
                        icon: 'fa-eye',
                        contentHtml: `
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_frosted_enabled', label: '毛玻璃穿透', checked: this.settings.frostedChat.enabled })}
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_frosted_blur', valId: 'st_frosted_blur_val', label: '模糊', min: 0, max: 25, step: 1, value: this.settings.frostedChat.blur, unit: 'px' })}
                            ${UIComponents.renderSlider({ id: 'st_frosted_opacity', valId: 'st_frosted_opacity_val', label: '不透明', min: 20, max: 100, step: 5, value: this.settings.frostedChat.opacity, unit: '%' })}
                        `,
                    })}

                    <!-- Transition -->
                    ${UIComponents.renderSection({
                        title: '转场',
                        icon: 'fa-wand-magic-sparkles',
                        contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label>效果:</label>
                                <select id="st_transition_effect" class="text_pole">
                                    <option value="fade" ${this.settings.transitionEffect === 'fade' ? 'selected' : ''}>淡入</option>
                                    <option value="zoom_fade" ${this.settings.transitionEffect === 'zoom_fade' ? 'selected' : ''}>缩放</option>
                                    <option value="blur_fade" ${this.settings.transitionEffect === 'blur_fade' ? 'selected' : ''}>柔焦</option>
                                    <option value="slide_left" ${this.settings.transitionEffect === 'slide_left' ? 'selected' : ''}>左移</option>
                                    <option value="slide_right" ${this.settings.transitionEffect === 'slide_right' ? 'selected' : ''}>右移</option>
                                </select>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_transition_dur', valId: 'st_transition_dur_val', label: '时长', min: 200, max: 1500, step: 50, value: this.settings.transitionDurationMs, unit: 'ms' })}
                        `,
                    })}

                    <!-- Audio Engine -->
                    ${UIComponents.renderSection({
                        title: '音乐',
                        icon: 'fa-volume-high',
                        contentHtml: `
                            ${UIComponents.renderSlider({ id: 'st_audio_volume', valId: 'st_audio_volume_val', label: '音量', min: 0, max: 100, step: 1, value: Math.round(this.settings.volume * 100), unit: '%' })}
                            <div class="st-bgloader-preset-row">
                                <label>模式:</label>
                                <select id="st_playback_mode" class="text_pole">
                                    <option value="loop" ${this.settings.playbackMode === 'loop' ? 'selected' : ''}>列表循环</option>
                                    <option value="single" ${this.settings.playbackMode === 'single' ? 'selected' : ''}>单曲循环</option>
                                    <option value="shuffle" ${this.settings.playbackMode === 'shuffle' ? 'selected' : ''}>随机播放</option>
                                </select>
                            </div>
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_audio_mute', label: '静音', checked: this.settings.muted })}
                                ${UIComponents.renderCheckbox({ id: 'st_audio_muffle', label: '沉浸低通', checked: this.settings.muffleBGM })}
                                ${UIComponents.renderCheckbox({ id: 'st_audio_blur', label: '后台暂停', checked: this.settings.pauseOnBlur })}
                                ${UIComponents.renderCheckbox({ id: 'st_mini_player_toggle', label: '悬浮胶囊', checked: this.settings.showMiniPlayer })}
                                ${UIComponents.renderCheckbox({ id: 'st_capsule_on_play', label: '播放时显示', checked: this.settings.capsuleOnPlayOnly, sub: true })}
                            </div>
                        `,
                    })}

                    <!-- Triggers -->
                    ${UIComponents.renderSection({
                        title: '触发器',
                        icon: 'fa-bolt',
                        contentHtml: `
                            <div class="st-bgloader-trigger-list" id="st_trigger_list"></div>
                            <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                                <div class="st-bgloader-preset-row">
                                    <label>类型:</label>
                                    <select id="st_trigger_type" class="text_pole">
                                        <option value="character">角色</option>
                                        <option value="chat">聊天</option>
                                        <option value="regex">正则</option>
                                    </select>
                                </div>
                                <div class="st-bgloader-preset-row">
                                    <label>规则:</label>
                                    <input type="text" id="st_trigger_name" class="text_pole" placeholder="名称" />
                                </div>
                                <div class="st-bgloader-preset-row">
                                    <label>匹配:</label>
                                    <input type="text" id="st_trigger_pattern" class="text_pole" placeholder="匹配文本" />
                                </div>
                                <div class="st-bgloader-btn-row">
                                    <button type="button" id="st_trigger_confirm_btn" class="menu_button"><i class="fa-solid fa-check"></i> 添加</button>
                                    <button type="button" id="st_trigger_cancel_btn" class="menu_button">取消</button>
                                </div>
                            </div>
                            <button type="button" id="st_trigger_add_btn" class="menu_button st-bgloader-btn-full">
                                <i class="fa-solid fa-plus"></i> 添加
                            </button>
                        `,
                    })}

                    <!-- Storage -->
                    ${UIComponents.renderSection({
                        title: '存储',
                        icon: 'fa-file-export',
                        contentHtml: `
                            <div class="st-bgloader-row-between">
                                <div>已用: <strong id="st_cache_used">0 MB</strong> <span id="st_cache_count">0</span>项</div>
                                <button type="button" id="st_cache_clear_btn" class="menu_button menu_button_danger">清空</button>
                            </div>
                            ${UIComponents.renderSlider({ id: 'st_cache_quota', valId: 'st_cache_quota_val', label: '配额', min: 128, max: 8192, step: 128, value: this.settings.cacheQuotaMB, unit: ' MB' })}
                            <div class="st-bgloader-check-stack">
                                ${UIComponents.renderCheckbox({ id: 'st_cache_autoclean', label: '自动清理', checked: this.settings.lruAutoClean })}
                            </div>
                            <div class="st-bgloader-btn-row">
                                <button type="button" id="st_backup_export_btn" class="menu_button"><i class="fa-solid fa-download"></i> 导出</button>
                                <label for="st_backup_import_file" class="menu_button">
                                    <i class="fa-solid fa-upload"></i> 导入
                                    <input type="file" id="st_backup_import_file" class="st-bgloader-hidden" accept=".json" />
                                </label>
                            </div>
                        `,
                    })}

                    <!-- Cloud -->
                    ${UIComponents.renderSection({
                        id: 'st_authority_section',
                        title: '云端',
                        icon: 'fa-cloud',
                        contentHtml: `
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

        const typeFilter = this.panel.querySelector('#st_topbar_type_filter') as HTMLSelectElement | null;
        typeFilter?.addEventListener('change', () => {
            this.typeFilter = typeFilter.value;
            void this.refreshMediaGrid();
        });

        const sortSelect = this.panel.querySelector('#st_topbar_sort') as HTMLSelectElement | null;
        sortSelect?.addEventListener('change', () => {
            this.sortOrder = (sortSelect.value as 'name' | 'time' | 'size') || 'name';
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
                    alert('导入失败：不是有效的 JSON 配置文件');
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
        setChecked('st_mini_player_toggle', this.settings.showMiniPlayer);
        setChecked('st_capsule_on_play', this.settings.capsuleOnPlayOnly);

        setVal('st_cache_quota', 'st_cache_quota_val', this.settings.cacheQuotaMB, ' MB');
        setChecked('st_cache_autoclean', this.settings.lruAutoClean);
        setChecked('st_agent_tools_enable', this.settings.agentToolsEnabled);
    }

    public async refreshMediaGrid(): Promise<void> {
        const grid = this.panel?.querySelector('#st_bgloader_grid');
        if (!grid) return;

        // Out-of-order completion guard: two overlapping refreshes (search debounce racing a
        // sort change) used to let the stale result overwrite the newer one.
        const generation = ++this.refreshGeneration;

        let items = await this.cacheManager.listMedia();
        if (generation !== this.refreshGeneration) return;

        // Filter by type
        if (this.typeFilter !== 'all') {
            items = items.filter((i) => i.type === this.typeFilter);
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

            let iconClass = 'fa-file-image';
            if (item.type === 'video') iconClass = 'fa-file-video';
            if (item.type === 'audio') iconClass = 'fa-file-audio';
            if (item.type === 'html' || item.type === 'svg') iconClass = 'fa-file-code';

            const previewContent = item.type === 'image'
                ? `<div class="st-bgloader-card-img" style="background-image: url('${escapeHtml(item.url)}')"></div>`
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
                <div class="st-bgloader-card-actions">
                    <button type="button" class="menu_button menu_button_icon st-card-apply" title="应用"><i class="fa-solid fa-play"></i></button>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-card-delete" title="删除"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            card.querySelector('.st-card-apply')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reportMediaAction(this.callbacks.onMediaSelected(item), '应用媒体失败');
            });

            card.querySelector('.st-card-delete')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('确认删除？')) {
                    try {
                        await this.cacheManager.deleteMedia(item.id);
                        await this.callbacks.onMediaDeleted(item.id);
                    } catch (err) {
                        console.error('[ST-BgLoader] 删除媒体失败:', err);
                    }
                    void this.refreshMediaGrid();
                    void this.updateCacheStats();
                }
            });

            card.addEventListener('click', () => {
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
            alert(`上传失败: ${(err as Error).message}`);
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
            alert(`URL 导入失败: ${(err as Error).message}`);
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
            saveBtn.onclick = () => {
                const name = prompt('预设名称:');
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
                    alert('无法删除内置预设');
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
        if (!select) return;
        select.innerHTML = '';

        Object.values(BUILTIN_SCENES).forEach((s) => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            opt.selected = this.settings.activeSceneId === s.id;
            select.appendChild(opt);
        });

        Object.entries(this.settings.scenes || {}).forEach(([id, s]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `⭐ ${s.name}`;
            opt.selected = this.settings.activeSceneId === id;
            select.appendChild(opt);
        });

        const applyBtn = this.panel?.querySelector<HTMLButtonElement>('#st_scene_apply_btn');
        if (applyBtn) {
            applyBtn.onclick = () => {
                const val = select.value;
                this.callbacks.onSceneApplied?.(val);
            };
        }

        const saveBtn = this.panel?.querySelector<HTMLButtonElement>('#st_scene_save_btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const name = prompt('场景名称:');
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
                const cur = select.value;
                if (BUILTIN_SCENES[cur]) {
                    alert('无法删除内置场景');
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
                    alert('请填写规则名称和匹配文本');
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
