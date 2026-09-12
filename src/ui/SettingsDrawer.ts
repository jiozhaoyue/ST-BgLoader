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
    AmbientSoundOptions,
    AmbientSoundType,
} from '../types';
import { CacheManager } from '../cache/CacheManager';

export interface SettingsDrawerCallbacks {
    onSettingsChanged: (settings: BgLoaderSettings) => void;
    onMediaSelected: (item: MediaItem) => void;
    onMediaDeleted: (id: string) => void;
    onMediaUploaded: (item: MediaItem) => void;
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

export class SettingsDrawer {
    private container: HTMLElement | null = null;
    private settings: BgLoaderSettings;
    private cacheManager: CacheManager;
    private callbacks: SettingsDrawerCallbacks;

    constructor(settings: BgLoaderSettings, cacheManager: CacheManager, callbacks: SettingsDrawerCallbacks) {
        this.settings = settings;
        this.cacheManager = cacheManager;
        this.callbacks = callbacks;
    }

    /** Replace the drawer's settings copy with a remotely synced one and re-render the panel. */
    public applyRemoteSettings(next: BgLoaderSettings): void {
        this.settings = next;
        this.render();
    }

    public render(): void {
        const target = document.querySelector('#extensions_settings');
        if (!target) {
            console.warn('[ST-BgLoader] #extensions_settings not found yet, waiting for DOM insertion...');
            const observer = new MutationObserver(() => {
                if (document.querySelector('#extensions_settings')) {
                    observer.disconnect();
                    this.render();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            return;
        }

        // Avoid duplicate rendering
        const existing = document.querySelector('#st_bgloader_settings');
        if (existing) existing.remove();

        const drawer = document.createElement('div');
        drawer.id = 'st_bgloader_settings';
        drawer.className = 'st-bgloader-panel';

        drawer.innerHTML = `
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-photo-film"></i> ST-BgLoader (Rich Media Backgrounds & FX)</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content" style="display: flex; flex-direction: column; gap: 12px; padding-top: 10px;">
                    
                    <!-- Media Upload Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud-arrow-up"></i> Import Media (Video, Audio, HTML, SVG)</h4>
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone">
                            <i class="fa-solid fa-file-video fa-2x" style="margin-bottom: 6px; opacity: 0.7;"></i>
                            <div>Click or Drag files here (MP4, WebM, MP3, WAV, HTML, SVG, Images)</div>
                            <input type="file" id="st_bgloader_file_input" style="display: none;" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" placeholder="Or enter direct media URL (HTTP/HTTPS)..." />
                            <button id="st_bgloader_url_btn" class="menu_button">Import URL</button>
                        </div>
                    </div>

                    <!-- Media Library Grid -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-layer-group"></i> Media Library</h4>
                        <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                            <!-- Injected dynamically -->
                        </div>
                    </div>

                    <!-- Audiovisual Scene Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-earth-americas"></i> Audiovisual Scene Presets (全景视听预设)</h4>
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 60px;">Scene:</label>
                            <select id="st_scene_select">
                                <!-- Populated dynamically -->
                            </select>
                            <button id="st_scene_apply_btn" class="menu_button" title="Apply Scene"><i class="fa-solid fa-play"></i> Apply</button>
                            <button id="st_scene_save_btn" class="menu_button" title="Save current setup as custom scene"><i class="fa-solid fa-floppy-disk"></i></button>
                            <button id="st_scene_del_btn" class="menu_button" title="Delete custom scene"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>

                    <!-- Visual Filters & Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-sliders"></i> Visual Adjustments & Presets</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 60px;">Preset:</label>
                            <select id="st_preset_select">
                                <!-- Populated dynamically -->
                            </select>
                            <button id="st_preset_save_btn" class="menu_button" title="Save current sliders as custom preset">
                                <i class="fa-solid fa-floppy-disk"></i>
                            </button>
                            <button id="st_preset_del_btn" class="menu_button" title="Delete custom preset">
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

                        <!-- Sandbox Interactive Mode Toggle -->
                        <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_bg_interactive" ${this.settings.interactiveBackground ? 'checked' : ''} />
                                <span>Allow background mouse interaction (3D/Canvas/Games)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Atmospheric Weather & Particles Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud-sun-rain"></i> Atmospheric Weather & Particles</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 80px;">Weather:</label>
                            <select id="st_weather_type">
                                <option value="off" ${this.settings.weather.type === 'off' ? 'selected' : ''}>Off (关闭天气)</option>
                                <option value="rain" ${this.settings.weather.type === 'rain' ? 'selected' : ''}>Rain (细雨微涟)</option>
                                <option value="snow" ${this.settings.weather.type === 'snow' ? 'selected' : ''}>Snow (冬日飘雪)</option>
                                <option value="sakura" ${this.settings.weather.type === 'sakura' ? 'selected' : ''}>Sakura (落樱缤纷)</option>
                                <option value="cyber_motes" ${this.settings.weather.type === 'cyber_motes' ? 'selected' : ''}>Cyber Motes (赛博霓虹微粒)</option>
                                <option value="scanlines" ${this.settings.weather.type === 'scanlines' ? 'selected' : ''}>Scanlines (复古CRT扫描线)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 80px;">Density:</label>
                            <select id="st_weather_density">
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
                        <h4><i class="fa-solid fa-chart-simple"></i> Audio Visualizer & Parallax</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Visualizer:</label>
                            <select id="st_visualizer_mode">
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

                        <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_parallax_enabled" ${this.settings.parallax.enabled ? 'checked' : ''} />
                                <span>Enable 2.5D Mouse Gyro Parallax (景深视差)</span>
                            </label>
                        </div>

                        <div class="st-bgloader-slider-row" style="margin-top: 8px;">
                            <label>Depth Intensity</label>
                            <input type="range" id="st_parallax_intensity" min="1" max="10" step="1" value="${Math.round(this.settings.parallax.intensity * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_parallax_intensity_val">${this.settings.parallax.intensity}</span>
                        </div>
                    </div>

                    <!-- Procedural Ambient Sound Generator Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-fire"></i> Ambient Soundscape Generator (环境白噪音)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Soundscape:</label>
                            <select id="st_ambient_type">
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
                        
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 8px;">
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
                        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Scene Transitions</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Effect:</label>
                            <select id="st_transition_effect">
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
                        <h4><i class="fa-solid fa-volume-high"></i> Audio & BGM Playlist</h4>
                        
                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_audio_volume" min="0" max="100" step="1" value="${Math.round(this.settings.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_audio_volume_val">${Math.round(this.settings.volume * 100)}%</span>
                        </div>

                        <div class="st-bgloader-preset-row" style="margin-top: 6px;">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Play Mode:</label>
                            <select id="st_playback_mode">
                                <option value="loop" ${this.settings.playbackMode === 'loop' ? 'selected' : ''}>Loop Playlist (循环列表)</option>
                                <option value="single" ${this.settings.playbackMode === 'single' ? 'selected' : ''}>Single Track Loop (单曲循环)</option>
                                <option value="shuffle" ${this.settings.playbackMode === 'shuffle' ? 'selected' : ''}>Shuffle (随机播放)</option>
                            </select>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_mute" ${this.settings.muted ? 'checked' : ''} />
                                <span>Mute Audio</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_muffle" ${this.settings.muffleBGM ? 'checked' : ''} />
                                <span>Lo-Fi Acoustic Muffle (隔壁房间低通滤波沉浸感)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? 'checked' : ''} />
                                <span>Pause when tab inactive</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_shortcuts_enabled" ${this.settings.shortcutsEnabled ? 'checked' : ''} />
                                <span>Enable Alt Shortcuts (Alt+B: 背景, Alt+P: 播放, Alt+M: 隔音, Alt+W: 天气, Alt+F: 毛玻璃)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_mini_player_toggle" ${this.settings.showMiniPlayer ? 'checked' : ''} />
                                <span>Show floating mini player capsule</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-left: 18px; font-size: 0.9em; opacity: 0.85;">
                                <input type="checkbox" id="st_capsule_on_play" ${this.settings.capsuleOnPlayOnly ? 'checked' : ''} />
                                <span>Only show capsule during active playback</span>
                            </label>
                        </div>
                    </div>

                    <!-- Smart Scene Triggers -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-bolt"></i> Smart Scene Triggers</h4>
                        <div class="st-bgloader-trigger-list" id="st_trigger_list">
                            <!-- Populated dynamically -->
                        </div>
                        <button id="st_trigger_add_btn" class="menu_button" style="width: 100%;">
                            <i class="fa-solid fa-plus"></i> Add Scene Trigger Rule
                        </button>
                    </div>

                    <!-- Backup & Cache -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-file-export"></i> Backup & Cache</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>Used: <strong id="st_cache_used">Calculating...</strong> (<span id="st_cache_count">0</span> items)</div>
                            <button id="st_cache_clear_btn" class="menu_button menu_button_danger">Clear Cache</button>
                        </div>
                        <div class="st-bgloader-btn-row">
                            <button id="st_backup_export_btn" class="menu_button"><i class="fa-solid fa-download"></i> Export Settings JSON</button>
                            <button id="st_backup_import_btn" class="menu_button"><i class="fa-solid fa-upload"></i> Import Settings JSON</button>
                            <input type="file" id="st_backup_import_file" style="display: none;" accept=".json" />
                        </div>
                    </div>

                </div>
            </div>
        `;

        target.appendChild(drawer);
        this.container = drawer;
        this.bindEvents();
        this.populatePresets();
        this.populateScenes();
        this.refreshMediaGrid();
        this.refreshTriggerList();
        this.updateCacheStats();
    }

    private populateScenes(): void {
        const select = this.container?.querySelector('#st_scene_select') as HTMLSelectElement;
        if (!select) return;

        select.innerHTML = '';

        // Add built-ins
        Object.values(BUILTIN_SCENES).forEach((s) => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            if (s.id === this.settings.activeSceneId) opt.selected = true;
            select.appendChild(opt);
        });

        // Add user custom scenes
        Object.entries(this.settings.scenes || {}).forEach(([id, s]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `★ ${s.name} (Custom)`;
            if (id === this.settings.activeSceneId) opt.selected = true;
            select.appendChild(opt);
        });
    }

    private populatePresets(): void {
        const select = this.container?.querySelector('#st_preset_select') as HTMLSelectElement;
        if (!select) return;

        select.innerHTML = '';

        // Add built-ins
        Object.values(BUILTIN_PRESETS).forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            if (p.id === this.settings.activePresetId) opt.selected = true;
            select.appendChild(opt);
        });

        // Add user presets
        Object.entries(this.settings.userPresets || {}).forEach(([id, filters]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `★ ${id} (Custom)`;
            if (id === this.settings.activePresetId) opt.selected = true;
            select.appendChild(opt);
        });
    }

