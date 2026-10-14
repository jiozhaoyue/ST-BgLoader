import { BgLoaderSettings } from '../types';
import { HostBridge } from '../bridge/HostBridge';
import { escapeHtml } from '../core/sanitize';

export interface SettingsDrawerCallbacks {
    onMasterToggle: (enabled: boolean) => void;
    onSettingsChanged: (settings: BgLoaderSettings) => void;
}

/**
 * SettingsDrawer:
 * The minimalist extension settings panel inside `#extensions_settings`.
 *
 * Per user mandate: only presents a single master toggle for ST-BgLoader,
 * a clean status summary, and a direct shortcut button to open the top bar background drawer.
 * All rich media and detailed settings are taken over inside the top bar `#Backgrounds` drawer.
 */
export class SettingsDrawer {
    private container: HTMLElement | null = null;
    private settings: BgLoaderSettings;
    private callbacks: SettingsDrawerCallbacks;
    private activeMediaName: string | null = null;

    constructor(
        settings: BgLoaderSettings,
        callbacks: SettingsDrawerCallbacks,
        activeMediaName?: string | null
    ) {
        this.settings = settings;
        this.callbacks = callbacks;
        this.activeMediaName = activeMediaName ?? null;
    }

    public updateActiveMedia(name: string | null): void {
        this.activeMediaName = name;
        const nameEl = this.container?.querySelector('#st_bgloader_active_name');
        if (nameEl) {
            nameEl.textContent = name || '默认 / 未设置';
        }
    }

    public syncMasterToggle(enabled: boolean): void {
        this.settings.enabled = enabled;
        const cb = this.container?.querySelector('#st_bgloader_master_enable') as HTMLInputElement | null;
        if (cb) cb.checked = enabled;

        const pill = this.container?.querySelector('#st_bgloader_status_pill');
        if (pill) {
            pill.className = `st-bgloader-status-pill ${enabled ? 'active' : ''}`;
            pill.textContent = enabled ? '已接管顶栏' : '未接管';
        }

        const openBtn = this.container?.querySelector('#st_bgloader_open_topbar_btn');
        if (openBtn) {
            openBtn.classList.toggle('st-bgloader-disabled', !enabled);
        }
    }

    public applyRemoteSettings(next: BgLoaderSettings): void {
        this.settings = next;
        this.syncMasterToggle(next.enabled);
    }

    public render(): void {
        const hostBridge = HostBridge.getInstance();
        const target = hostBridge.getExtensionsSettingsContainer();
        if (!target) {
            const observer = new MutationObserver(() => {
                if (hostBridge.getExtensionsSettingsContainer()) {
                    window.clearTimeout(giveUp);
                    observer.disconnect();
                    this.render();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            const giveUp = window.setTimeout(() => observer.disconnect(), 30000);
            return;
        }

        const existing = document.querySelector('#st_bgloader_settings');
        if (existing) existing.remove();

        const drawer = document.createElement('div');
        drawer.id = 'st_bgloader_settings';
        drawer.className = 'st-bgloader-panel';

        const activeName = this.activeMediaName || '默认 / 未设置';
        const isEnabled = this.settings.enabled ?? true;

        drawer.innerHTML = `
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-photo-film"></i> ST-BgLoader (富媒体背景与视听增强)</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="st-bgloader-master-card">
                        <div class="st-bgloader-master-row">
                            <label class="st-bgloader-check st-bgloader-master-label">
                                <input type="checkbox" id="st_bgloader_master_enable" ${isEnabled ? 'checked' : ''} />
                                <span><strong>启用 ST-BgLoader 背景增强与顶栏接管</strong></span>
                            </label>
                        </div>
                        <div class="st-bgloader-master-desc">
                            <small class="st-bgloader-dim-text">顶栏背景设置按钮已替换为本插件的背景存储与详细视听配置。</small>
                        </div>
                        <div class="st-bgloader-master-status">
                            <span>当前背景: <strong id="st_bgloader_active_name">${escapeHtml(activeName)}</strong></span>
                            <span class="st-bgloader-status-pill ${isEnabled ? 'active' : ''}" id="st_bgloader_status_pill">
                                ${isEnabled ? '已接管顶栏' : '未接管'}
                            </span>
                        </div>
                        <div class="st-bgloader-master-actions">
                            <button type="button" id="st_bgloader_open_topbar_btn" class="menu_button ${isEnabled ? '' : 'st-bgloader-disabled'}">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开背景与详细设置
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        target.appendChild(drawer);
        this.container = drawer;
        this.bindEvents();
    }

    private bindEvents(): void {
        if (!this.container) return;

        const masterCb = this.container.querySelector('#st_bgloader_master_enable') as HTMLInputElement | null;
        masterCb?.addEventListener('change', () => {
            const enabled = masterCb.checked;
            this.settings.enabled = enabled;
            this.syncMasterToggle(enabled);
            this.callbacks.onMasterToggle(enabled);
            this.callbacks.onSettingsChanged(this.settings);
        });

        const openBtn = this.container.querySelector('#st_bgloader_open_topbar_btn') as HTMLButtonElement | null;
        openBtn?.addEventListener('click', () => {
            if (!this.settings.enabled) return;
            HostBridge.getInstance().openBackgroundDrawer();
        });
    }
}
