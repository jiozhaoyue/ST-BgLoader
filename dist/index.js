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
}, I = "st_bg_loader_db", R = 1, m = "media_items", M = "st-bg-cache-v1";
class V {
  db = null;
  cache = null;
  objectUrls = /* @__PURE__ */ new Map();
  async init() {
    "caches" in window && (this.cache = await caches.open(M)), this.db = await new Promise((e, t) => {
      const i = indexedDB.open(I, R);
      i.onupgradeneeded = (s) => {
        const a = s.target.result;
        if (!a.objectStoreNames.contains(m)) {
          const n = a.createObjectStore(m, { keyPath: "id" });
          n.createIndex("type", "type", { unique: !1 }), n.createIndex("lastUsedTimestamp", "lastUsedTimestamp", { unique: !1 });
        }
      }, i.onsuccess = () => e(i.result), i.onerror = () => t(i.error);
    });
  }
  async listMedia() {
    return this.db || await this.init(), new Promise((e, t) => {
      const a = this.db.transaction(m, "readonly").objectStore(m).getAll();
      a.onsuccess = () => e(a.result || []), a.onerror = () => t(a.error);
    });
  }
  async getMedia(e) {
    return this.db || await this.init(), new Promise((t, i) => {
      const n = this.db.transaction(m, "readonly").objectStore(m).get(e);
      n.onsuccess = () => t(n.result || null), n.onerror = () => i(n.error);
    });
  }
  async saveMedia(e, t, i, s, a) {
    (!this.db || !this.cache) && await this.init();
    const n = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), r = `/st-bg-cache/${n}/${encodeURIComponent(t)}`;
    let o, d = "", c = 0;
    typeof e == "string" ? (d = i === "svg" ? "image/svg+xml" : "text/html", o = new Blob([e], { type: d }), c = o.size) : (o = e, d = e.type || this.guessMimeType(t, i), c = e.size);
    const u = new Headers({
      "Content-Type": d,
      "Content-Length": c.toString()
    }), g = new Response(o, { headers: u });
    await this.cache.put(r, g);
    const y = {
      id: n,
      name: t,
      type: i,
      source: s,
      url: a || r,
      cacheKey: r,
      size: c,
      mimeType: d,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: i === "video" || i === "audio"
    };
    return await new Promise((b, v) => {
      const h = this.db.transaction(m, "readwrite").objectStore(m).put(y);
      h.onsuccess = () => b(), h.onerror = () => v(h.error);
    }), y;
  }
  async getMediaBlobUrl(e) {
    if (this.objectUrls.has(e.id))
      return this.touchMedia(e.id), this.objectUrls.get(e.id);
    this.cache || await this.init();
    let t = await this.cache.match(e.cacheKey);
    if (!t && e.source === "url" && e.url)
      try {
        const i = await fetch(e.url);
        if (i.ok) {
          const s = i.clone();
          await this.cache.put(e.cacheKey, s), t = i;
        }
      } catch (i) {
        console.warn("[ST-BgLoader] Failed to fetch and cache remote URL:", e.url, i);
      }
    if (t) {
      const i = await t.blob(), s = URL.createObjectURL(i);
      return this.objectUrls.set(e.id, s), this.touchMedia(e.id), s;
    }
    return e.url;
  }
  async touchMedia(e) {
    if (!this.db) return;
    const t = await this.getMedia(e);
    t && (t.lastUsedTimestamp = Date.now(), this.db.transaction(m, "readwrite").objectStore(m).put(t));
  }
  async deleteMedia(e) {
    (!this.db || !this.cache) && await this.init();
    const t = await this.getMedia(e);
    t && (await this.cache.delete(t.cacheKey), this.objectUrls.has(e) && (URL.revokeObjectURL(this.objectUrls.get(e)), this.objectUrls.delete(e)), await new Promise((i, s) => {
      const r = this.db.transaction(m, "readwrite").objectStore(m).delete(e);
      r.onsuccess = () => i(), r.onerror = () => s(r.error);
    }));
  }
  async getCacheUsage() {
    const e = await this.listMedia();
    let t = 0;
    for (const i of e)
      t += i.size || 0;
    return { usedBytes: t, itemCount: e.length };
  }
  async cleanLRU(e) {
    const t = await this.listMedia();
    let i = t.reduce((s, a) => s + (a.size || 0), 0);
    if (!(i <= e)) {
      t.sort((s, a) => s.lastUsedTimestamp - a.lastUsedTimestamp);
      for (const s of t) {
        if (i <= e) break;
        console.log("[ST-BgLoader] LRU evicting:", s.name, s.size), i -= s.size || 0, await this.deleteMedia(s.id);
      }
    }
  }
  async clearAll() {
    (!this.db || !this.cache) && await this.init();
    for (const e of this.objectUrls.values())
      URL.revokeObjectURL(e);
    this.objectUrls.clear(), "caches" in window && (await caches.delete(M), this.cache = await caches.open(M)), await new Promise((e, t) => {
      const a = this.db.transaction(m, "readwrite").objectStore(m).clear();
      a.onsuccess = () => e(), a.onerror = () => t(a.error);
    });
  }
  async preloadUrl(e, t) {
    (!this.db || !this.cache) && await this.init();
    const s = (await this.listMedia()).find((c) => c.url === e || c.cacheKey === e);
    if (s)
      return await this.touchMedia(s.id), { item: s, isNew: !1 };
    const a = e.split("/").pop()?.split("?")[0] || "preloaded_media", n = t || this.detectMediaType(a), r = await fetch(e);
    if (!r.ok)
      throw new Error(`Failed to fetch media from ${e}: ${r.status} ${r.statusText}`);
    const o = await r.blob();
    return { item: await this.saveMedia(o, a, n, "url", e), isNew: !0 };
  }
  detectMediaType(e) {
    const t = e.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
  }
  guessMimeType(e, t) {
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
        return t === "video" ? "video/mp4" : t === "audio" ? "audio/mpeg" : t === "svg" ? "image/svg+xml" : t === "html" ? "text/html" : "image/png";
    }
  }
}
class U {
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
  async playMediaItem(e, t) {
    const i = this.playlist.findIndex((a) => a.id === e.id);
    i !== -1 ? this.currentIndex = i : (this.playlist.push(e), this.currentIndex = this.playlist.length - 1);
    const s = t || (this.urlResolver ? await this.urlResolver(e) : e.url);
    await this.playTrack(s, this.playbackMode === "single"), this.onTrackChange?.(e);
  }
  async playCurrentTrack() {
    const e = this.getCurrentTrack();
    if (!e || !this.audioElement) return;
    this.clearFade();
    const t = this.urlResolver ? await this.urlResolver(e) : e.url;
    this.audioElement.src = t, this.audioElement.loop = this.playbackMode === "single", !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
    try {
      await this.audioElement.play(), this.onTrackChange?.(e);
    } catch (i) {
      console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", i);
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
  setPlaylist(e, t = !1) {
    this.playlist = e, this.playlist.length > 0 && this.currentIndex === -1 && (this.currentIndex = 0, t && this.playCurrentTrack());
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
  async playTrack(e, t = !0) {
    if (this.audioElement) {
      this.clearFade(), this.audioElement.src = e, this.audioElement.loop = t, !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
      try {
        await this.audioElement.play();
      } catch (i) {
        console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", i);
      }
    }
  }
  fadeInVolume(e, t = 400) {
    this.clearFade();
    const i = performance.now(), s = Math.max(0, Math.min(1, e));
    this.audioElement && (this.audioElement.muted = !1, this.audioElement.volume = 0), this.attachedVideo && (this.attachedVideo.muted = !1, this.attachedVideo.volume = 0);
    const a = () => {
      const n = performance.now() - i, r = Math.min(1, n / t), o = s * r;
      this.audioElement && (this.audioElement.volume = o), this.attachedVideo && (this.attachedVideo.volume = o), r < 1 ? this.fadeTimer = requestAnimationFrame(a) : this.applyVolume();
    };
    this.fadeTimer = requestAnimationFrame(a);
  }
  stopTrack(e = 300) {
    if (!this.audioElement || this.audioElement.paused) return;
    if (e <= 0) {
      this.audioElement.pause(), this.audioElement.currentTime = 0;
      return;
    }
    const t = this.audioElement.volume, i = performance.now(), s = () => {
      const a = performance.now() - i, n = Math.min(1, a / e);
      this.audioElement && (this.audioElement.volume = t * (1 - n)), n < 1 ? this.fadeTimer = requestAnimationFrame(s) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
    };
    this.clearFade(), this.fadeTimer = requestAnimationFrame(s);
  }
  handleVisibilityChange(e, t) {
    t && (e ? (this.audioElement && !this.audioElement.paused && (this.audioElement.pause(), this.isPausedForBlur = !0), this.attachedVideo && !this.attachedVideo.paused && this.attachedVideo.pause()) : (this.isPausedForBlur && this.audioElement && (this.audioElement.play().catch(() => {
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
  constructor(e, t) {
    this.container = e, this.audioEngine = t;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("video");
    return i.className = "st-bg-video-element", i.src = e, i.loop = !0, i.playsInline = !0, i.autoplay = !0, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.transform = "translateZ(0)", i.style.willChange = "transform", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.videoElement = i, this.audioEngine.attachVideo(i), new Promise((s) => {
      const a = async () => {
        i.removeEventListener("canplay", a);
        try {
          await i.play();
        } catch (n) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", n), i.muted = !0, i.play().catch((r) => console.error("[ST-BgLoader] Video playback error:", r));
        }
        i.style.opacity = "1", s(i);
      };
      i.addEventListener("canplay", a), i.addEventListener("error", (n) => {
        console.error("[ST-BgLoader] Error loading video:", n), s(i);
      });
    });
  }
  applyFitting(e, t) {
    switch (t) {
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
  async render(e, t = !1) {
    this.destroy();
    const i = document.createElement("iframe");
    return i.className = "st-bg-iframe-element", i.setAttribute("sandbox", "allow-scripts allow-same-origin"), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.border = "none", i.style.opacity = "0", i.style.pointerEvents = "auto", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.iframeElement = i, new Promise((s) => {
      i.onload = () => {
        i.style.opacity = "1", s(i);
      }, t ? i.src = e : i.srcdoc = e;
    });
  }
  postMessage(e) {
    this.iframeElement && this.iframeElement.contentWindow && this.iframeElement.contentWindow.postMessage(e, "*");
  }
  destroy() {
    this.iframeElement && (this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement.remove(), this.iframeElement = null);
  }
}
class L {
  imageElement = null;
  container;
  constructor(e) {
    this.container = e;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("img");
    return i.className = "st-bg-image-element", i.src = e, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.imageElement = i, new Promise((s) => {
      i.onload = () => {
        i.style.opacity = "1", s(i);
      }, i.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), s(i);
      };
    });
  }
  applyFitting(e, t) {
    switch (t) {
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
class q {
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
  crossfadeTimer = null;
  constructor(e) {
    this.audioEngine = e;
  }
  init() {
    if (this.hostEl = document.querySelector("#bg1"), !this.hostEl) {
      const e = new MutationObserver(() => {
        const t = document.querySelector("#bg1");
        t && (e.disconnect(), this.hostEl = t, this.setupContainer());
      });
      e.observe(document.body, { childList: !0, subtree: !0 });
      return;
    }
    this.setupContainer();
  }
  setupContainer() {
    if (!this.hostEl) return;
    window.getComputedStyle(this.hostEl).position === "static" && (this.hostEl.style.position = "relative");
    let t = this.hostEl.querySelector(".st-bg-media-container");
    t ? (this.layerA = t.querySelector(".st-bg-layer-a"), this.layerB = t.querySelector(".st-bg-layer-b")) : (t = document.createElement("div"), t.className = "st-bg-media-container", t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.overflow = "hidden", t.style.zIndex = "0", t.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), t.appendChild(this.layerA), t.appendChild(this.layerB), this.hostEl.appendChild(t)), this.containerEl = t, this.videoRendererA = new x(this.layerA, this.audioEngine), this.videoRendererB = new x(this.layerB, this.audioEngine), this.iframeRendererA = new T(this.layerA), this.iframeRendererB = new T(this.layerB), this.imageRendererA = new L(this.layerA), this.imageRendererB = new L(this.layerB), this.observer = new MutationObserver(() => this.syncFitting()), this.observer.observe(this.hostEl, { attributes: !0, attributeFilter: ["class"] }), this.syncFitting();
  }
  setupLayerStyle(e) {
    e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%", e.style.opacity = "0", e.style.transition = "opacity 400ms ease-in-out", e.style.pointerEvents = "none";
  }
  applyFilters(e) {
    if (!this.containerEl) return;
    const t = `blur(${e.blur}px) brightness(${e.brightness}%) opacity(${e.opacity}%) saturate(${e.saturate}%)`;
    this.containerEl.style.filter = t;
  }
  setInteractive(e) {
    const t = e ? "auto" : "none";
    this.containerEl && (this.containerEl.style.pointerEvents = t), this.layerA && (this.layerA.style.pointerEvents = t), this.layerB && (this.layerB.style.pointerEvents = t);
  }
  getFitting() {
    return this.hostEl ? this.hostEl.classList.contains("contain") ? "contain" : this.hostEl.classList.contains("stretch") ? "stretch" : this.hostEl.classList.contains("center") ? "center" : "cover" : "cover";
  }
  syncFitting() {
  }
  async mountMedia(e, t) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null;
      const c = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, u = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, g = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      c.destroy(), u.destroy(), g.destroy();
      const y = this.activeLayer === "A" ? this.layerB : this.layerA;
      y && (y.style.opacity = "0");
    }
    const i = this.activeLayer === "A" ? "B" : "A", s = i === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, n = i === "B" ? this.videoRendererB : this.videoRendererA, r = i === "B" ? this.iframeRendererB : this.iframeRendererA, o = i === "B" ? this.imageRendererB : this.imageRendererA;
    n.destroy(), r.destroy(), o.destroy();
    const d = this.getFitting();
    switch (e.type) {
      case "video":
        await n.render(t, d);
        break;
      case "html":
      case "svg":
        await r.render(t, !0);
        break;
      case "image":
        await o.render(t, d);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, t);
        break;
    }
    s.style.opacity = "1", a.style.opacity = "0", this.activeLayer = i, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const c = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, u = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, g = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      c.destroy(), u.destroy(), g.destroy();
    }, 450);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0"), this.layerB && (this.layerB.style.opacity = "0"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
class F {
  container = null;
  settings;
  cacheManager;
  callbacks;
  constructor(e, t, i) {
    this.settings = e, this.cacheManager = t, this.callbacks = i;
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
    const t = document.querySelector("#st_bgloader_settings");
    t && t.remove();
    const i = document.createElement("div");
    i.id = "st_bgloader_settings", i.className = "st-bgloader-panel", i.innerHTML = `
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
        `, e.appendChild(i), this.container = i, this.bindEvents(), this.populatePresets(), this.refreshMediaGrid(), this.updateCacheStats();
  }
  populatePresets() {
    const e = this.container?.querySelector("#st_preset_select");
    e && (e.innerHTML = "", Object.values(f).forEach((t) => {
      const i = document.createElement("option");
      i.value = t.id, i.textContent = t.name, t.id === this.settings.activePresetId && (i.selected = !0), e.appendChild(i);
    }), Object.entries(this.settings.userPresets || {}).forEach(([t, i]) => {
      const s = document.createElement("option");
      s.value = t, s.textContent = `★ ${t} (Custom)`, t === this.settings.activePresetId && (s.selected = !0), e.appendChild(s);
    }));
  }
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector(".inline-drawer-toggle"), t = this.container.querySelector(".inline-drawer-content"), i = this.container.querySelector(".inline-drawer-icon");
    e?.addEventListener("click", () => {
      const l = t.style.display === "none";
      t.style.display = l ? "flex" : "none", i && (i.classList.toggle("down", l), i.classList.toggle("up", !l));
    });
    const s = this.container.querySelector("#st_bgloader_dropzone"), a = this.container.querySelector("#st_bgloader_file_input");
    s?.addEventListener("click", () => a?.click()), a?.addEventListener("change", async () => {
      a.files && a.files.length > 0 && (await this.handleFileUpload(a.files[0]), a.value = "");
    }), s?.addEventListener("dragover", (l) => {
      l.preventDefault(), s.classList.add("dragover");
    }), s?.addEventListener("dragleave", () => s.classList.remove("dragover")), s?.addEventListener("drop", async (l) => {
      const h = l;
      h.preventDefault(), s.classList.remove("dragover"), h.dataTransfer?.files && h.dataTransfer.files.length > 0 && await this.handleFileUpload(h.dataTransfer.files[0]);
    });
    const n = this.container.querySelector("#st_bgloader_url_input");
    this.container.querySelector("#st_bgloader_url_btn")?.addEventListener("click", async () => {
      const l = n.value.trim();
      l && (await this.handleUrlImport(l), n.value = "");
    });
    const o = this.container.querySelector("#st_preset_select");
    o?.addEventListener("change", () => {
      const l = o.value;
      this.settings.activePresetId = l;
      let h = f[l]?.filters;
      !h && this.settings.userPresets[l] && (h = this.settings.userPresets[l]), h && (this.settings.filters = { ...h }, this.updateSliders(h), this.callbacks.onPresetChanged({ id: l, name: l, filters: h }), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_preset_save_btn")?.addEventListener("click", () => {
      const l = prompt("Enter a name for this custom preset:");
      if (l && l.trim()) {
        const h = l.trim();
        this.settings.userPresets[h] = { ...this.settings.filters }, this.settings.activePresetId = h, this.populatePresets(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_preset_del_btn")?.addEventListener("click", () => {
      const l = o.value;
      if (this.settings.userPresets[l]) {
        if (confirm(`Delete custom preset "${l}"?`)) {
          delete this.settings.userPresets[l], this.settings.activePresetId = "default", this.populatePresets();
          const h = f.default.filters;
          this.settings.filters = { ...h }, this.updateSliders(h), this.callbacks.onPresetChanged(f.default), this.callbacks.onSettingsChanged(this.settings);
        }
      } else
        alert("Cannot delete built-in presets.");
    });
    const d = (l, h, A, B) => {
      const _ = this.container.querySelector(l), S = this.container.querySelector(h);
      _?.addEventListener("input", () => {
        const k = Number(_.value);
        S && (S.textContent = `${k}${A}`), B(k), this.callbacks.onSettingsChanged(this.settings);
      });
    };
    d("#st_filter_blur", "#st_filter_blur_val", "px", (l) => this.settings.filters.blur = l), d("#st_filter_brightness", "#st_filter_brightness_val", "%", (l) => this.settings.filters.brightness = l), d("#st_filter_opacity", "#st_filter_opacity_val", "%", (l) => this.settings.filters.opacity = l), d("#st_filter_saturate", "#st_filter_saturate_val", "%", (l) => this.settings.filters.saturate = l), d("#st_audio_volume", "#st_audio_volume_val", "%", (l) => this.settings.volume = l / 100);
    const c = this.container.querySelector("#st_playback_mode");
    c?.addEventListener("change", () => {
      this.settings.playbackMode = c.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.callbacks.onSettingsChanged(this.settings);
    });
    const u = this.container.querySelector("#st_bg_interactive");
    u?.addEventListener("change", () => {
      this.settings.interactiveBackground = u.checked, this.callbacks.onInteractiveChanged(u.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const g = this.container.querySelector("#st_mini_player_toggle");
    g?.addEventListener("change", () => {
      this.settings.showMiniPlayer = g.checked, this.callbacks.onMiniPlayerToggle(g.checked), this.callbacks.onSettingsChanged(this.settings);
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
    const t = (i, s, a, n) => {
      const r = this.container?.querySelector(i), o = this.container?.querySelector(s);
      r && (r.value = a.toString()), o && (o.textContent = `${a}${n}`);
    };
    t("#st_filter_blur", "#st_filter_blur_val", e.blur, "px"), t("#st_filter_brightness", "#st_filter_brightness_val", e.brightness, "%"), t("#st_filter_opacity", "#st_filter_opacity_val", e.opacity, "%"), t("#st_filter_saturate", "#st_filter_saturate_val", e.saturate, "%");
  }
  async refreshMediaGrid() {
    const e = this.container?.querySelector("#st_bgloader_grid");
    if (!e) return;
    const t = await this.cacheManager.listMedia();
    if (e.innerHTML = "", t.length === 0) {
      e.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; opacity: 0.6;">No media items imported yet.</div>';
      return;
    }
    t.forEach((i) => {
      const s = document.createElement("div");
      s.className = "st-bgloader-media-card", this.settings.activeMediaId === i.id && s.classList.add("active"), s.innerHTML = `
                <div class="st-bgloader-media-badge ${i.type}">${i.type}</div>
                <button class="st-bgloader-media-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                <div class="st-bgloader-media-card-title" title="${i.name}">${i.name}</div>
            `, s.addEventListener("click", (n) => {
        n.target.closest(".st-bgloader-media-delete") || (this.settings.activeMediaId = i.id, this.container?.querySelectorAll(".st-bgloader-media-card").forEach((o) => o.classList.remove("active")), s.classList.add("active"), this.callbacks.onMediaSelected(i), this.callbacks.onSettingsChanged(this.settings));
      }), s.querySelector(".st-bgloader-media-delete")?.addEventListener("click", async (n) => {
        n.stopPropagation(), confirm(`Delete media "${i.name}"?`) && (await this.cacheManager.deleteMedia(i.id), this.settings.activeMediaId === i.id && (this.settings.activeMediaId = null, this.callbacks.onSettingsChanged(this.settings)), this.callbacks.onMediaDeleted(i.id), await this.refreshMediaGrid(), await this.updateCacheStats());
      }), e.appendChild(s);
    });
  }
  async updateCacheStats() {
    const e = this.container?.querySelector("#st_cache_used"), t = this.container?.querySelector("#st_cache_count");
    if (!e || !t) return;
    const { usedBytes: i, itemCount: s } = await this.cacheManager.getCacheUsage(), a = (i / (1024 * 1024)).toFixed(2);
    e.textContent = `${a} MB`, t.textContent = s.toString();
  }
  async handleFileUpload(e) {
    const t = this.detectMediaType(e.name, e.type), i = await this.cacheManager.saveMedia(e, e.name, t, "local");
    await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(i);
  }
  async handleUrlImport(e) {
    const t = e.split("/").pop()?.split("?")[0] || "remote_media", i = this.detectMediaType(t), s = await this.cacheManager.saveMedia(new Blob([]), t, i, "url", e);
    await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(s);
  }
  detectMediaType(e, t = "") {
    const i = e.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(i) || t.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(i) || t.startsWith("audio/") ? "audio" : i === "html" || i === "htm" ? "html" : i === "svg" ? "svg" : "image";
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
      const t = new MutationObserver(() => {
        document.querySelector("#bg_menu_content") && (t.disconnect(), this.start());
      });
      t.observe(document.body, { childList: !0, subtree: !0 });
    }
  }
  augmentThumbnails(e) {
    e.querySelectorAll(".bg_example[bgfile]:not([data-st-bg-augmented])").forEach((i) => {
      i.setAttribute("data-st-bg-augmented", "true");
      const s = i.getAttribute("bgfile") || "", a = this.detectType(s);
      if (a !== "image") {
        const n = document.createElement("span");
        n.className = `st-bg-native-badge ${a}`, n.textContent = a.toUpperCase(), i.appendChild(n), i.addEventListener("click", () => {
          const r = i.dataset.url || `/backgrounds/${s}`;
          this.onNativeMediaSelect(r, a, s);
        });
      }
    });
  }
  detectType(e) {
    const t = e.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "ogv"].includes(t) ? "video" : ["mp3", "wav", "ogg", "flac"].includes(t) ? "audio" : ["html", "htm"].includes(t) ? "html" : t === "svg" ? "svg" : "image";
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
  render(e = !0, t = !0) {
    this.isVisible = e, this.capsuleOnPlayOnly = t;
    const i = document.querySelector("#st_bg_mini_player");
    i && i.remove();
    const s = document.createElement("div");
    s.id = "st_bg_mini_player", s.className = "st-bg-mini-player";
    const a = this.audioEngine.getCurrentTrack(), n = a ? a.name : "No Audio Selected", r = this.audioEngine.isPlaying(), o = this.audioEngine.getPlaybackMode(), d = this.isVisible && (!this.capsuleOnPlayOnly || r);
    s.classList.add(d ? "visible" : "hidden"), s.innerHTML = `
            <div class="st-bg-mini-capsule">
                <button class="st-bg-mini-btn" id="st_mini_prev" title="Previous Track">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button class="st-bg-mini-btn st-bg-mini-play" id="st_mini_play" title="Play/Pause">
                    <i class="fa-solid ${r ? "fa-pause" : "fa-play"}"></i>
                </button>
                <button class="st-bg-mini-btn" id="st_mini_next" title="Next Track">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <div class="st-bg-mini-track" id="st_mini_title" title="${n}">${n}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${o}">
                    <i class="fa-solid ${this.getModeIcon(o)}"></i>
                </button>
            </div>
        `, document.body.appendChild(s), this.container = s, this.bindEvents(), this.audioEngine.onTrackChange = (c) => {
      const u = this.container?.querySelector("#st_mini_title");
      if (u) {
        const g = c ? c.name : "No Audio";
        u.textContent = g, u.setAttribute("title", g);
      }
    }, this.audioEngine.onPlayStateChange = (c) => {
      const u = this.container?.querySelector("#st_mini_play i");
      u && (u.className = `fa-solid ${c ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (c ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
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
      const e = this.audioEngine.getPlaybackMode(), t = e === "loop" ? "shuffle" : e === "shuffle" ? "single" : "loop";
      this.audioEngine.setPlaybackMode(t);
      const i = this.container?.querySelector("#st_mini_mode");
      if (i) {
        i.setAttribute("title", `Mode: ${t}`);
        const s = i.querySelector("i");
        s && (s.className = `fa-solid ${this.getModeIcon(t)}`);
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
class N {
  ext;
  eventListeners = /* @__PURE__ */ new Map();
  constructor(e) {
    this.ext = e;
  }
  /**
   * Switch background to a URL, cached media ID, or local file.
   * Supports MP4/WebM video, HTML/Canvas sandboxed pages, SVG animations, and images.
   */
  async setBackground(e, t) {
    let s = (await this.ext.getCacheManager().listMedia()).find((a) => a.id === e || a.name === e || a.url === e || a.cacheKey === e);
    if (!s) {
      const a = t?.name || e.split("/").pop()?.split("?")[0] || "remote_background", n = t?.type || this.detectType(e);
      t?.saveToLibrary ? s = await this.ext.getCacheManager().saveMedia(new Blob([]), a, n, "url", e) : s = {
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
    t?.filters && this.setFilters(t.filters), typeof t?.interactive == "boolean" && this.setInteractive(t.interactive), await this.ext.applyMediaItem(s), this.emit("media-change", s);
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
  async playBGM(e, t) {
    typeof t?.volume == "number" && this.setVolume(t.volume);
    let s = (await this.ext.getCacheManager().listMedia()).find((n) => n.id === e || n.name === e || n.url === e || n.cacheKey === e);
    if (!s) {
      const n = t?.title || e.split("/").pop()?.split("?")[0] || "BGM";
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
    const t = Math.max(0, Math.min(1, e));
    this.ext.getSettings().volume = t, this.ext.getAudioEngine().setVolume(t), this.ext.saveSettings(), this.emit("volume-change", t);
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
    const t = this.ext.getSettings().filters, i = {
      blur: e.blur !== void 0 ? e.blur : t.blur,
      brightness: e.brightness !== void 0 ? e.brightness : t.brightness,
      opacity: e.opacity !== void 0 ? e.opacity : t.opacity,
      saturate: e.saturate !== void 0 ? e.saturate : t.saturate
    };
    this.ext.getSettings().filters = i, this.ext.getMediaMount().applyFilters(i), this.ext.saveSettings(), this.emit("filters-change", i);
  }
  /**
   * Apply built-in or custom filter preset
   */
  applyPreset(e) {
    const t = this.ext.getSettings();
    let i = f[e]?.filters;
    !i && t.userPresets[e] && (i = t.userPresets[e]), i ? (t.activePresetId = e, t.filters = { ...i }, this.ext.getMediaMount().applyFilters(i), this.ext.saveSettings(), this.emit("preset-change", e, i)) : console.warn(`[ST-BgLoader PublicAPI] Preset "${e}" not found.`);
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
    const e = this.ext.getSettings(), t = this.ext.getAudioEngine();
    return {
      isPlaying: t.isPlaying(),
      currentTrack: t.getCurrentTrack(),
      volume: t.getVolume(),
      muted: t.isMuted(),
      playbackMode: t.getPlaybackMode(),
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
  /**
   * Preload remote media files (video, audio, html, svg, images) into CacheStorage.
   * Guarantees zero-network-delay instant switching when subsequently set as background or BGM.
   */
  async preloadMedia(e, t) {
    const i = Array.isArray(e) ? e : [e], s = [], a = t?.concurrency || 3;
    let n = 0;
    const r = [...i], o = Array.from({ length: Math.min(a, r.length) }, async () => {
      for (; r.length > 0; ) {
        const d = r.shift();
        try {
          const { item: c, isNew: u } = await this.ext.getCacheManager().preloadUrl(d), g = {
            url: d,
            success: !0,
            cached: !u,
            size: c.size || 0
          };
          s.push(g);
        } catch (c) {
          s.push({
            url: d,
            success: !1,
            cached: !1,
            size: 0,
            error: c?.message || String(c)
          });
        }
        n++, t?.onProgress?.(n, i.length, d), this.emit("preload-progress", n, i.length, d);
      }
    });
    return await Promise.all(o), this.emit("preload-complete", s), s;
  }
  // --- Event Bus ---
  /**
   * Subscribe to ST-BgLoader events. Returns unsubscribe function.
   * Events: 'media-change', 'track-change', 'play-state-change', 'volume-change', 'mute-change', 'filters-change', 'preset-change', 'interactive-change'
   */
  on(e, t) {
    return this.eventListeners.has(e) || this.eventListeners.set(e, /* @__PURE__ */ new Set()), this.eventListeners.get(e).add(t), () => this.off(e, t);
  }
  off(e, t) {
    this.eventListeners.get(e)?.delete(t);
  }
  emit(e, ...t) {
    this.eventListeners.get(e)?.forEach((i) => {
      try {
        i(...t);
      } catch (s) {
        console.error(`[ST-BgLoader PublicAPI] Error in listener for "${e}":`, s);
      }
    });
  }
  detectType(e) {
    const t = e.split(".").pop()?.toLowerCase().split("?")[0] || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
  }
}
const P = "st_bgloader_settings";
class j {
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
    this.cacheManager = new V(), this.audioEngine = new U(), this.mediaMount = new q(this.audioEngine), this.publicApi = new N(this);
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
    const t = (await this.cacheManager.listMedia()).filter((a) => a.type === "audio");
    this.audioEngine.setPlaylist(t), this.miniPlayer = new D(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly);
    const i = this.audioEngine.onTrackChange;
    this.audioEngine.onTrackChange = (a) => {
      i?.(a), this.publicApi.emit("track-change", a);
    };
    const s = this.audioEngine.onPlayStateChange;
    if (this.audioEngine.onPlayStateChange = (a) => {
      s?.(a), this.publicApi.emit("play-state-change", a);
    }, this.settingsDrawer = new F(this.settings, this.cacheManager, {
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
        this.audioEngine.setPlaylist(n.filter((r) => r.type === "audio"));
      },
      onMediaUploaded: async (a) => {
        if (this.settings.lruAutoClean) {
          const n = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(n);
        }
        if (a.type === "audio") {
          const n = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(n.filter((r) => r.type === "audio"));
        }
        await this.applyMedia(a);
      }
    }), this.settingsDrawer.render(), this.nativeAugmenter = new $(async (a, n, r) => {
      const o = {
        id: "native_" + r,
        name: r,
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
    const t = await this.cacheManager.getMediaBlobUrl(e);
    await this.mediaMount.mountMedia(e, t), this.settingsDrawer && (this.settingsDrawer.refreshMediaGrid(), this.settingsDrawer.updateCacheStats());
  }
  hookSillyTavernEvents() {
    const e = window;
    e.eventSource && e.event_types && e.eventSource.on(e.event_types.CHAT_CHANGED, async () => {
      const t = e.getCurrentChatId ? e.getCurrentChatId() : null;
      if (t && this.settings.chatBindings[t]) {
        const i = this.settings.chatBindings[t], s = await this.cacheManager.getMedia(i);
        if (s) {
          await this.applyMedia(s);
          return;
        }
      }
      if (this.settings.activeMediaId) {
        const i = await this.cacheManager.getMedia(this.settings.activeMediaId);
        i && await this.applyMedia(i);
      }
    });
  }
  loadSettings() {
    try {
      const e = localStorage.getItem(P);
      e && (this.settings = { ...E, ...JSON.parse(e) });
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...E };
    }
  }
  saveSettings() {
    try {
      localStorage.setItem(P, JSON.stringify(this.settings));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
}
const w = new j();
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => w.init()) : w.init();
window.STBgLoader = w;
window.stBgLoader = w.getAPI();
export {
  j as STBgLoaderExtension
};
