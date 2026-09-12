import { MediaItem, MediaType, MediaSource } from '../types';
import { AuthorityBridge } from '../backend/AuthorityBridge';
import { AuthorityOrigin } from '../backend/AuthorityOrigin';
import { LocalOrigin, guessMimeType } from '../backend/LocalOrigin';
import { MediaOrigin, MediaPutInput } from '../backend/MediaOrigin';
import { RemoteImporter } from '../backend/RemoteImporter';

/**
 * Media library facade. Public API is unchanged from the pre-refactor manager; call sites
 * (index.ts, SettingsDrawer, PublicAPI, SceneManager, AudioEngine) keep working as-is.
 *
 * Storage inversion: the selected MediaOrigin is the source of truth (Authority server when
 * available, otherwise the browser). In authority mode CacheStorage acts only as an evictable
 * hot cache (L1): writes go through to the origin first, cache misses are pulled back from the
 * origin, and LRU eviction never touches server data.
 */
export class CacheManager {
    private origin: MediaOrigin;
    private localOrigin: LocalOrigin;
    private authorityOrigin: AuthorityOrigin | null = null;
    private bridge: AuthorityBridge | null = null;
    private remoteImporter: RemoteImporter | null = null;
    private l1: Cache | null = null;
    private objectUrls: Map<string, string> = new Map();

    constructor() {
        this.localOrigin = new LocalOrigin();
        this.origin = this.localOrigin;
    }

    public async init(bridge?: AuthorityBridge): Promise<void> {
        if ('caches' in window) {
            this.l1 = await caches.open('st-bg-cache-v1');
        }

        if (bridge) {
            this.bridge = bridge;
            const caps = await bridge.detectAndInit();
            const client = bridge.getClient();
            if (caps.available && client) {
                this.authorityOrigin = new AuthorityOrigin(client);
                try {
                    await this.authorityOrigin.init();
                    this.origin = this.authorityOrigin;
                    this.remoteImporter = new RemoteImporter(bridge);
                    console.log('[ST-BgLoader] Media library source of truth: Authority backend (cloud).');
                } catch (err) {
                    this.authorityOrigin = null;
                    console.warn('[ST-BgLoader] Cloud catalog unavailable, using local source of truth:', err);
                }
            }
        }

        if (this.origin === this.localOrigin) {
            console.log('[ST-BgLoader] Media library source of truth: this browser (local mode).');
        }
        await this.origin.init();
    }

    public isCloudBacked(): boolean {
        return this.origin.kind === 'authority';
    }

    /** Exposed for the one-time local->cloud migration and diagnostics. */
    public getLocalOrigin(): LocalOrigin {
        return this.localOrigin;
    }

    /** Null when the Authority backend is unavailable. */
    public getAuthorityOrigin(): AuthorityOrigin | null {
        return this.authorityOrigin;
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
        const blob = typeof content === 'string'
            ? new Blob([content], { type: type === 'svg' ? 'image/svg+xml' : 'text/html' })
            : content;

        const input: MediaPutInput = { blob, name, type, source, remoteUrl };
        const item = await this.origin.putMedia(input);

        // Backfill the hot cache so first playback is instant (empty URL stubs have no binary).
        if (this.origin.kind === 'authority' && this.l1 && blob.size > 0) {
            await this.l1.put(item.cacheKey, new Response(blob, {
                headers: { 'Content-Type': item.mimeType },
            }));
        }
        return item;
    }

    public async getMediaBlobUrl(item: MediaItem): Promise<string> {
        const existingUrl = this.objectUrls.get(item.id);
        if (existingUrl) {
            void this.touchMedia(item.id);
            return existingUrl;
        }

        let blob: Blob | null = null;

        // L1 hot cache (authority mode only; in local mode L1 is the origin itself).
        if (this.origin.kind === 'authority' && this.l1) {
            const hit = await this.l1.match(item.cacheKey);
            if (hit) {
                blob = await hit.blob();
            }
        }

        if (!blob) {
            blob = await this.origin.readMedia(item);
            if (blob && this.origin.kind === 'authority' && this.l1) {
                await this.l1.put(item.cacheKey, new Response(blob, {
                    headers: { 'Content-Type': blob.type || item.mimeType },
                }));
            }
        }

        if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            this.objectUrls.set(item.id, blobUrl);
            void this.touchMedia(item.id);
            return blobUrl;
        }

