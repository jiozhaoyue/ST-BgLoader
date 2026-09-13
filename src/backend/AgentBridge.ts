import { AuthorityClientLike } from './AuthorityBridge';

export interface AgentBrowserToolApi {
    registerTools(request: {
        browserInstanceId: string;
        leaseDurationMs?: number;
        tools: Array<{
            id: string;
            title: string;
            description: string;
            inputSchema: Record<string, unknown>;
            riskLevel: 'low' | 'medium' | 'high';
            approvalPolicy: 'never' | 'on-mutation' | 'always';
            mutatesWorkspace: boolean;
        }>;
    }): Promise<{ registrationId: string; leaseExpiresAt: string }>;
    claim(request: { browserInstanceId: string; claimId: string; callId?: string }): Promise<{
        sessionId: string | null;
        invocation: {
            id: string;
            runId: string;
            callId: string;
            toolId: string;
            arguments: unknown;
        } | null;
    }>;
    submitResult(request: {
        runId: string;
        callId: string;
        claimId: string;
        browserInstanceId: string;
        status: 'completed' | 'failed' | 'cancelled';
        result?: unknown;
        error?: string;
    }): Promise<unknown>;
}

export interface AgentToolHost {
    setBackground(target: string): Promise<void>;
    playBGM(url: string): Promise<void>;
    setWeather(type: string, density?: string): void;
    applyPreset(presetId: string): void;
    setFilters(filters: { blur?: number; brightness?: number; opacity?: number; saturate?: number }): void;
    applyScene(sceneId: string): boolean;
}

const REGISTER_INTERVAL_MS = 30000;
const CLAIM_INTERVAL_MS = 2000;

const TOOL_DEFS = [
    {
        id: 'stbg_set_background',
        title: '设置背景媒体',
        description: 'Switch the chat background to a media library id, scene asset, or remote URL.',
        inputSchema: {
            type: 'object',
            properties: { target: { type: 'string', description: 'Media id, name, or URL' } },
            required: ['target'],
        },
    },
    {
        id: 'stbg_apply_scene',
        title: '应用氛围场景',
        description: 'Apply a saved audiovisual scene snapshot (background, BGM, weather, filters).',
        inputSchema: {
            type: 'object',
            properties: { sceneId: { type: 'string' } },
            required: ['sceneId'],
        },
    },
    {
        id: 'stbg_set_weather',
        title: '设置天气粒子',
        description: 'Set the atmospheric weather FX (rain, snow, sakura, cyber_motes, scanlines, off).',
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['off', 'rain', 'snow', 'sakura', 'cyber_motes', 'scanlines'] },
                density: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
            required: ['type'],
        },
    },
    {
        id: 'stbg_play_bgm',
        title: '播放背景音乐',
        description: 'Play a BGM track from a media library id or URL.',
        inputSchema: {
            type: 'object',
            properties: { url: { type: 'string' } },
            required: ['url'],
        },
    },
    {
        id: 'stbg_apply_preset',
        title: '应用滤镜预设',
        description: 'Apply a visual filter preset id (default, cinema_dark, cyberpunk, ...).',
        inputSchema: {
            type: 'object',
            properties: { presetId: { type: 'string' } },
            required: ['presetId'],
        },
    },
    {
        id: 'stbg_set_filters',
        title: '设置视觉滤镜',
        description: 'Set visual filter values directly (blur px, brightness %, opacity %, saturate %).',
        inputSchema: {
            type: 'object',
            properties: {
                blur: { type: 'number' },
                brightness: { type: 'number' },
                opacity: { type: 'number' },
                saturate: { type: 'number' },
            },
        },
    },
] as const;

/**
 * Registers read-only ambiance tools into the Authority Agent Runtime via agent.browser,
 * claims pending invocations on a short lease, executes them against the public API, and
 * returns results. Everything is idempotent and side-effect free beyond the ambiance itself;
 * the feature is opt-in (settings.agentToolsEnabled, default false).
 */
export class AgentBridge {
    private timer: number | null = null;
    private registerTimer: number | null = null;
    private running = false;
    private pendingSubmit: { claimId: string; invocation: { runId: string; callId: string } } | null = null;
    private claimSeq = 0;

    constructor(
        private client: AuthorityClientLike,
        private host: AgentToolHost,
    ) {}

    public start(): void {
        if (this.running) return;
        this.running = true;
        void this.register();
        this.claimLoop();
        this.registerTimer = window.setInterval(() => void this.register(), REGISTER_INTERVAL_MS);
    }

