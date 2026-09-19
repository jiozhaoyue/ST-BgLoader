const E = {
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
}, M = {
  cyber_rain: {
    id: "cyber_rain",
    name: "Cyberpunk Rain (赛博雨夜)",
    presetId: "cyberpunk",
    weather: { type: "rain", density: "high", speed: 1.3, opacity: 0.85, wind: 0.8 },
    visualizer: { mode: "pulse", color: "#00f0ff", sensitivity: 1.2 },
    parallax: { enabled: !0, intensity: 0.4 },
    ambientSound: { type: "rain", volume: 0.5 },
    frostedChat: !0,
    isBuiltin: !0
  },
  cozy_fireplace: {
    id: "cozy_fireplace",
    name: "Cozy Fireplace (壁炉夜话)",
    presetId: "vintage_sepia",
    weather: { type: "cyber_motes", density: "low", speed: 0.8, opacity: 0.6, wind: 0.2 },
    visualizer: { mode: "off", color: "#ffaa44", sensitivity: 1 },
    parallax: { enabled: !1, intensity: 0.2 },
    ambientSound: { type: "fire", volume: 0.6 },
    frostedChat: !0,
    isBuiltin: !0
  },
  sakura_shrine: {
    id: "sakura_shrine",
    name: "Sakura Shrine (落樱古刹)",
    presetId: "dreamy_bloom",
    weather: { type: "sakura", density: "high", speed: 1, opacity: 0.8, wind: 0.6 },
    visualizer: { mode: "off", color: "#ffb7c5", sensitivity: 1 },
    parallax: { enabled: !0, intensity: 0.3 },
    ambientSound: { type: "wind", volume: 0.4 },
    frostedChat: !0,
    isBuiltin: !0
  },
  winter_cabin: {
    id: "winter_cabin",
    name: "Winter Cabin (雪山木屋)",
    presetId: "cinema_dark",
    weather: { type: "snow", density: "high", speed: 1.1, opacity: 0.85, wind: 0.4 },
    visualizer: { mode: "off", color: "#ffffff", sensitivity: 1 },
    parallax: { enabled: !0, intensity: 0.3 },
    ambientSound: { type: "wind", volume: 0.5 },
    frostedChat: !0,
    isBuiltin: !0
  }
}, P = {
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
  chatBindings: {},
  // Subsystem Defaults
  weather: {
    type: "off",
    density: "medium",
    speed: 1,
    opacity: 0.75,
    wind: 0.5
  },
  visualizer: {
    mode: "off",
    color: "#4fa3d1",
    sensitivity: 1
  },
  parallax: {
    enabled: !1,
    intensity: 0.3
  },
  transitionEffect: "fade",
  transitionDurationMs: 400,
  muffleBGM: !1,
  muffleOnDrawer: !1,
  triggerRules: [],
  ambientSound: {
    type: "off",
    volume: 0.5
  },
  frostedChat: {
    enabled: !1,
    blur: 10,
    opacity: 75
  },
  scenes: {},
  shortcutsEnabled: !0,
  agentToolsEnabled: !1
}, j = "st-bg-loader-manifest.json", x = 1;
function S(h) {
  return `backgrounds/${encodeURIComponent(h)}`;
}
const se = 6e4;
class ae {
  manifest = { version: x, items: [] };
  async init() {
    try {
      const e = await fetch(`${S(j)}?t=${Date.now()}`, { cache: "no-store" });
      if (e.ok) {
        const t = JSON.parse(await e.text());
        t && Array.isArray(t.items) && (this.manifest = { version: x, items: t.items });
      }
    } catch (e) {
      console.warn("[ST-BgLoader] No server media manifest yet, starting a fresh one:", e), this.manifest = { version: x, items: [] };
    }
    console.log(`[ST-BgLoader] Server media library ready: ${this.manifest.items.length} cataloged entries.`);
  }
  async listCatalog() {
    const e = /* @__PURE__ */ new Map();
    try {
      const t = await fetch("/api/backgrounds/all", {
        method: "POST",
        headers: { ...this.csrfHeaders(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok) {
        const i = await t.json();
        for (const s of i.images ?? []) {
          const a = ne(s.filename);
          e.set(s.filename, {
            id: "native_" + s.filename,
            name: s.filename,
            type: a,
            source: "server",
            url: S(s.filename),
            cacheKey: S(s.filename),
            size: 0,
            mimeType: F(s.filename, a),
            addedTimestamp: 0,
            lastUsedTimestamp: 0,
            hasAudio: !1
          });
        }
      }
    } catch (t) {
      console.warn("[ST-BgLoader] Native background listing unavailable:", t);
    }
    for (const t of this.manifest.items)
      t.filename ? e.set(t.filename, this.manifestToItem(t)) : t.remoteUrl && e.set(t.id, {
        id: t.id,
        name: t.remoteUrl.split("/").pop() || t.id,
        type: t.type,
        source: "url",
        url: t.remoteUrl,
        cacheKey: t.id,
        size: t.size,
        mimeType: t.mimeType,
        addedTimestamp: t.addedTimestamp,
        lastUsedTimestamp: t.lastUsedTimestamp,
        hasAudio: t.hasAudio
      });
    return [...e.values()];
  }
  async getCatalogItem(e) {
    const t = this.manifest.items.find((s) => s.id === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((s) => s.id === e) ?? null;
  }
  async putMedia(e) {
    const t = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), i = e.blob.type || F(e.name, e.type);
    if (e.source === "url" && e.blob.size === 0 && e.remoteUrl) {
      const r = {
        id: t,
        filename: null,
        type: e.type,
        source: "url",
        remoteUrl: e.remoteUrl,
        size: 0,
        mimeType: i,
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now(),
        hasAudio: e.type === "video" || e.type === "audio"
      };
      return this.manifest.items.push(r), await this.saveManifest(), {
        id: t,
        name: e.name,
        type: e.type,
        source: "url",
        url: e.remoteUrl,
        cacheKey: t,
        size: 0,
        mimeType: i,
        addedTimestamp: r.addedTimestamp,
        lastUsedTimestamp: r.lastUsedTimestamp,
        hasAudio: r.hasAudio
      };
    }
    const s = await this.uploadFile(e.name, e.blob, i), a = {
      id: t,
      filename: s,
      type: e.type,
      source: e.source,
      remoteUrl: e.remoteUrl ?? null,
      size: e.blob.size,
      mimeType: i,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: e.type === "video" || e.type === "audio"
    };
    return this.manifest.items = this.manifest.items.filter((r) => r.filename !== s), this.manifest.items.push(a), await this.saveManifest(), this.manifestToItem(a);
  }
  async deleteMedia(e) {
    let i = this.manifest.items.find((a) => a.id === e)?.filename ?? null;
    if (!i) {
      const a = await this.getCatalogItem(e);
      a?.url?.startsWith("backgrounds/") && (i = decodeURIComponent(a.url.slice(12)));
    }
    if (!i) {
      this.manifest.items = this.manifest.items.filter((a) => a.id !== e), await this.saveManifest();
      return;
    }
    const s = await fetch("/api/backgrounds/delete", {
      method: "POST",
      headers: { ...this.csrfHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ bg: i })
    });
    if (!s.ok)
      throw new Error(`Server delete failed for "${i}": HTTP ${s.status}`);
    this.manifest.items = this.manifest.items.filter((a) => a.id !== e && a.filename !== i), await this.saveManifest();
  }
  async readMedia(e) {
    if (!e.url) return null;
    const t = await fetch(e.url, { cache: "no-store" });
    return t.ok ? t.blob() : null;
  }
  async touchMedia(e, t) {
  }
  async findByUrl(e) {
    const t = this.manifest.items.find((s) => s.remoteUrl === e || S(s.filename ?? "") === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((s) => s.url === e || s.cacheKey === e) ?? null;
  }
  /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
  async download(e) {
    let t = null;
    try {
      t = new URL(e, window.location.href);
    } catch {
    }
    const i = !!t && t.origin !== window.location.origin, s = await fetch(e, i ? { signal: AbortSignal.timeout(se) } : void 0);
    if (!s.ok)
      throw new Error(`Failed to fetch media from ${e}: ${s.status} ${s.statusText}`);
    return s.blob();
  }
  async uploadFile(e, t, i) {
    let s = re(e || "media");
    if (await this.filenameExists(s)) {
      const n = s.lastIndexOf("."), l = n > 0 ? s.slice(0, n) : s, d = n > 0 ? s.slice(n) : "";
      s = `${l}_${Date.now()}${d}`;
    }
    const a = new FormData();
    a.append("avatar", new File([t], s, { type: i }));
    const r = await fetch("/api/backgrounds/upload", { method: "POST", headers: this.csrfHeaders(), body: a });
    if (!r.ok)
      throw new Error(`Server upload failed: HTTP ${r.status}`);
    return (await r.text()).trim() || s;
  }
  async filenameExists(e) {
    if (this.manifest.items.some((t) => t.filename === e)) return !0;
    try {
      const t = await fetch("/api/backgrounds/all", {
        method: "POST",
        headers: { ...this.csrfHeaders(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok)
        return ((await t.json()).images ?? []).some((s) => s.filename === e);
    } catch {
    }
    return !1;
  }
  async saveManifest() {
    this.manifest.version = x;
    const e = new Blob([JSON.stringify(this.manifest, null, 2)], { type: "application/json" });
    try {
      const t = new FormData();
      t.append("avatar", new File([e], j, { type: "application/json" }));
      const i = await fetch("/api/backgrounds/upload", { method: "POST", headers: this.csrfHeaders(), body: t });
      if (!i.ok)
        throw new Error(`HTTP ${i.status}`);
    } catch (t) {
      throw console.error("[ST-BgLoader] Failed to save server media manifest:", t), t;
    }
  }
  manifestToItem(e) {
    const t = e.source === "url" && e.remoteUrl ? e.remoteUrl : e.filename ? S(e.filename) : e.remoteUrl ?? "";
    return {
      id: e.id,
      name: e.filename || e.remoteUrl || e.id,
      type: e.type,
      source: e.source === "url" ? "url" : "server",
      url: t,
      cacheKey: e.filename ? S(e.filename) : e.id,
      size: e.size,
      mimeType: e.mimeType,
      addedTimestamp: e.addedTimestamp,
      lastUsedTimestamp: e.lastUsedTimestamp,
      hasAudio: e.hasAudio
    };
  }
  csrfHeaders() {
    try {
      const t = window.SillyTavern?.getContext?.().getRequestHeaders?.({ omitContentType: !0 });
      return t ? { ...t } : {};
    } catch {
      return {};
    }
  }
}
function ne(h) {
  const e = h.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "webm", "mov", "m4v", "ogv"].includes(e) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(e) ? "audio" : e === "html" || e === "htm" ? "html" : e === "svg" ? "svg" : "image";
}
function F(h, e) {
  switch (h.split(".").pop()?.toLowerCase()) {
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
      return e === "video" ? "video/mp4" : e === "audio" ? "audio/mpeg" : e === "svg" ? "image/svg+xml" : e === "html" ? "text/html" : "image/png";
  }
}
function re(h) {
  return (h || "media").replace(/[^a-zA-Z0-9._ -]/g, "_");
}
const oe = "extension:third-party/ST-BgLoader", W = "st_bgloader_cloud_notice_v1";
class C {
  static EXTENSION_ID = "third-party/ST-BgLoader";
  static CHANNEL = oe;
  client = null;
  caps = {
    available: !1,
    sync: !1,
    serverFetch: !1,
    agentTools: !1,
    degradedReason: "sdk-missing"
  };
  httpAllow = [];
  initPromise = null;
  getCapabilities() {
    return this.caps;
  }
  getClient() {
    return this.client;
  }
  async detectAndInit() {
    return this.initPromise ? this.initPromise : (this.initPromise = this.doInit(), this.initPromise);
  }
  /** Re-init after adding a hostname to the http.allow declaration (SDK init is idempotent per extensionId). */
  async ensureHttpAllowed(e) {
    if (!this.caps.serverFetch || !this.caps.available) return !1;
    const t = e.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
    if (!t || this.httpAllow.includes(t)) return !0;
    this.httpAllow.push(t);
    try {
      return await this.doInit(), this.caps.serverFetch;
    } catch {
      return !1;
    }
  }
  async doInit() {
    try {
      const e = window.STAuthority?.AuthoritySDK;
      return e ? (this.client = await e.init({
        extensionId: C.EXTENSION_ID,
        displayName: "ST-BgLoader",
        version: "1.0.0",
        installType: "local",
        uiLabel: "ST-BgLoader",
        declaredPermissions: {
          storage: { kv: !0, blob: !0 },
          sql: { private: !0 },
          http: { allow: [...this.httpAllow] },
          jobs: { background: ["delay", "sql.backup"] },
          events: { channels: [C.CHANNEL] }
        }
      }), this.caps = {
        available: !0,
        sync: !0,
        serverFetch: !0,
        agentTools: !0
      }, console.log("[ST-BgLoader] Authority backend connected:", this.client.getSession()), this.caps) : this.degrade("sdk-missing", "未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）");
    } catch (e) {
      const t = e instanceof Error ? e.message : String(e), i = /permission|denied|forbidden/i.test(t);
      return console.warn("[ST-BgLoader] Authority unavailable, falling back to local mode:", t), this.client = null, this.degrade(
        i ? "permission-denied" : "init-failed",
        i ? "Authority 权限被拒绝，媒体库运行于本地模式" : "Authority 连接失败，媒体库运行于本地模式"
      );
    }
  }
  degrade(e, t) {
    return this.caps = {
      available: !1,
      sync: !1,
      serverFetch: !1,
      agentTools: !1,
      degradedReason: e,
      degradedMessage: t
    }, this.notifyOnce(e, t), this.caps;
  }
  /** One-time silent-degradation notice (user-confirmed strategy): toastr when available, console otherwise. */
  notifyOnce(e, t) {
    console.info(`[ST-BgLoader] ${t} (${e})`);
    try {
      if (localStorage.getItem(W)) return;
      localStorage.setItem(W, (/* @__PURE__ */ new Date()).toISOString());
      const i = window.toastr;
      i?.info(t, "ST-BgLoader");
    } catch {
    }
  }
}
function le(h) {
  const e = atob(h), t = new ArrayBuffer(e.length), i = new Uint8Array(t);
  for (let s = 0; s < e.length; s++)
    i[s] = e.charCodeAt(s);
  return i;
}
class ce {
  constructor(e) {
    this.bridge = e;
  }
  async import(e) {
    const t = he(e);
    if (!t)
      throw new Error(`Cannot import from invalid URL: ${e}`);
    if (!await this.bridge.ensureHttpAllowed(t))
      throw new Error(`Server-side import unavailable for host: ${t}`);
    const i = this.bridge.getClient();
    if (!i)
      throw new Error("Authority backend unavailable");
    const s = await i.http.fetch({ url: e, method: "GET" });
    if (!s.ok)
      throw new Error(`Server fetch failed with HTTP ${s.status} for ${e}`);
    const a = le(s.body);
    return new Blob([a], { type: s.contentType || "application/octet-stream" });
  }
}
function he(h) {
  try {
    return new URL(h).hostname;
  } catch {
    return null;
  }
}
const R = "st-bg-cache-v1", de = "st_bg_cache_index", b = "entries";
class ue {
  origin;
  remoteImporter = null;
  l1 = null;
  indexDb = null;
  objectUrls = /* @__PURE__ */ new Map();
  constructor() {
    this.origin = new ae();
  }
  async init(e) {
    "caches" in window && (this.l1 = await caches.open(R)), await this.openIndex(), e && (await e.detectAndInit()).available && e.getClient() && (this.remoteImporter = new ce(e)), await this.origin.init(), console.log("[ST-BgLoader] Media library source of truth: server backgrounds/ directory (browser keeps cache only).");
  }
  async listMedia() {
    return this.origin.listCatalog();
  }
  async getMedia(e) {
    return this.origin.getCatalogItem(e);
  }
  async saveMedia(e, t, i, s, a) {
    let r = typeof e == "string" ? new Blob([e], { type: i === "svg" ? "image/svg+xml" : "text/html" }) : e;
    s === "url" && r.size === 0 && a && (r = await this.fetchForStorage(a).catch(() => new Blob([])));
    const n = await this.origin.putMedia({ blob: r, name: t, type: i, source: s, remoteUrl: a });
    return await this.backfillCache(n, r), n;
  }
  async getMediaBlobUrl(e) {
    const t = this.objectUrls.get(e.id);
    if (t)
      return await this.touchCache(e.cacheKey), t;
    if (this.l1) {
      const i = await this.l1.match(e.cacheKey);
      if (i) {
        const s = await i.blob(), a = URL.createObjectURL(s);
        return this.objectUrls.set(e.id, a), await this.touchCache(e.cacheKey), a;
      }
    }
    return await this.touchCache(e.cacheKey), e.url;
  }
  async touchMedia(e) {
  }
  async deleteMedia(e) {
    const t = await this.getMedia(e);
    await this.origin.deleteMedia(e), t && (await this.evictCacheEntry(t.cacheKey), this.objectUrls.has(e) && (URL.revokeObjectURL(this.objectUrls.get(e)), this.objectUrls.delete(e)));
  }
  async getCacheUsage() {
    const e = await this.indexAll();
    return {
      usedBytes: e.reduce((t, i) => t + (i.size || 0), 0),
      itemCount: e.length
    };
  }
  async cleanLRU(e) {
    const t = await this.indexAll();
    let i = t.reduce((s, a) => s + (a.size || 0), 0);
    if (!(i <= e)) {
      t.sort((s, a) => s.lastUsed - a.lastUsed);
      for (const s of t) {
        if (i <= e) break;
        await this.evictCacheEntry(s.cacheKey), i -= s.size || 0;
      }
    }
  }
  /** Clears the browser cache only — server files are never touched by maintenance. */
  async clearAll() {
    for (const e of this.objectUrls.values())
      URL.revokeObjectURL(e);
    this.objectUrls.clear(), "caches" in window && (await caches.delete(R), this.l1 = await caches.open(R)), await this.indexClear();
  }
  async preloadUrl(e, t) {
    const i = await this.origin.findByUrl(e);
    if (i)
      return { item: i, isNew: !1 };
    const s = e.split("/").pop()?.split("?")[0] || "preloaded_media", a = t || this.detectMediaType(s), r = await this.fetchForStorage(e), n = await this.origin.putMedia({ blob: r, name: s, type: a, source: "url", remoteUrl: e });
    return await this.backfillCache(n, r), { item: n, isNew: !0 };
  }
  detectMediaType(e) {
    const t = e.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
  }
  getMimeType(e, t) {
    return F(e, t);
  }
  // ---------- browser cache (L1) internals ----------
  async fetchForStorage(e) {
    try {
      return await this.origin.download(e);
    } catch (t) {
      if (this.remoteImporter)
        return console.warn("[ST-BgLoader] Direct download failed, importing through the Authority server:", t), this.remoteImporter.import(e);
      throw t;
    }
  }
  async backfillCache(e, t) {
    if (!(!this.l1 || t.size === 0))
      try {
        await this.l1.put(e.cacheKey, new Response(t, {
          headers: { "Content-Type": e.mimeType || t.type }
        })), await this.indexPut({ cacheKey: e.cacheKey, lastUsed: Date.now(), size: t.size });
      } catch (i) {
        console.warn("[ST-BgLoader] Cache backfill failed (playback still streams from server):", i);
      }
  }
  async touchCache(e) {
    const t = (await this.indexAll()).find((i) => i.cacheKey === e);
    t && (t.lastUsed = Date.now(), await this.indexPut(t));
  }
  async evictCacheEntry(e) {
    this.l1 && await this.l1.delete(e), await this.indexDelete(e);
  }
  async openIndex() {
    this.indexDb = await new Promise((e, t) => {
      const i = indexedDB.open(de, 1);
      i.onupgradeneeded = (s) => {
        const a = s.target.result;
        a.objectStoreNames.contains(b) || a.createObjectStore(b, { keyPath: "cacheKey" });
      }, i.onsuccess = () => e(i.result), i.onerror = () => t(i.error);
    });
  }
  async indexAll() {
    return this.indexDb || await this.openIndex(), new Promise((e, t) => {
      const s = this.indexDb.transaction(b, "readonly").objectStore(b).getAll();
      s.onsuccess = () => e(s.result || []), s.onerror = () => t(s.error);
    });
  }
  async indexPut(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const a = this.indexDb.transaction(b, "readwrite").objectStore(b).put(e);
      a.onsuccess = () => t(), a.onerror = () => i(a.error);
    });
  }
  async indexDelete(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const a = this.indexDb.transaction(b, "readwrite").objectStore(b).delete(e);
      a.onsuccess = () => t(), a.onerror = () => i(a.error);
    });
  }
  async indexClear() {
    this.indexDb || await this.openIndex(), await new Promise((e, t) => {
      const s = this.indexDb.transaction(b, "readwrite").objectStore(b).clear();
      s.onsuccess = () => e(), s.onerror = () => t(s.error);
    });
  }
}
const K = 1e4;
class ge {
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
  // WebAudio Graph for Lo-Fi muffle and Visualizer
  audioContext = null;
  sourceNode = null;
  biquadFilter = null;
  analyserNode = null;
  isMuffled = !1;
  onTrackChange;
  onPlayStateChange;
  onAnalyserReady;
  setUrlResolver(e) {
    this.urlResolver = e;
  }
  isWaitingForUnmute() {
    return this.isWaitingForInteractionUnmute;
  }
  notifyUserInteraction() {
    this.userHasInteracted = !0, this.resumeAudioContext(), this.initWebAudio(), this.isWaitingForInteractionUnmute && (this.isWaitingForInteractionUnmute = !1, this.fadeInVolume(this.volume, 400));
  }
  resumeAudioContext() {
    this.audioContext && this.audioContext.state === "suspended" && this.audioContext.resume().catch(() => {
    });
  }
  initWebAudio() {
    if (!(this.audioContext || !this.audioElement))
      try {
        const e = window.AudioContext || window.webkitAudioContext;
        if (!e) return;
        this.audioContext = new e(), this.audioElement.crossOrigin = "anonymous", this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement), this.biquadFilter = this.audioContext.createBiquadFilter(), this.biquadFilter.type = "lowpass", this.biquadFilter.frequency.value = this.isMuffled ? 800 : 2e4, this.biquadFilter.Q.value = 1, this.analyserNode = this.audioContext.createAnalyser(), this.analyserNode.fftSize = 256, this.sourceNode.connect(this.biquadFilter), this.biquadFilter.connect(this.analyserNode), this.analyserNode.connect(this.audioContext.destination), this.onAnalyserReady && this.onAnalyserReady(this.analyserNode);
      } catch (e) {
        console.warn("[ST-BgLoader AudioEngine] WebAudio graph init note (falling back to direct output):", e);
      }
  }
  getAnalyserNode() {
    return this.analyserNode;
  }
  setMuffled(e) {
    if (this.isMuffled = e, this.biquadFilter && this.audioContext) {
      const t = e ? 800 : 2e4, i = this.audioContext.currentTime;
      this.biquadFilter.frequency.cancelScheduledValues(i), this.biquadFilter.frequency.setTargetAtTime(t, i, 0.08);
    }
  }
  getMuffled() {
    return this.isMuffled;
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
      this.initWebAudio(), this.resumeAudioContext(), await Promise.race([
        this.audioElement.play().catch((i) => {
          console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", i);
        }),
        new Promise((i) => window.setTimeout(i, K))
      ]), this.onTrackChange?.(e);
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
    this.audioElement && (this.audioElement.paused ? (this.initWebAudio(), this.resumeAudioContext(), !this.audioElement.src && this.playlist.length > 0 ? (this.currentIndex === -1 && (this.currentIndex = 0), await this.playCurrentTrack()) : await this.audioElement.play().catch(() => {
    })) : this.audioElement.pause());
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
        this.initWebAudio(), this.resumeAudioContext(), await Promise.race([
          this.audioElement.play().catch((i) => {
            console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", i);
          }),
          new Promise((i) => window.setTimeout(i, K))
        ]);
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
      const r = performance.now() - i, n = Math.min(1, r / t), l = s * n;
      this.audioElement && (this.audioElement.volume = l), this.attachedVideo && (this.attachedVideo.volume = l), n < 1 ? this.fadeTimer = requestAnimationFrame(a) : this.applyVolume();
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
      const a = performance.now() - i, r = Math.min(1, a / e);
      this.audioElement && (this.audioElement.volume = t * (1 - r)), r < 1 ? this.fadeTimer = requestAnimationFrame(s) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
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
    this.clearFade(), this.audioElement && (this.audioElement.pause(), this.audioElement.src = "", this.audioElement = null), this.audioContext && (this.audioContext.close().catch(() => {
    }), this.audioContext = null), this.attachedVideo = null, this.playlist = [];
  }
}
const pe = 15e3;
class X {
  videoElement = null;
  container;
  audioEngine;
  pendingSettle = null;
  constructor(e, t) {
    this.container = e, this.audioEngine = t;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("video");
    return i.className = "st-bg-video-element", i.src = e, i.loop = !0, i.playsInline = !0, i.autoplay = !0, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.transform = "translateZ(0)", i.style.willChange = "transform", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.videoElement = i, this.audioEngine.attachVideo(i), new Promise((s) => {
      let a = !1;
      const r = () => {
        a || (a = !0, window.clearTimeout(n), this.pendingSettle = null, i.removeEventListener("canplay", l), s(i));
      }, n = window.setTimeout(r, pe);
      this.pendingSettle = r;
      const l = async () => {
        try {
          await i.play();
        } catch (d) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", d), i.muted = !0, i.play().catch((c) => console.error("[ST-BgLoader] Video playback error:", c));
        }
        i.style.opacity = "1", r();
      };
      i.addEventListener("canplay", l), i.addEventListener("error", (d) => {
        console.error("[ST-BgLoader] Error loading video:", d), r();
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
    this.videoElement && (this.pendingSettle?.(), this.audioEngine.attachVideo(null), this.videoElement.pause(), this.videoElement.removeAttribute("src"), this.videoElement.load(), this.videoElement.remove(), this.videoElement = null);
  }
}
const me = 8e3;
class Y {
  iframeElement = null;
  container;
  pendingSettle = null;
  constructor(e) {
    this.container = e;
  }
  async render(e, t = !1) {
    this.destroy();
    const i = document.createElement("iframe");
    return i.className = "st-bg-iframe-element", i.setAttribute("sandbox", "allow-scripts allow-same-origin"), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.border = "none", i.style.opacity = "0", i.style.pointerEvents = "auto", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.iframeElement = i, new Promise((s) => {
      let a = !1;
      const r = () => {
        a || (a = !0, window.clearTimeout(n), this.pendingSettle = null, s(i));
      }, n = window.setTimeout(r, me);
      this.pendingSettle = r, i.onload = () => {
        i.style.opacity = "1", r();
      }, t ? i.src = e : i.srcdoc = e;
    });
  }
  postMessage(e) {
    this.iframeElement && this.iframeElement.contentWindow && this.iframeElement.contentWindow.postMessage(e, "*");
  }
  destroy() {
    this.iframeElement && (this.pendingSettle?.(), this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement.remove(), this.iframeElement = null);
  }
}
const fe = 15e3;
class J {
  imageElement = null;
  container;
  pendingSettle = null;
  constructor(e) {
    this.container = e;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("img");
    return i.className = "st-bg-image-element", i.src = e, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.imageElement = i, new Promise((s) => {
      let a = !1;
      const r = () => {
        a || (a = !0, window.clearTimeout(n), this.pendingSettle = null, s(i));
      }, n = window.setTimeout(r, fe);
      this.pendingSettle = r, i.onload = () => {
        i.style.opacity = "1", r();
      }, i.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), r();
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
    this.imageElement && (this.pendingSettle?.(), this.imageElement.remove(), this.imageElement = null);
  }
}
class ye {
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
  transitionType = "fade";
  transitionDurationMs = 400;
  constructor(e) {
    this.audioEngine = e;
  }
  setTransition(e, t = 400) {
    this.transitionType = e, this.transitionDurationMs = Math.max(100, Math.min(2e3, t));
  }
  getContainerElement() {
    return this.containerEl;
  }
  getHostElement() {
    return this.hostEl;
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
    t ? (this.layerA = t.querySelector(".st-bg-layer-a"), this.layerB = t.querySelector(".st-bg-layer-b")) : (t = document.createElement("div"), t.className = "st-bg-media-container", t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.overflow = "hidden", t.style.zIndex = "0", t.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), t.appendChild(this.layerA), t.appendChild(this.layerB), this.hostEl.appendChild(t)), this.containerEl = t, this.videoRendererA = new X(this.layerA, this.audioEngine), this.videoRendererB = new X(this.layerB, this.audioEngine), this.iframeRendererA = new Y(this.layerA), this.iframeRendererB = new Y(this.layerB), this.imageRendererA = new J(this.layerA), this.imageRendererB = new J(this.layerB), this.observer = new MutationObserver(() => this.syncFitting()), this.observer.observe(this.hostEl, { attributes: !0, attributeFilter: ["class"] }), this.syncFitting();
  }
  setupLayerStyle(e) {
    e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%", e.style.opacity = "0", e.style.transition = `all ${this.transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`, e.style.pointerEvents = "none";
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
      const p = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, f = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, y = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      p.destroy(), f.destroy(), y.destroy();
      const m = this.activeLayer === "A" ? this.layerB : this.layerA;
      m && (m.style.opacity = "0", m.style.transform = "none", m.style.filter = "none");
    }
    const i = this.activeLayer === "A" ? "B" : "A", s = i === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, r = i === "B" ? this.videoRendererB : this.videoRendererA, n = i === "B" ? this.iframeRendererB : this.iframeRendererA, l = i === "B" ? this.imageRendererB : this.imageRendererA;
    r.destroy(), n.destroy(), l.destroy();
    const d = this.getFitting();
    switch (e.type) {
      case "video":
        await r.render(t, d);
        break;
      case "html":
      case "svg":
        await n.render(t, !0);
        break;
      case "image":
        await l.render(t, d);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, t);
        break;
    }
    const c = this.transitionDurationMs;
    s.style.transition = `all ${c}ms cubic-bezier(0.4, 0, 0.2, 1)`, a.style.transition = `all ${c}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const g = this.transitionType;
    g === "zoom_fade" ? (s.style.transform = "scale(1.06)", s.style.opacity = "0", s.offsetHeight, s.style.transform = "scale(1)", s.style.opacity = "1", a.style.transform = "scale(0.96)", a.style.opacity = "0") : g === "blur_fade" ? (s.style.filter = "blur(10px)", s.style.opacity = "0", s.offsetHeight, s.style.filter = "blur(0px)", s.style.opacity = "1", a.style.filter = "blur(10px)", a.style.opacity = "0") : g === "slide_left" ? (s.style.transform = "translate3d(100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(-100%, 0, 0)", a.style.opacity = "0") : g === "slide_right" ? (s.style.transform = "translate3d(-100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(100%, 0, 0)", a.style.opacity = "0") : (s.style.transform = "none", s.style.filter = "none", s.style.opacity = "1", a.style.transform = "none", a.style.filter = "none", a.style.opacity = "0"), this.activeLayer = i, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const p = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, f = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, y = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      p.destroy(), f.destroy(), y.destroy(), a.style.transform = "none", a.style.filter = "none";
    }, c + 50);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0", this.layerA.style.transform = "none", this.layerA.style.filter = "none"), this.layerB && (this.layerB.style.opacity = "0", this.layerB.style.transform = "none", this.layerB.style.filter = "none"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
class be {
  container = null;
  settings;
  cacheManager;
  callbacks;
  authority;
  constructor(e, t, i, s) {
    this.settings = e, this.cacheManager = t, this.callbacks = i, this.authority = s ?? null;
  }
  /** Replace the drawer's settings copy with a remotely synced one and re-render the panel. */
  applyRemoteSettings(e) {
    this.settings = e, this.render();
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
                    <b><i class="fa-solid fa-photo-film"></i> ST-BgLoader (Rich Media Backgrounds & FX)</b>
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

                    <!-- Audiovisual Scene Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-earth-americas"></i> Audiovisual Scene Presets (全景视听预设)</h4>
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 60px;">Scene:</label>
                            <select id="st_scene_select">
                                <!-- Populated dynamically -->
                            </select>
                            <button id="st_scene_apply_btn" class="menu_button" title="Apply Scene"><i class="fa-solid fa-play"></i> Apply</button>
                            <button id="st_scene_save_btn" class="menu_button" title="Save current setup as custom scene"><i class="fa-solid fa-floppy-disk"></i></button>
                            <button id="st_scene_del_btn" class="menu_button" title="Delete custom scene"><i class="fa-solid fa-trash"></i></button>
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

                    <!-- Atmospheric Weather & Particles Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud-sun-rain"></i> Atmospheric Weather & Particles</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 80px;">Weather:</label>
                            <select id="st_weather_type">
                                <option value="off" ${this.settings.weather.type === "off" ? "selected" : ""}>Off (关闭天气)</option>
                                <option value="rain" ${this.settings.weather.type === "rain" ? "selected" : ""}>Rain (细雨微涟)</option>
                                <option value="snow" ${this.settings.weather.type === "snow" ? "selected" : ""}>Snow (冬日飘雪)</option>
                                <option value="sakura" ${this.settings.weather.type === "sakura" ? "selected" : ""}>Sakura (落樱缤纷)</option>
                                <option value="cyber_motes" ${this.settings.weather.type === "cyber_motes" ? "selected" : ""}>Cyber Motes (赛博霓虹微粒)</option>
                                <option value="scanlines" ${this.settings.weather.type === "scanlines" ? "selected" : ""}>Scanlines (复古CRT扫描线)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 80px;">Density:</label>
                            <select id="st_weather_density">
                                <option value="low" ${this.settings.weather.density === "low" ? "selected" : ""}>Low (稀疏)</option>
                                <option value="medium" ${this.settings.weather.density === "medium" ? "selected" : ""}>Medium (适中)</option>
                                <option value="high" ${this.settings.weather.density === "high" ? "selected" : ""}>High (密集)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Speed</label>
                            <input type="range" id="st_weather_speed" min="5" max="25" step="1" value="${Math.round(this.settings.weather.speed * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_weather_speed_val">${this.settings.weather.speed}x</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Opacity</label>
                            <input type="range" id="st_weather_opacity" min="10" max="100" step="5" value="${Math.round(this.settings.weather.opacity * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_weather_opacity_val">${Math.round(this.settings.weather.opacity * 100)}%</span>
                        </div>
                    </div>

                    <!-- Audio Visualizer & Motion Reactive Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-chart-simple"></i> Audio Visualizer & Parallax</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Visualizer:</label>
                            <select id="st_visualizer_mode">
                                <option value="off" ${this.settings.visualizer.mode === "off" ? "selected" : ""}>Off (关闭律动)</option>
                                <option value="pulse" ${this.settings.visualizer.mode === "pulse" ? "selected" : ""}>Pulse (低音呼吸律动)</option>
                                <option value="spectrum" ${this.settings.visualizer.mode === "spectrum" ? "selected" : ""}>Spectrum (底部音频频谱)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Sensitivity</label>
                            <input type="range" id="st_visualizer_sens" min="5" max="25" step="1" value="${Math.round(this.settings.visualizer.sensitivity * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_visualizer_sens_val">${this.settings.visualizer.sensitivity}x</span>
                        </div>

                        <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_parallax_enabled" ${this.settings.parallax.enabled ? "checked" : ""} />
                                <span>Enable 2.5D Mouse Gyro Parallax (景深视差)</span>
                            </label>
                        </div>

                        <div class="st-bgloader-slider-row" style="margin-top: 8px;">
                            <label>Depth Intensity</label>
                            <input type="range" id="st_parallax_intensity" min="1" max="10" step="1" value="${Math.round(this.settings.parallax.intensity * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_parallax_intensity_val">${this.settings.parallax.intensity}</span>
                        </div>
                    </div>

                    <!-- Procedural Ambient Sound Generator Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-fire"></i> Ambient Soundscape Generator (环境白噪音)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Soundscape:</label>
                            <select id="st_ambient_type">
                                <option value="off" ${this.settings.ambientSound.type === "off" ? "selected" : ""}>Off (关闭白噪音)</option>
                                <option value="rain" ${this.settings.ambientSound.type === "rain" ? "selected" : ""}>Gentle Rain (淅沥雨声)</option>
                                <option value="fire" ${this.settings.ambientSound.type === "fire" ? "selected" : ""}>Fireplace Crackle (壁炉木炭噼啪)</option>
                                <option value="wind" ${this.settings.ambientSound.type === "wind" ? "selected" : ""}>Howling Wind (空灵夜风)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_ambient_vol" min="0" max="100" step="5" value="${Math.round(this.settings.ambientSound.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_ambient_vol_val">${Math.round(this.settings.ambientSound.volume * 100)}%</span>
                        </div>
                    </div>

                    <!-- Frosted Glass Chat UI Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-eye"></i> Frosted Glass Chat UI (毛玻璃对话框穿透)</h4>
                        
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 8px;">
                            <input type="checkbox" id="st_frosted_enabled" ${this.settings.frostedChat.enabled ? "checked" : ""} />
                            <span>Enable transparent blurred chat bubbles (穿透显示背景)</span>
                        </label>

                        <div class="st-bgloader-slider-row">
                            <label>Blur</label>
                            <input type="range" id="st_frosted_blur" min="0" max="25" step="1" value="${this.settings.frostedChat.blur}" />
                            <span class="st-bgloader-slider-val" id="st_frosted_blur_val">${this.settings.frostedChat.blur}px</span>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Opacity</label>
                            <input type="range" id="st_frosted_opacity" min="20" max="100" step="5" value="${this.settings.frostedChat.opacity}" />
                            <span class="st-bgloader-slider-val" id="st_frosted_opacity_val">${this.settings.frostedChat.opacity}%</span>
                        </div>
                    </div>

                    <!-- Scene Transitions -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Scene Transitions</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label style="font-size: 0.9em; flex: 0 0 90px;">Effect:</label>
                            <select id="st_transition_effect">
                                <option value="fade" ${this.settings.transitionEffect === "fade" ? "selected" : ""}>Fade (平滑淡入淡出)</option>
                                <option value="zoom_fade" ${this.settings.transitionEffect === "zoom_fade" ? "selected" : ""}>Zoom Fade (缩放推进淡入)</option>
                                <option value="blur_fade" ${this.settings.transitionEffect === "blur_fade" ? "selected" : ""}>Blur Fade (虚化柔焦渐变)</option>
                                <option value="slide_left" ${this.settings.transitionEffect === "slide_left" ? "selected" : ""}>Slide Left (向左推移)</option>
                                <option value="slide_right" ${this.settings.transitionEffect === "slide_right" ? "selected" : ""}>Slide Right (向右推移)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-slider-row">
                            <label>Duration</label>
                            <input type="range" id="st_transition_dur" min="200" max="1500" step="50" value="${this.settings.transitionDurationMs}" />
                            <span class="st-bgloader-slider-val" id="st_transition_dur_val">${this.settings.transitionDurationMs}ms</span>
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
                                <input type="checkbox" id="st_audio_muffle" ${this.settings.muffleBGM ? "checked" : ""} />
                                <span>Lo-Fi Acoustic Muffle (隔壁房间低通滤波沉浸感)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? "checked" : ""} />
                                <span>Pause when tab inactive</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="st_shortcuts_enabled" ${this.settings.shortcutsEnabled ? "checked" : ""} />
                                <span>Enable Alt Shortcuts (Alt+B: 背景, Alt+P: 播放, Alt+M: 隔音, Alt+W: 天气, Alt+F: 毛玻璃)</span>
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

                    <!-- Smart Scene Triggers -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-bolt"></i> Smart Scene Triggers</h4>
                        <div class="st-bgloader-trigger-list" id="st_trigger_list">
                            <!-- Populated dynamically -->
                        </div>
                        <button id="st_trigger_add_btn" class="menu_button" style="width: 100%;">
                            <i class="fa-solid fa-plus"></i> Add Scene Trigger Rule
                        </button>
                    </div>

                    <!-- Backup & Cache -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-file-export"></i> Backup & Cache</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>Used: <strong id="st_cache_used">Calculating...</strong> (<span id="st_cache_count">0</span> items)</div>
                            <button id="st_cache_clear_btn" class="menu_button menu_button_danger">Clear Cache</button>
                        </div>
                        <div class="st-bgloader-btn-row">
                            <button id="st_backup_export_btn" class="menu_button"><i class="fa-solid fa-download"></i> Export Settings JSON</button>
                            <button id="st_backup_import_btn" class="menu_button"><i class="fa-solid fa-upload"></i> Import Settings JSON</button>
                            <input type="file" id="st_backup_import_file" style="display: none;" accept=".json" />
                        </div>
                    </div>

                    <!-- Storage & Authority Enhancement -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud"></i> 存储与 Authority 增强</h4>
                        <div id="st_bgloader_cloud_status" style="font-size:0.9em; line-height:1.6;">检测中...</div>
                        <label style="display:flex; align-items:center; gap:8px; font-size:0.9em; margin-top:6px;">
                            <input type="checkbox" id="st_bgloader_agent_tools_cb" />
                            允许 Authority Agent 调度氛围工具（AI 导演模式）
                        </label>
                    </div>

                </div>
            </div>
        `, e.appendChild(i), this.container = i, this.bindEvents(), this.populatePresets(), this.populateScenes(), this.refreshMediaGrid(), this.refreshTriggerList(), this.updateCacheStats(), this.updateCloudPanel();
  }
  /** Reflects the storage model: server source of truth + evictable browser cache + optional Authority. */
  updateCloudPanel() {
    const e = this.container?.querySelector("#st_bgloader_cloud_status"), t = this.container?.querySelector("#st_bgloader_agent_tools_cb");
    if (!e) return;
    const i = '<span style="color:#4fae6b;">● 源端：服务端 backgrounds/ 目录</span><br/>媒体存于酒馆服务端（与原生背景同位置，换浏览器/设备可见）；本浏览器仅保留可清理的缓存。', s = this.authority?.getCapabilities();
    let a;
    s?.available ? a = '<span style="color:#4fae6b;">● Authority 增强已连接</span>：设置/场景跨端同步 ✓ · Agent 氛围工具可用 · CORS 服务端导入 ✓' : a = '<span style="color:#c9a34f;">● 未检测到 Authority</span>：媒体功能不受影响（源端始终在服务端），仅跨端同步与 Agent 工具不可用。', e.innerHTML = `${i}<br/>${a}`, t && (t.checked = !!this.settings.agentToolsEnabled, t.disabled = !s?.available);
  }
  populateScenes() {
    const e = this.container?.querySelector("#st_scene_select");
    e && (e.innerHTML = "", Object.values(M).forEach((t) => {
      const i = document.createElement("option");
      i.value = t.id, i.textContent = t.name, t.id === this.settings.activeSceneId && (i.selected = !0), e.appendChild(i);
    }), Object.entries(this.settings.scenes || {}).forEach(([t, i]) => {
      const s = document.createElement("option");
      s.value = t, s.textContent = `★ ${i.name} (Custom)`, t === this.settings.activeSceneId && (s.selected = !0), e.appendChild(s);
    }));
  }
  populatePresets() {
    const e = this.container?.querySelector("#st_preset_select");
    e && (e.innerHTML = "", Object.values(E).forEach((t) => {
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
      const o = t.style.display === "none";
      t.style.display = o ? "flex" : "none", i && (i.classList.toggle("down", o), i.classList.toggle("up", !o));
    });
    const s = this.container.querySelector("#st_bgloader_dropzone"), a = this.container.querySelector("#st_bgloader_file_input");
    s?.addEventListener("click", () => a?.click()), a?.addEventListener("change", async () => {
      a.files && a.files.length > 0 && (await this.handleFileUpload(a.files[0]), a.value = "");
    }), s?.addEventListener("dragover", (o) => {
      o.preventDefault(), s.classList.add("dragover");
    }), s?.addEventListener("dragleave", () => s.classList.remove("dragover")), s?.addEventListener("drop", async (o) => {
      const u = o;
      u.preventDefault(), s.classList.remove("dragover"), u.dataTransfer?.files && u.dataTransfer.files.length > 0 && await this.handleFileUpload(u.dataTransfer.files[0]);
    });
    const r = this.container.querySelector("#st_bgloader_url_input");
    this.container.querySelector("#st_bgloader_url_btn")?.addEventListener("click", async () => {
      const o = r.value.trim();
      o && (await this.handleUrlImport(o), r.value = "");
    });
    const l = this.container.querySelector("#st_scene_select");
    this.container.querySelector("#st_scene_apply_btn")?.addEventListener("click", () => {
      const o = l?.value;
      o && (this.settings.activeSceneId = o, this.callbacks.onSceneApplied?.(o), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_scene_save_btn")?.addEventListener("click", () => {
      const o = prompt("Enter a name for this custom audiovisual scene:");
      if (o && o.trim()) {
        const u = `scene_${Date.now()}`, w = {
          id: u,
          name: o.trim(),
          mediaId: this.settings.activeMediaId || void 0,
          presetId: this.settings.activePresetId,
          filters: { ...this.settings.filters },
          weather: { ...this.settings.weather },
          visualizer: { ...this.settings.visualizer },
          parallax: { ...this.settings.parallax },
          ambientSound: { ...this.settings.ambientSound },
          frostedChat: this.settings.frostedChat.enabled
        };
        this.settings.scenes[u] = w, this.settings.activeSceneId = u, this.populateScenes(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_scene_del_btn")?.addEventListener("click", () => {
      const o = l?.value;
      if (M[o]) {
        alert("Cannot delete built-in scenes.");
        return;
      }
      this.settings.scenes[o] && confirm(`Delete custom scene "${this.settings.scenes[o].name}"?`) && (delete this.settings.scenes[o], this.settings.activeSceneId = "cyber_rain", this.populateScenes(), this.callbacks.onSettingsChanged(this.settings));
    });
    const d = this.container.querySelector("#st_preset_select");
    d?.addEventListener("change", () => {
      const o = d.value;
      this.settings.activePresetId = o;
      let u = E[o]?.filters;
      !u && this.settings.userPresets[o] && (u = this.settings.userPresets[o]), u && (this.settings.filters = { ...u }, this.updateSliders(u), this.callbacks.onPresetChanged({ id: o, name: o, filters: u }), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_preset_save_btn")?.addEventListener("click", () => {
      const o = prompt("Enter a name for this custom preset:");
      if (o && o.trim()) {
        const u = o.trim();
        this.settings.userPresets[u] = { ...this.settings.filters }, this.settings.activePresetId = u, this.populatePresets(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_preset_del_btn")?.addEventListener("click", () => {
      const o = d.value;
      if (this.settings.userPresets[o]) {
        if (confirm(`Delete custom preset "${o}"?`)) {
          delete this.settings.userPresets[o], this.settings.activePresetId = "default", this.populatePresets();
          const u = E.default.filters;
          this.settings.filters = { ...u }, this.updateSliders(u), this.callbacks.onPresetChanged(E.default), this.callbacks.onSettingsChanged(this.settings);
        }
      } else
        alert("Cannot delete built-in presets.");
    });
    const c = (o, u, w, _) => {
      const V = this.container.querySelector(o), G = this.container.querySelector(u);
      V?.addEventListener("input", () => {
        const H = Number(V.value);
        G && (G.textContent = `${H}${w}`), _(H), this.callbacks.onSettingsChanged(this.settings);
      });
    };
    c("#st_filter_blur", "#st_filter_blur_val", "px", (o) => this.settings.filters.blur = o), c("#st_filter_brightness", "#st_filter_brightness_val", "%", (o) => this.settings.filters.brightness = o), c("#st_filter_opacity", "#st_filter_opacity_val", "%", (o) => this.settings.filters.opacity = o), c("#st_filter_saturate", "#st_filter_saturate_val", "%", (o) => this.settings.filters.saturate = o);
    const g = this.container.querySelector("#st_weather_type");
    g?.addEventListener("change", () => {
      this.settings.weather.type = g.value, this.callbacks.onWeatherChanged?.(this.settings.weather), this.callbacks.onSettingsChanged(this.settings);
    });
    const p = this.container.querySelector("#st_weather_density");
    p?.addEventListener("change", () => {
      this.settings.weather.density = p.value, this.callbacks.onWeatherChanged?.(this.settings.weather), this.callbacks.onSettingsChanged(this.settings);
    }), c("#st_weather_speed", "#st_weather_speed_val", "x", (o) => {
      this.settings.weather.speed = o / 10, this.callbacks.onWeatherChanged?.(this.settings.weather);
    }), c("#st_weather_opacity", "#st_weather_opacity_val", "%", (o) => {
      this.settings.weather.opacity = o / 100, this.callbacks.onWeatherChanged?.(this.settings.weather);
    });
    const f = this.container.querySelector("#st_visualizer_mode");
    f?.addEventListener("change", () => {
      this.settings.visualizer.mode = f.value, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.callbacks.onSettingsChanged(this.settings);
    }), c("#st_visualizer_sens", "#st_visualizer_sens_val", "x", (o) => {
      this.settings.visualizer.sensitivity = o / 10, this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
    });
    const y = this.container.querySelector("#st_parallax_enabled");
    y?.addEventListener("change", () => {
      this.settings.parallax.enabled = y.checked, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.callbacks.onSettingsChanged(this.settings);
    }), c("#st_parallax_intensity", "#st_parallax_intensity_val", "", (o) => {
      this.settings.parallax.intensity = o / 10, this.callbacks.onParallaxChanged?.(this.settings.parallax);
    });
    const m = this.container.querySelector("#st_ambient_type");
    m?.addEventListener("change", () => {
      this.settings.ambientSound.type = m.value, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.callbacks.onSettingsChanged(this.settings);
    }), c("#st_ambient_vol", "#st_ambient_vol_val", "%", (o) => {
      this.settings.ambientSound.volume = o / 100, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
    });
    const O = this.container.querySelector("#st_frosted_enabled");
    O?.addEventListener("change", () => {
      this.settings.frostedChat.enabled = O.checked, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.callbacks.onSettingsChanged(this.settings);
    }), c("#st_frosted_blur", "#st_frosted_blur_val", "px", (o) => {
      this.settings.frostedChat.blur = o, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
    }), c("#st_frosted_opacity", "#st_frosted_opacity_val", "%", (o) => {
      this.settings.frostedChat.opacity = o, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
    });
    const $ = this.container.querySelector("#st_transition_effect");
    $?.addEventListener("change", () => {
      this.settings.transitionEffect = $.value, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.callbacks.onSettingsChanged(this.settings);
    }), c("#st_transition_dur", "#st_transition_dur_val", "ms", (o) => {
      this.settings.transitionDurationMs = o, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
    }), c("#st_audio_volume", "#st_audio_volume_val", "%", (o) => this.settings.volume = o / 100);
    const z = this.container.querySelector("#st_playback_mode");
    z?.addEventListener("change", () => {
      this.settings.playbackMode = z.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.callbacks.onSettingsChanged(this.settings);
    });
    const D = this.container.querySelector("#st_audio_mute");
    D?.addEventListener("change", () => {
      this.settings.muted = D.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const k = this.container.querySelector("#st_audio_muffle");
    k?.addEventListener("change", () => {
      this.settings.muffleBGM = k.checked, this.callbacks.onMuffleChanged?.(k.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const U = this.container.querySelector("#st_audio_blur");
    U?.addEventListener("change", () => {
      this.settings.pauseOnBlur = U.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const q = this.container.querySelector("#st_shortcuts_enabled");
    q?.addEventListener("change", () => {
      this.settings.shortcutsEnabled = q.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const A = this.container.querySelector("#st_bg_interactive");
    A?.addEventListener("change", () => {
      this.settings.interactiveBackground = A.checked, this.callbacks.onInteractiveChanged(A.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const N = this.container.querySelector("#st_bgloader_agent_tools_cb");
    N?.addEventListener("change", () => {
      this.settings.agentToolsEnabled = N.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const I = this.container.querySelector("#st_mini_player_toggle");
    I?.addEventListener("change", () => {
      this.settings.showMiniPlayer = I.checked, this.callbacks.onMiniPlayerToggle(I.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const L = this.container.querySelector("#st_capsule_on_play");
    L?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = L.checked, this.callbacks.onCapsuleOnPlayToggle?.(L.checked), this.callbacks.onSettingsChanged(this.settings);
    }), this.container.querySelector("#st_trigger_add_btn")?.addEventListener("click", () => {
      this.promptAddTriggerRule();
    }), this.container.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      confirm("Are you sure you want to clear all cached media files?") && (await this.cacheManager.clearAll(), await this.refreshMediaGrid(), await this.updateCacheStats());
    }), this.container.querySelector("#st_backup_export_btn")?.addEventListener("click", () => {
      const o = JSON.stringify(this.settings, null, 2), u = new Blob([o], { type: "application/json" }), w = URL.createObjectURL(u), _ = document.createElement("a");
      _.href = w, _.download = `st-bgloader-settings-${Date.now()}.json`, _.click(), URL.revokeObjectURL(w);
    });
    const v = this.container.querySelector("#st_backup_import_file");
    this.container.querySelector("#st_backup_import_btn")?.addEventListener("click", () => {
      v?.click();
    }), v?.addEventListener("change", async () => {
      if (v.files && v.files[0]) {
        try {
          const o = await v.files[0].text(), u = JSON.parse(o);
          u && typeof u == "object" && (this.settings = { ...this.settings, ...u }, this.callbacks.onSettingsChanged(this.settings), this.render(), alert("Settings successfully imported!"));
        } catch (o) {
          alert(`Failed to import settings JSON: ${o}`);
        }
        v.value = "";
      }
    });
  }
  promptAddTriggerRule() {
    const e = prompt("Enter rule name:");
    if (!e) return;
    const t = prompt("Trigger type (character / chat / regex):", "character")?.toLowerCase().trim(), i = t === "chat" || t === "regex" ? t : "character", s = prompt(`Enter ${i} matching pattern (e.g. Character name, Chat ID, or Regex text):`);
    if (!s) return;
    const a = {
      id: `rule_${Date.now()}`,
      name: e,
      enabled: !0,
      type: i,
      pattern: s,
      action: {
        preset: this.settings.activePresetId,
        weather: this.settings.weather.type
      }
    };
    this.settings.triggerRules.push(a), this.callbacks.onSettingsChanged(this.settings), this.refreshTriggerList();
  }
  refreshTriggerList() {
    const e = this.container?.querySelector("#st_trigger_list");
    if (e) {
      if (e.innerHTML = "", this.settings.triggerRules.length === 0) {
        e.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 8px;">No trigger rules configured yet.</div>';
        return;
      }
      this.settings.triggerRules.forEach((t, i) => {
        const s = document.createElement("div");
        s.className = "st-bgloader-trigger-item", s.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" class="st-rule-toggle" ${t.enabled ? "checked" : ""} />
                    <div>
                        <span class="st-bgloader-trigger-badge">${t.type}</span>
                        <strong>${t.name}</strong>: <code>${t.pattern}</code>
                    </div>
                </div>
                <button class="menu_button menu_button_danger st-rule-del" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;
        const a = s.querySelector(".st-rule-toggle");
        a.addEventListener("change", () => {
          t.enabled = a.checked, this.callbacks.onSettingsChanged(this.settings);
        }), s.querySelector(".st-rule-del")?.addEventListener("click", () => {
          this.settings.triggerRules.splice(i, 1), this.callbacks.onSettingsChanged(this.settings), this.refreshTriggerList();
        }), e.appendChild(s);
      });
    }
  }
  updateSliders(e) {
    const t = (i, s, a, r) => {
      const n = this.container?.querySelector(i), l = this.container?.querySelector(s);
      n && (n.value = a.toString()), l && (l.textContent = `${a}${r}`);
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
            `, s.addEventListener("click", (r) => {
        r.target.closest(".st-bgloader-media-delete") || (this.settings.activeMediaId = i.id, this.container?.querySelectorAll(".st-bgloader-media-card").forEach((l) => l.classList.remove("active")), s.classList.add("active"), this.callbacks.onMediaSelected(i), this.callbacks.onSettingsChanged(this.settings));
      }), s.querySelector(".st-bgloader-media-delete")?.addEventListener("click", async (r) => {
        r.stopPropagation(), confirm(`Delete media "${i.name}"?`) && (await this.cacheManager.deleteMedia(i.id), this.settings.activeMediaId === i.id && (this.settings.activeMediaId = null, this.callbacks.onSettingsChanged(this.settings)), this.callbacks.onMediaDeleted(i.id), await this.refreshMediaGrid(), await this.updateCacheStats());
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
    const t = this.detectMediaType(e.name, e.type), i = await this.cacheManager.saveMedia(e, e.name, t, "server");
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
class ve {
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
        const r = document.createElement("span");
        r.className = `st-bg-native-badge ${a}`, r.textContent = a.toUpperCase(), i.appendChild(r), i.addEventListener("click", () => {
          const n = i.dataset.url || `/backgrounds/${s}`;
          this.onNativeMediaSelect(n, a, s);
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
class we {
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
    const a = this.audioEngine.getCurrentTrack(), r = a ? a.name : "No Audio Selected", n = this.audioEngine.isPlaying(), l = this.audioEngine.getPlaybackMode(), d = this.isVisible && (!this.capsuleOnPlayOnly || n);
    s.classList.add(d ? "visible" : "hidden"), s.innerHTML = `
            <div class="st-bg-mini-capsule">
                <button class="st-bg-mini-btn" id="st_mini_prev" title="Previous Track">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button class="st-bg-mini-btn st-bg-mini-play" id="st_mini_play" title="Play/Pause">
                    <i class="fa-solid ${n ? "fa-pause" : "fa-play"}"></i>
                </button>
                <button class="st-bg-mini-btn" id="st_mini_next" title="Next Track">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <div class="st-bg-mini-track" id="st_mini_title" title="${r}">${r}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${l}">
                    <i class="fa-solid ${this.getModeIcon(l)}"></i>
                </button>
            </div>
        `, document.body.appendChild(s), this.container = s, this.bindEvents(), this.audioEngine.onTrackChange = (c) => {
      const g = this.container?.querySelector("#st_mini_title");
      if (g) {
        const p = c ? c.name : "No Audio";
        g.textContent = p, g.setAttribute("title", p);
      }
    }, this.audioEngine.onPlayStateChange = (c) => {
      const g = this.container?.querySelector("#st_mini_play i");
      g && (g.className = `fa-solid ${c ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (c ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
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
class Se {
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
      const a = t?.name || e.split("/").pop()?.split("?")[0] || "remote_background", r = t?.type || this.detectType(e);
      t?.saveToLibrary ? s = await this.ext.getCacheManager().saveMedia(new Blob([]), a, r, "url", e) : s = {
        id: "custom_" + Date.now(),
        name: a,
        type: r,
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
    let s = (await this.ext.getCacheManager().listMedia()).find((r) => r.id === e || r.name === e || r.url === e || r.cacheKey === e);
    if (!s) {
      const r = t?.title || e.split("/").pop()?.split("?")[0] || "BGM";
      s = {
        id: "bgm_" + Date.now(),
        name: r,
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
  togglePlay() {
    this.ext.getAudioEngine().togglePlay();
  }
  nextTrack() {
    this.ext.getAudioEngine().playNext();
  }
  prevTrack() {
    this.ext.getAudioEngine().playPrev();
  }
  setVolume(e) {
    const t = Math.max(0, Math.min(1, e));
    this.ext.getSettings().volume = t, this.ext.getAudioEngine().setVolume(t), this.ext.saveSettings(), this.emit("volume-change", t);
  }
  setMuted(e) {
    this.ext.getSettings().muted = e, this.ext.getAudioEngine().setMuted(e), this.ext.saveSettings(), this.emit("mute-change", e);
  }
  /**
   * Toggle or set Lo-Fi acoustic muffle effect (800Hz lowpass filter)
   */
  setMuffled(e) {
    this.ext.getSettings().muffleBGM = e, this.ext.getAudioEngine().setMuffled(e), this.ext.saveSettings(), this.emit("muffle-change", e);
  }
  getMuffled() {
    return this.ext.getAudioEngine().getMuffled();
  }
  setFilters(e) {
    const t = this.ext.getSettings().filters, i = {
      blur: e.blur !== void 0 ? e.blur : t.blur,
      brightness: e.brightness !== void 0 ? e.brightness : t.brightness,
      opacity: e.opacity !== void 0 ? e.opacity : t.opacity,
      saturate: e.saturate !== void 0 ? e.saturate : t.saturate
    };
    this.ext.getSettings().filters = i, this.ext.getMediaMount().applyFilters(i), this.ext.saveSettings(), this.emit("filters-change", i);
  }
  applyPreset(e) {
    const t = this.ext.getSettings();
    let i = E[e]?.filters;
    !i && t.userPresets[e] && (i = t.userPresets[e]), i ? (t.activePresetId = e, t.filters = { ...i }, this.ext.getMediaMount().applyFilters(i), this.ext.saveSettings(), this.emit("preset-change", e, i)) : console.warn(`[ST-BgLoader PublicAPI] Preset "${e}" not found.`);
  }
  setInteractive(e) {
    this.ext.getSettings().interactiveBackground = e, this.ext.getMediaMount().setInteractive(e), this.ext.saveSettings(), this.emit("interactive-change", e);
  }
  /**
   * Atmospheric weather & particle FX
   */
  setWeather(e, t) {
    let i;
    typeof e == "string" ? i = {
      ...this.ext.getSettings().weather,
      type: e,
      ...t || {}
    } : i = { ...e }, this.ext.getSettings().weather = i, this.ext.getAtmosphereFX().setWeather(i), this.ext.saveSettings(), this.emit("weather-change", i);
  }
  getWeather() {
    return { ...this.ext.getSettings().weather };
  }
  /**
   * Audio visualizer options
   */
  setVisualizer(e) {
    let t;
    typeof e == "string" ? t = {
      ...this.ext.getSettings().visualizer,
      mode: e
    } : t = { ...e }, this.ext.getSettings().visualizer = t, this.ext.getAudioVisualizer().setOptions(t), this.ext.saveSettings(), this.emit("visualizer-change", t);
  }
  getVisualizer() {
    return { ...this.ext.getSettings().visualizer };
  }
  /**
   * 2.5D Parallax controls
   */
  setParallax(e, t) {
    const i = {
      enabled: e,
      intensity: t !== void 0 ? t : this.ext.getSettings().parallax.intensity
    };
    this.ext.getSettings().parallax = i, this.ext.getParallaxController().setOptions(i), this.ext.saveSettings(), this.emit("parallax-change", i);
  }
  /**
   * Transition effect and duration
   */
  setTransition(e, t) {
    this.ext.getSettings().transitionEffect = e, t !== void 0 && (this.ext.getSettings().transitionDurationMs = t), this.ext.getMediaMount().setTransition(e, this.ext.getSettings().transitionDurationMs), this.ext.saveSettings(), this.emit("transition-change", e, this.ext.getSettings().transitionDurationMs);
  }
  /**
   * Trigger rule management
   */
  addTriggerRule(e) {
    this.ext.getTriggerManager().addRule(e), this.ext.getSettings().triggerRules = this.ext.getTriggerManager().getRules(), this.ext.saveSettings(), this.emit("trigger-rules-change", this.ext.getSettings().triggerRules);
  }
  removeTriggerRule(e) {
    this.ext.getTriggerManager().removeRule(e), this.ext.getSettings().triggerRules = this.ext.getTriggerManager().getRules(), this.ext.saveSettings(), this.emit("trigger-rules-change", this.ext.getSettings().triggerRules);
  }
  getTriggerRules() {
    return this.ext.getTriggerManager().getRules();
  }
  /**
   * Ambient sound generator (procedural rain, fire, wind)
   */
  setAmbientSound(e, t) {
    let i;
    typeof e == "string" ? i = {
      type: e,
      volume: t !== void 0 ? t : this.ext.getSettings().ambientSound.volume
    } : i = { ...e }, this.ext.getSettings().ambientSound = i, this.ext.getAmbientSoundGenerator().setSound(i), this.ext.saveSettings(), this.emit("ambient-sound-change", i);
  }
  getAmbientSound() {
    return { ...this.ext.getSettings().ambientSound };
  }
  /**
   * Frosted glass transparent chat bubbles UI
   */
  setFrostedChat(e, t) {
    const i = {
      enabled: e,
      blur: t?.blur !== void 0 ? t.blur : this.ext.getSettings().frostedChat.blur,
      opacity: t?.opacity !== void 0 ? t.opacity : this.ext.getSettings().frostedChat.opacity
    };
    this.ext.getSettings().frostedChat = i, this.ext.getFrostedGlassController().setOptions(i), this.ext.saveSettings(), this.emit("frosted-chat-change", i);
  }
  getFrostedChat() {
    return { ...this.ext.getSettings().frostedChat };
  }
  /**
   * Audiovisual Scene Snapshots
   */
  applyScene(e) {
    const t = this.ext.getSceneManager().applyScene(e);
    return t && (this.ext.getSettings().activeSceneId = e, this.ext.saveSettings(), this.emit("scene-change", e)), t;
  }
  saveCurrentScene(e) {
    const t = this.ext.getSettings(), i = {
      id: `scene_${Date.now()}`,
      name: e,
      mediaId: t.activeMediaId || void 0,
      presetId: t.activePresetId,
      filters: { ...t.filters },
      weather: { ...t.weather },
      visualizer: { ...t.visualizer },
      parallax: { ...t.parallax },
      ambientSound: { ...t.ambientSound },
      frostedChat: t.frostedChat.enabled
    };
    return this.ext.getSceneManager().saveScene(i), this.ext.getSettings().scenes = this.ext.getSceneManager().getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", this.ext.getSceneManager().getAllScenes()), i;
  }
  getScenes() {
    return this.ext.getSceneManager().getAllScenes();
  }
  deleteScene(e) {
    const t = this.ext.getSceneManager().deleteScene(e);
    return t && (this.ext.getSettings().scenes = this.ext.getSceneManager().getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", this.ext.getSceneManager().getAllScenes())), t;
  }
  /**
   * Quick cycle through weather types
   */
  cycleWeather() {
    const e = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"], t = this.ext.getSettings().weather.type, i = (e.indexOf(t) + 1) % e.length, s = e[i];
    return this.setWeather(s), s;
  }
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
      isInteractive: e.interactiveBackground,
      weather: e.weather.type,
      visualizerMode: e.visualizer.mode,
      parallaxEnabled: e.parallax.enabled,
      transitionEffect: e.transitionEffect,
      isMuffled: t.getMuffled()
    };
  }
  async getMediaList() {
    return this.ext.getCacheManager().listMedia();
  }
  async preloadMedia(e, t) {
    const i = Array.isArray(e) ? e : [e], s = [], a = t?.concurrency || 3;
    let r = 0;
    const n = [...i], l = Array.from({ length: Math.min(a, n.length) }, async () => {
      for (; n.length > 0; ) {
        const d = n.shift();
        try {
          const { item: c, isNew: g } = await this.ext.getCacheManager().preloadUrl(d), p = {
            url: d,
            success: !0,
            cached: !g,
            size: c.size || 0
          };
          s.push(p);
        } catch (c) {
          s.push({
            url: d,
            success: !1,
            cached: !1,
            size: 0,
            error: c?.message || String(c)
          });
        }
        r++, t?.onProgress?.(r, i.length, d), this.emit("preload-progress", r, i.length, d);
      }
    });
    return await Promise.all(l), this.emit("preload-complete", s), s;
  }
  // --- Event Bus ---
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
class _e {
  canvas;
  ctx = null;
  parentEl = null;
  animFrameId = null;
  resizeObserver = null;
  currentOptions = {
    type: "off",
    density: "medium",
    speed: 1,
    opacity: 0.75,
    wind: 0.5
  };
  particles = [];
  ripples = [];
  scanlineOffset = 0;
  width = 0;
  height = 0;
  dpr = 1;
  constructor() {
    this.canvas = document.createElement("canvas"), this.canvas.className = "st-bg-atmosphere-canvas", this.canvas.style.position = "absolute", this.canvas.style.top = "0", this.canvas.style.left = "0", this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.pointerEvents = "none", this.canvas.style.zIndex = "2", this.canvas.style.display = "none", this.ctx = this.canvas.getContext("2d");
  }
  mount(e) {
    this.parentEl = e, this.canvas.parentElement || e.appendChild(this.canvas), this.updateDimensions(), window.ResizeObserver && (this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions();
    }), this.resizeObserver.observe(e)), window.addEventListener("resize", this.onWindowResize);
  }
  onWindowResize = () => {
    this.updateDimensions();
  };
  updateDimensions() {
    if (!this.parentEl) return;
    const e = this.parentEl.getBoundingClientRect();
    this.width = e.width || window.innerWidth, this.height = e.height || window.innerHeight, this.dpr = Math.min(window.devicePixelRatio || 1, 2), this.canvas.width = Math.floor(this.width * this.dpr), this.canvas.height = Math.floor(this.height * this.dpr), this.ctx && this.ctx.scale(this.dpr, this.dpr), this.currentOptions.type !== "off" && this.initParticles();
  }
  setWeather(e) {
    this.currentOptions = { ...e }, this.currentOptions.type === "off" ? (this.stop(), this.canvas.style.display = "none", this.particles = [], this.ripples = [], this.ctx && this.ctx.clearRect(0, 0, this.width, this.height)) : (this.canvas.style.display = "block", this.initParticles(), this.start());
  }
  getParticleCount() {
    const e = Math.min(this.width, 1920) / 10;
    switch (this.currentOptions.density) {
      case "low":
        return Math.floor(e * 0.5);
      case "high":
        return Math.floor(e * 2);
      case "medium":
      default:
        return Math.floor(e);
    }
  }
  initParticles() {
    this.particles = [], this.ripples = [];
    const e = this.getParticleCount(), t = this.currentOptions.type;
    for (let i = 0; i < e; i++)
      this.particles.push(this.createParticle(t, !0));
  }
  createParticle(e, t = !1) {
    const i = t ? Math.random() * this.height : -20, s = Math.random() * (this.width + 400) - 200, a = this.currentOptions.speed, r = this.currentOptions.wind;
    switch (e) {
      case "rain":
        return {
          x: s,
          y: i,
          vx: r * 3,
          vy: (12 + Math.random() * 8) * a,
          size: 10 + Math.random() * 15,
          alpha: (0.3 + Math.random() * 0.4) * this.currentOptions.opacity
        };
      case "snow":
        return {
          x: s,
          y: i,
          vx: r * 0.8 + (Math.random() - 0.5) * 0.5,
          vy: (1 + Math.random() * 2) * a,
          size: 2 + Math.random() * 3.5,
          alpha: (0.4 + Math.random() * 0.5) * this.currentOptions.opacity,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "sakura":
        return {
          x: s,
          y: i,
          vx: r * 1.2 + (Math.random() - 0.5) * 0.8,
          vy: (1.2 + Math.random() * 2.2) * a,
          size: 8 + Math.random() * 6,
          alpha: (0.6 + Math.random() * 0.3) * this.currentOptions.opacity,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.04 * a,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "cyber_motes": {
        const n = ["#00f0ff", "#ff007f", "#7928ca", "#00ff88"];
        return {
          x: Math.random() * this.width,
          y: t ? Math.random() * this.height : this.height + 20,
          vx: (Math.random() - 0.5) * 1.5 + r * 0.5,
          vy: -(1.5 + Math.random() * 3) * a,
          size: 2 + Math.random() * 3.5,
          alpha: (0.5 + Math.random() * 0.5) * this.currentOptions.opacity,
          color: n[Math.floor(Math.random() * n.length)],
          life: 0,
          maxLife: 150 + Math.random() * 200
        };
      }
      default:
        return { x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0 };
    }
  }
  start() {
    if (this.animFrameId !== null) return;
    const e = () => {
      this.render(), this.currentOptions.type !== "off" && (this.animFrameId = requestAnimationFrame(e));
    };
    this.animFrameId = requestAnimationFrame(e);
  }
  stop() {
    this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null);
  }
  render() {
    if (!this.ctx || this.width === 0 || this.height === 0) return;
    const e = this.ctx;
    e.clearRect(0, 0, this.width, this.height);
    const t = this.currentOptions.type;
    if (t === "scanlines") {
      this.renderScanlines(e);
      return;
    }
    const i = this.particles.length;
    for (let s = 0; s < i; s++) {
      const a = this.particles[s];
      if (t === "rain")
        e.beginPath(), e.strokeStyle = `rgba(180, 215, 255, ${a.alpha})`, e.lineWidth = 1.2, e.moveTo(a.x, a.y), e.lineTo(a.x + a.vx * 1.2, a.y + a.size), e.stroke(), a.x += a.vx, a.y += a.vy, a.y > this.height - 20 && Math.random() < 0.15 && this.ripples.push({
          x: a.x,
          y: this.height - 5 + Math.random() * 5,
          vx: 0,
          vy: 0,
          size: 1,
          alpha: a.alpha * 0.8
        }), (a.y > this.height || a.x < -100 || a.x > this.width + 100) && (this.particles[s] = this.createParticle(t, !1));
      else if (t === "snow") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.02;
        const r = Math.sin(a.oscillationOffset) * 0.8;
        a.x += a.vx + r, a.y += a.vy, e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = `rgba(255, 255, 255, ${a.alpha})`, e.fill(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(t, !1));
      } else if (t === "sakura") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.03, a.rotation = (a.rotation || 0) + (a.vRotation || 0.02);
        const r = Math.sin(a.oscillationOffset) * 1.5;
        a.x += a.vx + r, a.y += a.vy, e.save(), e.translate(a.x, a.y), e.rotate(a.rotation), e.beginPath(), e.ellipse(0, 0, a.size, a.size * 0.55, 0, 0, Math.PI * 2), e.fillStyle = `rgba(255, 183, 197, ${a.alpha})`, e.fill(), e.restore(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(t, !1));
      } else if (t === "cyber_motes") {
        a.life = (a.life || 0) + 1, a.x += a.vx, a.y += a.vy;
        const r = a.life / (a.maxLife || 200), n = a.alpha * Math.sin(r * Math.PI);
        e.save(), e.shadowBlur = 8, e.shadowColor = a.color || "#00f0ff", e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = a.color || "#00f0ff", e.globalAlpha = Math.max(0, n), e.fill(), e.restore(), (a.y < -20 || a.life && a.life > (a.maxLife || 200)) && (this.particles[s] = this.createParticle(t, !1));
      }
    }
    for (let s = this.ripples.length - 1; s >= 0; s--) {
      const a = this.ripples[s];
      if (a.size += 0.8, a.alpha -= 0.03, a.alpha <= 0 || a.size > 14) {
        this.ripples.splice(s, 1);
        continue;
      }
      e.beginPath(), e.ellipse(a.x, a.y, a.size * 1.5, a.size * 0.6, 0, 0, Math.PI * 2), e.strokeStyle = `rgba(180, 215, 255, ${a.alpha})`, e.lineWidth = 1, e.stroke();
    }
  }
  renderScanlines(e) {
    const i = 0.12 * this.currentOptions.opacity;
    e.fillStyle = `rgba(0, 0, 0, ${i})`;
    for (let a = 0; a < this.height; a += 4)
      e.fillRect(0, a, this.width, 1.5);
    this.scanlineOffset = (this.scanlineOffset + 2 * this.currentOptions.speed) % this.height;
    const s = e.createLinearGradient(0, this.scanlineOffset - 30, 0, this.scanlineOffset + 30);
    s.addColorStop(0, "rgba(255, 255, 255, 0)"), s.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * this.currentOptions.opacity})`), s.addColorStop(1, "rgba(255, 255, 255, 0)"), e.fillStyle = s, e.fillRect(0, this.scanlineOffset - 30, this.width, 60), Math.random() < 0.05 && (e.fillStyle = `rgba(255, 255, 255, ${0.02 * this.currentOptions.opacity})`, e.fillRect(0, 0, this.width, this.height));
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onWindowResize), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.particles = [], this.ripples = [];
  }
}
class Ee {
  canvas;
  ctx = null;
  parentEl = null;
  mediaContainerEl = null;
  analyser = null;
  animFrameId = null;
  dataArray = null;
  currentOptions = {
    mode: "off",
    color: "#4fa3d1",
    sensitivity: 1
  };
  width = 0;
  height = 0;
  dpr = 1;
  constructor() {
    this.canvas = document.createElement("canvas"), this.canvas.className = "st-bg-visualizer-canvas", this.canvas.style.position = "absolute", this.canvas.style.left = "0", this.canvas.style.bottom = "0", this.canvas.style.width = "100%", this.canvas.style.height = "140px", this.canvas.style.pointerEvents = "none", this.canvas.style.zIndex = "3", this.canvas.style.display = "none", this.ctx = this.canvas.getContext("2d");
  }
  mount(e, t) {
    this.parentEl = e, this.mediaContainerEl = t || null, this.canvas.parentElement || e.appendChild(this.canvas), this.updateDimensions(), window.addEventListener("resize", this.onResize);
  }
  onResize = () => {
    this.updateDimensions();
  };
  updateDimensions() {
    this.parentEl && (this.width = this.parentEl.clientWidth || window.innerWidth, this.height = 140, this.dpr = Math.min(window.devicePixelRatio || 1, 2), this.canvas.width = Math.floor(this.width * this.dpr), this.canvas.height = Math.floor(this.height * this.dpr), this.ctx && this.ctx.scale(this.dpr, this.dpr));
  }
  setAnalyser(e) {
    if (this.analyser = e, this.analyser) {
      this.analyser.fftSize = 256;
      const t = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(new ArrayBuffer(t));
    } else
      this.dataArray = null;
  }
  setOptions(e) {
    this.currentOptions = { ...e }, this.currentOptions.mode === "off" ? (this.stop(), this.canvas.style.display = "none", this.ctx && this.ctx.clearRect(0, 0, this.width, this.height)) : (this.currentOptions.mode === "spectrum" ? this.canvas.style.display = "block" : this.canvas.style.display = "none", this.start());
  }
  start() {
    if (this.animFrameId !== null) return;
    const e = () => {
      this.render(), this.currentOptions.mode !== "off" && (this.animFrameId = requestAnimationFrame(e));
    };
    this.animFrameId = requestAnimationFrame(e);
  }
  stop() {
    this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null);
  }
  render() {
    if (!this.analyser || !this.dataArray)
      return;
    this.analyser.getByteFrequencyData(this.dataArray);
    const e = this.currentOptions.mode, t = this.currentOptions.sensitivity;
    if (e === "pulse") {
      let i = 0;
      const s = Math.min(12, this.dataArray.length);
      for (let n = 0; n < s; n++)
        i += this.dataArray[n];
      const a = i / s / 255, r = Math.pow(a, 2) * 0.35 * t;
      if (this.mediaContainerEl) {
        const n = 1 + r * 0.015;
        this.mediaContainerEl.style.transform = `scale(${n})`, this.mediaContainerEl.style.transition = "transform 0.06s ease-out";
      }
    } else if (e === "spectrum") {
      if (!this.ctx) return;
      const i = this.ctx;
      i.clearRect(0, 0, this.width, this.height);
      const s = this.dataArray.length, a = Math.max(3, this.width / s * 1.6);
      let r = 0;
      const n = this.currentOptions.color || "#4fa3d1";
      for (let l = 0; l < s; l++) {
        const d = this.dataArray[l] / 255 * t, c = Math.min(this.height, d * (this.height - 10));
        if (c > 1) {
          const g = i.createLinearGradient(0, this.height, 0, this.height - c);
          g.addColorStop(0, `${n}22`), g.addColorStop(0.7, `${n}aa`), g.addColorStop(1, `${n}ff`), i.fillStyle = g;
          const p = this.height - c;
          i.beginPath();
          const f = Math.min(a / 2, 3);
          i.roundRect(r, p, a - 1.5, c, [f, f, 0, 0]), i.fill();
        }
        if (r += a, r > this.width) break;
      }
    }
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onResize), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.mediaContainerEl && (this.mediaContainerEl.style.transform = "", this.mediaContainerEl.style.transition = "");
  }
}
class xe {
  targetEl = null;
  options = {
    enabled: !1,
    intensity: 0.3
  };
  targetX = 0;
  targetY = 0;
  currentX = 0;
  currentY = 0;
  animFrameId = null;
  isRunning = !1;
  constructor() {
  }
  attach(e) {
    this.targetEl = e, this.options.enabled && this.enable();
  }
  setOptions(e) {
    const t = this.options.enabled;
    this.options = { ...this.options, ...e }, this.options.enabled && !t ? this.enable() : !this.options.enabled && t && this.disable();
  }
  onMouseMove = (e) => {
    if (!this.options.enabled) return;
    const t = window.innerWidth / 2, i = window.innerHeight / 2, s = 30 * this.options.intensity, a = (e.clientX - t) / t, r = (e.clientY - i) / i;
    this.targetX = a * s, this.targetY = r * s, this.isRunning || this.startLoop();
  };
  enable() {
    window.addEventListener("mousemove", this.onMouseMove, { passive: !0 }), this.targetEl && (this.targetEl.style.willChange = "transform"), this.startLoop();
  }
  disable() {
    window.removeEventListener("mousemove", this.onMouseMove), this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null), this.isRunning = !1, this.targetX = 0, this.targetY = 0, this.currentX = 0, this.currentY = 0, this.targetEl && (this.targetEl.style.transform = "", this.targetEl.style.willChange = "");
  }
  startLoop() {
    if (this.isRunning) return;
    this.isRunning = !0;
    const e = () => {
      if (!this.options.enabled) {
        this.isRunning = !1;
        return;
      }
      const t = 0.08;
      if (this.currentX += (this.targetX - this.currentX) * t, this.currentY += (this.targetY - this.currentY) * t, this.targetEl) {
        const s = 1 + 0.05 * this.options.intensity;
        this.targetEl.style.transform = `translate3d(${this.currentX.toFixed(2)}px, ${this.currentY.toFixed(2)}px, 0) scale(${s.toFixed(3)})`;
      }
      Math.abs(this.targetX - this.currentX) + Math.abs(this.targetY - this.currentY) > 0.01 ? this.animFrameId = requestAnimationFrame(e) : (this.isRunning = !1, this.animFrameId = null);
    };
    this.animFrameId = requestAnimationFrame(e);
  }
  destroy() {
    this.disable(), this.targetEl = null;
  }
}
class Me {
  rules = [];
  onTriggerCallback;
  eventSourceUnlisteners = [];
  lastTriggeredId = null;
  lastTriggerTime = 0;
  constructor(e = [], t) {
    this.rules = [...e], this.onTriggerCallback = t;
  }
  setTriggerCallback(e) {
    this.onTriggerCallback = e;
  }
  setRules(e) {
    this.rules = [...e];
  }
  getRules() {
    return this.rules;
  }
  addRule(e) {
    this.rules.push(e);
  }
  removeRule(e) {
    this.rules = this.rules.filter((t) => t.id !== e);
  }
  evaluateCharacter(e) {
    if (!e) return !1;
    for (const t of this.rules)
      if (!(!t.enabled || t.type !== "character") && t.pattern.toLowerCase().trim() === e.toLowerCase().trim())
        return this.fireRule(t), !0;
    return !1;
  }
  evaluateChat(e) {
    if (!e) return !1;
    for (const t of this.rules)
      if (!(!t.enabled || t.type !== "chat") && t.pattern.trim() === e.trim())
        return this.fireRule(t), !0;
    return !1;
  }
  evaluateMessage(e) {
    if (!e) return !1;
    for (const t of this.rules)
      if (!(!t.enabled || t.type !== "regex"))
        try {
          if (new RegExp(t.pattern, "i").test(e))
            return this.fireRule(t), !0;
        } catch (i) {
          console.warn(`[ST-BgLoader TriggerManager] Invalid regex pattern "${t.pattern}":`, i);
        }
    return !1;
  }
  fireRule(e) {
    const t = Date.now();
    this.lastTriggeredId === e.id && t - this.lastTriggerTime < 500 || (this.lastTriggeredId = e.id, this.lastTriggerTime = t, console.log(`[ST-BgLoader TriggerManager] Fired rule: "${e.name}" (${e.type})`), this.onTriggerCallback?.(e.action, e));
  }
  bindSillyTavernEvents(e, t) {
    if (this.unbindEvents(), !e || typeof e.on != "function") return;
    const i = (n) => {
      typeof n == "string" ? this.evaluateMessage(n) : n && typeof n.mes == "string" && this.evaluateMessage(n.mes);
    }, s = (n) => {
      const l = typeof n == "string" ? n : n?.chatId || n?.id;
      l && this.evaluateChat(String(l));
    }, a = (n) => {
      const l = typeof n == "string" ? n : n?.name || n?.avatar;
      l && this.evaluateCharacter(String(l));
    }, r = (n, l) => {
      e.on(n, l), this.eventSourceUnlisteners.push(() => {
        typeof e.removeListener == "function" ? e.removeListener(n, l) : typeof e.off == "function" && e.off(n, l);
      });
    };
    t ? (t.MESSAGE_RECEIVED && r(t.MESSAGE_RECEIVED, i), t.CHARACTER_MESSAGE_RENDERED && r(t.CHARACTER_MESSAGE_RENDERED, i), t.CHAT_CHANGED && r(t.CHAT_CHANGED, s), t.CHARACTER_PAGE_LOADED && r(t.CHARACTER_PAGE_LOADED, a)) : (r("message_received", i), r("character_message_rendered", i), r("chat_changed", s));
  }
  unbindEvents() {
    for (const e of this.eventSourceUnlisteners)
      try {
        e();
      } catch {
      }
    this.eventSourceUnlisteners = [];
  }
  destroy() {
    this.unbindEvents(), this.rules = [], this.onTriggerCallback = void 0;
  }
}
class Ce {
  ctx = null;
  gainNode = null;
  activeSource = null;
  lfoOsc = null;
  isRunning = !1;
  crackleTimer = null;
  currentOptions = {
    type: "off",
    volume: 0.5
  };
  constructor() {
  }
  initContext() {
    if (!this.ctx)
      try {
        const e = window.AudioContext || window.webkitAudioContext;
        if (!e) return null;
        this.ctx = new e(), this.gainNode = this.ctx.createGain(), this.gainNode.gain.value = this.currentOptions.volume, this.gainNode.connect(this.ctx.destination);
      } catch (e) {
        return console.warn("[ST-BgLoader AmbientSound] Failed to init AudioContext:", e), null;
      }
    return this.ctx && this.ctx.state === "suspended" && this.ctx.resume().catch(() => {
    }), this.ctx;
  }
  setSound(e) {
    this.currentOptions = { ...e }, this.gainNode && this.ctx && this.gainNode.gain.setTargetAtTime(
      this.currentOptions.type === "off" ? 0 : this.currentOptions.volume,
      this.ctx.currentTime,
      0.05
    ), this.currentOptions.type === "off" ? this.stop() : this.start(this.currentOptions.type);
  }
  getOptions() {
    return { ...this.currentOptions };
  }
  start(e) {
    this.stop();
    const t = this.initContext();
    !t || !this.gainNode || (this.isRunning = !0, e === "rain" ? this.startRain(t) : e === "fire" ? this.startFire(t) : e === "wind" && this.startWind(t));
  }
  stop() {
    if (this.isRunning = !1, this.crackleTimer !== null && (clearInterval(this.crackleTimer), this.crackleTimer = null), this.lfoOsc) {
      try {
        this.lfoOsc.stop();
      } catch {
      }
      this.lfoOsc.disconnect(), this.lfoOsc = null;
    }
    if (this.activeSource) {
      try {
        this.activeSource.stop?.();
      } catch {
      }
      this.activeSource.disconnect(), this.activeSource = null;
    }
  }
  /**
   * Synthesize Rain: Pink noise filtered with lowpass & bandpass
   */
  startRain(e) {
    const t = 2 * e.sampleRate, i = e.createBuffer(1, t, e.sampleRate), s = i.getChannelData(0);
    let a = 0, r = 0, n = 0, l = 0, d = 0, c = 0, g = 0;
    for (let y = 0; y < t; y++) {
      const m = Math.random() * 2 - 1;
      a = 0.99886 * a + m * 0.0555179, r = 0.99332 * r + m * 0.0750759, n = 0.969 * n + m * 0.153852, l = 0.8665 * l + m * 0.3104856, d = 0.55 * d + m * 0.5329522, c = -0.7616 * c - m * 0.016898, s[y] = (a + r + n + l + d + c + g + m * 0.5362) * 0.11, g = m * 0.115926;
    }
    const p = e.createBufferSource();
    p.buffer = i, p.loop = !0;
    const f = e.createBiquadFilter();
    f.type = "lowpass", f.frequency.value = 1200, p.connect(f), f.connect(this.gainNode), p.start(0), this.activeSource = p;
  }
  /**
   * Synthesize Fire: Low rumble pink noise + stochastic crackle bursts
   */
  startFire(e) {
    this.startRain(e), this.crackleTimer = window.setInterval(() => {
      if (!(!this.isRunning || !this.ctx || !this.gainNode) && Math.random() < 0.35) {
        const t = this.ctx.createOscillator(), i = this.ctx.createGain();
        t.type = "triangle", t.frequency.setValueAtTime(300 + Math.random() * 800, this.ctx.currentTime), i.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime), i.gain.exponentialRampToValueAtTime(1e-3, this.ctx.currentTime + 0.03 + Math.random() * 0.04), t.connect(i), i.connect(this.gainNode), t.start(), t.stop(this.ctx.currentTime + 0.08);
      }
    }, 80);
  }
  /**
   * Synthesize Wind: Lowpass filtered noise modulated by a gentle LFO
   */
  startWind(e) {
    const t = 2 * e.sampleRate, i = e.createBuffer(1, t, e.sampleRate), s = i.getChannelData(0);
    for (let d = 0; d < t; d++)
      s[d] = Math.random() * 2 - 1;
    const a = e.createBufferSource();
    a.buffer = i, a.loop = !0;
    const r = e.createBiquadFilter();
    r.type = "bandpass", r.frequency.value = 400, r.Q.value = 3;
    const n = e.createOscillator();
    n.frequency.value = 0.2;
    const l = e.createGain();
    l.gain.value = 250, n.connect(l), l.connect(r.frequency), a.connect(r), r.connect(this.gainNode), n.start(0), a.start(0), this.lfoOsc = n, this.activeSource = a;
  }
  destroy() {
    this.stop(), this.ctx && (this.ctx.close().catch(() => {
    }), this.ctx = null), this.gainNode = null;
  }
}
class Te {
  styleEl = null;
  options = {
    enabled: !1,
    blur: 10,
    opacity: 75
  };
  constructor() {
    this.initStyleTag();
  }
  initStyleTag() {
    const e = "st-bgloader-frosted-style";
    let t = document.getElementById(e);
    t || (t = document.createElement("style"), t.id = e, document.head.appendChild(t)), this.styleEl = t, this.updateCss();
  }
  setOptions(e) {
    this.options = { ...this.options, ...e }, this.apply();
  }
  getOptions() {
    return { ...this.options };
  }
  updateCss() {
    this.styleEl && (this.styleEl.textContent = `
            .st-bgloader-frosted-active #chat,
            .st-bgloader-frosted-active .mes_text,
            .st-bgloader-frosted-active .mes {
                background: rgba(18, 18, 24, var(--st-frosted-opacity, 0.75)) !important;
                backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                -webkit-backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
                transition: background 0.3s ease, backdrop-filter 0.3s ease !important;
            }
        `);
  }
  apply() {
    const e = document.documentElement;
    e.style.setProperty("--st-frosted-blur", `${this.options.blur}px`), e.style.setProperty("--st-frosted-opacity", `${(this.options.opacity / 100).toFixed(2)}`), this.options.enabled ? document.body.classList.add("st-bgloader-frosted-active") : document.body.classList.remove("st-bgloader-frosted-active");
  }
  destroy() {
    document.body.classList.remove("st-bgloader-frosted-active"), this.styleEl && this.styleEl.parentElement && (this.styleEl.parentElement.removeChild(this.styleEl), this.styleEl = null);
  }
}
class Q {
  userScenes = {};
  onApplySceneCallback;
  constructor(e = {}, t) {
    this.userScenes = { ...e }, this.onApplySceneCallback = t;
  }
  setApplyCallback(e) {
    this.onApplySceneCallback = e;
  }
  setUserScenes(e) {
    this.userScenes = { ...e };
  }
  getAllScenes() {
    return {
      ...M,
      ...this.userScenes
    };
  }
  getUserScenes() {
    return { ...this.userScenes };
  }
  getScene(e) {
    return this.getAllScenes()[e];
  }
  saveScene(e) {
    this.userScenes[e.id] = { ...e, isBuiltin: !1 };
  }
  deleteScene(e) {
    return M[e] ? (console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${e}"`), !1) : this.userScenes[e] ? (delete this.userScenes[e], !0) : !1;
  }
  applyScene(e) {
    const t = this.getScene(e);
    return t ? (console.log(`[ST-BgLoader SceneManager] Applying scene: "${t.name}"`), this.onApplySceneCallback?.(t), !0) : (console.warn(`[ST-BgLoader SceneManager] Scene "${e}" not found.`), !1);
  }
}
class Z {
  isEnabled = !0;
  actions;
  constructor(e = {}) {
    this.actions = e, this.bindEvents();
  }
  setEnabled(e) {
    this.isEnabled = e;
  }
  onKeyDown = (e) => {
    if (this.isEnabled && e.altKey && !e.ctrlKey && !e.metaKey) {
      const t = e.key.toLowerCase();
      t === "b" ? (e.preventDefault(), this.actions.onToggleBackground?.()) : t === "p" ? (e.preventDefault(), this.actions.onTogglePlay?.()) : t === "m" ? (e.preventDefault(), this.actions.onToggleMuffle?.()) : t === "w" ? (e.preventDefault(), this.actions.onCycleWeather?.()) : t === "f" && (e.preventDefault(), this.actions.onToggleFrostedChat?.());
    }
  };
  bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
  }
  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
  }
}
const ee = "settings:rev", te = "settings:data", ke = 2e3, Ae = 1e4;
class Ie {
  constructor(e, t) {
    this.client = e, this.onRemoteSettings = t;
  }
  pushTimer = null;
  pollTimer = null;
  localRevision = 0;
  lastPushedFingerprint = "";
  applyingRemote = !1;
  running = !1;
  async start() {
    if (!this.running) {
      this.running = !0;
      try {
        const e = await this.readPayload();
        if (e) {
          this.localRevision = e.revision, this.lastPushedFingerprint = e.fingerprint, this.applyingRemote = !0;
          try {
            this.onRemoteSettings(e.settings);
          } finally {
            this.applyingRemote = !1;
          }
          console.log("[ST-BgLoader] Settings restored from cloud mirror, revision", e.revision);
        }
      } catch (e) {
        console.warn("[ST-BgLoader] Failed to read cloud settings mirror:", e);
      }
      this.pollTimer = window.setInterval(() => void this.pollOnce(), Ae);
    }
  }
  stop() {
    this.pollTimer !== null && window.clearInterval(this.pollTimer), this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pollTimer = null, this.pushTimer = null, this.running = !1;
  }
  schedulePush(e) {
    !this.running || this.applyingRemote || (this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pushTimer = window.setTimeout(() => {
      this.pushTimer = null, this.push(e);
    }, ke));
  }
  async push(e) {
    try {
      const t = JSON.stringify(e), i = await Le(t);
      if (i === this.lastPushedFingerprint) return;
      const s = this.localRevision + 1, a = {
        revision: s,
        fingerprint: i,
        updatedAt: Date.now(),
        settings: e
      };
      await this.client.storage.kv.set(te, a), await this.client.storage.kv.set(ee, s), this.localRevision = s, this.lastPushedFingerprint = i;
    } catch (t) {
      console.warn("[ST-BgLoader] Failed to push settings to cloud mirror:", t);
    }
  }
  async pollOnce() {
    if (!this.applyingRemote)
      try {
        const e = await this.client.storage.kv.get(ee);
        if ((typeof e == "number" ? e : 0) <= this.localRevision) return;
        const i = await this.readPayload();
        if (!i || i.revision <= this.localRevision) return;
        if (i.fingerprint === this.lastPushedFingerprint) {
          this.localRevision = i.revision;
          return;
        }
        this.applyingRemote = !0;
        try {
          this.onRemoteSettings(i.settings);
        } finally {
          this.applyingRemote = !1;
        }
        this.localRevision = i.revision, this.lastPushedFingerprint = i.fingerprint, console.log("[ST-BgLoader] Applied cloud settings change, revision", i.revision);
      } catch (e) {
        console.warn("[ST-BgLoader] Settings sync poll failed:", e);
      }
  }
  async readPayload() {
    const e = await this.client.storage.kv.get(te);
    if (!e || typeof e != "object") return null;
    const t = e;
    return typeof t.revision != "number" || !t.settings || typeof t.fingerprint != "string" ? null : t;
  }
}
async function Le(h) {
  try {
    if (crypto?.subtle) {
      const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(h));
      return Array.from(new Uint8Array(t)).map((i) => i.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  let e = 5381;
  for (let t = 0; t < h.length; t++)
    e = (e << 5) + e + h.charCodeAt(t) | 0;
  return "djb2:" + (e >>> 0).toString(16);
}
const ie = 3e4, Pe = 2e3, Re = [
  {
    id: "stbg_set_background",
    title: "设置背景媒体",
    description: "Switch the chat background to a media library id, scene asset, or remote URL.",
    inputSchema: {
      type: "object",
      properties: { target: { type: "string", description: "Media id, name, or URL" } },
      required: ["target"]
    }
  },
  {
    id: "stbg_apply_scene",
    title: "应用氛围场景",
    description: "Apply a saved audiovisual scene snapshot (background, BGM, weather, filters).",
    inputSchema: {
      type: "object",
      properties: { sceneId: { type: "string" } },
      required: ["sceneId"]
    }
  },
  {
    id: "stbg_set_weather",
    title: "设置天气粒子",
    description: "Set the atmospheric weather FX (rain, snow, sakura, cyber_motes, scanlines, off).",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"] },
        density: { type: "string", enum: ["low", "medium", "high"] }
      },
      required: ["type"]
    }
  },
  {
    id: "stbg_play_bgm",
    title: "播放背景音乐",
    description: "Play a BGM track from a media library id or URL.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"]
    }
  },
  {
    id: "stbg_apply_preset",
    title: "应用滤镜预设",
    description: "Apply a visual filter preset id (default, cinema_dark, cyberpunk, ...).",
    inputSchema: {
      type: "object",
      properties: { presetId: { type: "string" } },
      required: ["presetId"]
    }
  },
  {
    id: "stbg_set_filters",
    title: "设置视觉滤镜",
    description: "Set visual filter values directly (blur px, brightness %, opacity %, saturate %).",
    inputSchema: {
      type: "object",
      properties: {
        blur: { type: "number" },
        brightness: { type: "number" },
        opacity: { type: "number" },
        saturate: { type: "number" }
      }
    }
  }
];
class Be {
  constructor(e, t) {
    this.client = e, this.host = t;
  }
  timer = null;
  registerTimer = null;
  running = !1;
  pendingSubmit = null;
  claimSeq = 0;
  start() {
    this.running || (this.running = !0, this.register(), this.claimLoop(), this.registerTimer = window.setInterval(() => void this.register(), ie));
  }
  stop() {
    this.running = !1, this.timer !== null && window.clearTimeout(this.timer), this.registerTimer !== null && window.clearInterval(this.registerTimer), this.timer = null, this.registerTimer = null;
  }
  agentApi() {
    return this.client.agent?.browser ?? null;
  }
  async register() {
    if (this.running)
      try {
        const e = this.agentApi();
        if (!e) return;
        await e.registerTools({
          browserInstanceId: "st-bgloader-main",
          leaseDurationMs: ie * 2,
          tools: Re.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            inputSchema: t.inputSchema,
            riskLevel: "low",
            approvalPolicy: "never",
            mutatesWorkspace: !1
          }))
        }), console.log("[ST-BgLoader] Agent ambient tools registered.");
      } catch (e) {
        console.warn("[ST-BgLoader] Agent tool registration failed (will retry):", e);
      }
  }
  claimLoop() {
    this.running && (this.timer = window.setTimeout(() => {
      this.claimOnce().finally(() => this.claimLoop());
    }, Pe));
  }
  async claimOnce() {
    const e = this.agentApi();
    if (!(!e || !this.running))
      try {
        this.pendingSubmit && (await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, "completed", void 0), this.pendingSubmit = null);
        const t = `stbg-claim-${Date.now()}-${this.claimSeq++}`, s = (await e.claim({ browserInstanceId: "st-bgloader-main", claimId: t })).invocation;
        if (!s) return;
        let a, r;
        try {
          a = await this.execute(s.toolId, s.arguments);
        } catch (n) {
          r = n instanceof Error ? n.message : String(n);
        }
        if (r) {
          await e.submitResult({
            runId: s.runId,
            callId: s.callId,
            claimId: t,
            browserInstanceId: "st-bgloader-main",
            status: "failed",
            error: r
          });
          return;
        }
        try {
          await e.submitResult({
            runId: s.runId,
            callId: s.callId,
            claimId: t,
            browserInstanceId: "st-bgloader-main",
            status: "completed",
            result: a
          });
        } catch {
          this.pendingSubmit = { claimId: t, invocation: { runId: s.runId, callId: s.callId } };
        }
      } catch {
      }
  }
  async reportResult(e, t, i, s) {
    const a = this.agentApi();
    a && await a.submitResult({
      runId: t.runId,
      callId: t.callId,
      claimId: e,
      browserInstanceId: "st-bgloader-main",
      status: i,
      error: s
    });
  }
  async execute(e, t) {
    const i = t ?? {};
    switch (e) {
      case "stbg_set_background":
        return await this.host.setBackground(String(i.target ?? "")), { ok: !0 };
      case "stbg_apply_scene":
        return { ok: this.host.applyScene(String(i.sceneId ?? "")) };
      case "stbg_set_weather":
        return this.host.setWeather(String(i.type ?? "off"), i.density ? String(i.density) : void 0), { ok: !0 };
      case "stbg_play_bgm":
        return await this.host.playBGM(String(i.url ?? "")), { ok: !0 };
      case "stbg_apply_preset":
        return this.host.applyPreset(String(i.presetId ?? "default")), { ok: !0 };
      case "stbg_set_filters":
        return this.host.setFilters({
          blur: typeof i.blur == "number" ? i.blur : void 0,
          brightness: typeof i.brightness == "number" ? i.brightness : void 0,
          opacity: typeof i.opacity == "number" ? i.opacity : void 0,
          saturate: typeof i.saturate == "number" ? i.saturate : void 0
        }), { ok: !0 };
      default:
        throw new Error(`Unknown tool: ${e}`);
    }
  }
}
const B = "st_bgloader_settings";
class Fe {
  isInitialized = !1;
  settings = { ...P };
  cacheManager;
  audioEngine;
  mediaMount;
  settingsDrawer = null;
  nativeAugmenter = null;
  miniPlayer = null;
  atmosphereFX;
  audioVisualizer;
  parallaxController;
  triggerManager;
  ambientSoundGenerator;
  frostedGlassController;
  sceneManager;
  shortcutManager;
  authorityBridge = new C();
  settingsSync = null;
  agentBridge = null;
  publicApi;
  constructor() {
    this.cacheManager = new ue(), this.audioEngine = new ge(), this.mediaMount = new ye(this.audioEngine), this.atmosphereFX = new _e(), this.audioVisualizer = new Ee(), this.parallaxController = new xe(), this.triggerManager = new Me(), this.ambientSoundGenerator = new Ce(), this.frostedGlassController = new Te(), this.sceneManager = new Q(), this.shortcutManager = new Z(), this.publicApi = new Se(this);
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
  getAtmosphereFX() {
    return this.atmosphereFX;
  }
  getAudioVisualizer() {
    return this.audioVisualizer;
  }
  getParallaxController() {
    return this.parallaxController;
  }
  getTriggerManager() {
    return this.triggerManager;
  }
  getAmbientSoundGenerator() {
    return this.ambientSoundGenerator;
  }
  getFrostedGlassController() {
    return this.frostedGlassController;
  }
  getSceneManager() {
    return this.sceneManager;
  }
  getShortcutManager() {
    return this.shortcutManager;
  }
  getAuthorityBridge() {
    return this.authorityBridge;
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
    console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), this.loadSettings(), await this.cacheManager.init(this.authorityBridge), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs);
    const e = this.mediaMount.getHostElement() || document.querySelector("#bg1"), t = this.mediaMount.getContainerElement();
    e && (this.atmosphereFX.mount(e), this.audioVisualizer.mount(e, t || void 0)), t && this.parallaxController.attach(t), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.audioEngine.setUrlResolver((n) => this.cacheManager.getMediaBlobUrl(n)), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.audioEngine.onAnalyserReady = (n) => {
      this.audioVisualizer.setAnalyser(n);
    };
    const s = (await this.cacheManager.listMedia()).filter((n) => n.type === "audio");
    this.audioEngine.setPlaylist(s), this.miniPlayer = new we(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly);
    const a = this.audioEngine.onTrackChange;
    this.audioEngine.onTrackChange = (n) => {
      a?.(n), this.publicApi.emit("track-change", n);
    };
    const r = this.audioEngine.onPlayStateChange;
    if (this.audioEngine.onPlayStateChange = (n) => {
      r?.(n), this.publicApi.emit("play-state-change", n);
    }, this.triggerManager.setRules(this.settings.triggerRules || []), this.triggerManager.setTriggerCallback(async (n, l) => {
      console.log(`[ST-BgLoader] Executing trigger rule: "${l.name}"`), n.mediaIdOrUrl && await this.publicApi.setBackground(n.mediaIdOrUrl), n.bgmUrl && await this.publicApi.playBGM(n.bgmUrl), n.weather && this.publicApi.setWeather(n.weather), n.preset && this.publicApi.applyPreset(n.preset), n.filters && this.publicApi.setFilters(n.filters);
    }), this.sceneManager = new Q(this.settings.scenes || {}, async (n) => {
      if (n.mediaId) {
        const l = await this.cacheManager.getMedia(n.mediaId);
        l && await this.applyMedia(l);
      } else n.mediaUrl && await this.publicApi.setBackground(n.mediaUrl);
      n.bgmUrl && await this.publicApi.playBGM(n.bgmUrl), n.presetId && this.publicApi.applyPreset(n.presetId), n.filters && this.publicApi.setFilters(n.filters), n.weather && this.publicApi.setWeather(n.weather), n.visualizer && this.publicApi.setVisualizer(n.visualizer), n.parallax && this.publicApi.setParallax(n.parallax.enabled, n.parallax.intensity), n.ambientSound && this.publicApi.setAmbientSound(n.ambientSound), typeof n.frostedChat == "boolean" && this.publicApi.setFrostedChat(n.frostedChat);
    }), this.shortcutManager = new Z({
      onToggleBackground: () => {
        const n = this.mediaMount.getContainerElement();
        n && (n.style.display = n.style.display === "none" ? "block" : "none");
      },
      onTogglePlay: () => {
        this.audioEngine.togglePlay();
      },
      onToggleMuffle: () => {
        const n = this.audioEngine.getMuffled();
        this.publicApi.setMuffled(!n);
      },
      onCycleWeather: () => {
        this.publicApi.cycleWeather();
      },
      onToggleFrostedChat: () => {
        const n = this.settings.frostedChat.enabled;
        this.publicApi.setFrostedChat(!n);
      }
    }), this.shortcutManager.setEnabled(this.settings.shortcutsEnabled), this.settingsDrawer = new be(this.settings, this.cacheManager, {
      onSettingsChanged: (n) => {
        this.settings = n, this.saveSettings(), this.applySettingsToSubsystems();
      },
      onPresetChanged: (n) => {
        this.mediaMount.applyFilters(n.filters), this.publicApi.emit("preset-change", n.id, n.filters);
      },
      onInteractiveChanged: (n) => {
        this.mediaMount.setInteractive(n), this.publicApi.emit("interactive-change", n);
      },
      onMiniPlayerToggle: (n) => {
        this.miniPlayer?.setVisible(n);
      },
      onCapsuleOnPlayToggle: (n) => {
        this.miniPlayer?.setCapsuleOnPlayOnly(n);
      },
      onPlaybackModeChanged: (n) => {
        this.audioEngine.setPlaybackMode(n);
      },
      onWeatherChanged: (n) => {
        this.atmosphereFX.setWeather(n), this.publicApi.emit("weather-change", n);
      },
      onVisualizerChanged: (n) => {
        this.audioVisualizer.setOptions(n), this.publicApi.emit("visualizer-change", n);
      },
      onParallaxChanged: (n) => {
        this.parallaxController.setOptions(n), this.publicApi.emit("parallax-change", n);
      },
      onTransitionChanged: (n, l) => {
        this.mediaMount.setTransition(n, l), this.publicApi.emit("transition-change", n, l);
      },
      onMuffleChanged: (n) => {
        this.audioEngine.setMuffled(n), this.publicApi.emit("muffle-change", n);
      },
      onMediaSelected: async (n) => {
        await this.applyMedia(n);
      },
      onMediaDeleted: async (n) => {
        this.settings.activeMediaId === n && (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings());
        const l = await this.cacheManager.listMedia();
        this.audioEngine.setPlaylist(l.filter((d) => d.type === "audio"));
      },
      onMediaUploaded: async (n) => {
        if (this.settings.lruAutoClean) {
          const l = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(l);
        }
        if (n.type === "audio") {
          const l = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(l.filter((d) => d.type === "audio"));
        }
        await this.applyMedia(n);
      }
    }, this.authorityBridge), this.settingsDrawer.render(), this.nativeAugmenter = new ve(async (n, l, d) => {
      const c = {
        id: "native_" + d,
        name: d,
        type: l,
        source: "server",
        url: n,
        cacheKey: n,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
      await this.applyMedia(c);
    }), this.nativeAugmenter.start(), document.addEventListener("visibilitychange", () => {
      this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
    }), await this.startSettingsSync(), this.syncAgentTools(), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const n = await this.cacheManager.getMedia(this.settings.activeMediaId);
      n && await this.applyMedia(n);
    }
    this.isInitialized = !0, console.log("[ST-BgLoader] All Modular Subsystems fully initialized.");
  }
  async applyMedia(e) {
    this.settings.activeMediaId = e.id, this.saveSettings();
    const t = await this.cacheManager.getMediaBlobUrl(e);
    await this.mediaMount.mountMedia(e, t), this.settingsDrawer && (this.settingsDrawer.refreshMediaGrid(), this.settingsDrawer.updateCacheStats());
  }
  applySettingsToSubsystems() {
    this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.shortcutManager.setEnabled(this.settings.shortcutsEnabled), this.triggerManager.setRules(this.settings.triggerRules || []), this.sceneManager.setUserScenes(this.settings.scenes || {}), this.syncAgentTools();
  }
  /** Opt-in Agent Runtime ambient tools (AI director mode); requires the cloud backend. */
  syncAgentTools() {
    const e = this.authorityBridge.getCapabilities(), t = this.authorityBridge.getClient(), i = e.agentTools && this.settings.agentToolsEnabled && !!t;
    i && !this.agentBridge && t ? (this.agentBridge = new Be(t, this.buildAgentHost()), this.agentBridge.start(), console.log("[ST-BgLoader] Agent ambient tools enabled.")) : !i && this.agentBridge && (this.agentBridge.stop(), this.agentBridge = null, console.log("[ST-BgLoader] Agent ambient tools disabled."));
  }
  buildAgentHost() {
    return {
      setBackground: (e) => this.publicApi.setBackground(e),
      playBGM: (e) => this.publicApi.playBGM(e),
      setWeather: (e, t) => {
        this.publicApi.setWeather(
          e,
          t ? { density: t } : void 0
        );
      },
      applyPreset: (e) => this.publicApi.applyPreset(e),
      setFilters: (e) => this.publicApi.setFilters(e),
      applyScene: (e) => this.publicApi.applyScene(e)
    };
  }
  async startSettingsSync() {
    const e = this.authorityBridge.getClient();
    e && (this.settingsSync = new Ie(e, (t) => {
      this.settings = t;
      try {
        localStorage.setItem(B, JSON.stringify(this.settings));
      } catch {
      }
      this.applySettingsToSubsystems(), this.settingsDrawer?.applyRemoteSettings(this.settings), this.publicApi.emit("settings-sync", this.settings);
    }), await this.settingsSync.start());
  }
  hookSillyTavernEvents() {
    const e = window;
    e.eventSource && (this.triggerManager.bindSillyTavernEvents(e.eventSource, e.event_types), e.event_types && e.event_types.CHAT_CHANGED && e.eventSource.on(e.event_types.CHAT_CHANGED, async () => {
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
    }));
  }
  loadSettings() {
    try {
      const e = localStorage.getItem(B);
      e && (this.settings = { ...P, ...JSON.parse(e) });
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...P };
    }
  }
  saveSettings() {
    try {
      localStorage.setItem(B, JSON.stringify(this.settings));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
    this.settingsSync?.schedulePush(this.settings);
  }
}
const T = new Fe();
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => T.init()) : T.init();
window.STBgLoader = T;
window.stBgLoader = T.getAPI();
export {
  Fe as STBgLoaderExtension
};
