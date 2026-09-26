import { MediaItem, MediaType, MediaSource } from '../types';
import { ServerOrigin, guessMimeType } from '../backend/ServerOrigin';
import { RemoteImporter } from '../backend/RemoteImporter';
import { AuthorityBridge } from '../backend/AuthorityBridge';
import { detectMediaType } from '../core/mediaType';

const CACHE_NAME = 'st-bg-cache-v1';
const INDEX_DB_NAME = 'st_bg_cache_index';
const INDEX_STORE = 'entries';

interface CacheIndexEntry {
    cacheKey: string;
    lastUsed: number;
    size: number;
}

/** An object URL handed out for an item, plus the cache entry it points at. */
interface ObjectUrlEntry {
    url: string;
    cacheKey: string;
}

/**
 * Media library facade over the server origin.
 *
 * Storage model: the ONLY source of truth is the SillyTavern server's backgrounds/ directory
 * (ServerOrigin, native endpoints + Range streaming). The browser keeps a pure, evictable hot
 * cache: CacheStorage for bytes plus a tiny IndexedDB index (lastUsed/size) for LRU and usage
 * stats. Cache maintenance never touches server files; server files are only removed by an
 * explicit user delete.
 */
export class CacheManager {
    private origin: ServerOrigin;
    private remoteImporter: RemoteImporter | null = null;
    private l1: Cache | null = null;
    private indexDb: IDBDatabase | null = null;
    // E3: bounded by cache-entry eviction (see evictCacheEntry) instead of growing for the whole
    // session. The cacheKey is stored next to the blob URL so eviction can release exactly the
    // object URLs that point at the evicted entry.
    private objectUrls: Map<string, ObjectUrlEntry> = new Map();
    // E2: in-memory mirror of the IndexedDB LRU index. touchCache() sits on the
    // getMediaBlobUrl() hot path and used to run a full `getAll()` plus a write-back per call;
    // the mirror is read once on first use and kept in sync by indexPut/indexDelete/indexClear.
    // Multi-tab caveat: another tab can rewrite the store behind our back, so the entry point
    // that makes a decision from it (cleanLRU) re-reads it first.
    private indexMirror: Map<string, CacheIndexEntry> | null = null;

    constructor() {
        this.origin = new ServerOrigin();
    }

    public async init(bridge?: AuthorityBridge): Promise<void> {
        if ('caches' in window) {
            this.l1 = await caches.open(CACHE_NAME);
        }
        await this.openIndex();

        if (bridge) {
            const caps = await bridge.detectAndInit();
            if (caps.available && bridge.getClient()) {
                // Enhancement layer only: settings sync, agent tools, CORS-fallback imports.
                this.remoteImporter = new RemoteImporter(bridge);
            }
        }

        await this.origin.init();
        console.log('[ST-BgLoader] Media library source of truth: server backgrounds/ directory (browser keeps cache only).');
    }

    public async listMedia(): Promise<MediaItem[]> {
        return this.origin.listCatalog();
    }

    public async getMedia(id: string): Promise<MediaItem | null> {
        return this.origin.getCatalogItem(id);
    }

    public async saveMedia(
        content: Blob | File | string,
        name: string,
        type: MediaType,
        source: MediaSource,
        remoteUrl?: string
    ): Promise<MediaItem> {
        let blob = typeof content === 'string'
            ? new Blob([content], { type: type === 'svg' ? 'image/svg+xml' : 'text/html' })
            : content;

        // URL imports without bytes: download the media so it lives on the server like
        // everything else; fall back to a remote reference (or a server-side import when
        // Authority can bypass CORS) only if the browser cannot reach it.
        if (source === 'url' && blob.size === 0 && remoteUrl) {
            blob = await this.fetchForStorage(remoteUrl).catch(() => new Blob([]));
        }

        const item = await this.origin.putMedia({ blob, name, type, source, remoteUrl });
        await this.backfillCache(item, blob);
        return item;
    }

