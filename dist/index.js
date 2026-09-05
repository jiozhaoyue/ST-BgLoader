const w = {
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
  cacheQuotaMB: 1024,
  lruAutoClean: !0,
  chatBindings: {}
}, A = "st_bg_loader_db", T = 1, c = "media_items", E = "st-bg-cache-v1";
class x {
  db = null;
  cache = null;
  objectUrls = /* @__PURE__ */ new Map();
  async init() {
    "caches" in window && (this.cache = await caches.open(E)), this.db = await new Promise((e, i) => {
      const t = indexedDB.open(A, T);
      t.onupgradeneeded = (s) => {
        const a = s.target.result;
        if (!a.objectStoreNames.contains(c)) {
          const n = a.createObjectStore(c, { keyPath: "id" });
          n.createIndex("type", "type", { unique: !1 }), n.createIndex("lastUsedTimestamp", "lastUsedTimestamp", { unique: !1 });
        }
      }, t.onsuccess = () => e(t.result), t.onerror = () => i(t.error);
    });
  }
  async listMedia() {
    return this.db || await this.init(), new Promise((e, i) => {
      const a = this.db.transaction(c, "readonly").objectStore(c).getAll();
      a.onsuccess = () => e(a.result || []), a.onerror = () => i(a.error);
    });
  }
  async getMedia(e) {
    return this.db || await this.init(), new Promise((i, t) => {
      const n = this.db.transaction(c, "readonly").objectStore(c).get(e);
      n.onsuccess = () => i(n.result || null), n.onerror = () => t(n.error);
    });
  }
  async saveMedia(e, i, t, s, a) {
    (!this.db || !this.cache) && await this.init();
    const n = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), o = `/st-bg-cache/${n}/${encodeURIComponent(i)}`;
    let l, d = "", h = 0;
    typeof e == "string" ? (d = t === "svg" ? "image/svg+xml" : "text/html", l = new Blob([e], { type: d }), h = l.size) : (l = e, d = e.type || this.guessMimeType(i, t), h = e.size);
    const p = new Headers({
      "Content-Type": d,
      "Content-Length": h.toString()
    }), r = new Response(l, { headers: p });
    await this.cache.put(o, r);
    const u = {
      id: n,
      name: i,
      type: t,
      source: s,
      url: a || o,
      cacheKey: o,
      size: h,
      mimeType: d,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: t === "video" || t === "audio"
    };
    return await new Promise((y, b) => {
      const m = this.db.transaction(c, "readwrite").objectStore(c).put(u);
      m.onsuccess = () => y(), m.onerror = () => b(m.error);
    }), u;
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
    i && (i.lastUsedTimestamp = Date.now(), this.db.transaction(c, "readwrite").objectStore(c).put(i));
  }
  async deleteMedia(e) {
    (!this.db || !this.cache) && await this.init();
    const i = await this.getMedia(e);
    i && (await this.cache.delete(i.cacheKey), this.objectUrls.has(e) && (URL.revokeObjectURL(this.objectUrls.get(e)), this.objectUrls.delete(e)), await new Promise((t, s) => {
      const o = this.db.transaction(c, "readwrite").objectStore(c).delete(e);
      o.onsuccess = () => t(), o.onerror = () => s(o.error);
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
    this.objectUrls.clear(), "caches" in window && (await caches.delete(E), this.cache = await caches.open(E)), await new Promise((e, i) => {
      const a = this.db.transaction(c, "readwrite").objectStore(c).clear();
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
class C {
  audioElement = null;
  attachedVideo = null;
  volume = 0.8;
  muted = !1;
  isPausedForBlur = !1;
  fadeTimer = null;
  constructor() {
    this.audioElement = new Audio(), this.audioElement.loop = !0, this.audioElement.preload = "auto";
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
  attachVideo(e) {
    this.attachedVideo = e, this.attachedVideo && this.applyVolume();
  }
  async playTrack(e, i = !0) {
    if (this.audioElement) {
      this.clearFade(), this.audioElement.src = e, this.audioElement.loop = i, this.applyVolume();
      try {
        await this.audioElement.play();
      } catch (t) {
        console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", t);
      }
    }
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
    this.clearFade(), this.audioElement && (this.audioElement.pause(), this.audioElement.src = "", this.audioElement = null), this.attachedVideo = null;
  }
}
class _ {
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
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", n), t.muted = !0, t.play().catch((o) => console.error("[ST-BgLoader] Video playback error:", o));
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
class S {
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
class L {
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
class R {
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
    i ? (this.layerA = i.querySelector(".st-bg-layer-a"), this.layerB = i.querySelector(".st-bg-layer-b")) : (i = document.createElement("div"), i.className = "st-bg-media-container", i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.overflow = "hidden", i.style.zIndex = "0", i.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), i.appendChild(this.layerA), i.appendChild(this.layerB), this.hostEl.appendChild(i)), this.containerEl = i, this.videoRendererA = new _(this.layerA, this.audioEngine), this.videoRendererB = new _(this.layerB, this.audioEngine), this.iframeRendererA = new S(this.layerA), this.iframeRendererB = new S(this.layerB), this.imageRendererA = new L(this.layerA), this.imageRendererB = new L(this.layerB), this.observer = new MutationObserver(() => this.syncFitting()), this.observer.observe(this.hostEl, { attributes: !0, attributeFilter: ["class"] }), this.syncFitting();
  }
  setupLayerStyle(e) {
    e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%", e.style.opacity = "0", e.style.transition = "opacity 400ms ease-in-out", e.style.pointerEvents = "none";
  }
  applyFilters(e) {
    if (!this.containerEl) return;
    const i = `blur(${e.blur}px) brightness(${e.brightness}%) opacity(${e.opacity}%) saturate(${e.saturate}%)`;
    this.containerEl.style.filter = i;
  }
  getFitting() {
    return this.hostEl ? this.hostEl.classList.contains("contain") ? "contain" : this.hostEl.classList.contains("stretch") ? "stretch" : this.hostEl.classList.contains("center") ? "center" : "cover" : "cover";
  }
  syncFitting() {
  }
  async mountMedia(e, i) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    const t = this.activeLayer === "A" ? "B" : "A", s = t === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, n = t === "B" ? this.videoRendererB : this.videoRendererA, o = t === "B" ? this.iframeRendererB : this.iframeRendererA, l = t === "B" ? this.imageRendererB : this.imageRendererA;
    n.destroy(), o.destroy(), l.destroy();
    const d = this.getFitting();
    switch (e.type) {
      case "video":
        await n.render(i, d);
        break;
      case "html":
      case "svg":
        await o.render(i, !0);
        break;
      case "image":
        await l.render(i, d);
        break;
      case "audio":
        await this.audioEngine.playTrack(i);
        break;
    }
    s.style.opacity = "1", a.style.opacity = "0", setTimeout(() => {
      const h = this.activeLayer === "A" ? this.videoRendererA : this.videoRendererB, p = this.activeLayer === "A" ? this.iframeRendererA : this.iframeRendererB, r = this.activeLayer === "A" ? this.imageRendererA : this.imageRendererB;
      h.destroy(), p.destroy(), r.destroy(), this.activeLayer = t;
    }, 450);
  }
  clear() {
    this.layerA && (this.layerA.style.opacity = "0"), this.layerB && (this.layerB.style.opacity = "0"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
class k {
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
      console.warn("[ST-BgLoader] #extensions_settings not found yet");
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

                    <!-- Visual Filters Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-sliders"></i> Visual Adjustments</h4>
                        
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
                    </div>

                    <!-- Audio Engine Controls -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-volume-high"></i> Audio & BGM</h4>
                        
                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_audio_volume" min="0" max="100" step="1" value="${Math.round(this.settings.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_audio_volume_val">${Math.round(this.settings.volume * 100)}%</span>
                        </div>

                        <div style="display: flex; gap: 15px; margin-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_mute" ${this.settings.muted ? "checked" : ""} />
                                <span>Mute Audio</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? "checked" : ""} />
                                <span>Pause when tab inactive</span>
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
        `, e.appendChild(t), this.container = t, this.bindEvents(), this.refreshMediaGrid(), this.updateCacheStats();
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
      const u = r;
      u.preventDefault(), s.classList.remove("dragover"), u.dataTransfer?.files && u.dataTransfer.files.length > 0 && await this.handleFileUpload(u.dataTransfer.files[0]);
    });
    const n = this.container.querySelector("#st_bgloader_url_input");
    this.container.querySelector("#st_bgloader_url_btn")?.addEventListener("click", async () => {
      const r = n.value.trim();
      r && (await this.handleUrlImport(r), n.value = "");
    });
    const l = (r, u, y, b) => {
      const v = this.container.querySelector(r), f = this.container.querySelector(u);
      v?.addEventListener("input", () => {
        const m = Number(v.value);
        f && (f.textContent = `${m}${y}`), b(m), this.callbacks.onSettingsChanged(this.settings);
      });
    };
    l("#st_filter_blur", "#st_filter_blur_val", "px", (r) => this.settings.filters.blur = r), l("#st_filter_brightness", "#st_filter_brightness_val", "%", (r) => this.settings.filters.brightness = r), l("#st_filter_opacity", "#st_filter_opacity_val", "%", (r) => this.settings.filters.opacity = r), l("#st_filter_saturate", "#st_filter_saturate_val", "%", (r) => this.settings.filters.saturate = r), l("#st_audio_volume", "#st_audio_volume_val", "%", (r) => this.settings.volume = r / 100);
    const d = this.container.querySelector("#st_audio_mute");
    d?.addEventListener("change", () => {
      this.settings.muted = d.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const h = this.container.querySelector("#st_audio_blur");
    h?.addEventListener("change", () => {
      this.settings.pauseOnBlur = h.checked, this.callbacks.onSettingsChanged(this.settings);
    }), this.container.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      confirm("Are you sure you want to clear all cached media files?") && (await this.cacheManager.clearAll(), await this.refreshMediaGrid(), await this.updateCacheStats());
    });
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
        n.target.closest(".st-bgloader-media-delete") || (this.settings.activeMediaId = t.id, this.container?.querySelectorAll(".st-bgloader-media-card").forEach((l) => l.classList.remove("active")), s.classList.add("active"), this.callbacks.onMediaSelected(t), this.callbacks.onSettingsChanged(this.settings));
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
class I {
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
          const o = t.dataset.url || `/backgrounds/${s}`;
          this.onNativeMediaSelect(o, a, s);
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
const B = "st_bgloader_settings";
class U {
  settings = { ...w };
  cacheManager;
  audioEngine;
  mediaMount;
  settingsDrawer = null;
  nativeAugmenter = null;
  constructor() {
    this.cacheManager = new x(), this.audioEngine = new C(), this.mediaMount = new R(this.audioEngine);
  }
  async init() {
    if (console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), this.loadSettings(), await this.cacheManager.init(), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.settingsDrawer = new k(this.settings, this.cacheManager, {
      onSettingsChanged: (e) => {
        this.settings = e, this.saveSettings(), this.mediaMount.applyFilters(this.settings.filters), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted);
      },
      onMediaSelected: async (e) => {
        await this.applyMedia(e);
      },
      onMediaDeleted: (e) => {
        this.settings.activeMediaId === e && (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings());
      },
      onMediaUploaded: async (e) => {
        if (this.settings.lruAutoClean) {
          const i = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(i);
        }
        await this.applyMedia(e);
      }
    }), this.settingsDrawer.render(), this.nativeAugmenter = new I(async (e, i, t) => {
      const s = {
        id: "native_" + t,
        name: t,
        type: i,
        source: "server",
        url: e,
        cacheKey: e,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
      await this.applyMedia(s);
    }), this.nativeAugmenter.start(), document.addEventListener("visibilitychange", () => {
      this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
    }), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const e = await this.cacheManager.getMedia(this.settings.activeMediaId);
      e && await this.applyMedia(e);
    }
    console.log("[ST-BgLoader] Initialization complete.");
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
      const e = localStorage.getItem(B);
      e && (this.settings = { ...w, ...JSON.parse(e) });
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...w };
    }
  }
  saveSettings() {
    try {
      localStorage.setItem(B, JSON.stringify(this.settings));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
}
const M = new U();
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => M.init()) : M.init();
window.STBgLoader = M;
export {
  U as STBgLoaderExtension
};
