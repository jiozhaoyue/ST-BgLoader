import {
    BgLoaderSettings,
    BUILTIN_PRESETS,
    BUILTIN_SCENES,
    FilterPreset,
    MediaItem,
    MediaType,
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
            btn.title = visible ? '背景图层已显示 (点击隐藏)' : '背景图层已隐藏 (点击显示)';
        }
        const check = this.panel?.querySelector('#st_bg_visible_topbar') as HTMLInputElement | null;
        if (check) check.checked = visible;
    }

    /** Mounts the takeover panel into the host's #Backgrounds drawer */
    public mount(): void {
        const hostBridge = HostBridge.getInstance();
        this.hostDrawer = hostBridge.getBackgroundDrawer();

        if (!this.hostDrawer) {
            // Wait for DOM if not ready yet
            const observer = new MutationObserver(() => {
                const drawer = hostBridge.getBackgroundDrawer();
                if (drawer) {
                    observer.disconnect();
                    this.hostDrawer = drawer;
                    this.mount();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 15000);
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

    private renderPanel(): void {
        if (!this.panel) return;

        const backgroundVisible = this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? true;

        this.panel.innerHTML = `
            <div class="st-bgloader-topbar-header">
                <div class="st-bgloader-tab-bar">
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === 'library' ? 'active' : ''}" data-tab="library">
                        <i class="fa-solid fa-photo-film"></i> 背景媒体库
                    </button>
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
                        <i class="fa-solid fa-sliders"></i> 详细设置
                    </button>
                </div>
                <div class="st-bgloader-topbar-actions">
                    <button type="button" id="st_topbar_bg_vis_btn" class="menu_button menu_button_icon" title="${backgroundVisible ? '背景图层已显示 (点击隐藏)' : '背景图层已隐藏 (点击显示)'}">
                        <i class="fa-solid ${backgroundVisible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button type="button" id="st_topbar_bg_clear_btn" class="menu_button menu_button_icon" title="清除当前背景">
                        <i class="fa-solid fa-ban"></i>
                    </button>
                    <button type="button" id="st_topbar_drawer_close" class="menu_button menu_button_icon" title="收起抽屉">
                        <i class="fa-solid fa-chevron-up"></i>
                    </button>
                </div>
            </div>

            <div class="st-bgloader-topbar-body">
                <!-- Tab 1: Library -->
                <div id="st_tab_library" class="st-bgloader-tab-content ${this.activeTab === 'library' ? 'active' : ''}">
                    <!-- Upload & Filter Bar -->
                    <div class="st-bgloader-toolbar-row">
                        <div class="st-bgloader-search-wrap">
                            <input type="search" id="st_topbar_search" class="text_pole" placeholder="搜索背景名称..." value="${escapeHtml(this.searchQuery)}" />
                        </div>
                        <select id="st_topbar_type_filter" class="text_pole">
                            <option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>全部类型</option>
                            <option value="image" ${this.typeFilter === 'image' ? 'selected' : ''}>图片 (Image)</option>
                            <option value="video" ${this.typeFilter === 'video' ? 'selected' : ''}>视频 (Video)</option>
                            <option value="audio" ${this.typeFilter === 'audio' ? 'selected' : ''}>音频 (Audio)</option>
                            <option value="html" ${this.typeFilter === 'html' ? 'selected' : ''}>网页/SVG</option>
                        </select>
                        <button type="button" id="st_topbar_upload_toggle_btn" class="menu_button" title="展开导入面板">
                            <i class="fa-solid fa-cloud-arrow-up"></i> 导入
                        </button>
                    </div>

                    <!-- Collapsible Upload Box -->
                    <div id="st_topbar_upload_box" class="st-bgloader-upload-box" style="display: none;">
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone">
                            <i class="fa-solid fa-file-video fa-2x"></i>
                            <div>点击或拖拽文件至此导入 (视频, 音频, 图片, HTML, SVG)</div>
                            <input type="file" id="st_bgloader_file_input" class="st-bgloader-hidden" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" class="text_pole" placeholder="输入媒体直链 URL (HTTP/HTTPS)..." />
                            <button type="button" id="st_bgloader_url_btn" class="menu_button">导入 URL</button>
                        </div>
                    </div>

                    <!-- Media Grid -->
                    <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                        <div class="st-bgloader-grid-loading"><i class="fa-solid fa-spinner fa-spin"></i> 加载背景库中...</div>
                    </div>
                </div>

                <!-- Tab 2: Settings -->
                <div id="st_tab_settings" class="st-bgloader-tab-content ${this.activeTab === 'settings' ? 'active' : ''}">
                    <!-- Audiovisual Scene Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-earth-americas"></i> Audiovisual Scene Presets (全景视听预设)</h4>
                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-sm">Scene:</label>
                            <select id="st_scene_select" class="text_pole">
                                <!-- Populated dynamically -->
                            </select>
                            <button type="button" id="st_scene_apply_btn" class="menu_button" title="Apply Scene"><i class="fa-solid fa-play"></i> Apply</button>
                            <button type="button" id="st_scene_save_btn" class="menu_button" title="Save current setup as custom scene"><i class="fa-solid fa-floppy-disk"></i></button>
                            <button type="button" id="st_scene_del_btn" class="menu_button" title="Delete custom scene"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>

                    <!-- Visual Filters & Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-sliders"></i> Visual Adjustments & Presets (视听滤镜与调色)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-sm">Preset:</label>
                            <select id="st_preset_select" class="text_pole">
                                <!-- Populated dynamically -->
                            </select>
                            <button type="button" id="st_preset_save_btn" class="menu_button" title="Save current sliders as custom preset">
                                <i class="fa-solid fa-floppy-disk"></i>
                            </button>
                            <button type="button" id="st_preset_del_btn" class="menu_button" title="Delete custom preset">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Blur</label>
                            <input type="range" id="st_filter_blur" min="0" max="20" step="1" value="${this.settings.filters.blur}" />
                            <span class="st-bgloader-slider-val" id="st_filter_blur_val">${this.settings.filters.blur}px</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Brightness</label>
                            <input type="range" id="st_filter_brightness" min="0" max="200" step="5" value="${this.settings.filters.brightness}" />
                            <span class="st-bgloader-slider-val" id="st_filter_brightness_val">${this.settings.filters.brightness}%</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Opacity</label>
                            <input type="range" id="st_filter_opacity" min="0" max="100" step="5" value="${this.settings.filters.opacity}" />
                            <span class="st-bgloader-slider-val" id="st_filter_opacity_val">${this.settings.filters.opacity}%</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Saturation</label>
                            <input type="range" id="st_filter_saturate" min="0" max="200" step="5" value="${this.settings.filters.saturate}" />
                            <span class="st-bgloader-slider-val" id="st_filter_saturate_val">${this.settings.filters.saturate}%</span>
                        </div>

                        <div class="st-bgloader-divider">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_bg_interactive" ${this.settings.interactiveBackground ? 'checked' : ''} />
                                <span>Allow background mouse interaction (3D/Canvas/Games)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Atmospheric Weather & Particles Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud-sun-rain"></i> Atmospheric Weather & Particles (天气微粒)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-md">Weather:</label>
                            <select id="st_weather_type" class="text_pole">
                                ${WEATHER_TYPES.map((t) => `<option value="${t}" ${this.settings.weather.type === t ? 'selected' : ''}>${WEATHER_LABELS[t]}</option>`).join('\n                                ')}
                            </select>
                        </div>

                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-md">Density:</label>
                            <select id="st_weather_density" class="text_pole">
                                <option value="low" ${this.settings.weather.density === 'low' ? 'selected' : ''}>Low (稀疏)</option>
                                <option value="medium" ${this.settings.weather.density === 'medium' ? 'selected' : ''}>Medium (适中)</option>
                                <option value="high" ${this.settings.weather.density === 'high' ? 'selected' : ''}>High (密集)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Speed</label>
                            <input type="range" id="st_weather_speed" min="5" max="25" step="1" value="${Math.round(this.settings.weather.speed * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_weather_speed_val">${this.settings.weather.speed}x</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Opacity</label>
                            <input type="range" id="st_weather_opacity" min="10" max="100" step="5" value="${Math.round(this.settings.weather.opacity * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_weather_opacity_val">${Math.round(this.settings.weather.opacity * 100)}%</span>
                        </div>
                    </div>

                    <!-- Audio Visualizer & Motion Reactive Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-chart-simple"></i> Audio Visualizer & Parallax (频谱与视差)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label>Visualizer:</label>
                            <select id="st_visualizer_mode" class="text_pole">
                                <option value="off" ${this.settings.visualizer.mode === 'off' ? 'selected' : ''}>Off (关闭律动)</option>
                                <option value="pulse" ${this.settings.visualizer.mode === 'pulse' ? 'selected' : ''}>Pulse (低音呼吸律动)</option>
                                <option value="spectrum" ${this.settings.visualizer.mode === 'spectrum' ? 'selected' : ''}>Spectrum (底部音频频谱)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Sensitivity</label>
                            <input type="range" id="st_visualizer_sens" min="5" max="25" step="1" value="${Math.round(this.settings.visualizer.sensitivity * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_visualizer_sens_val">${this.settings.visualizer.sensitivity}x</span>
                        </div>

                        <div class="st-bgloader-divider">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_parallax_enabled" ${this.settings.parallax.enabled ? 'checked' : ''} />
                                <span>Enable 2.5D Mouse Gyro Parallax (景深视差)</span>
                            </label>
                        </div>

                        <div class="st-bgloader-slider-row st-bgloader-gap-top-md">
                            <label>Depth Intensity</label>
                            <input type="range" id="st_parallax_intensity" min="1" max="10" step="1" value="${Math.round(this.settings.parallax.intensity * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_parallax_intensity_val">${this.settings.parallax.intensity}</span>
                        </div>
                    </div>

                    <!-- Ambient Sound Generator Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-fire"></i> Ambient Soundscape Generator (环境白噪音)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label>Soundscape:</label>
                            <select id="st_ambient_type" class="text_pole">
                                <option value="off" ${this.settings.ambientSound.type === 'off' ? 'selected' : ''}>Off (关闭白噪音)</option>
                                <option value="rain" ${this.settings.ambientSound.type === 'rain' ? 'selected' : ''}>Gentle Rain (淅沥雨声)</option>
                                <option value="fire" ${this.settings.ambientSound.type === 'fire' ? 'selected' : ''}>Fireplace Crackle (壁炉木炭噼啪)</option>
                                <option value="wind" ${this.settings.ambientSound.type === 'wind' ? 'selected' : ''}>Howling Wind (空灵夜风)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_ambient_vol" min="0" max="100" step="5" value="${Math.round(this.settings.ambientSound.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_ambient_vol_val">${Math.round(this.settings.ambientSound.volume * 100)}%</span>
                        </div>
                    </div>

                    <!-- Frosted Glass Chat UI Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-eye"></i> Frosted Glass Chat UI (毛玻璃对话框穿透)</h4>
                        
                        <label class="st-bgloader-check st-bgloader-check-lead">
                            <input type="checkbox" id="st_frosted_enabled" ${this.settings.frostedChat.enabled ? 'checked' : ''} />
                            <span>Enable transparent blurred chat bubbles (穿透显示背景)</span>
                        </label>

                        <div class="st-bgloader-slider-row">
                            <label>Blur</label>
                            <input type="range" id="st_frosted_blur" min="0" max="25" step="1" value="${this.settings.frostedChat.blur}" />
                            <span class="st-bgloader-slider-val" id="st_frosted_blur_val">${this.settings.frostedChat.blur}px</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Opacity</label>
                            <input type="range" id="st_frosted_opacity" min="20" max="100" step="5" value="${this.settings.frostedChat.opacity}" />
                            <span class="st-bgloader-slider-val" id="st_frosted_opacity_val">${this.settings.frostedChat.opacity}%</span>
                        </div>
                    </div>

                    <!-- Scene Transitions -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Scene Transitions (转场动画)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label>Effect:</label>
                            <select id="st_transition_effect" class="text_pole">
                                <option value="fade" ${this.settings.transitionEffect === 'fade' ? 'selected' : ''}>Fade (平滑淡入淡出)</option>
                                <option value="zoom_fade" ${this.settings.transitionEffect === 'zoom_fade' ? 'selected' : ''}>Zoom Fade (缩放推进淡入)</option>
                                <option value="blur_fade" ${this.settings.transitionEffect === 'blur_fade' ? 'selected' : ''}>Blur Fade (虚化柔焦渐变)</option>
                                <option value="slide_left" ${this.settings.transitionEffect === 'slide_left' ? 'selected' : ''}>Slide Left (向左推移)</option>
                                <option value="slide_right" ${this.settings.transitionEffect === 'slide_right' ? 'selected' : ''}>Slide Right (向右推移)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Duration</label>
                            <input type="range" id="st_transition_dur" min="200" max="1500" step="50" value="${this.settings.transitionDurationMs}" />
                            <span class="st-bgloader-slider-val" id="st_transition_dur_val">${this.settings.transitionDurationMs}ms</span>
                        </div>
                    </div>

                    <!-- Audio Engine & Playlist Controls -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-volume-high"></i> Audio & BGM Playlist (音乐与播放)</h4>
                        
                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_audio_volume" min="0" max="100" step="1" value="${Math.round(this.settings.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_audio_volume_val">${Math.round(this.settings.volume * 100)}%</span>
                        </div>

                        <div class="st-bgloader-preset-row st-bgloader-gap-top">
                            <label>Play Mode:</label>
                            <select id="st_playback_mode" class="text_pole">
                                <option value="loop" ${this.settings.playbackMode === 'loop' ? 'selected' : ''}>Loop Playlist (循环列表)</option>
                                <option value="single" ${this.settings.playbackMode === 'single' ? 'selected' : ''}>Single Track Loop (单曲循环)</option>
                                <option value="shuffle" ${this.settings.playbackMode === 'shuffle' ? 'selected' : ''}>Shuffle (随机播放)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-check-stack">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_audio_mute" ${this.settings.muted ? 'checked' : ''} />
                                <span>Mute Audio</span>
                            </label>
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_audio_muffle" ${this.settings.muffleBGM ? 'checked' : ''} />
                                <span>Lo-Fi Acoustic Muffle (隔壁房间低通滤波沉浸感)</span>
                            </label>
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? 'checked' : ''} />
                                <span>Pause when tab inactive</span>
                            </label>
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_mini_player_toggle" ${this.settings.showMiniPlayer ? 'checked' : ''} />
                                <span>Show floating mini player capsule</span>
                            </label>
                            <label class="st-bgloader-check st-bgloader-check-sub">
                                <input type="checkbox" id="st_capsule_on_play" ${this.settings.capsuleOnPlayOnly ? 'checked' : ''} />
                                <span>Only show capsule during active playback</span>
                            </label>
                        </div>
                    </div>

                    <!-- Smart Scene Triggers -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-bolt"></i> Smart Scene Triggers (触发器规则)</h4>
                        <div class="st-bgloader-trigger-list" id="st_trigger_list">
                            <!-- Populated dynamically -->
                        </div>
                        <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                            <div class="st-bgloader-preset-row">
                                <label>类型:</label>
                                <select id="st_trigger_type" class="text_pole">
                                    <option value="character">角色名 (Character)</option>
                                    <option value="chat">聊天 ID (Chat)</option>
                                    <option value="regex">正则匹配 (Regex)</option>
                                </select>
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label>规则名:</label>
                                <input type="text" id="st_trigger_name" class="text_pole" placeholder="规则名称" />
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label>匹配:</label>
                                <input type="text" id="st_trigger_pattern" class="text_pole" placeholder="角色名 / 聊天 ID / 正则表达式" />
                            </div>
                            <div class="st-bgloader-btn-row">
                                <button type="button" id="st_trigger_confirm_btn" class="menu_button"><i class="fa-solid fa-check"></i> 添加规则</button>
                                <button type="button" id="st_trigger_cancel_btn" class="menu_button">取消</button>
                            </div>
                        </div>
                        <button type="button" id="st_trigger_add_btn" class="menu_button st-bgloader-btn-full">
                            <i class="fa-solid fa-plus"></i> Add Scene Trigger Rule
                        </button>
                    </div>

                    <!-- Backup & Cache -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-file-export"></i> Backup & Cache (缓存与备份)</h4>
                        <div class="st-bgloader-row-between">
                            <div>Used: <strong id="st_cache_used">Calculating...</strong> (<span id="st_cache_count">0</span> items)</div>
                            <button type="button" id="st_cache_clear_btn" class="menu_button menu_button_danger">Clear Cache</button>
                        </div>
                        <div class="st-bgloader-slider-row">
                            <label>Cache quota</label>
                            <input type="range" id="st_cache_quota" min="128" max="8192" step="128" value="${this.settings.cacheQuotaMB}" />
                            <span class="st-bgloader-slider-val" id="st_cache_quota_val">${this.settings.cacheQuotaMB} MB</span>
                        </div>
                        <div class="st-bgloader-check-stack">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_cache_autoclean" ${this.settings.lruAutoClean ? 'checked' : ''} />
                                <span>Auto-clean browser cache above quota (服务端文件不受影响)</span>
                            </label>
                        </div>
                        <div class="st-bgloader-btn-row">
                            <button type="button" id="st_backup_export_btn" class="menu_button"><i class="fa-solid fa-download"></i> 导出设置 JSON</button>
                            <label for="st_backup_import_file" class="menu_button">
                                <i class="fa-solid fa-upload"></i> 导入设置 JSON
                                <input type="file" id="st_backup_import_file" class="st-bgloader-hidden" accept=".json" />
                            </label>
                        </div>
                    </div>

                    <!-- Authority Cloud & Agent Tools Section -->
                    <div class="st-bgloader-section" id="st_authority_section">
                        <h4><i class="fa-solid fa-cloud"></i> Cloud Sync & Agent Tools</h4>
                        <div id="st_cloud_status_text" class="st-bgloader-cloud-note">
                            <!-- Populated dynamically based on capabilities -->
                        </div>
                        <div class="st-bgloader-check-stack">
                            <label class="st-bgloader-check" id="st_agent_tools_wrapper">
                                <input type="checkbox" id="st_agent_tools_enable" ${this.settings.agentToolsEnabled ? 'checked' : ''} />
                                <span>启用 Agent 视听导演工具 (AI 可按剧情切换背景/天气/音乐)</span>
                            </label>
                        </div>
                    </div>
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
            void this.refreshMediaGrid();
        });

        const typeFilter = this.panel.querySelector('#st_topbar_type_filter') as HTMLSelectElement | null;
        typeFilter?.addEventListener('change', () => {
            this.typeFilter = typeFilter.value;
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

        // Sliders & Filters
        const bindSlider = (id: string, valId: string, suffix: string, onChange: (v: number) => void) => {
            const input = this.panel?.querySelector(`#${id}`) as HTMLInputElement | null;
            const label = this.panel?.querySelector(`#${valId}`);
            input?.addEventListener('input', () => {
                const val = Number(input.value);
                if (label) label.textContent = `${val}${suffix}`;
                onChange(val);
            });
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
                    this.settings = { ...this.settings, ...parsed };
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

    public async refreshMediaGrid(): Promise<void> {
        const grid = this.panel?.querySelector('#st_bgloader_grid');
        if (!grid) return;

        let items = await this.cacheManager.listMedia();

        // Filter by type
        if (this.typeFilter !== 'all') {
            items = items.filter((i) => i.type === this.typeFilter);
        }

        // Filter by search
        if (this.searchQuery) {
            items = items.filter((i) => i.name.toLowerCase().includes(this.searchQuery));
        }

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="st-bgloader-empty-state">
                    <i class="fa-solid fa-folder-open fa-2x"></i>
                    <div>未找到匹配的背景文件</div>
                    <small>点击上方“导入”添加图片、视频、音频或网页背景</small>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
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

            card.innerHTML = `
                ${previewContent}
                <div class="st-bgloader-card-info">
                    <div class="st-bgloader-card-name">${escapeHtml(item.name)}</div>
                    <div class="st-bgloader-card-meta">
                        <span class="st-bg-native-badge ${item.type}">${item.type.toUpperCase()}</span>
                        ${isActive ? '<span class="st-bgloader-active-tag"><i class="fa-solid fa-check"></i> 使用中</span>' : ''}
                    </div>
                </div>
                <div class="st-bgloader-card-actions">
                    <button type="button" class="menu_button menu_button_icon st-card-apply" title="应用为背景"><i class="fa-solid fa-play"></i></button>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-card-delete" title="删除"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            card.querySelector('.st-card-apply')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.callbacks.onMediaSelected(item);
            });

            card.querySelector('.st-card-delete')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`确定删除背景 "${item.name}" 吗？`)) {
                    await this.cacheManager.deleteMedia(item.id);
                    this.callbacks.onMediaDeleted(item.id);
                    void this.refreshMediaGrid();
                    void this.updateCacheStats();
                }
            });

            card.addEventListener('click', () => {
                this.callbacks.onMediaSelected(item);
            });

            grid.appendChild(card);
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
            opt.textContent = `⭐ ${id} (自定义)`;
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
                const name = prompt('请输入新预设名称:');
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
            opt.textContent = `⭐ ${s.name} (自定义)`;
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
                const name = prompt('保存当前设置为场景，请输入场景名称:');
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
            list.innerHTML = '<div class="st-bgloader-dim-text">暂无场景触发规则，点击下方添加</div>';
        } else {
            rules.forEach((rule, idx) => {
                const row = document.createElement('div');
                row.className = 'st-bgloader-trigger-row';
                row.innerHTML = `
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''} class="st-trigger-check" />
                    <span class="st-trigger-badge">${rule.type}</span>
                    <span class="st-trigger-name">${escapeHtml(rule.name)}</span>
                    <span class="st-trigger-pattern">${escapeHtml(rule.pattern)}</span>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-trigger-del"><i class="fa-solid fa-trash"></i></button>
                `;

                row.querySelector('.st-trigger-check')?.addEventListener('change', (e) => {
                    rule.enabled = (e.target as HTMLInputElement).checked;
                    this.save();
                });

                row.querySelector('.st-trigger-del')?.addEventListener('click', () => {
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
            textEl.innerHTML = '<span class="st-bgloader-dim-text">本地离线运行模式 (Authority 云后端未连接)</span>';
            return;
        }
        textEl.innerHTML = '<span class="st-bgloader-success-text"><i class="fa-solid fa-cloud-check"></i> Authority 云端就绪，支持跨设备同步与 AI 导演</span>';
    }
}
