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
}, C = {
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
  shortcutsEnabled: !0
}, at = "extension:third-party/ST-BgLoader", j = "st_bgloader_cloud_notice_v1";
class T {
  static EXTENSION_ID = "third-party/ST-BgLoader";
  static CHANNEL = at;
  client = null;
  caps = {
    available: !1,
    cloudLibrary: !1,
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
  async ensureHttpAllowed(t) {
    if (!this.caps.serverFetch || !this.caps.available) return !1;
    const e = t.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
    if (!e || this.httpAllow.includes(e)) return !0;
    this.httpAllow.push(e);
    try {
      return await this.doInit(), this.caps.serverFetch;
    } catch {
      return !1;
    }
  }
  async doInit() {
    try {
      const t = window.STAuthority?.AuthoritySDK;
      return t ? (this.client = await t.init({
        extensionId: T.EXTENSION_ID,
        displayName: "ST-BgLoader",
        version: "1.0.0",
        installType: "local",
        uiLabel: "ST-BgLoader",
        declaredPermissions: {
          storage: { kv: !0, blob: !0 },
          sql: { private: !0 },
          http: { allow: [...this.httpAllow] },
          jobs: { background: ["delay", "sql.backup"] },
          events: { channels: [T.CHANNEL] }
        }
      }), this.caps = {
        available: !0,
        cloudLibrary: !0,
        sync: !0,
        serverFetch: !0,
        agentTools: !0
      }, console.log("[ST-BgLoader] Authority backend connected:", this.client.getSession()), this.caps) : this.degrade("sdk-missing", "未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）");
    } catch (t) {
      const e = t instanceof Error ? t.message : String(t), i = /permission|denied|forbidden/i.test(e);
      return console.warn("[ST-BgLoader] Authority unavailable, falling back to local mode:", e), this.client = null, this.degrade(
        i ? "permission-denied" : "init-failed",
        i ? "Authority 权限被拒绝，媒体库运行于本地模式" : "Authority 连接失败，媒体库运行于本地模式"
      );
    }
  }
  degrade(t, e) {
    return this.caps = {
      available: !1,
      cloudLibrary: !1,
      sync: !1,
      serverFetch: !1,
      agentTools: !1,
      degradedReason: t,
      degradedMessage: e
    }, this.notifyOnce(t, e), this.caps;
  }
  /** One-time silent-degradation notice (user-confirmed strategy): toastr when available, console otherwise. */
  notifyOnce(t, e) {
    console.info(`[ST-BgLoader] ${e} (${t})`);
    try {
      if (localStorage.getItem(j)) return;
      localStorage.setItem(j, (/* @__PURE__ */ new Date()).toISOString());
      const i = window.toastr;
      i?.info(e, "ST-BgLoader");
    } catch {
    }
  }
}
const X = 32768;
function nt(c) {
  let t = "";
  for (let e = 0; e < c.length; e += X)
    t += String.fromCharCode(...c.subarray(e, e + X));
  return btoa(t);
}
function st(c) {
  const t = atob(c), e = new ArrayBuffer(t.length), i = new Uint8Array(e);
  for (let s = 0; s < t.length; s++)
    i[s] = t.charCodeAt(s);
  return i;
}
const rt = "st_bg_loader_db", ot = 1, y = "media_items";
class lt {
  kind = "local";
  db = null;
  async init() {
    this.db || (this.db = await new Promise((t, e) => {
      const i = indexedDB.open(rt, ot);
      i.onupgradeneeded = (s) => {
        const a = s.target.result;
        if (!a.objectStoreNames.contains(y)) {
          const r = a.createObjectStore(y, { keyPath: "id" });
          r.createIndex("type", "type", { unique: !1 }), r.createIndex("lastUsedTimestamp", "lastUsedTimestamp", { unique: !1 });
        }
      }, i.onsuccess = () => t(i.result), i.onerror = () => e(i.error);
    }));
  }
  async listCatalog() {
    return this.db || await this.init(), new Promise((t, e) => {
      const s = this.db.transaction(y, "readonly").objectStore(y).getAll();
      s.onsuccess = () => t(s.result || []), s.onerror = () => e(s.error);
    });
  }
  async getCatalogItem(t) {
    return this.db || await this.init(), new Promise((e, i) => {
      const a = this.db.transaction(y, "readonly").objectStore(y).get(t);
      a.onsuccess = () => e(a.result || null), a.onerror = () => i(a.error);
    });
  }
  async putMedia(t) {
    this.db || await this.init();
    const e = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), i = `/st-bg-cache/${e}/${encodeURIComponent(t.name)}`, s = t.blob.type || z(t.name, t.type), a = {
      id: e,
      name: t.name,
      type: t.type,
      source: t.source,
      url: t.remoteUrl || i,
      cacheKey: i,
      size: t.blob.size,
      mimeType: s,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: t.type === "video" || t.type === "audio"
    };
    return await this.putCacheEntry(i, t.blob, s), await this.putCatalogRow(a), a;
  }
  async deleteMedia(t) {
    const e = await this.getCatalogItem(t);
    if (!e) return;
    await (await caches.open(M)).delete(e.cacheKey), await new Promise((s, a) => {
      const n = this.db.transaction(y, "readwrite").objectStore(y).delete(t);
      n.onsuccess = () => s(), n.onerror = () => a(n.error);
    });
  }
  async readMedia(t) {
    const e = await caches.open(M);
    if (t.size > 0 || t.source !== "url") {
      const i = await e.match(t.cacheKey);
      if (i) return i.blob();
    }
    if (t.source === "url" && t.url)
      try {
        const i = await fetch(t.url);
        if (i.ok)
          return await e.put(t.cacheKey, i.clone()), await i.blob();
      } catch (i) {
        console.warn("[ST-BgLoader] Failed to fetch and cache remote URL:", t.url, i);
      }
    return null;
  }
  async touchMedia(t, e) {
    const i = await this.getCatalogItem(t);
    i && (i.lastUsedTimestamp = e, await this.putCatalogRow(i));
  }
  async findByUrl(t) {
    return (await this.listCatalog()).find((i) => i.url === t || i.cacheKey === t) || null;
  }
  /** LocalOrigin *is* the source of truth, so LRU eviction removes real data (pre-refactor semantics). */
  async evictFromSource(t) {
    await (await caches.open(M)).delete(t);
  }
  async clearCatalog() {
    this.db || await this.init(), await new Promise((t, e) => {
      const s = this.db.transaction(y, "readwrite").objectStore(y).clear();
      s.onsuccess = () => t(), s.onerror = () => e(s.error);
    });
  }
  async putCacheEntry(t, e, i) {
    const s = await caches.open(M), a = new Headers({
      "Content-Type": i,
      "Content-Length": e.size.toString()
    });
    await s.put(t, new Response(e, { headers: a }));
  }
  async putCatalogRow(t) {
    await new Promise((e, i) => {
      const a = this.db.transaction(y, "readwrite").objectStore(y).put(t);
      a.onsuccess = () => e(), a.onerror = () => i(a.error);
    });
  }
}
const M = "st-bg-cache-v1";
function z(c, t) {
  switch (c.split(".").pop()?.toLowerCase()) {
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
const v = "default";
class ct {
  constructor(t) {
    this.client = t;
  }
  kind = "authority";
  touchTimers = /* @__PURE__ */ new Map();
  async init() {
    const t = await this.client.sql.migrate({
      database: v,
      migrations: [
        {
          id: "0001-create-media-items",
          statement: `
                        CREATE TABLE IF NOT EXISTS media_items (
                            id TEXT PRIMARY KEY,
                            blob_id TEXT NOT NULL,
                            name TEXT NOT NULL,
                            type TEXT NOT NULL,
                            source TEXT NOT NULL,
                            remote_url TEXT,
                            size INTEGER NOT NULL,
                            mime_type TEXT NOT NULL,
                            added_timestamp INTEGER NOT NULL,
                            last_used_timestamp INTEGER NOT NULL,
                            has_audio INTEGER NOT NULL DEFAULT 0
                        )
                    `
        },
        {
          id: "0002-media-items-last-used-index",
          statement: "CREATE INDEX IF NOT EXISTS idx_media_items_last_used ON media_items(last_used_timestamp)"
        }
      ]
    });
    console.log("[ST-BgLoader] Authority media catalog ready:", t.applied.length, "applied,", t.skipped.length, "skipped");
  }
  async listCatalog() {
    return (await this.client.sql.query({
      database: v,
      statement: `SELECT id, blob_id, name, type, source, remote_url, size, mime_type,
                        added_timestamp, last_used_timestamp, has_audio
                        FROM media_items ORDER BY last_used_timestamp DESC`
    })).rows.map((e) => B(e));
  }
  async getCatalogItem(t) {
    const e = await this.client.sql.query({
      database: v,
      statement: `SELECT id, blob_id, name, type, source, remote_url, size, mime_type,
                        added_timestamp, last_used_timestamp, has_audio
                        FROM media_items WHERE id = ?`,
      params: [t]
    });
    return e.rows.length > 0 ? B(e.rows[0]) : null;
  }
  async putMedia(t) {
    const e = t.id ?? "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), i = t.blob.type || z(t.name, t.type), s = t.source === "url" && t.blob.size === 0;
    let a = "", r = t.blob.size;
    if (!s) {
      const o = new Uint8Array(await t.blob.arrayBuffer());
      r = o.byteLength, a = (await this.client.storage.blob.put({
        name: `media/${e}/${ht(t.name)}`,
        content: nt(o),
        encoding: "base64",
        contentType: i
      })).id;
    }
    const n = {
      id: e,
      name: t.name,
      type: t.type,
      source: t.source,
      url: t.remoteUrl || a,
      cacheKey: a ? `/st-bg-cache/${a}` : `/st-bg-cache/url/${encodeURIComponent(t.remoteUrl || e)}`,
      size: r,
      mimeType: i,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: t.type === "video" || t.type === "audio"
    };
    return await this.client.sql.exec({
      database: v,
      statement: `INSERT INTO media_items
                        (id, blob_id, name, type, source, remote_url, size, mime_type, added_timestamp, last_used_timestamp, has_audio)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        n.id,
        a,
        n.name,
        n.type,
        n.source,
        t.remoteUrl ?? null,
        n.size,
        n.mimeType,
        n.addedTimestamp,
        n.lastUsedTimestamp,
        n.hasAudio ? 1 : 0
      ]
    }), n;
  }
  async deleteMedia(t) {
    const e = await this.getCatalogItem(t);
    if (!e) return;
    const i = K(e.cacheKey);
    i && await this.client.storage.blob.delete(i), await this.client.sql.exec({
      database: v,
      statement: "DELETE FROM media_items WHERE id = ?",
      params: [t]
    });
  }
  async readMedia(t) {
    const e = await this.getCatalogItem(t.id);
    if (!e) return null;
    const i = K(e.cacheKey);
    if (!i) return null;
    const s = await this.client.storage.blob.get(i), a = st(s.content);
    return new Blob([a], { type: s.record.contentType || e.mimeType });
  }
  async touchMedia(t, e) {
    if (this.touchTimers.get(t) !== void 0) return;
    const s = window.setTimeout(() => {
      this.touchTimers.delete(t), this.client.sql.exec({
        database: v,
        statement: "UPDATE media_items SET last_used_timestamp = ? WHERE id = ?",
        params: [e, t]
      }).catch((a) => console.warn("[ST-BgLoader] Failed to touch media on cloud catalog:", a));
    }, 5e3);
    this.touchTimers.set(t, s);
  }
  async findByUrl(t) {
    const e = await this.client.sql.query({
      database: v,
      statement: `SELECT id, blob_id, name, type, source, remote_url, size, mime_type,
                        added_timestamp, last_used_timestamp, has_audio
                        FROM media_items WHERE remote_url = ?`,
      params: [t]
    });
    return e.rows.length > 0 ? B(e.rows[0]) : null;
  }
}
function ht(c) {
  return (c || "media").replace(/[^a-zA-Z0-9._-]/g, "_");
}
function K(c) {
  if (!c.startsWith("/st-bg-cache/")) return null;
  const t = c.slice(13);
  return !t || t.startsWith("url/") ? null : t;
}
function x(c, t = 0) {
  return typeof c == "number" ? c : Number(c ?? t) || t;
}
function B(c) {
  const t = typeof c.remote_url == "string" ? c.remote_url : null, e = typeof c.blob_id == "string" ? c.blob_id : "";
  return {
    id: String(c.id),
    name: String(c.name),
    type: c.type,
    source: c.source,
    url: t || `/st-bg-cache/${e}`,
    cacheKey: `/st-bg-cache/${e}`,
    size: x(c.size),
    mimeType: String(c.mime_type),
    addedTimestamp: x(c.added_timestamp),
    lastUsedTimestamp: x(c.last_used_timestamp),
    hasAudio: x(c.has_audio) === 1
  };
}
class dt {
  constructor(t) {
    this.bridge = t;
  }
  async import(t) {
    const e = ut(t);
    if (!e)
      throw new Error(`Cannot import from invalid URL: ${t}`);
    if (!await this.bridge.ensureHttpAllowed(e))
      throw new Error(`Server-side import unavailable for host: ${e}`);
    const i = this.bridge.getClient();
    if (!i)
      throw new Error("Authority backend unavailable");
    const s = await i.http.fetch({ url: t, method: "GET" });
    if (!s.ok)
      throw new Error(`Server fetch failed with HTTP ${s.status} for ${t}`);
    const a = st(s.body);
    return new Blob([a], { type: s.contentType || "application/octet-stream" });
  }
}
function ut(c) {
  try {
    return new URL(c).hostname;
  } catch {
    return null;
  }
}
class gt {
  origin;
  localOrigin;
  authorityOrigin = null;
  bridge = null;
  remoteImporter = null;
  l1 = null;
  objectUrls = /* @__PURE__ */ new Map();
  constructor() {
    this.localOrigin = new lt(), this.origin = this.localOrigin;
  }
  async init(t) {
    if ("caches" in window && (this.l1 = await caches.open("st-bg-cache-v1")), t) {
      this.bridge = t;
      const e = await t.detectAndInit(), i = t.getClient();
      if (e.available && i) {
        this.authorityOrigin = new ct(i);
        try {
          await this.authorityOrigin.init(), this.origin = this.authorityOrigin, this.remoteImporter = new dt(t), console.log("[ST-BgLoader] Media library source of truth: Authority backend (cloud).");
        } catch (s) {
          this.authorityOrigin = null, console.warn("[ST-BgLoader] Cloud catalog unavailable, using local source of truth:", s);
        }
      }
    }
    this.origin === this.localOrigin && console.log("[ST-BgLoader] Media library source of truth: this browser (local mode)."), await this.origin.init();
  }
  isCloudBacked() {
    return this.origin.kind === "authority";
  }
  /** Exposed for the one-time local->cloud migration and diagnostics. */
  getLocalOrigin() {
    return this.localOrigin;
  }
  /** Null when the Authority backend is unavailable. */
  getAuthorityOrigin() {
    return this.authorityOrigin;
  }
  async listMedia() {
    return this.origin.listCatalog();
  }
  async getMedia(t) {
    return this.origin.getCatalogItem(t);
  }
  async saveMedia(t, e, i, s, a) {
    const r = typeof t == "string" ? new Blob([t], { type: i === "svg" ? "image/svg+xml" : "text/html" }) : t, n = { blob: r, name: e, type: i, source: s, remoteUrl: a }, o = await this.origin.putMedia(n);
    return this.origin.kind === "authority" && this.l1 && r.size > 0 && await this.l1.put(o.cacheKey, new Response(r, {
      headers: { "Content-Type": o.mimeType }
    })), o;
  }
  async getMediaBlobUrl(t) {
    const e = this.objectUrls.get(t.id);
    if (e)
      return this.touchMedia(t.id), e;
    let i = null;
    if (this.origin.kind === "authority" && this.l1) {
      const s = await this.l1.match(t.cacheKey);
      s && (i = await s.blob());
    }
    if (i || (i = await this.origin.readMedia(t), i && this.origin.kind === "authority" && this.l1 && await this.l1.put(t.cacheKey, new Response(i, {
      headers: { "Content-Type": i.type || t.mimeType }
    }))), i) {
      const s = URL.createObjectURL(i);
      return this.objectUrls.set(t.id, s), this.touchMedia(t.id), s;
    }
    return t.url;
  }
  async touchMedia(t) {
    await this.origin.touchMedia(t, Date.now());
  }
  async deleteMedia(t) {
    const e = await this.getMedia(t);
    await this.origin.deleteMedia(t), e && (this.objectUrls.has(t) && (URL.revokeObjectURL(this.objectUrls.get(t)), this.objectUrls.delete(t)), this.origin.kind === "authority" && this.l1 && await this.l1.delete(e.cacheKey));
  }
  async getCacheUsage() {
    const t = await this.listMedia();
    let e = 0;
    for (const i of t)
      e += i.size || 0;
    return { usedBytes: e, itemCount: t.length };
  }
  async cleanLRU(t) {
    const e = await this.listMedia();
    let i = e.reduce((s, a) => s + (a.size || 0), 0);
    if (!(i <= t)) {
      e.sort((s, a) => s.lastUsedTimestamp - a.lastUsedTimestamp);
      for (const s of e) {
        if (i <= t) break;
        this.origin.kind === "authority" ? (this.l1 && await this.l1.delete(s.cacheKey), this.objectUrls.has(s.id) && (URL.revokeObjectURL(this.objectUrls.get(s.id)), this.objectUrls.delete(s.id))) : await this.origin.deleteMedia(s.id), i -= s.size || 0;
      }
    }
  }
  async clearAll() {
    for (const t of this.objectUrls.values())
      URL.revokeObjectURL(t);
    if (this.objectUrls.clear(), this.origin.kind === "authority") {
      const t = await this.listMedia();
      for (const e of t)
        await this.origin.deleteMedia(e.id);
      this.l1 && "caches" in window && (await caches.delete("st-bg-cache-v1"), this.l1 = await caches.open("st-bg-cache-v1"));
      return;
    }
    this.l1 && "caches" in window && (await caches.delete("st-bg-cache-v1"), this.l1 = await caches.open("st-bg-cache-v1")), await this.localOrigin.clearCatalog();
  }
  async preloadUrl(t, e) {
    const i = await this.origin.findByUrl(t);
    if (i)
      return await this.touchMedia(i.id), { item: i, isNew: !1 };
    const s = t.split("/").pop()?.split("?")[0] || "preloaded_media", a = e || this.detectMediaType(s);
    let r = null;
    try {
      const o = await fetch(t);
      if (!o.ok)
        throw new Error(`Failed to fetch media from ${t}: ${o.status} ${o.statusText}`);
      r = await o.blob();
    } catch (o) {
      if (this.remoteImporter)
        console.warn("[ST-BgLoader] Direct fetch failed, importing through the Authority server:", o), r = await this.remoteImporter.import(t);
      else
        throw o;
    }
    const n = await this.origin.putMedia({ blob: r, name: s, type: a, source: "url", remoteUrl: t });
    return this.origin.kind === "authority" && this.l1 && r.size > 0 && await this.l1.put(n.cacheKey, new Response(r, {
      headers: { "Content-Type": n.mimeType }
    })), { item: n, isNew: !0 };
  }
  detectMediaType(t) {
    const e = t.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(e) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(e) ? "audio" : e === "html" || e === "htm" ? "html" : e === "svg" ? "svg" : "image";
  }
  getMimeType(t, e) {
    return z(t, e);
  }
}
class pt {
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
  setUrlResolver(t) {
    this.urlResolver = t;
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
        const t = window.AudioContext || window.webkitAudioContext;
        if (!t) return;
        this.audioContext = new t(), this.audioElement.crossOrigin = "anonymous", this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement), this.biquadFilter = this.audioContext.createBiquadFilter(), this.biquadFilter.type = "lowpass", this.biquadFilter.frequency.value = this.isMuffled ? 800 : 2e4, this.biquadFilter.Q.value = 1, this.analyserNode = this.audioContext.createAnalyser(), this.analyserNode.fftSize = 256, this.sourceNode.connect(this.biquadFilter), this.biquadFilter.connect(this.analyserNode), this.analyserNode.connect(this.audioContext.destination), this.onAnalyserReady && this.onAnalyserReady(this.analyserNode);
      } catch (t) {
        console.warn("[ST-BgLoader AudioEngine] WebAudio graph init note (falling back to direct output):", t);
      }
  }
  getAnalyserNode() {
    return this.analyserNode;
  }
  setMuffled(t) {
    if (this.isMuffled = t, this.biquadFilter && this.audioContext) {
      const e = t ? 800 : 2e4, i = this.audioContext.currentTime;
      this.biquadFilter.frequency.cancelScheduledValues(i), this.biquadFilter.frequency.setTargetAtTime(e, i, 0.08);
    }
  }
  getMuffled() {
    return this.isMuffled;
  }
  async playMediaItem(t, e) {
    const i = this.playlist.findIndex((a) => a.id === t.id);
    i !== -1 ? this.currentIndex = i : (this.playlist.push(t), this.currentIndex = this.playlist.length - 1);
    const s = e || (this.urlResolver ? await this.urlResolver(t) : t.url);
    await this.playTrack(s, this.playbackMode === "single"), this.onTrackChange?.(t);
  }
  async playCurrentTrack() {
    const t = this.getCurrentTrack();
    if (!t || !this.audioElement) return;
    this.clearFade();
    const e = this.urlResolver ? await this.urlResolver(t) : t.url;
    this.audioElement.src = e, this.audioElement.loop = this.playbackMode === "single", !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
    try {
      this.initWebAudio(), this.resumeAudioContext(), await this.audioElement.play(), this.onTrackChange?.(t);
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
    const t = () => {
      this.notifyUserInteraction(), window.removeEventListener("pointerdown", t), window.removeEventListener("keydown", t), window.removeEventListener("touchstart", t);
    };
    window.addEventListener("pointerdown", t, { passive: !0, once: !0 }), window.addEventListener("keydown", t, { passive: !0, once: !0 }), window.addEventListener("touchstart", t, { passive: !0, once: !0 });
  }
  setVolume(t) {
    this.volume = Math.max(0, Math.min(1, t)), this.applyVolume();
  }
  setMuted(t) {
    this.muted = t, this.applyVolume();
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
  setPlaybackMode(t) {
    this.playbackMode = t, this.audioElement && (this.audioElement.loop = t === "single");
  }
  getPlaybackMode() {
    return this.playbackMode;
  }
  setPlaylist(t, e = !1) {
    this.playlist = t, this.playlist.length > 0 && this.currentIndex === -1 && (this.currentIndex = 0, e && this.playCurrentTrack());
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
        let t = Math.floor(Math.random() * this.playlist.length);
        this.playlist.length > 1 && t === this.currentIndex && (t = (t + 1) % this.playlist.length), this.currentIndex = t;
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
    this.playbackMode !== "single" && this.playlist.length > 1 && this.playNext().catch((t) => console.error(t));
  }
  attachVideo(t) {
    this.attachedVideo = t, this.attachedVideo && this.applyVolume();
  }
  async playTrack(t, e = !0) {
    if (this.audioElement) {
      this.clearFade(), this.audioElement.src = t, this.audioElement.loop = e, !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
      try {
        this.initWebAudio(), this.resumeAudioContext(), await this.audioElement.play();
      } catch (i) {
        console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", i);
      }
    }
  }
  fadeInVolume(t, e = 400) {
    this.clearFade();
    const i = performance.now(), s = Math.max(0, Math.min(1, t));
    this.audioElement && (this.audioElement.muted = !1, this.audioElement.volume = 0), this.attachedVideo && (this.attachedVideo.muted = !1, this.attachedVideo.volume = 0);
    const a = () => {
      const r = performance.now() - i, n = Math.min(1, r / e), o = s * n;
      this.audioElement && (this.audioElement.volume = o), this.attachedVideo && (this.attachedVideo.volume = o), n < 1 ? this.fadeTimer = requestAnimationFrame(a) : this.applyVolume();
    };
    this.fadeTimer = requestAnimationFrame(a);
  }
  stopTrack(t = 300) {
    if (!this.audioElement || this.audioElement.paused) return;
    if (t <= 0) {
      this.audioElement.pause(), this.audioElement.currentTime = 0;
      return;
    }
    const e = this.audioElement.volume, i = performance.now(), s = () => {
      const a = performance.now() - i, r = Math.min(1, a / t);
      this.audioElement && (this.audioElement.volume = e * (1 - r)), r < 1 ? this.fadeTimer = requestAnimationFrame(s) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
    };
    this.clearFade(), this.fadeTimer = requestAnimationFrame(s);
  }
  handleVisibilityChange(t, e) {
    e && (t ? (this.audioElement && !this.audioElement.paused && (this.audioElement.pause(), this.isPausedForBlur = !0), this.attachedVideo && !this.attachedVideo.paused && this.attachedVideo.pause()) : (this.isPausedForBlur && this.audioElement && (this.audioElement.play().catch(() => {
    }), this.isPausedForBlur = !1), this.attachedVideo && this.attachedVideo.play().catch(() => {
    })));
  }
  applyVolume() {
    const t = this.muted ? 0 : this.volume;
    this.audioElement && (this.audioElement.volume = t, this.audioElement.muted = this.muted), this.attachedVideo && (this.attachedVideo.volume = t, this.attachedVideo.muted = this.muted);
  }
  clearFade() {
    this.fadeTimer !== null && (cancelAnimationFrame(this.fadeTimer), this.fadeTimer = null);
  }
  destroy() {
    this.clearFade(), this.audioElement && (this.audioElement.pause(), this.audioElement.src = "", this.audioElement = null), this.audioContext && (this.audioContext.close().catch(() => {
    }), this.audioContext = null), this.attachedVideo = null, this.playlist = [];
  }
}
class Y {
  videoElement = null;
  container;
  audioEngine;
  constructor(t, e) {
    this.container = t, this.audioEngine = e;
  }
  async render(t, e = "cover") {
    this.destroy();
    const i = document.createElement("video");
    return i.className = "st-bg-video-element", i.src = t, i.loop = !0, i.playsInline = !0, i.autoplay = !0, this.applyFitting(i, e), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.transform = "translateZ(0)", i.style.willChange = "transform", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.videoElement = i, this.audioEngine.attachVideo(i), new Promise((s) => {
      const a = async () => {
        i.removeEventListener("canplay", a);
        try {
          await i.play();
        } catch (r) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", r), i.muted = !0, i.play().catch((n) => console.error("[ST-BgLoader] Video playback error:", n));
        }
        i.style.opacity = "1", s(i);
      };
      i.addEventListener("canplay", a), i.addEventListener("error", (r) => {
        console.error("[ST-BgLoader] Error loading video:", r), s(i);
      });
    });
  }
  applyFitting(t, e) {
    switch (e) {
      case "contain":
        t.style.objectFit = "contain";
        break;
      case "stretch":
        t.style.objectFit = "fill";
        break;
      case "center":
        t.style.objectFit = "none";
        break;
      case "cover":
      default:
        t.style.objectFit = "cover";
        break;
    }
  }
  destroy() {
    this.videoElement && (this.audioEngine.attachVideo(null), this.videoElement.pause(), this.videoElement.removeAttribute("src"), this.videoElement.load(), this.videoElement.remove(), this.videoElement = null);
  }
}
class J {
  iframeElement = null;
  container;
  constructor(t) {
    this.container = t;
  }
  async render(t, e = !1) {
    this.destroy();
    const i = document.createElement("iframe");
    return i.className = "st-bg-iframe-element", i.setAttribute("sandbox", "allow-scripts allow-same-origin"), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.border = "none", i.style.opacity = "0", i.style.pointerEvents = "auto", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.iframeElement = i, new Promise((s) => {
      i.onload = () => {
        i.style.opacity = "1", s(i);
      }, e ? i.src = t : i.srcdoc = t;
    });
  }
  postMessage(t) {
    this.iframeElement && this.iframeElement.contentWindow && this.iframeElement.contentWindow.postMessage(t, "*");
  }
  destroy() {
    this.iframeElement && (this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement.remove(), this.iframeElement = null);
  }
}
class Q {
  imageElement = null;
  container;
  constructor(t) {
    this.container = t;
  }
  async render(t, e = "cover") {
    this.destroy();
    const i = document.createElement("img");
    return i.className = "st-bg-image-element", i.src = t, this.applyFitting(i, e), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.imageElement = i, new Promise((s) => {
      i.onload = () => {
        i.style.opacity = "1", s(i);
      }, i.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", t), s(i);
      };
    });
  }
  applyFitting(t, e) {
    switch (e) {
      case "contain":
        t.style.objectFit = "contain";
        break;
      case "stretch":
        t.style.objectFit = "fill";
        break;
      case "center":
        t.style.objectFit = "none";
        break;
      case "cover":
      default:
        t.style.objectFit = "cover";
        break;
    }
  }
  destroy() {
    this.imageElement && (this.imageElement.remove(), this.imageElement = null);
  }
}
class mt {
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
  constructor(t) {
    this.audioEngine = t;
  }
  setTransition(t, e = 400) {
    this.transitionType = t, this.transitionDurationMs = Math.max(100, Math.min(2e3, e));
  }
  getContainerElement() {
    return this.containerEl;
  }
  getHostElement() {
    return this.hostEl;
  }
  init() {
    if (this.hostEl = document.querySelector("#bg1"), !this.hostEl) {
      const t = new MutationObserver(() => {
        const e = document.querySelector("#bg1");
        e && (t.disconnect(), this.hostEl = e, this.setupContainer());
      });
      t.observe(document.body, { childList: !0, subtree: !0 });
      return;
    }
    this.setupContainer();
  }
  setupContainer() {
    if (!this.hostEl) return;
    window.getComputedStyle(this.hostEl).position === "static" && (this.hostEl.style.position = "relative");
    let e = this.hostEl.querySelector(".st-bg-media-container");
    e ? (this.layerA = e.querySelector(".st-bg-layer-a"), this.layerB = e.querySelector(".st-bg-layer-b")) : (e = document.createElement("div"), e.className = "st-bg-media-container", e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%", e.style.overflow = "hidden", e.style.zIndex = "0", e.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), e.appendChild(this.layerA), e.appendChild(this.layerB), this.hostEl.appendChild(e)), this.containerEl = e, this.videoRendererA = new Y(this.layerA, this.audioEngine), this.videoRendererB = new Y(this.layerB, this.audioEngine), this.iframeRendererA = new J(this.layerA), this.iframeRendererB = new J(this.layerB), this.imageRendererA = new Q(this.layerA), this.imageRendererB = new Q(this.layerB), this.observer = new MutationObserver(() => this.syncFitting()), this.observer.observe(this.hostEl, { attributes: !0, attributeFilter: ["class"] }), this.syncFitting();
  }
  setupLayerStyle(t) {
    t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.opacity = "0", t.style.transition = `all ${this.transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`, t.style.pointerEvents = "none";
  }
  applyFilters(t) {
    if (!this.containerEl) return;
    const e = `blur(${t.blur}px) brightness(${t.brightness}%) opacity(${t.opacity}%) saturate(${t.saturate}%)`;
    this.containerEl.style.filter = e;
  }
  setInteractive(t) {
    const e = t ? "auto" : "none";
    this.containerEl && (this.containerEl.style.pointerEvents = e), this.layerA && (this.layerA.style.pointerEvents = e), this.layerB && (this.layerB.style.pointerEvents = e);
  }
  getFitting() {
    return this.hostEl ? this.hostEl.classList.contains("contain") ? "contain" : this.hostEl.classList.contains("stretch") ? "stretch" : this.hostEl.classList.contains("center") ? "center" : "cover" : "cover";
  }
  syncFitting() {
  }
  async mountMedia(t, e) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null;
      const p = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, f = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, b = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      p.destroy(), f.destroy(), b.destroy();
      const m = this.activeLayer === "A" ? this.layerB : this.layerA;
      m && (m.style.opacity = "0", m.style.transform = "none", m.style.filter = "none");
    }
    const i = this.activeLayer === "A" ? "B" : "A", s = i === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, r = i === "B" ? this.videoRendererB : this.videoRendererA, n = i === "B" ? this.iframeRendererB : this.iframeRendererA, o = i === "B" ? this.imageRendererB : this.imageRendererA;
    r.destroy(), n.destroy(), o.destroy();
    const d = this.getFitting();
    switch (t.type) {
      case "video":
        await r.render(e, d);
        break;
      case "html":
      case "svg":
        await n.render(e, !0);
        break;
      case "image":
        await o.render(e, d);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(t, e);
        break;
    }
    const h = this.transitionDurationMs;
    s.style.transition = `all ${h}ms cubic-bezier(0.4, 0, 0.2, 1)`, a.style.transition = `all ${h}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const g = this.transitionType;
    g === "zoom_fade" ? (s.style.transform = "scale(1.06)", s.style.opacity = "0", s.offsetHeight, s.style.transform = "scale(1)", s.style.opacity = "1", a.style.transform = "scale(0.96)", a.style.opacity = "0") : g === "blur_fade" ? (s.style.filter = "blur(10px)", s.style.opacity = "0", s.offsetHeight, s.style.filter = "blur(0px)", s.style.opacity = "1", a.style.filter = "blur(10px)", a.style.opacity = "0") : g === "slide_left" ? (s.style.transform = "translate3d(100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(-100%, 0, 0)", a.style.opacity = "0") : g === "slide_right" ? (s.style.transform = "translate3d(-100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(100%, 0, 0)", a.style.opacity = "0") : (s.style.transform = "none", s.style.filter = "none", s.style.opacity = "1", a.style.transform = "none", a.style.filter = "none", a.style.opacity = "0"), this.activeLayer = i, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const p = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, f = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, b = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      p.destroy(), f.destroy(), b.destroy(), a.style.transform = "none", a.style.filter = "none";
    }, h + 50);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0", this.layerA.style.transform = "none", this.layerA.style.filter = "none"), this.layerB && (this.layerB.style.opacity = "0", this.layerB.style.transform = "none", this.layerB.style.filter = "none"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
class ft {
  container = null;
  settings;
  cacheManager;
  callbacks;
  constructor(t, e, i) {
    this.settings = t, this.cacheManager = e, this.callbacks = i;
  }
  /** Replace the drawer's settings copy with a remotely synced one and re-render the panel. */
  applyRemoteSettings(t) {
    this.settings = t, this.render();
  }
  render() {
    const t = document.querySelector("#extensions_settings");
    if (!t) {
      console.warn("[ST-BgLoader] #extensions_settings not found yet, waiting for DOM insertion...");
      const s = new MutationObserver(() => {
        document.querySelector("#extensions_settings") && (s.disconnect(), this.render());
      });
      s.observe(document.body, { childList: !0, subtree: !0 });
      return;
    }
    const e = document.querySelector("#st_bgloader_settings");
    e && e.remove();
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

                </div>
            </div>
        `, t.appendChild(i), this.container = i, this.bindEvents(), this.populatePresets(), this.populateScenes(), this.refreshMediaGrid(), this.refreshTriggerList(), this.updateCacheStats();
  }
  populateScenes() {
    const t = this.container?.querySelector("#st_scene_select");
    t && (t.innerHTML = "", Object.values(C).forEach((e) => {
      const i = document.createElement("option");
      i.value = e.id, i.textContent = e.name, e.id === this.settings.activeSceneId && (i.selected = !0), t.appendChild(i);
    }), Object.entries(this.settings.scenes || {}).forEach(([e, i]) => {
      const s = document.createElement("option");
      s.value = e, s.textContent = `★ ${i.name} (Custom)`, e === this.settings.activeSceneId && (s.selected = !0), t.appendChild(s);
    }));
  }
  populatePresets() {
    const t = this.container?.querySelector("#st_preset_select");
    t && (t.innerHTML = "", Object.values(E).forEach((e) => {
      const i = document.createElement("option");
      i.value = e.id, i.textContent = e.name, e.id === this.settings.activePresetId && (i.selected = !0), t.appendChild(i);
    }), Object.entries(this.settings.userPresets || {}).forEach(([e, i]) => {
      const s = document.createElement("option");
      s.value = e, s.textContent = `★ ${e} (Custom)`, e === this.settings.activePresetId && (s.selected = !0), t.appendChild(s);
    }));
  }
  bindEvents() {
    if (!this.container) return;
    const t = this.container.querySelector(".inline-drawer-toggle"), e = this.container.querySelector(".inline-drawer-content"), i = this.container.querySelector(".inline-drawer-icon");
    t?.addEventListener("click", () => {
      const l = e.style.display === "none";
      e.style.display = l ? "flex" : "none", i && (i.classList.toggle("down", l), i.classList.toggle("up", !l));
    });
    const s = this.container.querySelector("#st_bgloader_dropzone"), a = this.container.querySelector("#st_bgloader_file_input");
    s?.addEventListener("click", () => a?.click()), a?.addEventListener("change", async () => {
      a.files && a.files.length > 0 && (await this.handleFileUpload(a.files[0]), a.value = "");
    }), s?.addEventListener("dragover", (l) => {
      l.preventDefault(), s.classList.add("dragover");
    }), s?.addEventListener("dragleave", () => s.classList.remove("dragover")), s?.addEventListener("drop", async (l) => {
      const u = l;
      u.preventDefault(), s.classList.remove("dragover"), u.dataTransfer?.files && u.dataTransfer.files.length > 0 && await this.handleFileUpload(u.dataTransfer.files[0]);
    });
    const r = this.container.querySelector("#st_bgloader_url_input");
    this.container.querySelector("#st_bgloader_url_btn")?.addEventListener("click", async () => {
      const l = r.value.trim();
      l && (await this.handleUrlImport(l), r.value = "");
    });
    const o = this.container.querySelector("#st_scene_select");
    this.container.querySelector("#st_scene_apply_btn")?.addEventListener("click", () => {
      const l = o?.value;
      l && (this.settings.activeSceneId = l, this.callbacks.onSceneApplied?.(l), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_scene_save_btn")?.addEventListener("click", () => {
      const l = prompt("Enter a name for this custom audiovisual scene:");
      if (l && l.trim()) {
        const u = `scene_${Date.now()}`, S = {
          id: u,
          name: l.trim(),
          mediaId: this.settings.activeMediaId || void 0,
          presetId: this.settings.activePresetId,
          filters: { ...this.settings.filters },
          weather: { ...this.settings.weather },
          visualizer: { ...this.settings.visualizer },
          parallax: { ...this.settings.parallax },
          ambientSound: { ...this.settings.ambientSound },
          frostedChat: this.settings.frostedChat.enabled
        };
        this.settings.scenes[u] = S, this.settings.activeSceneId = u, this.populateScenes(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_scene_del_btn")?.addEventListener("click", () => {
      const l = o?.value;
      if (C[l]) {
        alert("Cannot delete built-in scenes.");
        return;
      }
      this.settings.scenes[l] && confirm(`Delete custom scene "${this.settings.scenes[l].name}"?`) && (delete this.settings.scenes[l], this.settings.activeSceneId = "cyber_rain", this.populateScenes(), this.callbacks.onSettingsChanged(this.settings));
    });
    const d = this.container.querySelector("#st_preset_select");
    d?.addEventListener("change", () => {
      const l = d.value;
      this.settings.activePresetId = l;
      let u = E[l]?.filters;
      !u && this.settings.userPresets[l] && (u = this.settings.userPresets[l]), u && (this.settings.filters = { ...u }, this.updateSliders(u), this.callbacks.onPresetChanged({ id: l, name: l, filters: u }), this.callbacks.onSettingsChanged(this.settings));
    }), this.container.querySelector("#st_preset_save_btn")?.addEventListener("click", () => {
      const l = prompt("Enter a name for this custom preset:");
      if (l && l.trim()) {
        const u = l.trim();
        this.settings.userPresets[u] = { ...this.settings.filters }, this.settings.activePresetId = u, this.populatePresets(), this.callbacks.onSettingsChanged(this.settings);
      }
    }), this.container.querySelector("#st_preset_del_btn")?.addEventListener("click", () => {
      const l = d.value;
      if (this.settings.userPresets[l]) {
        if (confirm(`Delete custom preset "${l}"?`)) {
          delete this.settings.userPresets[l], this.settings.activePresetId = "default", this.populatePresets();
          const u = E.default.filters;
          this.settings.filters = { ...u }, this.updateSliders(u), this.callbacks.onPresetChanged(E.default), this.callbacks.onSettingsChanged(this.settings);
        }
      } else
        alert("Cannot delete built-in presets.");
    });
    const h = (l, u, S, _) => {
      const G = this.container.querySelector(l), W = this.container.querySelector(u);
      G?.addEventListener("input", () => {
        const H = Number(G.value);
        W && (W.textContent = `${H}${S}`), _(H), this.callbacks.onSettingsChanged(this.settings);
      });
    };
    h("#st_filter_blur", "#st_filter_blur_val", "px", (l) => this.settings.filters.blur = l), h("#st_filter_brightness", "#st_filter_brightness_val", "%", (l) => this.settings.filters.brightness = l), h("#st_filter_opacity", "#st_filter_opacity_val", "%", (l) => this.settings.filters.opacity = l), h("#st_filter_saturate", "#st_filter_saturate_val", "%", (l) => this.settings.filters.saturate = l);
    const g = this.container.querySelector("#st_weather_type");
    g?.addEventListener("change", () => {
      this.settings.weather.type = g.value, this.callbacks.onWeatherChanged?.(this.settings.weather), this.callbacks.onSettingsChanged(this.settings);
    });
    const p = this.container.querySelector("#st_weather_density");
    p?.addEventListener("change", () => {
      this.settings.weather.density = p.value, this.callbacks.onWeatherChanged?.(this.settings.weather), this.callbacks.onSettingsChanged(this.settings);
    }), h("#st_weather_speed", "#st_weather_speed_val", "x", (l) => {
      this.settings.weather.speed = l / 10, this.callbacks.onWeatherChanged?.(this.settings.weather);
    }), h("#st_weather_opacity", "#st_weather_opacity_val", "%", (l) => {
      this.settings.weather.opacity = l / 100, this.callbacks.onWeatherChanged?.(this.settings.weather);
    });
    const f = this.container.querySelector("#st_visualizer_mode");
    f?.addEventListener("change", () => {
      this.settings.visualizer.mode = f.value, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.callbacks.onSettingsChanged(this.settings);
    }), h("#st_visualizer_sens", "#st_visualizer_sens_val", "x", (l) => {
      this.settings.visualizer.sensitivity = l / 10, this.callbacks.onVisualizerChanged?.(this.settings.visualizer);
    });
    const b = this.container.querySelector("#st_parallax_enabled");
    b?.addEventListener("change", () => {
      this.settings.parallax.enabled = b.checked, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.callbacks.onSettingsChanged(this.settings);
    }), h("#st_parallax_intensity", "#st_parallax_intensity_val", "", (l) => {
      this.settings.parallax.intensity = l / 10, this.callbacks.onParallaxChanged?.(this.settings.parallax);
    });
    const m = this.container.querySelector("#st_ambient_type");
    m?.addEventListener("change", () => {
      this.settings.ambientSound.type = m.value, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.callbacks.onSettingsChanged(this.settings);
    }), h("#st_ambient_vol", "#st_ambient_vol_val", "%", (l) => {
      this.settings.ambientSound.volume = l / 100, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound);
    });
    const $ = this.container.querySelector("#st_frosted_enabled");
    $?.addEventListener("change", () => {
      this.settings.frostedChat.enabled = $.checked, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.callbacks.onSettingsChanged(this.settings);
    }), h("#st_frosted_blur", "#st_frosted_blur_val", "px", (l) => {
      this.settings.frostedChat.blur = l, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
    }), h("#st_frosted_opacity", "#st_frosted_opacity_val", "%", (l) => {
      this.settings.frostedChat.opacity = l, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat);
    });
    const N = this.container.querySelector("#st_transition_effect");
    N?.addEventListener("change", () => {
      this.settings.transitionEffect = N.value, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.callbacks.onSettingsChanged(this.settings);
    }), h("#st_transition_dur", "#st_transition_dur_val", "ms", (l) => {
      this.settings.transitionDurationMs = l, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs);
    }), h("#st_audio_volume", "#st_audio_volume_val", "%", (l) => this.settings.volume = l / 100);
    const U = this.container.querySelector("#st_playback_mode");
    U?.addEventListener("change", () => {
      this.settings.playbackMode = U.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.callbacks.onSettingsChanged(this.settings);
    });
    const q = this.container.querySelector("#st_audio_mute");
    q?.addEventListener("change", () => {
      this.settings.muted = q.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const A = this.container.querySelector("#st_audio_muffle");
    A?.addEventListener("change", () => {
      this.settings.muffleBGM = A.checked, this.callbacks.onMuffleChanged?.(A.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const D = this.container.querySelector("#st_audio_blur");
    D?.addEventListener("change", () => {
      this.settings.pauseOnBlur = D.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const V = this.container.querySelector("#st_shortcuts_enabled");
    V?.addEventListener("change", () => {
      this.settings.shortcutsEnabled = V.checked, this.callbacks.onSettingsChanged(this.settings);
    });
    const L = this.container.querySelector("#st_bg_interactive");
    L?.addEventListener("change", () => {
      this.settings.interactiveBackground = L.checked, this.callbacks.onInteractiveChanged(L.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const I = this.container.querySelector("#st_mini_player_toggle");
    I?.addEventListener("change", () => {
      this.settings.showMiniPlayer = I.checked, this.callbacks.onMiniPlayerToggle(I.checked), this.callbacks.onSettingsChanged(this.settings);
    });
    const R = this.container.querySelector("#st_capsule_on_play");
    R?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = R.checked, this.callbacks.onCapsuleOnPlayToggle?.(R.checked), this.callbacks.onSettingsChanged(this.settings);
    }), this.container.querySelector("#st_trigger_add_btn")?.addEventListener("click", () => {
      this.promptAddTriggerRule();
    }), this.container.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      confirm("Are you sure you want to clear all cached media files?") && (await this.cacheManager.clearAll(), await this.refreshMediaGrid(), await this.updateCacheStats());
    }), this.container.querySelector("#st_backup_export_btn")?.addEventListener("click", () => {
      const l = JSON.stringify(this.settings, null, 2), u = new Blob([l], { type: "application/json" }), S = URL.createObjectURL(u), _ = document.createElement("a");
      _.href = S, _.download = `st-bgloader-settings-${Date.now()}.json`, _.click(), URL.revokeObjectURL(S);
    });
    const w = this.container.querySelector("#st_backup_import_file");
    this.container.querySelector("#st_backup_import_btn")?.addEventListener("click", () => {
      w?.click();
    }), w?.addEventListener("change", async () => {
      if (w.files && w.files[0]) {
        try {
          const l = await w.files[0].text(), u = JSON.parse(l);
          u && typeof u == "object" && (this.settings = { ...this.settings, ...u }, this.callbacks.onSettingsChanged(this.settings), this.render(), alert("Settings successfully imported!"));
        } catch (l) {
          alert(`Failed to import settings JSON: ${l}`);
        }
        w.value = "";
      }
    });
  }
  promptAddTriggerRule() {
    const t = prompt("Enter rule name:");
    if (!t) return;
    const e = prompt("Trigger type (character / chat / regex):", "character")?.toLowerCase().trim(), i = e === "chat" || e === "regex" ? e : "character", s = prompt(`Enter ${i} matching pattern (e.g. Character name, Chat ID, or Regex text):`);
    if (!s) return;
    const a = {
      id: `rule_${Date.now()}`,
      name: t,
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
    const t = this.container?.querySelector("#st_trigger_list");
    if (t) {
      if (t.innerHTML = "", this.settings.triggerRules.length === 0) {
        t.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 8px;">No trigger rules configured yet.</div>';
        return;
      }
      this.settings.triggerRules.forEach((e, i) => {
        const s = document.createElement("div");
        s.className = "st-bgloader-trigger-item", s.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" class="st-rule-toggle" ${e.enabled ? "checked" : ""} />
                    <div>
                        <span class="st-bgloader-trigger-badge">${e.type}</span>
                        <strong>${e.name}</strong>: <code>${e.pattern}</code>
                    </div>
                </div>
                <button class="menu_button menu_button_danger st-rule-del" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;
        const a = s.querySelector(".st-rule-toggle");
        a.addEventListener("change", () => {
          e.enabled = a.checked, this.callbacks.onSettingsChanged(this.settings);
        }), s.querySelector(".st-rule-del")?.addEventListener("click", () => {
          this.settings.triggerRules.splice(i, 1), this.callbacks.onSettingsChanged(this.settings), this.refreshTriggerList();
        }), t.appendChild(s);
      });
    }
  }
  updateSliders(t) {
    const e = (i, s, a, r) => {
      const n = this.container?.querySelector(i), o = this.container?.querySelector(s);
      n && (n.value = a.toString()), o && (o.textContent = `${a}${r}`);
    };
    e("#st_filter_blur", "#st_filter_blur_val", t.blur, "px"), e("#st_filter_brightness", "#st_filter_brightness_val", t.brightness, "%"), e("#st_filter_opacity", "#st_filter_opacity_val", t.opacity, "%"), e("#st_filter_saturate", "#st_filter_saturate_val", t.saturate, "%");
  }
  async refreshMediaGrid() {
    const t = this.container?.querySelector("#st_bgloader_grid");
    if (!t) return;
    const e = await this.cacheManager.listMedia();
    if (t.innerHTML = "", e.length === 0) {
      t.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; opacity: 0.6;">No media items imported yet.</div>';
      return;
    }
    e.forEach((i) => {
      const s = document.createElement("div");
      s.className = "st-bgloader-media-card", this.settings.activeMediaId === i.id && s.classList.add("active"), s.innerHTML = `
                <div class="st-bgloader-media-badge ${i.type}">${i.type}</div>
                <button class="st-bgloader-media-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                <div class="st-bgloader-media-card-title" title="${i.name}">${i.name}</div>
            `, s.addEventListener("click", (r) => {
        r.target.closest(".st-bgloader-media-delete") || (this.settings.activeMediaId = i.id, this.container?.querySelectorAll(".st-bgloader-media-card").forEach((o) => o.classList.remove("active")), s.classList.add("active"), this.callbacks.onMediaSelected(i), this.callbacks.onSettingsChanged(this.settings));
      }), s.querySelector(".st-bgloader-media-delete")?.addEventListener("click", async (r) => {
        r.stopPropagation(), confirm(`Delete media "${i.name}"?`) && (await this.cacheManager.deleteMedia(i.id), this.settings.activeMediaId === i.id && (this.settings.activeMediaId = null, this.callbacks.onSettingsChanged(this.settings)), this.callbacks.onMediaDeleted(i.id), await this.refreshMediaGrid(), await this.updateCacheStats());
      }), t.appendChild(s);
    });
  }
  async updateCacheStats() {
    const t = this.container?.querySelector("#st_cache_used"), e = this.container?.querySelector("#st_cache_count");
    if (!t || !e) return;
    const { usedBytes: i, itemCount: s } = await this.cacheManager.getCacheUsage(), a = (i / (1024 * 1024)).toFixed(2);
    t.textContent = `${a} MB`, e.textContent = s.toString();
  }
  async handleFileUpload(t) {
    const e = this.detectMediaType(t.name, t.type), i = await this.cacheManager.saveMedia(t, t.name, e, "local");
    await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(i);
  }
  async handleUrlImport(t) {
    const e = t.split("/").pop()?.split("?")[0] || "remote_media", i = this.detectMediaType(e), s = await this.cacheManager.saveMedia(new Blob([]), e, i, "url", t);
    await this.refreshMediaGrid(), await this.updateCacheStats(), this.callbacks.onMediaUploaded(s);
  }
  detectMediaType(t, e = "") {
    const i = t.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(i) || e.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(i) || e.startsWith("audio/") ? "audio" : i === "html" || i === "htm" ? "html" : i === "svg" ? "svg" : "image";
  }
}
class yt {
  observer = null;
  onNativeMediaSelect;
  constructor(t) {
    this.onNativeMediaSelect = t;
  }
  start() {
    const t = document.querySelector("#bg_menu_content");
    if (t)
      this.augmentThumbnails(t), this.observer = new MutationObserver(() => this.augmentThumbnails(t)), this.observer.observe(t, { childList: !0, subtree: !0 });
    else {
      const e = new MutationObserver(() => {
        document.querySelector("#bg_menu_content") && (e.disconnect(), this.start());
      });
      e.observe(document.body, { childList: !0, subtree: !0 });
    }
  }
  augmentThumbnails(t) {
    t.querySelectorAll(".bg_example[bgfile]:not([data-st-bg-augmented])").forEach((i) => {
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
  detectType(t) {
    const e = t.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov", "ogv"].includes(e) ? "video" : ["mp3", "wav", "ogg", "flac"].includes(e) ? "audio" : ["html", "htm"].includes(e) ? "html" : e === "svg" ? "svg" : "image";
  }
  stop() {
    this.observer && (this.observer.disconnect(), this.observer = null);
  }
}
class bt {
  container = null;
  audioEngine;
  isVisible = !0;
  capsuleOnPlayOnly = !0;
  hideTimer = null;
  constructor(t) {
    this.audioEngine = t;
  }
  render(t = !0, e = !0) {
    this.isVisible = t, this.capsuleOnPlayOnly = e;
    const i = document.querySelector("#st_bg_mini_player");
    i && i.remove();
    const s = document.createElement("div");
    s.id = "st_bg_mini_player", s.className = "st-bg-mini-player";
    const a = this.audioEngine.getCurrentTrack(), r = a ? a.name : "No Audio Selected", n = this.audioEngine.isPlaying(), o = this.audioEngine.getPlaybackMode(), d = this.isVisible && (!this.capsuleOnPlayOnly || n);
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
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${o}">
                    <i class="fa-solid ${this.getModeIcon(o)}"></i>
                </button>
            </div>
        `, document.body.appendChild(s), this.container = s, this.bindEvents(), this.audioEngine.onTrackChange = (h) => {
      const g = this.container?.querySelector("#st_mini_title");
      if (g) {
        const p = h ? h.name : "No Audio";
        g.textContent = p, g.setAttribute("title", p);
      }
    }, this.audioEngine.onPlayStateChange = (h) => {
      const g = this.container?.querySelector("#st_mini_play i");
      g && (g.className = `fa-solid ${h ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (h ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
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
      const t = this.audioEngine.getPlaybackMode(), e = t === "loop" ? "shuffle" : t === "shuffle" ? "single" : "loop";
      this.audioEngine.setPlaybackMode(e);
      const i = this.container?.querySelector("#st_mini_mode");
      if (i) {
        i.setAttribute("title", `Mode: ${e}`);
        const s = i.querySelector("i");
        s && (s.className = `fa-solid ${this.getModeIcon(e)}`);
      }
    }));
  }
  getModeIcon(t) {
    switch (t) {
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
  setVisible(t) {
    this.isVisible = t, t ? this.show() : this.hide();
  }
  setCapsuleOnPlayOnly(t) {
    this.capsuleOnPlayOnly = t, t ? this.audioEngine.isPlaying() || this.hide() : this.isVisible && this.show();
  }
  destroy() {
    this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.container && (this.container.remove(), this.container = null);
  }
}
class vt {
  ext;
  eventListeners = /* @__PURE__ */ new Map();
  constructor(t) {
    this.ext = t;
  }
  /**
   * Switch background to a URL, cached media ID, or local file.
   * Supports MP4/WebM video, HTML/Canvas sandboxed pages, SVG animations, and images.
   */
  async setBackground(t, e) {
    let s = (await this.ext.getCacheManager().listMedia()).find((a) => a.id === t || a.name === t || a.url === t || a.cacheKey === t);
    if (!s) {
      const a = e?.name || t.split("/").pop()?.split("?")[0] || "remote_background", r = e?.type || this.detectType(t);
      e?.saveToLibrary ? s = await this.ext.getCacheManager().saveMedia(new Blob([]), a, r, "url", t) : s = {
        id: "custom_" + Date.now(),
        name: a,
        type: r,
        source: "url",
        url: t,
        cacheKey: t,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
    }
    e?.filters && this.setFilters(e.filters), typeof e?.interactive == "boolean" && this.setInteractive(e.interactive), await this.ext.applyMediaItem(s), this.emit("media-change", s);
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
  async playBGM(t, e) {
    typeof e?.volume == "number" && this.setVolume(e.volume);
    let s = (await this.ext.getCacheManager().listMedia()).find((r) => r.id === t || r.name === t || r.url === t || r.cacheKey === t);
    if (!s) {
      const r = e?.title || t.split("/").pop()?.split("?")[0] || "BGM";
      s = {
        id: "bgm_" + Date.now(),
        name: r,
        type: "audio",
        source: "url",
        url: t,
        cacheKey: t,
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
  stopBGM(t = 300) {
    this.ext.getAudioEngine().stopTrack(t), this.emit("track-change", null);
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
  setVolume(t) {
    const e = Math.max(0, Math.min(1, t));
    this.ext.getSettings().volume = e, this.ext.getAudioEngine().setVolume(e), this.ext.saveSettings(), this.emit("volume-change", e);
  }
  setMuted(t) {
    this.ext.getSettings().muted = t, this.ext.getAudioEngine().setMuted(t), this.ext.saveSettings(), this.emit("mute-change", t);
  }
  /**
   * Toggle or set Lo-Fi acoustic muffle effect (800Hz lowpass filter)
   */
  setMuffled(t) {
    this.ext.getSettings().muffleBGM = t, this.ext.getAudioEngine().setMuffled(t), this.ext.saveSettings(), this.emit("muffle-change", t);
  }
  getMuffled() {
    return this.ext.getAudioEngine().getMuffled();
  }
  setFilters(t) {
    const e = this.ext.getSettings().filters, i = {
      blur: t.blur !== void 0 ? t.blur : e.blur,
      brightness: t.brightness !== void 0 ? t.brightness : e.brightness,
      opacity: t.opacity !== void 0 ? t.opacity : e.opacity,
      saturate: t.saturate !== void 0 ? t.saturate : e.saturate
    };
    this.ext.getSettings().filters = i, this.ext.getMediaMount().applyFilters(i), this.ext.saveSettings(), this.emit("filters-change", i);
  }
  applyPreset(t) {
    const e = this.ext.getSettings();
    let i = E[t]?.filters;
    !i && e.userPresets[t] && (i = e.userPresets[t]), i ? (e.activePresetId = t, e.filters = { ...i }, this.ext.getMediaMount().applyFilters(i), this.ext.saveSettings(), this.emit("preset-change", t, i)) : console.warn(`[ST-BgLoader PublicAPI] Preset "${t}" not found.`);
  }
  setInteractive(t) {
    this.ext.getSettings().interactiveBackground = t, this.ext.getMediaMount().setInteractive(t), this.ext.saveSettings(), this.emit("interactive-change", t);
  }
  /**
   * Atmospheric weather & particle FX
   */
  setWeather(t, e) {
    let i;
    typeof t == "string" ? i = {
      ...this.ext.getSettings().weather,
      type: t,
      ...e || {}
    } : i = { ...t }, this.ext.getSettings().weather = i, this.ext.getAtmosphereFX().setWeather(i), this.ext.saveSettings(), this.emit("weather-change", i);
  }
  getWeather() {
    return { ...this.ext.getSettings().weather };
  }
  /**
   * Audio visualizer options
   */
  setVisualizer(t) {
    let e;
    typeof t == "string" ? e = {
      ...this.ext.getSettings().visualizer,
      mode: t
    } : e = { ...t }, this.ext.getSettings().visualizer = e, this.ext.getAudioVisualizer().setOptions(e), this.ext.saveSettings(), this.emit("visualizer-change", e);
  }
  getVisualizer() {
    return { ...this.ext.getSettings().visualizer };
  }
  /**
   * 2.5D Parallax controls
   */
  setParallax(t, e) {
    const i = {
      enabled: t,
      intensity: e !== void 0 ? e : this.ext.getSettings().parallax.intensity
    };
    this.ext.getSettings().parallax = i, this.ext.getParallaxController().setOptions(i), this.ext.saveSettings(), this.emit("parallax-change", i);
  }
  /**
   * Transition effect and duration
   */
  setTransition(t, e) {
    this.ext.getSettings().transitionEffect = t, e !== void 0 && (this.ext.getSettings().transitionDurationMs = e), this.ext.getMediaMount().setTransition(t, this.ext.getSettings().transitionDurationMs), this.ext.saveSettings(), this.emit("transition-change", t, this.ext.getSettings().transitionDurationMs);
  }
  /**
   * Trigger rule management
   */
  addTriggerRule(t) {
    this.ext.getTriggerManager().addRule(t), this.ext.getSettings().triggerRules = this.ext.getTriggerManager().getRules(), this.ext.saveSettings(), this.emit("trigger-rules-change", this.ext.getSettings().triggerRules);
  }
  removeTriggerRule(t) {
    this.ext.getTriggerManager().removeRule(t), this.ext.getSettings().triggerRules = this.ext.getTriggerManager().getRules(), this.ext.saveSettings(), this.emit("trigger-rules-change", this.ext.getSettings().triggerRules);
  }
  getTriggerRules() {
    return this.ext.getTriggerManager().getRules();
  }
  /**
   * Ambient sound generator (procedural rain, fire, wind)
   */
  setAmbientSound(t, e) {
    let i;
    typeof t == "string" ? i = {
      type: t,
      volume: e !== void 0 ? e : this.ext.getSettings().ambientSound.volume
    } : i = { ...t }, this.ext.getSettings().ambientSound = i, this.ext.getAmbientSoundGenerator().setSound(i), this.ext.saveSettings(), this.emit("ambient-sound-change", i);
  }
  getAmbientSound() {
    return { ...this.ext.getSettings().ambientSound };
  }
  /**
   * Frosted glass transparent chat bubbles UI
   */
  setFrostedChat(t, e) {
    const i = {
      enabled: t,
      blur: e?.blur !== void 0 ? e.blur : this.ext.getSettings().frostedChat.blur,
      opacity: e?.opacity !== void 0 ? e.opacity : this.ext.getSettings().frostedChat.opacity
    };
    this.ext.getSettings().frostedChat = i, this.ext.getFrostedGlassController().setOptions(i), this.ext.saveSettings(), this.emit("frosted-chat-change", i);
  }
  getFrostedChat() {
    return { ...this.ext.getSettings().frostedChat };
  }
  /**
   * Audiovisual Scene Snapshots
   */
  applyScene(t) {
    const e = this.ext.getSceneManager().applyScene(t);
    return e && (this.ext.getSettings().activeSceneId = t, this.ext.saveSettings(), this.emit("scene-change", t)), e;
  }
  saveCurrentScene(t) {
    const e = this.ext.getSettings(), i = {
      id: `scene_${Date.now()}`,
      name: t,
      mediaId: e.activeMediaId || void 0,
      presetId: e.activePresetId,
      filters: { ...e.filters },
      weather: { ...e.weather },
      visualizer: { ...e.visualizer },
      parallax: { ...e.parallax },
      ambientSound: { ...e.ambientSound },
      frostedChat: e.frostedChat.enabled
    };
    return this.ext.getSceneManager().saveScene(i), this.ext.getSettings().scenes = this.ext.getSceneManager().getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", this.ext.getSceneManager().getAllScenes()), i;
  }
  getScenes() {
    return this.ext.getSceneManager().getAllScenes();
  }
  deleteScene(t) {
    const e = this.ext.getSceneManager().deleteScene(t);
    return e && (this.ext.getSettings().scenes = this.ext.getSceneManager().getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", this.ext.getSceneManager().getAllScenes())), e;
  }
  /**
   * Quick cycle through weather types
   */
  cycleWeather() {
    const t = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"], e = this.ext.getSettings().weather.type, i = (t.indexOf(e) + 1) % t.length, s = t[i];
    return this.setWeather(s), s;
  }
  getPlaybackState() {
    const t = this.ext.getSettings(), e = this.ext.getAudioEngine();
    return {
      isPlaying: e.isPlaying(),
      currentTrack: e.getCurrentTrack(),
      volume: e.getVolume(),
      muted: e.isMuted(),
      playbackMode: e.getPlaybackMode(),
      activeMediaId: t.activeMediaId,
      activePresetId: t.activePresetId,
      filters: { ...t.filters },
      isInteractive: t.interactiveBackground,
      weather: t.weather.type,
      visualizerMode: t.visualizer.mode,
      parallaxEnabled: t.parallax.enabled,
      transitionEffect: t.transitionEffect,
      isMuffled: e.getMuffled()
    };
  }
  async getMediaList() {
    return this.ext.getCacheManager().listMedia();
  }
  async preloadMedia(t, e) {
    const i = Array.isArray(t) ? t : [t], s = [], a = e?.concurrency || 3;
    let r = 0;
    const n = [...i], o = Array.from({ length: Math.min(a, n.length) }, async () => {
      for (; n.length > 0; ) {
        const d = n.shift();
        try {
          const { item: h, isNew: g } = await this.ext.getCacheManager().preloadUrl(d), p = {
            url: d,
            success: !0,
            cached: !g,
            size: h.size || 0
          };
          s.push(p);
        } catch (h) {
          s.push({
            url: d,
            success: !1,
            cached: !1,
            size: 0,
            error: h?.message || String(h)
          });
        }
        r++, e?.onProgress?.(r, i.length, d), this.emit("preload-progress", r, i.length, d);
      }
    });
    return await Promise.all(o), this.emit("preload-complete", s), s;
  }
  // --- Event Bus ---
  on(t, e) {
    return this.eventListeners.has(t) || this.eventListeners.set(t, /* @__PURE__ */ new Set()), this.eventListeners.get(t).add(e), () => this.off(t, e);
  }
  off(t, e) {
    this.eventListeners.get(t)?.delete(e);
  }
  emit(t, ...e) {
    this.eventListeners.get(t)?.forEach((i) => {
      try {
        i(...e);
      } catch (s) {
        console.error(`[ST-BgLoader PublicAPI] Error in listener for "${t}":`, s);
      }
    });
  }
  detectType(t) {
    const e = t.split(".").pop()?.toLowerCase().split("?")[0] || "";
    return ["mp4", "webm", "mov", "m4v", "ogv"].includes(e) ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(e) ? "audio" : e === "html" || e === "htm" ? "html" : e === "svg" ? "svg" : "image";
  }
}
class wt {
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
  mount(t) {
    this.parentEl = t, this.canvas.parentElement || t.appendChild(this.canvas), this.updateDimensions(), window.ResizeObserver && (this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions();
    }), this.resizeObserver.observe(t)), window.addEventListener("resize", this.onWindowResize);
  }
  onWindowResize = () => {
    this.updateDimensions();
  };
  updateDimensions() {
    if (!this.parentEl) return;
    const t = this.parentEl.getBoundingClientRect();
    this.width = t.width || window.innerWidth, this.height = t.height || window.innerHeight, this.dpr = Math.min(window.devicePixelRatio || 1, 2), this.canvas.width = Math.floor(this.width * this.dpr), this.canvas.height = Math.floor(this.height * this.dpr), this.ctx && this.ctx.scale(this.dpr, this.dpr), this.currentOptions.type !== "off" && this.initParticles();
  }
  setWeather(t) {
    this.currentOptions = { ...t }, this.currentOptions.type === "off" ? (this.stop(), this.canvas.style.display = "none", this.particles = [], this.ripples = [], this.ctx && this.ctx.clearRect(0, 0, this.width, this.height)) : (this.canvas.style.display = "block", this.initParticles(), this.start());
  }
  getParticleCount() {
    const t = Math.min(this.width, 1920) / 10;
    switch (this.currentOptions.density) {
      case "low":
        return Math.floor(t * 0.5);
      case "high":
        return Math.floor(t * 2);
      case "medium":
      default:
        return Math.floor(t);
    }
  }
  initParticles() {
    this.particles = [], this.ripples = [];
    const t = this.getParticleCount(), e = this.currentOptions.type;
    for (let i = 0; i < t; i++)
      this.particles.push(this.createParticle(e, !0));
  }
  createParticle(t, e = !1) {
    const i = e ? Math.random() * this.height : -20, s = Math.random() * (this.width + 400) - 200, a = this.currentOptions.speed, r = this.currentOptions.wind;
    switch (t) {
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
          y: e ? Math.random() * this.height : this.height + 20,
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
    const t = () => {
      this.render(), this.currentOptions.type !== "off" && (this.animFrameId = requestAnimationFrame(t));
    };
    this.animFrameId = requestAnimationFrame(t);
  }
  stop() {
    this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null);
  }
  render() {
    if (!this.ctx || this.width === 0 || this.height === 0) return;
    const t = this.ctx;
    t.clearRect(0, 0, this.width, this.height);
    const e = this.currentOptions.type;
    if (e === "scanlines") {
      this.renderScanlines(t);
      return;
    }
    const i = this.particles.length;
    for (let s = 0; s < i; s++) {
      const a = this.particles[s];
      if (e === "rain")
        t.beginPath(), t.strokeStyle = `rgba(180, 215, 255, ${a.alpha})`, t.lineWidth = 1.2, t.moveTo(a.x, a.y), t.lineTo(a.x + a.vx * 1.2, a.y + a.size), t.stroke(), a.x += a.vx, a.y += a.vy, a.y > this.height - 20 && Math.random() < 0.15 && this.ripples.push({
          x: a.x,
          y: this.height - 5 + Math.random() * 5,
          vx: 0,
          vy: 0,
          size: 1,
          alpha: a.alpha * 0.8
        }), (a.y > this.height || a.x < -100 || a.x > this.width + 100) && (this.particles[s] = this.createParticle(e, !1));
      else if (e === "snow") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.02;
        const r = Math.sin(a.oscillationOffset) * 0.8;
        a.x += a.vx + r, a.y += a.vy, t.beginPath(), t.arc(a.x, a.y, a.size, 0, Math.PI * 2), t.fillStyle = `rgba(255, 255, 255, ${a.alpha})`, t.fill(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(e, !1));
      } else if (e === "sakura") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.03, a.rotation = (a.rotation || 0) + (a.vRotation || 0.02);
        const r = Math.sin(a.oscillationOffset) * 1.5;
        a.x += a.vx + r, a.y += a.vy, t.save(), t.translate(a.x, a.y), t.rotate(a.rotation), t.beginPath(), t.ellipse(0, 0, a.size, a.size * 0.55, 0, 0, Math.PI * 2), t.fillStyle = `rgba(255, 183, 197, ${a.alpha})`, t.fill(), t.restore(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(e, !1));
      } else if (e === "cyber_motes") {
        a.life = (a.life || 0) + 1, a.x += a.vx, a.y += a.vy;
        const r = a.life / (a.maxLife || 200), n = a.alpha * Math.sin(r * Math.PI);
        t.save(), t.shadowBlur = 8, t.shadowColor = a.color || "#00f0ff", t.beginPath(), t.arc(a.x, a.y, a.size, 0, Math.PI * 2), t.fillStyle = a.color || "#00f0ff", t.globalAlpha = Math.max(0, n), t.fill(), t.restore(), (a.y < -20 || a.life && a.life > (a.maxLife || 200)) && (this.particles[s] = this.createParticle(e, !1));
      }
    }
    for (let s = this.ripples.length - 1; s >= 0; s--) {
      const a = this.ripples[s];
      if (a.size += 0.8, a.alpha -= 0.03, a.alpha <= 0 || a.size > 14) {
        this.ripples.splice(s, 1);
        continue;
      }
      t.beginPath(), t.ellipse(a.x, a.y, a.size * 1.5, a.size * 0.6, 0, 0, Math.PI * 2), t.strokeStyle = `rgba(180, 215, 255, ${a.alpha})`, t.lineWidth = 1, t.stroke();
    }
  }
  renderScanlines(t) {
    const i = 0.12 * this.currentOptions.opacity;
    t.fillStyle = `rgba(0, 0, 0, ${i})`;
    for (let a = 0; a < this.height; a += 4)
      t.fillRect(0, a, this.width, 1.5);
    this.scanlineOffset = (this.scanlineOffset + 2 * this.currentOptions.speed) % this.height;
    const s = t.createLinearGradient(0, this.scanlineOffset - 30, 0, this.scanlineOffset + 30);
    s.addColorStop(0, "rgba(255, 255, 255, 0)"), s.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * this.currentOptions.opacity})`), s.addColorStop(1, "rgba(255, 255, 255, 0)"), t.fillStyle = s, t.fillRect(0, this.scanlineOffset - 30, this.width, 60), Math.random() < 0.05 && (t.fillStyle = `rgba(255, 255, 255, ${0.02 * this.currentOptions.opacity})`, t.fillRect(0, 0, this.width, this.height));
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onWindowResize), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.particles = [], this.ripples = [];
  }
}
class St {
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
  mount(t, e) {
    this.parentEl = t, this.mediaContainerEl = e || null, this.canvas.parentElement || t.appendChild(this.canvas), this.updateDimensions(), window.addEventListener("resize", this.onResize);
  }
  onResize = () => {
    this.updateDimensions();
  };
  updateDimensions() {
    this.parentEl && (this.width = this.parentEl.clientWidth || window.innerWidth, this.height = 140, this.dpr = Math.min(window.devicePixelRatio || 1, 2), this.canvas.width = Math.floor(this.width * this.dpr), this.canvas.height = Math.floor(this.height * this.dpr), this.ctx && this.ctx.scale(this.dpr, this.dpr));
  }
  setAnalyser(t) {
    if (this.analyser = t, this.analyser) {
      this.analyser.fftSize = 256;
      const e = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(new ArrayBuffer(e));
    } else
      this.dataArray = null;
  }
  setOptions(t) {
    this.currentOptions = { ...t }, this.currentOptions.mode === "off" ? (this.stop(), this.canvas.style.display = "none", this.ctx && this.ctx.clearRect(0, 0, this.width, this.height), this.mediaContainerEl && (this.mediaContainerEl.style.filter = "")) : (this.currentOptions.mode === "spectrum" ? this.canvas.style.display = "block" : this.canvas.style.display = "none", this.start());
  }
  start() {
    if (this.animFrameId !== null) return;
    const t = () => {
      this.render(), this.currentOptions.mode !== "off" && (this.animFrameId = requestAnimationFrame(t));
    };
    this.animFrameId = requestAnimationFrame(t);
  }
  stop() {
    this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null);
  }
  render() {
    if (!this.analyser || !this.dataArray)
      return;
    this.analyser.getByteFrequencyData(this.dataArray);
    const t = this.currentOptions.mode, e = this.currentOptions.sensitivity;
    if (t === "pulse") {
      let i = 0;
      const s = Math.min(12, this.dataArray.length);
      for (let n = 0; n < s; n++)
        i += this.dataArray[n];
      const a = i / s / 255, r = Math.pow(a, 2) * 0.35 * e;
      if (this.mediaContainerEl) {
        const n = 1 + r * 0.015;
        this.mediaContainerEl.style.transform = `scale(${n})`, this.mediaContainerEl.style.transition = "transform 0.06s ease-out";
      }
    } else if (t === "spectrum") {
      if (!this.ctx) return;
      const i = this.ctx;
      i.clearRect(0, 0, this.width, this.height);
      const s = this.dataArray.length, a = Math.max(3, this.width / s * 1.6);
      let r = 0;
      const n = this.currentOptions.color || "#4fa3d1";
      for (let o = 0; o < s; o++) {
        const d = this.dataArray[o] / 255 * e, h = Math.min(this.height, d * (this.height - 10));
        if (h > 1) {
          const g = i.createLinearGradient(0, this.height, 0, this.height - h);
          g.addColorStop(0, `${n}22`), g.addColorStop(0.7, `${n}aa`), g.addColorStop(1, `${n}ff`), i.fillStyle = g;
          const p = this.height - h;
          i.beginPath();
          const f = Math.min(a / 2, 3);
          i.roundRect(r, p, a - 1.5, h, [f, f, 0, 0]), i.fill();
        }
        if (r += a, r > this.width) break;
      }
    }
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onResize), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.mediaContainerEl && (this.mediaContainerEl.style.transform = "", this.mediaContainerEl.style.transition = "");
  }
}
class _t {
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
  attach(t) {
    this.targetEl = t, this.options.enabled && this.enable();
  }
  setOptions(t) {
    const e = this.options.enabled;
    this.options = { ...this.options, ...t }, this.options.enabled && !e ? this.enable() : !this.options.enabled && e && this.disable();
  }
  onMouseMove = (t) => {
    if (!this.options.enabled) return;
    const e = window.innerWidth / 2, i = window.innerHeight / 2, s = 30 * this.options.intensity, a = (t.clientX - e) / e, r = (t.clientY - i) / i;
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
    const t = () => {
      if (!this.options.enabled) {
        this.isRunning = !1;
        return;
      }
      const e = 0.08;
      if (this.currentX += (this.targetX - this.currentX) * e, this.currentY += (this.targetY - this.currentY) * e, this.targetEl) {
        const s = 1 + 0.05 * this.options.intensity;
        this.targetEl.style.transform = `translate3d(${this.currentX.toFixed(2)}px, ${this.currentY.toFixed(2)}px, 0) scale(${s.toFixed(3)})`;
      }
      Math.abs(this.targetX - this.currentX) + Math.abs(this.targetY - this.currentY) > 0.01 ? this.animFrameId = requestAnimationFrame(t) : (this.isRunning = !1, this.animFrameId = null);
    };
    this.animFrameId = requestAnimationFrame(t);
  }
  destroy() {
    this.disable(), this.targetEl = null;
  }
}
class Et {
  rules = [];
  onTriggerCallback;
  eventSourceUnlisteners = [];
  lastTriggeredId = null;
  lastTriggerTime = 0;
  constructor(t = [], e) {
    this.rules = [...t], this.onTriggerCallback = e;
  }
  setTriggerCallback(t) {
    this.onTriggerCallback = t;
  }
  setRules(t) {
    this.rules = [...t];
  }
  getRules() {
    return this.rules;
  }
  addRule(t) {
    this.rules.push(t);
  }
  removeRule(t) {
    this.rules = this.rules.filter((e) => e.id !== t);
  }
  evaluateCharacter(t) {
    if (!t) return !1;
    for (const e of this.rules)
      if (!(!e.enabled || e.type !== "character") && e.pattern.toLowerCase().trim() === t.toLowerCase().trim())
        return this.fireRule(e), !0;
    return !1;
  }
  evaluateChat(t) {
    if (!t) return !1;
    for (const e of this.rules)
      if (!(!e.enabled || e.type !== "chat") && e.pattern.trim() === t.trim())
        return this.fireRule(e), !0;
    return !1;
  }
  evaluateMessage(t) {
    if (!t) return !1;
    for (const e of this.rules)
      if (!(!e.enabled || e.type !== "regex"))
        try {
          if (new RegExp(e.pattern, "i").test(t))
            return this.fireRule(e), !0;
        } catch (i) {
          console.warn(`[ST-BgLoader TriggerManager] Invalid regex pattern "${e.pattern}":`, i);
        }
    return !1;
  }
  fireRule(t) {
    const e = Date.now();
    this.lastTriggeredId === t.id && e - this.lastTriggerTime < 500 || (this.lastTriggeredId = t.id, this.lastTriggerTime = e, console.log(`[ST-BgLoader TriggerManager] Fired rule: "${t.name}" (${t.type})`), this.onTriggerCallback?.(t.action, t));
  }
  bindSillyTavernEvents(t, e) {
    if (this.unbindEvents(), !t || typeof t.on != "function") return;
    const i = (n) => {
      typeof n == "string" ? this.evaluateMessage(n) : n && typeof n.mes == "string" && this.evaluateMessage(n.mes);
    }, s = (n) => {
      const o = typeof n == "string" ? n : n?.chatId || n?.id;
      o && this.evaluateChat(String(o));
    }, a = (n) => {
      const o = typeof n == "string" ? n : n?.name || n?.avatar;
      o && this.evaluateCharacter(String(o));
    }, r = (n, o) => {
      t.on(n, o), this.eventSourceUnlisteners.push(() => {
        typeof t.removeListener == "function" ? t.removeListener(n, o) : typeof t.off == "function" && t.off(n, o);
      });
    };
    e ? (e.MESSAGE_RECEIVED && r(e.MESSAGE_RECEIVED, i), e.CHARACTER_MESSAGE_RENDERED && r(e.CHARACTER_MESSAGE_RENDERED, i), e.CHAT_CHANGED && r(e.CHAT_CHANGED, s), e.CHARACTER_PAGE_LOADED && r(e.CHARACTER_PAGE_LOADED, a)) : (r("message_received", i), r("character_message_rendered", i), r("chat_changed", s));
  }
  unbindEvents() {
    for (const t of this.eventSourceUnlisteners)
      try {
        t();
      } catch {
      }
    this.eventSourceUnlisteners = [];
  }
  destroy() {
    this.unbindEvents(), this.rules = [], this.onTriggerCallback = void 0;
  }
}
class Mt {
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
        const t = window.AudioContext || window.webkitAudioContext;
        if (!t) return null;
        this.ctx = new t(), this.gainNode = this.ctx.createGain(), this.gainNode.gain.value = this.currentOptions.volume, this.gainNode.connect(this.ctx.destination);
      } catch (t) {
        return console.warn("[ST-BgLoader AmbientSound] Failed to init AudioContext:", t), null;
      }
    return this.ctx && this.ctx.state === "suspended" && this.ctx.resume().catch(() => {
    }), this.ctx;
  }
  setSound(t) {
    this.currentOptions = { ...t }, this.gainNode && this.ctx && this.gainNode.gain.setTargetAtTime(
      this.currentOptions.type === "off" ? 0 : this.currentOptions.volume,
      this.ctx.currentTime,
      0.05
    ), this.currentOptions.type === "off" ? this.stop() : this.start(this.currentOptions.type);
  }
  getOptions() {
    return { ...this.currentOptions };
  }
  start(t) {
    this.stop();
    const e = this.initContext();
    !e || !this.gainNode || (this.isRunning = !0, t === "rain" ? this.startRain(e) : t === "fire" ? this.startFire(e) : t === "wind" && this.startWind(e));
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
  startRain(t) {
    const e = 2 * t.sampleRate, i = t.createBuffer(1, e, t.sampleRate), s = i.getChannelData(0);
    let a = 0, r = 0, n = 0, o = 0, d = 0, h = 0, g = 0;
    for (let b = 0; b < e; b++) {
      const m = Math.random() * 2 - 1;
      a = 0.99886 * a + m * 0.0555179, r = 0.99332 * r + m * 0.0750759, n = 0.969 * n + m * 0.153852, o = 0.8665 * o + m * 0.3104856, d = 0.55 * d + m * 0.5329522, h = -0.7616 * h - m * 0.016898, s[b] = (a + r + n + o + d + h + g + m * 0.5362) * 0.11, g = m * 0.115926;
    }
    const p = t.createBufferSource();
    p.buffer = i, p.loop = !0;
    const f = t.createBiquadFilter();
    f.type = "lowpass", f.frequency.value = 1200, p.connect(f), f.connect(this.gainNode), p.start(0), this.activeSource = p;
  }
  /**
   * Synthesize Fire: Low rumble pink noise + stochastic crackle bursts
   */
  startFire(t) {
    this.startRain(t), this.crackleTimer = window.setInterval(() => {
      if (!(!this.isRunning || !this.ctx || !this.gainNode) && Math.random() < 0.35) {
        const e = this.ctx.createOscillator(), i = this.ctx.createGain();
        e.type = "triangle", e.frequency.setValueAtTime(300 + Math.random() * 800, this.ctx.currentTime), i.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime), i.gain.exponentialRampToValueAtTime(1e-3, this.ctx.currentTime + 0.03 + Math.random() * 0.04), e.connect(i), i.connect(this.gainNode), e.start(), e.stop(this.ctx.currentTime + 0.08);
      }
    }, 80);
  }
  /**
   * Synthesize Wind: Lowpass filtered noise modulated by a gentle LFO
   */
  startWind(t) {
    const e = 2 * t.sampleRate, i = t.createBuffer(1, e, t.sampleRate), s = i.getChannelData(0);
    for (let d = 0; d < e; d++)
      s[d] = Math.random() * 2 - 1;
    const a = t.createBufferSource();
    a.buffer = i, a.loop = !0;
    const r = t.createBiquadFilter();
    r.type = "bandpass", r.frequency.value = 400, r.Q.value = 3;
    const n = t.createOscillator();
    n.frequency.value = 0.2;
    const o = t.createGain();
    o.gain.value = 250, n.connect(o), o.connect(r.frequency), a.connect(r), r.connect(this.gainNode), n.start(0), a.start(0), this.lfoOsc = n, this.activeSource = a;
  }
  destroy() {
    this.stop(), this.ctx && (this.ctx.close().catch(() => {
    }), this.ctx = null), this.gainNode = null;
  }
}
class xt {
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
    const t = "st-bgloader-frosted-style";
    let e = document.getElementById(t);
    e || (e = document.createElement("style"), e.id = t, document.head.appendChild(e)), this.styleEl = e, this.updateCss();
  }
  setOptions(t) {
    this.options = { ...this.options, ...t }, this.apply();
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
    const t = document.documentElement;
    t.style.setProperty("--st-frosted-blur", `${this.options.blur}px`), t.style.setProperty("--st-frosted-opacity", `${(this.options.opacity / 100).toFixed(2)}`), this.options.enabled ? document.body.classList.add("st-bgloader-frosted-active") : document.body.classList.remove("st-bgloader-frosted-active");
  }
  destroy() {
    document.body.classList.remove("st-bgloader-frosted-active"), this.styleEl && this.styleEl.parentElement && (this.styleEl.parentElement.removeChild(this.styleEl), this.styleEl = null);
  }
}
class Z {
  userScenes = {};
  onApplySceneCallback;
  constructor(t = {}, e) {
    this.userScenes = { ...t }, this.onApplySceneCallback = e;
  }
  setApplyCallback(t) {
    this.onApplySceneCallback = t;
  }
  setUserScenes(t) {
    this.userScenes = { ...t };
  }
  getAllScenes() {
    return {
      ...C,
      ...this.userScenes
    };
  }
  getUserScenes() {
    return { ...this.userScenes };
  }
  getScene(t) {
    return this.getAllScenes()[t];
  }
  saveScene(t) {
    this.userScenes[t.id] = { ...t, isBuiltin: !1 };
  }
  deleteScene(t) {
    return C[t] ? (console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${t}"`), !1) : this.userScenes[t] ? (delete this.userScenes[t], !0) : !1;
  }
  applyScene(t) {
    const e = this.getScene(t);
    return e ? (console.log(`[ST-BgLoader SceneManager] Applying scene: "${e.name}"`), this.onApplySceneCallback?.(e), !0) : (console.warn(`[ST-BgLoader SceneManager] Scene "${t}" not found.`), !1);
  }
}
class tt {
  isEnabled = !0;
  actions;
  constructor(t = {}) {
    this.actions = t, this.bindEvents();
  }
  setEnabled(t) {
    this.isEnabled = t;
  }
  onKeyDown = (t) => {
    if (this.isEnabled && t.altKey && !t.ctrlKey && !t.metaKey) {
      const e = t.key.toLowerCase();
      e === "b" ? (t.preventDefault(), this.actions.onToggleBackground?.()) : e === "p" ? (t.preventDefault(), this.actions.onTogglePlay?.()) : e === "m" ? (t.preventDefault(), this.actions.onToggleMuffle?.()) : e === "w" ? (t.preventDefault(), this.actions.onCycleWeather?.()) : e === "f" && (t.preventDefault(), this.actions.onToggleFrostedChat?.());
    }
  };
  bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
  }
  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
  }
}
const et = "settings:rev", it = "settings:data", Ct = 2e3, Tt = 1e4;
class kt {
  constructor(t, e) {
    this.client = t, this.onRemoteSettings = e;
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
        const t = await this.readPayload();
        if (t) {
          this.localRevision = t.revision, this.lastPushedFingerprint = t.fingerprint, this.applyingRemote = !0;
          try {
            this.onRemoteSettings(t.settings);
          } finally {
            this.applyingRemote = !1;
          }
          console.log("[ST-BgLoader] Settings restored from cloud mirror, revision", t.revision);
        }
      } catch (t) {
        console.warn("[ST-BgLoader] Failed to read cloud settings mirror:", t);
      }
      this.pollTimer = window.setInterval(() => void this.pollOnce(), Tt);
    }
  }
  stop() {
    this.pollTimer !== null && window.clearInterval(this.pollTimer), this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pollTimer = null, this.pushTimer = null, this.running = !1;
  }
  schedulePush(t) {
    !this.running || this.applyingRemote || (this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pushTimer = window.setTimeout(() => {
      this.pushTimer = null, this.push(t);
    }, Ct));
  }
  async push(t) {
    try {
      const e = JSON.stringify(t), i = await At(e);
      if (i === this.lastPushedFingerprint) return;
      const s = this.localRevision + 1, a = {
        revision: s,
        fingerprint: i,
        updatedAt: Date.now(),
        settings: t
      };
      await this.client.storage.kv.set(it, a), await this.client.storage.kv.set(et, s), this.localRevision = s, this.lastPushedFingerprint = i;
    } catch (e) {
      console.warn("[ST-BgLoader] Failed to push settings to cloud mirror:", e);
    }
  }
  async pollOnce() {
    if (!this.applyingRemote)
      try {
        const t = await this.client.storage.kv.get(et);
        if ((typeof t == "number" ? t : 0) <= this.localRevision) return;
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
      } catch (t) {
        console.warn("[ST-BgLoader] Settings sync poll failed:", t);
      }
  }
  async readPayload() {
    const t = await this.client.storage.kv.get(it);
    if (!t || typeof t != "object") return null;
    const e = t;
    return typeof e.revision != "number" || !e.settings || typeof e.fingerprint != "string" ? null : e;
  }
}
async function At(c) {
  try {
    if (crypto?.subtle) {
      const e = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(c));
      return Array.from(new Uint8Array(e)).map((i) => i.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  let t = 5381;
  for (let e = 0; e < c.length; e++)
    t = (t << 5) + t + c.charCodeAt(e) | 0;
  return "djb2:" + (t >>> 0).toString(16);
}
const O = "migration:local-to-cloud:v1";
class Lt {
  constructor(t, e, i) {
    this.local = t, this.cloud = e, this.client = i;
  }
  async runIfNeeded(t) {
    try {
      if (await this.client.storage.kv.get(O)) return;
      const e = await this.local.listCatalog();
      if (e.length === 0) {
        await this.client.storage.kv.set(O, Date.now());
        return;
      }
      const i = await this.cloud.listCatalog(), s = new Set(i.map((n) => n.id));
      console.log(`[ST-BgLoader] Migrating ${e.length} local media items to the cloud library...`);
      let a = 0, r = 0;
      for (const n of e) {
        if (!s.has(n.id))
          try {
            const o = await this.local.readMedia(n);
            o && o.size > 0 ? (await this.cloud.putMedia({
              blob: o,
              name: n.name,
              type: n.type,
              source: n.source === "local" ? "local" : "url",
              remoteUrl: n.source === "url" ? n.url : void 0,
              id: n.id
            }), r += 1) : n.source === "url" && n.url && (await this.cloud.putMedia({
              blob: new Blob([]),
              name: n.name,
              type: n.type,
              source: "url",
              remoteUrl: n.url,
              id: n.id
            }), r += 1);
          } catch (o) {
            console.warn(`[ST-BgLoader] Failed to migrate "${n.name}", keeping it local:`, o);
          }
        a += 1, t?.({ done: a, total: e.length, current: n.name });
      }
      await this.client.storage.kv.set(O, Date.now()), console.log(`[ST-BgLoader] Cloud migration finished: ${r} uploaded, ${a} processed (local copies kept).`);
    } catch (e) {
      console.warn("[ST-BgLoader] Cloud migration skipped:", e);
    }
  }
}
const F = "st_bgloader_settings";
class It {
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
  authorityBridge = new T();
  settingsSync = null;
  publicApi;
  constructor() {
    this.cacheManager = new gt(), this.audioEngine = new pt(), this.mediaMount = new mt(this.audioEngine), this.atmosphereFX = new wt(), this.audioVisualizer = new St(), this.parallaxController = new _t(), this.triggerManager = new Et(), this.ambientSoundGenerator = new Mt(), this.frostedGlassController = new xt(), this.sceneManager = new Z(), this.shortcutManager = new tt(), this.publicApi = new vt(this);
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
  async applyMediaItem(t) {
    await this.applyMedia(t);
  }
  async init() {
    console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), this.loadSettings(), await this.cacheManager.init(this.authorityBridge), this.cacheManager.isCloudBacked() && this.startCloudMigration(), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs);
    const t = this.mediaMount.getHostElement() || document.querySelector("#bg1"), e = this.mediaMount.getContainerElement();
    t && (this.atmosphereFX.mount(t), this.audioVisualizer.mount(t, e || void 0)), e && this.parallaxController.attach(e), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.audioEngine.setUrlResolver((n) => this.cacheManager.getMediaBlobUrl(n)), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.audioEngine.onAnalyserReady = (n) => {
      this.audioVisualizer.setAnalyser(n);
    };
    const s = (await this.cacheManager.listMedia()).filter((n) => n.type === "audio");
    this.audioEngine.setPlaylist(s), this.miniPlayer = new bt(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly);
    const a = this.audioEngine.onTrackChange;
    this.audioEngine.onTrackChange = (n) => {
      a?.(n), this.publicApi.emit("track-change", n);
    };
    const r = this.audioEngine.onPlayStateChange;
    if (this.audioEngine.onPlayStateChange = (n) => {
      r?.(n), this.publicApi.emit("play-state-change", n);
    }, this.triggerManager.setRules(this.settings.triggerRules || []), this.triggerManager.setTriggerCallback(async (n, o) => {
      console.log(`[ST-BgLoader] Executing trigger rule: "${o.name}"`), n.mediaIdOrUrl && await this.publicApi.setBackground(n.mediaIdOrUrl), n.bgmUrl && await this.publicApi.playBGM(n.bgmUrl), n.weather && this.publicApi.setWeather(n.weather), n.preset && this.publicApi.applyPreset(n.preset), n.filters && this.publicApi.setFilters(n.filters);
    }), this.sceneManager = new Z(this.settings.scenes || {}, async (n) => {
      if (n.mediaId) {
        const o = await this.cacheManager.getMedia(n.mediaId);
        o && await this.applyMedia(o);
      } else n.mediaUrl && await this.publicApi.setBackground(n.mediaUrl);
      n.bgmUrl && await this.publicApi.playBGM(n.bgmUrl), n.presetId && this.publicApi.applyPreset(n.presetId), n.filters && this.publicApi.setFilters(n.filters), n.weather && this.publicApi.setWeather(n.weather), n.visualizer && this.publicApi.setVisualizer(n.visualizer), n.parallax && this.publicApi.setParallax(n.parallax.enabled, n.parallax.intensity), n.ambientSound && this.publicApi.setAmbientSound(n.ambientSound), typeof n.frostedChat == "boolean" && this.publicApi.setFrostedChat(n.frostedChat);
    }), this.shortcutManager = new tt({
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
    }), this.shortcutManager.setEnabled(this.settings.shortcutsEnabled), this.settingsDrawer = new ft(this.settings, this.cacheManager, {
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
      onTransitionChanged: (n, o) => {
        this.mediaMount.setTransition(n, o), this.publicApi.emit("transition-change", n, o);
      },
      onMuffleChanged: (n) => {
        this.audioEngine.setMuffled(n), this.publicApi.emit("muffle-change", n);
      },
      onMediaSelected: async (n) => {
        await this.applyMedia(n);
      },
      onMediaDeleted: async (n) => {
        this.settings.activeMediaId === n && (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings());
        const o = await this.cacheManager.listMedia();
        this.audioEngine.setPlaylist(o.filter((d) => d.type === "audio"));
      },
      onMediaUploaded: async (n) => {
        if (this.settings.lruAutoClean) {
          const o = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(o);
        }
        if (n.type === "audio") {
          const o = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(o.filter((d) => d.type === "audio"));
        }
        await this.applyMedia(n);
      }
    }), this.settingsDrawer.render(), this.nativeAugmenter = new yt(async (n, o, d) => {
      const h = {
        id: "native_" + d,
        name: d,
        type: o,
        source: "server",
        url: n,
        cacheKey: n,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
      await this.applyMedia(h);
    }), this.nativeAugmenter.start(), document.addEventListener("visibilitychange", () => {
      this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
    }), await this.startSettingsSync(), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const n = await this.cacheManager.getMedia(this.settings.activeMediaId);
      n && await this.applyMedia(n);
    }
    this.isInitialized = !0, console.log("[ST-BgLoader] All Modular Subsystems fully initialized.");
  }
  async applyMedia(t) {
    this.settings.activeMediaId = t.id, this.saveSettings();
    const e = await this.cacheManager.getMediaBlobUrl(t);
    await this.mediaMount.mountMedia(t, e), this.settingsDrawer && (this.settingsDrawer.refreshMediaGrid(), this.settingsDrawer.updateCacheStats());
  }
  applySettingsToSubsystems() {
    this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.shortcutManager.setEnabled(this.settings.shortcutsEnabled), this.triggerManager.setRules(this.settings.triggerRules || []), this.sceneManager.setUserScenes(this.settings.scenes || {});
  }
  startCloudMigration() {
    const t = this.cacheManager.getLocalOrigin(), e = this.cacheManager.getAuthorityOrigin(), i = this.authorityBridge.getClient();
    !t || !e || !i || new Lt(t, e, i).runIfNeeded((s) => {
      console.log(`[ST-BgLoader] Cloud migration: ${s.done}/${s.total} (${s.current})`), s.done === 1 && s.total > 0 && window.toastr?.info(`开始迁移本地媒体库到云端（${s.total} 项）...`, "ST-BgLoader");
    });
  }
  async startSettingsSync() {
    const t = this.authorityBridge.getClient();
    t && (this.settingsSync = new kt(t, (e) => {
      this.settings = e;
      try {
        localStorage.setItem(F, JSON.stringify(this.settings));
      } catch {
      }
      this.applySettingsToSubsystems(), this.settingsDrawer?.applyRemoteSettings(this.settings), this.publicApi.emit("settings-sync", this.settings);
    }), await this.settingsSync.start());
  }
  hookSillyTavernEvents() {
    const t = window;
    t.eventSource && (this.triggerManager.bindSillyTavernEvents(t.eventSource, t.event_types), t.event_types && t.event_types.CHAT_CHANGED && t.eventSource.on(t.event_types.CHAT_CHANGED, async () => {
      const e = t.getCurrentChatId ? t.getCurrentChatId() : null;
      if (e && this.settings.chatBindings[e]) {
        const i = this.settings.chatBindings[e], s = await this.cacheManager.getMedia(i);
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
      const t = localStorage.getItem(F);
      t && (this.settings = { ...P, ...JSON.parse(t) });
    } catch (t) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", t), this.settings = { ...P };
    }
  }
  saveSettings() {
    try {
      localStorage.setItem(F, JSON.stringify(this.settings));
    } catch (t) {
      console.error("[ST-BgLoader] Failed to save settings:", t);
    }
    this.settingsSync?.schedulePush(this.settings);
  }
}
const k = new It();
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => k.init()) : k.init();
window.STBgLoader = k;
window.stBgLoader = k.getAPI();
export {
  It as STBgLoaderExtension
};
