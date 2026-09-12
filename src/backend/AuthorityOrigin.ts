import { MediaItem } from '../types';
import { AuthorityClientLike, AuthoritySqlValue, base64ToBytes, bytesToBase64 } from './AuthorityBridge';
import { guessMimeType } from './LocalOrigin';
import { MediaOrigin, MediaPutInput } from './MediaOrigin';

const DATABASE = 'default';

/**
 * Server-side source of truth backed by the Authority plugin:
 * - binaries in `storage.blob` (SDK auto-chunks large payloads through the transfer layer),
 * - catalog in `sql.private` (database `default`, extension-isolated per user).
 * The browser never owns this data; CacheManager keeps only an evictable hot cache of it.
 */
export class AuthorityOrigin implements MediaOrigin {
    public readonly kind = 'authority' as const;
    private touchTimers = new Map<string, number>();

    constructor(private client: AuthorityClientLike) {}

    public async init(): Promise<void> {
        const result = await this.client.sql.migrate({
            database: DATABASE,
            migrations: [
                {
                    id: '0001-create-media-items',
                    statement: `
                        CREATE TABLE IF NOT EXISTS media_items (
                            id TEXT PRIMARY KEY,
                            blob_id TEXT NOT NULL,
                            name TEXT NOT NULL,
                            type TEXT NOT NULL,
                            source TEXT NOT NULL,
                            remote_url TEXT,
                            size INTEGER NOT NULL,
                            mime_type TEXT NOT NULL,
                            added_timestamp INTEGER NOT NULL,
                            last_used_timestamp INTEGER NOT NULL,
                            has_audio INTEGER NOT NULL DEFAULT 0
                        )
                    `,
                },
                {
                    id: '0002-media-items-last-used-index',
                    statement: 'CREATE INDEX IF NOT EXISTS idx_media_items_last_used ON media_items(last_used_timestamp)',
                },
            ],
        });
        console.log('[ST-BgLoader] Authority media catalog ready:', result.applied.length, 'applied,', result.skipped.length, 'skipped');
    }

    public async listCatalog(): Promise<MediaItem[]> {
        const result = await this.client.sql.query({
            database: DATABASE,
            statement: `SELECT id, blob_id, name, type, source, remote_url, size, mime_type,
                        added_timestamp, last_used_timestamp, has_audio
                        FROM media_items ORDER BY last_used_timestamp DESC`,
        });
        return result.rows.map(row => rowToItem(row));
    }

    public async getCatalogItem(id: string): Promise<MediaItem | null> {
        const result = await this.client.sql.query({
            database: DATABASE,
            statement: `SELECT id, blob_id, name, type, source, remote_url, size, mime_type,
                        added_timestamp, last_used_timestamp, has_audio
                        FROM media_items WHERE id = ?`,
            params: [id],
        });
        return result.rows.length > 0 ? rowToItem(result.rows[0]) : null;
    }

