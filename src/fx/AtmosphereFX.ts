import { WeatherOptions, WeatherType } from '../types';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color?: string;
    rotation?: number;
    vRotation?: number;
    life?: number;
    maxLife?: number;
    oscillationOffset?: number;
}

export class AtmosphereFX {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private parentEl: HTMLElement | null = null;
    private animFrameId: number | null = null;
    private resizeObserver: ResizeObserver | null = null;

    private currentOptions: WeatherOptions = {
        type: 'off',
        density: 'medium',
        speed: 1.0,
        opacity: 0.75,
        wind: 0.5,
    };

    private particles: Particle[] = [];
    private ripples: Particle[] = [];
    private scanlineOffset = 0;
    private width = 0;
    private height = 0;
    private dpr = 1;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'st-bg-atmosphere-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '2'; // Above media layers, below UI
        this.canvas.style.display = 'none';

        this.ctx = this.canvas.getContext('2d');
    }

    public mount(parent: HTMLElement): void {
        this.parentEl = parent;
        if (!this.canvas.parentElement) {
            parent.appendChild(this.canvas);
        }
        this.updateDimensions();

        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateDimensions();
            });
            this.resizeObserver.observe(parent);
        }

        window.addEventListener('resize', this.onWindowResize);
    }

    private onWindowResize = (): void => {
        this.updateDimensions();
    };

    private updateDimensions(): void {
        if (!this.parentEl) return;
        const rect = this.parentEl.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);

        if (this.ctx) {
            this.ctx.scale(this.dpr, this.dpr);
        }

        if (this.currentOptions.type !== 'off') {
            this.initParticles();
        }
    }

    public setWeather(options: WeatherOptions): void {
        this.currentOptions = { ...options };

        if (this.currentOptions.type === 'off') {
            this.stop();
            this.canvas.style.display = 'none';
            this.particles = [];
            this.ripples = [];
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
        } else {
            this.canvas.style.display = 'block';
            this.initParticles();
            this.start();
        }
    }

    private getParticleCount(): number {
        const base = Math.min(this.width, 1920) / 10;
        switch (this.currentOptions.density) {
            case 'low': return Math.floor(base * 0.5);
            case 'high': return Math.floor(base * 2.0);
            case 'medium':
            default: return Math.floor(base);
        }
    }

    private initParticles(): void {
        this.particles = [];
        this.ripples = [];
        const count = this.getParticleCount();
        const type = this.currentOptions.type;

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(type, true));
        }
    }

    private createParticle(type: WeatherType, randomY = false): Particle {
        const y = randomY ? Math.random() * this.height : -20;
        const x = Math.random() * (this.width + 400) - 200;
        const speedMultiplier = this.currentOptions.speed;
        const wind = this.currentOptions.wind;

        switch (type) {
            case 'rain': {
                return {
                    x,
                    y,
                    vx: wind * 3,
                    vy: (12 + Math.random() * 8) * speedMultiplier,
                    size: 10 + Math.random() * 15,
                    alpha: (0.3 + Math.random() * 0.4) * this.currentOptions.opacity,
                };
            }
            case 'snow': {
                return {
                    x,
                    y,
                    vx: (wind * 0.8 + (Math.random() - 0.5) * 0.5),
                    vy: (1 + Math.random() * 2) * speedMultiplier,
                    size: 2 + Math.random() * 3.5,
                    alpha: (0.4 + Math.random() * 0.5) * this.currentOptions.opacity,
                    oscillationOffset: Math.random() * Math.PI * 2,
                };
            }
            case 'sakura': {
                return {
                    x,
                    y,
                    vx: (wind * 1.2 + (Math.random() - 0.5) * 0.8),
                    vy: (1.2 + Math.random() * 2.2) * speedMultiplier,
                    size: 8 + Math.random() * 6,
                    alpha: (0.6 + Math.random() * 0.3) * this.currentOptions.opacity,
                    rotation: Math.random() * Math.PI * 2,
                    vRotation: (Math.random() - 0.5) * 0.04 * speedMultiplier,
                    oscillationOffset: Math.random() * Math.PI * 2,
                };
            }
            case 'cyber_motes': {
                const colors = ['#00f0ff', '#ff007f', '#7928ca', '#00ff88'];
                return {
                    x: Math.random() * this.width,
                    y: randomY ? Math.random() * this.height : this.height + 20,
                    vx: (Math.random() - 0.5) * 1.5 + wind * 0.5,
                    vy: -(1.5 + Math.random() * 3) * speedMultiplier,
                    size: 2 + Math.random() * 3.5,
                    alpha: (0.5 + Math.random() * 0.5) * this.currentOptions.opacity,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 0,
                    maxLife: 150 + Math.random() * 200,
                };
            }
            default: {
                return { x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0 };
            }
        }
    }

    private start(): void {
        if (this.animFrameId !== null) return;
        const tick = () => {
            this.render();
            if (this.currentOptions.type !== 'off') {
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
        if (!this.ctx || this.width === 0 || this.height === 0) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const type = this.currentOptions.type;
        if (type === 'scanlines') {
            this.renderScanlines(ctx);
            return;
        }

        const count = this.particles.length;
        for (let i = 0; i < count; i++) {
            const p = this.particles[i];

            if (type === 'rain') {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(180, 215, 255, ${p.alpha})`;
                ctx.lineWidth = 1.2;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx * 1.2, p.y + p.size);
                ctx.stroke();

                p.x += p.vx;
                p.y += p.vy;

                // Ground splash
                if (p.y > this.height - 20 && Math.random() < 0.15) {
                    this.ripples.push({
                        x: p.x,
                        y: this.height - 5 + Math.random() * 5,
                        vx: 0,
                        vy: 0,
                        size: 1,
                        alpha: p.alpha * 0.8,
                    });
                }

                if (p.y > this.height || p.x < -100 || p.x > this.width + 100) {
                    this.particles[i] = this.createParticle(type, false);
                }
            } else if (type === 'snow') {
                p.oscillationOffset = (p.oscillationOffset || 0) + 0.02;
                const sway = Math.sin(p.oscillationOffset) * 0.8;
                p.x += p.vx + sway;
                p.y += p.vy;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.fill();

                if (p.y > this.height || p.x < -50 || p.x > this.width + 50) {
                    this.particles[i] = this.createParticle(type, false);
                }
            } else if (type === 'sakura') {
                p.oscillationOffset = (p.oscillationOffset || 0) + 0.03;
                p.rotation = (p.rotation || 0) + (p.vRotation || 0.02);
                const sway = Math.sin(p.oscillationOffset) * 1.5;
                p.x += p.vx + sway;
                p.y += p.vy;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 183, 197, ${p.alpha})`;
                ctx.fill();
                ctx.restore();

                if (p.y > this.height || p.x < -50 || p.x > this.width + 50) {
                    this.particles[i] = this.createParticle(type, false);
                }
            } else if (type === 'cyber_motes') {
                p.life = (p.life || 0) + 1;
                p.x += p.vx;
                p.y += p.vy;

                const progress = p.life / (p.maxLife || 200);
                const currentAlpha = p.alpha * Math.sin(progress * Math.PI);

                ctx.save();
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color || '#00f0ff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color || '#00f0ff';
                ctx.globalAlpha = Math.max(0, currentAlpha);
                ctx.fill();
                ctx.restore();

                if (p.y < -20 || (p.life && p.life > (p.maxLife || 200))) {
                    this.particles[i] = this.createParticle(type, false);
                }
            }
        }

        // Render ripples for rain
        for (let j = this.ripples.length - 1; j >= 0; j--) {
            const r = this.ripples[j];
            r.size += 0.8;
            r.alpha -= 0.03;

            if (r.alpha <= 0 || r.size > 14) {
                this.ripples.splice(j, 1);
                continue;
            }

            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.size * 1.5, r.size * 0.6, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(180, 215, 255, ${r.alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    private renderScanlines(ctx: CanvasRenderingContext2D): void {
        const step = 4;
        const alpha = 0.12 * this.currentOptions.opacity;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;

        for (let y = 0; y < this.height; y += step) {
            ctx.fillRect(0, y, this.width, 1.5);
        }

        // Rolling beam scanline
        this.scanlineOffset = (this.scanlineOffset + 2 * this.currentOptions.speed) % this.height;
        const grad = ctx.createLinearGradient(0, this.scanlineOffset - 30, 0, this.scanlineOffset + 30);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * this.currentOptions.opacity})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, this.scanlineOffset - 30, this.width, 60);

        // Subtle CRT flicker
        if (Math.random() < 0.05) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.02 * this.currentOptions.opacity})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    public destroy(): void {
        this.stop();
        window.removeEventListener('resize', this.onWindowResize);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        this.particles = [];
        this.ripples = [];
    }
}
