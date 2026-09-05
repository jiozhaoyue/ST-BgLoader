import { AmbientSoundOptions, AmbientSoundType } from '../types';

export class AmbientSoundGenerator {
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private activeSource: AudioNode | null = null;
    private lfoOsc: OscillatorNode | null = null;
    private isRunning = false;
    private crackleTimer: number | null = null;

    private currentOptions: AmbientSoundOptions = {
        type: 'off',
        volume: 0.5,
    };

    constructor() {}

    private initContext(): AudioContext | null {
        if (!this.ctx) {
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return null;
                this.ctx = new AudioCtx();
                this.gainNode = this.ctx.createGain();
                this.gainNode.gain.value = this.currentOptions.volume;
                this.gainNode.connect(this.ctx.destination);
            } catch (err) {
                console.warn('[ST-BgLoader AmbientSound] Failed to init AudioContext:', err);
                return null;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public setSound(options: AmbientSoundOptions): void {
        this.currentOptions = { ...options };

        if (this.gainNode && this.ctx) {
            this.gainNode.gain.setTargetAtTime(
                this.currentOptions.type === 'off' ? 0 : this.currentOptions.volume,
                this.ctx.currentTime,
                0.05
            );
        }

        if (this.currentOptions.type === 'off') {
            this.stop();
        } else {
            this.start(this.currentOptions.type);
        }
    }

    public getOptions(): AmbientSoundOptions {
        return { ...this.currentOptions };
    }

    private start(type: AmbientSoundType): void {
        this.stop();
        const ctx = this.initContext();
        if (!ctx || !this.gainNode) return;

        this.isRunning = true;

        if (type === 'rain') {
            this.startRain(ctx);
        } else if (type === 'fire') {
            this.startFire(ctx);
        } else if (type === 'wind') {
            this.startWind(ctx);
        }
    }

    private stop(): void {
        this.isRunning = false;
        if (this.crackleTimer !== null) {
            clearInterval(this.crackleTimer);
            this.crackleTimer = null;
        }
        if (this.lfoOsc) {
            try { this.lfoOsc.stop(); } catch {}
            this.lfoOsc.disconnect();
            this.lfoOsc = null;
        }
        if (this.activeSource) {
            try { (this.activeSource as any).stop?.(); } catch {}
            this.activeSource.disconnect();
            this.activeSource = null;
        }
    }

    /**
     * Synthesize Rain: Pink noise filtered with lowpass & bandpass
     */
    private startRain(ctx: AudioContext): void {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;

        whiteNoise.connect(filter);
        filter.connect(this.gainNode!);
        whiteNoise.start(0);
        this.activeSource = whiteNoise;
    }

    /**
     * Synthesize Fire: Low rumble pink noise + stochastic crackle bursts
     */
    private startFire(ctx: AudioContext): void {
        this.startRain(ctx); // Base low rumble

        // Stochastic crackle impulses
        this.crackleTimer = window.setInterval(() => {
            if (!this.isRunning || !this.ctx || !this.gainNode) return;
            if (Math.random() < 0.35) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300 + Math.random() * 800, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03 + Math.random() * 0.04);
                osc.connect(gain);
                gain.connect(this.gainNode);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            }
        }, 80);
    }

    /**
     * Synthesize Wind: Lowpass filtered noise modulated by a gentle LFO
     */
    private startWind(ctx: AudioContext): void {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 3.0;

        // LFO to sweep wind frequency gently (0.2 Hz)
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 250;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        whiteNoise.connect(filter);
        filter.connect(this.gainNode!);

        lfo.start(0);
        whiteNoise.start(0);

        this.lfoOsc = lfo;
        this.activeSource = whiteNoise;
    }

    public destroy(): void {
        this.stop();
        if (this.ctx) {
            this.ctx.close().catch(() => {});
            this.ctx = null;
        }
        this.gainNode = null;
    }
}
