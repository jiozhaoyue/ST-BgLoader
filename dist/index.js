const G = {
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
}, F = ["off", "rain", "snow", "sakura", "cyber_motes", "scanlines"], dt = {
  off: "关闭",
  rain: "雨水",
  snow: "飘雪",
  sakura: "落樱",
  cyber_motes: "微粒",
  scanlines: "扫描线"
};
function ue(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function j(n) {
  const e = { ...ae };
  if (!ue(n)) return e;
  const t = n, i = ae, s = e;
  for (const a of Object.keys(i)) {
    const r = t[a];
    if (r === void 0) continue;
    const o = i[a];
    s[a] = ue(o) && ue(r) ? { ...o, ...r } : r;
  }
  return e;
}
const se = {
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
}, ae = {
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
  // mergeSettings 只拷贝此表出现过的键：activeSceneId 一度缺席，导致会话内
  // applyScene 记录的当前场景在重启/远端收敛/importSettings 时被静默丢弃。
  activeSceneId: void 0,
  userPresets: {},
  interactiveBackground: !1,
  backgroundVisible: !0,
  showMiniPlayer: !0,
  capsuleOnPlayOnly: !0,
  playbackMode: "loop",
  bgmAutoAdvance: { enabled: !1, intervalSec: 300, fadeMs: 800 },
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
function P(n, e = "") {
  const t = n.split(".").pop()?.toLowerCase().split("?")[0] || "";
  return ["mp4", "webm", "mov", "m4v", "ogv"].includes(t) || e.startsWith("video/") ? "video" : ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(t) || e.startsWith("audio/") ? "audio" : t === "html" || t === "htm" ? "html" : t === "svg" ? "svg" : "image";
}
const ht = [
  "contextApi",
  "requestHeaders",
  "genericPopup",
  "nativeBackgroundDrawer",
  "extensionsSettings"
], ut = {
  contextApi: () => typeof window?.SillyTavern?.getContext == "function",
  requestHeaders: () => typeof window?.SillyTavern?.getContext?.()?.getRequestHeaders == "function",
  genericPopup: (n) => typeof n.getContext()?.callGenericPopup == "function",
  nativeBackgroundDrawer: () => !!document.querySelector("#Backgrounds"),
  extensionsSettings: () => !!document.querySelector("#extensions_settings")
};
class w {
  static instance = null;
  hostType;
  capabilities;
  constructor() {
    this.hostType = this.detectHostType(), this.capabilities = this.detectCapabilities();
  }
  static getInstance() {
    return w.instance || (w.instance = new w()), w.instance;
  }
  detectHostType() {
    return typeof window > "u" ? "generic" : window.__TAURI__ || window.__TAURI_METADATA__ || window.__TAURI_INVOKE__ || navigator.userAgent.toLowerCase().includes("tauri") ? "tauritavern" : window.PureTavern || document.title.toLowerCase().includes("puretavern") || document.querySelector('meta[name="puretavern"]') ? "puretavern" : window.Luker || document.title.toLowerCase().includes("luker") || document.querySelector('meta[name="luker"]') ? "luker" : window.SillyTavern ? "sillytavern" : "generic";
  }
  /**
   * 逐项运行能力探测并缓存结果（构造期一次性）。
   * 仅做特性检测，不按 hostType 推导，业务层据此查询即可（D-01）。
   */
  detectCapabilities() {
    const e = {};
    for (const t of ht) {
      let i = !1;
      try {
        i = ut[t](this) === !0;
      } catch {
        i = !1;
      }
      e[t] = i;
    }
    return e;
  }
  /** 返回全部宿主能力探测结果（只读快照）。 */
  getCapabilities() {
    return { ...this.capabilities };
  }
  /** 查询单项宿主能力是否可用；未登记的能力返回 false。 */
  hasCapability(e) {
    return this.capabilities[e] === !0;
  }
  /** 宿主是否具备官方弹窗能力（业务层据此选择弹窗适配路径）。 */
  canUseGenericPopup() {
    return this.hasCapability("genericPopup");
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
  // ------------------------------------------------------------------
  // 官方 Popup 适配器（D-06）：统一弹窗入口，业务层禁止直接调 alert/confirm/prompt。
  // 优先宿主 context 的 callGenericPopup（官方扩展 API，POPUP_TYPE：
  // TEXT=0 / CONFIRM=1 / INPUT=2，CONFIRM 返回 AFFIRMATIVE=1 / NEGATIVE=0），
  // 不可用或异常时逐级降级（D-03 链），永不抛错。降级终点是原生弹窗——
  // 本文件在 src/bridge/，不属于 src/ui 弹窗门禁扫描面。
  // ------------------------------------------------------------------
  async alertDialog(e) {
    const t = this.getContext()?.callGenericPopup;
    if (typeof t == "function")
      try {
        await t(e, 0);
        return;
      } catch {
      }
    window.alert(e);
  }
  async confirmDialog(e) {
    const t = this.getContext()?.callGenericPopup;
    if (typeof t == "function")
      try {
        const i = await t(e, 1);
        return i === !0 || i === 1;
      } catch {
      }
    return window.confirm(e);
  }
  async promptDialog(e) {
    const t = this.getContext()?.callGenericPopup;
    if (typeof t == "function")
      try {
        const i = await t(e, 2);
        return typeof i == "string" ? i : null;
      } catch {
      }
    return window.prompt(e);
  }
}
const Le = "st-bg-loader-manifest.json", X = 1;
function R(n) {
  return `backgrounds/${encodeURIComponent(n)}`;
}
const gt = /* @__PURE__ */ new Set(["favicon.ico"]);
function ge(n) {
  return !!n && gt.has(n.toLowerCase());
}
function U() {
  return w.getInstance().getRequestHeaders({ omitContentType: !0 });
}
async function pt(n) {
  try {
    const e = await B(`${R(n)}?t=${Date.now()}`, { cache: "no-store" });
    return e.ok ? JSON.parse(await e.text()) : null;
  } catch (e) {
    return console.warn(`[ST-BgLoader] Server document "${n}" is missing or unreadable:`, e), null;
  }
}
async function ft(n, e) {
  const t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), i = new FormData();
  i.append("avatar", new File([t], n, { type: "application/json" }));
  const s = await B("/api/backgrounds/upload", { method: "POST", headers: U(), body: i });
  if (!s.ok)
    throw new Error(`Server upload failed for "${n}": HTTP ${s.status}`);
}
const mt = 6e4, yt = 3e4;
function B(n, e) {
  const t = e?.signal ?? AbortSignal.timeout(yt);
  return fetch(n, { ...e, signal: t });
}
class we {
  manifest = { version: X, items: [] };
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
      const e = await B(`${R(Le)}?t=${Date.now()}`, { cache: "no-store" });
      if (e.ok) {
        const t = JSON.parse(await e.text());
        t && Array.isArray(t.items) && (this.manifest = { version: X, items: t.items });
      }
    } catch (e) {
      console.warn("[ST-BgLoader] No server media manifest yet, starting a fresh one:", e), this.manifest = { version: X, items: [] };
    }
    console.log(`[ST-BgLoader] Server media library ready: ${this.manifest.items.length} cataloged entries.`);
  }
  async listCatalog() {
    const e = this.catalogCache;
    if (e && Date.now() - e.at < we.CATALOG_TTL_MS)
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
      const t = await B("/api/backgrounds/all", {
        method: "POST",
        headers: { ...U(), "Content-Type": "application/json" },
        body: "{}"
      });
      if (t.ok) {
        const i = await t.json();
        for (const s of i.images ?? []) {
          if (ge(s.filename)) continue;
          const a = P(s.filename);
          e.set(s.filename, {
            id: "native_" + s.filename,
            name: s.filename,
            type: a,
            source: "server",
            url: R(s.filename),
            cacheKey: R(s.filename),
            size: 0,
            mimeType: be(s.filename, a),
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
        if (ge(t.filename)) continue;
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
    return t ? ge(t.filename) ? null : this.manifestToItem(t) : (await this.listCatalog()).find((s) => s.id === e) ?? null;
  }
  async putMedia(e) {
    const t = "bg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9), i = e.blob.type || be(e.name, e.type);
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
      return this.manifest.items.push(r), await this.saveManifest(), this.invalidateCatalog(), {
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
    return this.manifest.items = this.manifest.items.filter((r) => r.filename !== s), this.manifest.items.push(a), await this.saveManifest(), this.invalidateCatalog(), this.manifestToItem(a);
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
    const s = await B("/api/backgrounds/delete", {
      method: "POST",
      headers: { ...U(), "Content-Type": "application/json" },
      body: JSON.stringify({ bg: i })
    });
    if (!s.ok)
      throw new Error(`Server delete failed for "${i}": HTTP ${s.status}`);
    this.manifest.items = this.manifest.items.filter((a) => a.id !== e && a.filename !== i), await this.saveManifest(), this.invalidateCatalog();
  }
  async readMedia(e) {
    if (!e.url) return null;
    const t = await B(e.url, { cache: "no-store" });
    return t.ok ? t.blob() : null;
  }
  async findByUrl(e) {
    const t = this.manifest.items.find((s) => s.remoteUrl === e || R(s.filename ?? "") === e);
    return t ? this.manifestToItem(t) : (await this.listCatalog()).find((s) => s.url === e || s.cacheKey === e) ?? null;
  }
  /** Fetches the raw bytes of a URL (direct first; used before storing server-side). */
  async download(e) {
    let t = null;
    try {
      t = new URL(e, window.location.href);
    } catch {
    }
    const i = !!t && t.origin !== window.location.origin, s = await B(e, i ? { signal: AbortSignal.timeout(mt) } : void 0);
    if (!s.ok)
      throw new Error(`Failed to fetch media from ${e}: ${s.status} ${s.statusText}`);
    return s.blob();
  }
  async uploadFile(e, t, i) {
    let s = bt(e || "media");
    if (await this.filenameExists(s)) {
      const o = s.lastIndexOf("."), c = o > 0 ? s.slice(0, o) : s, h = o > 0 ? s.slice(o) : "";
      s = `${c}_${Date.now()}${h}`;
    }
    const a = new FormData();
    a.append("avatar", new File([t], s, { type: i }));
    const r = await B("/api/backgrounds/upload", { method: "POST", headers: U(), body: a });
    if (!r.ok)
      throw new Error(`Server upload failed: HTTP ${r.status}`);
    return (await r.text()).trim() || s;
  }
  async filenameExists(e) {
    if (this.manifest.items.some((t) => t.filename === e)) return !0;
    try {
      const t = await B("/api/backgrounds/all", {
        method: "POST",
        headers: { ...U(), "Content-Type": "application/json" },
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
    this.manifest.version = X;
    const e = new Blob([JSON.stringify(this.manifest, null, 2)], { type: "application/json" });
    try {
      const t = new FormData();
      t.append("avatar", new File([e], Le, { type: "application/json" }));
      const i = await B("/api/backgrounds/upload", { method: "POST", headers: U(), body: t });
      if (!i.ok)
        throw new Error(`HTTP ${i.status}`);
    } catch (t) {
      throw console.error("[ST-BgLoader] Failed to save server media manifest:", t), t;
    }
  }
  manifestToItem(e) {
    const t = e.source === "url" && e.remoteUrl ? e.remoteUrl : e.filename ? R(e.filename) : e.remoteUrl ?? "";
    return {
      id: e.id,
      name: e.filename || e.remoteUrl || e.id,
      type: e.type,
      source: e.source === "url" ? "url" : "server",
      url: t,
      cacheKey: e.filename ? R(e.filename) : e.id,
      size: e.size,
      mimeType: e.mimeType,
      addedTimestamp: e.addedTimestamp,
      lastUsedTimestamp: e.lastUsedTimestamp,
      hasAudio: e.hasAudio
    };
  }
}
function be(n, e) {
  switch (n.split(".").pop()?.toLowerCase()) {
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
function bt(n) {
  return (n || "media").replace(/[^\p{L}\p{N}._ -]/gu, "_");
}
const V = "st-bgloader-main";
function et(n) {
  if (n && typeof n == "object" && n.name === "AuthorityPermissionError") return !0;
  const e = n instanceof Error ? n.message : String(n);
  return /permission|denied|forbidden|封锁/i.test(e);
}
const vt = "extension:third-party/ST-BgLoader", Pe = "st_bgloader_cloud_notice_v1";
class ne {
  static EXTENSION_ID = "third-party/ST-BgLoader";
  static CHANNEL = vt;
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
        extensionId: ne.EXTENSION_ID,
        displayName: "ST-BgLoader",
        version: "1.0.0",
        installType: "local",
        uiLabel: "ST-BgLoader",
        declaredPermissions: {
          storage: { kv: !0, blob: !0 },
          sql: { private: !0 },
          http: { allow: [...this.httpAllow] },
          jobs: { background: ["delay", "sql.backup"] },
          events: { channels: [ne.CHANNEL] },
          // Undeclared resources hit the declaration gate (hard 'blocked') even when an
          // admin would grant them — declare exactly the one browser instance we register.
          agent: { browser: [V] }
        }
      }), this.caps = {
        available: !0,
        sync: !0,
        serverFetch: !0,
        agentTools: !0,
        agentToolsState: "unknown"
      }, console.log("[ST-BgLoader] Authority backend connected:", this.client.getSession()), this.caps) : this.degrade("sdk-missing", "未检测到 Authority 后端，媒体库运行于本地模式（仅当前浏览器）");
    } catch (e) {
      const t = e instanceof Error ? e.message : String(e), i = et(e);
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
      if (localStorage.getItem(Pe)) return;
      localStorage.setItem(Pe, (/* @__PURE__ */ new Date()).toISOString()), window.toastr?.info(t, "ST-BgLoader");
    } catch {
    }
  }
}
function _t(n) {
  const e = atob(n), t = new ArrayBuffer(e.length), i = new Uint8Array(t);
  for (let s = 0; s < e.length; s++)
    i[s] = e.charCodeAt(s);
  return i;
}
class wt {
  constructor(e) {
    this.bridge = e;
  }
  async import(e) {
    const t = St(e);
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
    const a = _t(s.body);
    return new Blob([a], { type: s.contentType || "application/octet-stream" });
  }
}
function St(n) {
  try {
    return new URL(n).hostname;
  } catch {
    return null;
  }
}
const pe = "st-bg-cache-v1", Et = "st_bg_cache_index", I = "entries";
class Mt {
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
    this.origin = new we();
  }
  async init(e) {
    "caches" in window && (this.l1 = await caches.open(pe)), await this.openIndex(), e && (await e.detectAndInit()).available && e.getClient() && (this.remoteImporter = new wt(e)), await this.origin.init(), console.log("[ST-BgLoader] Media library source of truth: server backgrounds/ directory (browser keeps cache only).");
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
    const o = await this.origin.putMedia({ blob: r, name: t, type: i, source: s, remoteUrl: a });
    return await this.backfillCache(o, r), o;
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
    this.objectUrls.clear(), "caches" in window && (await caches.delete(pe), this.l1 = await caches.open(pe)), await this.indexClear();
  }
  async preloadUrl(e, t) {
    const i = await this.origin.findByUrl(e);
    if (i)
      return { item: i, isNew: !1 };
    const s = e.split("/").pop()?.split("?")[0] || "preloaded_media", a = t || this.detectMediaType(s), r = await this.fetchForStorage(e), o = await this.origin.putMedia({ blob: r, name: s, type: a, source: "url", remoteUrl: e });
    return await this.backfillCache(o, r), { item: o, isNew: !0 };
  }
  detectMediaType(e) {
    return P(e);
  }
  getMimeType(e, t) {
    return be(e, t);
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
      const i = indexedDB.open(Et, 1);
      i.onupgradeneeded = (s) => {
        const a = s.target.result;
        a.objectStoreNames.contains(I) || a.createObjectStore(I, { keyPath: "cacheKey" });
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
      const s = this.indexDb.transaction(I, "readonly").objectStore(I).getAll();
      s.onsuccess = () => e(s.result || []), s.onerror = () => t(s.error);
    });
  }
  async indexPut(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const a = this.indexDb.transaction(I, "readwrite").objectStore(I).put(e);
      a.onsuccess = () => t(), a.onerror = () => i(a.error);
    }), this.indexMirror?.set(e.cacheKey, { ...e });
  }
  async indexDelete(e) {
    this.indexDb || await this.openIndex(), await new Promise((t, i) => {
      const a = this.indexDb.transaction(I, "readwrite").objectStore(I).delete(e);
      a.onsuccess = () => t(), a.onerror = () => i(a.error);
    }), this.indexMirror?.delete(e);
  }
  async indexClear() {
    this.indexDb || await this.openIndex(), await new Promise((e, t) => {
      const s = this.indexDb.transaction(I, "readwrite").objectStore(I).clear();
      s.onsuccess = () => e(), s.onerror = () => t(s.error);
    }), this.indexMirror = /* @__PURE__ */ new Map();
  }
}
const Tt = 1e4;
class kt {
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
    this.playbackMode = e, this.audioElement && (this.audioElement.loop = e === "single"), this.autoAdvanceTimer !== null && (window.clearTimeout(this.autoAdvanceTimer), this.autoAdvanceTimer = null), e !== "single" && this.armAutoAdvance();
  }
  getPlaybackMode() {
    return this.playbackMode;
  }
  // --- BGM playlist auto-advance (F1) -----------------------------------------------
  // One self-held setTimeout per countdown (never setInterval: a tick that lands while the
  // previous switch is still settling must not stack). The countdown RESETS on every track
  // start — manual switches included — so "switched by hand, jumped again 5s later" cannot
  // happen. Guarded at tick time by isPlaying() / playlist length / playbackMode, so a
  // stale timer that survived a pause simply does nothing.
  autoAdvanceTimer = null;
  /** The fade-then-switch follow-up: armed by autoAdvanceTick, cancelled by any manual track start. */
  pendingAdvanceTimer = null;
  autoAdvanceConfig = null;
  /** Enables/reconfigures the auto-advance countdown (values clamped to the setting's range). */
  setAutoAdvance(e, t = 300, i = 800) {
    if (!e) {
      this.stopAutoAdvance();
      return;
    }
    this.autoAdvanceConfig = {
      intervalSec: Math.max(30, Math.min(3600, Math.floor(t))),
      fadeMs: Math.max(0, Math.min(2e3, Math.floor(i)))
    }, this.armAutoAdvance();
  }
  stopAutoAdvance() {
    this.autoAdvanceTimer !== null && (window.clearTimeout(this.autoAdvanceTimer), this.autoAdvanceTimer = null), this.pendingAdvanceTimer !== null && (window.clearTimeout(this.pendingAdvanceTimer), this.pendingAdvanceTimer = null), this.autoAdvanceConfig = null;
  }
  /** True while a countdown is armed (UI status display / harness assertions). */
  isAutoAdvanceArmed() {
    return this.autoAdvanceTimer !== null;
  }
  /** (Re)starts the countdown; a no-op unless enabled + playing + ≥2 tracks. */
  armAutoAdvance() {
    this.autoAdvanceTimer !== null && (window.clearTimeout(this.autoAdvanceTimer), this.autoAdvanceTimer = null), this.pendingAdvanceTimer !== null && (window.clearTimeout(this.pendingAdvanceTimer), this.pendingAdvanceTimer = null);
    const e = this.autoAdvanceConfig;
    !e || this.playbackMode === "single" || this.playlist.length < 2 || !this.isPlaying() || (this.autoAdvanceTimer = window.setTimeout(() => this.autoAdvanceTick(), e.intervalSec * 1e3));
  }
  autoAdvanceTick() {
    this.autoAdvanceTimer = null;
    const e = this.autoAdvanceConfig;
    if (!e || this.playbackMode === "single" || this.playlist.length < 2 || !this.isPlaying()) return;
    const t = e.fadeMs;
    this.stopTrack(t), this.pendingAdvanceTimer = window.setTimeout(() => {
      this.pendingAdvanceTimer = null, !(!this.autoAdvanceConfig || this.playbackMode === "single") && this.playNext().then(() => {
        t > 0 && this.fadeInVolume(this.volume, t);
      }).catch((i) => console.error("[ST-BgLoader AudioEngine] Auto-advance failed:", i));
    }, t + 30);
  }
  setPlaylist(e, t = !1) {
    this.playlist = e, this.errorSkipBudget = Math.max(this.errorSkipBudget, this.playlist.length);
    const i = this.getCurrentTrack(), s = this.currentIndex >= 0 && i ? i.id : null;
    if (s) {
      const a = this.playlist.findIndex((r) => r.id === s);
      this.currentIndex = a !== -1 ? a : this.playlist.length > 0 ? 0 : -1;
    } else this.currentIndex >= this.playlist.length && (this.currentIndex = this.playlist.length > 0 ? 0 : -1);
    this.armAutoAdvance(), this.playlist.length > 0 && this.currentIndex === -1 && (this.currentIndex = 0, t && this.playCurrentTrack());
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
    this.audioElement && (this.audioElement.paused ? (this.initWebAudio(), this.resumeAudioContext(), !this.audioElement.src && this.playlist.length > 0 ? (this.currentIndex === -1 && (this.currentIndex = 0), await this.playCurrentTrack()) : (await this.audioElement.play().catch(() => {
    }), this.armAutoAdvance())) : this.audioElement.pause());
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
            i = window.setTimeout(s, Tt);
          })
        ]).finally(() => {
          window.clearTimeout(i), this.armAutoAdvance();
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
      const r = performance.now() - i, o = Math.min(1, r / t), c = s * o;
      this.audioElement && (this.audioElement.volume = c), this.attachedVideo && (this.attachedVideo.volume = c), o < 1 ? this.fadeTimer = window.setTimeout(a, 16) : this.applyVolume();
    };
    this.fadeTimer = window.setTimeout(a, 16);
  }
  stopTrack(e = 300) {
    if (this.isWaitingForInteractionUnmute = !1, !this.audioElement || this.audioElement.paused) return;
    if (e <= 0) {
      this.audioElement.pause(), this.audioElement.currentTime = 0;
      return;
    }
    const t = this.audioElement.volume, i = performance.now(), s = () => {
      const a = performance.now() - i, r = Math.min(1, a / e);
      this.audioElement && (this.audioElement.volume = t * (1 - r)), r < 1 ? this.fadeTimer = window.setTimeout(s, 16) : this.audioElement && (this.audioElement.pause(), this.audioElement.currentTime = 0, this.applyVolume());
    };
    this.clearFade(), this.fadeTimer = window.setTimeout(s, 16);
  }
  handleVisibilityChange(e, t) {
    t && (e ? (this.audioElement && !this.audioElement.paused && (this.audioElement.pause(), this.isPausedForBlur = !0), this.attachedVideo && !this.attachedVideo.paused && this.attachedVideo.pause()) : (this.isPausedForBlur && this.audioElement && (this.audioElement.play().catch(() => {
    }), this.isPausedForBlur = !1, this.armAutoAdvance()), this.attachedVideo && this.attachedVideo.play().catch(() => {
    })));
  }
  applyVolume() {
    const e = this.muted ? 0 : this.volume;
    this.audioElement && (this.audioElement.volume = e, this.audioElement.muted = this.muted), this.attachedVideo && (this.attachedVideo.volume = e, this.attachedVideo.muted = this.muted);
  }
  clearFade() {
    this.fadeTimer !== null && (window.clearTimeout(this.fadeTimer), this.fadeTimer = null);
  }
  destroy() {
    this.clearFade(), this.stopAutoAdvance(), this.audioElement && (this.audioElement.pause(), this.audioElement.src = "", this.audioElement = null), this.audioContext && (this.audioContext.close().catch(() => {
    }), this.audioContext = null), this.attachedVideo = null, this.playlist = [];
  }
}
const At = 15e3;
class Re {
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
      const r = (l) => {
        console.error("[ST-BgLoader] Error loading video:", l), this.onError?.(), o();
      }, o = () => {
        a || (a = !0, window.clearTimeout(c), this.pendingSettle = null, i.removeEventListener("canplay", h), i.removeEventListener("error", r), s(i));
      }, c = window.setTimeout(o, At);
      this.pendingSettle = o;
      const h = async () => {
        try {
          await i.play();
        } catch (l) {
          console.warn("[ST-BgLoader] Video autoplay failed, trying muted:", l), i.muted = !0, i.play().catch((u) => console.error("[ST-BgLoader] Video playback error:", u));
        }
        i.style.opacity = "1", o();
      };
      i.addEventListener("canplay", h), i.addEventListener("error", r);
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
const xt = 8e3;
class Oe {
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
        a || (a = !0, window.clearTimeout(o), this.pendingSettle = null, s(i));
      }, o = window.setTimeout(r, xt);
      this.pendingSettle = r, i.onload = () => {
        i.style.opacity = "1", r();
      }, t ? i.src = e : i.srcdoc = e;
    });
  }
  destroy() {
    this.iframeElement && (this.pendingSettle?.(), this.iframeElement.remove(), this.iframeElement.srcdoc = "", this.iframeElement.src = "about:blank", this.iframeElement = null);
  }
}
const Ct = 15e3;
class $e {
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
      const r = () => {
        a || (a = !0, window.clearTimeout(o), this.pendingSettle = null, s(i));
      }, o = window.setTimeout(r, Ct);
      this.pendingSettle = r, i.onload = () => {
        i.style.opacity = "1", r();
      }, i.onerror = () => {
        console.error("[ST-BgLoader] Failed to load background image:", e), this.onError?.(), r();
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
const It = 3e4;
class Bt {
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
      const t = window.setTimeout(() => e.disconnect(), It);
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
    this.pumpWrapperEl || (this.pumpWrapperEl = this.layerA?.parentElement ?? t), this.containerEl = t, this.videoRendererA = new Re(this.layerA, this.audioEngine, () => this.renderErrorHandler?.("video")), this.videoRendererB = new Re(this.layerB, this.audioEngine, () => this.renderErrorHandler?.("video")), this.iframeRendererA = new Oe(this.layerA), this.iframeRendererB = new Oe(this.layerB), this.imageRendererA = new $e(this.layerA, () => this.renderErrorHandler?.("image")), this.imageRendererB = new $e(this.layerB, () => this.renderErrorHandler?.("image")), this.applyVisibility(), this.onHostReady?.(t);
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
      const g = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, d = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, p = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      g.destroy(), d.destroy(), p.destroy();
      const m = this.activeLayer === "A" ? this.layerB : this.layerA;
      m && (m.style.opacity = "0", m.style.transform = "none", m.style.filter = "none");
    }
    const i = this.activeLayer === "A" ? "B" : "A", s = i === "B" ? this.layerB : this.layerA, a = this.activeLayer === "A" ? this.layerA : this.layerB, r = i === "B" ? this.videoRendererB : this.videoRendererA, o = i === "B" ? this.iframeRendererB : this.iframeRendererA, c = i === "B" ? this.imageRendererB : this.imageRendererA;
    r.destroy(), o.destroy(), c.destroy();
    const h = this.getFitting();
    switch (e.type) {
      case "video":
        await r.render(t, h);
        break;
      case "html":
      case "svg":
        await o.render(t, !0);
        break;
      case "image":
        await c.render(t, h);
        break;
      case "audio":
        await this.audioEngine.playMediaItem(e, t);
        break;
    }
    const l = this.transitionDurationMs;
    s.style.transition = `all ${l}ms cubic-bezier(0.4, 0, 0.2, 1)`, a.style.transition = `all ${l}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const u = this.transitionType;
    u === "zoom_fade" ? (s.style.transform = "scale(1.06)", s.style.opacity = "0", s.offsetHeight, s.style.transform = "scale(1)", s.style.opacity = "1", a.style.transform = "scale(0.96)", a.style.opacity = "0") : u === "blur_fade" ? (s.style.filter = "blur(10px)", s.style.opacity = "0", s.offsetHeight, s.style.filter = "blur(0px)", s.style.opacity = "1", a.style.filter = "blur(10px)", a.style.opacity = "0") : u === "slide_left" ? (s.style.transform = "translate3d(100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(-100%, 0, 0)", a.style.opacity = "0") : u === "slide_right" ? (s.style.transform = "translate3d(-100%, 0, 0)", s.style.opacity = "1", s.offsetHeight, s.style.transform = "translate3d(0, 0, 0)", a.style.transform = "translate3d(100%, 0, 0)", a.style.opacity = "0") : (s.style.transform = "none", s.style.filter = "none", s.style.opacity = "1", a.style.transform = "none", a.style.filter = "none", a.style.opacity = "0"), this.activeLayer = i, this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null;
      const g = this.activeLayer === "A" ? this.videoRendererB : this.videoRendererA, d = this.activeLayer === "A" ? this.iframeRendererB : this.iframeRendererA, p = this.activeLayer === "A" ? this.imageRendererB : this.imageRendererA;
      g.destroy(), d.destroy(), p.destroy(), a.style.transform = "none", a.style.filter = "none";
    }, l + 50);
  }
  clear() {
    this.crossfadeTimer !== null && (clearTimeout(this.crossfadeTimer), this.crossfadeTimer = null), this.layerA && (this.layerA.style.opacity = "0", this.layerA.style.transform = "none", this.layerA.style.filter = "none"), this.layerB && (this.layerB.style.opacity = "0", this.layerB.style.transform = "none", this.layerB.style.filter = "none"), this.videoRendererA?.destroy(), this.videoRendererB?.destroy(), this.iframeRendererA?.destroy(), this.iframeRendererB?.destroy(), this.imageRendererA?.destroy(), this.imageRendererB?.destroy();
  }
}
const Lt = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function S(n) {
  return String(n).replace(/[&<>"']/g, (e) => Lt[e]);
}
var E, tt, O, ve, re, it, ee, st, Se, _e, ce = Symbol.for("pv"), oe = {}, le = [], Pt = /^m(i|n|o|s|text|space)$/, Ee = Array.isArray, Me = le.slice, q = Object.assign;
function N(n) {
  n && n.parentNode && n.remove();
}
function Q(n, e, t) {
  var i, s, a, r = {}, o = arguments.length;
  for (a in e) a == "key" ? i = e[a] : a == "ref" && typeof n != "function" ? s = e[a] : r[a] = e[a];
  return o > 2 && (r.children = o > 3 ? Me.call(arguments, 2) : t), W(n, r, i, s, null);
}
function W(n, e, t, i, s) {
  var a = { type: n, props: e, key: t, ref: i, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: ce, __v: s || ++tt, __i: -1, __u: 0 };
  return !s && E.vnode && E.vnode(a), a;
}
function de(n) {
  return n.children;
}
function te(n, e) {
  this.props = n, this.context = e, this.__g = 0;
}
function $(n, e) {
  if (e == null) return n.__ && $(n.__, n.__i + 1);
  for (var t; e < n.__k.length; e++) if ((t = n.__k[e]) && t.__e) return t.__e;
  return typeof n.type != "function" || n.props.__P ? null : $(n);
}
function Rt(n) {
  var e, t = n.__v, i = t.__e, s = [], a = [], r = n.__P;
  r && ((e = q({ constructor: ce }, t)).__v = t.__v + 1, E.vnode && E.vnode(e), Te(r, e, t, n.__n, r.namespaceURI, 32 & t.__u ? [i] : null, s, i || $(t), 32 & t.__u, a), e.__v = t.__v, e.__.__k[e.__i] = e, ct(s, e, a), t.__ = t.__e = null, e.__e != i && at(e));
}
function at(n) {
  if ((n = n.__) && n.__c && !n.props.__P) return n.__e = null, n.__k.some(function(e) {
    return e && (n.__e = e.__e);
  }), at(n);
}
function De(n) {
  (8 & n.__g || (n.__g |= 8, O.push(n), re++)) && ve == E.debounceRendering || ((ve = E.debounceRendering) || queueMicrotask)(nt);
}
function nt() {
  try {
    for (var n, e = 1; O.length; ) O.length > e && O.sort(it), n = O.shift(), e = O.length, 8 & n.__g && Rt(n);
  } finally {
    (re = O.length) && (ve || queueMicrotask)(nt);
  }
}
function rt(n, e, t, i, s, a, r, o, c, h, l) {
  var u, g, d, p, m, b, _ = i.__k || le, v = e.length;
  for (c = Ot(t, e, _, c, v), u = 0; u < v; u++) (d = t.__k[u]) != null && (g = ~d.__i && _[d.__i] || oe, d.__i = u, b = Te(n, d, g, s, a, r, o, c, h, l), p = d.__e, (g.ref != d.ref || 8 & g.__u) && (g.ref && ke(g.ref, null, d, g), d.ref && l.push(d.ref, d.__c || p, d)), m = m || p, 4 & d.__u ? (c = ot(d, c, n, !g.__v), g.__e && (g.__e = null)) : typeof d.type == "function" && b !== void 0 ? c = b : p && (c = p.nextSibling), d.__u &= -21);
  return t.__e = m, c;
}
function Ot(n, e, t, i, s) {
  var a, r, o, c, h, l, u, g, d, p = t.length, m = p, b = 0, _ = 0, v = n.__k = Array(s);
  for (a = 0; a < s; a++) (r = e[a]) != null && typeof r != "boolean" && typeof r != "function" ? (typeof r != "object" || r.constructor === String ? r = v[a] = W(null, r) : Ee(r) ? r = v[a] = W(de, { children: r }) : r.constructor === ce && r.__b ? r = v[a] = W(r.type, r.props, r.key, r.ref, r.__v) : v[a] = r, c = a + b, r.__ = n, r.__b = n.__b + 1, o = null, ~(h = r.__i = $t(r, t, c, m)) && (m--, (o = t[h]) && (o.__u |= 2)), o && o.__v ? (r.__u |= 16, h == c - 1 ? b-- : h == c + 1 ? b++ : h != c && (h > c ? b-- : b++, _ = 1)) : (~h || (s > p ? b-- : s < p && b++), typeof r.type != "function" && (r.__u |= 4))) : v[a] = null;
  if (_) {
    for (l = [], u = [], a = 0; a < s; a++) if ((r = v[a]) && 16 & r.__u) {
      for (b = 0, g = l.length; b < g; ) l[d = b + g >> 1] < r.__i ? b = d + 1 : g = d;
      l[b] = r.__i, u[a] = b + 1;
    }
    for (b = l.length; a--; ) u[a] && (u[a] == b ? b-- : v[a].__u |= 4);
  }
  if (m) for (a = 0; a < p; a++) !(o = t[a]) || 2 & o.__u || (o.__e == i && (i = $(o)), Ae(o, o));
  return i;
}
function ot(n, e, t, i) {
  var s, a, r, o;
  if (typeof n.type == "function") {
    if (n.props.__P) return e;
    if (s = n.__k) for (a = 0; a < s.length; a++) s[a] && (s[a].__ = n, e = ot(s[a], e, t, !1));
    return e;
  }
  for (e && !e.parentNode && (e = $(n)) && !e.parentNode && (e = null), r = n.__e, o = e; o && o.nodeType == 8; ) o = o.nextSibling;
  for (r != o && (!i && t.moveBefore && r.parentNode ? t.moveBefore(r, e) : t.insertBefore(r, e || null)), e = r; (e = e && e.nextSibling) && e.nodeType == 8 && !e.data.startsWith("$s"); ) ;
  return e;
}
function $t(n, e, t, i) {
  var s, a = n.key, r = n.type, o = e[t], c = o && !(2 & o.__u);
  if (o === null && a == null || c && a == o.key && r == o.type) return t;
  if (i > (c ? 1 : 0)) {
    for (s = t - 1; s >= 0; s--) if ((o = e[s]) && !(2 & o.__u) && a == o.key && r == o.type) return s;
    for (s = t + 1; s < e.length; s++) if ((o = e[s]) && !(2 & o.__u) && a == o.key && r == o.type) return s;
  }
  return -1;
}
function Fe(n, e, t) {
  t == null && (t = ""), e[0] == "-" ? n.setProperty(e, t) : n[e] = t;
}
function Y(n, e, t, i, s) {
  var a, r;
  if (e == "style") if (typeof t == "string") n.style.cssText = t;
  else {
    if (typeof i == "string" && (n.style.cssText = i = ""), i) for (e in i) t && e in t || Fe(n.style, e);
    if (t) for (e in t) i && t[e] == i[e] || Fe(n.style, e, t[e]);
  }
  else if (e[0] == "o" && e[1] == "n") typeof t != "function" && (t = null), typeof i != "function" && (i = null), (n.__e || (n.__e = {}))[e] = t, t && i || (r = _e[e] || (_e[e] = Dt(e)), (n.__a || (n.__a = {}))[e] = Se, a = e != (e = e.replace(st, "$1")), (e = e.slice(2))[0] < "a" && (e = e.toLowerCase()), t ? n.addEventListener(e, r, a) : n.removeEventListener(e, r, a));
  else {
    if (s == "http://www.w3.org/2000/svg") e = e.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if (e != "width" && e != "height" && e != "href" && e != "list" && e != "form" && e != "tabIndex" && e != "download" && e != "rowSpan" && e != "colSpan" && e != "role" && e != "popover" && e in n) try {
      return void (n[e] = t ?? "");
    } catch {
    }
    if (typeof t == "function") return;
    t == null || t === !1 && e[4] != "-" ? n.removeAttribute(e) : n.setAttribute(e, e == "popover" && t == 1 ? "" : t);
  }
}
function Dt(n) {
  return function(e) {
    var t = this.__e;
    if (t) {
      if (t = t[n], e[ee] == null) e[ee] = Se++;
      else if (e[ee] < this.__a[n]) return;
      return t(E.event ? E.event(e) : e);
    }
  };
}
function Te(n, e, t, i, s, a, r, o, c, h) {
  var l, u, g, d, p, m, b, _, v, T, M, K, he, y, k, D, A, C, L = e.type;
  if (e.constructor !== ce) return null;
  128 & t.__u && (c = 32 & t.__u, l = t.__c.__z) && (e.__u |= c, u = a = [], l.nodeType == 8 ? o = ie(l, a) : a.push(l), o = a[0] || o), (l = E.__b) && l(e);
  e: if (typeof L == "function") {
    g = r.length;
    try {
      if (_ = e.props, v = (l = L.prototype) && l.render, T = (l = L.contextType) && i[l.__c], M = l ? T ? T.props.value : l.__ : i, (d = t.__c) ? (e.__c = d, 2 & d.__g && (d.__g |= 1)) : (v ? e.__c = d = new L(_, M) : (e.__c = d = new te(_, M), d.constructor = L, d.render = Nt), T && T.sub(d), d.state || (d.state = {}), d.__n = i, d.__g |= 8, d.__h = [], d.__k = []), v && (d.__s || (d.__s = d.state), L.getDerivedStateFromProps && (d.__s == d.state && (d.__s = q({}, d.__s)), q(d.__s, L.getDerivedStateFromProps(_, d.__s)))), p = d.props, m = d.state, d.__v = e, t.__c) {
        if (_ !== p && v && !L.getDerivedStateFromProps && d.componentWillReceiveProps && d.componentWillReceiveProps(_, M), e.__v == t.__v && !(8 & d.__g) || !(4 & d.__g) && d.shouldComponentUpdate && d.shouldComponentUpdate(_, d.__s, M) === !1) {
          e.__v != t.__v && (d.props = _, d.state = d.__s, d.__g &= -9), e.__e = t.__e, e.__k = t.__k, e.__k.some(function(x) {
            x && (x.__ = e);
          }), le.push.apply(d.__h, d.__k), d.__k = [], d.__h.length && r.push(d), o = $(t);
          break e;
        }
        d.componentWillUpdate && d.componentWillUpdate(_, d.__s, M), v && d.componentDidUpdate && d.__h.push(function() {
          d.componentDidUpdate(p, m, b);
        });
      } else v && !L.getDerivedStateFromProps && d.componentWillMount && d.componentWillMount(), v && d.componentDidMount && d.__h.push(d.componentDidMount);
      d.context = M, d.props = _, d.__P = n, d.__g &= -5, K = E.__r, he = v ? 25 : 0;
      do
        d.__g &= -9, K && K(e), l = d.render(d.props, d.state = d.__s, d.context);
      while (8 & d.__g && ++he < 25);
      v && (le.push.apply(d.__h, d.__k), d.__k = []), d.state = d.__s, d.getChildContext && (i = q({}, i, d.getChildContext())), v && t.__c && d.getSnapshotBeforeUpdate && (b = d.getSnapshotBeforeUpdate(p, m)), y = l && l.type === de && l.key == null ? l.props.children : l, _.__P && (l = o, s = (n = _.__P).namespaceURI, c = a = null, t.props && t.props.__P != n && (t.__k.some(function(x) {
        x && Ae(x, x);
      }), t.__k = null), o = t.__k ? $(t, 0) : null), o = rt(n, Ee(y) ? y : [y], e, t, i, s, a, r, o, c, h), _.__P && (e.__e = null, o = l), e.__u &= -161, u && u.some(N), d.__h.length && r.push(d), 1 & d.__g && (d.__g &= -4);
    } catch (x) {
      if (r.length = g, e.__v = null, c || a) if (x && x.then) {
        if (e.__u |= 128 | c, a) {
          for (~(A = a.indexOf(o || void 0)) || (A = a.length); (C = a[A - 1]) && C.nodeType == 8; ) A--;
          for (; A < a.length; A++) if (C = a[A]) if (a[A] = null, k) {
            if (C == D) break;
          } else {
            if (C.nodeType != 8) break;
            C.data.startsWith("$s") && (D = ie(k = C));
          }
        }
        if (!k) {
          for (; o && o.nodeType == 8 && o.nextSibling; ) o = o.nextSibling;
          k = o;
        }
        (l = ie(k = e.__c.__z || (e.__c.__z = k))) ? (e.__e = k, o = l) : e.__e = o, o = o && o.nextSibling;
      } else a && a.some(N);
      else e.__e = t.__e;
      e.__k || (e.__k = t.__k || []), x && x.then || lt(e), E.__e(x, e, t);
    }
  } else o = e.__e = Ft(t.__e, e, t, i, s, a, r, c, h, n);
  return (l = E.diffed) && l(e), o;
}
function ie(n, e) {
  if (n && n.nodeType == 8 && n.data.startsWith("$s")) for (var t = 1; n = n.nextSibling; ) {
    if (n.nodeType == 8) {
      if (n.data.startsWith("$s")) t++;
      else if (n.data.startsWith("/$s") && !--t) return n;
    }
    e && e.push(n);
  }
}
function lt(n) {
  n && (n.__c && (n.__c.__g |= 4), n.__k && n.__k.some(lt));
}
function ct(n, e, t) {
  for (var i = 0; i < t.length; ) ke(t[i++], t[i++], t[i++]);
  E.__c && E.__c(e, n), n.some(function(s) {
    try {
      n = s.__h, s.__h = [], n.some(function(a) {
        a.call(s);
      });
    } catch (a) {
      E.__e(a, s.__v);
    }
  });
}
function Ft(n, e, t, i, s, a, r, o, c, h) {
  var l, u, g, d, p, m, b, _, v = t.props || oe, T = e.props, M = e.type;
  if (M == "svg" ? s = "http://www.w3.org/2000/svg" : M == "math" ? s = "http://www.w3.org/1998/Math/MathML" : s || (s = "http://www.w3.org/1999/xhtml"), a) {
    for (l = 0; l < a.length; l++) if ((p = a[l]) && (M ? p.localName == M : p.nodeType == 3)) {
      n = p, a[l] = null;
      break;
    }
  }
  if (!n) {
    if (_ = h.ownerDocument || document, !M) return _.createTextNode(T);
    n = _.createElementNS(s, M, T.is ? T : h), o && (E.__m && E.__m(e, a), o = !1), a = null;
  }
  if (M) {
    if (h = M == "template" && n.content || n, a = M == "textarea" && T.defaultValue != null ? null : a && Me.call(h.childNodes), !o && a) for (v = {}, l = 0; l < n.attributes.length; l++) v[(p = n.attributes[l]).name] = p.value;
    for (l in v) p = v[l], l == "dangerouslySetInnerHTML" ? g = p : l == "children" || l in T || l == "value" && "defaultValue" in T || l == "checked" && "defaultChecked" in T || Y(n, l, null, p, s);
    for (l in T) p = T[l], l == "children" ? d = p : l == "dangerouslySetInnerHTML" ? u = p : l == "value" ? m = p : l == "checked" ? b = p : o && typeof p != "function" || v[l] === p || Y(n, l, p, v[l], s);
    u ? (o || g && (u.__html == g.__html || u.__html == n.innerHTML) || (n.innerHTML = u.__html), e.__k = []) : (g && (n.textContent = ""), (M == "foreignObject" || s == "http://www.w3.org/1998/Math/MathML" && Pt.test(M)) && (s = "http://www.w3.org/1999/xhtml"), rt(h, Ee(d) ? d : [d], e, t, i, s, a, r, a ? a[0] : t.__k && $(t, 0), o, c), a && a.some(N)), o && M != "textarea" || (l = "value", M == "progress" && m == null ? n.removeAttribute(l) : m == null || m === n[l] && (M != "progress" || m) || Y(n, l, m, v[l], s), l = "checked", b != null && b != n[l] && Y(n, l, b, v[l], s));
  } else v === T || o && n.data == T || (n.data = T);
  return n;
}
function ke(n, e, t, i) {
  try {
    typeof n == "function" ? e ? e.__x = n(e) || 1 : i && (i = i.__c || i.__e) && (e = i.__x) && (i.__x = null, typeof e == "function" ? e() : n(null)) : n.current = e;
  } catch (s) {
    E.__e(s, t);
  }
}
function Ae(n, e, t) {
  var i, s, a, r;
  if (E.unmount && E.unmount(n), !(i = n.ref) || i.current && i.current != n.__e || ke(i, null, e, n), i = n.__c) {
    if (i.componentWillUnmount) try {
      i.componentWillUnmount();
    } catch (o) {
      E.__e(o, e);
    }
    i.__P = i.__n = null;
  }
  if (i = n.__k) for (r = 0; r < i.length; r++) i[r] && Ae(i[r], e, typeof n.type != "function" || t && !n.props.__P);
  !t && (i = n.__c) && (i = i.__z) && (s = ie(i, a = [])) && (i == n.__e && a.some(N), N(s), N(i)), t || N(n.__e), n.__e = n.__c = n.__ = null;
}
function Nt(n, e, t) {
  return this.constructor(n, t);
}
function Ne(n, e) {
  var t, i, s, a;
  E.__ && E.__(n, e), e.nodeType == 9 && (e = e.documentElement), i = (t = n && 32 & n.__u) ? null : e.__k, e.__k = W(de, { children: [n] }), s = [], a = [], Te(e, e.__k, i || oe, oe, e.namespaceURI, i ? null : e.firstChild ? Me.call(e.childNodes) : null, s, i ? i.__e : e.firstChild, t, a), ct(s, e.__k, a), e.__k.props.children = null;
}
E = { __e: function(n, e, t, i) {
  for (var s, a, r; e = e.__; ) if ((s = e.__c) && !(1 & s.__g)) {
    s.__g |= 4;
    try {
      if ((r = (a = s.constructor) && a.getDerivedStateFromError) && s.setState(a.getDerivedStateFromError(n)), s.componentDidCatch && (s.componentDidCatch(n, i || {}), r = 1), r && 8 & s.__g) return void (s.__g |= 2);
    } catch (o) {
      n = o;
    }
  }
  throw re = 0, n;
} }, tt = 0, te.prototype.setState = function(n, e) {
  var t = this.__s;
  t && t != this.state || (t = this.__s = q({}, this.state)), typeof n == "function" && (n = n(q({}, t), this.props)), n && (q(t, n), this.__v && (e && this.__k.push(e), De(this)));
}, te.prototype.forceUpdate = function(n) {
  this.__v && (this.__g |= 4, n && this.__h.push(n), De(this));
}, te.prototype.render = de, O = [], re = 0, it = function(n, e) {
  return n.__v.__b - e.__v.__b;
}, ee = Symbol(), st = /(PointerCapture)$|Capture$/i, Se = 0, _e = {};
function qt(n) {
  const e = document.createElement("div");
  Ne(n, e);
  const t = e.innerHTML;
  return Ne(null, e), t;
}
function Ut(n) {
  const e = n.options.map((i) => {
    const s = i.icon ? Q("i", { class: `fa-solid ${i.icon}` }) : null;
    return Q(
      "button",
      {
        type: "button",
        class: `st-bgloader-seg-btn${i.selected ? " active" : ""}`,
        "data-seg-value": i.value
      },
      s,
      Q("span", null, i.label)
    );
  }), t = { class: "st-bgloader-seg" };
  return n.id && (t.id = n.id), Q("div", t, ...e);
}
class f {
  /**
   * Renders a compact, unified section card without redundant dividers.
   */
  static renderSection(e) {
    const t = e.id ? `id="${e.id}"` : "", i = e.icon ? `<i class="fa-solid ${e.icon}"></i> ` : "";
    return `
            <div class="st-bgloader-section${e.extraClass ? ` ${e.extraClass}` : ""}" ${t}>
                <h4>${i}<span>${S(e.title)}</span></h4>
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
                <label for="${e.id}">${S(e.label)}</label>
                <input type="range" id="${e.id}" min="${e.min}" max="${e.max}" step="${e.step}" value="${e.value}" />
                <span class="st-bgloader-slider-val" id="${e.valId}">${e.value}${t}</span>
            </div>
        `;
  }
  /**
   * Renders a compact preset / dropdown row. `compact` strips the wrapper
   * and label for inline toolbar use.
   */
  static renderSelect(e) {
    const t = e.options.map((i) => {
      const s = i.selected ? " selected" : "";
      return `<option value="${S(i.value)}"${s}>${S(i.label)}</option>`;
    }).join("");
    if (e.compact) {
      const i = e.title ? ` title="${S(e.title)}"` : "";
      return `<select id="${e.id}" class="text_pole"${i}>${t}</select>`;
    }
    return `
            <div class="st-bgloader-preset-row">
                <label for="${e.id}">${S(e.label)}</label>
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
    const t = e.sub ? " st-bgloader-check-sub" : "", i = e.checked ? " checked" : "", s = e.bold ? `<strong>${S(e.label)}</strong>` : S(e.label);
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
    const i = e.id ? `id="${e.id}"` : "", s = e.title ? `title="${S(e.title)}"` : "", a = e.icon ? `<i class="fa-solid ${e.icon}"></i>` : "", r = e.label ? ` ${S(e.label)}` : "";
    return `<button type="button" ${i} class="${t.join(" ")}" ${s}>${a}${r}</button>`;
  }
  /**
   * Binds a range slider input with requestAnimationFrame (rAF) throttling.
   * Guarantees 60fps smoothness and prevents layout thrashing on high-frequency drag events.
   * @returns 解绑函数——重渲染前必须调用（绑定器可解绑定案 2026-11-19），取消挂起 rAF。
   */
  static bindRafSlider(e, t, i, s, a) {
    const r = e.querySelector(`#${t}`), o = e.querySelector(`#${i}`);
    if (!r) return () => {
    };
    let c = null, h = null;
    const l = () => {
      const u = Number(r.value);
      o && (o.textContent = `${u}${s}`), h = u, c === null && (c = window.requestAnimationFrame(() => {
        h !== null && a(h), c = null;
      }));
    };
    return r.addEventListener("input", l), () => {
      r.removeEventListener("input", l), c !== null && (window.cancelAnimationFrame(c), c = null);
    };
  }
  /**
   * Renders a horizontal settings row: label left, control right.
   */
  static renderRow(e) {
    const t = e.id ? ` id="${e.id}"` : "", i = e.icon ? `<i class="fa-solid ${e.icon}"></i>` : "";
    return `
            <div class="st-bgloader-row"${t}>
                <label>${i}<span>${S(e.label)}</span></label>
                <div class="st-bgloader-row-control">${e.controlHtml}</div>
            </div>
        `;
  }
  /**
   * Renders a collapsible group with persisted open/closed state.
   * 状态记忆走 localStorage（视图态），不进 settings（避免远程镜像噪音）。
   */
  static renderGroup(e) {
    const t = e.open ?? !1, i = e.icon ? `<i class="fa-solid ${e.icon}"></i>` : "";
    return `
            <div class="st-bgloader-group" id="${S(e.id)}" data-open="${t}">
                <div class="st-bgloader-group-head" data-group-toggle="${S(e.id)}" tabindex="0" role="button" aria-expanded="${t}">
                    <span class="st-bgloader-group-title">${i}<span>${S(e.title)}</span></span>
                    <span class="st-bgloader-group-actions">${e.actionsHtml ?? ""}</span>
                    <i class="fa-solid fa-circle-chevron-down st-bgloader-group-chevron"></i>
                </div>
                <div class="st-bgloader-group-body"${t ? "" : " hidden"}>${e.contentHtml}</div>
            </div>
        `;
  }
  /**
   * Renders a single-select segmented pill control.
   */
  static renderSegmented(e) {
    return qt(Ut(e));
  }
  static GROUP_STATE_KEY = "st_bgloader_group_state";
  /**
   * Binds collapsible groups inside `container`: applies persisted open/closed state
   * (falling back to `defaults`), then toggles on head clicks. Head action areas
   * (`.st-bgloader-group-actions`) never trigger folding.
   * @returns 解绑函数（重渲染前必须调用）。
   */
  static bindGroups(e, t) {
    let i = {};
    try {
      i = JSON.parse(localStorage.getItem(f.GROUP_STATE_KEY) ?? "{}");
    } catch {
      i = {};
    }
    (() => {
      for (const c of Array.from(e.querySelectorAll(".st-bgloader-group"))) {
        const h = c.id;
        if (!h) continue;
        const l = i[h] ?? t[h] ?? !1;
        c.dataset.open = String(l);
        const u = c.querySelector(":scope > .st-bgloader-group-body");
        u && (u.hidden = !l);
        const g = c.querySelector(":scope > .st-bgloader-group-head");
        g && g.setAttribute("aria-expanded", String(l));
      }
    })();
    const a = (c) => {
      if (!e.contains(c)) return;
      const h = c.parentElement, l = h?.id;
      if (!h || !l) return;
      const u = h.dataset.open !== "true";
      h.dataset.open = String(u);
      const g = h.querySelector(":scope > .st-bgloader-group-body");
      g && (g.hidden = !u), c.setAttribute("aria-expanded", String(u)), i[l] = u;
      try {
        localStorage.setItem(f.GROUP_STATE_KEY, JSON.stringify(i));
      } catch {
      }
    }, r = (c) => {
      const h = c.target, l = h?.closest(".st-bgloader-group-head");
      l && (h?.closest(".st-bgloader-group-actions") || a(l));
    }, o = (c) => {
      if (c.key !== "Enter" && c.key !== " ") return;
      const h = c.target, l = h?.closest(".st-bgloader-group-head");
      !l || !e.contains(l) || h?.closest(".st-bgloader-group-actions") || (c.preventDefault(), a(l));
    };
    return e.addEventListener("click", r), e.addEventListener("keydown", o), () => {
      e.removeEventListener("click", r), e.removeEventListener("keydown", o);
    };
  }
  /**
   * Binds single-select behavior for all `.st-bgloader-seg` groups inside `container`.
   * @returns 解绑函数（重渲染前必须调用）。
   */
  static bindSegmented(e, t) {
    const i = (s) => {
      const r = s.target?.closest(".st-bgloader-seg-btn");
      if (!r || !e.contains(r)) return;
      const o = r.closest(".st-bgloader-seg");
      if (o) {
        for (const c of Array.from(o.querySelectorAll(".st-bgloader-seg-btn")))
          c.classList.toggle("active", c === r);
        t(r.dataset.segValue ?? "");
      }
    };
    return e.addEventListener("click", i), () => e.removeEventListener("click", i);
  }
}
class Vt {
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
    const e = w.getInstance(), t = e.getExtensionsSettingsContainer();
    if (!t) {
      const h = new MutationObserver(() => {
        e.getExtensionsSettingsContainer() && (window.clearTimeout(l), h.disconnect(), this.render());
      });
      h.observe(document.body, { childList: !0, subtree: !0 });
      const l = window.setTimeout(() => h.disconnect(), 3e4);
      return;
    }
    const i = document.querySelector("#st_bgloader_container, #st_bgloader_settings");
    i && i.remove();
    const s = document.createElement("div");
    s.id = "st_bgloader_container", s.className = "extension_container", s.setAttribute("data-extension-name", "ST-BgLoader");
    const r = (this.activeMediaName || "默认").replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim() || "默认", o = this.settings.enabled ?? !0, c = f.renderButton({
      id: "st_bgloader_open_topbar_btn",
      icon: "fa-arrow-up-right-from-square",
      label: "打开设置",
      disabled: !o
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
                                <input type="checkbox" id="st_bgloader_master_enable" ${o ? "checked" : ""} />
                                <span><strong>启用增强</strong></span>
                            </label>
                        </div>
                        <div class="st-bgloader-master-status">
                            <span>背景: <strong id="st_bgloader_active_name">${S(r)}</strong></span>
                            <span class="st-bgloader-status-pill ${o ? "active" : ""}" id="st_bgloader_status_pill">
                                ${o ? "已启用" : "已停用"}
                            </span>
                        </div>
                        <div class="st-bgloader-master-actions">
                            ${c}
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
      const o = e.checked;
      this.settings.enabled = o, this.syncMasterToggle(o), this.callbacks.onMasterToggle(o);
    }), this.container.querySelector("#st_bgloader_open_topbar_btn")?.addEventListener("click", () => {
      this.settings.enabled && w.getInstance().openBackgroundDrawer();
    });
    const i = this.container.querySelector(".inline-drawer-toggle"), s = this.container.querySelector(".inline-drawer"), a = this.container.querySelector(".inline-drawer-content"), r = this.container.querySelector(".inline-drawer-icon");
    if (i && s && a && r) {
      let o = !1;
      s.addEventListener("inline-drawer-toggle", () => {
        o = !0;
      });
      const c = window.$ || window.jQuery;
      if (typeof c == "function")
        try {
          c(s).on("inline-drawer-toggle", () => {
            o = !0;
          });
        } catch {
        }
      i.addEventListener("click", () => {
        o = !1, window.setTimeout(() => {
          if (!o) {
            const h = a.style.display === "none" || window.getComputedStyle(a).display === "none";
            a.style.display = h ? "block" : "none", r.classList.toggle("down", !h), r.classList.toggle("up", h), r.classList.toggle("fa-circle-chevron-down", !h), r.classList.toggle("fa-circle-chevron-up", h);
          }
        }, 50);
      });
    }
  }
}
const zt = "st-bg-native-hidden";
class xe {
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
  /** 15s 挂载兜底定时（技术面复检 D：可清理，避免 unmount 后残留回掉） */
  mountGiveUpTimer = null;
  /** Monotonic token for in-flight grid refreshes: only the newest run may write the grid. */
  refreshGeneration = 0;
  /** Video first-frame thumbnails (itemId → dataURL), generated lazily per grid render. */
  thumbCache = /* @__PURE__ */ new Map();
  static THUMB_CACHE_CAP = 64;
  thumbInflight = /* @__PURE__ */ new Map();
  /** 多选批量模式（会话内视图态）：批量删/顺换/随机换 */
  multiSelectMode = !1;
  selectedIds = /* @__PURE__ */ new Set();
  /** 网格懒挂载观察器：卡片进入视口 200px 前瞻带才 hydrate 预览 */
  gridObserver = null;
  /** 最近一次网格构建的可见列表（懒抽帧按 id 回查 item 用） */
  lastGridItems = null;
  constructor(e, t, i, s) {
    this.settings = e, this.cacheManager = t, this.callbacks = i, this.authority = s ?? null, this.sortOrder = this.settings.libraryView?.sortOrder ?? "name";
    const a = this.settings.libraryView?.typeFilter ?? "all";
    this.typeFilter = a === "html" ? "doc" : a;
  }
  applyRemoteSettings(e) {
    this.settings = e, this.sortOrder = e.libraryView?.sortOrder ?? this.sortOrder;
    const t = e.libraryView?.typeFilter ?? this.typeFilter;
    this.typeFilter = t === "html" ? "doc" : t, this.panel && this.syncFormControls();
  }
  syncBackgroundVisible(e) {
    const t = this.panel?.querySelector("#st_topbar_bg_vis_btn");
    t && (t.innerHTML = `<i class="fa-solid ${e ? "fa-eye" : "fa-eye-slash"}"></i>`, t.title = e ? "隐藏" : "显示");
    const i = this.panel?.querySelector("#st_bg_visible_topbar");
    i && (i.checked = e);
  }
  /** Mounts the takeover panel into the host's #Backgrounds drawer */
  mount() {
    const e = w.getInstance();
    if (this.hostDrawer = e.getBackgroundDrawer(), !this.hostDrawer) {
      if (this.mountObserver) return;
      const i = new MutationObserver(() => {
        const s = e.getBackgroundDrawer();
        s && (this.dropMountObserver(), this.hostDrawer = s, this.mount());
      });
      this.mountObserver = i, i.observe(document.body, { childList: !0, subtree: !0 }), this.mountGiveUpTimer = window.setTimeout(() => this.dropMountObserver(), 15e3);
      return;
    }
    const t = this.hostDrawer.querySelector("#st_bgloader_topbar_panel");
    t && t.remove(), this.panel = document.createElement("div"), this.panel.id = "st_bgloader_topbar_panel", this.panel.className = "st-bgloader-topbar-panel", this.renderPanel(), this.hostDrawer.appendChild(this.panel), this.bindEvents(), this.refreshMediaGrid(), this.updateCacheStats(), this.updateCloudPanel();
  }
  /** Restores the host drawer to its native state */
  unmount() {
    this.dropMountObserver(), this.searchDebounceTimer !== null && (window.clearTimeout(this.searchDebounceTimer), this.searchDebounceTimer = null), this.gridObserver?.disconnect(), this.gridObserver = null, this.lastGridItems = null, this.multiSelectMode = !1, this.selectedIds.clear(), this.panel && (this.panel.remove(), this.panel = null), this.hostDrawer && Array.from(this.hostDrawer.children).forEach((e) => {
      e.classList.remove(zt);
    });
  }
  dropMountObserver() {
    this.mountGiveUpTimer !== null && (window.clearTimeout(this.mountGiveUpTimer), this.mountGiveUpTimer = null), this.mountObserver?.disconnect(), this.mountObserver = null;
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
                    <select id="st_topbar_scene_quick" class="st-bgloader-scene-quick" title="场景快切"></select>
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
                            <input type="search" id="st_topbar_search" class="text_pole" placeholder="搜索..." value="${S(this.searchQuery)}" />
                        </div>
                        ${f.renderSegmented({
      id: "st_topbar_type_seg",
      options: [
        { value: "all", label: "全部", icon: "fa-border-all", selected: this.typeFilter === "all" },
        { value: "image", label: "图", icon: "fa-image", selected: this.typeFilter === "image" },
        { value: "video", label: "视频", icon: "fa-film", selected: this.typeFilter === "video" },
        { value: "audio", label: "音频", icon: "fa-music", selected: this.typeFilter === "audio" },
        { value: "doc", label: "文档", icon: "fa-file-code", selected: this.typeFilter === "doc" }
      ]
    })}
                        ${f.renderSelect({
      id: "st_topbar_sort",
      label: "",
      compact: !0,
      title: "排序",
      options: [
        { value: "name", label: "名称", selected: this.sortOrder === "name" },
        { value: "time", label: "时间", selected: this.sortOrder === "time" },
        { value: "size", label: "大小", selected: this.sortOrder === "size" }
      ]
    })}
                        ${f.renderButton({ id: "st_topbar_upload_toggle_btn", icon: "fa-cloud-arrow-up", label: "导入", title: "导入" })}
                        ${f.renderButton({ id: "st_topbar_multiselect_btn", className: "menu_button_icon", icon: "fa-list-check", title: "多选" })}
                    </div>

                    <!-- Collapsible Upload Box -->
                    <div id="st_topbar_upload_box" class="st-bgloader-upload-box" style="display: none;">
                        <div class="st-bgloader-dropzone" id="st_bgloader_dropzone" tabindex="0" role="button" aria-label="导入文件">
                            <i class="fa-solid fa-file-video fa-2x"></i>
                            <div>点击或拖拽文件导入</div>
                            <input type="file" id="st_bgloader_file_input" class="st-bgloader-hidden" accept="video/*,audio/*,image/*,.html,.htm,.svg" />
                        </div>
                        <div class="st-bgloader-url-import">
                            <input type="text" id="st_bgloader_url_input" class="text_pole" placeholder="媒体 URL..." />
                            ${f.renderButton({ id: "st_bgloader_url_btn", label: "导入" })}
                        </div>
                    </div>

                    <!-- 多选操作条（进入多选态才显示） -->
                    <div id="st_bgloader_multiselect_bar" class="st-bgloader-multiselect-bar" hidden>
                        <span id="st_multiselect_count" class="st-bgloader-dim-text">已选 0</span>
                        ${f.renderButton({ id: "st_multiselect_delete_btn", variant: "danger", icon: "fa-trash", label: "批量删" })}
                        ${f.renderButton({ id: "st_multiselect_first_btn", icon: "fa-play", label: "顺换", title: "应用首个选中" })}
                        ${f.renderButton({ id: "st_multiselect_random_btn", icon: "fa-shuffle", label: "随机换", title: "随机应用一张" })}
                        ${f.renderButton({ id: "st_multiselect_exit_btn", label: "退出" })}
                    </div>

                    <!-- 场景条：场景入媒体 Tab（顶栏为快切，此处为管理） -->
                    <div class="st-bgloader-toolbar-row">
                        <div class="st-bgloader-scene-bar">
                            <select id="st_scene_select" class="text_pole" title="场景"></select>
                            ${f.renderButton({ id: "st_scene_apply_btn", className: "menu_button_icon", icon: "fa-play", title: "应用" })}
                            ${f.renderButton({ id: "st_scene_save_btn", className: "menu_button_icon", icon: "fa-floppy-disk", title: "保存" })}
                            ${f.renderButton({ id: "st_scene_del_btn", variant: "danger", className: "menu_button_icon", icon: "fa-trash", title: "删除" })}
                            ${f.renderButton({ id: "st_scene_export_btn", className: "menu_button_icon", icon: "fa-file-arrow-down", title: "导出" })}
                            <label for="st_scene_import_file" class="menu_button menu_button_icon" title="导入">
                                <i class="fa-solid fa-file-arrow-up"></i>
                                <input type="file" id="st_scene_import_file" class="st-bgloader-hidden" accept=".json" />
                            </label>
                        </div>
                    </div>

                    <!-- Media Grid -->
                    <div class="st-bgloader-media-grid" id="st_bgloader_grid">
                        <div class="st-bgloader-grid-loading"><i class="fa-solid fa-spinner fa-spin"></i> 加载中...</div>
                    </div>
                </div>

                <!-- Tab 2: Settings —— 五组折叠（画面/氛围/声音/自动化/系统），开闭状态记忆 -->
                <div id="st_tab_settings" class="st-bgloader-tab-content ${this.activeTab === "settings" ? "active" : ""}">
                    ${f.renderGroup({
      id: "st_group_visual",
      title: "画面",
      icon: "fa-image",
      open: !0,
      contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-sliders"></i>滤镜</div>
                            <div class="st-bgloader-preset-row">
                                <label class="st-bgloader-label-sm">预设:</label>
                                <select id="st_preset_select" class="text_pole"></select>
                                ${f.renderButton({ id: "st_preset_save_btn", className: "menu_button_icon", icon: "fa-floppy-disk", title: "保存" })}
                                ${f.renderButton({ id: "st_preset_del_btn", variant: "danger", className: "menu_button_icon", icon: "fa-trash", title: "删除" })}
                            </div>
                            ${f.renderSlider({ id: "st_filter_blur", valId: "st_filter_blur_val", label: "模糊", min: 0, max: 20, step: 1, value: this.settings.filters.blur, unit: "px" })}
                            ${f.renderSlider({ id: "st_filter_brightness", valId: "st_filter_brightness_val", label: "亮度", min: 0, max: 200, step: 5, value: this.settings.filters.brightness, unit: "%" })}
                            ${f.renderSlider({ id: "st_filter_opacity", valId: "st_filter_opacity_val", label: "不透明", min: 0, max: 100, step: 5, value: this.settings.filters.opacity, unit: "%" })}
                            ${f.renderSlider({ id: "st_filter_saturate", valId: "st_filter_saturate_val", label: "饱和度", min: 0, max: 200, step: 5, value: this.settings.filters.saturate, unit: "%" })}
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_bg_interactive", label: "背景交互", checked: this.settings.interactiveBackground })}
                            </div>
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-eye"></i>毛玻璃</div>
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_frosted_enabled", label: "启用", checked: this.settings.frostedChat.enabled })}
                            </div>
                            ${f.renderSlider({ id: "st_frosted_blur", valId: "st_frosted_blur_val", label: "模糊", min: 0, max: 25, step: 1, value: this.settings.frostedChat.blur, unit: "px" })}
                            ${f.renderSlider({ id: "st_frosted_opacity", valId: "st_frosted_opacity_val", label: "不透明", min: 20, max: 100, step: 5, value: this.settings.frostedChat.opacity, unit: "%" })}
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-wand-magic-sparkles"></i>转场</div>
                            ${f.renderSelect({
        id: "st_transition_effect",
        label: "效果",
        options: [
          { value: "fade", label: "淡入", selected: this.settings.transitionEffect === "fade" },
          { value: "zoom_fade", label: "缩放", selected: this.settings.transitionEffect === "zoom_fade" },
          { value: "blur_fade", label: "柔焦", selected: this.settings.transitionEffect === "blur_fade" },
          { value: "slide_left", label: "左移", selected: this.settings.transitionEffect === "slide_left" },
          { value: "slide_right", label: "右移", selected: this.settings.transitionEffect === "slide_right" }
        ]
      })}
                            ${f.renderSlider({ id: "st_transition_dur", valId: "st_transition_dur_val", label: "时长", min: 200, max: 1500, step: 50, value: this.settings.transitionDurationMs, unit: "ms" })}
                        `
    })}

                    ${f.renderGroup({
      id: "st_group_atmosphere",
      title: "氛围",
      icon: "fa-cloud-sun-rain",
      contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-cloud-sun-rain"></i>天气</div>
                            ${f.renderSelect({
        id: "st_weather_type",
        label: "天气",
        options: F.map((t) => ({ value: t, label: dt[t], selected: this.settings.weather.type === t }))
      })}
                            ${f.renderSelect({
        id: "st_weather_density",
        label: "密度",
        options: [
          { value: "low", label: "稀疏", selected: this.settings.weather.density === "low" },
          { value: "medium", label: "适中", selected: this.settings.weather.density === "medium" },
          { value: "high", label: "密集", selected: this.settings.weather.density === "high" }
        ]
      })}
                            ${f.renderSlider({ id: "st_weather_speed", valId: "st_weather_speed_val", label: "速度", min: 5, max: 25, step: 1, value: Math.round(this.settings.weather.speed * 10), unit: "x" })}
                            ${f.renderSlider({ id: "st_weather_opacity", valId: "st_weather_opacity_val", label: "不透明", min: 10, max: 100, step: 5, value: Math.round(this.settings.weather.opacity * 100), unit: "%" })}
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-chart-simple"></i>动效</div>
                            ${f.renderSelect({
        id: "st_visualizer_mode",
        label: "律动",
        options: [
          { value: "off", label: "关闭", selected: this.settings.visualizer.mode === "off" },
          { value: "pulse", label: "呼吸", selected: this.settings.visualizer.mode === "pulse" },
          { value: "spectrum", label: "频谱", selected: this.settings.visualizer.mode === "spectrum" }
        ]
      })}
                            ${f.renderSlider({ id: "st_visualizer_sens", valId: "st_visualizer_sens_val", label: "灵敏度", min: 5, max: 25, step: 1, value: Math.round(this.settings.visualizer.sensitivity * 10), unit: "x" })}
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_parallax_enabled", label: "景深视差", checked: this.settings.parallax.enabled })}
                            </div>
                            ${f.renderSlider({ id: "st_parallax_intensity", valId: "st_parallax_intensity_val", label: "深度", min: 1, max: 10, step: 1, value: Math.round(this.settings.parallax.intensity * 10), unit: "" })}
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-fire"></i>音效</div>
                            ${f.renderSelect({
        id: "st_ambient_type",
        label: "音效",
        options: [
          { value: "off", label: "关闭", selected: this.settings.ambientSound.type === "off" },
          { value: "rain", label: "雨声", selected: this.settings.ambientSound.type === "rain" },
          { value: "fire", label: "壁炉", selected: this.settings.ambientSound.type === "fire" },
          { value: "wind", label: "风声", selected: this.settings.ambientSound.type === "wind" }
        ]
      })}
                            ${f.renderSlider({ id: "st_ambient_vol", valId: "st_ambient_vol_val", label: "音量", min: 0, max: 100, step: 5, value: Math.round(this.settings.ambientSound.volume * 100), unit: "%" })}
                        `
    })}

                    ${f.renderGroup({
      id: "st_group_audio",
      title: "声音",
      icon: "fa-volume-high",
      contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-volume-high"></i>音乐</div>
                            ${f.renderSlider({ id: "st_audio_volume", valId: "st_audio_volume_val", label: "音量", min: 0, max: 100, step: 1, value: Math.round(this.settings.volume * 100), unit: "%" })}
                            ${f.renderSelect({
        id: "st_playback_mode",
        label: "模式",
        options: [
          { value: "loop", label: "列表循环", selected: this.settings.playbackMode === "loop" },
          { value: "single", label: "单曲循环", selected: this.settings.playbackMode === "single" },
          { value: "shuffle", label: "随机播放", selected: this.settings.playbackMode === "shuffle" }
        ]
      })}
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_audio_mute", label: "静音", checked: this.settings.muted })}
                                ${f.renderCheckbox({ id: "st_audio_muffle", label: "沉浸低通", checked: this.settings.muffleBGM })}
                                ${f.renderCheckbox({ id: "st_audio_blur", label: "后台暂停", checked: this.settings.pauseOnBlur })}
                                ${f.renderCheckbox({ id: "st_mini_player_toggle", label: "悬浮胶囊", checked: this.settings.showMiniPlayer })}
                                ${f.renderCheckbox({ id: "st_capsule_on_play", label: "播放时显示", checked: this.settings.capsuleOnPlayOnly, sub: !0 })}
                            </div>
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-rotate"></i>轮播</div>
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_bgm_auto_advance", label: "自动轮播", checked: this.settings.bgmAutoAdvance.enabled })}
                            </div>
                            <div class="st-bgloader-preset-row" id="st_bgm_auto_advance_row" ${this.settings.bgmAutoAdvance.enabled ? "" : 'style="display:none;"'}>
                                <label for="st_bgm_auto_advance_min">轮播间隔:</label>
                                <input type="number" id="st_bgm_auto_advance_min" class="text_pole" min="1" max="60" step="1" value="${Math.max(1, Math.round(this.settings.bgmAutoAdvance.intervalSec / 60))}" />
                                <label>分</label>
                            </div>
                            ${f.renderSlider({ id: "st_bgm_auto_advance_fade", valId: "st_bgm_auto_advance_fade_val", label: "淡入淡出", min: 0, max: 2e3, step: 100, value: this.settings.bgmAutoAdvance.fadeMs, unit: " ms" })}
                        `
    })}

                    ${f.renderGroup({
      id: "st_group_auto",
      title: "自动化",
      icon: "fa-bolt",
      contentHtml: `
                            <div class="st-bgloader-trigger-list" id="st_trigger_list"></div>
                            <div class="st-bgloader-trigger-form" id="st_trigger_form" style="display: none;">
                                ${f.renderSelect({
        id: "st_trigger_type",
        label: "类型",
        options: [
          { value: "character", label: "角色" },
          { value: "chat", label: "聊天" },
          { value: "regex", label: "正则" }
        ]
      })}
                                <div class="st-bgloader-preset-row">
                                    <label>规则:</label>
                                    <input type="text" id="st_trigger_name" class="text_pole" placeholder="名称" />
                                </div>
                                <div class="st-bgloader-preset-row">
                                    <label>匹配:</label>
                                    <input type="text" id="st_trigger_pattern" class="text_pole" placeholder="匹配文本" />
                                </div>
                                <div class="st-bgloader-btn-row">
                                    ${f.renderButton({ id: "st_trigger_confirm_btn", icon: "fa-check", label: "添加" })}
                                    ${f.renderButton({ id: "st_trigger_cancel_btn", label: "取消" })}
                                </div>
                            </div>
                            ${f.renderButton({ id: "st_trigger_add_btn", variant: "full", icon: "fa-plus", label: "添加" })}
                        `
    })}

                    ${f.renderGroup({
      id: "st_group_system",
      title: "系统",
      icon: "fa-gear",
      contentHtml: `
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-file-export"></i>存储</div>
                            <div class="st-bgloader-row-between">
                                <div>已用: <strong id="st_cache_used">0 MB</strong> <span id="st_cache_count">0</span>项</div>
                                ${f.renderButton({ id: "st_cache_clear_btn", variant: "danger", label: "清空" })}
                            </div>
                            ${f.renderSlider({ id: "st_cache_quota", valId: "st_cache_quota_val", label: "配额", min: 128, max: 8192, step: 128, value: this.settings.cacheQuotaMB, unit: " MB" })}
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_cache_autoclean", label: "自动清理", checked: this.settings.lruAutoClean })}
                            </div>
                            <div class="st-bgloader-btn-row">
                                ${f.renderButton({ id: "st_backup_export_btn", icon: "fa-download", label: "导出" })}
                                <label for="st_backup_import_file" class="menu_button">
                                    <i class="fa-solid fa-upload"></i> 导入
                                    <input type="file" id="st_backup_import_file" class="st-bgloader-hidden" accept=".json" />
                                </label>
                            </div>
                            <div class="st-bgloader-group-subtitle"><i class="fa-solid fa-cloud"></i>云端</div>
                            <div id="st_authority_section" class="st-bgloader-cloud-note"></div>
                            <div id="st_cloud_status_text" class="st-bgloader-cloud-note"></div>
                            <div class="st-bgloader-check-stack">
                                ${f.renderCheckbox({ id: "st_agent_tools_enable", label: "Agent导演", checked: this.settings.agentToolsEnabled })}
                            </div>
                        `
    })}
                </div>
            </div>
        `;
  }
  bindEvents() {
    if (!this.panel) return;
    this.panel.querySelectorAll(".st-bgloader-tab-btn").forEach((p) => {
      p.addEventListener("click", () => {
        const m = p.dataset.tab;
        if (!m) return;
        this.activeTab = m, this.panel?.querySelectorAll(".st-bgloader-tab-btn").forEach((_) => _.classList.remove("active")), p.classList.add("active"), this.panel?.querySelectorAll(".st-bgloader-tab-content").forEach((_) => _.classList.remove("active"));
        const b = this.panel?.querySelector(`#st_tab_${m}`);
        b && b.classList.add("active");
      });
    }), this.panel.querySelector("#st_topbar_bg_vis_btn")?.addEventListener("click", () => {
      const m = !(this.callbacks.getBackgroundVisible?.() ?? this.settings.backgroundVisible ?? !0);
      this.callbacks.onBackgroundVisibilityChanged?.(m), this.syncBackgroundVisible(m);
    }), this.panel.querySelector("#st_topbar_bg_clear_btn")?.addEventListener("click", () => {
      this.callbacks.onClearActiveBackground?.();
    }), this.panel.querySelector("#st_topbar_drawer_close")?.addEventListener("click", () => {
      w.getInstance().closeBackgroundDrawer();
    });
    const s = this.panel.querySelector("#st_topbar_search");
    s?.addEventListener("input", () => {
      this.searchQuery = s.value.trim().toLowerCase(), this.searchDebounceTimer !== null && window.clearTimeout(this.searchDebounceTimer), this.searchDebounceTimer = window.setTimeout(() => {
        this.searchDebounceTimer = null, this.refreshMediaGrid();
      }, 250);
    }), f.bindSegmented(this.panel, (p) => {
      this.typeFilter = p || "all", this.settings.libraryView || (this.settings.libraryView = { sortOrder: this.sortOrder, typeFilter: "all" }), this.settings.libraryView.typeFilter = this.typeFilter, this.save(), this.refreshMediaGrid();
    }), f.bindGroups(this.panel, {
      st_group_visual: !0,
      st_group_atmosphere: !1,
      st_group_audio: !1,
      st_group_auto: !1,
      st_group_system: !1
    }), this.panel.querySelector("#st_topbar_multiselect_btn")?.addEventListener("click", () => this.setMultiSelectMode(!this.multiSelectMode)), this.panel.querySelector("#st_multiselect_delete_btn")?.addEventListener("click", () => {
      this.bulkDeleteSelected();
    }), this.panel.querySelector("#st_multiselect_first_btn")?.addEventListener("click", () => {
      this.applyFirstSelected();
    }), this.panel.querySelector("#st_multiselect_random_btn")?.addEventListener("click", () => {
      this.applyRandomSelected();
    }), this.panel.querySelector("#st_multiselect_exit_btn")?.addEventListener("click", () => this.setMultiSelectMode(!1));
    const r = this.panel.querySelector("#st_topbar_scene_quick");
    r?.addEventListener("change", () => {
      r.value && this.callbacks.onSceneApplied?.(r.value);
    });
    const o = this.panel.querySelector("#st_topbar_sort");
    o?.addEventListener("change", () => {
      this.sortOrder = o.value || "name", this.settings.libraryView || (this.settings.libraryView = { sortOrder: "name", typeFilter: this.typeFilter }), this.settings.libraryView.sortOrder = this.sortOrder, this.save(), this.refreshMediaGrid();
    });
    const c = this.panel.querySelector("#st_topbar_upload_toggle_btn"), h = this.panel.querySelector("#st_topbar_upload_box");
    c?.addEventListener("click", () => {
      if (!h) return;
      const p = h.style.display === "none";
      h.style.display = p ? "block" : "none", c.classList.toggle("active", p);
    });
    const l = this.panel.querySelector("#st_bgloader_dropzone"), u = this.panel.querySelector("#st_bgloader_file_input");
    l?.addEventListener("click", () => u?.click()), l?.addEventListener("keydown", (p) => {
      const m = p.key;
      (m === "Enter" || m === " ") && (p.preventDefault(), u?.click());
    }), l?.addEventListener("dragover", (p) => {
      p.preventDefault(), l.classList.add("dragover");
    }), l?.addEventListener("dragleave", () => l.classList.remove("dragover")), l?.addEventListener("drop", (p) => {
      p.preventDefault(), l.classList.remove("dragover");
      const m = p.dataTransfer?.files;
      m && m.length > 0 && this.handleFileUpload(m[0]);
    }), u?.addEventListener("change", () => {
      u.files && u.files.length > 0 && this.handleFileUpload(u.files[0]);
    });
    const g = this.panel.querySelector("#st_bgloader_url_btn"), d = this.panel.querySelector("#st_bgloader_url_input");
    g?.addEventListener("click", () => {
      const p = d?.value.trim();
      p && (this.handleUrlImport(p), d && (d.value = ""));
    }), this.bindSettingsFormEvents();
  }
  bindSettingsFormEvents() {
    if (!this.panel) return;
    const e = (y, k, D, A) => {
      this.panel && f.bindRafSlider(this.panel, y, k, D, A);
    };
    e("st_filter_blur", "st_filter_blur_val", "px", (y) => {
      this.settings.filters.blur = y, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_brightness", "st_filter_brightness_val", "%", (y) => {
      this.settings.filters.brightness = y, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_opacity", "st_filter_opacity_val", "%", (y) => {
      this.settings.filters.opacity = y, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    }), e("st_filter_saturate", "st_filter_saturate_val", "%", (y) => {
      this.settings.filters.saturate = y, this.callbacks.onPresetChanged({ id: "custom", name: "Custom", filters: this.settings.filters }), this.save();
    });
    const t = this.panel.querySelector("#st_bg_interactive");
    t?.addEventListener("change", () => {
      this.settings.interactiveBackground = t.checked, this.callbacks.onInteractiveChanged(t.checked), this.save();
    });
    const i = this.panel.querySelector("#st_weather_type"), s = this.panel.querySelector("#st_weather_density"), a = () => {
      i && (this.settings.weather.type = i.value), s && (this.settings.weather.density = s.value), this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    };
    i?.addEventListener("change", a), s?.addEventListener("change", a), e("st_weather_speed", "st_weather_speed_val", "x", (y) => {
      this.settings.weather.speed = y / 10, this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    }), e("st_weather_opacity", "st_weather_opacity_val", "%", (y) => {
      this.settings.weather.opacity = y / 100, this.callbacks.onWeatherChanged?.(this.settings.weather), this.save();
    });
    const r = this.panel.querySelector("#st_visualizer_mode");
    r?.addEventListener("change", () => {
      this.settings.visualizer.mode = r.value, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.save();
    }), e("st_visualizer_sens", "st_visualizer_sens_val", "x", (y) => {
      this.settings.visualizer.sensitivity = y / 10, this.callbacks.onVisualizerChanged?.(this.settings.visualizer), this.save();
    });
    const o = this.panel.querySelector("#st_parallax_enabled");
    o?.addEventListener("change", () => {
      this.settings.parallax.enabled = o.checked, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.save();
    }), e("st_parallax_intensity", "st_parallax_intensity_val", "", (y) => {
      this.settings.parallax.intensity = y / 10, this.callbacks.onParallaxChanged?.(this.settings.parallax), this.save();
    });
    const c = this.panel.querySelector("#st_ambient_type");
    c?.addEventListener("change", () => {
      this.settings.ambientSound.type = c.value, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.save();
    }), e("st_ambient_vol", "st_ambient_vol_val", "%", (y) => {
      this.settings.ambientSound.volume = y / 100, this.callbacks.onAmbientSoundChanged?.(this.settings.ambientSound), this.save();
    });
    const h = this.panel.querySelector("#st_frosted_enabled");
    h?.addEventListener("change", () => {
      this.settings.frostedChat.enabled = h.checked, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    }), e("st_frosted_blur", "st_frosted_blur_val", "px", (y) => {
      this.settings.frostedChat.blur = y, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    }), e("st_frosted_opacity", "st_frosted_opacity_val", "%", (y) => {
      this.settings.frostedChat.opacity = y, this.callbacks.onFrostedChatChanged?.(this.settings.frostedChat), this.save();
    });
    const l = this.panel.querySelector("#st_transition_effect");
    l?.addEventListener("change", () => {
      this.settings.transitionEffect = l.value, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.save();
    }), e("st_transition_dur", "st_transition_dur_val", "ms", (y) => {
      this.settings.transitionDurationMs = y, this.callbacks.onTransitionChanged?.(this.settings.transitionEffect, this.settings.transitionDurationMs), this.save();
    }), e("st_audio_volume", "st_audio_volume_val", "%", (y) => {
      this.settings.volume = y / 100, this.save();
    });
    const u = this.panel.querySelector("#st_playback_mode");
    u?.addEventListener("change", () => {
      this.settings.playbackMode = u.value, this.callbacks.onPlaybackModeChanged(this.settings.playbackMode), this.save();
    });
    const g = this.panel.querySelector("#st_audio_mute");
    g?.addEventListener("change", () => {
      this.settings.muted = g.checked, this.save();
    });
    const d = this.panel.querySelector("#st_audio_muffle");
    d?.addEventListener("change", () => {
      this.settings.muffleBGM = d.checked, this.callbacks.onMuffleChanged?.(d.checked), this.save();
    });
    const p = this.panel.querySelector("#st_bgm_auto_advance");
    p?.addEventListener("change", () => {
      this.settings.bgmAutoAdvance.enabled = p.checked;
      const y = this.panel?.querySelector("#st_bgm_auto_advance_row");
      y && (y.style.display = p.checked ? "" : "none"), this.save();
    });
    const m = this.panel.querySelector("#st_bgm_auto_advance_min");
    m?.addEventListener("change", () => {
      const y = Math.max(1, Math.min(60, Math.floor(Number(m.value) || 1)));
      m.value = String(y), this.settings.bgmAutoAdvance.intervalSec = y * 60, this.save();
    }), e("st_bgm_auto_advance_fade", "st_bgm_auto_advance_fade_val", " ms", (y) => {
      this.settings.bgmAutoAdvance.fadeMs = y, this.save();
    });
    const b = this.panel.querySelector("#st_audio_blur");
    b?.addEventListener("change", () => {
      this.settings.pauseOnBlur = b.checked, this.save();
    });
    const _ = this.panel.querySelector("#st_mini_player_toggle");
    _?.addEventListener("change", () => {
      this.settings.showMiniPlayer = _.checked, this.callbacks.onMiniPlayerToggle(_.checked), this.save();
    });
    const v = this.panel.querySelector("#st_capsule_on_play");
    v?.addEventListener("change", () => {
      this.settings.capsuleOnPlayOnly = v.checked, this.callbacks.onCapsuleOnPlayToggle?.(v.checked), this.save();
    }), e("st_cache_quota", "st_cache_quota_val", " MB", (y) => {
      this.settings.cacheQuotaMB = y, this.save();
    });
    const T = this.panel.querySelector("#st_cache_autoclean");
    T?.addEventListener("change", () => {
      this.settings.lruAutoClean = T.checked, this.save();
    }), this.panel.querySelector("#st_cache_clear_btn")?.addEventListener("click", async () => {
      await this.cacheManager.clearAll(), this.updateCacheStats(), this.refreshMediaGrid();
    }), this.panel.querySelector("#st_backup_export_btn")?.addEventListener("click", () => {
      const y = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.settings, null, 2)), k = document.createElement("a");
      k.setAttribute("href", y), k.setAttribute("download", `st-bgloader-backup-${Date.now()}.json`), document.body.appendChild(k), k.click(), k.remove();
    }), this.panel.querySelector("#st_backup_import_file")?.addEventListener("change", (y) => {
      const k = y.target.files?.[0];
      if (!k) return;
      const D = new FileReader();
      D.onload = (A) => {
        try {
          const C = JSON.parse(A.target?.result);
          this.settings = j({ ...this.settings, ...C }), this.save(), this.syncFormControls();
        } catch {
          w.getInstance().alertDialog("导入失败：不是有效的 JSON 配置文件");
        }
      }, D.readAsText(k);
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
      const r = this.panel?.querySelector(`#${t}`), o = this.panel?.querySelector(`#${i}`);
      r && (r.value = String(s)), o && (o.textContent = `${s}${a}`);
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
    const e = (o, c) => {
      const h = this.panel?.querySelector(`#${o}`);
      h && (h.value = c);
    }, t = (o, c, h, l) => {
      const u = this.panel?.querySelector(`#${o}`), g = this.panel?.querySelector(`#${c}`);
      u && (u.value = String(h)), g && (g.textContent = `${h}${l}`);
    }, i = (o, c) => {
      const h = this.panel?.querySelector(`#${o}`);
      h && (h.checked = c);
    };
    e("st_weather_type", this.settings.weather.type), e("st_weather_density", this.settings.weather.density), t("st_weather_speed", "st_weather_speed_val", Math.round(this.settings.weather.speed * 10), "x"), t("st_weather_opacity", "st_weather_opacity_val", Math.round(this.settings.weather.opacity * 100), "%"), e("st_visualizer_mode", this.settings.visualizer.mode), t("st_visualizer_sens", "st_visualizer_sens_val", Math.round(this.settings.visualizer.sensitivity * 10), "x"), i("st_parallax_enabled", this.settings.parallax.enabled), t("st_parallax_intensity", "st_parallax_intensity_val", Math.round(this.settings.parallax.intensity * 10), ""), e("st_ambient_type", this.settings.ambientSound.type), t("st_ambient_vol", "st_ambient_vol_val", Math.round(this.settings.ambientSound.volume * 100), "%"), i("st_frosted_enabled", this.settings.frostedChat.enabled), t("st_frosted_blur", "st_frosted_blur_val", this.settings.frostedChat.blur, "px"), t("st_frosted_opacity", "st_frosted_opacity_val", this.settings.frostedChat.opacity, "%"), e("st_transition_effect", this.settings.transitionEffect), t("st_transition_dur", "st_transition_dur_val", this.settings.transitionDurationMs, "ms"), t("st_audio_volume", "st_audio_volume_val", Math.round(this.settings.volume * 100), "%"), e("st_playback_mode", this.settings.playbackMode), i("st_audio_mute", this.settings.muted), i("st_audio_muffle", this.settings.muffleBGM), i("st_audio_blur", this.settings.pauseOnBlur), i("st_bgm_auto_advance", this.settings.bgmAutoAdvance.enabled);
    const s = this.panel.querySelector("#st_bgm_auto_advance_row");
    s && (s.style.display = this.settings.bgmAutoAdvance.enabled ? "" : "none");
    const a = this.panel.querySelector("#st_bgm_auto_advance_min");
    a && (a.value = String(Math.max(1, Math.round(this.settings.bgmAutoAdvance.intervalSec / 60)))), t("st_bgm_auto_advance_fade", "st_bgm_auto_advance_fade_val", this.settings.bgmAutoAdvance.fadeMs, " ms"), i("st_mini_player_toggle", this.settings.showMiniPlayer), i("st_capsule_on_play", this.settings.capsuleOnPlayOnly), t("st_cache_quota", "st_cache_quota_val", this.settings.cacheQuotaMB, " MB"), i("st_cache_autoclean", this.settings.lruAutoClean), i("st_agent_tools_enable", this.settings.agentToolsEnabled);
    for (const o of Array.from(this.panel.querySelectorAll("#st_topbar_type_seg .st-bgloader-seg-btn")))
      o.classList.toggle("active", o.dataset.segValue === this.typeFilter);
    const r = this.panel?.querySelector("#st_topbar_sort");
    r && (r.value = this.sortOrder);
  }
  /**
   * rAF 合帧入口（L1-MR-9）：同一帧内到达的多次失效（上传→挂载→配额清扫的连发，
   * 或删除→统计的连发）只触发一次网格重建。调用方签名不变（返回共享的 pending）。
   */
  refreshMediaGrid() {
    return this.refreshPending ? this.refreshPending : (this.refreshPending = new Promise((e) => {
      requestAnimationFrame(() => {
        this.refreshPending = null, e(this.refreshMediaGridNow());
      });
    }), this.refreshPending);
  }
  refreshPending = null;
  async refreshMediaGridNow() {
    const e = this.panel?.querySelector("#st_bgloader_grid");
    if (!e) return;
    const t = ++this.refreshGeneration;
    let i = await this.cacheManager.listMedia();
    if (t !== this.refreshGeneration) return;
    if (this.typeFilter !== "all" && (i = i.filter((a) => this.typeFilter === "doc" ? a.type === "html" || a.type === "svg" : a.type === this.typeFilter)), this.searchQuery && (i = i.filter((a) => a.name.toLowerCase().includes(this.searchQuery))), this.sortOrder === "time" ? i.sort((a, r) => (r.addedTimestamp || 0) - (a.addedTimestamp || 0)) : this.sortOrder === "size" ? i.sort((a, r) => (r.size || 0) - (a.size || 0)) : i.sort((a, r) => a.name.localeCompare(r.name)), this.lastGridItems = i, i.length === 0) {
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
    if (i.forEach((a) => {
      const r = document.createElement("div"), o = this.settings.activeMediaId === a.id;
      r.className = `st-bgloader-media-card ${o ? "active" : ""}`, r.title = a.name, r.dataset.itemId = a.id;
      let c = "fa-file-image";
      a.type === "video" && (c = "fa-file-video"), a.type === "audio" && (c = "fa-file-audio"), (a.type === "html" || a.type === "svg") && (c = "fa-file-code");
      const h = a.type === "image" ? `<div class="st-bgloader-card-img" data-lazy-image="${S(a.url)}"></div>` : a.type === "video" ? `<div class="st-bgloader-card-img st-bgloader-card-img-pending" data-lazy-thumb="${S(a.id)}"></div>` : `<div class="st-bgloader-card-icon"><i class="fa-solid ${c} fa-2x"></i></div>`, l = a.name.replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim() || a.name;
      r.innerHTML = `
                ${h}
                <div class="st-bgloader-card-info">
                    <div class="st-bgloader-card-name">${S(l)}</div>
                    <div class="st-bgloader-card-meta">
                        <span class="st-bg-native-badge ${a.type}">${a.type.toUpperCase()}</span>
                        ${o ? '<span class="st-bgloader-active-tag"><i class="fa-solid fa-check"></i> 当前</span>' : ""}
                    </div>
                </div>
                <button type="button" class="st-bgloader-media-delete st-card-delete" title="删除" aria-label="删除 ${S(a.name)}"><i class="fa-solid fa-trash"></i></button>
            `, r.querySelector(".st-card-delete")?.addEventListener("click", async (u) => {
        if (u.stopPropagation(), await w.getInstance().confirmDialog("确认删除？")) {
          try {
            await this.cacheManager.deleteMedia(a.id), this.thumbCache.delete(a.id), await this.callbacks.onMediaDeleted(a.id);
          } catch (g) {
            console.error("[ST-BgLoader] 删除媒体失败:", g);
          }
          this.refreshMediaGrid(), this.updateCacheStats();
        }
      }), r.addEventListener("click", () => {
        if (this.multiSelectMode) {
          const u = r.dataset.itemId;
          if (!u) return;
          this.selectedIds.has(u) ? this.selectedIds.delete(u) : this.selectedIds.add(u), this.syncCardSelection(r), this.syncMultiSelectCount();
          return;
        }
        this.reportMediaAction(this.callbacks.onMediaSelected(a), "应用媒体失败");
      }), r.tabIndex = 0, r.setAttribute("role", "button"), r.setAttribute("aria-label", `应用媒体 ${a.name}`), r.addEventListener("keydown", (u) => {
        const g = u.key;
        if (g === "Enter" || g === " ") {
          u.preventDefault(), this.reportMediaAction(this.callbacks.onMediaSelected(a), "应用媒体失败");
          return;
        }
        if (g !== "ArrowRight" && g !== "ArrowLeft" && g !== "ArrowUp" && g !== "ArrowDown") return;
        u.preventDefault();
        const d = Array.from(e.querySelectorAll(".st-bgloader-media-card")), p = d.indexOf(r), m = getComputedStyle(e).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
        let b = p;
        g === "ArrowRight" ? b = p + 1 : g === "ArrowLeft" ? b = p - 1 : g === "ArrowUp" ? b = p - m : b = p + m, b >= 0 && b < d.length && d[b].focus();
      }), s.appendChild(r);
    }), e.appendChild(s), this.observeGridLazyLoad(e), this.multiSelectMode) {
      for (const a of Array.from(e.querySelectorAll(".st-bgloader-media-card")))
        this.syncCardSelection(a);
      this.syncMultiSelectCount();
    }
  }
  /**
   * 懒挂载（定案：懒加载+窗口化）：卡片进入视口 200px 前瞻带才写预览背景或生成视频
   * 抽帧；离屏渲染由 CSS content-visibility 跳过。老宿主无 IntersectionObserver 时
   * 降级为构建后直接全量 hydrate（功能不变，只是放弃懒优化）。
   */
  observeGridLazyLoad(e) {
    this.gridObserver?.disconnect();
    const t = Array.from(e.querySelectorAll(".st-bgloader-media-card"));
    if (!("IntersectionObserver" in window)) {
      for (const i of t) this.hydrateCardPreview(i);
      return;
    }
    this.gridObserver = new IntersectionObserver((i) => {
      for (const s of i) {
        if (!s.isIntersecting) continue;
        const a = s.target;
        this.gridObserver?.unobserve(a), this.hydrateCardPreview(a);
      }
    }, { rootMargin: "200px 0px" });
    for (const i of t) this.gridObserver.observe(i);
  }
  /** 写入单卡预览：图片直接落背景，视频进入既有 LRU 抽帧管线（生成后按 id 回填）。 */
  hydrateCardPreview(e) {
    const t = e.querySelector(".st-bgloader-card-img");
    if (!t) return;
    const i = t.dataset.lazyImage;
    if (i) {
      t.style.backgroundImage = `url('${i}')`, delete t.dataset.lazyImage;
      return;
    }
    const s = t.dataset.lazyThumb;
    if (!s) return;
    delete t.dataset.lazyThumb;
    const a = this.lastGridItems?.find((r) => r.id === s);
    a && this.getVideoThumbnail(a).then((r) => {
      if (!r || !this.panel) return;
      const o = this.panel?.querySelector(
        `#st_bgloader_grid .st-bgloader-media-card[data-item-id="${CSS.escape(a.id)}"] .st-bgloader-card-img`
      );
      o && (o.style.backgroundImage = `url('${r}')`, o.classList.remove("st-bgloader-card-img-pending"));
    });
  }
  /** 多选批量模式切换（会话内视图态）：进出时同步操作条显隐与卡片角标。 */
  setMultiSelectMode(e) {
    this.multiSelectMode = e, e || this.selectedIds.clear();
    const t = this.panel?.querySelector("#st_bgloader_multiselect_bar");
    t && (t.hidden = !e);
    const i = this.panel?.querySelector("#st_topbar_multiselect_btn");
    i && i.classList.toggle("active", e);
    for (const s of Array.from(this.panel?.querySelectorAll(".st-bgloader-media-card") ?? []))
      this.syncCardSelection(s);
    this.syncMultiSelectCount();
  }
  syncCardSelection(e) {
    const t = e.dataset.itemId, i = this.multiSelectMode && !!t && this.selectedIds.has(t);
    e.classList.toggle("selected", i);
    const s = e.querySelector(".st-bgloader-select-mark");
    if (i && !s) {
      const a = document.createElement("div");
      a.className = "st-bgloader-select-mark", a.innerHTML = '<i class="fa-solid fa-check"></i>', e.appendChild(a);
    } else !i && s && s.remove();
  }
  syncMultiSelectCount() {
    const e = this.panel?.querySelector("#st_multiselect_count");
    e && (e.textContent = `已选 ${this.selectedIds.size}`);
  }
  async findItemById(e) {
    return (await this.cacheManager.listMedia()).find((t) => t.id === e);
  }
  async applyFirstSelected() {
    const e = Array.from(this.selectedIds)[0];
    if (!e) return;
    const t = await this.findItemById(e);
    t && this.reportMediaAction(this.callbacks.onMediaSelected(t), "应用媒体失败");
  }
  async applyRandomSelected() {
    const e = Array.from(this.selectedIds);
    if (e.length === 0) return;
    const t = e[Math.floor(Math.random() * e.length)], i = await this.findItemById(t);
    i && this.reportMediaAction(this.callbacks.onMediaSelected(i), "应用媒体失败");
  }
  async bulkDeleteSelected() {
    const e = Array.from(this.selectedIds);
    if (e.length === 0 || !await w.getInstance().confirmDialog(`删除 ${e.length} 个媒体？`)) return;
    let i = 0;
    for (const s of e)
      try {
        await this.cacheManager.deleteMedia(s), this.thumbCache.delete(s), await this.callbacks.onMediaDeleted(s), this.selectedIds.delete(s);
      } catch (a) {
        i++, console.error("[ST-BgLoader] 批量删除失败:", s, a);
      }
    i > 0 && w.getInstance().alertDialog(`批量删除完成，失败 ${i} 个`), this.refreshMediaGrid(), this.updateCacheStats();
  }
  async getVideoThumbnail(e) {
    const t = this.thumbCache.get(e.id);
    if (t) return t;
    const i = this.thumbInflight.get(e.id);
    if (i) return i;
    const s = this.makeVideoThumb(e).then((a) => {
      if (a && (this.thumbCache.delete(e.id), this.thumbCache.set(e.id, a), this.thumbCache.size > xe.THUMB_CACHE_CAP)) {
        const r = this.thumbCache.keys().next().value;
        r !== void 0 && this.thumbCache.delete(r);
      }
      return a;
    }).finally(() => this.thumbInflight.delete(e.id));
    return this.thumbInflight.set(e.id, s), s;
  }
  makeVideoThumb(e) {
    return new Promise((t) => {
      let i = null, s = !1;
      const a = (l) => {
        s || (s = !0, window.clearTimeout(r), i && (i.removeEventListener("loadeddata", o), i.removeEventListener("seeked", c), i.removeEventListener("error", h), i.removeAttribute("src"), i.load(), i.remove(), i = null), t(l));
      }, r = window.setTimeout(() => a(null), 8e3), o = () => {
        try {
          const l = i && Number.isFinite(i.duration) ? Math.min(0.5, i.duration / 3) : 0.1;
          i.currentTime = l;
        } catch {
          a(null);
        }
      }, c = () => {
        try {
          const l = document.createElement("canvas");
          l.width = 240, l.height = 135, l.getContext("2d").drawImage(i, 0, 0, 240, 135), a(l.toDataURL("image/jpeg", 0.6));
        } catch {
          a(null);
        }
      }, h = () => a(null);
      this.cacheManager.getMediaBlobUrl(e).then((l) => {
        s || (i = document.createElement("video"), i.muted = !0, i.preload = "metadata", i.style.display = "none", i.addEventListener("loadeddata", o), i.addEventListener("seeked", c), i.addEventListener("error", h), document.body.appendChild(i), i.src = l);
      }).catch(() => a(null));
    });
  }
  async handleFileUpload(e) {
    try {
      const t = P(e.name), i = await this.cacheManager.saveMedia(
        e,
        e.name,
        t,
        "server"
      );
      this.callbacks.onMediaUploaded(i), this.refreshMediaGrid(), this.updateCacheStats();
    } catch (t) {
      console.error("[ST-BgLoader] Upload failed:", t), w.getInstance().alertDialog(`上传失败: ${t.message}`);
    }
  }
  async handleUrlImport(e) {
    try {
      const t = e.substring(e.lastIndexOf("/") + 1).split("?")[0] || "remote_media", i = P(t), s = await this.cacheManager.saveMedia(
        new Blob([]),
        t,
        i,
        "url",
        e
      );
      this.callbacks.onMediaUploaded(s), this.refreshMediaGrid(), this.updateCacheStats();
    } catch (t) {
      console.error("[ST-BgLoader] URL Import failed:", t), w.getInstance().alertDialog(`URL 导入失败: ${t.message}`);
    }
  }
  updatePresetSelect() {
    const e = this.panel?.querySelector("#st_preset_select");
    if (!e) return;
    e.innerHTML = "", Object.values(G).forEach((s) => {
      const a = document.createElement("option");
      a.value = s.id, a.textContent = s.name, a.selected = this.settings.activePresetId === s.id, e.appendChild(a);
    }), Object.entries(this.settings.userPresets || {}).forEach(([s, a]) => {
      const r = document.createElement("option");
      r.value = s, r.textContent = `⭐ ${s}`, r.selected = this.settings.activePresetId === s, e.appendChild(r);
    }), e.onchange = () => {
      const s = e.value;
      this.settings.activePresetId = s;
      const a = G[s]?.filters || this.settings.userPresets?.[s];
      a && (this.settings.filters = { ...a }, this.updateFilterSliders(), this.callbacks.onPresetChanged({ id: s, name: s, filters: this.settings.filters }), this.save());
    };
    const t = this.panel?.querySelector("#st_preset_save_btn");
    t && (t.onclick = async () => {
      const s = await w.getInstance().promptDialog("预设名称");
      s && (this.settings.userPresets || (this.settings.userPresets = {}), this.settings.userPresets[s] = { ...this.settings.filters }, this.settings.activePresetId = s, this.save(), this.updatePresetSelect());
    });
    const i = this.panel?.querySelector("#st_preset_del_btn");
    i && (i.onclick = () => {
      const s = e.value;
      if (G[s]) {
        w.getInstance().alertDialog("无法删除内置预设");
        return;
      }
      this.settings.userPresets?.[s] && (delete this.settings.userPresets[s], this.settings.activePresetId = "default", this.settings.filters = { ...G.default.filters }, this.updateFilterSliders(), this.save(), this.updatePresetSelect());
    });
  }
  updateSceneSelect() {
    const e = this.panel?.querySelector("#st_scene_select"), t = this.panel?.querySelector("#st_topbar_scene_quick"), i = (h, l) => {
      if (h) {
        if (h.innerHTML = "", l !== void 0) {
          const u = document.createElement("option");
          u.value = "", u.textContent = l, h.appendChild(u);
        }
        Object.values(se).forEach((u) => {
          const g = document.createElement("option");
          g.value = u.id, g.textContent = u.name, g.selected = this.settings.activeSceneId === u.id, h.appendChild(g);
        }), Object.entries(this.settings.scenes || {}).forEach(([u, g]) => {
          const d = document.createElement("option");
          d.value = u, d.textContent = `⭐ ${g.name}`, d.selected = this.settings.activeSceneId === u, h.appendChild(d);
        });
      }
    };
    i(e), i(t, "场景");
    const s = this.panel?.querySelector("#st_scene_apply_btn");
    s && (s.onclick = () => {
      const h = this.panel?.querySelector("#st_scene_select")?.value ?? "";
      this.callbacks.onSceneApplied?.(h);
    });
    const a = this.panel?.querySelector("#st_scene_save_btn");
    a && (a.onclick = async () => {
      const h = await w.getInstance().promptDialog("场景名称");
      if (!h) return;
      const l = "scene_" + Date.now();
      this.settings.scenes || (this.settings.scenes = {}), this.settings.scenes[l] = {
        id: l,
        name: h,
        presetId: this.settings.activePresetId,
        weather: { ...this.settings.weather },
        visualizer: { ...this.settings.visualizer },
        parallax: { ...this.settings.parallax },
        ambientSound: { ...this.settings.ambientSound },
        frostedChat: this.settings.frostedChat.enabled,
        isBuiltin: !1
      }, this.settings.activeSceneId = l, this.save(), this.updateSceneSelect();
    });
    const r = this.panel?.querySelector("#st_scene_del_btn");
    r && (r.onclick = () => {
      const h = this.panel?.querySelector("#st_scene_select")?.value ?? "";
      if (se[h]) {
        w.getInstance().alertDialog("无法删除内置场景");
        return;
      }
      this.settings.scenes?.[h] && (delete this.settings.scenes[h], this.settings.activeSceneId = void 0, this.save(), this.updateSceneSelect());
    });
    const o = this.panel?.querySelector("#st_scene_export_btn");
    o && (o.onclick = () => {
      const h = this.callbacks.onScenesExport?.();
      if (!h) return;
      const l = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(h, null, 2)), u = document.createElement("a");
      u.setAttribute("href", l), u.setAttribute("download", `st-bgloader-scenes-${Date.now()}.json`), document.body.appendChild(u), u.click(), u.remove();
    });
    const c = this.panel?.querySelector("#st_scene_import_file");
    c && c.addEventListener("change", () => {
      const h = c.files?.[0];
      if (c.value = "", !h) return;
      const l = new FileReader();
      l.onload = (u) => {
        let g;
        try {
          g = JSON.parse(u.target?.result);
        } catch {
          w.getInstance().alertDialog("导入失败：不是有效的 JSON 文件");
          return;
        }
        const d = this.callbacks.onScenesImport?.(g);
        if (!d) {
          w.getInstance().alertDialog("导入失败：场景文件格式不符");
          return;
        }
        this.updateSceneSelect();
        const p = `场景导入：新增 ${d.added} 更新 ${d.updated}` + (d.skipped ? ` 跳过 ${d.skipped}` : "");
        try {
          window.toastr?.success(p);
        } catch {
        }
      }, l.readAsText(h);
    });
  }
  updateTriggersUI() {
    const e = this.panel?.querySelector("#st_trigger_list");
    if (!e) return;
    e.innerHTML = "";
    const t = this.settings.triggerRules || [];
    t.length === 0 ? e.innerHTML = '<div class="st-bgloader-dim-text">暂无规则</div>' : t.forEach((o, c) => {
      const h = document.createElement("div");
      h.className = "st-bgloader-trigger-row", h.innerHTML = `
                    <input type="checkbox" ${o.enabled ? "checked" : ""} class="st-bgloader-trigger-check" />
                    <span class="st-bgloader-trigger-badge">${o.type === "character" ? "角色" : o.type === "chat" ? "聊天" : "正则"}</span>
                    <span class="st-bgloader-trigger-name">${S(o.name)}</span>
                    <span class="st-bgloader-trigger-pattern">${S(o.pattern)}</span>
                    <button type="button" class="menu_button menu_button_icon menu_button_danger st-bgloader-trigger-del"><i class="fa-solid fa-trash"></i></button>
                `, h.querySelector(".st-bgloader-trigger-check")?.addEventListener("change", (l) => {
        o.enabled = l.target.checked, this.save();
      }), h.querySelector(".st-bgloader-trigger-del")?.addEventListener("click", () => {
        this.settings.triggerRules.splice(c, 1), this.save(), this.updateTriggersUI();
      }), e.appendChild(h);
    });
    const i = this.panel?.querySelector("#st_trigger_form"), s = this.panel?.querySelector("#st_trigger_add_btn"), a = this.panel?.querySelector("#st_trigger_cancel_btn"), r = this.panel?.querySelector("#st_trigger_confirm_btn");
    s && i && (s.onclick = () => {
      i.style.display = "block", s.style.display = "none";
    }), a && i && s && (a.onclick = () => {
      i.style.display = "none", s.style.display = "block";
    }), r && i && s && (r.onclick = () => {
      const o = this.panel?.querySelector("#st_trigger_type")?.value, c = this.panel?.querySelector("#st_trigger_name")?.value.trim(), h = this.panel?.querySelector("#st_trigger_pattern")?.value.trim();
      if (!c || !h) {
        w.getInstance().alertDialog("名称、匹配文本必填");
        return;
      }
      const l = {
        id: "trig_" + Date.now(),
        name: c,
        enabled: !0,
        type: o,
        pattern: h,
        action: {
          preset: this.settings.activePresetId,
          weather: this.settings.weather.type
        }
      };
      this.settings.triggerRules || (this.settings.triggerRules = []), this.settings.triggerRules.push(l), this.save(), this.updateTriggersUI(), i.style.display = "none", s.style.display = "block";
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
const J = "data-st-bg-augmented", qe = "data-st-bg-badge", fe = "data-st-bg-current", z = "st-bg-takeover-selected", Ht = "custom_background", Gt = 3e4;
class Wt {
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
    e && (e.menuContent.querySelectorAll(`[${qe}]`).forEach((t) => t.remove()), e.menuContent.querySelectorAll(`[${fe}]`).forEach((t) => t.remove()), e.menuContent.querySelectorAll(`.${z}`).forEach((t) => t.classList.remove(z)), e.menuContent.querySelectorAll(`[${J}]`).forEach((t) => t.removeAttribute(J)), this.restoreNativeBackgroundImage(e.bgHost)), this.seams = null;
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
    !e || !this.active || (e.menuContent.querySelectorAll(`.bg_example[bgfile]:not([${J}])`).forEach((t) => {
      t.setAttribute(J, "true"), this.addBadge(t);
    }), this.refreshSelection(this.activeFileName));
  }
  addBadge(e) {
    const t = P(e.getAttribute("bgfile") || "");
    if (t === "image") return;
    const i = document.createElement("span");
    i.className = `st-bg-native-badge ${t}`, i.setAttribute(qe, "true"), i.textContent = t.toUpperCase(), e.appendChild(i);
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
      const s = !!e && i.getAttribute("bgfile") === e, a = i.classList.contains(z), r = i.querySelector(`[${fe}]`);
      if (s && !a && i.classList.add(z), !s && a && i.classList.remove(z), s && !r) {
        const o = document.createElement("span");
        o.className = "st-bg-native-current", o.setAttribute(fe, "true"), i.appendChild(o);
      }
      !s && r && r.remove();
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
    s && (e.preventDefault(), e.stopPropagation(), Promise.resolve(this.onSelect(s, P(s))).catch((a) => {
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
    return !(document.querySelector("#Backgrounds.bg-selection-mode") || this.isChatBackgroundLocked() || t.closest(".jg-button, .bg_folder_tile, .mobile-only-menu-toggle") || e.getAttribute("custom") === "true" || this.level === "non-image" && P(e.getAttribute("bgfile") || "") === "image");
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
    return !!window.SillyTavern?.getContext?.()?.chatMetadata?.[Ht];
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
    }), this.seamWaitObserver.observe(document.body, { childList: !0, subtree: !0 }), this.seamGiveUpTimer = window.setTimeout(() => this.stopWaitingForSeams(), Gt));
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
class jt {
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
    const a = this.audioEngine.getCurrentTrack(), o = (a ? a.name : "无音频").replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim(), c = this.audioEngine.isPlaying(), h = this.audioEngine.getPlaybackMode(), l = this.isVisible && (!this.capsuleOnPlayOnly || c);
    s.classList.add(l ? "visible" : "hidden"), s.innerHTML = `
            <div class="st-bg-mini-capsule">
                <button class="st-bg-mini-btn" id="st_mini_prev" title="上一曲" aria-label="上一曲">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button class="st-bg-mini-btn st-bg-mini-play" id="st_mini_play" title="${c ? "暂停" : "播放"}" aria-label="${c ? "暂停" : "播放"}">
                    <i class="fa-solid ${c ? "fa-pause" : "fa-play"}"></i>
                </button>
                <button class="st-bg-mini-btn" id="st_mini_next" title="下一曲" aria-label="下一曲">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <div class="st-bg-mini-track" id="st_mini_title" title="${S(o)}">${S(o)}</div>
                <button class="st-bg-mini-btn st-bg-mini-mode" id="st_mini_mode" title="模式" aria-label="播放模式">
                    <i class="fa-solid ${this.getModeIcon(h)}"></i>
                </button>
            </div>
        `, document.body.appendChild(s), this.container = s, this.bindEvents(), this.unsubscribeTrack?.(), this.unsubscribePlayState?.(), this.unsubscribeTrack = this.audioEngine.addTrackListener((u) => {
      const g = this.container?.querySelector("#st_mini_title");
      if (g) {
        const p = (u ? u.name : "无音频").replace(/[\(\（][^\)\）]*[\)\）]/g, "").trim();
        g.textContent = p, g.setAttribute("title", p);
      }
    }), this.unsubscribePlayState = this.audioEngine.addPlayStateListener((u) => {
      const g = this.container?.querySelector("#st_mini_play i");
      g && (g.className = `fa-solid ${u ? "fa-pause" : "fa-play"}`), this.capsuleOnPlayOnly && this.isVisible && (u ? (this.hideTimer !== null && (clearTimeout(this.hideTimer), this.hideTimer = null), this.show()) : (this.hideTimer !== null && clearTimeout(this.hideTimer), this.hideTimer = window.setTimeout(() => {
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
const Ue = 2, Ce = [
  // --- discovery ---
  { method: "getApiVersion", category: "discovery", async: !1 },
  { method: "getCapabilities", category: "discovery", async: !1 },
  { method: "listMethods", category: "discovery", async: !1 },
  // --- background ---
  { method: "setBackground", category: "background", async: !0 },
  { method: "clearBackground", category: "background", async: !1 },
  { method: "setBackgroundVisible", category: "background", async: !1 },
  { method: "isBackgroundVisible", category: "background", async: !1 },
  // --- audio ---
  { method: "playBGM", category: "audio", async: !0 },
  { method: "stopBGM", category: "audio", async: !1 },
  { method: "togglePlay", category: "audio", async: !1 },
  { method: "nextTrack", category: "audio", async: !1 },
  { method: "prevTrack", category: "audio", async: !1 },
  { method: "setVolume", category: "audio", async: !1 },
  { method: "setMuted", category: "audio", async: !1 },
  { method: "setMuffled", category: "audio", async: !1 },
  { method: "getMuffled", category: "audio", async: !1 },
  { method: "setBgmAutoAdvance", category: "audio", async: !1 },
  { method: "getBgmAutoAdvance", category: "audio", async: !1 },
  // --- effects ---
  { method: "setFilters", category: "effects", async: !1 },
  { method: "applyPreset", category: "effects", async: !1 },
  { method: "setInteractive", category: "effects", async: !1 },
  { method: "setWeather", category: "effects", async: !1 },
  { method: "getWeather", category: "effects", async: !1 },
  { method: "setVisualizer", category: "effects", async: !1 },
  { method: "getVisualizer", category: "effects", async: !1 },
  { method: "setParallax", category: "effects", async: !1 },
  { method: "setTransition", category: "effects", async: !1 },
  { method: "setAmbientSound", category: "effects", async: !1 },
  { method: "getAmbientSound", category: "effects", async: !1 },
  { method: "setFrostedChat", category: "effects", async: !1 },
  { method: "getFrostedChat", category: "effects", async: !1 },
  { method: "cycleWeather", category: "effects", async: !1 },
  // --- scenes ---
  { method: "applyScene", category: "scenes", async: !1 },
  { method: "saveCurrentScene", category: "scenes", async: !1 },
  { method: "getScenes", category: "scenes", async: !1 },
  { method: "deleteScene", category: "scenes", async: !1 },
  { method: "exportScenes", category: "scenes", async: !1 },
  { method: "importScenes", category: "scenes", async: !1 },
  // --- triggers ---
  { method: "addTriggerRule", category: "triggers", async: !1 },
  { method: "removeTriggerRule", category: "triggers", async: !1 },
  { method: "getTriggerRules", category: "triggers", async: !1 },
  // --- media ---
  { method: "getMediaList", category: "media", async: !0 },
  { method: "uploadMedia", category: "media", async: !0 },
  { method: "deleteMedia", category: "media", async: !0 },
  { method: "getMediaInfo", category: "media", async: !0 },
  { method: "getMediaUrl", category: "media", async: !0 },
  { method: "getActiveMedia", category: "media", async: !0 },
  { method: "preloadMedia", category: "media", async: !0 },
  // --- background（补充：程序化开合顶栏抽屉） ---
  { method: "showTopbarDrawer", category: "background", async: !1 },
  // --- playlist ---
  { method: "getPlaylist", category: "playlist", async: !1 },
  { method: "setPlaybackMode", category: "playlist", async: !1 },
  { method: "jumpToTrack", category: "playlist", async: !0 },
  // --- settings ---
  { method: "getSettings", category: "settings", async: !1 },
  { method: "updateSettings", category: "settings", async: !1 },
  { method: "exportSettings", category: "settings", async: !1 },
  { method: "importSettings", category: "settings", async: !1 },
  { method: "setMasterEnabled", category: "settings", async: !1 },
  { method: "isEnabled", category: "settings", async: !1 },
  // --- cache ---
  { method: "getCacheStats", category: "cache", async: !0 },
  { method: "clearCache", category: "cache", async: !0 },
  // --- visualizer ---
  { method: "getVisualizerData", category: "visualizer", async: !1 },
  // --- state ---
  { method: "getPlaybackState", category: "state", async: !1 }
], Kt = new Set(Ce.map((n) => n.method)), Xt = Ce.map((n) => n.method);
function Qt(n) {
  return typeof n == "string" && Kt.has(n);
}
function Yt() {
  const n = {};
  for (const e of Ce)
    (n[e.category] ??= []).push(e.method);
  return n;
}
const Ve = ["loop", "single", "shuffle"], ze = "st-bgloader-scenes", He = 1;
function Ie(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function Z(n, e) {
  const t = n[e];
  return typeof t == "string" && t.length > 0 ? t : void 0;
}
function H(n, e) {
  const t = n[e];
  return Ie(t) ? t : void 0;
}
function Jt(n) {
  if (!Ie(n)) return null;
  const e = typeof n.id == "string" ? n.id.trim() : "";
  if (!e) return null;
  const t = typeof n.name == "string" && n.name.trim().length > 0 ? n.name.trim() : e, i = { id: e, name: t }, s = Z(n, "mediaId");
  s && (i.mediaId = s);
  const a = Z(n, "mediaUrl");
  a && (i.mediaUrl = a);
  const r = Z(n, "bgmUrl");
  r && (i.bgmUrl = r);
  const o = Z(n, "presetId");
  o && (i.presetId = o);
  const c = H(n, "filters");
  c && (i.filters = c);
  const h = H(n, "weather");
  h && (i.weather = h);
  const l = H(n, "visualizer");
  l && (i.visualizer = l);
  const u = H(n, "parallax");
  u && typeof u.enabled == "boolean" && typeof u.intensity == "number" && (i.parallax = { enabled: u.enabled, intensity: u.intensity });
  const g = H(n, "ambientSound");
  return g && (i.ambientSound = g), typeof n.frostedChat == "boolean" && (i.frostedChat = n.frostedChat), i;
}
class Zt {
  ext;
  eventListeners = /* @__PURE__ */ new Map();
  /** PostMessageBridge 在位标志（getCapabilities 上报用；由桥自身置位）。 */
  bridgeActive = !1;
  /** 跨 iframe 事件推送钩子（index 装配 PostMessageBridge 后注入；可空）。 */
  eventBroadcaster = null;
  constructor(e) {
    this.ext = e;
  }
  /** index.ts 装配时注入；桥 stop() 后传 null 摘除。 */
  setEventBroadcaster(e) {
    this.eventBroadcaster = e;
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
    let s = (await this.ext.getCacheManager().listMedia()).find((r) => r.id === e || r.name === e || r.url === e || r.cacheKey === e), a = !1;
    if (!s) {
      const r = t?.name || e.split("/").pop()?.split("?")[0] || "remote_background", o = t?.type || P(e);
      t?.saveToLibrary ? s = await this.ext.getCacheManager().saveMedia(new Blob([]), r, o, "url", e) : (a = !0, s = {
        id: "custom_" + Date.now(),
        name: r,
        type: o,
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
  /**
   * BGM 播放列表自动轮播（F1）：enabled=false 关闭；未给的字段沿用当前值。
   * 写设置走收敛路径（saveSettings + 子系统接线由 applySettingsToSubsystems 亦覆盖，
   * 远端收敛与 UI 改动殊途同归），AudioEngine 立即生效。
   */
  setBgmAutoAdvance(e, t, i) {
    const s = this.ext.getSettings().bgmAutoAdvance, a = {
      enabled: !!e,
      intervalSec: this._clampNum(t ?? s.intervalSec, 30, 3600, 300),
      fadeMs: this._clampNum(i ?? s.fadeMs, 0, 2e3, 800)
    };
    this.ext.getSettings().bgmAutoAdvance = a, this.ext.getAudioEngine().setAutoAdvance(a.enabled, a.intervalSec, a.fadeMs), this.ext.saveSettings(), this.emit("bgm-auto-advance-change", a);
  }
  getBgmAutoAdvance() {
    return { ...this.ext.getSettings().bgmAutoAdvance };
  }
  /** 数值钳制：非法输入（NaN/Infinity/越界）回落到默认值而不是被 Math.min/max 放大成边界。 */
  _clampNum(e, t, i, s) {
    return typeof e != "number" || !Number.isFinite(e) ? s : Math.max(t, Math.min(i, Math.floor(e)));
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
    let i = G[e]?.filters;
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
    } : i = { ...e }, !F.includes(i.type)) {
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
   * 导出场景为可分享 JSON（F2）。默认导出全部用户场景；`ids` 过滤（内置场景是常量，
   * 不参与导出）。返回结构可直接 JSON.stringify 存文件。
   */
  exportScenes(e) {
    const t = this.ext.getSceneManager()?.getUserScenes() ?? {};
    let i = Object.values(t);
    if (Array.isArray(e) && e.length > 0) {
      const s = new Set(e.filter((a) => typeof a == "string"));
      i = i.filter((a) => s.has(a.id));
    }
    return {
      format: ze,
      version: He,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      scenes: i.map((s) => ({ ...s }))
    };
  }
  /**
   * 导入场景（F2）：信封形状校验 + 逐场景字段白名单清洗；同名（同 id）覆盖、其余既有
   * 场景不动（语义合并）。信封非法整体拒绝（返回 null，现状零改动）；单场景形状非法
   * 跳过并计入 skipped。
   */
  importScenes(e) {
    if (!Ie(e)) return null;
    const t = e;
    if (t.format !== ze || t.version !== He || !Array.isArray(t.scenes)) return null;
    const i = this.ext.getSceneManager();
    if (!i) return null;
    let s = 0, a = 0, r = 0;
    for (const o of t.scenes) {
      const c = Jt(o);
      if (!c) {
        r += 1;
        continue;
      }
      const h = !!i.getScene(c.id);
      i.saveScene(c), h ? a += 1 : s += 1;
    }
    return s + a > 0 && (this.ext.getSettings().scenes = i.getUserScenes(), this.ext.saveSettings(), this.emit("scenes-change", i.getAllScenes())), { added: s, updated: a, skipped: r };
  }
  /**
   * Quick cycle through weather types
   */
  cycleWeather() {
    const e = this.ext.getSettings().weather.type, t = (F.indexOf(e) + 1) % F.length, i = F[t];
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
    let r = 0;
    const o = [...i], c = Array.from({ length: Math.min(a, o.length) }, async () => {
      for (; o.length > 0; ) {
        const h = o.shift();
        try {
          const { item: l, isNew: u } = await this.ext.getCacheManager().preloadUrl(h), g = {
            url: h,
            success: !0,
            cached: !u,
            size: l.size || 0
          };
          s.push(g);
        } catch (l) {
          s.push({
            url: h,
            success: !1,
            cached: !1,
            size: 0,
            error: l?.message || String(l)
          });
        }
        r++, t?.onProgress?.(r, i.length, h), this.emit("preload-progress", r, i.length, h);
      }
    });
    return await Promise.all(c), this.emit("preload-complete", s), s;
  }
  // --- Discovery（发现接口：调用方特性检测用） ---
  getApiVersion() {
    let e = "unknown";
    try {
      const t = window.manifest;
      t?.version && (e = t.version);
    } catch {
    }
    return { api: Ue, plugin: e };
  }
  getCapabilities() {
    return {
      api: Ue,
      postMessageBridge: this.bridgeActive,
      eventChannels: ["bus", "eventSource", "customEvent"],
      categories: Yt()
    };
  }
  listMethods() {
    return Xt.slice();
  }
  // --- Media library management（媒体库管理端点） ---
  /**
   * 上传一个 Blob/File 进媒体库（与顶栏抽屉上传同路径：saveMedia(..., 'server')）。
   * 返回新条目。type 省略时按文件名探测。
   */
  async uploadMedia(e, t, i) {
    if (!(e instanceof Blob))
      throw new Error("INVALID_PARAMS: uploadMedia(blob) 需要 Blob 或 File");
    if (t !== void 0 && typeof t != "string")
      throw new Error("INVALID_PARAMS: name 必须是字符串");
    const s = (t || e.name || `upload_${Date.now()}`).trim();
    if (!s)
      throw new Error("INVALID_PARAMS: name 不能为空");
    const a = i ?? P(s), r = await this.ext.getCacheManager().saveMedia(e, s, a, "server");
    return this.emit("media-added", r), r;
  }
  /**
   * 删除媒体条目并联动清理播放面（与顶栏抽屉 onMediaDeleted 同语义）：
   * 正作背景则清背景，正在播放则停轨，随后刷新播放列表。
   */
  async deleteMedia(e) {
    this._assertId(e, "deleteMedia");
    const t = this.ext.getCacheManager();
    if (!await t.getMedia(e)) return !1;
    await t.deleteMedia(e), this.ext.getSettings().activeMediaId === e && this.ext.clearActiveBackground();
    const s = this.ext.getAudioEngine();
    s.getCurrentTrack()?.id === e && s.stopTrack();
    const a = await t.listMedia();
    return s.setPlaylist(a.filter((r) => r.type === "audio")), this.emit("media-deleted", e), !0;
  }
  async getMediaInfo(e) {
    this._assertId(e, "getMediaInfo");
    const t = await this.ext.getCacheManager().getMedia(e);
    return t ? { ...t } : null;
  }
  /**
   * 取一个可在本会话内复用的 blob URL（CacheManager 内部有在途去重与生命周期管理）。
   * 该 URL 仅本会话有效——跨会话复用请改用 getMediaInfo().url 或重新调用本方法。
   */
  async getMediaUrl(e) {
    this._assertId(e, "getMediaUrl");
    const t = await this.ext.getCacheManager().getMedia(e);
    return t ? this.ext.getCacheManager().getMediaBlobUrl(t) : null;
  }
  // --- Playlist control（播放列表端点） ---
  getPlaylist() {
    return this.ext.getAudioEngine().getPlaylist().map((e) => ({ ...e }));
  }
  setPlaybackMode(e) {
    if (!Ve.includes(e))
      throw new Error(`INVALID_PARAMS: playbackMode 必须是 ${Ve.join("/")} 之一`);
    this.ext.getSettings().playbackMode = e, this.ext.getAudioEngine().setPlaybackMode(e), this.ext.saveSettings(), this.emit("playback-mode-change", e);
  }
  /** 跳到播放列表第 index 首并播放；越界返回 false（不抛错）。 */
  async jumpToTrack(e) {
    if (!Number.isInteger(e) || e < 0)
      throw new Error("INVALID_PARAMS: index 必须是非负整数");
    const t = this.ext.getAudioEngine().getPlaylist();
    if (e >= t.length) return !1;
    const i = t[e], s = await this.ext.getCacheManager().getMediaBlobUrl(i);
    return await this.ext.getAudioEngine().playMediaItem(i, s), this.emit("track-change", i), !0;
  }
  /**
   * 当前激活的背景条目（getPlaybackState 只给 id，本端点直接给解析后的条目）。
   * 未设置/引用已失效时返回 null。
   */
  async getActiveMedia() {
    const e = this.ext.getSettings().activeMediaId;
    if (!e) return null;
    const t = await this.ext.getCacheManager().getMedia(e);
    return t ? { ...t } : null;
  }
  /**
   * 程序化开合顶栏背景抽屉（复用宿主原生开合钮的点击语义）。
   * 宿主 DOM 不可用时返回 false。
   */
  showTopbarDrawer(e) {
    if (typeof e != "boolean")
      throw new Error("INVALID_PARAMS: showTopbarDrawer(open) 需要 boolean");
    const t = w.getInstance();
    return e ? t.openBackgroundDrawer() : (t.closeBackgroundDrawer(), !0);
  }
  // --- Settings endpoints（设置读写端点） ---
  /** 只读快照（深拷贝；调用方改它不会影响插件状态）。 */
  getSettings() {
    return JSON.parse(JSON.stringify(this.ext.getSettings()));
  }
  /**
   * 合并更新设置：patch 与当前设置合并后走 mergeSettings 全量收敛，
   * 与顶栏抽屉/远端收敛同一条应用路径（不旁路子系统同步）。
   */
  updateSettings(e) {
    if (!e || typeof e != "object" || Array.isArray(e))
      throw new Error("INVALID_PARAMS: updateSettings(patch) 需要 plain object");
    const t = j({ ...this.ext.getSettings(), ...e });
    return this.ext.applyConvergedSettings(t), this.getSettings();
  }
  /** 导出设置快照（JSON 序列化安全，可直接存文件或发给 importSettings）。 */
  exportSettings() {
    return this.getSettings();
  }
  /** 导入设置（整体替换，走 mergeSettings 收敛；非法 JSON 结构会静默回退默认值）。 */
  importSettings(e) {
    const t = j(e);
    return this.ext.applyConvergedSettings(t), this.getSettings();
  }
  // --- Master switch（主开关端点；语义同 P2-5：关 = 视听同停） ---
  setMasterEnabled(e) {
    if (typeof e != "boolean")
      throw new Error("INVALID_PARAMS: setMasterEnabled(enabled) 需要 boolean");
    this.ext.setMasterEnabled(e), this.emit("master-switch", e);
  }
  isEnabled() {
    return this.ext.getSettings().enabled !== !1;
  }
  // --- Cache endpoints（缓存端点） ---
  async getCacheStats() {
    const e = await this.ext.getCacheManager().getCacheUsage(), t = this.ext.getSettings();
    return {
      usedBytes: e.usedBytes,
      itemCount: e.itemCount,
      quotaBytes: t.cacheQuotaMB * 1024 * 1024,
      lruAutoClean: t.lruAutoClean
    };
  }
  /** 清空全部缓存与媒体库（破坏性端点：等同设置面板的清空按钮）。 */
  async clearCache() {
    await this.ext.getCacheManager().clearAll(), this.ext.clearActiveBackground(), this.ext.getAudioEngine().setPlaylist([]), this.emit("cache-cleared");
  }
  // --- Visualizer data（可视化数据只读端点） ---
  /**
   * 当前频谱快照（0-255 字节数组副本）。无 analyser（未播放/不支持）时返回 []，
   * 永不挂起——供其他插件做自己的可视化。
   */
  getVisualizerData() {
    const e = this.ext.getAudioVisualizer().getSpectrum();
    return e ? Array.from(e) : [];
  }
  /** 路径内部共用：id 参数守卫。 */
  _assertId(e, t) {
    if (typeof e != "string" || e.length === 0)
      throw new Error(`INVALID_PARAMS: ${t}(id) 需要非空字符串 id`);
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
    try {
      const i = window.eventSource;
      i && typeof i.emit == "function" && i.emit(`st_bgloader:${e}`, ...t);
    } catch {
    }
    try {
      document.dispatchEvent(new CustomEvent(`st-bgloader:${e}`, { detail: { args: t } }));
    } catch {
    }
    if (this.eventBroadcaster)
      try {
        this.eventBroadcaster(e, t);
      } catch {
      }
  }
}
const me = "st-bgloader", Ge = 3e4, ei = 6e4, ti = 512, We = 16;
class ii {
  api;
  handler = null;
  servedIds = /* @__PURE__ */ new Set();
  /** 隐式事件订阅表：source → 最后一次成功请求的时间戳。 */
  subscribers = /* @__PURE__ */ new Map();
  constructor(e) {
    this.api = e;
  }
  start() {
    this.handler || (this.handler = (e) => void this.handleMessage(e), window.addEventListener("message", this.handler), this.api.bridgeActive = !0);
  }
  stop() {
    this.handler && (window.removeEventListener("message", this.handler), this.handler = null, this.servedIds.clear(), this.subscribers.clear(), this.api.bridgeActive = !1);
  }
  async handleMessage(e) {
    const t = e.data;
    if (!t || typeof t != "object" || t.source !== me || t.kind !== "request" || typeof t.id != "string" || t.id.length === 0 || this.servedIds.has(t.id)) return;
    if (this.servedIds.add(t.id), this.servedIds.size > ti) {
      const c = this.servedIds.values().next().value;
      c !== void 0 && this.servedIds.delete(c);
    }
    const i = e.source;
    if (!i || typeof i.postMessage != "function") return;
    if (!Qt(t.method)) {
      this.respond(i, t.id, {
        error: {
          code: "UnknownMethod",
          message: `method "${String(t.method)}" 不在白名单内（listMethods 查看可用端点）`
        }
      });
      return;
    }
    const s = this.api[t.method];
    if (typeof s != "function") {
      this.respond(i, t.id, {
        error: { code: "UnknownMethod", message: `method "${t.method}" 已登记但实现缺失` }
      });
      return;
    }
    const a = Array.isArray(t.params) ? t.params : [];
    if (a.length > We) {
      this.respond(i, t.id, {
        error: { code: "InvalidParams", message: `params 超过 ${We} 项上限` }
      });
      return;
    }
    let r;
    const o = Promise.resolve(s.apply(this.api, a));
    o.catch(() => {
    });
    try {
      r = await this.withTimeout(o, t.method);
    } catch (c) {
      this.respond(i, t.id, {
        error: {
          code: c instanceof Error && c.message.startsWith("INVALID_PARAMS") ? "InvalidParams" : "InvokeError",
          message: c instanceof Error ? c.message : String(c)
        }
      });
      return;
    }
    this.subscribers.set(i, Date.now()), this.respond(i, t.id, { result: r === void 0 ? null : r });
  }
  /** 有界等待：任何方法 30s 内必须 settle，超时抛 BRIDGE_TIMEOUT（L1-MR-7）。 */
  withTimeout(e, t) {
    let i = null;
    const s = new Promise((a, r) => {
      i = setTimeout(
        () => r(new Error(`BRIDGE_TIMEOUT: ${t} 超过 ${Ge}ms 未返回`)),
        Ge
      );
    });
    return Promise.race([e, s]).finally(() => {
      i !== null && clearTimeout(i);
    });
  }
  respond(e, t, i) {
    try {
      e.postMessage({ source: me, kind: "response", id: t, ...i }, "*");
    } catch (s) {
      console.warn("[ST-BgLoader PostMessageBridge] respond failed:", s);
    }
  }
  /** 事件推送：只发给 TTL 内活跃过的 source（目标窗口销毁时静默跳过）。 */
  broadcastEvent(e, t) {
    if (!this.handler) return;
    const i = Date.now();
    for (const [s, a] of this.subscribers) {
      if (i - a > ei) {
        this.subscribers.delete(s);
        continue;
      }
      try {
        s.postMessage({ source: me, kind: "event", event: e, args: t }, "*");
      } catch {
      }
    }
  }
}
class si {
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
        const o = ["#00f0ff", "#ff007f", "#7928ca", "#00ff88"];
        return {
          x: Math.random() * this.width,
          y: t ? Math.random() * this.height : this.height + 20,
          vx: (Math.random() - 0.5) * 1.5 + r * 0.5,
          vy: -(1.5 + Math.random() * 3) * a,
          size: 2 + Math.random() * 3.5,
          alpha: (0.5 + Math.random() * 0.5) * this.currentOptions.opacity,
          color: o[Math.floor(Math.random() * o.length)],
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
        const r = Math.sin(a.oscillationOffset) * 0.8;
        a.x += a.vx + r, a.y += a.vy, e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = `rgba(255, 255, 255, ${a.alpha})`, e.fill(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(t, !1));
      } else if (t === "sakura") {
        a.oscillationOffset = (a.oscillationOffset || 0) + 0.03, a.rotation = (a.rotation || 0) + (a.vRotation || 0.02);
        const r = Math.sin(a.oscillationOffset) * 1.5;
        a.x += a.vx + r, a.y += a.vy, e.save(), e.translate(a.x, a.y), e.rotate(a.rotation), e.beginPath(), e.ellipse(0, 0, a.size, a.size * 0.55, 0, 0, Math.PI * 2), e.fillStyle = `rgba(255, 183, 197, ${a.alpha})`, e.fill(), e.restore(), (a.y > this.height || a.x < -50 || a.x > this.width + 50) && (this.particles[s] = this.createParticle(t, !1));
      } else if (t === "cyber_motes") {
        a.life = (a.life || 0) + 1, a.x += a.vx, a.y += a.vy;
        const r = a.life / (a.maxLife || 200), o = a.alpha * Math.sin(r * Math.PI);
        e.save(), e.shadowBlur = 8, e.shadowColor = a.color || "#00f0ff", e.beginPath(), e.arc(a.x, a.y, a.size, 0, Math.PI * 2), e.fillStyle = a.color || "#00f0ff", e.globalAlpha = Math.max(0, o), e.fill(), e.restore(), (a.y < -20 || a.life && a.life > (a.maxLife || 200)) && (this.particles[s] = this.createParticle(t, !1));
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
class ai {
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
  /**
   * 当前频谱快照（PublicAPI.getVisualizerData 的数据源，只读端点）。
   * 返回内部 dataArray 引用——调用方（PublicAPI）负责立即拷贝，不得持有。
   * 无 analyser 时返回 null（未播放 / 宿主不支持），调用方转空数组，永不挂起。
   */
  getSpectrum() {
    if (!this.analyser || !this.dataArray) return null;
    try {
      this.analyser.getByteFrequencyData(this.dataArray);
    } catch {
      return null;
    }
    return this.dataArray;
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
      const r = Math.min(12, this.dataArray.length);
      for (let h = 0; h < r; h++)
        a += this.dataArray[h];
      const o = a / r / 255, c = Math.pow(o, 2) * 0.35 * s;
      if (this.pumpTargetEl) {
        const h = 1 + c * 0.015;
        this.pumpTargetEl.style.transform = `scale(${h})`, this.pumpTargetEl.style.transition = "transform 0.06s ease-out";
      }
    } else if (i === "spectrum") {
      if (!this.ctx) return;
      const a = this.ctx;
      a.clearRect(0, 0, this.width, this.height);
      const r = this.dataArray.length, o = Math.max(3, this.width / r * 1.6);
      let c = 0;
      const h = this.currentOptions.color || "#4fa3d1";
      for (let l = 0; l < r; l++) {
        const u = this.dataArray[l] / 255 * s, g = Math.min(this.height, u * (this.height - 10));
        if (g > 1) {
          const d = a.createLinearGradient(0, this.height, 0, this.height - g);
          d.addColorStop(0, `${h}22`), d.addColorStop(0.7, `${h}aa`), d.addColorStop(1, `${h}ff`), a.fillStyle = d;
          const p = this.height - g;
          a.beginPath();
          const m = Math.min(o / 2, 3);
          typeof a.roundRect == "function" ? a.roundRect(c, p, o - 1.5, g, [m, m, 0, 0]) : a.rect(c, p, o - 1.5, g), a.fill();
        }
        if (c += o, c > this.width) break;
      }
    }
  }
  destroy() {
    this.stop(), window.removeEventListener("resize", this.onResize), this.canvas.parentElement && this.canvas.parentElement.removeChild(this.canvas), this.pumpTargetEl && (this.pumpTargetEl.style.transform = "", this.pumpTargetEl.style.transition = "", this.pumpTargetEl = null);
  }
}
class ni {
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
    const t = window.innerWidth / 2, i = window.innerHeight / 2, s = 30 * this.options.intensity, a = (e.clientX - t) / t, r = (e.clientY - i) / i;
    this.targetX = a * s, this.targetY = r * s, this.isRunning || this.startLoop();
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
class ri {
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
    const i = (o) => {
      typeof o == "string" ? this.evaluateMessage(o) : o && typeof o.mes == "string" && this.evaluateMessage(o.mes);
    }, s = (o) => {
      const c = typeof o == "string" ? o : o?.chatId || o?.id;
      c && this.evaluateChat(String(c));
    }, a = (o) => {
      const c = typeof o == "string" ? o : o?.name || o?.avatar;
      c && this.evaluateCharacter(String(c));
    }, r = (o, c) => {
      e.on(o, c), this.eventSourceUnlisteners.push(() => {
        typeof e.removeListener == "function" ? e.removeListener(o, c) : typeof e.off == "function" ? e.off(o, c) : typeof e.removeEventListener == "function" && e.removeEventListener(o, c);
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
    this.unbindEvents(), this.rules = [], this.regexCache.clear(), this.onTriggerCallback = void 0;
  }
}
class oi {
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
    let a = 0, r = 0, o = 0, c = 0, h = 0, l = 0, u = 0;
    for (let p = 0; p < t; p++) {
      const m = Math.random() * 2 - 1;
      a = 0.99886 * a + m * 0.0555179, r = 0.99332 * r + m * 0.0750759, o = 0.969 * o + m * 0.153852, c = 0.8665 * c + m * 0.3104856, h = 0.55 * h + m * 0.5329522, l = -0.7616 * l - m * 0.016898, s[p] = (a + r + o + c + h + l + u + m * 0.5362) * 0.11, u = m * 0.115926;
    }
    const g = e.createBufferSource();
    g.buffer = i, g.loop = !0;
    const d = e.createBiquadFilter();
    d.type = "lowpass", d.frequency.value = 1200, g.connect(d), d.connect(this.gainNode), g.start(0), this.activeSource = g;
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
    for (let h = 0; h < t; h++)
      s[h] = Math.random() * 2 - 1;
    const a = e.createBufferSource();
    a.buffer = i, a.loop = !0;
    const r = e.createBiquadFilter();
    r.type = "bandpass", r.frequency.value = 400, r.Q.value = 3;
    const o = e.createOscillator();
    o.frequency.value = 0.2;
    const c = e.createGain();
    c.gain.value = 250, o.connect(c), c.connect(r.frequency), a.connect(r), r.connect(this.gainNode), o.start(0), a.start(0), this.lfoOsc = o, this.activeSource = a;
  }
  destroy() {
    this.stop(), this.teardownInteractionListener(), this.ctx && (this.ctx.close().catch(() => {
    }), this.ctx = null), this.gainNode = null;
  }
}
class li {
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
                background: color-mix(in srgb, var(--st-bg-frosted-tint, #121218) calc(var(--st-frosted-opacity, 0.75) * 100%), transparent) !important;
                backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                -webkit-backdrop-filter: blur(var(--st-frosted-blur, 10px)) !important;
                border: 1px solid var(--st-bg-frosted-border, rgba(255, 255, 255, 0.12)) !important;
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
class ci {
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
      ...se,
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
    return se[e] ? (console.warn(`[ST-BgLoader SceneManager] Cannot delete builtin scene "${e}"`), !1) : this.userScenes[e] ? (delete this.userScenes[e], !0) : !1;
  }
  applyScene(e) {
    const t = this.getScene(e);
    return t ? (console.log(`[ST-BgLoader SceneManager] Applying scene: "${t.name}"`), Promise.resolve(this.onApplySceneCallback?.(t)).catch((i) => {
      console.error(`[ST-BgLoader SceneManager] Failed to apply scene "${t.name}":`, i);
    }), !0) : (console.warn(`[ST-BgLoader SceneManager] Scene "${e}" not found.`), !1);
  }
}
const je = "settings:rev", Ke = "settings:data", di = 2e3, hi = 1e4;
class ui {
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
    this.pollTimer = window.setInterval(() => void this.pollOnce(), hi);
  }
  stop() {
    this.pollTimer !== null && window.clearInterval(this.pollTimer), this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pollTimer = null, this.pushTimer = null, this.running = !1;
  }
  schedulePush(e) {
    !this.running || this.applyingRemote || (this.pushTimer !== null && window.clearTimeout(this.pushTimer), this.pushTimer = window.setTimeout(() => {
      this.pushTimer = null, this.push(e);
    }, di));
  }
  async push(e) {
    try {
      const t = JSON.stringify(e), i = await gi(t);
      if (i === this.lastPushedFingerprint) return;
      const s = this.localRevision + 1, a = {
        revision: s,
        fingerprint: i,
        updatedAt: Date.now(),
        settings: e
      };
      await this.client.storage.kv.set(Ke, a), await this.client.storage.kv.set(je, s), this.localRevision = s, this.lastPushedFingerprint = i;
    } catch (t) {
      console.warn("[ST-BgLoader] Failed to push settings to cloud mirror:", t);
    }
  }
  async pollOnce() {
    if (!this.applyingRemote)
      try {
        const e = await this.client.storage.kv.get(je);
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
    const e = await this.client.storage.kv.get(Ke);
    if (!e || typeof e != "object") return null;
    const t = e;
    return typeof t.revision != "number" || !t.settings || typeof t.fingerprint != "string" ? null : t;
  }
}
async function gi(n) {
  try {
    if (crypto?.subtle) {
      const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(n));
      return Array.from(new Uint8Array(t)).map((i) => i.toString(16).padStart(2, "0")).join("");
    }
  } catch {
  }
  let e = 5381;
  for (let t = 0; t < n.length; t++)
    e = (e << 5) + e + n.charCodeAt(t) | 0;
  return "djb2:" + (e >>> 0).toString(16);
}
const Xe = "st-bg-loader-settings.json", pi = 1, fi = 800;
class mi {
  saveTimer = null;
  pending = null;
  writing = !1;
  warnedAboutWriteFailure = !1;
  /** Invoked when a newer server document (another tab/device) beats the pending write. */
  onRemoteNewer = null;
  /** Returns the server document, or null when it is missing/unparsable (first run). */
  async load() {
    const e = await pt(Xe);
    return !e || typeof e != "object" || !e.settings || typeof e.revision != "number" ? null : e;
  }
  scheduleSave(e, t) {
    this.pending = { settings: e, revision: t }, this.saveTimer !== null && window.clearTimeout(this.saveTimer), this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null, this.flush();
    }, fi);
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
            await ft(Xe, this.toDoc(e)), this.warnedAboutWriteFailure = !1;
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
      version: pi,
      revision: e.revision,
      updatedTimestamp: Date.now(),
      settings: e.settings
    };
  }
}
const Qe = 3e4, yi = 2e3, bi = 5 * 60 * 1e3, vi = 2 * 60 * 1e3, _i = 15e3;
class Ye extends Error {
  constructor() {
    super("Agent tool registration timed out"), this.name = "AgentRegisterTimeoutError";
  }
}
const wi = [
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
    description: `Set the atmospheric weather FX (${F.join(", ")}).`,
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: F },
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
class Si {
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
    this.running || (this.running = !0, this.permissionBlockedUntil = 0, this.registerWaitUntil = 0, this.register(), this.claimLoop(), this.registerTimer = window.setInterval(() => void this.register(), Qe));
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
        this.registrationOk = !1, et(e) ? (this.permissionBlockedUntil = Date.now() + bi, this.publishState("blocked", e instanceof Error ? e.message : String(e)), this.warnOnce("Agent tool registration blocked by permission policy (retrying every 5 min — adjust in Authority Security Center if intended):", e)) : e instanceof Ye ? (this.registerWaitUntil = Date.now() + vi, this.publishState("pending", "等待 agent.browser 授权（若页面出现 Authority 权限弹窗请处理；稍后自动重试）"), this.warnOnce("Agent tool registration is waiting for permission (check the Authority prompt / Security Center):", e)) : console.warn("[ST-BgLoader] Agent tool registration failed (will retry):", e);
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
      t = window.setTimeout(() => a(new Ye()), _i);
    });
    try {
      return await Promise.race([
        e.registerTools({
          browserInstanceId: V,
          leaseDurationMs: Qe * 2,
          tools: wi.map((s) => ({
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
    }, yi));
  }
  async claimOnce() {
    const e = this.agentApi();
    if (!(!e || !this.running) && this.registrationOk)
      try {
        this.pendingSubmit && (await this.reportResult(this.pendingSubmit.claimId, this.pendingSubmit.invocation, "completed", void 0), this.pendingSubmit = null);
        const t = `stbg-claim-${Date.now()}-${this.claimSeq++}`, s = (await e.claim({ browserInstanceId: V, claimId: t })).invocation;
        if (!s) return;
        let a, r;
        try {
          a = await this.execute(s.toolId, s.arguments);
        } catch (o) {
          r = o instanceof Error ? o.message : String(o);
        }
        if (r) {
          await e.submitResult({
            runId: s.runId,
            callId: s.callId,
            claimId: t,
            browserInstanceId: V,
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
            browserInstanceId: V,
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
      browserInstanceId: V,
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
const ye = "st_bgloader_settings", Je = "st_bgloader_settings_rev";
class Ei {
  isInitialized = !1;
  settings = { ...ae };
  settingsRevision = 0;
  serverSettings = new mi();
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
  authorityBridge = new ne();
  settingsSync = null;
  agentBridge = null;
  /** 跨 iframe JSON-RPC 端点桥（init 时启动；纯浏览器可用，无宿主依赖）。 */
  postMessageBridge = null;
  publicApi;
  constructor() {
    this.cacheManager = new Mt(), this.audioEngine = new kt(), this.mediaMount = new Bt(this.audioEngine, (e) => this.mountOverlays(e)), this.atmosphereFX = new si(), this.audioVisualizer = new ai(), this.parallaxController = new ni(), this.triggerManager = new ri(), this.ambientSoundGenerator = new oi(), this.frostedGlassController = new li(), this.publicApi = new Zt(this);
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
    e ? (this.topbarDrawer?.mount(), this.nativeController?.start(this.settings.nativeTakeover), this.mediaMount.setVisible(this.settings.backgroundVisible), this.atmosphereFX.handleBackgroundVisibilityChange(this.settings.backgroundVisible), this.audioVisualizer.handleBackgroundVisibilityChange(this.settings.backgroundVisible)) : (this.topbarDrawer?.unmount(), this.nativeController?.stop(), this.mediaMount.clear(), this.atmosphereFX.handleBackgroundVisibilityChange(!1), this.audioVisualizer.handleBackgroundVisibilityChange(!1), this.nativeController?.releaseNativeBackground(), this.audioEngine.stopTrack(300), this.audioEngine.stopAutoAdvance(), this.ambientSoundGenerator.setSound({ ...this.settings.ambientSound, type: "off" }));
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
    this.audioEngine.setPlaylist(t), this.miniPlayer = new jt(this.audioEngine), this.miniPlayer.render(this.settings.showMiniPlayer, this.settings.capsuleOnPlayOnly), this.audioEngine.addTrackListener((i) => {
      this.publicApi.emit("track-change", i);
    }), this.audioEngine.addPlayStateListener((i) => {
      this.publicApi.emit("play-state-change", i);
    }), this.triggerManager.setRules(this.settings.triggerRules || []), this.triggerManager.setTriggerCallback(async (i, s) => {
      console.log(`[ST-BgLoader] Executing trigger rule: "${s.name}"`), i.mediaIdOrUrl && await this.publicApi.setBackground(i.mediaIdOrUrl), i.bgmUrl && await this.publicApi.playBGM(i.bgmUrl), i.weather && this.publicApi.setWeather(i.weather), i.preset && this.publicApi.applyPreset(i.preset), i.filters && this.publicApi.setFilters(i.filters);
    }), this.sceneManager = new ci(this.settings.scenes || {}, async (i) => {
      if (i.mediaId) {
        const s = await this.cacheManager.getMedia(i.mediaId);
        s && await this.applyMedia(s);
      } else i.mediaUrl && await this.publicApi.setBackground(i.mediaUrl);
      i.bgmUrl && await this.publicApi.playBGM(i.bgmUrl), i.presetId && this.publicApi.applyPreset(i.presetId), i.filters && this.publicApi.setFilters(i.filters), i.weather && this.publicApi.setWeather(i.weather), i.visualizer && this.publicApi.setVisualizer(i.visualizer), i.parallax && this.publicApi.setParallax(i.parallax.enabled, i.parallax.intensity), i.ambientSound && this.publicApi.setAmbientSound(i.ambientSound), typeof i.frostedChat == "boolean" && this.publicApi.setFrostedChat(i.frostedChat);
    }), this.topbarDrawer = new xe(this.settings, this.cacheManager, {
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
      onScenesExport: () => this.publicApi.exportScenes(),
      onScenesImport: (i) => this.publicApi.importScenes(i),
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
    }, this.authorityBridge), this.settings.enabled !== !1 && this.topbarDrawer.mount(), this.settingsDrawer = new Vt(this.settings, {
      onMasterToggle: (i) => {
        this.setMasterEnabled(i);
      },
      onSettingsChanged: (i) => {
        this.settings = i, this.saveSettings();
      }
    }), this.settingsDrawer.render(), this.nativeController = new Wt(async (i, s) => {
      const a = R(i), r = {
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
      await this.applyMedia(r);
    }), this.nativeController.start(this.settings.nativeTakeover), document.addEventListener("visibilitychange", () => {
      const i = document.hidden;
      this.audioEngine.handleVisibilityChange(i, this.settings.pauseOnBlur), this.atmosphereFX.handleVisibilityChange(i), this.audioVisualizer.handleVisibilityChange(i);
    }), window.addEventListener("pagehide", () => this.flushPendingPersist()), this.authorityBridge.onCapabilitiesChanged(() => this.topbarDrawer?.updateCloudPanel()), this.serverSettings.onRemoteNewer = () => void this.reconcileRemoteConflict(), await this.startSettingsSync(), this.syncAgentTools();
    try {
      this.postMessageBridge = new ii(this.publicApi), this.postMessageBridge.start(), this.publicApi.setEventBroadcaster((i, s) => this.postMessageBridge?.broadcastEvent(i, s));
    } catch (i) {
      console.warn("[ST-BgLoader] PostMessageBridge unavailable:", i);
    }
    if (this.hookSillyTavernEvents(), this.settings.activeMediaId) {
      const i = await this.cacheManager.getMedia(this.settings.activeMediaId);
      i ? await this.applyMedia(i) : (console.warn(`[ST-BgLoader] Active background "${this.settings.activeMediaId}" no longer exists; clearing the reference.`), this.settings.activeMediaId = null, this.saveSettings());
    }
    this.appliedEnabled = this.settings.enabled, this.isInitialized = !0, console.log("[ST-BgLoader] All Modular Subsystems fully initialized.");
  }
  async applyMedia(e, t = !0) {
    if (e.type === "audio") {
      await this.audioEngine.playMediaItem(e);
      return;
    }
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
    this.settings.enabled !== this.appliedEnabled && (this.appliedEnabled = this.settings.enabled, this.applyMasterEnabled(this.settings.enabled)), this.mediaMount.applyFilters(this.settings.filters), this.mediaMount.setInteractive(this.settings.interactiveBackground), this.mediaMount.setVisible(this.settings.backgroundVisible), this.mediaMount.setTransition(this.settings.transitionEffect, this.settings.transitionDurationMs), this.audioEngine.setVolume(this.settings.volume), this.audioEngine.setMuted(this.settings.muted), this.audioEngine.setMuffled(this.settings.muffleBGM), this.audioEngine.setPlaybackMode(this.settings.playbackMode);
    const e = this.settings.bgmAutoAdvance;
    this.audioEngine.setAutoAdvance(e.enabled, e.intervalSec, e.fadeMs), this.atmosphereFX.setWeather(this.settings.weather), this.audioVisualizer.setOptions(this.settings.visualizer), this.parallaxController.setOptions(this.settings.parallax), this.ambientSoundGenerator.setSound(this.settings.ambientSound), this.frostedGlassController.setOptions(this.settings.frostedChat), this.triggerManager.setRules(this.settings.triggerRules || []), this.sceneManager?.setUserScenes(this.settings.scenes || {}), this.nativeController?.setLevel(this.settings.nativeTakeover), this.syncAgentTools();
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
    t && !this.agentBridge && e ? (this.agentBridge = new Si(e, this.buildAgentHost(), (i, s) => {
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
  /**
   * 应用一份已收敛的完整设置（PublicAPI.updateSettings/importSettings 的落点）。
   * 与 reconcileRemoteConflict 同一条应用路径：子系统全量同步 + 两个抽屉回填 + 事件，
   * 保证 API 写入不旁路 UI 与远端镜像（否则抽屉下一次 save() 会把旧状态整体写回）。
   */
  applyConvergedSettings(e) {
    this.settings = e, this.saveSettings(), this.applySettingsToSubsystems(), this.enforceQuotaIfChanged(), this.topbarDrawer?.applyRemoteSettings(e), this.settingsDrawer?.applyRemoteSettings(e), this.publicApi.emit("settings-sync", e);
  }
  async startSettingsSync() {
    const e = this.authorityBridge.getClient();
    e && (this.settingsSync = new ui(e, (t) => {
      this.settings = t;
      try {
        localStorage.setItem(ye, JSON.stringify(this.settings));
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
      const e = localStorage.getItem(ye);
      e && (this.settings = j(JSON.parse(e))), this.settingsRevision = parseInt(localStorage.getItem(Je) || "0", 10) || 0;
    } catch (e) {
      console.error("[ST-BgLoader] Failed to parse saved settings:", e), this.settings = { ...ae }, this.settingsRevision = 0;
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
      e && e.revision >= this.settingsRevision ? (this.settings = j(e.settings), this.settingsRevision = e.revision, this.persistLocalSettings()) : this.settingsRevision > 0 && this.serverSettings.scheduleSave(this.settings, this.settingsRevision);
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
      localStorage.setItem(ye, JSON.stringify(this.settings)), localStorage.setItem(Je, String(this.settingsRevision));
    } catch (e) {
      console.error("[ST-BgLoader] Failed to save settings:", e);
    }
  }
  saveSettings() {
    this.settingsRevision += 1, this.persistLocalSettings(), this.serverSettings.scheduleSave(this.settings, this.settingsRevision), this.settingsSync?.schedulePush(this.settings);
  }
}
const Be = new Ei(), Ze = () => Be.init().catch((n) => console.error("[ST-BgLoader] Initialization failed:", n));
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Ze) : Ze();
window.STBgLoader = Be;
window.stBgLoader = Be.getAPI();
export {
  Ei as STBgLoaderExtension
};
