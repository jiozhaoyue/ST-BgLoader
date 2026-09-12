/**
 * Structural typing of the Authority SDK runtime surface (window.STAuthority.AuthoritySDK).
 * Authority is an optional server plugin (Youzini-afk/ST-Delegation-of-authority); it is never
 * bundled with ST-BgLoader, so its types are mirrored here instead of imported.
 * Verified against packages/sdk-extension/src/client.ts and packages/shared-types/src/*.ts.
 */
export interface AuthorityKvApi {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Record<string, unknown>>;
}

export interface AuthorityBlobRecord {
    id: string;
    name: string;
    contentType: string;
    size: number;
    updatedAt: string;
}

export interface AuthorityBlobApi {
    put(input: { name: string; content: string; encoding?: 'utf8' | 'base64'; contentType?: string }): Promise<AuthorityBlobRecord>;
    get(id: string): Promise<{ record: AuthorityBlobRecord; content: string; encoding: 'base64' }>;
    delete(id: string): Promise<void>;
    list(): Promise<AuthorityBlobRecord[]>;
}

export type AuthoritySqlValue = string | number | boolean | null;

export interface AuthoritySqlQueryResult {
    kind: 'query';
    columns: string[];
    rows: Record<string, AuthoritySqlValue>[];
    rowCount: number;
}

export interface AuthoritySqlApi {
    query(input: { database?: string; statement: string; params?: AuthoritySqlValue[] }): Promise<AuthoritySqlQueryResult>;
    exec(input: { database?: string; statement: string; params?: AuthoritySqlValue[] }): Promise<{ kind: 'exec'; rowsAffected: number }>;
    migrate(input: { database?: string; migrations: { id: string; statement: string }[]; tableName?: string }): Promise<{ applied: string[]; skipped: string[] }>;
    backup?(input?: { database?: string }): Promise<unknown>;
}

export interface AuthorityHttpApi {
    fetch(input: { url: string; method?: string; headers?: Record<string, string>; body?: string; bodyEncoding?: string }): Promise<{
        url: string;
        hostname: string;
        status: number;
        ok: boolean;
        headers: Record<string, string>;
        body: string;
        bodyEncoding: string;
        contentType: string;
    }>;
}

export interface AuthorityJobsApi {
    create(type: string, payload?: Record<string, unknown>, options?: { delayMs?: number }): Promise<{ id: string }>;
    waitForCompletion?(id: string, options?: { timeoutMs?: number }): Promise<unknown>;
}

export interface AuthorityEventsSubscription {
    close(): void;
}

export interface AuthorityEventsApi {
    subscribe(options: { channel?: string; eventNames?: string[]; onEvent?: (event: { name: string; data: unknown }) => void }): Promise<AuthorityEventsSubscription>;
}

export interface AuthorityClientLike {
    storage: {
        kv: AuthorityKvApi;
        blob: AuthorityBlobApi;
    };
    sql: AuthoritySqlApi;
    http: AuthorityHttpApi;
    jobs: AuthorityJobsApi;
    events: AuthorityEventsApi;
    getSession(): unknown;
    getCapabilities(): Record<string, unknown>;
}

export interface AuthoritySdkLike {
    init(config: {
        extensionId: string;
        displayName: string;
        version: string;
        installType: 'local';
        uiLabel: string;
        declaredPermissions: DeclaredPermissionsLike;
    }): Promise<AuthorityClientLike>;
}

export interface DeclaredPermissionsLike {
    storage?: { kv?: boolean; blob?: boolean };
    sql?: { private?: boolean | string[] };
    http?: { allow?: string[] };
    jobs?: { background?: boolean | string[] };
    events?: { channels?: boolean | string[] };
    agent?: { browser?: boolean | string[] };
}

export type AuthorityDegradedReason = 'sdk-missing' | 'init-failed' | 'permission-denied';

export interface AuthorityCapabilities {
    available: boolean;
    /** Server-backed media catalog + binaries (sql.private + storage.blob). */
    cloudLibrary: boolean;
    /** Settings/scene cross-device sync (storage.kv). */
    sync: boolean;
    /** Server-side HTTP import (http.fetch). */
    serverFetch: boolean;
    /** Agent ambient tools registration (agent.browser); gated separately by a user setting. */
    agentTools: boolean;
    degradedReason?: AuthorityDegradedReason;
    degradedMessage?: string;
}

