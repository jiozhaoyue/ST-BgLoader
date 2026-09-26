import { MediaType, TakeoverLevel } from '../types';
import { detectMediaType } from '../core/mediaType';

/** Host elements this controller depends on. Missing/changed ones mean "do not take over". */
export interface NativeSeams {
    menuContent: HTMLElement;
    customContent: HTMLElement;
    bgHost: HTMLElement;
    hasForceEvent: boolean;
}

/** Marker on tiles we already decorated, so re-entrant passes are cheap and idempotent. */
const AUGMENTED_ATTR = 'data-st-bg-augmented';
const BADGE_ATTR = 'data-st-bg-badge';
const CURRENT_ATTR = 'data-st-bg-current';
const SELECTED_CLASS = 'st-bg-takeover-selected';

/** Host's chat-metadata key for a locked background (`backgrounds.js:14`). */
const BG_METADATA_KEY = 'custom_background';

/**
 * Give-up window for waiting on host elements that are built lazily. On a non-host page they
 * never appear, and an observer would otherwise re-query on every DOM mutation forever.
 */
const SEAM_WAIT_GIVE_UP_MS = 30000;

/**
 * Takes over SillyTavern's own background picker.
 *
 * The host binds its selection handler as a **document-level delegated click in the bubble
 * phase** (`backgrounds.js:1884`), so a single capture-phase listener at the document root can
 * intercept every selection before the host sees it. This module is that single interception
 * point — it also owns the grid decorations, which is why it replaced `NativeBgAugmenter`
 * rather than sitting next to it: an element-level listener (the old design) can never fire
 * once a capture-phase `stopPropagation()` is in play, so keeping both would leave dead code
 * that looks alive.
 *
 * It never touches host internals: no monkey-patching of `setBackground`,
 * `onSelectBackgroundClick`, `renderSystemBackgrounds` or `background_settings`. The lock state
 * is read through the public context API, everything else through DOM seams.
 */
export class NativeBackgroundController {
    private seams: NativeSeams | null = null;
    private level: TakeoverLevel = 'off';
    private active = false;
    private degraded = false;

    private gridObserver: MutationObserver | null = null;
    private bgHostObserver: MutationObserver | null = null;
    private seamWaitObserver: MutationObserver | null = null;
    private seamGiveUpTimer: number | null = null;

    /**
     * Native `#bg1` background-image captured right before we first cleared it, so `stop()` can
     * put it back without needing to re-drive the host's own loader (design §5 / U-1).
     */
    private savedNativeBgImage = '';

    /**
     * Guards our own write to `#bg1`. Note the MutationObserver callback is async, so this flag
     * has usually been reset by the time it runs — the real loop-breaker is the "already empty"
     * check in `clearNativeBackgroundImage()`. Kept as belt-and-braces for the synchronous path.
     */
    private clearingNativeBg = false;

    /** File name of the media the extension currently has mounted, for the selection marker. */
    private activeFileName: string | null = null;

    constructor(private readonly onSelect: (bgFile: string, type: MediaType) => void) {}

    // ---------------------------------------------------------------- seams

    /**
     * Checks the seams this controller depends on.
     *
     * Returns `null` for "do not take over", which covers two different situations that the
     * caller distinguishes:
     * - the containers are not rendered yet (the background drawer is built lazily) — retryable;
     * - the containers exist but a thumbnail lacks `bgfile` — the host changed its structure.
     */
    public probe(): NativeSeams | null {
        const menuContent = document.querySelector<HTMLElement>('#bg_menu_content');
        const bgHost = document.querySelector<HTMLElement>('#bg1');
        if (!menuContent || !bgHost) return null;

        // An *empty* grid is normal (it is filled when the panel opens), so only a populated
        // grid whose tiles lack `bgfile` counts as a structural break.
        const sample = menuContent.querySelector<HTMLElement>('.bg_example');
        if (sample && !sample.hasAttribute('bgfile')) return null;

        const eventTypes = (window as any).event_types;
        return {
            menuContent,
            customContent: document.querySelector<HTMLElement>('#bg_custom_content') ?? menuContent,
            bgHost,
            hasForceEvent: !!eventTypes?.FORCE_SET_BACKGROUND,
        };
    }

    // ---------------------------------------------------------------- lifecycle

    public isActive(): boolean {
        return this.active;
    }

