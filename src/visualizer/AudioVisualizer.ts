import { VisualizerOptions, VisualizerMode } from '../types';

export class AudioVisualizer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private parentEl: HTMLElement | null = null;
    private mediaContainerEl: HTMLElement | null = null;
    private analyser: AnalyserNode | null = null;
    private animFrameId: number | null = null;
    private dataArray: Uint8Array<ArrayBuffer> | null = null;

    private currentOptions: VisualizerOptions = {
        mode: 'off',
        color: '#4fa3d1',
        sensitivity: 1.0,
    };

    private width = 0;
    private height = 0;
    private dpr = 1;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'st-bg-visualizer-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.bottom = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '140px';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '3';
        this.canvas.style.display = 'none';

        this.ctx = this.canvas.getContext('2d');
    }

    public mount(parent: HTMLElement, mediaContainer?: HTMLElement): void {
        this.parentEl = parent;
        this.mediaContainerEl = mediaContainer || null;
        if (!this.canvas.parentElement) {
            parent.appendChild(this.canvas);
        }
        this.updateDimensions();
        window.addEventListener('resize', this.onResize);
    }

    private onResize = (): void => {
        this.updateDimensions();
    };

    private updateDimensions(): void {
        if (!this.parentEl) return;
        this.width = this.parentEl.clientWidth || window.innerWidth;
        this.height = 140;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);

        if (this.ctx) {
            this.ctx.scale(this.dpr, this.dpr);
        }
    }

    public setAnalyser(analyser: AnalyserNode | null): void {
        this.analyser = analyser;
        if (this.analyser) {
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
        } else {
            this.dataArray = null;
        }
    }

    public setOptions(options: VisualizerOptions): void {
        this.currentOptions = { ...options };

        if (this.currentOptions.mode === 'off') {
            this.stop();
            this.canvas.style.display = 'none';
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
            if (this.mediaContainerEl) {
                this.mediaContainerEl.style.filter = '';
            }
        } else {
            if (this.currentOptions.mode === 'spectrum') {
                this.canvas.style.display = 'block';
            } else {
                this.canvas.style.display = 'none';
            }
            this.start();
        }
    }

    private start(): void {
        if (this.animFrameId !== null) return;
        const tick = () => {
            this.render();
            if (this.currentOptions.mode !== 'off') {
                this.animFrameId = requestAnimationFrame(tick);
            }
        };
        this.animFrameId = requestAnimationFrame(tick);
    }

    private stop(): void {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    private render(): void {
        if (!this.analyser || !this.dataArray) {
            // Still pump if mock or waiting
            return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        const mode = this.currentOptions.mode;
        const sensitivity = this.currentOptions.sensitivity;

        if (mode === 'pulse') {
            // Calculate bass energy from first 10 bins (~0 - 200 Hz)
            let bassSum = 0;
            const binCount = Math.min(12, this.dataArray.length);
            for (let i = 0; i < binCount; i++) {
                bassSum += this.dataArray[i];
            }
            const bassAvg = (bassSum / binCount) / 255; // 0 to 1
            const pump = Math.pow(bassAvg, 2) * 0.35 * sensitivity;

            if (this.mediaContainerEl) {
                // Subtle reactive brightness pump
                const brightness = 100 + pump * 25;
                const scale = 1 + pump * 0.015;
                this.mediaContainerEl.style.transform = `scale(${scale})`;
                this.mediaContainerEl.style.transition = 'transform 0.06s ease-out';
            }
        } else if (mode === 'spectrum') {
            if (!this.ctx) return;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            const bufferLength = this.dataArray.length;
            // Draw sleek gradient spectrum bars
            const barWidth = Math.max(3, (this.width / bufferLength) * 1.6);
            let x = 0;

            const baseColor = this.currentOptions.color || '#4fa3d1';

            for (let i = 0; i < bufferLength; i++) {
                const val = (this.dataArray[i] / 255) * sensitivity;
                const barHeight = Math.min(this.height, val * (this.height - 10));

                if (barHeight > 1) {
                    const grad = ctx.createLinearGradient(0, this.height, 0, this.height - barHeight);
                    grad.addColorStop(0, `${baseColor}22`);
                    grad.addColorStop(0.7, `${baseColor}aa`);
                    grad.addColorStop(1, `${baseColor}ff`);

                    ctx.fillStyle = grad;
                    // Rounded top bar
                    const y = this.height - barHeight;
                    ctx.beginPath();
                    const radius = Math.min(barWidth / 2, 3);
                    ctx.roundRect(x, y, barWidth - 1.5, barHeight, [radius, radius, 0, 0]);
                    ctx.fill();
                }

                x += barWidth;
                if (x > this.width) break;
            }
        }
    }

    public destroy(): void {
        this.stop();
        window.removeEventListener('resize', this.onResize);
        if (this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        if (this.mediaContainerEl) {
            this.mediaContainerEl.style.transform = '';
            this.mediaContainerEl.style.transition = '';
        }
    }
}
