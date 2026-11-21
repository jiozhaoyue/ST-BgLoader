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
    // 真机 SillyTavern 的 FORCE_SET_BACKGROUND：原生背景选择器选中瓦片时广播。
    // NativeBackgroundController.probe() 以该键存在与否决定 hasForceEvent，缺失会导致
    // 工作台永远判定「宿主无强制设背景事件」而放弃接管，故必须与真机对齐。
    FORCE_SET_BACKGROUND: 'force_set_background',
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

/**
 * 宿主 DOM seam 构造：真机酒馆页面自带 #bg1 背景容器、#bg_menu_content 背景瓦片网格，
 * 并把主题色写成 documentElement 内联变量（--SmartTheme*）。dev/index.html 只放静态壳，
 * 这些「宿主运行时才存在的结构」由本桩补齐，使 MediaMount / NativeBackgroundController /
 * 00-tokens.css 的令牌派生在工作台与真机一致，避免预览与真机渲染漂移。
 *
 * 注意幂等：src/index 可能随 HMR 重载，重复执行不得覆盖已挂载的扩展层。
 */
function installHostDomSeams(): void {
    const root = document.documentElement;

    // 主题变量注入：00-tokens.css 从这些变量派生 --st-bg-*。工作台给一组中性暗色基准，
    // 与真机主题切换机制一致（宿主写内联变量 → var() 自动重算）。
    const themeVars: Record<string, string> = {
        '--SmartThemeBodyColor': '#e6e9ef',
        '--SmartThemeBorderColor': 'rgba(255, 255, 255, 0.1)',
        '--SmartThemeQuoteColor': '#6ea8fe',
        '--SmartThemeBlurTintColor': '#1e1e24',
    };
    for (const [name, value] of Object.entries(themeVars)) {
        if (!root.style.getPropertyValue(name)) root.style.setProperty(name, value);
    }

    // #bg1：MediaMount 的宿主容器与 FrostedGlass 的作用根。工作台里默认隐藏，
    // 由扩展挂载 .st-bg-media-container 后自然承载媒体层。
    if (!document.querySelector('#bg1')) {
        const bg1 = document.createElement('div');
        bg1.id = 'bg1';
        bg1.className = 'st-bgloader-dev-bg1';
        document.body.appendChild(bg1);
    }

    // 原生背景瓦片：NativeBackgroundController.probe() 要求 #bg_menu_content 内的
    // .bg_example 带 bgfile 属性；补齐后接管装饰与拦截才可在工作台复现。
    const menu = document.querySelector('#bg_menu_content');
    if (menu && !menu.querySelector('.bg_example[bgfile]')) {
        const tiles: Array<[string, string]> = [
            ['sample-landscape.svg', 'sample-landscape.svg'],
            ['sample-ambient.wav', 'sample-ambient.wav'],
        ];
        for (const [bgfile, label] of tiles) {
            const tile = document.createElement('div');
            tile.className = 'bg_example';
            tile.setAttribute('bgfile', bgfile);
            tile.setAttribute('title', label);
            tile.textContent = label;
            menu.appendChild(tile);
        }
    }
}

installHostDomSeams();

/**
 * 教程模式（由 mock-server 的 DEV_TUTORIAL 单一权威驱动，经 window.__DEV_TUTORIAL__ 注入）：
 * 浏览器侧持久化拦截。src/index 直接读写 localStorage，src/cache/CacheManager 直接读写
 * CacheStorage 与 IndexedDB；教程态下三者一律替换为内存实现，配合 mock-server 的内存
 * 数据集实现完整 dry-run——零磁盘、零浏览器真实数据写入。均实现标准接口，业务层无感知。
 * URL 参数 ?tutorial=1 已废止，不再作为开关来源。
 */
function createMemoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
        get length() { return store.size; },
        clear(): void { store.clear(); },
        getItem(key: string): string | null { return store.has(key) ? store.get(key)! : null; },
        key(index: number): string | null { return [...store.keys()][index] ?? null; },
        removeItem(key: string): void { store.delete(key); },
        setItem(key: string, value: string): void { store.set(String(key), String(value)); },
    } as Storage;
}

/**
 * 内存版 CacheStorage：只满足 CacheManager 用到的 open/match/put/delete 接口。
 * 所有字节驻留 Map，绝不落浏览器 CacheStorage（不写真实缓存）。
 */
