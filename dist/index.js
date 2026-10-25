const I = {
  default: {
    id: "default",
    name: "默认",
    filters: { blur: 0, brightness: 100, opacity: 100, saturate: 100 }
  },
  cinema_dark: {
    id: "cinema_dark",
    name: "影院",
    filters: { blur: 3, brightness: 75, opacity: 90, saturate: 95 }
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "赛博",
    filters: { blur: 0, brightness: 110, opacity: 100, saturate: 160 }
  },
  vintage_sepia: {
    id: "vintage_sepia",
    name: "复古",
    filters: { blur: 1, brightness: 90, opacity: 90, saturate: 70 }
  },
  dreamy_bloom: {
    id: "dreamy_bloom",
    name: "梦幻",
    filters: { blur: 6, brightness: 125, opacity: 95, saturate: 115 }
  },
  monochrome: {
    id: "monochrome",
    name: "黑白",
    filters: { blur: 0, brightness: 100, opacity: 100, saturate: 0 }
  }
}, k = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"], he = {
  off: "关闭",
  rain: "雨水",
  snow: "飘雪",
  sakura: "落樱",
  cyber_motes: "微粒",
  scanlines: "扫描线"
};
function D(c) {
  return typeof c == "object" && c !== null && !Array.isArray(c);
}
function z(c) {
  const e = { ...O };
  if (!D(c)) return e;
  const t = c, i = O, s = e;
  for (const a of Object.keys(i)) {
    const n = t[a];
    if (n === void 0) continue;
    const r = i[a];
    s[a] = D(r) && D(n) ? { ...r, ...n } : n;
  }
  return e;
}
const P = {
  cyber_rain: {
    id: "cyber_rain",
    name: "雨夜",
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
    name: "壁炉",
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
    name: "落樱",
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
    name: "木屋",
    presetId: "cinema_dark",
    weather: { type: "snow", density: "high", speed: 1.1, opacity: 0.85, wind: 0.4 },
    visualizer: { mode: "off", color: "#ffffff", sensitivity: 1 },
    parallax: { enabled: !0, intensity: 0.3 },
    ambientSound: { type: "wind", volume: 0.5 },
    frostedChat: !0,
    isBuiltin: !0
  }
}, O = {
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
  backgroundVisible: !0,
  showMiniPlayer: !0,
  capsuleOnPlayOnly: !0,
  playbackMode: "loop",
  cacheQuotaMB: 1024,
  lruAutoClean: !0,
  nativeTakeover: "all",
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
  agentToolsEnabled: !1,
  libraryView: {
    sortOrder: "name",
    typeFilter: "all"
  }
};
function M(c, e = "") {
  const t = c.split(".").pop()?.toLowerCase().split("?")[0] || "";
  return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) || e.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) || e.startsWith("audio/") ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
}
class E {
  static instance = null;
  hostType;
  constructor() {
    this.hostType = this.detectHostType();
  }
  static getInstance() {
    return E.instance || (E.instance = new E()), E.instance;
  }
  detectHostType() {
    return typeof window > "u" ? "generic" : window.__TAURI__ || window.__TAURI_METADATA__ || window.__TAURI_INVOKE__ || navigator.userAgent.toLowerCase().includes("tauri") ? "tauritavern" : window.PureTavern || document.title.toLowerCase().includes("puretavern") || document.querySelector('meta[name="puretavern"]') ? "puretavern" : window.Luker || document.title.toLowerCase().includes("luker") || document.querySelector('meta[name="luker"]') ? "luker" : window.SillyTavern ? "sillytavern" : "generic";
  }
  getHostType() {
    return this.hostType;
  }
  getDisplayName() {
    switch (this.hostType) {
      case "sillytavern":
        return "SillyTavern";
      case "luker":
        return "Luker";
      case "puretavern":
        return "PureTavern";
      case "tauritavern":
        return "TauriTavern";
      default:
        return "Tavern Host";
    }
  }
  /**
   * Resolves the top bar toggle button for background selection.
   */
  getTopbarBackgroundButton() {
    return document.querySelector("#backgrounds-drawer-toggle") || document.querySelector("#backgrounds-button .drawer-toggle") || document.querySelector("#expression-holder") || null;
  }
  /**
   * Resolves the container for the background drawer.
   */
  getBackgroundDrawer() {
    return document.querySelector("#Backgrounds");
  }
  /**
   * Resolves the container for native background elements list.
   */
  getNativeMenuContent() {
    return document.querySelector("#bg_menu_content");
  }
  /**
   * Resolves the container for extension settings.
   */
  getExtensionsSettingsContainer() {
    return document.querySelector("#extensions_settings");
  }
  /**
   * Programmatically opens the native background drawer if closed.
   */
  openBackgroundDrawer() {
    const e = this.getBackgroundDrawer(), t = this.getTopbarBackgroundButton();
    return !e || !t ? !1 : (e.classList.contains("openDrawer") || t.click(), !0);
  }
  /**
   * Programmatically closes the native background drawer if open.
   */
  closeBackgroundDrawer() {
    const e = this.getBackgroundDrawer(), t = this.getTopbarBackgroundButton();
    e && e.classList.contains("openDrawer") && t && t.click();
  }
  /**
   * Provides safe CSRF and authentication request headers.
   */
  getRequestHeaders(e = { omitContentType: !0 }) {
    try {
      const i = window.SillyTavern?.getContext?.().getRequestHeaders?.(e);
      return i ? { ...i } : {};
    } catch {
      return {};
    }
  }
  /**
   * Returns the host's public context API if available.
   */
  getContext() {
    try {
      return window.SillyTavern?.getContext?.() || null;
    } catch {
      return null;
    }
  }
}
const X = "st-bg-loader-manifest.json", L = 1;
function T(c) {
  return `backgrounds/${encodeURIComponent(c)}`;
}
const de = /* @__PURE__ */ new Set(["favicon.ico"]);
function q(c) {
  return !!c && de.has(c.toLowerCase());
}
function x() {
  return E.getInstance().getRequestHeaders({ omitContentType: !0 });
}
async function ue(c) {
  try {
    const e = await S(`${T(c)}?t=${Date.now()}`, { cache: "no-store" });
    return e.ok ? JSON.parse(await e.text()) : null;
  } catch (e) {
    return console.warn(`[ST-BgLoader] Server document "${c}" is missing or unreadable:`, e), null;
  }
}
async function ge(c, e) {
  const t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), i = new FormData();
  i.append("avatar", new File([t], c, { type: "application/json" }));
  const s = await S("/api/backgrounds/upload", { method: "POST", headers: x(), body: i });
  if (!s.ok)
    throw new Error(`Server upload failed for "${c}": HTTP ${s.status}`);
}
const pe = 6e4, me = 3e4;
function S(c, e) {
  const t = e?.signal ?? AbortSignal.timeout(me);
  return fetch(c, { ...e, signal: t });
}
class G {
  manifest = { version: L, items: [] };
  // Serializes manifest writes: manifest mutations are synchronous on this single
  // instance, so queueing uploads guarantees the last write carries the newest state
  // and prevents redundant parallel POSTs (two rapid putMedia calls).
  saveQueue = Promise.resolve();
  // Short-lived catalog cache: listCatalog() POSTs /api/backgrounds/all on every call and sits
  // on the hot path (every getMedia, every setBackground). A TTL — rather than cache
  // invalidation alone — is the cheapest guard against changes made by the native picker,
  // which lives in the host's own code and cannot notify us.
  catalogCache = null;
  static CATALOG_TTL_MS = 2e3;
  async init() {
    try {
      const e = await S(`${T(X)}?t=${Date.now()}`, { cache: "no-store" });
      if (e.ok) {
        const t = JSON.parse(await e.text());
        t && Array.isArray(t.items) && (this.manifest = { version: L, items: t.items });
      }
    } catch (e) {
      console.warn("[ST-BgLoader] No server media manifest yet, starting a fresh one:", e), this.manifest = { version: L, items: [] };
    }
    console.log(`[ST-BgLoader] Server media library ready: ${this.manifest.items.length} cataloged entries.`);
  }
  async listCatalog() {
    const e = this.catalogCache;
    if (e && Date.now() - e.at < G.CATALOG_TTL_MS)
      return [...e.items];
    const t = await this.fetchCatalog();
    return this.catalogCache = { items: t, at: Date.now() }, [...t];
  }
  /** Drops the catalog cache (own writes, or a host-side change the caller knows about). */
  invalidateCatalog() {
    this.catalogCache = null;
  }
  async fetchCatalog() {
    const e = /* @__PURE__ */ new Map();
    try {
      const t = await S("/api/backgrounds/all", {
        method: "POST",
        headers: { ...x(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok) {
        const i = await t.json();
        for (const s of i.images ?? []) {
          if (q(s.filename)) continue;
          const a = M(s.filename);
          e.set(s.filename, {
            id: "native_" + s.filename,
            name: s.filename,
            type: a,
            source: "server",
            url: T(s.filename),
            cacheKey: T(s.filename),
            size: 0,
            mimeType: H(s.filename, a),
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
      if (t.filename) {
        if (q(t.filename)) continue;
        e.set(t.filename, this.manifestToItem(t));
      } else t.remoteUrl && e.set(t.id, {
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
    return t ? q(t.filename) ? null : this.manifestToItem(t) : (await this.listCatalog()).find((s) => s.id === e) ?? null;
  }
  async putMedia(e) {
    const t = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), i = e.blob.type || H(e.name, e.type);
    if (e.source === "url" && e.blob.size === 0 && e.remoteUrl) {
      const n = {
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
      return this.manifest.items.push(n), await this.saveManifest(), this.invalidateCatalog(), {
        id: t,
        name: e.name,
        type: e.type,
        source: "url",
        url: e.remoteUrl,
        cacheKey: t,
        size: 0,
        mimeType: i,
        addedTimestamp: n.addedTimestamp,
        lastUsedTimestamp: n.lastUsedTimestamp,
        hasAudio: n.hasAudio
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
    return this.manifest.items = this.manifest.items.filter((n) => n.filename !== s), this.manifest.items.push(a), await this.saveManifest(), this.invalidateCatalog(), this.manifestToItem(a);
  }
  async deleteMedia(e) {
    let i = this.manifest.items.find((a) => a.id === e)?.filename ?? null;
    if (!i) {
      const a = await this.getCatalogItem(e);
      a?.url?.startsWith("backgrounds/") && (i = decodeURIComponent(a.url.slice(12)));
    }
    if (!i) {
      this.manifest.items = this.manifest.items.filter((a) => a.id !== e), await this.saveManifest(), this.invalidateCatalog();
      return;
    }
    const s = await S("/api/backgrounds/delete", {
      method: "POST",
      headers: { ...x(), "Content-Type": "application/json" },
      body: JSON.stringify({ bg: i })
    });
    if (!s.ok)
      throw new Error(`Server delete failed for "${i}": HTTP ${s.status}`);
    this.manifest.items = this.manifest.items.filter((a) => a.id !== e && a.filename !== i), await this.saveManifest(), this.invalidateCatalog();
  }
  async readMedia(e) {
    if (!e.url) return null;
    const t = await S(e.url, { cache: "no-store" });
    return t.ok ? t.blob() : null;
  }
  async findByUrl(e) {
    const t = this.manifest.items.find((s) => s.remoteUrl === e || T(s.filename ?? "") === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((s) => s.url === e || s.cacheKey === e) ?? null;
  }
  /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
  async download(e) {
    let t = null;
    try {
      t = new URL(e, window.location.href);
    } catch {
    }
    const i = !!t && t.origin !== window.location.origin, s = await S(e, i ? { signal: AbortSignal.timeout(pe) } : void 0);
    if (!s.ok)
      throw new Error(`Failed to fetch media from ${e}: ${s.status} ${s.statusText}`);
    return s.blob();
  }
  async uploadFile(e, t, i) {
    let s = fe(e || "media");
    if (await this.filenameExists(s)) {
      const r = s.lastIndexOf("."), o = r > 0 ? s.slice(0, r) : s, l = r > 0 ? s.slice(r) : "";
      s = `${o}_${Date.now()}${l}`;
    }
    const a = new FormData();
    a.append("avatar", new File([t], s, { type: i }));
    const n = await S("/api/backgrounds/upload", { method: "POST", headers: x(), body: a });
    if (!n.ok)
      throw new Error(`Server upload failed: HTTP ${n.status}`);
    return (await n.text()).trim() || s;
  }
  async filenameExists(e) {
    if (this.manifest.items.some((t) => t.filename === e)) return !0;
    try {
      const t = await S("/api/backgrounds/all", {
        method: "POST",
        headers: { ...x(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok)
        return ((await t.json()).images ?? []).some((s) => s.filename === e);
    } catch {
    }
    return !1;
  }
  saveManifest() {
    const e = () => this.doSaveManifest();
    return this.saveQueue = this.saveQueue.then(e, e), this.saveQueue;
  }
  async doSaveManifest() {
    this.manifest.version = L;
    const e = new Blob([JSON.stringify(this.manifest, null, 2)], { type: "application/json" });
    try {
      const t = new FormData();
      t.append("avatar", new File([e], X, { type: "application/json" }));
      const i = await S("/api/backgrounds/upload", { method: "POST", headers: x(), body: t });
      if (!i.ok)
        throw new Error(`HTTP ${i.status}`);
    } catch (t) {
      throw console.error("[ST-BgLoader] Failed to save server media manifest:", t), t;
    }
  }
  manifestToItem(e) {
    const t = e.source === "url" && e.remoteUrl ? e.remoteUrl : e.filename ? T(e.filename) : e.remoteUrl ?? "";
    return {
      id: e.id,
      name: e.filename || e.remoteUrl || e.id,
      type: e.type,
      source: e.source === "url" ? "url" : "server",
      url: t,
      cacheKey: e.filename ? T(e.filename) : e.id,
      size: e.size,
      mimeType: e.mimeType,
      addedTimestamp: e.addedTimestamp,
      lastUsedTimestamp: e.lastUsedTimestamp,
      hasAudio: e.hasAudio
    };
  }
}
function H(c, e) {
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
      return e === "video" ? "video/mp4" : e === "audio" ? "audio/mpeg" : e === "svg" ? "image/svg+xml" : e === "html" ? "text/html" : "image/png";
  }
}
function fe(c) {
  return (c || "media").replace(/[^\p{L}\p{N}._ -]/gu, "_");
}
const C = "st-bgloader-main";
function ce(c) {
  if (c && typeof c == "object" && c.name === "AuthorityPermissionError") return !0;
  const e = c instanceof Error ? c.message : String(c);
  return /permission|denied|forbidden|封锁/i.test(e);
}
const ye = "extension:third-party/ST-BgLoader", Q = "st_bgloader_cloud_notice_v1";
class $ {
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
        extensionId: $.EXTENSION_ID,
        displayName: "ST-BgLoader",
        version: "1.0.0",
        installType: "local",
        uiLabel: "ST-BgLoader",
        declaredPermissions: {
          storage: { kv: !0, blob: !0 },
          sql: { private: !0 },
          http: { allow: [...this.httpAllow] },
          jobs: { background: ["delay", "sql.backup"] },
          events: { channels: [$.CHANNEL] },
          // Undeclared resources hit the declaration gate (hard 'blocked') even when an
          // admin would grant them — declare exactly the one browser instance we register.
          agent: { browser: [C] }
        }
      }), this.caps = {
        available: !0,
        sync: !0,
        serverFetch: !0,
        agentTools: !0,
        agentToolsState: "unknown"
      }, console.log("[ST-BgLoader] Authority backend connected:", this.client.getSession()), this.caps) : this.degrade("sdk-missing", "未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）");
    } catch (e) {
      const t = e instanceof Error ? e.message : String(e), i = ce(e);
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
      if (localStorage.getItem(Q)) return;
      localStorage.setItem(Q, (/* @__PURE__ */ new Date()).toISOString()), window.toastr?.info(t, "ST-BgLoader");
    } catch {
    }
  }
}
function be(c) {
  const e = atob(c), t = new ArrayBuffer(e.length), i = new Uint8Array(t);
  for (let s = 0; s < e.length; s++)
    i[s] = e.charCodeAt(s);
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
    const s = await i.http.fetch({ url: e, method: "GET" });
    if (!s.ok)
      throw new Error(`Server fetch failed with HTTP ${s.status} for ${e}`);
    const a = be(s.body);
    return new Blob([a], { type: s.contentType || "application/octet-stream" });
  }
}
function we(c) {
  try {
    return new URL(c).hostname;
  } catch {
    return null;
  }
}
const N = "st-bg-cache-v1", _e = "st_bg_cache_index", _ = "entries";
class Se {
  origin;
  remoteImporter = null;
  l1 = null;
  indexDb = null;
  // E3: bounded by cache-entry eviction (see evictCacheEntry) instead of growing for the whole
  // session. The cacheKey is stored next to the blob URL so eviction can release exactly the
  // object URLs that point at the evicted entry.
  objectUrls = /* @__PURE__ */ new Map();
  // E2: in-memory mirror of the IndexedDB LRU index. touchCache() sits on the
  // getMediaBlobUrl() hot path and used to run a full `getAll()` plus a write-back per call;
  // the mirror is read once on first use and kept in sync by indexPut/indexDelete/indexClear.
  // Multi-tab caveat: another tab can rewrite the store behind our back, so the entry point
  // that makes a decision from it (cleanLRU) re-reads it first.
  indexMirror = null;
  constructor() {
    this.origin = new G();
  }
  async init(e) {
    "caches" in window && (this.l1 = await caches.open(N)), await this.openIndex(), e && (await e.detectAndInit()).available && e.getClient() && (this.remoteImporter = new ve(e)), await this.origin.init(), console.log("[ST-BgLoader] Media library source of truth: server backgrounds/ directory (browser keeps cache only).");
  }
  async listMedia() {
    return this.origin.listCatalog();
  }
  async getMedia(e) {
    return this.origin.getCatalogItem(e);
  }
  async saveMedia(e, t, i, s, a) {
    let n = typeof e == "string" ? new Blob([e], { type: i === "svg" ? "image/svg+xml" : "text/html" }) : e;
    s === "url" && n.size === 0 && a && (n = await this.fetchForStorage(a).catch(() => new Blob([])));
    const r = await this.origin.putMedia({ blob: n, name: t, type: i, source: s, remoteUrl: a });
    return await this.backfillCache(r, n), r;
  }
  /** In-flight URL resolutions per media id: concurrent callers share one result instead of
   *  each creating an objectURL only for all but the last to leak (map keeps one entry). */
  inflightBlobUrls = /* @__PURE__ */ new Map();
  async getMediaBlobUrl(e) {
    const t = this.objectUrls.get(e.id);
    if (t)
      return await this.touchCache(e.cacheKey), t.url;
    const i = this.inflightBlobUrls.get(e.id);
    if (i)
      return i;
    const s = this.resolveMediaUrl(e).finally(() => {
      this.inflightBlobUrls.delete(e.id);
    });
    return this.inflightBlobUrls.set(e.id, s), s;
  }
  async resolveMediaUrl(e) {
    if (this.l1) {
      const t = await this.l1.match(e.cacheKey);
      if (t) {
        const i = await t.blob(), s = URL.createObjectURL(i);
        return this.objectUrls.set(e.id, { url: s, cacheKey: e.cacheKey }), await this.touchCache(e.cacheKey), s;
      }
    }
    return await this.touchCache(e.cacheKey), e.url;
  }
  async deleteMedia(e) {
    const t = await this.getMedia(e);
    await this.origin.deleteMedia(e), t && await this.evictCacheEntry(t.cacheKey);
    const i = this.objectUrls.get(e);
    i && (URL.revokeObjectURL(i.url), this.objectUrls.delete(e));
  }
  async getCacheUsage() {
    const e = [...(await this.getIndex()).values()];
    return {
      usedBytes: e.reduce((t, i) => t + (i.size || 0), 0),
      itemCount: e.length
    };
  }
  async cleanLRU(e) {
    const t = [...(await this.reloadIndex()).values()];
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
      URL.revokeObjectURL(e.url);
    this.objectUrls.clear(), "caches" in window && (await caches.delete(N), this.l1 = await caches.open(N)), await this.indexClear();
  }
  async preloadUrl(e, t) {
    const i = await this.origin.findByUrl(e);
    if (i)
      return { item: i, isNew: !1 };
    const s = e.split("/").pop()?.split("?")[0] || "preloaded_media", a = t || this.detectMediaType(s), n = await this.fetchForStorage(e), r = await this.origin.putMedia({ blob: n, name: s, type: a, source: "url", remoteUrl: e });
    return await this.backfillCache(r, n), { item: r, isNew: !0 };
  }
  detectMediaType(e) {
    return M(e);
  }
  getMimeType(e, t) {
    return H(e, t);
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
    const t = (await this.getIndex()).get(e);
    t && (t.lastUsed = Date.now(), await this.indexPut(t));
  }
  async evictCacheEntry(e) {
    this.l1 && await this.l1.delete(e), await this.indexDelete(e), this.releaseObjectUrls(e);
  }
  /**
   * E3: an object URL is only kept for a cache entry the LRU still tracks, so eviction
   * releases it — that is what bounds `objectUrls` for a long session (previously every
   * uploaded item kept its blob URL alive until an explicit delete or Clear Cache).
   *
   * Honest limits of that rule (review correction, 2026-09-26): LRU order is by lastUsed, and
   * it gives NO guarantee that the currently mounted background is evicted last — a background
   * mounted a while ago while other media were touched in between is a legitimate early
   * candidate. Revoking a URL that is still in use is nevertheless benign for the media
   * mounted here (measured 2026-09-26: fully buffered BGM, mid-track BGM, a mounted image and
   * a mounted svg/iframe all kept playing/rendering across revocation). The residual window is
   * BGM that is still buffering: a revoked URL stops the stream, and nothing re-resolves the
   * URL of an already-mounted element. Accepted as the cost of bounding the map; the
   * alternative is an unbounded leak for the whole session.
   */
  releaseObjectUrls(e) {
    for (const [t, i] of this.objectUrls)
      i.cacheKey === e && (URL.revokeObjectURL(i.url), this.objectUrls.delete(t));
  }
  async openIndex() {
    this.indexDb = await new Promise((e, t) => {
      const i = indexedDB.open(_e, 1);
      i.onupgradeneeded = (s) => {
        const a = s.target.result;
        a.objectStoreNames.contains(_) || a.createObjectStore(_, { keyPath: "cacheKey" });
      }, i.onsuccess = () => e(i.result), i.onerror = () => t(i.error);
    });
  }
  /** The in-memory mirror; loaded from IndexedDB once, then kept in sync by the writers. */
  async getIndex() {
    return this.indexMirror ?? await this.reloadIndex();
  }
  /** Forces a fresh read of the whole index (multi-tab safety for decision points). */
  async reloadIndex() {
    const e = await this.indexReadAll();
    return this.indexMirror = new Map(e.map((t) => [t.cacheKey, { ...t }])), this.indexMirror;
  }
  async indexReadAll() {
    return this.indexDb || await this.openIndex(), new Promise((e, t) => {
      const s = this.indexDb.transaction(_, "readonly").objectStore(_).getAll();
      s.onsuccess = () => e(s.result || []), s.onerror = () => t(s.error);
    });
  }
  async indexPut(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const a = this.indexDb.transaction(_, "readwrite").objectStore(_).put(e);
      a.onsuccess = () => t(), a.onerror = () => i(a.error);
    }), this.indexMirror?.set(e.cacheKey, { ...e });
  }
  async indexDelete(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const a = this.indexDb.transaction(_, "readwrite").objectStore(_).delete(e);
      a.onsuccess = () => t(), a.onerror = () => i(a.error);
    }), this.indexMirror?.delete(e);
  }
  async indexClear() {
    this.indexDb || await this.openIndex(), await new Promise((e, t) => {
      const s = this.indexDb.transaction(_, "readwrite").objectStore(_).clear();
      s.onsuccess = () => e(), s.onerror = () => t(s.error);
    }), this.indexMirror = /* @__PURE__ */ new Map();
  }
}
const Ee = 1e4;
class Te {
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
  // A broken/deleted track fires 'error' with no listener today: playback fails silently and
  // the playlist stalls on the bad entry forever. Auto-skip is bounded by how many tracks the
  // playlist had when the first error hit, so a playlist that is entirely corrupt cannot spin
  // an endless skip loop.
  errorSkipBudget = 0;
  // WebAudio Graph for Lo-Fi muffle and Visualizer
  audioContext = null;
  sourceNode = null;
  biquadFilter = null;
  analyserNode = null;
  isMuffled = !1;
  // Multicast listeners (subscribe via addTrackListener/addPlayStateListener, both
  // return an unsubscriber). The old single-slot onTrackChange/onPlayStateChange
  // properties are gone: last-writer-wins silently dropped earlier subscribers.
  trackListeners = [];
  playStateListeners = [];
  onAnalyserReady;
  addTrackListener(e) {
    return this.trackListeners.push(e), () => {
      this.trackListeners = this.trackListeners.filter((t) => t !== e);
    };
  }
  addPlayStateListener(e) {
    return this.playStateListeners.push(e), () => {
      this.playStateListeners = this.playStateListeners.filter((t) => t !== e);
    };
  }
  emitTrackChange(e) {
    for (const t of this.trackListeners)
      try {
        t(e);
      } catch (i) {
        console.error("[ST-BgLoader AudioEngine] Track listener failed:", i);
      }
  }
  emitPlayState(e) {
    for (const t of this.playStateListeners)
      try {
        t(e);
      } catch (i) {
        console.error("[ST-BgLoader AudioEngine] Play-state listener failed:", i);
      }
  }
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
    let i = this.playlist.findIndex((s) => s.id === e.id);
    i === -1 && (i = this.playlist.findIndex((s) => s.url === e.url && s.type === e.type), i === -1 ? (this.playlist.push(e), i = this.playlist.length - 1) : this.playlist[i] = e), this.currentIndex = i, await this.startTrack(e, t);
  }
  async playCurrentTrack() {
    const e = this.getCurrentTrack();
    e && await this.startTrack(e);
  }
  /**
   * The single entry point behind playMediaItem()/playCurrentTrack() (finding D3: the two
   * public methods held near-identical copies of the same sequence, so a fix to one silently
   * missed the other). The src/loop/unmute/play sequence itself stays in playTrack(), which
   * was a third copy of it; the only thing the callers differed on is who supplies the media
   * URL — playMediaItem may already have it (the item it just mounted), otherwise it is
   * resolved here through the same urlResolver. Track-change emission is unchanged: exactly
   * one per successful call, none when there is no audio element to play into.
   */
  async startTrack(e, t) {
    if (!this.audioElement) return;
    const i = t || (this.urlResolver ? await this.urlResolver(e) : e.url);
    await this.playTrack(i, this.playbackMode === "single"), this.emitTrackChange(e);
  }
  constructor() {
    this.audioElement = new Audio(), this.audioElement.preload = "auto", this.audioElement.addEventListener("ended", () => {
      this.handleTrackEnded();
    }), this.audioElement.addEventListener("play", () => {
      this.emitPlayState(!0);
    }), this.audioElement.addEventListener("pause", () => {
      this.emitPlayState(!1);
    }), this.audioElement.addEventListener("error", () => {
      const e = this.audioElement?.src || "(no src)";
      console.error("[ST-BgLoader AudioEngine] Track failed to load:", e);
      try {
        this.audioElement?.pause();
      } catch {
      }
      this.handleTrackError();
    }), this.audioElement.addEventListener("playing", () => {
      this.errorSkipBudget = Math.max(this.errorSkipBudget, this.playlist.length);
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
    this.playlist = e, this.errorSkipBudget = Math.max(this.errorSkipBudget, this.playlist.length), this.playlist.length > 0 && this.currentIndex === -1 && (this.currentIndex = 0, t && this.playCurrentTrack());
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
  /**
   * A track failed to load (corrupt file, deleted server-side, bad URL). Skip forward the
   * same way 'ended' does, but only while a skip budget lasts: it is refilled whenever a
   * track is successfully started and sized against the whole playlist, so an all-corrupt
   * playlist stops after one pass instead of looping on errors forever. 'single' mode keeps
   * the user's explicit choice: stop, don't silently play something else.
   */
  handleTrackError() {
    if (this.isWaitingForInteractionUnmute = !1, this.playbackMode === "single" || this.playlist.length === 0) {
      this.emitPlayState(!1);
      return;
    }
    if (this.errorSkipBudget <= 0) {
      console.warn("[ST-BgLoader AudioEngine] Skip budget exhausted (every track failed?); stopping auto-skip."), this.emitPlayState(!1);
      return;
    }
    this.errorSkipBudget -= 1, this.playNext().catch((e) => console.error("[ST-BgLoader AudioEngine] Auto-skip after error failed:", e));
  }
  attachVideo(e) {
    this.attachedVideo = e, this.attachedVideo && this.applyVolume();
  }
  /**
   * Detaches a video only if it is the one currently attached. During a video→video
   * crossfade the outgoing layer's destroy() runs AFTER the incoming layer attached
   * its element; an unconditional clear here would drop volume/mute/visibility control
   * from the video that is actually playing.
   */
  detachVideo(e) {
    this.attachedVideo === e && (this.attachedVideo = null);
  }
  async playTrack(e, t = !0) {
    if (this.audioElement) {
      this.clearFade(), this.audioElement.src = e, this.audioElement.loop = t, !this.userHasInteracted && !this.muted ? (this.isWaitingForInteractionUnmute = !0, this.audioElement.muted = !0) : this.applyVolume();
      try {
        this.initWebAudio(), this.resumeAudioContext();
        let i;
        await Promise.race([
          this.audioElement.play().catch((s) => {
            console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", s);
          }),
          new Promise((s) => {
            i = window.setTimeout(s, Ee);
          })
        ]).finally(() => {
          window.clearTimeout(i);
        });
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
    if (this.isWaitingForInteractionUnmute = !1, !this.audioElement || this.audioElement.paused) return;
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
    this.clearFade(), this.audioElement && (this.audioElement.pause(), this.audioElement.src = "", this.audioElement = null), this.audioContext && (this.audioContext.close().catch(() => {
    }), this.audioContext = null), this.attachedVideo = null, this.playlist = [];
  }
}
const Me = 15e3;
class Y {
  videoElement = null;
  container;
  audioEngine;
  pendingSettle = null;
  // Surfaces broken videos (corrupt bytes, unsupported codec, 404) to the mount layer:
  // render() still settles (bounded wait), but the failure is no longer invisible.
  onError;
  constructor(e, t, i) {
    this.container = e, this.audioEngine = t, this.onError = i;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("video");
    return i.className = "st-bg-video-element", i.src = e, i.loop = !0, i.playsInline = !0, i.autoplay = !0, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.transform = "translateZ(0)", i.style.willChange = "transform", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.videoElement = i, this.audioEngine.attachVideo(i), new Promise((s) => {
      let a = !1;
      const n = (h) => {
        console.error("[ST-BgLoader] Error loading video:", h), this.onError?.(), r();
      }, r = () => {
        a || (a = !0, window.clearTimeout(o), this.pendingSettle = null, i.removeEventListener("canplay", l), i.removeEventListener("error", n), s(i));
      }, o = window.setTimeout(r, Me);
      this.pendingSettle = r;
      const l = async () => {
        try {
          await i.play();
        } catch (h) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", h), i.muted = !0, i.play().catch((p) => console.error("[ST-BgLoader] Video playback error:", p));
        }
        i.style.opacity = "1", r();
      };
      i.addEventListener("canplay", l), i.addEventListener("error", n);
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
    if (this.videoElement) {
      const e = this.videoElement;
      this.pendingSettle?.(), this.audioEngine.detachVideo(e), e.pause(), e.removeAttribute("src"), e.load(), e.remove(), this.videoElement = null;
    }
  }
}
const ke = 8e3;
class J {
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
      const n = () => {
        a || (a = !0, window.clearTimeout(r), this.pendingSettle = null, s(i));
      }, r = window.setTimeout(n, ke);
      this.pendingSettle = n, i.onload = () => {
        i.style.opacity = "1", n();
      }, t ? i.src = e : i.srcdoc = e;
    });
  }
  destroy() {
    this.iframeElement && (this.pendingSettle?.(), this.iframeElement.remove(), this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement = null);
  }
}
const xe = 15e3;
class Z {
  imageElement = null;
  container;
  pendingSettle = null;
  // Surfaces broken images (corrupt bytes, 404) to the mount layer: render() still resolves
  // (the mount chain must not hang), but the failure is no longer invisible.
  onError;
  constructor(e, t) {
    this.container = e, this.onError = t;
  }
  async render(e, t = "cover") {
    this.destroy();
    const i = document.createElement("img");
    return i.className = "st-bg-image-element", i.src = e, this.applyFitting(i, t), i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", i.style.opacity = "0", i.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(i), this.imageElement = i, new Promise((s) => {
      let a = !1;
      const n = () => {
        a || (a = !0, window.clearTimeout(r), this.pendingSettle = null, s(i));
      }, r = window.setTimeout(n, xe);
      this.pendingSettle = n, i.onload = () => {
        i.style.opacity = "1", n();
      }, i.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), this.onError?.(), n();
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
const Ce = 3e4;
class Ae {
  hostEl = null;
  containerEl = null;
  // Sits between the container and the A/B layers: the visualizer's pulse pump scales
  // THIS element while parallax transforms the container — two writers, one property,
  // would fight each other.
  pumpWrapperEl = null;
  layerA = null;
  layerB = null;
  activeLayer = "A";
  // Controlled visibility state. It used to be a stray inline `display` written onto the
  // container from outside: MediaMount never learned about it, doMountMedia() did not reset
  // it, and the container is created only once — so hiding the background once meant every
  // later mount rendered into a display:none container (finding A1; toggling twice
  // cancelled out). Rendering and visibility are now orthogonal: mounts never touch it.
  visible = !0;
  videoRendererA = null;
  videoRendererB = null;
  iframeRendererA = null;
  iframeRendererB = null;
  imageRendererA = null;
  imageRendererB = null;
  audioEngine;
  crossfadeTimer = null;
  onHostReady;
  // Serializes concurrent mounts (rapid media double-click): interleaved mounts would
  // both write the same target layer and race activeLayer bookkeeping.
  mountQueue = Promise.resolve();
  /** Notified when the mounted image/video fails to decode (corrupt bytes, 404, codec). */
  renderErrorHandler = null;
  transitionType = "fade";
  transitionDurationMs = 400;
  constructor(e, t) {
    this.audioEngine = e, this.onHostReady = t ?? null;
  }
  setTransition(e, t = 400) {
    this.transitionType = e, this.transitionDurationMs = Math.max(100, Math.min(2e3, t));
  }
  /** Registers the handler for broken-media notifications (image/video decode failures). */
  setRenderErrorHandler(e) {
    this.renderErrorHandler = e;
  }
  getContainerElement() {
    return this.containerEl;
  }
  /** Pump target for the visualizer's pulse mode (see pumpWrapperEl). */
  getPumpWrapperElement() {
    return this.pumpWrapperEl;
  }
  getHostElement() {
    return this.hostEl;
  }
  /** Shows/hides the whole background layer stack (panel checkbox, PublicAPI). */
  setVisible(e) {
    this.visible = e, this.applyVisibility();
  }
  isVisible() {
    return this.visible;
  }
  applyVisibility() {
    this.containerEl && (this.containerEl.style.display = this.visible ? "block" : "none");
  }
  init() {
    if (this.hostEl = document.querySelector("#bg1"), !this.hostEl) {
      const e = new MutationObserver(() => {
        const i = document.querySelector("#bg1");
        i && (window.clearTimeout(t), e.disconnect(), this.hostEl = i, this.setupContainer());
      });
      e.observe(document.body, { childList: !0, subtree: !0 });
      const t = window.setTimeout(() => e.disconnect(), Ce);
      return;
    }
    this.setupContainer();
  }
  setupContainer() {
    if (!this.hostEl) return;
    window.getComputedStyle(this.hostEl).position === "static" && (this.hostEl.style.position = "relative");
    let t = this.hostEl.querySelector(".st-bg-media-container");
    if (t)
      this.pumpWrapperEl = t.querySelector(".st-bg-pump-wrapper"), this.layerA = t.querySelector(".st-bg-layer-a"), this.layerB = t.querySelector(".st-bg-layer-b");
    else {
      t = document.createElement("div"), t.className = "st-bg-media-container", t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t.style.overflow = "hidden", t.style.zIndex = "0", t.style.pointerEvents = "none";
      const i = document.createElement("div");
      i.className = "st-bg-pump-wrapper", i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%", i.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), i.appendChild(this.layerA), i.appendChild(this.layerB), t.appendChild(i), this.hostEl.appendChild(t);
    }
    this.pumpWrapperEl || (this.pumpWrapperEl = this.layerA?.parentElement ?? t), this.containerEl = t, this.videoRendererA = new Y(this.layerA, this.audioEngine, () => this.renderErrorHandler?.("video")), this.videoRendererB = new Y(this.layerB, this.audioEngine, () => this.renderErrorHandler?.("video")), this.iframeRendererA = new J(this.layerA), this.iframeRendererB = new J(this.layerB), this.imageRendererA = new Z(this.layerA, () => this.renderErrorHandler?.("image")), this.imageRendererB = new Z(this.layerB, () => this.renderErrorHandler?.("image")), this.applyVisibility(), this.onHostReady?.(t);
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
  mountMedia(e, t) {
    const i = () => this.doMountMedia(e, t);
    return this.mountQueue = this.mountQueue.then(i, i), this.mountQueue;
  }
  async doMountMedia(e, t) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null;
      const d = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, u = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, m = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      d.destroy(), u.destroy(), m.destroy();
      const y = this.activeLayer === "A" ? this.layerB : this.layerA;
      y && (y.style.opacity = "0", y.style.transform = "none", y.style.filter = "none");
    }
    const i = this.activeLayer === "A" ? "B" : "A", s = i === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, n = i === "B" ? this.videoRendererB : this.videoRendererA, r = i === "B" ? this.iframeRendererB : this.iframeRendererA, o = i === "B" ? this.imageRendererB : this.imageRendererA;
    n.destroy(), r.destroy(), o.destroy();
    const l = this.getFitting();
    switch (e.type) {
      case "video":
        await n.render(t, l);
        break;
      case "html":
      case "svg":
        await r.render(t, !0);
        break;
      case "image":
        await o.render(t, l);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, t);
        break;
    }
    const h = this.transitionDurationMs;
    s.style.transition = `all ${h}ms cubic-bezier(0.4, 0, 0.2, 1)`, a.style.transition = `all ${h}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const p = this.transitionType;
    p === "zoom_fade" ? (s.style.transform = "scale(1.06)", s.style.opacity = "0", s.offsetHeight, s.style.transform = "scale(1)", s.style.opacity = "1", a.style.transform = "scale(0.96)", a.style.opacity = "0") : p === "blur_fade" ? (s.style.filter = "blur(10px)", s.style.opacity = "0", s.offsetHeight, s.style.filter = "blur(0px)", s.style.opacity = "1", a.style.filter = "blur(10px)", a.style.opacity = "0") : p === "slide_left" ? (s.style.transform = "translate3d(100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(-100%, 0, 0)", a.style.opacity = "0") : p === "slide_right" ? (s.style.transform = "translate3d(-100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(100%, 0, 0)", a.style.opacity = "0") : (s.style.transform = "none", s.style.filter = "none", s.style.opacity = "1", a.style.transform = "none", a.style.filter = "none", a.style.opacity = "0"), this.activeLayer = i, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const d = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, u = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, m = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      d.destroy(), u.destroy(), m.destroy(), a.style.transform = "none", a.style.filter = "none";
    }, h + 50);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0", this.layerA.style.transform = "none", this.layerA.style.filter = "none"), this.layerB && (this.layerB.style.opacity = "0", this.layerB.style.transform = "none", this.layerB.style.filter = "none"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
const Ie = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function b(c) {
  return String(c).replace(/[&<>"']/g, (e) => Ie[e]);
}
class g {
  /**
   * Renders a compact, unified section card without redundant dividers.
   */
  static renderSection(e) {
    const t = e.id ? `id="${e.id}"` : "", i = e.icon ? `<i class="fa-solid ${e.icon}"></i> ` : "";
    return `
            <div class="st-bgloader-section${e.extraClass ? ` ${e.extraClass}` : ""}" ${t}>
                <h4>${i}<span>${b(e.title)}</span></h4>
                ${e.contentHtml}
            </div>
        `;
  }
  /**
   * Renders a compact slider row with label, input, and value readout.
   */
  static renderSlider(e) {
    const t = e.unit ?? "";
    return `
            <div class="st-bgloader-slider-row">
                <label for="${e.id}">${b(e.label)}</label>
                <input type="range" id="${e.id}" min="${e.min}" max="${e.max}" step="${e.step}" value="${e.value}" />
                <span class="st-bgloader-slider-val" id="${e.valId}">${e.value}${t}</span>
            </div>
        `;
  }
  /**
   * Renders a compact preset / dropdown row.
   */
  static renderSelect(e) {
    const t = e.options.map((i) => {
      const s = i.selected ? " selected" : "";
      return `<option value="${b(i.value)}"${s}>${b(i.label)}</option>`;
    }).join("");
    return `
            <div class="st-bgloader-preset-row">
                <label for="${e.id}">${b(e.label)}</label>
                <select id="${e.id}" class="text_pole">
                    ${t}
                </select>
            </div>
        `;
  }
  /**
   * Renders a compact checkbox item.
   */
  static renderCheckbox(e) {
    const t = e.sub ? " st-bgloader-check-sub" : "", i = e.checked ? " checked" : "", s = e.bold ? `<strong>${b(e.label)}</strong>` : b(e.label);
    return `
            <label class="st-bgloader-check${t}">
                <input type="checkbox" id="${e.id}"${i} />
                <span>${s}</span>
            </label>
        `;
  }
  /**
   * Renders a compact button.
   */
  static renderButton(e) {
    const t = ["menu_button"];
    e.variant === "danger" && t.push("menu_button_danger"), e.variant === "icon" && t.push("menu_button_icon"), e.variant === "full" && t.push("st-bgloader-btn-full"), e.disabled && t.push("st-bgloader-disabled"), e.className && t.push(e.className);
    const i = e.id ? `id="${e.id}"` : "", s = e.title ? `title="${b(e.title)}"` : "", a = e.icon ? `<i class="fa-solid ${e.icon}"></i>` : "", n = e.label ? ` ${b(e.label)}` : "";
    return `<button type="button" ${i} class="${t.join(" ")}" ${s}>${a}${n}</button>`;
  }
  /**
   * Binds a range slider input with requestAnimationFrame (rAF) throttling.
   * Guarantees 60fps smoothness and prevents layout thrashing on high-frequency drag events.
   */
  static bindRafSlider(e, t, i, s, a) {
    const n = e.querySelector(`#${t}`), r = e.querySelector(`#${i}`);
    if (!n) return;
    let o = null, l = null;
    n.addEventListener("input", () => {
      const h = Number(n.value);
      r && (r.textContent = `${h}${s}`), l = h, o === null && (o = window.requestAnimationFrame(() => {
        l !== null && a(l), o = null;
      }));
    });
  }
}
class Be {
  container = null;
  settings;
  callbacks;
  activeMediaName = null;
  constructor(e, t, i) {
    this.settings = e, this.callbacks = t, this.activeMediaName = i ?? null;
  }
  updateActiveMedia(e) {
    this.activeMediaName = e;
    const t = this.container?.querySelector("#st_bgloader_active_name");
    if (t) {
      const i = e || "默认";
      t.textContent = i.replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim() || "默认";
    }
  }
  syncMasterToggle(e) {
    this.settings.enabled = e;
    const t = this.container?.querySelector("#st_bgloader_master_enable");
    t && (t.checked = e);
    const i = this.container?.querySelector("#st_bgloader_status_pill");
    i && (i.className = `st-bgloader-status-pill ${e ? "active" : ""}`, i.textContent = e ? "已启用" : "已停用");
    const s = this.container?.querySelector("#st_bgloader_open_topbar_btn");
    s && s.classList.toggle("st-bgloader-disabled", !e);
  }
  applyRemoteSettings(e) {
    this.settings = e, this.syncMasterToggle(e.enabled);
  }
  render() {
    const e = E.getInstance(), t = e.getExtensionsSettingsContainer();
    if (!t) {
      const l = new MutationObserver(() => {
        e.getExtensionsSettingsContainer() && (window.clearTimeout(h), l.disconnect(), this.render());
      });
      l.observe(document.body, { childList: !0, subtree: !0 });
      const h = window.setTimeout(() => l.disconnect(), 3e4);
      return;
    }
    const i = document.querySelector("#st_bgloader_container, #st_bgloader_settings");
    i && i.remove();
    const s = document.createElement("div");
    s.id = "st_bgloader_container", s.className = "extension_container", s.setAttribute("data-extension-name", "ST-BgLoader");
    const n = (this.activeMediaName || "默认").replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim() || "默认", r = this.settings.enabled ?? !0, o = g.renderButton({
      id: "st_bgloader_open_topbar_btn",
      icon: "fa-arrow-up-right-from-square",
      label: "打开设置",
      disabled: !r
    });
    s.innerHTML = `
            <div id="st_bgloader_settings" class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-photo-film"></i> <span>ST-BgLoader</span></b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="st-bgloader-master-card">
                        <div class="st-bgloader-master-row">
                            <label class="st-bgloader-check st-bgloader-master-label">
                                <input type="checkbox" id="st_bgloader_master_enable" ${r ? "checked" : ""} />
                                <span><strong>启用背景增强</strong></span>
                            </label>
                        </div>
                        <div class="st-bgloader-master-status">
                            <span>背景: <strong id="st_bgloader_active_name">${b(n)}</strong></span>
                            <span class="st-bgloader-status-pill ${r ? "active" : ""}" id="st_bgloader_status_pill">
                                ${r ? "已启用" : "已停用"}
                            </span>
                        </div>
                        <div class="st-bgloader-master-actions">
                            ${o}
                        </div>
                    </div>
                </div>
            </div>
        `, t.appendChild(s), this.container = s, this.bindEvents();
  }
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector("#st_bgloader_master_enable");
    e?.addEventListener("change", () => {
      const r = e.checked;
      this.settings.enabled = r, this.syncMasterToggle(r), this.callbacks.onMasterToggle(r);
    }), this.container.querySelector("#st_bgloader_open_topbar_btn")?.addEventListener("click", () => {
      this.settings.enabled && E.getInstance().openBackgroundDrawer();
    });
    const i = this.container.querySelector(".inline-drawer-toggle"), s = this.container.querySelector(".inline-drawer"), a = this.container.querySelector(".inline-drawer-content"), n = this.container.querySelector(".inline-drawer-icon");
    if (i && s && a && n) {
      let r = !1;
      s.addEventListener("inline-drawer-toggle", () => {
        r = !0;
      });
      const o = window.$ || window.jQuery;
      if (typeof o == "function")
        try {
          o(s).on("inline-drawer-toggle", () => {
            r = !0;
          });
        } catch {
        }
      i.addEventListener("click", () => {
        r = !1, window.setTimeout(() => {
          if (!r) {
            const l = a.style.display === "none" || window.getComputedStyle(a).display === "none";
            a.style.display = l ? "block" : "none", n.classList.toggle("down", !l), n.classList.toggle("up", l), n.classList.toggle("fa-circle-chevron-down", !l), n.classList.toggle("fa-circle-chevron-up", l);
          }
        }, 50);
      });
    }
  }
}
const ee = "st-bg-native-hidden";
class Le {
  panel = null;
  hostDrawer = null;
  settings;
  cacheManager;
  callbacks;
  authority;
  activeTab = "library";
  searchQuery = "";
  typeFilter;
  sortOrder;
  /** Pending DOM-wait observer between mount() and the host drawer appearing. */
  mountObserver = null;
  searchDebounceTimer = null;
  /** Monotonic token for in-flight grid refreshes: only the newest run may write the grid. */
  refreshGeneration = 0;
  /** Video first-frame thumbnails (itemId → dataURL), generated lazily per grid render. */
  thumbCache = /* @__PURE__ */ new Map();
  thumbInflight = /* @__PURE__ */ new Map();
  constructor(e, t, i, s) {
    this.settings = e, this.cacheManager = t, this.callbacks = i, this.authority = s ?? null, this.sortOrder = this.settings.libraryView?.sortOrder ?? "name", this.typeFilter = this.settings.libraryView?.typeFilter ?? "all";
  }
  applyRemoteSettings(e) {
    this.settings = e, this.sortOrder = e.libraryView?.sortOrder ?? this.sortOrder, this.typeFilter = e.libraryView?.typeFilter ?? this.typeFilter, this.panel && this.syncFormControls();
  }
  syncBackgroundVisible(e) {
    const t = this.panel?.querySelector("#st_topbar_bg_vis_btn");
    t && (t.innerHTML = `<i class="fa-solid ${e ? "fa-eye" : "fa-eye-slash"}"></i>`, t.title = e ? "隐藏" : "显示");
    const i = this.panel?.querySelector("#st_bg_visible_topbar");
    i && (i.checked = e);
  }
  /** Mounts the takeover panel into the host's #Backgrounds drawer */
  mount() {
    const e = E.getInstance();
    if (this.hostDrawer = e.getBackgroundDrawer(), !this.hostDrawer) {
      if (this.mountObserver) return;
      const i = new MutationObserver(() => {
        const s = e.getBackgroundDrawer();
        s && (this.dropMountObserver(), this.hostDrawer = s, this.mount());
      });
      this.mountObserver = i, i.observe(document.body, { childList: !0, subtree: !0 }), setTimeout(() => this.dropMountObserver(), 15e3);
      return;
    }
    Array.from(this.hostDrawer.children).forEach((i) => {
      i.id !== "st_bgloader_topbar_panel" && i.classList.add(ee);
    });
    const t = this.hostDrawer.querySelector("#st_bgloader_topbar_panel");
    t && t.remove(), this.panel = document.createElement("div"), this.panel.id = "st_bgloader_topbar_panel", this.panel.className = "st-bgloader-topbar-panel", this.renderPanel(), this.hostDrawer.appendChild(this.panel), this.bindEvents(), this.refreshMediaGrid(), this.updateCacheStats(), this.updateCloudPanel();
  }
  /** Restores the host drawer to its native state */
  unmount() {
    this.dropMountObserver(), this.panel && (this.panel.remove(), this.panel = null), this.hostDrawer && Array.from(this.hostDrawer.children).forEach((e) => {
      e.classList.remove(ee);
    });
  }
  dropMountObserver() {
    this.mountObserver?.disconnect(), this.mountObserver = null;
  }
  /** Fire-and-forget async callback with a tagged rejection log (never an unhandled rejection). */
  reportMediaAction(e, t) {
    Promise.resolve(e).catch((i) => console.error(`[ST-BgLoader] ${t}:`, i));
  }
  renderPanel() {
    if (!this.panel) return;
    const e = this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? !0;
    this.panel.innerHTML = `
            <div class="st-bgloader-topbar-header">
                <div class="st-bgloader-tab-bar">
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === "library" ? "active" : ""}" data-tab="library">
                        <i class="fa-solid fa-photo-film"></i> 媒体
                    </button>
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === "settings" ? "active" : ""}" data-tab="settings">
                        <i class="fa-solid fa-sliders"></i> 设置
                    </button>
                </div>
                <div class="st-bgloader-topbar-actions">
                    <button type="button" id="st_topbar_bg_vis_btn" class="menu_button menu_button_icon" title="${e ? "隐藏" : "显示"}">
                        <i class="fa-solid ${e ? "fa-eye" : "fa-eye-slash"}"></i>
                    </button>
                    <button type="button" id="st_topbar_bg_clear_btn" class="menu_button menu_button_icon" title="清除">
                        <i class="fa-solid fa-ban"></i>
                    </button>
                    <button type="button" id="st_topbar_drawer_close" class="menu_button menu_button_icon" title="收起">
                        <i class="fa-solid fa-chevron-up"></i>
                    </button>
                </div>
            </div>

            <div class="st-bgloader-topbar-body">
                <!-- Tab 1: Library -->
                <div id="st_tab_library" class="st-bgloader-tab-content ${this.activeTab === "library" ? "active" : ""}">
                    <div class="st-bgloader-toolbar-row">
                        <div class="st-bgloader-search-wrap">
                            <input type="search" id="st_topbar_search" class="text_pole" placeholder="搜索..." value="${b(this.searchQuery)}" />
                        </div>
                        <select id="st_topbar_type_filter" class="text_pole">
                            <option value="all" ${this.typeFilter === "all" ? "selected" : ""}>全部</option>
                            <option value="image" ${this.typeFilter === "image" ? "selected" : ""}>图片</option>
                            <option value="video" ${this.typeFilter === "video" ? "selected" : ""}>视频</option>
                            <option value="audio" ${this.typeFilter === "audio" ? "selected" : ""}>音频</option>
                            <option value="html" ${this.typeFilter === "html" ? "selected" : ""}>网页</option>
                        </select>
                        <select id="st_topbar_sort" class="text_pole">
                            <option value="name" ${this.sortOrder === "name" ? "selected" : ""}>名称</option>
                            <option value="time" ${this.sortOrder === "time" ? "selected" : ""}>时间</option>
                            <option value="size" ${this.sortOrder === "size" ? "selected" : ""}>大小</option>
                        </select>
                        <button type="button" id="st_topbar_upload_toggle_btn" class="menu_button" title="导入">
                            <i class="fa-solid fa-cloud-arrow-up"></i> 导入
                        </button>
                    </div>

                    <!-- Collapsible Upload Box -->
                    <div id="st_topbar_upload_box" class="st-bgloader-upload-box" style="display: none;">
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone">
                            <i class="fa-solid fa-file-video fa-2x"></i>
                            <div>点击或拖拽文件导入</div>
                            <input type="file" id="st_bgloader_file_input" class="st-bgloader-hidden" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" class="text_pole" placeholder="媒体 URL..." />
                            <button type="button" id="st_bgloader_url_btn" class="menu_button">导入</button>
                        </div>
                    </div>

                    <!-- Media Grid -->
                    <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                        <div class="st-bgloader-grid-loading"><i class="fa-solid fa-spinner fa-spin"></i> 加载中...</div>
                    </div>
                </div>

                <!-- Tab 2: Settings -->
                <div id="st_tab_settings" class="st-bgloader-tab-content ${this.activeTab === "settings" ? "active" : ""}">
                    <!-- Scene -->
                    ${g.renderSection({
      title: "场景",
      icon: "fa-earth-americas",
      contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-sm">场景:</label>
                                <select id="st_scene_select" class="text_pole"></select>
                                <button type="button" id="st_scene_apply_btn" class="menu_button" title="应用"><i class="fa-solid fa-play"></i> 应用</button>
                                <button type="button" id="st_scene_save_btn" class="menu_button" title="保存"><i class="fa-solid fa-floppy-disk"></i></button>
                                <button type="button" id="st_scene_del_btn" class="menu_button" title="删除"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `
    })}

                    <!-- Filters -->
                    ${g.renderSection({
      title: "滤镜",
      icon: "fa-sliders",
      contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-sm">预设:</label>
                                <select id="st_preset_select" class="text_pole"></select>
                                <button type="button" id="st_preset_save_btn" class="menu_button" title="保存"><i class="fa-solid fa-floppy-disk"></i></button>
                                <button type="button" id="st_preset_del_btn" class="menu_button" title="删除"><i class="fa-solid fa-trash"></i></button>
                            </div>
                            ${g.renderSlider({ id: "st_filter_blur", valId: "st_filter_blur_val", label: "模糊", min: 0, max: 20, step: 1, value: this.settings.filters.blur, unit: "px" })}
                            ${g.renderSlider({ id: "st_filter_brightness", valId: "st_filter_brightness_val", label: "亮度", min: 0, max: 200, step: 5, value: this.settings.filters.brightness, unit: "%" })}
                            ${g.renderSlider({ id: "st_filter_opacity", valId: "st_filter_opacity_val", label: "不透明", min: 0, max: 100, step: 5, value: this.settings.filters.opacity, unit: "%" })}
                            ${g.renderSlider({ id: "st_filter_saturate", valId: "st_filter_saturate_val", label: "饱和度", min: 0, max: 200, step: 5, value: this.settings.filters.saturate, unit: "%" })}
                            <div class="st-bgloader-check-stack">
                                ${g.renderCheckbox({ id: "st_bg_interactive", label: "背景交互", checked: this.settings.interactiveBackground })}
                            </div>
                        `
    })}

                    <!-- Weather -->
                    ${g.renderSection({
      title: "天气",
      icon: "fa-cloud-sun-rain",
      contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-md">天气:</label>
                                <select id="st_weather_type" class="text_pole">
                                    ${k.map((t) => `<option value="${t}" ${this.settings.weather.type === t ? "selected" : ""}>${he[t]}</option>`).join("")}
                                </select>
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-md">密度:</label>
                                <select id="st_weather_density" class="text_pole">
                                    <option value="low" ${this.settings.weather.density === "low" ? "selected" : ""}>稀疏</option>
                                    <option value="medium" ${this.settings.weather.density === "medium" ? "selected" : ""}>适中</option>
                                    <option value="high" ${this.settings.weather.density === "high" ? "selected" : ""}>密集</option>
                                </select>
                            </div>
                            ${g.renderSlider({ id: "st_weather_speed", valId: "st_weather_speed_val", label: "速度", min: 5, max: 25, step: 1, value: Math.round(this.settings.weather.speed * 10), unit: "x" })}
                            ${g.renderSlider({ id: "st_weather_opacity", valId: "st_weather_opacity_val", label: "不透明", min: 10, max: 100, step: 5, value: Math.round(this.settings.weather.opacity * 100), unit: "%" })}
                        `
    })}

                    <!-- Motion -->
                    ${g.renderSection({
      title: "动效",
      icon: "fa-chart-simple",
      contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label>律动:</label>
                                <select id="st_visualizer_mode" class="text_pole">
                                    <option value="off" ${this.settings.visualizer.mode === "off" ? "selected" : ""}>关闭</option>
                                    <option value="pulse" ${this.settings.visualizer.mode === "pulse" ? "selected" : ""}>呼吸</option>
                                    <option value="spectrum" ${this.settings.visualizer.mode === "spectrum" ? "selected" : ""}>频谱</option>
                                </select>
                            </div>
                            ${g.renderSlider({ id: "st_visualizer_sens", valId: "st_visualizer_sens_val", label: "灵敏度", min: 5, max: 25, step: 1, value: Math.round(this.settings.visualizer.sensitivity * 10), unit: "x" })}
                            <div class="st-bgloader-check-stack">
                                ${g.renderCheckbox({ id: "st_parallax_enabled", label: "景深视差", checked: this.settings.parallax.enabled })}
                            </div>
                            ${g.renderSlider({ id: "st_parallax_intensity", valId: "st_parallax_intensity_val", label: "深度", min: 1, max: 10, step: 1, value: Math.round(this.settings.parallax.intensity * 10), unit: "" })}
                        `
    })}

                    <!-- Ambient Sound -->
                    ${g.renderSection({
      title: "音效",
      icon: "fa-fire",
      contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label>音效:</label>
                                <select id="st_ambient_type" class="text_pole">
                                    <option value="off" ${this.settings.ambientSound.type === "off" ? "selected" : ""}>关闭</option>
                                    <option value="rain" ${this.settings.ambientSound.type === "rain" ? "selected" : ""}>雨声</option>
                                    <option value="fire" ${this.settings.ambientSound.type === "fire" ? "selected" : ""}>壁炉</option>
                                    <option value="wind" ${this.settings.ambientSound.type === "wind" ? "selected" : ""}>风声</option>
                                </select>
                            </div>
                            ${g.renderSlider({ id: "st_ambient_vol", valId: "st_ambient_vol_val", label: "音量", min: 0, max: 100, step: 5, value: Math.round(this.settings.ambientSound.volume * 100), unit: "%" })}
                        `
    })}

                    <!-- Frosted Chat -->
                    ${g.renderSection({
      title: "毛玻璃",
      icon: "fa-eye",
      contentHtml: `
                            <div class="st-bgloader-check-stack">
                                ${g.renderCheckbox({ id: "st_frosted_enabled", label: "毛玻璃穿透", checked: this.settings.frostedChat.enabled })}
                            </div>
                            ${g.renderSlider({ id: "st_frosted_blur", valId: "st_frosted_blur_val", label: "模糊", min: 0, max: 25, step: 1, value: this.settings.frostedChat.blur, unit: "px" })}
                            ${g.renderSlider({ id: "st_frosted_opacity", valId: "st_frosted_opacity_val", label: "不透明", min: 20, max: 100, step: 5, value: this.settings.frostedChat.opacity, unit: "%" })}
                        `
    })}

                    <!-- Transition -->
                    ${g.renderSection({
      title: "转场",
      icon: "fa-wand-magic-sparkles",
      contentHtml: `
                            <div class="st-bgloader-preset-row">
                                <label>效果:</label>
                                <select id="st_transition_effect" class="text_pole">
                                    <option value="fade" ${this.settings.transitionEffect === "fade" ? "selected" : ""}>淡入</option>
                                    <option value="zoom_fade" ${this.settings.transitionEffect === "zoom_fade" ? "selected" : ""}>缩放</option>
                                    <option value="blur_fade" ${this.settings.transitionEffect === "blur_fade" ? "selected" : ""}>柔焦</option>
                                    <option value="slide_left" ${this.settings.transitionEffect === "slide_left" ? "selected" : ""}>左移</option>
                                    <option value="slide_right" ${this.settings.transitionEffect === "slide_right" ? "selected" : ""}>右移</option>
                                </select>
                            </div>
                            ${g.renderSlider({ id: "st_transition_dur", valId: "st_transition_dur_val", label: "时长", min: 200, max: 1500, step: 50, value: this.settings.transitionDurationMs, unit: "ms" })}
                        `
    })}

                    <!-- Audio Engine -->
                    ${g.renderSection({
      title: "音乐",
      icon: "fa-volume-high",
      contentHtml: `
                            ${g.renderSlider({ id: "st_audio_volume", valId: "st_audio_volume_val", label: "音量", min: 0, max: 100, step: 1, value: Math.round(this.settings.volume * 100), unit: "%" })}
                            <div class="st-bgloader-preset-row">
                                <label>模式:</label>
                                <select id="st_playback_mode" class="text_pole">
                                    <option value="loop" ${this.settings.playbackMode === "loop" ? "selected" : ""}>列表循环</option>
                                    <option value="single" ${this.settings.playbackMode === "single" ? "selected" : ""}>单曲循环</option>
                                    <option value="shuffle" ${this.settings.playbackMode === "shuffle" ? "selected" : ""}>随机播放</option>
                                </select>
                            </div>
                            <div class="st-bgloader-check-stack">
                                ${g.renderCheckbox({ id: "st_audio_mute", label: "静音", checked: this.settings.muted })}
                                ${g.renderCheckbox({ id: "st_audio_muffle", label: "沉浸低通", checked: this.settings.muffleBGM })}
                                ${g.renderCheckbox({ id: "st_audio_blur", label: "后台暂停", checked: this.settings.pauseOnBlur })}
                                ${g.renderCheckbox({ id: "st_mini_player_toggle", label: "悬浮胶囊", checked: this.settings.showMiniPlayer })}
                                ${g.renderCheckbox({ id: "st_capsule_on_play", label: "播放时显示", checked: this.settings.capsuleOnPlayOnly, sub: !0 })}
                            </div>
                        `
    })}

                    <!-- Triggers -->
                    ${g.renderSection({
      title: "触发器",
      icon: "fa-bolt",
      contentHtml: `
                            <div class="st-bgloader-trigger-list" id="st_trigger_list"></div>
                            <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                                <div class="st-bgloader-preset-row">
                                    <label>类型:</label>
                                    <select id="st_trigger_type" class="text_pole">
                                        <option value="character">角色</option>
                                        <option value="chat">聊天</option>
                                        <option value="regex">正则</option>
                                    </select>
                                </div>
                                <div class="st-bgloader-preset-row">
                                    <label>规则:</label>
                                    <input type="text" id="st_trigger_name" class="text_pole" placeholder="名称" />
                                </div>
                                <div class="st-bgloader-preset-row">
                                    <label>匹配:</label>
                                    <input type="text" id="st_trigger_pattern" class="text_pole" placeholder="匹配文本" />
                                </div>
                                <div class="st-bgloader-btn-row">
                                    <button type="button" id="st_trigger_confirm_btn" class="menu_button"><i class="fa-solid fa-check"></i> 添加</button>
                                    <button type="button" id="st_trigger_cancel_btn" class="menu_button">取消</button>
                                </div>
                            </div>
                            <button type="button" id="st_trigger_add_btn" class="menu_button st-bgloader-btn-full">
                                <i class="fa-solid fa-plus"></i> 添加
                            </button>
                        `
    })}

                    <!-- Storage -->
                    ${g.renderSection({
      title: "存储",
      icon: "fa-file-export",
      contentHtml: `
                            <div class="st-bgloader-row-between">
                                <div>已用: <strong id="st_cache_used">0 MB</strong> <span id="st_cache_count">0</span>项</div>
                                <button type="button" id="st_cache_clear_btn" class="menu_button menu_button_danger">清空</button>
                            </div>
                            ${g.renderSlider({ id: "st_cache_quota", valId: "st_cache_quota_val", label: "配额", min: 128, max: 8192, step: 128, value: this.settings.cacheQuotaMB, unit: " MB" })}
                            <div class="st-bgloader-check-stack">
                                ${g.renderCheckbox({ id: "st_cache_autoclean", label: "自动清理", checked: this.settings.lruAutoClean })}
                            </div>
                            <div class="st-bgloader-btn-row">
                                <button type="button" id="st_backup_export_btn" class="menu_button"><i class="fa-solid fa-download"></i> 导出</button>
                                <label for="st_backup_import_file" class="menu_button">
                                    <i class="fa-solid fa-upload"></i> 导入
                                    <input type="file" id="st_backup_import_file" class="st-bgloader-hidden" accept=".json" />
                                </label>
                            </div>
                        `
    })}

                    <!-- Cloud -->
                    ${g.renderSection({
      id: "st_authority_section",
      title: "云端",
      icon: "fa-cloud",
      contentHtml: `
                            <div id="st_cloud_status_text" class="st-bgloader-cloud-note"></div>
                            <div class="st-bgloader-check-stack">
                                ${g.renderCheckbox({ id: "st_agent_tools_enable", label: "Agent导演", checked: this.settings.agentToolsEnabled })}
                            </div>
                        `
    })}
                </div>
            </div>
        `;
  }
  bindEvents() {
    if (!this.panel) return;
    this.panel.querySelectorAll(".st-bgloader-tab-btn").forEach((u) => {
      u.addEventListener("click", () => {
        const m = u.dataset.tab;
        if (!m) return;
        this.activeTab = m, this.panel?.querySelectorAll(".st-bgloader-tab-btn").forEach((v) => v.classList.remove("active")), u.classList.add("active"), this.panel?.querySelectorAll(".st-bgloader-tab-content").forEach((v) => v.classList.remove("active"));
        const y = this.panel?.querySelector(`#st_tab_${m}`);
        y && y.classList.add("active");
      });
    }), this.panel.querySelector("#st_topbar_bg_vis_btn")?.addEventListener("click", () => {
      const m = !(this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? !0);
      this.callbacks.onBackgroundVisibilityChanged?.(m), this.syncBackgroundVisible(m);
    }), this.panel.querySelector("#st_topbar_bg_clear_btn")?.addEventListener("click", () => {
      this.callbacks.onClearActiveBackground?.();
    }), this.panel.querySelector("#st_topbar_drawer_close")?.addEventListener("click", () => {
      E.getInstance().closeBackgroundDrawer();
    });
    const s = this.panel.querySelector("#st_topbar_search");
    s?.addEventListener("input", () => {
      this.searchQuery = s.value.trim().toLowerCase(), this.searchDebounceTimer !== null && window.clearTimeout(this.searchDebounceTimer), this.searchDebounceTimer = window.setTimeout(() => {
        this.searchDebounceTimer = null, this.refreshMediaGrid();
      }, 250);
    });
    const a = this.panel.querySelector("#st_topbar_type_filter");
    a?.addEventListener("change", () => {
      this.typeFilter = a.value, this.settings.libraryView || (this.settings.libraryView = { sortOrder: this.sortOrder, typeFilter: "all" }), this.settings.libraryView.typeFilter = this.typeFilter, this.save(), this.refreshMediaGrid();
    });
    const n = this.panel.querySelector("#st_topbar_sort");
    n?.addEventListener("change", () => {
      this.sortOrder = n.value || "name", this.settings.libraryView || (this.settings.libraryView = { sortOrder: "name", typeFilter: this.typeFilter }), this.settings.libraryView.sortOrder = this.sortOrder, this.save(), this.refreshMediaGrid();
    });
    const r = this.panel.querySelector("#st_topbar_upload_toggle_btn"), o = this.panel.querySelector("#st_topbar_upload_box");
    r?.addEventListener("click", () => {
      if (!o) return;
      const u = o.style.display === "none";
      o.style.display = u ? "block" : "none", r.classList.toggle("active", u);
    });
    const l = this.panel.querySelector("#st_bgloader_dropzone"), h = this.panel.querySelector("#st_bgloader_file_input");
    l?.addEventListener("click", () => h?.click()), l?.addEventListener("dragover", (u) => {
      u.preventDefault(), l.classList.add("dragover");
    }), l?.addEventListener("dragleave", () => l.classList.remove("dragover")), l?.addEventListener("drop", (u) => {
      u.preventDefault(), l.classList.remove("dragover");
      const m = u.dataTransfer?.files;
      m && m.length > 0 && this.handleFileUpload(m[0]);
    }), h?.addEventListener("change", () => {
      h.files && h.files.length > 0 && this.handleFileUpload(h.files[0]);
    });
    const p = this.panel.querySelector("#st_bgloader_url_btn"), d = this.panel.querySelector("#st_bgloader_url_input");
    p?.addEventListener("click", () => {
      const u = d?.value.trim();
      u && (this.handleUrlImport(u), d && (d.value = ""));
    }), this.bindSettingsFormEvents();
  }
  bindSettingsFormEvents() {
    if (!this.panel) return;
    const e = (f, w, B, F) => {
      this.panel && g.bindRafSlider(this.panel, f, w, B, F);
    };
    e("st_filter_blur", "st_filter_blur_val", "px", (f) => {
      this.settings.filters.blur = f, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_brightness", "st_filter_brightness_val", "%", (f) => {
      this.settings.filters.brightness = f, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_opacity", "st_filter_opacity_val", "%", (f) => {
      this.settings.filters.opacity = f, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_saturate", "st_filter_saturate_val", "%", (f) => {
      this.settings.filters.saturate = f, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    });
    const t = this.panel.querySelector("#st_bg_interactive");
    t?.addEventListener("change", () => {
      this.settings.interactiveBackground = t.checked, this.callbacks.onInteractiveChanged(t.checked), this.save();
    });
    const i = this.panel.querySelector("#st_weather_type"), s = this.panel.querySelector("#st_weather_density"), a = () => {
      i && (this.settings.weather.type = i.value), s && (this.settings.weather.density = s.value), this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    };
    i?.addEventListener("change", a), s?.addEventListener("change", a), e("st_weather_speed", "st_weather_speed_val", "x", (f) => {
      this.settings.weather.speed = f / 10, this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    }), e("st_weather_opacity", "st_weather_opacity_val", "%", (f) => {
      this.settings.weather.opacity = f / 100, this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    });
    const n = this.panel.querySelector("#st_visualizer_mode");
    n?.addEventListener("change", () => {
      this.settings.visualizer.mode = n.value, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.save();
    }), e("st_visualizer_sens", "st_visualizer_sens_val", "x", (f) => {
      this.settings.visualizer.sensitivity = f / 10, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.save();
    });
    const r = this.panel.querySelector("#st_parallax_enabled");
    r?.addEventListener("change", () => {
      this.settings.parallax.enabled = r.checked, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.save();
    }), e("st_parallax_intensity", "st_parallax_intensity_val", "", (f) => {
      this.settings.parallax.intensity = f / 10, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.save();
    });
    const o = this.panel.querySelector("#st_ambient_type");
    o?.addEventListener("change", () => {
      this.settings.ambientSound.type = o.value, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.save();
    }), e("st_ambient_vol", "st_ambient_vol_val", "%", (f) => {
      this.settings.ambientSound.volume = f / 100, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.save();
    });
    const l = this.panel.querySelector("#st_frosted_enabled");
    l?.addEventListener("change", () => {
      this.settings.frostedChat.enabled = l.checked, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    }), e("st_frosted_blur", "st_frosted_blur_val", "px", (f) => {
      this.settings.frostedChat.blur = f, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    }), e("st_frosted_opacity", "st_frosted_opacity_val", "%", (f) => {
      this.settings.frostedChat.opacity = f, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    });
    const h = this.panel.querySelector("#st_transition_effect");
    h?.addEventListener("change", () => {
      this.settings.transitionEffect = h.value, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.save();
    }), e("st_transition_dur", "st_transition_dur_val", "ms", (f) => {
      this.settings.transitionDurationMs = f, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.save();
    }), e("st_audio_volume", "st_audio_volume_val", "%", (f) => {
      this.settings.volume = f / 100, this.save();
    });
    const p = this.panel.querySelector("#st_playback_mode");
    p?.addEventListener("change", () => {
      this.settings.playbackMode = p.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.save();
    });
    const d = this.panel.querySelector("#st_audio_mute");
    d?.addEventListener("change", () => {
      this.settings.muted = d.checked, this.save();
    });
    const u = this.panel.querySelector("#st_audio_muffle");
    u?.addEventListener("change", () => {
      this.settings.muffleBGM = u.checked, this.callbacks.onMuffleChanged?.(u.checked), this.save();
    });
    const m = this.panel.querySelector("#st_audio_blur");
    m?.addEventListener("change", () => {
      this.settings.pauseOnBlur = m.checked, this.save();
    });
    const y = this.panel.querySelector("#st_mini_player_toggle");
    y?.addEventListener("change", () => {
      this.settings.showMiniPlayer = y.checked, this.callbacks.onMiniPlayerToggle(y.checked), this.save();
    });
    const v = this.panel.querySelector("#st_capsule_on_play");
    v?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = v.checked, this.callbacks.onCapsuleOnPlayToggle?.(v.checked), this.save();
    }), e("st_cache_quota", "st_cache_quota_val", " MB", (f) => {
      this.settings.cacheQuotaMB = f, this.save();
    });
    const j = this.panel.querySelector("#st_cache_autoclean");
    j?.addEventListener("change", () => {
      this.settings.lruAutoClean = j.checked, this.save();
    }), this.panel.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      await this.cacheManager.clearAll(), this.updateCacheStats(), this.refreshMediaGrid();
    }), this.panel.querySelector("#st_backup_export_btn")?.addEventListener("click", () => {
      const f = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.settings, null, 2)), w = document.createElement("a");
      w.setAttribute("href", f), w.setAttribute("download", `st-bgloader-backup-${Date.now()}.json`), document.body.appendChild(w), w.click(), w.remove();
    }), this.panel.querySelector("#st_backup_import_file")?.addEventListener("change", (f) => {
      const w = f.target.files?.[0];
      if (!w) return;
      const B = new FileReader();
      B.onload = (F) => {
        try {
          const K = JSON.parse(F.target?.result);
          this.settings = z({ ...this.settings, ...K }), this.save(), this.syncFormControls();
        } catch {
          alert("导入失败：不是有效的 JSON 配置文件");
        }
      }, B.readAsText(w);
    }), this.updatePresetSelect(), this.updateSceneSelect(), this.updateTriggersUI();
  }
  save() {
    this.callbacks.onSettingsChanged(this.settings);
  }
  syncFormControls() {
    this.panel && (this.updateFilterSliders(), this.updateSettingsControls(), this.updatePresetSelect(), this.updateSceneSelect(), this.updateTriggersUI(), this.updateCacheStats(), this.updateCloudPanel());
  }
  updateFilterSliders() {
    if (!this.panel) return;
    const e = (t, i, s, a) => {
      const n = this.panel?.querySelector(`#${t}`), r = this.panel?.querySelector(`#${i}`);
      n && (n.value = String(s)), r && (r.textContent = `${s}${a}`);
    };
    e("st_filter_blur", "st_filter_blur_val", this.settings.filters.blur, "px"), e("st_filter_brightness", "st_filter_brightness_val", this.settings.filters.brightness, "%"), e("st_filter_opacity", "st_filter_opacity_val", this.settings.filters.opacity, "%"), e("st_filter_saturate", "st_filter_saturate_val", this.settings.filters.saturate, "%");
  }
  /**
   * Backfills every settings-tab control from the (possibly remotely updated) settings
   * object: weather, visualizer, parallax, ambient, frosted glass, transition, audio,
   * cache quota and agent tools. Without this, a remote convergence left those form
   * controls showing stale values even though the subsystems had already applied them.
   */
  updateSettingsControls() {
    if (!this.panel) return;
    const e = (n, r) => {
      const o = this.panel?.querySelector(`#${n}`);
      o && (o.value = r);
    }, t = (n, r, o, l) => {
      const h = this.panel?.querySelector(`#${n}`), p = this.panel?.querySelector(`#${r}`);
      h && (h.value = String(o)), p && (p.textContent = `${o}${l}`);
    }, i = (n, r) => {
      const o = this.panel?.querySelector(`#${n}`);
      o && (o.checked = r);
    };
    e("st_weather_type", this.settings.weather.type), e("st_weather_density", this.settings.weather.density), t("st_weather_speed", "st_weather_speed_val", Math.round(this.settings.weather.speed * 10), "x"), t("st_weather_opacity", "st_weather_opacity_val", Math.round(this.settings.weather.opacity * 100), "%"), e("st_visualizer_mode", this.settings.visualizer.mode), t("st_visualizer_sens", "st_visualizer_sens_val", Math.round(this.settings.visualizer.sensitivity * 10), "x"), i("st_parallax_enabled", this.settings.parallax.enabled), t("st_parallax_intensity", "st_parallax_intensity_val", Math.round(this.settings.parallax.intensity * 10), ""), e("st_ambient_type", this.settings.ambientSound.type), t("st_ambient_vol", "st_ambient_vol_val", Math.round(this.settings.ambientSound.volume * 100), "%"), i("st_frosted_enabled", this.settings.frostedChat.enabled), t("st_frosted_blur", "st_frosted_blur_val", this.settings.frostedChat.blur, "px"), t("st_frosted_opacity", "st_frosted_opacity_val", this.settings.frostedChat.opacity, "%"), e("st_transition_effect", this.settings.transitionEffect), t("st_transition_dur", "st_transition_dur_val", this.settings.transitionDurationMs, "ms"), t("st_audio_volume", "st_audio_volume_val", Math.round(this.settings.volume * 100), "%"), e("st_playback_mode", this.settings.playbackMode), i("st_audio_mute", this.settings.muted), i("st_audio_muffle", this.settings.muffleBGM), i("st_audio_blur", this.settings.pauseOnBlur), i("st_mini_player_toggle", this.settings.showMiniPlayer), i("st_capsule_on_play", this.settings.capsuleOnPlayOnly), t("st_cache_quota", "st_cache_quota_val", this.settings.cacheQuotaMB, " MB"), i("st_cache_autoclean", this.settings.lruAutoClean), i("st_agent_tools_enable", this.settings.agentToolsEnabled);
    const s = this.panel?.querySelector("#st_topbar_type_filter");
    s && (s.value = this.typeFilter);
    const a = this.panel?.querySelector("#st_topbar_sort");
    a && (a.value = this.sortOrder);
  }
  async refreshMediaGrid() {
    const e = this.panel?.querySelector("#st_bgloader_grid");
    if (!e) return;
    const t = ++this.refreshGeneration;
    let i = await this.cacheManager.listMedia();
    if (t !== this.refreshGeneration) return;
    if (this.typeFilter !== "all" && (i = i.filter((a) => a.type === this.typeFilter)), this.searchQuery && (i = i.filter((a) => a.name.toLowerCase().includes(this.searchQuery))), this.sortOrder === "time" ? i.sort((a, n) => (n.addedTimestamp || 0) - (a.addedTimestamp || 0)) : this.sortOrder === "size" ? i.sort((a, n) => (n.size || 0) - (a.size || 0)) : i.sort((a, n) => a.name.localeCompare(n.name)), i.length === 0) {
      e.innerHTML = `
                <div class="st-bgloader-empty-state">
                    <i class="fa-solid fa-folder-open fa-2x"></i>
                    <div>无文件</div>
                </div>
            `;
      return;
    }
    e.innerHTML = "";
    const s = document.createDocumentFragment();
    i.forEach((a) => {
      const n = document.createElement("div"), r = this.settings.activeMediaId === a.id;
      n.className = `st-bgloader-media-card ${r ? "active" : ""}`, n.title = a.name, n.dataset.itemId = a.id;
      let o = "fa-file-image";
      a.type === "video" && (o = "fa-file-video"), a.type === "audio" && (o = "fa-file-audio"), (a.type === "html" || a.type === "svg") && (o = "fa-file-code");
      const l = a.type === "image" ? `<div class="st-bgloader-card-img" style="background-image: url('${b(a.url)}')"></div>` : a.type === "video" ? '<div class="st-bgloader-card-img st-bgloader-card-img-pending"></div>' : `<div class="st-bgloader-card-icon"><i class="fa-solid ${o} fa-2x"></i></div>`, h = a.name.replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim() || a.name;
      n.innerHTML = `
                ${l}
                <div class="st-bgloader-card-info">
                    <div class="st-bgloader-card-name">${b(h)}</div>
                    <div class="st-bgloader-card-meta">
                        <span class="st-bg-native-badge ${a.type}">${a.type.toUpperCase()}</span>
                        ${r ? '<span class="st-bgloader-active-tag"><i class="fa-solid fa-check"></i> 当前</span>' : ""}
                    </div>
                </div>
                <div class="st-bgloader-card-actions">
                    <button type="button" class="menu_button menu_button_icon st-card-apply" title="应用"><i class="fa-solid fa-play"></i></button>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-card-delete" title="删除"><i class="fa-solid fa-trash"></i></button>
                </div>
            `, n.querySelector(".st-card-apply")?.addEventListener("click", (p) => {
        p.stopPropagation(), this.reportMediaAction(this.callbacks.onMediaSelected(a), "应用媒体失败");
      }), n.querySelector(".st-card-delete")?.addEventListener("click", async (p) => {
        if (p.stopPropagation(), confirm("确认删除？")) {
          try {
            await this.cacheManager.deleteMedia(a.id), await this.callbacks.onMediaDeleted(a.id);
          } catch (d) {
            console.error("[ST-BgLoader] 删除媒体失败:", d);
          }
          this.refreshMediaGrid(), this.updateCacheStats();
        }
      }), n.addEventListener("click", () => {
        this.reportMediaAction(this.callbacks.onMediaSelected(a), "应用媒体失败");
      }), n.tabIndex = 0, n.setAttribute("role", "button"), n.setAttribute("aria-label", `应用媒体 ${a.name}`), n.addEventListener("keydown", (p) => {
        const d = p.key;
        if (d === "Enter" || d === " ") {
          p.preventDefault(), this.reportMediaAction(this.callbacks.onMediaSelected(a), "应用媒体失败");
          return;
        }
        if (d !== "ArrowRight" && d !== "ArrowLeft" && d !== "ArrowUp" && d !== "ArrowDown") return;
        p.preventDefault();
        const u = Array.from(e.querySelectorAll(".st-bgloader-media-card")), m = u.indexOf(n), y = getComputedStyle(e).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
        let v = m;
        d === "ArrowRight" ? v = m + 1 : d === "ArrowLeft" ? v = m - 1 : d === "ArrowUp" ? v = m - y : v = m + y, v >= 0 && v < u.length && u[v].focus();
      }), s.appendChild(n);
    }), e.appendChild(s), this.populateVideoThumbnails(i, t);
  }
  /**
   * Fills video cards with first-frame thumbnails after the grid renders. Lazily generated
   * (2 at a time, seek ~1/3 into the stream), cached per item for the session; failures fall
   * back to the empty placeholder tile silently. Generation-guarded so a newer grid refresh
   * is never painted by a stale run.
   */
  async populateVideoThumbnails(e, t) {
    const i = e.filter((n) => n.type === "video"), s = (n, r) => {
      if (t !== this.refreshGeneration || !this.panel) return;
      const o = this.panel.querySelector(
        `#st_bgloader_grid .st-bgloader-media-card[data-item-id="${CSS.escape(n.id)}"] .st-bgloader-card-img`
      );
      o && (o.style.backgroundImage = `url('${r}')`, o.classList.remove("st-bgloader-card-img-pending"));
    }, a = async () => {
      for (; i.length > 0; ) {
        const n = i.shift(), r = await this.getVideoThumbnail(n);
        r && s(n, r);
      }
    };
    await Promise.all(Array.from({ length: Math.min(2, i.length) }, a));
  }
  async getVideoThumbnail(e) {
    const t = this.thumbCache.get(e.id);
    if (t) return t;
    const i = this.thumbInflight.get(e.id);
    if (i) return i;
    const s = this.makeVideoThumb(e).then((a) => (a && this.thumbCache.set(e.id, a), a)).finally(() => this.thumbInflight.delete(e.id));
    return this.thumbInflight.set(e.id, s), s;
  }
  makeVideoThumb(e) {
    return new Promise((t) => {
      let i = null, s = !1;
      const a = (h) => {
        s || (s = !0, window.clearTimeout(n), i && (i.removeEventListener("loadeddata", r), i.removeEventListener("seeked", o), i.removeEventListener("error", l), i.removeAttribute("src"), i.load(), i.remove(), i = null), t(h));
      }, n = window.setTimeout(() => a(null), 8e3), r = () => {
        try {
          const h = i && Number.isFinite(i.duration) ? Math.min(0.5, i.duration / 3) : 0.1;
          i.currentTime = h;
        } catch {
          a(null);
        }
      }, o = () => {
        try {
          const h = document.createElement("canvas");
          h.width = 240, h.height = 135, h.getContext("2d").drawImage(i, 0, 0, 240, 135), a(h.toDataURL("image/jpeg", 0.6));
        } catch {
          a(null);
        }
      }, l = () => a(null);
      this.cacheManager.getMediaBlobUrl(e).then((h) => {
        s || (i = document.createElement("video"), i.muted = !0, i.preload = "metadata", i.style.display = "none", i.addEventListener("loadeddata", r), i.addEventListener("seeked", o), i.addEventListener("error", l), document.body.appendChild(i), i.src = h);
      }).catch(() => a(null));
    });
  }
  async handleFileUpload(e) {
    try {
      const t = M(e.name), i = await this.cacheManager.saveMedia(
        e,
        e.name,
        t,
        "server"
      );
      this.callbacks.onMediaUploaded(i), this.refreshMediaGrid(), this.updateCacheStats();
    } catch (t) {
      console.error("[ST-BgLoader] Upload failed:", t), alert(`上传失败: ${t.message}`);
    }
  }
  async handleUrlImport(e) {
    try {
      const t = e.substring(e.lastIndexOf("/") + 1).split("?")[0] || "remote_media", i = M(t), s = await this.cacheManager.saveMedia(
        new Blob([]),
        t,
        i,
        "url",
        e
      );
      this.callbacks.onMediaUploaded(s), this.refreshMediaGrid(), this.updateCacheStats();
    } catch (t) {
      console.error("[ST-BgLoader] URL Import failed:", t), alert(`URL 导入失败: ${t.message}`);
    }
  }
  updatePresetSelect() {
    const e = this.panel?.querySelector("#st_preset_select");
    if (!e) return;
    e.innerHTML = "", Object.values(I).forEach((s) => {
      const a = document.createElement("option");
      a.value = s.id, a.textContent = s.name, a.selected = this.settings.activePresetId === s.id, e.appendChild(a);
    }), Object.entries(this.settings.userPresets || {}).forEach(([s, a]) => {
      const n = document.createElement("option");
      n.value = s, n.textContent = `⭐ ${s}`, n.selected = this.settings.activePresetId === s, e.appendChild(n);
    }), e.onchange = () => {
      const s = e.value;
      this.settings.activePresetId = s;
      const a = I[s]?.filters || this.settings.userPresets?.[s];
      a && (this.settings.filters = { ...a }, this.updateFilterSliders(), this.callbacks.onPresetChanged({ id: s, name: s, filters: this.settings.filters }), this.save());
    };
    const t = this.panel?.querySelector("#st_preset_save_btn");
    t && (t.onclick = () => {
      const s = prompt("预设名称:");
      s && (this.settings.userPresets || (this.settings.userPresets = {}), this.settings.userPresets[s] = { ...this.settings.filters }, this.settings.activePresetId = s, this.save(), this.updatePresetSelect());
    });
    const i = this.panel?.querySelector("#st_preset_del_btn");
    i && (i.onclick = () => {
      const s = e.value;
      if (I[s]) {
        alert("无法删除内置预设");
        return;
      }
      this.settings.userPresets?.[s] && (delete this.settings.userPresets[s], this.settings.activePresetId = "default", this.settings.filters = { ...I.default.filters }, this.updateFilterSliders(), this.save(), this.updatePresetSelect());
    });
  }
  updateSceneSelect() {
    const e = this.panel?.querySelector("#st_scene_select");
    if (!e) return;
    e.innerHTML = "", Object.values(P).forEach((a) => {
      const n = document.createElement("option");
      n.value = a.id, n.textContent = a.name, n.selected = this.settings.activeSceneId === a.id, e.appendChild(n);
    }), Object.entries(this.settings.scenes || {}).forEach(([a, n]) => {
      const r = document.createElement("option");
      r.value = a, r.textContent = `⭐ ${n.name}`, r.selected = this.settings.activeSceneId === a, e.appendChild(r);
    });
    const t = this.panel?.querySelector("#st_scene_apply_btn");
    t && (t.onclick = () => {
      const a = e.value;
      this.callbacks.onSceneApplied?.(a);
    });
    const i = this.panel?.querySelector("#st_scene_save_btn");
    i && (i.onclick = () => {
      const a = prompt("场景名称:");
      if (!a) return;
      const n = "scene_" + Date.now();
      this.settings.scenes || (this.settings.scenes = {}), this.settings.scenes[n] = {
        id: n,
        name: a,
        presetId: this.settings.activePresetId,
        weather: { ...this.settings.weather },
        visualizer: { ...this.settings.visualizer },
        parallax: { ...this.settings.parallax },
        ambientSound: { ...this.settings.ambientSound },
        frostedChat: this.settings.frostedChat.enabled,
        isBuiltin: !1
      }, this.settings.activeSceneId = n, this.save(), this.updateSceneSelect();
    });
    const s = this.panel?.querySelector("#st_scene_del_btn");
    s && (s.onclick = () => {
      const a = e.value;
      if (P[a]) {
        alert("无法删除内置场景");
        return;
      }
      this.settings.scenes?.[a] && (delete this.settings.scenes[a], this.settings.activeSceneId = void 0, this.save(), this.updateSceneSelect());
    });
  }
  updateTriggersUI() {
    const e = this.panel?.querySelector("#st_trigger_list");
    if (!e) return;
    e.innerHTML = "";
    const t = this.settings.triggerRules || [];
    t.length === 0 ? e.innerHTML = '<div class="st-bgloader-dim-text">暂无规则</div>' : t.forEach((r, o) => {
      const l = document.createElement("div");
      l.className = "st-bgloader-trigger-row", l.innerHTML = `
                    <input type="checkbox" ${r.enabled ? "checked" : ""} class="st-bgloader-trigger-check" />
                    <span class="st-bgloader-trigger-badge">${r.type === "character" ? "角色" : r.type === "chat" ? "聊天" : "正则"}</span>
                    <span class="st-bgloader-trigger-name">${b(r.name)}</span>
                    <span class="st-bgloader-trigger-pattern">${b(r.pattern)}</span>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-bgloader-trigger-del"><i class="fa-solid fa-trash"></i></button>
                `, l.querySelector(".st-bgloader-trigger-check")?.addEventListener("change", (h) => {
        r.enabled = h.target.checked, this.save();
      }), l.querySelector(".st-bgloader-trigger-del")?.addEventListener("click", () => {
        this.settings.triggerRules.splice(o, 1), this.save(), this.updateTriggersUI();
      }), e.appendChild(l);
    });
    const i = this.panel?.querySelector("#st_trigger_form"), s = this.panel?.querySelector("#st_trigger_add_btn"), a = this.panel?.querySelector("#st_trigger_cancel_btn"), n = this.panel?.querySelector("#st_trigger_confirm_btn");
    s && i && (s.onclick = () => {
      i.style.display = "block", s.style.display = "none";
    }), a && i && s && (a.onclick = () => {
      i.style.display = "none", s.style.display = "block";
    }), n && i && s && (n.onclick = () => {
      const r = this.panel?.querySelector("#st_trigger_type")?.value, o = this.panel?.querySelector("#st_trigger_name")?.value.trim(), l = this.panel?.querySelector("#st_trigger_pattern")?.value.trim();
      if (!o || !l) {
        alert("请填写规则名称和匹配文本");
        return;
      }
      const h = {
        id: "trig_" + Date.now(),
        name: o,
        enabled: !0,
        type: r,
        pattern: l,
        action: {
          preset: this.settings.activePresetId,
          weather: this.settings.weather.type
        }
      };
      this.settings.triggerRules || (this.settings.triggerRules = []), this.settings.triggerRules.push(h), this.save(), this.updateTriggersUI(), i.style.display = "none", s.style.display = "block";
    });
  }
  async updateCacheStats() {
    if (this.panel)
      try {
        const e = await this.cacheManager.getCacheUsage(), t = this.panel.querySelector("#st_cache_used"), i = this.panel.querySelector("#st_cache_count");
        if (t) {
          const s = (e.usedBytes / 1048576).toFixed(1);
          t.textContent = `${s} MB`;
        }
        i && (i.textContent = String(e.itemCount));
      } catch {
      }
  }
  updateCloudPanel() {
    const e = this.panel?.querySelector("#st_cloud_status_text");
    if (!e) return;
    if (!this.authority?.getClient()) {
      e.innerHTML = '<span class="st-bgloader-dim-text">本地模式</span>';
      return;
    }
    e.innerHTML = '<span class="st-bgloader-success-text"><i class="fa-solid fa-cloud-check"></i> 云端就绪</span>';
  }
}
const R = "data-st-bg-augmented", te = "data-st-bg-badge", U = "data-st-bg-current", A = "st-bg-takeover-selected", Re = "custom_background", Pe = 3e4;
class Oe {
  constructor(e) {
    this.onSelect = e;
  }
  seams = null;
  level = "off";
  active = !1;
  degraded = !1;
  gridObserver = null;
  bgHostObserver = null;
  seamWaitObserver = null;
  seamGiveUpTimer = null;
  /**
   * Native `#bg1` background-image captured right before we first cleared it, so `stop()` can
   * put it back without needing to re-drive the host's own loader (design §5 / U-1).
   */
  savedNativeBgImage = "";
  /**
   * Guards our own write to `#bg1`. Note the MutationObserver callback is async, so this flag
   * has usually been reset by the time it runs — the real loop-breaker is the "already empty"
   * check in `clearNativeBackgroundImage()`. Kept as belt-and-braces for the synchronous path.
   */
  clearingNativeBg = !1;
  /** File name of the media the extension currently has mounted, for the selection marker. */
  activeFileName = null;
  // ---------------------------------------------------------------- seams
  /**
   * Checks the seams this controller depends on.
   *
   * Returns `null` for "do not take over", which covers two different situations that the
   * caller distinguishes:
   * - the containers are not rendered yet (the background drawer is built lazily) — retryable;
   * - the containers exist but a thumbnail lacks `bgfile` — the host changed its structure.
   */
  probe() {
    const e = document.querySelector("#bg_menu_content"), t = document.querySelector("#bg1");
    if (!e || !t) return null;
    const i = e.querySelector(".bg_example");
    if (i && !i.hasAttribute("bgfile")) return null;
    const s = window.event_types;
    return {
      menuContent: e,
      customContent: document.querySelector("#bg_custom_content") ?? e,
      bgHost: t,
      hasForceEvent: !!s?.FORCE_SET_BACKGROUND
    };
  }
  // ---------------------------------------------------------------- lifecycle
  isActive() {
    return this.active;
  }
  getLevel() {
    return this.level;
  }
  /** Installs (or re-levels) the takeover. Idempotent. */
  start(e) {
    if (this.level = e, e === "off") {
      this.stop();
      return;
    }
    if (this.active) return;
    const t = this.probe();
    if (!t) {
      !!document.querySelector("#bg_menu_content") && !!document.querySelector("#bg1") ? this.degrade("the background grid no longer exposes `bgfile` tiles") : this.waitForSeams();
      return;
    }
    this.install(t);
  }
  /** Uninstalls everything: interception, observers, decorations. Idempotent. */
  stop() {
    if (this.level = "off", this.stopWaitingForSeams(), !this.active) return;
    this.active = !1, document.removeEventListener("click", this.onDocumentClickCapture, !0), this.gridObserver?.disconnect(), this.gridObserver = null, this.bgHostObserver?.disconnect(), this.bgHostObserver = null;
    const e = this.seams;
    e && (e.menuContent.querySelectorAll(`[${te}]`).forEach((t) => t.remove()), e.menuContent.querySelectorAll(`[${U}]`).forEach((t) => t.remove()), e.menuContent.querySelectorAll(`.${A}`).forEach((t) => t.classList.remove(A)), e.menuContent.querySelectorAll(`[${R}]`).forEach((t) => t.removeAttribute(R)), this.restoreNativeBackgroundImage(e.bgHost)), this.seams = null;
  }
  setLevel(e) {
    if (e === "off") {
      this.stop();
      return;
    }
    if (!this.active) {
      this.start(e);
      return;
    }
    const t = this.level;
    this.level = e, t === "all" && e !== "all" && this.seams ? this.restoreNativeBackgroundImage(this.seams.bgHost) : this.clearNativeBackgroundImage();
  }
  // ---------------------------------------------------------------- decorations
  /**
   * Badges every tile with its media type (non-image only) and re-applies the selection marker.
   * Runs on install and after every grid re-render: the host rebuilds the grid wholesale with
   * `$('#bg_menu_content').empty()` (`backgrounds.js:715`), so both our badge nodes and our
   * class are wiped each time.
   */
  decorateGrid() {
    const e = this.seams;
    !e || !this.active || (e.menuContent.querySelectorAll(`.bg_example[bgfile]:not([${R}])`).forEach((t) => {
      t.setAttribute(R, "true"), this.addBadge(t);
    }), this.refreshSelection(this.activeFileName));
  }
  addBadge(e) {
    const t = M(e.getAttribute("bgfile") || "");
    if (t === "image") return;
    const i = document.createElement("span");
    i.className = `st-bg-native-badge ${t}`, i.setAttribute(te, "true"), i.textContent = t.toUpperCase(), e.appendChild(i);
  }
  /**
   * Marks the native thumbnail matching the extension's current media.
   *
   * Matching is by the `bgfile` attribute (a plain file name) — never by `data-url`. That one
   * holds a CSS string (`url("backgrounds/x.jpg")`, from `generateUrlParameter`,
   * `backgrounds.js:1533`) and is not a URL at all; it is also invisible to `getAttribute`
   * because the host writes it through jQuery's `.data()`, which keeps it in its own store.
   *
   * The host's own highlight recomputes `.selected-background` from `background_settings.url`
   * (`backgrounds.js:1773`), which we deliberately do not update, so a distinct class is
   * required — and it has to be re-applied on every re-render.
   *
   * **Every write here is conditional on the state actually differing.** This runs from the
   * grid observer, and our marker is a child element, so an unconditional remove-then-add would
   * mutate the grid on every pass and drive the observer in a loop. Convergent writes mean the
   * follow-up pass finds nothing to change and the observer settles.
   */
  refreshSelection(e) {
    this.activeFileName = e;
    const t = this.seams;
    t && t.menuContent.querySelectorAll(".bg_example").forEach((i) => {
      const s = !!e && i.getAttribute("bgfile") === e, a = i.classList.contains(A), n = i.querySelector(`[${U}]`);
      if (s && !a && i.classList.add(A), !s && a && i.classList.remove(A), s && !n) {
        const r = document.createElement("span");
        r.className = "st-bg-native-current", r.setAttribute(U, "true"), i.appendChild(r);
      }
      !s && n && n.remove();
    });
  }
  /**
   * Called when the extension no longer has anything mounted (background cleared through the
   * public API, media deleted): the native marker has nothing to point at, and `#bg1` goes back
   * to the host. Without this the user would be left with no background at all — our layer is
   * gone and the host's image is still suppressed.
   *
   * A no-op restore when we never cleared anything (the current value already equals the
   * snapshot), which covers the levels where we do not suppress `#bg1` in the first place.
   */
  releaseNativeBackground() {
    this.refreshSelection(null), this.seams && this.restoreNativeBackgroundImage(this.seams.bgHost);
  }
  // ---------------------------------------------------------------- interception
  /**
   * The single interception point. Registered on `document` in the **capture** phase: the host
   * listens on `document` in the bubble phase (`backgrounds.js:1884`), and document is the root
   * of the event path, so capture runs first and `stopPropagation()` keeps the event from ever
   * reaching the host's delegated handler.
   */
  onDocumentClickCapture = (e) => {
    if (!this.active || this.level === "off") return;
    const t = e.target;
    if (!t || typeof t.closest != "function") return;
    const i = t.closest(".bg_example");
    if (!i || !this.shouldTakeOver(i, t)) return;
    const s = i.getAttribute("bgfile");
    s && (e.preventDefault(), e.stopPropagation(), Promise.resolve(this.onSelect(s, M(s))).catch((a) => {
      console.error(`[ST-BgLoader] Failed to apply native background "${s}":`, a);
    }));
  };
  /**
   * Decides whether a thumbnail click is ours to handle.
   *
   * Every pass-through rule below mirrors a branch the host itself acts on, so that taking the
   * picker over never removes a capability the user had. Each one names its host signal; the
   * line numbers are for the host version recorded in `research/st-native-evidence.md`.
   */
  shouldTakeOver(e, t) {
    return !(document.querySelector("#Backgrounds.bg-selection-mode") || this.isChatBackgroundLocked() || t.closest(".jg-button, .bg_folder_tile, .mobile-only-menu-toggle") || e.getAttribute("custom") === "true" || this.level === "non-image" && M(e.getAttribute("bgfile") || "") === "image");
  }
  /**
   * Whether the current chat has a locked background.
   *
   * Read through the **public** context API: `getContext().chatMetadata` is a documented getter
   * (`st-context.js:2477`), so this is not host-internals sniffing. The key is read from the
   * chat file the host persists, which makes it stable — renaming it would invalidate every
   * historical chat's lock, so the host cannot change it without a migration. (The alternative
   * signal, the `.locked-background` class from `backgrounds.js:355`, is a *rendering* result
   * refreshed only at certain moments, so the metadata is the authority.)
   */
  isChatBackgroundLocked() {
    return !!window.SillyTavern?.getContext?.()?.chatMetadata?.[Re];
  }
  // ---------------------------------------------------------------- #bg1 layer
  /**
   * Clears the host's own background image so the extension's layer is the only visible one.
   *
   * Idempotent and repeatable by design: the host rewrites `#bg1` on chat changes and on lock
   * actions (`backgrounds.js:310` / `:380` / `:288` / `:433`), so a one-shot clear would be
   * undone the moment the user switches chats.
   */
  clearNativeBackgroundImage() {
    const e = this.seams;
    if (!(!this.active || !e || this.clearingNativeBg) && this.activeFileName && this.level === "all" && !this.isChatBackgroundLocked() && e.bgHost.style.backgroundImage) {
      this.clearingNativeBg = !0;
      try {
        e.bgHost.style.backgroundImage = "";
      } finally {
        this.clearingNativeBg = !1;
      }
    }
  }
  /**
   * Best-effort restoration of the host's background on `stop()` (design §5's open item U-1).
   *
   * The host's own loader is not callable, so the value captured when the takeover started is
   * put back. While takeover was active the user could not change the host's global background
   * (we intercepted those clicks), so the host's own belief still matches that snapshot — the
   * one case that can differ is a chat change during takeover, which the host would normally
   * have answered with the new chat's locked/default background.
   */
  restoreNativeBackgroundImage(e) {
    if (this.savedNativeBgImage && e.style.backgroundImage !== this.savedNativeBgImage) {
      this.clearingNativeBg = !0;
      try {
        e.style.backgroundImage = this.savedNativeBgImage;
      } finally {
        this.clearingNativeBg = !1;
      }
    }
  }
  // ---------------------------------------------------------------- install internals
  install(e) {
    this.stopWaitingForSeams(), this.seams = e, this.active = !0, this.savedNativeBgImage = e.bgHost.style.backgroundImage, document.addEventListener("click", this.onDocumentClickCapture, !0), this.bgHostObserver = new MutationObserver(() => this.clearNativeBackgroundImage()), this.bgHostObserver.observe(e.bgHost, { attributes: !0, attributeFilter: ["style"] }), this.gridObserver = new MutationObserver(() => this.decorateGrid()), this.gridObserver.observe(e.menuContent, { childList: !0, subtree: !0 }), this.clearNativeBackgroundImage(), this.decorateGrid();
  }
  /** Waits for lazily-built host containers, then starts for real. */
  waitForSeams() {
    this.seamWaitObserver || (this.seamWaitObserver = new MutationObserver(() => {
      !document.querySelector("#bg_menu_content") || !document.querySelector("#bg1") || (this.stopWaitingForSeams(), this.level !== "off" && this.start(this.level));
    }), this.seamWaitObserver.observe(document.body, { childList: !0, subtree: !0 }), this.seamGiveUpTimer = window.setTimeout(() => this.stopWaitingForSeams(), Pe));
  }
  stopWaitingForSeams() {
    this.seamWaitObserver?.disconnect(), this.seamWaitObserver = null, this.seamGiveUpTimer !== null && (window.clearTimeout(this.seamGiveUpTimer), this.seamGiveUpTimer = null);
  }
  /**
   * Probe failed on a rendered host: stay in enhancement mode. Media, the panel and the public
   * API are untouched — only the takeover is skipped — and we say so once.
   */
  degrade(e) {
    this.degraded || (this.degraded = !0, console.warn(
      `[ST-BgLoader] Native background takeover disabled: ${e}. The extension keeps working; the native picker simply stays native.`
    ));
  }
}
class $e {
  container = null;
  audioEngine;
  isVisible = !0;
  capsuleOnPlayOnly = !0;
  hideTimer = null;
  unsubscribeTrack = null;
  unsubscribePlayState = null;
  constructor(e) {
    this.audioEngine = e;
  }
  render(e = !0, t = !0) {
    this.isVisible = e, this.capsuleOnPlayOnly = t;
    const i = document.querySelector("#st_bg_mini_player");
    i && i.remove();
    const s = document.createElement("div");
    s.id = "st_bg_mini_player", s.className = "st-bg-mini-player";
    const a = this.audioEngine.getCurrentTrack(), r = (a ? a.name : "无音频").replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim(), o = this.audioEngine.isPlaying(), l = this.audioEngine.getPlaybackMode(), h = this.isVisible && (!this.capsuleOnPlayOnly || o);
    s.classList.add(h ? "visible" : "hidden"), s.innerHTML = `
            <div class="st-bg-mini-capsule">
                <button class="st-bg-mini-btn" id="st_mini_prev" title="上一曲">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button class="st-bg-mini-btn st-bg-mini-play" id="st_mini_play" title="${o ? "暂停" : "播放"}">
                    <i class="fa-solid ${o ? "fa-pause" : "fa-play"}"></i>
                </button>
                <button class="st-bg-mini-btn" id="st_mini_next" title="下一曲">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <div class="st-bg-mini-track" id="st_mini_title" title="${b(r)}">${b(r)}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="模式">
                    <i class="fa-solid ${this.getModeIcon(l)}"></i>
                </button>
            </div>
        `, document.body.appendChild(s), this.container = s, this.bindEvents(), this.unsubscribeTrack?.(), this.unsubscribePlayState?.(), this.unsubscribeTrack = this.audioEngine.addTrackListener((p) => {
      const d = this.container?.querySelector("#st_mini_title");
      if (d) {
        const m = (p ? p.name : "无音频").replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim();
        d.textContent = m, d.setAttribute("title", m);
      }
    }), this.unsubscribePlayState = this.audioEngine.addPlayStateListener((p) => {
      const d = this.container?.querySelector("#st_mini_play i");
      d && (d.className = `fa-solid ${p ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (p ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
        this.hide();
      }, 1200)));
    });
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
        i.setAttribute("title", "模式");
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
    this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.unsubscribeTrack?.(), this.unsubscribeTrack = null, this.unsubscribePlayState?.(), this.unsubscribePlayState = null, this.container && (this.container.remove(), this.container = null);
  }
}
class Fe {
  ext;
  eventListeners = /* @__PURE__ */ new Map();
  constructor(e) {
    this.ext = e;
  }
  /**
   * Switch background to a URL, cached media ID, or local file.
   * Supports MP4/WebM video, HTML/Canvas sandboxed pages, SVG animations, and images.
   *
   * Without `saveToLibrary` the background is TRANSIENT: it is rendered from an in-memory
   * item whose id exists nowhere in the catalog, so it is deliberately NOT recorded in
   * `activeMediaId` (a persisted id that cannot be resolved came back as a dangling
   * reference after every reload — finding A2). Choose `saveToLibrary: true` to keep it.
   */
  async setBackground(e, t) {
    let s = (await this.ext.getCacheManager().listMedia()).find((n) => n.id === e || n.name === e || n.url === e || n.cacheKey === e), a = !1;
    if (!s) {
      const n = t?.name || e.split("/").pop()?.split("?")[0] || "remote_background", r = t?.type || M(e);
      t?.saveToLibrary ? s = await this.ext.getCacheManager().saveMedia(new Blob([]), n, r, "url", e) : (a = !0, s = {
        id: "custom_" + Date.now(),
        name: n,
        type: r,
        source: "url",
        url: e,
        cacheKey: e,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      });
    }
    t?.filters && this.setFilters(t.filters), typeof t?.interactive == "boolean" && this.setInteractive(t.interactive), await this.ext.applyMediaItem(s, !a), this.emit("media-change", s);
  }
  /**
   * Clear the current background
   */
  clearBackground() {
    this.ext.clearActiveBackground(), this.emit("media-change", null);
  }
  /**
   * Shows or hides the background layer WITHOUT unloading the mounted media (the removed
   * Alt+B shortcut used to do this; the settings panel checkbox and this method replace it).
   */
  setBackgroundVisible(e) {
    this.ext.setBackgroundVisible(e), this.emit("background-visibility-change", e);
  }
  isBackgroundVisible() {
    return this.ext.getMediaMount().isVisible();
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
    let i = I[e]?.filters;
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
    } : i = { ...e }, !k.includes(i.type)) {
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
    const t = this.ext.getSceneManager();
    if (!t) return !1;
    const i = t.applyScene(e);
    return i && (this.ext.getSettings().activeSceneId = e, this.ext.saveSettings(), this.emit("scene-change", e)), i;
  }
  saveCurrentScene(e) {
    const t = this.ext.getSceneManager();
    if (!t) return null;
    const i = this.ext.getSettings(), s = {
      id: `scene_${Date.now()}`,
      name: e,
      mediaId: i.activeMediaId || void 0,
      presetId: i.activePresetId,
      filters: { ...i.filters },
      weather: { ...i.weather },
      visualizer: { ...i.visualizer },
      parallax: { ...i.parallax },
      ambientSound: { ...i.ambientSound },
      frostedChat: i.frostedChat.enabled
    };
    return t.saveScene(s), i.scenes = t.getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", t.getAllScenes()), s;
  }
  getScenes() {
    return this.ext.getSceneManager()?.getAllScenes() ?? {};
  }
  deleteScene(e) {
    const t = this.ext.getSceneManager();
    if (!t) return !1;
    const i = t.deleteScene(e);
    return i && (this.ext.getSettings().scenes = t.getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", t.getAllScenes())), i;
  }
  /**
   * Quick cycle through weather types
   */
  cycleWeather() {
    const e = this.ext.getSettings().weather.type, t = (k.indexOf(e) + 1) % k.length, i = k[t];
    return this.setWeather(i), i;
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
    let n = 0;
    const r = [...i], o = Array.from({ length: Math.min(a, r.length) }, async () => {
      for (; r.length > 0; ) {
        const l = r.shift();
        try {
          const { item: h, isNew: p } = await this.ext.getCacheManager().preloadUrl(l), d = {
            url: l,
            success: !0,
            cached: !p,
            size: h.size || 0
          };
          s.push(d);
        } catch (h) {
          s.push({
            url: l,
            success: !1,
            cached: !1,
            size: 0,
            error: h?.message || String(h)
          });
        }
        n++, t?.onProgress?.(n, i.length, l), this.emit("preload-progress", n, i.length, l);
      }
    });
    return await Promise.all(o), this.emit("preload-complete", s), s;
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
}
class De {
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
  isTabHidden = !1;
  isBgHidden = !1;
  scanlinePattern = null;
  lastPatternOpacity = -1;
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
    this.width = e.width || window.innerWidth, this.height = e.height || window.innerHeight, this.dpr = Math.min(window.devicePixelRatio || 1, 2), this.canvas.width = Math.floor(this.width * this.dpr), this.canvas.height = Math.floor(this.height * this.dpr), this.ctx && this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.currentOptions.type !== "off" && this.initParticles();
  }
  handleVisibilityChange(e) {
    this.isTabHidden = e, e ? this.stop() : !this.isBgHidden && this.currentOptions.type !== "off" && this.start();
  }
  handleBackgroundVisibilityChange(e) {
    this.isBgHidden = !e, e ? !this.isTabHidden && this.currentOptions.type !== "off" && (this.canvas.style.display = "block", this.start()) : (this.stop(), this.canvas.style.display = "none");
  }
  setWeather(e) {
    this.currentOptions = { ...e }, this.scanlinePattern = null, this.currentOptions.type === "off" || this.isBgHidden || this.isTabHidden ? (this.stop(), this.canvas.style.display = "none", this.particles = [], this.ripples = [], this.ctx && this.ctx.clearRect(0, 0, this.width, this.height)) : (this.canvas.style.display = "block", this.initParticles(), this.start());
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
    const i = t ? Math.random() * this.height : -20, s = Math.random() * (this.width + 400) - 200, a = this.currentOptions.speed, n = this.currentOptions.wind;
    switch (e) {
      case "rain":
        return {
          x: s,
          y: i,
          vx: n * 3,
          vy: (12 + Math.random() * 8) * a,
          size: 10 + Math.random() * 15,
          alpha: (0.3 + Math.random() * 0.4) * this.currentOptions.opacity
        };
      case "snow":
        return {
          x: s,
          y: i,
          vx: n * 0.8 + (Math.random() - 0.5) * 0.5,
          vy: (1 + Math.random() * 2) * a,
          size: 2 + Math.random() * 3.5,
          alpha: (0.4 + Math.random() * 0.5) * this.currentOptions.opacity,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "sakura":
        return {
          x: s,
          y: i,
          vx: n * 1.2 + (Math.random() - 0.5) * 0.8,
          vy: (1.2 + Math.random() * 2.2) * a,
          size: 8 + Math.random() * 6,
          alpha: (0.6 + Math.random() * 0.3) * this.currentOptions.opacity,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.04 * a,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "cyber_motes": {
        const r = ["#00f0ff", "#ff007f", "#7928ca", "#00ff88"];
        return {
          x: Math.random() * this.width,
          y: t ? Math.random() * this.height : this.height + 20,
          vx: (Math.random() - 0.5) * 1.5 + n * 0.5,
          vy: -(1.5 + Math.random() * 3) * a,
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
    if (this.animFrameId !== null || this.isTabHidden || this.isBgHidden) return;
    const e = () => {
      this.render(), this.currentOptions.type !== "off" && !this.isTabHidden && !this.isBgHidden ? this.animFrameId = requestAnimationFrame(e) : this.animFrameId = null;
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
        const n = Math.sin(a.oscillationOffset) * 0.8;
        a.x += a.vx + n, a.y += a.vy, e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = `rgba(255, 255, 255, ${a.alpha})`, e.fill(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(t, !1));
      } else if (t === "sakura") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.03, a.rotation = (a.rotation || 0) + (a.vRotation || 0.02);
        const n = Math.sin(a.oscillationOffset) * 1.5;
        a.x += a.vx + n, a.y += a.vy, e.save(), e.translate(a.x, a.y), e.rotate(a.rotation), e.beginPath(), e.ellipse(0, 0, a.size, a.size * 0.55, 0, 0, Math.PI * 2), e.fillStyle = `rgba(255, 183, 197, ${a.alpha})`, e.fill(), e.restore(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(t, !1));
      } else if (t === "cyber_motes") {
        a.life = (a.life || 0) + 1, a.x += a.vx, a.y += a.vy;
        const n = a.life / (a.maxLife || 200), r = a.alpha * Math.sin(n * Math.PI);
        e.save(), e.shadowBlur = 8, e.shadowColor = a.color || "#00f0ff", e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = a.color || "#00f0ff", e.globalAlpha = Math.max(0, r), e.fill(), e.restore(), (a.y < -20 || a.life && a.life > (a.maxLife || 200)) && (this.particles[s] = this.createParticle(t, !1));
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
    const t = 0.12 * this.currentOptions.opacity;
    if (!this.scanlinePattern || this.lastPatternOpacity !== this.currentOptions.opacity) {
      this.lastPatternOpacity = this.currentOptions.opacity;
      const s = document.createElement("canvas");
      s.width = 1, s.height = 4;
      const a = s.getContext("2d");
      a && (a.fillStyle = `rgba(0, 0, 0, ${t})`, a.fillRect(0, 0, 1, 1.5), this.scanlinePattern = e.createPattern(s, "repeat"));
    }
    this.scanlinePattern && (e.fillStyle = this.scanlinePattern, e.fillRect(0, 0, this.width, this.height)), this.scanlineOffset = (this.scanlineOffset + 2 * this.currentOptions.speed) % this.height;
    const i = e.createLinearGradient(0, this.scanlineOffset - 30, 0, this.scanlineOffset + 30);
    i.addColorStop(0, "rgba(255, 255, 255, 0)"), i.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * this.currentOptions.opacity})`), i.addColorStop(1, "rgba(255, 255, 255, 0)"), e.fillStyle = i, e.fillRect(0, this.scanlineOffset - 30, this.width, 60), Math.random() < 0.05 && (e.fillStyle = `rgba(255, 255, 255, ${0.02 * this.currentOptions.opacity})`, e.fillRect(0, 0, this.width, this.height));
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onWindowResize), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.particles = [], this.ripples = [], this.scanlinePattern = null;
  }
}
class qe {
  canvas;
  ctx = null;
  parentEl = null;
  // Pulse-mode pump target: MediaMount's pump wrapper, NOT the media container — the
  // container's transform belongs to the parallax controller (two writers on one
  // style property would fight each other).
  pumpTargetEl = null;
  analyser = null;
  animFrameId = null;
  dataArray = null;
  currentOptions = {
    mode: "off",
    color: "#4fa3d1",
    sensitivity: 1
  };
  isTabHidden = !1;
  isBgHidden = !1;
  isSilent = !1;
  width = 0;
  height = 0;
  dpr = 1;
  constructor() {
    this.canvas = document.createElement("canvas"), this.canvas.className = "st-bg-visualizer-canvas", this.canvas.style.position = "absolute", this.canvas.style.left = "0", this.canvas.style.bottom = "0", this.canvas.style.width = "100%", this.canvas.style.height = "140px", this.canvas.style.pointerEvents = "none", this.canvas.style.zIndex = "3", this.canvas.style.display = "none", this.ctx = this.canvas.getContext("2d");
  }
  mount(e, t) {
    this.parentEl = e, this.pumpTargetEl = t || null, this.canvas.parentElement || e.appendChild(this.canvas), this.updateDimensions(), window.addEventListener("resize", this.onResize);
  }
  onResize = () => {
    this.updateDimensions();
  };
  updateDimensions() {
    this.parentEl && (this.width = this.parentEl.clientWidth || window.innerWidth, this.height = 140, this.dpr = Math.min(window.devicePixelRatio || 1, 2), this.canvas.width = Math.floor(this.width * this.dpr), this.canvas.height = Math.floor(this.height * this.dpr), this.ctx && this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0));
  }
  handleVisibilityChange(e) {
    this.isTabHidden = e, e ? this.stop() : !this.isBgHidden && this.currentOptions.mode !== "off" && this.start();
  }
  handleBackgroundVisibilityChange(e) {
    this.isBgHidden = !e, e ? !this.isTabHidden && this.currentOptions.mode !== "off" && (this.currentOptions.mode === "spectrum" && (this.canvas.style.display = "block"), this.start()) : (this.stop(), this.canvas.style.display = "none");
  }
  setAnalyser(e) {
    if (this.analyser = e, this.analyser) {
      this.analyser.fftSize = 256;
      const t = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(new ArrayBuffer(t)), this.isSilent = !1, this.currentOptions.mode !== "off" && !this.isBgHidden && !this.isTabHidden && this.start();
    } else
      this.dataArray = null, this.stop();
  }
  setOptions(e) {
    this.currentOptions = { ...e }, this.isSilent = !1, this.currentOptions.mode === "off" || this.isBgHidden || this.isTabHidden ? (this.stop(), this.canvas.style.display = "none", this.ctx && this.ctx.clearRect(0, 0, this.width, this.height)) : (this.currentOptions.mode === "spectrum" ? this.canvas.style.display = "block" : this.canvas.style.display = "none", this.start());
  }
  start() {
    if (this.animFrameId !== null || this.isTabHidden || this.isBgHidden || !this.analyser)
      return;
    const e = () => {
      this.render(), this.currentOptions.mode !== "off" && !this.isTabHidden && !this.isBgHidden ? this.animFrameId = requestAnimationFrame(e) : this.animFrameId = null;
    };
    this.animFrameId = requestAnimationFrame(e);
  }
  stop() {
    this.animFrameId !== null && (cancelAnimationFrame(this.animFrameId), this.animFrameId = null), this.pumpTargetEl && (this.pumpTargetEl.style.transform = "", this.pumpTargetEl.style.transition = "");
  }
  render() {
    if (!this.analyser || !this.dataArray)
      return;
    this.analyser.getByteFrequencyData(this.dataArray);
    let e = !1;
    const t = Math.min(32, this.dataArray.length);
    for (let a = 0; a < t; a++)
      if (this.dataArray[a] > 1) {
        e = !0;
        break;
      }
    if (!e) {
      this.isSilent || (this.isSilent = !0, this.ctx && this.ctx.clearRect(0, 0, this.width, this.height), this.pumpTargetEl && (this.pumpTargetEl.style.transform = "", this.pumpTargetEl.style.transition = ""));
      return;
    }
    this.isSilent = !1;
    const i = this.currentOptions.mode, s = this.currentOptions.sensitivity;
    if (i === "pulse") {
      let a = 0;
      const n = Math.min(12, this.dataArray.length);
      for (let l = 0; l < n; l++)
        a += this.dataArray[l];
      const r = a / n / 255, o = Math.pow(r, 2) * 0.35 * s;
      if (this.pumpTargetEl) {
        const l = 1 + o * 0.015;
        this.pumpTargetEl.style.transform = `scale(${l})`, this.pumpTargetEl.style.transition = "transform 0.06s ease-out";
      }
    } else if (i === "spectrum") {
      if (!this.ctx) return;
      const a = this.ctx;
      a.clearRect(0, 0, this.width, this.height);
      const n = this.dataArray.length, r = Math.max(3, this.width / n * 1.6);
      let o = 0;
      const l = this.currentOptions.color || "#4fa3d1";
      for (let h = 0; h < n; h++) {
        const p = this.dataArray[h] / 255 * s, d = Math.min(this.height, p * (this.height - 10));
        if (d > 1) {
          const u = a.createLinearGradient(0, this.height, 0, this.height - d);
          u.addColorStop(0, `${l}22`), u.addColorStop(0.7, `${l}aa`), u.addColorStop(1, `${l}ff`), a.fillStyle = u;
          const m = this.height - d;
          a.beginPath();
          const y = Math.min(r / 2, 3);
          typeof a.roundRect == "function" ? a.roundRect(o, m, r - 1.5, d, [y, y, 0, 0]) : a.rect(o, m, r - 1.5, d), a.fill();
        }
        if (o += r, o > this.width) break;
      }
    }
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onResize), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.pumpTargetEl && (this.pumpTargetEl.style.transform = "", this.pumpTargetEl.style.transition = "", this.pumpTargetEl = null);
  }
}
class Ne {
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
    const t = window.innerWidth / 2, i = window.innerHeight / 2, s = 30 * this.options.intensity, a = (e.clientX - t) / t, n = (e.clientY - i) / i;
    this.targetX = a * s, this.targetY = n * s, this.isRunning || this.startLoop();
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
class Ue {
  rules = [];
  onTriggerCallback;
  eventSourceUnlisteners = [];
  lastTriggeredId = null;
  lastTriggerTime = 0;
  // MESSAGE_RECEIVED + CHARACTER_MESSAGE_RENDERED both evaluate every message; compiling
  // each rule's RegExp per message is wasted work. null caches "known invalid".
  regexCache = /* @__PURE__ */ new Map();
  constructor(e = [], t) {
    this.rules = [...e], this.onTriggerCallback = t;
  }
  setTriggerCallback(e) {
    this.onTriggerCallback = e;
  }
  setRules(e) {
    this.rules = [...e], this.regexCache.clear();
  }
  getRules() {
    return this.rules;
  }
  addRule(e) {
    this.rules.push(e), this.regexCache.clear();
  }
  removeRule(e) {
    this.rules = this.rules.filter((t) => t.id !== e), this.regexCache.clear();
  }
  getRegex(e) {
    if (this.regexCache.has(e))
      return this.regexCache.get(e) ?? null;
    try {
      const t = new RegExp(e, "i");
      return this.regexCache.set(e, t), t;
    } catch (t) {
      return console.warn(`[ST-BgLoader TriggerManager] Invalid regex pattern "${e}":`, t), this.regexCache.set(e, null), null;
    }
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
    for (const t of this.rules) {
      if (!t.enabled || t.type !== "regex") continue;
      const i = this.getRegex(t.pattern);
      if (i && i.test(e))
        return this.fireRule(t), !0;
    }
    return !1;
  }
  fireRule(e) {
    const t = Date.now();
    this.lastTriggeredId === e.id && t - this.lastTriggerTime < 500 || (this.lastTriggeredId = e.id, this.lastTriggerTime = t, console.log(`[ST-BgLoader TriggerManager] Fired rule: "${e.name}" (${e.type})`), Promise.resolve(this.onTriggerCallback?.(e.action, e)).catch((i) => {
      console.error(`[ST-BgLoader TriggerManager] Rule "${e.name}" failed:`, i);
    }));
  }
  bindSillyTavernEvents(e, t) {
    if (this.unbindEvents(), !e || typeof e.on != "function") return;
    const i = (r) => {
      typeof r == "string" ? this.evaluateMessage(r) : r && typeof r.mes == "string" && this.evaluateMessage(r.mes);
    }, s = (r) => {
      const o = typeof r == "string" ? r : r?.chatId || r?.id;
      o && this.evaluateChat(String(o));
    }, a = (r) => {
      const o = typeof r == "string" ? r : r?.name || r?.avatar;
      o && this.evaluateCharacter(String(o));
    }, n = (r, o) => {
      e.on(r, o), this.eventSourceUnlisteners.push(() => {
        typeof e.removeListener == "function" ? e.removeListener(r, o) : typeof e.off == "function" ? e.off(r, o) : typeof e.removeEventListener == "function" && e.removeEventListener(r, o);
      });
    };
    t ? (t.MESSAGE_RECEIVED && n(t.MESSAGE_RECEIVED, i), t.CHARACTER_MESSAGE_RENDERED && n(t.CHARACTER_MESSAGE_RENDERED, i), t.CHAT_CHANGED && n(t.CHAT_CHANGED, s), t.CHARACTER_PAGE_LOADED && n(t.CHARACTER_PAGE_LOADED, a)) : (n("message_received", i), n("character_message_rendered", i), n("chat_changed", s));
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
    this.unbindEvents(), this.rules = [], this.regexCache.clear(), this.onTriggerCallback = void 0;
  }
}
class Ve {
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
    const t = 2 * e.sampleRate, i = e.createBuffer(1, t, e.sampleRate), s = i.getChannelData(0);
    let a = 0, n = 0, r = 0, o = 0, l = 0, h = 0, p = 0;
    for (let m = 0; m < t; m++) {
      const y = Math.random() * 2 - 1;
      a = 0.99886 * a + y * 0.0555179, n = 0.99332 * n + y * 0.0750759, r = 0.969 * r + y * 0.153852, o = 0.8665 * o + y * 0.3104856, l = 0.55 * l + y * 0.5329522, h = -0.7616 * h - y * 0.016898, s[m] = (a + n + r + o + l + h + p + y * 0.5362) * 0.11, p = y * 0.115926;
    }
    const d = e.createBufferSource();
    d.buffer = i, d.loop = !0;
    const u = e.createBiquadFilter();
    u.type = "lowpass", u.frequency.value = 1200, d.connect(u), u.connect(this.gainNode), d.start(0), this.activeSource = d;
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
    for (let l = 0; l < t; l++)
      s[l] = Math.random() * 2 - 1;
    const a = e.createBufferSource();
    a.buffer = i, a.loop = !0;
    const n = e.createBiquadFilter();
    n.type = "bandpass", n.frequency.value = 400, n.Q.value = 3;
    const r = e.createOscillator();
    r.frequency.value = 0.2;
    const o = e.createGain();
    o.gain.value = 250, r.connect(o), o.connect(n.frequency), a.connect(n), n.connect(this.gainNode), r.start(0), a.start(0), this.lfoOsc = r, this.activeSource = a;
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
class He {
  userScenes = {};
  onApplySceneCallback;
  constructor(e = {}, t) {
    this.userScenes = { ...e }, this.onApplySceneCallback = t;
  }
  setUserScenes(e) {
    this.userScenes = { ...e };
  }
  getAllScenes() {
    return {
      ...P,
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
    return P[e] ? (console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${e}"`), !1) : this.userScenes[e] ? (delete this.userScenes[e], !0) : !1;
  }
  applyScene(e) {
    const t = this.getScene(e);
    return t ? (console.log(`[ST-BgLoader SceneManager] Applying scene: "${t.name}"`), Promise.resolve(this.onApplySceneCallback?.(t)).catch((i) => {
      console.error(`[ST-BgLoader SceneManager] Failed to apply scene "${t.name}":`, i);
    }), !0) : (console.warn(`[ST-BgLoader SceneManager] Scene "${e}" not found.`), !1);
  }
}
const ie = "settings:rev", se = "settings:data", Ge = 2e3, We = 1e4;
class je {
  constructor(e, t, i) {
    this.client = e, this.onRemoteSettings = t, this.hasServerDocument = i;
  }
  pushTimer = null;
  pollTimer = null;
  localRevision = 0;
  lastPushedFingerprint = "";
  applyingRemote = !1;
  running = !1;
  async start() {
    if (this.running) return;
    this.running = !0;
    let e = !1;
    try {
      e = await this.hasServerDocument();
    } catch (t) {
      console.warn("[ST-BgLoader] Could not check the server settings document; falling back to the cloud mirror:", t);
    }
    try {
      const t = await this.readPayload();
      if (t)
        if (this.localRevision = t.revision, this.lastPushedFingerprint = t.fingerprint, e)
          console.log("[ST-BgLoader] Cloud mirror found, but the server settings document is authoritative; not applying the KV copy.");
        else {
          this.applyingRemote = !0;
          try {
            this.onRemoteSettings(t.settings);
          } finally {
            this.applyingRemote = !1;
          }
          console.log("[ST-BgLoader] Settings restored from cloud mirror (no server settings document), revision", t.revision);
        }
    } catch (t) {
      console.warn("[ST-BgLoader] Failed to read cloud settings mirror:", t);
    }
    this.pollTimer = window.setInterval(() => void this.pollOnce(), We);
  }
  stop() {
    this.pollTimer !== null && window.clearInterval(this.pollTimer), this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pollTimer = null, this.pushTimer = null, this.running = !1;
  }
  schedulePush(e) {
    !this.running || this.applyingRemote || (this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pushTimer = window.setTimeout(() => {
      this.pushTimer = null, this.push(e);
    }, Ge));
  }
  async push(e) {
    try {
      const t = JSON.stringify(e), i = await Ke(t);
      if (i === this.lastPushedFingerprint) return;
      const s = this.localRevision + 1, a = {
        revision: s,
        fingerprint: i,
        updatedAt: Date.now(),
        settings: e
      };
      await this.client.storage.kv.set(se, a), await this.client.storage.kv.set(ie, s), this.localRevision = s, this.lastPushedFingerprint = i;
    } catch (t) {
      console.warn("[ST-BgLoader] Failed to push settings to cloud mirror:", t);
    }
  }
  async pollOnce() {
    if (!this.applyingRemote)
      try {
        const e = await this.client.storage.kv.get(ie);
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
    const e = await this.client.storage.kv.get(se);
    if (!e || typeof e != "object") return null;
    const t = e;
    return typeof t.revision != "number" || !t.settings || typeof t.fingerprint != "string" ? null : t;
  }
}
async function Ke(c) {
  try {
    if (crypto?.subtle) {
      const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(c));
      return Array.from(new Uint8Array(t)).map((i) => i.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  let e = 5381;
  for (let t = 0; t < c.length; t++)
    e = (e << 5) + e + c.charCodeAt(t) | 0;
  return "djb2:" + (e >>> 0).toString(16);
}
const ae = "st-bg-loader-settings.json", Xe = 1, Qe = 800;
class Ye {
  saveTimer = null;
  pending = null;
  writing = !1;
  warnedAboutWriteFailure = !1;
  /** Invoked when a newer server document (another tab/device) beats the pending write. */
  onRemoteNewer = null;
  /** Returns the server document, or null when it is missing/unparsable (first run). */
  async load() {
    const e = await ue(ae);
    return !e || typeof e != "object" || !e.settings || typeof e.revision != "number" ? null : e;
  }
  scheduleSave(e, t) {
    this.pending = { settings: e, revision: t }, this.saveTimer !== null && window.clearTimeout(this.saveTimer), this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null, this.flush();
    }, Qe);
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
            const t = await this.load();
            if (t && t.revision > e.revision) {
              this.onRemoteNewer?.(t);
              break;
            }
            await ge(ae, this.toDoc(e)), this.warnedAboutWriteFailure = !1;
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
      version: Xe,
      revision: e.revision,
      updatedTimestamp: Date.now(),
      settings: e.settings
    };
  }
}
const ne = 3e4, Je = 2e3, Ze = 5 * 60 * 1e3, et = 2 * 60 * 1e3, tt = 15e3;
class re extends Error {
  constructor() {
    super("Agent tool registration timed out"), this.name = "AgentRegisterTimeoutError";
  }
}
const it = [
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
    // Fourth copy of the weather vocabulary used to live here as a literal, which silently
    // drifted whenever a weather type was added. Referencing the shared constant keeps the
    // AI-facing tool schema in step with the runtime validator in PublicAPI.
    description: `Set the atmospheric weather FX (${k.join(", ")}).`,
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: k },
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
class st {
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
    this.running || (this.running = !0, this.permissionBlockedUntil = 0, this.registerWaitUntil = 0, this.register(), this.claimLoop(), this.registerTimer = window.setInterval(() => void this.register(), ne));
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
        this.registrationOk = !1, ce(e) ? (this.permissionBlockedUntil = Date.now() + Ze, this.publishState("blocked", e instanceof Error ? e.message : String(e)), this.warnOnce("Agent tool registration blocked by permission policy (retrying every 5 min — adjust in Authority Security Center if intended):", e)) : e instanceof re ? (this.registerWaitUntil = Date.now() + et, this.publishState("pending", "等待 agent.browser 授权（若页面出现 Authority 权限弹窗请处理；稍后自动重试）"), this.warnOnce("Agent tool registration is waiting for permission (check the Authority prompt / Security Center):", e)) : console.warn("[ST-BgLoader] Agent tool registration failed (will retry):", e);
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
    const i = new Promise((s, a) => {
      t = window.setTimeout(() => a(new re()), tt);
    });
    try {
      return await Promise.race([
        e.registerTools({
          browserInstanceId: C,
          leaseDurationMs: ne * 2,
          tools: it.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            inputSchema: s.inputSchema,
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
    }, Je));
  }
  async claimOnce() {
    const e = this.agentApi();
    if (!(!e || !this.running) && this.registrationOk)
      try {
        this.pendingSubmit && (await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, "completed", void 0), this.pendingSubmit = null);
        const t = `stbg-claim-${Date.now()}-${this.claimSeq++}`, s = (await e.claim({ browserInstanceId: C, claimId: t })).invocation;
        if (!s) return;
        let a, n;
        try {
          a = await this.execute(s.toolId, s.arguments);
        } catch (r) {
          n = r instanceof Error ? r.message : String(r);
        }
        if (n) {
          await e.submitResult({
            runId: s.runId,
            callId: s.callId,
            claimId: t,
            browserInstanceId: C,
            status: "failed",
            error: n
          });
          return;
        }
        try {
          await e.submitResult({
            runId: s.runId,
            callId: s.callId,
            claimId: t,
            browserInstanceId: C,
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
      browserInstanceId: C,
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
const V = "st_bgloader_settings", oe = "st_bgloader_settings_rev";
class at {
  isInitialized = !1;
  settings = { ...O };
  settingsRevision = 0;
  serverSettings = new Ye();
  cacheManager;
  audioEngine;
  mediaMount;
  overlaysMounted = !1;
  settingsDrawer = null;
  topbarDrawer = null;
  nativeController = null;
  miniPlayer = null;
  atmosphereFX;
  audioVisualizer;
  parallaxController;
  triggerManager;
  ambientSoundGenerator;
  frostedGlassController;
  // Lazy: created in init() with real configuration. No speculative instance that init()
  // would replace.
  sceneManager = null;
  authorityBridge = new $();
  settingsSync = null;
  agentBridge = null;
  publicApi;
  constructor() {
    this.cacheManager = new Se(), this.audioEngine = new Te(), this.mediaMount = new Ae(this.audioEngine, (e) => this.mountOverlays(e)), this.atmosphereFX = new De(), this.audioVisualizer = new qe(), this.parallaxController = new Ne(), this.triggerManager = new Ue(), this.ambientSoundGenerator = new Ve(), this.frostedGlassController = new ze(), this.publicApi = new Fe(this);
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
  getAuthorityBridge() {
    return this.authorityBridge;
  }
  getServerSettings() {
    return this.serverSettings;
  }
  getAPI() {
    return this.publicApi;
  }
  getNativeController() {
    return this.nativeController;
  }
  getTopbarDrawer() {
    return this.topbarDrawer;
  }
  setMasterEnabled(e) {
    this.settings.enabled = e, this.saveSettings(), this.applyMasterEnabled(e);
  }
  /**
   * Master-switch side effects WITHOUT persistence: the local toggle path persists via
   * setMasterEnabled; the remote-convergence path (applySettingsToSubsystems) must apply
   * the converged `enabled` without writing settings back (that would re-bump the revision
   * and push the pre-convergence state over the remote one).
   */
  applyMasterEnabled(e) {
    e ? (this.topbarDrawer?.mount(), this.nativeController?.start(this.settings.nativeTakeover), this.mediaMount.setVisible(this.settings.backgroundVisible), this.atmosphereFX.handleBackgroundVisibilityChange(this.settings.backgroundVisible), this.audioVisualizer.handleBackgroundVisibilityChange(this.settings.backgroundVisible)) : (this.topbarDrawer?.unmount(), this.nativeController?.stop(), this.mediaMount.clear(), this.atmosphereFX.handleBackgroundVisibilityChange(!1), this.audioVisualizer.handleBackgroundVisibilityChange(!1), this.nativeController?.releaseNativeBackground());
  }
  clearActiveBackground() {
    this.settings.activeMediaId = null, this.mediaMount.clear(), this.nativeController?.releaseNativeBackground(), this.saveSettings(), this.settingsDrawer?.updateActiveMedia(null), this.topbarDrawer && this.topbarDrawer.refreshMediaGrid();
  }
  /**
   * Mounts a media item as the background. `persist` = false is for TRANSIENT items that
   * exist only in memory (PublicAPI.setBackground without saveToLibrary): recording their
   * id in the durable `activeMediaId` left a reference no reload could resolve (finding A2).
   */
  async applyMediaItem(e, t = !0) {
    await this.applyMedia(e, t);
  }
  async init() {
    if (this.isInitialized) return;
    console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), await this.reconcileSettings(), await this.cacheManager.init(this.authorityBridge), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setVisible(this.settings.backgroundVisible), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.mediaMount.setRenderErrorHandler((i) => {
      this.publicApi.emit("media-error", { type: i }), this.notifyMediaRenderErrorOnce();
    }), this.mountOverlaysIfHostReady(), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.audioEngine.setUrlResolver((i) => this.cacheManager.getMediaBlobUrl(i)), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.audioEngine.onAnalyserReady = (i) => {
      this.audioVisualizer.setAnalyser(i);
    };
    const t = (await this.cacheManager.listMedia()).filter((i) => i.type === "audio");
    if (this.audioEngine.setPlaylist(t), this.miniPlayer = new $e(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly), this.audioEngine.addTrackListener((i) => {
      this.publicApi.emit("track-change", i);
    }), this.audioEngine.addPlayStateListener((i) => {
      this.publicApi.emit("play-state-change", i);
    }), this.triggerManager.setRules(this.settings.triggerRules || []), this.triggerManager.setTriggerCallback(async (i, s) => {
      console.log(`[ST-BgLoader] Executing trigger rule: "${s.name}"`), i.mediaIdOrUrl && await this.publicApi.setBackground(i.mediaIdOrUrl), i.bgmUrl && await this.publicApi.playBGM(i.bgmUrl), i.weather && this.publicApi.setWeather(i.weather), i.preset && this.publicApi.applyPreset(i.preset), i.filters && this.publicApi.setFilters(i.filters);
    }), this.sceneManager = new He(this.settings.scenes || {}, async (i) => {
      if (i.mediaId) {
        const s = await this.cacheManager.getMedia(i.mediaId);
        s && await this.applyMedia(s);
      } else i.mediaUrl && await this.publicApi.setBackground(i.mediaUrl);
      i.bgmUrl && await this.publicApi.playBGM(i.bgmUrl), i.presetId && this.publicApi.applyPreset(i.presetId), i.filters && this.publicApi.setFilters(i.filters), i.weather && this.publicApi.setWeather(i.weather), i.visualizer && this.publicApi.setVisualizer(i.visualizer), i.parallax && this.publicApi.setParallax(i.parallax.enabled, i.parallax.intensity), i.ambientSound && this.publicApi.setAmbientSound(i.ambientSound), typeof i.frostedChat == "boolean" && this.publicApi.setFrostedChat(i.frostedChat);
    }), this.topbarDrawer = new Le(this.settings, this.cacheManager, {
      onSettingsChanged: (i) => {
        this.settings = i, this.saveSettings(), this.applySettingsToSubsystems(), this.enforceQuotaIfChanged();
      },
      getBackgroundVisible: () => this.settings.backgroundVisible,
      onBackgroundVisibilityChanged: (i) => {
        this.publicApi.setBackgroundVisible(i);
      },
      onClearActiveBackground: () => {
        this.clearActiveBackground();
      },
      onPresetChanged: (i) => {
        this.mediaMount.applyFilters(i.filters), this.publicApi.emit("preset-change", i.id, i.filters);
      },
      onInteractiveChanged: (i) => {
        this.mediaMount.setInteractive(i), this.publicApi.emit("interactive-change", i);
      },
      onMiniPlayerToggle: (i) => {
        this.miniPlayer?.setVisible(i);
      },
      onCapsuleOnPlayToggle: (i) => {
        this.miniPlayer?.setCapsuleOnPlayOnly(i);
      },
      onPlaybackModeChanged: (i) => {
        this.audioEngine.setPlaybackMode(i);
      },
      onWeatherChanged: (i) => {
        this.atmosphereFX.setWeather(i), this.publicApi.emit("weather-change", i);
      },
      onVisualizerChanged: (i) => {
        this.audioVisualizer.setOptions(i), this.publicApi.emit("visualizer-change", i);
      },
      onParallaxChanged: (i) => {
        this.parallaxController.setOptions(i), this.publicApi.emit("parallax-change", i);
      },
      onTransitionChanged: (i, s) => {
        this.mediaMount.setTransition(i, s), this.publicApi.emit("transition-change", i, s);
      },
      onMuffleChanged: (i) => {
        this.audioEngine.setMuffled(i), this.publicApi.emit("muffle-change", i);
      },
      onAmbientSoundChanged: (i) => {
        this.ambientSoundGenerator.setSound(i);
      },
      onFrostedChatChanged: (i) => {
        this.frostedGlassController.setOptions(i);
      },
      onSceneApplied: (i) => {
        this.publicApi.applyScene(i);
      },
      onMediaSelected: async (i) => {
        await this.applyMedia(i);
      },
      onMediaDeleted: async (i) => {
        this.settings.activeMediaId === i ? (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings()) : this.audioEngine.getCurrentTrack()?.id === i && this.audioEngine.stopTrack();
        const s = await this.cacheManager.listMedia();
        this.audioEngine.setPlaylist(s.filter((a) => a.type === "audio"));
      },
      onMediaUploaded: async (i) => {
        if (this.settings.lruAutoClean) {
          const s = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(s);
        }
        if (i.type === "audio") {
          const s = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(s.filter((a) => a.type === "audio"));
        }
        await this.applyMedia(i);
      }
    }, this.authorityBridge), this.settings.enabled !== !1 && this.topbarDrawer.mount(), this.settingsDrawer = new Be(this.settings, {
      onMasterToggle: (i) => {
        this.setMasterEnabled(i);
      },
      onSettingsChanged: (i) => {
        this.settings = i, this.saveSettings();
      }
    }), this.settingsDrawer.render(), this.nativeController = new Oe(async (i, s) => {
      const a = T(i), n = {
        id: "native_" + i,
        name: i,
        type: s,
        source: "server",
        url: a,
        cacheKey: a,
        size: 0,
        mimeType: "",
        addedTimestamp: Date.now(),
        lastUsedTimestamp: Date.now()
      };
      await this.applyMedia(n);
    }), this.nativeController.start(this.settings.nativeTakeover), document.addEventListener("visibilitychange", () => {
      const i = document.hidden;
      this.audioEngine.handleVisibilityChange(i, this.settings.pauseOnBlur), this.atmosphereFX.handleVisibilityChange(i), this.audioVisualizer.handleVisibilityChange(i);
    }), window.addEventListener("pagehide", () => this.flushPendingPersist()), this.authorityBridge.onCapabilitiesChanged(() => this.topbarDrawer?.updateCloudPanel()), this.serverSettings.onRemoteNewer = () => void this.reconcileRemoteConflict(), await this.startSettingsSync(), this.syncAgentTools(), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const i = await this.cacheManager.getMedia(this.settings.activeMediaId);
      i ? await this.applyMedia(i) : (console.warn(`[ST-BgLoader] Active background "${this.settings.activeMediaId}" no longer exists; clearing the reference.`), this.settings.activeMediaId = null, this.saveSettings());
    }
    this.appliedEnabled = this.settings.enabled, this.isInitialized = !0, console.log("[ST-BgLoader] All Modular Subsystems fully initialized.");
  }
  async applyMedia(e, t = !0) {
    const i = this.settings.activeMediaId;
    t && (this.settings.activeMediaId = e.id, this.saveSettings());
    try {
      const s = await this.cacheManager.getMediaBlobUrl(e);
      await this.mediaMount.mountMedia(e, s);
    } catch (s) {
      if (t) {
        this.settings.activeMediaId = i ?? null, this.saveSettings();
        const a = i ? await this.cacheManager.getMedia(i).catch(() => null) : null;
        this.settingsDrawer?.updateActiveMedia(a?.name ?? null), this.topbarDrawer?.refreshMediaGrid();
      }
      throw this.notifyMediaMountErrorOnce(), console.error(`[ST-BgLoader] Failed to mount media "${e.name}":`, s), s;
    }
    this.nativeController?.refreshSelection(e.name), this.nativeController?.clearNativeBackgroundImage(), this.settingsDrawer?.updateActiveMedia(e.name), this.topbarDrawer && (this.topbarDrawer.refreshMediaGrid(), this.topbarDrawer.updateCacheStats());
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
    t && (this.atmosphereFX.mount(t), this.audioVisualizer.mount(t, this.mediaMount.getPumpWrapperElement() ?? e)), this.parallaxController.attach(e);
  }
  applySettingsToSubsystems() {
    this.settings.enabled !== this.appliedEnabled && (this.appliedEnabled = this.settings.enabled, this.applyMasterEnabled(this.settings.enabled)), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setVisible(this.settings.backgroundVisible), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.triggerManager.setRules(this.settings.triggerRules || []), this.sceneManager?.setUserScenes(this.settings.scenes || {}), this.nativeController?.setLevel(this.settings.nativeTakeover), this.syncAgentTools();
  }
  /**
   * Shows/hides the background layer. MediaMount owns the applied state (finding A1) while
   * `settings.backgroundVisible` is the durable intent — the setting replaced the Alt+B
   * shortcut, so unlike its first incarnation this one persists across reloads. The panel
   * checkbox and PublicAPI both come through here, so there is a single write path.
   */
  setBackgroundVisible(e) {
    this.settings.backgroundVisible = e, this.mediaMount.setVisible(e), this.atmosphereFX.handleBackgroundVisibilityChange(e), this.audioVisualizer.handleBackgroundVisibilityChange(e), this.saveSettings(), this.topbarDrawer?.syncBackgroundVisible(e);
  }
  /**
   * Applies a changed cache quota immediately (S2: the slider used to write the setting and
   * nothing happened until the next upload). Runs only when the quota really changed — an
   * unrelated settings change must not trigger a sweep — and only while auto-clean is on,
   * because the quota is meaningless with it off (the panel documents that gating).
   */
  enforceQuotaIfChanged() {
    if (!this.settings.lruAutoClean) return;
    const e = this.settings.cacheQuotaMB * 1024 * 1024;
    e !== this.lastEnforcedQuotaBytes && (this.lastEnforcedQuotaBytes = e, this.cacheManager.cleanLRU(e));
  }
  /** null = nothing enforced yet, so the first change under auto-clean compares honestly. */
  lastEnforcedQuotaBytes = null;
  /** One-shot toastr for a broken mounted medium; repeats still emit `media-error` events. */
  notifiedMediaRenderError = !1;
  /** One-shot toastr for a mount that never completed (resolution/mount failure, not decode). */
  notifiedMediaMountError = !1;
  /** Tracks the enabled state actually applied to subsystems (remote convergence compares against this). */
  appliedEnabled = null;
  notifyMediaRenderErrorOnce() {
    if (!this.notifiedMediaRenderError) {
      this.notifiedMediaRenderError = !0;
      try {
        window.toastr?.warn("背景媒体加载失败（文件可能损坏或格式不受支持），详见控制台", "ST-BgLoader");
      } catch {
      }
    }
  }
  /** One-shot toastr for a mount that never completed (resolution/mount failure, not decode). */
  notifyMediaMountErrorOnce() {
    if (!this.notifiedMediaMountError) {
      this.notifiedMediaMountError = !0;
      try {
        window.toastr?.error("背景媒体挂载失败，详见控制台", "ST-BgLoader");
      } catch {
      }
    }
  }
  /** Opt-in Agent Runtime ambient tools (AI director mode); requires the cloud backend. */
  syncAgentTools() {
    const e = this.authorityBridge.getClient(), t = this.settings.agentToolsEnabled && !!e;
    t && !this.agentBridge && e ? (this.agentBridge = new st(e, this.buildAgentHost(), (i, s) => {
      this.authorityBridge.reportAgentToolsState(i, s);
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
    e && (this.settingsSync = new je(e, (t) => {
      this.settings = t;
      try {
        localStorage.setItem(V, JSON.stringify(this.settings));
      } catch {
      }
      this.applySettingsToSubsystems(), this.topbarDrawer?.applyRemoteSettings(this.settings), this.settingsDrawer?.applyRemoteSettings(this.settings), this.publicApi.emit("settings-sync", this.settings);
    }, () => this.hasServerSettingsDocument()), await this.settingsSync.start());
  }
  /**
   * Precedence fact handed to SettingsSync (finding A5): the KV mirror carries its own
   * revision counter, which cannot be compared with the server document's (observed 41 vs
   * 202), so it must not be applied unconditionally at startup — that resurrected state the
   * server document had already corrected (a deleted background came back as a dangling id).
   * The server document is this machine's source of truth; the mirror is only a fallback
   * for a missing/unreadable document.
   */
  async hasServerSettingsDocument() {
    return await this.serverSettings.load() !== null;
  }
  reconcilingRemote = !1;
  /** A newer server settings document was detected mid-session (another tab/device);
   *  converge the same way the init-time reconcile does. */
  async reconcileRemoteConflict() {
    if (!this.reconcilingRemote) {
      this.reconcilingRemote = !0;
      try {
        await this.reconcileSettings(), this.applySettingsToSubsystems(), this.topbarDrawer?.applyRemoteSettings(this.settings), this.settingsDrawer?.applyRemoteSettings(this.settings), this.publicApi.emit("settings-sync", this.settings);
      } finally {
        this.reconcilingRemote = !1;
      }
    }
  }
  hookSillyTavernEvents() {
    const e = window;
    e.eventSource && (this.triggerManager.bindSillyTavernEvents(e.eventSource, e.event_types), e.event_types && e.event_types.CHAT_CHANGED && e.eventSource.on(e.event_types.CHAT_CHANGED, async () => {
      try {
        if (this.settings.activeMediaId) {
          const t = await this.cacheManager.getMedia(this.settings.activeMediaId);
          t && await this.applyMedia(t);
        }
      } catch (t) {
        console.error("[ST-BgLoader] Failed to restore background on chat change:", t);
      }
    }));
  }
  loadSettings() {
    try {
      const e = localStorage.getItem(V);
      e && (this.settings = z(JSON.parse(e))), this.settingsRevision = parseInt(localStorage.getItem(oe) || "0", 10) || 0;
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...O }, this.settingsRevision = 0;
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
      e && e.revision >= this.settingsRevision ? (this.settings = z(e.settings), this.settingsRevision = e.revision, this.persistLocalSettings()) : this.settingsRevision > 0 && this.serverSettings.scheduleSave(this.settings, this.settingsRevision);
    } catch (e) {
      console.warn("[ST-BgLoader] Server settings unavailable, using local settings:", e);
    }
  }
  persistTimer = null;
  /**
   * Sliders drive saveSettings() once per rAF frame while dragging; the server/KV mirrors
   * already debounce their own schedules, so the synchronous localStorage write was the
   * only per-frame cost (60 full-JSON writes per second of dragging). Trailing-debounce
   * it, with a pagehide flush so a tab close never loses the tail of a drag.
   */
  persistLocalSettings() {
    this.persistTimer !== null && window.clearTimeout(this.persistTimer), this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null, this.persistLocalSettingsNow();
    }, 250);
  }
  /** Last-chance synchronous flush of a pending debounced write (pagehide). */
  flushPendingPersist() {
    this.persistTimer !== null && (window.clearTimeout(this.persistTimer), this.persistTimer = null, this.persistLocalSettingsNow());
  }
  persistLocalSettingsNow() {
    try {
      localStorage.setItem(V, JSON.stringify(this.settings)), localStorage.setItem(oe, String(this.settingsRevision));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
  saveSettings() {
    this.settingsRevision += 1, this.persistLocalSettings(), this.serverSettings.scheduleSave(this.settings, this.settingsRevision), this.settingsSync?.schedulePush(this.settings);
  }
}
const W = new at(), le = () => W.init().catch((c) => console.error("[ST-BgLoader] Initialization failed:", c));
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", le) : le();
window.STBgLoader = W;
window.stBgLoader = W.getAPI();
export {
  at as STBgLoaderExtension
};