    public getLevel(): TakeoverLevel {
        return this.level;
    }

    /** Installs (or re-levels) the takeover. Idempotent. */
    public start(level: TakeoverLevel): void {
        this.level = level;
        if (level === 'off') {
            this.stop();
            return;
        }
        if (this.active) return;

        const seams = this.probe();
        if (!seams) {
            // Distinguish "host not ready" from "host changed": only the former is worth waiting on.
            const rendered = !!document.querySelector('#bg_menu_content') && !!document.querySelector('#bg1');
            if (rendered) {
                this.degrade('the background grid no longer exposes `bgfile` tiles');
            } else {
                this.waitForSeams();
            }
            return;
        }
        this.install(seams);
    }

    /** Uninstalls everything: interception, observers, decorations. Idempotent. */
    public stop(): void {
        this.level = 'off';
        this.stopWaitingForSeams();
        if (!this.active) return;

        this.active = false;

        // `removeEventListener` must repeat the exact capture flag used when adding it.
        document.removeEventListener('click', this.onDocumentClickCapture, true);

        this.gridObserver?.disconnect();
        this.gridObserver = null;
        this.bgHostObserver?.disconnect();
        this.bgHostObserver = null;

        const seams = this.seams;
        if (seams) {
            seams.menuContent.querySelectorAll(`[${BADGE_ATTR}]`).forEach((el) => el.remove());
            seams.menuContent.querySelectorAll(`[${CURRENT_ATTR}]`).forEach((el) => el.remove());
            seams.menuContent.querySelectorAll(`.${SELECTED_CLASS}`).forEach((el) => el.classList.remove(SELECTED_CLASS));
            // Drop the marker as well, so a later start() re-decorates from scratch instead of
            // trusting state that may have been invalidated by a grid re-render in between.
            seams.menuContent.querySelectorAll(`[${AUGMENTED_ATTR}]`).forEach((el) => el.removeAttribute(AUGMENTED_ATTR));
            this.restoreNativeBackgroundImage(seams.bgHost);
        }
        this.seams = null;
    }

    public setLevel(level: TakeoverLevel): void {
        if (level === 'off') {
            this.stop();
            return;
        }
        if (!this.active) {
            this.start(level);
            return;
        }
        this.level = level;
    }

    // ---------------------------------------------------------------- decorations

    /**
     * Badges every tile with its media type (non-image only) and re-applies the selection marker.
     * Runs on install and after every grid re-render: the host rebuilds the grid wholesale with
     * `$('#bg_menu_content').empty()` (`backgrounds.js:715`), so both our badge nodes and our
     * class are wiped each time.
     */
    private decorateGrid(): void {
        const seams = this.seams;
        if (!seams || !this.active) return;

        seams.menuContent
            .querySelectorAll<HTMLElement>(`.bg_example[bgfile]:not([${AUGMENTED_ATTR}])`)
            .forEach((tile) => {
                tile.setAttribute(AUGMENTED_ATTR, 'true');
                this.addBadge(tile);
            });

        this.refreshSelection(this.activeFileName);
    }

    private addBadge(tile: HTMLElement): void {
        const type = detectMediaType(tile.getAttribute('bgfile') || '');
        // Images need no badge: the thumbnail already shows what it is. Non-images are the ones
        // whose native preview is meaningless (and which the host's own grid cannot list at all).
        if (type === 'image') return;

        const badge = document.createElement('span');
        badge.className = `st-bg-native-badge ${type}`;
        badge.setAttribute(BADGE_ATTR, 'true');
        badge.textContent = type.toUpperCase();
        tile.appendChild(badge);
    }

