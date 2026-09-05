const f = {
  default: {
    id: "default",
    name: "Default (原色)",
    filters: { blur: 0, brightness: 100, opacity: 100, saturate: 100 }
  },
  cinema_dark: {
    id: "cinema_dark",
    name: "Cinema Dark (影院暗调)",
    filters: { blur: 3, brightness: 75, opacity: 90, saturate: 95 }
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk (赛博霓虹)",
    filters: { blur: 0, brightness: 110, opacity: 100, saturate: 160 }
  },
  vintage_sepia: {
    id: "vintage_sepia",
    name: "Vintage (复古胶片)",
    filters: { blur: 1, brightness: 90, opacity: 90, saturate: 70 }
  },
  dreamy_bloom: {
    id: "dreamy_bloom",
    name: "Dreamy (梦幻光晕)",
    filters: { blur: 6, brightness: 125, opacity: 95, saturate: 115 }
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome (黑白极简)",
    filters: { blur: 0, brightness: 100, opacity: 100, saturate: 0 }
  }
}, E = {
  enabled: !0,
  activeMediaId: null,
  volume: 0.8,
  muted: !1,
  pauseOnBlur: !0,
  filters: {
    blur: 0,
    brightness: 100,
    opacity: 100,
    saturate: 100
  },
  activePresetId: "default",
  userPresets: {},
  interactiveBackground: !1,
  showMiniPlayer: !0,
  capsuleOnPlayOnly: !0,
  playbackMode: "loop",
  playlist: [],
  cacheQuotaMB: 1024,
  lruAutoClean: !0,
  chatBindings: {}
}, B = "st_bg_loader_db", R = 1, g = "media_items", M = "st-bg-cache-v1";
class V {
  db = null;
  cache = null;
  objectUrls = /* @__PURE__ */ new Map();
  async init() {
    "caches" in window && (this.cache = await caches.open(M)), this.db = await new Promise((e, i) => {
      const t = indexedDB.open(B, R);
      t.onupgradeneeded = (s) => {
        const a = s.target.result;
        if (!a.objectStoreNames.contains(g)) {
          const n = a.createObjectStore(g, { keyPath: "id" });
          n.createIndex("type", "type", { unique: !1 }), n.createIndex("lastUsedTimestamp", "lastUsedTimestamp", { unique: !1 });
        }
      }, t.onsuccess = () => e(t.result), t.onerror = () => i(t.error);
    });
  }
  async listMedia() {
    return this.db || await this.init(), new Promise((e, i) => {
      const a = this.db.transaction(g, "readonly").objectStore(g).getAll();
      a.onsuccess = () => e(a.result || []), a.onerror = () => i(a.error);
    });
  }
  async getMedia(e) {
    return this.db || await this.init(), new Promise((i, t) => {
      const n = this.db.transaction(g, "readonly").objectStore(g).get(e);
      n.onsuccess = () => i(n.result || null), n.onerror = () => t(n.error);
    });
  }
  async saveMedia(e, i, t, s, a) {
    (!this.db || !this.cache) && await this.init();
    const n = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), l = `/st-bg-cache/${n}/${encodeURIComponent(i)}`;
    let o, d = "", h = 0;
    typeof e == "string" ? (d = t === "svg" ? "image/svg+xml" : "text/html", o = new Blob([e], { type: d }), h = o.size) : (o = e, d = e.type || this.guessMimeType(i, t), h = e.size);
    const u = new Headers({
      "Content-Type": d,
      "Content-Length": h.toString()
    }), p = new Response(o, { headers: u });
    await this.cache.put(l, p);
    const y = {
      id: n,
      name: i,
      type: t,
      source: s,
      url: a || l,
      cacheKey: l,
      size: h,
      mimeType: d,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: t === "video" || t === "audio"
    };
    return await new Promise((b, v) => {
      const c = this.db.transaction(g, "readwrite").objectStore(g).put(y);
      c.onsuccess = () => b(), c.onerror = () => v(c.error);
    }), y;
  }
  async getMediaBlobUrl(e) {
    if (this.objectUrls.has(e.id))
      return this.touchMedia(e.id), this.objectUrls.get(e.id);
    this.cache || await this.init();
    let i = await this.cache.match(e.cacheKey);
    if (!i && e.source === "url" && e.url)
      try {
        const t = await fetch(e.url);
        if (t.ok) {
          const s = t.clone();
          await this.cache.put(e.cacheKey, s), i = t;
        }
      } catch (t) {
        console.warn("[ST-BgLoader] Failed to fetch and cache remote URL:", e.url, t);
      }
    if (i) {
      const t = await i.blob(), s = URL.createObjectURL(t);
      return this.objectUrls.set(e.id, s), this.touchMedia(e.id), s;
    }
    return e.url;
  }
  async touchMedia(e) {
    if (!this.db) return;
    const i = await this.getMedia(e);
    i && (i.lastUsedTimestamp = Date.now(), this.db.transaction(g, "readwrite").objectStore(g).put(i));
  }
  async deleteMedia(e) {
    (!this.db || !this.cache) && await this.init();
    const i = await this.getMedia(e);
    i && (await this.cache.delete(i.cacheKey), this.objectUrls.has(e) && (URL.revokeObjectURL(this.objectUrls.get(e)), this.objectUrls.delete(e)), await new Promise((t, s) => {
      const l = this.db.transaction(g, "readwrite").objectStore(g).delete(e);
      l.onsuccess = () => t(), l.onerror = () => s(l.error);
    }));
  }
  async getCacheUsage() {
    const e = await this.listMedia();
    let i = 0;
    for (const t of e)
      i += t.size || 0;
    return { usedBytes: i, itemCount: e.length };
  }
  async cleanLRU(e) {
    const i = await this.listMedia();
    let t = i.reduce((s, a) => s + (a.size || 0), 0);
    if (!(t <= e)) {
      i.sort((s, a) => s.lastUsedTimestamp - a.lastUsedTimestamp);
      for (const s of i) {
        if (t <= e) break;
        console.log("[ST-BgLoader] LRU evicting:", s.name, s.size), t -= s.size || 0, await this.deleteMedia(s.id);
      }
    }
  }
  async clearAll() {
    (!this.db || !this.cache) && await this.init();
    for (const e of this.objectUrls.values())
      URL.revokeObjectURL(e);
    this.objectUrls.clear(), "caches" in window && (await caches.delete(M), this.cache = await caches.open(M)), await new Promise((e, i) => {
      const a = this.db.transaction(g, "readwrite").objectStore(g).clear();
      a.onsuccess = () => e(), a.onerror = () => i(a.error);
    });
  }
  guessMimeType(e, i) {
    switch (e.split(".").pop()?.toLowerCase()) {
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "ogg":
        return "audio/ogg";
      case "flac":
        return "audio/flac";
      case "svg":
        return "image/svg+xml";
      case "html":
        return "text/html";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      default:
        return i === "video" ? "video/mp4" : i === "audio" ? "audio/mpeg" : i === "svg" ? "image/svg+xml" : i === "html" ? "text/html" : "image/png";
    }
  }
}
class q {
  audioElement = null;
  attachedVideo = null;
  volume = 0.8;
  muted = !1;
  isPausedForBlur = !1;
  fadeTimer = null;
  playlist = [];
  currentIndex = -1;
  playbackMode = "loop";
  urlResolver;
  userHasInteracted = !1;
  isWaitingForInteractionUnmute = !1;
  onTrackChange;
  onPlayStateChange;
  setUrlResolver(e) {
    this.urlResolver = e;
  }
  isWaitingForUnmute() {
    return this.isWaitingForInteractionUnmute;
  }
  notifyUserInteraction() {
    this.userHasInteracted = !0, this.isWaitingForInteractionUnmute && (this.isWaitingForInteractionUnmute = !1, this.fadeInVolume(this.volume, 400));
  }
  async playMediaItem(e, i) {
    const t = this.playlist.findIndex((a) => a.id === e.id);
    t !== -1 ? this.currentIndex = t : (this.playlist.push(e), this.currentIndex = this.playlist.length - 1);
    const s = i || (this.urlResolver ? await this.urlResolver(e) : e.url);
    await this.playTrack(s, this.playbackMode === "single"), this.onTrackChange?.(e);
  }
  async playCurrentTrack() {
    const e = this.getCurrentTrack();
    if (!e || !this.audioElement) return;
    this.clearFade();
    const i = this.urlResolver ? await this.urlResolver(e) : e.url;
    this.audioElement.src = i, this.audioElement.loop = this.playbackMode === "single", !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
    try {
      await this.audioElement.play(), this.onTrackChange?.(e);
    } catch (t) {
      console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", t);
    }
  }
  constructor() {
    this.audioElement = new Audio(), this.audioElement.preload = "auto", this.audioElement.addEventListener("ended", () => {
      this.handleTrackEnded();
    }), this.audioElement.addEventListener("play", () => {
      this.onPlayStateChange?.(!0);
    }), this.audioElement.addEventListener("pause", () => {
      this.onPlayStateChange?.(!1);
    }), this.setupInteractionListener();
  }
  setupInteractionListener() {
    const e = () => {
      this.notifyUserInteraction(), window.removeEventListener("pointerdown", e), window.removeEventListener("keydown", e), window.removeEventListener("touchstart", e);
    };
    window.addEventListener("pointerdown", e, { passive: !0, once: !0 }), window.addEventListener("keydown", e, { passive: !0, once: !0 }), window.addEventListener("touchstart", e, { passive: !0, once: !0 });
  }
  setVolume(e) {
    this.volume = Math.max(0, Math.min(1, e)), this.applyVolume();
  }
  setMuted(e) {
    this.muted = e, this.applyVolume();
  }
  getVolume() {
    return this.volume;
  }
  isMuted() {
    return this.muted;
  }
  isPlaying() {
    return !!(this.audioElement && !this.audioElement.paused);
  }
  setPlaybackMode(e) {
    this.playbackMode = e, this.audioElement && (this.audioElement.loop = e === "single");
  }
  getPlaybackMode() {
    return this.playbackMode;
  }
  setPlaylist(e, i = !1) {
    this.playlist = e, this.playlist.length > 0 && this.currentIndex === -1 && (this.currentIndex = 0, i && this.playCurrentTrack());
  }
  getPlaylist() {
    return this.playlist;
  }
  getCurrentTrack() {
    return this.currentIndex >= 0 && this.currentIndex < this.playlist.length ? this.playlist[this.currentIndex] : null;
  }
  async playNext() {
    if (this.playlist.length !== 0) {
      if (this.playbackMode === "shuffle") {
        let e = Math.floor(Math.random() * this.playlist.length);
        this.playlist.length > 1 && e === this.currentIndex && (e = (e + 1) % this.playlist.length), this.currentIndex = e;
      } else
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      await this.playCurrentTrack();
    }
  }
  async playPrev() {
    this.playlist.length !== 0 && (this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length, await this.playCurrentTrack());
  }
  async togglePlay() {
    this.audioElement && (this.audioElement.paused ? !this.audioElement.src && this.playlist.length > 0 ? (this.currentIndex === -1 && (this.currentIndex = 0), await this.playCurrentTrack()) : await this.audioElement.play().catch(() => {
    }) : this.audioElement.pause());
  }
  handleTrackEnded() {
    this.playbackMode !== "single" && this.playlist.length > 1 && this.playNext().catch((e) => console.error(e));
  }
  attachVideo(e) {
    this.attachedVideo = e, this.attachedVideo && this.applyVolume();
  }
  async playTrack(e, i = !0) {
    if (this.audioElement) {
      this.clearFade(), this.audioElement.src = e, this.audioElement.loop = i, !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
      try {
        await this.audioElement.play();
      } catch (t) {
        console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", t);
      }
    }
  }
  fadeInVolume(e, i = 400) {
    this.clearFade();
    const t = performance.now(), s = Math.max(0, Math.min(1, e));
    this.audioElement && (this.audioElement.muted = !1, this.audioElement.volume = 0), this.attachedVideo && (this.attachedVideo.muted = !1, this.attachedVideo.volume = 0);
    const a = () => {
      const n = performance.now() - t, l = Math.min(1, n / i), o = s * l;
      this.audioElement && (this.audioElement.volume = o), this.attachedVideo && (this.attachedVideo.volume = o), l < 1 ? this.fadeTimer = requestAnimationFrame(a) : this.applyVolume();
    };
    this.fadeTimer = requestAnimationFrame(a);
  }
  stopTrack(e = 300) {
    if (!this.audioElement || this.audioElement.paused) return;
    if (e <= 0) {
      this.audioElement.pause(), this.audioElement.currentTime = 0;
      return;
    }
    const i = this.audioElement.volume, t = performance.now(), s = () => {
      const a = performance.now() - t, n = Math.min(1, a / e);
      this.audioElement && (this.audioElement.volume = i * (1 - n)), n < 1 ? this.fadeTimer = requestAnimationFrame(s) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
    };
    this.clearFade(), this.fadeTimer = requestAnimationFrame(s);
  }
  handleVisibilityChange(e, i) {
    i && (e ? (this.audioElement && !this.audioElement.paused && (this.audioElement.pause(), this.isPausedForBlur = !0), this.attachedVideo && !this.attachedVideo.paused && this.attachedVideo.pause()) : (this.isPausedForBlur && this.audioElement && (this.audioElement.play().catch(() => {
    }), this.isPausedForBlur = !1), this.attachedVideo && this.attachedVideo.play().catch(() => {
    })));
  }
  applyVolume() {
    const e = this.muted ? 0 : this.volume;
    this.audioElement && (this.audioElement.volume = e, this.audioElement.muted = this.muted), this.attachedVideo && (this.attachedVideo.volume = e, this.attachedVideo.muted = this.muted);
  }
  clearFade() {
    this.fadeTimer !== null && (cancelAnimationFrame(this.fadeTimer), this.fadeTimer = null);
  }
  destroy() {
    this.clearFade(), this.audioElement && (this.audioElement.pause(), this.audioElement.src = "", this.audioElement = null), this.attachedVideo = null, this.playlist = [];
  }
}
class x {
  videoElement = null;
  container;
  audioEngine;
  constructor(e, i) {
    this.container = e, this.audioEngine = i;
  }
  async render(e, i = "cover") {
    this.destroy();
    const t = document.createElement("video");
    return t.className = "st-bg-video-element", t.src = e, t.loop = !0, t.playsInline = !0, t.autoplay = !0, this.applyFitting(t, i), t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.pointerEvents = "none", t.style.transform = "translateZ(0)", t.style.willChange = "transform", t.style.opacity = "0", t.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(t), this.videoElement = t, this.audioEngine.attachVideo(t), new Promise((s) => {
      const a = async () => {
        t.removeEventListener("canplay", a);
        try {
          await t.play();
        } catch (n) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", n), t.muted = !0, t.play().catch((l) => console.error("[ST-BgLoader] Video playback error:", l));
        }
        t.style.opacity = "1", s(t);
      };
      t.addEventListener("canplay", a), t.addEventListener("error", (n) => {
        console.error("[ST-BgLoader] Error loading video:", n), s(t);
      });
    });
  }
  applyFitting(e, i) {
    switch (i) {
      case "contain":
        e.style.objectFit = "contain";
        break;
      case "stretch":
        e.style.objectFit = "fill";
        break;
      case "center":
        e.style.objectFit = "none";
        break;
      case "cover":
      default:
        e.style.objectFit = "cover";
        break;
    }
  }
  destroy() {
    this.videoElement && (this.audioEngine.attachVideo(null), this.videoElement.pause(), this.videoElement.removeAttribute("src"), this.videoElement.load(), this.videoElement.remove(), this.videoElement = null);
  }
}
class T {
  iframeElement = null;
  container;
  constructor(e) {
    this.container = e;
  }
  async render(e, i = !1) {
    this.destroy();
    const t = document.createElement("iframe");
    return t.className = "st-bg-iframe-element", t.setAttribute("sandbox", "allow-scripts allow-same-origin"), t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.border = "none", t.style.opacity = "0", t.style.pointerEvents = "auto", t.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(t), this.iframeElement = t, new Promise((s) => {
      t.onload = () => {
        t.style.opacity = "1", s(t);
      }, i ? t.src = e : t.srcdoc = e;
    });
  }
  postMessage(e) {
    this.iframeElement && this.iframeElement.contentWindow && this.iframeElement.contentWindow.postMessage(e, "*");
  }
  destroy() {
    this.iframeElement && (this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement.remove(), this.iframeElement = null);
  }
}
class P {
  imageElement = null;
  container;
  constructor(e) {
    this.container = e;
  }
  async render(e, i = "cover") {
    this.destroy();
    const t = document.createElement("img");
    return t.className = "st-bg-image-element", t.src = e, this.applyFitting(t, i), t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.pointerEvents = "none", t.style.opacity = "0", t.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(t), this.imageElement = t, new Promise((s) => {
      t.onload = () => {
        t.style.opacity = "1", s(t);
      }, t.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), s(t);
      };
    });
  }
  applyFitting(e, i) {
    switch (i) {
      case "contain":
        e.style.objectFit = "contain";
        break;
      case "stretch":
        e.style.objectFit = "fill";
        break;
      case "center":
        e.style.objectFit = "none";
        break;
      case "cover":
      default:
        e.style.objectFit = "cover";
        break;
    }
  }
  destroy() {
    this.imageElement && (this.imageElement.remove(), this.imageElement = null);
  }
}
class F {
  hostEl = null;
  containerEl = null;
  layerA = null;
  layerB = null;
  activeLayer = "A";
  videoRendererA = null;
  videoRendererB = null;
  iframeRendererA = null;
  iframeRendererB = null;
  imageRendererA = null;
  imageRendererB = null;
  audioEngine;
  observer = null;
  constructor(e) {
    this.audioEngine = e;
  }
  init() {
    if (this.hostEl = document.querySelector("#bg1"), !this.hostEl) {
      const e = new MutationObserver(() => {
        const i = document.querySelector("#bg1");
        i && (e.disconnect(), this.hostEl = i, this.setupContainer());
      });
      e.observe(document.body, { childList: !0, subtree: !0 });
      return;
    }
    this.setupContainer();
  }
  setupContainer() {
    if (!this.hostEl) return;
    window.getComputedStyle(this.hostEl).position === "static" && (this.hostEl.style.position = "relative");
    let i = this.hostEl.querySelector(".st-bg-media-container");
    i ? (this.layerA = i.querySelector(".st-bg-layer-a"), this.layerB = i.querySelector(".st-bg-layer-b")) : (i = document.createElement("div"), i.className = "st-bg-media-container", i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.overflow = "hidden", i.style.zIndex = "0", i.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), i.appendChild(this.layerA), i.appendChild(this.layerB), this.hostEl.appendChild(i)), this.containerEl = i, this.videoRendererA = new x(this.layerA, this.audioEngine), this.videoRendererB = new x(this.layerB, this.audioEngine), this.iframeRendererA = new T(this.layerA), this.iframeRendererB = new T(this.layerB), this.imageRendererA = new P(this.layerA), this.imageRendererB = new P(this.layerB), this.observer = new MutationObserver(() => this.syncFitting()), this.observer.observe(this.hostEl, { attributes: !0, attributeFilter: ["class"] }), this.syncFitting();
  }
  setupLayerStyle(e) {
    e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%", e.style.opacity = "0", e.style.transition = "opacity 400ms ease-in-out", e.style.pointerEvents = "none";
  }
  applyFilters(e) {
    if (!this.containerEl) return;
    const i = `blur(${e.blur}px) brightness(${e.brightness}%) opacity(${e.opacity}%) saturate(${e.saturate}%)`;
    this.containerEl.style.filter = i;
  }
  setInteractive(e) {
    const i = e ? "auto" : "none";
    this.containerEl && (this.containerEl.style.pointerEvents = i), this.layerA && (this.layerA.style.pointerEvents = i), this.layerB && (this.layerB.style.pointerEvents = i);
  }
  getFitting() {
    return this.hostEl ? this.hostEl.classList.contains("contain") ? "contain" : this.hostEl.classList.contains("stretch") ? "stretch" : this.hostEl.classList.contains("center") ? "center" : "cover" : "cover";
  }
  syncFitting() {
  }
  async mountMedia(e, i) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    const t = this.activeLayer === "A" ? "B" : "A", s = t === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, n = t === "B" ? this.videoRendererB : this.videoRendererA, l = t === "B" ? this.iframeRendererB : this.iframeRendererA, o = t === "B" ? this.imageRendererB : this.imageRendererA;
    n.destroy(), l.destroy(), o.destroy();
    const d = this.getFitting();
    switch (e.type) {
      case "video":
        await n.render(i, d);
        break;
      case "html":
      case "svg":
        await l.render(i, !0);
        break;
      case "image":
        await o.render(i, d);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, i);
        break;
    }
    s.style.opacity = "1", a.style.opacity = "0", setTimeout(() => {
      const h = this.activeLayer === "A" ? this.videoRendererA : this.videoRendererB, u = this.activeLayer === "A" ? this.iframeRendererA : this.iframeRendererB, p = this.activeLayer === "A" ? this.imageRendererA : this.imageRendererB;
      h.destroy(), u.destroy(), p.destroy(), this.activeLayer = t;
    }, 450);
  }
  clear() {
    this.layerA && (this.layerA.style.opacity = "0"), this.layerB && (this.layerB.style.opacity = "0"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
class U {
  container = null;
  settings;
  cacheManager;
  callbacks;
  constructor(e, i, t) {
    this.settings = e, this.cacheManager = i, this.callbacks = t;
  }
  render() {
    const e = document.querySelector("#extensions_settings");
    if (!e) {
      console.warn("[ST-BgLoader] #extensions_settings not found yet, waiting for DOM insertion...");
      const s = new MutationObserver(() => {
        document.querySelector("#extensions_settings") && (s.disconnect(), this.render());
      });
      s.observe(document.body, { childList: !0, subtree: !0 });
      return;
    }
    const i = document.querySelector("#st_bgloader_settings");
    i && i.remove();
    const t = document.createElement("div");
    t.id = "st_bgloader_settings", t.className = "st-bgloader-panel", t.innerHTML = `
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-photo-film"></i> ST-BgLoader (Rich Media Backgrounds)</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content" style="display: flex; flex-direction: column; gap: 12px; padding-top: 10px;">
                    
                    <!-- Media Upload Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud-arrow-up"></i> Import Media (Video, Audio, HTML, SVG)</h4>
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone">
                            <i class="fa-solid fa-file-video fa-2x" style="margin-bottom: 6px; opacity: 0.7;"></i>
                            <div>Click or Drag files here (MP4, WebM, MP3, WAV, HTML, SVG, Images)</div>
                            <input type="file" id="st_bgloader_file_input" style="display: none;" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" placeholder="Or enter direct media URL (HTTP/HTTPS)..." />
                            <button id="st_bgloader_url_btn" class="menu_button">Import URL</button>
                        </div>
                    </div>

                    <!-- Media Library Grid -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-layer-group"></i> Media Library</h4>
                        <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                            <!-- Injected dynamically -->
                        </div>
                    </div>

                    <!-- Visual Filters & Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-sliders"></i> Visual Adjustments & Presets</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 60px;">Preset:</label>
                            <select id="st_preset_select">
                                <!-- Populated dynamically -->
                            </select>
                            <button id="st_preset_save_btn" class="menu_button" title="Save current sliders as custom preset">
                                <i class="fa-solid fa-floppy-disk"></i>
                            </button>
                            <button id="st_preset_del_btn" class="menu_button" title="Delete custom preset">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Blur</label>
                            <input type="range" id="st_filter_blur" min="0" max="20" step="1" value="${this.settings.filters.blur}" />
                            <span class="st-bgloader-slider-val" id="st_filter_blur_val">${this.settings.filters.blur}px</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Brightness</label>
                            <input type="range" id="st_filter_brightness" min="0" max="200" step="5" value="${this.settings.filters.brightness}" />
                            <span class="st-bgloader-slider-val" id="st_filter_brightness_val">${this.settings.filters.brightness}%</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Opacity</label>
                            <input type="range" id="st_filter_opacity" min="0" max="100" step="5" value="${this.settings.filters.opacity}" />
                            <span class="st-bgloader-slider-val" id="st_filter_opacity_val">${this.settings.filters.opacity}%</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Saturation</label>
                            <input type="range" id="st_filter_saturate" min="0" max="200" step="5" value="${this.settings.filters.saturate}" />
                            <span class="st-bgloader-slider-val" id="st_filter_saturate_val">${this.settings.filters.saturate}%</span>
                        </div>

                        <!-- Sandbox Interactive Mode Toggle -->
                        <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_bg_interactive" ${this.settings.interactiveBackground ? "checked" : ""} />
                                <span>Allow background mouse interaction (3D/Canvas/Games)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Audio Engine & Playlist Controls -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-volume-high"></i> Audio & BGM Playlist</h4>
                        
                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_audio_volume" min="0" max="100" step="1" value="${Math.round(this.settings.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_audio_volume_val">${Math.round(this.settings.volume * 100)}%</span>
                        </div>

                        <div class="st-bgloader-preset-row" style="margin-top: 6px;">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Play Mode:</label>
                            <select id="st_playback_mode">
                                <option value="loop" ${this.settings.playbackMode === "loop" ? "selected" : ""}>Loop Playlist (循环列表)</option>
                                <option value="single" ${this.settings.playbackMode === "single" ? "selected" : ""}>Single Track Loop (单曲循环)</option>
                                <option value="shuffle" ${this.settings.playbackMode === "shuffle" ? "selected" : ""}>Shuffle (随机播放)</option>
                            </select>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_mute" ${this.settings.muted ? "checked" : ""} />
                                <span>Mute Audio</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? "checked" : ""} />
                                <span>Pause when tab inactive</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_mini_player_toggle" ${this.settings.showMiniPlayer ? "checked" : ""} />
                                <span>Show floating mini player capsule</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-left: 18px; font-size: 0.9em; opacity: 0.85;">
                                <input type="checkbox" id="st_capsule_on_play" ${this.settings.capsuleOnPlayOnly ? "checked" : ""} />
                                <span>Only show capsule during active playback</span>
                            </label>
                        </div>
                    </div>

                    <!-- Cache & Performance -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-database"></i> Cache Management</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>Used: <strong id="st_cache_used">Calculating...</strong> (<span id="st_cache_count">0</span> items)</div>
                            <button id="st_cache_clear_btn" class="menu_button menu_button_danger">Clear Cache</button>
                        </div>
                    </div>

                </div>
            </div>
        `, e.appendChild(t), this.container = t, this.bindEvents(), this.populatePresets(), this.refreshMediaGrid(), this.updateCacheStats();
  }
  populatePresets() {
    const e = this.container?.querySelector("#st_preset_select");
    e && (e.innerHTML = "", Object.values(f).forEach((i) => {
      const t = document.createElement("option");
      t.value = i.id, t.textContent = i.name, i.id === this.settings.activePresetId && (t.selected = !0), e.appendChild(t);
    }), Object.entries(this.settings.userPresets || {}).forEach(([i, t]) => {
      const s = document.createElement("option");
      s.value = i, s.textContent = `★ ${i} (Custom)`, i === this.settings.activePresetId && (s.selected = !0), e.appendChild(s);
    }));
  }
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector(".inline-drawer-toggle"), i = this.container.querySelector(".inline-drawer-content"), t = this.container.querySelector(".inline-drawer-icon");
    e?.addEventListener("click", () => {
      const r = i.style.display === "none";
      i.style.display = r ? "flex" : "none", t && (t.classList.toggle("down", r), t.classList.toggle("up", !r));
    });
    const s = this.container.querySelector("#st_bgloader_dropzone"), a = this.container.querySelector("#st_bgloader_file_input");
    s?.addEventListener("click", () => a?.click()), a?.addEventListener("change", async () => {
      a.files && a.files.length > 0 && (await this.handleFileUpload(a.files[0]), a.value = "");
    }), s?.addEventListener("dragover", (r) => {
      r.preventDefault(), s.classList.add("dragover");
    }), s?.addEventListener("dragleave", () => s.classList.remove("dragover")), s?.addEventListener("drop", async (r) => {
      const c = r;
      c.preventDefault(), s.classList.remove("dragover"), c.dataTransfer?.files && c.dataTransfer.files.length > 0 && await this.handleFileUpload(c.dataTransfer.files[0]);
    });
    const n = this.container.querySelector("#st_bgloader_url_input");
    this.container.querySelector("#st_bgloader_url_btn")?.addEventListener("click", async () => {
      const r = n.value.trim();
      r && (await this.handleUrlImport(r), n.value = "");
    });
    const o = this.container.querySelector("#st_preset_select");
    o?.addEventListener("change", () => {
      const r = o.value;
      this.settings.activePresetId = r;
      let c = f[r]?.filters;
      !c && this.settings.userPresets[r] && (c = this.settings.userPresets[r]), c && (this.settings.filters = { ...c }, this.updateSliders(c), this.callbacks.onPresetChanged({ id: r, name: r, filters: c }), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_preset_save_btn")?.addEventListener("click", () => {
      const r = prompt("Enter a name for this custom preset:");
      if (r && r.trim()) {
        const c = r.trim();
        this.settings.userPresets[c] = { ...this.settings.filters }, this.settings.activePresetId = c, this.populatePresets(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_preset_del_btn")?.addEventListener("click", () => {
      const r = o.value;
      if (this.settings.userPresets[r]) {
        if (confirm(`Delete custom preset "${r}"?`)) {
          delete this.settings.userPresets[r], this.settings.activePresetId = "default", this.populatePresets();
          const c = f.default.filters;
          this.settings.filters = { ...c }, this.updateSliders(c), this.callbacks.onPresetChanged(f.default), this.callbacks.onSettingsChanged(this.settings);
        }
      } else
        alert("Cannot delete built-in presets.");
    });
    const d = (r, c, I, A) => {
      const _ = this.container.querySelector(r), S = this.container.querySelector(c);
      _?.addEventListener("input", () => {
        const k = Number(_.value);
        S && (S.textContent = `${k}${I}`), A(k), this.callbacks.onSettingsChanged(this.settings);
      });
    };
    d("#st_filter_blur", "#st_filter_blur_val", "px", (r) => this.settings.filters.blur = r), d("#st_filter_brightness", "#st_filter_brightness_val", "%", (r) => this.settings.filters.brightness = r), d("#st_filter_opacity", "#st_filter_opacity_val", "%", (r) => this.settings.filters.opacity = r), d("#st_filter_saturate", "#st_filter_saturate_val", "%", (r) => this.settings.filters.saturate = r), d("#st_audio_volume", "#st_audio_volume_val", "%", (r) => this.settings.volume = r / 100);
    const h = this.container.querySelector("#st_playback_mode");
    h?.addEventListener("change", () => {
      this.settings.playbackMode = h.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.callbacks.onSettingsChanged(this.settings);
    });
    const u = this.container.querySelector("#st_bg_interactive");
    u?.addEventListener("change", () => {
      this.settings.interactiveBackground = u.checked, this.callbacks.onInteractiveChanged(u.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const p = this.container.querySelector("#st_mini_player_toggle");
    p?.addEventListener("change", () => {
      this.settings.showMiniPlayer = p.checked, this.callbacks.onMiniPlayerToggle(p.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const y = this.container.querySelector("#st_capsule_on_play");
    y?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = y.checked, this.callbacks.onCapsuleOnPlayToggle?.(y.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const b = this.container.querySelector("#st_audio_mute");
    b?.addEventListener("change", () => {
      this.settings.muted = b.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const v = this.container.querySelector("#st_audio_blur");
    v?.addEventListener("change", () => {
      this.settings.pauseOnBlur = v.checked, this.callbacks.onSettingsChanged(this.settings);
    }), this.container.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      confirm("Are you sure you want to clear all cached media files?") && (await this.cacheManager.clearAll(), await this.refreshMediaGrid(), await this.updateCacheStats());
    });
  }
  updateSliders(e) {
    const i = (t, s, a, n) => {
      const l = this.container?.querySelector(t), o = this.container?.querySelector(s);
      l && (l.value = a.toString()), o && (o.textContent = `${a}${n}`);
    };
    i("#st_filter_blur", "#st_filter_blur_val", e.blur, "px"), i("#st_filter_brightness", "#st_filter_brightness_val", e.brightness, "%"), i("#st_filter_opacity", "#st_filter_opacity_val", e.opacity, "%"), i("#st_filter_saturate", "#st_filter_saturate_val", e.saturate, "%");
  }
  async refreshMediaGrid() {
    const e = this.container?.querySelector("#st_bgloader_grid");
    if (!e) return;
    const i = await this.cacheManager.listMedia();
    if (e.innerHTML = "", i.length === 0) {
      e.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; opacity: 0.6;">No media items imported yet.</div>';
      return;
    }
    i.forEach((t) => {
      const s = document.createElement("div");
      s.className = "st-bgloader-media-card", this.settings.activeMediaId === t.id && s.classList.add("active"), s.innerHTML = `
                <div class="st-bgloader-media-badge ${t.type}">${t.type}</div>
                <button class="st-bgloader-media-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                <div class="st-bgloader-media-card-title" title="${t.name}">${t.name}</div>
            `, s.addEventListener("click", (n) => {
        n.target.closest(".st-bgloader-media-delete") || (this.settings.activeMediaId = t.id, this.container?.querySelectorAll(".st-bgloader-media-card").forEach((o) => o.classList.remove("active")), s.classList.add("active"), this.callbacks.onMediaSelected(t), this.callbacks.onSettingsChanged(this.settings));
      }), s.querySelector(".st-bgloader-media-delete")?.addEventListener("click", async (n) => {
        n.stopPropagation(), confirm(`Delete media "${t.name}"?`) && (await this.cacheManager.deleteMedia(t.id), this.settings.activeMediaId === t.id && (this.settings.activeMediaId = null, this.callbacks.onSettingsChanged(this.settings)), this.callbacks.onMediaDeleted(t.id), await this.refreshMediaGrid(), await this.updateCacheStats());
      }), e.appendChild(s);
    });
  }
  async updateCacheStats() {
    const e = this.container?.querySelector("#st_cache_used"), i = this.container?.querySelector("#st_cache_count");
    if (!e || !i) return;
    const { usedBytes: t, itemCount: s } = await this.cacheManager.getCacheUsage(), a = (t / (1024 * 1024)).toFixed(2);
    e.textContent = `${a} MB`, i.textContent = s.toString();
  }
  async handleFileUpload(e) {
    const i = this.detectMediaType(e.name, e.type), t = await this.cacheManager.saveMedia(e, e.name, i, "local");
    await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(t);
  }
  async handleUrlImport(e) {
    const i = e.split("/").pop()?.split("?")[0] || "remote_media", t = this.detectMediaType(i), s = await this.cacheManager.saveMedia(new Blob([]), i, t, "url", e);
    await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(s);
  }
  detectMediaType(e, i = "") {
    const t = e.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) || i.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) || i.startsWith("audio/") ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
  }
}
class $ {
  observer = null;
  onNativeMediaSelect;
  constructor(e) {
    this.onNativeMediaSelect = e;
  }
  start() {
    const e = document.querySelector("#bg_menu_content");
    if (e)
      this.augmentThumbnails(e), this.observer = new MutationObserver(() => this.augmentThumbnails(e)), this.observer.observe(e, { childList: !0, subtree: !0 });
    else {
      const i = new MutationObserver(() => {
        document.querySelector("#bg_menu_content") && (i.disconnect(), this.start());
      });
      i.observe(document.body, { childList: !0, subtree: !0 });
    }
  }
  augmentThumbnails(e) {
    e.querySelectorAll(".bg_example[bgfile]:not([data-st-bg-augmented])").forEach((t) => {
      t.setAttribute("data-st-bg-augmented", "true");
      const s = t.getAttribute("bgfile") || "", a = this.detectType(s);
      if (a !== "image") {
        const n = document.createElement("span");
        n.className = `st-bg-native-badge ${a}`, n.textContent = a.toUpperCase(), t.appendChild(n), t.addEventListener("click", () => {
          const l = t.dataset.url || `/backgrounds/${s}`;
          this.onNativeMediaSelect(l, a, s);
        });
      }
    });
  }
  detectType(e) {
    const i = e.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "ogv"].includes(i) ? "video" : ["mp3", "wav", "ogg", "flac"].includes(i) ? "audio" : ["html", "htm"].includes(i) ? "html" : i === "svg" ? "svg" : "image";
  }
  stop() {
    this.observer && (this.observer.disconnect(), this.observer = null);
  }
}
class D {
  container = null;
  audioEngine;
  isVisible = !0;
  capsuleOnPlayOnly = !0;
  hideTimer = null;
  constructor(e) {
    this.audioEngine = e;
  }
  render(e = !0, i = !0) {
    this.isVisible = e, this.capsuleOnPlayOnly = i;
    const t = document.querySelector("#st_bg_mini_player");
    t && t.remove();
    const s = document.createElement("div");
    s.id = "st_bg_mini_player", s.className = "st-bg-mini-player";
    const a = this.audioEngine.getCurrentTrack(), n = a ? a.name : "No Audio Selected", l = this.audioEngine.isPlaying(), o = this.audioEngine.getPlaybackMode(), d = this.isVisible && (!this.capsuleOnPlayOnly || l);
    s.classList.add(d ? "visible" : "hidden"), s.innerHTML = `
            <div class="st-bg-mini-capsule">
                <button class="st-bg-mini-btn" id="st_mini_prev" title="Previous Track">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button class="st-bg-mini-btn st-bg-mini-play" id="st_mini_play" title="Play/Pause">
                    <i class="fa-solid ${l ? "fa-pause" : "fa-play"}"></i>
                </button>
                <button class="st-bg-mini-btn" id="st_mini_next" title="Next Track">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <div class="st-bg-mini-track" id="st_mini_title" title="${n}">${n}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${o}">
                    <i class="fa-solid ${this.getModeIcon(o)}"></i>
                </button>
            </div>
        `, document.body.appendChild(s), this.container = s, this.bindEvents(), this.audioEngine.onTrackChange = (h) => {
      const u = this.container?.querySelector("#st_mini_title");
      if (u) {
        const p = h ? h.name : "No Audio";
        u.textContent = p, u.setAttribute("title", p);
      }
    }, this.audioEngine.onPlayStateChange = (h) => {
      const u = this.container?.querySelector("#st_mini_play i");
      u && (u.className = `fa-solid ${h ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (h ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
        this.hide();
      }, 1200)));
    };
  }
  bindEvents() {
    this.container && (this.container.querySelector("#st_mini_prev")?.addEventListener("click", () => {
      this.audioEngine.playPrev();
    }), this.container.querySelector("#st_mini_play")?.addEventListener("click", () => {
      this.audioEngine.togglePlay();
    }), this.container.querySelector("#st_mini_next")?.addEventListener("click", () => {
      this.audioEngine.playNext();
    }), this.container.querySelector("#st_mini_mode")?.addEventListener("click", () => {
      const e = this.audioEngine.getPlaybackMode(), i = e === "loop" ? "shuffle" : e === "shuffle" ? "single" : "loop";
      this.audioEngine.setPlaybackMode(i);
      const t = this.container?.querySelector("#st_mini_mode");
      if (t) {
        t.setAttribute("title", `Mode: ${i}`);
        const s = t.querySelector("i");
        s && (s.className = `fa-solid ${this.getModeIcon(i)}`);
      }
    }));
  }
  getModeIcon(e) {
    switch (e) {
      case "shuffle":
        return "fa-shuffle";
      case "single":
        return "fa-repeat-1";
      case "loop":
      default:
        return "fa-repeat";
    }
  }
  show() {
    this.container || this.render(!0, this.capsuleOnPlayOnly), this.container && (this.container.classList.remove("hidden"), this.container.classList.add("visible"));
  }
  hide() {
    this.container && (this.container.classList.remove("visible"), this.container.classList.add("hidden"));
  }
  setVisible(e) {
    this.isVisible = e, e ? this.show() : this.hide();
  }
  setCapsuleOnPlayOnly(e) {
    this.capsuleOnPlayOnly = e, e ? this.audioEngine.isPlaying() || this.hide() : this.isVisible && this.show();
  }
  destroy() {
    this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.container && (this.container.remove(), this.container = null);
  }
}
class O {
  ext;
  eventListeners = /* @__PURE__ */ new Map();
  constructor(e) {
    this.ext = e;
  }
  /**
   * Switch background to a URL, cached media ID, or local file.
   * Supports MP4/WebM video, HTML/Canvas sandboxed pages, SVG animations, and images.
   */
  async setBackground(e, i) {
    let s = (await this.ext.getCacheManager().listMedia()).find((a) => a.id === e || a.name === e);
    if (!s) {
      const a = i?.name || e.split("/").pop()?.split("?")[0] || "remote_background", n = i?.type || this.detectType(e);
      i?.saveToLibrary ? s = await this.ext.getCacheManager().saveMedia(new Blob([]), a, n, "url", e) : s = {
        id: "custom_" + Date.now(),
        name: a,
        type: n,
        source: "url",
        url: e,
        cacheKey: e,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
    }
    i?.filters && this.setFilters(i.filters), typeof i?.interactive == "boolean" && this.setInteractive(i.interactive), await this.ext.applyMediaItem(s), this.emit("media-change", s);
  }
  /**
   * Clear the current background
   */
  clearBackground() {
    this.ext.clearActiveBackground(), this.emit("media-change", null);
  }
  /**
   * Play background music or sound track
   */
  async playBGM(e, i) {
    typeof i?.volume == "number" && this.setVolume(i.volume);
    let s = (await this.ext.getCacheManager().listMedia()).find((n) => n.id === e || n.name === e);
    if (!s) {
      const n = i?.title || e.split("/").pop()?.split("?")[0] || "BGM";
      s = {
        id: "bgm_" + Date.now(),
        name: n,
        type: "audio",
        source: "url",
        url: e,
        cacheKey: e,
        size: 0,
        mimeType: "audio/mpeg",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
    }
    await this.ext.getAudioEngine().playMediaItem(s), this.emit("track-change", s);
  }
  /**
   * Stop background music with optional fade-out
   */
  stopBGM(e = 300) {
    this.ext.getAudioEngine().stopTrack(e), this.emit("track-change", null);
  }
  /**
   * Toggle play/pause for background audio
   */
  togglePlay() {
    this.ext.getAudioEngine().togglePlay();
  }
  /**
   * Play next track in playlist
   */
  nextTrack() {
    this.ext.getAudioEngine().playNext();
  }
  /**
   * Play previous track in playlist
   */
  prevTrack() {
    this.ext.getAudioEngine().playPrev();
  }
  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(e) {
    const i = Math.max(0, Math.min(1, e));
    this.ext.getSettings().volume = i, this.ext.getAudioEngine().setVolume(i), this.ext.saveSettings(), this.emit("volume-change", i);
  }
  /**
   * Mute or unmute audio
   */
  setMuted(e) {
    this.ext.getSettings().muted = e, this.ext.getAudioEngine().setMuted(e), this.ext.saveSettings(), this.emit("mute-change", e);
  }
  /**
   * Dynamically adjust CSS visual filters
   */
  setFilters(e) {
    const i = this.ext.getSettings().filters, t = {
      blur: e.blur !== void 0 ? e.blur : i.blur,
      brightness: e.brightness !== void 0 ? e.brightness : i.brightness,
      opacity: e.opacity !== void 0 ? e.opacity : i.opacity,
      saturate: e.saturate !== void 0 ? e.saturate : i.saturate
    };
    this.ext.getSettings().filters = t, this.ext.getMediaMount().applyFilters(t), this.ext.saveSettings(), this.emit("filters-change", t);
  }
  /**
   * Apply built-in or custom filter preset
   */
  applyPreset(e) {
    const i = this.ext.getSettings();
    let t = f[e]?.filters;
    !t && i.userPresets[e] && (t = i.userPresets[e]), t ? (i.activePresetId = e, i.filters = { ...t }, this.ext.getMediaMount().applyFilters(t), this.ext.saveSettings(), this.emit("preset-change", e, t)) : console.warn(`[ST-BgLoader PublicAPI] Preset "${e}" not found.`);
  }
  /**
   * Set mouse interaction passthrough for HTML/Canvas/WebGL backgrounds
   */
  setInteractive(e) {
    this.ext.getSettings().interactiveBackground = e, this.ext.getMediaMount().setInteractive(e), this.ext.saveSettings(), this.emit("interactive-change", e);
  }
  /**
   * Return current playback, filter, and media status
   */
  getPlaybackState() {
    const e = this.ext.getSettings(), i = this.ext.getAudioEngine();
    return {
      isPlaying: i.isPlaying(),
      currentTrack: i.getCurrentTrack(),
      volume: i.getVolume(),
      muted: i.isMuted(),
      playbackMode: i.getPlaybackMode(),
      activeMediaId: e.activeMediaId,
      activePresetId: e.activePresetId,
      filters: { ...e.filters },
      isInteractive: e.interactiveBackground
    };
  }
  /**
   * Get list of all media items in cache library
   */
  async getMediaList() {
    return this.ext.getCacheManager().listMedia();
  }
  // --- Event Bus ---
  /**
   * Subscribe to ST-BgLoader events. Returns unsubscribe function.
   * Events: 'media-change', 'track-change', 'play-state-change', 'volume-change', 'mute-change', 'filters-change', 'preset-change', 'interactive-change'
   */
  on(e, i) {
    return this.eventListeners.has(e) || this.eventListeners.set(e, /* @__PURE__ */ new Set()), this.eventListeners.get(e).add(i), () => this.off(e, i);
  }
  off(e, i) {
    this.eventListeners.get(e)?.delete(i);
  }
  emit(e, ...i) {
    this.eventListeners.get(e)?.forEach((t) => {
      try {
        t(...i);
      } catch (s) {
        console.error(`[ST-BgLoader PublicAPI] Error in listener for "${e}":`, s);
      }
    });
  }
  detectType(e) {
    const i = e.split(".").pop()?.toLowerCase().split("?")[0] || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(i) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(i) ? "audio" : i === "html" || i === "htm" ? "html" : i === "svg" ? "svg" : "image";
  }
}
const L = "st_bgloader_settings";
class N {
  isInitialized = !1;
  settings = { ...E };
  cacheManager;
  audioEngine;
  mediaMount;
  settingsDrawer = null;
  nativeAugmenter = null;
  miniPlayer = null;
  publicApi;
  constructor() {
    this.cacheManager = new V(), this.audioEngine = new q(), this.mediaMount = new F(this.audioEngine), this.publicApi = new O(this);
  }
  getCacheManager() {
    return this.cacheManager;
  }
  getAudioEngine() {
    return this.audioEngine;
  }
  getMediaMount() {
    return this.mediaMount;
  }
  getSettings() {
    return this.settings;
  }
  getMiniPlayer() {
    return this.miniPlayer;
  }
  getAPI() {
    return this.publicApi;
  }
  clearActiveBackground() {
    this.settings.activeMediaId = null, this.mediaMount.clear(), this.saveSettings(), this.settingsDrawer && this.settingsDrawer.refreshMediaGrid();
  }
  async applyMediaItem(e) {
    await this.applyMedia(e);
  }
  async init() {
    console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), this.loadSettings(), await this.cacheManager.init(), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.audioEngine.setUrlResolver((a) => this.cacheManager.getMediaBlobUrl(a)), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setPlaybackMode(this.settings.playbackMode);
    const i = (await this.cacheManager.listMedia()).filter((a) => a.type === "audio");
    this.audioEngine.setPlaylist(i), this.miniPlayer = new D(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly);
    const t = this.audioEngine.onTrackChange;
    this.audioEngine.onTrackChange = (a) => {
      t?.(a), this.publicApi.emit("track-change", a);
    };
    const s = this.audioEngine.onPlayStateChange;
    if (this.audioEngine.onPlayStateChange = (a) => {
      s?.(a), this.publicApi.emit("play-state-change", a);
    }, this.settingsDrawer = new U(this.settings, this.cacheManager, {
      onSettingsChanged: (a) => {
        this.settings = a, this.saveSettings(), this.mediaMount.applyFilters(this.settings.filters), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted);
      },
      onPresetChanged: (a) => {
        this.mediaMount.applyFilters(a.filters), this.publicApi.emit("preset-change", a.id, a.filters);
      },
      onInteractiveChanged: (a) => {
        this.mediaMount.setInteractive(a), this.publicApi.emit("interactive-change", a);
      },
      onMiniPlayerToggle: (a) => {
        this.miniPlayer?.setVisible(a);
      },
      onCapsuleOnPlayToggle: (a) => {
        this.miniPlayer?.setCapsuleOnPlayOnly(a);
      },
      onPlaybackModeChanged: (a) => {
        this.audioEngine.setPlaybackMode(a);
      },
      onMediaSelected: async (a) => {
        await this.applyMedia(a);
      },
      onMediaDeleted: async (a) => {
        this.settings.activeMediaId === a && (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings());
        const n = await this.cacheManager.listMedia();
        this.audioEngine.setPlaylist(n.filter((l) => l.type === "audio"));
      },
      onMediaUploaded: async (a) => {
        if (this.settings.lruAutoClean) {
          const n = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(n);
        }
        if (a.type === "audio") {
          const n = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(n.filter((l) => l.type === "audio"));
        }
        await this.applyMedia(a);
      }
    }), this.settingsDrawer.render(), this.nativeAugmenter = new $(async (a, n, l) => {
      const o = {
        id: "native_" + l,
        name: l,
        type: n,
        source: "server",
        url: a,
        cacheKey: a,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
      await this.applyMedia(o);
    }), this.nativeAugmenter.start(), document.addEventListener("visibilitychange", () => {
      this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
    }), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const a = await this.cacheManager.getMedia(this.settings.activeMediaId);
      a && await this.applyMedia(a);
    }
    this.isInitialized = !0, console.log("[ST-BgLoader] Initialization complete.");
  }
  async applyMedia(e) {
    this.settings.activeMediaId = e.id, this.saveSettings();
    const i = await this.cacheManager.getMediaBlobUrl(e);
    await this.mediaMount.mountMedia(e, i), this.settingsDrawer && (this.settingsDrawer.refreshMediaGrid(), this.settingsDrawer.updateCacheStats());
  }
  hookSillyTavernEvents() {
    const e = window;
    e.eventSource && e.event_types && e.eventSource.on(e.event_types.CHAT_CHANGED, async () => {
      const i = e.getCurrentChatId ? e.getCurrentChatId() : null;
      if (i && this.settings.chatBindings[i]) {
        const t = this.settings.chatBindings[i], s = await this.cacheManager.getMedia(t);
        if (s) {
          await this.applyMedia(s);
          return;
        }
      }
      if (this.settings.activeMediaId) {
        const t = await this.cacheManager.getMedia(this.settings.activeMediaId);
        t && await this.applyMedia(t);
      }
    });
  }
  loadSettings() {
    try {
      const e = localStorage.getItem(L);
      e && (this.settings = { ...E, ...JSON.parse(e) });
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...E };
    }
  }
  saveSettings() {
    try {
      localStorage.setItem(L, JSON.stringify(this.settings));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
}
const w = new N();
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => w.init()) : w.init();
window.STBgLoader = w;
window.stBgLoader = w.getAPI();
export {
  N as STBgLoaderExtension
};