const SETTINGS_CHANNEL = 'extension:third-party/ST-BgLoader';
const NOTICE_KEY = 'st_bgloader_cloud_notice_v1';

/**
 * Detects the optional Authority backend, initializes an isolated session for this extension,
 * and reports capability flags. Never throws: every failure degrades to local mode exactly once.
 */
export class AuthorityBridge {
    public static readonly EXTENSION_ID = 'third-party/ST-BgLoader';
    public static readonly CHANNEL = SETTINGS_CHANNEL;

    private client: AuthorityClientLike | null = null;
    private caps: AuthorityCapabilities = {
        available: false,
        cloudLibrary: false,
        sync: false,
        serverFetch: false,
        agentTools: false,
        degradedReason: 'sdk-missing',
    };
    private httpAllow: string[] = [];
    private initPromise: Promise<AuthorityCapabilities> | null = null;

    public getCapabilities(): AuthorityCapabilities {
        return this.caps;
    }

    public getClient(): AuthorityClientLike | null {
        return this.client;
    }

    public async detectAndInit(): Promise<AuthorityCapabilities> {
        if (this.initPromise) return this.initPromise;
        this.initPromise = this.doInit();
        return this.initPromise;
    }

    /** Re-init after adding a hostname to the http.allow declaration (SDK init is idempotent per extensionId). */
    public async ensureHttpAllowed(hostname: string): Promise<boolean> {
        if (!this.caps.serverFetch || !this.caps.available) return false;
        const host = hostname.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
        if (!host || this.httpAllow.includes(host)) return true;
        this.httpAllow.push(host);
        try {
            await this.doInit();
            return this.caps.serverFetch;
        } catch {
            return false;
        }
    }

    private async doInit(): Promise<AuthorityCapabilities> {
        try {
            const sdk = (window as unknown as { STAuthority?: { AuthoritySDK?: AuthoritySdkLike } }).STAuthority?.AuthoritySDK;
            if (!sdk) {
                return this.degrade('sdk-missing', '未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）');
            }

            this.client = await sdk.init({
                extensionId: AuthorityBridge.EXTENSION_ID,
                displayName: 'ST-BgLoader',
                version: '1.0.0',
                installType: 'local',
                uiLabel: 'ST-BgLoader',
                declaredPermissions: {
                    storage: { kv: true, blob: true },
                    sql: { private: true },
                    http: { allow: [...this.httpAllow] },
                    jobs: { background: ['delay', 'sql.backup'] },
                    events: { channels: [AuthorityBridge.CHANNEL] },
                },
            });

            this.caps = {
                available: true,
                cloudLibrary: true,
                sync: true,
                serverFetch: true,
                agentTools: true,
            };
            console.log('[ST-BgLoader] Authority backend connected:', this.client.getSession());
            return this.caps;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const denied = /permission|denied|forbidden/i.test(message);
            console.warn('[ST-BgLoader] Authority unavailable, falling back to local mode:', message);
            this.client = null;
            return this.degrade(
                denied ? 'permission-denied' : 'init-failed',
                denied ? 'Authority 权限被拒绝，媒体库运行于本地模式' : 'Authority 连接失败，媒体库运行于本地模式',
            );
        }
    }

    private degrade(reason: AuthorityDegradedReason, message: string): AuthorityCapabilities {
        this.caps = {
            available: false,
            cloudLibrary: false,
            sync: false,
            serverFetch: false,
            agentTools: false,
            degradedReason: reason,
            degradedMessage: message,
        };
        this.notifyOnce(reason, message);
        return this.caps;
    }

    /** One-time silent-degradation notice (user-confirmed strategy): toastr when available, console otherwise. */
    private notifyOnce(reason: AuthorityDegradedReason, message: string): void {
        console.info(`[ST-BgLoader] ${message} (${reason})`);
        try {
            if (localStorage.getItem(NOTICE_KEY)) return;
            localStorage.setItem(NOTICE_KEY, new Date().toISOString());
            const toastr = (window as unknown as { toastr?: { info(msg: string, title?: string): void } }).toastr;
            if (reason === 'sdk-missing') {
                toastr?.info(message, 'ST-BgLoader');
            } else {
                toastr?.info(message, 'ST-BgLoader');
            }
        } catch {
            // localStorage/toastr unavailable — console notice above is enough.
        }
    }
}

const BASE64_CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK));
    }
    return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
