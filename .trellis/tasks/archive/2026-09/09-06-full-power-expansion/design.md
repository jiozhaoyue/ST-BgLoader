# Technical Design: Full-Power Modular Expansion

## Modular Architecture Overview

```
                         ┌─────────────────────────────┐
                         │      SillyTavern Core       │
                         └──────────────┬──────────────┘
                                        │
                         window.stBgLoader (Public API)
                                        │
    ┌──────────────┬─────────────┬──────┴───────┬─────────────┬─────────────┐
    │              │             │              │             │             │
    ▼              ▼             ▼              ▼             ▼             ▼
MediaMount    AudioEngine  AtmosphereFX   TriggerMgr    Visualizer    ParallaxCtrl
├── Double-   ├── LowPass  ├── Particle   ├── Regex     ├── Analyser  ├── Mouse lerp
│   Buffer    │   Filter   │   Canvas     │   Matcher   │   Node      │   spring
├── Trans-    ├── Playlist │   (Rain/     ├── Character ├── Spectrum  └── translateZ
│   itions    └── Unmute   │   Snow/      │   Binding   └── Pulse         offset
└── Filters                └── Sakura)    └── Actions
```

## Decoupled Design Contracts

1. **`AtmosphereFX`**:
   - `mount(parentEl: HTMLElement): void`
   - `setWeather(type: WeatherType, options?: WeatherOptions): void`
   - `resize(width: number, height: number): void`
   - `destroy(): void`
2. **`AudioVisualizer`**:
   - `attach(audio: HTMLAudioElement): void`
   - `setMode(mode: VisualizerMode): void`
   - `setTargetElement(el: HTMLElement | null): void`
   - `destroy(): void`
3. **`ParallaxController`**:
   - `attach(containerEl: HTMLElement): void`
   - `setEnabled(enabled: boolean, intensity?: number): void`
   - `destroy(): void`
4. **`TriggerManager`**:
   - `registerRule(rule: TriggerRule): void`
   - `evaluateMessage(text: string, characterName?: string): void`
   - `evaluateCharacter(characterName: string): void`
