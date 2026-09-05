export interface FrostedGlassOptions {
    enabled: boolean;
    blur: number;      // 0 to 20 px
    opacity: number;   // 10 to 100 %
}

export class FrostedGlassController {
    private styleEl: HTMLStyleElement | null = null;
    private options: FrostedGlassOptions = {
        enabled: false,
        blur: 10,
        opacity: 75,
    };

    constructor() {
        this.initStyleTag();
    }

    private initStyleTag(): void {
        const id = 'st-bgloader-frosted-style';
        let style = document.getElementById(id) as HTMLStyleElement;
        if (!style) {
            style = document.createElement('style');
            style.id = id;
            document.head.appendChild(style);
        }
        this.styleEl = style;
        this.updateCss();
    }

    public setOptions(options: Partial<FrostedGlassOptions>): void {
        this.options = { ...this.options, ...options };
        this.apply();
    }

    public getOptions(): FrostedGlassOptions {
        return { ...this.options };
    }

    private updateCss(): void {
        if (!this.styleEl) return;
        this.styleEl.textContent = `
            .st-bgloader-frosted-active #chat,
            .st-bgloader-frosted-active .mes_text,
            .st-bgloader-frosted-active .mes {
                background: rgba(18, 18, 24, var(--st-frosted-opacity, 0.75)) !important;
                backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                -webkit-backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
                transition: background 0.3s ease, backdrop-filter 0.3s ease !important;
            }
        `;
    }

    private apply(): void {
        const root = document.documentElement;
        root.style.setProperty('--st-frosted-blur', `${this.options.blur}px`);
        root.style.setProperty('--st-frosted-opacity', `${(this.options.opacity / 100).toFixed(2)}`);

        if (this.options.enabled) {
            document.body.classList.add('st-bgloader-frosted-active');
        } else {
            document.body.classList.remove('st-bgloader-frosted-active');
        }
    }

    public destroy(): void {
        document.body.classList.remove('st-bgloader-frosted-active');
        if (this.styleEl && this.styleEl.parentElement) {
            this.styleEl.parentElement.removeChild(this.styleEl);
            this.styleEl = null;
        }
    }
}
