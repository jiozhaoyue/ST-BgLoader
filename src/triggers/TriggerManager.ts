import { TriggerRule, TriggerAction } from '../types';

export class TriggerManager {
    private rules: TriggerRule[] = [];
    private onTriggerCallback?: (action: TriggerAction, rule: TriggerRule) => void;
    private eventSourceUnlisteners: Array<() => void> = [];
    private lastTriggeredId: string | null = null;
    private lastTriggerTime = 0;

    constructor(rules: TriggerRule[] = [], onTrigger?: (action: TriggerAction, rule: TriggerRule) => void) {
        this.rules = [...rules];
        this.onTriggerCallback = onTrigger;
    }

    public setTriggerCallback(cb: (action: TriggerAction, rule: TriggerRule) => void): void {
        this.onTriggerCallback = cb;
    }

    public setRules(rules: TriggerRule[]): void {
        this.rules = [...rules];
    }

    public getRules(): TriggerRule[] {
        return this.rules;
    }

    public addRule(rule: TriggerRule): void {
        this.rules.push(rule);
    }

    public removeRule(id: string): void {
        this.rules = this.rules.filter(r => r.id !== id);
    }

    public evaluateCharacter(characterName: string): boolean {
        if (!characterName) return false;
        for (const rule of this.rules) {
            if (!rule.enabled || rule.type !== 'character') continue;
            if (rule.pattern.toLowerCase().trim() === characterName.toLowerCase().trim()) {
                this.fireRule(rule);
                return true;
            }
        }
        return false;
    }

    public evaluateChat(chatId: string): boolean {
        if (!chatId) return false;
        for (const rule of this.rules) {
            if (!rule.enabled || rule.type !== 'chat') continue;
            if (rule.pattern.trim() === chatId.trim()) {
                this.fireRule(rule);
                return true;
            }
        }
        return false;
    }

    public evaluateMessage(text: string): boolean {
        if (!text) return false;
        for (const rule of this.rules) {
            if (!rule.enabled || rule.type !== 'regex') continue;
            try {
                const regex = new RegExp(rule.pattern, 'i');
                if (regex.test(text)) {
                    this.fireRule(rule);
                    return true;
                }
            } catch (err) {
                console.warn(`[ST-BgLoader TriggerManager] Invalid regex pattern "${rule.pattern}":`, err);
            }
        }
        return false;
    }

    private fireRule(rule: TriggerRule): void {
        const now = Date.now();
        // Prevent rapid duplicate trigger within 500ms
        if (this.lastTriggeredId === rule.id && now - this.lastTriggerTime < 500) {
            return;
        }

        this.lastTriggeredId = rule.id;
        this.lastTriggerTime = now;

        console.log(`[ST-BgLoader TriggerManager] Fired rule: "${rule.name}" (${rule.type})`);
        this.onTriggerCallback?.(rule.action, rule);
    }

    public bindSillyTavernEvents(eventSource: any, eventTypes?: any): void {
        this.unbindEvents();
        if (!eventSource || typeof eventSource.on !== 'function') return;

        // Message rendered listener
        const messageHandler = (data: any) => {
            if (typeof data === 'string') {
                this.evaluateMessage(data);
            } else if (data && typeof data.mes === 'string') {
                this.evaluateMessage(data.mes);
            }
        };

        // Chat changed listener
        const chatHandler = (data: any) => {
            const chatId = typeof data === 'string' ? data : (data?.chatId || data?.id);
            if (chatId) {
                this.evaluateChat(String(chatId));
            }
        };

        // Character selected listener
        const charHandler = (data: any) => {
            const charName = typeof data === 'string' ? data : (data?.name || data?.avatar);
            if (charName) {
                this.evaluateCharacter(String(charName));
            }
        };

        const onEvent = (event: string, handler: (...args: any[]) => void) => {
            eventSource.on(event, handler);
            this.eventSourceUnlisteners.push(() => {
                if (typeof eventSource.removeListener === 'function') {
                    eventSource.removeListener(event, handler);
                } else if (typeof eventSource.off === 'function') {
                    eventSource.off(event, handler);
                }
            });
        };

        if (eventTypes) {
            if (eventTypes.MESSAGE_RECEIVED) onEvent(eventTypes.MESSAGE_RECEIVED, messageHandler);
            if (eventTypes.CHARACTER_MESSAGE_RENDERED) onEvent(eventTypes.CHARACTER_MESSAGE_RENDERED, messageHandler);
            if (eventTypes.CHAT_CHANGED) onEvent(eventTypes.CHAT_CHANGED, chatHandler);
            if (eventTypes.CHARACTER_PAGE_LOADED) onEvent(eventTypes.CHARACTER_PAGE_LOADED, charHandler);
        } else {
            // Fallback to common event names
            onEvent('message_received', messageHandler);
            onEvent('character_message_rendered', messageHandler);
            onEvent('chat_changed', chatHandler);
        }
    }

    public unbindEvents(): void {
        for (const unbind of this.eventSourceUnlisteners) {
            try { unbind(); } catch {}
        }
        this.eventSourceUnlisteners = [];
    }

    public destroy(): void {
        this.unbindEvents();
        this.rules = [];
        this.onTriggerCallback = undefined;
    }
}
