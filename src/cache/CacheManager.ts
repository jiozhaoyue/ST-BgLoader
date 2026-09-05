import { MediaItem, MediaType, MediaSource } from '../types';

const DB_NAME = 'st_bg_loader_db';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_items';
const CACHE_NAME = 'st-bg-cache-v1';

export class CacheManager {
    private db: IDBDatabase | null = null;
    private cache: Cache | null = null;
    private objectUrls: Map<string, string> = new Map();

    public async init(): Promise<void> {
        // Initialize CacheStorage
        if ('caches' in window) {
            this.cache = await caches.open(CACHE_NAME);
        }

        // Initialize IndexedDB
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

    public async listMedia(): Promise<MediaItem[]> {
        if (!this.db) await this.init();
        return new Promise<MediaItem[]>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readonly');
            const store = tx.objectStore(STORE_MEDIA);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    public async getMedia(id: string): Promise<MediaItem | null> {
        if (!this.db) await this.init();
        return new Promise<MediaItem | null>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readonly');
            const store = tx.objectStore(STORE_MEDIA);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    public async saveMedia(
        content: Blob | File | string,
        name: string,
        type: MediaType,
        source: MediaSource,
        remoteUrl?: string
    ): Promise<MediaItem> {
        if (!this.db || !this.cache) await this.init();

        const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const cacheKey = `/st-bg-cache/${id}/${encodeURIComponent(name)}`;

        let blob: Blob;
        let mimeType = '';
        let size = 0;

        if (typeof content === 'string') {
            // HTML or SVG text string
            mimeType = type === 'svg' ? 'image/svg+xml' : 'text/html';
            blob = new Blob([content], { type: mimeType });
            size = blob.size;
        } else {
            blob = content;
            mimeType = content.type || this.guessMimeType(name, type);
            size = content.size;
        }

        // Put into CacheStorage
        const headers = new Headers({
            'Content-Type': mimeType,
            'Content-Length': size.toString(),
        });
        const response = new Response(blob, { headers });
        await this.cache!.put(cacheKey, response);

        const item: MediaItem = {
            id,
            name,
            type,
            source,
            url: remoteUrl || cacheKey,
            cacheKey,
            size,
            mimeType,
            addedTimestamp: Date.now(),
            lastUsedTimestamp: Date.now(),
            hasAudio: type === 'video' || type === 'audio',
        };

        // Put into IndexedDB
        await new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readwrite');
            const store = tx.objectStore(STORE_MEDIA);
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        return item;
    }

    public async getMediaBlobUrl(item: MediaItem): Promise<string> {
        if (this.objectUrls.has(item.id)) {
            // Update last used timestamp
            this.touchMedia(item.id);
            return this.objectUrls.get(item.id)!;
        }

        if (!this.cache) await this.init();

        let response = await this.cache!.match(item.cacheKey);
        if (!response && item.source === 'url' && item.url) {
            // Fetch remote URL and cache it
            try {
                const fetched = await fetch(item.url);
                if (fetched.ok) {
                    const clone = fetched.clone();
                    await this.cache!.put(item.cacheKey, clone);
                    response = fetched;
                }
            } catch (err) {
                console.warn('[ST-BgLoader] Failed to fetch and cache remote URL:', item.url, err);
            }
        }

        if (response) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            this.objectUrls.set(item.id, blobUrl);
            this.touchMedia(item.id);
            return blobUrl;
        }

        // Fallback to original URL
        return item.url;
    }

    public async touchMedia(id: string): Promise<void> {
        if (!this.db) return;
        const item = await this.getMedia(id);
        if (item) {
            item.lastUsedTimestamp = Date.now();
            const tx = this.db.transaction(STORE_MEDIA, 'readwrite');
            tx.objectStore(STORE_MEDIA).put(item);
        }
    }

    public async deleteMedia(id: string): Promise<void> {
        if (!this.db || !this.cache) await this.init();

        const item = await this.getMedia(id);
        if (item) {
            // Delete from CacheStorage
            await this.cache!.delete(item.cacheKey);
            // Revoke Blob URL
            if (this.objectUrls.has(id)) {
                URL.revokeObjectURL(this.objectUrls.get(id)!);
                this.objectUrls.delete(id);
            }
            // Delete from IndexedDB
            await new Promise<void>((resolve, reject) => {
                const tx = this.db!.transaction(STORE_MEDIA, 'readwrite');
                const store = tx.objectStore(STORE_MEDIA);
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    public async getCacheUsage(): Promise<{ usedBytes: number; itemCount: number }> {
        const items = await this.listMedia();
        let usedBytes = 0;
        for (const item of items) {
            usedBytes += item.size || 0;
        }
        return { usedBytes, itemCount: items.length };
    }

    public async cleanLRU(maxQuotaBytes: number): Promise<void> {
        const items = await this.listMedia();
        let totalBytes = items.reduce((sum, item) => sum + (item.size || 0), 0);
        if (totalBytes <= maxQuotaBytes) return;

        // Sort oldest used first
        items.sort((a, b) => a.lastUsedTimestamp - b.lastUsedTimestamp);

        for (const item of items) {
            if (totalBytes <= maxQuotaBytes) break;
            console.log('[ST-BgLoader] LRU evicting:', item.name, item.size);
            totalBytes -= item.size || 0;
            await this.deleteMedia(item.id);
        }
    }

    public async clearAll(): Promise<void> {
        if (!this.db || !this.cache) await this.init();

        // Revoke all Blob URLs
        for (const url of this.objectUrls.values()) {
            URL.revokeObjectURL(url);
        }
        this.objectUrls.clear();

        // Clear CacheStorage
        if ('caches' in window) {
            await caches.delete(CACHE_NAME);
            this.cache = await caches.open(CACHE_NAME);
        }

        // Clear IndexedDB
        await new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(STORE_MEDIA, 'readwrite');
            const store = tx.objectStore(STORE_MEDIA);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private guessMimeType(name: string, type: MediaType): string {
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
}
