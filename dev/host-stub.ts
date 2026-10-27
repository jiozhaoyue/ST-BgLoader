/**
 * Dev-only host stub.
 *
 * The extension is written to degrade gracefully when host APIs are missing (L1-MR-1),
 * but it still expects a handful of seams to exist before it is worth booting: an event
 * source, a context object, toastr, and the four DOM anchors resolved by HostBridge.
 *
 * This module supplies exactly those seams, and nothing else. It is a development tool:
 * it must never be imported by src/, and it does not try to emulate host behaviour beyond
 * what the extension observes. Drift between this stub and a real host is expected —
 * preview results never replace acceptance on a real Dev instance.
 */

type Handler = (...args: any[]) => void;

class StubEventSource {
    private handlers = new Map<string, Set<Handler>>();

    public on(event: string, handler: Handler): void {
        let set = this.handlers.get(event);
        if (!set) {
            set = new Set();
            this.handlers.set(event, set);
        }
        set.add(handler);
    }

    public once(event: string, handler: Handler): void {
        const wrapped: Handler = (...args) => {
            this.off(event, wrapped);
            handler(...args);
        };
        this.on(event, wrapped);
    }

    public off(event: string, handler: Handler): void {
        this.handlers.get(event)?.delete(handler);
    }

    // The host's teardown API has migrated across versions (removeListener → off →
    // removeEventListener); the extension probes all three, so all three must exist.
    public removeListener(event: string, handler: Handler): void {
        this.off(event, handler);
    }

    public removeEventListener(event: string, handler: Handler): void {
        this.off(event, handler);
    }

    public emit(event: string, ...args: any[]): void {
        for (const handler of [...(this.handlers.get(event) ?? [])]) {
            try {
                handler(...args);
            } catch (err) {
                console.error(`[harness] listener for "${event}" threw:`, err);
            }
        }
    }
}

const eventSource = new StubEventSource();

// Real hosts expose the event source as a window global (window.eventSource) — the
// extension's PublicAPI event mirror binds to that global, so the stub must too.
(window as any).eventSource = eventSource;

const event_types = {
    APP_READY: 'app_ready',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_RECEIVED: 'message_received',
    MESSAGE_EDITED: 'message_edited',
    MESSAGE_DELETED: 'message_deleted',
    MESSAGE_SWIPED: 'message_swiped',
    USER_MESSAGE_RENDERED: 'user_message_rendered',
    CHARACTER_MESSAGE_RENDERED: 'character_message_rendered',
    CHAT_CHANGED: 'chat_id_changed',
    CHARACTER_PAGE_LOADED: 'character_page_loaded',
    GENERATION_STARTED: 'generation_started',
    GENERATION_ENDED: 'generation_ended',
};

const context = {
    eventSource,
    event_types,
    getRequestHeaders: (): Record<string, string> => ({}),
    extensionSettings: {} as Record<string, unknown>,
    characters: [],
    chat: [],
    name1: 'User',
    name2: 'Harness',
    chatId: 'harness-chat',
};

function showToast(kind: string, message: string, title?: string): void {
    const el = document.createElement('div');
    el.className = `st-bgloader-dev-toast st-bgloader-dev-toast-${kind}`;
    el.textContent = title ? `${title}：${message}` : message;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 4200);
}

(window as any).SillyTavern = {
    getContext: () => context,
    libs: {},
};

(window as any).toastr = {
    info: (m: string, t?: string) => showToast('info', m, t),
    success: (m: string, t?: string) => showToast('info', m, t),
    warning: (m: string, t?: string) => showToast('warn', m, t),
    warn: (m: string, t?: string) => showToast('warn', m, t),
    error: (m: string, t?: string) => showToast('error', m, t),
    clear: () => document.querySelectorAll('.st-bgloader-dev-toast').forEach(n => n.remove()),
};

if (new URLSearchParams(location.search).get('host') === 'luker') {
    (window as any).Luker = { harness: true };
}

/** Test surface for dev-harness.mjs — lets the suite fire host events deterministically. */
(window as any).__devHarness = {
    eventSource,
    event_types,
    context,
    emitMessage: (text: string) => eventSource.emit(event_types.MESSAGE_RECEIVED, { mes: text }),
    emitChatChanged: (chatId: string) => eventSource.emit(event_types.CHAT_CHANGED, chatId),
};

export { eventSource, event_types, context };
