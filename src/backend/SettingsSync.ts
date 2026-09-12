import { BgLoaderSettings } from '../types';
import { AuthorityClientLike } from './AuthorityBridge';

const KV_REVISION_KEY = 'settings:rev';
const KV_PAYLOAD_KEY = 'settings:data';
const PUSH_DEBOUNCE_MS = 2000;
const POLL_INTERVAL_MS = 10000;

interface SettingsPayload {
    revision: number;
    fingerprint: string;
    updatedAt: number;
    settings: BgLoaderSettings;
}

/**
 * Cross-device settings/scene/playlist sync. The local copy stays authoritative for the running
 * session (localStorage-first, unchanged); a server mirror under storage.kv keeps every device of
 * the same user converging: pushes are debounced, remote changes win when their revision is newer,
 * and fingerprints prevent echo loops. Authority's public layer has no publish API, so remote
 * changes are noticed via a cheap revision poll instead of an SSE push.
 */
export class SettingsSync {
    private pushTimer: number | null = null;
    private pollTimer: number | null = null;
    private localRevision = 0;
    private lastPushedFingerprint = '';
    private applyingRemote = false;
    private running = false;

    constructor(
        private client: AuthorityClientLike,
        private onRemoteSettings: (settings: BgLoaderSettings) => void,
    ) {}

    public async start(): Promise<void> {
        if (this.running) return;
        this.running = true;

        // Pull the newest cloud revision once at startup; cloud wins only if the local session
        // has not diverged yet (fresh page load always converges to the cloud copy).
        try {
            const remote = await this.readPayload();
            if (remote) {
                this.localRevision = remote.revision;
                this.lastPushedFingerprint = remote.fingerprint;
                this.applyingRemote = true;
                try {
                    this.onRemoteSettings(remote.settings);
                } finally {
                    this.applyingRemote = false;
                }
                console.log('[ST-BgLoader] Settings restored from cloud mirror, revision', remote.revision);
            }
        } catch (err) {
            console.warn('[ST-BgLoader] Failed to read cloud settings mirror:', err);
        }

        this.pollTimer = window.setInterval(() => void this.pollOnce(), POLL_INTERVAL_MS);
    }

    public stop(): void {
        if (this.pollTimer !== null) window.clearInterval(this.pollTimer);
        if (this.pushTimer !== null) window.clearTimeout(this.pushTimer);
        this.pollTimer = null;
        this.pushTimer = null;
        this.running = false;
    }

    public schedulePush(settings: BgLoaderSettings): void {
        if (!this.running || this.applyingRemote) return;
        if (this.pushTimer !== null) window.clearTimeout(this.pushTimer);
        this.pushTimer = window.setTimeout(() => {
            this.pushTimer = null;
            void this.push(settings);
        }, PUSH_DEBOUNCE_MS);
    }

    private async push(settings: BgLoaderSettings): Promise<void> {
        try {
            const json = JSON.stringify(settings);
            const fingerprint = await fingerprintOf(json);
            if (fingerprint === this.lastPushedFingerprint) return;

            const revision = this.localRevision + 1;
            const payload: SettingsPayload = {
                revision,
                fingerprint,
                updatedAt: Date.now(),
                settings,
            };
            await this.client.storage.kv.set(KV_PAYLOAD_KEY, payload);
            await this.client.storage.kv.set(KV_REVISION_KEY, revision);
            this.localRevision = revision;
            this.lastPushedFingerprint = fingerprint;
        } catch (err) {
            console.warn('[ST-BgLoader] Failed to push settings to cloud mirror:', err);
        }
    }

    private async pollOnce(): Promise<void> {
        if (this.applyingRemote) return;
        try {
            const revisionValue = await this.client.storage.kv.get(KV_REVISION_KEY);
            const revision = typeof revisionValue === 'number' ? revisionValue : 0;
            if (revision <= this.localRevision) return;

            const remote = await this.readPayload();
            if (!remote || remote.revision <= this.localRevision) return;
            if (remote.fingerprint === this.lastPushedFingerprint) {
                // Our own push echoed back from another device — converge silently.
                this.localRevision = remote.revision;
                return;
            }

            this.applyingRemote = true;
            try {
                this.onRemoteSettings(remote.settings);
            } finally {
                this.applyingRemote = false;
            }
            this.localRevision = remote.revision;
            this.lastPushedFingerprint = remote.fingerprint;
            console.log('[ST-BgLoader] Applied cloud settings change, revision', remote.revision);
        } catch (err) {
            console.warn('[ST-BgLoader] Settings sync poll failed:', err);
        }
    }

    private async readPayload(): Promise<SettingsPayload | null> {
        const value = await this.client.storage.kv.get(KV_PAYLOAD_KEY);
        if (!value || typeof value !== 'object') return null;
        const payload = value as Partial<SettingsPayload>;
        if (typeof payload.revision !== 'number' || !payload.settings || typeof payload.fingerprint !== 'string') {
            return null;
        }
        return payload as SettingsPayload;
    }
}

async function fingerprintOf(text: string): Promise<string> {
    try {
        if (crypto?.subtle) {
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
            return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
    } catch {
        // Non-secure context — fall through to the cheap hash.
    }
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }
    return 'djb2:' + (hash >>> 0).toString(16);
}
