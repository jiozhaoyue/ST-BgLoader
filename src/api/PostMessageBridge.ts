/**
 * PostMessageBridge — 跨 iframe 的 JSON-RPC 端点桥（design §2）。
 *
 * 解决的核心缺口：酒馆助手（TavernHelper/JS-Slash-Runner）等脚本运行在 iframe 内，
 * 只能碰到 window.parent 上的本插件——window.stBgLoader 对它们不可达。本桥让任何
 * iframe 内脚本用 postMessage 调用 EndpointRegistry 白名单内的全部公开方法。
 *
 * 帧协议（source 恒为 'st-bgloader'）：
 *   请求   { source, kind:'request',  id, method, params? }
 *   响应   { source, kind:'response', id, result? } | { ..., error:{ code, message } }
 *   事件   { source, kind:'event',    event, args }
 *
 * 安全与纪律：
 *  - 方法白名单 = EndpointRegistry（on/off/emit 与内部方法永不暴露）；
 *  - 响应只回发到 event.source，单次响应保证（重复 id 忽略）；
 *  - 事件推送只发给「近 60s 内成功请求过」的 source（隐式订阅，不主动全窗口广播）；
 *  - 有界等待（L1-MR-7）：调用统一 30s 超时，Timeout 错误帧兜底；
 *  - 错误帧不携带内部栈——只给 code + message。
 */
import { isWhitelisted } from './EndpointRegistry';
import type { PublicAPI } from './PublicAPI';

export const BRIDGE_SOURCE = 'st-bgloader';
const REQUEST_TIMEOUT_MS = 30_000;
const EVENT_SUBSCRIBER_TTL_MS = 60_000;
/** 已服务 id 登记上限（FIFO 淘汰）：同一 id 本会话内永远只回一次。 */
const SERVED_IDS_CAP = 512;

interface BridgeRequest {
    source?: string;
    kind?: string;
    id?: unknown;
    method?: unknown;
    params?: unknown;
}

export class PostMessageBridge {
    private api: PublicAPI;
    private handler: ((ev: MessageEvent) => void) | null = null;
    private servedIds: Set<string> = new Set();
    /** 隐式事件订阅表：source → 最后一次成功请求的时间戳。 */
    private subscribers: Map<Window, number> = new Map();

    constructor(api: PublicAPI) {
        this.api = api;
    }

    public start(): void {
        if (this.handler) return;
        this.handler = (ev: MessageEvent) => void this.handleMessage(ev);
        window.addEventListener('message', this.handler);
        this.api.bridgeActive = true;
    }

    public stop(): void {
        if (!this.handler) return;
        window.removeEventListener('message', this.handler);
        this.handler = null;
        this.servedIds.clear();
        this.subscribers.clear();
        this.api.bridgeActive = false;
    }

    private async handleMessage(ev: MessageEvent): Promise<void> {
        const data = ev.data as BridgeRequest | null;
        if (!data || typeof data !== 'object' || data.source !== BRIDGE_SOURCE) return;
        if (data.kind !== 'request') return;
        if (typeof data.id !== 'string' || data.id.length === 0) return;
        // 单次响应保证：id 已服务过（无论并发还是先后重发）一律忽略
        if (this.servedIds.has(data.id)) return;
        this.servedIds.add(data.id);
        if (this.servedIds.size > SERVED_IDS_CAP) {
            const oldest = this.servedIds.values().next().value;
            if (oldest !== undefined) this.servedIds.delete(oldest);
        }

        const source = ev.source as Window | null;
        if (!source || typeof source.postMessage !== 'function') return;

        if (!isWhitelisted(data.method)) {
            this.respond(source, data.id, {
                error: {
                    code: 'UnknownMethod',
                    message: `method "${String(data.method)}" 不在白名单内（listMethods 查看可用端点）`,
                },
            });
            return;
        }

        const fn = (this.api as unknown as Record<string, (...a: unknown[]) => unknown>)[data.method];
        // 白名单与实现漂移的运行时兜底（harness 另有构建期对照断言）
        if (typeof fn !== 'function') {
            this.respond(source, data.id, {
                error: { code: 'UnknownMethod', message: `method "${data.method}" 已登记但实现缺失` },
            });
            return;
        }

        const params = Array.isArray(data.params) ? data.params : [];
        let result: unknown;
        try {
            result = await this.withTimeout(Promise.resolve(fn.apply(this.api, params)), data.method);
        } catch (err) {
            this.respond(source, data.id, {
                error: {
                    code: err instanceof Error && err.message.startsWith('INVALID_PARAMS')
                        ? 'InvalidParams'
                        : 'InvokeError',
                    message: err instanceof Error ? err.message : String(err),
                },
            });
            return;
        }

        // 成功请求 = 隐式订阅事件推送（TTL 续期）
        this.subscribers.set(source, Date.now());
        this.respond(source, data.id, { result: result === undefined ? null : result });
    }

    /** 有界等待：任何方法 30s 内必须 settle，超时抛 BRIDGE_TIMEOUT（L1-MR-7）。 */
    private withTimeout(p: Promise<unknown>, method: string): Promise<unknown> {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => reject(new Error(`BRIDGE_TIMEOUT: ${method} 超过 ${REQUEST_TIMEOUT_MS}ms 未返回`)),
                REQUEST_TIMEOUT_MS,
            );
        });
        return Promise.race([p, timeout]).finally(() => {
            if (timer !== null) clearTimeout(timer);
        });
    }

    private respond(source: Window, id: string, payload: { result?: unknown; error?: { code: string; message: string } }): void {
        try {
            source.postMessage({ source: BRIDGE_SOURCE, kind: 'response', id, ...payload }, '*');
        } catch (err) {
            console.warn('[ST-BgLoader PostMessageBridge] respond failed:', err);
        }
    }

    /** 事件推送：只发给 TTL 内活跃过的 source（目标窗口销毁时静默跳过）。 */
    public broadcastEvent(event: string, args: unknown[]): void {
        if (!this.handler) return;
        const now = Date.now();
        for (const [win, seen] of this.subscribers) {
            if (now - seen > EVENT_SUBSCRIBER_TTL_MS) {
                this.subscribers.delete(win);
                continue;
            }
            try {
                win.postMessage({ source: BRIDGE_SOURCE, kind: 'event', event, args }, '*');
            } catch {
                // 目标窗口已销毁——静默跳过
            }
        }
    }
}
