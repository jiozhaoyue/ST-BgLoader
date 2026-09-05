export interface ParallaxOptions {
    enabled: boolean;
    intensity: number; // 0.0 to 1.0 (default 0.3)
}

export class ParallaxController {
    private targetEl: HTMLElement | null = null;
    private options: ParallaxOptions = {
        enabled: false,
        intensity: 0.3,
    };

    private targetX = 0;
    private targetY = 0;
    private currentX = 0;
    private currentY = 0;
    private animFrameId: number | null = null;
    private isRunning = false;

    constructor() {}

    public attach(element: HTMLElement): void {
        this.targetEl = element;
        if (this.options.enabled) {
            this.enable();
        }
    }

    public setOptions(options: Partial<ParallaxOptions>): void {
        const wasEnabled = this.options.enabled;
        this.options = { ...this.options, ...options };

        if (this.options.enabled && !wasEnabled) {
            this.enable();
        } else if (!this.options.enabled && wasEnabled) {
            this.disable();
        }
    }

    private onMouseMove = (e: MouseEvent): void => {
        if (!this.options.enabled) return;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const maxOffset = 30 * this.options.intensity;
        const normX = (e.clientX - centerX) / centerX;
        const normY = (e.clientY - centerY) / centerY;

        this.targetX = normX * maxOffset;
        this.targetY = normY * maxOffset;

        if (!this.isRunning) {
            this.startLoop();
        }
    };

    private enable(): void {
        window.addEventListener('mousemove', this.onMouseMove, { passive: true });
        if (this.targetEl) {
            this.targetEl.style.willChange = 'transform';
        }
        this.startLoop();
    }

    private disable(): void {
        window.removeEventListener('mousemove', this.onMouseMove);
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.isRunning = false;
        this.targetX = 0;
        this.targetY = 0;
        this.currentX = 0;
        this.currentY = 0;

        if (this.targetEl) {
            this.targetEl.style.transform = '';
            this.targetEl.style.willChange = '';
        }
    }

    private startLoop(): void {
        if (this.isRunning) return;
        this.isRunning = true;

        const tick = () => {
            if (!this.options.enabled) {
                this.isRunning = false;
                return;
            }

            // Smooth spring lerp
            const lerpFactor = 0.08;
            this.currentX += (this.targetX - this.currentX) * lerpFactor;
            this.currentY += (this.targetY - this.currentY) * lerpFactor;

            if (this.targetEl) {
                // Scale slightly to prevent edge revealing during parallax displacement
                const scale = 1 + 0.05 * this.options.intensity;
                this.targetEl.style.transform = `translate3d(${this.currentX.toFixed(2)}px, ${this.currentY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
            }

            // Check if settled
            const delta = Math.abs(this.targetX - this.currentX) + Math.abs(this.targetY - this.currentY);
            if (delta > 0.01) {
                this.animFrameId = requestAnimationFrame(tick);
            } else {
                this.isRunning = false;
                this.animFrameId = null;
            }
        };

        this.animFrameId = requestAnimationFrame(tick);
    }

    public destroy(): void {
        this.disable();
        this.targetEl = null;
    }
}