    public async getMediaBlobUrl(item: MediaItem): Promise<string> {
        const existing = this.objectUrls.get(item.id);
        if (existing) {
            await this.touchCache(item.cacheKey);
            return existing.url;
        }

        // Hot cache hit: instant playback from local bytes.
        if (this.l1) {
            const hit = await this.l1.match(item.cacheKey);
            if (hit) {
                const blob = await hit.blob();
                const blobUrl = URL.createObjectURL(blob);
                this.objectUrls.set(item.id, { url: blobUrl, cacheKey: item.cacheKey });
                await this.touchCache(item.cacheKey);
                return blobUrl;
            }
        }

        // Cache miss: stream directly from the server (same-origin, HTTP Range, hardware decode).
        await this.touchCache(item.cacheKey);
        return item.url;
    }

    public async deleteMedia(id: string): Promise<void> {
        const item = await this.getMedia(id);
        await this.origin.deleteMedia(id);

        if (item) {
            await this.evictCacheEntry(item.cacheKey);
        }
        // Release anything still tracked under this id: evictCacheEntry only covers the entries
        // of a cacheKey, and the catalog lookup above may have failed.
        const tracked = this.objectUrls.get(id);
        if (tracked) {
            URL.revokeObjectURL(tracked.url);
            this.objectUrls.delete(id);
        }
    }

    public async getCacheUsage(): Promise<{ usedBytes: number; itemCount: number }> {
        const entries = [...(await this.getIndex()).values()];
        return {
            usedBytes: entries.reduce((sum, e) => sum + (e.size || 0), 0),
            itemCount: entries.length,
        };
    }

    public async cleanLRU(maxQuotaBytes: number): Promise<void> {
        // Re-read first: this decision must not be made from a mirror another tab may have
        // rewritten since (see indexMirror).
        const entries = [...(await this.reloadIndex()).values()];
        let totalBytes = entries.reduce((sum, e) => sum + (e.size || 0), 0);
        if (totalBytes <= maxQuotaBytes) return;

        entries.sort((a, b) => a.lastUsed - b.lastUsed);
        for (const entry of entries) {
            if (totalBytes <= maxQuotaBytes) break;
            await this.evictCacheEntry(entry.cacheKey);
            totalBytes -= entry.size || 0;
        }
    }

    /** Clears the browser cache only — server files are never touched by maintenance. */
    public async clearAll(): Promise<void> {
        for (const entry of this.objectUrls.values()) {
            URL.revokeObjectURL(entry.url);
        }
        this.objectUrls.clear();

        if ('caches' in window) {
            await caches.delete(CACHE_NAME);
            this.l1 = await caches.open(CACHE_NAME);
        }
        await this.indexClear();
    }

    public async preloadUrl(url: string, type?: MediaType): Promise<{ item: MediaItem; isNew: boolean }> {
        const existing = await this.origin.findByUrl(url);
        if (existing) {
            return { item: existing, isNew: false };
        }

        const filename = url.split('/').pop()?.split('?')[0] || 'preloaded_media';
        const detectedType = type || this.detectMediaType(filename);
        const blob = await this.fetchForStorage(url);
        const item = await this.origin.putMedia({ blob, name: filename, type: detectedType, source: 'url', remoteUrl: url });
        await this.backfillCache(item, blob);
        return { item, isNew: true };
    }

    public detectMediaType(filename: string): MediaType {
        return detectMediaType(filename);
    }

    public getMimeType(name: string, type: MediaType): string {
        return guessMimeType(name, type);
    }

    // ---------- browser cache (L1) internals ----------

    private async fetchForStorage(url: string): Promise<Blob> {
        try {
            return await this.origin.download(url);
        } catch (err) {
            if (this.remoteImporter) {
                console.warn('[ST-BgLoader] Direct download failed, importing through the Authority server:', err);
                return this.remoteImporter.import(url);
            }
            throw err;
        }
    }

    private async backfillCache(item: MediaItem, blob: Blob): Promise<void> {
        if (!this.l1 || blob.size === 0) return;
        try {
            await this.l1.put(item.cacheKey, new Response(blob, {
                headers: { 'Content-Type': item.mimeType || blob.type },
            }));
            await this.indexPut({ cacheKey: item.cacheKey, lastUsed: Date.now(), size: blob.size });
        } catch (err) {
            console.warn('[ST-BgLoader] Cache backfill failed (playback still streams from server):', err);
        }
    }

