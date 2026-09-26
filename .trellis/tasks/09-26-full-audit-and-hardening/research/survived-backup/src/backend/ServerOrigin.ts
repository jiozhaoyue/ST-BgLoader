import { MediaItem, MediaSource, MediaType } from '../types';
import { detectMediaType } from '../core/mediaType';

const MANIFEST_NAME = 'st-bg-loader-manifest.json';
const MANIFEST_VERSION = 1;

interface ManifestItem {
    id: string;
    filename: string | null;   // null = remote reference without a server file
    type: MediaType;
    source: string;
    remoteUrl: string | null;
    size: number;
    mimeType: string;
    addedTimestamp: number;
    lastUsedTimestamp: number;
    hasAudio: boolean;
}

interface Manifest {
    version: number;
    items: ManifestItem[];
}

export function mediaUrl(filename: string): string {
    return `backgrounds/${encodeURIComponent(filename)}`;
}

/**
 * Files the host keeps in `backgrounds/` for its own use. `/api/backgrounds/all` lists every
 * file in that directory, not only user backgrounds, so the site icon surfaced in our media
 * library as a junk card whose click would set `favicon.ico` as the background (audit M1).
 * This is a read-side filter only: nothing is deleted from the server or the manifest, the
 * entries simply never reach the library (the plugin cannot produce these names itself —
 * uploadFile renames a colliding name, so a deliberate user import is unaffected).
 */
const HOST_OWNED_FILENAMES = new Set(['favicon.ico']);

function isHostOwnedFilename(filename: string | null | undefined): boolean {
    return !!filename && HOST_OWNED_FILENAMES.has(filename.toLowerCase());
}

function serverCsrfHeaders(): Record<string, string> {
    try {
        const st = (window as unknown as { SillyTavern?: { getContext?: () => { getRequestHeaders?: (o?: { omitContentType?: boolean }) => Record<string, string> } } }).SillyTavern;
        const headers = st?.getContext?.().getRequestHeaders?.({ omitContentType: true });
        return headers ? { ...headers } : {};
    } catch {
        return {};
    }
}

/**
 * Reads a non-media JSON document from backgrounds/ (manifest, settings). Returns null
 * when the file is missing or unparsable — callers treat that as "first run".
 */
