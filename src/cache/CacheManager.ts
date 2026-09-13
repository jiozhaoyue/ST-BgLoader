import { MediaItem, MediaType, MediaSource } from '../types';
import { LegacyBrowserStore, guessMimeType } from '../backend/LocalOrigin';
import { ServerOrigin } from '../backend/ServerOrigin';
import { RemoteImporter } from '../backend/RemoteImporter';
import { AuthorityBridge } from '../backend/AuthorityBridge';
import { LegacyMigration } from '../backend/LegacyMigration';

const CACHE_NAME = 'st-bg-cache-v1';
const INDEX_DB_NAME = 'st_bg_cache_index';
const INDEX_STORE = 'entries';

interface CacheIndexEntry {
    cacheKey: string;
    lastUsed: number;
    size: number;
}

/**
 * Media library facade. Public API is unchanged from earlier releases; call sites
 * (index.ts, SettingsDrawer, PublicAPI, SceneManager, AudioEngine) keep working as-is.
 *
 * Storage model: the ONLY source of truth is the SillyTavern server's backgrounds/ directory
 * (ServerOrigin, native endpoints + Range streaming). The browser keeps a pure, evictable hot
 * cache: CacheStorage for bytes plus a tiny IndexedDB index (lastUsed/size) for LRU and usage
 * stats. Cache maintenance never touches server files; server files are only removed by an
 * explicit user delete.
 */
export class CacheManager {
    private origin: ServerOrigin;
    private legacy: LegacyBrowserStore;
    private remoteImporter: RemoteImporter | null = null;
    private l1: Cache | null = null;
    private indexDb: IDBDatabase | null = null;
    private objectUrls: Map<string, string> = new Map();

    constructor() {
        this.origin = new ServerOrigin();
        this.legacy = new LegacyBrowserStore();
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
        void this.migrateLegacyLibrary();
    }

    public isCloudBacked(): boolean {
        // Kept for UI compatibility: the source of truth is always the server now.
        return true;
    }

    public getLocalOrigin(): LegacyBrowserStore {
        return this.legacy;
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
        const existingUrl = this.objectUrls.get(item.id);
        if (existingUrl) {
            await this.touchCache(item.cacheKey);
            return existingUrl;
        }

        // Hot cache hit: instant playback from local bytes.
        if (this.l1) {
            const hit = await this.l1.match(item.cacheKey);
            if (hit) {
                const blob = await hit.blob();
                const blobUrl = URL.createObjectURL(blob);
                this.objectUrls.set(item.id, blobUrl);
                await this.touchCache(item.cacheKey);
                return blobUrl;
            }
        }

        // Cache miss: stream directly from the server (same-origin, HTTP Range, hardware decode).
        await this.touchCache(item.cacheKey);
        return item.url;
    }

    public async touchMedia(_id: string): Promise<void> {
        // LRU is tracked per cache entry (touchCache); the server library has no eviction.
    }

    public async deleteMedia(id: string): Promise<void> {
        const item = await this.getMedia(id);
        await this.origin.deleteMedia(id);

        if (item) {
            await this.evictCacheEntry(item.cacheKey);
            if (this.objectUrls.has(id)) {
                URL.revokeObjectURL(this.objectUrls.get(id)!);
                this.objectUrls.delete(id);
            }
        }
    }

    public async getCacheUsage(): Promise<{ usedBytes: number; itemCount: number }> {
        const entries = await this.indexAll();
        return {
            usedBytes: entries.reduce((sum, e) => sum + (e.size || 0), 0),
            itemCount: entries.length,
        };
    }

    public async cleanLRU(maxQuotaBytes: number): Promise<void> {
        const entries = await this.indexAll();
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
        for (const url of this.objectUrls.values()) {
            URL.revokeObjectURL(url);
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
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
        if (ext === 'html' || ext === 'htm') return 'html';
        if (ext === 'svg') return 'svg';
        return 'image';
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
        const entry = (await this.indexAll()).find(e => e.cacheKey === cacheKey);
        if (entry) {
            entry.lastUsed = Date.now();
            await this.indexPut(entry);
        }
    }

    private async evictCacheEntry(cacheKey: string): Promise<void> {
        if (this.l1) await this.l1.delete(cacheKey);
        await this.indexDelete(cacheKey);
        // Object URLs stay valid until deleteMedia/init revokes them: an evicted entry may be
        // the currently mounted background, and the blob is already resident in memory.
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

    private async indexAll(): Promise<CacheIndexEntry[]> {
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
    }

    private async indexDelete(cacheKey: string): Promise<void> {
        if (!this.indexDb) await this.openIndex();
        await new Promise<void>((resolve, reject) => {
            const tx = this.indexDb!.transaction(INDEX_STORE, 'readwrite');
            const request = tx.objectStore(INDEX_STORE).delete(cacheKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async indexClear(): Promise<void> {
        if (!this.indexDb) await this.openIndex();
        await new Promise<void>((resolve, reject) => {
            const tx = this.indexDb!.transaction(INDEX_STORE, 'readwrite');
            const request = tx.objectStore(INDEX_STORE).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ---------- legacy migration ----------

    private async migrateLegacyLibrary(): Promise<void> {
        try {
            const migration = new LegacyMigration(this.legacy, this.origin);
            await migration.runIfNeeded((progress) => {
                console.log(`[ST-BgLoader] Legacy migration: ${progress.done}/${progress.total} (${progress.current})`);
            });
        } catch (err) {
            console.warn('[ST-BgLoader] Legacy migration failed:', err);
        }
    }

    /** Test hook: re-run the idempotent legacy migration pass (flag-gated). */
    public async migrateLegacyForTest(): Promise<void> {
        await this.migrateLegacyLibrary();
    }
}