    private async touchCache(cacheKey: string): Promise<void> {
        // Mirror instead of a full IDB read: this runs on every getMediaBlobUrl() call (E2).
        const entry = (await this.getIndex()).get(cacheKey);
        if (entry) {
            entry.lastUsed = Date.now();
            await this.indexPut(entry);
        }
    }

    private async evictCacheEntry(cacheKey: string): Promise<void> {
        if (this.l1) await this.l1.delete(cacheKey);
        await this.indexDelete(cacheKey);
        this.releaseObjectUrls(cacheKey);
    }

    /**
     * E3: an object URL is only kept for a cache entry the LRU still tracks, so eviction
     * releases it — that is what bounds `objectUrls` for a long session (previously every
     * uploaded item kept its blob URL alive until an explicit delete or Clear Cache).
     *
     * Honest limits of that rule (review correction, 2026-09-26): LRU order is by lastUsed, and
     * it gives NO guarantee that the currently mounted background is evicted last — a background
     * mounted a while ago while other media were touched in between is a legitimate early
     * candidate. Revoking a URL that is still in use is nevertheless benign for the media
     * mounted here (measured 2026-09-26: fully buffered BGM, mid-track BGM, a mounted image and
     * a mounted svg/iframe all kept playing/rendering across revocation). The residual window is
     * BGM that is still buffering: a revoked URL stops the stream, and nothing re-resolves the
     * URL of an already-mounted element. Accepted as the cost of bounding the map; the
     * alternative is an unbounded leak for the whole session.
     */
    private releaseObjectUrls(cacheKey: string): void {
        for (const [id, entry] of this.objectUrls) {
            if (entry.cacheKey === cacheKey) {
                URL.revokeObjectURL(entry.url);
                this.objectUrls.delete(id);
            }
        }
    }

    private async openIndex(): Promise<void> {
        this.indexDb = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(INDEX_DB_NAME, 1);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(INDEX_STORE)) {
                    db.createObjectStore(INDEX_STORE, { keyPath: 'cacheKey' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /** The in-memory mirror; loaded from IndexedDB once, then kept in sync by the writers. */
    private async getIndex(): Promise<Map<string, CacheIndexEntry>> {
        return this.indexMirror ?? await this.reloadIndex();
    }

    /** Forces a fresh read of the whole index (multi-tab safety for decision points). */
    private async reloadIndex(): Promise<Map<string, CacheIndexEntry>> {
        const entries = await this.indexReadAll();
        this.indexMirror = new Map(entries.map(e => [e.cacheKey, { ...e }]));
        return this.indexMirror;
    }

    private async indexReadAll(): Promise<CacheIndexEntry[]> {
        if (!this.indexDb) await this.openIndex();
        return new Promise<CacheIndexEntry[]>((resolve, reject) => {
            const tx = this.indexDb!.transaction(INDEX_STORE, 'readonly');
            const request = tx.objectStore(INDEX_STORE).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    private async indexPut(entry: CacheIndexEntry): Promise<void> {
        if (!this.indexDb) await this.openIndex();
        await new Promise<void>((resolve, reject) => {
            const tx = this.indexDb!.transaction(INDEX_STORE, 'readwrite');
            const request = tx.objectStore(INDEX_STORE).put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        // Only mirror into an already-loaded index: creating one here would drop the entries
        // this tab has not read yet.
        this.indexMirror?.set(entry.cacheKey, { ...entry });
    }

    private async indexDelete(cacheKey: string): Promise<void> {
        if (!this.indexDb) await this.openIndex();
        await new Promise<void>((resolve, reject) => {
            const tx = this.indexDb!.transaction(INDEX_STORE, 'readwrite');
            const request = tx.objectStore(INDEX_STORE).delete(cacheKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        this.indexMirror?.delete(cacheKey);
    }

    private async indexClear(): Promise<void> {
        if (!this.indexDb) await this.openIndex();
        await new Promise<void>((resolve, reject) => {
            const tx = this.indexDb!.transaction(INDEX_STORE, 'readwrite');
            const request = tx.objectStore(INDEX_STORE).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        this.indexMirror = new Map();
    }
}
