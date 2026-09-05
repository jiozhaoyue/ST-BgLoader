# Technical Design: Infrastructure Public API & Autoplay Unmute Engine

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │ External Scripts / Cards  │
                          │   (window.stBgLoader)     │
                          └─────────────┬─────────────┘
                                        │
                         PublicAPI Facade & Event Bus
                                        │
         ┌──────────────────┬───────────┴──────────┬──────────────────┐
         │                  │                      │                  │
         ▼                  ▼                      ▼                  ▼
    MediaMount         AudioEngine            CacheManager      SettingsDrawer
  (Video/Iframe/     (BGM/Playlist/          (IDB/Cache/Blob)    (Presets/UI)
   VisualFilters)     InteractionUnmute)
         │                  │
         │                  ▼
         │           MiniPlayer (Auto-Show)
         ▼
     Double-Buffer Layer (#bg1)
```

## Module Specifications

### 1. `src/api/PublicAPI.ts`
- **Class `PublicAPI`**:
  - `setBackground(url: string, options?: { type?: MediaType; filters?: Partial<VisualFilters>; fit?: string }): Promise<void>`
  - `playBGM(url: string, options?: { volume?: number; loop?: boolean; title?: string }): Promise<void>`
  - `stopBGM(fadeMs?: number): void`
  - `setVolume(volume: number): void`
  - `setFilters(filters: Partial<VisualFilters>): void`
  - `applyPreset(presetId: string): void`
  - `setInteractive(enabled: boolean): void`
  - `getMediaList(): Promise<MediaItem[]>`
  - `getPlaybackState(): PlaybackState`
  - `emit(event: string, ...args: any[]): void`
  - `on(event: string, handler: Function): () => void`
  - `off(event: string, handler: Function): void`

### 2. Autoplay & Interaction-Driven Unmute in `src/audio/AudioEngine.ts`
- `setupInteractionUnmute()`:
  - Check if `isMuted` or browser blocked audio autoplay.
  - Listen once on `window`: `pointerdown`, `keydown`, `touchstart`.
  - On trigger:
    ```typescript
    if (this.isMutedForAutoplay) {
        this.isMutedForAutoplay = false;
        this.fadeInVolume(this.targetVolume, 400);
    }
    ```

### 3. Smart Capsule Lifecycle in `src/ui/MiniPlayer.ts`
- `autoShowOnPlay: boolean = true`
- When `audioEngine.onPlayStateChange(true)`:
  - If `autoShowOnPlay` is true and not explicitly closed, invoke `this.show()`.
- When `audioEngine.onPlayStateChange(false)`:
  - After a short delay (e.g. 1500ms), smoothly fade out if not playing.
