/**
 * GP_ADS — 上下文广告位渲染器
 *
 * 设计原则（与全案合规一致）：
 *  - 只投与历史 / 教育 / 书籍 / 纪录片 / 国际关系课程相关的“上下文”广告；
 *  - 绝不基于用户政治倾向做定向；
 *  - 广告位必须明显标注“赞助 / 广告”，且不影响投票与排名；
 *  - Pro 会员自动隐藏所有广告。
 *
 * 用法：在页面任意位置放 <div data-ad-slot></div> 即可，本脚本会自动填充。
 * Optional third-party ads: set window.GP_ADS_CONFIG before ads.js loads.
 * Default is in-house placeholder creatives only (no external network).
 */
(function () {
  // 统一线性图标（细线、currentColor），替代 emoji，更克制更高级
  const ICON = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5V5.5"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 5 2 9l10 4 10-4z"/><path d="M6 11v5c0 1 2.5 3 6 3s6-2 6-3v-5"/></svg>',
    columns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5H3z"/><path d="M5 9v8M10 9v8M14 9v8M19 9v8M3 21h18"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  };

  // —— 自营 / 赞助创意池（非政治、上下文相关）——
  const INVENTORY = [
    { icon: ICON.book, title: "20th-Century World History — Reading List", body: "Context on the eras these leaders shaped.", cta: "Browse", href: "#" },
    { icon: ICON.film, title: "Historical Documentaries", body: "Profiles and events from trusted broadcasters.", cta: "Watch", href: "#" },
    { icon: ICON.cap, title: "International Relations — Open Courses", body: "University lectures on governance & diplomacy.", cta: "Learn free", href: "#" },
    { icon: ICON.columns, title: "Online History Exhibitions", body: "Digitised archives from museums worldwide.", cta: "Explore", href: "#" },
    { icon: ICON.map, title: "Atlas of World History", body: "Interactive timelines and changing borders.", cta: "Open", href: "#" },
  ];

  function isPro() {
    return !!(window.GP_PRO && window.GP_PRO.isPro());
  }

  function dayOffset() {
    return Math.floor(Date.now() / 86400000);
  }

  function houseCreative(slot, idx) {
    const c = INVENTORY[(idx + dayOffset()) % INVENTORY.length];
    slot.className = "ad-card";
    slot.hidden = false;
    slot.setAttribute("role", "complementary");
    slot.setAttribute("aria-label", "Sponsored content");
    slot.innerHTML =
      '<span class="ad-card__label">Sponsored</span>' +
      '<span class="ad-card__icon" aria-hidden="true">' + c.icon + "</span>" +
      '<span class="ad-card__body"><strong>' + c.title + "</strong><span>" + c.body + "</span></span>" +
      '<a class="ad-card__cta" href="' + c.href + '" rel="sponsored nofollow noopener" target="_blank">' + c.cta + " ›</a>" +
      '<a class="ad-card__remove" href="support.html">Remove ads</a>';
  }

  function adsenseCreative(slot) {
    const cfg = window.GP_ADS_CONFIG || {};
    slot.className = "ad-slot";
    slot.hidden = false;
    slot.innerHTML =
      '<span class="ad-card__label">Ad</span>' +
      '<ins class="adsbygoogle" style="display:block" ' +
      'data-ad-client="' + (cfg.client || "") + '" ' +
      'data-ad-slot="' + (cfg.slot || "") + '" ' +
      'data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      /* 网络脚本未加载时忽略 */
    }
  }

  function fill(slot, idx) {
    if (isPro()) {
      slot.hidden = true;
      slot.innerHTML = "";
      return;
    }
    const provider = (window.GP_ADS_CONFIG && window.GP_ADS_CONFIG.provider) || "house";
    if (provider === "adsense") {
      adsenseCreative(slot);
    } else {
      houseCreative(slot, idx);
    }
  }

  function render() {
    document.querySelectorAll("[data-ad-slot]").forEach(fill);
  }

  document.addEventListener("DOMContentLoaded", render);
  if (window.GP_PRO) window.GP_PRO.onChange(render);

  window.GP_ADS = { render };
})();
