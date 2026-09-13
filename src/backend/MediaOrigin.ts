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
 * - `server`: the SillyTavern server's own backgrounds/ directory (native endpoints + static
 *   Range streaming). Always available; this is the source of truth.
 * - `local`/`authority`: historical kinds kept for typing compatibility of legacy readers.
 */
export interface MediaOrigin {
    readonly kind: 'server' | 'authority' | 'local';
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
