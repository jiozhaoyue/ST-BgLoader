export interface ShortcutActions {
    onToggleBackground?: () => void;
    onTogglePlay?: () => void;
    onToggleMuffle?: () => void;
    onCycleWeather?: () => void;
    onToggleFrostedChat?: () => void;
}

export class ShortcutManager {
    private isEnabled = true;
    private actions: ShortcutActions;

    constructor(actions: ShortcutActions = {}) {
        this.actions = actions;
        this.bindEvents();
    }

    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        if (!this.isEnabled) return;
        // Alt key combinations
        if (e.altKey && !e.ctrlKey && !e.metaKey) {
            const key = e.key.toLowerCase();
            if (key === 'b') {
                e.preventDefault();
                this.actions.onToggleBackground?.();
            } else if (key === 'p') {
                e.preventDefault();
                this.actions.onTogglePlay?.();
            } else if (key === 'm') {
                e.preventDefault();
                this.actions.onToggleMuffle?.();
            } else if (key === 'w') {
                e.preventDefault();
                this.actions.onCycleWeather?.();
            } else if (key === 'f') {
                e.preventDefault();
                this.actions.onToggleFrostedChat?.();
            }
        }
    };

    private bindEvents(): void {
        window.addEventListener('keydown', this.onKeyDown);
    }

    public destroy(): void {
        window.removeEventListener('keydown', this.onKeyDown);
    }
}
