import { MediaItem, MediaType } from '../types';
import { MediaOrigin, MediaPutInput } from './MediaOrigin';

const DB_NAME = 'st_bg_loader_db';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_items';

/**
 * Browser-resident source of truth (pre-refactor behavior, moved verbatim):
 * CacheStorage stores binaries, IndexedDB stores the catalog.
 * Used when the Authority backend is unavailable.
 */
export class LocalOrigin implements MediaOrigin {
    public readonly kind = 'local' as const;
    private db: IDBDatabase | null = null;

    public async init(): Promise<void> {
        if (this.db) return;
        this.db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_MEDIA)) {
                    const store = db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('lastUsedTimestamp', 'lastUsedTimestamp', { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async listCatalog(): Promise<MediaItem[]> {
        if (!this.db) await this.init();
        return new Promise<MediaItem[]>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readonly');
            const request = tx.objectStore(STORE_MEDIA).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    public async getCatalogItem(id: string): Promise<MediaItem | null> {
        if (!this.db) await this.init();
        return new Promise<MediaItem | null>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readonly');
            const request = tx.objectStore(STORE_MEDIA).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    public async putMedia(input: MediaPutInput): Promise<MediaItem> {
        if (!this.db) await this.init();

        const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const cacheKey = `/st-bg-cache/${id}/${encodeURIComponent(input.name)}`;
        const mimeType = input.blob.type || guessMimeType(input.name, input.type);

        const item: MediaItem = {
            id,
            name: input.name,
            type: input.type,
            source: input.source,
            url: input.remoteUrl || cacheKey,
            cacheKey,
            size: input.blob.size,
            mimeType,
            addedTimestamp: Date.now(),
            lastUsedTimestamp: Date.now(),
            hasAudio: input.type === 'video' || input.type === 'audio',
        };

        await this.putCacheEntry(cacheKey, input.blob, mimeType);
        await this.putCatalogRow(item);
        return item;
    }

    public async deleteMedia(id: string): Promise<void> {
        const item = await this.getCatalogItem(id);
        if (!item) return;

        const cache = await caches.open(CACHE_NAME);
        await cache.delete(item.cacheKey);

        await new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readwrite');
            const request = tx.objectStore(STORE_MEDIA).delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async readMedia(item: MediaItem): Promise<Blob | null> {
        const cache = await caches.open(CACHE_NAME);

        // URL stubs (size 0) hold no binary; skip their empty cache entry and fetch on demand.
        if (item.size > 0 || item.source !== 'url') {
            const response = await cache.match(item.cacheKey);
            if (response) return response.blob();
        }

        if (item.source === 'url' && item.url) {
            // Same behavior as the pre-refactor getMediaBlobUrl: fetch remote URL and cache it.
            try {
                const fetched = await fetch(item.url);
                if (fetched.ok) {
                    await cache.put(item.cacheKey, fetched.clone());
                    return await fetched.blob();
                }
            } catch (err) {
                console.warn('[ST-BgLoader] Failed to fetch and cache remote URL:', item.url, err);
            }
        }
        return null;
    }

    public async touchMedia(id: string, timestamp: number): Promise<void> {
        const item = await this.getCatalogItem(id);
        if (!item) return;
        item.lastUsedTimestamp = timestamp;
        await this.putCatalogRow(item);
    }

    public async findByUrl(url: string): Promise<MediaItem | null> {
        const all = await this.listCatalog();
        return all.find(i => i.url === url || i.cacheKey === url) || null;
    }

    /** LocalOrigin *is* the source of truth, so LRU eviction removes real data (pre-refactor semantics). */
    public async evictFromSource(cacheKey: string): Promise<void> {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(cacheKey);
    }

    public async clearCatalog(): Promise<void> {
        if (!this.db) await this.init();
        await new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readwrite');
            const request = tx.objectStore(STORE_MEDIA).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async putCacheEntry(cacheKey: string, blob: Blob, mimeType: string): Promise<void> {
        const cache = await caches.open(CACHE_NAME);
        const headers = new Headers({
            'Content-Type': mimeType,
            'Content-Length': blob.size.toString(),
        });
        await cache.put(cacheKey, new Response(blob, { headers }));
    }

    private async putCatalogRow(item: MediaItem): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readwrite');
            const request = tx.objectStore(STORE_MEDIA).put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const CACHE_NAME = 'st-bg-cache-v1';

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
