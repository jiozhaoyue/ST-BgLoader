import { AuthorityClientLike } from './AuthorityBridge';
import { AuthorityOrigin } from './AuthorityOrigin';
import { LocalOrigin } from './LocalOrigin';

const MIGRATION_FLAG_KEY = 'migration:local-to-cloud:v1';

export interface MigrationProgress {
    done: number;
    total: number;
    current: string;
}

/**
 * One-time upload of a pre-existing local library into the cloud catalog. Item ids are preserved
 * so scene bookmarks, chat bindings and the active-background reference keep working.
 * Idempotent: already-migrated ids are skipped, completion is flagged in kv, local data is kept.
 */
export class LocalToCloudMigrator {
    constructor(
        private local: LocalOrigin,
        private cloud: AuthorityOrigin,
        private client: AuthorityClientLike,
    ) {}

    public async runIfNeeded(onProgress?: (progress: MigrationProgress) => void): Promise<void> {
        try {
            if (await this.client.storage.kv.get(MIGRATION_FLAG_KEY)) return;

            const localItems = await this.local.listCatalog();
            if (localItems.length === 0) {
                await this.client.storage.kv.set(MIGRATION_FLAG_KEY, Date.now());
                return;
            }

            const cloudItems = await this.cloud.listCatalog();
            const cloudIds = new Set(cloudItems.map(i => i.id));
            console.log(`[ST-BgLoader] Migrating ${localItems.length} local media items to the cloud library...`);

            let done = 0;
            let uploaded = 0;
            for (const item of localItems) {
                if (!cloudIds.has(item.id)) {
                    try {
                        const blob = await this.local.readMedia(item);
                        if (blob && blob.size > 0) {
                            await this.cloud.putMedia({
                                blob,
                                name: item.name,
                                type: item.type,
                                source: item.source === 'local' ? 'local' : 'url',
                                remoteUrl: item.source === 'url' ? item.url : undefined,
                                id: item.id,
                            });
                            uploaded += 1;
                        } else if (item.source === 'url' && item.url) {
                            // URL stubs carry no binary; recreate the reference so scene/chat ids survive.
                            await this.cloud.putMedia({
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
                        console.warn(`[ST-BgLoader] Failed to migrate "${item.name}", keeping it local:`, err);
                    }
                }
                done += 1;
                onProgress?.({ done, total: localItems.length, current: item.name });
            }

            await this.client.storage.kv.set(MIGRATION_FLAG_KEY, Date.now());
            console.log(`[ST-BgLoader] Cloud migration finished: ${uploaded} uploaded, ${done} processed (local copies kept).`);
        } catch (err) {
            console.warn('[ST-BgLoader] Cloud migration skipped:', err);
        }
    }
}