    public stop(): void {
        this.running = false;
        if (this.timer !== null) window.clearTimeout(this.timer);
        if (this.registerTimer !== null) window.clearInterval(this.registerTimer);
        this.timer = null;
        this.registerTimer = null;
    }

    private agentApi(): AgentBrowserToolApi | null {
        const agent = (this.client as unknown as { agent?: { browser?: AgentBrowserToolApi } }).agent;
        return agent?.browser ?? null;
    }

    private async register(): Promise<void> {
        if (!this.running) return;
        try {
            const api = this.agentApi();
            if (!api) return;
            await api.registerTools({
                browserInstanceId: 'st-bgloader-main',
                leaseDurationMs: REGISTER_INTERVAL_MS * 2,
                tools: TOOL_DEFS.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    inputSchema: t.inputSchema,
                    riskLevel: 'low',
                    approvalPolicy: 'never',
                    mutatesWorkspace: false,
                })),
            });
            console.log('[ST-BgLoader] Agent ambient tools registered.');
        } catch (err) {
            console.warn('[ST-BgLoader] Agent tool registration failed (will retry):', err);
        }
    }

    private claimLoop(): void {
        if (!this.running) return;
        this.timer = window.setTimeout(() => {
            void this.claimOnce().finally(() => this.claimLoop());
        }, CLAIM_INTERVAL_MS);
    }

    private async claimOnce(): Promise<void> {
        const api = this.agentApi();
        if (!api || !this.running) return;

        try {
            // Finish reporting a previous invocation first (idempotent per claimId).
            if (this.pendingSubmit) {
                await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, 'completed', undefined);
                this.pendingSubmit = null;
            }

            const claimId = `stbg-claim-${Date.now()}-${this.claimSeq++}`;
            const response = await api.claim({ browserInstanceId: 'st-bgloader-main', claimId });
            const invocation = response.invocation;
            if (!invocation) return;

            let result: unknown;
            let error: string | undefined;
            try {
                result = await this.execute(invocation.toolId, invocation.arguments);
            } catch (err) {
                error = err instanceof Error ? err.message : String(err);
            }

            if (error) {
                await api.submitResult({
                    runId: invocation.runId, callId: invocation.callId, claimId,
                    browserInstanceId: 'st-bgloader-main', status: 'failed', error,
                });
                return;
            }

            try {
                await api.submitResult({
                    runId: invocation.runId, callId: invocation.callId, claimId,
                    browserInstanceId: 'st-bgloader-main', status: 'completed', result,
                });
            } catch {
                // Keep the claim pending so the next tick retries the report idempotently.
                this.pendingSubmit = { claimId, invocation: { runId: invocation.runId, callId: invocation.callId } };
            }
        } catch {
            // Server hiccup: silent, retried next tick.
        }
    }

    private async reportResult(
        claimId: string,
        invocation: { runId: string; callId: string },
        status: 'completed' | 'failed' | 'cancelled',
        error?: string,
    ): Promise<void> {
        const api = this.agentApi();
        if (!api) return;
        await api.submitResult({
            runId: invocation.runId, callId: invocation.callId, claimId,
            browserInstanceId: 'st-bgloader-main', status, error,
        });
    }

    private async execute(toolId: string, args: unknown): Promise<unknown> {
        const a = (args ?? {}) as Record<string, unknown>;
        switch (toolId) {
            case 'stbg_set_background':
                await this.host.setBackground(String(a.target ?? ''));
                return { ok: true };
            case 'stbg_apply_scene':
                return { ok: this.host.applyScene(String(a.sceneId ?? '')) };
            case 'stbg_set_weather':
                this.host.setWeather(String(a.type ?? 'off'), a.density ? String(a.density) : undefined);
                return { ok: true };
            case 'stbg_play_bgm':
                await this.host.playBGM(String(a.url ?? ''));
                return { ok: true };
            case 'stbg_apply_preset':
                this.host.applyPreset(String(a.presetId ?? 'default'));
                return { ok: true };
            case 'stbg_set_filters':
                this.host.setFilters({
                    blur: typeof a.blur === 'number' ? a.blur : undefined,
                    brightness: typeof a.brightness === 'number' ? a.brightness : undefined,
                    opacity: typeof a.opacity === 'number' ? a.opacity : undefined,
                    saturate: typeof a.saturate === 'number' ? a.saturate : undefined,
                });
                return { ok: true };
            default:
                throw new Error(`Unknown tool: ${toolId}`);
        }
    }
}
