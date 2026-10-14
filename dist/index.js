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
}, E = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"], he = {
  off: "Off (关闭天气)",
  rain: "Rain (细雨微涟)",
  snow: "Snow (冬日飘雪)",
  sakura: "Sakura (落樱缤纷)",
  cyber_motes: "Cyber Motes (赛博霓虹微粒)",
  scanlines: "Scanlines (复古CRT扫描线)"
};
function D(o) {
  return typeof o == "object" && o !== null && !Array.isArray(o);
}
function K(o) {
  const e = { ...R };
  if (!D(o)) return e;
  const t = o, s = R, i = e;
  for (const a of Object.keys(s)) {
    const n = t[a];
    if (n === void 0) continue;
    const r = s[a];
    i[a] = D(r) && D(n) ? { ...r, ...n } : n;
  }
  return e;
}
const B = {
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
}, R = {
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
  agentToolsEnabled: !1
};
function S(o, e = "") {
  const t = o.split(".").pop()?.toLowerCase().split("?")[0] || "";
  return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) || e.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) || e.startsWith("audio/") ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
}
class v {
  static instance = null;
  hostType;
  constructor() {
    this.hostType = this.detectHostType();
  }
  static getInstance() {
    return v.instance || (v.instance = new v()), v.instance;
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
      const s = window.SillyTavern?.getContext?.().getRequestHeaders?.(e);
      return s ? { ...s } : {};
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
const X = "st-bg-loader-manifest.json", I = 1;
function w(o) {
  return `backgrounds/${encodeURIComponent(o)}`;
}
const de = /* @__PURE__ */ new Set(["favicon.ico"]);
function $(o) {
  return !!o && de.has(o.toLowerCase());
}
function T() {
  return v.getInstance().getRequestHeaders({ omitContentType: !0 });
}
async function ue(o) {
  try {
    const e = await fetch(`${w(o)}?t=${Date.now()}`, { cache: "no-store" });
    return e.ok ? JSON.parse(await e.text()) : null;
  } catch (e) {
    return console.warn(`[ST-BgLoader] Server document "${o}" is missing or unreadable:`, e), null;
  }
}
async function ge(o, e) {
  const t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), s = new FormData();
  s.append("avatar", new File([t], o, { type: "application/json" }));
  const i = await fetch("/api/backgrounds/upload", { method: "POST", headers: T(), body: s });
  if (!i.ok)
    throw new Error(`Server upload failed for "${o}": HTTP ${i.status}`);
}
const pe = 6e4;
class V {
  manifest = { version: I, items: [] };
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
      const e = await fetch(`${w(X)}?t=${Date.now()}`, { cache: "no-store" });
      if (e.ok) {
        const t = JSON.parse(await e.text());
        t && Array.isArray(t.items) && (this.manifest = { version: I, items: t.items });
      }
    } catch (e) {
      console.warn("[ST-BgLoader] No server media manifest yet, starting a fresh one:", e), this.manifest = { version: I, items: [] };
    }
    console.log(`[ST-BgLoader] Server media library ready: ${this.manifest.items.length} cataloged entries.`);
  }
  async listCatalog() {
    const e = this.catalogCache;
    if (e && Date.now() - e.at < V.CATALOG_TTL_MS)
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
      const t = await fetch("/api/backgrounds/all", {
        method: "POST",
        headers: { ...T(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok) {
        const s = await t.json();
        for (const i of s.images ?? []) {
          if ($(i.filename)) continue;
          const a = S(i.filename);
          e.set(i.filename, {
            id: "native_" + i.filename,
            name: i.filename,
            type: a,
            source: "server",
            url: w(i.filename),
            cacheKey: w(i.filename),
            size: 0,
            mimeType: z(i.filename, a),
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
        if ($(t.filename)) continue;
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
    const t = this.manifest.items.find((i) => i.id === e);
    return t ? $(t.filename) ? null : this.manifestToItem(t) : (await this.listCatalog()).find((i) => i.id === e) ?? null;
  }
  async putMedia(e) {
    const t = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), s = e.blob.type || z(e.name, e.type);
    if (e.source === "url" && e.blob.size === 0 && e.remoteUrl) {
      const n = {
        id: t,
        filename: null,
        type: e.type,
        source: "url",
        remoteUrl: e.remoteUrl,
        size: 0,
        mimeType: s,
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
        mimeType: s,
        addedTimestamp: n.addedTimestamp,
        lastUsedTimestamp: n.lastUsedTimestamp,
        hasAudio: n.hasAudio
      };
    }
    const i = await this.uploadFile(e.name, e.blob, s), a = {
      id: t,
      filename: i,
      type: e.type,
      source: e.source,
      remoteUrl: e.remoteUrl ?? null,
      size: e.blob.size,
      mimeType: s,
      addedTimestamp: Date.now(),
      lastUsedTimestamp: Date.now(),
      hasAudio: e.type === "video" || e.type === "audio"
    };
    return this.manifest.items = this.manifest.items.filter((n) => n.filename !== i), this.manifest.items.push(a), await this.saveManifest(), this.invalidateCatalog(), this.manifestToItem(a);
  }
  async deleteMedia(e) {
    let s = this.manifest.items.find((a) => a.id === e)?.filename ?? null;
    if (!s) {
      const a = await this.getCatalogItem(e);
      a?.url?.startsWith("backgrounds/") && (s = decodeURIComponent(a.url.slice(12)));
    }
    if (!s) {
      this.manifest.items = this.manifest.items.filter((a) => a.id !== e), await this.saveManifest(), this.invalidateCatalog();
      return;
    }
    const i = await fetch("/api/backgrounds/delete", {
      method: "POST",
      headers: { ...T(), "Content-Type": "application/json" },
      body: JSON.stringify({ bg: s })
    });
    if (!i.ok)
      throw new Error(`Server delete failed for "${s}": HTTP ${i.status}`);
    this.manifest.items = this.manifest.items.filter((a) => a.id !== e && a.filename !== s), await this.saveManifest(), this.invalidateCatalog();
  }
  async readMedia(e) {
    if (!e.url) return null;
    const t = await fetch(e.url, { cache: "no-store" });
    return t.ok ? t.blob() : null;
  }
  async findByUrl(e) {
    const t = this.manifest.items.find((i) => i.remoteUrl === e || w(i.filename ?? "") === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((i) => i.url === e || i.cacheKey === e) ?? null;
  }
  /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
  async download(e) {
    let t = null;
    try {
      t = new URL(e, window.location.href);
    } catch {
    }
    const s = !!t && t.origin !== window.location.origin, i = await fetch(e, s ? { signal: AbortSignal.timeout(pe) } : void 0);
    if (!i.ok)
      throw new Error(`Failed to fetch media from ${e}: ${i.status} ${i.statusText}`);
    return i.blob();
  }
  async uploadFile(e, t, s) {
    let i = me(e || "media");
    if (await this.filenameExists(i)) {
      const r = i.lastIndexOf("."), l = r > 0 ? i.slice(0, r) : i, c = r > 0 ? i.slice(r) : "";
      i = `${l}_${Date.now()}${c}`;
    }
    const a = new FormData();
    a.append("avatar", new File([t], i, { type: s }));
    const n = await fetch("/api/backgrounds/upload", { method: "POST", headers: T(), body: a });
    if (!n.ok)
      throw new Error(`Server upload failed: HTTP ${n.status}`);
    return (await n.text()).trim() || i;
  }
  async filenameExists(e) {
    if (this.manifest.items.some((t) => t.filename === e)) return !0;
    try {
      const t = await fetch("/api/backgrounds/all", {
        method: "POST",
        headers: { ...T(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok)
        return ((await t.json()).images ?? []).some((i) => i.filename === e);
    } catch {
    }
    return !1;
  }
  saveManifest() {
    const e = () => this.doSaveManifest();
    return this.saveQueue = this.saveQueue.then(e, e), this.saveQueue;
  }
  async doSaveManifest() {
    this.manifest.version = I;
    const e = new Blob([JSON.stringify(this.manifest, null, 2)], { type: "application/json" });
    try {
      const t = new FormData();
      t.append("avatar", new File([e], X, { type: "application/json" }));
      const s = await fetch("/api/backgrounds/upload", { method: "POST", headers: T(), body: t });
      if (!s.ok)
        throw new Error(`HTTP ${s.status}`);
    } catch (t) {
      throw console.error("[ST-BgLoader] Failed to save server media manifest:", t), t;
    }
  }
  manifestToItem(e) {
    const t = e.source === "url" && e.remoteUrl ? e.remoteUrl : e.filename ? w(e.filename) : e.remoteUrl ?? "";
    return {
      id: e.id,
      name: e.filename || e.remoteUrl || e.id,
      type: e.type,
      source: e.source === "url" ? "url" : "server",
      url: t,
      cacheKey: e.filename ? w(e.filename) : e.id,
      size: e.size,
      mimeType: e.mimeType,
      addedTimestamp: e.addedTimestamp,
      lastUsedTimestamp: e.lastUsedTimestamp,
      hasAudio: e.hasAudio
    };
  }
}
function z(o, e) {
  switch (o.split(".").pop()?.toLowerCase()) {
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
function me(o) {
  return (o || "media").replace(/[^\p{L}\p{N}._ -]/gu, "_");
}
const k = "st-bgloader-main";
function ce(o) {
  if (o && typeof o == "object" && o.name === "AuthorityPermissionError") return !0;
  const e = o instanceof Error ? o.message : String(o);
  return /permission|denied|forbidden|封锁/i.test(e);
}
const fe = "extension:third-party/ST-BgLoader", Q = "st_bgloader_cloud_notice_v1";
class P {
  static EXTENSION_ID = "third-party/ST-BgLoader";
  static CHANNEL = fe;
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
        extensionId: P.EXTENSION_ID,
        displayName: "ST-BgLoader",
        version: "1.0.0",
        installType: "local",
        uiLabel: "ST-BgLoader",
        declaredPermissions: {
          storage: { kv: !0, blob: !0 },
          sql: { private: !0 },
          http: { allow: [...this.httpAllow] },
          jobs: { background: ["delay", "sql.backup"] },
          events: { channels: [P.CHANNEL] },
          // Undeclared resources hit the declaration gate (hard 'blocked') even when an
          // admin would grant them — declare exactly the one browser instance we register.
          agent: { browser: [k] }
        }
      }), this.caps = {
        available: !0,
        sync: !0,
        serverFetch: !0,
        agentTools: !0,
        agentToolsState: "unknown"
      }, console.log("[ST-BgLoader] Authority backend connected:", this.client.getSession()), this.caps) : this.degrade("sdk-missing", "未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）");
    } catch (e) {
      const t = e instanceof Error ? e.message : String(e), s = ce(e);
      return console.warn("[ST-BgLoader] Authority unavailable, falling back to local mode:", t), this.client = null, this.degrade(
        s ? "permission-denied" : "init-failed",
        s ? "Authority 权限被拒绝，媒体库运行于本地模式" : "Authority 连接失败，媒体库运行于本地模式"
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
function ye(o) {
  const e = atob(o), t = new ArrayBuffer(e.length), s = new Uint8Array(t);
  for (let i = 0; i < e.length; i++)
    s[i] = e.charCodeAt(i);
  return s;
}
class be {
  constructor(e) {
    this.bridge = e;
  }
  async import(e) {
    const t = ve(e);
    if (!t)
      throw new Error(`Cannot import from invalid URL: ${e}`);
    if (!await this.bridge.ensureHttpAllowed(t))
      throw new Error(`Server-side import unavailable for host: ${t}`);
    const s = this.bridge.getClient();
    if (!s)
      throw new Error("Authority backend unavailable");
    const i = await s.http.fetch({ url: e, method: "GET" });
    if (!i.ok)
      throw new Error(`Server fetch failed with HTTP ${i.status} for ${e}`);
    const a = ye(i.body);
    return new Blob([a], { type: i.contentType || "application/octet-stream" });
  }
}
function ve(o) {
  try {
    return new URL(o).hostname;
  } catch {
    return null;
  }
}
const q = "st-bg-cache-v1", we = "st_bg_cache_index", b = "entries";
class _e {
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
    this.origin = new V();
  }
  async init(e) {
    "caches" in window && (this.l1 = await caches.open(q)), await this.openIndex(), e && (await e.detectAndInit()).available && e.getClient() && (this.remoteImporter = new be(e)), await this.origin.init(), console.log("[ST-BgLoader] Media library source of truth: server backgrounds/ directory (browser keeps cache only).");
  }
  async listMedia() {
    return this.origin.listCatalog();
  }
  async getMedia(e) {
    return this.origin.getCatalogItem(e);
  }
  async saveMedia(e, t, s, i, a) {
    let n = typeof e == "string" ? new Blob([e], { type: s === "svg" ? "image/svg+xml" : "text/html" }) : e;
    i === "url" && n.size === 0 && a && (n = await this.fetchForStorage(a).catch(() => new Blob([])));
    const r = await this.origin.putMedia({ blob: n, name: t, type: s, source: i, remoteUrl: a });
    return await this.backfillCache(r, n), r;
  }
  async getMediaBlobUrl(e) {
    const t = this.objectUrls.get(e.id);
    if (t)
      return await this.touchCache(e.cacheKey), t.url;
    if (this.l1) {
      const s = await this.l1.match(e.cacheKey);
      if (s) {
        const i = await s.blob(), a = URL.createObjectURL(i);
        return this.objectUrls.set(e.id, { url: a, cacheKey: e.cacheKey }), await this.touchCache(e.cacheKey), a;
      }
    }
    return await this.touchCache(e.cacheKey), e.url;
  }
  async deleteMedia(e) {
    const t = await this.getMedia(e);
    await this.origin.deleteMedia(e), t && await this.evictCacheEntry(t.cacheKey);
    const s = this.objectUrls.get(e);
    s && (URL.revokeObjectURL(s.url), this.objectUrls.delete(e));
  }
  async getCacheUsage() {
    const e = [...(await this.getIndex()).values()];
    return {
      usedBytes: e.reduce((t, s) => t + (s.size || 0), 0),
      itemCount: e.length
    };
  }
  async cleanLRU(e) {
    const t = [...(await this.reloadIndex()).values()];
    let s = t.reduce((i, a) => i + (a.size || 0), 0);
    if (!(s <= e)) {
      t.sort((i, a) => i.lastUsed - a.lastUsed);
      for (const i of t) {
        if (s <= e) break;
        await this.evictCacheEntry(i.cacheKey), s -= i.size || 0;
      }
    }
  }
  /** Clears the browser cache only — server files are never touched by maintenance. */
  async clearAll() {
    for (const e of this.objectUrls.values())
      URL.revokeObjectURL(e.url);
    this.objectUrls.clear(), "caches" in window && (await caches.delete(q), this.l1 = await caches.open(q)), await this.indexClear();
  }
  async preloadUrl(e, t) {
    const s = await this.origin.findByUrl(e);
    if (s)
      return { item: s, isNew: !1 };
    const i = e.split("/").pop()?.split("?")[0] || "preloaded_media", a = t || this.detectMediaType(i), n = await this.fetchForStorage(e), r = await this.origin.putMedia({ blob: n, name: i, type: a, source: "url", remoteUrl: e });
    return await this.backfillCache(r, n), { item: r, isNew: !0 };
  }
  detectMediaType(e) {
    return S(e);
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
      } catch (s) {
        console.warn("[ST-BgLoader] Cache backfill failed (playback still streams from server):", s);
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
    for (const [t, s] of this.objectUrls)
      s.cacheKey === e && (URL.revokeObjectURL(s.url), this.objectUrls.delete(t));
  }
  async openIndex() {
    this.indexDb = await new Promise((e, t) => {
      const s = indexedDB.open(we, 1);
      s.onupgradeneeded = (i) => {
        const a = i.target.result;
        a.objectStoreNames.contains(b) || a.createObjectStore(b, { keyPath: "cacheKey" });
      }, s.onsuccess = () => e(s.result), s.onerror = () => t(s.error);
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
      const i = this.indexDb.transaction(b, "readonly").objectStore(b).getAll();
      i.onsuccess = () => e(i.result || []), i.onerror = () => t(i.error);
    });
  }
  async indexPut(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, s) => {
      const a = this.indexDb.transaction(b, "readwrite").objectStore(b).put(e);
      a.onsuccess = () => t(), a.onerror = () => s(a.error);
    }), this.indexMirror?.set(e.cacheKey, { ...e });
  }
  async indexDelete(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, s) => {
      const a = this.indexDb.transaction(b, "readwrite").objectStore(b).delete(e);
      a.onsuccess = () => t(), a.onerror = () => s(a.error);
    }), this.indexMirror?.delete(e);
  }
  async indexClear() {
    this.indexDb || await this.openIndex(), await new Promise((e, t) => {
      const i = this.indexDb.transaction(b, "readwrite").objectStore(b).clear();
      i.onsuccess = () => e(), i.onerror = () => t(i.error);
    }), this.indexMirror = /* @__PURE__ */ new Map();
  }
}
const Se = 1e4;
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
      } catch (s) {
        console.error("[ST-BgLoader AudioEngine] Track listener failed:", s);
      }
  }
  emitPlayState(e) {
    for (const t of this.playStateListeners)
      try {
        t(e);
      } catch (s) {
        console.error("[ST-BgLoader AudioEngine] Play-state listener failed:", s);
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
      const t = e ? 800 : 2e4, s = this.audioContext.currentTime;
      this.biquadFilter.frequency.cancelScheduledValues(s), this.biquadFilter.frequency.setTargetAtTime(t, s, 0.08);
    }
  }
  getMuffled() {
    return this.isMuffled;
  }
  async playMediaItem(e, t) {
    let s = this.playlist.findIndex((i) => i.id === e.id);
    s === -1 && (s = this.playlist.findIndex((i) => i.url === e.url && i.type === e.type), s === -1 ? (this.playlist.push(e), s = this.playlist.length - 1) : this.playlist[s] = e), this.currentIndex = s, await this.startTrack(e, t);
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
    const s = t || (this.urlResolver ? await this.urlResolver(e) : e.url);
    await this.playTrack(s, this.playbackMode === "single"), this.emitTrackChange(e);
  }
  constructor() {
    this.audioElement = new Audio(), this.audioElement.preload = "auto", this.audioElement.addEventListener("ended", () => {
      this.handleTrackEnded();
    }), this.audioElement.addEventListener("play", () => {
      this.emitPlayState(!0);
    }), this.audioElement.addEventListener("pause", () => {
      this.emitPlayState(!1);
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
          this.audioElement.play().catch((s) => {
            console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", s);
          }),
          new Promise((s) => window.setTimeout(s, Se))
        ]);
      } catch (s) {
        console.warn("[ST-BgLoader AudioEngine] Autoplay was prevented by browser policy:", s);
      }
    }
  }
  fadeInVolume(e, t = 400) {
    this.clearFade();
    const s = performance.now(), i = Math.max(0, Math.min(1, e));
    this.audioElement && (this.audioElement.muted = !1, this.audioElement.volume = 0), this.attachedVideo && (this.attachedVideo.muted = !1, this.attachedVideo.volume = 0);
    const a = () => {
      const n = performance.now() - s, r = Math.min(1, n / t), l = i * r;
      this.audioElement && (this.audioElement.volume = l), this.attachedVideo && (this.attachedVideo.volume = l), r < 1 ? this.fadeTimer = requestAnimationFrame(a) : this.applyVolume();
    };
    this.fadeTimer = requestAnimationFrame(a);
  }
  stopTrack(e = 300) {
    if (!this.audioElement || this.audioElement.paused) return;
    if (e <= 0) {
      this.audioElement.pause(), this.audioElement.currentTime = 0;
      return;
    }
    const t = this.audioElement.volume, s = performance.now(), i = () => {
      const a = performance.now() - s, n = Math.min(1, a / e);
      this.audioElement && (this.audioElement.volume = t * (1 - n)), n < 1 ? this.fadeTimer = requestAnimationFrame(i) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
    };
    this.clearFade(), this.fadeTimer = requestAnimationFrame(i);
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
const Te = 15e3;
class Y {
  videoElement = null;
  container;
  audioEngine;
  pendingSettle = null;
  constructor(e, t) {
    this.container = e, this.audioEngine = t;
  }
  async render(e, t = "cover") {
    this.destroy();
    const s = document.createElement("video");
    return s.className = "st-bg-video-element", s.src = e, s.loop = !0, s.playsInline = !0, s.autoplay = !0, this.applyFitting(s, t), s.style.position = "absolute", s.style.top = "0", s.style.left = "0", s.style.width = "100%", s.style.height = "100%", s.style.pointerEvents = "none", s.style.transform = "translateZ(0)", s.style.willChange = "transform", s.style.opacity = "0", s.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(s), this.videoElement = s, this.audioEngine.attachVideo(s), new Promise((i) => {
      let a = !1;
      const n = () => {
        a || (a = !0, window.clearTimeout(r), this.pendingSettle = null, s.removeEventListener("canplay", l), i(s));
      }, r = window.setTimeout(n, Te);
      this.pendingSettle = n;
      const l = async () => {
        try {
          await s.play();
        } catch (c) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", c), s.muted = !0, s.play().catch((d) => console.error("[ST-BgLoader] Video playback error:", d));
        }
        s.style.opacity = "1", n();
      };
      s.addEventListener("canplay", l), s.addEventListener("error", (c) => {
        console.error("[ST-BgLoader] Error loading video:", c), n();
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
    const s = document.createElement("iframe");
    return s.className = "st-bg-iframe-element", s.setAttribute("sandbox", "allow-scripts allow-same-origin"), s.style.position = "absolute", s.style.top = "0", s.style.left = "0", s.style.width = "100%", s.style.height = "100%", s.style.border = "none", s.style.opacity = "0", s.style.pointerEvents = "auto", s.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(s), this.iframeElement = s, new Promise((i) => {
      let a = !1;
      const n = () => {
        a || (a = !0, window.clearTimeout(r), this.pendingSettle = null, i(s));
      }, r = window.setTimeout(n, ke);
      this.pendingSettle = n, s.onload = () => {
        s.style.opacity = "1", n();
      }, t ? s.src = e : s.srcdoc = e;
    });
  }
  destroy() {
    this.iframeElement && (this.pendingSettle?.(), this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement.remove(), this.iframeElement = null);
  }
}
const xe = 15e3;
class Z {
  imageElement = null;
  container;
  pendingSettle = null;
  constructor(e) {
    this.container = e;
  }
  async render(e, t = "cover") {
    this.destroy();
    const s = document.createElement("img");
    return s.className = "st-bg-image-element", s.src = e, this.applyFitting(s, t), s.style.position = "absolute", s.style.top = "0", s.style.left = "0", s.style.width = "100%", s.style.height = "100%", s.style.pointerEvents = "none", s.style.opacity = "0", s.style.transition = "opacity 400ms ease-in-out", this.container.appendChild(s), this.imageElement = s, new Promise((i) => {
      let a = !1;
      const n = () => {
        a || (a = !0, window.clearTimeout(r), this.pendingSettle = null, i(s));
      }, r = window.setTimeout(n, xe);
      this.pendingSettle = n, s.onload = () => {
        s.style.opacity = "1", n();
      }, s.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), n();
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
const Me = 3e4;
class Ce {
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
        const s = document.querySelector("#bg1");
        s && (window.clearTimeout(t), e.disconnect(), this.hostEl = s, this.setupContainer());
      });
      e.observe(document.body, { childList: !0, subtree: !0 });
      const t = window.setTimeout(() => e.disconnect(), Me);
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
      const s = document.createElement("div");
      s.className = "st-bg-pump-wrapper", s.style.position = "absolute", s.style.top = "0", s.style.left = "0", s.style.width = "100%", s.style.height = "100%", s.style.pointerEvents = "none", this.layerA = document.createElement("div"), this.layerA.className = "st-bg-layer st-bg-layer-a", this.setupLayerStyle(this.layerA), this.layerB = document.createElement("div"), this.layerB.className = "st-bg-layer st-bg-layer-b", this.setupLayerStyle(this.layerB), s.appendChild(this.layerA), s.appendChild(this.layerB), t.appendChild(s), this.hostEl.appendChild(t);
    }
    this.pumpWrapperEl || (this.pumpWrapperEl = this.layerA?.parentElement ?? t), this.containerEl = t, this.videoRendererA = new Y(this.layerA, this.audioEngine), this.videoRendererB = new Y(this.layerB, this.audioEngine), this.iframeRendererA = new J(this.layerA), this.iframeRendererB = new J(this.layerB), this.imageRendererA = new Z(this.layerA), this.imageRendererB = new Z(this.layerB), this.applyVisibility(), this.onHostReady?.(t);
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
    const s = () => this.doMountMedia(e, t);
    return this.mountQueue = this.mountQueue.then(s, s), this.mountQueue;
  }
  async doMountMedia(e, t) {
    if (!this.containerEl || !this.layerA || !this.layerB) return;
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null;
      const h = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, p = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, f = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      h.destroy(), p.destroy(), f.destroy();
      const m = this.activeLayer === "A" ? this.layerB : this.layerA;
      m && (m.style.opacity = "0", m.style.transform = "none", m.style.filter = "none");
    }
    const s = this.activeLayer === "A" ? "B" : "A", i = s === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, n = s === "B" ? this.videoRendererB : this.videoRendererA, r = s === "B" ? this.iframeRendererB : this.iframeRendererA, l = s === "B" ? this.imageRendererB : this.imageRendererA;
    n.destroy(), r.destroy(), l.destroy();
    const c = this.getFitting();
    switch (e.type) {
      case "video":
        await n.render(t, c);
        break;
      case "html":
      case "svg":
        await r.render(t, !0);
        break;
      case "image":
        await l.render(t, c);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, t);
        break;
    }
    const d = this.transitionDurationMs;
    i.style.transition = `all ${d}ms cubic-bezier(0.4, 0, 0.2, 1)`, a.style.transition = `all ${d}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const g = this.transitionType;
    g === "zoom_fade" ? (i.style.transform = "scale(1.06)", i.style.opacity = "0", i.offsetHeight, i.style.transform = "scale(1)", i.style.opacity = "1", a.style.transform = "scale(0.96)", a.style.opacity = "0") : g === "blur_fade" ? (i.style.filter = "blur(10px)", i.style.opacity = "0", i.offsetHeight, i.style.filter = "blur(0px)", i.style.opacity = "1", a.style.filter = "blur(10px)", a.style.opacity = "0") : g === "slide_left" ? (i.style.transform = "translate3d(100%, 0, 0)", i.style.opacity = "1", i.offsetHeight, i.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(-100%, 0, 0)", a.style.opacity = "0") : g === "slide_right" ? (i.style.transform = "translate3d(-100%, 0, 0)", i.style.opacity = "1", i.offsetHeight, i.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(100%, 0, 0)", a.style.opacity = "0") : (i.style.transform = "none", i.style.filter = "none", i.style.opacity = "1", a.style.transform = "none", a.style.filter = "none", a.style.opacity = "0"), this.activeLayer = s, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const h = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, p = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, f = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      h.destroy(), p.destroy(), f.destroy(), a.style.transform = "none", a.style.filter = "none";
    }, d + 50);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0", this.layerA.style.transform = "none", this.layerA.style.filter = "none"), this.layerB && (this.layerB.style.opacity = "0", this.layerB.style.transform = "none", this.layerB.style.filter = "none"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
const Ae = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function _(o) {
  return String(o).replace(/[&<>"']/g, (e) => Ae[e]);
}
class Ie {
  container = null;
  settings;
  callbacks;
  activeMediaName = null;
  constructor(e, t, s) {
    this.settings = e, this.callbacks = t, this.activeMediaName = s ?? null;
  }
  updateActiveMedia(e) {
    this.activeMediaName = e;
    const t = this.container?.querySelector("#st_bgloader_active_name");
    t && (t.textContent = e || "默认 / 未设置");
  }
  syncMasterToggle(e) {
    this.settings.enabled = e;
    const t = this.container?.querySelector("#st_bgloader_master_enable");
    t && (t.checked = e);
    const s = this.container?.querySelector("#st_bgloader_status_pill");
    s && (s.className = `st-bgloader-status-pill ${e ? "active" : ""}`, s.textContent = e ? "已接管顶栏" : "未接管");
    const i = this.container?.querySelector("#st_bgloader_open_topbar_btn");
    i && i.classList.toggle("st-bgloader-disabled", !e);
  }
  applyRemoteSettings(e) {
    this.settings = e, this.syncMasterToggle(e.enabled);
  }
  render() {
    const e = v.getInstance(), t = e.getExtensionsSettingsContainer();
    if (!t) {
      const r = new MutationObserver(() => {
        e.getExtensionsSettingsContainer() && (window.clearTimeout(l), r.disconnect(), this.render());
      });
      r.observe(document.body, { childList: !0, subtree: !0 });
      const l = window.setTimeout(() => r.disconnect(), 3e4);
      return;
    }
    const s = document.querySelector("#st_bgloader_container, #st_bgloader_settings");
    s && s.remove();
    const i = document.createElement("div");
    i.id = "st_bgloader_container", i.className = "extension_container", i.setAttribute("data-extension-name", "ST-BgLoader");
    const a = this.activeMediaName || "默认 / 未设置", n = this.settings.enabled ?? !0;
    i.innerHTML = `
            <div id="st_bgloader_settings" class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-photo-film"></i> <span data-i18n="ST-BgLoader (富媒体背景与视听增强)">ST-BgLoader (富媒体背景与视听增强)</span></b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="st-bgloader-master-card">
                        <div class="st-bgloader-master-row">
                            <label class="st-bgloader-check st-bgloader-master-label">
                                <input type="checkbox" id="st_bgloader_master_enable" ${n ? "checked" : ""} />
                                <span><strong>启用 ST-BgLoader 背景增强与顶栏接管</strong></span>
                            </label>
                        </div>
                        <div class="st-bgloader-master-desc">
                            <small class="st-bgloader-dim-text">顶栏背景设置按钮已替换为本插件的背景存储与详细视听配置。</small>
                        </div>
                        <div class="st-bgloader-master-status">
                            <span>当前背景: <strong id="st_bgloader_active_name">${_(a)}</strong></span>
                            <span class="st-bgloader-status-pill ${n ? "active" : ""}" id="st_bgloader_status_pill">
                                ${n ? "已接管顶栏" : "未接管"}
                            </span>
                        </div>
                        <div class="st-bgloader-master-actions">
                            <button type="button" id="st_bgloader_open_topbar_btn" class="menu_button ${n ? "" : "st-bgloader-disabled"}">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开背景与详细设置
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `, t.appendChild(i), this.container = i, this.bindEvents();
  }
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector("#st_bgloader_master_enable");
    e?.addEventListener("change", () => {
      const r = e.checked;
      this.settings.enabled = r, this.syncMasterToggle(r), this.callbacks.onMasterToggle(r), this.callbacks.onSettingsChanged(this.settings);
    }), this.container.querySelector("#st_bgloader_open_topbar_btn")?.addEventListener("click", () => {
      this.settings.enabled && v.getInstance().openBackgroundDrawer();
    });
    const s = this.container.querySelector(".inline-drawer-toggle"), i = this.container.querySelector(".inline-drawer"), a = this.container.querySelector(".inline-drawer-content"), n = this.container.querySelector(".inline-drawer-icon");
    if (s && i && a && n) {
      let r = !1;
      i.addEventListener("inline-drawer-toggle", () => {
        r = !0;
      });
      const l = window.$ || window.jQuery;
      if (typeof l == "function")
        try {
          l(i).on("inline-drawer-toggle", () => {
            r = !0;
          });
        } catch {
        }
      s.addEventListener("click", () => {
        r = !1, window.setTimeout(() => {
          if (!r) {
            const c = a.style.display === "none" || window.getComputedStyle(a).display === "none";
            a.style.display = c ? "block" : "none", n.classList.toggle("down", !c), n.classList.toggle("up", c), n.classList.toggle("fa-circle-chevron-down", !c), n.classList.toggle("fa-circle-chevron-up", c);
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
  typeFilter = "all";
  constructor(e, t, s, i) {
    this.settings = e, this.cacheManager = t, this.callbacks = s, this.authority = i ?? null;
  }
  applyRemoteSettings(e) {
    this.settings = e, this.panel && this.syncFormControls();
  }
  syncBackgroundVisible(e) {
    const t = this.panel?.querySelector("#st_topbar_bg_vis_btn");
    t && (t.innerHTML = `<i class="fa-solid ${e ? "fa-eye" : "fa-eye-slash"}"></i>`, t.title = e ? "背景图层已显示 (点击隐藏)" : "背景图层已隐藏 (点击显示)");
    const s = this.panel?.querySelector("#st_bg_visible_topbar");
    s && (s.checked = e);
  }
  /** Mounts the takeover panel into the host's #Backgrounds drawer */
  mount() {
    const e = v.getInstance();
    if (this.hostDrawer = e.getBackgroundDrawer(), !this.hostDrawer) {
      const s = new MutationObserver(() => {
        const i = e.getBackgroundDrawer();
        i && (s.disconnect(), this.hostDrawer = i, this.mount());
      });
      s.observe(document.body, { childList: !0, subtree: !0 }), setTimeout(() => s.disconnect(), 15e3);
      return;
    }
    Array.from(this.hostDrawer.children).forEach((s) => {
      s.id !== "st_bgloader_topbar_panel" && s.classList.add(ee);
    });
    const t = this.hostDrawer.querySelector("#st_bgloader_topbar_panel");
    t && t.remove(), this.panel = document.createElement("div"), this.panel.id = "st_bgloader_topbar_panel", this.panel.className = "st-bgloader-topbar-panel", this.renderPanel(), this.hostDrawer.appendChild(this.panel), this.bindEvents(), this.refreshMediaGrid(), this.updateCacheStats(), this.updateCloudPanel();
  }
  /** Restores the host drawer to its native state */
  unmount() {
    this.panel && (this.panel.remove(), this.panel = null), this.hostDrawer && Array.from(this.hostDrawer.children).forEach((e) => {
      e.classList.remove(ee);
    });
  }
  renderPanel() {
    if (!this.panel) return;
    const e = this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? !0;
    this.panel.innerHTML = `
            <div class="st-bgloader-topbar-header">
                <div class="st-bgloader-tab-bar">
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === "library" ? "active" : ""}" data-tab="library">
                        <i class="fa-solid fa-photo-film"></i> 背景媒体库
                    </button>
                    <button type="button" class="menu_button st-bgloader-tab-btn ${this.activeTab === "settings" ? "active" : ""}" data-tab="settings">
                        <i class="fa-solid fa-sliders"></i> 详细设置
                    </button>
                </div>
                <div class="st-bgloader-topbar-actions">
                    <button type="button" id="st_topbar_bg_vis_btn" class="menu_button menu_button_icon" title="${e ? "背景图层已显示 (点击隐藏)" : "背景图层已隐藏 (点击显示)"}">
                        <i class="fa-solid ${e ? "fa-eye" : "fa-eye-slash"}"></i>
                    </button>
                    <button type="button" id="st_topbar_bg_clear_btn" class="menu_button menu_button_icon" title="清除当前背景">
                        <i class="fa-solid fa-ban"></i>
                    </button>
                    <button type="button" id="st_topbar_drawer_close" class="menu_button menu_button_icon" title="收起抽屉">
                        <i class="fa-solid fa-chevron-up"></i>
                    </button>
                </div>
            </div>

            <div class="st-bgloader-topbar-body">
                <!-- Tab 1: Library -->
                <div id="st_tab_library" class="st-bgloader-tab-content ${this.activeTab === "library" ? "active" : ""}">
                    <!-- Upload & Filter Bar -->
                    <div class="st-bgloader-toolbar-row">
                        <div class="st-bgloader-search-wrap">
                            <input type="search" id="st_topbar_search" class="text_pole" placeholder="搜索背景名称..." value="${_(this.searchQuery)}" />
                        </div>
                        <select id="st_topbar_type_filter" class="text_pole">
                            <option value="all" ${this.typeFilter === "all" ? "selected" : ""}>全部类型</option>
                            <option value="image" ${this.typeFilter === "image" ? "selected" : ""}>图片 (Image)</option>
                            <option value="video" ${this.typeFilter === "video" ? "selected" : ""}>视频 (Video)</option>
                            <option value="audio" ${this.typeFilter === "audio" ? "selected" : ""}>音频 (Audio)</option>
                            <option value="html" ${this.typeFilter === "html" ? "selected" : ""}>网页/SVG</option>
                        </select>
                        <button type="button" id="st_topbar_upload_toggle_btn" class="menu_button" title="展开导入面板">
                            <i class="fa-solid fa-cloud-arrow-up"></i> 导入
                        </button>
                    </div>

                    <!-- Collapsible Upload Box -->
                    <div id="st_topbar_upload_box" class="st-bgloader-upload-box" style="display: none;">
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone">
                            <i class="fa-solid fa-file-video fa-2x"></i>
                            <div>点击或拖拽文件至此导入 (视频, 音频, 图片, HTML, SVG)</div>
                            <input type="file" id="st_bgloader_file_input" class="st-bgloader-hidden" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" class="text_pole" placeholder="输入媒体直链 URL (HTTP/HTTPS)..." />
                            <button type="button" id="st_bgloader_url_btn" class="menu_button">导入 URL</button>
                        </div>
                    </div>

                    <!-- Media Grid -->
                    <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                        <div class="st-bgloader-grid-loading"><i class="fa-solid fa-spinner fa-spin"></i> 加载背景库中...</div>
                    </div>
                </div>

                <!-- Tab 2: Settings -->
                <div id="st_tab_settings" class="st-bgloader-tab-content ${this.activeTab === "settings" ? "active" : ""}">
                    <!-- Audiovisual Scene Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-earth-americas"></i> Audiovisual Scene Presets (全景视听预设)</h4>
                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-sm">Scene:</label>
                            <select id="st_scene_select" class="text_pole">
                                <!-- Populated dynamically -->
                            </select>
                            <button type="button" id="st_scene_apply_btn" class="menu_button" title="Apply Scene"><i class="fa-solid fa-play"></i> Apply</button>
                            <button type="button" id="st_scene_save_btn" class="menu_button" title="Save current setup as custom scene"><i class="fa-solid fa-floppy-disk"></i></button>
                            <button type="button" id="st_scene_del_btn" class="menu_button" title="Delete custom scene"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>

                    <!-- Visual Filters & Presets Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-sliders"></i> Visual Adjustments & Presets (视听滤镜与调色)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-sm">Preset:</label>
                            <select id="st_preset_select" class="text_pole">
                                <!-- Populated dynamically -->
                            </select>
                            <button type="button" id="st_preset_save_btn" class="menu_button" title="Save current sliders as custom preset">
                                <i class="fa-solid fa-floppy-disk"></i>
                            </button>
                            <button type="button" id="st_preset_del_btn" class="menu_button" title="Delete custom preset">
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

                        <div class="st-bgloader-divider">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_bg_interactive" ${this.settings.interactiveBackground ? "checked" : ""} />
                                <span>Allow background mouse interaction (3D/Canvas/Games)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Atmospheric Weather & Particles Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-cloud-sun-rain"></i> Atmospheric Weather & Particles (天气微粒)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-md">Weather:</label>
                            <select id="st_weather_type" class="text_pole">
                                ${E.map((t) => `<option value="${t}" ${this.settings.weather.type === t ? "selected" : ""}>${he[t]}</option>`).join(`
                                `)}
                            </select>
                        </div>

                        <div class="st-bgloader-preset-row">
                            <label class="st-bgloader-label-md">Density:</label>
                            <select id="st_weather_density" class="text_pole">
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
                        <h4><i class="fa-solid fa-chart-simple"></i> Audio Visualizer & Parallax (频谱与视差)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label>Visualizer:</label>
                            <select id="st_visualizer_mode" class="text_pole">
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

                        <div class="st-bgloader-divider">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_parallax_enabled" ${this.settings.parallax.enabled ? "checked" : ""} />
                                <span>Enable 2.5D Mouse Gyro Parallax (景深视差)</span>
                            </label>
                        </div>

                        <div class="st-bgloader-slider-row st-bgloader-gap-top-md">
                            <label>Depth Intensity</label>
                            <input type="range" id="st_parallax_intensity" min="1" max="10" step="1" value="${Math.round(this.settings.parallax.intensity * 10)}" />
                            <span class="st-bgloader-slider-val" id="st_parallax_intensity_val">${this.settings.parallax.intensity}</span>
                        </div>
                    </div>

                    <!-- Ambient Sound Generator Section -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-fire"></i> Ambient Soundscape Generator (环境白噪音)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label>Soundscape:</label>
                            <select id="st_ambient_type" class="text_pole">
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
                        
                        <label class="st-bgloader-check st-bgloader-check-lead">
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
                        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Scene Transitions (转场动画)</h4>
                        
                        <div class="st-bgloader-preset-row">
                            <label>Effect:</label>
                            <select id="st_transition_effect" class="text_pole">
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
                        <h4><i class="fa-solid fa-volume-high"></i> Audio & BGM Playlist (音乐与播放)</h4>
                        
                        <div class="st-bgloader-slider-row">
                            <label>Volume</label>
                            <input type="range" id="st_audio_volume" min="0" max="100" step="1" value="${Math.round(this.settings.volume * 100)}" />
                            <span class="st-bgloader-slider-val" id="st_audio_volume_val">${Math.round(this.settings.volume * 100)}%</span>
                        </div>

                        <div class="st-bgloader-preset-row st-bgloader-gap-top">
                            <label>Play Mode:</label>
                            <select id="st_playback_mode" class="text_pole">
                                <option value="loop" ${this.settings.playbackMode === "loop" ? "selected" : ""}>Loop Playlist (循环列表)</option>
                                <option value="single" ${this.settings.playbackMode === "single" ? "selected" : ""}>Single Track Loop (单曲循环)</option>
                                <option value="shuffle" ${this.settings.playbackMode === "shuffle" ? "selected" : ""}>Shuffle (随机播放)</option>
                            </select>
                        </div>

                        <div class="st-bgloader-check-stack">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_audio_mute" ${this.settings.muted ? "checked" : ""} />
                                <span>Mute Audio</span>
                            </label>
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_audio_muffle" ${this.settings.muffleBGM ? "checked" : ""} />
                                <span>Lo-Fi Acoustic Muffle (隔壁房间低通滤波沉浸感)</span>
                            </label>
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_audio_blur" ${this.settings.pauseOnBlur ? "checked" : ""} />
                                <span>Pause when tab inactive</span>
                            </label>
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_mini_player_toggle" ${this.settings.showMiniPlayer ? "checked" : ""} />
                                <span>Show floating mini player capsule</span>
                            </label>
                            <label class="st-bgloader-check st-bgloader-check-sub">
                                <input type="checkbox" id="st_capsule_on_play" ${this.settings.capsuleOnPlayOnly ? "checked" : ""} />
                                <span>Only show capsule during active playback</span>
                            </label>
                        </div>
                    </div>

                    <!-- Smart Scene Triggers -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-bolt"></i> Smart Scene Triggers (触发器规则)</h4>
                        <div class="st-bgloader-trigger-list" id="st_trigger_list">
                            <!-- Populated dynamically -->
                        </div>
                        <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                            <div class="st-bgloader-preset-row">
                                <label>类型:</label>
                                <select id="st_trigger_type" class="text_pole">
                                    <option value="character">角色名 (Character)</option>
                                    <option value="chat">聊天 ID (Chat)</option>
                                    <option value="regex">正则匹配 (Regex)</option>
                                </select>
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label>规则名:</label>
                                <input type="text" id="st_trigger_name" class="text_pole" placeholder="规则名称" />
                            </div>
                            <div class="st-bgloader-preset-row">
                                <label>匹配:</label>
                                <input type="text" id="st_trigger_pattern" class="text_pole" placeholder="角色名 / 聊天 ID / 正则表达式" />
                            </div>
                            <div class="st-bgloader-btn-row">
                                <button type="button" id="st_trigger_confirm_btn" class="menu_button"><i class="fa-solid fa-check"></i> 添加规则</button>
                                <button type="button" id="st_trigger_cancel_btn" class="menu_button">取消</button>
                            </div>
                        </div>
                        <button type="button" id="st_trigger_add_btn" class="menu_button st-bgloader-btn-full">
                            <i class="fa-solid fa-plus"></i> Add Scene Trigger Rule
                        </button>
                    </div>

                    <!-- Backup & Cache -->
                    <div class="st-bgloader-section">
                        <h4><i class="fa-solid fa-file-export"></i> Backup & Cache (缓存与备份)</h4>
                        <div class="st-bgloader-row-between">
                            <div>Used: <strong id="st_cache_used">Calculating...</strong> (<span id="st_cache_count">0</span> items)</div>
                            <button type="button" id="st_cache_clear_btn" class="menu_button menu_button_danger">Clear Cache</button>
                        </div>
                        <div class="st-bgloader-slider-row">
                            <label>Cache quota</label>
                            <input type="range" id="st_cache_quota" min="128" max="8192" step="128" value="${this.settings.cacheQuotaMB}" />
                            <span class="st-bgloader-slider-val" id="st_cache_quota_val">${this.settings.cacheQuotaMB} MB</span>
                        </div>
                        <div class="st-bgloader-check-stack">
                            <label class="st-bgloader-check">
                                <input type="checkbox" id="st_cache_autoclean" ${this.settings.lruAutoClean ? "checked" : ""} />
                                <span>Auto-clean browser cache above quota (服务端文件不受影响)</span>
                            </label>
                        </div>
                        <div class="st-bgloader-btn-row">
                            <button type="button" id="st_backup_export_btn" class="menu_button"><i class="fa-solid fa-download"></i> 导出设置 JSON</button>
                            <label for="st_backup_import_file" class="menu_button">
                                <i class="fa-solid fa-upload"></i> 导入设置 JSON
                                <input type="file" id="st_backup_import_file" class="st-bgloader-hidden" accept=".json" />
                            </label>
                        </div>
                    </div>

                    <!-- Authority Cloud & Agent Tools Section -->
                    <div class="st-bgloader-section" id="st_authority_section">
                        <h4><i class="fa-solid fa-cloud"></i> Cloud Sync & Agent Tools</h4>
                        <div id="st_cloud_status_text" class="st-bgloader-cloud-note">
                            <!-- Populated dynamically based on capabilities -->
                        </div>
                        <div class="st-bgloader-check-stack">
                            <label class="st-bgloader-check" id="st_agent_tools_wrapper">
                                <input type="checkbox" id="st_agent_tools_enable" ${this.settings.agentToolsEnabled ? "checked" : ""} />
                                <span>启用 Agent 视听导演工具 (AI 可按剧情切换背景/天气/音乐)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }
  bindEvents() {
    if (!this.panel) return;
    this.panel.querySelectorAll(".st-bgloader-tab-btn").forEach((h) => {
      h.addEventListener("click", () => {
        const p = h.dataset.tab;
        if (!p) return;
        this.activeTab = p, this.panel?.querySelectorAll(".st-bgloader-tab-btn").forEach((m) => m.classList.remove("active")), h.classList.add("active"), this.panel?.querySelectorAll(".st-bgloader-tab-content").forEach((m) => m.classList.remove("active"));
        const f = this.panel?.querySelector(`#st_tab_${p}`);
        f && f.classList.add("active");
      });
    }), this.panel.querySelector("#st_topbar_bg_vis_btn")?.addEventListener("click", () => {
      const p = !(this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? !0);
      this.callbacks.onBackgroundVisibilityChanged?.(p), this.syncBackgroundVisible(p);
    }), this.panel.querySelector("#st_topbar_bg_clear_btn")?.addEventListener("click", () => {
      this.callbacks.onClearActiveBackground?.();
    }), this.panel.querySelector("#st_topbar_drawer_close")?.addEventListener("click", () => {
      v.getInstance().closeBackgroundDrawer();
    });
    const i = this.panel.querySelector("#st_topbar_search");
    i?.addEventListener("input", () => {
      this.searchQuery = i.value.trim().toLowerCase(), this.refreshMediaGrid();
    });
    const a = this.panel.querySelector("#st_topbar_type_filter");
    a?.addEventListener("change", () => {
      this.typeFilter = a.value, this.refreshMediaGrid();
    });
    const n = this.panel.querySelector("#st_topbar_upload_toggle_btn"), r = this.panel.querySelector("#st_topbar_upload_box");
    n?.addEventListener("click", () => {
      if (!r) return;
      const h = r.style.display === "none";
      r.style.display = h ? "block" : "none", n.classList.toggle("active", h);
    });
    const l = this.panel.querySelector("#st_bgloader_dropzone"), c = this.panel.querySelector("#st_bgloader_file_input");
    l?.addEventListener("click", () => c?.click()), l?.addEventListener("dragover", (h) => {
      h.preventDefault(), l.classList.add("dragover");
    }), l?.addEventListener("dragleave", () => l.classList.remove("dragover")), l?.addEventListener("drop", (h) => {
      h.preventDefault(), l.classList.remove("dragover");
      const p = h.dataTransfer?.files;
      p && p.length > 0 && this.handleFileUpload(p[0]);
    }), c?.addEventListener("change", () => {
      c.files && c.files.length > 0 && this.handleFileUpload(c.files[0]);
    });
    const d = this.panel.querySelector("#st_bgloader_url_btn"), g = this.panel.querySelector("#st_bgloader_url_input");
    d?.addEventListener("click", () => {
      const h = g?.value.trim();
      h && (this.handleUrlImport(h), g && (g.value = ""));
    }), this.bindSettingsFormEvents();
  }
  bindSettingsFormEvents() {
    if (!this.panel) return;
    const e = (u, y, A, O) => {
      const x = this.panel?.querySelector(`#${u}`), W = this.panel?.querySelector(`#${y}`);
      x?.addEventListener("input", () => {
        const j = Number(x.value);
        W && (W.textContent = `${j}${A}`), O(j);
      });
    };
    e("st_filter_blur", "st_filter_blur_val", "px", (u) => {
      this.settings.filters.blur = u, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_brightness", "st_filter_brightness_val", "%", (u) => {
      this.settings.filters.brightness = u, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_opacity", "st_filter_opacity_val", "%", (u) => {
      this.settings.filters.opacity = u, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_saturate", "st_filter_saturate_val", "%", (u) => {
      this.settings.filters.saturate = u, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    });
    const t = this.panel.querySelector("#st_bg_interactive");
    t?.addEventListener("change", () => {
      this.settings.interactiveBackground = t.checked, this.callbacks.onInteractiveChanged(t.checked), this.save();
    });
    const s = this.panel.querySelector("#st_weather_type"), i = this.panel.querySelector("#st_weather_density"), a = () => {
      s && (this.settings.weather.type = s.value), i && (this.settings.weather.density = i.value), this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    };
    s?.addEventListener("change", a), i?.addEventListener("change", a), e("st_weather_speed", "st_weather_speed_val", "x", (u) => {
      this.settings.weather.speed = u / 10, this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    }), e("st_weather_opacity", "st_weather_opacity_val", "%", (u) => {
      this.settings.weather.opacity = u / 100, this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    });
    const n = this.panel.querySelector("#st_visualizer_mode");
    n?.addEventListener("change", () => {
      this.settings.visualizer.mode = n.value, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.save();
    }), e("st_visualizer_sens", "st_visualizer_sens_val", "x", (u) => {
      this.settings.visualizer.sensitivity = u / 10, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.save();
    });
    const r = this.panel.querySelector("#st_parallax_enabled");
    r?.addEventListener("change", () => {
      this.settings.parallax.enabled = r.checked, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.save();
    }), e("st_parallax_intensity", "st_parallax_intensity_val", "", (u) => {
      this.settings.parallax.intensity = u / 10, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.save();
    });
    const l = this.panel.querySelector("#st_ambient_type");
    l?.addEventListener("change", () => {
      this.settings.ambientSound.type = l.value, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.save();
    }), e("st_ambient_vol", "st_ambient_vol_val", "%", (u) => {
      this.settings.ambientSound.volume = u / 100, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.save();
    });
    const c = this.panel.querySelector("#st_frosted_enabled");
    c?.addEventListener("change", () => {
      this.settings.frostedChat.enabled = c.checked, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    }), e("st_frosted_blur", "st_frosted_blur_val", "px", (u) => {
      this.settings.frostedChat.blur = u, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    }), e("st_frosted_opacity", "st_frosted_opacity_val", "%", (u) => {
      this.settings.frostedChat.opacity = u, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    });
    const d = this.panel.querySelector("#st_transition_effect");
    d?.addEventListener("change", () => {
      this.settings.transitionEffect = d.value, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.save();
    }), e("st_transition_dur", "st_transition_dur_val", "ms", (u) => {
      this.settings.transitionDurationMs = u, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.save();
    }), e("st_audio_volume", "st_audio_volume_val", "%", (u) => {
      this.settings.volume = u / 100, this.save();
    });
    const g = this.panel.querySelector("#st_playback_mode");
    g?.addEventListener("change", () => {
      this.settings.playbackMode = g.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.save();
    });
    const h = this.panel.querySelector("#st_audio_mute");
    h?.addEventListener("change", () => {
      this.settings.muted = h.checked, this.save();
    });
    const p = this.panel.querySelector("#st_audio_muffle");
    p?.addEventListener("change", () => {
      this.settings.muffleBGM = p.checked, this.callbacks.onMuffleChanged?.(p.checked), this.save();
    });
    const f = this.panel.querySelector("#st_audio_blur");
    f?.addEventListener("change", () => {
      this.settings.pauseOnBlur = f.checked, this.save();
    });
    const m = this.panel.querySelector("#st_mini_player_toggle");
    m?.addEventListener("change", () => {
      this.settings.showMiniPlayer = m.checked, this.callbacks.onMiniPlayerToggle(m.checked), this.save();
    });
    const F = this.panel.querySelector("#st_capsule_on_play");
    F?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = F.checked, this.callbacks.onCapsuleOnPlayToggle?.(F.checked), this.save();
    }), e("st_cache_quota", "st_cache_quota_val", " MB", (u) => {
      this.settings.cacheQuotaMB = u, this.save();
    });
    const H = this.panel.querySelector("#st_cache_autoclean");
    H?.addEventListener("change", () => {
      this.settings.lruAutoClean = H.checked, this.save();
    }), this.panel.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      await this.cacheManager.clearAll(), this.updateCacheStats(), this.refreshMediaGrid();
    }), this.panel.querySelector("#st_backup_export_btn")?.addEventListener("click", () => {
      const u = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.settings, null, 2)), y = document.createElement("a");
      y.setAttribute("href", u), y.setAttribute("download", `st-bgloader-backup-${Date.now()}.json`), document.body.appendChild(y), y.click(), y.remove();
    }), this.panel.querySelector("#st_backup_import_file")?.addEventListener("change", (u) => {
      const y = u.target.files?.[0];
      if (!y) return;
      const A = new FileReader();
      A.onload = (O) => {
        try {
          const x = JSON.parse(O.target?.result);
          this.settings = { ...this.settings, ...x }, this.save(), this.syncFormControls();
        } catch {
          alert("导入失败：不是有效的 JSON 配置文件");
        }
      }, A.readAsText(y);
    }), this.updatePresetSelect(), this.updateSceneSelect(), this.updateTriggersUI();
  }
  save() {
    this.callbacks.onSettingsChanged(this.settings);
  }
  syncFormControls() {
    this.panel && (this.updateFilterSliders(), this.updatePresetSelect(), this.updateSceneSelect(), this.updateTriggersUI(), this.updateCacheStats(), this.updateCloudPanel());
  }
  updateFilterSliders() {
    if (!this.panel) return;
    const e = (t, s, i, a) => {
      const n = this.panel?.querySelector(`#${t}`), r = this.panel?.querySelector(`#${s}`);
      n && (n.value = String(i)), r && (r.textContent = `${i}${a}`);
    };
    e("st_filter_blur", "st_filter_blur_val", this.settings.filters.blur, "px"), e("st_filter_brightness", "st_filter_brightness_val", this.settings.filters.brightness, "%"), e("st_filter_opacity", "st_filter_opacity_val", this.settings.filters.opacity, "%"), e("st_filter_saturate", "st_filter_saturate_val", this.settings.filters.saturate, "%");
  }
  async refreshMediaGrid() {
    const e = this.panel?.querySelector("#st_bgloader_grid");
    if (!e) return;
    let t = await this.cacheManager.listMedia();
    if (this.typeFilter !== "all" && (t = t.filter((s) => s.type === this.typeFilter)), this.searchQuery && (t = t.filter((s) => s.name.toLowerCase().includes(this.searchQuery))), t.length === 0) {
      e.innerHTML = `
                <div class="st-bgloader-empty-state">
                    <i class="fa-solid fa-folder-open fa-2x"></i>
                    <div>未找到匹配的背景文件</div>
                    <small>点击上方“导入”添加图片、视频、音频或网页背景</small>
                </div>
            `;
      return;
    }
    e.innerHTML = "", t.forEach((s) => {
      const i = document.createElement("div"), a = this.settings.activeMediaId === s.id;
      i.className = `st-bgloader-media-card ${a ? "active" : ""}`, i.title = s.name;
      let n = "fa-file-image";
      s.type === "video" && (n = "fa-file-video"), s.type === "audio" && (n = "fa-file-audio"), (s.type === "html" || s.type === "svg") && (n = "fa-file-code");
      const r = s.type === "image" ? `<div class="st-bgloader-card-img" style="background-image: url('${_(s.url)}')"></div>` : `<div class="st-bgloader-card-icon"><i class="fa-solid ${n} fa-2x"></i></div>`;
      i.innerHTML = `
                ${r}
                <div class="st-bgloader-card-info">
                    <div class="st-bgloader-card-name">${_(s.name)}</div>
                    <div class="st-bgloader-card-meta">
                        <span class="st-bg-native-badge ${s.type}">${s.type.toUpperCase()}</span>
                        ${a ? '<span class="st-bgloader-active-tag"><i class="fa-solid fa-check"></i> 使用中</span>' : ""}
                    </div>
                </div>
                <div class="st-bgloader-card-actions">
                    <button type="button" class="menu_button menu_button_icon st-card-apply" title="应用为背景"><i class="fa-solid fa-play"></i></button>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-card-delete" title="删除"><i class="fa-solid fa-trash"></i></button>
                </div>
            `, i.querySelector(".st-card-apply")?.addEventListener("click", (l) => {
        l.stopPropagation(), this.callbacks.onMediaSelected(s);
      }), i.querySelector(".st-card-delete")?.addEventListener("click", async (l) => {
        l.stopPropagation(), confirm(`确定删除背景 "${s.name}" 吗？`) && (await this.cacheManager.deleteMedia(s.id), this.callbacks.onMediaDeleted(s.id), this.refreshMediaGrid(), this.updateCacheStats());
      }), i.addEventListener("click", () => {
        this.callbacks.onMediaSelected(s);
      }), e.appendChild(i);
    });
  }
  async handleFileUpload(e) {
    try {
      const t = S(e.name), s = await this.cacheManager.saveMedia(
        e,
        e.name,
        t,
        "server"
      );
      this.callbacks.onMediaUploaded(s), this.refreshMediaGrid(), this.updateCacheStats();
    } catch (t) {
      console.error("[ST-BgLoader] Upload failed:", t), alert(`上传失败: ${t.message}`);
    }
  }
  async handleUrlImport(e) {
    try {
      const t = e.substring(e.lastIndexOf("/") + 1).split("?")[0] || "remote_media", s = S(t), i = await this.cacheManager.saveMedia(
        new Blob([]),
        t,
        s,
        "url",
        e
      );
      this.callbacks.onMediaUploaded(i), this.refreshMediaGrid(), this.updateCacheStats();
    } catch (t) {
      console.error("[ST-BgLoader] URL Import failed:", t), alert(`URL 导入失败: ${t.message}`);
    }
  }
  updatePresetSelect() {
    const e = this.panel?.querySelector("#st_preset_select");
    if (!e) return;
    e.innerHTML = "", Object.values(C).forEach((i) => {
      const a = document.createElement("option");
      a.value = i.id, a.textContent = i.name, a.selected = this.settings.activePresetId === i.id, e.appendChild(a);
    }), Object.entries(this.settings.userPresets || {}).forEach(([i, a]) => {
      const n = document.createElement("option");
      n.value = i, n.textContent = `⭐ ${i} (自定义)`, n.selected = this.settings.activePresetId === i, e.appendChild(n);
    }), e.onchange = () => {
      const i = e.value;
      this.settings.activePresetId = i;
      const a = C[i]?.filters || this.settings.userPresets?.[i];
      a && (this.settings.filters = { ...a }, this.updateFilterSliders(), this.callbacks.onPresetChanged({ id: i, name: i, filters: this.settings.filters }), this.save());
    };
    const t = this.panel?.querySelector("#st_preset_save_btn");
    t && (t.onclick = () => {
      const i = prompt("请输入新预设名称:");
      i && (this.settings.userPresets || (this.settings.userPresets = {}), this.settings.userPresets[i] = { ...this.settings.filters }, this.settings.activePresetId = i, this.save(), this.updatePresetSelect());
    });
    const s = this.panel?.querySelector("#st_preset_del_btn");
    s && (s.onclick = () => {
      const i = e.value;
      if (C[i]) {
        alert("无法删除内置预设");
        return;
      }
      this.settings.userPresets?.[i] && (delete this.settings.userPresets[i], this.settings.activePresetId = "default", this.settings.filters = { ...C.default.filters }, this.updateFilterSliders(), this.save(), this.updatePresetSelect());
    });
  }
  updateSceneSelect() {
    const e = this.panel?.querySelector("#st_scene_select");
    if (!e) return;
    e.innerHTML = "", Object.values(B).forEach((a) => {
      const n = document.createElement("option");
      n.value = a.id, n.textContent = a.name, n.selected = this.settings.activeSceneId === a.id, e.appendChild(n);
    }), Object.entries(this.settings.scenes || {}).forEach(([a, n]) => {
      const r = document.createElement("option");
      r.value = a, r.textContent = `⭐ ${n.name} (自定义)`, r.selected = this.settings.activeSceneId === a, e.appendChild(r);
    });
    const t = this.panel?.querySelector("#st_scene_apply_btn");
    t && (t.onclick = () => {
      const a = e.value;
      this.callbacks.onSceneApplied?.(a);
    });
    const s = this.panel?.querySelector("#st_scene_save_btn");
    s && (s.onclick = () => {
      const a = prompt("保存当前设置为场景，请输入场景名称:");
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
    const i = this.panel?.querySelector("#st_scene_del_btn");
    i && (i.onclick = () => {
      const a = e.value;
      if (B[a]) {
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
    t.length === 0 ? e.innerHTML = '<div class="st-bgloader-dim-text">暂无场景触发规则，点击下方添加</div>' : t.forEach((r, l) => {
      const c = document.createElement("div");
      c.className = "st-bgloader-trigger-row", c.innerHTML = `
                    <input type="checkbox" ${r.enabled ? "checked" : ""} class="st-trigger-check" />
                    <span class="st-trigger-badge">${r.type}</span>
                    <span class="st-trigger-name">${_(r.name)}</span>
                    <span class="st-trigger-pattern">${_(r.pattern)}</span>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-trigger-del"><i class="fa-solid fa-trash"></i></button>
                `, c.querySelector(".st-trigger-check")?.addEventListener("change", (d) => {
        r.enabled = d.target.checked, this.save();
      }), c.querySelector(".st-trigger-del")?.addEventListener("click", () => {
        this.settings.triggerRules.splice(l, 1), this.save(), this.updateTriggersUI();
      }), e.appendChild(c);
    });
    const s = this.panel?.querySelector("#st_trigger_form"), i = this.panel?.querySelector("#st_trigger_add_btn"), a = this.panel?.querySelector("#st_trigger_cancel_btn"), n = this.panel?.querySelector("#st_trigger_confirm_btn");
    i && s && (i.onclick = () => {
      s.style.display = "block", i.style.display = "none";
    }), a && s && i && (a.onclick = () => {
      s.style.display = "none", i.style.display = "block";
    }), n && s && i && (n.onclick = () => {
      const r = this.panel?.querySelector("#st_trigger_type")?.value, l = this.panel?.querySelector("#st_trigger_name")?.value.trim(), c = this.panel?.querySelector("#st_trigger_pattern")?.value.trim();
      if (!l || !c) {
        alert("请填写规则名称和匹配文本");
        return;
      }
      const d = {
        id: "trig_" + Date.now(),
        name: l,
        enabled: !0,
        type: r,
        pattern: c,
        action: {
          preset: this.settings.activePresetId,
          weather: this.settings.weather.type
        }
      };
      this.settings.triggerRules || (this.settings.triggerRules = []), this.settings.triggerRules.push(d), this.save(), this.updateTriggersUI(), s.style.display = "none", i.style.display = "block";
    });
  }
  async updateCacheStats() {
    if (this.panel)
      try {
        const e = await this.cacheManager.getCacheUsage(), t = this.panel.querySelector("#st_cache_used"), s = this.panel.querySelector("#st_cache_count");
        if (t) {
          const i = (e.usedBytes / 1048576).toFixed(1);
          t.textContent = `${i} MB`;
        }
        s && (s.textContent = String(e.itemCount));
      } catch {
      }
  }
  updateCloudPanel() {
    const e = this.panel?.querySelector("#st_cloud_status_text");
    if (!e) return;
    if (!this.authority?.getClient()) {
      e.innerHTML = '<span class="st-bgloader-dim-text">本地离线运行模式 (Authority 云后端未连接)</span>';
      return;
    }
    e.innerHTML = '<span class="st-bgloader-success-text"><i class="fa-solid fa-cloud-check"></i> Authority 云端就绪，支持跨设备同步与 AI 导演</span>';
  }
}
const L = "data-st-bg-augmented", te = "data-st-bg-badge", N = "data-st-bg-current", M = "st-bg-takeover-selected", Be = "custom_background", Re = 3e4;
class Pe {
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
    const s = e.querySelector(".bg_example");
    if (s && !s.hasAttribute("bgfile")) return null;
    const i = window.event_types;
    return {
      menuContent: e,
      customContent: document.querySelector("#bg_custom_content") ?? e,
      bgHost: t,
      hasForceEvent: !!i?.FORCE_SET_BACKGROUND
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
    e && (e.menuContent.querySelectorAll(`[${te}]`).forEach((t) => t.remove()), e.menuContent.querySelectorAll(`[${N}]`).forEach((t) => t.remove()), e.menuContent.querySelectorAll(`.${M}`).forEach((t) => t.classList.remove(M)), e.menuContent.querySelectorAll(`[${L}]`).forEach((t) => t.removeAttribute(L)), this.restoreNativeBackgroundImage(e.bgHost)), this.seams = null;
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
    !e || !this.active || (e.menuContent.querySelectorAll(`.bg_example[bgfile]:not([${L}])`).forEach((t) => {
      t.setAttribute(L, "true"), this.addBadge(t);
    }), this.refreshSelection(this.activeFileName));
  }
  addBadge(e) {
    const t = S(e.getAttribute("bgfile") || "");
    if (t === "image") return;
    const s = document.createElement("span");
    s.className = `st-bg-native-badge ${t}`, s.setAttribute(te, "true"), s.textContent = t.toUpperCase(), e.appendChild(s);
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
    t && t.menuContent.querySelectorAll(".bg_example").forEach((s) => {
      const i = !!e && s.getAttribute("bgfile") === e, a = s.classList.contains(M), n = s.querySelector(`[${N}]`);
      if (i && !a && s.classList.add(M), !i && a && s.classList.remove(M), i && !n) {
        const r = document.createElement("span");
        r.className = "st-bg-native-current", r.setAttribute(N, "true"), s.appendChild(r);
      }
      !i && n && n.remove();
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
    const s = t.closest(".bg_example");
    if (!s || !this.shouldTakeOver(s, t)) return;
    const i = s.getAttribute("bgfile");
    i && (e.preventDefault(), e.stopPropagation(), this.onSelect(i, S(i)));
  };
  /**
   * Decides whether a thumbnail click is ours to handle.
   *
   * Every pass-through rule below mirrors a branch the host itself acts on, so that taking the
   * picker over never removes a capability the user had. Each one names its host signal; the
   * line numbers are for the host version recorded in `research/st-native-evidence.md`.
   */
  shouldTakeOver(e, t) {
    return !(document.querySelector("#Backgrounds.bg-selection-mode") || this.isChatBackgroundLocked() || t.closest(".jg-button, .bg_folder_tile, .mobile-only-menu-toggle") || e.getAttribute("custom") === "true" || this.level === "non-image" && S(e.getAttribute("bgfile") || "") === "image");
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
    return !!window.SillyTavern?.getContext?.()?.chatMetadata?.[Be];
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
    }), this.seamWaitObserver.observe(document.body, { childList: !0, subtree: !0 }), this.seamGiveUpTimer = window.setTimeout(() => this.stopWaitingForSeams(), Re));
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
class Fe {
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
    const s = document.querySelector("#st_bg_mini_player");
    s && s.remove();
    const i = document.createElement("div");
    i.id = "st_bg_mini_player", i.className = "st-bg-mini-player";
    const a = this.audioEngine.getCurrentTrack(), n = a ? a.name : "No Audio Selected", r = this.audioEngine.isPlaying(), l = this.audioEngine.getPlaybackMode(), c = this.isVisible && (!this.capsuleOnPlayOnly || r);
    i.classList.add(c ? "visible" : "hidden"), i.innerHTML = `
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
                <div class="st-bg-mini-track" id="st_mini_title" title="${_(n)}">${_(n)}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="Mode: ${l}">
                    <i class="fa-solid ${this.getModeIcon(l)}"></i>
                </button>
            </div>
        `, document.body.appendChild(i), this.container = i, this.bindEvents(), this.unsubscribeTrack?.(), this.unsubscribePlayState?.(), this.unsubscribeTrack = this.audioEngine.addTrackListener((d) => {
      const g = this.container?.querySelector("#st_mini_title");
      if (g) {
        const h = d ? d.name : "No Audio";
        g.textContent = h, g.setAttribute("title", h);
      }
    }), this.unsubscribePlayState = this.audioEngine.addPlayStateListener((d) => {
      const g = this.container?.querySelector("#st_mini_play i");
      g && (g.className = `fa-solid ${d ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (d ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
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
      const s = this.container?.querySelector("#st_mini_mode");
      if (s) {
        s.setAttribute("title", `Mode: ${t}`);
        const i = s.querySelector("i");
        i && (i.className = `fa-solid ${this.getModeIcon(t)}`);
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
class Oe {
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
    let i = (await this.ext.getCacheManager().listMedia()).find((n) => n.id === e || n.name === e || n.url === e || n.cacheKey === e), a = !1;
    if (!i) {
      const n = t?.name || e.split("/").pop()?.split("?")[0] || "remote_background", r = t?.type || S(e);
      t?.saveToLibrary ? i = await this.ext.getCacheManager().saveMedia(new Blob([]), n, r, "url", e) : (a = !0, i = {
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
    t?.filters && this.setFilters(t.filters), typeof t?.interactive == "boolean" && this.setInteractive(t.interactive), await this.ext.applyMediaItem(i, !a), this.emit("media-change", i);
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
    let i = (await this.ext.getCacheManager().listMedia()).find((n) => n.id === e || n.name === e || n.url === e || n.cacheKey === e);
    if (!i) {
      const n = t?.title || e.split("/").pop()?.split("?")[0] || "BGM";
      i = {
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
    await this.ext.getAudioEngine().playMediaItem(i), this.emit("track-change", i);
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
    const t = this.ext.getSettings().filters, s = {
      blur: e.blur !== void 0 ? e.blur : t.blur,
      brightness: e.brightness !== void 0 ? e.brightness : t.brightness,
      opacity: e.opacity !== void 0 ? e.opacity : t.opacity,
      saturate: e.saturate !== void 0 ? e.saturate : t.saturate
    };
    this.ext.getSettings().filters = s, this.ext.getMediaMount().applyFilters(s), this.ext.saveSettings(), this.emit("filters-change", s);
  }
  applyPreset(e) {
    const t = this.ext.getSettings();
    let s = C[e]?.filters;
    !s && t.userPresets[e] && (s = t.userPresets[e]), s ? (t.activePresetId = e, t.filters = { ...s }, this.ext.getMediaMount().applyFilters(s), this.ext.saveSettings(), this.emit("preset-change", e, s)) : console.warn(`[ST-BgLoader PublicAPI] Preset "${e}" not found.`);
  }
  setInteractive(e) {
    this.ext.getSettings().interactiveBackground = e, this.ext.getMediaMount().setInteractive(e), this.ext.saveSettings(), this.emit("interactive-change", e);
  }
  /**
   * Atmospheric weather & particle FX
   */
  setWeather(e, t) {
    let s;
    if (typeof e == "string" ? s = {
      ...this.ext.getSettings().weather,
      type: e,
      ...t || {}
    } : s = { ...e }, !E.includes(s.type)) {
      console.warn(`[ST-BgLoader PublicAPI] Ignored invalid weather type "${String(s.type)}".`);
      return;
    }
    this.ext.getSettings().weather = s, this.ext.getAtmosphereFX().setWeather(s), this.ext.saveSettings(), this.emit("weather-change", s);
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
    const s = {
      enabled: e,
      intensity: t !== void 0 ? t : this.ext.getSettings().parallax.intensity
    };
    this.ext.getSettings().parallax = s, this.ext.getParallaxController().setOptions(s), this.ext.saveSettings(), this.emit("parallax-change", s);
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
    let s;
    typeof e == "string" ? s = {
      type: e,
      volume: t !== void 0 ? t : this.ext.getSettings().ambientSound.volume
    } : s = { ...e }, this.ext.getSettings().ambientSound = s, this.ext.getAmbientSoundGenerator().setSound(s), this.ext.saveSettings(), this.emit("ambient-sound-change", s);
  }
  getAmbientSound() {
    return { ...this.ext.getSettings().ambientSound };
  }
  /**
   * Frosted glass transparent chat bubbles UI
   */
  setFrostedChat(e, t) {
    const s = {
      enabled: e,
      blur: t?.blur !== void 0 ? t.blur : this.ext.getSettings().frostedChat.blur,
      opacity: t?.opacity !== void 0 ? t.opacity : this.ext.getSettings().frostedChat.opacity
    };
    this.ext.getSettings().frostedChat = s, this.ext.getFrostedGlassController().setOptions(s), this.ext.saveSettings(), this.emit("frosted-chat-change", s);
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
    const s = t.applyScene(e);
    return s && (this.ext.getSettings().activeSceneId = e, this.ext.saveSettings(), this.emit("scene-change", e)), s;
  }
  saveCurrentScene(e) {
    const t = this.ext.getSceneManager();
    if (!t) return null;
    const s = this.ext.getSettings(), i = {
      id: `scene_${Date.now()}`,
      name: e,
      mediaId: s.activeMediaId || void 0,
      presetId: s.activePresetId,
      filters: { ...s.filters },
      weather: { ...s.weather },
      visualizer: { ...s.visualizer },
      parallax: { ...s.parallax },
      ambientSound: { ...s.ambientSound },
      frostedChat: s.frostedChat.enabled
    };
    return t.saveScene(i), s.scenes = t.getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", t.getAllScenes()), i;
  }
  getScenes() {
    return this.ext.getSceneManager()?.getAllScenes() ?? {};
  }
  deleteScene(e) {
    const t = this.ext.getSceneManager();
    if (!t) return !1;
    const s = t.deleteScene(e);
    return s && (this.ext.getSettings().scenes = t.getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", t.getAllScenes())), s;
  }
  /**
   * Quick cycle through weather types
   */
  cycleWeather() {
    const e = this.ext.getSettings().weather.type, t = (E.indexOf(e) + 1) % E.length, s = E[t];
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
    const s = Array.isArray(e) ? e : [e], i = [], a = t?.concurrency || 3;
    let n = 0;
    const r = [...s], l = Array.from({ length: Math.min(a, r.length) }, async () => {
      for (; r.length > 0; ) {
        const c = r.shift();
        try {
          const { item: d, isNew: g } = await this.ext.getCacheManager().preloadUrl(c), h = {
            url: c,
            success: !0,
            cached: !g,
            size: d.size || 0
          };
          i.push(h);
        } catch (d) {
          i.push({
            url: c,
            success: !1,
            cached: !1,
            size: 0,
            error: d?.message || String(d)
          });
        }
        n++, t?.onProgress?.(n, s.length, c), this.emit("preload-progress", n, s.length, c);
      }
    });
    return await Promise.all(l), this.emit("preload-complete", i), i;
  }
  // --- Event Bus ---
  on(e, t) {
    return this.eventListeners.has(e) || this.eventListeners.set(e, /* @__PURE__ */ new Set()), this.eventListeners.get(e).add(t), () => this.off(e, t);
  }
  off(e, t) {
    this.eventListeners.get(e)?.delete(t);
  }
  emit(e, ...t) {
    this.eventListeners.get(e)?.forEach((s) => {
      try {
        s(...t);
      } catch (i) {
        console.error(`[ST-BgLoader PublicAPI] Error in listener for "${e}":`, i);
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
    for (let s = 0; s < e; s++)
      this.particles.push(this.createParticle(t, !0));
  }
  createParticle(e, t = !1) {
    const s = t ? Math.random() * this.height : -20, i = Math.random() * (this.width + 400) - 200, a = this.currentOptions.speed, n = this.currentOptions.wind;
    switch (e) {
      case "rain":
        return {
          x: i,
          y: s,
          vx: n * 3,
          vy: (12 + Math.random() * 8) * a,
          size: 10 + Math.random() * 15,
          alpha: (0.3 + Math.random() * 0.4) * this.currentOptions.opacity
        };
      case "snow":
        return {
          x: i,
          y: s,
          vx: n * 0.8 + (Math.random() - 0.5) * 0.5,
          vy: (1 + Math.random() * 2) * a,
          size: 2 + Math.random() * 3.5,
          alpha: (0.4 + Math.random() * 0.5) * this.currentOptions.opacity,
          oscillationOffset: Math.random() * Math.PI * 2
        };
      case "sakura":
        return {
          x: i,
          y: s,
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
    const s = this.particles.length;
    for (let i = 0; i < s; i++) {
      const a = this.particles[i];
      if (t === "rain")
        e.beginPath(), e.strokeStyle = `rgba(180, 215, 255, ${a.alpha})`, e.lineWidth = 1.2, e.moveTo(a.x, a.y), e.lineTo(a.x + a.vx * 1.2, a.y + a.size), e.stroke(), a.x += a.vx, a.y += a.vy, a.y > this.height - 20 && Math.random() < 0.15 && this.ripples.push({
          x: a.x,
          y: this.height - 5 + Math.random() * 5,
          vx: 0,
          vy: 0,
          size: 1,
          alpha: a.alpha * 0.8
        }), (a.y > this.height || a.x < -100 || a.x > this.width + 100) && (this.particles[i] = this.createParticle(t, !1));
      else if (t === "snow") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.02;
        const n = Math.sin(a.oscillationOffset) * 0.8;
        a.x += a.vx + n, a.y += a.vy, e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = `rgba(255, 255, 255, ${a.alpha})`, e.fill(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[i] = this.createParticle(t, !1));
      } else if (t === "sakura") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.03, a.rotation = (a.rotation || 0) + (a.vRotation || 0.02);
        const n = Math.sin(a.oscillationOffset) * 1.5;
        a.x += a.vx + n, a.y += a.vy, e.save(), e.translate(a.x, a.y), e.rotate(a.rotation), e.beginPath(), e.ellipse(0, 0, a.size, a.size * 0.55, 0, 0, Math.PI * 2), e.fillStyle = `rgba(255, 183, 197, ${a.alpha})`, e.fill(), e.restore(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[i] = this.createParticle(t, !1));
      } else if (t === "cyber_motes") {
        a.life = (a.life || 0) + 1, a.x += a.vx, a.y += a.vy;
        const n = a.life / (a.maxLife || 200), r = a.alpha * Math.sin(n * Math.PI);
        e.save(), e.shadowBlur = 8, e.shadowColor = a.color || "#00f0ff", e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = a.color || "#00f0ff", e.globalAlpha = Math.max(0, r), e.fill(), e.restore(), (a.y < -20 || a.life && a.life > (a.maxLife || 200)) && (this.particles[i] = this.createParticle(t, !1));
      }
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const a = this.ripples[i];
      if (a.size += 0.8, a.alpha -= 0.03, a.alpha <= 0 || a.size > 14) {
        this.ripples.splice(i, 1);
        continue;
      }
      e.beginPath(), e.ellipse(a.x, a.y, a.size * 1.5, a.size * 0.6, 0, 0, Math.PI * 2), e.strokeStyle = `rgba(180, 215, 255, ${a.alpha})`, e.lineWidth = 1, e.stroke();
    }
  }
  renderScanlines(e) {
    const s = 0.12 * this.currentOptions.opacity;
    e.fillStyle = `rgba(0, 0, 0, ${s})`;
    for (let a = 0; a < this.height; a += 4)
      e.fillRect(0, a, this.width, 1.5);
    this.scanlineOffset = (this.scanlineOffset + 2 * this.currentOptions.speed) % this.height;
    const i = e.createLinearGradient(0, this.scanlineOffset - 30, 0, this.scanlineOffset + 30);
    i.addColorStop(0, "rgba(255, 255, 255, 0)"), i.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * this.currentOptions.opacity})`), i.addColorStop(1, "rgba(255, 255, 255, 0)"), e.fillStyle = i, e.fillRect(0, this.scanlineOffset - 30, this.width, 60), Math.random() < 0.05 && (e.fillStyle = `rgba(255, 255, 255, ${0.02 * this.currentOptions.opacity})`, e.fillRect(0, 0, this.width, this.height));
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onWindowResize), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.particles = [], this.ripples = [];
  }
}
class $e {
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
      let s = 0;
      const i = Math.min(12, this.dataArray.length);
      for (let r = 0; r < i; r++)
        s += this.dataArray[r];
      const a = s / i / 255, n = Math.pow(a, 2) * 0.35 * t;
      if (this.pumpTargetEl) {
        const r = 1 + n * 0.015;
        this.pumpTargetEl.style.transform = `scale(${r})`, this.pumpTargetEl.style.transition = "transform 0.06s ease-out";
      }
    } else if (e === "spectrum") {
      if (!this.ctx) return;
      const s = this.ctx;
      s.clearRect(0, 0, this.width, this.height);
      const i = this.dataArray.length, a = Math.max(3, this.width / i * 1.6);
      let n = 0;
      const r = this.currentOptions.color || "#4fa3d1";
      for (let l = 0; l < i; l++) {
        const c = this.dataArray[l] / 255 * t, d = Math.min(this.height, c * (this.height - 10));
        if (d > 1) {
          const g = s.createLinearGradient(0, this.height, 0, this.height - d);
          g.addColorStop(0, `${r}22`), g.addColorStop(0.7, `${r}aa`), g.addColorStop(1, `${r}ff`), s.fillStyle = g;
          const h = this.height - d;
          s.beginPath();
          const p = Math.min(a / 2, 3);
          s.roundRect(n, h, a - 1.5, d, [p, p, 0, 0]), s.fill();
        }
        if (n += a, n > this.width) break;
      }
    }
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onResize), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.pumpTargetEl && (this.pumpTargetEl.style.transform = "", this.pumpTargetEl.style.transition = "", this.pumpTargetEl = null);
  }
}
class qe {
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
    const t = window.innerWidth / 2, s = window.innerHeight / 2, i = 30 * this.options.intensity, a = (e.clientX - t) / t, n = (e.clientY - s) / s;
    this.targetX = a * i, this.targetY = n * i, this.isRunning || this.startLoop();
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
        const i = 1 + 0.05 * this.options.intensity;
        this.targetEl.style.transform = `translate3d(${this.currentX.toFixed(2)}px, ${this.currentY.toFixed(2)}px, 0) scale(${i.toFixed(3)})`;
      }
      Math.abs(this.targetX - this.currentX) + Math.abs(this.targetY - this.currentY) > 0.01 ? this.animFrameId = requestAnimationFrame(e) : (this.isRunning = !1, this.animFrameId = null);
    };
    this.animFrameId = requestAnimationFrame(e);
  }
  destroy() {
    this.disable(), this.targetEl = null;
  }
}
class Ne {
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
      const s = this.getRegex(t.pattern);
      if (s && s.test(e))
        return this.fireRule(t), !0;
    }
    return !1;
  }
  fireRule(e) {
    const t = Date.now();
    this.lastTriggeredId === e.id && t - this.lastTriggerTime < 500 || (this.lastTriggeredId = e.id, this.lastTriggerTime = t, console.log(`[ST-BgLoader TriggerManager] Fired rule: "${e.name}" (${e.type})`), this.onTriggerCallback?.(e.action, e));
  }
  bindSillyTavernEvents(e, t) {
    if (this.unbindEvents(), !e || typeof e.on != "function") return;
    const s = (r) => {
      typeof r == "string" ? this.evaluateMessage(r) : r && typeof r.mes == "string" && this.evaluateMessage(r.mes);
    }, i = (r) => {
      const l = typeof r == "string" ? r : r?.chatId || r?.id;
      l && this.evaluateChat(String(l));
    }, a = (r) => {
      const l = typeof r == "string" ? r : r?.name || r?.avatar;
      l && this.evaluateCharacter(String(l));
    }, n = (r, l) => {
      e.on(r, l), this.eventSourceUnlisteners.push(() => {
        typeof e.removeListener == "function" ? e.removeListener(r, l) : typeof e.off == "function" && e.off(r, l);
      });
    };
    t ? (t.MESSAGE_RECEIVED && n(t.MESSAGE_RECEIVED, s), t.CHARACTER_MESSAGE_RENDERED && n(t.CHARACTER_MESSAGE_RENDERED, s), t.CHAT_CHANGED && n(t.CHAT_CHANGED, i), t.CHARACTER_PAGE_LOADED && n(t.CHARACTER_PAGE_LOADED, a)) : (n("message_received", s), n("character_message_rendered", s), n("chat_changed", i));
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
class Ue {
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
    const t = 2 * e.sampleRate, s = e.createBuffer(1, t, e.sampleRate), i = s.getChannelData(0);
    let a = 0, n = 0, r = 0, l = 0, c = 0, d = 0, g = 0;
    for (let f = 0; f < t; f++) {
      const m = Math.random() * 2 - 1;
      a = 0.99886 * a + m * 0.0555179, n = 0.99332 * n + m * 0.0750759, r = 0.969 * r + m * 0.153852, l = 0.8665 * l + m * 0.3104856, c = 0.55 * c + m * 0.5329522, d = -0.7616 * d - m * 0.016898, i[f] = (a + n + r + l + c + d + g + m * 0.5362) * 0.11, g = m * 0.115926;
    }
    const h = e.createBufferSource();
    h.buffer = s, h.loop = !0;
    const p = e.createBiquadFilter();
    p.type = "lowpass", p.frequency.value = 1200, h.connect(p), p.connect(this.gainNode), h.start(0), this.activeSource = h;
  }
  /**
   * Synthesize Fire: Low rumble pink noise + stochastic crackle bursts
   */
  startFire(e) {
    this.startRain(e), this.crackleTimer = window.setInterval(() => {
      if (!(!this.isRunning || !this.ctx || !this.gainNode) && Math.random() < 0.35) {
        const t = this.ctx.createOscillator(), s = this.ctx.createGain();
        t.type = "triangle", t.frequency.setValueAtTime(300 + Math.random() * 800, this.ctx.currentTime), s.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime), s.gain.exponentialRampToValueAtTime(1e-3, this.ctx.currentTime + 0.03 + Math.random() * 0.04), t.connect(s), s.connect(this.gainNode), t.start(), t.stop(this.ctx.currentTime + 0.08);
      }
    }, 80);
  }
  /**
   * Synthesize Wind: Lowpass filtered noise modulated by a gentle LFO
   */
  startWind(e) {
    const t = 2 * e.sampleRate, s = e.createBuffer(1, t, e.sampleRate), i = s.getChannelData(0);
    for (let c = 0; c < t; c++)
      i[c] = Math.random() * 2 - 1;
    const a = e.createBufferSource();
    a.buffer = s, a.loop = !0;
    const n = e.createBiquadFilter();
    n.type = "bandpass", n.frequency.value = 400, n.Q.value = 3;
    const r = e.createOscillator();
    r.frequency.value = 0.2;
    const l = e.createGain();
    l.gain.value = 250, r.connect(l), l.connect(n.frequency), a.connect(n), n.connect(this.gainNode), r.start(0), a.start(0), this.lfoOsc = r, this.activeSource = a;
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
class Ve {
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
      ...B,
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
    return B[e] ? (console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${e}"`), !1) : this.userScenes[e] ? (delete this.userScenes[e], !0) : !1;
  }
  applyScene(e) {
    const t = this.getScene(e);
    return t ? (console.log(`[ST-BgLoader SceneManager] Applying scene: "${t.name}"`), this.onApplySceneCallback?.(t), !0) : (console.warn(`[ST-BgLoader SceneManager] Scene "${e}" not found.`), !1);
  }
}
const se = "settings:rev", ie = "settings:data", Ge = 2e3, He = 1e4;
class We {
  constructor(e, t, s) {
    this.client = e, this.onRemoteSettings = t, this.hasServerDocument = s;
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
    this.pollTimer = window.setInterval(() => void this.pollOnce(), He);
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
      const t = JSON.stringify(e), s = await je(t);
      if (s === this.lastPushedFingerprint) return;
      const i = this.localRevision + 1, a = {
        revision: i,
        fingerprint: s,
        updatedAt: Date.now(),
        settings: e
      };
      await this.client.storage.kv.set(ie, a), await this.client.storage.kv.set(se, i), this.localRevision = i, this.lastPushedFingerprint = s;
    } catch (t) {
      console.warn("[ST-BgLoader] Failed to push settings to cloud mirror:", t);
    }
  }
  async pollOnce() {
    if (!this.applyingRemote)
      try {
        const e = await this.client.storage.kv.get(se);
        if ((typeof e == "number" ? e : 0) <= this.localRevision) return;
        const s = await this.readPayload();
        if (!s || s.revision <= this.localRevision) return;
        if (s.fingerprint === this.lastPushedFingerprint) {
          this.localRevision = s.revision;
          return;
        }
        this.applyingRemote = !0;
        try {
          this.onRemoteSettings(s.settings);
        } finally {
          this.applyingRemote = !1;
        }
        this.localRevision = s.revision, this.lastPushedFingerprint = s.fingerprint, console.log("[ST-BgLoader] Applied cloud settings change, revision", s.revision);
      } catch (e) {
        console.warn("[ST-BgLoader] Settings sync poll failed:", e);
      }
  }
  async readPayload() {
    const e = await this.client.storage.kv.get(ie);
    if (!e || typeof e != "object") return null;
    const t = e;
    return typeof t.revision != "number" || !t.settings || typeof t.fingerprint != "string" ? null : t;
  }
}
async function je(o) {
  try {
    if (crypto?.subtle) {
      const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(o));
      return Array.from(new Uint8Array(t)).map((s) => s.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  let e = 5381;
  for (let t = 0; t < o.length; t++)
    e = (e << 5) + e + o.charCodeAt(t) | 0;
  return "djb2:" + (e >>> 0).toString(16);
}
const ae = "st-bg-loader-settings.json", Ke = 1, Xe = 800;
class Qe {
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
    }, Xe);
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
      version: Ke,
      revision: e.revision,
      updatedTimestamp: Date.now(),
      settings: e.settings
    };
  }
}
const ne = 3e4, Ye = 2e3, Je = 5 * 60 * 1e3, Ze = 2 * 60 * 1e3, et = 15e3;
class re extends Error {
  constructor() {
    super("Agent tool registration timed out"), this.name = "AgentRegisterTimeoutError";
  }
}
const tt = [
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
    description: `Set the atmospheric weather FX (${E.join(", ")}).`,
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: E },
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
  constructor(e, t, s = () => {
  }) {
    this.client = e, this.host = t, this.reportState = s;
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
        this.registrationOk = !1, ce(e) ? (this.permissionBlockedUntil = Date.now() + Je, this.publishState("blocked", e instanceof Error ? e.message : String(e)), this.warnOnce("Agent tool registration blocked by permission policy (retrying every 5 min — adjust in Authority Security Center if intended):", e)) : e instanceof re ? (this.registerWaitUntil = Date.now() + Ze, this.publishState("pending", "等待 agent.browser 授权（若页面出现 Authority 权限弹窗请处理；稍后自动重试）"), this.warnOnce("Agent tool registration is waiting for permission (check the Authority prompt / Security Center):", e)) : console.warn("[ST-BgLoader] Agent tool registration failed (will retry):", e);
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
    const s = new Promise((i, a) => {
      t = window.setTimeout(() => a(new re()), et);
    });
    try {
      return await Promise.race([
        e.registerTools({
          browserInstanceId: k,
          leaseDurationMs: ne * 2,
          tools: tt.map((i) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            inputSchema: i.inputSchema,
            riskLevel: "low",
            approvalPolicy: "never",
            mutatesWorkspace: !1
          }))
        }),
        s
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
    }, Ye));
  }
  async claimOnce() {
    const e = this.agentApi();
    if (!(!e || !this.running) && this.registrationOk)
      try {
        this.pendingSubmit && (await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, "completed", void 0), this.pendingSubmit = null);
        const t = `stbg-claim-${Date.now()}-${this.claimSeq++}`, i = (await e.claim({ browserInstanceId: k, claimId: t })).invocation;
        if (!i) return;
        let a, n;
        try {
          a = await this.execute(i.toolId, i.arguments);
        } catch (r) {
          n = r instanceof Error ? r.message : String(r);
        }
        if (n) {
          await e.submitResult({
            runId: i.runId,
            callId: i.callId,
            claimId: t,
            browserInstanceId: k,
            status: "failed",
            error: n
          });
          return;
        }
        try {
          await e.submitResult({
            runId: i.runId,
            callId: i.callId,
            claimId: t,
            browserInstanceId: k,
            status: "completed",
            result: a
          });
        } catch {
          this.pendingSubmit = { claimId: t, invocation: { runId: i.runId, callId: i.callId } };
        }
      } catch {
      }
  }
  async reportResult(e, t, s, i) {
    const a = this.agentApi();
    a && await a.submitResult({
      runId: t.runId,
      callId: t.callId,
      claimId: e,
      browserInstanceId: k,
      status: s,
      error: i
    });
  }
  async execute(e, t) {
    const s = t ?? {};
    switch (e) {
      case "stbg_set_background":
        return await this.host.setBackground(String(s.target ?? "")), { ok: !0 };
      case "stbg_apply_scene":
        return { ok: this.host.applyScene(String(s.sceneId ?? "")) };
      case "stbg_set_weather":
        return this.host.setWeather(String(s.type ?? "off"), s.density ? String(s.density) : void 0), { ok: !0 };
      case "stbg_play_bgm":
        return await this.host.playBGM(String(s.url ?? "")), { ok: !0 };
      case "stbg_apply_preset":
        return this.host.applyPreset(String(s.presetId ?? "default")), { ok: !0 };
      case "stbg_set_filters":
        return this.host.setFilters({
          blur: typeof s.blur == "number" ? s.blur : void 0,
          brightness: typeof s.brightness == "number" ? s.brightness : void 0,
          opacity: typeof s.opacity == "number" ? s.opacity : void 0,
          saturate: typeof s.saturate == "number" ? s.saturate : void 0
        }), { ok: !0 };
      default:
        throw new Error(`Unknown tool: ${e}`);
    }
  }
}
const U = "st_bgloader_settings", oe = "st_bgloader_settings_rev";
class it {
  isInitialized = !1;
  settings = { ...R };
  settingsRevision = 0;
  serverSettings = new Qe();
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
  authorityBridge = new P();
  settingsSync = null;
  agentBridge = null;
  publicApi;
  constructor() {
    this.cacheManager = new _e(), this.audioEngine = new Ee(), this.mediaMount = new Ce(this.audioEngine, (e) => this.mountOverlays(e)), this.atmosphereFX = new De(), this.audioVisualizer = new $e(), this.parallaxController = new qe(), this.triggerManager = new Ne(), this.ambientSoundGenerator = new Ue(), this.frostedGlassController = new ze(), this.publicApi = new Oe(this);
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
    this.settings.enabled = e, this.saveSettings(), e ? (this.topbarDrawer?.mount(), this.nativeController?.start(this.settings.nativeTakeover), this.mediaMount.setVisible(this.settings.backgroundVisible)) : (this.topbarDrawer?.unmount(), this.nativeController?.stop(), this.mediaMount.clear(), this.nativeController?.releaseNativeBackground());
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
    console.log("[ST-BgLoader] Initializing Rich Media Background Plugin..."), await this.reconcileSettings(), await this.cacheManager.init(this.authorityBridge), this.mediaMount.init(), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setVisible(this.settings.backgroundVisible), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.mountOverlaysIfHostReady(), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.audioEngine.setUrlResolver((s) => this.cacheManager.getMediaBlobUrl(s)), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.audioEngine.onAnalyserReady = (s) => {
      this.audioVisualizer.setAnalyser(s);
    };
    const t = (await this.cacheManager.listMedia()).filter((s) => s.type === "audio");
    if (this.audioEngine.setPlaylist(t), this.miniPlayer = new Fe(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly), this.audioEngine.addTrackListener((s) => {
      this.publicApi.emit("track-change", s);
    }), this.audioEngine.addPlayStateListener((s) => {
      this.publicApi.emit("play-state-change", s);
    }), this.triggerManager.setRules(this.settings.triggerRules || []), this.triggerManager.setTriggerCallback(async (s, i) => {
      console.log(`[ST-BgLoader] Executing trigger rule: "${i.name}"`), s.mediaIdOrUrl && await this.publicApi.setBackground(s.mediaIdOrUrl), s.bgmUrl && await this.publicApi.playBGM(s.bgmUrl), s.weather && this.publicApi.setWeather(s.weather), s.preset && this.publicApi.applyPreset(s.preset), s.filters && this.publicApi.setFilters(s.filters);
    }), this.sceneManager = new Ve(this.settings.scenes || {}, async (s) => {
      if (s.mediaId) {
        const i = await this.cacheManager.getMedia(s.mediaId);
        i && await this.applyMedia(i);
      } else s.mediaUrl && await this.publicApi.setBackground(s.mediaUrl);
      s.bgmUrl && await this.publicApi.playBGM(s.bgmUrl), s.presetId && this.publicApi.applyPreset(s.presetId), s.filters && this.publicApi.setFilters(s.filters), s.weather && this.publicApi.setWeather(s.weather), s.visualizer && this.publicApi.setVisualizer(s.visualizer), s.parallax && this.publicApi.setParallax(s.parallax.enabled, s.parallax.intensity), s.ambientSound && this.publicApi.setAmbientSound(s.ambientSound), typeof s.frostedChat == "boolean" && this.publicApi.setFrostedChat(s.frostedChat);
    }), this.topbarDrawer = new Le(this.settings, this.cacheManager, {
      onSettingsChanged: (s) => {
        this.settings = s, this.saveSettings(), this.applySettingsToSubsystems(), this.enforceQuotaIfChanged();
      },
      getBackgroundVisible: () => this.settings.backgroundVisible,
      onBackgroundVisibilityChanged: (s) => {
        this.publicApi.setBackgroundVisible(s);
      },
      onClearActiveBackground: () => {
        this.clearActiveBackground();
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
      onTransitionChanged: (s, i) => {
        this.mediaMount.setTransition(s, i), this.publicApi.emit("transition-change", s, i);
      },
      onMuffleChanged: (s) => {
        this.audioEngine.setMuffled(s), this.publicApi.emit("muffle-change", s);
      },
      onAmbientSoundChanged: (s) => {
        this.ambientSoundGenerator.setSound(s);
      },
      onFrostedChatChanged: (s) => {
        this.frostedGlassController.setOptions(s);
      },
      onSceneApplied: (s) => {
        this.publicApi.applyScene(s);
      },
      onMediaSelected: async (s) => {
        await this.applyMedia(s);
      },
      onMediaDeleted: async (s) => {
        this.settings.activeMediaId === s && (this.settings.activeMediaId = null, this.mediaMount.clear(), this.audioEngine.stopTrack(), this.saveSettings());
        const i = await this.cacheManager.listMedia();
        this.audioEngine.setPlaylist(i.filter((a) => a.type === "audio"));
      },
      onMediaUploaded: async (s) => {
        if (this.settings.lruAutoClean) {
          const i = this.settings.cacheQuotaMB * 1024 * 1024;
          await this.cacheManager.cleanLRU(i);
        }
        if (s.type === "audio") {
          const i = await this.cacheManager.listMedia();
          this.audioEngine.setPlaylist(i.filter((a) => a.type === "audio"));
        }
        await this.applyMedia(s);
      }
    }, this.authorityBridge), this.settings.enabled !== !1 && this.topbarDrawer.mount(), this.settingsDrawer = new Ie(this.settings, {
      onMasterToggle: (s) => {
        this.setMasterEnabled(s);
      },
      onSettingsChanged: (s) => {
        this.settings = s, this.saveSettings();
      }
    }), this.settingsDrawer.render(), this.nativeController = new Pe(async (s, i) => {
      const a = w(s), n = {
        id: "native_" + s,
        name: s,
        type: i,
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
      this.audioEngine.handleVisibilityChange(document.hidden, this.settings.pauseOnBlur);
    }), this.authorityBridge.onCapabilitiesChanged(() => this.topbarDrawer?.updateCloudPanel()), this.serverSettings.onRemoteNewer = () => void this.reconcileRemoteConflict(), await this.startSettingsSync(), this.syncAgentTools(), this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const s = await this.cacheManager.getMedia(this.settings.activeMediaId);
      s ? await this.applyMedia(s) : (console.warn(`[ST-BgLoader] Active background "${this.settings.activeMediaId}" no longer exists; clearing the reference.`), this.settings.activeMediaId = null, this.saveSettings());
    }
    this.isInitialized = !0, console.log("[ST-BgLoader] All Modular Subsystems fully initialized.");
  }
  async applyMedia(e, t = !0) {
    t && (this.settings.activeMediaId = e.id, this.saveSettings());
    const s = await this.cacheManager.getMediaBlobUrl(e);
    await this.mediaMount.mountMedia(e, s), this.nativeController?.refreshSelection(e.name), this.nativeController?.clearNativeBackgroundImage(), this.settingsDrawer?.updateActiveMedia(e.name), this.topbarDrawer && (this.topbarDrawer.refreshMediaGrid(), this.topbarDrawer.updateCacheStats());
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
    this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setVisible(this.settings.backgroundVisible), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.triggerManager.setRules(this.settings.triggerRules || []), this.sceneManager?.setUserScenes(this.settings.scenes || {}), this.nativeController?.setLevel(this.settings.nativeTakeover), this.syncAgentTools();
  }
  /**
   * Shows/hides the background layer. MediaMount owns the applied state (finding A1) while
   * `settings.backgroundVisible` is the durable intent — the setting replaced the Alt+B
   * shortcut, so unlike its first incarnation this one persists across reloads. The panel
   * checkbox and PublicAPI both come through here, so there is a single write path.
   */
  setBackgroundVisible(e) {
    this.settings.backgroundVisible = e, this.mediaMount.setVisible(e), this.saveSettings(), this.topbarDrawer?.syncBackgroundVisible(e);
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
  /** Opt-in Agent Runtime ambient tools (AI director mode); requires the cloud backend. */
  syncAgentTools() {
    const e = this.authorityBridge.getClient(), t = this.settings.agentToolsEnabled && !!e;
    t && !this.agentBridge && e ? (this.agentBridge = new st(e, this.buildAgentHost(), (s, i) => {
      this.authorityBridge.reportAgentToolsState(s, i);
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
    e && (this.settingsSync = new We(e, (t) => {
      this.settings = t;
      try {
        localStorage.setItem(U, JSON.stringify(this.settings));
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
        await this.reconcileSettings(), this.applySettingsToSubsystems(), this.settingsDrawer?.applyRemoteSettings(this.settings), this.publicApi.emit("settings-sync", this.settings);
      } finally {
        this.reconcilingRemote = !1;
      }
    }
  }
  hookSillyTavernEvents() {
    const e = window;
    e.eventSource && (this.triggerManager.bindSillyTavernEvents(e.eventSource, e.event_types), e.event_types && e.event_types.CHAT_CHANGED && e.eventSource.on(e.event_types.CHAT_CHANGED, async () => {
      if (this.settings.activeMediaId) {
        const t = await this.cacheManager.getMedia(this.settings.activeMediaId);
        t && await this.applyMedia(t);
      }
    }));
  }
  loadSettings() {
    try {
      const e = localStorage.getItem(U);
      e && (this.settings = K(JSON.parse(e))), this.settingsRevision = parseInt(localStorage.getItem(oe) || "0", 10) || 0;
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...R }, this.settingsRevision = 0;
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
      e && e.revision >= this.settingsRevision ? (this.settings = K(e.settings), this.settingsRevision = e.revision, this.persistLocalSettings()) : this.settingsRevision > 0 && this.serverSettings.scheduleSave(this.settings, this.settingsRevision);
    } catch (e) {
      console.warn("[ST-BgLoader] Server settings unavailable, using local settings:", e);
    }
  }
  persistLocalSettings() {
    try {
      localStorage.setItem(U, JSON.stringify(this.settings)), localStorage.setItem(oe, String(this.settingsRevision));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
  saveSettings() {
    this.settingsRevision += 1, this.persistLocalSettings(), this.serverSettings.scheduleSave(this.settings, this.settingsRevision), this.settingsSync?.schedulePush(this.settings);
  }
}
const G = new it(), le = () => G.init().catch((o) => console.error("[ST-BgLoader] Initialization failed:", o));
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", le) : le();
window.STBgLoader = G;
window.stBgLoader = G.getAPI();
export {
  it as STBgLoaderExtension
};