function createMemoryCaches(): CacheStorage {
    const buckets = new Map<string, Map<string, Response>>();
    const cache = (name: string): Map<string, Response> => {
        let bucket = buckets.get(name);
        if (!bucket) { bucket = new Map(); buckets.set(name, bucket); }
        return bucket;
    };
    const asCache = (name: string): Cache => {
        const bucket = cache(name);
        return {
            match: async (req: any) => bucket.get(typeof req === 'string' ? req : req.url)?.clone() ?? undefined,
            put: async (req: any, res: Response) => {
                bucket.set(typeof req === 'string' ? req : req.url, res.clone());
            },
            delete: async (req: any) => bucket.delete(typeof req === 'string' ? req : req.url),
            keys: async () => [...bucket.keys()].map((k) => new Request(k)) as any,
            add: async () => { throw new Error('tutorial: memory caches.add unsupported'); },
            addAll: async () => { throw new Error('tutorial: memory caches.addAll unsupported'); },
            matchAll: async () => [] as any,
        } as unknown as Cache;
    };
    return {
        open: async (name: string) => asCache(name),
        has: async (name: string) => buckets.has(name),
        delete: async (name: string) => buckets.delete(name),
        keys: async () => [...buckets.keys()] as any,
        match: async (req: any) => {
            for (const bucket of buckets.values()) {
                const hit = bucket.get(typeof req === 'string' ? req : req.url);
                if (hit) return hit.clone();
            }
            return undefined;
        },
    } as unknown as CacheStorage;
}

/**
 * 内存版 IndexedDB 的最小门面：只满足 CacheManager 的 open → transaction →
 * objectStore → put/getAll/delete/clear 调用链。任何库/表都不落真实 IndexedDB。
 * 用 Proxy 逐层造桩，request 以微任务异步回调 onsuccess，贴合原生异步时序。
 */
function createMemoryIndexedDB(): IDBFactory {
    type Store = Map<string, any>;
    const databases = new Map<string, Map<string, Store>>();

    const fire = <T>(fn: () => T): Promise<T> => Promise.resolve().then(fn);

    const makeStore = (store: Store): IDBObjectStore => ({
        put: (value: any) => {
            const req: any = { result: undefined, onsuccess: null, onerror: null };
            fire(() => { store.set(value.cacheKey, value); req.onsuccess?.({ target: req }); });
            return req;
        },
        getAll: () => {
            const req: any = { result: undefined, onsuccess: null, onerror: null };
            fire(() => { req.result = [...store.values()]; req.onsuccess?.({ target: req }); });
            return req;
        },
        delete: (key: string) => {
            const req: any = { result: undefined, onsuccess: null, onerror: null };
            fire(() => { store.delete(key); req.onsuccess?.({ target: req }); });
            return req;
        },
        clear: () => {
            const req: any = { result: undefined, onsuccess: null, onerror: null };
            fire(() => { store.clear(); req.onsuccess?.({ target: req }); });
            return req;
        },
    } as unknown as IDBObjectStore);

    const makeDb = (tables: Map<string, Store>): IDBDatabase => ({
        objectStoreNames: { contains: (n: string) => tables.has(n) } as unknown as DOMStringList,
        createObjectStore: (name: string) => { tables.set(name, new Map()); return makeStore(tables.get(name)!); },
        transaction: (name: string) => {
            const store = tables.get(name) ?? new Map<string, any>();
            return { objectStore: () => makeStore(store) } as unknown as IDBTransaction;
        },
    } as unknown as IDBDatabase);

    return {
        open: (name: string) => {
            const isFirstOpen = !databases.has(name);
            const tables = databases.get(name) ?? new Map<string, Store>();
            databases.set(name, tables);
            const request: any = { result: undefined, onupgradeneeded: null, onsuccess: null, onerror: null };
            fire(() => {
                request.result = makeDb(tables);
                // 首次 open 触发 onupgradeneeded，CacheManager 借此创建 objectStore。
                if (isFirstOpen) request.onupgradeneeded?.({ target: request } as any);
                request.onsuccess?.({ target: request } as any);
            });
            return request as IDBOpenDBRequest;
        },
    } as unknown as IDBFactory;
}

// 唯一开关来源：mock-server 经 head inline script 注入，早于本 module 求值。
const isTutorial = (window as any).__DEV_TUTORIAL__ === true;
if (isTutorial) {
    const replace = (name: string, value: unknown, label: string) => {
        try {
            Object.defineProperty(window, name, { value, configurable: true });
        } catch {
            // 宿主禁止改写描述符时降级：如实告警，服务端写入仍由 mock 层拦截。
            console.warn(`[harness] 教程模式无法替换 ${label}，该项可能落到真实存储`);
        }
    };
    replace('localStorage', createMemoryStorage(), 'localStorage');
    replace('caches', createMemoryCaches(), 'CacheStorage');
    replace('indexedDB', createMemoryIndexedDB(), 'IndexedDB');
}

// host 形态参数保留（宿主矩阵测试用），与教程开关无关，不纳入单一权威改造。
if (new URLSearchParams(location.search).get('host') === 'luker') {
    (window as any).Luker = { harness: true };
}

/** Test surface for dev-harness.mjs — lets the suite fire host events deterministically. */
(window as any).__devHarness = {
    eventSource,
    event_types,
    context,
    isTutorial,
    emitMessage: (text: string) => eventSource.emit(event_types.MESSAGE_RECEIVED, { mes: text }),
    emitChatChanged: (chatId: string) => eventSource.emit(event_types.CHAT_CHANGED, chatId),
};

export { eventSource, event_types, context };