        // Not stored in the catalog (e.g. native background virtual items): use the original URL.
        return item.url;
    }

    public async touchMedia(id: string): Promise<void> {
        await this.origin.touchMedia(id, Date.now());
    }

    public async deleteMedia(id: string): Promise<void> {
        const item = await this.getMedia(id);
        await this.origin.deleteMedia(id);

        if (item) {
            if (this.objectUrls.has(id)) {
                URL.revokeObjectURL(this.objectUrls.get(id)!);
                this.objectUrls.delete(id);
            }
            if (this.origin.kind === 'authority' && this.l1) {
                await this.l1.delete(item.cacheKey);
            }
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

        items.sort((a, b) => a.lastUsedTimestamp - b.lastUsedTimestamp);

        for (const item of items) {
            if (totalBytes <= maxQuotaBytes) break;

            if (this.origin.kind === 'authority') {
                // Cloud mode: evict only the local hot cache; the server copy is never deleted.
                if (this.l1) {
                    await this.l1.delete(item.cacheKey);
                }
                if (this.objectUrls.has(item.id)) {
                    URL.revokeObjectURL(this.objectUrls.get(item.id)!);
                    this.objectUrls.delete(item.id);
                }
            } else {
                await this.origin.deleteMedia(item.id);
            }
            totalBytes -= item.size || 0;
        }
    }

    public async clearAll(): Promise<void> {
        // Revoke all Blob URLs first.
        for (const url of this.objectUrls.values()) {
            URL.revokeObjectURL(url);
        }
        this.objectUrls.clear();

        if (this.origin.kind === 'authority') {
            // Cloud mode: clear catalog + binaries on the server and the local hot cache.
            const items = await this.listMedia();
            for (const item of items) {
                await this.origin.deleteMedia(item.id);
            }
            if (this.l1 && 'caches' in window) {
                await caches.delete('st-bg-cache-v1');
                this.l1 = await caches.open('st-bg-cache-v1');
            }
            return;
        }

        // Local mode: pre-refactor behavior — wipe the browser-resident library.
        if (this.l1 && 'caches' in window) {
            await caches.delete('st-bg-cache-v1');
            this.l1 = await caches.open('st-bg-cache-v1');
        }
        await this.localOrigin.clearCatalog();
    }

    public async preloadUrl(url: string, type?: MediaType): Promise<{ item: MediaItem; isNew: boolean }> {
        const existing = await this.origin.findByUrl(url);
        if (existing) {
            await this.touchMedia(existing.id);
            return { item: existing, isNew: false };
        }

        const filename = url.split('/').pop()?.split('?')[0] || 'preloaded_media';
        const detectedType = type || this.detectMediaType(filename);

        let blob: Blob | null = null;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch media from ${url}: ${response.status} ${response.statusText}`);
            }
            blob = await response.blob();
        } catch (err) {
            // Direct fetch failed (CORS/network): fall back to a server-side import when available.
            if (this.remoteImporter) {
                console.warn('[ST-BgLoader] Direct fetch failed, importing through the Authority server:', err);
                blob = await this.remoteImporter.import(url);
            } else {
                throw err;
            }
        }

        const item = await this.origin.putMedia({ blob, name: filename, type: detectedType, source: 'url', remoteUrl: url });
        if (this.origin.kind === 'authority' && this.l1 && blob.size > 0) {
            await this.l1.put(item.cacheKey, new Response(blob, {
                headers: { 'Content-Type': item.mimeType },
            }));
        }
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
}
