import { BgLoaderSettings, BUILTIN_PRESETS, FilterPreset, MediaItem, MediaType, PlaybackMode } from '../types';
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
                    <b><i class="fa-solid fa-photo-film"></i> ST-BgLoader (Rich Media Backgrounds)</b>
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
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? 'checked' : ''} />
                                <span>Pause when tab inactive</span>
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

                    <!-- Cache & Performance -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-database"></i> Cache Management</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>Used: <strong id="st_cache_used">Calculating...</strong> (<span id="st_cache_count">0</span> items)</div>
                            <button id="st_cache_clear_btn" class="menu_button menu_button_danger">Clear Cache</button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        target.appendChild(drawer);
        this.container = drawer;
        this.bindEvents();
        this.populatePresets();
        this.refreshMediaGrid();
        this.updateCacheStats();
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

        // Sliders
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

        bindSlider('#st_audio_volume', '#st_audio_volume_val', '%', (v) => this.settings.volume = v / 100);

        // Playback mode
        const modeSelect = this.container.querySelector('#st_playback_mode') as HTMLSelectElement;
        modeSelect?.addEventListener('change', () => {
            this.settings.playbackMode = modeSelect.value as PlaybackMode;
            this.callbacks.onPlaybackModeChanged(this.settings.playbackMode);
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

        // Checkboxes
        const muteCb = this.container.querySelector('#st_audio_mute') as HTMLInputElement;
        muteCb?.addEventListener('change', () => {
            this.settings.muted = muteCb.checked;
            this.callbacks.onSettingsChanged(this.settings);
        });

        const blurCb = this.container.querySelector('#st_audio_blur') as HTMLInputElement;
        blurCb?.addEventListener('change', () => {
            this.settings.pauseOnBlur = blurCb.checked;
            this.callbacks.onSettingsChanged(this.settings);
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