    public async putMedia(input: MediaPutInput): Promise<MediaItem> {
        const id = input.id ?? 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const mimeType = input.blob.type || guessMimeType(input.name, input.type);

        // URL stubs carry no binary: register the remote reference without uploading an empty object.
        const isStub = input.source === 'url' && input.blob.size === 0;
        let blobId = '';
        let size = input.blob.size;
        if (!isStub) {
            const bytes = new Uint8Array(await input.blob.arrayBuffer());
            size = bytes.byteLength;
            // The SDK routes payloads above the inline threshold through its chunked transfer layer.
            const record = await this.client.storage.blob.put({
                name: `media/${id}/${sanitizeBlobName(input.name)}`,
                content: bytesToBase64(bytes),
                encoding: 'base64',
                contentType: mimeType,
            });
            blobId = record.id;
        }

        const item: MediaItem = {
            id,
            name: input.name,
            type: input.type,
            source: input.source,
            url: input.remoteUrl || blobId,
            cacheKey: blobId ? `/st-bg-cache/${blobId}` : `/st-bg-cache/url/${encodeURIComponent(input.remoteUrl || id)}`,
            size,
            mimeType,
            addedTimestamp: Date.now(),
            lastUsedTimestamp: Date.now(),
            hasAudio: input.type === 'video' || input.type === 'audio',
        };

        await this.client.sql.exec({
            database: DATABASE,
            statement: `INSERT INTO media_items
                        (id, blob_id, name, type, source, remote_url, size, mime_type, added_timestamp, last_used_timestamp, has_audio)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                item.id, blobId, item.name, item.type, item.source,
                input.remoteUrl ?? null, item.size, item.mimeType,
                item.addedTimestamp, item.lastUsedTimestamp, item.hasAudio ? 1 : 0,
            ],
        });
        return item;
    }

    public async deleteMedia(id: string): Promise<void> {
        const item = await this.getCatalogItem(id);
        if (!item) return;

        const blobId = blobIdFromCacheKey(item.cacheKey);
        if (blobId) {
            await this.client.storage.blob.delete(blobId);
        }
        await this.client.sql.exec({
            database: DATABASE,
            statement: 'DELETE FROM media_items WHERE id = ?',
            params: [id],
        });
    }

    public async readMedia(item: MediaItem): Promise<Blob | null> {
        const row = await this.getCatalogItem(item.id);
        if (!row) return null;

        const blobId = blobIdFromCacheKey(row.cacheKey);
        if (!blobId) return null;

        const response = await this.client.storage.blob.get(blobId);
        const bytes = base64ToBytes(response.content);
        return new Blob([bytes], { type: response.record.contentType || row.mimeType });
    }

    public async touchMedia(id: string, timestamp: number): Promise<void> {
        // Debounced per item: playback touches fire far more often than the catalog needs updating.
        const existing = this.touchTimers.get(id);
        if (existing !== undefined) return;
        const timer = window.setTimeout(() => {
            this.touchTimers.delete(id);
            void this.client.sql.exec({
                database: DATABASE,
                statement: 'UPDATE media_items SET last_used_timestamp = ? WHERE id = ?',
                params: [timestamp, id],
            }).catch(err => console.warn('[ST-BgLoader] Failed to touch media on cloud catalog:', err));
        }, 5000);
        this.touchTimers.set(id, timer);
    }

    public async findByUrl(url: string): Promise<MediaItem | null> {
        const result = await this.client.sql.query({
            database: DATABASE,
            statement: `SELECT id, blob_id, name, type, source, remote_url, size, mime_type,
                        added_timestamp, last_used_timestamp, has_audio
                        FROM media_items WHERE remote_url = ?`,
            params: [url],
        });
        return result.rows.length > 0 ? rowToItem(result.rows[0]) : null;
    }
}

function sanitizeBlobName(name: string): string {
    return (name || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function blobIdFromCacheKey(cacheKey: string): string | null {
    // Cloud rows use cacheKey = `/st-bg-cache/<blob_id>`; URL stubs (`/st-bg-cache/url/...`) hold no binary.
    if (!cacheKey.startsWith('/st-bg-cache/')) return null;
    const rest = cacheKey.slice('/st-bg-cache/'.length);
    if (!rest || rest.startsWith('url/')) return null;
    return rest;
}

function num(value: AuthoritySqlValue | undefined, fallback = 0): number {
    return typeof value === 'number' ? value : Number(value ?? fallback) || fallback;
}

function rowToItem(row: Record<string, AuthoritySqlValue>): MediaItem {
    const remoteUrl = typeof row.remote_url === 'string' ? row.remote_url : null;
    const blobId = typeof row.blob_id === 'string' ? row.blob_id : '';
    return {
        id: String(row.id),
        name: String(row.name),
        type: row.type as MediaItem['type'],
        source: row.source as MediaItem['source'],
        url: remoteUrl || `/st-bg-cache/${blobId}`,
        cacheKey: `/st-bg-cache/${blobId}`,
        size: num(row.size),
        mimeType: String(row.mime_type),
        addedTimestamp: num(row.added_timestamp),
        lastUsedTimestamp: num(row.last_used_timestamp),
        hasAudio: num(row.has_audio) === 1,
    };
}
