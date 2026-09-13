import { MediaItem, MediaType } from '../types';

const DB_NAME = 'st_bg_loader_db';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_items';

export const CACHE_NAME = 'st-bg-cache-v1';

/**
 * Read-only access to the LEGACY browser-resident library (pre-server-storage releases kept
 * binaries in CacheStorage and the catalog in IndexedDB). Exists solely so LegacyMigration can
 * upload those files to the server once; new code must never write here.
 */
export class LegacyBrowserStore {
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

    public async readMedia(item: MediaItem): Promise<Blob | null> {
        const cache = await caches.open(CACHE_NAME);
        if (item.size > 0 || item.source !== 'url') {
            const response = await cache.match(item.cacheKey);
            if (response) return response.blob();
        }
        if (item.source === 'url' && item.url) {
            try {
                const fetched = await fetch(item.url);
                if (fetched.ok) return await fetched.blob();
            } catch { /* unreachable or CORS-blocked remote */ }
        }
        return null;
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