export async function readServerJson(filename: string): Promise<Record<string, unknown> | null> {
    try {
        const response = await fetch(`${mediaUrl(filename)}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return null;
        return JSON.parse(await response.text()) as Record<string, unknown>;
    } catch (err) {
        console.warn(`[ST-BgLoader] Server document "${filename}" is missing or unreadable:`, err);
        return null;
    }
}

/** Overwrites a non-media JSON document in backgrounds/ via the native upload endpoint. */
export async function writeServerJson(filename: string, data: unknown): Promise<void> {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const form = new FormData();
    form.append('avatar', new File([blob], filename, { type: 'application/json' }));
    const response = await fetch('/api/backgrounds/upload', { method: 'POST', headers: serverCsrfHeaders(), body: form });
    if (!response.ok) {
        throw new Error(`Server upload failed for "${filename}": HTTP ${response.status}`);
    }
}

export interface MediaPutInput {
    blob: Blob;
    name: string;
    type: MediaType;
    source: MediaSource;
    remoteUrl?: string;
}

// Same-origin media (the backgrounds/ static route) is trusted and fast; external hosts can
// stall indefinitely (blackholed DNS/connect), so their download is bounded.
const EXTERNAL_DOWNLOAD_TIMEOUT_MS = 60000;

/**
 * The only media source of truth: the SillyTavern server's own `backgrounds/` user directory,
 * exactly where the native background picker stores files (native upload/delete endpoints and
 * the native static route with HTTP Range streaming). Works with zero server-side changes and
 * with zero optional dependencies.
 *
 * Native `/all` lists images only, so non-image entries are cataloged in a manifest JSON that
 * lives in the same directory (the native listing ignores it; the plugin reads and rewrites it).
 */
export class ServerOrigin {
    private manifest: Manifest = { version: MANIFEST_VERSION, items: [] };
    // Serializes manifest writes: manifest mutations are synchronous on this single
    // instance, so queueing uploads guarantees the last write carries the newest state
    // and prevents redundant parallel POSTs (two rapid putMedia calls).
    private saveQueue: Promise<void> = Promise.resolve();
    // Short-lived catalog cache: listCatalog() POSTs /api/backgrounds/all on every call and sits
    // on the hot path (every getMedia, every setBackground). A TTL — rather than cache
    // invalidation alone — is the cheapest guard against changes made by the native picker,
    // which lives in the host's own code and cannot notify us.
    private catalogCache: { items: MediaItem[]; at: number } | null = null;
    private static readonly CATALOG_TTL_MS = 2000;

    public async init(): Promise<void> {
        try {
            const response = await fetch(`${mediaUrl(MANIFEST_NAME)}?t=${Date.now()}`, { cache: 'no-store' });
            if (response.ok) {
                const parsed = JSON.parse(await response.text()) as Manifest;
                if (parsed && Array.isArray(parsed.items)) {
                    this.manifest = { version: MANIFEST_VERSION, items: parsed.items };
                }
            }
        } catch (err) {
            console.warn('[ST-BgLoader] No server media manifest yet, starting a fresh one:', err);
            this.manifest = { version: MANIFEST_VERSION, items: [] };
        }
        console.log(`[ST-BgLoader] Server media library ready: ${this.manifest.items.length} cataloged entries.`);
    }

    public async listCatalog(): Promise<MediaItem[]> {
        const cached = this.catalogCache;
        if (cached && Date.now() - cached.at < ServerOrigin.CATALOG_TTL_MS) {
            return [...cached.items];
        }
        const items = await this.fetchCatalog();
        this.catalogCache = { items, at: Date.now() };
        return [...items];
    }

    /** Drops the catalog cache (own writes, or a host-side change the caller knows about). */
    public invalidateCatalog(): void {
        this.catalogCache = null;
    }

    private async fetchCatalog(): Promise<MediaItem[]> {
        const items = new Map<string, MediaItem>();

        // Native listing: images uploaded through the stock ST picker (or by us).
        try {
            const response = await fetch('/api/backgrounds/all', {
                method: 'POST',
                headers: { ...serverCsrfHeaders(), 'Content-Type': 'application/json' },
                body: '{}',
            });
            if (response.ok) {
                const data = await response.json() as { images?: { filename: string }[] };
                for (const img of data.images ?? []) {
                    if (isHostOwnedFilename(img.filename)) continue;
                    const type = detectMediaType(img.filename);
                    items.set(img.filename, {
                        id: 'native_' + img.filename,
                        name: img.filename,
                        type,
                        source: 'server',
                        url: mediaUrl(img.filename),
                        cacheKey: mediaUrl(img.filename),
                        size: 0,
                        mimeType: guessMimeType(img.filename, type),
                        addedTimestamp: 0,
                        lastUsedTimestamp: 0,
                        hasAudio: false,
                    });
                }
            }
        } catch (err) {
            console.warn('[ST-BgLoader] Native background listing unavailable:', err);
        }

        // Manifest entries (plugin uploads + remote references) win: they carry stable ids.
        // Host-owned names are skipped here too — an early release cataloged favicon.ico, and
        // that manifest entry would otherwise keep resurrecting the junk card.
        for (const entry of this.manifest.items) {
            if (entry.filename) {
                if (isHostOwnedFilename(entry.filename)) continue;
                items.set(entry.filename, this.manifestToItem(entry));
            } else if (entry.remoteUrl) {
                items.set(entry.id, {
                    id: entry.id,
                    name: entry.remoteUrl.split('/').pop() || entry.id,
                    type: entry.type,
                    source: 'url',
                    url: entry.remoteUrl,
                    cacheKey: entry.id,
                    size: entry.size,
                    mimeType: entry.mimeType,
                    addedTimestamp: entry.addedTimestamp,
                    lastUsedTimestamp: entry.lastUsedTimestamp,
                    hasAudio: entry.hasAudio,
                });
            }
        }
        return [...items.values()];
    }

    public async getCatalogItem(id: string): Promise<MediaItem | null> {
        const entry = this.manifest.items.find(i => i.id === id);
        if (entry) {
            // A host-owned name is not a library item even by direct id — e.g. a persisted
            // `activeMediaId` left over from the release that cataloged favicon.ico. Returning
            // null lets the caller's self-heal drop the dangling reference.
            return isHostOwnedFilename(entry.filename) ? null : this.manifestToItem(entry);
        }
        const catalog = await this.listCatalog();
        return catalog.find(i => i.id === id) ?? null;
    }

    public async putMedia(input: MediaPutInput): Promise<MediaItem> {
        const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const mimeType = input.blob.type || guessMimeType(input.name, input.type);

        // Remote reference without bytes (URL that could not be downloaded).
        if (input.source === 'url' && input.blob.size === 0 && input.remoteUrl) {
            const entry: ManifestItem = {
                id, filename: null, type: input.type, source: 'url', remoteUrl: input.remoteUrl,
                size: 0, mimeType, addedTimestamp: Date.now(), lastUsedTimestamp: Date.now(),
                hasAudio: input.type === 'video' || input.type === 'audio',
            };
            this.manifest.items.push(entry);
            await this.saveManifest();
            this.invalidateCatalog();
            return {
                id, name: input.name, type: input.type, source: 'url', url: input.remoteUrl, cacheKey: id,
                size: 0, mimeType, addedTimestamp: entry.addedTimestamp, lastUsedTimestamp: entry.lastUsedTimestamp,
                hasAudio: entry.hasAudio,
            };
        }

        const filename = await this.uploadFile(input.name, input.blob, mimeType);

        const entry: ManifestItem = {
            id, filename, type: input.type, source: input.source, remoteUrl: input.remoteUrl ?? null,
            size: input.blob.size, mimeType, addedTimestamp: Date.now(), lastUsedTimestamp: Date.now(),
            hasAudio: input.type === 'video' || input.type === 'audio',
        };
        this.manifest.items = this.manifest.items.filter(i => i.filename !== filename);
        this.manifest.items.push(entry);
        await this.saveManifest();
        this.invalidateCatalog();

        return this.manifestToItem(entry);
    }

    public async deleteMedia(id: string): Promise<void> {
        const entry = this.manifest.items.find(i => i.id === id);
        let filename = entry?.filename ?? null;

        if (!filename) {
            const item = await this.getCatalogItem(id);
            if (item?.url?.startsWith('backgrounds/')) {
                filename = decodeURIComponent(item.url.slice('backgrounds/'.length));
            }
        }
        if (!filename) {
            this.manifest.items = this.manifest.items.filter(i => i.id !== id);
            await this.saveManifest();
            this.invalidateCatalog();
            return;
        }

        const response = await fetch('/api/backgrounds/delete', {
            method: 'POST',
            headers: { ...serverCsrfHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ bg: filename }),
        });
        if (!response.ok) {
            throw new Error(`Server delete failed for "${filename}": HTTP ${response.status}`);
        }
        this.manifest.items = this.manifest.items.filter(i => i.id !== id && i.filename !== filename);
        await this.saveManifest();
        this.invalidateCatalog();
    }

    public async readMedia(item: MediaItem): Promise<Blob | null> {
        if (!item.url) return null;
        const response = await fetch(item.url, { cache: 'no-store' });
        return response.ok ? response.blob() : null;
    }

    public async findByUrl(url: string): Promise<MediaItem | null> {
        const entry = this.manifest.items.find(i => i.remoteUrl === url || mediaUrl(i.filename ?? '') === url);
        if (entry) return this.manifestToItem(entry);
        const catalog = await this.listCatalog();
        return catalog.find(i => i.url === url || i.cacheKey === url) ?? null;
    }

    /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
    public async download(url: string): Promise<Blob> {
        let absoluteUrl: URL | null = null;
        try {
            absoluteUrl = new URL(url, window.location.href);
        } catch { /* treated as relative */ }
        const isExternal = !!absoluteUrl && absoluteUrl.origin !== window.location.origin;

        const response = await fetch(url, isExternal
            ? { signal: AbortSignal.timeout(EXTERNAL_DOWNLOAD_TIMEOUT_MS) }
            : undefined);
        if (!response.ok) {
            throw new Error(`Failed to fetch media from ${url}: ${response.status} ${response.statusText}`);
        }
        return response.blob();
    }

    private async uploadFile(name: string, blob: Blob, mimeType: string): Promise<string> {
        let filename = sanitizeFilename(name || 'media');
        // The server overwrites same-name files: keep every upload distinct.
        if (await this.filenameExists(filename)) {
            const dot = filename.lastIndexOf('.');
            const base = dot > 0 ? filename.slice(0, dot) : filename;
            const ext = dot > 0 ? filename.slice(dot) : '';
            filename = `${base}_${Date.now()}${ext}`;
        }

        const form = new FormData();
        form.append('avatar', new File([blob], filename, { type: mimeType }));
        const response = await fetch('/api/backgrounds/upload', { method: 'POST', headers: serverCsrfHeaders(), body: form });
        if (!response.ok) {
            throw new Error(`Server upload failed: HTTP ${response.status}`);
        }
        return (await response.text()).trim() || filename;
    }

    private async filenameExists(filename: string): Promise<boolean> {
        if (this.manifest.items.some(i => i.filename === filename)) return true;
        try {
            const response = await fetch('/api/backgrounds/all', {
                method: 'POST',
                headers: { ...serverCsrfHeaders(), 'Content-Type': 'application/json' },
                body: '{}',
            });
            if (response.ok) {
                const data = await response.json() as { images?: { filename: string }[] };
                return (data.images ?? []).some(i => i.filename === filename);
            }
        } catch { /* fall through to upload; server keeps history-safe naming anyway */ }
        return false;
    }

    public saveManifest(): Promise<void> {
        const run = () => this.doSaveManifest();
        // A failed save must not poison the queue for the next caller.
        this.saveQueue = this.saveQueue.then(run, run);
        return this.saveQueue;
    }

    private async doSaveManifest(): Promise<void> {
        this.manifest.version = MANIFEST_VERSION;
        const blob = new Blob([JSON.stringify(this.manifest, null, 2)], { type: 'application/json' });
        try {
            const form = new FormData();
            form.append('avatar', new File([blob], MANIFEST_NAME, { type: 'application/json' }));
            const response = await fetch('/api/backgrounds/upload', { method: 'POST', headers: serverCsrfHeaders(), body: form });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            console.error('[ST-BgLoader] Failed to save server media manifest:', err);
            throw err;
        }
    }

    private manifestToItem(entry: ManifestItem): MediaItem {
        // 'url' entries keep their remote URL as the playback address (old semantics, streaming
        // straight from the source); the server file is the persistent mirror. Uploaded entries
        // point at the server path.
        const url = entry.source === 'url' && entry.remoteUrl
            ? entry.remoteUrl
            : (entry.filename ? mediaUrl(entry.filename) : (entry.remoteUrl ?? ''));
        return {
            id: entry.id,
            name: entry.filename || entry.remoteUrl || entry.id,
            type: entry.type,
            source: entry.source === 'url' ? 'url' : 'server',
            url,
            cacheKey: entry.filename ? mediaUrl(entry.filename) : entry.id,
            size: entry.size,
            mimeType: entry.mimeType,
            addedTimestamp: entry.addedTimestamp,
            lastUsedTimestamp: entry.lastUsedTimestamp,
            hasAudio: entry.hasAudio,
        };
    }
}

export function guessMimeType(name: string, type: MediaType): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'mp4': return 'video/mp4';
        case 'webm': return 'video/webm';
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'ogg': return 'audio/ogg';
        case 'flac': return 'audio/flac';
        case 'svg': return 'image/svg+xml';
        case 'html': return 'text/html';
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'webp': return 'image/webp';
        case 'gif': return 'image/gif';
        default:
            if (type === 'video') return 'video/mp4';
            if (type === 'audio') return 'audio/mpeg';
            if (type === 'svg') return 'image/svg+xml';
            if (type === 'html') return 'text/html';
            return 'image/png';
    }
}

function sanitizeFilename(name: string): string {
    // \p{L}\p{N} keeps CJK/unicode names readable (an ASCII-only allowlist turned every
    // Chinese filename into `______.mp4`); path separators, quotes and angle brackets
    // still collapse to `_`.
    return (name || 'media').replace(/[^\p{L}\p{N}._ -]/gu, '_');
}