    /**
     * Marks the native thumbnail matching the extension's current media.
     *
     * Matching is by the `bgfile` attribute (a plain file name) — never by `data-url`. That one
     * holds a CSS string (`url("backgrounds/x.jpg")`, from `generateUrlParameter`,
     * `backgrounds.js:1533`) and is not a URL at all; it is also invisible to `getAttribute`
     * because the host writes it through jQuery's `.data()`, which keeps it in its own store.
     *
     * The host's own highlight recomputes `.selected-background` from `background_settings.url`
     * (`backgrounds.js:1773`), which we deliberately do not update, so a distinct class is
     * required — and it has to be re-applied on every re-render.
     *
     * **Every write here is conditional on the state actually differing.** This runs from the
     * grid observer, and our marker is a child element, so an unconditional remove-then-add would
     * mutate the grid on every pass and drive the observer in a loop. Convergent writes mean the
     * follow-up pass finds nothing to change and the observer settles.
     */
    public refreshSelection(activeFileName: string | null): void {
        this.activeFileName = activeFileName;
        const seams = this.seams;
        if (!seams) return;

        seams.menuContent.querySelectorAll<HTMLElement>('.bg_example').forEach((tile) => {
            const shouldMark = !!activeFileName && tile.getAttribute('bgfile') === activeFileName;
            const marked = tile.classList.contains(SELECTED_CLASS);
            const marker = tile.querySelector<HTMLElement>(`[${CURRENT_ATTR}]`);

            if (shouldMark && !marked) tile.classList.add(SELECTED_CLASS);
            if (!shouldMark && marked) tile.classList.remove(SELECTED_CLASS);

            if (shouldMark && !marker) {
                const dot = document.createElement('span');
                dot.className = 'st-bg-native-current';
                dot.setAttribute(CURRENT_ATTR, 'true');
                tile.appendChild(dot);
            }
            if (!shouldMark && marker) marker.remove();
        });
    }

    // ---------------------------------------------------------------- interception

    /**
     * The single interception point. Registered on `document` in the **capture** phase: the host
     * listens on `document` in the bubble phase (`backgrounds.js:1884`), and document is the root
     * of the event path, so capture runs first and `stopPropagation()` keeps the event from ever
     * reaching the host's delegated handler.
     */
    private onDocumentClickCapture = (e: MouseEvent): void => {
        if (!this.active || this.level === 'off') return;

        const target = e.target as HTMLElement | null;
        if (!target || typeof target.closest !== 'function') return;

        const tile = target.closest<HTMLElement>('.bg_example');
        if (!tile || !this.shouldTakeOver(tile, target)) return;

        const bgFile = tile.getAttribute('bgfile');
        if (!bgFile) return;

        e.preventDefault();
        e.stopPropagation();
        this.onSelect(bgFile, detectMediaType(bgFile));
    };

    /**
     * Decides whether a thumbnail click is ours to handle.
     *
     * Every pass-through rule below mirrors a branch the host itself acts on, so that taking the
     * picker over never removes a capability the user had. Each one names its host signal; the
     * line numbers are for the host version recorded in `research/st-native-evidence.md`.
     */
    private shouldTakeOver(tile: HTMLElement, target: HTMLElement): boolean {
        // 1) Group multi-select mode: the click means "add to selection", not "set background"
        //    (`backgrounds.js:1033` reflects the mode onto `#Backgrounds.bg-selection-mode`).
        if (document.querySelector('#Backgrounds.bg-selection-mode')) return false;

        // 2) The current chat has a locked background (ruling D-1, 2026-09-26). The host's second
        //    branch (`backgrounds.js:431`) then writes the *chat's* background and `#bg1` directly
        //    instead of the global setting. Intercepting it would make the host's own "lock this
        //    background to this chat" feature fail silently, so the picker stays native here.
        if (this.isChatBackgroundLocked()) return false;

        // 3) Tile menu buttons, folder tiles and the mobile menu toggles all have their own host
        //    handlers (`backgrounds.js:1901` / `:1849` / `:1885`) — clicking them is not a
        //    background selection.
        if (target.closest('.jg-button, .bg_folder_tile, .mobile-only-menu-toggle')) return false;

        // 4) Chat-specific backgrounds (`custom="true"`) are the host's per-chat list, keyed by a
        //    different URL scheme; they are not entries in our catalogue (`backgrounds.js:423`).
        if (tile.getAttribute('custom') === 'true') return false;

        // 5) Level: `non-image` leaves images to the host entirely.
        if (this.level === 'non-image' && detectMediaType(tile.getAttribute('bgfile') || '') === 'image') return false;

        return true;
    }

    /**
     * Whether the current chat has a locked background.
     *
     * Read through the **public** context API: `getContext().chatMetadata` is a documented getter
     * (`st-context.js:2477`), so this is not host-internals sniffing. The key is read from the
     * chat file the host persists, which makes it stable — renaming it would invalidate every
     * historical chat's lock, so the host cannot change it without a migration. (The alternative
     * signal, the `.locked-background` class from `backgrounds.js:355`, is a *rendering* result
     * refreshed only at certain moments, so the metadata is the authority.)
     */
    private isChatBackgroundLocked(): boolean {
        const ctx = (window as any).SillyTavern?.getContext?.();
        const meta = ctx?.chatMetadata;
        return !!meta?.[BG_METADATA_KEY];
    }

