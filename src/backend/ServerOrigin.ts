import { MediaItem, MediaType } from '../types';
import { guessMimeType } from './LocalOrigin';
import { MediaOrigin, MediaPutInput } from './MediaOrigin';

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
 * The only media source of truth: the SillyTavern server's own `backgrounds/` user directory,
 * exactly where the native background picker stores files (native upload/delete endpoints and
 * the native static route with HTTP Range streaming). Works with zero server-side changes and
 * with zero optional dependencies.
 *
 * Native `/all` lists images only, so non-image entries are cataloged in a manifest JSON that
 * lives in the same directory (the native listing ignores it; the plugin reads and rewrites it).
 */
export class ServerOrigin implements MediaOrigin {
    public readonly kind = 'server' as const;
    private manifest: Manifest = { version: MANIFEST_VERSION, items: [] };

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
        const items = new Map<string, MediaItem>();

        // Native listing: images uploaded through the stock ST picker (or by us).
        try {
            const response = await fetch('/api/backgrounds/all', {
                method: 'POST',
                headers: { ...this.csrfHeaders(), 'Content-Type': 'application/json' },
                body: '{}',
            });
            if (response.ok) {
                const data = await response.json() as { images?: { filename: string }[] };
                for (const img of data.images ?? []) {
                    const type = detectType(img.filename);
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
        for (const entry of this.manifest.items) {
            if (entry.filename) {
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
        if (entry) return this.manifestToItem(entry);
        const catalog = await this.listCatalog();
        return catalog.find(i => i.id === id) ?? null;
    }

    public async putMedia(input: MediaPutInput): Promise<MediaItem> {
        const id = input.id ?? 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
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
            return;
        }

        const response = await fetch('/api/backgrounds/delete', {
            method: 'POST',
            headers: { ...this.csrfHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ bg: filename }),
        });
        if (!response.ok) {
            throw new Error(`Server delete failed for "${filename}": HTTP ${response.status}`);
        }
        this.manifest.items = this.manifest.items.filter(i => i.id !== id && i.filename !== filename);
        await this.saveManifest();
    }

    public async readMedia(item: MediaItem): Promise<Blob | null> {
        if (!item.url) return null;
        const response = await fetch(item.url, { cache: 'no-store' });
        return response.ok ? response.blob() : null;
    }

    public async touchMedia(_id: string, _timestamp: number): Promise<void> {
        // LRU is a browser-cache concern (see CacheManager index); the server library is never evicted.
    }

    public async findByUrl(url: string): Promise<MediaItem | null> {
        const entry = this.manifest.items.find(i => i.remoteUrl === url || mediaUrl(i.filename ?? '') === url);
        if (entry) return this.manifestToItem(entry);
        const catalog = await this.listCatalog();
        return catalog.find(i => i.url === url || i.cacheKey === url) ?? null;
    }

    /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
    public async download(url: string): Promise<Blob> {
        const response = await fetch(url);
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
        const response = await fetch('/api/backgrounds/upload', { method: 'POST', headers: this.csrfHeaders(), body: form });
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
                headers: { ...this.csrfHeaders(), 'Content-Type': 'application/json' },
                body: '{}',
            });
            if (response.ok) {
                const data = await response.json() as { images?: { filename: string }[] };
                return (data.images ?? []).some(i => i.filename === filename);
            }
        } catch { /* fall through to upload; server keeps history-safe naming anyway */ }
        return false;
    }

    private async saveManifest(): Promise<void> {
        this.manifest.version = MANIFEST_VERSION;
        const blob = new Blob([JSON.stringify(this.manifest, null, 2)], { type: 'application/json' });
        try {
            const form = new FormData();
            form.append('avatar', new File([blob], MANIFEST_NAME, { type: 'application/json' }));
            const response = await fetch('/api/backgrounds/upload', { method: 'POST', headers: this.csrfHeaders(), body: form });
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
            source: (entry.source as MediaItem['source']) || 'server',
            url,
            cacheKey: entry.filename ? mediaUrl(entry.filename) : entry.id,
            size: entry.size,
            mimeType: entry.mimeType,
            addedTimestamp: entry.addedTimestamp,
            lastUsedTimestamp: entry.lastUsedTimestamp,
            hasAudio: entry.hasAudio,
        };
    }

    private csrfHeaders(): Record<string, string> {
        try {
            const st = (window as unknown as { SillyTavern?: { getContext?: () => { getRequestHeaders?: (o?: { omitContentType?: boolean }) => Record<string, string> } } }).SillyTavern;
            const headers = st?.getContext?.().getRequestHeaders?.({ omitContentType: true });
            return headers ? { ...headers } : {};
        } catch {
            return {};
        }
    }
}

function detectType(filename: string): MediaType {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
    if (ext === 'html' || ext === 'htm') return 'html';
    if (ext === 'svg') return 'svg';
    return 'image';
}

function sanitizeFilename(name: string): string {
    return (name || 'media').replace(/[^a-zA-Z0-9._ -]/g, '_');
}
