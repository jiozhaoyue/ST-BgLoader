# Technical Design: Stress Testing & Resilience Architecture

## Test Suite Architecture

```
tests/stress.mjs (Puppeteer Suite)
  ├── 1. 100MB+ Synthetic Media Stream Stress Test
  │     ├── Generate 100 * 1024 * 1024 ArrayBuffer chunks
  │     ├── CacheStorage put & verify bytes
  │     ├── Measure heap memory before and after
  │     └── Verify Blob URL creation & mounting
  ├── 2. Rapid Switching Race Condition Test
  │     ├── Fire 10 rapid setBackground & playBGM calls within 500ms
  │     ├── Verify activeLayer settles cleanly
  │     └── Verify no orphaned video or iframe elements remain
  ├── 3. Edge Case & Malformed Media Resilience
  │     ├── Empty 0-byte blob
  │     ├── Non-existent 404 URL
  │     └── Unrecognized mime type fallback
  └── 4. Memory & Resource Cleanup Audit
        ├── Check URL.revokeObjectURL calls
        ├── Verify AudioEngine timers & requestAnimationFrames cleared
        └── Clean up test cache
```

## Resilience Safeguards in Source Code

- **MediaMount double-buffering cancellation**: When a new `mountMedia` arrives before a previous 450ms crossfade finishes, cancel previous cleanup timer immediately and forcibly reset the inactive layer.
- **VideoRenderer error recovery**: Listen for `<video>` `error` event and cleanly log warning without throwing uncaught exceptions.
- **AudioEngine source safety**: Handle empty audio src and catch play rejections gracefully.
