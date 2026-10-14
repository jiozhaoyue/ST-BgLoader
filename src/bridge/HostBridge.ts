export type HostType = 'sillytavern' | 'luker' | 'puretavern' | 'tauritavern' | 'generic';

export interface HostBridgeInfo {
    hostType: HostType;
    displayName: string;
}

/**
 * HostBridge centralizes all platform and host-specific detection and DOM seams
 * for SillyTavern, Luker, PureTavern, and TauriTavern.
 *
 * Enforces rule L0-9: "Platform differences must be centralized in a single host-bridge
 * module, and must not scatter across business logic."
 */
export class HostBridge {
    private static instance: HostBridge | null = null;
    private readonly hostType: HostType;

    constructor() {
        this.hostType = this.detectHostType();
    }

    public static getInstance(): HostBridge {
        if (!HostBridge.instance) {
            HostBridge.instance = new HostBridge();
        }
        return HostBridge.instance;
    }

    private detectHostType(): HostType {
        if (typeof window === 'undefined') return 'generic';

        // 1. TauriTavern detection
        if (
            (window as any).__TAURI__ ||
            (window as any).__TAURI_METADATA__ ||
            (window as any).__TAURI_INVOKE__ ||
            navigator.userAgent.toLowerCase().includes('tauri')
        ) {
            return 'tauritavern';
        }

        // 2. PureTavern detection
        if (
            (window as any).PureTavern ||
            document.title.toLowerCase().includes('puretavern') ||
            document.querySelector('meta[name="puretavern"]')
        ) {
            return 'puretavern';
        }

        // 3. Luker detection
        if (
            (window as any).Luker ||
            document.title.toLowerCase().includes('luker') ||
            document.querySelector('meta[name="luker"]')
        ) {
            return 'luker';
        }

        // 4. SillyTavern detection
        if ((window as any).SillyTavern) {
            return 'sillytavern';
        }

        return 'generic';
    }

    public getHostType(): HostType {
        return this.hostType;
    }

    public getDisplayName(): string {
        switch (this.hostType) {
            case 'sillytavern': return 'SillyTavern';
            case 'luker': return 'Luker';
            case 'puretavern': return 'PureTavern';
            case 'tauritavern': return 'TauriTavern';
            default: return 'Tavern Host';
        }
    }

    /**
     * Resolves the top bar toggle button for background selection.
     */
    public getTopbarBackgroundButton(): HTMLElement | null {
        return (
            document.querySelector<HTMLElement>('#backgrounds-drawer-toggle') ||
            document.querySelector<HTMLElement>('#backgrounds-button .drawer-toggle') ||
            document.querySelector<HTMLElement>('#expression-holder') ||
            null
        );
    }

    /**
     * Resolves the container for the background drawer.
     */
    public getBackgroundDrawer(): HTMLElement | null {
        return document.querySelector<HTMLElement>('#Backgrounds');
    }

    /**
     * Resolves the container for native background elements list.
     */
    public getNativeMenuContent(): HTMLElement | null {
        return document.querySelector<HTMLElement>('#bg_menu_content');
    }

    /**
     * Resolves the container for extension settings.
     */
    public getExtensionsSettingsContainer(): HTMLElement | null {
        return document.querySelector<HTMLElement>('#extensions_settings');
    }

    /**
     * Programmatically opens the native background drawer if closed.
     */
    public openBackgroundDrawer(): boolean {
        const drawer = this.getBackgroundDrawer();
        const toggle = this.getTopbarBackgroundButton();
        if (!drawer || !toggle) return false;

        if (!drawer.classList.contains('openDrawer')) {
            toggle.click();
            return true;
        }
        return true;
    }

    /**
     * Programmatically closes the native background drawer if open.
     */
    public closeBackgroundDrawer(): void {
        const drawer = this.getBackgroundDrawer();
        const toggle = this.getTopbarBackgroundButton();
        if (drawer && drawer.classList.contains('openDrawer') && toggle) {
            toggle.click();
        }
    }

    /**
     * Provides safe CSRF and authentication request headers.
     */
    public getRequestHeaders(options: { omitContentType?: boolean } = { omitContentType: true }): Record<string, string> {
        try {
            const st = (window as any).SillyTavern;
            const headers = st?.getContext?.().getRequestHeaders?.(options);
            return headers ? { ...headers } : {};
        } catch {
            return {};
        }
    }

    /**
     * Returns the host's public context API if available.
     */
    public getContext(): any {
        try {
            return (window as any).SillyTavern?.getContext?.() || null;
        } catch {
            return null;
        }
    }
}
