export type HostType = 'sillytavern' | 'luker' | 'puretavern' | 'tauritavern' | 'generic';

export interface HostBridgeInfo {
    hostType: HostType;
    displayName: string;
}

/**
 * 宿主能力键：业务层只认能力，禁止按宿主名分支（D-01）。
 * 每项均为运行时特性检测结果，而非从 hostType 字符串推导。
 */
export type HostCapability =
    | 'contextApi'
    | 'requestHeaders'
    | 'genericPopup'
    | 'nativeBackgroundDrawer'
    | 'extensionsSettings';

/** 能力探测结果（detect 后缓存，只读）。 */
export type HostCapabilities = Readonly<Record<HostCapability, boolean>>;

/** 能力显式声明清单：新增能力必须同时在此登记并补探测函数。 */
export const HOST_CAPABILITIES: readonly HostCapability[] = [
    'contextApi',
    'requestHeaders',
    'genericPopup',
    'nativeBackgroundDrawer',
    'extensionsSettings',
];

/** 能力探测函数表：集中在宿主桥内做特性检测，业务层不可见。 */
type CapabilityProbe = (self: HostBridge) => boolean;
const CAPABILITY_PROBES: Readonly<Record<HostCapability, CapabilityProbe>> = {
    contextApi: () => typeof (window as any)?.SillyTavern?.getContext === 'function',
    requestHeaders: () => typeof (window as any)?.SillyTavern?.getContext?.()?.getRequestHeaders === 'function',
    genericPopup: (self) => typeof self.getContext()?.callGenericPopup === 'function',
    nativeBackgroundDrawer: () => !!document.querySelector('#Backgrounds'),
    extensionsSettings: () => !!document.querySelector('#extensions_settings'),
};

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
    private readonly capabilities: HostCapabilities;

    constructor() {
        this.hostType = this.detectHostType();
        this.capabilities = this.detectCapabilities();
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

    /**
     * 逐项运行能力探测并缓存结果（构造期一次性）。
     * 仅做特性检测，不按 hostType 推导，业务层据此查询即可（D-01）。
     */
    private detectCapabilities(): HostCapabilities {
        const result = {} as Record<HostCapability, boolean>;
        for (const key of HOST_CAPABILITIES) {
            let hit = false;
            try {
                hit = CAPABILITY_PROBES[key](this) === true;
            } catch {
                hit = false;
            }
            result[key] = hit;
        }
        return result as HostCapabilities;
    }

    /** 返回全部宿主能力探测结果（只读快照）。 */
    public getCapabilities(): HostCapabilities {
        return { ...this.capabilities };
    }

    /** 查询单项宿主能力是否可用；未登记的能力返回 false。 */
    public hasCapability(key: HostCapability): boolean {
        return this.capabilities[key] === true;
    }

    /** 宿主是否具备官方弹窗能力（业务层据此选择弹窗适配路径）。 */
    public canUseGenericPopup(): boolean {
        return this.hasCapability('genericPopup');
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

    // ------------------------------------------------------------------
    // 官方 Popup 适配器（D-06）：统一弹窗入口，业务层禁止直接调 alert/confirm/prompt。
    // 优先宿主 context 的 callGenericPopup（官方扩展 API，POPUP_TYPE：
    // TEXT=0 / CONFIRM=1 / INPUT=2，CONFIRM 返回 AFFIRMATIVE=1 / NEGATIVE=0），
    // 不可用或异常时逐级降级（D-03 链），永不抛错。降级终点是原生弹窗——
    // 本文件在 src/bridge/，不属于 src/ui 弹窗门禁扫描面。
    // ------------------------------------------------------------------

    public async alertDialog(message: string): Promise<void> {
        const popup = this.getContext()?.callGenericPopup;
        if (typeof popup === 'function') {
            try {
                await popup(message, 0);
                return;
            } catch { /* 降级到原生 */ }
        }
        window.alert(message);
    }

    public async confirmDialog(message: string): Promise<boolean> {
        const popup = this.getContext()?.callGenericPopup;
        if (typeof popup === 'function') {
            try {
                const result = await popup(message, 1);
                // 严格白名单：非 1/true 一律视为未确认（技术面复检 B）
                return result === true || result === 1;
            } catch { /* 降级到原生 */ }
        }
        return window.confirm(message);
    }

    public async promptDialog(message: string): Promise<string | null> {
        const popup = this.getContext()?.callGenericPopup;
        if (typeof popup === 'function') {
            try {
                const result = await popup(message, 2);
                return typeof result === 'string' ? result : null;
            } catch { /* 降级到原生 */ }
        }
        return window.prompt(message);
    }
}
