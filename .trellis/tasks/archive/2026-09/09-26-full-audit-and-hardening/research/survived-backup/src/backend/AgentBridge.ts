import { AGENT_BROWSER_INSTANCE, AuthorityClientLike, isAuthorityPermissionError } from './AuthorityBridge';
import { WEATHER_TYPES } from '../types';

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

export type AgentToolsState = 'ok' | 'blocked' | 'pending';
export type AgentToolsStateReporter = (state: AgentToolsState, note?: string) => void;

const REGISTER_INTERVAL_MS = 30000;
const CLAIM_INTERVAL_MS = 2000;
/** Permission 'blocked' verdicts only change by an admin-side action; retrying every 30s is pure noise. */
const PERMISSION_BACKOFF_MS = 5 * 60 * 1000;
/**
 * While an authorization prompt may be open in-page, re-registering stacks another prompt on top
 * (register AND claim each trigger one per call) — stay quiet for this window instead.
 */
const PENDING_WINDOW_MS = 2 * 60 * 1000;
/** Bounded wait for the registration round-trip (L1-MR-7: no await may hang forever). */
const REGISTER_TIMEOUT_MS = 15000;

/** Thrown by registerWithTimeout when the registration round-trip exceeds REGISTER_TIMEOUT_MS. */
class AgentRegisterTimeoutError extends Error {
    constructor() {
        super('Agent tool registration timed out');
        this.name = 'AgentRegisterTimeoutError';
    }
}

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
        // Fourth copy of the weather vocabulary used to live here as a literal, which silently
        // drifted whenever a weather type was added. Referencing the shared constant keeps the
        // AI-facing tool schema in step with the runtime validator in PublicAPI.
        description: `Set the atmospheric weather FX (${WEATHER_TYPES.join(', ')}).`,
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: WEATHER_TYPES },
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

export type AgentToolsOutcomeReporter = (ok: boolean, note?: string) => void;

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
    private reportedState: AgentToolsState | null = null;
    private permissionBlockedUntil = 0;
    private registerWaitUntil = 0;
    private registerInFlight = false;
    /** Claim calls evaluate the same agent.browser permission — never claim before registration succeeded. */
    private registrationOk = false;
    private warnedIssue = false;

    constructor(
        private client: AuthorityClientLike,
        private host: AgentToolHost,
        private reportState: AgentToolsStateReporter = () => {},
    ) {}

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.permissionBlockedUntil = 0;
        this.registerWaitUntil = 0;
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
        this.reportedState = null;
        this.registrationOk = false;
    }

    private agentApi(): AgentBrowserToolApi | null {
        const agent = (this.client as unknown as { agent?: { browser?: AgentBrowserToolApi } }).agent;
        return agent?.browser ?? null;
    }

    private async register(): Promise<void> {
        if (!this.running || this.registerInFlight) return;
        if (Date.now() < this.permissionBlockedUntil || Date.now() < this.registerWaitUntil) return;
        this.registerInFlight = true;
        try {
            const api = this.agentApi();
            if (!api) return;
            await this.registerWithTimeout(api);
            this.permissionBlockedUntil = 0;
            this.registerWaitUntil = 0;
            this.registrationOk = true;
            this.warnedIssue = false;
            this.publishState('ok');
            console.log('[ST-BgLoader] Agent ambient tools registered.');
        } catch (err) {
            this.registrationOk = false;
            if (isAuthorityPermissionError(err)) {
                // A permission verdict will not lift by retrying quickly; back off and pick up an
                // admin-side change (Security Center) on the next slow retry.
                this.permissionBlockedUntil = Date.now() + PERMISSION_BACKOFF_MS;
                this.publishState('blocked', err instanceof Error ? err.message : String(err));
                this.warnOnce('Agent tool registration blocked by permission policy '
                    + '(retrying every 5 min — adjust in Authority Security Center if intended):', err);
            } else if (err instanceof AgentRegisterTimeoutError) {
                // Most likely an authorization prompt is open in-page waiting for the user; do not
                // stack more prompts on top — stay quiet, report pending, retry after the window.
                this.registerWaitUntil = Date.now() + PENDING_WINDOW_MS;
                this.publishState('pending', '等待 agent.browser 授权（若页面出现 Authority 权限弹窗请处理；稍后自动重试）');
                this.warnOnce('Agent tool registration is waiting for permission (check the Authority prompt / Security Center):', err);
            } else {
                console.warn('[ST-BgLoader] Agent tool registration failed (will retry):', err);
            }
        } finally {
            this.registerInFlight = false;
        }
    }

    private warnOnce(message: string, err: unknown): void {
        if (!this.warnedIssue) {
            this.warnedIssue = true;
            console.warn(`[ST-BgLoader] ${message}`, err);
        } else {
            console.debug(`[ST-BgLoader] ${message}`);
        }
    }

    private async registerWithTimeout(api: AgentBrowserToolApi): Promise<unknown> {
        let timeoutHandle: number | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timeoutHandle = window.setTimeout(() => reject(new AgentRegisterTimeoutError()), REGISTER_TIMEOUT_MS);
        });
        try {
            return await Promise.race([
                api.registerTools({
                    browserInstanceId: AGENT_BROWSER_INSTANCE,
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
                }),
                timeout,
            ]);
        } finally {
            if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
        }
    }

    private publishState(state: AgentToolsState, note?: string): void {
        if (this.reportedState === state) return;
        this.reportedState = state;
        this.reportState(state, note);
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
        // Claim evaluates the same agent.browser permission as register; before a grant exists it
        // would open one authorization prompt every 2 seconds. Only claim a working registration.
        if (!this.registrationOk) return;

        try {
            // Finish reporting a previous invocation first (idempotent per claimId).
            if (this.pendingSubmit) {
                await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, 'completed', undefined);
                this.pendingSubmit = null;
            }

            const claimId = `stbg-claim-${Date.now()}-${this.claimSeq++}`;
            const response = await api.claim({ browserInstanceId: AGENT_BROWSER_INSTANCE, claimId });
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
                    browserInstanceId: AGENT_BROWSER_INSTANCE, status: 'failed', error,
                });
                return;
            }

            try {
                await api.submitResult({
                    runId: invocation.runId, callId: invocation.callId, claimId,
                    browserInstanceId: AGENT_BROWSER_INSTANCE, status: 'completed', result,
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
            browserInstanceId: AGENT_BROWSER_INSTANCE, status, error,
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
