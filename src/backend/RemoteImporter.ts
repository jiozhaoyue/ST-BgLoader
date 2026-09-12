import { AuthorityBridge, base64ToBytes } from './AuthorityBridge';

/**
 * Server-side media import: the browser fetches directly when possible (streaming, progress),
 * and falls back to `http.fetch` through the Authority server when CORS blocks the request.
 * Hostnames are added to the extension's http.allow declaration on first use; Authority then
 * runs its own permission prompt/grant flow for that target.
 */
export class RemoteImporter {
    constructor(private bridge: AuthorityBridge) {}

    public async import(url: string): Promise<Blob> {
        const hostname = extractHostname(url);
        if (!hostname) {
            throw new Error(`Cannot import from invalid URL: ${url}`);
        }
        if (!(await this.bridge.ensureHttpAllowed(hostname))) {
            throw new Error(`Server-side import unavailable for host: ${hostname}`);
        }

        const client = this.bridge.getClient();
        if (!client) {
            throw new Error('Authority backend unavailable');
        }

        const response = await client.http.fetch({ url, method: 'GET' });
        if (!response.ok) {
            throw new Error(`Server fetch failed with HTTP ${response.status} for ${url}`);
        }
        const bytes = base64ToBytes(response.body);
        return new Blob([bytes], { type: response.contentType || 'application/octet-stream' });
    }
}

export function extractHostname(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}
