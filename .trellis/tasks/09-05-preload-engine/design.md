# Technical Design: Preload Engine

## Preload Flow

```
stBgLoader.preloadMedia(['https://.../scene1.mp4', 'https://.../bgm1.mp3'])
                        │
                        ▼
            Check IDB / CacheStorage
                 /             \
       [Already Cached]    [Not Cached]
              │                 │
              │         fetch(url) streaming
              │                 │
              │         Put to CacheStorage
              │                 │
              │         Record in IndexedDB
              \                 /
               ▼               ▼
          Return PreloadResult[] + Emit 'preload-complete'
```

## Data Contracts

```typescript
export interface PreloadOptions {
    concurrency?: number;
    onProgress?: (loadedCount: number, totalCount: number, currentUrl: string) => void;
}

export interface PreloadResult {
    url: string;
    success: boolean;
    cached: boolean;
    size: number;
    error?: string;
}
```
