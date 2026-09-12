import { MediaItem, MediaSource, MediaType } from '../types';

export interface MediaPutInput {
    blob: Blob;
    name: string;
    type: MediaType;
    source: MediaSource;
    remoteUrl?: string;
    /** Preserve an existing catalog id (used by the local->cloud migration so scene/chat bindings keep working). */
    id?: string;
}

/**
 * Source-of-truth storage backend for the media catalog and its binaries.
 *
 * - `local`: browser CacheStorage (binaries) + IndexedDB (catalog). Data lives and dies with this browser profile.
 * - `authority`: Authority server plugin. `storage.blob` holds binaries, `sql.private` holds the catalog.
 *   The browser only keeps an evictable hot cache (L1) managed by CacheManager.
 */
export interface MediaOrigin {
    readonly kind: 'authority' | 'local';
    init(): Promise<void>;
    listCatalog(): Promise<MediaItem[]>;
    getCatalogItem(id: string): Promise<MediaItem | null>;
    putMedia(input: MediaPutInput): Promise<MediaItem>;
    deleteMedia(id: string): Promise<void>;
    /** Read the original binary from the source of truth, or null when the item is not stored here. */
    readMedia(item: MediaItem): Promise<Blob | null>;
    touchMedia(id: string, timestamp: number): Promise<void>;
    findByUrl(url: string): Promise<MediaItem | null>;
}
