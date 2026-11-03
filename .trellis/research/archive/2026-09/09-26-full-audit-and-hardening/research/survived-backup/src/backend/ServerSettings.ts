import { BgLoaderSettings } from '../types';
import { readServerJson, writeServerJson } from './ServerOrigin';

export const SETTINGS_FILE = 'st-bg-loader-settings.json';

export interface ServerSettingsDoc {
    version: number;
    revision: number;
    updatedTimestamp: number;
    settings: BgLoaderSettings;
}

interface SavePayload {
    settings: BgLoaderSettings;
    revision: number;
}

const DOC_VERSION = 1;
// Coalesces settings churn (every background switch bumps activeMediaId) into one
// trailing write per quiet period.
const SAVE_DEBOUNCE_MS = 800;

/**
 * The server-side settings document: the durable copy of the full settings object,
 * stored in backgrounds/ next to the media manifest. localStorage stays the fast cache
 * and the degraded fallback; with this module the plugin is fully backend-stored even
 * without the optional Authority enhancement.
 */
export class ServerSettings {
    private saveTimer: number | null = null;
    private pending: SavePayload | null = null;
    private writing = false;
    private warnedAboutWriteFailure = false;
    /** Invoked when a newer server document (another tab/device) beats the pending write. */
    public onRemoteNewer: ((doc: ServerSettingsDoc) => void) | null = null;

    /** Returns the server document, or null when it is missing/unparsable (first run). */
    public async load(): Promise<ServerSettingsDoc | null> {
        const doc = await readServerJson(SETTINGS_FILE) as ServerSettingsDoc | null;
        if (!doc || typeof doc !== 'object' || !doc.settings || typeof doc.revision !== 'number') {
            return null;
        }
        return doc;
    }

    public scheduleSave(settings: BgLoaderSettings, revision: number): void {
        this.pending = { settings, revision };
        if (this.saveTimer !== null) {
            window.clearTimeout(this.saveTimer);
        }
        this.saveTimer = window.setTimeout(() => {
            this.saveTimer = null;
            void this.flush();
        }, SAVE_DEBOUNCE_MS);
    }

    /** Resolves once every scheduled write has been attempted (test hook). */
    public async flush(): Promise<void> {
        if (this.saveTimer !== null) {
            window.clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        if (this.writing) {
            return;
        }
        this.writing = true;
        try {
            while (this.pending) {
                const payload = this.pending;
                this.pending = null;
                try {
                    // Conflict detection: another tab/device may have written a newer
                    // revision between our load and this flush — their copy wins, ours
                    // would silently revert it.
                    const remote = await this.load();
                    if (remote && remote.revision > payload.revision) {
                        this.onRemoteNewer?.(remote);
                        break;
                    }
                    await writeServerJson(SETTINGS_FILE, this.toDoc(payload));
                    this.warnedAboutWriteFailure = false;
                } catch (err) {
                    if (!this.warnedAboutWriteFailure) {
                        this.warnedAboutWriteFailure = true;
                        console.warn('[ST-BgLoader] Server settings write failed; localStorage stays the durable copy:', err);
                    }
                    break;
                }
            }
        } finally {
            this.writing = false;
        }
    }

    private toDoc(payload: SavePayload): ServerSettingsDoc {
        return {
            version: DOC_VERSION,
            revision: payload.revision,
            updatedTimestamp: Date.now(),
            settings: payload.settings,
        };
    }
}
