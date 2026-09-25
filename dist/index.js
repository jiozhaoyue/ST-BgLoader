const C = {
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
}, I = {
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
}, k = {
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
};
function M(l, e = "") {
  const t = l.split(".").pop()?.toLowerCase().split("?")[0] || "";
  return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) || e.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) || e.startsWith("audio/") ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
}
const Q = "st-bg-loader-manifest.json", A = 1;
function v(l) {
  return `backgrounds/${encodeURIComponent(l)}`;
}
function E() {
  try {
    const e = window.SillyTavern?.getContext?.().getRequestHeaders?.({ omitContentType: !0 });
    return e ? { ...e } : {};
  } catch {
    return {};
  }
}
async function ue(l) {
  try {
    const e = await fetch(`${v(l)}?t=${Date.now()}`, { cache: "no-store" });
    return e.ok ? JSON.parse(await e.text()) : null;
  } catch (e) {
    return console.warn(`[ST-BgLoader] Server document "${l}" is missing or unreadable:`, e), null;
  }
}
async function ge(l, e) {
  const t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), i = new FormData();
  i.append("avatar", new File([t], l, { type: "application/json" }));
  const n = await fetch("/api/backgrounds/upload", { method: "POST", headers: E(), body: i });
  if (!n.ok)
    throw new Error(`Server upload failed for "${l}": HTTP ${n.status}`);
}
const pe = 6e4;
class me {
  manifest = { version: A, items: [] };
  async init() {
    try {
      const e = await fetch(`${v(Q)}?t=${Date.now()}`, { cache: "no-store" });
      if (e.ok) {
        const t = JSON.parse(await e.text());
        t && Array.isArray(t.items) && (this.manifest = { version: A, items: t.items });
      }
    } catch (e) {
      console.warn("[ST-BgLoader] No server media manifest yet, starting a fresh one:", e), this.manifest = { version: A, items: [] };
    }
    console.log(`[ST-BgLoader] Server media library ready: ${this.manifest.items.length} cataloged entries.`);
  }
  async listCatalog() {
    const e = /* @__PURE__ */ new Map();
    try {
      const t = await fetch("/api/backgrounds/all", {
        method: "POST",
        headers: { ...E(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok) {
        const i = await t.json();
        for (const n of i.images ?? []) {
          const s = M(n.filename);
          e.set(n.filename, {
            id: "native_" + n.filename,
            name: n.filename,
            type: s,
            source: "server",
            url: v(n.filename),
            cacheKey: v(n.filename),
            size: 0,
            mimeType: z(n.filename, s),
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
    const t = this.manifest.items.find((n) => n.id === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((n) => n.id === e) ?? null;
  }
  async putMedia(e) {
    const t = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), i = e.blob.type || z(e.name, e.type);
    if (e.source === "url" && e.blob.size === 0 && e.remoteUrl) {
      const a = {
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
      return this.manifest.items.push(a), await this.saveManifest(), {
        id: t,
        name: e.name,
        type: e.type,
        source: "url",
        url: e.remoteUrl,
        cacheKey: t,
        size: 0,
        mimeType: i,
        addedTimestamp: a.addedTimestamp,
        lastUsedTimestamp: a.lastUsedTimestamp,
        hasAudio: a.hasAudio
      };
    }
    const n = await this.uploadFile(e.name, e.blob, i), s = {
      id: t,
      filename: n,
      type: e.type,
      source: e.source,
      remoteUrl: e.remoteUrl ?? null,
      size: e.blob.size,
      mimeType: i,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: e.type === "video" || e.type === "audio"
    };
    return this.manifest.items = this.manifest.items.filter((a) => a.filename !== n), this.manifest.items.push(s), await this.saveManifest(), this.manifestToItem(s);
  }
  async deleteMedia(e) {
    let i = this.manifest.items.find((s) => s.id === e)?.filename ?? null;
    if (!i) {
      const s = await this.getCatalogItem(e);
      s?.url?.startsWith("backgrounds/") && (i = decodeURIComponent(s.url.slice(12)));
    }
    if (!i) {
      this.manifest.items = this.manifest.items.filter((s) => s.id !== e), await this.saveManifest();
      return;
    }
    const n = await fetch("/api/backgrounds/delete", {
      method: "POST",
      headers: { ...E(), "Content-Type": "application/json" },
      body: JSON.stringify({ bg: i })
    });
    if (!n.ok)
      throw new Error(`Server delete failed for "${i}": HTTP ${n.status}`);
    this.manifest.items = this.manifest.items.filter((s) => s.id !== e && s.filename !== i), await this.saveManifest();
  }
  async readMedia(e) {
    if (!e.url) return null;
    const t = await fetch(e.url, { cache: "no-store" });
    return t.ok ? t.blob() : null;
  }
  async touchMedia(e, t) {
  }
  async findByUrl(e) {
    const t = this.manifest.items.find((n) => n.remoteUrl === e || v(n.filename ?? "") === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((n) => n.url === e || n.cacheKey === e) ?? null;
  }
  /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
  async download(e) {
    let t = null;
    try {
      t = new URL(e, window.location.href);
    } catch {
    }
    const i = !!t && t.origin !== window.location.origin, n = await fetch(e, i ? { signal: AbortSignal.timeout(pe) } : void 0);
    if (!n.ok)
      throw new Error(`Failed to fetch media from ${e}: ${n.status} ${n.statusText}`);
    return n.blob();
  }
  async uploadFile(e, t, i) {
    let n = fe(e || "media");
    if (await this.filenameExists(n)) {
      const r = n.lastIndexOf("."), c = r > 0 ? n.slice(0, r) : n, h = r > 0 ? n.slice(r) : "";
      n = `${c}_${Date.now()}${h}`;
    }
    const s = new FormData();
    s.append("avatar", new File([t], n, { type: i }));
    const a = await fetch("/api/backgrounds/upload", { method: "POST", headers: E(), body: s });
    if (!a.ok)
      throw new Error(`Server upload failed: HTTP ${a.status}`);
    return (await a.text()).trim() || n;
  }
  async filenameExists(e) {
    if (this.manifest.items.some((t) => t.filename === e)) return !0;
    try {
      const t = await fetch("/api/backgrounds/all", {
        method: "POST",
        headers: { ...E(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok)
        return ((await t.json()).images ?? []).some((n) => n.filename === e);
    } catch {
    }
    return !1;
  }
  async saveManifest() {
    this.manifest.version = A;
    const e = new Blob([JSON.stringify(this.manifest, null, 2)], { type: "application/json" });
    try {
      const t = new FormData();
      t.append("avatar", new File([e], Q, { type: "application/json" }));
      const i = await fetch("/api/backgrounds/upload", { method: "POST", headers: E(), body: t });
      if (!i.ok)
        throw new Error(`HTTP ${i.status}`);
    } catch (t) {
      throw console.error("[ST-BgLoader] Failed to save server media manifest:", t), t;
    }
  }
  manifestToItem(e) {
    const t = e.source === "url" && e.remoteUrl ? e.remoteUrl : e.filename ? v(e.filename) : e.remoteUrl ?? "";
    return {
      id: e.id,
      name: e.filename || e.remoteUrl || e.id,
      type: e.type,
      source: e.source === "url" ? "url" : "server",
      url: t,
      cacheKey: e.filename ? v(e.filename) : e.id,
      size: e.size,
      mimeType: e.mimeType,
      addedTimestamp: e.addedTimestamp,
      lastUsedTimestamp: e.lastUsedTimestamp,
      hasAudio: e.hasAudio
    };
  }
}
function z(l, e) {
  switch (l.split(".").pop()?.toLowerCase()) {
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
function fe(l) {
  return (l || "media").replace(/[^\p{L}\p{N}._ -]/gu, "_");
}
const x = "st-bgloader-main";
function de(l) {
  if (l && typeof l == "object" && l.name === "AuthorityPermissionError") return !0;
  const e = l instanceof Error ? l.message : String(l);
  return /permission|denied|forbidden|封锁/i.test(e);
}
const ye = "extension:third-party/ST-BgLoader", Z = "st_bgloader_cloud_notice_v1";
class L {
  static EXTENSION_ID = "third-party/ST-BgLoader";
  static CHANNEL = ye;
  client = null;
  caps = {
    available: !1,
    sync: !1,
    serverFetch: !1,
    agentTools: !1,
    agentToolsState: "unknown",
    degradedReason: "sdk-missing"
  };
  httpAllow = [];
  initPromise = null;
  capsListeners = [];
  getCapabilities() {
    return this.caps;
  }
  getClient() {
    return this.client;
  }
  /** Subscribers re-render UI (and re-gate feature wiring) when a capability verdict lands. */
  onCapabilitiesChanged(e) {
    this.capsListeners.push(e);
  }
  /**
   * AgentBridge reports the real verdict of the agent.browser surface: the declaration gate can
   * block it and a soft-default authorization can stay pending (in-page prompt), so the optimistic
   * capability bit gets corrected here as soon as a verdict exists.
   */
  reportAgentToolsState(e, t) {
    this.caps.available && (this.caps.agentToolsState === e && this.caps.agentToolsNote === t || (this.caps = { ...this.caps, agentTools: e === "ok", agentToolsState: e, agentToolsNote: t }, e === "blocked" && console.warn("[ST-BgLoader] Agent ambient tools unavailable:", t), this.notifyCapsChanged()));
  }
  notifyCapsChanged() {
    for (const e of this.capsListeners)
      try {
        e();
      } catch {
      }
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
        extensionId: L.EXTENSION_ID,
        displayName: "ST-BgLoader",
        version: "1.0.0",
        installType: "local",
        uiLabel: "ST-BgLoader",
        declaredPermissions: {
          storage: { kv: !0, blob: !0 },
          sql: { private: !0 },
          http: { allow: [...this.httpAllow] },
          jobs: { background: ["delay", "sql.backup"] },
          events: { channels: [L.CHANNEL] },
          // Undeclared resources hit the declaration gate (hard 'blocked') even when an
          // admin would grant them — declare exactly the one browser instance we register.
          agent: { browser: [x] }
        }
      }), this.caps = {
        available: !0,
        sync: !0,
        serverFetch: !0,
        agentTools: !0,
        agentToolsState: "unknown"
      }, console.log("[ST-BgLoader] Authority backend connected:", this.client.getSession()), this.caps) : this.degrade("sdk-missing", "未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）");
    } catch (e) {
      const t = e instanceof Error ? e.message : String(e), i = de(e);
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
      agentToolsState: "unknown",
      degradedReason: e,
      degradedMessage: t
    }, this.notifyOnce(e, t), this.caps;
  }
  /** One-time silent-degradation notice (user-confirmed strategy): toastr when available, console otherwise. */
  notifyOnce(e, t) {
    console.info(`[ST-BgLoader] ${t} (${e})`);
    try {
      if (localStorage.getItem(Z)) return;
      localStorage.setItem(Z, (/* @__PURE__ */ new Date()).toISOString()), window.toastr?.info(t, "ST-BgLoader");
    } catch {
    }
  }
}
function be(l) {
  const e = atob(l), t = new ArrayBuffer(e.length), i = new Uint8Array(t);
  for (let n = 0; n < e.length; n++)
    i[n] = e.charCodeAt(n);
  return i;
}
class ve {
  constructor(e) {
    this.bridge = e;
  }
  async import(e) {
    const t = we(e);
    if (!t)
      throw new Error(`Cannot import from invalid URL: ${e}`);
    if (!await this.bridge.ensureHttpAllowed(t))
      throw new Error(`Server-side import unavailable for host: ${t}`);
    const i = this.bridge.getClient();
    if (!i)
      throw new Error("Authority backend unavailable");
    const n = await i.http.fetch({ url: e, method: "GET" });
    if (!n.ok)
      throw new Error(`Server fetch failed with HTTP ${n.status} for ${e}`);
    const s = be(n.body);
    return new Blob([s], { type: n.contentType || "application/octet-stream" });
  }
}
function we(l) {
  try {
    return new URL(l).hostname;
  } catch {
    return null;
  }
}
const $ = "st-bg-cache-v1", Se = "st_bg_cache_index", b = "entries";
class _e {
  origin;
  remoteImporter = null;
  l1 = null;
  indexDb = null;
  objectUrls = /* @__PURE__ */ new Map();
  constructor() {
    this.origin = new me();
  }
  async init(e) {
    "caches" in window && (this.l1 = await caches.open($)), await this.openIndex(), e && (await e.detectAndInit()).available && e.getClient() && (this.remoteImporter = new ve(e)), await this.origin.init(), console.log("[ST-BgLoader] Media library source of truth: server backgrounds/ directory (browser keeps cache only).");
  }
  async listMedia() {
    return this.origin.listCatalog();
  }
  async getMedia(e) {
    return this.origin.getCatalogItem(e);
  }
  async saveMedia(e, t, i, n, s) {
    let a = typeof e == "string" ? new Blob([e], { type: i === "svg" ? "image/svg+xml" : "text/html" }) : e;
    n === "url" && a.size === 0 && s && (a = await this.fetchForStorage(s).catch(() => new Blob([])));
    const r = await this.origin.putMedia({ blob: a, name: t, type: i, source: n, remoteUrl: s });
    return await this.backfillCache(r, a), r;
  }
  async getMediaBlobUrl(e) {
    const t = this.objectUrls.get(e.id);
    if (t)
      return await this.touchCache(e.cacheKey), t;
    if (this.l1) {
      const i = await this.l1.match(e.cacheKey);
      if (i) {
        const n = await i.blob(), s = URL.createObjectURL(n);
        return this.objectUrls.set(e.id, s), await this.touchCache(e.cacheKey), s;
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
    let i = t.reduce((n, s) => n + (s.size || 0), 0);
    if (!(i <= e)) {
      t.sort((n, s) => n.lastUsed - s.lastUsed);
      for (const n of t) {
        if (i <= e) break;
        await this.evictCacheEntry(n.cacheKey), i -= n.size || 0;
      }
    }
  }
  /** Clears the browser cache only — server files are never touched by maintenance. */
  async clearAll() {
    for (const e of this.objectUrls.values())
      URL.revokeObjectURL(e);
    this.objectUrls.clear(), "caches" in window && (await caches.delete($), this.l1 = await caches.open($)), await this.indexClear();
  }
  async preloadUrl(e, t) {
    const i = await this.origin.findByUrl(e);
    if (i)
      return { item: i, isNew: !1 };
    const n = e.split("/").pop()?.split("?")[0] || "preloaded_media", s = t || this.detectMediaType(n), a = await this.fetchForStorage(e), r = await this.origin.putMedia({ blob: a, name: n, type: s, source: "url", remoteUrl: e });
    return await this.backfillCache(r, a), { item: r, isNew: !0 };
  }
  detectMediaType(e) {
    return M(e);
  }
  getMimeType(e, t) {
    return z(e, t);
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
      const i = indexedDB.open(Se, 1);
      i.onupgradeneeded = (n) => {
        const s = n.target.result;
        s.objectStoreNames.contains(b) || s.createObjectStore(b, { keyPath: "cacheKey" });
      }, i.onsuccess = () => e(i.result), i.onerror = () => t(i.error);
    });
  }
  async indexAll() {
    return this.indexDb || await this.openIndex(), new Promise((e, t) => {
      const n = this.indexDb.transaction(b, "readonly").objectStore(b).getAll();
      n.onsuccess = () => e(n.result || []), n.onerror = () => t(n.error);
    });
  }
  async indexPut(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const s = this.indexDb.transaction(b, "readwrite").objectStore(b).put(e);
      s.onsuccess = () => t(), s.onerror = () => i(s.error);
    });
  }
  async indexDelete(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const s = this.indexDb.transaction(b, "readwrite").objectStore(b).delete(e);
      s.onsuccess = () => t(), s.onerror = () => i(s.error);
    });
  }
  async indexClear() {
    this.indexDb || await this.openIndex(), await new Promise((e, t) => {
      const n = this.indexDb.transaction(b, "readwrite").objectStore(b).clear();
      n.onsuccess = () => e(), n.onerror = () => t(n.error);
    });
  }
}
const ee = 1e4;
class Ee {
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
    const i = this.playlist.findIndex((s) => s.id === e.id);
    i !== -1 ? this.currentIndex = i : (this.playlist.push(e), this.currentIndex = this.playlist.length - 1);
    const n = t || (this.urlResolver ? await this.urlResolver(e) : e.url);
    await this.playTrack(n, this.playbackMode === "single"), this.onTrackChange?.(e);
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
        new Promise((i) => window.setTimeout(i, ee))
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
    this.playbackMode !== "single" && this.playlist.length >= 1 && this.playNext().catch((e) => console.error(e));
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
          new Promise((i) => window.setTimeout(i, ee))
        ]);
      } catch (i) {
        console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", i);
      }
    }
  }
  fadeInVolume(e, t = 400) {
    this.clearFade();
    const i = performance.now(), n = Math.max(0, Math.min(1, e));
    this.audioElement && (this.audioElement.muted = !1, this.audioElement.volume = 0), this.attachedVideo && (this.attachedVideo.muted = !1, this.attachedVideo.volume = 0);
    const s = () => {
      const a = performance.now() - i, r = Math.min(1, a / t), c = n * r;
      this.audioElement && (this.audioElement.volume = c), this.attachedVideo && (this.attachedVideo.volume = c), r < 1 ? this.fadeTimer = requestAnimationFrame(s) : this.applyVolume();
    };
    this.fadeTimer = requestAnimationFrame(s);
  }
  stopTrack(e = 300) {
    if (!this.audioElement || this.audioElement.paused) return;
    if (e <= 0) {
      this.audioElement.pause(), this.audioElement.currentTime = 0;
      return;
    }
    const t = this.audioElement.volume, i = performance.now(), n = () => {
      const s = performance.now() - i, a = Math.min(1, s / e);
      this.audioElement && (this.audioElement.volume = t * (1 - a)), a < 1 ? this.fadeTimer = requestAnimationFrame(n) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
    };
    this.clearFade(), this.fadeTimer = requestAnimationFrame(n);
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
const xe = 15e3;
class te {
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
    return i.className = "st-bg-video-element", i.src = e, i.loop = !0, i.playsInline = !0, i.autoplay = !0, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.transform = "translateZ(0)", i.style.willChange = "transform", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.videoElement = i, this.audioEngine.attachVideo(i), new Promise((n) => {
      let s = !1;
      const a = () => {
        s || (s = !0, window.clearTimeout(r), this.pendingSettle = null, i.removeEventListener("canplay", c), n(i));
      }, r = window.setTimeout(a, xe);
      this.pendingSettle = a;
      const c = async () => {
        try {
          await i.play();
        } catch (h) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", h), i.muted = !0, i.play().catch((u) => console.error("[ST-BgLoader] Video playback error:", u));
        }
        i.style.opacity = "1", a();
      };
      i.addEventListener("canplay", c), i.addEventListener("error", (h) => {
        console.error("[ST-BgLoader] Error loading video:", h), a();
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
const Me = 8e3;
class ie {
  iframeElement = null;
  container;
  pendingSettle = null;
  constructor(e) {
    this.container = e;
  }
  async render(e, t = !1) {
    this.destroy();
    const i = document.createElement("iframe");
    return i.className = "st-bg-iframe-element", i.setAttribute("sandbox", "allow-scripts allow-same-origin"), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.border = "none", i.style.opacity = "0", i.style.pointerEvents = "auto", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.iframeElement = i, new Promise((n) => {
      let s = !1;
      const a = () => {
        s || (s = !0, window.clearTimeout(r), this.pendingSettle = null, n(i));
      }, r = window.setTimeout(a, Me);
      this.pendingSettle = a, i.onload = () => {
        i.style.opacity = "1", a();
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
const Te = 15e3;
class se {
  imageElement = null;
  container;
  pendingSettle = null;
  constructor(e) {
    this.container = e;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("img");
    return i.className = "st-bg-image-element", i.src = e, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.imageElement = i, new Promise((n) => {
      let s = !1;
      const a = () => {
        s || (s = !0, window.clearTimeout(r), this.pendingSettle = null, n(i));
      }, r = window.setTimeout(a, Te);
      this.pendingSettle = a, i.onload = () => {
        i.style.opacity = "1", a();
      }, i.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), a();
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
class Ce {
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
  onHostReady;
  // Serializes concurrent mounts (rapid media double-click): interleaved mounts would
  // both write the same target layer and race activeLayer bookkeeping.
  mountQueue = Promise.resolve();
  transitionType = "fade";
  transitionDurationMs = 400;
  constructor(e, t) {
    this.audioEngine = e, this.onHostReady = t ?? null;
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
    t ? (this.layerA = t.querySelector(".st-bg-layer-a"), this.layerB = t.querySelector(".st-bg-layer-b")) : (t = document.createElement("div"), t.className = "st-bg-media-container", t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.overflow = "hidden", t.style.zIndex = "0", t.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), t.appendChild(this.layerA), t.appendChild(this.layerB), this.hostEl.appendChild(t)), this.containerEl = t, this.videoRendererA = new te(this.layerA, this.audioEngine), this.videoRendererB = new te(this.layerB, this.audioEngine), this.iframeRendererA = new ie(this.layerA), this.iframeRendererB = new ie(this.layerB), this.imageRendererA = new se(this.layerA), this.imageRendererB = new se(this.layerB), this.observer = new MutationObserver(() => this.syncFitting()), this.observer.observe(this.hostEl, { attributes: !0, attributeFilter: ["class"] }), this.syncFitting(), this.onHostReady?.(t);
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
  mountMedia(e, t) {
    const i = () => this.doMountMedia(e, t);
    return this.mountQueue = this.mountQueue.then(i, i), this.mountQueue;
  }
  async doMountMedia(e, t) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null;
      const g = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, f = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, y = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      g.destroy(), f.destroy(), y.destroy();
      const m = this.activeLayer === "A" ? this.layerB : this.layerA;
      m && (m.style.opacity = "0", m.style.transform = "none", m.style.filter = "none");
    }
    const i = this.activeLayer === "A" ? "B" : "A", n = i === "B" ? this.layerB : this.layerA, s = this.activeLayer === "A" ? this.layerA : this.layerB, a = i === "B" ? this.videoRendererB : this.videoRendererA, r = i === "B" ? this.iframeRendererB : this.iframeRendererA, c = i === "B" ? this.imageRendererB : this.imageRendererA;
    a.destroy(), r.destroy(), c.destroy();
    const h = this.getFitting();
    switch (e.type) {
      case "video":
        await a.render(t, h);
        break;
      case "html":
      case "svg":
        await r.render(t, !0);
        break;
      case "image":
        await c.render(t, h);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, t);
        break;
    }
    const u = this.transitionDurationMs;
    n.style.transition = `all ${u}ms cubic-bezier(0.4, 0, 0.2, 1)`, s.style.transition = `all ${u}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const p = this.transitionType;
    p === "zoom_fade" ? (n.style.transform = "scale(1.06)", n.style.opacity = "0", n.offsetHeight, n.style.transform = "scale(1)", n.style.opacity = "1", s.style.transform = "scale(0.96)", s.style.opacity = "0") : p === "blur_fade" ? (n.style.filter = "blur(10px)", n.style.opacity = "0", n.offsetHeight, n.style.filter = "blur(0px)", n.style.opacity = "1", s.style.filter = "blur(10px)", s.style.opacity = "0") : p === "slide_left" ? (n.style.transform = "translate3d(100%, 0, 0)", n.style.opacity = "1", n.offsetHeight, n.style.transform = "translate3d(0, 0, 0)", s.style.transform = "translate3d(-100%, 0, 0)", s.style.opacity = "0") : p === "slide_right" ? (n.style.transform = "translate3d(-100%, 0, 0)", n.style.opacity = "1", n.offsetHeight, n.style.transform = "translate3d(0, 0, 0)", s.style.transform = "translate3d(100%, 0, 0)", s.style.opacity = "0") : (n.style.transform = "none", n.style.filter = "none", n.style.opacity = "1", s.style.transform = "none", s.style.filter = "none", s.style.opacity = "0"), this.activeLayer = i, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const g = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, f = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, y = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      g.destroy(), f.destroy(), y.destroy(), s.style.transform = "none", s.style.filter = "none";
    }, u + 50);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0", this.layerA.style.transform = "none", this.layerA.style.filter = "none"), this.layerB && (this.layerB.style.opacity = "0", this.layerB.style.transform = "none", this.layerB.style.filter = "none"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
const ke = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function w(l) {
  return String(l).replace(/[&<>"']/g, (e) => ke[e]);
}
class Ae {
  container = null;
  settings;
  cacheManager;
  callbacks;
  authority;
  constructor(e, t, i, n) {
    this.settings = e, this.cacheManager = t, this.callbacks = i, this.authority = n ?? null;
  }
  /** Replace the drawer's settings copy with a remotely synced one and re-render the panel. */
  applyRemoteSettings(e) {
    this.settings = e, this.render();
  }
  render() {
    const e = document.querySelector("#extensions_settings");
    if (!e) {
      console.warn("[ST-BgLoader] #extensions_settings not found yet, waiting for DOM insertion...");
      const n = new MutationObserver(() => {
        document.querySelector("#extensions_settings") && (n.disconnect(), this.render());
      });
      n.observe(document.body, { childList: !0, subtree: !0 });
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
                        <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                            <div class="st-bgloader-preset-row">
                                <label style="font-size: 0.9em; flex: 0 0 90px;">类型:</label>
                                <select id="st_trigger_type">
                                    <option value="character">角色名 (Character)</option>
                                    <option value="chat">聊天 ID (Chat)</option>
                                    <option value="regex">正则匹配 (Regex)</option>
                                </select>
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label style="font-size: 0.9em; flex: 0 0 90px;">规则名:</label>
                                <input type="text" id="st_trigger_name" placeholder="规则名称" />
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label style="font-size: 0.9em; flex: 0 0 90px;">匹配:</label>
                                <input type="text" id="st_trigger_pattern" placeholder="角色名 / 聊天 ID / 正则表达式" />
                            </div>
                            <div class="st-bgloader-btn-row">
                                <button id="st_trigger_confirm_btn" class="menu_button"><i class="fa-solid fa-check"></i> 添加规则</button>
                                <button id="st_trigger_cancel_btn" class="menu_button">取消</button>
                            </div>
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
    const i = '<span style="color:#4fae6b;">● 源端：服务端 backgrounds/ 目录</span><br/>媒体存于酒馆服务端（与原生背景同位置，换浏览器/设备可见）；本浏览器仅保留可清理的缓存。', n = this.authority?.getCapabilities();
    let s;
    n?.available && n.agentToolsState === "blocked" ? s = '<span style="color:#4fae6b;">● Authority 增强已连接</span>：设置/场景跨端同步 ✓ · CORS 服务端导入 ✓ · <span style="color:#c9a34f;">Agent 氛围工具被权限策略封锁</span>（管理员可在 Authority Security Center 调整）' : n?.available && n.agentToolsState === "pending" ? s = '<span style="color:#4fae6b;">● Authority 增强已连接</span>：设置/场景跨端同步 ✓ · CORS 服务端导入 ✓ · <span style="color:#c9a34f;">Agent 氛围工具等待授权</span>（处理页面上的 Authority 权限弹窗，或到 Security Center 查看）' : n?.available ? s = '<span style="color:#4fae6b;">● Authority 增强已连接</span>：设置/场景跨端同步 ✓ · Agent 氛围工具可用 · CORS 服务端导入 ✓' : s = '<span style="color:#c9a34f;">● 未检测到 Authority</span>：媒体功能不受影响（源端始终在服务端），仅跨端同步与 Agent 工具不可用。', e.innerHTML = `${i}<br/>${s}`, t && (t.checked = !!this.settings.agentToolsEnabled, t.disabled = !n?.available);
  }
  populateScenes() {
    const e = this.container?.querySelector("#st_scene_select");
    e && (e.innerHTML = "", Object.values(I).forEach((t) => {
      const i = document.createElement("option");
      i.value = t.id, i.textContent = t.name, t.id === this.settings.activeSceneId && (i.selected = !0), e.appendChild(i);
    }), Object.entries(this.settings.scenes || {}).forEach(([t, i]) => {
      const n = document.createElement("option");
      n.value = t, n.textContent = `★ ${i.name} (Custom)`, t === this.settings.activeSceneId && (n.selected = !0), e.appendChild(n);
    }));
  }
  populatePresets() {
    const e = this.container?.querySelector("#st_preset_select");
    e && (e.innerHTML = "", Object.values(C).forEach((t) => {
      const i = document.createElement("option");
      i.value = t.id, i.textContent = t.name, t.id === this.settings.activePresetId && (i.selected = !0), e.appendChild(i);
    }), Object.entries(this.settings.userPresets || {}).forEach(([t, i]) => {
      const n = document.createElement("option");
      n.value = t, n.textContent = `★ ${t} (Custom)`, t === this.settings.activePresetId && (n.selected = !0), e.appendChild(n);
    }));
  }
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector(".inline-drawer-toggle"), t = this.container.querySelector(".inline-drawer-content"), i = this.container.querySelector(".inline-drawer-icon");
    e?.addEventListener("click", () => {
      const o = t.style.display === "none";
      t.style.display = o ? "flex" : "none", i && (i.classList.toggle("down", o), i.classList.toggle("up", !o));
    });
    const n = this.container.querySelector("#st_bgloader_dropzone"), s = this.container.querySelector("#st_bgloader_file_input");
    n?.addEventListener("click", () => s?.click()), s?.addEventListener("change", async () => {
      s.files && s.files.length > 0 && (await this.handleFileUpload(s.files[0]), s.value = "");
    }), n?.addEventListener("dragover", (o) => {
      o.preventDefault(), n.classList.add("dragover");
    }), n?.addEventListener("dragleave", () => n.classList.remove("dragover")), n?.addEventListener("drop", async (o) => {
      const d = o;
      d.preventDefault(), n.classList.remove("dragover"), d.dataTransfer?.files && d.dataTransfer.files.length > 0 && await this.handleFileUpload(d.dataTransfer.files[0]);
    });
    const a = this.container.querySelector("#st_bgloader_url_input");
    this.container.querySelector("#st_bgloader_url_btn")?.addEventListener("click", async () => {
      const o = a.value.trim();
      o && (await this.handleUrlImport(o), a.value = "");
    });
    const c = this.container.querySelector("#st_scene_select");
    this.container.querySelector("#st_scene_apply_btn")?.addEventListener("click", () => {
      const o = c?.value;
      o && (this.settings.activeSceneId = o, this.callbacks.onSceneApplied?.(o), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_scene_save_btn")?.addEventListener("click", () => {
      const o = prompt("Enter a name for this custom audiovisual scene:");
      if (o && o.trim()) {
        const d = `scene_${Date.now()}`, _ = {
          id: d,
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
        this.settings.scenes[d] = _, this.settings.activeSceneId = d, this.populateScenes(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_scene_del_btn")?.addEventListener("click", () => {
      const o = c?.value;
      if (I[o]) {
        alert("Cannot delete built-in scenes.");
        return;
      }
      this.settings.scenes[o] && confirm(`Delete custom scene "${this.settings.scenes[o].name}"?`) && (delete this.settings.scenes[o], this.settings.activeSceneId = "cyber_rain", this.populateScenes(), this.callbacks.onSettingsChanged(this.settings));
    });
    const h = this.container.querySelector("#st_preset_select");
    h?.addEventListener("change", () => {
      const o = h.value;
      this.settings.activePresetId = o;
      let d = C[o]?.filters;
      !d && this.settings.userPresets[o] && (d = this.settings.userPresets[o]), d && (this.settings.filters = { ...d }, this.updateSliders(d), this.callbacks.onPresetChanged({ id: o, name: o, filters: d }), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_preset_save_btn")?.addEventListener("click", () => {
      const o = prompt("Enter a name for this custom preset:");
      if (o && o.trim()) {
        const d = o.trim();
        this.settings.userPresets[d] = { ...this.settings.filters }, this.settings.activePresetId = d, this.populatePresets(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_preset_del_btn")?.addEventListener("click", () => {
      const o = h.value;
      if (this.settings.userPresets[o]) {
        if (confirm(`Delete custom preset "${o}"?`)) {
          delete this.settings.userPresets[o], this.settings.activePresetId = "default", this.populatePresets();
          const d = C.default.filters;
          this.settings.filters = { ...d }, this.updateSliders(d), this.callbacks.onPresetChanged(C.default), this.callbacks.onSettingsChanged(this.settings);
        }
      } else
        alert("Cannot delete built-in presets.");
    });
    let u = null;
    const p = () => {
      u !== null && window.clearTimeout(u), u = window.setTimeout(() => {
        u = null, this.callbacks.onSettingsChanged(this.settings);
      }, 300);
    }, g = (o, d, _, T) => {
      const X = this.container.querySelector(o), Y = this.container.querySelector(d);
      X?.addEventListener("input", () => {
        const J = Number(X.value);
        Y && (Y.textContent = `${J}${_}`), T(J), p();
      });
    };
    g("#st_filter_blur", "#st_filter_blur_val", "px", (o) => this.settings.filters.blur = o), g("#st_filter_brightness", "#st_filter_brightness_val", "%", (o) => this.settings.filters.brightness = o), g("#st_filter_opacity", "#st_filter_opacity_val", "%", (o) => this.settings.filters.opacity = o), g("#st_filter_saturate", "#st_filter_saturate_val", "%", (o) => this.settings.filters.saturate = o);
    const f = this.container.querySelector("#st_weather_type");
    f?.addEventListener("change", () => {
      this.settings.weather.type = f.value, this.callbacks.onWeatherChanged?.(this.settings.weather), this.callbacks.onSettingsChanged(this.settings);
    });
    const y = this.container.querySelector("#st_weather_density");
    y?.addEventListener("change", () => {
      this.settings.weather.density = y.value, this.callbacks.onWeatherChanged?.(this.settings.weather), this.callbacks.onSettingsChanged(this.settings);
    }), g("#st_weather_speed", "#st_weather_speed_val", "x", (o) => {
      this.settings.weather.speed = o / 10, this.callbacks.onWeatherChanged?.(this.settings.weather);
    }), g("#st_weather_opacity", "#st_weather_opacity_val", "%", (o) => {
      this.settings.weather.opacity = o / 100, this.callbacks.onWeatherChanged?.(this.settings.weather);
    });
    const m = this.container.querySelector("#st_visualizer_mode");
    m?.addEventListener("change", () => {
      this.settings.visualizer.mode = m.value, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.callbacks.onSettingsChanged(this.settings);
    }), g("#st_visualizer_sens", "#st_visualizer_sens_val", "x", (o) => {
      this.settings.visualizer.sensitivity = o / 10, this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
    });
    const U = this.container.querySelector("#st_parallax_enabled");
    U?.addEventListener("change", () => {
      this.settings.parallax.enabled = U.checked, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.callbacks.onSettingsChanged(this.settings);
    }), g("#st_parallax_intensity", "#st_parallax_intensity_val", "", (o) => {
      this.settings.parallax.intensity = o / 10, this.callbacks.onParallaxChanged?.(this.settings.parallax);
    });
    const q = this.container.querySelector("#st_ambient_type");
    q?.addEventListener("change", () => {
      this.settings.ambientSound.type = q.value, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.callbacks.onSettingsChanged(this.settings);
    }), g("#st_ambient_vol", "#st_ambient_vol_val", "%", (o) => {
      this.settings.ambientSound.volume = o / 100, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
    });
    const N = this.container.querySelector("#st_frosted_enabled");
    N?.addEventListener("change", () => {
      this.settings.frostedChat.enabled = N.checked, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.callbacks.onSettingsChanged(this.settings);
    }), g("#st_frosted_blur", "#st_frosted_blur_val", "px", (o) => {
      this.settings.frostedChat.blur = o, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
    }), g("#st_frosted_opacity", "#st_frosted_opacity_val", "%", (o) => {
      this.settings.frostedChat.opacity = o, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
    });
    const V = this.container.querySelector("#st_transition_effect");
    V?.addEventListener("change", () => {
      this.settings.transitionEffect = V.value, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.callbacks.onSettingsChanged(this.settings);
    }), g("#st_transition_dur", "#st_transition_dur_val", "ms", (o) => {
      this.settings.transitionDurationMs = o, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
    }), g("#st_audio_volume", "#st_audio_volume_val", "%", (o) => this.settings.volume = o / 100);
    const G = this.container.querySelector("#st_playback_mode");
    G?.addEventListener("change", () => {
      this.settings.playbackMode = G.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.callbacks.onSettingsChanged(this.settings);
    });
    const W = this.container.querySelector("#st_audio_mute");
    W?.addEventListener("change", () => {
      this.settings.muted = W.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const P = this.container.querySelector("#st_audio_muffle");
    P?.addEventListener("change", () => {
      this.settings.muffleBGM = P.checked, this.callbacks.onMuffleChanged?.(P.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const H = this.container.querySelector("#st_audio_blur");
    H?.addEventListener("change", () => {
      this.settings.pauseOnBlur = H.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const j = this.container.querySelector("#st_shortcuts_enabled");
    j?.addEventListener("change", () => {
      this.settings.shortcutsEnabled = j.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const B = this.container.querySelector("#st_bg_interactive");
    B?.addEventListener("change", () => {
      this.settings.interactiveBackground = B.checked, this.callbacks.onInteractiveChanged(B.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const K = this.container.querySelector("#st_bgloader_agent_tools_cb");
    K?.addEventListener("change", () => {
      this.settings.agentToolsEnabled = K.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const F = this.container.querySelector("#st_mini_player_toggle");
    F?.addEventListener("change", () => {
      this.settings.showMiniPlayer = F.checked, this.callbacks.onMiniPlayerToggle(F.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const O = this.container.querySelector("#st_capsule_on_play");
    O?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = O.checked, this.callbacks.onCapsuleOnPlayToggle?.(O.checked), this.callbacks.onSettingsChanged(this.settings);
    }), this.container.querySelector("#st_trigger_add_btn")?.addEventListener("click", () => {
      const o = this.container?.querySelector("#st_trigger_form");
      if (o) {
        const d = o.style.display === "none";
        o.style.display = d ? "block" : "none", d && this.container?.querySelector("#st_trigger_name")?.focus();
      }
    }), this.container.querySelector("#st_trigger_cancel_btn")?.addEventListener("click", () => {
      const o = this.container?.querySelector("#st_trigger_form");
      o && (o.style.display = "none");
    }), this.container.querySelector("#st_trigger_confirm_btn")?.addEventListener("click", () => {
      this.addTriggerRuleFromForm();
    }), this.container.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      confirm("Are you sure you want to clear all cached media files?") && (await this.cacheManager.clearAll(), await this.refreshMediaGrid(), await this.updateCacheStats());
    }), this.container.querySelector("#st_backup_export_btn")?.addEventListener("click", () => {
      const o = JSON.stringify(this.settings, null, 2), d = new Blob([o], { type: "application/json" }), _ = URL.createObjectURL(d), T = document.createElement("a");
      T.href = _, T.download = `st-bgloader-settings-${Date.now()}.json`, T.click(), URL.revokeObjectURL(_);
    });
    const S = this.container.querySelector("#st_backup_import_file");
    this.container.querySelector("#st_backup_import_btn")?.addEventListener("click", () => {
      S?.click();
    }), S?.addEventListener("change", async () => {
      if (S.files && S.files[0]) {
        try {
          const o = await S.files[0].text(), d = JSON.parse(o);
          d && typeof d == "object" && (this.settings = { ...this.settings, ...d }, this.callbacks.onSettingsChanged(this.settings), this.render(), alert("Settings successfully imported!"));
        } catch (o) {
          alert(`Failed to import settings JSON: ${o}`);
        }
        S.value = "";
      }
    });
  }
  addTriggerRuleFromForm() {
    const e = this.container?.querySelector("#st_trigger_name"), t = this.container?.querySelector("#st_trigger_pattern"), i = this.container?.querySelector("#st_trigger_type");
    if (!e || !t || !i) return;
    const n = e.value.trim(), s = t.value.trim();
    if (!n || !s) {
      alert("规则名和匹配内容不能为空。");
      return;
    }
    const a = i.value;
    if (a === "regex")
      try {
        new RegExp(s, "i");
      } catch (h) {
        alert(`正则表达式无效：${h instanceof Error ? h.message : String(h)}`);
        return;
      }
    const r = {
      id: `rule_${Date.now()}`,
      name: n,
      enabled: !0,
      type: a,
      pattern: s,
      action: {
        preset: this.settings.activePresetId,
        weather: this.settings.weather.type
      }
    };
    this.settings.triggerRules.push(r), this.callbacks.onSettingsChanged(this.settings), this.refreshTriggerList(), e.value = "", t.value = "";
    const c = this.container?.querySelector("#st_trigger_form");
    c && (c.style.display = "none");
  }
  refreshTriggerList() {
    const e = this.container?.querySelector("#st_trigger_list");
    if (e) {
      if (e.innerHTML = "", this.settings.triggerRules.length === 0) {
        e.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 8px;">No trigger rules configured yet.</div>';
        return;
      }
      this.settings.triggerRules.forEach((t, i) => {
        const n = document.createElement("div");
        n.className = "st-bgloader-trigger-item", n.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" class="st-rule-toggle" ${t.enabled ? "checked" : ""} />
                    <div>
                        <span class="st-bgloader-trigger-badge">${w(t.type)}</span>
                        <strong>${w(t.name)}</strong>: <code>${w(t.pattern)}</code>
                    </div>
                </div>
                <button class="menu_button menu_button_danger st-rule-del" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;
        const s = n.querySelector(".st-rule-toggle");
        s.addEventListener("change", () => {
          t.enabled = s.checked, this.callbacks.onSettingsChanged(this.settings);
        }), n.querySelector(".st-rule-del")?.addEventListener("click", () => {
          this.settings.triggerRules.splice(i, 1), this.callbacks.onSettingsChanged(this.settings), this.refreshTriggerList();
        }), e.appendChild(n);
      });
    }
  }
  updateSliders(e) {
    const t = (i, n, s, a) => {
      const r = this.container?.querySelector(i), c = this.container?.querySelector(n);
      r && (r.value = s.toString()), c && (c.textContent = `${s}${a}`);
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
      const n = document.createElement("div");
      n.className = "st-bgloader-media-card", this.settings.activeMediaId === i.id && n.classList.add("active"), n.innerHTML = `
                <div class="st-bgloader-media-badge ${i.type}">${i.type}</div>
                <button class="st-bgloader-media-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                <div class="st-bgloader-media-card-title" title="${w(i.name)}">${w(i.name)}</div>
            `, n.addEventListener("click", (a) => {
        a.target.closest(".st-bgloader-media-delete") || (this.settings.activeMediaId = i.id, this.container?.querySelectorAll(".st-bgloader-media-card").forEach((c) => c.classList.remove("active")), n.classList.add("active"), this.callbacks.onMediaSelected(i), this.callbacks.onSettingsChanged(this.settings));
      }), n.querySelector(".st-bgloader-media-delete")?.addEventListener("click", async (a) => {
        a.stopPropagation(), confirm(`Delete media "${i.name}"?`) && (await this.cacheManager.deleteMedia(i.id), this.settings.activeMediaId === i.id && (this.settings.activeMediaId = null, this.callbacks.onSettingsChanged(this.settings)), this.callbacks.onMediaDeleted(i.id), await this.refreshMediaGrid(), await this.updateCacheStats());
      }), e.appendChild(n);
    });
  }
  async updateCacheStats() {
    const e = this.container?.querySelector("#st_cache_used"), t = this.container?.querySelector("#st_cache_count");
    if (!e || !t) return;
    const { usedBytes: i, itemCount: n } = await this.cacheManager.getCacheUsage(), s = (i / (1024 * 1024)).toFixed(2);
    e.textContent = `${s} MB`, t.textContent = n.toString();
  }
  async handleFileUpload(e) {
    this.setImportBusy(!0);
    try {
      const t = M(e.name, e.type), i = await this.cacheManager.saveMedia(e, e.name, t, "server");
      await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(i);
    } catch (t) {
      this.reportImportError(t);
    } finally {
      this.setImportBusy(!1);
    }
  }
  async handleUrlImport(e) {
    this.setImportBusy(!0);
    try {
      const t = e.split("/").pop()?.split("?")[0] || "remote_media", i = M(t), n = await this.cacheManager.saveMedia(new Blob([]), t, i, "url", e);
      await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(n);
    } catch (t) {
      this.reportImportError(t);
    } finally {
      this.setImportBusy(!1);
    }
  }
  /** Busy state for the import controls: a large upload or a slow external URL (up to the
   *  60s download timeout) previously gave zero visual feedback. */
  setImportBusy(e) {
    this.container?.querySelector("#st_bgloader_dropzone")?.classList.toggle("busy", e);
    const t = this.container?.querySelector("#st_bgloader_url_btn");
    t && (t.disabled = e, t.textContent = e ? "Importing…" : "Import URL");
  }
  reportImportError(e) {
    console.error("[ST-BgLoader] Media import failed:", e);
    const t = e instanceof Error ? e.message : String(e);
    window.toastr?.error(`媒体导入失败：${t}`, "ST-BgLoader");
  }
}
class Ie {
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
      const n = i.getAttribute("bgfile") || "", s = M(n);
      if (s !== "image") {
        const a = document.createElement("span");
        a.className = `st-bg-native-badge ${s}`, a.textContent = s.toUpperCase(), i.appendChild(a), i.addEventListener("click", () => {
          const r = i.dataset.url || `/backgrounds/${n}`;
          this.onNativeMediaSelect(r, s, n);
        });
      }
    });
  }
  stop() {
    this.observer && (this.observer.disconnect(), this.observer = null);
  }
}
class Le {
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
    const n = document.createElement("div");
    n.id = "st_bg_mini_player", n.className = "st-bg-mini-player";
    const s = this.audioEngine.getCurrentTrack(), a = s ? s.name : "No Audio Selected", r = this.audioEngine.isPlaying(), c = this.audioEngine.getPlaybackMode(), h = this.isVisible && (!this.capsuleOnPlayOnly || r);
    n.classList.add(h ? "visible" : "hidden"), n.innerHTML = `
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
                <div class="st-bg-mini-track" id="st_mini_title" title="${w(a)}">${w(a)}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${c}">
                    <i class="fa-solid ${this.getModeIcon(c)}"></i>
                </button>
            </div>
        `, document.body.appendChild(n), this.container = n, this.bindEvents(), this.audioEngine.onTrackChange = (u) => {
      const p = this.container?.querySelector("#st_mini_title");
      if (p) {
        const g = u ? u.name : "No Audio";
        p.textContent = g, p.setAttribute("title", g);
      }
    }, this.audioEngine.onPlayStateChange = (u) => {
      const p = this.container?.querySelector("#st_mini_play i");
      p && (p.className = `fa-solid ${u ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (u ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
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
        const n = i.querySelector("i");
        n && (n.className = `fa-solid ${this.getModeIcon(t)}`);
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
const Re = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"];
class Pe {
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
    let n = (await this.ext.getCacheManager().listMedia()).find((s) => s.id === e || s.name === e || s.url === e || s.cacheKey === e);
    if (!n) {
      const s = t?.name || e.split("/").pop()?.split("?")[0] || "remote_background", a = t?.type || M(e);
      t?.saveToLibrary ? n = await this.ext.getCacheManager().saveMedia(new Blob([]), s, a, "url", e) : n = {
        id: "custom_" + Date.now(),
        name: s,
        type: a,
        source: "url",
        url: e,
        cacheKey: e,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
    }
    t?.filters && this.setFilters(t.filters), typeof t?.interactive == "boolean" && this.setInteractive(t.interactive), await this.ext.applyMediaItem(n), this.emit("media-change", n);
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
    let n = (await this.ext.getCacheManager().listMedia()).find((a) => a.id === e || a.name === e || a.url === e || a.cacheKey === e);
    if (!n) {
      const a = t?.title || e.split("/").pop()?.split("?")[0] || "BGM";
      n = {
        id: "bgm_" + Date.now(),
        name: a,
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
    await this.ext.getAudioEngine().playMediaItem(n), this.emit("track-change", n);
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
    let i = C[e]?.filters;
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
    if (typeof e == "string" ? i = {
      ...this.ext.getSettings().weather,
      type: e,
      ...t || {}
    } : i = { ...e }, !Re.includes(i.type)) {
      console.warn(`[ST-BgLoader PublicAPI] Ignored invalid weather type "${String(i.type)}".`);
      return;
    }
    this.ext.getSettings().weather = i, this.ext.getAtmosphereFX().setWeather(i), this.ext.saveSettings(), this.emit("weather-change", i);
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
    const e = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"], t = this.ext.getSettings().weather.type, i = (e.indexOf(t) + 1) % e.length, n = e[i];
    return this.setWeather(n), n;
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
    const i = Array.isArray(e) ? e : [e], n = [], s = t?.concurrency || 3;
    let a = 0;
    const r = [...i], c = Array.from({ length: Math.min(s, r.length) }, async () => {
      for (; r.length > 0; ) {
        const h = r.shift();
        try {
          const { item: u, isNew: p } = await this.ext.getCacheManager().preloadUrl(h), g = {
            url: h,
            success: !0,
            cached: !p,
            size: u.size || 0
          };
          n.push(g);
        } catch (u) {
          n.push({
            url: h,
            success: !1,
            cached: !1,
            size: 0,
            error: u?.message || String(u)
          });
        }
        a++, t?.onProgress?.(a, i.length, h), this.emit("preload-progress", a, i.length, h);
      }
    });
    return await Promise.all(c), this.emit("preload-complete", n), n;
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
      } catch (n) {
        console.error(`[ST-BgLoader PublicAPI] Error in listener for "${e}":`, n);
      }
    });
  }
}
class Be {
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
    const i = t ? Math.random() * this.height : -20, n = Math.random() * (this.width + 400) - 200, s = this.currentOptions.speed, a = this.currentOptions.wind;
    switch (e) {
      case "rain":
        return {
          x: n,
          y: i,
          vx: a * 3,
          vy: (12 + Math.random() * 8) * s,
          size: 10 + Math.random() * 15,
          alpha: (0.3 + Math.random() * 0.4) * this.currentOptions.opacity
        };
      case "snow":
        return {
          x: n,
          y: i,
          vx: a * 0.8 + (Math.random() - 0.5) * 0.5,
          vy: (1 + Math.random() * 2) * s,
          size: 2 + Math.random() * 3.5,
          alpha: (0.4 + Math.random() * 0.5) * this.currentOptions.opacity,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "sakura":
        return {
          x: n,
          y: i,
          vx: a * 1.2 + (Math.random() - 0.5) * 0.8,
          vy: (1.2 + Math.random() * 2.2) * s,
          size: 8 + Math.random() * 6,
          alpha: (0.6 + Math.random() * 0.3) * this.currentOptions.opacity,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.04 * s,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "cyber_motes": {
        const r = ["#00f0ff", "#ff007f", "#7928ca", "#00ff88"];
        return {
          x: Math.random() * this.width,
          y: t ? Math.random() * this.height : this.height + 20,
          vx: (Math.random() - 0.5) * 1.5 + a * 0.5,
          vy: -(1.5 + Math.random() * 3) * s,
          size: 2 + Math.random() * 3.5,
          alpha: (0.5 + Math.random() * 0.5) * this.currentOptions.opacity,
          color: r[Math.floor(Math.random() * r.length)],
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
    for (let n = 0; n < i; n++) {
      const s = this.particles[n];
      if (t === "rain")
        e.beginPath(), e.strokeStyle = `rgba(180, 215, 255, ${s.alpha})`, e.lineWidth = 1.2, e.moveTo(s.x, s.y), e.lineTo(s.x + s.vx * 1.2, s.y + s.size), e.stroke(), s.x += s.vx, s.y += s.vy, s.y > this.height - 20 && Math.random() < 0.15 && this.ripples.push({
          x: s.x,
          y: this.height - 5 + Math.random() * 5,
          vx: 0,
          vy: 0,
          size: 1,
          alpha: s.alpha * 0.8
        }), (s.y > this.height || s.x < -100 || s.x > this.width + 100) && (this.particles[n] = this.createParticle(t, !1));
      else if (t === "snow") {
        s.oscillationOffset = (s.oscillationOffset || 0) + 0.02;
        const a = Math.sin(s.oscillationOffset) * 0.8;
        s.x += s.vx + a, s.y += s.vy, e.beginPath(), e.arc(s.x, s.y, s.size, 0, Math.PI * 2), e.fillStyle = `rgba(255, 255, 255, ${s.alpha})`, e.fill(), (s.y > this.height || s.x < -50 || s.x > this.width + 50) && (this.particles[n] = this.createParticle(t, !1));
      } else if (t === "sakura") {
        s.oscillationOffset = (s.oscillationOffset || 0) + 0.03, s.rotation = (s.rotation || 0) + (s.vRotation || 0.02);
        const a = Math.sin(s.oscillationOffset) * 1.5;
        s.x += s.vx + a, s.y += s.vy, e.save(), e.translate(s.x, s.y), e.rotate(s.rotation), e.beginPath(), e.ellipse(0, 0, s.size, s.size * 0.55, 0, 0, Math.PI * 2), e.fillStyle = `rgba(255, 183, 197, ${s.alpha})`, e.fill(), e.restore(), (s.y > this.height || s.x < -50 || s.x > this.width + 50) && (this.particles[n] = this.createParticle(t, !1));
      } else if (t === "cyber_motes") {
        s.life = (s.life || 0) + 1, s.x += s.vx, s.y += s.vy;
        const a = s.life / (s.maxLife || 200), r = s.alpha * Math.sin(a * Math.PI);
        e.save(), e.shadowBlur = 8, e.shadowColor = s.color || "#00f0ff", e.beginPath(), e.arc(s.x, s.y, s.size, 0, Math.PI * 2), e.fillStyle = s.color || "#00f0ff", e.globalAlpha = Math.max(0, r), e.fill(), e.restore(), (s.y < -20 || s.life && s.life > (s.maxLife || 200)) && (this.particles[n] = this.createParticle(t, !1));
      }
    }
    for (let n = this.ripples.length - 1; n >= 0; n--) {
      const s = this.ripples[n];
      if (s.size += 0.8, s.alpha -= 0.03, s.alpha <= 0 || s.size > 14) {
        this.ripples.splice(n, 1);
        continue;
      }
      e.beginPath(), e.ellipse(s.x, s.y, s.size * 1.5, s.size * 0.6, 0, 0, Math.PI * 2), e.strokeStyle = `rgba(180, 215, 255, ${s.alpha})`, e.lineWidth = 1, e.stroke();
    }
  }
  renderScanlines(e) {
    const i = 0.12 * this.currentOptions.opacity;
    e.fillStyle = `rgba(0, 0, 0, ${i})`;
    for (let s = 0; s < this.height; s += 4)
      e.fillRect(0, s, this.width, 1.5);
    this.scanlineOffset = (this.scanlineOffset + 2 * this.currentOptions.speed) % this.height;
    const n = e.createLinearGradient(0, this.scanlineOffset - 30, 0, this.scanlineOffset + 30);
    n.addColorStop(0, "rgba(255, 255, 255, 0)"), n.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * this.currentOptions.opacity})`), n.addColorStop(1, "rgba(255, 255, 255, 0)"), e.fillStyle = n, e.fillRect(0, this.scanlineOffset - 30, this.width, 60), Math.random() < 0.05 && (e.fillStyle = `rgba(255, 255, 255, ${0.02 * this.currentOptions.opacity})`, e.fillRect(0, 0, this.width, this.height));
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onWindowResize), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.particles = [], this.ripples = [];
  }
}
class Fe {
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
      const n = Math.min(12, this.dataArray.length);
      for (let r = 0; r < n; r++)
        i += this.dataArray[r];
      const s = i / n / 255, a = Math.pow(s, 2) * 0.35 * t;
      if (this.mediaContainerEl) {
        const r = 1 + a * 0.015;
        this.mediaContainerEl.style.transform = `scale(${r})`, this.mediaContainerEl.style.transition = "transform 0.06s ease-out";
      }
    } else if (e === "spectrum") {
      if (!this.ctx) return;
      const i = this.ctx;
      i.clearRect(0, 0, this.width, this.height);
      const n = this.dataArray.length, s = Math.max(3, this.width / n * 1.6);
      let a = 0;
      const r = this.currentOptions.color || "#4fa3d1";
      for (let c = 0; c < n; c++) {
        const h = this.dataArray[c] / 255 * t, u = Math.min(this.height, h * (this.height - 10));
        if (u > 1) {
          const p = i.createLinearGradient(0, this.height, 0, this.height - u);
          p.addColorStop(0, `${r}22`), p.addColorStop(0.7, `${r}aa`), p.addColorStop(1, `${r}ff`), i.fillStyle = p;
          const g = this.height - u;
          i.beginPath();
          const f = Math.min(s / 2, 3);
          i.roundRect(a, g, s - 1.5, u, [f, f, 0, 0]), i.fill();
        }
        if (a += s, a > this.width) break;
      }
    }
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onResize), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.mediaContainerEl && (this.mediaContainerEl.style.transform = "", this.mediaContainerEl.style.transition = "");
  }
}
class Oe {
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
  listenerAttached = !1;
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
    const t = window.innerWidth / 2, i = window.innerHeight / 2, n = 30 * this.options.intensity, s = (e.clientX - t) / t, a = (e.clientY - i) / i;
    this.targetX = s * n, this.targetY = a * n, this.isRunning || this.startLoop();
  };
  enable() {
    this.listenerAttached || (window.addEventListener("mousemove", this.onMouseMove, { passive: !0 }), this.listenerAttached = !0), this.targetEl && (this.targetEl.style.willChange = "transform"), this.startLoop();
  }
  disable() {
    this.listenerAttached && (window.removeEventListener("mousemove", this.onMouseMove), this.listenerAttached = !1), this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null), this.isRunning = !1, this.targetX = 0, this.targetY = 0, this.currentX = 0, this.currentY = 0, this.targetEl && (this.targetEl.style.transform = "", this.targetEl.style.willChange = "");
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
        const n = 1 + 0.05 * this.options.intensity;
        this.targetEl.style.transform = `translate3d(${this.currentX.toFixed(2)}px, ${this.currentY.toFixed(2)}px, 0) scale(${n.toFixed(3)})`;
      }
      Math.abs(this.targetX - this.currentX) + Math.abs(this.targetY - this.currentY) > 0.01 ? this.animFrameId = requestAnimationFrame(e) : (this.isRunning = !1, this.animFrameId = null);
    };
    this.animFrameId = requestAnimationFrame(e);
  }
  destroy() {
    this.disable(), this.targetEl = null;
  }
}
class $e {
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
    const i = (r) => {
      typeof r == "string" ? this.evaluateMessage(r) : r && typeof r.mes == "string" && this.evaluateMessage(r.mes);
    }, n = (r) => {
      const c = typeof r == "string" ? r : r?.chatId || r?.id;
      c && this.evaluateChat(String(c));
    }, s = (r) => {
      const c = typeof r == "string" ? r : r?.name || r?.avatar;
      c && this.evaluateCharacter(String(c));
    }, a = (r, c) => {
      e.on(r, c), this.eventSourceUnlisteners.push(() => {
        typeof e.removeListener == "function" ? e.removeListener(r, c) : typeof e.off == "function" && e.off(r, c);
      });
    };
    t ? (t.MESSAGE_RECEIVED && a(t.MESSAGE_RECEIVED, i), t.CHARACTER_MESSAGE_RENDERED && a(t.CHARACTER_MESSAGE_RENDERED, i), t.CHAT_CHANGED && a(t.CHAT_CHANGED, n), t.CHARACTER_PAGE_LOADED && a(t.CHARACTER_PAGE_LOADED, s)) : (a("message_received", i), a("character_message_rendered", i), a("chat_changed", n));
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
class De {
  ctx = null;
  gainNode = null;
  activeSource = null;
  lfoOsc = null;
  isRunning = !1;
  crackleTimer = null;
  onInteract = null;
  currentOptions = {
    type: "off",
    volume: 0.5
  };
  constructor() {
    this.setupInteractionListener();
  }
  /**
   * A context created before the first user gesture stays suspended; unlike AudioEngine
   * (which recreates its graph on interaction), the ambient context would stay silent for
   * the whole session. Resume it on the first gestures until it is actually running.
   */
  setupInteractionListener() {
    const e = () => {
      this.ctx && (this.ctx.state === "suspended" && this.ctx.resume().catch(() => {
      }), this.ctx.state === "running" && this.teardownInteractionListener());
    };
    this.onInteract = e, window.addEventListener("pointerdown", e, { passive: !0 }), window.addEventListener("keydown", e, { passive: !0 }), window.addEventListener("touchstart", e, { passive: !0 });
  }
  teardownInteractionListener() {
    this.onInteract && (window.removeEventListener("pointerdown", this.onInteract), window.removeEventListener("keydown", this.onInteract), window.removeEventListener("touchstart", this.onInteract), this.onInteract = null);
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
    const t = 2 * e.sampleRate, i = e.createBuffer(1, t, e.sampleRate), n = i.getChannelData(0);
    let s = 0, a = 0, r = 0, c = 0, h = 0, u = 0, p = 0;
    for (let y = 0; y < t; y++) {
      const m = Math.random() * 2 - 1;
      s = 0.99886 * s + m * 0.0555179, a = 0.99332 * a + m * 0.0750759, r = 0.969 * r + m * 0.153852, c = 0.8665 * c + m * 0.3104856, h = 0.55 * h + m * 0.5329522, u = -0.7616 * u - m * 0.016898, n[y] = (s + a + r + c + h + u + p + m * 0.5362) * 0.11, p = m * 0.115926;
    }
    const g = e.createBufferSource();
    g.buffer = i, g.loop = !0;
    const f = e.createBiquadFilter();
    f.type = "lowpass", f.frequency.value = 1200, g.connect(f), f.connect(this.gainNode), g.start(0), this.activeSource = g;
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
    const t = 2 * e.sampleRate, i = e.createBuffer(1, t, e.sampleRate), n = i.getChannelData(0);
    for (let h = 0; h < t; h++)
      n[h] = Math.random() * 2 - 1;
    const s = e.createBufferSource();
    s.buffer = i, s.loop = !0;
    const a = e.createBiquadFilter();
    a.type = "bandpass", a.frequency.value = 400, a.Q.value = 3;
    const r = e.createOscillator();
    r.frequency.value = 0.2;
    const c = e.createGain();
    c.gain.value = 250, r.connect(c), c.connect(a.frequency), s.connect(a), a.connect(this.gainNode), r.start(0), s.start(0), this.lfoOsc = r, this.activeSource = s;
  }
  destroy() {
    this.stop(), this.teardownInteractionListener(), this.ctx && (this.ctx.close().catch(() => {
    }), this.ctx = null), this.gainNode = null;
  }
}
class ze {
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
                background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #121218) calc(var(--st-frosted-opacity, 0.75) * 100%), transparent) !important;
                backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                -webkit-backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.12)) !important;
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
class ne {
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
      ...I,
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
    return I[e] ? (console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${e}"`), !1) : this.userScenes[e] ? (delete this.userScenes[e], !0) : !1;
  }
  applyScene(e) {
    const t = this.getScene(e);
    return t ? (console.log(`[ST-BgLoader SceneManager] Applying scene: "${t.name}"`), this.onApplySceneCallback?.(t), !0) : (console.warn(`[ST-BgLoader SceneManager] Scene "${e}" not found.`), !1);
  }
}
class Ue {
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
const ae = "settings:rev", re = "settings:data", qe = 2e3, Ne = 1e4;
class Ve {
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
      this.pollTimer = window.setInterval(() => void this.pollOnce(), Ne);
    }
  }
  stop() {
    this.pollTimer !== null && window.clearInterval(this.pollTimer), this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pollTimer = null, this.pushTimer = null, this.running = !1;
  }
  schedulePush(e) {
    !this.running || this.applyingRemote || (this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pushTimer = window.setTimeout(() => {
      this.pushTimer = null, this.push(e);
    }, qe));
  }
  async push(e) {
    try {
      const t = JSON.stringify(e), i = await Ge(t);
      if (i === this.lastPushedFingerprint) return;
      const n = this.localRevision + 1, s = {
        revision: n,
        fingerprint: i,
        updatedAt: Date.now(),
        settings: e
      };
      await this.client.storage.kv.set(re, s), await this.client.storage.kv.set(ae, n), this.localRevision = n, this.lastPushedFingerprint = i;
    } catch (t) {
      console.warn("[ST-BgLoader] Failed to push settings to cloud mirror:", t);
    }
  }
  async pollOnce() {
    if (!this.applyingRemote)
      try {
        const e = await this.client.storage.kv.get(ae);
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
    const e = await this.client.storage.kv.get(re);
    if (!e || typeof e != "object") return null;
    const t = e;
    return typeof t.revision != "number" || !t.settings || typeof t.fingerprint != "string" ? null : t;
  }
}
async function Ge(l) {
  try {
    if (crypto?.subtle) {
      const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(l));
      return Array.from(new Uint8Array(t)).map((i) => i.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  let e = 5381;
  for (let t = 0; t < l.length; t++)
    e = (e << 5) + e + l.charCodeAt(t) | 0;
  return "djb2:" + (e >>> 0).toString(16);
}
const oe = "st-bg-loader-settings.json", We = 1, He = 800;
class je {
  saveTimer = null;
  pending = null;
  writing = !1;
  warnedAboutWriteFailure = !1;
  /** Returns the server document, or null when it is missing/unparsable (first run). */
  async load() {
    const e = await ue(oe);
    return !e || typeof e != "object" || !e.settings || typeof e.revision != "number" ? null : e;
  }
  scheduleSave(e, t) {
    this.pending = { settings: e, revision: t }, this.saveTimer !== null && window.clearTimeout(this.saveTimer), this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null, this.flush();
    }, He);
  }
  /** Resolves once every scheduled write has been attempted (test hook). */
  async flush() {
    if (this.saveTimer !== null && (window.clearTimeout(this.saveTimer), this.saveTimer = null), !this.writing) {
      this.writing = !0;
      try {
        for (; this.pending; ) {
          const e = this.pending;
          this.pending = null;
          try {
            await ge(oe, this.toDoc(e)), this.warnedAboutWriteFailure = !1;
          } catch (t) {
            this.warnedAboutWriteFailure || (this.warnedAboutWriteFailure = !0, console.warn("[ST-BgLoader] Server settings write failed; localStorage stays the durable copy:", t));
            break;
          }
        }
      } finally {
        this.writing = !1;
      }
    }
  }
  toDoc(e) {
    return {
      version: We,
      revision: e.revision,
      updatedTimestamp: Date.now(),
      settings: e.settings
    };
  }
}
const le = 3e4, Ke = 2e3, Xe = 5 * 60 * 1e3, Ye = 2 * 60 * 1e3, Je = 15e3;
class ce extends Error {
  constructor() {
    super("Agent tool registration timed out"), this.name = "AgentRegisterTimeoutError";
  }
}
const Qe = [
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
class Ze {
  constructor(e, t, i = () => {
  }) {
    this.client = e, this.host = t, this.reportState = i;
  }
  timer = null;
  registerTimer = null;
  running = !1;
  pendingSubmit = null;
  claimSeq = 0;
  reportedState = null;
  permissionBlockedUntil = 0;
  registerWaitUntil = 0;
  registerInFlight = !1;
  /** Claim calls evaluate the same agent.browser permission — never claim before registration succeeded. */
  registrationOk = !1;
  warnedIssue = !1;
  start() {
    this.running || (this.running = !0, this.permissionBlockedUntil = 0, this.registerWaitUntil = 0, this.register(), this.claimLoop(), this.registerTimer = window.setInterval(() => void this.register(), le));
  }
  stop() {
    this.running = !1, this.timer !== null && window.clearTimeout(this.timer), this.registerTimer !== null && window.clearInterval(this.registerTimer), this.timer = null, this.registerTimer = null, this.reportedState = null, this.registrationOk = !1;
  }
  agentApi() {
    return this.client.agent?.browser ?? null;
  }
  async register() {
    if (!(!this.running || this.registerInFlight) && !(Date.now() < this.permissionBlockedUntil || Date.now() < this.registerWaitUntil)) {
      this.registerInFlight = !0;
      try {
        const e = this.agentApi();
        if (!e) return;
        await this.registerWithTimeout(e), this.permissionBlockedUntil = 0, this.registerWaitUntil = 0, this.registrationOk = !0, this.warnedIssue = !1, this.publishState("ok"), console.log("[ST-BgLoader] Agent ambient tools registered.");
      } catch (e) {
        this.registrationOk = !1, de(e) ? (this.permissionBlockedUntil = Date.now() + Xe, this.publishState("blocked", e instanceof Error ? e.message : String(e)), this.warnOnce("Agent tool registration blocked by permission policy (retrying every 5 min — adjust in Authority Security Center if intended):", e)) : e instanceof ce ? (this.registerWaitUntil = Date.now() + Ye, this.publishState("pending", "等待 agent.browser 授权（若页面出现 Authority 权限弹窗请处理；稍后自动重试）"), this.warnOnce("Agent tool registration is waiting for permission (check the Authority prompt / Security Center):", e)) : console.warn("[ST-BgLoader] Agent tool registration failed (will retry):", e);
      } finally {
        this.registerInFlight = !1;
      }
    }
  }
  warnOnce(e, t) {
    this.warnedIssue ? console.debug(`[ST-BgLoader] ${e}`) : (this.warnedIssue = !0, console.warn(`[ST-BgLoader] ${e}`, t));
  }
  async registerWithTimeout(e) {
    let t;
    const i = new Promise((n, s) => {
      t = window.setTimeout(() => s(new ce()), Je);
    });
    try {
      return await Promise.race([
        e.registerTools({
          browserInstanceId: x,
          leaseDurationMs: le * 2,
          tools: Qe.map((n) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            inputSchema: n.inputSchema,
            riskLevel: "low",
            approvalPolicy: "never",
            mutatesWorkspace: !1
          }))
        }),
        i
      ]);
    } finally {
      t !== void 0 && window.clearTimeout(t);
    }
  }
  publishState(e, t) {
    this.reportedState !== e && (this.reportedState = e, this.reportState(e, t));
  }
  claimLoop() {
    this.running && (this.timer = window.setTimeout(() => {
      this.claimOnce().finally(() => this.claimLoop());
    }, Ke));
  }
  async claimOnce() {
    const e = this.agentApi();
    if (!(!e || !this.running) && this.registrationOk)
      try {
        this.pendingSubmit && (await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, "completed", void 0), this.pendingSubmit = null);
        const t = `stbg-claim-${Date.now()}-${this.claimSeq++}`, n = (await e.claim({ browserInstanceId: x, claimId: t })).invocation;
        if (!n) return;
        let s, a;
        try {
          s = await this.execute(n.toolId, n.arguments);
        } catch (r) {
          a = r instanceof Error ? r.message : String(r);
        }
        if (a) {
          await e.submitResult({
            runId: n.runId,
            callId: n.callId,
            claimId: t,
            browserInstanceId: x,
            status: "failed",
            error: a
          });
          return;
        }
        try {
          await e.submitResult({
            runId: n.runId,
            callId: n.callId,
            claimId: t,
            browserInstanceId: x,
            status: "completed",
            result: s
          });
        } catch {
          this.pendingSubmit = { claimId: t, invocation: { runId: n.runId, callId: n.callId } };
        }
      } catch {
      }
  }
  async reportResult(e, t, i, n) {
    const s = this.agentApi();
    s && await s.submitResult({
      runId: t.runId,
      callId: t.callId,
      claimId: e,
      browserInstanceId: x,
      status: i,
      error: n
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
const D = "st_bgloader_settings", he = "st_bgloader_settings_rev";
class et {
  isInitialized = !1;
  settings = { ...k };
  settingsRevision = 0;
  serverSettings = new je();
  cacheManager;
  audioEngine;
  mediaMount;
  overlaysMounted = !1;
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
  // Lazy: the constructor registers a window keydown listener, so creating a throwaway
  // instance here would leak an orphan listener when init() replaces it.
  shortcutManager = null;
  authorityBridge = new L();
  settingsSync = null;
  agentBridge = null;
  publicApi;
  constructor() {
    this.cacheManager = new _e(), this.audioEngine = new Ee(), this.mediaMount = new Ce(this.audioEngine, (e) => this.mountOverlays(e)), this.atmosphereFX = new Be(), this.audioVisualizer = new Fe(), this.parallaxController = new Oe(), this.triggerManager = new $e(), this.ambientSoundGenerator = new De(), this.frostedGlassController = new ze(), this.sceneManager = new ne(), this.publicApi = new Pe(this);
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
  getServerSettings() {
    return this.serverSettings;
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
    console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), await this.reconcileSettings(), await this.cacheManager.init(this.authorityBridge), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.mountOverlaysIfHostReady(), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.audioEngine.setUrlResolver((s) => this.cacheManager.getMediaBlobUrl(s)), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.audioEngine.onAnalyserReady = (s) => {
      this.audioVisualizer.setAnalyser(s);
    };
    const t = (await this.cacheManager.listMedia()).filter((s) => s.type === "audio");
    this.audioEngine.setPlaylist(t), this.miniPlayer = new Le(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly);
    const i = this.audioEngine.onTrackChange;
    this.audioEngine.onTrackChange = (s) => {
      i?.(s), this.publicApi.emit("track-change", s);
    };
    const n = this.audioEngine.onPlayStateChange;
    if (this.audioEngine.onPlayStateChange = (s) => {
      n?.(s), this.publicApi.emit("play-state-change", s);
    }, this.triggerManager.setRules(this.settings.triggerRules || []), this.triggerManager.setTriggerCallback(async (s, a) => {
      console.log(`[ST-BgLoader] Executing trigger rule: "${a.name}"`), s.mediaIdOrUrl && await this.publicApi.setBackground(s.mediaIdOrUrl), s.bgmUrl && await this.publicApi.playBGM(s.bgmUrl), s.weather && this.publicApi.setWeather(s.weather), s.preset && this.publicApi.applyPreset(s.preset), s.filters && this.publicApi.setFilters(s.filters);
    }), this.sceneManager = new ne(this.settings.scenes || {}, async (s) => {
      if (s.mediaId) {
        const a = await this.cacheManager.getMedia(s.mediaId);
        a && await this.applyMedia(a);
      } else s.mediaUrl && await this.publicApi.setBackground(s.mediaUrl);
      s.bgmUrl && await this.publicApi.playBGM(s.bgmUrl), s.presetId && this.publicApi.applyPreset(s.presetId), s.filters && this.publicApi.setFilters(s.filters), s.weather && this.publicApi.setWeather(s.weather), s.visualizer && this.publicApi.setVisualizer(s.visualizer), s.parallax && this.publicApi.setParallax(s.parallax.enabled, s.parallax.intensity), s.ambientSound && this.publicApi.setAmbientSound(s.ambientSound), typeof s.frostedChat == "boolean" && this.publicApi.setFrostedChat(s.frostedChat);
    }), this.shortcutManager = new Ue({
      onToggleBackground: () => {
        const s = this.mediaMount.getContainerElement();
        s && (s.style.display = s.style.display === "none" ? "block" : "none");
      },
      onTogglePlay: () => {
        this.audioEngine.togglePlay();
      },
      onToggleMuffle: () => {
        const s = this.audioEngine.getMuffled();
        this.publicApi.setMuffled(!s);
      },
      onCycleWeather: () => {
        this.publicApi.cycleWeather();
      },
      onToggleFrostedChat: () => {
        const s = this.settings.frostedChat.enabled;
        this.publicApi.setFrostedChat(!s);
      }
    }), this.shortcutManager?.setEnabled(this.settings.shortcutsEnabled), this.settingsDrawer = new Ae(this.settings, this.cacheManager, {
      onSettingsChanged: (s) => {
        this.settings = s, this.saveSettings(), this.applySettingsToSubsystems();
      },
      onPresetChanged: (s) => {
        this.mediaMount.applyFilters(s.filters), this.publicApi.emit("preset-change", s.id, s.filters);
      },
      onInteractiveChanged: (s) => {
        this.mediaMount.setInteractive(s), this.publicApi.emit("interactive-change", s);
      },
      onMiniPlayerToggle: (s) => {
        this.miniPlayer?.setVisible(s);
      },
      onCapsuleOnPlayToggle: (s) => {
        this.miniPlayer?.setCapsuleOnPlayOnly(s);
      },
      onPlaybackModeChanged: (s) => {
        this.audioEngine.setPlaybackMode(s);
      },
      onWeatherChanged: (s) => {
        this.atmosphereFX.setWeather(s), this.publicApi.emit("weather-change", s);
      },
      onVisualizerChanged: (s) => {
        this.audioVisualizer.setOptions(s), this.publicApi.emit("visualizer-change", s);
      },
      onParallaxChanged: (s) => {
        this.parallaxController.setOptions(s), this.publicApi.emit("parallax-change", s);
      },
      onTransitionChanged: (s, a) => {
        this.mediaMount.setTransition(s, a), this.publicApi.emit("transition-change", s, a);
      },
      onMuffleChanged: (s) => {
        this.audioEngine.setMuffled(s), this.publicApi.emit("muffle-change", s);
      },
      onMediaSelected: async (s) => {
        await this.applyMedia(s);
      },
      onMediaDeleted: async (s) => {
        this.settings.activeMediaId === s && (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings());
        const a = await this.cacheManager.listMedia();
        this.audioEngine.setPlaylist(a.filter((r) => r.type === "audio"));
      },
      onMediaUploaded: async (s) => {
        if (this.settings.lruAutoClean) {
          const a = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(a);
        }
        if (s.type === "audio") {
          const a = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(a.filter((r) => r.type === "audio"));
        }
        await this.applyMedia(s);
      }
    }, this.authorityBridge), this.settingsDrawer.render(), this.nativeAugmenter = new Ie(async (s, a, r) => {
      const c = {
        id: "native_" + r,
        name: r,
        type: a,
        source: "server",
        url: s,
        cacheKey: s,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
      await this.applyMedia(c);
    }), this.nativeAugmenter.start(), document.addEventListener("visibilitychange", () => {
      this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
    }), this.authorityBridge.onCapabilitiesChanged(() => this.settingsDrawer?.updateCloudPanel()), await this.startSettingsSync(), this.syncAgentTools(), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const s = await this.cacheManager.getMedia(this.settings.activeMediaId);
      s && await this.applyMedia(s);
    }
    this.isInitialized = !0, console.log("[ST-BgLoader] All Modular Subsystems fully initialized.");
  }
  async applyMedia(e) {
    this.settings.activeMediaId = e.id, this.saveSettings();
    const t = await this.cacheManager.getMediaBlobUrl(e);
    await this.mediaMount.mountMedia(e, t), this.settingsDrawer && (this.settingsDrawer.refreshMediaGrid(), this.settingsDrawer.updateCacheStats());
  }
  /** Mounted-once guard for the onHostReady callback path (idempotent across late hosts). */
  mountOverlaysIfHostReady() {
    const e = this.mediaMount.getContainerElement();
    e && this.mountOverlays(e);
  }
  mountOverlays(e) {
    if (this.overlaysMounted) return;
    this.overlaysMounted = !0;
    const t = this.mediaMount.getHostElement();
    t && (this.atmosphereFX.mount(t), this.audioVisualizer.mount(t, e)), this.parallaxController.attach(e);
  }
  applySettingsToSubsystems() {
    this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.shortcutManager?.setEnabled(this.settings.shortcutsEnabled), this.triggerManager.setRules(this.settings.triggerRules || []), this.sceneManager.setUserScenes(this.settings.scenes || {}), this.syncAgentTools();
  }
  /** Opt-in Agent Runtime ambient tools (AI director mode); requires the cloud backend. */
  syncAgentTools() {
    const e = this.authorityBridge.getClient(), t = this.settings.agentToolsEnabled && !!e;
    t && !this.agentBridge && e ? (this.agentBridge = new Ze(e, this.buildAgentHost(), (i, n) => {
      this.authorityBridge.reportAgentToolsState(i, n);
    }), this.agentBridge.start(), console.log("[ST-BgLoader] Agent ambient tools enabled.")) : !t && this.agentBridge && (this.agentBridge.stop(), this.agentBridge = null, console.log("[ST-BgLoader] Agent ambient tools disabled."));
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
    e && (this.settingsSync = new Ve(e, (t) => {
      this.settings = t;
      try {
        localStorage.setItem(D, JSON.stringify(this.settings));
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
        const i = this.settings.chatBindings[t], n = await this.cacheManager.getMedia(i);
        if (n) {
          await this.applyMedia(n);
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
      const e = localStorage.getItem(D);
      e && (this.settings = { ...k, ...JSON.parse(e) }), this.settingsRevision = parseInt(localStorage.getItem(he) || "0", 10) || 0;
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...k }, this.settingsRevision = 0;
    }
  }
  /**
   * Merges the localStorage cache with the server settings document before any
   * subsystem is configured: the copy with the higher revision wins (server wins
   * ties). A local copy with no server document yet is uploaded (first-run migration).
   */
  async reconcileSettings() {
    this.loadSettings();
    try {
      const e = await this.serverSettings.load();
      e && e.revision >= this.settingsRevision ? (this.settings = { ...k, ...e.settings }, this.settingsRevision = e.revision, this.persistLocalSettings()) : this.settingsRevision > 0 && this.serverSettings.scheduleSave(this.settings, this.settingsRevision);
    } catch (e) {
      console.warn("[ST-BgLoader] Server settings unavailable, using local settings:", e);
    }
  }
  persistLocalSettings() {
    try {
      localStorage.setItem(D, JSON.stringify(this.settings)), localStorage.setItem(he, String(this.settingsRevision));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
  saveSettings() {
    this.settingsRevision += 1, this.persistLocalSettings(), this.serverSettings.scheduleSave(this.settings, this.settingsRevision), this.settingsSync?.schedulePush(this.settings);
  }
}
const R = new et();
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => R.init()) : R.init();
window.STBgLoader = R;
window.stBgLoader = R.getAPI();
export {
  et as STBgLoaderExtension
};
