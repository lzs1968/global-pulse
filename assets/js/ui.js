/** UI helpers: local avatars, icons, script loader */
(function () {
  // 统一的单色 / 档案钱币风头像：低饱和、按 seed 派生色相，
  // 含细描边与序列纹，读起来像“官方档案徽记”，而非随机彩色方块。
  function hashHue(seed) {
    let h = 0;
    const s = String(seed || "?");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 360;
  }

  function avatarDataUri(seed, size) {
    const s = String(seed || "?").slice(0, 2).toUpperCase();
    const hue = hashHue(seed);
    const bg = "hsl(" + hue + ",16%,92%)";
    const bg2 = "hsl(" + hue + ",18%,86%)";
    const ring = "hsl(" + hue + ",22%,72%)";
    const ink = "hsl(" + hue + ",30%,30%)";
    const fontSize = Math.round(size * 0.34);
    const r = size / 2;
    const gid = "g" + hue;
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + bg + '"/><stop offset="100%" stop-color="' + bg2 + '"/></linearGradient></defs>' +
      '<circle cx="' + r + '" cy="' + r + '" r="' + (r - 0.5) + '" fill="url(#' + gid + ')"/>' +
      '<circle cx="' + r + '" cy="' + r + '" r="' + (r - 1.5) + '" fill="none" stroke="' + ring + '" stroke-width="1"/>' +
      '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="' + ink +
      '" font-family="Georgia,&quot;Times New Roman&quot;,serif" font-size="' + fontSize + '" font-weight="600" letter-spacing="0.5">' +
      s + "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function applyAvatars() {
    document.querySelectorAll("[data-avatar]").forEach((el) => {
      const seed = el.dataset.avatar;
      const size = parseInt(el.dataset.avatarSize || "48", 10);
      el.src = avatarDataUri(seed, size);
      el.alt = el.alt || seed;
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "1") resolve();
        else existing.addEventListener("load", resolve, { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.dataset.src = src;
      s.onload = () => {
        s.dataset.loaded = "1";
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadStylesheet(href) {
    if (document.querySelector('link[href="' + href + '"]')) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.onload = resolve;
      l.onerror = reject;
      document.head.appendChild(l);
    });
  }

  async function ensureLeaflet() {
    if (window.L) return window.L;
    await new Promise(function (r) {
      setTimeout(r, 50);
    });
    if (window.L) return window.L;
    const localCss = "assets/vendor/leaflet/leaflet.css";
    const localJs = "assets/vendor/leaflet/leaflet.js";
    const cdnCss = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    const cdnJs = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    try {
      await loadStylesheet(localCss);
      await loadScript(localJs);
    } catch {
      await loadStylesheet(cdnCss);
      await loadScript(cdnJs);
    }
    if (!window.L) throw new Error("Leaflet failed to load");
    return window.L;
  }

  const ICONS = {
    thumbUp:
      '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12M7 10l-4-2V6a2 2 0 0 1 2-2h2l3-4a2 2 0 0 1 2 2v4h6l2 7-2 1H7z"/></svg>',
    thumbDown:
      '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 14V2M17 14l4 2V20a2 2 0 0 1-2 2h-2l-3 4a2 2 0 0 1-2-2v-4H6l-2-7 2-1h11z"/></svg>',
    search:
      '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>',
    globe:
      '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
  };

  function injectIconPlaceholders() {
    document.querySelectorAll("[data-icon]").forEach((el) => {
      const name = el.dataset.icon;
      if (ICONS[name]) el.innerHTML = ICONS[name];
    });
  }

  window.GP_UI = {
    avatarDataUri,
    applyAvatars,
    ensureLeaflet,
    ICONS,
    injectIconPlaceholders,
  };
})();
