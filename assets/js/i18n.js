/** English-only UI strings (i18n toggle removed). */
(function () {
  const STRINGS = {
    "nav.home": "Home",
    "nav.explore": "Explore",
    "nav.map": "World Map",
    "nav.rankings": "Rankings",
    "nav.timeline": "History",
    "nav.method": "Methodology",
    "footer.about":
      "Global leader approval signals · anonymous binary votes. Not official polling; no personal data sold.",
    "footer.browse": "Browse",
    "footer.leaders": "Leaders",
    "footer.map": "World map",
    "footer.rankings": "Rankings",
    "footer.timeline": "Timeline",
    "footer.trust": "Trust",
    "footer.method": "Methodology",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.support": "Get involved",
    "footer.donate": "Support us",
    "footer.data": "Data & API",
    "footer.contact": "Contact",
    "footer.sources": "Sources",
    "footer.copy":
      "© 2026 Global Pulse · Unofficial, non-scientific. Results reflect anonymous visitor clicks only — not official ratings or election forecasts.",
    "hero.eyebrow": "Anonymous · Global · Binary",
    "hero.title": "Global Leader\nApproval",
    "hero.lead":
      "Anonymous clicks showing support / oppose trends for current and historical public leaders. Not scientific polling.",
    "hero.search": "Explore",
    "hero.disclaimer": "Not official ratings or election forecasts. Anti-abuse signals apply.",
  };

  const NAV_HREF = {
    "index.html": "nav.home",
    "leaders.html": "nav.explore",
    "map.html": "nav.map",
    "rankings.html": "nav.rankings",
    "timeline.html": "nav.timeline",
    "methodology.html": "nav.method",
  };

  function getLang() {
    return "en";
  }

  function setLang() {
    localStorage.setItem("gp-lang", "en");
    document.documentElement.lang = "en";
    apply();
  }

  function toggleLang() {
    /* English only */
  }

  function t(key) {
    return STRINGS[key] || key;
  }

  function apply() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (!STRINGS[key]) return;
      if (STRINGS[key].includes("\n")) {
        el.innerHTML = STRINGS[key].replace(/\n/g, "<br />");
      } else {
        el.textContent = STRINGS[key];
      }
    });

    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      const key = NAV_HREF[href];
      if (key && STRINGS[key]) a.textContent = STRINGS[key];
    });
  }

  function injectLangButton() {
    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => btn.remove());
    apply();
  }

  document.documentElement.lang = "en";

  window.GP_I18N = { getLang, setLang, toggleLang, t, apply, injectLangButton };
})();
