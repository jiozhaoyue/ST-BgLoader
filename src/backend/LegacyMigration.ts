import { LegacyBrowserStore } from './LocalOrigin';
import { ServerOrigin } from './ServerOrigin';

const MIGRATION_FLAG_KEY = 'st_bgloader_legacy_migrated_v2';

export interface MigrationProgress {
    done: number;
    total: number;
    current: string;
}

/**
 * One-time upload of the legacy browser-resident library into the server's backgrounds/
 * directory. Item ids are preserved so scene bookmarks, chat bindings and the active-background
 * reference keep working. Idempotent: already-migrated ids are skipped, the completion flag is
 * per-browser (localStorage), and local copies are kept — they simply degrade into cache entries.
 */
export class LegacyMigration {
    constructor(
        private legacy: LegacyBrowserStore,
        private server: ServerOrigin,
    ) {}

    public async runIfNeeded(onProgress?: (progress: MigrationProgress) => void): Promise<void> {
        try {
            if (localStorage.getItem(MIGRATION_FLAG_KEY)) return;

            const localItems = await this.legacy.listCatalog();
            if (localItems.length === 0) {
                localStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString());
                return;
            }

            console.log(`[ST-BgLoader] Migrating ${localItems.length} legacy browser media items to the server library...`);
            notify(`开始迁移本地媒体库到服务端（${localItems.length} 项）...`);

            let done = 0;
            let uploaded = 0;
            for (const item of localItems) {
                if (!(await this.server.getCatalogItem(item.id))) {
                    try {
                        const blob = await this.legacy.readMedia(item);
                        if (blob && blob.size > 0) {
                            await this.server.putMedia({
                                blob,
                                name: item.name,
                                type: item.type,
                                source: item.source === 'local' ? 'local' : 'url',
                                remoteUrl: item.source === 'url' ? item.url : undefined,
                                id: item.id,
                            });
                            uploaded += 1;
                        } else if (item.source === 'url' && item.url) {
                            // URL stubs carry no binary; recreate the reference so ids survive.
                            await this.server.putMedia({
                                blob: new Blob([]),
                                name: item.name,
                                type: item.type,
                                source: 'url',
                                remoteUrl: item.url,
                                id: item.id,
                            });
                            uploaded += 1;
                        }
                    } catch (err) {
                        console.warn(`[ST-BgLoader] Failed to migrate "${item.name}":`, err);
                    }
                }
                done += 1;
                onProgress?.({ done, total: localItems.length, current: item.name });
            }

            localStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString());
            console.log(`[ST-BgLoader] Legacy migration finished: ${uploaded} uploaded, ${done} processed (local copies kept as cache).`);
        } catch (err) {
            console.warn('[ST-BgLoader] Legacy migration skipped:', err);
        }
    }
}

function notify(message: string): void {
    try {
        const toastr = (window as unknown as { toastr?: { info(msg: string, title?: string): void } }).toastr;
        toastr?.info(message, 'ST-BgLoader');
    } catch { /* console logs above are enough */ }
}