    // ---------------------------------------------------------------- #bg1 layer

    /**
     * Clears the host's own background image so the extension's layer is the only visible one.
     *
     * Idempotent and repeatable by design: the host rewrites `#bg1` on chat changes and on lock
     * actions (`backgrounds.js:310` / `:380` / `:288` / `:433`), so a one-shot clear would be
     * undone the moment the user switches chats.
     */
    public clearNativeBackgroundImage(): void {
        const seams = this.seams;
        if (!this.active || !seams || this.clearingNativeBg) return;

        // D-1 again, and this is the half that is easy to miss: passing the click through is not
        // enough. If we kept clearing while the chat is locked, the host would write the locked
        // image and we would immediately wipe it — a visible fight that leaves the locked
        // background permanently invisible.
        if (this.isChatBackgroundLocked()) return;

        if (!seams.bgHost.style.backgroundImage) return;

        this.clearingNativeBg = true;
        try {
            seams.bgHost.style.backgroundImage = '';
        } finally {
            this.clearingNativeBg = false;
        }
    }

    /**
     * Best-effort restoration of the host's background on `stop()` (design §5's open item U-1).
     *
     * The host's own loader is not callable, so the value captured when the takeover started is
     * put back. While takeover was active the user could not change the host's global background
     * (we intercepted those clicks), so the host's own belief still matches that snapshot — the
     * one case that can differ is a chat change during takeover, which the host would normally
     * have answered with the new chat's locked/default background.
     */
    private restoreNativeBackgroundImage(bgHost: HTMLElement): void {
        if (!this.savedNativeBgImage) return;
        this.clearingNativeBg = true;
        try {
            bgHost.style.backgroundImage = this.savedNativeBgImage;
        } finally {
            this.clearingNativeBg = false;
        }
    }

    // ---------------------------------------------------------------- install internals

    private install(seams: NativeSeams): void {
        this.seams = seams;
        this.active = true;
        this.savedNativeBgImage = seams.bgHost.style.backgroundImage;

        document.addEventListener('click', this.onDocumentClickCapture, true);

        // The host's four `#bg1` writers all go through the inline style, so attribute
        // observation catches every one of them without touching the host's code.
        this.bgHostObserver = new MutationObserver(() => this.clearNativeBackgroundImage());
        this.bgHostObserver.observe(seams.bgHost, { attributes: true, attributeFilter: ['style'] });

        this.gridObserver = new MutationObserver(() => this.decorateGrid());
        this.gridObserver.observe(seams.menuContent, { childList: true, subtree: true });

        this.clearNativeBackgroundImage();
        this.decorateGrid();
    }

    /** Waits for lazily-built host containers, then starts for real. */
    private waitForSeams(): void {
        if (this.seamWaitObserver) return;
        this.seamWaitObserver = new MutationObserver(() => {
            if (!document.querySelector('#bg_menu_content') || !document.querySelector('#bg1')) return;
            this.stopWaitingForSeams();
            if (this.level !== 'off') this.start(this.level);
        });
        this.seamWaitObserver.observe(document.body, { childList: true, subtree: true });
        this.seamGiveUpTimer = window.setTimeout(() => this.stopWaitingForSeams(), SEAM_WAIT_GIVE_UP_MS);
    }

    private stopWaitingForSeams(): void {
        this.seamWaitObserver?.disconnect();
        this.seamWaitObserver = null;
        if (this.seamGiveUpTimer !== null) {
            window.clearTimeout(this.seamGiveUpTimer);
            this.seamGiveUpTimer = null;
        }
    }

    /**
     * Probe failed on a rendered host: stay in enhancement mode. Media, the panel and the public
     * API are untouched — only the takeover is skipped — and we say so once.
     */
    private degrade(reason: string): void {
        if (this.degraded) return;
        this.degraded = true;
        console.warn(
            `[ST-BgLoader] Native background takeover disabled: ${reason}. ` +
            'The extension keeps working; the native picker simply stays native.',
        );
    }
}