    private bindEvents(): void {
        if (!this.container) return;

        // Toggle inline drawer collapse
        const toggle = this.container.querySelector('.inline-drawer-toggle');
        const content = this.container.querySelector('.inline-drawer-content') as HTMLElement;
        const icon = this.container.querySelector('.inline-drawer-icon');
        toggle?.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'flex' : 'none';
            if (icon) {
                icon.classList.toggle('down', isHidden);
                icon.classList.toggle('up', !isHidden);
            }
        });

        // Dropzone & File Pick
        const dropzone = this.container.querySelector('#st_bgloader_dropzone');
        const fileInput = this.container.querySelector('#st_bgloader_file_input') as HTMLInputElement;

        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', async () => {
            if (fileInput.files && fileInput.files.length > 0) {
                await this.handleFileUpload(fileInput.files[0]);
                fileInput.value = '';
            }
        });

        dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone?.addEventListener('drop', async (e: Event) => {
            const dragEvent = e as DragEvent;
            dragEvent.preventDefault();
            dropzone.classList.remove('dragover');
            if (dragEvent.dataTransfer?.files && dragEvent.dataTransfer.files.length > 0) {
                await this.handleFileUpload(dragEvent.dataTransfer.files[0]);
            }
        });

        // URL Import
        const urlInput = this.container.querySelector('#st_bgloader_url_input') as HTMLInputElement;
        const urlBtn = this.container.querySelector('#st_bgloader_url_btn');
        urlBtn?.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (url) {
                await this.handleUrlImport(url);
                urlInput.value = '';
            }
        });

        // Scene Controls
        const sceneSelect = this.container.querySelector('#st_scene_select') as HTMLSelectElement;
        this.container.querySelector('#st_scene_apply_btn')?.addEventListener('click', () => {
            const id = sceneSelect?.value;
            if (id) {
                this.settings.activeSceneId = id;
                this.callbacks.onSceneApplied?.(id);
                this.callbacks.onSettingsChanged(this.settings);
            }
        });

        this.container.querySelector('#st_scene_save_btn')?.addEventListener('click', () => {
            const name = prompt('Enter a name for this custom audiovisual scene:');
            if (name && name.trim()) {
                const id = `scene_${Date.now()}`;
                const newScene: SceneSnapshot = {
                    id,
                    name: name.trim(),
                    mediaId: this.settings.activeMediaId || undefined,
                    presetId: this.settings.activePresetId,
                    filters: { ...this.settings.filters },
                    weather: { ...this.settings.weather },
                    visualizer: { ...this.settings.visualizer },
                    parallax: { ...this.settings.parallax },
                    ambientSound: { ...this.settings.ambientSound },
                    frostedChat: this.settings.frostedChat.enabled,
                };
                this.settings.scenes[id] = newScene;
                this.settings.activeSceneId = id;
                this.populateScenes();
                this.callbacks.onSettingsChanged(this.settings);
            }
        });

        this.container.querySelector('#st_scene_del_btn')?.addEventListener('click', () => {
            const current = sceneSelect?.value;
            if (BUILTIN_SCENES[current]) {
                alert('Cannot delete built-in scenes.');
                return;
            }
            if (this.settings.scenes[current]) {
                if (confirm(`Delete custom scene "${this.settings.scenes[current].name}"?`)) {
                    delete this.settings.scenes[current];
                    this.settings.activeSceneId = 'cyber_rain';
                    this.populateScenes();
                    this.callbacks.onSettingsChanged(this.settings);
                }
            }
        });

        // Preset Change
        const presetSelect = this.container.querySelector('#st_preset_select') as HTMLSelectElement;
        presetSelect?.addEventListener('change', () => {
            const id = presetSelect.value;
            this.settings.activePresetId = id;
            let filters = BUILTIN_PRESETS[id]?.filters;
            if (!filters && this.settings.userPresets[id]) {
                filters = this.settings.userPresets[id];
            }
            if (filters) {
                this.settings.filters = { ...filters };
                this.updateSliders(filters);
                this.callbacks.onPresetChanged({ id, name: id, filters });
                this.callbacks.onSettingsChanged(this.settings);
            }
        });

        // Preset Save
        this.container.querySelector('#st_preset_save_btn')?.addEventListener('click', () => {
            const name = prompt('Enter a name for this custom preset:');
            if (name && name.trim()) {
                const cleanName = name.trim();
                this.settings.userPresets[cleanName] = { ...this.settings.filters };
                this.settings.activePresetId = cleanName;
                this.populatePresets();
                this.callbacks.onSettingsChanged(this.settings);
            }
        });

        // Preset Delete
        this.container.querySelector('#st_preset_del_btn')?.addEventListener('click', () => {
            const current = presetSelect.value;
            if (this.settings.userPresets[current]) {
                if (confirm(`Delete custom preset "${current}"?`)) {
                    delete this.settings.userPresets[current];
                    this.settings.activePresetId = 'default';
                    this.populatePresets();
                    const def = BUILTIN_PRESETS.default.filters;
                    this.settings.filters = { ...def };
                    this.updateSliders(def);
                    this.callbacks.onPresetChanged(BUILTIN_PRESETS.default);
                    this.callbacks.onSettingsChanged(this.settings);
                }
            } else {
                alert('Cannot delete built-in presets.');
            }
        });

        // Visual Filter Sliders
        const bindSlider = (id: string, valId: string, unit: string, onChange: (val: number) => void) => {
            const slider = this.container!.querySelector(id) as HTMLInputElement;
            const label = this.container!.querySelector(valId);
            slider?.addEventListener('input', () => {
                const val = Number(slider.value);
                if (label) label.textContent = `${val}${unit}`;
                onChange(val);
                this.callbacks.onSettingsChanged(this.settings);
            });
        };

        bindSlider('#st_filter_blur', '#st_filter_blur_val', 'px', (v) => this.settings.filters.blur = v);
        bindSlider('#st_filter_brightness', '#st_filter_brightness_val', '%', (v) => this.settings.filters.brightness = v);
        bindSlider('#st_filter_opacity', '#st_filter_opacity_val', '%', (v) => this.settings.filters.opacity = v);
        bindSlider('#st_filter_saturate', '#st_filter_saturate_val', '%', (v) => this.settings.filters.saturate = v);

        // Weather Controls
        const weatherTypeSelect = this.container.querySelector('#st_weather_type') as HTMLSelectElement;
        weatherTypeSelect?.addEventListener('change', () => {
            this.settings.weather.type = weatherTypeSelect.value as WeatherType;
            this.callbacks.onWeatherChanged?.(this.settings.weather);
            this.callbacks.onSettingsChanged(this.settings);
        });

        const weatherDensitySelect = this.container.querySelector('#st_weather_density') as HTMLSelectElement;
        weatherDensitySelect?.addEventListener('change', () => {
            this.settings.weather.density = weatherDensitySelect.value as any;
            this.callbacks.onWeatherChanged?.(this.settings.weather);
            this.callbacks.onSettingsChanged(this.settings);
        });

        bindSlider('#st_weather_speed', '#st_weather_speed_val', 'x', (v) => {
            this.settings.weather.speed = v / 10;
            this.callbacks.onWeatherChanged?.(this.settings.weather);
        });

        bindSlider('#st_weather_opacity', '#st_weather_opacity_val', '%', (v) => {
            this.settings.weather.opacity = v / 100;
            this.callbacks.onWeatherChanged?.(this.settings.weather);
        });

        // Visualizer Controls
        const visModeSelect = this.container.querySelector('#st_visualizer_mode') as HTMLSelectElement;
        visModeSelect?.addEventListener('change', () => {
            this.settings.visualizer.mode = visModeSelect.value as VisualizerMode;
            this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
            this.callbacks.onSettingsChanged(this.settings);
        });

        bindSlider('#st_visualizer_sens', '#st_visualizer_sens_val', 'x', (v) => {
            this.settings.visualizer.sensitivity = v / 10;
            this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
        });

        // Parallax Controls
        const parallaxCb = this.container.querySelector('#st_parallax_enabled') as HTMLInputElement;
        parallaxCb?.addEventListener('change', () => {
            this.settings.parallax.enabled = parallaxCb.checked;
            this.callbacks.onParallaxChanged?.(this.settings.parallax);
            this.callbacks.onSettingsChanged(this.settings);
        });

        bindSlider('#st_parallax_intensity', '#st_parallax_intensity_val', '', (v) => {
            this.settings.parallax.intensity = v / 10;
            this.callbacks.onParallaxChanged?.(this.settings.parallax);
        });

        // Ambient Sound Controls
        const ambientSelect = this.container.querySelector('#st_ambient_type') as HTMLSelectElement;
        ambientSelect?.addEventListener('change', () => {
            this.settings.ambientSound.type = ambientSelect.value as AmbientSoundType;
            this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
            this.callbacks.onSettingsChanged(this.settings);
        });

        bindSlider('#st_ambient_vol', '#st_ambient_vol_val', '%', (v) => {
            this.settings.ambientSound.volume = v / 100;
            this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
        });

        // Frosted Glass Chat Controls
        const frostedCb = this.container.querySelector('#st_frosted_enabled') as HTMLInputElement;
        frostedCb?.addEventListener('change', () => {
            this.settings.frostedChat.enabled = frostedCb.checked;
            this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
            this.callbacks.onSettingsChanged(this.settings);
        });

        bindSlider('#st_frosted_blur', '#st_frosted_blur_val', 'px', (v) => {
            this.settings.frostedChat.blur = v;
            this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
        });

        bindSlider('#st_frosted_opacity', '#st_frosted_opacity_val', '%', (v) => {
            this.settings.frostedChat.opacity = v;
            this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
        });

        // Transition Controls
        const transSelect = this.container.querySelector('#st_transition_effect') as HTMLSelectElement;
        transSelect?.addEventListener('change', () => {
            this.settings.transitionEffect = transSelect.value as TransitionType;
            this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
            this.callbacks.onSettingsChanged(this.settings);
        });

        bindSlider('#st_transition_dur', '#st_transition_dur_val', 'ms', (v) => {
            this.settings.transitionDurationMs = v;
            this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
        });

        // Audio controls
        bindSlider('#st_audio_volume', '#st_audio_volume_val', '%', (v) => this.settings.volume = v / 100);

        const modeSelect = this.container.querySelector('#st_playback_mode') as HTMLSelectElement;
        modeSelect?.addEventListener('change', () => {
            this.settings.playbackMode = modeSelect.value as PlaybackMode;
            this.callbacks.onPlaybackModeChanged(this.settings.playbackMode);
            this.callbacks.onSettingsChanged(this.settings);
        });

        const muteCb = this.container.querySelector('#st_audio_mute') as HTMLInputElement;
        muteCb?.addEventListener('change', () => {
            this.settings.muted = muteCb.checked;
            this.callbacks.onSettingsChanged(this.settings);
        });

        const muffleCb = this.container.querySelector('#st_audio_muffle') as HTMLInputElement;
        muffleCb?.addEventListener('change', () => {
            this.settings.muffleBGM = muffleCb.checked;
            this.callbacks.onMuffleChanged?.(muffleCb.checked);
            this.callbacks.onSettingsChanged(this.settings);
        });

        const blurCb = this.container.querySelector('#st_audio_blur') as HTMLInputElement;
        blurCb?.addEventListener('change', () => {
            this.settings.pauseOnBlur = blurCb.checked;
            this.callbacks.onSettingsChanged(this.settings);
        });

        const shortcutsCb = this.container.querySelector('#st_shortcuts_enabled') as HTMLInputElement;
        shortcutsCb?.addEventListener('change', () => {
            this.settings.shortcutsEnabled = shortcutsCb.checked;
            this.callbacks.onSettingsChanged(this.settings);
        });

        // Interactive toggle
        const interCb = this.container.querySelector('#st_bg_interactive') as HTMLInputElement;
        interCb?.addEventListener('change', () => {
            this.settings.interactiveBackground = interCb.checked;
            this.callbacks.onInteractiveChanged(interCb.checked);
            this.callbacks.onSettingsChanged(this.settings);
        });

        // Mini player toggle
        const miniCb = this.container.querySelector('#st_mini_player_toggle') as HTMLInputElement;
        miniCb?.addEventListener('change', () => {
            this.settings.showMiniPlayer = miniCb.checked;
            this.callbacks.onMiniPlayerToggle(miniCb.checked);
            this.callbacks.onSettingsChanged(this.settings);
        });

        const capsulePlayCb = this.container.querySelector('#st_capsule_on_play') as HTMLInputElement;
        capsulePlayCb?.addEventListener('change', () => {
            this.settings.capsuleOnPlayOnly = capsulePlayCb.checked;
            this.callbacks.onCapsuleOnPlayToggle?.(capsulePlayCb.checked);
            this.callbacks.onSettingsChanged(this.settings);
        });

        // Smart Trigger Rule Add Button
        this.container.querySelector('#st_trigger_add_btn')?.addEventListener('click', () => {
            this.promptAddTriggerRule();
        });

        // Clear Cache
        const clearBtn = this.container.querySelector('#st_cache_clear_btn');
        clearBtn?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all cached media files?')) {
                await this.cacheManager.clearAll();
                await this.refreshMediaGrid();
                await this.updateCacheStats();
            }
        });

        // Backup Export / Import
        this.container.querySelector('#st_backup_export_btn')?.addEventListener('click', () => {
            const jsonStr = JSON.stringify(this.settings, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `st-bgloader-settings-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        const importFile = this.container.querySelector('#st_backup_import_file') as HTMLInputElement;
        this.container.querySelector('#st_backup_import_btn')?.addEventListener('click', () => {
            importFile?.click();
        });

        importFile?.addEventListener('change', async () => {
            if (importFile.files && importFile.files[0]) {
                try {
                    const text = await importFile.files[0].text();
                    const imported = JSON.parse(text);
                    if (imported && typeof imported === 'object') {
                        this.settings = { ...this.settings, ...imported };
                        this.callbacks.onSettingsChanged(this.settings);
                        this.render();
                        alert('Settings successfully imported!');
                    }
                } catch (err) {
                    alert(`Failed to import settings JSON: ${err}`);
                }
                importFile.value = '';
            }
        });
    }

    private promptAddTriggerRule(): void {
        const name = prompt('Enter rule name:');
        if (!name) return;
        const typeInput = prompt('Trigger type (character / chat / regex):', 'character')?.toLowerCase().trim();
        const type = (typeInput === 'chat' || typeInput === 'regex') ? typeInput : 'character';
        const pattern = prompt(`Enter ${type} matching pattern (e.g. Character name, Chat ID, or Regex text):`);
        if (!pattern) return;

        const newRule: TriggerRule = {
            id: `rule_${Date.now()}`,
            name,
            enabled: true,
            type,
            pattern,
            action: {
                preset: this.settings.activePresetId,
                weather: this.settings.weather.type,
            },
        };

        this.settings.triggerRules.push(newRule);
        this.callbacks.onSettingsChanged(this.settings);
        this.refreshTriggerList();
    }

    public refreshTriggerList(): void {
        const list = this.container?.querySelector('#st_trigger_list');
        if (!list) return;

        list.innerHTML = '';
        if (this.settings.triggerRules.length === 0) {
            list.innerHTML = `<div style="text-align: center; opacity: 0.6; padding: 8px;">No trigger rules configured yet.</div>`;
            return;
        }

        this.settings.triggerRules.forEach((rule, idx) => {
            const item = document.createElement('div');
            item.className = 'st-bgloader-trigger-item';

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" class="st-rule-toggle" ${rule.enabled ? 'checked' : ''} />
                    <div>
                        <span class="st-bgloader-trigger-badge">${rule.type}</span>
                        <strong>${rule.name}</strong>: <code>${rule.pattern}</code>
                    </div>
                </div>
                <button class="menu_button menu_button_danger st-rule-del" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;

            const toggle = item.querySelector('.st-rule-toggle') as HTMLInputElement;
            toggle.addEventListener('change', () => {
                rule.enabled = toggle.checked;
                this.callbacks.onSettingsChanged(this.settings);
            });

            const del = item.querySelector('.st-rule-del');
            del?.addEventListener('click', () => {
                this.settings.triggerRules.splice(idx, 1);
                this.callbacks.onSettingsChanged(this.settings);
                this.refreshTriggerList();
            });

            list.appendChild(item);
        });
    }

    private updateSliders(filters: { blur: number; brightness: number; opacity: number; saturate: number }): void {
        const setVal = (id: string, valId: string, val: number, unit: string) => {
            const input = this.container?.querySelector(id) as HTMLInputElement;
            const label = this.container?.querySelector(valId);
            if (input) input.value = val.toString();
            if (label) label.textContent = `${val}${unit}`;
        };
        setVal('#st_filter_blur', '#st_filter_blur_val', filters.blur, 'px');
        setVal('#st_filter_brightness', '#st_filter_brightness_val', filters.brightness, '%');
        setVal('#st_filter_opacity', '#st_filter_opacity_val', filters.opacity, '%');
        setVal('#st_filter_saturate', '#st_filter_saturate_val', filters.saturate, '%');
    }

    public async refreshMediaGrid(): Promise<void> {
        const grid = this.container?.querySelector('#st_bgloader_grid');
        if (!grid) return;

        const items = await this.cacheManager.listMedia();
        grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 20px; opacity: 0.6;">No media items imported yet.</div>`;
            return;
        }

        items.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'st-bgloader-media-card';
            if (this.settings.activeMediaId === item.id) {
                card.classList.add('active');
            }

            card.innerHTML = `
                <div class="st-bgloader-media-badge ${item.type}">${item.type}</div>
                <button class="st-bgloader-media-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                <div class="st-bgloader-media-card-title" title="${item.name}">${item.name}</div>
            `;

            // Card click to select media
            card.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.st-bgloader-media-delete')) return;
                this.settings.activeMediaId = item.id;
                this.container?.querySelectorAll('.st-bgloader-media-card').forEach((c) => c.classList.remove('active'));
                card.classList.add('active');
                this.callbacks.onMediaSelected(item);
                this.callbacks.onSettingsChanged(this.settings);
            });

            // Delete button
            const delBtn = card.querySelector('.st-bgloader-media-delete');
            delBtn?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Delete media "${item.name}"?`)) {
                    await this.cacheManager.deleteMedia(item.id);
                    if (this.settings.activeMediaId === item.id) {
                        this.settings.activeMediaId = null;
                        this.callbacks.onSettingsChanged(this.settings);
                    }
                    this.callbacks.onMediaDeleted(item.id);
                    await this.refreshMediaGrid();
                    await this.updateCacheStats();
                }
            });

            grid.appendChild(card);
        });
    }

    public async updateCacheStats(): Promise<void> {
        const usedEl = this.container?.querySelector('#st_cache_used');
        const countEl = this.container?.querySelector('#st_cache_count');
        if (!usedEl || !countEl) return;

        const { usedBytes, itemCount } = await this.cacheManager.getCacheUsage();
        const mb = (usedBytes / (1024 * 1024)).toFixed(2);
        usedEl.textContent = `${mb} MB`;
        countEl.textContent = itemCount.toString();
    }

    private async handleFileUpload(file: File): Promise<void> {
        const type = this.detectMediaType(file.name, file.type);
        const item = await this.cacheManager.saveMedia(file, file.name, type, 'local');
        await this.refreshMediaGrid();
        await this.updateCacheStats();
        this.callbacks.onMediaUploaded(item);
    }

    private async handleUrlImport(url: string): Promise<void> {
        const filename = url.split('/').pop()?.split('?')[0] || 'remote_media';
        const type = this.detectMediaType(filename);
        const item = await this.cacheManager.saveMedia(new Blob([]), filename, type, 'url', url);
        await this.refreshMediaGrid();
        await this.updateCacheStats();
        this.callbacks.onMediaUploaded(item);
    }

    private detectMediaType(filename: string, mimeType: string = ''): MediaType {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext) || mimeType.startsWith('video/')) {
            return 'video';
        }
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext) || mimeType.startsWith('audio/')) {
            return 'audio';
        }
        if (ext === 'html' || ext === 'htm') {
            return 'html';
        }
        if (ext === 'svg') {
            return 'svg';
        }
        return 'image';
    }
}
